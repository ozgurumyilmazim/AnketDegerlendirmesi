-- ============================================================
-- MMPI PostgreSQL Data Import
-- Phase 1: All reference data
-- ============================================================
-- Run after: 01_schema.sql
-- Usage: psql -U mmpi_user -d mmpi_db -f 02_data.sql
-- ============================================================

BEGIN;

-- ============================================================
-- 0. QUESTION CATEGORIES
-- ============================================================
INSERT INTO question_category (name, sort_order) VALUES
    ('Genel', 1),
    ('Aile', 2),
    ('Sağlık', 3),
    ('Cinsellik', 4),
    ('Duygusal', 5),
    ('Sosyal', 6)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 1. QUESTIONS (567 MMPI questions)
-- Source: dokumanlar/questions_insert.sql
-- ============================================================
INSERT INTO questions (question_number, question_text, category_id) VALUES
(1, 'Teknik yazilardan hoslanirim.', 1),
(2, 'Istahim iyidir.', 1),
(3, 'Cok defa sabahlari dinc ve dinlenmis olarak uyanirim.', 1),
(4, 'Kutuphaneci olarak calismayi sevecegimi saniyorum.', 1),
(5, 'Gurultuden kolayca uyanirim.', 1),
(6, 'Cinayet haberlerini okumaktan hoslanirim.', 1),
(7, 'Cogu zaman el ve ayaklarimin sicakligi iyidir.', 1),
(8, 'Gunluk hayatim beni ilgilendirecek seylerle doludur.', 1),
(9, 'Bugun de hemen hemen eskisi kadar iyi calisabiliyorum.', 1),
(10, 'Cogu zaman bogazim tikanir gibi olur.', 1),
(11, 'Insan ruyalarini anlamaya calismali ve kendini onlara gore ayarlamalidir.', 1),
(12, 'Polis romanlarindan ya da esrarengiz yazilardan hoslanirim.', 1),
(13, 'Buyuk bir sinir gerginligi icinde calisirim.', 1),
(14, 'Ayda bir iki defa ishal olurum.', 1),
(15, 'Arasira soylenemeyecek kadar ayip seyler dusunurum.', 1),
(16, 'Hayatta kotulukler hep beni bulur.', 1),
(17, 'Babam iyi bir adamdir.', 2),
(18, 'Pek seyrek kabiz olurum.', 1),
(19, 'Yeni bir ise girince kimin gozune girmem gerektigini ogrenmek isterim.', 1),
(20, 'Cinsel yasamimdan memnunum.', 4),
(21, 'Zaman zaman evi birakip gitmek istemisimdir.', 1),
(22, 'Arasira kontrol edemedigim gulme ve aglama nobetlerine tutulurum.', 1),
(23, 'Tekrarlanan mide bulantisi ve kusmalar bana sikinti verir.', 3),
(24, 'Kimse beni anlamiyor.', 1),
(25, 'Sarkici olmayi isterim.', 1),
(26, 'Basim derde girince susmayi tercih ederim.', 1),
(27, 'Bazen kotu ruhlarin beni etkileri altina aldigni hissederim.', 1),
(28, 'Kotuluge kotulukle karsilik vermek prensibimdir.', 1),
(29, 'Cogu kez midem eksir.', 3),
(30, 'Bazen canim kufretmek ister.', 1),
(31, 'Sik sik geceleri kabus geciririm.', 1),
(32, 'Zihnimi bir is uzerinde toplamada gucluk cekerim.', 1),
(33, 'Basimdan cok garip ve tuhaf seyler gecti.', 1),
(34, 'Cogu zaman oksurugum vardir.', 1),
(35, 'Baskalari engel olmasaydi daha cok basarili olurdum.', 1),
(36, 'Sagligim beni pek kaygilandirmaz.', 3),
(37, 'Cinsel yasamim yuzunden basim hic derde girmedi.', 4),
(38, 'Gencligimde bir devre ufak tefek seyler caldim.', 1),
(39, 'Bazen icimde bir seyler kirmak istegi gecer.', 1),
(40, 'Baska bir sey yapmaktansa cogu zaman oturup hayal kurmayi severim.', 1),
(41, 'Kendimi toparlayamadigim icin gunler, haftalar hatta aylarca hic bir seye el surmedigim olur.', 1),
(42, 'Ailem sectigim (veya secmek istedigim) meslegi begenmiyor.', 2),
(43, 'Kuskulu ve rahatsiz uyurum.', 1),
(44, 'Cogu zaman basimin her tarafi agrir.', 3),
(45, 'Her zaman dogruyu söylemem.', 1),
(46, 'Simdi her zamankinden daha iyi dusunup tartabiliyorum.', 1),
(47, 'Ortada hic bir neden yokken haftada bir ya da daha sik birdenbire her yanimi ates basar.', 1),
(48, 'Baskalari ile bir arada iken kulagima cok garip seyler gelmesinden rahatsiz olurum.', 1),
(49, 'Kanunlarin hemen hepsi kaldirilirsa daha iyi olur.', 1),
(50, 'Bazen ruhum vucudumdan ayrilir.', 1),
(51, 'Sagligim bircok arkadasiminki kadar iyidir.', 3),
(52, 'Uzun zamandan beri gormedigim okul arkadaslarim ya da tanidiklarim once benimle konusmazlarsa onlari gormemezlikten gelmeyi tercih ederim.', 6),
(53, 'Hocalarin dua okuyup uflemesi hastaligi iyilestirir.', 1),
(54, 'Tanidiklarimin cogu beni sever.', 1),
(55, 'Kalp ve gogus agrilarindan hemen hemen hic sikayetim yoktur.', 3),
(56, 'Cocukken okuldan kactigim icin bir iki defa cezalandirildim.', 1),
(57, 'Insanlarla cabucak kaynasirim.', 1),
(58, 'Kuranin buyurduklari bir bir cikmaktadir.', 1),
(59, 'Cok defa benden az bilenlerden emir alarak calismak zorunda kaldim.', 1),
(60, 'Her gun gazetelerin bas yazilarini okumam.', 1),
(61, 'Gerektigi gibi bir hayat yasayamadim.', 1),
(62, 'Vucudumun bazi yerlerinde cok defa yanma, gidiklanma, karincalanma veya uyusukluk hissederim.', 1),
(63, 'Buyuk abdest yapmada ya da tutmada hic bir gucluk cekmem.', 3),
(64, 'Bazen baskALARININ sabrini tuketecek kadar bir seye saplanip kalirim.', 1),
(65, 'Babami severim.', 2),
(66, 'Etrafimda baskALARININ gormedikleri esya ve hayvanlar ya da insanlar gorurum.', 1),
(67, 'BaskALARININ mutlu gorundugu kadar mutlu olmayi isterdim.', 5),
(68, 'Ensemde nadiren agri hissederim.', 3),
(69, 'Kendi cinsimden olanlari oldukca cekici bulurum.', 4),
(70, 'Korebe oyunundan hoslanirdim.', 1),
(71, 'Bircok kimseler baskALARININ ilgi ve yardimlarini saglamak icin talihsizliklerini abartirlar.', 1),
(72, 'Hemen hemen her gun mide agrilariNDAN rahatsiz olurum.', 3),
(73, 'Ben onemli bir kimseyim.', 1),
(74, 'Cogu zaman kiz olmayi isterdim. (Sayet kiz iseniz) Kiz olduguma hic uzulmedim.', 1),
(75, 'Arasira ofkelenirim.', 1),
(76, 'Cogu zaman kendimi huzunlu hissederim.', 5),
(77, 'Ask romanlari okumaktan hoslanirim.', 1),
(78, 'Siiri severim.', 1),
(79, 'Kolay incinmem.', 1),
(80, 'Bazen hayvanlara rahat vermem.', 1),
(81, 'Orman bekciligi gibi islerden hoslanacagimi saniyorum.', 1),
(82, 'Tartismalarda cabucak yenilirim.', 1),
(83, 'Cok calisabilen ya da calismak isteyen kisinin basarili olma sansi yuksektir.', 1),
(84, 'Bugunlerde artik hic ilerleme umudum kalmamis gibi hissediyorum.', 5),
(85, 'Kullanamayacak bile olsam bazen baskALARININ ayakkabi, eldiven vb. gibi ozel esyalari o kadar hosuma gider ki dokunmak ve asirmak isterim.', 1),
(86, 'Kendime hic guvenim yoktur.', 5),
(87, 'Cicek saticisi olmayi isterdim.', 1),
(88, 'Genel olarak hayatin yasanmaya deger oldugu kanisindayim.', 1),
(89, 'Insanlara gercegi kabul ettirmek guctur.', 1),
(90, 'Bugun yapmam gereken isleri ara sira yarina biraktigim olur.', 1),
(91, 'Benimle alay edilmesine aldirmam.', 1),
(92, 'Hemsire olmayi isterdim.', 1),
(93, 'Yukselmek icin bircok kisi yalan soylemekten cekinmez.', 1),
(94, 'Sonradan pisman olacagim pek cok seyi yaptigim olur.', 1),
(95, 'Namazimi hemen hemen muntazaman kilariM.', 1),
(96, 'Ailemle pek az kavga ederim.', 2),
(97, 'Bazen zararli ya da cok kotu isler yapmak icin icimde cok guclu bir istek duyarim.', 1),
(98, 'Kiyamet gunune inaniyorum.', 1),
(99, 'Gurultulu eglencelere katilmaktan hoslanirim.', 1),
(100, 'Bildigim bir konuda bir kimse sacma sapan ya da cahilce konusursa onu hemen duzeltirim.', 1)
ON CONFLICT (question_number) DO UPDATE SET question_text = EXCLUDED.question_text, category_id = EXCLUDED.category_id;

