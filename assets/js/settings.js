// Settings JavaScript
// Sistem ayarları yönetimi

// Global değişkenler
let currentUser = null;
let originalSettings = {};
let currentSettings = {};

// Varsayılan ayarlar
const defaultSettings = {
    systemName: 'MMPI Psikolojik Test Sistemi',
    defaultLanguage: 'tr',
    timezone: 'Europe/Istanbul',
    themeColor: '#667eea',
    autoSave: true,
    maxDontKnow: 30,
    testTimeLimit: 0,
    showProgress: true,
    allowBack: false,
    emailNotifications: true,
    notificationEmail: 'admin@example.com',
    dailyReport: false,
    sessionTimeout: 60,
    twoFactorAuth: false,
    loginLogs: true,
    autoBackup: true,
    backupTime: '02:00',
    backupRetention: 30,
    kvkkText: `<h2>KVKK ve Onam Metni</h2>

<h3>MMPI Testi Hakkında</h3>
<p>Bu test, Minnesota Çok Yönlü Kişilik Envanteri (MMPI) olarak bilinen psikolojik değerlendirme aracıdır. Test, kişilik özelliklerinizi ve psikolojik durumunuzu değerlendirmek amacıyla kullanılmaktadır.</p>

<h3>Veri Sorumlusu</h3>
<p><strong>OGULTURK AŞ</strong><br>
Adres: [Adres bilgisi]<br>
Telefon: [Telefon numarası]<br>
E-posta: [E-posta adresi]</p>

<h3>Kişisel Verilerin İşlenme Amacı</h3>
<p>Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</p>
<ul>
<li>Psikolojik değerlendirme yapmak</li>
<li>Test sonuçlarını analiz etmek</li>
<li>Bilimsel araştırma yapmak</li>
<li>İstatistiksel analiz yapmak</li>
</ul>

<h3>İşlenen Kişisel Veri Kategorileri</h3>
<ul>
<li><strong>Kimlik Bilgileri:</strong> Ad, soyad, TC kimlik numarası</li>
<li><strong>İletişim Bilgileri:</strong> Telefon, e-posta (varsa)</li>
<li><strong>Ailevi Bilgiler:</strong> Medeni durum</li>
<li><strong>Sağlık Bilgileri:</strong> Test cevapları ve sonuçları</li>
</ul>

<h3>Kişisel Verilerin Toplanma Yöntemi</h3>
<p>Verileriniz, MMPI test formları aracılığıyla elektronik ortamda toplanmaktadır.</p>

<h3>Veri Güvenliği</h3>
<p>Kişisel verileriniz güvenli sunucularda saklanmakta ve yetkisiz erişimlere karşı korunmaktadır.</p>

<h3>Haklarınız</h3>
<p>KVKK kapsamında sahip olduğunuz haklar:</p>
<ul>
<li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
<li>İşlenen verileriniz hakkında bilgi talep etme</li>
<li>Verilerin düzeltilmesini isteme</li>
<li>Verilerin silinmesini isteme</li>
<li>İşleme itiraz etme</li>
</ul>

<p>Bu haklarınızı kullanmak için [iletişim bilgileri] üzerinden bizimle iletişime geçebilirsiniz.</p>`,
    kvkkRequired: true
};

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
    // Kullanıcı kimlik doğrulaması
    checkAuthentication();
    
    // Ayarları yükle
    loadSettings();
    
    // Event listener'ları ayarla
    setupEventListeners();
    
    // Sistem bilgilerini yükle
    loadSystemInfo();
});

