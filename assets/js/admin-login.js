// Admin Login JavaScript
// Psikolog giriş sistemi - Supabase Authentication

// Supabase authentication kullanılıyor

// DOM elementleri (jQuery ile)
const $loginForm = $('#loginForm');
const $usernameInput = $('#username');
const $passwordInput = $('#password');
const $rememberMeCheckbox = $('#rememberMe');
const $togglePasswordBtn = $('#togglePassword');
const $loginAlert = $('#loginAlert');
const $alertMessage = $('#alertMessage');
const $loginButtonText = $('#loginButtonText');
const $loginSpinner = $('#loginSpinner');
const $sendResetLinkBtn = $('#sendResetLink');
const $resetEmailInput = $('#resetEmail');

// Sayfa yüklendiğinde
$(document).ready(async function () {
    // Supabase kontrolü
    if (typeof supabase !== 'undefined' && supabase) {
        // Önceden giriş yapılmış mı kontrol et
        await checkExistingLogin();

        // Auth state değişikliklerini dinle
        AuthService.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                // Giriş yapıldı, dashboard'a yönlendir
                window.location.href = 'dashboard.html';
            } else if (event === 'SIGNED_OUT') {
                // Çıkış yapıldı, login sayfasında kal
                console.log('Kullanıcı çıkış yaptı');
            }
        });
    } else {
        console.log('Supabase bağlantısı mevcut değil, offline modda çalışıyor.');
    }

    // Event listener'ları ekle
    setupEventListeners();

    // Test için otomatik e-posta ve şifre doldur
    fillTestCredentials();
});

// Test için otomatik e-posta ve şifre doldur
function fillTestCredentials() {
    const url = new URL(window.location);
    // Add "?auto_test" to the URL to trigger auto‑fill
    if (url.searchParams.has('auto_test')) {
        $usernameInput.val('ozgurumyilmazim@gmail.com');
        $passwordInput.val('deneme');
        console.log('Test credentials filled via URL flag.');
    }
}

/*
function fillTestCredentials() {
    // Sadece localhost'ta çalışırken test bilgilerini doldur
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        $usernameInput.val('ogulturkselma@gmail.com');
        $passwordInput.val('SlmOglTrk.10');

        console.log('Test bilgileri otomatik olarak dolduruldu.');
    }
}
    */

// Event listener'ları ayarla
function setupEventListeners() {
    // Login form submit
    $loginForm.on('submit', handleLogin);

    // Şifre göster/gizle
    $togglePasswordBtn.on('click', togglePasswordVisibility);

    // Şifre sıfırlama
    $sendResetLinkBtn.on('click', handlePasswordReset);

    // Enter tuşu ile giriş
    $(document).on('keypress', function (e) {
        if (e.key === 'Enter' && !$('.modal.show').length) {
            e.preventDefault();
            $loginForm.trigger('submit');
        }
    });

    // Input focus efektleri
    $usernameInput.add($passwordInput).on({
        focus: function () {
            $(this).parent().css('transform', 'scale(1.02)');
        },
        blur: function () {
            $(this).parent().css('transform', 'scale(1)');
        }
    });
}

// Giriş işlemini handle et
async function handleLogin(e) {
    e.preventDefault();

    const email = $usernameInput.val().trim();
    const password = $passwordInput.val();
    const rememberMe = $rememberMeCheckbox.prop('checked');

    // Validasyon
    if (!email || !password) {
        showAlert('E-posta ve şifre gereklidir.', 'danger');
        return;
    }

    // E-posta formatı kontrolü
    if (!isValidEmail(email)) {
        showAlert('Geçerli bir e-posta adresi giriniz.', 'danger');
        return;
    }

    // Loading durumu
    setLoadingState(true);

    try {
        // Supabase ile giriş yap
        const { data, error } = await AuthService.signIn(email, password);

        if (error) {
            throw error;
        }

        // Kullanıcı bilgilerini al
        const user = data.user;

        // Admin kontrolü
        const isAdmin = await AuthService.isAdmin();

        // Kullanıcı bilgilerini oluştur
        const userInfo = {
            name: user.user_metadata?.name || user.user_metadata?.full_name || user.email.split('@')[0],
            role: isAdmin ? 'admin' : 'psychologist',
            permissions: isAdmin ?
                ['view_all', 'edit_all', 'delete_all', 'manage_users'] :
                ['view_own', 'edit_own', 'create_reports']
        };

        // Kullanıcı bilgilerini kaydet
        const loginData = {
            userId: user.id,
            email: user.email,
            name: userInfo.name,
            role: userInfo.role,
            permissions: userInfo.permissions,
            loginTime: new Date().toISOString(),
            rememberMe: rememberMe
        };

        // Session/Local storage'a kaydet
        // if (rememberMe) {
        localStorage.setItem('adminLogin', JSON.stringify(loginData));
        //} else {
        sessionStorage.setItem('adminLogin', JSON.stringify(loginData));
        //}

        // Başarı mesajı göster
        showAlert(`Hoş geldiniz, ${userInfo.name}!`, 'success');

        // Dashboard'a yönlendir
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);

    } catch (error) {
        console.error('Giriş hatası:', error);
        // Supabase errors expose a .message property
        const friendlyMsg = error?.message ?? 'Bilinmeyen bir hata oluştu.';
        showAlert(friendlyMsg, 'danger');   // shows the message in #loginAlert
        setLoadingState(false);
    }
    /*
    } catch (error) {
        console.error('Giriş hatası:', error);
        
        let errorMessage = 'Giriş yapılırken bir hata oluştu.';
        
        if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'E-posta veya şifre hatalı.';
        } else if (error.message.includes('Email not confirmed')) {
            errorMessage = 'E-posta adresinizi doğrulamanız gerekiyor.';
        } else if (error.message.includes('Too many requests')) {
            errorMessage = 'Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.';
        }
        
        showAlert(errorMessage, 'danger');
        setLoadingState(false);
    }
    */
}



