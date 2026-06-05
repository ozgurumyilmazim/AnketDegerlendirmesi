// Supabase Configuration
// Veritabanı bağlantısı ve konfigürasyonu

// Supabase bağlantı bilgileri
// NOT: Bu bilgiler gerçek projede environment variables olarak saklanmalıdır

// Check if already declared to prevent duplicate declarations
if (typeof SUPABASE_CONFIG === 'undefined') {
    var SUPABASE_CONFIG = {
        url: 'https://ibtfasbiaamgzdfbsiud.supabase.co', // Supabase proje URL'nizi buraya ekleyin
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlidGZhc2JpYWFtZ3pkZmJzaXVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNTg5NTksImV4cCI6MjA2ODkzNDk1OX0.-pqEWsrbVroA4nXS7ewjjNQO4Q1GyjzlFWdusOGdWS4',
        // Tablo isimleri
        tables: {
            testResults: 'test_results',
            participants: 'participants',
            questions: 'questions',
            reports: 'reports'
        }
    };
}

// Supabase client'ı başlat
let supabase = null;

// Supabase'i başlatma fonksiyonu
function initializeSupabase() {
    try {
        console.log('Attempting to initialize Supabase...');
        console.log('window.supabase available:', typeof window.supabase);

        if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            const { createClient } = window.supabase;
            if (SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey) {
                supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
                console.log('Supabase client initialized successfully.');

                // Expose supabase client globally in the format expected by task-definitions.js
                window.supabaseClient = {
                    supabaseClient: supabase,
                    config: SUPABASE_CONFIG
                };

                console.log('window.supabaseClient exposed:', window.supabaseClient);
                return true;
            } else {
                console.error('Supabase config missing URL or anonKey.');
                return false;
            }
        } else {
            console.error('Supabase library not found. Available:', Object.keys(window).filter(k => k.includes('supabase')));
            return false;
        }
    } catch (error) {
        console.error('Error initializing Supabase client:', error);
        return false;
    }
}

// Initialize immediately since we're now loaded after Supabase library
const initSuccess = initializeSupabase();
if (initSuccess) {
    console.log('Supabase client ready and exposed globally');
} else {
    console.error('Failed to initialize Supabase client');
}

// Authentication Service
const AuthService = {

    // Kullanıcı girişi
    async signIn(email, password) {
        if (!supabase) {
            throw new Error('Supabase bağlantısı mevcut değil');
        }

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                throw error;
            }

            console.log('Kullanıcı başarıyla giriş yaptı:', data.user.email);
            return data;

        } catch (error) {
            console.error('Giriş hatası:', error);
            throw error;
        }
    },

    // Kullanıcı kaydı
    async signUp(email, password, userData = {}) {
        if (!supabase) {
            throw new Error('Supabase bağlantısı mevcut değil');
        }

        try {
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: userData
                }
            });

            if (error) {
                throw error;
            }

            console.log('Kullanıcı başarıyla kaydedildi:', data.user?.email);
            return data;

        } catch (error) {
            console.error('Kayıt hatası:', error);
            throw error;
        }
    },

    // Kullanıcı çıkışı
    async signOut() {
        if (!supabase) {
            throw new Error('Supabase bağlantısı mevcut değil');
        }

        try {
            const { error } = await supabase.auth.signOut();

            if (error) {
                throw error;
            }

            console.log('Kullanıcı başarıyla çıkış yaptı');
            return true;

        } catch (error) {
            console.error('Çıkış hatası:', error);
            throw error;
        }
    },

    // Mevcut kullanıcıyı getir
    async getCurrentUser() {
        if (!supabase) {
            return null;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            return user;

        } catch (error) {
            console.error('Kullanıcı bilgisi alınırken hata:', error);
            return null;
        }
    },

    // Session durumunu kontrol et
    async getSession() {
        if (!supabase) {
            return null;
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();
            return session;

        } catch (error) {
            console.error('Session bilgisi alınırken hata:', error);
            return null;
        }
    },

    // Auth state değişikliklerini dinle
    onAuthStateChange(callback) {
        if (!supabase) {
            return null;
        }

        return supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state değişti:', event, session?.user?.email);
            callback(event, session);
        });
    },

    // Şifre sıfırlama
    async resetPassword(email) {
        if (!supabase) {
            throw new Error('Supabase bağlantısı mevcut değil');
        }

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/admin/login.html'
            });

            if (error) {
                throw error;
            }

            console.log('Şifre sıfırlama e-postası gönderildi');
            return true;

        } catch (error) {
            console.error('Şifre sıfırlama hatası:', error);
            throw error;
        }
    },

    // Kullanıcının admin olup olmadığını kontrol et
    async isAdmin() {
        const user = await this.getCurrentUser();
        if (!user) return false;

        // Admin kontrolü - çoklu yöntem
        // 1. User metadata'dan role kontrolü
        if (user.user_metadata?.role === 'admin' ||
            user.app_metadata?.role === 'admin') {
            return true;
        }

        // 2. E-posta tabanlı admin kontrolü (geçici çözüm)
        const adminEmails = [
            'admin@psikolog.com',
            'admin@example.com'
        ];

        if (adminEmails.includes(user.email)) {
            return true;
        }

        return false;
    },

    // Kullanıcının rolünü getir
    async getUserRole() {
        const user = await this.getCurrentUser();
        if (!user) return null;

        // Role kontrolü
        if (await this.isAdmin()) {
            return 'admin';
        }

        // User metadata'dan role al
        return user.user_metadata?.role ||
            user.app_metadata?.role ||
            'psychologist'; // varsayılan rol
    }
};