// Kimlik doğrulama kontrolü
async function checkAuthentication() {
    try {
        const session = await AuthService.getSession();
        
        if (session && session.user) {
            const userRole = await AuthService.getUserRole();
            const isAdmin = await AuthService.isAdmin();
            
            currentUser = {
                userId: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.name || session.user.email,
                role: userRole,
                isAdmin: isAdmin,
                loginTime: new Date().toISOString()
            };
            
            updateUserInfo();
            return;
        }
        
        const sessionLogin = sessionStorage.getItem('adminLogin');
        const localLogin = localStorage.getItem('adminLogin');
        
        if (!sessionLogin && !localLogin) {
            window.location.href = 'login.html';
            return;
        }
        
        currentUser = JSON.parse(sessionLogin || localLogin);
        updateUserInfo();
        
    } catch (error) {
        console.error('Authentication kontrolü hatası:', error);
        
        const sessionLogin = sessionStorage.getItem('adminLogin');
        const localLogin = localStorage.getItem('adminLogin');
        
        if (!sessionLogin && !localLogin) {
            window.location.href = 'login.html';
            return;
        }
        
        currentUser = JSON.parse(sessionLogin || localLogin);
        updateUserInfo();
    }
}

// Kullanıcı bilgilerini güncelle
function updateUserInfo() {
    if (currentUser) {
        document.getElementById('userName').textContent = currentUser.name;
        
        const initials = currentUser.name
            .split(' ')
            .map(name => name.charAt(0))
            .join('')
            .toUpperCase();
        
        document.getElementById('userInitials').textContent = initials;
    }
}

// Ayarları yükle
async function loadSettings() {
    try {
        // LocalStorage'dan ayarları yükle
        const savedSettings = localStorage.getItem('systemSettings');
        
        if (savedSettings) {
            currentSettings = { ...defaultSettings, ...JSON.parse(savedSettings) };
        } else {
            currentSettings = { ...defaultSettings };
        }
        
        // PG_API'den KVKK ayarlarını yükle
        const kvkkSettings = await loadKvkkFromPostgreSQL();
        currentSettings.kvkkText = kvkkSettings.kvkkText;
        currentSettings.kvkkRequired = kvkkSettings.kvkkRequired;
        
        originalSettings = { ...currentSettings };
        
        // Form elemanlarını doldur
        populateForm();
        
    } catch (error) {
        console.error('Ayarlar yüklenirken hata:', error);
        currentSettings = { ...defaultSettings };
        originalSettings = { ...currentSettings };
        populateForm();
        showNotification('Ayarlar yüklenirken hata oluştu, varsayılan ayarlar kullanılıyor.', 'warning');
    }
}

// Form elemanlarını doldur
function populateForm() {
    // Genel ayarlar
    document.getElementById('systemName').value = currentSettings.systemName;
    document.getElementById('defaultLanguage').value = currentSettings.defaultLanguage;
    document.getElementById('timezone').value = currentSettings.timezone;
    document.getElementById('themeColor').value = currentSettings.themeColor;
    
    // Test ayarları
    document.getElementById('autoSave').checked = currentSettings.autoSave;
    document.getElementById('maxDontKnow').value = currentSettings.maxDontKnow;
    document.getElementById('testTimeLimit').value = currentSettings.testTimeLimit;
    document.getElementById('showProgress').checked = currentSettings.showProgress;
    document.getElementById('allowBack').checked = currentSettings.allowBack;
    
    // Bildirim ayarları
    document.getElementById('emailNotifications').checked = currentSettings.emailNotifications;
    document.getElementById('notificationEmail').value = currentSettings.notificationEmail;
    document.getElementById('dailyReport').checked = currentSettings.dailyReport;
    
    // Güvenlik ayarları
    document.getElementById('sessionTimeout').value = currentSettings.sessionTimeout;
    document.getElementById('twoFactorAuth').checked = currentSettings.twoFactorAuth;
    document.getElementById('loginLogs').checked = currentSettings.loginLogs;
    
    // Yedekleme ayarları
    document.getElementById('autoBackup').checked = currentSettings.autoBackup;
    document.getElementById('backupTime').value = currentSettings.backupTime;
    document.getElementById('backupRetention').value = currentSettings.backupRetention;
    
    // KVKK ayarları
    document.getElementById('kvkkText').value = currentSettings.kvkkText;
    document.getElementById('kvkkRequired').checked = currentSettings.kvkkRequired;
    
    // Tema rengini uygula
    applyThemeColor(currentSettings.themeColor);
}

