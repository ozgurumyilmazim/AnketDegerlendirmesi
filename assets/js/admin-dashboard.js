// Admin Dashboard JavaScript
// Dashboard istatistikleri ve yönetim fonksiyonları

// Global değişkenler
let testsChart = null;
let testTypesChart = null;
let currentUser = null;

// Sayfa yüklendiğinde
$(document).ready(function() {
    // Kullanıcı kimlik doğrulaması
    checkAuthentication();
    
    // Dashboard verilerini yükle
    loadDashboardData();
    
    // Grafikleri başlat
    initializeCharts();
    
    // Event listener'ları ayarla
    setupEventListeners();
    
    // Otomatik yenileme (5 dakikada bir)
    setInterval(refreshDashboard, 300000);
});

// Kimlik doğrulama kontrolü
async function checkAuthentication() {
    console.log('checkAuthentication called');
    // If debug mode, skip redirects for easier inspection
    const url = new URL(window.location);
    if (url.searchParams.has('debug')) {
        console.log('Debug mode enabled – skipping authentication redirects');
        return; // skip further auth checks
    }

    try {
        // Önce Supabase session kontrolü
        const session = await AuthService.getSession();
        console.log('Supabase session object:', session);
        
        if (session && session.user) {
            // Supabase session var, kullanıcı bilgilerini al
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
            
            // Kullanıcı bilgilerini güncelle
            updateUserInfo();
            return;
        }
        
        // Supabase session yok, local storage kontrolü (fallback)
        const sessionLogin = sessionStorage.getItem('adminLogin');
        const localLogin = localStorage.getItem('adminLogin');
        console.log('sessionLogin storage:', sessionLogin);
        console.log('localLogin storage:', localLogin);
        
        if (!sessionLogin && !localLogin) {
            console.warn('No session and no stored login, redirecting to login.html');
            if (!new URL(window.location).searchParams.has('debug')) {
                setTimeout(() => { window.location.href = 'login.html'; }, 3000);
            } else {
                console.log('Debug mode – skipping redirect to login.html');
            }
            return;
        }
        
        currentUser = JSON.parse(sessionLogin || localLogin);
        updateUserInfo();
        
    } catch (error) {
        console.error('Authentication kontrolü hatası:', error);
            // Show alert for debugging
            alert('Authentication error: ' + (error?.message || error));
            // Hata durumunda local storage kontrolü
        const sessionLogin = sessionStorage.getItem('adminLogin');
        const localLogin = localStorage.getItem('adminLogin');
        
        if (!sessionLogin && !localLogin) {
            console.warn('Redirecting to login after error handling');
                if (!new URL(window.location).searchParams.has('debug')) {
                    setTimeout(() => { window.location.href = 'login.html'; }, 3000);
                } else {
                    console.log('Debug mode – skipping redirect to login.html');
                }
                return;
        }
        
        currentUser = JSON.parse(sessionLogin || localLogin);
        updateUserInfo();
    }
}

// Kullanıcı bilgilerini güncelle
function updateUserInfo() {
    if (currentUser) {
        $('#userName').text(currentUser.name);
        
        // İsim baş harflerini al
        const initials = currentUser.name
            .split(' ')
            .map(name => name.charAt(0))
            .join('')
            .toUpperCase();
        
        $('#userInitials').text(initials);
    }
}

// Dashboard verilerini yükle
async function loadDashboardData() {
    try {
        // Demo veriler (gerçek projede API'den gelecek)
        const dashboardData = await getDashboardData();
        
        // İstatistikleri güncelle
        updateStatistics(dashboardData.statistics);
        
        // Son testleri yükle
        loadRecentTests(dashboardData.recentTests);
        
        // Grafik verilerini güncelle
        updateCharts(dashboardData.chartData);
        
    } catch (error) {
        console.error('Dashboard verileri yüklenirken hata:', error);
        showNotification('Dashboard verileri yüklenirken hata oluştu.', 'error');
    }
}

