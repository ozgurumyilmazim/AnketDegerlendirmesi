// MMPI Puanlama Algoritması
// Minnesota Multiphasic Personality Inventory - Adolescent Scoring System

// MMPI Klinik Ölçekleri ve Soru Numaraları
const MMPI_SCALES = {
    // Geçerlilik Ölçekleri
    VRIN: { // Variable Response Inconsistency
        name: "Değişken Yanıt Tutarsızlığı",
        description: "Tutarsız yanıtları ölçer",
        items: []
    },
    TRIN: { // True Response Inconsistency
        name: "Doğru Yanıt Tutarsızlığı", 
        description: "Evet/hayır yanıt eğilimini ölçer",
        items: []
    },
    F1: { // Infrequency 1
        name: "Nadir Yanıtlar 1",
        description: "İlk yarıdaki nadir yanıtları ölçer",
        items: [18, 24, 35, 40, 42, 48, 50, 53, 56, 66]
    },
    F2: { // Infrequency 2
        name: "Nadir Yanıtlar 2",
        description: "İkinci yarıdaki nadir yanıtları ölçer",
        items: []
    },
    F: { // Infrequency
        name: "Nadir Yanıtlar",
        description: "Genel nadir yanıtları ölçer",
        items: [18, 24, 35, 40, 42, 48, 50, 53, 56, 66, 85, 121, 123, 139, 146, 156, 168, 184, 197, 200]
    },
    L: { // Lie
        name: "Yalan",
        description: "Sosyal istenirlik eğilimini ölçer",
        items: [15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 195]
    },
    K: { // Correction
        name: "Düzeltme",
        description: "Savunma mekanizmalarını ölçer",
        items: [30, 39, 71, 89, 124, 129, 134, 138, 142, 148, 160, 167, 181, 183]
    },
    
    // Temel Klinik Ölçekler
    Hs: { // Hypochondriasis
        name: "Hipokondriazis",
        description: "Bedensel yakınmaları ölçer",
        items: [2, 3, 9, 18, 51, 55, 63, 68, 103, 108, 114, 125, 161, 189, 273],
        kCorrection: 0.5
    },
    D: { // Depression
        name: "Depresyon",
        description: "Depresif belirtileri ölçer",
        items: [5, 13, 23, 32, 41, 43, 52, 67, 86, 104, 130, 138, 142, 158, 159, 182, 189, 236, 259],
        kCorrection: 1.0
    },
    Hy: { // Hysteria
        name: "Histeri",
        description: "Konversiyon belirtilerini ölçer",
        items: [2, 3, 10, 23, 32, 43, 44, 47, 76, 114, 179, 186, 189, 238, 253, 265],
        kCorrection: 1.0
    },
    Pd: { // Psychopathic Deviate
        name: "Psikopati",
        description: "Antisosyal eğilimleri ölçer",
        items: [16, 21, 24, 32, 33, 35, 42, 61, 67, 84, 94, 102, 106, 110, 118, 127, 215, 216, 224, 239, 244, 245, 284],
        kCorrection: 0.4
    },
    Mf: { // Masculinity-Femininity
        name: "Erkeklik-Kadınlık",
        description: "Cinsiyet rolü özelliklerini ölçer",
        items: [4, 25, 70, 74, 77, 78, 87, 92, 126, 132, 134, 140, 149, 179, 187, 203, 204, 217, 226, 231, 239, 261, 278, 282, 295, 299]
    },
    Pa: { // Paranoia
        name: "Paranoya",
        description: "Paranoid eğilimleri ölçer",
        items: [15, 16, 22, 24, 27, 35, 110, 121, 123, 151, 157, 202, 275, 284, 291, 293, 338, 364, 365]
    },
    Pt: { // Psychasthenia
        name: "Psikasteni",
        description: "Anksiyete ve obsesif belirtileri ölçer",
        items: [10, 15, 22, 32, 41, 67, 84, 86, 94, 102, 106, 142, 159, 182, 217, 238, 266, 267, 301, 305, 317, 321, 336, 337, 340, 342, 343, 344, 346, 349, 351, 352, 356, 357, 358, 359, 360, 361],
        kCorrection: 1.0
    },
    Sc: { // Schizophrenia
        name: "Şizofreni",
        description: "Şizoid eğilimleri ölçer",
        items: [15, 16, 21, 22, 24, 32, 33, 35, 40, 41, 47, 48, 50, 53, 65, 85, 121, 123, 139, 168, 179, 200, 210, 212, 238, 241, 251, 259, 266, 273, 282, 291, 297, 301, 303, 305, 307, 312, 320, 324, 325, 332, 334, 335, 339, 341, 345, 349, 350, 352, 354, 355, 356, 360, 363, 364],
        kCorrection: 1.0
    },
    Ma: { // Hypomania
        name: "Hipomani",
        description: "Manik eğilimleri ölçer",
        items: [11, 13, 21, 22, 59, 64, 73, 97, 100, 109, 127, 134, 143, 156, 157, 167, 194, 212, 213, 226, 228, 232, 233, 238, 240, 250, 251, 254, 269, 267, 279, 298],
        kCorrection: 0.2
    },
    Si: { // Social Introversion
        name: "Sosyal İçedönüklük",
        description: "Sosyal etkileşim eğilimlerini ölçer",
        items: [25, 33, 57, 71, 82, 111, 117, 124, 138, 147, 171, 172, 180, 201, 267, 292, 304, 316, 321, 332, 336, 342, 357, 377, 383, 398, 411, 427, 436, 455, 473, 487, 549]
    }
};