// Event listener'ları ayarla
function setupEventListeners() {
    // Sidebar toggle fonksiyonları
    window.toggleSidebar = function() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('show');
    };
    
    window.collapseSidebar = function() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
    };
    
    // Logout fonksiyonu
    window.logout = async function() {
        if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
            try {
                // PG_API'den çıkış yap
                if (typeof AuthService !== 'undefined' && AuthService.signOut) {
                    await AuthService.signOut();
                }
                
                // Local storage'ı temizle
                sessionStorage.removeItem('adminLogin');
                localStorage.removeItem('adminLogin');
                
                // Login sayfasına yönlendir
                window.location.href = 'login.html';
                
            } catch (error) {
                console.error('Çıkış hatası:', error);
                
                // Hata olsa bile local storage'ı temizle ve yönlendir
                sessionStorage.removeItem('adminLogin');
                localStorage.removeItem('adminLogin');
                window.location.href = 'login.html';
            }
        }
    };
    
    // Global fonksiyonları tanımla
    window.saveSettings = saveSettings;
    window.resetSettings = resetSettings;
    window.createBackup = createBackup;
    window.restoreBackup = restoreBackup;
    window.downloadBackup = downloadBackup;
    
    // Tema rengi değişikliği
    document.getElementById('themeColor').addEventListener('change', function(e) {
        applyThemeColor(e.target.value);
    });
    
    // Form değişikliklerini izle
    const formElements = document.querySelectorAll('input, select');
    formElements.forEach(element => {
        element.addEventListener('change', function() {
            checkForChanges();
        });
    });
}

// Değişiklikleri kontrol et
function checkForChanges() {
    const hasChanges = JSON.stringify(getCurrentFormData()) !== JSON.stringify(originalSettings);
    
    // Kaydet butonunu aktif/pasif yap
    const saveButton = document.querySelector('.btn-save');
    if (hasChanges) {
        saveButton.classList.add('btn-warning');
        saveButton.innerHTML = '<i class="fas fa-exclamation-triangle me-2"></i>Değişiklikleri Kaydet';
    } else {
        saveButton.classList.remove('btn-warning');
        saveButton.innerHTML = '<i class="fas fa-save me-2"></i>Ayarları Kaydet';
    }
}

// Mevcut form verilerini al
function getCurrentFormData() {
    return {
        systemName: document.getElementById('systemName').value,
        defaultLanguage: document.getElementById('defaultLanguage').value,
        timezone: document.getElementById('timezone').value,
        themeColor: document.getElementById('themeColor').value,
        autoSave: document.getElementById('autoSave').checked,
        maxDontKnow: parseInt(document.getElementById('maxDontKnow').value),
        testTimeLimit: parseInt(document.getElementById('testTimeLimit').value),
        showProgress: document.getElementById('showProgress').checked,
        allowBack: document.getElementById('allowBack').checked,
        emailNotifications: document.getElementById('emailNotifications').checked,
        notificationEmail: document.getElementById('notificationEmail').value,
        dailyReport: document.getElementById('dailyReport').checked,
        sessionTimeout: parseInt(document.getElementById('sessionTimeout').value),
        twoFactorAuth: document.getElementById('twoFactorAuth').checked,
        loginLogs: document.getElementById('loginLogs').checked,
        autoBackup: document.getElementById('autoBackup').checked,
        backupTime: document.getElementById('backupTime').value,
        backupRetention: parseInt(document.getElementById('backupRetention').value),
        kvkkText: document.getElementById('kvkkText').value,
        kvkkRequired: document.getElementById('kvkkRequired').checked
    };
}