// Dashboard verilerini getir (Supabase)
async function getDashboardData() {
    try {
        // Supabase bağlantısını kontrol et
        if (!window.supabase || typeof window.supabase.from !== 'function') {
            console.warn('Supabase bağlantısı bulunamadı, demo veriler kullanılıyor.');
            showConnectionWarning('Veritabanı bağlantısı kurulamadı. Demo veriler gösteriliyor.');
            return getDemoData();
        }

        // Paralel olarak tüm verileri çek
        const [participantsResult, testsResult, reportsResult] = await Promise.all([
            window.supabase.from('participants').select('*'),
            window.supabase.from('test_results').select('*'),
            window.supabase.from('reports').select('*')
        ]);

        // Hata kontrolü
        if (participantsResult.error) throw participantsResult.error;
        if (testsResult.error) throw testsResult.error;
        if (reportsResult.error) throw reportsResult.error;

        const participants = participantsResult.data || [];
        const tests = testsResult.data || [];
        const reports = reportsResult.data || [];

        // Participants map oluştur (hızlı erişim için)
        const participantsMap = {};
        participants.forEach(participant => {
            participantsMap[participant.id] = participant;
        });

        // İstatistikleri hesapla
        const completedTests = tests.filter(test => test.status === 'completed');
        const statistics = {
            totalTests: tests.length,
            completedTests: completedTests.length,
            totalParticipants: participants.length,
            totalReports: reports.length
        };

        // Son 5 testi al
        const recentTests = tests
            .sort((a, b) => new Date(b.created) - new Date(a.created))
            .slice(0, 5)
            .map(test => {
                const participant = participantsMap[test.participant_id];
                const participantName = participant 
                    ? `${participant.first_name || ''} ${participant.last_name || ''}`.trim() || 'Bilinmiyor'
                    : 'Bilinmiyor';
                return {
                    id: test.id,
                    participantName: participantName,
                    testType: test.test_type || 'MMPI',
                    completedAt: formatDate(test.created),
                    status: test.status || 'completed',
                    score: test.total_score
                };
            });

        // Grafik verilerini hazırla
        const chartData = await prepareChartData(tests);

        return {
            statistics,
            recentTests,
            chartData
        };

    } catch (error) {
        console.error('Supabase verisi alınırken hata:', error);
        
        // Kullanıcıya hata mesajı göster
        let errorMessage = 'Veritabanı bağlantısında sorun yaşanıyor. Demo veriler gösteriliyor.';
        
        if (error.message && error.message.includes('Failed to fetch')) {
            errorMessage = 'İnternet bağlantısı sorunu nedeniyle veritabanına erişilemiyor. Demo veriler gösteriliyor.';
        } else if (error.message && error.message.includes('Unauthorized')) {
            errorMessage = 'Veritabanı yetkilendirme hatası. Demo veriler gösteriliyor.';
        }
        
        showConnectionWarning(errorMessage);
        
        // Hata durumunda demo verileri kullan
        return getDemoData();
    }
}

// Demo veriler (fallback) - Boş veriler
function getDemoData() {
    return {
        statistics: {
            totalTests: 0,
            completedTests: 0,
            totalParticipants: 0,
            totalReports: 0
        },
        recentTests: [],
        chartData: {
            testsOverTime: {
                labels: [],
                datasets: [{
                    label: 'Tamamlanan Testler',
                    data: [],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4
                }]
            },
            testTypes: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [],
                    borderWidth: 0
                }]
            }
        }
    };
}

// Grafik verilerini hazırla
async function prepareChartData(tests) {
    // Son 7 günün verilerini hazırla
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        last7Days.push({
            date: date.toISOString().split('T')[0],
            label: date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
        });
    }

    // Her gün için test sayısını hesapla
    const dailyTestCounts = last7Days.map(day => {
        const dayTests = tests.filter(test => {
            const testDate = new Date(test.created).toISOString().split('T')[0];
            return testDate === day.date && test.status === 'completed';
        });
        return dayTests.length;
    });

    // Test türlerini say
    const testTypeCounts = {};
    tests.forEach(test => {
        if (test.status === 'completed') {
            const type = test.test_type || 'MMPI';
            testTypeCounts[type] = (testTypeCounts[type] || 0) + 1;
        }
    });

    return {
        testsOverTime: {
            labels: last7Days.map(day => day.label),
            datasets: [{
                label: 'Tamamlanan Testler',
                data: dailyTestCounts,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4
            }]
        },
        testTypes: {
            labels: Object.keys(testTypeCounts),
            datasets: [{
                data: Object.values(testTypeCounts),
                backgroundColor: ['#667eea', '#764ba2', '#f093fb', '#f5576c'],
                borderWidth: 0
            }]
        }
    };
}

// Tarih formatla
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// İstatistikleri güncelle
function updateStatistics(stats) {
    // Animasyonlu sayı güncellemesi
    animateNumber('totalTests', 0, stats.totalTests, 1000);
    animateNumber('completedTests', 0, stats.completedTests, 1200);
    animateNumber('totalParticipants', 0, stats.totalParticipants, 1400);
    animateNumber('totalReports', 0, stats.totalReports, 1600);
}

// Sayı animasyonu
function animateNumber(elementId, start, end, duration) {
    const element = document.getElementById(elementId);
    const startTime = performance.now();
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (end - start) * easeOut);
        
        element.textContent = current.toLocaleString('tr-TR');
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

