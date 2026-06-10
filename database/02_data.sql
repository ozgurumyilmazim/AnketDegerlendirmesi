-- ============================================================
-- MMPI PostgreSQL Data Import
-- Phase 1: All reference data
-- ============================================================
-- Run after: 01_schema.sql
-- Usage: psql -U mmpi_user -d mmpi_db -f 02_data.sql
-- ============================================================

BEGIN;

-- ============================================================
-- 1. QUESTIONS (567 MMPI-2 questions)
-- Source: dokumanlar/questions_insert.sql
-- ============================================================
INSERT INTO questions (question_number, question_text, category) VALUES
(1, 'Teknik yazilardan hoslanirim.', 'Genel'),
(2, 'Istahim iyidir.', 'Genel'),
(3, 'Cok defa sabahlari dinc ve dinlenmis olarak uyanirim.', 'Genel'),
(4, 'Kutuphaneci olarak calismayi sevecegimi saniyorum.', 'Genel'),
(5, 'Gurultuden kolayca uyanirim.', 'Genel'),
(6, 'Cinayet haberlerini okumaktan hoslanirim.', 'Genel'),
(7, 'Cogu zaman el ve ayaklarimin sicakligi iyidir.', 'Genel'),
(8, 'Gunluk hayatim beni ilgilendirecek seylerle doludur.', 'Genel'),
(9, 'Bugun de hemen hemen eskisi kadar iyi calisabiliyorum.', 'Genel'),
(10, 'Cogu zaman bogazim tikanir gibi olur.', 'Genel'),
(11, 'Insan ruyalarini anlamaya calismali ve kendini onlara gore ayarlamalidir.', 'Genel'),
(12, 'Polis romanlarindan ya da esrarengiz yazilardan hoslanirim.', 'Genel'),
(13, 'Buyuk bir sinir gerginligi icinde calisirim.', 'Genel'),
(14, 'Ayda bir iki defa ishal olurum.', 'Genel'),
(15, 'Arasira soylenemeyecek kadar ayip seyler dusunurum.', 'Genel'),
(16, 'Hayatta kotulukler hep beni bulur.', 'Genel'),
(17, 'Babam iyi bir adamdir.', 'Aile'),
(18, 'Pek seyrek kabiz olurum.', 'Genel'),
(19, 'Yeni bir ise girince kimin gozune girmem gerektigini ogrenmek isterim.', 'Genel'),
(20, 'Cinsel yasamimdan memnunum.', 'Cinsellik'),
(21, 'Zaman zaman evi birakip gitmek istemisimdir.', 'Genel'),
(22, 'Arasira kontrol edemedigim gulme ve aglama nobetlerine tutulurum.', 'Genel'),
(23, 'Tekrarlanan mide bulantisi ve kusmalar bana sikinti verir.', 'Saglik'),
(24, 'Kimse beni anlamiyor.', 'Genel'),
(25, 'Sarkici olmayi isterim.', 'Genel'),
(26, 'Basim derde girince susmayi tercih ederim.', 'Genel'),
(27, 'Bazen kotu ruhlarin beni etkileri altina aldigni hissederim.', 'Genel'),
(28, 'Kotuluge kotulukle karsilik vermek prensibimdir.', 'Genel'),
(29, 'Cogu kez midem eksir.', 'Saglik'),
(30, 'Bazen canim kufretmek ister.', 'Genel'),
(31, 'Sik sik geceleri kabus geciririm.', 'Genel'),
(32, 'Zihnimi bir is uzerinde toplamada gucluk cekerim.', 'Genel'),
(33, 'Basimdan cok garip ve tuhaf seyler gecti.', 'Genel'),
(34, 'Cogu zaman oksurugum vardir.', 'Genel'),
(35, 'Baskalari engel olmasaydi daha cok basarili olurdum.', 'Genel'),
(36, 'Sagligim beni pek kaygilandirmaz.', 'Saglik'),
(37, 'Cinsel yasamim yuzunden basim hic derde girmedi.', 'Cinsellik'),
(38, 'Gencligimde bir devre ufak tefek seyler caldim.', 'Genel'),
(39, 'Bazen icimde bir seyler kirmak istegi gecer.', 'Genel'),
(40, 'Baska bir sey yapmaktansa cogu zaman oturup hayal kurmayi severim.', 'Genel'),
(41, 'Kendimi toparlayamadigim icin gunler, haftalar hatta aylarca hic bir seye el surmedigim olur.', 'Genel'),
(42, 'Ailem sectigim (veya secmek istedigim) meslegi begenmiyor.', 'Aile'),
(43, 'Kuskulu ve rahatsiz uyurum.', 'Genel'),
(44, 'Cogu zaman basimin her tarafi agrir.', 'Saglik'),
(45, 'Her zaman dogruyu söylemem.', 'Genel'),
(46, 'Simdi her zamankinden daha iyi dusunup tartabiliyorum.', 'Genel'),
(47, 'Ortada hic bir neden yokken haftada bir ya da daha sik birdenbire her yanimi ates basar.', 'Genel'),
(48, 'Baskalari ile bir arada iken kulagima cok garip seyler gelmesinden rahatsiz olurum.', 'Genel'),
(49, 'Kanunlarin hemen hepsi kaldirilirsa daha iyi olur.', 'Genel'),
(50, 'Bazen ruhum vucudumdan ayrilir.', 'Genel'),
(51, 'Sagligim bircok arkadasiminki kadar iyidir.', 'Saglik'),
(52, 'Uzun zamandan beri gormedigim okul arkadaslarim ya da tanidiklarim once benimle konusmazlarsa onlari gormemezlikten gelmeyi tercih ederim.', 'Sosyal'),
(53, 'Hocalarin dua okuyup uflemesi hastaligi iyilestirir.', 'Genel'),
(54, 'Tanidiklarimin cogu beni sever.', 'Genel'),
(55, 'Kalp ve gogus agrilarindan hemen hemen hic sikayetim yoktur.', 'Saglik'),
(56, 'Cocukken okuldan kactigim icin bir iki defa cezalandirildim.', 'Genel'),
(57, 'Insanlarla cabucak kaynasirim.', 'Genel'),
(58, 'Kuranin buyurduklari bir bir cikmaktadir.', 'Genel'),
(59, 'Cok defa benden az bilenlerden emir alarak calismak zorunda kaldim.', 'Genel'),
(60, 'Her gun gazetelerin bas yazilarini okumam.', 'Genel'),
(61, 'Gerektigi gibi bir hayat yasayamadim.', 'Genel'),
(62, 'Vucudumun bazi yerlerinde cok defa yanma, gidiklanma, karincalanma veya uyusukluk hissederim.', 'Genel'),
(63, 'Buyuk abdest yapmada ya da tutmada hic bir gucluk cekmem.', 'Saglik'),
(64, 'Bazen baskALARININ sabrini tuketecek kadar bir seye saplanip kalirim.', 'Genel'),
(65, 'Babami severim.', 'Aile'),
(66, 'Etrafimda baskALARININ gormedikleri esya ve hayvanlar ya da insanlar gorurum.', 'Genel'),
(67, 'BaskALARININ mutlu gorundugu kadar mutlu olmayi isterdim.', 'Duygusal'),
(68, 'Ensemde nadiren agri hissederim.', 'Saglik'),
(69, 'Kendi cinsimden olanlari oldukca cekici bulurum.', 'Cinsellik'),
(70, 'Korebe oyunundan hoslanirdim.', 'Genel'),
(71, 'Bircok kimseler baskALARININ ilgi ve yardimlarini saglamak icin talihsizliklerini abartirlar.', 'Genel'),
(72, 'Hemen hemen her gun mide agrilariNDAN rahatsiz olurum.', 'Saglik'),
(73, 'Ben onemli bir kimseyim.', 'Genel'),
(74, 'Cogu zaman kiz olmayi isterdim. (Sayet kiz iseniz) Kiz olduguma hic uzulmedim.', 'Genel'),
(75, 'Arasira ofkelenirim.', 'Genel'),
(76, 'Cogu zaman kendimi huzunlu hissederim.', 'Duygusal'),
(77, 'Ask romanlari okumaktan hoslanirim.', 'Genel'),
(78, 'Siiri severim.', 'Genel'),
(79, 'Kolay incinmem.', 'Genel'),
(80, 'Bazen hayvanlara rahat vermem.', 'Genel'),
(81, 'Orman bekciligi gibi islerden hoslanacagimi saniyorum.', 'Genel'),
(82, 'Tartismalarda cabucak yenilirim.', 'Genel'),
(83, 'Cok calisabilen ya da calismak isteyen kisinin basarili olma sansi yuksektir.', 'Genel'),
(84, 'Bugunlerde artik hic ilerleme umudum kalmamis gibi hissediyorum.', 'Duygusal'),
(85, 'Kullanamayacak bile olsam bazen baskALARININ ayakkabi, eldiven vb. gibi ozel esyalari o kadar hosuma gider ki dokunmak ve asirmak isterim.', 'Genel'),
(86, 'Kendime hic guvenim yoktur.', 'Duygusal'),
(87, 'Cicek saticisi olmayi isterdim.', 'Genel'),
(88, 'Genel olarak hayatin yasanmaya deger oldugu kanisindayim.', 'Genel'),
(89, 'Insanlara gercegi kabul ettirmek guctur.', 'Genel'),
(90, 'Bugun yapmam gereken isleri ara sira yarina biraktigim olur.', 'Genel'),
(91, 'Benimle alay edilmesine aldirmam.', 'Genel'),
(92, 'Hemsire olmayi isterdim.', 'Genel'),
(93, 'Yukselmek icin bircok kisi yalan soylemekten cekinmez.', 'Genel'),
(94, 'Sonradan pisman olacagim pek cok seyi yaptigim olur.', 'Genel'),
(95, 'Namazimi hemen hemen muntazaman kilariM.', 'Genel'),
(96, 'Ailemle pek az kavga ederim.', 'Aile'),
(97, 'Bazen zararli ya da cok kotu isler yapmak icin icimde cok guclu bir istek duyarim.', 'Genel'),
(98, 'Kiyamet gunune inaniyorum.', 'Genel'),
(99, 'Gurultulu eglencelere katilmaktan hoslanirim.', 'Genel'),
(100, 'Bildigim bir konuda bir kimse sacma sapan ya da cahilce konusursa onu hemen duzeltirim.', 'Genel')
ON CONFLICT (question_number) DO UPDATE SET question_text = EXCLUDED.question_text, category = EXCLUDED.category;

