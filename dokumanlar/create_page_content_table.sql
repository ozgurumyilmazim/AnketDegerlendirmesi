-- ============================================================
-- Sayfa İçerikleri Tablosu (anasayfa, hakkimizda, gizlilik, kullanim)
-- ============================================================
CREATE TABLE IF NOT EXISTS page_content (
    id SERIAL PRIMARY KEY,
    page_key VARCHAR(50) UNIQUE NOT NULL,
    page_title VARCHAR(255) NOT NULL DEFAULT '',
    page_subtitle TEXT DEFAULT '',
    page_body TEXT DEFAULT '',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Varsayılan kayıtları ekle (çakışma varsa dokunma)
INSERT INTO page_content (page_key, page_title, page_subtitle, page_body) VALUES
('gizlilik', 'Gizlilik Politikası', 'Kişisel verilerinizin nasıl toplandığı, işlendiği ve korunduğu hakkında bilgi',
'<h4>1. Veri Sorumlusu</h4>
<p>6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kişisel verileriniz; veri sorumlusu olarak <strong>OGULTURK A.Ş.</strong> ("Şirket") tarafından aşağıda açıklanan kapsamda toplanacak, işlenecek ve ilgili birim sorumlusu ile paylaşılacaktır.</p>

<h4>2. Toplanan Veriler</h4>
<p>MMPI-2 test sürecinde aşağıdaki kişisel verileriniz toplanmaktadır:</p>
<ul>
    <li>Ad ve soyad</li>
    <li>TC Kimlik No</li>
    <li>Cinsiyet</li>
    <li>Yaş</li>
    <li>Eğitim seviyesi</li>
    <li>Medeni durum</li>
    <li>Meslek ve kurum bilgisi</li>
    <li>MMPI-2 test yanıtları</li>
</ul>

<h4>3. Verilerin İşlenme Amacı</h4>
<p>Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</p>
<ul>
    <li>MMPI-2 psikolojik değerlendirme testinin uygulanması</li>
    <li>Test sonuçlarının hesaplanması ve raporlanması</li>
    <li>Psikolojik değerlendirme hizmetinin sunulması</li>
    <li>Yasal yükümlülüklerin yerine getirilmesi</li>
    <li>Hizmet kalitesinin artırılması</li>
</ul>

<h4>4. Verilerin Saklanma Süresi</h4>
<p>Kişisel verileriniz, ilgili mevzuat ve test hizmetinin gerektirdiği süre boyunca (2 yıl) saklanmakta, bu sürenin sonunda anonim hale getirilmekte veya silinmektedir.</p>

<h4>5. Verilerin Aktarılması</h4>
<p>Kişisel verileriniz, yalnızca yetkili psikologlar ve ilgili birim sorumluları tarafından görüntülenebilir. Üçüncü kişilerle yasal zorunluluk olmadıkça paylaşılmaz.</p>

<h4>6. KVKK Kapsamındaki Haklarınız</h4>
<p>6698 sayılı Kanun''un 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
<ul>
    <li>Kişisel verinizin işlenip işlenmediğini öğrenme</li>
    <li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme</li>
    <li>Kişisel verilerinizin işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
    <li>Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme</li>
    <li>Kişisel verilerin eksik veya yanlış işlenmiş olması halinde bunların düzeltilmesini isteme</li>
    <li>Kişisel verilerin silinmesini veya yok edilmesini isteme</li>
</ul>

<h4>7. İletişim</h4>
<p>KVKK kapsamındaki haklarınızı kullanmak veya sorularınızı iletmek için <strong>ogulturkselma@gmail.com</strong> adresine e-posta gönderebilirsiniz.</p>'),

('kullanim', 'Kullanım Koşulları', 'MMPI psikolojik test sistemini kullanırken uymanız gereken kurallar',
'<h4>1. Hizmetin Kapsamı</h4>
<p>OGULTURK A.Ş. tarafından sunulan MMPI (Minnesota Çok Yönlü Kişilik Envanteri) psikolojik test sistemi, bireylerin kişisel ve toplumsal uyumlarını objektif olarak değerlendirmeyi amaçlayan bir dijital uygulamadır. Bu hizmet yalnızca psikolojik değerlendirme amacıyla kullanılmalıdır.</p>

<h4>2. Kullanıcı Sorumlulukları</h4>
<p>Kullanıcılar aşağıdaki kurallara uymakla yükümlüdür:</p>
<ul>
    <li>Kişisel bilgilerini doğru ve eksiksiz doldurmak</li>
    <li>Test sorularını dürüst ve içten yanıtlamak</li>
    <li>Başka bir kişi adına testi yanıtlamamak</li>
    <li>Test sürecinde üçüncü kişilerden yardım almamak</li>
    <li>18 yaşından büyük olduğunu beyan etmek</li>
</ul>

<h4>3. Fikri Mülkiyet</h4>
<p>MMPI-2 envanterinin tüm hakları ilgili yayınevlerine aittir. Web sitesinde yer alan tüm yazılım, tasarım ve içerik OGULTURK A.Ş. mülkiyetindedir. İzinsiz kopyalama, dağıtma veya ticari amaçla kullanma yasaktır.</p>

<h4>4. Sorumluluğun Sınırlanması</h4>
<p>OGULTURK A.Ş., test sonuçlarının yorumlanmasından doğabilecek doğrudan veya dolaylı zararlardan sorumlu değildir. Test sonuçları yalnızca yetkili psikologlar tarafından yorumlanmalıdır.</p>

<h4>5. Hizmet Kesintisi</h4>
<p>OGULTURK A.Ş., teknik bakım, güncelleme veya mücbir sebepler nedeniyle hizmeti geçici olarak durdurma hakkını saklı tutar. Bu durumlarda kullanıcılara önceden bildirim yapılmaya çalışılır.</p>

<h4>6. Değişiklikler</h4>
<p>Bu kullanım koşulları önceden haber verilmeksizin değiştirilebilir. Değişiklikler, web sitesinde yayınlandığı tarihte yürürlüğe girer. Kullanıcıların güncel koşulları takip etmesi önerilir.</p>

<h4>7. İletişim</h4>
<p>Kullanım koşulları ile ilgili sorularınız için <strong>ogulturkselma@gmail.com</strong> adresine e-posta gönderebilirsiniz.</p>'),

('hakkimizda', 'Hakkımızda', 'OGULTURK A.Ş. ve MMPI Psikolojik Değerlendirme Sistemi',
'<div class="row justify-content-center mb-5">
    <div class="col-lg-8 text-center">
        <h2 class="section-title">Biz Kimiz?</h2>
        <p class="text-muted" style="font-size:1.1rem; line-height:1.8;">
            OGULTURK A.Ş. olarak, bireylerin kişisel ve toplumsal uyumlarını
            objektif bir şekilde değerlendirmek amacıyla MMPI-2 (Minnesota Çok
            Yönlü Kişilik Envanteri) test hizmeti sunuyoruz. Bilimsel temelli
            bu değerlendirme aracını, modern teknoloji ile birleştirerek
            güvenilir ve hızlı sonuçlar elde etmenizi sağlıyoruz.
        </p>
    </div>
</div>
<div class="row g-4">
    <div class="col-md-6">
        <div class="about-card">
            <div class="about-icon"><i class="fas fa-bullseye"></i></div>
            <h4 class="fw-bold mb-3">Misyonumuz</h4>
            <p class="text-muted mb-0">MMPI-2 envanterini en güvenilir ve erişilebilir şekilde sunarak, psikologlar ve uzmanlar için objektif kişilik değerlendirme sürecini dijital ortama taşımak. Bireylerin kendilerini daha iyi tanımalarına yardımcı olmak.</p>
        </div>
    </div>
    <div class="col-md-6">
        <div class="about-card">
            <div class="about-icon"><i class="fas fa-eye"></i></div>
            <h4 class="fw-bold mb-3">Vizyonumuz</h4>
            <p class="text-muted mb-0">Türkiye''de psikolojik değerlendirme alanında dijital dönüşüme öncülük etmek. Bilimsel standartlara uygun, güvenli ve kullanıcı dostu bir platform ile psikoloji alanında kaliteyi artırmak.</p>
        </div>
    </div>
    <div class="col-md-6">
        <div class="about-card">
            <div class="about-icon"><i class="fas fa-handshake"></i></div>
            <h4 class="fw-bold mb-3">Değerlerimiz</h4>
            <p class="text-muted mb-0">Gizlilik, güvenilirlik ve bilimsellik temel değerlerimizdir. Kişisel verilerin korunmasına azami özen gösterir, her bireyin mahremiyetine saygı duyarız. Tüm süreçlerimiz KVKK ve etik kurallar çerçevesinde yürütülür.</p>
        </div>
    </div>
    <div class="col-md-6">
        <div class="about-card">
            <div class="about-icon"><i class="fas fa-flask"></i></div>
            <h4 class="fw-bold mb-3">MMPI-2 Hakkında</h4>
            <p class="text-muted mb-0">567 maddeden oluşan MMPI-2, dünya genelinde en yaygın kullanılan objektif kişilik testidir. 10 temel klinik ölçek ve çeşitli geçerlilik ölçekleri ile kapsamlı bir profil sunar.</p>
        </div>
    </div>
</div>'),

('ana-sayfa', 'Ana Sayfa', 'MMPI-2 Psikolojik Değerlendirme Sistemi',
'<section class="hero-section">
    <div class="container position-relative">
        <div class="row align-items-center">
            <div class="col-lg-7">
                <h1 class="hero-title mb-4">MMPI Psikolojik<br>Değerlendirme Sistemi</h1>
                <p class="hero-subtitle mb-4">Minnesota Çok Yönlü Kişilik Envanteri (MMPI-2) ile bireyin kişisel ve toplumsal uyumunu objektif olarak değerlendirin. Bilimsel temelli psikolojik test hizmetimizi güvenle kullanın.</p>
                <div class="d-flex flex-wrap gap-3">
                    <a href="testebasla.html" class="hero-cta"><i class="fas fa-play me-2"></i>Teste Başla</a>
                    <a href="hakkimizda.html" class="btn btn-outline-light btn-lg px-4 py-3 rounded-pill"><i class="fas fa-info-circle me-2"></i>Daha Fazla Bilgi</a>
                </div>
            </div>
            <div class="col-lg-5 text-center d-none d-lg-block">
                <i class="fas fa-clipboard-check" style="font-size:12rem; opacity:0.3;"></i>
            </div>
        </div>
    </div>
</section>
<section class="py-5 bg-light">
    <div class="container py-4">
        <div class="text-center">
            <h2 class="section-title">MMPI-2 Testi Nedir?</h2>
            <p class="section-subtitle">MMPI (Minnesota Çok Yönlü Kişilik Envanteri), dünya genelinde en yaygın kullanılan objektif kişilik değerlendirme araçlarından biridir.</p>
        </div>
        <div class="row g-4">
            <div class="col-md-4">
                <div class="feature-card">
                    <div class="feature-icon"><i class="fas fa-flask"></i></div>
                    <h4 class="fw-bold mb-3">Bilimsel Temelli</h4>
                    <p class="text-muted mb-0">567 sorudan oluşan MMPI-2 envanteri, onlarca yıllık araştırma ve klinik deneyime dayanmaktadır.</p>
                </div>
            </div>
            <div class="col-md-4">
                <div class="feature-card">
                    <div class="feature-icon"><i class="fas fa-shield-alt"></i></div>
                    <h4 class="fw-bold mb-3">Güvenilir Sonuçlar</h4>
                    <p class="text-muted mb-0">Yerleşik doğruluk ölçekleri (VRIN, TRIN, L, K) ile geçersiz yanıtlar tespit edilir, güvenilir profil elde edilir.</p>
                </div>
            </div>
            <div class="col-md-4">
                <div class="feature-card">
                    <div class="feature-icon"><i class="fas fa-lock"></i></div>
                    <h4 class="fw-bold mb-3">Veri Gizliliği</h4>
                    <p class="text-muted mb-0">Kişisel verileriniz KVKK kapsamında korunur, yalnızca yetkili psikologlar tarafından görüntülenir.</p>
                </div>
            </div>
        </div>
    </div>
</section>
<section class="py-5">
    <div class="container py-4">
        <div class="text-center">
            <h2 class="section-title">Test Nasıl Uygulanır?</h2>
            <p class="section-subtitle">Dört basit adımda MMPI-2 testinizi tamamlayın.</p>
        </div>
        <div class="row g-4">
            <div class="col-md-3">
                <div class="step-card text-center">
                    <div class="step-number mx-auto">1</div>
                    <h5 class="fw-bold mb-2">Kişisel Bilgiler</h5>
                    <p class="text-muted mb-0 small">Ad, soyad, yaş ve diğer temel bilgilerinizi girerek teste başlayın.</p>
                </div>
            </div>
            <div class="col-md-3">
                <div class="step-card text-center">
                    <div class="step-number mx-auto">2</div>
                    <h5 class="fw-bold mb-2">KVKK Onayı</h5>
                    <p class="text-muted mb-0 small">Kişisel verilerin işlenmesine ilişkin aydınlatma metnini okuyup onaylayın.</p>
                </div>
            </div>
            <div class="col-md-3">
                <div class="step-card text-center">
                    <div class="step-number mx-auto">3</div>
                    <h5 class="fw-bold mb-2">Testi Yanıtlayın</h5>
                    <p class="text-muted mb-0 small">567 soruyu "Doğru", "Yanlış" ya da "Bilmiyorum" olarak işaretleyin.</p>
                </div>
            </div>
            <div class="col-md-3">
                <div class="step-card text-center">
                    <div class="step-number mx-auto">4</div>
                    <h5 class="fw-bold mb-2">Raporu Görüntüleyin</h5>
                    <p class="text-muted mb-0 small">Test tamamlandığında detaylı kişilik profili raporunuz hazır olur.</p>
                </div>
            </div>
        </div>
    </div>
</section>
<section class="py-5 bg-light">
    <div class="container py-4">
        <div class="text-center">
            <h2 class="section-title">Kişisel Verilerin Korunması</h2>
            <p class="section-subtitle">6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında verileriniz güvendedir.</p>
        </div>
        <div class="row justify-content-center">
            <div class="col-lg-10">
                <div class="kvkk-banner">
                    <div class="row align-items-center">
                        <div class="col-lg-3 text-center mb-3 mb-lg-0">
                            <i class="fas fa-shield-halved" style="font-size:4rem; color:#667eea;"></i>
                        </div>
                        <div class="col-lg-9">
                            <h5 class="fw-bold">Veri Sorumlusu: OGULTURK A.Ş.</h5>
                            <p class="text-muted mb-2">Kişisel verileriniz, 6698 sayılı Kanun uyarınca veri sorumlusu sıfatına sahip OGULTURK A.Ş. tarafından toplanmakta, işlenmekte ve ilgili birim sorumlusu ile paylaşılmaktadır.</p>
                            <p class="text-muted mb-0">Verileriniz yalnızca psikolojik değerlendirme amacıyla kullanılır, 2 yıl süreyle muhafaza edilir ve üçüncü kişilerle paylaşılmaz. Detaylı bilgi için <a href="gizlilik.html">Gizlilik Politikası</a> sayfamızı ziyaret edebilirsiniz.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>
<section class="py-5" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
    <div class="container py-4 text-center text-white">
        <h2 class="fw-bold mb-3" style="font-size:2rem;">Teste Başlamaya Hazır mısınız?</h2>
        <p class="mb-4" style="font-size:1.1rem; opacity:0.95;">Yaklaşık 60-90 dakika süren MMPI-2 testini hemen uygulamaya başlayın.</p>
        <a href="testebasla.html" class="hero-cta"><i class="fas fa-play me-2"></i>Teste Başla</a>
    </div>
</section>')
ON CONFLICT (page_key) DO NOTHING;
