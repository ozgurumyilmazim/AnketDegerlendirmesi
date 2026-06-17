// Analytics JavaScript
// Gelişmiş analitik ve veri görselleştirme

// Global değişkenler
let currentUser = null;
let analyticsData = {};
let charts = {};
let filteredData = [];
let originalData = [];

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
    // Kullanıcı kimlik doğrulaması
    checkAuthentication();
    
    // Analitik verilerini yükle
    loadAnalyticsData();
    
    // Event listener'ları ayarla
    setupEventListeners();
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

// Analitik verilerini yükle
async function loadAnalyticsData() {
    try {
        // Demo veriler (gerçek projede API'den gelecek)
        originalData = await getAnalyticsData();
        filteredData = [...originalData];
        
        // Metrikleri güncelle
        updateMetrics();
        
        // Grafikleri oluştur
        initializeCharts();
        
        // Aktivite haritasını oluştur
        generateActivityHeatmap();
        
    } catch (error) {
        console.error('Analitik veriler yüklenirken hata:', error);
        showNotification('Analitik veriler yüklenirken hata oluştu.', 'error');
    }
}

// Analitik verilerini getir (PG_API)
async function getAnalyticsData() {
    try {
        // PG_API bağlantısını kontrol et
        if (!window.PG_API) {
            console.warn('PG_API bağlantısı bulunamadı, demo veriler kullanılıyor.');
            return getDemoAnalyticsData();
        }

        // Test sonuçlarını ve katılımcı bilgilerini çek
        const { data: tests, error } = await window.PG_API
            .from('test_results')
            .select(`
                *,
                participants (
                    name,
                    age,
                    tc_no
                )
            `)
            .order('created', { ascending: false });

        if (error) {
            console.error('PG_API veri hatası:', error);
            return getDemoAnalyticsData();
        }

        // Verileri analitik formatına dönüştür
        const analyticsData = tests.map(test => {
            const age = test.participants?.age || 18;
            let ageGroup;
            
            if (age <= 17) ageGroup = '13-17';
            else if (age <= 25) ageGroup = '18-25';
            else if (age <= 35) ageGroup = '26-35';
            else ageGroup = '36+';

            const testDate = new Date(test.created);
            
            return {
                id: test.id,
                date: testDate.toISOString().split('T')[0],
                time: testDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
                testType: test.test_type || 'MMPI',
                ageGroup: ageGroup,
                score: test.total_score || 0,
                duration: test.duration_minutes || 45,
                dontKnowCount: test.dont_know_count || 0,
                completed: test.status === 'completed',
                participantId: test.participant_id,
                participantName: test.participants?.name || 'Bilinmiyor'
            };
        });

        return analyticsData;

    } catch (error) {
        console.error('Analitik veriler alınırken hata:', error);
        return getDemoAnalyticsData();
    }
}

