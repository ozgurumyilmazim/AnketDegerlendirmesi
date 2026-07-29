# 🚀 Project Roadmap & TODO

Bu dosya projenin geliştirme adımlarını ve ajana verilecek görevleri içerir.

---

## ⏳ Sıradaki Görev (In Progress)
<!-- Şu an aktif işlenen tek görevi buraya taşı -->

- [ ] **[DB-01] Cinsiyet (Gender) Kolonunun Refaktör Edilmesi**
  - **Mevcut Durum:** Veritabanında `Cinsiyet` kolonu string olarak `"erkek"` / `"kadin"` değerlerini tutuyor.
  - **Hedef:** Bu yapıyı enum formatına (`MALE`, `FEMALE`, `OTHER`, `PREFER_NOT_TO_SAY`) çevirmek ve veritabanı standartlarına uygun hale getirmek (İngilizce isimlendirme: `gender`). Karışıklığı engellemek için, cinsiyetin tanımı için ayrı bir tablo oluşturulmalı ve bu tablo üzerinden değerler tutulmalı. Bu tabloda id, kod, tanım, durum, oluşturma tarihi, güncellenme tarihi ve açıklama alanları olmalı. Uygulama dili türkçe. Bu yüzden sadece türkçe açıklama yeterli olacaktır. Bu değişikliği yaparken, bu tablonun oluşturulmasını sağlayan migration dosyalarını da oluşturmalısın.
  - **Kapsam / Etkilenecek Dosyalar:**
    - Veritabanı şeması ve migration dosyaları
    - Backend User modeli ve DTO/Request tipleri
    - Frontend profil ve kayıt formları
  - **Kabul Kriterleri (Acceptance Criteria):**
    - [ ] DB migration sorunsuz çalışmalı, mevcut veriler yeni enum'a map edilmeli.
    - [ ] API endpoint'leri yeni `gender` enum değerlerini kabul etmeli.
    - [ ] Type tanımları (Typescript/Python/C# vb.) güncellenmeli.

---

## 📋 Bekleyen Görevler (Backlog)

### 🗄️ Veritabanı & Arka Yüz (Backend)
- [ ] **[BE-01] Kullanıcı Silme İşlemi (Soft Delete)**
  - Users tablosuna `deleted_at` ekle, hard-delete yerine soft-delete uygula.

### 🎨 Ön Yüz (Frontend)
- [ ] **[FE-01] Profil Sayfasında Cinsiyet Alanını Güncelleme**
  - `[DB-01]` bittikten sonra frontend formundaki select-box seçeneklerini yeni enum yapısıyla eşitle.

---

## ✅ Tamamlananlar (Done)
- [x] **[SETUP-01]** Proje iskeletinin ve veritabanı bağlantısının kurulması.