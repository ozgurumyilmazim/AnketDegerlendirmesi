# Functional Specification: Unit Tests for Scoring and Core Modules

## 1. Objective
Create a unit test suite under `tests/unit/` that tests the core JavaScript modules in isolation. Currently only E2E tests exist; the critical business logic (MMPI scoring, URL construction, auth) has no coverage. Every regression in these modules goes undetected until runtime in production.

## 2. Scope — Which Files to Test

| Module | File | Priority |
|---|---|---|
| MMPIScoring class | `frontend/assets/js/mmpi-scoring.js` | **Highest** (T-score formula, 20+ scales, thresholds, validity, report generation) |
| PG_API URL builder | `frontend/assets/js/pg-config.js` lines 193-206, 239-265 | **High** (notorious for bugs per AGENTS.md, URL construction with selects + filters is error-prone) |
| AuthService | `frontend/assets/js/pg-config.js` lines 23-120 | **High** (JWT decode, signIn, signOut, getSession, role checks) |
| testConfig constants | `frontend/assets/js/test-config.js` | **Low** (constants only, but autoSaveInterval, maxDontKnowAnswers used elsewhere) |

## 3. Testing Framework

Use **Node.js built-in test runner** (`node:test` + `node:assert`) to avoid additional dependencies. The repo has no `package.json` at root and no desire for build steps. `node:test` is available in Node.js >= 18.

Alternatively, if the implementer prefers, **Vitest** or **Jest** can be used but must be added to a `tests/unit/package.json` — do NOT create a root `package.json`.

**Recommendation**: `node:test` with `node:assert` (zero dependencies).

## 4. File Structure

```
tests/unit/
  package.json           # { "type": "module", "scripts": { "test": "node --test **/*.test.js" } }
  mmpi-scoring.test.js   # Tests for MMPIScoring
  pg-config.test.js      # Tests for URL builder + AuthService
  test-config.test.js    # Tests for config constants
  helpers/
    setup.js             # Mock DOM / localStorage if needed
    fixtures.js          # Sample answers, personalInfo, expected outputs
```

## 5. Detailed Test Cases

### 5.1 `mmpi-scoring.test.js`

#### 5.1.1 Constructor & Initialization
- `MMPIScoring` instantiates without error
- `this.scales` contains all 12 expected keys: `VRIN, TRIN, F, F1, F2, L, K, Hs, D, Hy, Pd, Mf, Pa, Pt, Sc, Ma, Si`
- Each scale has `name`, `description`, `items` (array of numbers)
- Scales with `kCorrection`: `Hs (0.5), D (1.0), Hy (1.0), Pd (0.4), Pt (1.0), Sc (1.0), Ma (0.2)`

#### 5.1.2 `calculateRawScores(answers)`
- **Empty answers**: all raw scores are 0
- **All "Doğru" (true)**: every item in `L` scale is reverse-keyed so answers should be checked: for `L` scale, `isKeyed('L', 15, true)` returns `false` (item 15 is reverse-keyed), `isKeyed('L', 15, false)` returns `true`. For `K` scale similarly.
  - Provide a complete answer set where all answers are `true`. Expected: `L` raw = 0 (all 12 items are reverse-keyed), `K` raw = 0 (all 14 items are reverse-keyed), non-reverse scales get their item count as raw score.
- **All "Yanlış" (false)**: For reverse-keyed scales `L` and `K`, raw should equal their item count. For non-reverse scales, raw = 0.
- **Mixed answers**: supply answers where some items in each scale are true, some false. Verify raw score is the count of keyed responses only.
- **"Bilmiyorum" (null)**: items with `null` answer are skipped, do not affect raw score.
- **Unknown scale keys in answers**: extra keys in answers object are ignored.

