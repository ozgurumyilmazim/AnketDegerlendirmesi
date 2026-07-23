# Functional Specification: Fix Full-Flow Test Bypassing the Real UI

## 1. Problem
In `tests/e2e/specs/full-flow.spec.js`, lines 68-81, the test uses `page.evaluate()` to directly manipulate the internal JavaScript state of the MMPI test application:

```js
await page.evaluate(() => {
  const mmpi = window.mmpiTest;
  if (!mmpi) throw new Error('mmpiTest bulunamadi');
  const answers = {};
  for (const q of mmpi.questions) answers[q.question_number] = 'Doğru';
  Object.assign(answers, mmpi.answers);
  mmpi.answers = answers;
  mmpi.dontKnowCount = 0;
  mmpi.currentQuestionIndex = mmpi.questions.length - 1;
  mmpi.displayQuestion();
  mmpi.updateProgress();
  mmpi.updateButtons();
  mmpi.saveProgress();
});
```

This completely bypasses the actual UI for 563 of the 566 questions. It does not test:
- Whether question rendering works correctly
- Whether the "İleri" / "Geri" navigation buttons work
- Whether answer selection via radio buttons triggers state updates
- Whether progress percentage is calculated correctly from real clicks
- Whether the auto-save mechanism works during the test
- Whether "Bilmiyorum" flow and the max-10 limit works via UI
- Whether the finish button becomes enabled only after all questions are answered
- Whether the loading modal appears and disappears during save

## 2. Objective
Replace the `page.evaluate()` cheat with proper UI interaction. The test must answer all 566 questions through actual clicks, just as a real user would.

## 3. Constraints

- The test timeout is 300 seconds (5 minutes). Answering 566 questions via Playwright clicks must fit within this.
- Answers must be randomized to avoid pattern detection (not all "Doğru").
- Must handle "Bilmiyorum" answers up to the `maxDontKnow` limit.
- Must not modify the application code — only the test spec.

## 4. Implementation Strategy

### 4.1 Answer Generation
Create a helper function in `tests/e2e/fixtures/test-data.js`:

```js
export function generateAnswers(totalQuestions = 566, maxDontKnow = 10) {
  const answers = {};
  let dontKnowCount = 0;
  for (let i = 1; i <= totalQuestions; i++) {
    const rand = Math.random();
    if (rand < 0.05 && dontKnowCount < maxDontKnow) { // 5% chance
      answers[i] = 'Bilmiyorum';
      dontKnowCount++;
    } else if (rand < 0.5) {
      answers[i] = 'Doğru';
    } else {
      answers[i] = 'Yanlış';
    }
  }
  return answers;
}
```

### 4.2 UI Interaction Loop
Replace the `page.evaluate()` block with a real loop:

```js
// Answer all 566 questions via UI
for (let i = 1; i <= TEST_CONFIG.totalQuestions; i++) {
  const answer = generatedAnswers[i];

  // Wait for the question to render
  await page.waitForSelector('#questionContainer', { timeout: 5000 });

  if (answer === 'Doğru') {
    await page.locator('label[for="answerTrue"]').click();
  } else if (answer === 'Yanlış') {
    await page.locator('label[for="answerFalse"]').click();
  } else {
    await page.locator('label[for="answerDontKnow"]').click();
  }

  // Click next or finish
  if (i < TEST_CONFIG.totalQuestions) {
    await page.locator('#nextBtn').click();
  } else {
    await page.locator('#finishBtn').click();
  }

  // Small delay between questions to avoid overwhelming the UI
  if (i % 50 === 0) {
    await page.waitForTimeout(100);
  }
}
```

### 4.3 Performance Optimization
The naive loop (566 iterations × ~200ms per iteration = ~113 seconds) is feasible within the 300s timeout, but can be optimized:

- **Batch clicks with `Promise.all`** when possible (not for sequential navigation).
- **Reduce `waitForSelector` overhead**: once the test is past question 1, the container is guaranteed to exist. Only wait on the first question.
- **Use `{ force: true }`** on clicks to skip actionability checks, since we know the elements exist.
- **Disable animations** via `page.addStyleTag()` at the start to speed up transitions.

Target total time for the answer loop: **under 120 seconds**.

### 4.4 Progress Verification

After answering all 566 questions and before clicking finish, verify:
```js
const progressText = await page.locator('#progressText').textContent();
expect(progressText).toContain('566 /');
```

This confirms the UI properly tracked progress through real clicks.

### 4.5 Verify DontKnow Limit

Also add a separate sub-test or assertion that tests the "Bilmiyorum" limit:
- Create a scenario where >10 "Bilmiyorum" answers are attempted
- Verify the UI prevents the 11th "Bilmiyorum" selection (button disabled or warning shown)

## 5. Bypass Detection / Anti-Cheating

The current test also doesn't verify any anti-cheating measures. Consider adding:
- Verify the test doesn't allow going back to change answers after a certain point
- Verify the warning modal appears when trying to leave the page

## 6. Test Structure Changes

The current test is a single large `test()` block. Split into logical sub-tests:

```js
test.describe('MMPI Test Sistemi - Tam Akis Testi', () => {

  test('Kullanici kayit formu doldurma', async ({ page }) => { ... });
  
  test('KVKK onay akisi', async ({ page }) => { ... });
  
  test('MMPI testini cevaplama (566 soru)', async ({ page }) => { ... });
  
  test('Test tamamlanma sayfasi dogrulama', async ({ page }) => { ... });
  
  test('Admin panelinde katilimci dogrulama', async ({ page, context }) => { ... });
  
});
```

Use `test.describe.serial()` to ensure sequential execution and shared state via `test fixtures` or a context variable.

## 7. Files to Modify

| File | Change |
|---|---|
| `tests/e2e/specs/full-flow.spec.js` | Replace `page.evaluate()` block with UI interaction loop; restructure into sub-tests |
| `tests/e2e/fixtures/test-data.js` | Add `generateAnswers()` helper function |
| `tests/e2e/playwright.config.js` | Possibly adjust `actionTimeout` or `timeout` if needed |

## 8. Success Check

1. Running `node node_modules/@playwright/test/cli.js test --project=chromium` in `tests/e2e/` passes with **zero failures**.
2. The test output (visible with `--headed`) shows the browser actually navigating through all 566 questions, clicking radio buttons and the "İleri" button 565 times, then "Bitir" on the last question.
3. The progress text shows `4 / 566` after 3 clicks (matching current line 66 check) and `566 / 566` after all questions.
4. The loading modal appears on finish and the `test-complete.html` page loads with correct data.
5. Admin panel verification still finds the test participant.
6. Total test execution time is under 5 minutes (300s default timeout).
7. Running the test 3 times consecutively produces consistent results (no flakiness from timing).