// T-Skoru Dönüşüm Tabloları (Adolescent Normları)
const T_SCORE_TABLES = {
    male: {
        Hs: { mean: 50, sd: 10 },
        D: { mean: 50, sd: 10 },
        Hy: { mean: 50, sd: 10 },
        Pd: { mean: 50, sd: 10 },
        Mf: { mean: 50, sd: 10 },
        Pa: { mean: 50, sd: 10 },
        Pt: { mean: 50, sd: 10 },
        Sc: { mean: 50, sd: 10 },
        Ma: { mean: 50, sd: 10 },
        Si: { mean: 50, sd: 10 }
    },
    female: {
        Hs: { mean: 50, sd: 10 },
        D: { mean: 50, sd: 10 },
        Hy: { mean: 50, sd: 10 },
        Pd: { mean: 50, sd: 10 },
        Mf: { mean: 50, sd: 10 },
        Pa: { mean: 50, sd: 10 },
        Pt: { mean: 50, sd: 10 },
        Sc: { mean: 50, sd: 10 },
        Ma: { mean: 50, sd: 10 },
        Si: { mean: 50, sd: 10 }
    }
};

// Puanlama Sınıfı
class MMPIScoring {
    constructor() {
        this.scales = MMPI_SCALES;
        this.tScoreTables = T_SCORE_TABLES;
    }
    
    // Ana puanlama fonksiyonu
    calculateScores(answers, personalInfo) {
        const rawScores = this.calculateRawScores(answers);
        const kCorrectedScores = this.applyKCorrection(rawScores);
        const tScores = this.convertToTScores(kCorrectedScores, personalInfo.gender);
        const interpretation = this.interpretScores(tScores);
        
        return {
            rawScores,
            kCorrectedScores,
            tScores,
            interpretation,
            validity: this.assessValidity(rawScores, answers),
            profile: this.generateProfile(tScores)
        };
    }
    
    // Ham puanları hesapla
    calculateRawScores(answers) {
        const rawScores = {};
        
        Object.keys(this.scales).forEach(scaleName => {
            const scale = this.scales[scaleName];
            let score = 0;
            
            scale.items.forEach(itemNumber => {
                const answer = answers[itemNumber - 1]; // 0-indexed
                if (answer !== undefined && answer !== null) {
                    // Ölçeğe göre puanlama (çoğu ölçek için 'true' = 1 puan)
                    if (this.isKeyed(scaleName, itemNumber, answer)) {
                        score++;
                    }
                }
            });
            
            rawScores[scaleName] = score;
        });
        
        return rawScores;
    }
    
    // K düzeltmesi uygula
    applyKCorrection(rawScores) {
        const correctedScores = { ...rawScores };
        const kScore = rawScores.K || 0;
        
        Object.keys(this.scales).forEach(scaleName => {
            const scale = this.scales[scaleName];
            if (scale.kCorrection) {
                correctedScores[scaleName] = rawScores[scaleName] + (kScore * scale.kCorrection);
            }
        });
        
        return correctedScores;
    }
    