-- Note: question 101-567 are in dokumanlar/questions_insert.sql
-- This file contains all 567 questions. Run the full file if needed:
-- \i ../dokumanlar/questions_insert.sql

-- ============================================================
-- 2. SCORING KEYS
-- Source: dokumanlar/scoring_keys_insert.sql
-- ============================================================
INSERT INTO scoring_keys (scale_name, question_number, scoring_answer) VALUES
-- L Scale
('L', 96, 'Dogru'),
('L', 15, 'Yanlis'), ('L', 30, 'Yanlis'), ('L', 45, 'Yanlis'),
('L', 60, 'Yanlis'), ('L', 75, 'Yanlis'), ('L', 90, 'Yanlis'),
('L', 105, 'Yanlis'), ('L', 120, 'Yanlis'), ('L', 135, 'Yanlis'),
('L', 150, 'Yanlis'), ('L', 165, 'Yanlis'), ('L', 195, 'Yanlis'),
('L', 225, 'Yanlis'), ('L', 255, 'Yanlis'), ('L', 285, 'Yanlis'),
-- F Scale (Dogru)
('F', 14, 'Dogru'), ('F', 23, 'Dogru'), ('F', 27, 'Dogru'),
('F', 31, 'Dogru'), ('F', 34, 'Dogru'), ('F', 35, 'Dogru'),
('F', 40, 'Dogru'), ('F', 42, 'Dogru'), ('F', 48, 'Dogru'),
('F', 49, 'Dogru'), ('F', 50, 'Dogru'), ('F', 53, 'Dogru'),
('F', 56, 'Dogru'), ('F', 66, 'Dogru'), ('F', 85, 'Dogru'),
('F', 121, 'Dogru'), ('F', 123, 'Dogru'), ('F', 139, 'Dogru'),
('F', 146, 'Dogru'), ('F', 151, 'Dogru'), ('F', 156, 'Dogru'),
('F', 168, 'Dogru'), ('F', 184, 'Dogru'), ('F', 197, 'Dogru'),
('F', 200, 'Dogru'), ('F', 202, 'Dogru'), ('F', 205, 'Dogru'),
('F', 206, 'Dogru'), ('F', 209, 'Dogru'), ('F', 210, 'Dogru'),
('F', 211, 'Dogru'), ('F', 215, 'Dogru'), ('F', 218, 'Dogru'),
('F', 227, 'Dogru'), ('F', 245, 'Dogru'), ('F', 246, 'Dogru'),
('F', 247, 'Dogru'), ('F', 252, 'Dogru'), ('F', 256, 'Dogru'),
('F', 269, 'Dogru'), ('F', 275, 'Dogru'), ('F', 286, 'Dogru'),
('F', 291, 'Dogru'), ('F', 293, 'Dogru'),
-- F Scale (Yanlis)
('F', 17, 'Yanlis'), ('F', 20, 'Yanlis'), ('F', 54, 'Yanlis'),
('F', 65, 'Yanlis'), ('F', 75, 'Yanlis'), ('F', 83, 'Yanlis'),
('F', 112, 'Yanlis'), ('F', 113, 'Yanlis'), ('F', 115, 'Yanlis'),
('F', 164, 'Yanlis'), ('F', 169, 'Yanlis'), ('F', 177, 'Yanlis'),
('F', 185, 'Yanlis'), ('F', 196, 'Yanlis'), ('F', 199, 'Yanlis'),
('F', 220, 'Yanlis'), ('F', 257, 'Yanlis'), ('F', 258, 'Yanlis'),
('F', 272, 'Yanlis'), ('F', 276, 'Yanlis'),
-- K Scale
('K', 96, 'Dogru'),
('K', 30, 'Yanlis'), ('K', 39, 'Yanlis'), ('K', 71, 'Yanlis'),
('K', 89, 'Yanlis'), ('K', 124, 'Yanlis'), ('K', 129, 'Yanlis'),
('K', 134, 'Yanlis'), ('K', 138, 'Yanlis'), ('K', 142, 'Yanlis'),
('K', 148, 'Yanlis'), ('K', 160, 'Yanlis'), ('K', 170, 'Yanlis'),
('K', 171, 'Yanlis'), ('K', 180, 'Yanlis'), ('K', 183, 'Yanlis'),
('K', 217, 'Yanlis'), ('K', 234, 'Yanlis'), ('K', 267, 'Yanlis'),
('K', 272, 'Yanlis'), ('K', 296, 'Yanlis'), ('K', 316, 'Yanlis'),
('K', 322, 'Yanlis'), ('K', 374, 'Yanlis'), ('K', 383, 'Yanlis'),
('K', 397, 'Yanlis'), ('K', 398, 'Yanlis'), ('K', 406, 'Yanlis'),
('K', 461, 'Yanlis'), ('K', 502, 'Yanlis')
ON CONFLICT (scale_name, question_number) DO NOTHING;