// Son testleri yükle
function loadRecentTests(tests) {
    const container = document.getElementById('recentTestsList');
    
    if (!tests || tests.length === 0) {
        container.innerHTML = `
            <div class="test-item text-center text-muted">
                <i class="fas fa-inbox fa-2x mb-2"></i>
                <p class="mb-0">Henüz test bulunmuyor.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = tests.map(test => `
        <div class="test-item">
            <div class="d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center">
                    <div class="me-3">
                        <div class="rounded-circle d-flex align-items-center justify-content-center" 
                             style="width: 40px; height: 40px; background: ${getStatusColor(test.status)}20; color: ${getStatusColor(test.status)};">
                            <i class="fas ${getStatusIcon(test.status)}"></i>
                        </div>
                    </div>
                    <div>
                        <h6 class="mb-1">${test.participantName}</h6>
                        <small class="text-muted">
                            <i class="fas fa-clipboard me-1"></i>${test.testType}
                            <i class="fas fa-clock ms-2 me-1"></i>${test.completedAt}
                        </small>
                    </div>
                </div>
                <div class="text-end">
                    <span class="badge bg-${getStatusBadgeClass(test.status)} mb-1">
                        ${getStatusText(test.status)}
                    </span>
                    ${test.score ? `<div><small class="text-muted">Puan: ${test.score}</small></div>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// Test durumu rengi
function getStatusColor(status) {
    switch (status) {
        case 'completed': return '#28a745';
        case 'in_progress': return '#ffc107';
        case 'pending': return '#6c757d';
        default: return '#6c757d';
    }
}

// Test durumu ikonu
function getStatusIcon(status) {
    switch (status) {
        case 'completed': return 'fa-check-circle';
        case 'in_progress': return 'fa-clock';
        case 'pending': return 'fa-pause-circle';
        default: return 'fa-question-circle';
    }
}

// Test durumu badge sınıfı
function getStatusBadgeClass(status) {
    switch (status) {
        case 'completed': return 'success';
        case 'in_progress': return 'warning';
        case 'pending': return 'secondary';
        default: return 'secondary';
    }
}

// Test durumu metni
function getStatusText(status) {
    switch (status) {
        case 'completed': return 'Tamamlandı';
        case 'in_progress': return 'Devam Ediyor';
        case 'pending': return 'Bekliyor';
        default: return 'Bilinmiyor';
    }
}

// Grafikleri başlat
function initializeCharts() {
    // Test istatistikleri grafiği
    const testsCtx = document.getElementById('testsChart').getContext('2d');
    testsChart = new Chart(testsCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 3,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            elements: {
                point: {
                    radius: 4,
                    hoverRadius: 6
                }
            }
        }
    });
    
    // Test türleri grafiği
    const testTypesCtx = document.getElementById('testTypesChart').getContext('2d');
    testTypesChart = new Chart(testTypesCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.4,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                }
            }
        }
    });
}

// Grafikleri güncelle
function updateCharts(chartData) {
    // Test istatistikleri grafiğini güncelle
    if (testsChart && chartData.testsOverTime) {
        testsChart.data = chartData.testsOverTime;
        testsChart.update('active');
    }
    
    // Test türleri grafiğini güncelle
    if (testTypesChart && chartData.testTypes) {
        testTypesChart.data = chartData.testTypes;
        testTypesChart.update('active');
    }
}

// Event listener'ları ayarla
function setupEventListeners() {
    // Sidebar toggle (mobil)
    window.toggleSidebar = function() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('show');
    };
    
    // Sidebar collapse (desktop)
    window.collapseSidebar = function() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
        
        // Grafikleri yeniden boyutlandır
        setTimeout(() => {
            if (testsChart) testsChart.resize();
            if (testTypesChart) testTypesChart.resize();
        }, 300);
    };
    
    // Logout fonksiyonu
    window.logout = async function() {
        if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
            try {
                // Supabase'den çıkış yap
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
    
    // Pencere boyutu değiştiğinde grafikleri yeniden boyutlandır
    window.addEventListener('resize', function() {
        setTimeout(() => {
            if (testsChart) testsChart.resize();
            if (testTypesChart) testTypesChart.resize();
        }, 100);
    });
}

// Dashboard'ı yenile
function refreshDashboard() {
    console.log('Dashboard yenileniyor...');
    loadDashboardData();
}

// Bildirim göster
function showNotification(message, type = 'info') {
    // Toast notification oluştur
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
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

// Bağlantı uyarısı göster
function showConnectionWarning(message) {
    // Uyarı banner'ı oluştur
    let warningBanner = document.getElementById('connectionWarning');
    
    if (!warningBanner) {
        warningBanner = document.createElement('div');
        warningBanner.id = 'connectionWarning';
        warningBanner.className = 'alert alert-warning alert-dismissible fade show m-3';
        warningBanner.style.position = 'relative';
        warningBanner.style.zIndex = '1050';
        
        // Ana içeriğin başına ekle
        const mainContent = document.getElementById('mainContent') || document.body;
        mainContent.insertBefore(warningBanner, mainContent.firstChild);
    }
    
    warningBanner.innerHTML = `
        <i class="fas fa-exclamation-triangle me-2"></i>
        <strong>Uyarı:</strong> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // 10 saniye sonra otomatik gizle
    setTimeout(() => {
        if (warningBanner && warningBanner.parentNode) {
            warningBanner.remove();
        }
    }, 10000);
}

// Export functions for global use
if (typeof window !== 'undefined') {
    window.refreshDashboard = refreshDashboard;
    window.showNotification = showNotification;
    window.showConnectionWarning = showConnectionWarning;
}