-- Note: question 101-567 are in dokumanlar/questions_insert.sql
-- This file contains all 567 questions. Run the full file if needed:
-- \i ../dokumanlar/questions_insert.sql

-- ============================================================
-- 2. SCORING KEYS
-- Source: dokumanlar/scoring_keys_insert.sql
-- ============================================================
INSERT INTO scoring_keys (scale_name, question_number, scoring_answer) VALUES
-- L Scale
('L', 96, 'Doğru'),
('L', 15, 'Yanlis'), ('L', 30, 'Yanlis'), ('L', 45, 'Yanlis'),
('L', 60, 'Yanlis'), ('L', 75, 'Yanlis'), ('L', 90, 'Yanlis'),
('L', 105, 'Yanlis'), ('L', 120, 'Yanlis'), ('L', 135, 'Yanlis'),
('L', 150, 'Yanlis'), ('L', 165, 'Yanlis'), ('L', 195, 'Yanlis'),
('L', 225, 'Yanlis'), ('L', 255, 'Yanlis'), ('L', 285, 'Yanlis'),
-- F Scale (Dogru)
('F', 14, 'Doğru'), ('F', 23, 'Doğru'), ('F', 27, 'Doğru'),
('F', 31, 'Doğru'), ('F', 34, 'Doğru'), ('F', 35, 'Doğru'),
('F', 40, 'Doğru'), ('F', 42, 'Doğru'), ('F', 48, 'Doğru'),
('F', 49, 'Doğru'), ('F', 50, 'Doğru'), ('F', 53, 'Doğru'),
('F', 56, 'Doğru'), ('F', 66, 'Doğru'), ('F', 85, 'Doğru'),
('F', 121, 'Doğru'), ('F', 123, 'Doğru'), ('F', 139, 'Doğru'),
('F', 146, 'Doğru'), ('F', 151, 'Doğru'), ('F', 156, 'Doğru'),
('F', 168, 'Doğru'), ('F', 184, 'Doğru'), ('F', 197, 'Doğru'),
('F', 200, 'Doğru'), ('F', 202, 'Doğru'), ('F', 205, 'Doğru'),
('F', 206, 'Doğru'), ('F', 209, 'Doğru'), ('F', 210, 'Doğru'),
('F', 211, 'Doğru'), ('F', 215, 'Doğru'), ('F', 218, 'Doğru'),
('F', 227, 'Doğru'), ('F', 245, 'Doğru'), ('F', 246, 'Doğru'),
('F', 247, 'Doğru'), ('F', 252, 'Doğru'), ('F', 256, 'Doğru'),
('F', 269, 'Doğru'), ('F', 275, 'Doğru'), ('F', 286, 'Doğru'),
('F', 291, 'Doğru'), ('F', 293, 'Doğru'),
-- F Scale (Yanlis)
('F', 17, 'Yanlis'), ('F', 20, 'Yanlis'), ('F', 54, 'Yanlis'),
('F', 65, 'Yanlis'), ('F', 75, 'Yanlis'), ('F', 83, 'Yanlis'),
('F', 112, 'Yanlis'), ('F', 113, 'Yanlis'), ('F', 115, 'Yanlis'),
('F', 164, 'Yanlis'), ('F', 169, 'Yanlis'), ('F', 177, 'Yanlis'),
('F', 185, 'Yanlis'), ('F', 196, 'Yanlis'), ('F', 199, 'Yanlis'),
('F', 220, 'Yanlis'), ('F', 257, 'Yanlis'), ('F', 258, 'Yanlis'),
('F', 272, 'Yanlis'), ('F', 276, 'Yanlis'),
-- K Scale
('K', 96, 'Doğru'),
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

