// MMPI-A Test Soruları
// Minnesota Multiphasic Personality Inventory - Adolescent

// MMPI-A Ölçek Kategorileri
const mmpiScales = {
    // Geçerlilik Ölçekleri
    lie: {
        name: "Yalan (L)",
        description: "Kendini olduğundan iyi gösterme eğilimi",
        questions: [45, 60, 120] // Örnek sorular
    },
    
    // Klinik Ölçekler
    depression: {
        name: "Depresyon (D)",
        description: "Depresif belirtiler ve genel mutsuzluk",
        questions: [4, 41, 61, 67, 76, 84]
    },
    
    health: {
        name: "Hipokondriazis (Hs)",
        description: "Bedensel yakınmalar ve sağlık kaygıları",
        questions: [2, 3, 7, 29, 34, 36, 43, 44, 47, 51, 55, 62, 63, 68, 72, 103, 108, 114, 125, 130, 131]
    },
    
    antisocial: {
        name: "Psikopati (Pd)",
        description: "Antisosyal davranışlar ve kurallara uymama",
        questions: [38, 49, 56, 80, 85, 97, 118]
    },
    
    social: {
        name: "Sosyal İçedönüklük (Si)",
        description: "Sosyal rahatsızlık ve içedönüklük",
        questions: [9, 14, 17, 23, 52, 54, 57, 99, 120]
    },
    
    unusual: {
        name: "Şizofreni (Sc)",
        description: "Olağandışı düşünceler ve algılar",
        questions: [33, 48, 50, 66]
    },
    
    paranoid: {
        name: "Paranoya (Pa)",
        description: "Şüpheci ve paranoid düşünceler",
        questions: [110, 121, 123]
    },
    
    family: {
        name: "Aile Sorunları (FAM)",
        description: "Aile içi çatışmalar ve sorunlar",
        questions: [6, 12, 15, 20, 42, 65, 96]
    },
    
    identity: {
        name: "Kimlik Sorunları (A-ang)",
        description: "Cinsiyet kimliği ve rol karmaşası",
        questions: [5, 69, 74]
    }
};

// Test konfigürasyonu test-config.js dosyasında tanımlanmıştır

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        mmpiScales
    };
}