// Reports JavaScript
// Raporlar ve analitik sayfası yönetimi

// Global değişkenler
let currentUser = null;
let reportData = {};
let charts = {};
let currentFilters = {
    dateRange: 30,
    testType: '',
    ageGroup: ''
};
let individualReports = [];
let currentPage = 1;
let reportsPerPage = 10;
let filteredReports = [];

// Sayfa yüklendiğinde
$(document).ready(function() {
    // Kullanıcı kimlik doğrulaması
    checkAuthentication();
    
    // Event listener'ları ayarla
    setupEventListeners();
    
    // Varsayılan tarihleri ayarla
    setDefaultDates();
    
    // Rapor verilerini yükle
    loadReportData();
    
    // Grafikleri başlat
    initializeCharts();
    
    // Bireysel raporları yükle
    loadIndividualReports();
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
        $('#userName').text(currentUser.name);
        
        const initials = currentUser.name
            .split(' ')
            .map(name => name.charAt(0))
            .join('')
            .toUpperCase();
        
        $('#userInitials').text(initials);
    }
}

// Event listener'ları ayarla
function setupEventListeners() {
    // Arama ve yenileme butonları için event listener'lar
    $('#searchButton').on('click', function() {
        performSearch();
    });
    
    $('#refreshButton').on('click', function() {
        refreshReports();
    });
    
    // Sidebar toggle fonksiyonları
    window.toggleSidebar = function() {
        $('#sidebar').toggleClass('show');
    };
    
    window.collapseSidebar = function() {
        $('#sidebar').toggleClass('collapsed');
        $('#mainContent').toggleClass('expanded');
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
    
    // Tarih aralığı değişikliği
    $('#dateRange').on('change', function() {
        if ($(this).val() === 'custom') {
            $('#customDateRange').show();
        } else {
            $('#customDateRange').hide();
        }
    });
    
    // Arama input'u için event listener
    $('#searchReports').on('input', function() {
        filterReports();
    });
    
    // Enter tuşu ile arama
    $('#searchReports').on('keypress', function(e) {
        if (e.which === 13) {
            filterReports();
        }
    });
    
    // Global fonksiyonları tanımla
    window.applyReportFilters = applyReportFilters;
    window.exportReport = exportReport;
    window.refreshReportsList = refreshReportsList;
    window.viewReport = viewReport;
    window.downloadReport = downloadReport;
    window.deleteReport = deleteReport;
    window.generateCustomReport = generateCustomReport;
    window.createCustomReport = createCustomReport;
    
    // Enter tuşu ile filtreleme (tarih alanları için)
    const filterInputs = ['startDate', 'endDate', 'customStartDate', 'customEndDate'];
    filterInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    applyReportFilters();
                }
            });
        }
    });
}

// Varsayılan tarihleri ayarla
function setDefaultDates() {
    const today = new Date();
    
    // Başlangıç tarihleri boş bırakılıyor
    $('#startDate').val('');
    $('#endDate').val(formatDateForInput(today));
    $('#customStartDate').val('');
    $('#customEndDate').val(formatDateForInput(today));
}

// Rapor verilerini yükle
async function loadReportData() {
    try {
        // Demo veriler (gerçek projede API'den gelecek)
        reportData = await getReportData();
        
        // Metrikleri güncelle
        updateMetrics();
        
        // Grafikleri güncelle
        updateCharts();
        
    } catch (error) {
        console.error('Rapor verileri yüklenirken hata:', error);
        showNotification('Rapor verileri yüklenirken hata oluştu.', 'error');
    }
}

