# Functional Specification: Fix Dangerous Default baseURL in Playwright Config

## 1. Problem
`tests/e2e/playwright.config.js` line 15:
```js
baseURL: process.env.BASE_URL || 'https://selma.ozguryilmaz.com.tr',
```

Any developer running `npm test` (or `npm run server`) without setting `BASE_URL` will hit the **live production site**. This can:
- Create real test participants in the production database
- Generate fake test results that pollute real reports
- Overwrite or corrupt production page content (as `page-content.spec.js` modifies live data)
- Trigger real SMS/email notifications if those are configured

## 2. Required Behavior

| Environment | Expected baseURL | How it's set |
|---|---|---|
| Local dev (developer machine) | `http://localhost:8000` | Default (no env var) |
| Local dev with custom port | `http://localhost:3000` | `BASE_URL` env var |
| CI (GitHub Actions etc.) | Whatever the CI provides | `BASE_URL` env var, typically `http://localhost:8000` |
| Production testing (explicit) | `https://selma.ozguryilmaz.com.tr` | Must opt in via `BASE_URL` |

## 3. Implementation

### 3.1 Change the default in `playwright.config.js`

```js
baseURL: process.env.BASE_URL || 'http://localhost:8000',
```

### 3.2 Add a safety valve (optional but recommended)

Add a `--forbid-production` flag or a check that refuses to run with the production URL unless a specific env var `ALLOW_PRODUCTION_TESTING=true` is also set:

```js
// At the top of playwright.config.js
if (!process.env.BASE_URL && !process.env.CI) {
  // Using default localhost — safe
}
if (process.env.BASE_URL?.includes('selma.ozguryilmaz.com.tr') && !process.env.ALLOW_PRODUCTION_TESTING) {
  throw new Error(
    'PRODUCTION URL DETECTED. Set ALLOW_PRODUCTION_TESTING=true to run tests against production.'
  );
}
```

### 3.3 Update `server.js`

The test runner server spawns Playwright with its own `cwd`. Ensure the server either:
- Passes `BASE_URL` explicitly to the spawned child process, or
- Reads the same `playwright.config.js` default

Currently `server.js` does **not** set `BASE_URL` when spawning Playwright (line 19):
```js
const proc = spawn('node', ['node_modules/@playwright/test/cli.js', 'test', '--project=chromium'], {
    cwd: __dirname, shell: true, stdio: ['pipe', 'pipe', 'pipe']
});
```

If the server is running on a machine where no `BASE_URL` is set, after the fix it will default to `http://localhost:8000`. But the server might be running alongside nginx on the production box. In that case, the server's environment should explicitly set `BASE_URL`.

**Fix**: When running locally, the developer already runs `python3 -m http.server 8000` from `frontend/`. The playwright default of `http://localhost:8000` will match. In production with the test-runner behind nginx, the server process should have `BASE_URL` set in its environment (e.g., via systemd `Environment=` directive in the service file, or in `.env`).

No code change needed in `server.js` — just document that the process environment must set `BASE_URL` when deployed.

### 3.4 Update test-runner admin page (`frontend/admin/test-runner.html`)

Check if there's a button or form to set `BASE_URL`. If not, no change needed. If there is, ensure it passes the URL to the server.

## 4. Migration / Deploy Steps

1. Change the default in `playwright.config.js`
2. Add the production safety guard
3. On the production server, edit the test-runner systemd service file to add:
   ```
   Environment=BASE_URL=https://selma.ozguryilmaz.com.tr
   Environment=ALLOW_PRODUCTION_TESTING=true
   ```
4. Reload systemd and restart the service

## 5. Files to Modify

| File | Change |
|---|---|
| `tests/e2e/playwright.config.js` | Change default baseURL, add production guard |
| Production systemd service file (not in repo) | Add `BASE_URL` and `ALLOW_PRODUCTION_TESTING` env vars |

## 6. Success Check

1. **On a machine with no `BASE_URL` set**: Running `node node_modules/@playwright/test/cli.js test --list` in `tests/e2e/` shows tests loaded. The config's `baseURL` is `http://localhost:8000` (verify with `npx playwright show-config` or by adding a console.log in the config).
2. **On a machine with `BASE_URL=https://selma.ozguryilmaz.com.tr` but without `ALLOW_PRODUCTION_TESTING=true`**: Running any playwright command **throws an error** before any test executes. The error message contains "PRODUCTION URL DETECTED".
3. **On a machine with both `BASE_URL=https://selma.ozguryilmaz.com.tr` and `ALLOW_PRODUCTION_TESTING=true`**: Tests run normally against production.
4. **CI environment**: `BASE_URL` is explicitly set in CI config, behavior matches expectation.
5. The existing full-flow E2E test passes when run against `http://localhost:8000` with a local static file server running.

## 7. Edge Cases

- `BASE_URL` with trailing slash (`http://localhost:8000/`) — Playwright normalizes this, but tests should work either way.
- `BASE_URL` with path (`http://localhost:8000/app/`) — ensure `page.goto('/')` still works (goes to base).
- No static file server running at default URL — tests will fail with connection refused. This is expected; document in README.
