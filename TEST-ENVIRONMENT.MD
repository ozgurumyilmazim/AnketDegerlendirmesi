# Test Environment — MMPI Psikolojik Test Sistemi

## Admin Panel

| Bilgi | Değer |
|---|---|
| URL | https://selma.ozguryilmaz.com.tr/admin/login.html |
| E-posta | `admin@psikolog.com` |
| Şifre | `admin123` |
| Rol | `admin` |

## API (PostgREST)

| Bilgi | Değer |
|---|---|
| Login endpoint | `POST /api/rpc/login` |
| API base | `/api/` (same origin, nginx proxy → postgrest:3000) |

## Test Kullanıcıları

| Rol | E-posta | Şifre |
|---|---|---|
| Admin | admin@psikolog.com | admin123 |
| Psikolog | psikolog1@psikolog.com | admin123 |

## Test Akışı

1. `https://selma.ozguryilmaz.com.tr/` → "Teste Başla"
2. Kişisel bilgiler girilir → "Devam Et"
3. KVKK onayı → "Devam Et"
4. MMPI-2 testi (567 soru) → "Testi Bitir"
5. `test-complete.html` → yönlendirme
6. `report.html` → otomatik profil grafiği ve PDF çıktısı

## Yönetim Ekranları Testi

Yönetim ekranlarını test etmek için önce `/admin/login.html` sayfasına gidilir, yukarıdaki test kullanıcısı bilgileri ile giriş yapılır ve ilgili ekran test edilir.
