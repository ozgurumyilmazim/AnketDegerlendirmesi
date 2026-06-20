// Test Configuration
// MMPI test ayarları ve konfigürasyonu

const testConfig = {
    // Test genel ayarları
    testName: 'MMPI',
    testVersion: '1.0',
    
    // Soru ayarları
    maxDontKnowAnswers: 10, // Maksimum "Bilmiyorum" cevap sayısı
    
    // Zaman ayarları
    estimatedDuration: 45, // dakika
    maxDuration: 120, // maksimum test süresi (dakika)
    
    // UI ayarları
    showProgress: true,
    showTimer: false,
    enableKeyboardShortcuts: true,
    
    // Kaydetme ayarları
    autoSaveInterval: 30000, // 30 saniye (milisaniye)
    enableLocalStorage: true,
    enableDbSync: true,
    
    // Validasyon ayarları
    requireAllAnswers: false, // Tüm soruların cevaplanması zorunlu mu?
    warnUnansweredQuestions: true,
    
    // Güvenlik ayarları
    preventBackButton: true,
    showExitWarning: true,
    
    // Debug ayarları
    debugMode: false,
    logAnswers: false
};

// Test durumları
const testStates = {
    NOT_STARTED: 'not_started',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    ABANDONED: 'abandoned'
};

// Cevap türleri
const answerTypes = {
    TRUE: 'true',
    FALSE: 'false',
    DONT_KNOW: 'dont_know'
};

// Export for use in other files
if (typeof window !== 'undefined') {
    window.testConfig = testConfig;
    window.testStates = testStates;
    window.answerTypes = answerTypes;
}