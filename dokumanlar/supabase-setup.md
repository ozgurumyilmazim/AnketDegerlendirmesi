# Supabase Entegrasyonu Rehberi

## 1. Supabase Projesi Oluşturma

1. [Supabase](https://supabase.com) sitesine gidin
2. "Start your project" butonuna tıklayın
3. GitHub hesabınızla giriş yapın
4. "New Project" butonuna tıklayın
5. Proje adını girin (örn: "psikolog-mmpi")
6. Güçlü bir veritabanı şifresi oluşturun
7. Bölge seçin (Europe West için "eu-west-1" önerilir)
8. "Create new project" butonuna tıklayın

## 2. Proje Bilgilerini Alma

Proje oluşturulduktan sonra:
1. Sol menüden "Settings" > "API" sekmesine gidin  
2. Aşağıdaki bilgileri kopyalayın:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public key**: `eyJ...` ile başlayan uzun anahtar

## 3. Supabase Konfigürasyonunu Güncelleme

`assets/js/supabase-config.js` dosyasında aşağıdaki değişiklikleri yapın:

```javascript
const SUPABASE_CONFIG = {
    url: 'https://your-project-id.supabase.co', // Gerçek URL'nizi buraya
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', // Gerçek anon key'inizi buraya
    
    tables: {
        testResults: 'test_results',
        participants: 'participants', 
        questions: 'questions',
        reports: 'reports'
    }
};
```

## 4. HTML Dosyalarına Supabase Kütüphanesini Ekleme

Tüm HTML dosyalarının `<head>` bölümüne aşağıdaki script etiketini ekleyin:

```html
<script src="https://unpkg.com/@supabase/supabase-js@2"></script>
```

## 5. Veritabanı Tablolarını Oluşturma

Supabase Dashboard'da SQL Editor'e gidin ve aşağıdaki SQL komutlarını çalıştırın:

### 5.1 Katılımcılar Tablosu
```sql
CREATE TABLE participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    tc_no VARCHAR(11) UNIQUE,
    gender VARCHAR(10) CHECK (gender IN ('erkek', 'kadın', 'other')),
    age INTEGER CHECK (age >= 0 AND age <= 150),
    institution_code VARCHAR(50),
    institution_name VARCHAR(200),
    profession VARCHAR(100),
    education VARCHAR(50),
    marital_status VARCHAR(50),
    created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5.2 Test Sonuçları Tablosu
```sql
CREATE TABLE test_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    participant_info JSONB NOT NULL,
    test_answers JSONB NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    dont_know_count INTEGER DEFAULT 0,
    completed_questions INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 567,
    test_type VARCHAR(50) DEFAULT 'MMPI-2',
    test_version VARCHAR(20) DEFAULT '1.0',
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('started', 'in_progress', 'completed', 'abandoned')),
    created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5.3 Sorular Tablosu
```sql
CREATE TABLE questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_number INTEGER NOT NULL UNIQUE,
    question_text TEXT NOT NULL,
    category VARCHAR(100),
    created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5.4 Raporlar Tablosu
```sql
CREATE TABLE reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    test_result_id UUID REFERENCES test_results(id) ON DELETE CASCADE,
    report_content JSONB NOT NULL,
    report_type VARCHAR(50) DEFAULT 'standard',
    generated_by VARCHAR(100),
    created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

```sql
CREATE TABLE scoring_keys (
   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
   scale_name VARCHAR(10) NOT NULL,
   question_number INTEGER NOT NULL,
   scoring_answer VARCHAR(20) NOT NULL,
   created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT chk_scale_name CHECK (scale_name IN ('L', 'F', 'K')),
    CONSTRAINT chk_question_number CHECK (question_number BETWEEN 1 AND 566),
    CONSTRAINT chk_scoring_answer CHECK (scoring_answer IN ('Doğru', 'Yanlış')),
    
    -- Unique constraint
    CONSTRAINT uk_scale_question UNIQUE (scale_name, question_number)
);

CREATE INDEX idx_scoring_keys_scale ON scoring_keys(scale_name);
CREATE INDEX idx_scoring_keys_question ON scoring_keys(question_number);
CREATE INDEX idx_scoring_keys_scale_question ON scoring_keys(scale_name, question_number);

COMMENT ON TABLE scoring_keys IS 'MMPI testinde L, F, K ölçekleri için puanlama anahtarları';
COMMENT ON COLUMN scoring_keys.scale_name IS 'Ölçek adı: L, F veya K';
COMMENT ON COLUMN scoring_keys.question_number IS 'Soru numarası (1-566 arası)';
COMMENT ON COLUMN scoring_keys.scoring_answer IS 'Puan getiren cevap: Doğru veya Yanlış';
```


