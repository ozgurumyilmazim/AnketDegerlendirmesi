# MMPI Psikolojik Test Sistemi — Kullanım Kılavuzu

## İçindekiler

1. [Proje Tanıtımı](#1-proje-tanıtımı)
2. [Kurulum](#2-kurulum)
3. [Kullanıcı Akışı](#3-kullanıcı-akışı)
4. [Admin Paneli](#4-admin-paneli)
5. [Test Yapısı](#5-test-yapısı)
6. [Puanlama ve Raporlama](#6-puanlama-ve-raporlama)
7. [Veritabanı ve API](#7-veritabanı-ve-api)
8. [Geliştirici Notları](#8-geliştirici-notları)
9. [Güvenlik](#9-güvenlik)

---

## 1. Proje Tanıtımı

Bu proje, **Minnesota Çok Yönlü Kişilik Envanteri (MMPI-2)** testinin web tabanlı uygulamasıdır. Saf HTML/CSS/JavaScript ile geliştirilmiş olup herhangi bir framework veya build aracı kullanmaz. Tüm arayüz Türkçe'dir.

### Temel Özellikler

- 567 soruluk MMPI-2 testini çevrimiçi uygulama
- Klinik ve geçerlilik ölçeklerine göre otomatik puanlama
- T-skoru dönüşümü ve grafiksel profil çıktısı
- Psikolog değerlendirmesi ve PDF rapor oluşturma
- KVKK uyumlu veri toplama ve saklama
- Admin paneli ile test yönetimi
- PostgreSQL + PostgREST ile isteğe bağlı veritabanı senkronizasyonu

### Mimarisi

```
İstemci (Tarayıcı)          → statik dosyalar (nginx)
İstemci (Tarayıcı)          → /api/* → PostgREST → PostgreSQL
Admin Paneli (Tarayıcı)     → JWT Auth → PostgREST → PostgreSQL
```

Hiçbir özel backend kodu bulunmaz. PostgREST, PostgreSQL'i doğrudan REST API'e çeviren bir araçtır.

---

## 2. Kurulum

### 2.1. Gereksinimler

- Docker ve Docker Compose (önerilen)
- veya: herhangi bir statik dosya sunucusu (local dev için)

### 2.2. Docker ile Kurulum (Önerilen)

```bash
# 1. Ortam değişkenlerini ayarla
cp env.example .env
# .env dosyasını düzenle, şifreleri değiştir

# 2. Docker servislerini başlat
docker compose up -d

# 3. Veritabanı migrasyonlarını çalıştır (ilk kurulumda)
docker compose exec db psql -U postgres -d mydatabase -f /docker-entrypoint-initdb.d/01_schema.sql
```

Container'lar otomatik olarak başlamazsa manuel başlatın:
```bash
docker compose start
```

### 2.3. Docker Compose Servisleri

| Servis | Konteyner Adı | Port | Açıklama |
|---|---|---|---|
| **db** | `selma_db` | 5432 | PostgreSQL veritabanı |
| **api** | `selma_api` | 3000 | PostgREST API |
| **pgadmin** | `selma_pgadmin` | 5050 | PostgreSQL yönetim arayüzü |
| **nginx** | `selma_onyuz` | 80 | Reverse proxy + statik dosya sunucusu |

### 2.4. Yerel Geliştirme (Docker'sız)

Herhangi bir statik dosya sunucusu yeterlidir:

```bash
python3 -m http.server 8000
# veya
npx serve .
# veya
php -S localhost:8000
```

Bu durumda veritabanı bağlantısı olmaz, tüm veriler `localStorage`'da tutulur.

### 2.5. Veritabanı Migrasyon Sırası

```bash
1. psql -d mmpi_db -f database/01_schema.sql    # Tablolar
2. psql -d mmpi_db -f database/02_data.sql       # Test verileri (sorular, ölçekler, vb.)
3. psql -d mmpi_db -f database/03_setup_admin.sql # Admin hesabı (elle bcrypt hash gir)
4. psql -d mmpi_db -f database/05_postgrest_setup.sql # PostgREST rolleri + JWT login
```

### 2.6. Test Kimlik Bilgileri

| Rol | E-posta | Şifre |
|---|---|---|
| Admin | `admin@psikolog.com` | `admin123` |
| Psikolog | `psikolog1@psikolog.com` | `psikolog123` |

Yerel geliştirme ortamında (`localhost` veya `127.0.0.1`) kişisel bilgiler sayfası otomatik olarak test verileriyle doldurulur (TCKN: `12345678921`).

---

## 3. Kullanıcı Akışı

Sistem, aşağıdaki sırayla ilerleyen bir dizi sayfadan oluşur:

```
index.html → personal-info.html → kvkk-consent.html → mmpi-test.html → test-complete.html → report.html
```

Her sayfa kendi `.html` dosyasıdır. Durum `localStorage` üzerinden aktarılır.

### 3.1. Ana Sayfa (`index.html`)

- MMPI testi hakkında bilgilendirme
- "Teste Başla" butonu ile teste yönlendirme
- Sayfa içeriği PostgREST üzerinden dinamik olarak da yüklenebilir (`page_content` tablosu)

### 3.2. Kişisel Bilgiler (`personal-info.html`)

Zorunlu alanlar:
- Ad, Soyad
- TC Kimlik No (11 hane)
- Cinsiyet (Erkek / Kadın)
- Yaş (16+)
- Eğitim Seviyesi
- Medeni Durum

İsteğe bağlı alanlar:
- Kurum Kodu, Kurum Adı
- Meslek

Girilen bilgiler `localStorage`'a (`mmpiPersonalInfo`) kaydedilir ve PostgREST üzerinden `participants` tablosuna gönderilir. Daha önce test tamamlanmışsa uyarı verir.

### 3.3. KVKK Onayı (`kvkk-consent.html`)

- 6698 sayılı KVKK kapsamında aydınlatma metni
- Metin PostgREST üzerinden `kvkk` tablosundan yüklenir (bağlantı yoksa varsayılan metin gösterilir)
- Onay kutucuğu işaretlenmeli ve "Kabul Et" tıklanmalı
- Onay `localStorage`'a kaydedilir (`kvkkConsent`)
- Onay olmadan teste geçilemez

### 3.4. Test Sayfası (`mmpi-test.html`)

- 567 soru tek tek gösterilir
- Her soruya üç cevap seçeneği: **Doğru**, **Yanlış**, **Bilmiyorum**
- İlerleme çubuğu ile soru sayısı gösterilir
- En fazla **10 "Bilmiyorum"** cevabına izin verilir (test-config.js'de `maxDontKnowAnswers`)
- **Önceki / Sonraki** butonları ile sorular arasında gezinme
- 30 saniyede bir otomatik kayıt (`autoSaveInterval`)
- Test sırasında kişisel bilgiler düzenlenebilir (modal ile)
- Test tamamlandığında modal ile kaydetme mesajı gösterilir

**Erişim Kontrolü:**
- KVKK onayı ve kişisel bilgiler girilmemişse ana sayfaya yönlendirir
- Aynı TCKN ile daha önce test tamamlanmışsa uyarır ve engeller

### 3.5. Test Tamamlandı (`test-complete.html`)

- Testin başarıyla tamamlandığını bildirir
- Özet bilgiler: toplam soru, süre, bilmiyorum sayısı
- Test ID, tarih, katılımcı bilgileri
- Puanlama otomatik olarak yapılır ve geçerlilik durumu gösterilir

### 3.6. Rapor Sayfası (`report.html`)

Rapor sayfasına `?id=` parametresi ile test sonucu ID'si verilerek erişilir.

**Rapor Bölümleri:**
1. **Katılımcı Bilgileri** — ad, TCKN, yaş, cinsiyet, eğitim, medeni durum, test tarihi, süre
2. **Geçerlilik Değerlendirmesi** — VRIN, TRIN, F, F1, F2, L, K ölçekleri
3. **K Oranları Tablosu** — K düzeltme katsayıları (0.5K, 0.4K, 1.0K, 0.2K)
4. **MMPI Profil Grafiği** — Chart.js ile çizilen T-skoru grafiği
5. **Ölçek Sonuçları** — Tüm klinik ölçekler için T-skorları, seviyeler
6. **Özet ve Yorumlama** — Otomatik oluşturulan değerlendirme metni
7. **Öneriler** — Skorlara göre öneriler
8. **Psikolog Değerlendirmesi** — Psikoloğun gireceği alanlar:
   - Psikolog adı, değerlendirme tarihi
   - Katılım ve geçerlilik değerlendirmesi
   - Özet, rapor sonucu
   - Ek değerlendirme notu
   - Veri kullanım önerisi
9. **PDP Parametreleri** — Psikopatolojik bulgular için checkbox listesi
10. **Görev Tanımları Değerlendirmesi** — Dinamik olarak yüklenir
11. **Yetkinlik Değerlendirmesi** — 5 ana skalada puanlama
12. **PDF Çıktısı** — jsPDF + html2canvas ile PDF oluşturma

---

## 4. Admin Paneli

### 4.1. Giriş (`/admin/login.html`)

- E-posta ve şifre ile JWT tabanlı giriş
- PostgREST'in `/rpc/login` fonksiyonunu kullanır
- Oturum `localStorage`'da (`mmpi_token`) ve `adminLogin` anahtarıyla saklanır
- Başarılı girişte dashboard'a yönlendirir

### 4.2. Kullanıcı Rolleri

| Rol | Yetkiler |
|---|---|
| **admin** | Tam yetki. Ayarlar, psikolog tanımları, tüm sayfalara erişim. |
| **psychologist** | Sınırlı yetki. Psikolog Tanımları sayfasına erişemez. |

### 4.3. Dashboard (`/admin/dashboard.html`)

- Solda sidebar menü
- İstatistik kartları: toplam test, tamamlanan, devam eden, bugünkü testler
- Son testler tablosu
- Grafikler (Chart.js ile haftalık/aylık test istatistikleri)

### 4.4. Admin Sayfaları

| Sayfa | İşlev |
|---|---|
| `dashboard.html` | Ana gösterge paneli |
| `reports.html` | Rapor listesi ve arama |
| `test-results.html` | Test sonuçları listesi |
| `questions.html` | Soru yönetimi |
| `analytics.html` | İstatistik ve analizler |
| `settings.html` | Genel ayarlar |
| `settings-admins.html` | Psikolog tanımları (sadece admin) |
| `settings-kvkk.html` | KVKK metni düzenleme |
| `settings-pages.html` | Sayfa içerikleri (anasayfa, hakkımızda vb.) |
| `settings-categories.html` | Kategori yönetimi |
| `settings-letters.html` | Mektup şablonları |
| `task-definitions.html` | Görev tanımları |

---

## 5. Test Yapısı

### 5.1. Sorular

- **Toplam:** 567 soru (MMPI-2 standardı)
- **Cevap Tipleri:** `Doğru`, `Yanlış`, `Bilmiyorum`
- **Kategoriler:** Genel, Aile, Sağlık, Cinsellik, Duygusal, Sosyal
- Sorular PostgREST üzerinden `questions` tablosundan yüklenir
- Veritabanı bağlantısı yoksa `mmpi-questions.js`'deki fallback sorular kullanılır

### 5.2. Limitler ve Kurallar

| Parametre | Değer |
|---|---|
| Maksimum "Bilmiyorum" | 10 (test-config.js) |
| Tahmini süre | 60-90 dakika |
| Maksimum süre | 120 dakika |
| Otomatik kayıt aralığı | 30 saniye |
| Minimum yaş | 16 |

### 5.3. Durum Yönetimi

Tüm durum `localStorage` üzerinden yönetilir:

| Anahtar | İçerik |
|---|---|
| `mmpiPersonalInfo` | Kişisel bilgiler (JSON) |
| `kvkkConsent` | KVKK onay durumu |
| `kvkkConsentDate` | Onay tarihi |
| `mmpiTestResults` | Test cevapları + skorlar |
| `mmpiTestStartTime` | Başlangıç zamanı |
| `mmpiTestEndTime` | Bitiş zamanı |
| `mmpiCompletedTests` | Tamamlanan test listesi |
| `mmpiTestId` | Test ID |
| `mmpi_token` | JWT token (admin) |
| `adminLogin` | Admin oturumu |

---

## 6. Puanlama ve Raporlama

### 6.1. Ölçekler

#### Geçerlilik Ölçekleri

| Ölçek | Açıklama | Soru Sayısı |
|---|---|---|
| **VRIN** | Değişken Yanıt Tutarsızlığı | — |
| **TRIN** | Doğru Yanıt Tutarsızlığı | — |
| **F** | Nadir Yanıtlar | 20 |
| **F1** | Nadir Yanıtlar 1 (ilk yarı) | 10 |
| **F2** | Nadir Yanıtlar 2 (ikinci yarı) | — |
| **L** | Yalan (Sosyal istenirlik) | 12 |
| **K** | Düzeltme (Savunma mekanizmaları) | 14 |

#### Klinik Ölçekler

| Ölçek | Adı | K Düzeltmesi |
|---|---|---|
| **Hs** | Hipokondriazis | +0.5K |
| **D** | Depresyon | +1.0K |
| **Hy** | Histeri | +1.0K |
| **Pd** | Psikopati | +0.4K |
| **Mf** | Erkeklik-Kadınlık | — |
| **Pa** | Paranoya | — |
| **Pt** | Psikasteni | +1.0K |
| **Sc** | Şizofreni | +1.0K |
| **Ma** | Hipomani | +0.2K |
| **Si** | Sosyal İçedönüklük | — |

### 6.2. Puanlama Süreci

1. **Ham Puan Hesaplama:** Her ölçek için ilgili sorulara verilen cevaplar puanlanır
2. **K Düzeltmesi:** K ölçeği puanı, ilgili klinik ölçeklere katsayıyla eklenir
3. **T-Skoru Dönüşümü:** T = 50 + 10 × (ham_puan - ortalama) / standart_sapma
4. **Geçerlilik Değerlendirmesi:** F, L, K ölçekleri ve yanıtsız soru sayısı kontrol edilir
5. **Yorumlama:** T-skorları seviyelere göre sınıflandırılır

### 6.3. T-Skoru Yorumlama

| T-Skoru Aralığı | Seviye | Anlamı |
|---|---|---|
| < 30 | Çok Düşük | Klinik olarak anlamlı düşük |
| 30 - 39 | Düşük | Ortalamanın altında |
| 40 - 59 | Normal | Normal aralık |
| 60 - 69 | Yüksek | Ortalamanın üstünde |
| 70 - 79 | Çok Yüksek | Klinik olarak anlamlı yüksek |
| ≥ 80 | Kritik | Kritik düzeyde yüksek |

### 6.4. Rapor Çıktıları

- **Ekran:** Chart.js ile T-skoru profili grafiği
- **PDF:** jsPDF + html2canvas ile sayfa yakalama
  - Katılımcı bilgileri tablosu
  - Profil grafiği
  - Tüm ölçek sonuçları
  - Psikolog değerlendirme alanları
  - PDP parametreleri
  - Yetkinlik değerlendirmesi

---

## 7. Veritabanı ve API

### 7.1. Veritabanı Şeması

Proje PostgreSQL kullanır. Ana tablolar:

| Tablo | Açıklama |
|---|---|
| `users` | Admin/psikolog hesapları (bcrypt hash ile) |
| `participants` | Test katılımcıları |
| `test_results` | Test cevapları ve sonuçları (JSONB) |
| `questions` | 567 MMPI-2 sorusu |
| `scoring_keys` | Ölçek-soru eşleştirmeleri |
| `t_score_norms` | T-skoru norm değerleri |
| `t_score_params` | Ortalama (M), standart sapma (SD), K katsayısı |
| `mmpi_interpretations` | Otomatik yorumlama metinleri |
| `reports` | Oluşturulan raporlar |
| `page_content` | Sayfa içerikleri (anasayfa, hakkımızda vb.) |
| `kvkk` | KVKK metni |
| `task_definitions` | Görev tanımları |
| `settings` | Sistem ayarları |
| `sessions` | Oturum yönetimi |
| `question_category` | Soru kategorileri |

### 7.2. PostgREST API

PostgREST, PostgreSQL'i REST API'e dönüştürür. Herhangi bir özel backend kodu yoktur.

**API Temel URL:**
- Geliştirme: `http://postgrest:3000`
- Prodüksiyon: `https://selma.ozguryilmaz.com.tr/api`

**Örnek API Çağrıları:**

```js
// Login
POST /api/rpc/login
Body: { "email": "admin@psikolog.com", "password": "admin123" }
Response: "jwt_token_string"

// Veri çekme
GET /api/questions?select=id,question_number,question_text&order=question_number.asc

// Veri ekleme
POST /api/participants
Authorization: Bearer <jwt_token>
Body: { "first_name": "Ahmet", "last_name": "Yılmaz", ... }

// RPC çağrısı
POST /api/rpc/me
Authorization: Bearer <jwt_token>
```

### 7.3. Kimlik Doğrulama (JWT)

1. Kullanıcı `/rpc/login` ile e-posta/şifre gönderir
2. `api.login()` fonksiyonu PostgreSQL'de bcrypt doğrulaması yapar
3. Başarılı girişte HMAC-SHA256 ile imzalanmış JWT döner
4. JWT, 24 saat geçerlidir ve `role`, `user_id`, `email`, `name`, `role_name` bilgilerini taşır
5. Sonraki isteklerde `Authorization: Bearer <token>` header'ı gönderilir

### 7.4. Veritabanı Rolleri

- **anon:** Kimlik doğrulaması olmayan istekler. Sadece `api.login()` çağırabilir.
- **authenticated:** JWT ile gelen istekler. Tüm tablolarda CRUD yetkisi vardır.

### 7.5. pgAdmin Yönetim Arayüzü

- URL: `http://localhost:5050` (veya `/pgadmin/` üzerinden nginx proxy ile)
- Varsayılan e-posta: `admin@admin.com`
- Varsayılan şifre: `adminpassword123`
- PostgreSQL sunucusuna bağlanmak için host: `selma_db`, port: `5432`

---

## 8. Geliştirici Notları

### 8.1. Dosya Yapısı

```
/
├── frontend/                 # Web uygulaması (statik dosyalar)
│   ├── index.html            # Ana sayfa
│   ├── personal-info.html    # Kişisel bilgiler
│   ├── kvkk-consent.html     # KVKK onayı
│   ├── mmpi-test.html        # Test sayfası
│   ├── test-complete.html    # Test tamamlandı
│   ├── report.html           # Rapor sayfası
│   ├── hakkimizda.html       # Hakkımızda
│   ├── gizlilik.html         # Gizlilik politikası
│   ├── kullanim.html         # Kullanım koşulları
│   ├── testebasla.html       # Test başlatma
│   ├── admin/                # Admin paneli
│   │   ├── login.html
│   │   ├── dashboard.html
│   │   ├── reports.html
│   │   ├── test-results.html
│   │   ├── settings*.html
│   │   ├── analytics.html
│   │   ├── questions.html
│   │   ├── task-definitions.html
│   │   └── style.css
│   ├── assets/
│   │   ├── css/style.css     # Ana stil dosyası
│   │   ├── js/
│   │   │   ├── test-config.js        # Konfigürasyon
│   │   │   ├── mmpi-scoring.js       # Puanlama motoru
│   │   │   ├── pg-config.js          # PostgREST API client + JWT auth
│   │   │   ├── mmpi-test.js          # Test mantığı
│   │   │   ├── personal-info.js      # Kişisel bilgi formu
│   │   │   ├── kvkk-consent.js       # KVKK onay mantığı
│   │   │   ├── report.js             # Rapor görüntüleme
│   │   │   ├── pdf-utils.js          # PDF çıktı araçları
│   │   │   ├── mmpi-questions.js     # Yedek sorular
│   │   │   ├── admin-login.js        # Admin girişi
│   │   │   ├── admin-dashboard.js    # Dashboard
│   │   │   ├── reports.js            # Rapor listesi
│   │   │   ├── test-results.js       # Test sonuçları
│   │   │   ├── participants.js       # Katılımcı yönetimi
│   │   │   ├── settings.js           # Ayarlar
│   │   │   ├── analytics.js          # İstatistikler
│   │   │   └── debug.js              # Debug araçları
│   │   └── favicon.ico
│   └── tests/                # Test dosyaları
├── database/                 # SQL migrasyonları
│   ├── 01_schema.sql         # Tablo şeması
│   ├── 02_data.sql           # Test verileri (soru, ölçek, interpretasyon)
│   ├── 03_setup_admin.sql    # Admin hesap ayarları
│   ├── 05_postgrest_setup.sql # PostgREST rolleri + JWT fonksiyonları
│   └── scripts/              # Ek scriptler
├── nginx/
│   └── default.conf          # Nginx yapılandırması
├── docker-compose.yaml       # Docker servis tanımları
├── postgrest.conf            # PostgREST konfigürasyonu
├── env.example               # Örnek çevre değişkenleri
└── AGENTS.md                 # Geliştirici notları
```

### 8.2. Script Yükleme Sırası (Kritik)

Her HTML sayfasında script'ler aşağıdaki sırayla yüklenmelidir:

1. **Bootstrap + jQuery + Chart.js** (CDN)
2. **`test-config.js`** — global `testConfig` nesnesi
3. **`mmpi-scoring.js`** — `MMPIScoring` sınıfı
4. **`pg-config.js`** — `PG_API` ve `AuthService` nesneleri
5. **Sayfa spesifik JS** (ör. `mmpi-test.js`, `personal-info.js`)

Bu sıra DEĞİŞTİRİLMEMELİDİR. Script'ler bir önceki script'in tanımladığı global nesnelere bağımlıdır.

### 8.3. Durum Akışı

Tüm durum `localStorage` → isteğe bağlı PostgreSQL senkronizasyonu şeklinde akar. Önce localStorage'a yazılır, ardından PostgREST çağrısı yapılır.

### 8.4. Mükerrer Test Kontrolü

Aynı TCKN ile daha önce test tamamlanmışsa:
1. `localStorage`'daki `mmpiCompletedTests` kontrol edilir
2. PostgREST'te `participants` + `test_results` tabloları sorgulanır
3. Mükerrer test tespit edilirse kullanıcı uyarılır ve yönlendirilir

### 8.5. Debug

- Konsoldan `window.mmpiDebug` ile test modunda hata ayıklama yapılabilir
- `pg-config.js` yüklendiğinde konsola API URL'i yazılır
- Test sayfası `testConfig.debugMode` ile debug log'larını açar

### 8.6. Sık Kullanılan Komutlar

```bash
# Container log'larını izleme
docker compose logs -f api
docker compose logs -f db

# Veritabanına bağlanma
docker compose exec db psql -U postgres -d mydatabase

# Tüm servisleri yeniden başlatma
docker compose restart

# Sıfırdan kurulum
docker compose down -v && docker compose up -d
```

---

## 9. Güvenlik

### 9.1. postgrest.conf Uyarıları

`postgrest.conf` hâlen development placeholder değerleri içerebilir. Production'a geçmeden önce aşağıdakiler yapılmalıdır:

| Madde | Durum | Yapılması Gereken |
|---|---|---|
| `db-uri` | Düz metin şifre | Ortam değişkenine taşı |
| `jwt-secret` | Placeholder | Ortam değişkenine taşı, güçlü secret kullan |
| `cors-origin` | `"*"` (çok permissif) | Domain'e daralt veya kaldır (same-orign yeterli) |

### 9.2. Önerilen Yapılandırma

```ini
# postgrest.conf (git'e commit edilecek)
db-uri = "postgres://postgres:$(DB_PASSWORD)@postgres_db:5432/mmpi_db"
jwt-secret = "$(JWT_SECRET)"
db-pre-request = "SET app.jwt_secret = '$(JWT_SECRET)'"
cors-origin = "https://selma.ozguryilmaz.com.tr"
```

```bash
# .env (git IGNORE edilecek, .gitignore'a eklenmiş)
DB_PASSWORD=<güçlü-şifre>
JWT_SECRET=<64-bayt-base64-secret>
```

### 9.3. Secret Üretme

```bash
# PostgreSQL şifresi (12 bayt, base64)
openssl rand -base64 12

# JWT secret (64 bayt, base64)
openssl rand -base64 48
```

### 9.4. Production Checklist

- [ ] `cors-origin` daralt (`"*"` → spesifik domain)
- [ ] `db-uri` environment variable'a çevir
- [ ] `jwt-secret` environment variable'a çevir
- [ ] `.env` oluştur ve `.gitignore`'a ekle
- [ ] PostgREST container'ı `.env` ile başlat
- [ ] PostgreSQL portu `127.0.0.1:5432`'ye bağlı (Docker dışından erişim kapalı)
- [ ] pgAdmin portu `127.0.0.1:5050`'ye bağlı (sadece localhost)
- [ ] bcrypt hash kullanılıyor (düz metin şifre yok)
- [ ] Veritabanı yedekleme yapılandırılmış
- [ ] Cloudflare Tunnel SSL sertifikası aktif

### 9.5. Veri Saklama

- KVKK kapsamında kişisel veriler 2 yıl süreyle saklanır
- Tüm veriler PostgreSQL'de, yetkili kullanıcılar (authenticated role) tarafından erişilebilir
- Anonim kullanıcılar (anon role) sadece login fonksiyonuna erişebilir
- JWT token'lar 24 saat geçerlidir

### 9.6. Güvenlik Başlıkları (Nginx)

nginx yapılandırmasında aşağıdaki güvenlik başlıkları aktiftir:

- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

---

*Bu doküman MMPI Psikolojik Test Sistemi için hazırlanmıştır. Son güncelleme: Haziran 2026.*