-- ============================================================
-- 3. T-SCORE PARAMS
-- Source: dokumanlar/t_score_params_query.sql
-- ============================================================
INSERT INTO t_score_params (scale_name, gender, mean_m, sd, k_correction)
VALUES
('L',  'male',   6.45, 2.74, 0.00),
('F',  'male',   8.30, 4.62, 0.00),
('K',  'male',  13.98, 4.65, 0.00),
('Hs', 'male',  13.19, 4.07, 0.50),
('D',  'male',  20.63, 4.76, 0.00),
('Hy', 'male',  19.31, 4.71, 0.00),
('Pd', 'male',  22.22, 4.45, 0.40),
('Mf', 'male',  29.21, 3.82, 0.00),
('Pa', 'male',  11.12, 4.03, 0.00),
('Pt', 'male',  27.90, 6.30, 1.00),
('Sc', 'male',  29.82, 9.05, 1.00),
('Ma', 'male',  19.96, 4.40, 0.20),
('Si', 'male',  25.86, 7.97, 0.00),
('L',  'female',  6.00, 2.25, 0.00),
('F',  'female',  9.38, 5.16, 0.00),
('K',  'female', 11.82, 3.80, 0.00),
('Hs', 'female', 15.89, 4.88, 0.50),
('D',  'female', 23.86, 5.08, 0.00),
('Hy', 'female', 18.12, 5.31, 0.00),
('Pd', 'female', 22.84, 4.51, 0.40),
('Mf', 'female', 32.98, 3.67, 0.00),
('Pa', 'female', 11.93, 4.17, 0.00),
('Pt', 'female', 29.20, 6.59, 1.00),
('Sc', 'female', 31.06, 8.20, 1.00),
('Ma', 'female', 19.72, 4.36, 0.20),
('Si', 'female', 29.88, 7.52, 0.00)
ON CONFLICT (test_version, locale, age_group, scale_name, gender)
DO UPDATE SET mean_m = EXCLUDED.mean_m, sd = EXCLUDED.sd, k_correction = EXCLUDED.k_correction;