// Ayarları kaydet
async function saveSettings() {
    try {
        // Form validasyonu
        if (!validateForm()) {
            return;
        }
        
        // Mevcut form verilerini al
        const newSettings = getCurrentFormData();
        
        // KVKK ayarlarını PG_API'e kaydet
        const kvkkSaved = await saveKvkkToPostgreSQL(newSettings.kvkkText, newSettings.kvkkRequired);
        if (!kvkkSaved) {
            showNotification('KVKK ayarları kaydedilirken hata oluştu.', 'error');
            return;
        }
        
        // Diğer ayarları localStorage'a kaydet
        const settingsToSave = { ...newSettings };
        delete settingsToSave.kvkkText; // KVKK metni PG_API'de saklanıyor
        delete settingsToSave.kvkkRequired; // KVKK zorunluluğu da PG_API'de
        localStorage.setItem('systemSettings', JSON.stringify(settingsToSave));
        
        // Global ayarları güncelle
        currentSettings = { ...newSettings };
        originalSettings = { ...newSettings };
        
        // Tema rengini uygula
        applyThemeColor(newSettings.themeColor);
        
        // Başarı mesajı
        showNotification('Ayarlar başarıyla kaydedildi.', 'success');
        
        // Kaydet butonunu sıfırla
        checkForChanges();
        
        // Eğer sistem adı değiştiyse, sayfayı yenile
        if (newSettings.systemName !== originalSettings.systemName) {
            setTimeout(() => {
                location.reload();
            }, 1500);
        }
        
    } catch (error) {
        console.error('Ayarlar kaydedilirken hata:', error);
        showNotification('Ayarlar kaydedilirken hata oluştu.', 'error');
    }
}

// Form validasyonu
function validateForm() {
    const systemName = document.getElementById('systemName').value.trim();
    const maxDontKnow = parseInt(document.getElementById('maxDontKnow').value);
    const sessionTimeout = parseInt(document.getElementById('sessionTimeout').value);
    const backupRetention = parseInt(document.getElementById('backupRetention').value);
    const notificationEmail = document.getElementById('notificationEmail').value.trim();
    
    // Sistem adı kontrolü
    if (!systemName) {
        showNotification('Sistem adı boş olamaz.', 'error');
        document.getElementById('systemName').focus();
        return false;
    }
    
    // Maksimum "Bilmiyorum" sayısı kontrolü
    if (maxDontKnow < 0 || maxDontKnow > 100) {
        showNotification('Maksimum "Bilmiyorum" sayısı 0-100 arasında olmalıdır.', 'error');
        document.getElementById('maxDontKnow').focus();
        return false;
    }
    
    // Oturum süresi kontrolü
    if (sessionTimeout < 15 || sessionTimeout > 480) {
        showNotification('Oturum süresi 15-480 dakika arasında olmalıdır.', 'error');
        document.getElementById('sessionTimeout').focus();
        return false;
    }
    
    // Yedek saklama süresi kontrolü
    if (backupRetention < 1 || backupRetention > 365) {
        showNotification('Yedek saklama süresi 1-365 gün arasında olmalıdır.', 'error');
        document.getElementById('backupRetention').focus();
        return false;
    }
    
    // E-posta validasyonu
    if (notificationEmail && !isValidEmail(notificationEmail)) {
        showNotification('Geçerli bir e-posta adresi giriniz.', 'error');
        document.getElementById('notificationEmail').focus();
        return false;
    }
    
    return true;
}

// Ayarları sıfırla
function resetSettings() {
    if (!confirm('Tüm ayarları varsayılan değerlere sıfırlamak istediğinizden emin misiniz?')) {
        return;
    }
    
    try {
        // Varsayılan ayarları yükle
        currentSettings = { ...defaultSettings };
        originalSettings = { ...defaultSettings };
        
        // Form'u güncelle
        populateForm();
        
        // LocalStorage'ı temizle
        localStorage.removeItem('systemSettings');
        
        showNotification('Ayarlar varsayılan değerlere sıfırlandı.', 'info');
        
    } catch (error) {
        console.error('Ayarlar sıfırlanırken hata:', error);
        showNotification('Ayarlar sıfırlanırken hata oluştu.', 'error');
    }
}