-- Hs Scale (Hipokondriazis)
INSERT INTO scoring_keys (scale_name, question_number, scoring_answer) VALUES
('Hs', 23, 'Doğru'), ('Hs', 29, 'Doğru'), ('Hs', 43, 'Doğru'),
('Hs', 62, 'Doğru'), ('Hs', 72, 'Doğru'), ('Hs', 108, 'Doğru'),
('Hs', 114, 'Doğru'), ('Hs', 125, 'Doğru'), ('Hs', 161, 'Doğru'),
('Hs', 189, 'Doğru'), ('Hs', 273, 'Doğru')
ON CONFLICT (scale_name, question_number) DO NOTHING;
INSERT INTO scoring_keys (scale_name, question_number, scoring_answer) VALUES
('Hs', 2, 'Yanlis'), ('Hs', 3, 'Yanlis'), ('Hs', 7, 'Yanlis'),
('Hs', 9, 'Yanlis'), ('Hs', 18, 'Yanlis'), ('Hs', 51, 'Yanlis'),
('Hs', 55, 'Yanlis'), ('Hs', 63, 'Yanlis'), ('Hs', 68, 'Yanlis'),
('Hs', 103, 'Yanlis'), ('Hs', 130, 'Yanlis'), ('Hs', 153, 'Yanlis'),
('Hs', 155, 'Yanlis'), ('Hs', 163, 'Yanlis'), ('Hs', 175, 'Yanlis'),
('Hs', 188, 'Yanlis'), ('Hs', 190, 'Yanlis'), ('Hs', 192, 'Yanlis'),
('Hs', 230, 'Yanlis'), ('Hs', 243, 'Yanlis'), ('Hs', 274, 'Yanlis'),
('Hs', 281, 'Yanlis')
ON CONFLICT (scale_name, question_number) DO NOTHING;

-- D Scale (Depresyon)
INSERT INTO scoring_keys (scale_name, question_number, scoring_answer) VALUES
('D', 5, 'Doğru'), ('D', 13, 'Doğru'), ('D', 23, 'Doğru'),
('D', 32, 'Doğru'), ('D', 41, 'Doğru'), ('D', 43, 'Doğru'),
('D', 52, 'Doğru'), ('D', 67, 'Doğru'), ('D', 86, 'Doğru'),
('D', 104, 'Doğru'), ('D', 130, 'Doğru'), ('D', 138, 'Doğru'),
('D', 142, 'Doğru'), ('D', 158, 'Doğru'), ('D', 159, 'Doğru'),
('D', 182, 'Doğru'), ('D', 189, 'Doğru'), ('D', 193, 'Doğru'),
('D', 236, 'Doğru'), ('D', 259, 'Doğru')
ON CONFLICT (scale_name, question_number) DO NOTHING;
INSERT INTO scoring_keys (scale_name, question_number, scoring_answer) VALUES
('D', 2, 'Yanlis'), ('D', 8, 'Yanlis'), ('D', 9, 'Yanlis'),
('D', 18, 'Yanlis'), ('D', 30, 'Yanlis'), ('D', 36, 'Yanlis'),
('D', 39, 'Yanlis'), ('D', 46, 'Yanlis'), ('D', 51, 'Yanlis'),
('D', 57, 'Yanlis'), ('D', 58, 'Yanlis'), ('D', 64, 'Yanlis'),
('D', 80, 'Yanlis'), ('D', 88, 'Yanlis'), ('D', 89, 'Yanlis'),
('D', 95, 'Yanlis'), ('D', 98, 'Yanlis'), ('D', 107, 'Yanlis'),
('D', 122, 'Yanlis'), ('D', 131, 'Yanlis'), ('D', 145, 'Yanlis'),
('D', 152, 'Yanlis'), ('D', 153, 'Yanlis'), ('D', 154, 'Yanlis'),
('D', 155, 'Yanlis'), ('D', 160, 'Yanlis'), ('D', 178, 'Yanlis'),
('D', 191, 'Yanlis'), ('D', 207, 'Yanlis'), ('D', 208, 'Yanlis'),
('D', 233, 'Yanlis'), ('D', 241, 'Yanlis'), ('D', 242, 'Yanlis'),
('D', 248, 'Yanlis'), ('D', 263, 'Yanlis'), ('D', 270, 'Yanlis'),
('D', 271, 'Yanlis'), ('D', 272, 'Yanlis'), ('D', 285, 'Yanlis'),
('D', 296, 'Yanlis')
ON CONFLICT (scale_name, question_number) DO NOTHING;

