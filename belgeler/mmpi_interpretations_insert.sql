-- MMPI Interpretations Insert Statements
-- Bu dosya yeni_tablo_verileri.md dosyasındaki verilere dayanarak oluşturulmuştur

-- L (Yalan) Alt Testi
INSERT INTO mmpi_interpretations (scale_name, min_t_score, max_t_score, description, category) VALUES
('L', 69, 100, 'Kişi sosyal açıdan kabul gören yanıtlar vererek kendini kontrol eden, etkili biri olduğu izlenimi bırakmaya çalışıyor olabilir. Güvenilmez, pasif, uzak duran, kaygılı, içe kapanık bir yapıya sahip olabilir. Diğerleriyle ilişki kurmaları zor olabilir. Duruma özgü tepkileri yavaş olduğu düşünülebilir.', 'validity'),
('L', 64, 68, 'Kişi Maddeleri gelişi güzel doldurmuş olabilir. Kişi kendindeki zayıflıkları inkâr ediyor olabilir.Kişi patolojik olarak kendinde ki iyi ve ahlaki inanç ve eğilimleri nedeniyle kendine aşırı kontrol koyabilir. Ufak hatalarını bile inkâr etme eğiliminde olabilir.', 'validity'),
('L', 59, 63, 'Kişi iyi görünme çabası içerisinde olduğu düşünülebilir. Kişide sosyal açıdan kabul gören yanıtlar verme eğilimi olabilir. Kişinin aşırı geleneksel ve sosyal açıdan uyumlu olduğu düşünülebilir.', 'validity'),
('L', 36, 58, 'Bu aralığa ilişkin özgün bir durum tanımlanmamıştır.', 'validity'),
('L', 0, 35, 'Bağımsız, kendine güvenen, ufak sosyal hatalarını kabul etmeye hazır bir yapısı olabilir. Kişi ya kendini oldukça patolojik göstermeye çalışıyor olabilir ya da bağımsız kendine güvenen, eksiklilerden açıkça bahseden, sosyal kurallara önem vermeyen normal bir insan olabilir.', 'validity');

-- F (Sıklık) Alt Testi
INSERT INTO mmpi_interpretations (scale_name, min_t_score, max_t_score, description, category) VALUES
('F', 70, 100, 'Geçersiz profil - Test sonuçları güvenilir değildir.', 'validity'),
('F', 55, 69, 'Kişi negativist, değişken, huysuz ve huzursuz olabilir. Durumsal stresi olduğu düşünülebilir.', 'validity'),
('F', 44, 54, 'Kişi sadece belirgin maddelere yanıt vermiş olabilir. Kişinin ilgi alanlarının daraldığı düşünülebilir. Kişi psikopatolojiyi, duygusal gerginliği gizliyor olabilir, direnç sahibi olabilir.', 'validity'),
('F', 0, 43, 'Kişi herhangi bir psikopatoloji, gerginlik ya da stresi olmadığı görünümünü vermek istiyor olabilir.', 'validity');

-- K (Düzeltme) Alt Testi
INSERT INTO mmpi_interpretations (scale_name, min_t_score, max_t_score, description, category) VALUES
('K', 72, 100, 'Kişi savunucu olabilir. Kendinde psikolojik sorunlar olduğunu kabul etmeyebilir. Katı ve esnek olabilir. Kendisindeki sorunu kabul etmek istemeyebilir. Tedaviye yanıtının kötü olduğu düşünülebilir.', 'validity'),
('K', 61, 71, 'Kişi kendisindeki ve çevresindeki bozuklukları en aza indirgeme ve görmezden gelme eğiliminde olabilir. İç görüsü az olabilir ve savunmaları artmış olabilir.', 'validity'),
('K', 46, 60, 'Kişinin dengeli bir yapısı olabilir. Kişinin ego gücü iyi, olumlu kendilik değerine ve uyuma işaret edebilir. Kişinin psikolojik müdahaleyi istemek için yeterli kişisel kaynakları olduğu düşünülebilir. Kişinin uygun bir başa çıkma becerisi olabilir.', 'validity'),
('K', 27, 45, 'Kişinin zayıf kendilik değeri olabilir. Kişi kendinden hiç memnun olmayabilir. Kişi durumları değiştirecek gerekli kişiler arası beceri ve niteliklerden yoksun olabilir. Orta ve üst yaş düzeydeki kişilerde ego gücü düşmüş olabilir, savunmaları uygunsuz olabilir.', 'validity'),
('K', 0, 26, 'Kişinin çok zayıf kendilik değeri olabilir. Kişi kendinden hiç memnun olmayabilir ve ciddi uyum sorunları yaşayabilir.', 'validity');