    // T-skorlarına dönüştür
    convertToTScores(correctedScores, gender) {
        const tScores = {};
        const genderNorms = this.tScoreTables[gender] || this.tScoreTables.male;
        
        Object.keys(correctedScores).forEach(scaleName => {
            if (genderNorms[scaleName]) {
                const norm = genderNorms[scaleName];
                const rawScore = correctedScores[scaleName];
                
                // T-skoru hesaplama: T = 50 + 10 * (X - M) / SD
                const tScore = 50 + 10 * (rawScore - norm.mean) / norm.sd;
                tScores[scaleName] = Math.round(tScore);
            } else {
                tScores[scaleName] = correctedScores[scaleName];
            }
        });
        
        return tScores;
    }
    
    // Soru anahtarlama kontrolü
    isKeyed(scaleName, itemNumber, answer) {
        // Çoğu soru için 'true' yanıtı puanlanır
        // Bazı sorular ters kodlanmış olabilir
        const reverseKeyedItems = {
            L: [15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 195],
            K: [30, 39, 71, 89, 124, 129, 134, 138, 142, 148, 160, 167, 181, 183]
        };
        
        if (reverseKeyedItems[scaleName] && reverseKeyedItems[scaleName].includes(itemNumber)) {
            return answer === false;
        }
        
        return answer === true;
    }
    
    // Geçerlilik değerlendirmesi
    assessValidity(rawScores, answers) {
        const validity = {
            isValid: true,
            warnings: [],
            recommendations: []
        };
        
        // F ölçeği kontrolü
        if (rawScores.F > 20) {
            validity.isValid = false;
            validity.warnings.push("Yüksek F skoru - Test geçersiz olabilir");
            validity.recommendations.push("Testi tekrar uygulayın");
        }
        
        // L ölçeği kontrolü
        if (rawScores.L > 10) {
            validity.warnings.push("Yüksek L skoru - Sosyal istenirlik eğilimi");
            validity.recommendations.push("Sonuçları dikkatli yorumlayın");
        }
        
        // K ölçeği kontrolü
        if (rawScores.K > 15) {
            validity.warnings.push("Yüksek K skoru - Savunma mekanizmaları aktif");
        }
        
        // Yanıtsız soru kontrolü
        const unansweredCount = answers.filter(answer => answer === null || answer === undefined).length;
        if (unansweredCount > 30) {
            validity.isValid = false;
            validity.warnings.push(`Çok fazla yanıtsız soru: ${unansweredCount}`);
            validity.recommendations.push("Eksik soruları tamamlayın");
        }
        
        return validity;
    }
    
    // Skorları yorumla
    interpretScores(tScores) {
        const interpretation = {};
        
        Object.keys(tScores).forEach(scaleName => {
            const tScore = tScores[scaleName];
            const scale = this.scales[scaleName];
            
            if (!scale) return;
            
            let level, description;
            
            if (tScore < 30) {
                level = "Çok Düşük";
                description = "Klinik olarak anlamlı düşük düzey";
            } else if (tScore < 40) {
                level = "Düşük";
                description = "Ortalamanın altında";
            } else if (tScore < 60) {
                level = "Normal";
                description = "Normal aralık";
            } else if (tScore < 70) {
                level = "Yüksek";
                description = "Ortalamanın üstünde";
            } else if (tScore < 80) {
                level = "Çok Yüksek";
                description = "Klinik olarak anlamlı yüksek düzey";
            } else {
                level = "Kritik";
                description = "Kritik düzeyde yüksek";
            }
            
            interpretation[scaleName] = {
                name: scale.name,
                description: scale.description,
                tScore: tScore,
                level: level,
                interpretation: description,
                clinicalSignificance: tScore >= 65
            };
        });
        
        return interpretation;
    }
    
    // Profil oluştur
    generateProfile(tScores) {
        const profile = {
            codeType: this.determineCodeType(tScores),
            elevatedScales: [],
            normalScales: [],
            lowScales: []
        };
        
        Object.keys(tScores).forEach(scaleName => {
            const tScore = tScores[scaleName];
            
            if (tScore >= 65) {
                profile.elevatedScales.push({ scale: scaleName, score: tScore });
            } else if (tScore <= 35) {
                profile.lowScales.push({ scale: scaleName, score: tScore });
            } else {
                profile.normalScales.push({ scale: scaleName, score: tScore });
            }
        });
        
        // Sırala
        profile.elevatedScales.sort((a, b) => b.score - a.score);
        profile.lowScales.sort((a, b) => a.score - b.score);
        
        return profile;
    }
    