-- ============================================================
-- 4. MMPI INTERPRETATIONS
-- Source: belgeler/mmpi_interpretations_insert.sql
-- ============================================================
INSERT INTO mmpi_interpretations (scale_name, min_t_score, max_t_score, description, category) VALUES
('L', 69, 100, 'Kisi sosyal acidan kabul goren yanitlar vererek kendini kontrol eden, etkili biri oldugu izlenimi birakmaya calisiyor olabilir. Guvenilmez, pasif, uzak duran, kaygili, ice kapanik bir yapiya sahip olabilir. Degerleriyle iliski kurmalari zor olabilir. Duruma ozgu tepkileri yavas oldugu dusunulebilir.', 'validity'),
('L', 64, 68, 'Kisi Maddeleri gelisi guzel doldurmus olabilir. Kisi kendindeki zayifliklari inkar ediyor olabilir. Kisi patolojik olarak kendinde ki iyi ve ahlaki inanc ve egilimleri nedeniyle kendine asiri kontrol koyabilir. Ufak hatalarini bile inkar etme egiliminde olabilir.', 'validity'),
('L', 59, 63, 'Kisi iyi gorunme cabasi icerisinde oldugu dusunulebilir. Kiside sosyal acidan kabul goren yanitlar verme egilimi olabilir. Kisinin asiri geleneksel ve sosyal acidan uyumlu oldugu dusunulebilir.', 'validity'),
('L', 36, 58, 'Bu araliga iliskin ozgun bir durum tanimlanmamistir.', 'validity'),
('L', 0, 35, 'Bagimsiz, kendine guvenen, ufak sosyal hatalarini kabul etmeye hazir bir yapisi olabilir.', 'validity'),
('F', 70, 100, 'Gecersiz profil - Test sonuclari guvenilir degildir.', 'validity'),
('F', 55, 69, 'Kisi negativist, degisken, huysuz ve huzursuz olabilir. Durumsal stresi oldugu dusunulebilir.', 'validity'),
('F', 44, 54, 'Kisi sadece belirgin maddelere yanit vermis olabilir. Kisinin ilgi alanlarinin daraldigi dusunulebilir. Kisi psikopatolojiyi, duygusal gerginligi gizliyor olabilir, direnc sahibi olabilir.', 'validity'),
('F', 0, 43, 'Kisi herhangi bir psikopatoloji, gerginlik ya da stresi olmadigi gorunumunu vermek istiyor olabilir.', 'validity'),
('K', 72, 100, 'Kisi savunucu olabilir. Kendinde psikolojik sorunlar oldugunu kabul etmeyebilir. Kati ve esnek olabilir. Kendisindeki sorunu kabul etmek istemeyebilir. Tedaviye yanitinin kotu oldugu dusunulebilir.', 'validity'),
('K', 61, 71, 'Kisi kendisindeki ve cevresindeki bozukluklari en aza indirgeme ve gormezden gelme egiliminde olabilir. Ic gorusu az olabilir ve savunmalari artmis olabilir.', 'validity'),
('K', 46, 60, 'Kisinin dengeli bir yapisi olabilir. Kisinin ego gucu iyi, olumlu kendilik degerine ve uyuma isaret edebilir.', 'validity'),
('K', 27, 45, 'Kisinin zayif kendilik degeri olabilir. Kisi kendinden hic memnun olmayabilir.', 'validity'),
('K', 0, 26, 'Kisinin cok zayif kendilik degeri olabilir. Kisi ciddi uyum sorunlari yasayabilir.', 'validity'),
('Hs', 75, 84, 'Kisi bedensel yakinalar ile cok fazla ugrasabilir. Is yapma istegi azalmis, yakinalarini sürekli arastirabilir. Benmerkezci ve narsist olabilir.', 'clinical'),
('Hs', 60, 74, 'Kisi fiziksel bozukluk göstermis olabilir. Saglik konularina asiri duyarli olabilir. Kotumser ve yasamini sikici hale getirme egiliminde olabilir.', 'clinical'),
('Hs', 50, 59, 'Kisi yetenekli, sorumluluk sahibi, vicdanli, dikkatli ve yargilamalari iyi bir yapiya sahip olabilir.', 'clinical'),
('Hs', 21, 49, 'Kisi hastaligin hic konu olmadigi ailelerde yetismis olabilir. Uyanik, iyimser, yeterli ve yasamda etkin kisiler olabilir.', 'clinical'),
('D', 70, 79, 'Kisi ciddi ve kendine guveni olmayan bir yapiya sahip olabilir. Belirgin depresyonu olabilir.', 'clinical'),
('D', 60, 69, 'Kiside orta duzey depresyon gorulebilir. Endise ve karamsarlik gostergesi olabilir.', 'clinical'),
('D', 45, 59, 'Kisi yasaminda iyimserlik ve karamsarlik dengesini kurmus olabilir.', 'clinical'),
('D', 28, 44, 'Kisi neseli, merakli, iyimser, aktif ve disa donuk bir yapiya sahip olabilir.', 'clinical'),
('Hy', 70, 75, 'Kisi bastirma ve inkar kullanabilir, itaat eden, saf ve cocukca benmerkezci olabilir.', 'clinical'),
('Hy', 60, 69, 'Histerik ozellikler belirgin olabilir. Kisi kendine odaklanmis olabilir, ic goru azligi olabilir.', 'clinical'),
('Hy', 45, 59, 'Bu alana ozgu bir tanimlama yoktur.', 'clinical'),
('Hy', 24, 44, 'Kisi kendisini surekli elestirebilir. Olumlu kisiler arasi iliskileri inkar etme egilimi olabilir.', 'clinical'),
('Pd', 70, 100, 'Kisi antisosyal davranislar sergileyebilir. Durtu kontrol sorunlari olabilir.', 'clinical'),
('Pd', 60, 69, 'Kisi risk alabilen, enerjik, sosyal, maceraperest ve atilgan olabilir.', 'clinical'),
('Pd', 45, 59, 'Kiside asiri kontrol koyma ve kisitlama az olabilir. Sosyal kurallara kismen uyum olabilir.', 'clinical'),
('Pd', 20, 44, 'Kisi duragan, pasif ve atilgan olmayan bir yapiya sahip olabilir.', 'clinical'),
('Pa', 70, 100, 'Kisi paranoid dusunceler gelistirebilir, asiri supheci olabilir.', 'clinical'),
('Pa', 60, 69, 'Kisi duyarli bir yapiya sahip olabilir. Elestiri ve onerileri cok ciddiye alabilir.', 'clinical'),
('Pa', 55, 59, '55-59 T puani arasinda olan bireyler anlayisli, duyarli kisilerdir.', 'clinical'),
('Pa', 45, 54, 'Kisi digerlerini degerlendirmede esnek olabilir.', 'clinical'),
('Pa', 27, 44, 'Kisinin digerlerine duyarligi olmayabilir. Geleneksel ve ilkel bir yapisi olabilir.', 'clinical'),
('Pt', 75, 84, 'Temiz, titiz, duzenli. Onemsiz sorunlar karsisinda gerginlik ve endise yasayabilir.', 'clinical'),
('Pt', 60, 74, 'Kisi mukemmeliyetci, titiz ve kendini elestiren bir yapiya sahip olabilir.', 'clinical'),
('Pt', 45, 59, 'Kisi islerini ve yasamini endise ve guvensizlik duymadan yurutebilir.', 'clinical'),
('Pt', 20, 44, 'Rahat, duygusal, gerginligi olmayan. Kendine guvenebilir ve uyumlu olabilir.', 'clinical'),
('Sc', 60, 74, 'Profil tumu ele alinmalidir. Soyut konularla ilgileniyor olabilir.', 'clinical'),
('Sc', 45, 59, 'Kisi kurumsal ve pratik goruslerini normal bicimde birlestirebiliyor olabilir.', 'clinical'),
('Sc', 21, 44, 'Pratik bir yapisi olabilir. Uyumlu, sorumlu, bagimli ve temkinli olabilir.', 'clinical'),
('Ma', 70, 100, 'Kisi enerjik, disa donuk, aktif. Onay ve status kazanmak icin caba harcayabilir.', 'clinical'),
('Ma', 60, 69, 'Kisi hos, enerjik, merakli, sosyal. Iyimserlik, bagimsizlik ve kendine guven.', 'clinical'),
('Ma', 45, 59, 'Normal araligi.', 'clinical'),
('Ma', 21, 44, 'Dusuk enerji duzeyi, gudu azligi olabilir. 45 yas ustunde beklenen bir durumdur.', 'clinical'),
('Si', 70, 100, 'Kisi sosyal acidan beceriksiz olabilir, iliski kurmaktan kacinabilir.', 'clinical'),
('Si', 60, 69, 'Kisi kendini ortaya koymak istemeyebilir. Cekingen utangac olabilir.', 'clinical'),
('Si', 45, 59, 'Kisi sosyal iliski kurma konusunda basarili olabilir.', 'clinical'),
('Si', 25, 44, 'Iyimser, manipulative, yuzeysel. Durtu kontrol sorunlari olabilir.', 'clinical')
ON CONFLICT DO NOTHING;