// Rapor verilerini getir (PG_API'den)
async function getReportData() {
    try {
        // Test sonuçlarını al
        const { data: testResults, error: testError } = await PG_API
            .from('test_results')
            .select('id, participant_id, test_answers, start_time, end_time, completed_questions, total_questions, status, created')
            .eq('status', 'completed');

        if (testError) {
            console.error('Test sonuçları alınırken hata:', testError);
            throw testError;
        }

        // Raporları al
        const { data: reports, error: reportsError } = await PG_API
            .from('reports')
            .select('*,test_results(id,participant_id,test_type,status,start_time,end_time)');

        if (reportsError) {
            console.error('Raporlar alınırken hata:', reportsError);
            throw reportsError;
        }

        // Katılımcı adlarını topla (liste görünümü için)
        const participantIds = [...new Set(testResults.map(t => t.participant_id).filter(Boolean))];
        const { data: participants } = await PG_API
            .from('participants')
            .select('id, first_name, last_name')
            .in('id', participantIds);
        const pMap = {};
        (participants || []).forEach(p => { pMap[p.id] = `${p.first_name || ''} ${p.last_name || ''}`.trim(); });
        (reports || []).forEach(r => {
            if (r.test_results?.participant_id) {
                r._participantName = pMap[r.test_results.participant_id] || 'Bilinmiyor';
            }
        });

        // İstatistikleri hesapla
        const totalTests = testResults.length;
        const totalReports = reports.length;
        
        // Test sürelerini hesapla
        const durations = testResults
            .filter(test => test.start_time && test.end_time)
            .map(test => {
                const start = new Date(test.start_time);
                const end = new Date(test.end_time);
                return Math.round((end - start) / (1000 * 60)); // dakika cinsinden
            });

        const avgDuration = durations.length > 0 
            ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
            : 0;

        const fastestCompletion = durations.length > 0 ? Math.min(...durations) : 0;
        const slowestCompletion = durations.length > 0 ? Math.max(...durations) : 0;

        // Tamamlanma oranı
        const completionRate = testResults.length > 0 
            ? Math.round((testResults.filter(test => test.status === 'completed').length / testResults.length) * 100)
            : 0;

        // Son 7 günün test trendleri
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            last7Days.push(date.toISOString().split('T')[0]);
        }

        const testTrends = {
            labels: last7Days.map(date => {
                const d = new Date(date);
                return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
            }),
            mmpiA: last7Days.map(date => {
                return testResults.filter(test => 
                    test.created && test.created.split('T')[0] === date
                ).length;
            }),
            mmpi2: [] // MMPI-2 için ayrı veriler eklenebilir
        };

        // Yaş grupları analizi
        const ageGroups = {
            labels: ['13-17', '18-25', '26-35', '36+'],
            data: [0, 0, 0, 0]
        };

        // Yaş grupları: participants tablosundan yaş çek
        for (const test of testResults) {
            try {
                const { data: p } = await PG_API
                    .from('participants')
                    .select('age')
                    .eq('id', test.participant_id)
                    .single();
                const age = parseInt(p?.age);
                if (age >= 13 && age <= 17) ageGroups.data[0]++;
                else if (age >= 18 && age <= 25) ageGroups.data[1]++;
                else if (age >= 26 && age <= 35) ageGroups.data[2]++;
                else if (age > 35) ageGroups.data[3]++;
            } catch (_) {}
        }

        return {
            totalTests: totalTests,
            totalReports: totalReports,
            avgScore: 0, // MMPI skorları için ayrı hesaplama gerekli
            completionRate: completionRate,
            avgDuration: avgDuration,
            maxScore: 0,
            minScore: 0,
            stdDev: 0,
            median: 0,
            fastestCompletion: fastestCompletion,
            slowestCompletion: slowestCompletion,
            abandonmentRate: 100 - completionRate,
            retestRate: 0, // Tekrar test oranı için ayrı hesaplama gerekli
            testTrends: testTrends,
            scoreDistribution: {
                labels: ['0-20', '21-40', '41-60', '61-80', '81-100'],
                data: [0, 0, 0, 0, 0] // MMPI skorları için ayrı hesaplama gerekli
            },
            ageGroups: ageGroups,
            testTypes: {
                labels: ['MMPI'],
                data: [totalTests]
            }
        };

    } catch (error) {
        console.error('Rapor verileri alınırken hata:', error);
        // Hata durumunda boş veriler döndür
        return {
            totalTests: 0,
            totalReports: 0,
            avgScore: 0,
            completionRate: 0,
            avgDuration: 0,
            maxScore: 0,
            minScore: 0,
            stdDev: 0,
            median: 0,
            fastestCompletion: 0,
            slowestCompletion: 0,
            abandonmentRate: 0,
            retestRate: 0,
            testTrends: {
                labels: [],
                mmpiA: [],
                mmpi2: []
            },
            scoreDistribution: {
                labels: ['0-20', '21-40', '41-60', '61-80', '81-100'],
                data: [0, 0, 0, 0, 0]
            },
            ageGroups: {
                labels: ['13-17', '18-25', '26-35', '36+'],
                data: [0, 0, 0, 0]
            },
            testTypes: {
                labels: ['MMPI'],
                data: [0]
            }
        };
    }
}

