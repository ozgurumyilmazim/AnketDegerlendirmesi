import { test, expect } from '@playwright/test';
import { createTestParticipant, GENDER_DISPLAY, ADMIN_CREDENTIALS, TEST_CONFIG } from '../fixtures/test-data.js';

const BASE_URL = process.env.BASE_URL || 'https://selma.ozguryilmaz.com.tr';

// ── Reusable helpers ──────────────────────────────────────────────

async function fillPersonalInfo(page, participant) {
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
}

async function loginAsAdmin(page) {
  await page.goto('/admin/login.html');
  await page.waitForLoadState('networkidle');
  await page.fill('#username', ADMIN_CREDENTIALS.email);
  await page.fill('#password', ADMIN_CREDENTIALS.password);
  await page.locator('#loginForm button[type="submit"]').click();
  await page.waitForURL('**/admin/dashboard.html', { timeout: 30000 });
}

function randomAnswer() {
  return Math.random() < 0.5 ? 'Doğru' : 'Yanlış';
}

function answerSelector(answer) {
  return answer === 'Doğru' ? 'label[for="answerTrue"]' : 'label[for="answerFalse"]';
}

// ── Test Suite ────────────────────────────────────────────────────

test.describe('MMPI Test Sistemi - Tam Akis Testi', () => {
  let participant;
  let allAnswers = {};

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
    await page.waitForSelector('a.hero-cta', { hasText: 'Teste Başla', timeout: 30000 });
    await page.locator('a.hero-cta').filter({ hasText: 'Teste Başla' }).first().click();

    // =========================================================
    // 2. UYARI SAYFASI (testebasla.html)
    // =========================================================
    await page.waitForURL('**/testebasla.html');

    // "Kayıtlı Teste Devam Et" butonu mevcut mu?
    const resumeBtn = page.locator('a.btn.btn-outline-primary', { hasText: 'Kayıtlı Teste Devam Et' });
    await expect(resumeBtn).toBeVisible();

    await page.locator('a.btn-success').filter({ hasText: 'Teste Başla' }).click();

    // =========================================================
    // 3. KISISEL BILGI FORMU
    // =========================================================
    await page.waitForURL('**/personal-info.html', { timeout: 15000 });
    await expect(page.locator('#personalInfoForm')).toBeVisible();

    // "Kayıtlı teste devam et" linki mevcut mu?
    const resumeLink = page.locator('a[href="test-devam.html"]', { hasText: 'Kayıtlı teste devam et' });
    await expect(resumeLink).toBeVisible();

    await fillPersonalInfo(page, participant);
    await page.locator('#personalInfoForm button[type="submit"]').click();

    // =========================================================
    // 4. KVKK ONAY
    // =========================================================
    await page.waitForURL('**/kvkk-consent.html', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#kvkkContent')).toBeVisible({ timeout: 10000 });

    // Geri Dön butonu mevcut mu?
    const backBtn = page.locator('button', { hasText: 'Geri Dön' });
    await expect(backBtn).toBeVisible();

    // Checkbox onaysız tıklanırsa uyarı gösterilmeli
    await page.locator('#acceptBtn').click();
    await expect(page.locator('#warningMessage')).not.toHaveClass(/d-none/);

    // Şimdi işaretle ve onayla
    await page.check('#kvkkConsent');
    await page.locator('#acceptBtn').click();

    // =========================================================
    // 5. MMPI TESTI
    // =========================================================
    await page.waitForURL('**/mmpi-test.html', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#questionContainer')).toBeVisible({ timeout: 15000 });

    // "Kişisel Bilgileri Düzenle" butonu mevcut mu?
    const editInfoBtn = page.locator('button', { hasText: 'Kişisel Bilgileri Düzenle' });
    await expect(editInfoBtn).toBeVisible();

    // İlk 3 soruyu rastgele cevapla ve cevapları kaydet
    for (let i = 0; i < 3; i++) {
      const answer = randomAnswer();
      const qNum = i + 1;
      allAnswers[qNum] = answer;
      console.log(`Soru ${qNum} için Rastgele Cevap: ${answer}`);
      await page.locator(answerSelector(answer)).click();
      await page.locator('#nextBtn').click();
      await page.waitForTimeout(200);
    }

    // İlerleme çubuğu 4. soruyu göstermeli
    const progressText = await page.locator('#progressText').textContent();
    expect(progressText).toContain('4 /');

    // "Önceki" butonu artık aktif olmalı (index > 0)
    await expect(page.locator('#prevBtn')).toBeEnabled();

    // Sayfa İçi State Müdahalesi: Tüm soruları rastgele doldur
    await page.evaluate(() => {
      const mmpi = window.mmpiTest;
      if (!mmpi) throw new Error('mmpiTest bulunamadi');

      // Mevcut cevapları temizle ve tümünü rastgele doldur
      mmpi.answers = {};
      for (const q of mmpi.questions) {
        const isTrue = Math.random() < 0.5;
        mmpi.answers[q.question_number] = isTrue ? 'Doğru' : 'Yanlış';
      }

      mmpi.dontKnowCount = 0;
      mmpi.currentQuestionIndex = mmpi.questions.length - 1;
      mmpi.displayQuestion();
      mmpi.updateProgress();
      mmpi.updateButtons();
      mmpi.saveProgress();
    });

    await expect(page.locator('#progressText')).toContainText(`${TEST_CONFIG.totalQuestions} /`);

    // Son soru için rastgele seçim
    const lastAnswer = randomAnswer();
    await page.locator(answerSelector(lastAnswer)).click();

    // Sonraki butonu gizlenmiş, Tamamla butonu görünür olmalı
    await expect(page.locator('#nextBtn')).toBeHidden();
    await expect(page.locator('#finishBtn')).toBeVisible();

    await page.locator('#finishBtn').click();

    await page.waitForSelector('#loadingModal.show', { state: 'detached', timeout: 120000 }).catch(() => { });
    await page.waitForURL('**/test-complete.html', { timeout: 60000 });

    // =========================================================
    // 6. TEST COMPLETE DOGRULAMA
    // =========================================================
    await expect(page.locator('.alert-success')).toBeVisible({ timeout: 10000 });

    const totalQ = await page.locator('#totalQuestions').textContent();
    expect(totalQ).not.toBe('-');
    expect(Number(totalQ)).toBe(TEST_CONFIG.totalQuestions);

    const duration = await page.locator('#testDuration').textContent();
    expect(duration).not.toBe('-');

    const dontKnowCount = await page.locator('#dontKnowCount').textContent();
    expect(dontKnowCount).toContain('0');

    const testId = await page.locator('#testId').textContent();
    expect(testId).toContain('MMPI-');

    const participantName = await page.locator('#participantName').textContent();
    expect(participantName).toContain(participant.firstName);
    expect(participantName).toContain(participant.lastName);

    const participantAge = await page.locator('#participantAge').textContent();
    expect(participantAge).toContain(String(participant.age));

    const participantGender = await page.locator('#participantGender').textContent();
    expect(participantGender).toContain(GENDER_DISPLAY[participant.gender]);

    // localStorage doğrulaması
    const mmpiResults = await page.evaluate(() => localStorage.getItem('mmpiTestResults'));
    expect(mmpiResults).not.toBeNull();
    const parsed = JSON.parse(mmpiResults);
    expect(parsed.answers).toBeDefined();
    expect(Object.keys(parsed.answers).length).toBe(TEST_CONFIG.totalQuestions);

    // =========================================================
    // 7. ADMIN PANELI
    // =========================================================
    const adminPage = await context.newPage();
    await loginAsAdmin(adminPage);

    await expect(adminPage.locator('#totalTests')).toBeVisible({ timeout: 10000 });
    console.log(`Dashboard: Toplam Test=${await adminPage.locator('#totalTests').textContent()}`);

    // =========================================================
    // 8. TEST SONUCLARI SAYFASI
    // =========================================================
    await adminPage.goto('/admin/test-results.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await adminPage.waitForTimeout(3000);

    // Filtre alanları mevcut mu?
    await expect(adminPage.locator('#filterName')).toBeVisible();
    await expect(adminPage.locator('#filterDateFrom')).toBeVisible();
    await expect(adminPage.locator('#filterDateTo')).toBeVisible();
    await expect(adminPage.locator('#filterStatus')).toBeVisible();

    // DataTables global search ile katılımcıyı bul
    const searchInput = adminPage.locator('#testResultsTable_filter input');
    await searchInput.fill(participant.lastName);
    await searchInput.press('Enter');
    await adminPage.waitForSelector(
      `#testResultsTable tbody tr:has-text("${participant.lastName}")`,
      { timeout: 15000 }
    );

    // =========================================================
    // 9. TEST DETAY MODALINI AC
    // =========================================================
    const row = adminPage.locator(`#testResultsTable tbody tr:has-text("${participant.lastName}")`);
    const detailBtn = row.locator('button[title="Detayları Görüntüle"]');
    await detailBtn.waitFor({ state: 'visible', timeout: 5000 });
    await detailBtn.click();

    // Modal açılmalı
    await adminPage.waitForSelector('#testDetailModal.show', { timeout: 15000 });

    // Detay içeriği yüklenmeli
    const detailContent = adminPage.locator('#testDetailContent');
    await expect(detailContent).not.toBeEmpty({ timeout: 10000 });

    // Rapor Oluştur butonu mevcut mu?
    const generateReportBtn = adminPage.locator('#testDetailGenerateReportBtn');
    await expect(generateReportBtn).toBeVisible();

    // Modalı kapat
    await adminPage.locator('#testDetailModal .btn-close').click();
    await adminPage.waitForSelector('#testDetailModal.show', { state: 'hidden', timeout: 5000 });

    // =========================================================
    // 10. RAPORLAR SAYFASI
    // =========================================================
    await adminPage.goto('/admin/reports.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await adminPage.waitForTimeout(2000);
    await expect(adminPage.locator('body')).toContainText('Raporlar');

    // Metrik kartları mevcut mu?
    await expect(adminPage.locator('#totalTests')).toBeVisible();
    await expect(adminPage.locator('#totalReports')).toBeVisible();

    console.log('=== TEST BASARILI ===');
    await adminPage.close();
  });
});