// Demo analitik veriler (fallback)
function getDemoAnalyticsData() {
    const data = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90); // Son 90 gün
    
    // Demo test verileri oluştur
    for (let i = 0; i < 90; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        // Hafta sonu daha az test
        const baseTestCount = isWeekend ? Math.floor(Math.random() * 3) + 1 : Math.floor(Math.random() * 8) + 3;
        
        for (let j = 0; j < baseTestCount; j++) {
            const testTypes = ['MMPI', 'MMPI-2'];
            const testType = testTypes[Math.floor(Math.random() * testTypes.length)];
            
            const ageGroups = [
                { range: '13-17', weight: testType === 'MMPI' ? 0.7 : 0.1 },
                { range: '18-25', weight: 0.4 },
                { range: '26-35', weight: 0.3 },
                { range: '36+', weight: testType === 'MMPI-2' ? 0.4 : 0.2 }
            ];
            
            const ageGroup = weightedRandom(ageGroups);
            
            // Yaş grubuna göre puan dağılımı
            let baseScore;
            switch (ageGroup) {
                case '13-17':
                    baseScore = Math.random() * 30 + 60; // 60-90
                    break;
                case '18-25':
                    baseScore = Math.random() * 35 + 65; // 65-100
                    break;
                case '26-35':
                    baseScore = Math.random() * 30 + 70; // 70-100
                    break;
                case '36+':
                    baseScore = Math.random() * 25 + 65; // 65-90
                    break;
                default:
                    baseScore = Math.random() * 40 + 60;
            }
            
            const score = Math.min(100, Math.max(30, Math.round(baseScore)));
            const duration = Math.floor(Math.random() * 30) + 30; // 30-60 dakika
            const dontKnowCount = Math.floor(Math.random() * 20);
            
            data.push({
                id: data.length + 1,
                date: date.toISOString().split('T')[0],
                time: `${Math.floor(Math.random() * 12) + 8}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
                testType: testType,
                ageGroup: ageGroup,
                score: score,
                duration: duration,
                dontKnowCount: dontKnowCount,
                completed: Math.random() > 0.1, // %90 tamamlanma oranı
                participantId: Math.floor(Math.random() * 100) + 1
            });
        }
    }
    
    return data;
}

// Ağırlıklı rastgele seçim
function weightedRandom(items) {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const item of items) {
        random -= item.weight;
        if (random <= 0) {
            return item.range;
        }
    }
    
    return items[0].range;
}

// Metrikleri güncelle
function updateMetrics() {
    const completedTests = filteredData.filter(test => test.completed);
    const totalTests = filteredData.length;
    const avgScore = completedTests.length > 0 
        ? Math.round(completedTests.reduce((sum, test) => sum + test.score, 0) / completedTests.length)
        : 0;
    const completionRate = totalTests > 0 ? Math.round((completedTests.length / totalTests) * 100) : 0;
    const avgDuration = completedTests.length > 0
        ? Math.round(completedTests.reduce((sum, test) => sum + test.duration, 0) / completedTests.length)
        : 0;
    
    // Önceki dönemle karşılaştırma (demo)
    const changes = {
        tests: Math.floor(Math.random() * 40) - 20, // -20 ile +20 arası
        score: Math.floor(Math.random() * 20) - 10, // -10 ile +10 arası
        completion: Math.floor(Math.random() * 10) - 5, // -5 ile +5 arası
        duration: Math.floor(Math.random() * 20) - 10 // -10 ile +10 arası
    };
    
    // Metrikleri güncelle
    document.getElementById('totalTestsMetric').textContent = totalTests;
    document.getElementById('avgScoreMetric').textContent = avgScore;
    document.getElementById('completionRateMetric').textContent = `${completionRate}%`;
    document.getElementById('avgDurationMetric').textContent = `${avgDuration}dk`;
    
    // Değişim göstergelerini güncelle
    updateChangeIndicator('testsChange', changes.tests, '%');
    updateChangeIndicator('scoreChange', changes.score, '%');
    updateChangeIndicator('completionChange', changes.completion, '%');
    updateChangeIndicator('durationChange', changes.duration, '%');
}

// Değişim göstergesini güncelle
function updateChangeIndicator(elementId, change, suffix) {
    const element = document.getElementById(elementId);
    const sign = change >= 0 ? '+' : '';
    const className = change >= 0 ? 'positive' : 'negative';
    
    element.textContent = `${sign}${change}${suffix} bu ay`;
    element.className = `metric-change ${className}`;
}

// Grafikleri başlat
function initializeCharts() {
    initializeTrendsChart();
    initializeTestTypeChart();
    initializeAgeGroupChart();
}

// Trend grafiğini başlat
function initializeTrendsChart() {
    const ctx = document.getElementById('trendsChart').getContext('2d');
    
    // Son 30 günün verilerini hazırla
    const last30Days = getLast30DaysData();
    const labels = last30Days.map(day => formatDateShort(day.date));
    const testCounts = last30Days.map(day => day.testCount);
    const avgScores = last30Days.map(day => day.avgScore);
    
    charts.trendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Test Sayısı',
                    data: testCounts,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Ortalama Puan',
                    data: avgScores,
                    borderColor: '#764ba2',
                    backgroundColor: 'rgba(118, 75, 162, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 2.5,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Tarih'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Test Sayısı'
                    },
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Ortalama Puan'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            }
        }
    });
}

// Test türü grafiğini başlat
function initializeTestTypeChart() {
    const ctx = document.getElementById('testTypeChart').getContext('2d');
    
    const testTypeCounts = getTestTypeCounts();
    
    charts.testTypeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(testTypeCounts),
            datasets: [{
                data: Object.values(testTypeCounts),
                backgroundColor: [
                    '#667eea',
                    '#764ba2',
                    '#f093fb',
                    '#f5576c'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 1.2,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((context.parsed / total) * 100);
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Yaş grubu grafiğini başlat
function initializeAgeGroupChart() {
    const ctx = document.getElementById('ageGroupChart').getContext('2d');
    
    const ageGroupData = getAgeGroupData();
    
    charts.ageGroupChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(ageGroupData),
            datasets: [{
                label: 'Test Sayısı',
                data: Object.values(ageGroupData).map(group => group.count),
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderColor: '#667eea',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 2,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Test Sayısı'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Yaş Grubu'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            const ageGroup = context.label;
                            const data = ageGroupData[ageGroup];
                            return [
                                `Ortalama Puan: ${data.avgScore}`,
                                `Tamamlanma: ${data.completionRate}%`
                            ];
                        }
                    }
                }
            }
        }
    });
}

// Son 30 günün verilerini hazırla
function getLast30DaysData() {
    const result = [];
    const endDate = new Date();
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date(endDate);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayTests = filteredData.filter(test => test.date === dateStr);
        const completedDayTests = dayTests.filter(test => test.completed);
        
        result.push({
            date: dateStr,
            testCount: dayTests.length,
            avgScore: completedDayTests.length > 0 
                ? Math.round(completedDayTests.reduce((sum, test) => sum + test.score, 0) / completedDayTests.length)
                : 0
        });
    }
    
    return result;
}

// Test türü sayılarını hesapla
function getTestTypeCounts() {
    const counts = {};
    
    filteredData.forEach(test => {
        counts[test.testType] = (counts[test.testType] || 0) + 1;
    });
    
    return counts;
}

// Yaş grubu verilerini hesapla
function getAgeGroupData() {
    const groups = {};
    
    filteredData.forEach(test => {
        if (!groups[test.ageGroup]) {
            groups[test.ageGroup] = {
                count: 0,
                totalScore: 0,
                completedCount: 0
            };
        }
        
        groups[test.ageGroup].count++;
        
        if (test.completed) {
            groups[test.ageGroup].totalScore += test.score;
            groups[test.ageGroup].completedCount++;
        }
    });
    
    // Ortalama puanları ve tamamlanma oranlarını hesapla
    Object.keys(groups).forEach(ageGroup => {
        const group = groups[ageGroup];
        group.avgScore = group.completedCount > 0 
            ? Math.round(group.totalScore / group.completedCount)
            : 0;
        group.completionRate = Math.round((group.completedCount / group.count) * 100);
    });
    
    return groups;
}

// Aktivite haritasını oluştur
function generateActivityHeatmap() {
    const container = document.getElementById('activityHeatmap');
    container.innerHTML = '';
    
    // Son 12 haftanın verilerini hazırla
    const weeks = 12;
    const days = 7;
    const endDate = new Date();
    
    // Günlük test sayılarını hesapla
    const dailyCounts = {};
    filteredData.forEach(test => {
        dailyCounts[test.date] = (dailyCounts[test.date] || 0) + 1;
    });
    
    // Maksimum test sayısını bul (renk skalası için)
    const maxCount = Math.max(...Object.values(dailyCounts), 1);
    
    // Haftalık grid oluştur
    for (let week = weeks - 1; week >= 0; week--) {
        const weekDiv = document.createElement('div');
        weekDiv.style.display = 'flex';
        weekDiv.style.marginBottom = '2px';
        
        for (let day = 0; day < days; day++) {
            const date = new Date(endDate);
            date.setDate(date.getDate() - (week * 7 + (6 - day)));
            const dateStr = date.toISOString().split('T')[0];
            
            const count = dailyCounts[dateStr] || 0;
            const intensity = count / maxCount;
            
            const cell = document.createElement('div');
            cell.className = 'heatmap-cell';
            cell.style.backgroundColor = getHeatmapColor(intensity);
            cell.setAttribute('data-tooltip', `${formatDate(dateStr)}: ${count} test`);
            
            weekDiv.appendChild(cell);
        }
        
        container.appendChild(weekDiv);
    }
}

// Heatmap rengi hesapla
function getHeatmapColor(intensity) {
    if (intensity === 0) return '#ebedf0';
    if (intensity <= 0.25) return '#c6e48b';
    if (intensity <= 0.5) return '#7bc96f';
    if (intensity <= 0.75) return '#239a3b';
    return '#196127';
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
    window.logout = function() {
        if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
            sessionStorage.removeItem('adminLogin');
            localStorage.removeItem('adminLogin');
            window.location.href = 'login.html';
        }
    };
    
    // Global fonksiyonları tanımla
    window.applyFilters = applyFilters;
    window.clearFilters = clearFilters;
}

// Filtreleri uygula
function applyFilters() {
    const dateRange = document.getElementById('dateRange').value;
    const testType = document.getElementById('testTypeFilter').value;
    const ageGroup = document.getElementById('ageGroupFilter').value;
    
    // Tarih filtresi
    let startDate = new Date();
    if (dateRange !== 'custom') {
        startDate.setDate(startDate.getDate() - parseInt(dateRange));
    }
    
    filteredData = originalData.filter(test => {
        const testDate = new Date(test.date);
        
        // Tarih filtresi
        if (dateRange !== 'custom' && testDate < startDate) return false;
        
        // Test türü filtresi
        if (testType && test.testType !== testType) return false;
        
        // Yaş grubu filtresi
        if (ageGroup && test.ageGroup !== ageGroup) return false;
        
        return true;
    });
    
    // Verileri güncelle
    updateMetrics();
    updateCharts();
    generateActivityHeatmap();
    
    showNotification(`${filteredData.length} test verisi filtrelendi.`, 'success');
}

// Filtreleri temizle
function clearFilters() {
    document.getElementById('dateRange').value = '30';
    document.getElementById('testTypeFilter').value = '';
    document.getElementById('ageGroupFilter').value = '';
    
    filteredData = [...originalData];
    
    updateMetrics();
    updateCharts();
    generateActivityHeatmap();
    
    showNotification('Filtreler temizlendi.', 'info');
}

// Grafikleri güncelle
function updateCharts() {
    // Trend grafiğini güncelle
    const last30Days = getLast30DaysData();
    charts.trendsChart.data.labels = last30Days.map(day => formatDateShort(day.date));
    charts.trendsChart.data.datasets[0].data = last30Days.map(day => day.testCount);
    charts.trendsChart.data.datasets[1].data = last30Days.map(day => day.avgScore);
    charts.trendsChart.update();
    
    // Test türü grafiğini güncelle
    const testTypeCounts = getTestTypeCounts();
    charts.testTypeChart.data.labels = Object.keys(testTypeCounts);
    charts.testTypeChart.data.datasets[0].data = Object.values(testTypeCounts);
    charts.testTypeChart.update();
    
    // Yaş grubu grafiğini güncelle
    const ageGroupData = getAgeGroupData();
    charts.ageGroupChart.data.labels = Object.keys(ageGroupData);
    charts.ageGroupChart.data.datasets[0].data = Object.values(ageGroupData).map(group => group.count);
    charts.ageGroupChart.update();
}

// Yardımcı fonksiyonlar
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
}

function formatDateShort(dateString) {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}`;
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