// Veritabanı işlemleri
const DatabaseService = {

    // Test sonuçlarını kaydet
    async saveTestResults(testData) {
        if (!supabase) {
            throw new Error('Supabase bağlantısı mevcut değil');
        }

        try {
            const { data, error } = await supabase
                .from(SUPABASE_CONFIG.tables.testResults)
                .insert([{
                    // participant_info kaldırıldı
                    test_answers: testData.answers,
                    start_time: testData.startTime,
                    end_time: testData.endTime,
                    dont_know_count: testData.dontKnowCount,
                    completed_questions: testData.completedQuestions,
                    total_questions: testData.totalQuestions,
                    test_type: testData.testType,
                    test_version: testData.version,
                    created: testData.createdAt,
                    status: 'completed'
                }]);

            if (error) {
                throw error;
            }

            return data;

        } catch (error) {
            console.error('Test sonuçları kaydedilirken hata:', error);
            throw error;
        }
    },

    // Katılımcı bilgilerini kaydet
    async saveParticipant(participantData) {
        if (!supabase) {
            throw new Error('Supabase bağlantısı mevcut değil');
        }

        try {
            const { data, error } = await supabase
                .from(SUPABASE_CONFIG.tables.participants)
                .insert([{
                    first_name: participantData.firstName,
                    last_name: participantData.lastName,
                    tc_no: participantData.tcNo,
                    gender: participantData.gender,
                    age: participantData.age,
                    institution_code: participantData.institutionCode,
                    institution_name: participantData.institutionName,
                    profession: participantData.profession,
                    education: participantData.education,
                    marital_status: participantData.maritalStatus,
                    created: new Date().toISOString()
                }]);

            if (error) {
                throw error;
            }

            return data;

        } catch (error) {
            console.error('Katılımcı bilgileri kaydedilirken hata:', error);
            throw error;
        }
    },

    // Test sonuçlarını getir
    async getTestResults(filters = {}) {
        if (!supabase) {
            throw new Error('Supabase bağlantısı mevcut değil');
        }

        try {
            let query = supabase
                .from(SUPABASE_CONFIG.tables.testResults)
                .select('*');

            // Filtreler uygula
            if (filters.startDate) {
                query = query.gte('created', filters.startDate);
            }

            if (filters.endDate) {
                query = query.lte('created', filters.endDate);
            }

            if (filters.testType) {
                query = query.eq('test_type', filters.testType);
            }

            if (filters.status) {
                query = query.eq('status', filters.status);
            }

            // Sıralama
            query = query.order('created', { ascending: false });

            const { data, error } = await query;

            if (error) {
                throw error;
            }

            return data;

        } catch (error) {
            console.error('Test sonuçları getirilirken hata:', error);
            throw error;
        }
    },

    // Belirli bir test sonucunu getir
    async getTestResult(testId) {
        if (!supabase) {
            throw new Error('Supabase bağlantısı mevcut değil');
        }

        try {
            const { data, error } = await supabase
                .from(SUPABASE_CONFIG.tables.testResults)
                .select('*')
                .eq('id', testId)
                .single();

            if (error) {
                throw error;
            }

            return data;

        } catch (error) {
            console.error('Test sonucu getirilirken hata:', error);
            throw error;
        }
    },

    // Test sonucunu güncelle
    async updateTestResult(testId, updates) {
        if (!supabase) {
            throw new Error('Supabase bağlantısı mevcut değil');
        }

        try {
            const { data, error } = await supabase
                .from(SUPABASE_CONFIG.tables.testResults)
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', testId);

            if (error) {
                throw error;
            }

            return data;

        } catch (error) {
            console.error('Test sonucu güncellenirken hata:', error);
            throw error;
        }
    },

    // Rapor kaydet
    async saveReport(reportData) {
        if (!supabase) {
            throw new Error('Supabase bağlantısı mevcut değil');
        }

        try {
            const { data, error } = await supabase
                .from(SUPABASE_CONFIG.tables.reports)
                .insert([{
                    test_result_id: reportData.testResultId,
                    report_content: reportData.content,
                    report_type: reportData.type,
                    generated_by: reportData.generatedBy,
                    // Psikolog değerlendirmesi alanları - başlangıçta boş
                    psychologist_name: null,
                    evaluation_date: null,
                    participation: null,
                    validity: null,
                    summary: null,
                    additional_evaluation_note: null,
                    pdp_results: null,
                    task_definitions_evaluation: null,
                    evaluation_process: null,
                    measurement_process: null,
                    competency_evaluation: null,
                    session_need_status: null,
                    session_explanation: null,
                    created: new Date().toISOString()
                }]);

            if (error) {
                throw error;
            }

            return data;

        } catch (error) {
            console.error('Rapor kaydedilirken hata:', error);
            throw error;
        }
    },

    // Bağlantı durumunu kontrol et
    async checkConnection() {
        if (!supabase) {
            return false;
        }

        try {
            const { data, error } = await supabase
                .from(SUPABASE_CONFIG.tables.testResults)
                .select('id')
                .limit(1);

            return !error;

        } catch (error) {
            console.error('Bağlantı kontrolü hatası:', error);
            return false;
        }
    }
};