-- Hs (Hipokondriazis) Alt Testi
INSERT INTO mmpi_interpretations (scale_name, min_t_score, max_t_score, description, category) VALUES
('Hs', 75, 84, 'Kişi bedensel yakınmalar ile çok fazla uğraşabilir. Genel olarak iş yapma isteği azalmış, yakınmalarının bedensel kaynağını sürekli bir biçimde araştırabilir. Sıklıkla benmerkezcil ve narsist olabilir. Sürekli şikâyet edebilir ve sızlanabilir. Yakınmalarını diğerlerine kabul ettirme eğilimleri çok fazla olabilir, bu nedenle aşırı talep edici bir tutum içinde olabilir. Çevrelerindekileri rahatsız ederek öfkelerini ortaya çıkarabilir. Tipik olarak inatçı, kötümser, genel olarak yaşamda mutsuz, tutkusuz ve güdülenmemiş olabilir.', 'clinical'),
('Hs', 60, 74, 'Kişi hem şimdiki hem de geçmiş yaşantısında fiziksel bozukluk göstermiş olabilir. Sağlık konularına olan ilgi, basit olarak yapıcı bir ilgi olabilir ya da sağlığa aşırı duyarlılığı temsil edebilir. Kişi kötümser olmaya ve yaşamını sıkıcı hale getirmeye eğilimli olabilir. (Bedensel hastalığı olan bireylerde 65 T puanının üstünde bir yükselme bu bireylerin yaşadıkları güçlüklere aşırı tepki verdiklerini ve kabul edilmez dürtülerini somatizasyon ile ifade ettiklerini göstermektedir.)', 'clinical'),
('Hs', 50, 59, 'Kişi sıklıkla yetenekli, sorumluluk sahibi, vicdanlı, dikkatli ve yargılamaları iyi olan bir yapıya sahip olabilir. Spesifik tıbbi rahatsızlığı bulunabilir. (Spesifik tıbbi hastalığı olan bireyler bu alanda yer almaktadır.)', 'clinical'),
('Hs', 21, 49, 'Kişi hastalığın hiç konu olmadığı ailelerde yetişmiş olabilir. Kişi şimdiye kadar hiç acı, ağrı ya da hastalık geçirmediği ile övünen bir yapıda olabilir. Kişi hipokondriyak olarak hastalıklarını manipülatif bir yolla kullanan aile üyeleriyle yakından ilişkili olabilir, kişi normal acısını ve ağrısını da inkar edebilir.Genellikle uyanık, iyimser, yeterli ve yaşamda etkin olan kişiler olabilir.', 'clinical'),
--('Hs', 0, 20, 'Kişi sağlık konularında hiç endişe duymayabilir. Kişi fiziksel şikayetleri görmezden gelebilir.', 'clinical');