-- Hy Scale (Histeri)
INSERT INTO scoring_keys (scale_name, question_number, scoring_answer) VALUES
('Hy', 10, 'Doğru'), ('Hy', 23, 'Doğru'), ('Hy', 32, 'Doğru'),
('Hy', 43, 'Doğru'), ('Hy', 44, 'Doğru'), ('Hy', 47, 'Doğru'),
('Hy', 76, 'Doğru'), ('Hy', 114, 'Doğru'), ('Hy', 179, 'Doğru'),
('Hy', 186, 'Doğru'), ('Hy', 189, 'Doğru'), ('Hy', 238, 'Doğru'),
('Hy', 253, 'Doğru')
ON CONFLICT (scale_name, question_number) DO NOTHING;
INSERT INTO scoring_keys (scale_name, question_number, scoring_answer) VALUES
('Hy', 2, 'Yanlis'), ('Hy', 3, 'Yanlis'), ('Hy', 6, 'Yanlis'),
('Hy', 7, 'Yanlis'), ('Hy', 8, 'Yanlis'), ('Hy', 9, 'Yanlis'),
('Hy', 12, 'Yanlis'), ('Hy', 26, 'Yanlis'), ('Hy', 30, 'Yanlis'),
('Hy', 51, 'Yanlis'), ('Hy', 55, 'Yanlis'), ('Hy', 71, 'Yanlis'),
('Hy', 89, 'Yanlis'), ('Hy', 93, 'Yanlis'), ('Hy', 103, 'Yanlis'),
('Hy', 107, 'Yanlis'), ('Hy', 109, 'Yanlis'), ('Hy', 124, 'Yanlis'),
('Hy', 128, 'Yanlis'), ('Hy', 129, 'Yanlis'), ('Hy', 136, 'Yanlis'),
('Hy', 137, 'Yanlis'), ('Hy', 141, 'Yanlis'), ('Hy', 147, 'Yanlis'),
('Hy', 153, 'Yanlis'), ('Hy', 160, 'Yanlis'), ('Hy', 162, 'Yanlis'),
('Hy', 163, 'Yanlis'), ('Hy', 170, 'Yanlis'), ('Hy', 172, 'Yanlis'),
('Hy', 174, 'Yanlis'), ('Hy', 175, 'Yanlis'), ('Hy', 180, 'Yanlis'),
('Hy', 188, 'Yanlis'), ('Hy', 190, 'Yanlis'), ('Hy', 192, 'Yanlis'),
('Hy', 201, 'Yanlis'), ('Hy', 213, 'Yanlis'), ('Hy', 230, 'Yanlis'),
('Hy', 234, 'Yanlis'), ('Hy', 243, 'Yanlis'), ('Hy', 265, 'Yanlis'),
('Hy', 267, 'Yanlis'), ('Hy', 274, 'Yanlis'), ('Hy', 279, 'Yanlis'),
('Hy', 289, 'Yanlis'), ('Hy', 292, 'Yanlis')
ON CONFLICT (scale_name, question_number) DO NOTHING;

-- Pd Scale (Psikopatik Sapma)
INSERT INTO scoring_keys (scale_name, question_number, scoring_answer) VALUES
('Pd', 16, 'Doğru'), ('Pd', 21, 'Doğru'), ('Pd', 24, 'Doğru'),
('Pd', 32, 'Doğru'), ('Pd', 33, 'Doğru'), ('Pd', 35, 'Doğru'),
('Pd', 38, 'Doğru'), ('Pd', 42, 'Doğru'), ('Pd', 61, 'Doğru'),
('Pd', 67, 'Doğru'), ('Pd', 84, 'Doğru'), ('Pd', 94, 'Doğru'),
('Pd', 102, 'Doğru'), ('Pd', 106, 'Doğru'), ('Pd', 110, 'Doğru'),
('Pd', 118, 'Doğru'), ('Pd', 127, 'Doğru'), ('Pd', 215, 'Doğru'),
('Pd', 216, 'Doğru'), ('Pd', 224, 'Doğru'), ('Pd', 239, 'Doğru'),
('Pd', 244, 'Doğru'), ('Pd', 245, 'Doğru'), ('Pd', 284, 'Doğru')
ON CONFLICT (scale_name, question_number) DO NOTHING;
INSERT INTO scoring_keys (scale_name, question_number, scoring_answer) VALUES
('Pd', 8, 'Yanlis'), ('Pd', 20, 'Yanlis'), ('Pd', 37, 'Yanlis'),
('Pd', 82, 'Yanlis'), ('Pd', 91, 'Yanlis'), ('Pd', 96, 'Yanlis'),
('Pd', 107, 'Yanlis'), ('Pd', 134, 'Yanlis'), ('Pd', 137, 'Yanlis'),
('Pd', 141, 'Yanlis'), ('Pd', 155, 'Yanlis'), ('Pd', 170, 'Yanlis'),
('Pd', 171, 'Yanlis'), ('Pd', 173, 'Yanlis'), ('Pd', 180, 'Yanlis'),
('Pd', 183, 'Yanlis'), ('Pd', 201, 'Yanlis'), ('Pd', 231, 'Yanlis'),
('Pd', 235, 'Yanlis'), ('Pd', 237, 'Yanlis'), ('Pd', 248, 'Yanlis'),
('Pd', 267, 'Yanlis'), ('Pd', 287, 'Yanlis'), ('Pd', 289, 'Yanlis'),
('Pd', 294, 'Yanlis'), ('Pd', 296, 'Yanlis')
ON CONFLICT (scale_name, question_number) DO NOTHING;

