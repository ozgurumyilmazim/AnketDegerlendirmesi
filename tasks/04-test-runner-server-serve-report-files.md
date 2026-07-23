# Functional Specification: Test Runner Server Must Serve Report Files

## 1. Problem
`tests/e2e/server.js` starts a test runner web UI on port 3099. It handles:
- `/` — the admin HTML page
- `/run` — POST to start tests
- `/status` — GET to poll test output

The HTML page (line 44) includes a link to `/test-reports/`:
```html
<a class="btn btn-outline-success btn-lg" href="/test-reports/" target="_blank">📊 Rapor</a>
```

But the server has **no route handler** for `/test-reports/`. Clicking this button in a standalone server (without nginx) returns a 404 or the root HTML page (due to the catch‑all fallback).

The Playwright HTML report is generated in `tests/e2e/reports/` after each test run. The server copies it to `frontend/test-reports/index.html` (lines 26-31), but never serves it.

## 2. Required Behavior

The test runner server must serve the Playwright HTML report so that:

| Scenario | Expected behavior |
|---|---|
| Standalone dev (port 3099) | `/test-reports/` serves the latest Playwright HTML report |
| Behind nginx (production) | Nginx proxies `/test-runner/` to port 3099; `/test-reports/` is NOT proxied but served directly by nginx from `frontend/test-reports/` (static files) |
| No report exists yet | `/test-reports/` returns a clear "Henüz rapor bulunmuyor" page |

## 3. Implementation

### 3.1 Add static file serving to server.js

Add two new route handlers in `server.js`:

**Option A: Serve from `reports/` directory directly (simpler)**

```js
import { readFileSync, existsSync, statSync } from 'fs';
import { extname, join } from 'path';

// ... in the request handler:

if (req.url.startsWith('/test-reports/')) {
  const reportDir = join(__dirname, 'reports');
  const reportIndex = join(reportDir, 'index.html');

  if (!existsSync(reportIndex)) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html><html><body><h1>Henüz rapor bulunmuyor</h1>
      <p>Test çalıştırıldıktan sonra rapor burada görünecek.</p>
      <a href="/">Test Runner'a dön</a></body></html>`);
    return;
  }

  // Determine requested file
  let filePath = req.url === '/test-reports/' 
    ? reportIndex 
    : join(reportDir, req.url.replace('/test-reports/', ''));

  // Security: ensure filePath is still under reportDir
  if (!filePath.startsWith(reportDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = extname(filePath);
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.json': 'application/json',
    '.webm': 'video/webm',
  };
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  const content = readFileSync(filePath);
  res.writeHead(200, { 'Content-Type': contentType });
  res.end(content);
  return;
}
```

**Option B: Serve from `frontend/test-reports/` (the copied location)**

Same logic but using `join(FRONTEND_DIR, 'test-reports')` instead of `join(__dirname, 'reports')`.

**Recommendation**: Option A is better because:
- It serves the report **before** it's copied to `frontend/`
- It avoids duplicating the file serving responsibility
- It works even if the copy step fails

### 3.2 MIME type mapping for Playwright report assets

Playwright HTML reports include:
- `index.html` — main report
- `data.js` — JSON data
- `style.css` — styles
- Various JS files

All common MIME types must be mapped.

### 3.3 Security

Path traversal must be prevented. The `!filePath.startsWith(reportDir)` check ensures requests like `/test-reports/../../etc/passwd` are rejected with 403.

### 3.4 Nginx production setup (documentation only)

The nginx config (`nginx/default.conf`) does **not** currently have a `/test-reports/` location. The report is accessible in production because:
1. nginx serves `frontend/` at root (`/`)
2. `server.js` copies report to `frontend/test-reports/index.html`
3. So `https://selma.ozguryilmaz.com.tr/test-reports/` works via static file serving

**No nginx change needed.** But document this in the test runner README or AGENTS.md.

### 3.5 Update the HTML UI

The "Rapor" button currently uses an absolute path `/test-reports/`. This works in production (via nginx) and will now work in dev (via server.js). No HTML change needed.

Add a note in the UI showing whether the report is being served by the test runner or nginx. Simple approach: show a small badge like `(local)` or `(production)` next to the button.

## 4. Edge Cases & Error Handling

| Case | Handling |
|---|---|
| No report exists | Show friendly "Henüz rapor bulunmuyor" page |
| Report is being generated (test running) | Show "Rapor oluşturuluyor..." message (detect via `testRunning` flag) |
| Corrupted report file | Return 500 with "Rapor dosyası okunamadı" |
| Large report files | Use streaming (`fs.createReadStream`) instead of `readFileSync` for files > 10MB |
| Directory listing | Do NOT implement directory listing — only serve known files |
| Concurrent requests | Node.js single-threaded handles this fine; readFileSync blocks the event loop — use `readFile` (async) for production quality, or accept `readFileSync` for this low-traffic tool |

## 5. Files to Modify

| File | Change |
|---|---|
| `tests/e2e/server.js` | Add `/test-reports/` route handler with static file serving, MIME types, security check, and error pages |

## 6. Success Check

1. **Before any test run**: Visit `http://localhost:3099/test-reports/` → Shows "Henüz rapor bulunmuyor" page.
2. **After running a test**: Visit `http://localhost:3099/test-reports/` → Shows the Playwright HTML report with all test results, pass/fail counts, screenshots, and videos.
3. **Report assets load**: The report page loads CSS, JS, and data files correctly (no broken asset paths in browser DevTools Network tab).
4. **Path traversal blocked**: `http://localhost:3099/test-reports/../../../etc/passwd` returns 403 Forbidden.
5. **Non-existent file**: `http://localhost:3099/test-reports/nonexistent.js` returns 404.
6. **Existing E2E tests still pass**: Running `npm test` in `tests/e2e/` continues to work.
7. **During test run**: Clicking "Rapor" button while test is running shows appropriate message or the previous report (acceptable — no crash).