-- D (Depresyon) Alt Testi
INSERT INTO mmpi_interpretations (scale_name, min_t_score, max_t_score, description, category) VALUES
('D', 70, 79, 'Kişi ciddi ve kendine güveni olmayan bir yapıya sahip olabilir. Kişinin belirgin bir depresyonu olabilir. Kişi en küçük bir şey karşısında bile endişe duyma eğilimi içinde olabilir. Kişinin bu alanda yaşadığı huzursuzluk onun iyileşme için motive olduğunun göstergesi olabilir. Eğer o an durumsal baskılar yoksa ve özellikle L de yükselmiş ise bu bireyler, tipik olarak iyi ve kötü ya da doğru ve yanlış biçiminde düşünürler. Psikiyatrik hastalar bu ranjda yer alırlar. Hastada depresyonun göstergeleri yoksa ve diğer alt testler yükselmemişse hastanın intihar eğilimi açısından değerlendirilmesi gerekmektedir.', 'clinical'),
('D', 60, 69, 'Kişide orta düzey depresyon görülebilir. Endişe ve karamsarlık göstergesi olabilir. Bu duygu durum hali, durumsal bir krize bağlı olabileceği gibi kalıcı ve geri dönüşü olmayan bir durumda olabilir.', 'clinical'),
('D', 45, 59, 'Kişi yaşamında iyimserlik ve karamsarlık dengesini kurmuş olabilir.', 'clinical'),
('D', 28, 44, 'Pozitif: Kişi olasılıkla neşeli, meraklı, iyimser, aktif ve dışa dönük bir yapıya sahip olabilir. Kişi bazen kayıtsız gibi algılanabilir.

Sadece D alt testinin yükselmesi: Sadece D alt testi 70 T puanının üstüne çıktığında birey reaktif depresyon yaşamaktadır. Yetersiz, güvensizdir, kendini cezalandırarak suçluluk duygularından kurtulma çabası içerisindedir ve çok fazla kaygılıdır, kendini eleştirir, sanki yaşadığı durum ya da bunu kontrol edememe için bir kefaret (ceza) ödeyecekmiş gibi. Birey depresif olduğunu (bu duygudurum başkaları için çok açık olabildiği halde) inkâr edecektir.', 'clinical'),
--('D', 0, 27, 'Kişi aşırı iyimser ve neşeli olabilir. Kişi gerçekçi olmayan bir şekilde pozitif olabilir.', 'clinical');

-- Hy (Histeri) Alt Testi
INSERT INTO mmpi_interpretations (scale_name, min_t_score, max_t_score, description, category) VALUES
('Hy', 70, 75, 'Kişi bastırma ve inkarı çok fazla kullanabilir, çok fazla itaat eden (uyan), saf ve çocukçu biçimde benmerkezcil, anksiyete ile bağlantılı somatik yakınmaları olabilen ya da bunların hepsine sahip olabilen bir kişi olabilir. Histeroid mekanizmaları kullanabilir ve bunlarla ikincil kazanç elde edebilir. Kişi çok fazla sevgi, kabul ve destek isteyebilirler ve çok aktif( yüzeysel olsa da) sosyal yaşamı olabilir. Davranışları konusunda iç görüleri oldukça az olabilir. İnkâr ve bastırmayı aşırı bir biçimde kullanabilir. Sevilmeye olan güçlü gereksinime bağlı olarak bağlanma gerektiren durumlarda verdiği ilk tepki genellikle coşkulu olabilir. Hemen ya da daha sonra kendilerinden istenen konusunda kızgın ve kinci olabilirler ve genellikle pasif biçimde dirençli olabilir. Sızlanıp yakınabilir ve kendisini bu durumdan uzaklaştıracak somatik şikâyetleri olabilir.', 'clinical'),
('Hy', 60, 69, '1.	Eğer Hs’nin yükselmesi Hy ile aynı düzeyde ise ve D alt testi, 1 ve 3 alt testinden 10 T puanı düşük ise histerik kişiye işaret etmektedir. Stres sırasında somatizasyona sığınma görülebilir.
2.	Eğer Hy alt testi Hs alt testinden 10 T puanı yüksek ise histerik özellikler belirgindir. Bu bireyler kendine odaklaşmıştır. Kendilerini olduğundan, farklı ve mükemmel kişiler olarak görmek isterler. Kişilerarası ilişkilerde iç görü azlığı vardır. 
Kişi kendine odaklanmış olabilir. Kendilerini olduğundan farklı ve mükemmel bir kişi olarak göstermek isteyebilir Kişilerarası ilişkilerde iç görü azlığı olabilir.
', 'clinical'),
('Hy', 45, 59, 'Bu alana özgü bir tanımlama yoktur.', 'clinical'),
('Hy', 24, 44, 'Kişi kendisini sürekli eleştirebilir. Olumlu kişiler arası ilişkileri inkâr etme eğilimi olabilir.', 'clinical'),
--('Hy', 0, 23, 'Kişi aşırı eleştirel olabilir. Kişi sosyal ilişkilerde soğuk ve mesafeli olabilir.', 'clinical');

-- Pd (Psikopatik Sapma) Alt Testi
INSERT INTO mmpi_interpretations (scale_name, min_t_score, max_t_score, description, category) VALUES
--('Pd', 70, 100, 'Kişi antisosyal davranışlar sergileyebilir. Kişi kurallara uymakta zorlanabilir. Kişi dürtü kontrolü sorunları yaşayabilir.', 'clinical'),
('Pd', 60, 69, 'Pozitif: Kişi risk alabilen, enerjik, sosyal, maceraperest ve atılgan olan biri olabilir. Kişi engellendiğinde özellikle huzursuzluk, saldırganlık ve sosyal olarak uyumlu olmayan davranış biçimi sergileyebilir.', 'clinical'),
('Pd', 45, 59, 'Kişide aşırı kontrol koyma ve kısıtlama genellikle az olabilir. Sosyal kurallara kısmen uyum gözükebilir.', 'clinical'),
('Pd', 20, 44, 'Kişi durağan, pasif ve atılgan olmayan bir yapıya sahip olabilir. Maceraperest olmayabilirler ve genellikle sosyal geleneklere uyma konusunda bağımlı ve hatta katı bir tutum sergileyebilirler. Danışma durumunda başkalarının onlara karşı olan düşünceleri konusunda güvence arayabilirler. Çok sevgi dolu olsalar da, sıklıkla cinsel ilişkiye girme konusunda girişken olmayabilirler.', 'clinical'),
--('Pd', 0, 19, 'Kişi aşırı uyumlu ve pasif olabilir. Kişi sosyal kurallara katı bir şekilde bağlı olabilir.', 'clinical');

-- Mf (Kadınlık-Erkeklik) Alt Testi - Erkekler
INSERT INTO mmpi_interpretations (scale_name, min_t_score, max_t_score, description, category, gender) VALUES
('Mf', 80, 100, 'Lise eğitimi olan erkeklerde ya da kültürel baskı altındakilerde kültürün verdiği erkeksi rolle özdeşim olmadığını göstermektedir. Yüksek puanlar göreceli olarak pasif erkeklere (eğer 4 alt testi de düşükse) hatta bazı durumlarda kadınsı özelliklere sahip olanlara işaret etmektedir.', 'clinical', 'male'),
--('Mf', 41, 79, 'Erkeklerde orta düzey feminen özellikler gösterebilir. Kişi sanatsal ve estetik ilgilere sahip olabilir.', 'clinical', 'male'),
('Mf', 26, 40, 'Kişide  maskülen görünmek için kompulsif bir uğraş olabilir ve bu abartılmış bir boyutta olabilir. Narsistik bir biçimde kendi güçlerini abartabilirler. Bireyin kendi erkekliğini yoğun bir biçimde ortaya koyması, altta yatan kendine güvensizlik ile ilgili olabilir.', 'clinical', 'male'),
--('Mf', 0, 25, 'Kişi aşırı maskülen özellikler gösterebilir. Kişi geleneksel erkek rolüne aşırı bağlı olabilir.', 'clinical', 'male');

-- Mf (Kadınlık-Erkeklik) Alt Testi - Kadınlar
INSERT INTO mmpi_interpretations (scale_name, min_t_score, max_t_score, description, category, gender) VALUES
('Mf', 65, 100, 'Bu kadınlar güçlü, kuvvetli, saldırgan, yönlendirici ve yarışmacıdır. Geleneksel erkek rolüne özgü aktivite ve işlere girerler. Güvenli ve spontandırlar, ancak heteroseksüel ilişkilerin olduğu alanlarda ketlenmeleri vardır. Kadınsı cinsel kimliğe uyum sağlanmalarının beklendiği durumlarda anksiyöz olabilirler. Bu kadınlar iddiacı, yarışmacı inatçıdırlar ve diğer kadınlar gibi görünmek ve davranmaktan hoşlanmayan kişilerdir.  Buna karşın davranış düşüncelerinde bağımsız, kendine güvenli, spontan, dominant ve saldırgan olabilirler. Bu, kariyer ve iş ile aşırı uğraşma, erkeksi spor ve ilgi alanları ya da dominant, lezbiyen cinsel oryantasyonlar görülür. Bu kadınların çoğunluğu kendilerini kontrol edemeyecekleri durumlarda, özellikle karşı cinsle ilişkilerinde kontrolsüz bir durum varsa çok rahatsız hissederler.', 'clinical', 'female'),
--('Mf', 56, 64, 'Kadınlarda orta düzey maskülen özellikler gösterebilir. Kişi bağımsız ve girişken olabilir.', 'clinical', 'female'),
('Mf', 41, 55, 'Bu kadınların ilgi alanları orta sınıf kadınların ilgilendikleri konular ile olabilir. Duyarlı bir yapıya sahip olabilirler, bu duyarlılık erkeklerle ilişkilerinde daha da belirginleşebilir. Giyimleri ile kadın olduklarını açıkça gösterebilir.', 'clinical', 'female'),
('Mf', 26, 40, 'Bu yükselme kadınların pasif, çekingen olduklarını göstermektedir. Mf düşüklüğü nevrotik üçlüde yükselme ile ilişkilidir. Eğer Pd yükselmesi, Mf düşüklüğüne eşlik ediyorsa seksüel impulsların olası eyleme vurukluğuna dikkat edilmelidir. Bu kadınlar herhangi bir şeyden mutlu olmamak için ellerinden gelen gayreti gösterirler.', 'clinical', 'female'),
--('Mf', 0, 25, 'Kişi aşırı feminen özellikler gösterebilir. Kişi geleneksel kadın rolüne aşırı bağlı olabilir.', 'clinical', 'female');

-- Pa (Paranoya) Alt Testi
INSERT INTO mmpi_interpretations (scale_name, min_t_score, max_t_score, description, category) VALUES
--('Pa', 70, 100, 'Kişi paranoid düşünceler geliştirebilir. Kişi diğerlerine karşı aşırı şüpheci olabilir. Kişi kendini sürekli tehdit altında hissedebilir.', 'clinical'),
('Pa', 60, 69, 'Kişi duyarlı bir yapıya sahip olabilir. Diğerlerinin duygularının kolaylıkla incinebileceği türünde düşünceleri olabilir. Bu sıklıkla depresyon ile ilgili olabilir. Diğer insanlardan gelen eleştiri ve önerileri çok ciddiye alabilirler ve kendilerinin söyledikleri her şeyin eleştiri gibi alındığı fikri olabilir. Kişilerarası ilişkilerinde savunu ve diğer insanlara güvensiz olabilirler. Diğer insanların kendilerinden yararlanacağını düşünebilirler. Kırgın küskün olmaya hazır olabilirler, en ufak bir olumsuzluğu üstlerine alınabilirler. İşte ve evde kendilerinden beklentiler konusunda kontrollü olabilecekleri düşünülebilir. ', 'clinical'),
('Pa', 55, 59, '55–59 T puanı arasında olan bireyler anlayışlı, duyarlı kişilerdir.', 'clinical'),
('Pa', 45, 59, 'Kişi diğerlerini değerlendirmede esnek olabilir. Onlara karşı duyarlı ve diğerlerinin kendilerinden beklentilerini doğru anlayarak olumlu yanıtlar verebilirler.', 'clinical'),
('Pa', 27, 44, 'Kişinin diğerlerine duyarlığı olmayabilir ve çok fazla şüphesi, endişesi olabilir. Kişi geleneksel, kişilerarası ilişkilerde duyarsız, ilkel ve saf bir yapıya sahip olabilir. Zekası sınırlı ve ilgi alanları daralmış olabilir. Kişi güvenilir olabilir.', 'clinical'),
--('Pa', 0, 26, 'Kişi aşırı güvenli olabilir. Kişi diğerlerinin niyetlerini sorgulamayabilir.', 'clinical');

-- Pt (Psikasteni) Alt Testi
INSERT INTO mmpi_interpretations (scale_name, min_t_score, max_t_score, description, category) VALUES
--('Pt', 85, 100, 'Kişi aşırı kaygılı ve obsesif düşünceler yaşayabilir. Kişi günlük yaşamda ciddi işlev bozukluğu yaşayabilir.', 'clinical'),
('Pt', 75, 84, 'Temiz, titiz, düzenli bir yapısı olabilir. Önemsiz sorunlar karşısında bile gerginlik ve endişe yaşayabilirler. Kendilerini yetersiz, aşağılık duyguları ve suçluluğu olan kişiler olarak gösterebilirler. Bu durum kendilerine güvenmemelerine bağlı olabilir. Herhangi bir konuda fikir üretemeyebilirler. ', 'clinical'),
('Pt', 60, 74, 'Bu yükseltiler dürüst, mükemmeliyetçi titiz ve kendini eleştiren bireyler olduklarına işaret etmektedir. Küçük sorunları bile kendilerine dert edinme eğilimindedirler.
Kişi mükemmeliyetçi, titiz ve kendini eleştiren bir yapıya sahip olabilir. Küçük sorunları bile kendilerine dert etme eğiliminde olabilirler. 
', 'clinical'),
('Pt', 45, 59, 'Kişi işlerini ve yaşamını endişe ve güvensizlik duymadan yürütebilir.', 'clinical'),
('Pt', 20, 44, 'Rahat, duygusal, gerginliği olmayan biri olabilir. Kendine güvenebilir ve uyumlu bir yapıya sahip olabilir. Üretici ve yeterli olabilirler. Başarıya, statüye, kabul görmeye önem veren kişiler olabilir. Kaygı düzeyleri çok düşük olduğu için sanki tembel gibi görünebilirler.', 'clinical'),
--('Pt', 0, 19, 'Kişi aşırı rahat olabilir. Kişi hiç kaygı duymayabilir ve bu durum sorumsuzluğa yol açabilir.', 'clinical');

-- Sc (Şizofreni) Alt Testi
INSERT INTO mmpi_interpretations (scale_name, min_t_score, max_t_score, description, category) VALUES
--('Sc', 75, 100, 'Kişi şizofren belirtiler gösterebilir. Kişi gerçeklik algısında bozukluklar yaşayabilir. Kişi sosyal geri çekilme eğilimi gösterebilir. Kişi düşünce bozuklukları yaşayabilir.', 'clinical'),
('Sc', 60, 74, 'Bu yükselme değerlendirilirken profilin tümü ele alınmalıdır.

1.	Bu yükselmenin alt sınırında ve nevrotik profillerde yükselme varsa: Kişi soyut konularla ilgileniyor olabilir. Eğer Si alt testi de yükselmişse: kişi diğerleri tarafından uzak ve anlaşılmaz olarak tanımlanıyor olabilir.

2.	65–74 T puanı aralığındaki değerlendirmede genel bir yabancılaşma ya da örtük psikoz olup olmadığı araştırılmalıdır. F ve Pa alt testlerindeki yükselme psikoza eşlik eder.

3.	Orta düzeyde yükselmeler eğer diğer psikotik belirtiler varsa  (F, 4,6,9 nevrotik alt testlerin yükselmesi) şizoid sosyal uyumu ve bireyin dünyaya kendine özgü bakışını göstermektedir. 
', 'clinical'),
--('Sc', 60, 64, 'Bu yükselme değerlendirilirken profilin tümü ele alınmalıdır. Kişi soyut konularla ilgileniyor olabilir.', 'clinical'),
('Sc', 45, 59, 'Kişi kurumsal ve pratik görüşlerini normal bir biçimde bir araya getiriyor olabilir.', 'clinical'),
('Sc', 21, 44, 'Kişinin pratik bir yapısı olabilir. Kişi genellikle uyumlu, sorumlu, bağımlı ve temkinli bir yapıya sahip olabilir. Kişi geleneksel olabilir, davranışları ve yaşama bakış açısının konservatif olduğu düşünülebilir. Kişinin hayal gücü olmayabilir, oldukça katı olabilirler. İlişkilerinde çekingen, derin duygusal ilişkilerden kaçınan, tutucu, rekabet etmek istemeyen bir yapıya sahip olduğu düşünülebilir.', 'clinical'),
--('Sc', 0, 20, 'Kişi şizofren belirtiler göstermeyebilir. Kişi gerçeklik algısı normal olabilir. Kişi sosyal ilişkilerde başarılı olabilir.', 'clinical');

-- Ma (Hipomania) Alt Testi (buraya bir daha bak .eksikler var)
INSERT INTO mmpi_interpretations (scale_name, min_t_score, max_t_score, description, category) VALUES
--('Ma', 85, 100, 'Kişi manik belirtiler gösterebilir. Kişi aşırı enerjik ve hiperaktif davranışlar sergileyebilir. Kişi dürtü kontrolü sorunları yaşayabilir. Kişi gerçekçi olmayan hedefler koyabilir.', 'clinical'),
('Ma', 70, 100, 'Kişi enerjik, dışa dönük, aktif bir yapıya sahip olabilir. Kişi diğerleri tarafından hoş ve yeterli olarak görülebilirler. Kişi onay ve statü kazanmak için çaba harcayabilir, düşünce ve davranışlarında özgür olma eğilimi olabilir..', 'clinical'),
('Ma', 60, 69, 'Kişi hoş, enerjik, meraklı, sosyal, kolay ilişki kuran, ilgi alanları geniş bir yapıya sahip olabilir. Kişi kendinin bu hallerinden memnun olabilir. İyimserlik, bağımsızlık ve kendine güvenen bir yapısı olduğu düşünülebilir.', 'clinical'),
('Ma', 45, 59, 'Normal aralığıdır.', 'clinical'),
('Ma', 21, 44, 'Özellikle 2 alt testinin yükselmediği durumlarda depresyon düşünülmelidir. Yaşlı insanlarda 9’un düşüklüğü beklenen bir durumdur, normal yaşlanma sürecini gösterir, 45 yaşın altında düşük olması beklenen bir durum değildir ve dikkat edilmesi gerekir.

Kişide düşük enerji düzeyi, güdü azlığı olabilir. Bu durum kişide geçici yorgunluk ya da hastalığa işaret edebilir. Kişide kronik açıdan düşük enerji düzeyi olabilir. Kişinin kendine güveni az olabilir ve bir amacı olmayabilir. Sabahları kalkmak istemeyebilir ve herhangi bir projeye başlamakta kendilerini aşırı çaba göstermek zorunda hissedebilirler. 45 yaş üstü kişilerde beklenen bir durumdur. 
', 'clinical'),
--('Ma', 0, 20, 'Kişi manik belirtiler göstermeyebilir. Kişi sakin ve dengeli enerji düzeyine sahip olabilir. Kişi kontrollü davranışlar sergileyebilir.', 'clinical');

-- Si (Sosyal İçedönüklük) Alt Testi
INSERT INTO mmpi_interpretations (scale_name, min_t_score, max_t_score, description, category) VALUES
('Si', 70, 100, 'Nevrotik üçlüde yükselme görülebilir.(Ayrıca bakınız, 2,7 ve 8 alt testlerinin yükselmesi.)

Kişi sosyal açıdan beceriksiz olabilir. Sosyal ilişkilerinde anksiyete yaşayabilir ve ilişki kurmaktan kaçınabilir. 
', 'clinical'),
('Si', 60, 69, 'Kişi kendini ortaya koymak istemeyebilir. Yakın aile çevresinde rahat olan, çekingen utangaç bir yapıya sahip olabilir.', 'clinical'),
('Si', 45, 59, 'Kişi sosyal ilişki kurma konusunda başarılı olabilir.', 'clinical'),
('Si', 25, 44, 'İyimser, manipulatif, yüzeysel ve hatta biraz uçuk bireyler olabilir. Dürtü kontrol sorunları düşünülebilir. Diğerleri ile olmak isteyen, yalnız kalamayan bir yapısı olduğu düşünülebilir. Çoğu kolay ilişki kurar, arkadaş canlısı ve meraklıdırlar, sosyal açıdan kabul görme, onaylanma konusunda gereksinimleri çok fazla olabilir.', 'clinical'),
--('Si', 0, 24, 'Kişi çok sosyal ve dışa dönük olabilir. Kişi sosyal ilişkilerde çok başarılı olabilir. Kişi liderlik özelliklerine sahip olabilir.', 'clinical');