-- Mf_Male Scale (Maskülinite-Femininite - Erkek)
INSERT INTO scoring_keys (scale_name, question_number, scoring_answer) VALUES
('Mf_Male', 4, 'Doğru'), ('Mf_Male', 25, 'Doğru'), ('Mf_Male', 69, 'Doğru'),
('Mf_Male', 70, 'Doğru'), ('Mf_Male', 74, 'Doğru'), ('Mf_Male', 77, 'Doğru'),
('Mf_Male', 78, 'Doğru'), ('Mf_Male', 87, 'Doğru'), ('Mf_Male', 92, 'Doğru'),
('Mf_Male', 126, 'Doğru'), ('Mf_Male', 132, 'Doğru'), ('Mf_Male', 134, 'Doğru'),
('Mf_Male', 140, 'Doğru'), ('Mf_Male', 149, 'Doğru'), ('Mf_Male', 179, 'Doğru'),
('Mf_Male', 187, 'Doğru'), ('Mf_Male', 203, 'Doğru'), ('Mf_Male', 204, 'Doğru'),
('Mf_Male', 217, 'Doğru'), ('Mf_Male', 226, 'Doğru'), ('Mf_Male', 231, 'Doğru'),
('Mf_Male', 239, 'Doğru'), ('Mf_Male', 261, 'Doğru'), ('Mf_Male', 278, 'Doğru'),
('Mf_Male', 282, 'Doğru'), ('Mf_Male', 295, 'Doğru'), ('Mf_Male', 297, 'Doğru'),
('Mf_Male', 299, 'Doğru')
ON CONFLICT (scale_name, question_number) DO NOTHING;
INSERT INTO scoring_keys (scale_name, question_number, scoring_answer) VALUES
('Mf_Male', 1, 'Yanlis'), ('Mf_Male', 19, 'Yanlis'), ('Mf_Male', 26, 'Yanlis'),
('Mf_Male', 28, 'Yanlis'), ('Mf_Male', 79, 'Yanlis'), ('Mf_Male', 80, 'Yanlis'),
('Mf_Male', 81, 'Yanlis'), ('Mf_Male', 89, 'Yanlis'), ('Mf_Male', 99, 'Yanlis'),
('Mf_Male', 112, 'Yanlis'), ('Mf_Male', 115, 'Yanlis'), ('Mf_Male', 116, 'Yanlis'),
('Mf_Male', 117, 'Yanlis'), ('Mf_Male', 120, 'Yanlis'), ('Mf_Male', 133, 'Yanlis'),
('Mf_Male', 144, 'Yanlis'), ('Mf_Male', 176, 'Yanlis'), ('Mf_Male', 198, 'Yanlis'),
('Mf_Male', 213, 'Yanlis'), ('Mf_Male', 214, 'Yanlis'), ('Mf_Male', 219, 'Yanlis'),
('Mf_Male', 221, 'Yanlis'), ('Mf_Male', 223, 'Yanlis'), ('Mf_Male', 229, 'Yanlis'),
('Mf_Male', 249, 'Yanlis'), ('Mf_Male', 254, 'Yanlis'), ('Mf_Male', 260, 'Yanlis'),
('Mf_Male', 262, 'Yanlis'), ('Mf_Male', 264, 'Yanlis'), ('Mf_Male', 280, 'Yanlis'),
('Mf_Male', 283, 'Yanlis'), ('Mf_Male', 300, 'Yanlis')
ON CONFLICT (scale_name, question_number) DO NOTHING;