-- Mf scale with gender
INSERT INTO mmpi_interpretations (scale_name, min_t_score, max_t_score, description, category, gender) VALUES
('Mf', 80, 100, 'Erkeklerde kulturel erkeksi rolle ozdesim olmadigini gosterir. Pasif erkeklere isaret eder.', 'clinical', 'male'),
('Mf', 41, 79, 'Erkeklerde orta duzey feminen ozellikler. Sanatsal ve estetik ilgiler.', 'clinical', 'male'),
('Mf', 26, 40, 'Maskulen gorunmek icin kompulsif ugras. Altta yatan kendine guvensizlik.', 'clinical', 'male'),
('Mf', 65, 100, 'Kadinlar guclu, saldirgan, yonlendirici ve yarisamcidir. Bagimsiz ve kendine guvenli.', 'clinical', 'female'),
('Mf', 41, 55, 'Kadinlarin ilgi alanlari orta sinif kadinlarinin ilgilendikleri konular ile olabilir.', 'clinical', 'female'),
('Mf', 26, 40, 'Kadinlar pasif, cekingen. Mf dusuklugu nevrotik uclude yukselme ile iliskilidir.', 'clinical', 'female')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. KVKK TEXT
-- Source: dokumanlar/create_settings_table.sql
-- ============================================================
INSERT INTO kvkk (id, kvkk_title, kvkk_text, kvkk_required) VALUES (
    1,
    'KVKK Aydinlatma Metni',
    '<h4 class="text-center mb-4">MINNESOTA COK YONLU KISILIK ENVANTERI (MMPI) TESTI</h4>
<h5 class="text-center mb-4">KISISEL VERILERIN KORUNMASI KANUNU HAKKINDA ACIKLAMALAR VE MUVAFAKATNAME</h5>
<h6><strong>1. BILGILENDIRME</strong></h6>
<p>MMPI Testinin acilimi Minnesota Cok Yonlu Kisilik Envanteri. Bu test bireyin kisisel ve toplumsal uyumunu objektif olarak degerlendirmeyi amaclayan bir testtir.</p>
<p>6698 sayili Kisisel Verilerin Korunmasi Kanunu uyarinca, kisisel verileriniz; veri sorumlusu olarak OGULTURK A.S. tarafindan toplanacak, islenecek ve ilgili birim sorumlusu ile paylasilacaktir.</p>',
    true
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. PAGE CONTENT
-- Source: dokumanlar/create_page_content_table.sql
-- ============================================================
INSERT INTO page_content (page_key, page_title, page_subtitle, page_body) VALUES
('gizlilik', 'Gizlilik Politikasi', 'Kisisel verilerinizin nasil toplandigi, islendigi ve korundugu hakkinda bilgi',
'<h4>1. Veri Sorumlusu</h4><p>6698 sayili Kisisel Verilerin Korunmasi Kanunu uyarinca, kisisel verileriniz; veri sorumlusu olarak <strong>OGULTURK A.S.</strong> tarafindan toplanmakta, islenmekte ve ilgili birim sorumlusu ile paylasilmaktadir.</p>'),
('kullanim', 'Kullanim Kosullari', 'MMPI psikolojik test sistemini kullanirken uymaniz gereken kurallar',
'<h4>1. Hizmetin Kapsami</h4><p>OGULTURK A.S. tarafindan sunulan MMPI psikolojik test sistemi, bireylerin kisisel ve toplumsal uyumlarini objektif olarak degerlendirmeyi amaclayan bir dijital uygulamadir.</p>'),
('hakkimizda', 'Hakkimizda', 'OGULTURK A.S. ve MMPI Psikolojik Degerlendirme Sistemi',
'<p>OGULTURK A.S. olarak, bireylerin kisisel ve toplumsal uyumlarini objektif bir sekilde degerlendirmek amaciyla MMPI-2 test hizmeti sunuyoruz.</p>')
ON CONFLICT (page_key) DO NOTHING;

-- ============================================================
-- 7. SETTINGS
-- ============================================================
INSERT INTO settings (setting_key, setting_value) VALUES
('test_version', 'MMPI-2'),
('max_dont_know', '10'),
('auto_save_interval', '30000'),
('app_name', 'MMPI Psikolojik Degerlendirme Sistemi')
ON CONFLICT (setting_key) DO NOTHING;

COMMIT;

-- ============================================================
-- Data imported successfully.
-- Next: psql -U mmpi_user -d mmpi_db -f 03_setup_admin.sql
-- ============================================================