// Önceden giriş yapılmış mı kontrol et
async function checkExistingLogin() {
    try {
        // Supabase session kontrolü
        const session = await AuthService.getSession();

        if (session && session.user) {
            // Aktif session var, dashboard'a yönlendir
            console.log('Aktif session bulundu:', session.user.email);
            window.location.href = 'dashboard.html';
            return;
        }

        // Local storage kontrolü (fallback)
        const sessionLogin = sessionStorage.getItem('adminLogin');
        const localLogin = localStorage.getItem('adminLogin');

        if (sessionLogin || localLogin) {
            const loginData = JSON.parse(sessionLogin || localLogin);

            // Giriş süresini kontrol et (24 saat)
            const loginTime = new Date(loginData.loginTime);
            const now = new Date();
            const hoursDiff = (now - loginTime) / (1000 * 60 * 60);

            if (hoursDiff < 24) {
                // Local storage'da geçerli giriş var ama Supabase session yok
                // Kullanıcıyı tekrar giriş yapmaya yönlendir
                console.log('Local storage login bulundu ama session yok');
            } else {
                // Süresi dolmuş, temizle
                sessionStorage.removeItem('adminLogin');
                localStorage.removeItem('adminLogin');
            }
        }

    } catch (error) {
        console.error('Session kontrol hatası:', error);
        // Hata durumunda local storage'ı temizle
        sessionStorage.removeItem('adminLogin');
        localStorage.removeItem('adminLogin');
    }
}

// Şifre görünürlüğünü değiştir
function togglePasswordVisibility() {
    const type = $passwordInput.attr('type') === 'password' ? 'text' : 'password';
    $passwordInput.attr('type', type);

    const $icon = $togglePasswordBtn.find('i');
    $icon.toggleClass('fa-eye fa-eye-slash');
}

// Şifre sıfırlama işlemi
async function handlePasswordReset() {
    const email = $resetEmailInput.val().trim();

    if (!email) {
        alert('E-posta adresi gereklidir.');
        return;
    }

    if (!isValidEmail(email)) {
        alert('Geçerli bir e-posta adresi giriniz.');
        return;
    }

    // Loading durumu
    $sendResetLinkBtn.html('<i class="fas fa-spinner fa-spin me-2"></i>Gönderiliyor...');
    $sendResetLinkBtn.prop('disabled', true);

    try {
        // Supabase ile şifre sıfırlama e-postası gönder
        await AuthService.resetPassword(email);

        alert('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');

        // Modal'ı kapat
        const modal = bootstrap.Modal.getInstance(document.getElementById('forgotPasswordModal'));
        if (modal) {
            modal.hide();
        }

        // Formu sıfırla
        $resetEmailInput.val('');

    } catch (error) {
        console.error('Şifre sıfırlama hatası:', error);
        alert('Şifre sıfırlama e-postası gönderilirken bir hata oluştu.');
    } finally {
        // Loading durumunu sıfırla
        $sendResetLinkBtn.html('<i class="fas fa-paper-plane me-2"></i>Sıfırlama Bağlantısı Gönder');
        $sendResetLinkBtn.prop('disabled', false);
    }
}

// Loading durumunu ayarla
function setLoadingState(isLoading) {
    if (isLoading) {
        $loginButtonText.text('Giriş yapılıyor...');
        $loginSpinner.removeClass('d-none');
        $loginForm.find('button[type="submit"]').prop('disabled', true);
    } else {
        $loginButtonText.text('Giriş Yap');
        $loginSpinner.addClass('d-none');
        $loginForm.find('button[type="submit"]').prop('disabled', false);
    }
}

// Alert göster
function showAlert(message, type = 'danger') {
    $alertMessage.text(message);
    $loginAlert.attr('class', `alert alert-${type}`);
    $loginAlert.removeClass('d-none');

    // 5 saniye sonra gizle
    setTimeout(() => {
        $loginAlert.addClass('d-none');
    }, 5000);
}

// E-posta validasyonu
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}



// Logout fonksiyonu (diğer sayfalarda kullanılmak üzere)
async function logout() {
    try {
        // Supabase'den çıkış yap
        await AuthService.signOut();

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

// Export for use in other files
if (typeof window !== 'undefined') {
    window.logout = logout;
    window.checkAdminAuth = checkExistingLogin;
}