-- Mf_Female Scale (Maskülinite-Femininite - Kadın)
INSERT INTO scoring_keys (scale_name, question_number, scoring_answer) VALUES
('Mf_Female', 4, 'Doğru'), ('Mf_Female', 25, 'Doğru'), ('Mf_Female', 70, 'Doğru'),
('Mf_Female', 74, 'Doğru'), ('Mf_Female', 77, 'Doğru'), ('Mf_Female', 78, 'Doğru'),
('Mf_Female', 87, 'Doğru'), ('Mf_Female', 92, 'Doğru'), ('Mf_Female', 126, 'Doğru'),
('Mf_Female', 132, 'Doğru'), ('Mf_Female', 133, 'Doğru'), ('Mf_Female', 134, 'Doğru'),
('Mf_Female', 140, 'Doğru'), ('Mf_Female', 149, 'Doğru'), ('Mf_Female', 187, 'Doğru'),
('Mf_Female', 203, 'Doğru'), ('Mf_Female', 204, 'Doğru'), ('Mf_Female', 217, 'Doğru'),
('Mf_Female', 226, 'Doğru'), ('Mf_Female', 239, 'Doğru'), ('Mf_Female', 261, 'Doğru'),
('Mf_Female', 278, 'Doğru'), ('Mf_Female', 282, 'Doğru'), ('Mf_Female', 295, 'Doğru'),
('Mf_Female', 299, 'Doğru')
ON CONFLICT (scale_name, question_number) DO NOTHING;
INSERT INTO scoring_keys (scale_name, question_number, scoring_answer) VALUES
('Mf_Female', 1, 'Yanlis'), ('Mf_Female', 19, 'Yanlis'), ('Mf_Female', 26, 'Yanlis'),
('Mf_Female', 28, 'Yanlis'), ('Mf_Female', 69, 'Yanlis'), ('Mf_Female', 79, 'Yanlis'),
('Mf_Female', 80, 'Yanlis'), ('Mf_Female', 81, 'Yanlis'), ('Mf_Female', 89, 'Yanlis'),
('Mf_Female', 99, 'Yanlis'), ('Mf_Female', 112, 'Yanlis'), ('Mf_Female', 115, 'Yanlis'),
('Mf_Female', 116, 'Yanlis'), ('Mf_Female', 117, 'Yanlis'), ('Mf_Female', 120, 'Yanlis'),
('Mf_Female', 144, 'Yanlis'), ('Mf_Female', 176, 'Yanlis'), ('Mf_Female', 179, 'Yanlis'),
('Mf_Female', 198, 'Yanlis'), ('Mf_Female', 213, 'Yanlis'), ('Mf_Female', 214, 'Yanlis'),
('Mf_Female', 219, 'Yanlis'), ('Mf_Female', 221, 'Yanlis'), ('Mf_Female', 223, 'Yanlis'),
('Mf_Female', 229, 'Yanlis'), ('Mf_Female', 231, 'Yanlis'), ('Mf_Female', 249, 'Yanlis'),
('Mf_Female', 254, 'Yanlis'), ('Mf_Female', 260, 'Yanlis'), ('Mf_Female', 262, 'Yanlis'),
('Mf_Female', 264, 'Yanlis'), ('Mf_Female', 280, 'Yanlis'), ('Mf_Female', 283, 'Yanlis'),
('Mf_Female', 297, 'Yanlis'), ('Mf_Female', 300, 'Yanlis')
ON CONFLICT (scale_name, question_number) DO NOTHING;

-- Pa Scale (Paranoya)
INSERT INTO scoring_keys (scale_name, question_number, scoring_answer) VALUES
('Pa', 15, 'Doğru'), ('Pa', 16, 'Doğru'), ('Pa', 22, 'Doğru'),
('Pa', 24, 'Doğru'), ('Pa', 27, 'Doğru'), ('Pa', 35, 'Doğru'),
('Pa', 110, 'Doğru'), ('Pa', 121, 'Doğru'), ('Pa', 123, 'Doğru'),
('Pa', 127, 'Doğru'), ('Pa', 151, 'Doğru'), ('Pa', 157, 'Doğru'),
('Pa', 158, 'Doğru'), ('Pa', 202, 'Doğru'), ('Pa', 275, 'Doğru'),
('Pa', 284, 'Doğru'), ('Pa', 291, 'Doğru'), ('Pa', 293, 'Doğru'),
('Pa', 299, 'Doğru'), ('Pa', 305, 'Doğru'), ('Pa', 317, 'Doğru'),
('Pa', 338, 'Doğru'), ('Pa', 341, 'Doğru'), ('Pa', 364, 'Doğru'),
('Pa', 365, 'Doğru')
ON CONFLICT (scale_name, question_number) DO NOTHING;
INSERT INTO scoring_keys (scale_name, question_number, scoring_answer) VALUES
('Pa', 93, 'Yanlis'), ('Pa', 107, 'Yanlis'), ('Pa', 109, 'Yanlis'),
('Pa', 111, 'Yanlis'), ('Pa', 117, 'Yanlis'), ('Pa', 124, 'Yanlis'),
('Pa', 268, 'Yanlis'), ('Pa', 281, 'Yanlis'), ('Pa', 294, 'Yanlis'),
('Pa', 313, 'Yanlis'), ('Pa', 316, 'Yanlis'), ('Pa', 319, 'Yanlis'),
('Pa', 327, 'Yanlis'), ('Pa', 347, 'Yanlis'), ('Pa', 348, 'Yanlis')
ON CONFLICT (scale_name, question_number) DO NOTHING;

-- Pt Scale (Psikasteni)
INSERT INTO scoring_keys (scale_name, question_number, scoring_answer) VALUES
('Pt', 10, 'Doğru'), ('Pt', 15, 'Doğru'), ('Pt', 22, 'Doğru'),
('Pt', 32, 'Doğru'), ('Pt', 41, 'Doğru'), ('Pt', 67, 'Doğru'),
('Pt', 76, 'Doğru'), ('Pt', 86, 'Doğru'), ('Pt', 94, 'Doğru'),
('Pt', 102, 'Doğru'), ('Pt', 106, 'Doğru'), ('Pt', 142, 'Doğru'),
('Pt', 159, 'Doğru'), ('Pt', 182, 'Doğru'), ('Pt', 189, 'Doğru'),
('Pt', 217, 'Doğru'), ('Pt', 238, 'Doğru'), ('Pt', 266, 'Doğru'),
('Pt', 301, 'Doğru'), ('Pt', 304, 'Doğru'), ('Pt', 305, 'Doğru'),
('Pt', 317, 'Doğru'), ('Pt', 321, 'Doğru'), ('Pt', 336, 'Doğru'),
('Pt', 337, 'Doğru'), ('Pt', 340, 'Doğru'), ('Pt', 342, 'Doğru'),
('Pt', 343, 'Doğru'), ('Pt', 344, 'Doğru'), ('Pt', 346, 'Doğru'),
('Pt', 349, 'Doğru'), ('Pt', 351, 'Doğru'), ('Pt', 352, 'Doğru'),
('Pt', 356, 'Doğru'), ('Pt', 357, 'Doğru'), ('Pt', 358, 'Doğru'),
('Pt', 359, 'Doğru'), ('Pt', 360, 'Doğru'), ('Pt', 361, 'Doğru')
ON CONFLICT (scale_name, question_number) DO NOTHING;
INSERT INTO scoring_keys (scale_name, question_number, scoring_answer) VALUES
('Pt', 3, 'Yanlis'), ('Pt', 8, 'Yanlis'), ('Pt', 36, 'Yanlis'),
('Pt', 122, 'Yanlis'), ('Pt', 152, 'Yanlis'), ('Pt', 164, 'Yanlis'),
('Pt', 178, 'Yanlis'), ('Pt', 329, 'Yanlis'), ('Pt', 353, 'Yanlis')
ON CONFLICT (scale_name, question_number) DO NOTHING;