#### 5.1.3 `isKeyed(scaleName, itemNumber, answer)`
- `isKeyed('L', 15, true)` → `false` (L-15 is reverse-keyed)
- `isKeyed('L', 15, false)` → `true`
- `isKeyed('L', 16, true)` → `true` (16 not in reverse-keyed list for L)
- `isKeyed('K', 30, true)` → `false` (K-30 is reverse-keyed)
- `isKeyed('K', 31, true)` → `true` (31 not in reverse-keyed list for K)
- `isKeyed('Hs', 2, true)` → `true` (Hs has no reverse-keyed items)
- `isKeyed('D', 5, true)` → `true`

#### 5.1.4 `applyKCorrection(rawScores)`
- Input: `{ K: 10, Hs: 5, D: 8, Pt: 7, Sc: 3, Ma: 2 }`
- Expected: `{ K: 10, Hs: 5 + 10*0.5 = 10, D: 8 + 10*1.0 = 18, Pt: 7 + 10*1.0 = 17, Sc: 3 + 10*1.0 = 13, Ma: 2 + 10*0.2 = 4 }`
- Scales without kCorrection (`L, F, Pa, Si, Mf, VRIN, TRIN, F1, F2`): scores unchanged
- If `K` is missing from rawScores, treat as 0

#### 5.1.5 `convertToTScores(correctedScores, gender)`
- Formula: `T = 50 + 10 * (raw - mean) / sd`
- With `gender='male'`, norm tables have mean=50, sd=10 for all scales
  - raw=50 → T=50
  - raw=60 → T=60
  - raw=35 → T=35
  - raw=100 → T=100
- Result is `Math.round()` — verify rounding (50.5 → 51, 49.4 → 49)
- `gender='female'` uses female norms
- `gender='unknown'` falls back to male
- Scale not in norms table (e.g. `VRIN`): T-score equals raw score

#### 5.1.6 `calculateScores(answers, personalInfo)` (integration)
- Full pipeline: raw → k-corrected → T-scores → interpretation → validity → profile
- Input: known answers + `{ gender: 'male' }`
- Output shape: `{ rawScores, kCorrectedScores, tScores, interpretation, validity, profile }`
- Check all keys present

#### 5.1.7 `assessValidity(rawScores, answers)`
- `F > 20` → `isValid: false`, warning includes "Yüksek F skoru"
- `L > 10` → warning includes "Yüksek L skoru"
- `K > 15` → warning includes "Yüksek K skoru"
- `answers` array with >30 nulls → `isValid: false`, warning mentions "yanıtsız soru"
- Normal scores → `isValid: true`, empty warnings

#### 5.1.8 `interpretScores(tScores)`
- T < 30 → level "Çok Düşük"
- 30 ≤ T < 40 → level "Düşük"
- 40 ≤ T < 60 → level "Normal"
- 60 ≤ T < 70 → level "Yüksek"
- 70 ≤ T < 80 → level "Çok Yüksek"
- T ≥ 80 → level "Kritik"
- Each entry has keys: `name`, `description`, `tScore`, `level`, `interpretation`, `clinicalSignificance`
- `clinicalSignificance` is `true` when tScore ≥ 65

#### 5.1.9 `generateProfile(tScores)`
- T ≥ 65 → `elevatedScales` (sorted descending)
- T ≤ 35 → `lowScales` (sorted ascending)
- Otherwise → `normalScales`
- `codeType`: 0 elevated → "Normal Profil", 1 elevated → "{scale} Spike", 2+ → "{top}-{second} Kod Tipi"

#### 5.1.10 `generateReport(scores, personalInfo)`
- Contains `personalInfo`, `testDate`, `validity`, `summary`, `detailedResults`, `recommendations`, `profile`

#### 5.1.11 `generateSummary(scores)` and `generateRecommendations(scores)`
- `D ≥ 70` → riskFactors includes "Depresif belirtiler"
- `Pd ≥ 70` → riskFactors includes "Antisosyal eğilimler"
- `Sc ≥ 70` → riskFactors includes "Düşünce bozuklukları"
- `D ≤ 35` → strengths includes "Pozitif ruh hali"
- Recommendations: ≥80 → "acil klinik değerlendirme", ≥70 → "klinik takip"
- `!validity.isValid` → returns single recommendation "Test geçersiz"