### 5.5 İndeksler Oluşturma
```sql
-- Performans için indeksler
CREATE INDEX idx_test_results_created ON test_results(created);
CREATE INDEX idx_test_results_status ON test_results(status);
CREATE INDEX idx_test_results_test_type ON test_results(test_type);
CREATE INDEX idx_participants_tc_no ON participants(tc_no);
CREATE INDEX idx_reports_test_result_id ON reports(test_result_id);
```

### 5.6 Güncelleme Trigger'ları
```sql
-- updated alanını otomatik güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_updated_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger'ları oluştur
CREATE TRIGGER update_participants_updated BEFORE UPDATE ON participants FOR EACH ROW EXECUTE FUNCTION update_updated_column();
CREATE TRIGGER update_test_results_updated BEFORE UPDATE ON test_results FOR EACH ROW EXECUTE FUNCTION update_updated_column();
CREATE TRIGGER update_questions_updated BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION update_updated_column();
CREATE TRIGGER update_reports_updated BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_column();
CREATE TRIGGER update_scoring_keys_updated_at BEFORE UPDATE ON scoring_keys FOR EACH ROW EXECUTE FUNCTION update_updated_column();

```

## 6. Authentication Ayarları

### 6.1 Email Authentication'ı Etkinleştirme

1. Supabase Dashboard'da "Authentication" > "Settings" sekmesine gidin
2. "Enable email confirmations" seçeneğini etkinleştirin (isteğe bağlı)
3. "Site URL" alanına projenizin URL'sini girin (örn: `http://localhost:8000`)
4. "Redirect URLs" alanına admin login sayfanızı ekleyin (örn: `http://localhost:8000/admin/login.html`)

### 6.2 Admin Kullanıcısı Oluşturma

1. "Authentication" > "Users" sekmesine gidin
2. "Add user" butonuna tıklayın
3. Admin e-posta ve şifresini girin (örn: `admin@psikolog.com`)
4. "User Metadata" alanına aşağıdaki JSON'u ekleyin:
```json
{
  "role": "admin",
  "name": "Dr. Admin"
}
```

### 6.3 Test Kullanıcıları Oluşturma

Benzer şekilde psikolog kullanıcıları da oluşturun:
- `psikolog1@psikolog.com` (şifre: `psik123`)
- `psikolog2@psikolog.com` (şifre: `psik456`)

User Metadata:
```json
{
  "role": "psychologist",
  "name": "Dr. Ayşe Yılmaz"
}
```

## 7. Row Level Security (RLS) Ayarları

```sql
-- RLS'yi etkinleştir
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Test alma için anon kullanıcılara izin (sadece insert)
CREATE POLICY "Enable test taking for anonymous users" ON participants 
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Enable test taking for anonymous users" ON test_results 
    FOR INSERT TO anon WITH CHECK (true);

-- Sorular herkese açık (sadece okuma)
CREATE POLICY "Enable read access for questions" ON questions 
    FOR SELECT USING (true);

-- Authenticated kullanıcılar için tam erişim
CREATE POLICY "Enable full access for authenticated users" ON participants 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable full access for authenticated users" ON test_results 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable full access for authenticated users" ON questions 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable full access for authenticated users" ON reports 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Admin kullanıcıları için özel politikalar (isteğe bağlı)
-- Bu politikalar daha sonra user metadata'ya göre özelleştirilebilir
```

## 7. Test Verisi Ekleme

```sql
-- Örnek test verisi
INSERT INTO questions (question_number, question_text, category) VALUES
(1, 'Okumayı severim.', 'Genel'),
(2, 'İştahım iyidir.', 'Sağlık'),
(3, 'Sabahları genellikle dinlenmiş olarak uyanırım.', 'Sağlık');

-- Örnek katılımcı
INSERT INTO participants (first_name, last_name, gender, age) VALUES
('Test', 'Kullanıcı', 'erkek', 25);
```




