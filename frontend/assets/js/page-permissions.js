// Page Permissions Helper
// Checks if current user has permission to access a page based on page_permissions table

async function checkPagePermission(pageName) {
    try {
        if (typeof window.AuthService === 'undefined' || typeof window.PG_API === 'undefined') {
            console.warn('AuthService veya PG_API bulunamadı, yetki kontrolü atlanıyor.');
            return false;
        }

        const { data: { session } } = await AuthService.getSession();
        if (!session || !session.user) {
            window.location.href = 'login.html';
            return false;
        }

        const userRole = await AuthService.getUserRole();
        if (!userRole) {
            console.warn('Kullanıcı rolü alınamadı, yetki kontrolü atlanıyor.');
            return false;
        }

        const { data, error } = await window.PG_API
            .from('page_permissions')
            .select('admin, psychologist')
            .eq('page_name', pageName)
            .maybeSingle();

        if (error) {
            console.error('Yetki kontrolü hatası:', error);
            return false;
        }

        if (!data) {
            showPagePermissionError('Bu sayfa için yetki tanımı bulunamadı. Yöneticinize başvurun.');
            return false;
        }

        const hasPermission = userRole === 'admin' ? data.admin : data.psychologist;

        if (!hasPermission) {
            showPagePermissionError('Bu sayfaya erişim yetkiniz bulunmamaktadır.');
            return false;
        }

        return true;
    } catch (err) {
        console.error('Yetki kontrolü hatası:', err);
        return false;
    }
}

function showPagePermissionError(message) {
    // Try Bootstrap toast first
    const successToast = document.getElementById('successToast');
    const errorToast = document.getElementById('errorToast');

    if (errorToast && typeof bootstrap !== 'undefined') {
        document.getElementById('errorToastBody').textContent = message;
        new bootstrap.Toast(errorToast, { delay: 3500 }).show();
    } else if (typeof showToast === 'function') {
        showToast('error', message);
    } else if (typeof showNotification === 'function') {
        showNotification(message, 'error');
    } else {
        alert(message);
    }

    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 2000);
}
