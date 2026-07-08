import { test, expect } from '@playwright/test';
import { ADMIN_CREDENTIALS } from '../fixtures/test-data.js';

test.describe('Sayfa Icerigi Yonetimi', () => {
  const testMarker = `__TEST_UPDATED_${Date.now()}__`;

  test('Hakkimizda sayfasi guncellemesi ve dogrulama', async ({ page, context }) => {
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    // =========================================================
    // 1. ADMIN LOGIN
    // =========================================================
    await page.goto('/admin/login.html', { waitUntil: 'networkidle' });
    await page.fill('#username', ADMIN_CREDENTIALS.email);
    await page.fill('#password', ADMIN_CREDENTIALS.password);
    await page.locator('#loginForm button[type="submit"]').click();
    await page.waitForURL('**/admin/dashboard.html', { timeout: 15000 });

    // =========================================================
    // 2. SAYFA YONETIMINE GIT
    // =========================================================
    await page.goto('/admin/settings-pages.html', { waitUntil: 'networkidle' });

    // =========================================================
    // 3. HAKKIMIZDA SEKMEINE TIKLA
    // =========================================================
    await page.locator('#tab-hakkimizda').click();
    await page.waitForTimeout(1000);

    // Orijinal basligi kaydet
    const originalTitle = await page.locator('#pageTitle').inputValue();

    // =========================================================
    // 4. ICERIGI GUNCELLE VE KAYDET
    // =========================================================
    // Basliga test marker'i ekle
    const updatedTitle = originalTitle + ' ' + testMarker;
    await page.locator('#pageTitle').fill(updatedTitle);

    // Kaydet tusuna bas
    await page.locator('#savePageBtn').click();

    // Basarili toast mesaji kontrol
    await expect(page.locator('#successToast .toast-body'))
      .toContainText('başarıyla kaydedildi', { timeout: 10000 });

    // =========================================================
    // 5. HAKKIMIZDA SAYFASINDA DOGRULA
    // =========================================================
    const publicPage = await context.newPage();
    await publicPage.goto('/hakkimizda.html', { waitUntil: 'networkidle' });
    await publicPage.waitForTimeout(2000); // Dinamik icerik yuklenmesi icin bekle

    // Guncellenmis basligin sayfada goruntulendigini dogrula
    await expect(publicPage.locator('.page-header h1'))
      .toContainText(testMarker, { timeout: 10000 });

    // =========================================================
    // 6. TEMIZLIK: ORJINAL BASLIGI GERI GETIR
    // =========================================================
    await publicPage.close();

    // Admin sayfasina geri don ve sifirla
    await page.bringToFront();
    await page.locator('#tab-hakkimizda').click();
    await page.waitForTimeout(500);
    await page.locator('#pageTitle').fill(originalTitle);
    await page.locator('#savePageBtn').click();
    await expect(page.locator('#successToast .toast-body'))
      .toContainText('başarıyla kaydedildi', { timeout: 10000 });

    console.log('=== SAYFA ICERIK TESTI BASARILI ===');
  });
});
