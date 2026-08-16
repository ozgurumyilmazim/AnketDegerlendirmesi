# Kullanıcı Etkileşimi Kılavuzu

Bu belge, **MMPI Testi** arayüzünde doğru/yanlış cevaplarını seçmek için yeni eklenen etkileşim modellerini açıklar.

## Masaüstü (Desktop) Kullanıcıları

- **Sol Tıklama (Left Click)**: `Doğru` (True) seçeneğini işaretler.
- **Sağ Tıklama (Right Click)**: `Yanlış` (False) seçeneğini işaretler.

> **Not:** Sağ tıklama menüsü (context menu) devre dışı bırakılmıştır, böylece sadece yanıt seçimi gerçekleşir.

## Mobil Kullanıcılar

- **Sağ Kaydırma (Swipe Right)**: `Doğru` (True) seçeneğini işaretler.
- **Sol Kaydırma (Swipe Left)**: `Yanlış` (False) seçeneğini işaretler.
- Kaydırma mesafesi **30 piksel** den büyük olmalıdır (hassasiyet ayarı).

## Teknik Detaylar

- Tüm işlemler **jQuery** aracılığıyla `.answer-option` sınıfına bağlı elementlerde gerçekleşir.
- `mousedown` ve `touchstart/touchend` olayları içinde ilgili radyo butonları (`#answerTrue` veya `#answerFalse`) `prop('checked', true)` ile işaretlenir ve ardından `this.handleAnswerChange();` çağrılarak test durumu güncellenir.
- Mobil kaydırma algılaması için başlangıç X koordinatı (`touchStartX`) kaydedilir ve bitişte fark (`deltaX`) incelenir.

## Kullanım

Bu etkileşimler, mevcut test akışını değiştirmez; sadece kullanıcıların daha hızlı yanıt vermesini sağlar. Her iki platformda da **klavye kısayolları** (1/D ve 2/Y) hâlâ çalışmaktadır.

---

*Bu doküman, `dokumanlar/INTERACTION_GUIDE.md` dosyasında bulunmaktadır.*