// Tema rengini uygula
function applyThemeColor(color) {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', color);
    
    // CSS değişkenlerini güncelle
    const style = document.createElement('style');
    style.textContent = `
        :root {
            --primary-color: ${color};
        }
        .btn-save {
            background: linear-gradient(135deg, ${color} 0%, ${adjustBrightness(color, -20)} 100%) !important;
        }
        .form-switch .form-check-input:checked {
            background-color: ${color} !important;
            border-color: ${color} !important;
        }
        .settings-header {
            background: linear-gradient(135deg, ${color} 0%, ${adjustBrightness(color, -20)} 100%) !important;
        }
    `;
    
    // Eski stil etiketini kaldır
    const oldStyle = document.getElementById('dynamic-theme-style');
    if (oldStyle) {
        oldStyle.remove();
    }
    
    style.id = 'dynamic-theme-style';
    document.head.appendChild(style);
}

// Renk parlaklığını ayarla
function adjustBrightness(hex, percent) {
    // Hex'i RGB'ye çevir
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

// Yedek oluştur
function createBackup() {
    try {
        showNotification('Yedek oluşturuluyor...', 'info');
        
        // Demo veri oluştur
        const backupData = {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            settings: currentSettings,
            participants: JSON.parse(localStorage.getItem('participants') || '[]'),
            testResults: JSON.parse(localStorage.getItem('testResults') || '[]'),
            reports: JSON.parse(localStorage.getItem('reports') || '[]')
        };
        
        // JSON dosyası olarak indir
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { 
            type: 'application/json' 
        });
        
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `mmpi_backup_${formatDateForFilename(new Date())}.json`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Yedek başarıyla oluşturuldu ve indirildi.', 'success');
        
    } catch (error) {
        console.error('Yedek oluşturulurken hata:', error);
        showNotification('Yedek oluşturulurken hata oluştu.', 'error');
    }
}

// Yedek geri yükle
function restoreBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const backupData = JSON.parse(e.target.result);
                
                // Yedek dosyası validasyonu
                if (!backupData.timestamp || !backupData.settings) {
                    throw new Error('Geçersiz yedek dosyası formatı');
                }
                
                if (!confirm(`${formatDate(backupData.timestamp)} tarihli yedek dosyasını geri yüklemek istediğinizden emin misiniz? Mevcut veriler kaybolacaktır.`)) {
                    return;
                }
                
                // Verileri geri yükle
                if (backupData.settings) {
                    localStorage.setItem('systemSettings', JSON.stringify(backupData.settings));
                }
                
                if (backupData.participants) {
                    localStorage.setItem('participants', JSON.stringify(backupData.participants));
                }
                
                if (backupData.testResults) {
                    localStorage.setItem('testResults', JSON.stringify(backupData.testResults));
                }
                
                if (backupData.reports) {
                    localStorage.setItem('reports', JSON.stringify(backupData.reports));
                }
                
                showNotification('Yedek başarıyla geri yüklendi. Sayfa yenileniyor...', 'success');
                
                // Sayfayı yenile
                setTimeout(() => {
                    location.reload();
                }, 2000);
                
            } catch (error) {
                console.error('Yedek geri yüklenirken hata:', error);
                showNotification('Yedek dosyası geçersiz veya bozuk.', 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// Yedek dosyasını indir
function downloadBackup(backupId) {
    // Demo yedek indirme
    showNotification(`${backupId} yedek dosyası indiriliyor...`, 'info');
    
    // Gerçek uygulamada burada API çağrısı yapılacak
    setTimeout(() => {
        showNotification('Yedek dosyası indirildi.', 'success');
    }, 1000);
}

// Sistem bilgilerini yükle
function loadSystemInfo() {
    try {
        // Demo veriler
        const participants = JSON.parse(localStorage.getItem('participants') || '[]');
        const testResults = JSON.parse(localStorage.getItem('testResults') || '[]');
        
        document.getElementById('totalParticipantsInfo').textContent = participants.length;
        document.getElementById('totalTestsInfo').textContent = testResults.length;
        
    } catch (error) {
        console.error('Sistem bilgileri yüklenirken hata:', error);
        document.getElementById('totalParticipantsInfo').textContent = '0';
        document.getElementById('totalTestsInfo').textContent = '0';
    }
}

// Yardımcı fonksiyonlar
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR') + ' ' + date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function formatDateForFilename(date) {
    return date.toISOString().split('T')[0].replace(/-/g, '') + '_' + 
           date.toTimeString().split(' ')[0].replace(/:/g, '');
}

function showNotification(message, type = 'info') {
    // Toast notification oluştur
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : type === 'success' ? 'check-circle' : 'info-circle'} me-2"></i>
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    // Toast container oluştur (yoksa)
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }
    
    toastContainer.appendChild(toast);
    
    // Toast'ı göster
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Toast kapandığında DOM'dan kaldır
    toast.addEventListener('hidden.bs.toast', function() {
        toast.remove();
    });
}

