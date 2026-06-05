// Supabase Configuration Example
// Bu dosyayı kopyalayıp supabase-config.js olarak kaydedin ve gerçek bilgilerinizi girin

// Supabase bağlantı bilgileri
const SUPABASE_CONFIG = {
    // Supabase Dashboard > Settings > API bölümünden alın
    url: 'https://nkajfoczhyngyjzwndlq.supabase.co', // Project URL
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rYWpmb2N6aHluZ3lqenduZGxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NDc2ODUsImV4cCI6MjA5NjIyMzY4NX0.Pra1MDEvha0qmCq_8awIO8PD4s8BfBSeVAsJBWJbzzI', // anon public key

    // Tablo isimleri
    tables: {
        testResults: 'test_results',
        participants: 'participants',
        questions: 'questions',
        reports: 'reports'
    }
};

// Supabase client'ı başlat
let supabase = null;

function initializeSupabase() {
    try {
        // Supabase kütüphanesinin yüklenip yüklenmediğini kontrol et
        if (typeof createClient === 'undefined') {
            console.warn('Supabase kütüphanesi yüklenmemiş. Offline modda çalışılıyor.');
            return false;
        }

        // Konfigürasyon kontrolü
        if (SUPABASE_CONFIG.url === 'https://your-project-id.supabase.co' ||
            SUPABASE_CONFIG.anonKey === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...') {
            console.warn('Supabase konfigürasyonu tamamlanmamış. Offline modda çalışılıyor.');
            return false;
        }

        // Supabase client oluştur
        supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

        console.log('Supabase başarıyla başlatıldı.');
        return true;

    } catch (error) {
        console.error('Supabase başlatılırken hata oluştu:', error);
        return false;
    }
}

// Sayfa yüklendiğinde Supabase'i başlat
document.addEventListener('DOMContentLoaded', function () {
    const isInitialized = initializeSupabase();

    if (!isInitialized) {
        console.log('Offline modda çalışılıyor. Veriler yerel olarak saklanacak.');
    }
});

// Export for use in other files
if (typeof window !== 'undefined') {
    window.SUPABASE_CONFIG = SUPABASE_CONFIG;
    window.supabase = supabase;
}