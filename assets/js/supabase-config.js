// ====================================================================
// SUPABASE CONFIGURATION
// ====================================================================
// Tek sefer tanımlama – tekrar tekrar tanımlanmamalı!

// Eğer daha önce bir tanım yapılmışsa (örnek: başka bir script), tekrar tanımlamayı önlemek
if (typeof window.SUPABASE_CONFIG === 'undefined') {
    window.SUPABASE_CONFIG = {
        // Supabase projenizin URL ve anon key'i
        url: 'https://nkajfoczhyngyjzwndlq.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rYWpmb2N6aHluZ3lqenduZGxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NDc2ODUsImV4cCI6MjA5NjIyMzY4NX0.Pra1MDEvha0qmCq_8awIO8PD4s8BfBSeVAsJBWJbzzI',
        // Tablo isimleri (gerekiyorsa)
        tables: {
            testResults: 'test_results'
        }
    };
}

// --------------------------------------------------------------------
// Supabase client (singleton) oluşturma
// --------------------------------------------------------------------
if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {
    // Supabase client'ı global bir değişkene (window.supabase) atayarak 
    // diğer scriptlerin aynı instance'ı paylaşmasını sağlarız.
    window.supabase = supabase.createClient(
        window.SUPABASE_CONFIG.url,
        window.SUPABASE_CONFIG.anonKey
    );
    console.log('Supabase client başarıyla başlatıldı.');
    // Also expose client via the global name `supabase` used in other scripts
    supabase = window.supabase;
} else {
    console.warn('Supabase JS kütüphanesi bulunamadı – offline modda çalışılıyor.');
    window.supabase = null; // fallback
}

// --------------------------------------------------------------------
// Minimal AuthService wrapper
window.AuthService = {
    async signIn(email, password) {
        const { data, error } = await window.supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    },
    async signOut() {
        const { error } = await window.supabase.auth.signOut();
        if (error) throw error;
    },
    async isAdmin() {
        const { data, error } = await window.supabase.from('users').select('role').eq('id', window.supabase.auth.user()?.id).single();
        if (error) throw error;
        return data?.role === 'admin';
    },
    async getSession() {
        return window.supabase.auth.getSession();
    },
    onAuthStateChange(callback) {
        return window.supabase.auth.onAuthStateChange(callback);
    },
    // ---- NEW ---------------------------------------------------------
    async getUserRole() {
        try {
            const { data, error } = await window.supabase
                .from('users')
                .select('role')
                .eq('id', window.supabase.auth.user()?.id)
                .single();
            if (error) throw error;
            return data?.role ?? null;
        } catch (_) {
            // No row → treat as "no special role"
            return null;
        }
    }
};

// --------------------------------------------------------------------
// Başlangıç kontrolü (opsiyonel)
// --------------------------------------------------------------------
function initializeSupabase() {
    // Config eksikse veya placeholder ise
    if (!window.SUPABASE_CONFIG ||
        window.SUPABASE_CONFIG.url.includes('your-project-id') ||
        window.SUPABASE_CONFIG.anonKey.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')) {
        console.warn('Supabase konfigürasyonu tamamlanmamış. Offline modda çalışılıyor.');
        return false;
    }

    // Client zaten oluşturulmuşsa true döndür
    return !!window.supabase;
}

// Sayfa yüklendiğinde Supabase'i başlat (tek sefer)
document.addEventListener('DOMContentLoaded', () => {
    const ok = initializeSupabase();
    if (!ok) {
        console.log('Supabase offline / dev mode – yerel veri kullanılacak.');
    }
});