// KVKK fonksiyonları
function loadDefaultKvkk() {
    if (confirm('Varsayılan KVKK metnini yüklemek istediğinizden emin misiniz? Mevcut metin kaybolacaktır.')) {
        document.getElementById('kvkkText').value = defaultSettings.kvkkText;
        showNotification('Varsayılan KVKK metni yüklendi.', 'success');
    }
}

function previewKvkk() {
    const kvkkText = document.getElementById('kvkkText').value;
    if (!kvkkText.trim()) {
        showNotification('Önizleme için KVKK metni boş olamaz.', 'warning');
        return;
    }
    
    // Yeni pencerede önizleme aç
    const previewWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
    previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>KVKK Metni Önizleme</title>
            <meta charset="utf-8">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <style>
                body { padding: 20px; }
                .preview-header { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="preview-header">
                    <h4 class="mb-0">KVKK Metni Önizleme</h4>
                    <small class="text-muted">Bu önizleme kullanıcıların göreceği halidir.</small>
                </div>
                <div class="content">
                    ${kvkkText}
                </div>
                <div class="mt-4 text-center">
                    <button class="btn btn-secondary" onclick="window.close()">Kapat</button>
                </div>
            </div>
        </body>
        </html>
    `);
    previewWindow.document.close();
}

// KVKK metnini PG_API'e kaydet
async function saveKvkkToPostgreSQL(kvkkText, kvkkRequired) {
    try {
        // Settings tablosuna KVKK ayarlarını kaydet
        const { data, error } = await PG_API
            .from('settings')
            .upsert([
                { key: 'kvkk_text', value: kvkkText },
                { key: 'kvkk_required', value: kvkkRequired }
            ], { onConflict: 'key' });
            
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('KVKK ayarları kaydedilirken hata:', error);
        return false;
    }
}

// KVKK metnini PG_API'den yükle
async function loadKvkkFromPostgreSQL() {
    try {
        const { data, error } = await PG_API
            .from('settings')
            .select('key, value')
            .in('key', ['kvkk_text', 'kvkk_required']);
            
        if (error) throw error;
        
        const settings = {};
        data.forEach(item => {
            settings[item.key] = item.value;
        });
        
        return {
            kvkkText: settings.kvkk_text || defaultSettings.kvkkText,
            kvkkRequired: settings.kvkk_required !== undefined ? settings.kvkk_required : defaultSettings.kvkkRequired
        };
    } catch (error) {
        console.error('KVKK ayarları yüklenirken hata:', error);
        return {
            kvkkText: defaultSettings.kvkkText,
            kvkkRequired: defaultSettings.kvkkRequired
        };
    }
}