// Metrikleri güncelle
function updateMetrics() {
    // Ana metrikler
    $('#totalTests').text(reportData.totalTests || 0);
    $('#totalReports').text(reportData.totalReports || 0);
    $('#avgScore').text(reportData.avgScore || 0);
    $('#completionRate').text((reportData.completionRate || 0) + '%');
    $('#avgDuration').text((reportData.avgDuration || 0) + 'dk');
    
    // Detaylı metrikler
    $('#maxScore').text(reportData.maxScore || 0);
    $('#minScore').text(reportData.minScore || 0);
    $('#stdDev').text(reportData.stdDev || 0);
    $('#median').text(reportData.median || 0);
    $('#fastestCompletion').text((reportData.fastestCompletion || 0) + ' dk');
    $('#slowestCompletion').text((reportData.slowestCompletion || 0) + ' dk');
    $('#abandonmentRate').text((reportData.abandonmentRate || 0) + '%');
    $('#retestRate').text((reportData.retestRate || 0) + '%');
}

// Grafikleri başlat
function initializeCharts() {
    // Test Trends Chart
    const testTrendsElement = document.getElementById('testTrendsChart');
    if (testTrendsElement) {
        const testTrendsCtx = testTrendsElement.getContext('2d');
        charts.testTrends = new Chart(testTrendsCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'MMPI',
                        data: [],
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 2.5,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    title: {
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
                            color: 'rgba(0,0,0,0.1)'
                        }
                    }
                }
            }
        });
    }
    
    // Age Groups Chart
    const ageGroupsElement = document.getElementById('ageGroupsChart');
    if (ageGroupsElement) {
        const ageGroupsCtx = ageGroupsElement.getContext('2d');
        charts.ageGroups = new Chart(ageGroupsCtx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
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
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

// Grafikleri güncelle
function updateCharts() {
    if (!reportData || !charts) return;
    
    // Test Trends Chart
    if (charts.testTrends) {
        charts.testTrends.data.labels = reportData.testTrends.labels;
        charts.testTrends.data.datasets[0].data = reportData.testTrends.mmpiA;
        charts.testTrends.update();
    }
    
    // Age Groups Chart
    if (charts.ageGroups) {
        charts.ageGroups.data.labels = reportData.ageGroups.labels;
        charts.ageGroups.data.datasets[0].data = reportData.ageGroups.data;
        charts.ageGroups.update();
    }
}

// Rapor filtrelerini uygula
function applyReportFilters() {
    const dateRange = $('#dateRange').val();
    const testType = $('#testTypeFilter').val();
    const ageGroup = $('#ageGroupFilter').val();
    
    currentFilters = {
        dateRange: dateRange,
        testType: testType,
        ageGroup: ageGroup
    };
    
    // Filtreleri uygula ve verileri yeniden yükle
    loadReportData();
    
    showNotification('Filtreler uygulandı.', 'success');
}

// Rapor dışa aktar
function exportReport(format) {
    showNotification(`${format.toUpperCase()} raporu hazırlanıyor...`, 'info');
    
    // Simüle edilmiş dışa aktarma
    setTimeout(() => {
        if (format === 'pdf') {
            // PDF oluşturma simülasyonu
            const link = document.createElement('a');
            link.href = '#';
            link.download = `mmpi_rapor_${formatDateForFilename(new Date())}.pdf`;
            showNotification('PDF raporu oluşturuldu.', 'success');
        } else if (format === 'excel') {
            // Excel oluşturma simülasyonu
            const csvContent = generateCSVReport();
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `mmpi_rapor_${formatDateForFilename(new Date())}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showNotification('Excel raporu oluşturuldu.', 'success');
        }
    }, 2000);
}

// CSV raporu oluştur
function generateCSVReport() {
    const headers = ['Metrik', 'Değer'];
    const csvContent = [headers.join(',')];
    
    csvContent.push(`"Toplam Test",${reportData.totalTests}`);
    csvContent.push(`"Ortalama Puan",${reportData.avgScore}`);
    csvContent.push(`"Tamamlanma Oranı",${reportData.completionRate}%`);
    csvContent.push(`"Ortalama Süre",${reportData.avgDuration} dk`);
    csvContent.push(`"En Yüksek Puan",${reportData.maxScore}`);
    csvContent.push(`"En Düşük Puan",${reportData.minScore}`);
    csvContent.push(`"Standart Sapma",${reportData.stdDev}`);
    csvContent.push(`"Medyan",${reportData.median}`);
    
    return csvContent.join('\n');
}

// Özel rapor modal'ını aç
function generateCustomReport() {
    const modal = new bootstrap.Modal(document.getElementById('customReportModal'));
    modal.show();
}

// Özel rapor oluştur
function createCustomReport() {
    const $form = $('#customReportForm');
    
    if (!$form[0].checkValidity()) {
        $form[0].reportValidity();
        return;
    }
    
    const reportName = $('#reportName').val();
    const reportType = $('#reportType').val();
    const startDate = $('#customStartDate').val();
    const endDate = $('#customEndDate').val();
    
    const includeScores = $('#includeScores').is(':checked');
    const includeDemographics = $('#includeDemographics').is(':checked');
    const includeTimings = $('#includeTimings').is(':checked');
    const includeCharts = $('#includeCharts').is(':checked');
    const includeStatistics = $('#includeStatistics').is(':checked');
    const includeRecommendations = $('#includeRecommendations').is(':checked');
    
    const customReport = {
        name: reportName,
        type: reportType,
        dateRange: { start: startDate, end: endDate },
        includes: {
            scores: includeScores,
            demographics: includeDemographics,
            timings: includeTimings,
            charts: includeCharts,
            statistics: includeStatistics,
            recommendations: includeRecommendations
        },
        createdAt: new Date().toISOString()
    };
    
    // Modal'ı kapat
    const modal = bootstrap.Modal.getInstance($('#customReportModal')[0]);
    modal.hide();
    
    // Rapor oluşturma simülasyonu
    showNotification('Özel rapor oluşturuluyor...', 'info');
    
    setTimeout(() => {
        showNotification(`"${reportName}" raporu başarıyla oluşturuldu.`, 'success');
        
        // Form'u temizle
        $form[0].reset();
        
        // Gerçek projede rapor görüntüleme sayfasına yönlendirilecek
        console.log('Oluşturulan özel rapor:', customReport);
    }, 3000);
}

// Yardımcı fonksiyonlar
function formatDateForInput(date) {
    return date.toISOString().split('T')[0];
}

function formatDateForFilename(date) {
    return date.toISOString().split('T')[0].replace(/-/g, '');
}

function showNotification(message, type = 'info') {
    // Toast notification oluştur
    const toast = $(`
        <div class="toast align-items-center text-white bg-${type === 'error' ? 'danger' : type} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `);
    
    // Toast container oluştur (yoksa)
    let toastContainer = $('.toast-container');
    if (toastContainer.length === 0) {
        toastContainer = $('<div class="toast-container position-fixed top-0 end-0 p-3"></div>');
        toastContainer.css('z-index', '9999');
        $('body').append(toastContainer);
    }
    
    toastContainer.append(toast);
    
    // Toast'ı göster
    const bsToast = new bootstrap.Toast(toast[0]);
    bsToast.show();
    
    // Toast kapandığında DOM'dan kaldır
    toast.on('hidden.bs.toast', function() {
        $(this).remove();
    });
}

// Bireysel raporları yükle
async function loadIndividualReports() {
    try {
        const { data: reports, error } = await PG_API
            .from('reports')
            .select('id,test_result_id,report_content,report_type,generated_by,created,updated,test_results(id,participant_id,start_time,end_time,test_type,status)')
            .order('created', { ascending: false });

        if (error) {
            console.error('Raporlar yüklenirken hata:', error);
            showNotification('Raporlar yüklenirken hata oluştu.', 'error');
            return;
        }

        // Katılımcı adlarını doldur (rapor listesi için)
        try {
            const participantIds = [...new Set((reports || []).map(r => r.test_results?.participant_id).filter(Boolean))];
            if (participantIds.length > 0) {
                const { data: participants } = await PG_API
                    .from('participants')
                    .select('id, first_name, last_name')
                    .in('id', participantIds);
                const pMap = {};
                (participants || []).forEach(p => {
                    pMap[p.id] = `${p.first_name || ''} ${p.last_name || ''}`.trim();
                });
                (reports || []).forEach(r => {
                    const pid = r.test_results?.participant_id;
                    if (pid) r._participantName = pMap[pid] || 'Bilinmiyor';
                });
            }
        } catch (_) {}

        individualReports = reports || [];
        filteredReports = [...individualReports];
        displayReports();
        
    } catch (error) {
        console.error('Raporlar yüklenirken hata:', error);
        showNotification('Raporlar yüklenirken hata oluştu.', 'error');
    }
}

// Raporları filtrele
function filterReports() {
    const searchTerm = $('#searchReports').val().trim().toLowerCase();
    
    // Arama terimi boşsa tüm raporları göster
    if (!searchTerm) {
        filteredReports = [...individualReports];
    } else {
        filteredReports = individualReports.filter(report => {
            const participantName = (report._participantName || '').toLowerCase();
            const reportType = (report.report_type || '').toLowerCase();
            const testType = (report.test_results?.test_type || '').toLowerCase();
            
            // Arama terimini boşluklara göre böl ve her kelimeyi kontrol et
            const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 0);
            
            return searchWords.every(word => 
                participantName.includes(word) ||
                reportType.includes(word) ||
                testType.includes(word)
            );
        });
    }
    
    currentPage = 1;
    displayReports();
    
    // Sonuç sayısını göster
    if (searchTerm) {
        showNotification(`${filteredReports.length} rapor bulundu.`, 'info');
    }
}

// Raporları göster
function displayReports() {
    const $tbody = $('#reportsTableBody');
    if ($tbody.length === 0) return;
    
    if (filteredReports.length === 0) {
        $tbody.html(`
            <tr>
                <td colspan="6" class="text-center py-4">
                    <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                    <div>Henüz rapor bulunmuyor.</div>
                </td>
            </tr>
        `);
        updatePagination(0);
        return;
    }
    
    const startIndex = (currentPage - 1) * reportsPerPage;
    const endIndex = startIndex + reportsPerPage;
    const reportsToShow = filteredReports.slice(startIndex, endIndex);
    
    $tbody.html(reportsToShow.map(report => {
        const participantName = report._participantName || 'Bilinmiyor';
        
        const testDate = report.test_results?.start_time ? 
            new Date(report.test_results.start_time).toLocaleDateString('tr-TR') : '-';
        
        const reportDate = new Date(report.created).toLocaleDateString('tr-TR');
        
        const testType = report.test_results?.test_type || 'MMPI';
        const reportType = report.report_type || 'Standart';
        const status = report.test_results?.status === 'completed' ? 'Tamamlandı' : 'Beklemede';
        const statusClass = report.test_results?.status === 'completed' ? 'success' : 'warning';
        
        return `
            <tr>
                <td>
                    <div class="fw-bold">${participantName}</div>
                </td>
                <td><span class="badge bg-primary">${testType}</span></td>
                <td>${testDate}</td>
                <td>${reportDate}</td>
                <td><span class="badge bg-${statusClass}">${status}</span></td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="viewReport('${report.id}')" title="Raporu Görüntüle">
                            <i class="fas fa-eye"></i>
                        </button>
                        </button>
                        <button class="btn btn-outline-danger" onclick="deleteReport('${report.id}')" title="Raporu Sil">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join(''));
    
    updatePagination(filteredReports.length);
}

// Sayfalama güncelle
function updatePagination(totalReports) {
    const $pagination = $('#reportsPagination');
    if ($pagination.length === 0) return;
    
    const totalPages = Math.ceil(totalReports / reportsPerPage);
    
    if (totalPages <= 1) {
        $pagination.html('');
        return;
    }
    
    let paginationHTML = '';
    
    // Önceki sayfa
    paginationHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </a>
        </li>
    `;
    
    // Sayfa numaraları
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            paginationHTML += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
                </li>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
    }
    
    // Sonraki sayfa
    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </a>
        </li>
    `;
    
    $pagination.html(paginationHTML);
}

// Sayfa değiştir
function changePage(page) {
    const totalPages = Math.ceil(filteredReports.length / reportsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    displayReports();
}

// Rapor listesini yenile
function refreshReportsList() {
    loadIndividualReports();
    showNotification('Rapor listesi yenilendi.', 'success');
}

// Raporu görüntüle
function viewReport(reportId) {
    const report = individualReports.find(r => r.id === reportId);
    if (!report) {
        showNotification('Rapor bulunamadı.', 'error');
        return;
    }
    
    // Rapor görüntüleme sayfasına yönlendir
    window.open(`../report.html?id=${reportId}`, '_blank');
}

// Raporu indir
async function downloadReport(reportId) {
    try {
        const report = individualReports.find(r => r.id === reportId);
        if (!report) {
            showNotification('Rapor bulunamadı.', 'error');
            return;
        }
        
        // PDF olarak indir
        const participantName = report._participantName ? report._participantName.replace(/\s+/g,'_') : 'Rapor';
        
        showNotification('Rapor indiriliyor...', 'info');
        
        // PDF utils kullanarak raporu indir
        if (window.PDFUtils) {
            // Rapor sayfasını yeni sekmede aç ve PDF indirme işlemini başlat
            const reportWindow = window.open(`../report.html?id=${reportId}&download=true`, '_blank');
            
            // Rapor sayfası yüklendikten sonra PDF indirme işlemini başlat
            reportWindow.addEventListener('load', () => {
                if (reportWindow.PDFUtils) {
                    reportWindow.PDFUtils.downloadReportPDF(report, participantName);
                }
            });
        } else {
            // Fallback: Rapor içeriğini yeni sekmede aç
            window.open(`../report.html?id=${reportId}&download=true`, '_blank');
        }
        
    } catch (error) {
        console.error('Rapor indirilirken hata:', error);
        showNotification('Rapor indirilirken hata oluştu.', 'error');
    }
}

// Raporu sil
async function deleteReport(reportId) {
    if (!confirm('Bu raporu silmek istediğinizden emin misiniz?')) {
        return;
    }
    
    try {
        const { error } = await PG_API
            .from('reports')
            .delete()
            .eq('id', reportId);
        
        if (error) {
            console.error('Rapor silinirken hata:', error);
            showNotification('Rapor silinirken hata oluştu.', 'error');
            return;
        }
        
        showNotification('Rapor başarıyla silindi.', 'success');
        loadIndividualReports();
        
    } catch (error) {
        console.error('Rapor silinirken hata:', error);
        showNotification('Rapor silinirken hata oluştu.', 'error');
    }
}

// Global fonksiyonları tanımla
window.changePage = changePage;