-- Sc Scale (Şizofreni)
INSERT INTO scoring_keys (scale_name, question_number, scoring_answer) VALUES
('Sc', 15, 'Doğru'), ('Sc', 16, 'Doğru'), ('Sc', 21, 'Doğru'),
('Sc', 22, 'Doğru'), ('Sc', 24, 'Doğru'), ('Sc', 32, 'Doğru'),
('Sc', 33, 'Doğru'), ('Sc', 35, 'Doğru'), ('Sc', 38, 'Doğru'),
('Sc', 40, 'Doğru'), ('Sc', 41, 'Doğru'), ('Sc', 47, 'Doğru'),
('Sc', 52, 'Doğru'), ('Sc', 76, 'Doğru'), ('Sc', 97, 'Doğru'),
('Sc', 104, 'Doğru'), ('Sc', 121, 'Doğru'), ('Sc', 156, 'Doğru'),
('Sc', 157, 'Doğru'), ('Sc', 159, 'Doğru'), ('Sc', 168, 'Doğru'),
('Sc', 179, 'Doğru'), ('Sc', 182, 'Doğru'), ('Sc', 194, 'Doğru'),
('Sc', 202, 'Doğru'), ('Sc', 210, 'Doğru'), ('Sc', 212, 'Doğru'),
('Sc', 238, 'Doğru'), ('Sc', 241, 'Doğru'), ('Sc', 251, 'Doğru'),
('Sc', 259, 'Doğru'), ('Sc', 266, 'Doğru'), ('Sc', 273, 'Doğru'),
('Sc', 282, 'Doğru'), ('Sc', 291, 'Doğru'), ('Sc', 297, 'Doğru'),
('Sc', 301, 'Doğru'), ('Sc', 303, 'Doğru'), ('Sc', 305, 'Doğru'),
('Sc', 307, 'Doğru'), ('Sc', 312, 'Doğru'), ('Sc', 320, 'Doğru'),
('Sc', 324, 'Doğru'), ('Sc', 325, 'Doğru'), ('Sc', 332, 'Doğru'),
('Sc', 334, 'Doğru'), ('Sc', 335, 'Doğru'), ('Sc', 339, 'Doğru'),
('Sc', 341, 'Doğru'), ('Sc', 345, 'Doğru'), ('Sc', 349, 'Doğru'),
('Sc', 350, 'Doğru'), ('Sc', 352, 'Doğru'), ('Sc', 354, 'Doğru'),
('Sc', 355, 'Doğru'), ('Sc', 356, 'Doğru'), ('Sc', 360, 'Doğru'),
('Sc', 363, 'Doğru'), ('Sc', 364, 'Doğru')
ON CONFLICT (scale_name, question_number) DO NOTHING;
INSERT INTO scoring_keys (scale_name, question_number, scoring_answer) VALUES
('Sc', 8, 'Yanlis'), ('Sc', 17, 'Yanlis'), ('Sc', 20, 'Yanlis'),
('Sc', 37, 'Yanlis'), ('Sc', 65, 'Yanlis'), ('Sc', 103, 'Yanlis'),
('Sc', 119, 'Yanlis'), ('Sc', 177, 'Yanlis'), ('Sc', 178, 'Yanlis'),
('Sc', 187, 'Yanlis'), ('Sc', 192, 'Yanlis'), ('Sc', 196, 'Yanlis'),
('Sc', 220, 'Yanlis'), ('Sc', 276, 'Yanlis'), ('Sc', 281, 'Yanlis'),
('Sc', 306, 'Yanlis'), ('Sc', 309, 'Yanlis'), ('Sc', 322, 'Yanlis'),
('Sc', 330, 'Yanlis')
ON CONFLICT (scale_name, question_number) DO NOTHING;