```sql
CREATE table if not exists public.t_score_norms (
  id            bigserial primary key,
  test_version  text        not null,                -- 'MMPI-A', 'MMPI-2', 'MMPI-2-RF' vb.
  locale        text        not null default 'TR',   -- normun kaynağı/bölgesi
  scale_name    text        not null,                -- L, F, K, Hs, D, Hy, Pd, Mf, Pa, Pt, Sc, Ma, Si, ...
  gender        text        not null check (gender in ('male','female')),
  raw_score     int         not null check (raw_score >= 0),
  t_score       int         not null check (t_score between 20 and 120),
  age_group     text,                                -- opsiyonel: 'adolescent','adult' vb. (ya da yaş aralıkları için ayrı kolonlar)
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (test_version, locale, scale_name, gender, raw_score)
);

create index if not exists idx_tnorm_lookup
  on public.t_score_norms (scale_name, gender, raw_score);


  create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;


drop trigger if exists t_score_norms_set_updated_at on public.t_score_norms;
create trigger t_score_norms_set_updated_at
  before update on public.t_score_norms
  for each row execute function public.set_updated_at();


  alter table public.t_score_norms enable row level security;

  do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='t_score_norms' and policyname='tnorm_select'
  ) then
    create policy tnorm_select on public.t_score_norms
      for select using (true);  -- herkes okuyabilir
  end if;
end $$;
```


## 8. Bağlantıyı Test Etme

### 8.1 Temel Bağlantı Testi
1. Tarayıcıda projenizi açın
2. Developer Tools'u açın (F12)
3. Console sekmesine gidin
4. Aşağıdaki mesajları görmelisiniz:
   - "Supabase başarıyla başlatıldı."
   - "Veritabanı bağlantısı başarılı."

### 8.2 Authentication Testi
1. `/admin/login.html` sayfasına gidin
2. Oluşturduğunuz admin kullanıcısı ile giriş yapmayı deneyin:
   - E-posta: `admin@psikolog.com`
   - Şifre: belirlediğiniz şifre
3. Başarılı giriş sonrası dashboard'a yönlendirilmelisiniz
4. Çıkış yaparak session'ın temizlendiğini kontrol edin

### 8.3 Test Alma Testi
1. Ana sayfadan MMPI testini başlatın
2. Kişisel bilgileri doldurun
3. Test sorularının yüklendiğini kontrol edin
4. Birkaç soruyu yanıtlayıp test sonucunun kaydedildiğini kontrol edin

## 9. Güvenlik Notları

### 9.1 API Güvenliği
- API anahtarlarınızı asla public repository'lerde paylaşmayın
- `anon` key'i sadece frontend'de kullanın, `service_role` key'ini asla frontend'e koymayın
- Production ortamında environment variables kullanın

### 9.2 Authentication Güvenliği
- Güçlü şifreler kullanın (en az 8 karakter, büyük/küçük harf, sayı, özel karakter)
- Email confirmation'ı production'da etkinleştirin
- Rate limiting ayarlarını kontrol edin
- Session timeout sürelerini uygun şekilde ayarlayın

### 9.3 RLS Politikaları
- Production ortamında RLS politikalarını daha kısıtlayıcı hale getirin
- User metadata'ya göre role-based access control (RBAC) uygulayın
- Test verilerini production'dan ayırın

### 9.4 Genel Güvenlik
- Düzenli olarak veritabanı yedeklerinizi alın
- Supabase Dashboard'dan kullanım istatistiklerinizi takip edin
- Şüpheli aktiviteleri izleyin
- HTTPS kullanımını zorunlu kılın

## 10. Sonraki Adımlar

### 10.1 Authentication Geliştirmeleri
1. **Role-based Access Control**: User metadata'ya göre daha detaylı yetki sistemi
2. **Multi-factor Authentication**: Ekstra güvenlik katmanı
3. **Social Login**: Google, Facebook gibi sosyal medya girişleri
4. **Password Policy**: Şifre karmaşıklığı kuralları

### 10.2 Uygulama Geliştirmeleri
1. **Dashboard Geliştirme**: Admin panelini Supabase authentication ile entegre edin
2. **Real-time Özellikler**: Test sonuçları için real-time güncellemeler
3. **Dosya Yükleme**: Test raporları için Supabase Storage kullanımı
4. **Performance Optimizasyonu**: İndeksler ve query optimizasyonu

### 10.3 Production Hazırlığı
1. **Environment Configuration**: Production ve development ortamları ayırın
2. **Monitoring**: Hata takibi ve performans izleme
3. **Backup Strategy**: Otomatik yedekleme sistemi
4. **SSL/HTTPS**: Güvenli bağlantı kurulumu

## Sorun Giderme

- **Bağlantı hatası**: URL ve API key'i kontrol edin
- **CORS hatası**: Supabase dashboard'da domain'inizi ekleyin
- **RLS hatası**: Politikaları kontrol edin
- **SQL hatası**: Syntax'ı kontrol edin ve adım adım çalıştırın