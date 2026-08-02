import { test, expect } from '@playwright/test';
import { createTestParticipant, ADMIN_CREDENTIALS, TEST_CONFIG } from '../fixtures/test-data.js';

test.describe('MMPI Test Sistemi - Tam Akis Testi', () => {
  let participant;
  let mevcutSoruSayisi = 0
  let answers = {};

  test.beforeAll(() => {
    participant = createTestParticipant();
    console.log(`Katilimci: ${participant.firstName} ${participant.lastName} (TCKN: ${participant.tcNo})`);
  });

  test('Kullanici akisi + Admin paneli dogrulamasi', async ({ page, context }) => {
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    // =========================================================
    // 1. ANASAYFA
    // =========================================================
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForSelector('a, button', { hasText: 'Teste Başla', timeout: 30000 });
    await page.locator('a, button').filter({ hasText: 'Teste Başla' }).first().click();

    // =========================================================
    // 2. UYARI SAYFASI (testebasla.html)
    // =========================================================
    await page.waitForURL('**/testebasla.html');
    await page.locator('a.btn-success').filter({ hasText: 'Teste Başla' }).click();

    // =========================================================
    // 3. KISISEL BILGI FORMU
    // =========================================================
    await page.waitForURL('**/personal-info.html', { timeout: 15000 });

    await page.fill('#firstName', participant.firstName);
    await page.fill('#lastName', participant.lastName);
    await page.fill('#tcNo', participant.tcNo);
    await page.selectOption('#gender', participant.gender);
    await page.fill('#age', String(participant.age));
    await page.fill('#institutionCode', participant.institutionCode);
    await page.fill('#institutionName', participant.institutionName);
    await page.fill('#profession', participant.profession);
    await page.selectOption('#education', participant.education);
    await page.selectOption('#maritalStatus', participant.maritalStatus);
    await page.locator('#personalInfoForm button[type="submit"]').click();

    // =========================================================
    // 4. KVKK ONAY
    // =========================================================
    await page.waitForURL('**/kvkk-consent.html', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#kvkkContent')).toBeVisible({ timeout: 10000 });
    await page.check('#kvkkConsent');
    await page.locator('#acceptBtn').click();

    // =========================================================
    // 5. MMPI TESTI
    // =========================================================
    await page.waitForURL('**/mmpi-test.html', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#questionContainer')).toBeVisible({ timeout: 15000 });

    // İlk 3 Soru: Rastgele "Doğru" veya "Yanlış" seçeneği tıklanır
    for (let i = 0; i < 3; i++) {
      mevcutSoruSayisi = mevcutSoruSayisi + 1;
      let answers[mevcutSoruSayisi] = Math.random() < 0.5 ? 'label[for="answerTrue"]' : 'label[for="answerFalse"]';
      'let randomAnswerSelector = Math.random() < 0.5 ? 'label[for= "answerTrue"]' : 'label[for= "answerFalse"]';
      console.log(`Soru ${mevcutSoruSayisi} icin Rastgele Cevap: ${answers[i]}`);
      await page.locator(answers[i]).click();
      await page.locator('#nextBtn').click();
      await page.waitForTimeout(200);
    }
    const progressText = await page.locator('#progressText').textContent();
    expect(progressText).toContain('4 /');

    // Sayfa İçi State Müdahalesi: Tüm sorular rastgele 'Doğru' veya 'Yanlış' olarak doldurulur
    await page.evaluate(() => {
      const mmpi = window.mmpiTest;
      if (!mmpi) throw new Error('mmpiTest bulunamadi');

      // Tüm sorular için %50 ihtimalle 'Doğru' veya 'Yanlış' seçimi yapılır
      for (const q of mmpi.questions) {
        mevcutSoruSayisi = mevcutSoruSayisi + 1;
        answer[mevcutSoruSayisi] = Math.random() < 0.5 ? 'label[for="answerTrue"]' : 'label[for="answerFalse"]';
        ' answers[q.question_number] = Math.random() < 0.5 ? 'Doğru' : 'Yanlış';
      }

      Object.assign(answers, mmpi.answers);
      mmpi.answers = answer;
      mmpi.dontKnowCount = 0;
      mmpi.currentQuestionIndex = mmpi.questions.length - 1;
      mmpi.displayQuestion();
      mmpi.updateProgress();
      mmpi.updateButtons();
      mmpi.saveProgress();
    });

    await expect(page.locator('#progressText')).toContainText(`${TEST_CONFIG.totalQuestions} /`);

    // Son soru için de rastgele seçim yapılır
    mevcutSoruSayisi = mevcutSoruSayisi + 1;
    answer[mevcutSoruSayisi] = Math.random() < 0.5 ? 'label[for="answerTrue"]' : 'label[for="answerFalse"]';
    ' const lastAnswerSelector = Math.random() < 0.5 ? 'label[for= "answerTrue"]' : 'label[for= "answerFalse"]';
    await page.locator(answer[mevcutSoruSayisi]).click();
    await page.locator('#finishBtn').click();

    await page.waitForSelector('#loadingModal.show', { state: 'detached', timeout: 120000 }).catch(() => { });
    await page.waitForURL('**/test-complete.html', { timeout: 60000 });

    // =========================================================
    // 6. TEST COMPLETE DOGRULAMA
    // =========================================================
    await expect(page.locator('text=Test Sonuçları Kaydedildi')).toBeVisible({ timeout: 10000 });
    const totalQ = await page.locator('#totalQuestions').textContent();
    expect(totalQ).not.toBe('-');
    const duration = await page.locator('#testDuration').textContent();
    expect(duration).not.toBe('-');

    const mmpiResults = await page.evaluate(() => localStorage.getItem('mmpiTestResults'));
    expect(mmpiResults).not.toBeNull();
    const parsed = JSON.parse(mmpiResults);
    expect(parsed.answers).toBeDefined();
    expect(Object.keys(parsed.answers).length).toBe(TEST_CONFIG.totalQuestions);

    // =========================================================
    // 7. ADMIN PANELI
    // =========================================================
    const adminPage = await context.newPage();
    await adminPage.goto('/admin/login.html');
    await adminPage.waitForLoadState('networkidle');

    await adminPage.fill('#username', ADMIN_CREDENTIALS.email);
    await adminPage.fill('#password', ADMIN_CREDENTIALS.password);
    await adminPage.locator('#loginForm button[type="submit"]').click();
    await adminPage.waitForURL('**/admin/dashboard.html', { timeout: 30000 });

    await expect(adminPage.locator('#totalTests')).toBeVisible({ timeout: 10000 });
    console.log(`Dashboard: Toplam Test=${await adminPage.locator('#totalTests').textContent()}`);

    // Test sonuclari sayfasini kontrol et
    await adminPage.goto('/admin/test-results.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await adminPage.waitForTimeout(3000);

    // Katilimci bilgilerini dogrula: DataTables arama kutusunu kullan
    await adminPage.fill('input[type="search"]', participant.lastName);
    // Enter'a basarak arama yap
    await adminPage.press('input[type="search"]', 'Enter');
    // Arama sonuçları gelene kadar bekle
    await expect(adminPage.locator('#testResultsTable tbody tr', { hasText: participant.lastName })).toBeVisible({ timeout: 15000 });

    // İşlemler sutunundakı detay butonuna tıkla
    await adminPage.locator('#testResultsTable tbody tr td:nth-child(10) a').click();
    await adminPage.waitForURL('**/admin/test-detail.html', { timeout: 30000 });

    // Doğru sayısı ve yanlış sayısını doğrula
    const correctCount = await adminPage.locator('#correctCount').textContent();
    const incorrectCount = await adminPage.locator('#incorrectCount').textContent();
    expect(correctCount).not.toBe('-');
    expect(incorrectCount).not.toBe('-');

    await adminPage.goto('/admin/reports.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await adminPage.waitForTimeout(2000);
    await expect(adminPage.locator('body')).toContainText('Raporlar');

    console.log('=== TEST BASARILI ===');
    await adminPage.close();
  });
});