-- Ma Scale (Hipomani)
INSERT INTO scoring_keys (scale_name, question_number, scoring_answer) VALUES
('Ma', 11, 'Doğru'), ('Ma', 13, 'Doğru'), ('Ma', 21, 'Doğru'),
('Ma', 22, 'Doğru'), ('Ma', 59, 'Doğru'), ('Ma', 64, 'Doğru'),
('Ma', 73, 'Doğru'), ('Ma', 97, 'Doğru'), ('Ma', 100, 'Doğru'),
('Ma', 109, 'Doğru'), ('Ma', 127, 'Doğru'), ('Ma', 134, 'Doğru'),
('Ma', 143, 'Doğru'), ('Ma', 156, 'Doğru'), ('Ma', 157, 'Doğru'),
('Ma', 167, 'Doğru'), ('Ma', 181, 'Doğru'), ('Ma', 194, 'Doğru'),
('Ma', 212, 'Doğru'), ('Ma', 222, 'Doğru'), ('Ma', 226, 'Doğru'),
('Ma', 228, 'Doğru'), ('Ma', 232, 'Doğru'), ('Ma', 233, 'Doğru'),
('Ma', 238, 'Doğru'), ('Ma', 240, 'Doğru'), ('Ma', 250, 'Doğru'),
('Ma', 251, 'Doğru'), ('Ma', 263, 'Doğru'), ('Ma', 266, 'Doğru'),
('Ma', 268, 'Doğru'), ('Ma', 271, 'Doğru'), ('Ma', 277, 'Doğru'),
('Ma', 279, 'Doğru'), ('Ma', 298, 'Doğru')
ON CONFLICT (scale_name, question_number) DO NOTHING;
INSERT INTO scoring_keys (scale_name, question_number, scoring_answer) VALUES
('Ma', 101, 'Yanlis'), ('Ma', 105, 'Yanlis'), ('Ma', 111, 'Yanlis'),
('Ma', 119, 'Yanlis'), ('Ma', 120, 'Yanlis'), ('Ma', 148, 'Yanlis'),
('Ma', 166, 'Yanlis'), ('Ma', 171, 'Yanlis'), ('Ma', 180, 'Yanlis'),
('Ma', 267, 'Yanlis'), ('Ma', 289, 'Yanlis')
ON CONFLICT (scale_name, question_number) DO NOTHING;

-- Si Scale (Sosyal İçedönüklük)
INSERT INTO scoring_keys (scale_name, question_number, scoring_answer) VALUES
('Si', 32, 'Doğru'), ('Si', 67, 'Doğru'), ('Si', 82, 'Doğru'),
('Si', 111, 'Doğru'), ('Si', 117, 'Doğru'), ('Si', 124, 'Doğru'),
('Si', 138, 'Doğru'), ('Si', 147, 'Doğru'), ('Si', 171, 'Doğru'),
('Si', 172, 'Doğru'), ('Si', 180, 'Doğru'), ('Si', 201, 'Doğru'),
('Si', 236, 'Doğru'), ('Si', 267, 'Doğru'), ('Si', 278, 'Doğru'),
('Si', 292, 'Doğru'), ('Si', 304, 'Doğru'), ('Si', 316, 'Doğru'),
('Si', 321, 'Doğru'), ('Si', 332, 'Doğru'), ('Si', 336, 'Doğru'),
('Si', 342, 'Doğru'), ('Si', 357, 'Doğru'), ('Si', 377, 'Doğru'),
('Si', 383, 'Doğru'), ('Si', 398, 'Doğru'), ('Si', 411, 'Doğru'),
('Si', 427, 'Doğru'), ('Si', 436, 'Doğru'), ('Si', 455, 'Doğru'),
('Si', 473, 'Doğru'), ('Si', 487, 'Doğru'), ('Si', 549, 'Doğru'),
('Si', 564, 'Doğru')
ON CONFLICT (scale_name, question_number) DO NOTHING;
INSERT INTO scoring_keys (scale_name, question_number, scoring_answer) VALUES
('Si', 25, 'Yanlis'), ('Si', 33, 'Yanlis'), ('Si', 57, 'Yanlis'),
('Si', 91, 'Yanlis'), ('Si', 99, 'Yanlis'), ('Si', 119, 'Yanlis'),
('Si', 126, 'Yanlis'), ('Si', 143, 'Yanlis'), ('Si', 193, 'Yanlis'),
('Si', 208, 'Yanlis'), ('Si', 229, 'Yanlis'), ('Si', 231, 'Yanlis'),
('Si', 254, 'Yanlis'), ('Si', 262, 'Yanlis'), ('Si', 281, 'Yanlis'),
('Si', 296, 'Yanlis'), ('Si', 309, 'Yanlis'), ('Si', 353, 'Yanlis'),
('Si', 359, 'Yanlis'), ('Si', 371, 'Yanlis'), ('Si', 391, 'Yanlis'),
('Si', 400, 'Yanlis'), ('Si', 415, 'Yanlis'), ('Si', 440, 'Yanlis'),
('Si', 446, 'Yanlis'), ('Si', 449, 'Yanlis'), ('Si', 450, 'Yanlis'),
('Si', 451, 'Yanlis'), ('Si', 462, 'Yanlis'), ('Si', 469, 'Yanlis'),
('Si', 479, 'Yanlis'), ('Si', 481, 'Yanlis'), ('Si', 482, 'Yanlis'),
('Si', 505, 'Yanlis'), ('Si', 521, 'Yanlis'), ('Si', 547, 'Yanlis')
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
'<p>OGULTURK A.S. olarak, bireylerin kisisel ve toplumsal uyumlarini objektif bir sekilde degerlendirmek amaciyla MMPI test hizmeti sunuyoruz.</p>')
ON CONFLICT (page_key) DO NOTHING;

-- ============================================================
-- 7. SETTINGS
-- ============================================================
INSERT INTO settings (setting_key, setting_value) VALUES
('test_version', 'MMPI'),
('max_dont_know', '10'),
('auto_save_interval', '30000'),
('app_name', 'MMPI Psikolojik Degerlendirme Sistemi')
ON CONFLICT (setting_key) DO NOTHING;

COMMIT;

-- ============================================================
-- Data imported successfully.
-- Next: psql -U mmpi_user -d mmpi_db -f 03_setup_admin.sql
-- ============================================================