### 5.2 `pg-config.test.js`

#### 5.2.1 PG_API URL Builder (`_buildQuery`)
Test the internal query string construction. Since `_buildQuery` is a closure, test through the public API:

- **No filters**: `PG_API.from('test_results').then(...)` → GET `/test_results` (no query string)
- **Single eq filter**: `PG_API.from('test_results').eq('status', 'completed').then(...)` → GET `/test_results?status=eq.completed`
- **Multiple eq filters**: `.eq('a',1).eq('b',2)` → `?a=eq.1&b=eq.2`
- **Select with columns**: `.select('id,name').eq('status','active')` → `?select=id,name&status=eq.active`  *(note: this is the bug-prone case — see lines 259-265)*
- **Select without filters**: `.select('id,name').then(...)` → `/test_results?select=id,name`
- **Select='*' with filters**: `.select().eq('id',5)` → `?id=eq.5`  (no `?select` param)
- **Order**: `.order('created', { ascending: false })` → `?order=created.desc`
- **Limit**: `.limit(10)` → `?limit=10`
- **Combined**: `.eq('status','active').order('id').limit(5)` → `?status=eq.active&order=id.asc&limit=5`

#### 5.2.2 AuthService
- `setToken(token)` and `getToken()` round-trip through localStorage
- `setToken(null)` removes key from localStorage
- `_decodeJWT(token)` returns null for invalid token
- `_decodeJWT(token)` correctly decodes a known JWT payload
- `signIn` with network failure returns `{ data: null, error: Error }`
- `getSession()` with expired token returns `{ data: { session: null } }` and removes token
- `isAdmin()` returns true when role is `'admin'`, false otherwise

### 5.3 `test-config.test.js`
- `testConfig.maxDontKnowAnswers` equals 10
- `testConfig.autoSaveInterval` equals 30000
- `testConfig.enableLocalStorage` is `true`
- `testConfig.enableDbSync` is `true`
- `testStates` has keys `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, `ABANDONED`
- `answerTypes` has keys `TRUE`, `FALSE`, `DONT_KNOW`

## 6. How to Make MMPIScoring Testable

The module uses `window.MMPIScoring` export (browser global). For Node.js testing:

**Option A** (preferred): Use `jsdom` to provide `window`:
```
// tests/unit/helpers/setup.js
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!DOCTYPE html>');
global.window = dom.window;
global.document = dom.window.document;
global.localStorage = dom.window.localStorage;
```

**Option B**: Modify `mmpi-scoring.js` to also export via ESM when available. Add at bottom:
```
if (typeof exports !== 'undefined') export { MMPIScoring, MMPI_SCALES };
```

*(But option B changes production code — avoid if possible. Prefer Option A.)*

## 7. Running the Tests

```bash
cd tests/unit
npm install   # installs jsdom if using Option A
npm test      # runs: node --test **/*.test.js
```

## 8. Success Check

All of the following must pass:

1. `node --test tests/unit/mmpi-scoring.test.js` — **all test cases pass**, covering every sub-section in 5.1. Minimum 30 individual `assert.strictEqual` / `assert.deepStrictEqual` assertions across all test cases.
2. `node --test tests/unit/pg-config.test.js` — **all test cases pass**, covering every sub-section in 5.2. Minimum 15 assertions.
3. `node --test tests/unit/test-config.test.js` — **all test cases pass**, covering every sub-section in 5.3. Minimum 6 assertions.
4. **100% pass rate** on all three test files with `npm test` running in `tests/unit/`.
5. The existing E2E tests still pass (`npx playwright test` in `tests/e2e/` continues to work — no regressions).