// Offline Storage Service
const OfflineStorageService = {

    // Offline verileri kaydet
    saveOfflineData(key, data) {
        try {
            const offlineData = this.getOfflineData();
            offlineData[key] = {
                data: data,
                timestamp: new Date().toISOString(),
                synced: false
            };

            localStorage.setItem('mmpiOfflineData', JSON.stringify(offlineData));
            return true;

        } catch (error) {
            console.error('Offline veri kaydedilirken hata:', error);
            return false;
        }
    },

    // Offline verileri getir
    getOfflineData() {
        try {
            const data = localStorage.getItem('mmpiOfflineData');
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Offline veri getirilirken hata:', error);
            return {};
        }
    },

    // Senkronize edilmemiş verileri getir
    getUnsyncedData() {
        const offlineData = this.getOfflineData();
        const unsyncedData = {};

        Object.keys(offlineData).forEach(key => {
            if (!offlineData[key].synced) {
                unsyncedData[key] = offlineData[key];
            }
        });

        return unsyncedData;
    },

    // Veriyi senkronize edildi olarak işaretle
    markAsSynced(key) {
        try {
            const offlineData = this.getOfflineData();
            if (offlineData[key]) {
                offlineData[key].synced = true;
                localStorage.setItem('mmpiOfflineData', JSON.stringify(offlineData));
            }
            return true;
        } catch (error) {
            console.error('Senkronizasyon işaretlenirken hata:', error);
            return false;
        }
    },

    // Offline verileri temizle
    clearOfflineData() {
        try {
            localStorage.removeItem('mmpiOfflineData');
            return true;
        } catch (error) {
            console.error('Offline veri temizlenirken hata:', error);
            return false;
        }
    }
};



// Network durumu değişikliklerini izle
window.addEventListener('online', function() {
    console.log('İnternet bağlantısı geri geldi.');
    if (supabase) {
        // Senkronizasyon işlemini başlat
        const unsyncedData = OfflineStorageService.getUnsyncedData();
        if (Object.keys(unsyncedData).length > 0) {
            console.log('Senkronizasyon başlatılıyor...');
            // Burada senkronizasyon işlemi yapılabilir
        }
    }
});

window.addEventListener('offline', function() {
    console.log('İnternet bağlantısı kesildi. Offline modda çalışılıyor.');
});

// Supabase bağlantısını test et
async function testSupabaseConnection() {
    if (!supabase) {
        return false;
    }

    try {
        // Auth servisini kullanarak bağlantıyı test et
        const { data, error } = await supabase.auth.getUser();

        // Hata yoksa bağlantı başarılı
        if (!error) {
            console.log('Supabase bağlantı testi başarılı.');
            return true;
        }

        // Auth hatası varsa ama bağlantı var demektir
        if (error.message && !error.message.includes('network')) {
            console.log('Supabase bağlantı testi başarılı (auth hatası normal).');
            return true;
        }

        console.warn('Supabase bağlantı testi başarısız:', error.message);
        return false;

    } catch (error) {
        console.warn('Supabase bağlantı testi sırasında hata:', error.message);
        return false;
    }
}

// Export for use in other files
if (typeof window !== 'undefined') {
    window.DatabaseService = DatabaseService;
    window.OfflineStorageService = OfflineStorageService;
    window.SUPABASE_CONFIG = SUPABASE_CONFIG;
    window.testSupabaseConnection = testSupabaseConnection;
    window.supabase = supabase;
    window.AuthService = AuthService;

    // Also expose the client in the format expected by task-definitions.js
    if (supabase) {
        window.supabaseClient = {
            supabaseClient: supabase,
            config: SUPABASE_CONFIG
        };
    }
}