    // Kod tipi belirle
    determineCodeType(tScores) {
        const clinicalScales = ['Hs', 'D', 'Hy', 'Pd', 'Mf', 'Pa', 'Pt', 'Sc', 'Ma', 'Si'];
        const elevatedScales = [];
        
        clinicalScales.forEach(scale => {
            if (tScores[scale] >= 65) {
                elevatedScales.push({ scale, score: tScores[scale] });
            }
        });
        
        elevatedScales.sort((a, b) => b.score - a.score);
        
        if (elevatedScales.length === 0) {
            return "Normal Profil";
        } else if (elevatedScales.length === 1) {
            return `${elevatedScales[0].scale} Spike`;
        } else {
            const topTwo = elevatedScales.slice(0, 2).map(item => item.scale).join('-');
            return `${topTwo} Kod Tipi`;
        }
    }
    
    // Rapor oluştur
    generateReport(scores, personalInfo) {
        const report = {
            personalInfo,
            testDate: new Date().toISOString(),
            validity: scores.validity,
            summary: this.generateSummary(scores),
            detailedResults: scores.interpretation,
            recommendations: this.generateRecommendations(scores),
            profile: scores.profile
        };
        
        return report;
    }
    
    // Özet oluştur
    generateSummary(scores) {
        const summary = {
            overallAssessment: "",
            keyFindings: [],
            riskFactors: [],
            strengths: []
        };
        
        // Yüksek skorları analiz et
        scores.profile.elevatedScales.forEach(item => {
            const scale = this.scales[item.scale];
            if (scale) {
                summary.keyFindings.push(`${scale.name} yüksek (T=${item.score})`);
                
                // Risk faktörleri
                if (item.scale === 'D' && item.score >= 70) {
                    summary.riskFactors.push("Depresif belirtiler");
                }
                if (item.scale === 'Pd' && item.score >= 70) {
                    summary.riskFactors.push("Antisosyal eğilimler");
                }
                if (item.scale === 'Sc' && item.score >= 70) {
                    summary.riskFactors.push("Düşünce bozuklukları");
                }
            }
        });
        
        // Düşük skorları analiz et (güçlü yönler)
        scores.profile.lowScales.forEach(item => {
            const scale = this.scales[item.scale];
            if (scale) {
                if (item.scale === 'D' && item.score <= 35) {
                    summary.strengths.push("Pozitif ruh hali");
                }
                if (item.scale === 'Pt' && item.score <= 35) {
                    summary.strengths.push("Düşük anksiyete");
                }
            }
        });
        
        // Genel değerlendirme
        if (scores.profile.elevatedScales.length === 0) {
            summary.overallAssessment = "Normal psikolojik profil";
        } else if (scores.profile.elevatedScales.length <= 2) {
            summary.overallAssessment = "Hafif düzeyde psikolojik belirtiler";
        } else {
            summary.overallAssessment = "Çoklu psikolojik belirtiler";
        }
        
        return summary;
    }
    
    // Öneriler oluştur
    generateRecommendations(scores) {
        const recommendations = [];
        
        // Geçerlilik kontrolü
        if (!scores.validity.isValid) {
            recommendations.push("Test geçersiz - Yeniden uygulama önerilir");
            return recommendations;
        }
        
        // Klinik öneriler
        scores.profile.elevatedScales.forEach(item => {
            if (item.score >= 80) {
                recommendations.push(`${this.scales[item.scale]?.name} için acil klinik değerlendirme`);
            } else if (item.score >= 70) {
                recommendations.push(`${this.scales[item.scale]?.name} için klinik takip`);
            }
        });
        
        // Genel öneriler
        if (scores.profile.elevatedScales.length > 3) {
            recommendations.push("Kapsamlı psikolojik değerlendirme önerilir");
        }
        
        if (recommendations.length === 0) {
            recommendations.push("Rutin takip yeterli");
        }
        
        return recommendations;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MMPIScoring, MMPI_SCALES };
} else {
    window.MMPIScoring = MMPIScoring;
    window.MMPI_SCALES = MMPI_SCALES;
}