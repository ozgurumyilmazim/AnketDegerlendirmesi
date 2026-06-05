-- Settings tablosunu oluştur
CREATE TABLE IF NOT EXISTS kvkk (
    id SERIAL PRIMARY KEY,
    kvkk_title TEXT,
    kvkk_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Varsayılan KVKK ayarlarını ekle
INSERT INTO kvkk (id, kvkk_text, kvkk_required) VALUES (
    1,
    '<h4 class="text-center mb-4">MİNNESOTA ÇOK YÖNLÜ KİŞİLİK ENVANTERİ (MMPI) TESTİ</h4>
<h5 class="text-center mb-4">KİŞİSEL VERİLERİN KORUNMASI KANUNU HAKKINDA AÇIKLAMALAR VE MUVAFAKATNAME</h5>

<h6><strong>1. BİLGİLENDİRME</strong></h6>
<p>MMPI Testinin açılımı Minnesota Çok Yönlü Kişilik Envanteri. Bu test bireyin kişisel ve toplumsal uyumunu objektif olarak değerlendirmeyi amaçlayan bir testtir.</p>

<h6><strong>Veri Sorumlusu</strong></h6>
<p>6638 sayılı Kişisel Verilerin Korunması Kanunu ("6698 sayılı Kanun") uyarınca, kişisel verileriniz; veri sorumlusu olarak OGULTURK AŞ ("ŞİRKET") tarafından aşağıda açıklanan kapsamda toplanacak, işlenebilecek ve ilgili birim sorumlusu ile paylaşılacaktır.</p>
<p>Şirketimiz, katılımcılara ilişkin kişisel veriler bakımından 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında "veri sorumlusu" sıfatına sahip olup işbu Aydınlatma Metni ile söz konusu Kanun uyarınca katılımcıların Şirket tarafından gerçekleştirilen kişisel veri işleme faaliyetleri hakkında aydınlatılması hedeflenmektedir.</p>

<h6><strong>İşlemenin Amacı</strong></h6>
<p>MMPI kişilik testi, bu alanda kişiliği tespitte kullanılacak en güvenilir ve geçerli olma özelliğine sahiptir. Bu kapsamda ve güvenirlik düzeyinde ülkemizde uygulanan başka bir test mevcut değildir. MMP kişilik testi dünyanın tek ve en güvenilir bilimsel kişilik testidir, kişiyi objektif ve derinlemesine tanımasını sağlar, psikolojik yetkinliğinizi tespit eder, işe en uygun personeli en güvenilir şekilde seçmenize olanak tanır.</p>
<p>Yüksek öneme sahip ve üst düzey kamu görevlilerinin seçimi, polis memuru alımları ve birim değişikliklerinde yapılacak seçimler, silah taşma yetkisi verilmiş kişilerde, koruma ve danışmanlar, cezai ve hukuki ehliyetin olup olmadığına yönelik tespit yapılacak kişiler ve adli yargı adaylarını değerlendirme ve seçme işlemlerinde kullanılır.</p>
<p>Bu kapsamda "Minnesota Çok Yönlü Kişilik Envanteri" başlıklı test, uygulayıcı belgesi alan psikolog tarafından uygulanması, sonuçlarının standart MMPI değerlendirme programı ve gerektiğinde manuel olarak elle değerlendirilmesi gerekir. Araştırma sırasında elde edilecek bilgiler gizli tutulacak ve sadece riskleri önleme amaçlı kullanılacaktır.</p>

<h6><strong>İşlemenin Hukuki Dayanağı</strong></h6>
<p>Kişisel verileriniz/özel nitelikli kişisel verileriniz şirket çalışanlarının veya çalışan adaylarının doğru pozisyonlarda görevlendirilmesini sağlayabilmek için özgür iradenize dayanan açık rızanıza dayanılarak işlenecektir.</p>
<ul>
    <li>Psikolojik yetkinliğinizi tespit etmek,</li>
    <li>İşe en uygun personeli seçmek,</li>
    <li>Riskleri önlemek ve daha kaliteli hizmet sağlamak</li>
</ul>

<h6><strong>İşlenecek Kişisel Veriler ve Özel Nitelikli Kişisel Veriler</strong></h6>
<p>İşbu Test ile;</p>
<ul>
    <li>Kimlik bilgisi,</li>
    <li>İletişim bilgisi,</li>
    <li>Ailevi bilgiler,</li>
    <li>Sağlık bilgileri,</li>
</ul>
<p>gibi kategorilerde kişisel veri toplanabilmektedir.</p>

<h6><strong>Kişisel Verileri Toplamanın ve İşlemenin Yöntemi</strong></h6>
<p>Kişisel verileriniz MMPI test formları ile toplandıktan sonra kapalı zarf içinde tutulacaktır. Veriler psikolog tarafından MMPI programına işlenecektir. Analizler gerçekleştikten sonra sonuç raporları kapalı zarf içinde KVKK gereğince uygun şekilde saklanacaktır.</p>

<h6><strong>Veri Sahiplerinin Kişisel Verilerinin Güvenliğinin Sağlanması İçin Alınan Tedbirler</strong></h6>
<p>6698 Sayılı Kişisel Verileri Koruma Kanun''un 12. maddesine uygun olarak, Şirket tarafından veri güvenliğinin sağlanması için,</p>
<ul>
    <li>Kişisel venlerin hukuka aykırı olarak işlenmesini önlemek,</li>
    <li>Kişisel verilere hukuka aykırı olarak erişilmesini önlemek,</li>
    <li>Kişisel verilerin muhafazasını sağlamak,</li>
</ul>
<p>Amacıyla lüzumlu olan güvenlik düzeyini temin etmeye yönelik gerekli her türlü teknik ve idari tedbirler alınmaktadır.</p>

<h6><strong>Kişisel Verileriniz ile İlgili Haklarınız</strong></h6>
<p>Kişisel veri sahipleri olarak, haklarınıza ilişkin taleplerinizi aşağıda düzenlenen yöntemlerle iletmeniz durumunda ŞİRKET talebin niteliğine göre talebi en kısa sürede ve en geç otuz gün içinde sonuçlandıracaktır. Bu kapsamda kişisel veri sahipleri;</p>
<ul>
    <li>Kişisel veri işlenip işlenmediğini öğrenme,</li>
    <li>Kişisel verileri işlenmişse buna ilişkin bilgi talep etme,</li>
    <li>Kişisel verilerin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
    <li>Yurt içinde kişisel verilerin aktarıldığı üçüncü kişileri bilme,</li>
    <li>Kişisel verilerin eksik veya yanlış işlenmiş olması halinde bunların düzeltilmesini isteme,</li>
    <li>Kişisel verilerin silinmesini veya yok edilmesini isteme,</li>
    <li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle kişinin kendisi aleyhine bir sonucun ortaya çıkmasına itiraz etme,</li>
    <li>Kişisel verilerin kanuna aykırı olarak işlenmesi sebebiyle zarara uğraması halinde zararın giderilmesini talep etme haklarına sahiptir.</li>
</ul>

<h6><strong>Kişisel Verileriniz ile İlgili Başvurularınız</strong></h6>
<p>Yazılı olarak yapmak istediğiniz başvurularınızı, gerekli belgeleri ekleyerek veri sorumlusu olarak Şirketimizin Yenice, Soğuksu Caddesi no:68, 06890 Kızılcahamam/ANKARA adresine verebilir, başvuru formuna Şirketimizin ilgili biriminden erişebilirsiniz.</p>
<p>E-posta yoluyla yapmak istediğiniz başvurularınızı ogulturkselma@gmail.com adresine yapabilirsiniz.</p>',
    true
) ON CONFLICT (id) DO NOTHING;

-- Updated_at trigger'ı oluştur
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_kvkk_updated_at BEFORE UPDATE ON kvkk
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();