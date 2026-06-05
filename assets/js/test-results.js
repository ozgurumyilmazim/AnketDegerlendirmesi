// Test Results JavaScript
// Test sonuçları yönetimi ve görüntüleme

// Global değişkenler
let testResultsTable = null;
let currentUser = null;
let allTestResults = [];
let filteredResults = [];
let lastViewedTestId = null; // Detay modalında görüntülenen son test ID'si

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
    // Kullanıcı kimlik doğrulaması
    checkAuthentication();
    
    // DataTable'ı başlat
    initializeDataTable();
    
    // Test sonuçlarını yükle
    loadTestResults();
    
    // Event listener'ları ayarla
    setupEventListeners();
    
    // Bugünün tarihini filtre alanlarına set et
    setDefaultDates();
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
        
        // Fallback: local storage kontrolü
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

// DataTable'ı başlat
function initializeDataTable() {
    testResultsTable = $('#testResultsTable').DataTable({
        responsive: true,
        pageLength: 25,
        order: [[3, 'desc']], // Tarihe göre azalan sıralama
        language: {
            "decimal": ",",
            "thousands": ".",
            "info": "_TOTAL_ kayıttan _START_ - _END_ arası gösteriliyor",
            "infoEmpty": "Kayıt yok",
            "infoPostFix": "",
            "infoFiltered": "(_MAX_ kayıt içerisinden bulunan)",
            "lengthMenu": "Sayfada _MENU_ kayıt göster",
            "loadingRecords": "Yükleniyor...",
            "processing": "İşleniyor...",
            "search": "Ara:",
            "zeroRecords": "Eşleşen kayıt bulunamadı",
            "paginate": {
                "first": "İlk",
                "last": "Son",
                "next": "Sonraki",
                "previous": "Önceki"
            },
            "aria": {
                "sortAscending": ": artan sütun sıralamasını aktifleştir",
                "sortDescending": ": azalan sütun sıralamasını aktifleştir"
            }
        },
        columnDefs: [
            {
                targets: [0], // ID sütunu - gizle
                visible: false
            },
            {
                targets: [5], // Puan sütunu
                render: function(data, type, row) {
                    if (type === 'display' && data !== null) {
                        return `
                            <div class="d-flex align-items-center">
                                <span class="me-2">${data}</span>
                                <div class="score-bar">
                                    <div class="score-fill" style="width: ${data}%; background: ${getScoreColor(data)};"></div>
                                </div>
                            </div>
                        `;
                    }
                    return data;
                }
            },
            {
                targets: [4], // Durum sütunu
                render: function(data, type, row) {
                    if (type === 'display') {
                        return `<span class="status-badge status-${data}">${getStatusText(data)}</span>`;
                    }
                    return data;
                }
            },
            {
                targets: [7], // İşlemler sütunu
                orderable: false,
                render: function(data, type, row) {
                    const testId = row[0];
                    const reportBtnId = `reportBtn_${testId}`;
                    
                    // Rapor butonunu dinamik olarak ayarlamak için setTimeout kullan
                    setTimeout(async () => {
                        const btn = document.getElementById(reportBtnId);
                        if (btn) {
                            try {
                                const { data: existingReport, error: reportError } = await supabase
                                    .from('reports')
                                    .select('id')
                                    .eq('test_result_id', testId)
                                    .maybeSingle();
                                
                                if (reportError) {
                                    console.warn('Rapor kontrolü yapılamadı:', reportError);
                                    // Hata durumunda varsayılan olarak rapor oluştur butonu göster
                                    btn.innerHTML = '<i class="fas fa-file-alt"></i>';
                                    btn.title = 'Rapor Oluştur';
                                    btn.onclick = () => generateReport(testId);
                                } else if (existingReport) {
                                    btn.innerHTML = '<i class="fas fa-eye"></i>';
                                    btn.title = 'Raporu Görüntüle';
                                    btn.onclick = () => window.open(`../report.html?id=${existingReport.id}`, '_blank');
                                } else {
                                    btn.innerHTML = '<i class="fas fa-file-alt"></i>';
                                    btn.title = 'Rapor Oluştur';
                                    btn.onclick = () => generateReport(testId);
                                }
                            } catch (error) {
                                // Rapor yoksa varsayılan "Rapor Oluştur" olarak bırak
                                btn.innerHTML = '<i class="fas fa-file-alt"></i>';
                                btn.title = 'Rapor Oluştur';
                                btn.onclick = () => generateReport(testId);
                            }
                        }
                    }, 100);
                    
                    return `
                        <div class="btn-group" role="group">
                            <button class="btn btn-sm btn-outline-primary action-btn" 
                                    onclick="viewTestDetail('${testId}')" title="Detayları Görüntüle">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button id="${reportBtnId}" class="btn btn-sm btn-outline-success action-btn" 
                                    onclick="generateReport('${testId}')" title="Rapor Oluştur">
                                <i class="fas fa-file-alt"></i>
                            </button>
                         
                            </button>
                            ${currentUser && currentUser.role === 'admin' ? `
                                <button class="btn btn-sm btn-outline-danger action-btn" 
                                        onclick="deleteResult('${testId}')" title="Sil">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                        </div>
                    `;
                }
            }
        ],
        drawCallback: function() {
            // Tablo çizildikten sonra tooltip'leri aktifleştir
            $('[title]').tooltip();
        }
    });
}

// Test sonuçlarını yükle
async function loadTestResults() {
    try {
        showLoading(true);
        
        // Supabase'den test sonuçlarını çek
        allTestResults = await getTestResults();
        
        // Tabloyu güncelle
        updateTable(allTestResults);
        
        // Toplam sayıyı güncelle
        updateResultsCount(allTestResults.length);
        
    } catch (error) {
        console.error('Test sonuçları yüklenirken hata:', error);
        showNotification('Test sonuçları yüklenirken hata oluştu.', 'error');
    } finally {
        showLoading(false);
    }
}

// Test sonuçlarını Supabase'den getir
async function getTestResults() {
    try {
        if (!supabase) {
            console.error('Supabase bağlantısı mevcut değil');
            return [];
        }

        // Test sonuçlarını ve katılımcı bilgilerini çek
        const { data: testResults, error: testError } = await supabase
            .from('test_results')
            .select('*')
            .order('created', { ascending: false });

        if (testError) {
            console.error('Test sonuçları çekilirken hata:', testError);
            return [];
        }

        // Katılımcı bilgilerini çek (gerekli alanlar)
        const { data: participants, error: participantError } = await supabase
            .from('participants')
            .select('id, first_name, last_name, tc_no, age, gender, education, profession, institution_code, institution_name, marital_status');

        if (participantError) {
            console.error('Katılımcı bilgileri çekilirken hata:', participantError);
            return [];
        }

        // Soru metinlerini çek
        const { data: questions, error: questionsError } = await supabase
            .from('questions')
            .select('*');

        if (questionsError) {
            console.error('Sorular çekilirken hata:', questionsError);
            return [];
        }

        // Katılımcı bilgilerini hızlı erişim için map'e çevir
        const participantsMap = {};
        participants.forEach(participant => {
            participantsMap[participant.id] = participant;
        });

        // Soruları hızlı erişim için map'e çevir (hem question_number hem de id ile)
        const questionsMap = {};
        questions.forEach(question => {
            questionsMap[question.question_number] = question;
            questionsMap[question.id] = question; // UUID ile de erişim sağla
        });

        // Test sonuçlarını formatla
        const formattedResults = testResults.map(test => {
            const participant = participantsMap[test.participant_id];
            const participantName = participant 
                ? `${participant.first_name || ''} ${participant.last_name || ''}`.trim()
                : 'Bilinmeyen Katılımcı';

            // Test süresini hesapla
            let duration = 'Bilinmiyor';
            if (test.start_time && test.end_time) {
                const startTime = new Date(test.start_time);
                const endTime = new Date(test.end_time);
                const durationMs = endTime - startTime;
                const durationMinutes = Math.round(durationMs / (1000 * 60));
                duration = `${durationMinutes} dk`;
            }

            // Test tamamlanma oranından puan hesapla (geçici)
            let score = null;
            if (test.status === 'completed' && test.completed_questions && test.total_questions) {
                score = Math.round((test.completed_questions / test.total_questions) * 100);
            }

            return {
                id: test.id,
                participantName: participantName,
                testType: test.test_type || 'MMPI',
                completedAt: test.end_time || test.created,
                status: test.status || 'unknown',
                score: score,
                duration: duration,
                testAnswers: test.test_answers,
                completedQuestions: test.completed_questions,
                totalQuestions: test.total_questions,
                questionsMap: questionsMap,
                personalInfo: participant ? {
                    firstName: participant.first_name,
                    lastName: participant.last_name,
                    tcNo: participant.tc_no,
                    age: participant.age,
                    gender: participant.gender,
                    education: participant.education,
                    profession: participant.profession,
                    institutionCode: participant.institution_code,
                    institutionName: participant.institution_name,
                    maritalStatus: participant.marital_status
                } : null
            };
        });

        return formattedResults;

    } catch (error) {
        console.error('Test sonuçları yüklenirken hata:', error);
        return [];
    }
}

// Tabloyu güncelle
function updateTable(results) {
    testResultsTable.clear();
    
    results.forEach(result => {
        testResultsTable.row.add([
            result.id,
            result.participantName,
            result.testType,
            formatDate(result.completedAt),
            result.status,
            result.score,
            result.duration,
            '' // İşlemler sütunu render fonksiyonunda doldurulacak
        ]);
    });
    
    testResultsTable.draw();
}

// Sonuç sayısını güncelle
function updateResultsCount(count) {
    document.getElementById('totalResultsCount').textContent = `${count} sonuç`;
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
    
    // Global fonksiyonları tanımla
    window.applyFilters = applyFilters;
    window.clearFilters = clearFilters;
    window.exportResults = exportResults;
    window.viewTestDetail = viewTestDetail;
    window.generateReport = generateReport;
    window.downloadResult = downloadResult;
    window.deleteResult = deleteResult;
    
    // Enter tuşu ile filtreleme
    const filterInputs = ['filterName', 'filterDateFrom', 'filterDateTo', 'filterInstitutionCode', 'filterInstitutionName'];
    filterInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    applyFilters();
                }
            });
        }
    });
}

// Varsayılan tarihleri ayarla
function setDefaultDates() {
    const today = new Date();
    
    // Başlangıç tarihi boş bırakılıyor
    document.getElementById('filterDateFrom').value = '';
    document.getElementById('filterDateTo').value = formatDateForInput(today);
}

// Filtreleri uygula
function applyFilters() {
    const name = (document.getElementById('filterName')?.value || '').trim().toLowerCase();
    const dateFrom = document.getElementById('filterDateFrom').value;
    const dateTo = document.getElementById('filterDateTo').value;
    const institutionCode = (document.getElementById('filterInstitutionCode')?.value || '').trim().toLowerCase();
    const institutionName = (document.getElementById('filterInstitutionName')?.value || '').trim().toLowerCase();
    
    filteredResults = allTestResults.filter(result => {
        // Ad soyad filtresi - gelişmiş arama
        if (name) {
            const nm = (result.participantName || '').toLowerCase();
            const searchWords = name.split(/\s+/).filter(word => word.length > 0);
            const nameMatches = searchWords.every(word => nm.includes(word));
            if (!nameMatches) return false;
        }
        
        // Tarih filtresi
        if (dateFrom || dateTo) {
            const resultDate = new Date(result.completedAt);
            
            if (dateFrom && resultDate < new Date(dateFrom)) return false;
            if (dateTo && resultDate > new Date(dateTo + ' 23:59:59')) return false;
        }
        
        // Kurum kodu filtresi (içeren)
        if (institutionCode) {
            const code = (result.personalInfo?.institutionCode || '').toLowerCase();
            if (!code.includes(institutionCode)) return false;
        }
        // Kurum adı filtresi (içeren)
        if (institutionName) {
            const name = (result.personalInfo?.institutionName || '').toLowerCase();
            if (!name.includes(institutionName)) return false;
        }
        return true;
    });
    
    updateTable(filteredResults);
    updateResultsCount(filteredResults.length);
    
    showNotification(`${filteredResults.length} sonuç bulundu.`, 'success');
}

// Filtreleri temizle
function clearFilters() {
    if (document.getElementById('filterName')) document.getElementById('filterName').value = '';
    document.getElementById('filterDateFrom').value = '';
    document.getElementById('filterDateTo').value = '';
    if (document.getElementById('filterInstitutionCode')) document.getElementById('filterInstitutionCode').value = '';
    if (document.getElementById('filterInstitutionName')) document.getElementById('filterInstitutionName').value = '';
    
    updateTable(allTestResults);
    updateResultsCount(allTestResults.length);
    
    showNotification('Filtreler temizlendi.', 'info');
}

// Sonuçları Excel'e aktar
function exportResults() {
    const dataToExport = filteredResults.length > 0 ? filteredResults : allTestResults;
    
    if (dataToExport.length === 0) {
        showNotification('Aktarılacak veri bulunamadı.', 'warning');
        return;
    }
    
    // CSV formatında veri hazırla
    const headers = ['ID', 'Katılımcı', 'Test Türü', 'Tarih', 'Durum', 'Puan', 'Süre'];
    const csvContent = [headers.join(',')];
    
    dataToExport.forEach(result => {
        const row = [
            result.id,
            `"${result.participantName}"`,
            result.testType,
            formatDate(result.completedAt),
            getStatusText(result.status),
            result.score || 'N/A',
            result.duration
        ];
        csvContent.push(row.join(','));
    });
    
    // Dosyayı indir
    const blob = new Blob([csvContent.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `mmpi_test_sonuclari_${formatDateForFilename(new Date())}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Veriler başarıyla aktarıldı.', 'success');
}

// Test detayını görüntüle
async function viewTestDetail(testId) {
    const test = allTestResults.find(t => t.id == testId);
    
    if (!test) {
        showNotification('Test bulunamadı.', 'error');
        return;
    }
    // Detay modalından Rapor Oluştur'a basıldığında kullanmak için sakla
    lastViewedTestId = testId;
    
    // Bu test için rapor var mı kontrol et
    let hasReport = false;
    let reportId = null;
    const { data: existingReport, error: reportError } = await supabase
        .from('reports')
        .select('id')
        .eq('test_result_id', testId)
        .maybeSingle();
    
    if (existingReport) {
        hasReport = true;
        reportId = existingReport.id;
    }
    
    if (reportError) {
        console.warn('Rapor kontrolü yapılamadı:', reportError);
    }
    
    const modalContent = document.getElementById('testDetailContent');
    modalContent.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h6 class="text-primary">Katılımcı Bilgileri</h6>
                <table class="table table-sm">
                    <tr><td><strong>Ad Soyad:</strong></td><td>${test.participantName}</td></tr>
                    <tr><td><strong>TC No:</strong></td><td>${test.personalInfo ? test.personalInfo.tcNo || 'Bilinmiyor' : 'Bilinmiyor'}</td></tr>
                    <tr><td><strong>Yaş:</strong></td><td>${test.personalInfo ? test.personalInfo.age || 'Bilinmiyor' : 'Bilinmiyor'}</td></tr>
                    <tr><td><strong>Cinsiyet:</strong></td><td>${test.personalInfo && test.personalInfo.gender ? (test.personalInfo.gender === 'male' ? 'Erkek' : 'Kadın') : 'Bilinmiyor'}</td></tr>
                    <tr><td><strong>Eğitim:</strong></td><td>${test.personalInfo ? test.personalInfo.education || 'Bilinmiyor' : 'Bilinmiyor'}</td></tr>
                    <tr><td><strong>Meslek:</strong></td><td>${test.personalInfo ? (test.personalInfo.profession || 'Bilinmiyor') : 'Bilinmiyor'}</td></tr>
                    <tr><td><strong>Medeni Durum:</strong></td><td>${test.personalInfo ? (test.personalInfo.maritalStatus || 'Bilinmiyor') : 'Bilinmiyor'}</td></tr>
                    <tr><td><strong>Kurum Kodu:</strong></td><td>${test.personalInfo ? (test.personalInfo.institutionCode || 'Bilinmiyor') : 'Bilinmiyor'}</td></tr>
                    <tr><td><strong>Kurum Adı:</strong></td><td>${test.personalInfo ? (test.personalInfo.institutionName || 'Bilinmiyor') : 'Bilinmiyor'}</td></tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6 class="text-primary">Test Bilgileri</h6>
                <table class="table table-sm">
                    <tr><td><strong>Test ID:</strong></td><td>${test.id}</td></tr>
                    <tr><td><strong>Test Türü:</strong></td><td>${test.testType}</td></tr>
                    <tr><td><strong>Tarih:</strong></td><td>${formatDate(test.completedAt)}</td></tr>
                    <tr><td><strong>Durum:</strong></td><td><span class="status-badge status-${test.status}">${getStatusText(test.status)}</span></td></tr>
                    <tr><td><strong>Süre:</strong></td><td>${test.duration}</td></tr>
                    <tr><td><strong>Puan:</strong></td><td>${test.score || 'N/A'}</td></tr>
                </table>
            </div>
        </div>
        
        ${test.status === 'completed' ? `
            <div class="mt-3">
                <h6 class="text-primary">Test Sonuçları</h6>
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    Detaylı analiz ve yorumlar için rapor oluşturun.
                </div>
            </div>
        ` : ''}
        
        ${test.testAnswers ? `
            <div class="mt-3">
                <h6 class="text-primary">Test Cevapları</h6>
                <div class="card">
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-4">
                                <strong>Tamamlanan Sorular:</strong> ${test.completedQuestions || 0}
                            </div>
                            <div class="col-md-4">
                                <strong>Toplam Sorular:</strong> ${test.totalQuestions || 0}
                            </div>
                            <div class="col-md-4">
                                <strong>Tamamlanma Oranı:</strong> ${test.completedQuestions && test.totalQuestions ? Math.round((test.completedQuestions / test.totalQuestions) * 100) : 0}%
                            </div>
                        </div>
                        <hr>
                        <div class="answers-container" style="max-height: 300px; overflow-y: auto;">
                            ${Object.entries(test.testAnswers)
                                .map(([key, answer]) => {
                                    // key artık question_number (string) bekleniyor; sayıya çevir
                                    const qNum = parseInt(key, 10);
                                    const question = test.questionsMap && test.questionsMap[qNum];
                                    return {
                                        questionId: key,
                                        answer,
                                        question,
                                        questionNumber: question ? question.question_number : (isNaN(qNum) ? 999999 : qNum)
                                    };
                                })
                                .sort((a, b) => a.questionNumber - b.questionNumber)
                                .map(({questionId, answer, question}) => {
                                    const questionText = question ? question.question_text : `Soru ${questionId}`;
                                    // Artık cevaplar doğrudan 'Doğru' | 'Yanlış' | 'Bilmiyorum'
                                    const answerText = answer;
                                    const badgeColor = answer === 'Doğru' ? 'success' : 
                                                     answer === 'Yanlış' ? 'danger' : 'secondary';
                                    return `
                                        <div class="answer-item mb-3 p-3 border rounded">
                                            <div class="row">
                                                <div class="col-md-2">
                                                    <strong>Soru ${question ? question.question_number : questionId}:</strong>
                                                </div>
                                                <div class="col-md-8">
                                                    <div class="question-text mb-2">${questionText}</div>
                                                </div>
                                                <div class="col-md-2 text-end">
                                                    <span class="badge bg-${badgeColor}">
                                                        ${answerText}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        ` : ''}
    `;
    
    // Rapor butonunu güncelle
    const reportBtn = document.getElementById('testDetailGenerateReportBtn');
    if (hasReport) {
        reportBtn.innerHTML = '<i class="fas fa-eye me-2"></i>Raporu Görüntüle';
        reportBtn.onclick = () => {
            window.open(`../report.html?id=${reportId}`, '_blank');
        };
    } else {
        reportBtn.innerHTML = '<i class="fas fa-file-alt me-2"></i>Rapor Oluştur';
        reportBtn.onclick = () => generateReport();
    }
    
    const modal = new bootstrap.Modal(document.getElementById('testDetailModal'));
    modal.show();
}

// Rapor oluştur
// MMPI Puanlama Fonksiyonu
async function calculateMMPIScores(testAnswers, scoringKeys, gender) {
    // Cevapları soru numarasına göre organize et
    const answersMap = {};
    testAnswers.forEach(answer => {
        answersMap[answer.question_number] = answer.answer;
    });
    
    // Scoring keys'leri ölçeğe göre organize et
    const scaleKeys = {};
    scoringKeys.forEach(key => {
        if (!scaleKeys[key.scale_name]) {
            scaleKeys[key.scale_name] = [];
        }
        scaleKeys[key.scale_name].push({
            question: key.question_number,
            scoringAnswer: key.scoring_answer
        });
    });
    
    // Ham puanları hesapla
    const rawScores = {};
    Object.keys(scaleKeys).forEach(scaleName => {
        let score = 0;
        scaleKeys[scaleName].forEach(item => {
            const userAnswer = answersMap[item.question];
            if (userAnswer === item.scoringAnswer) {
                score++;
            }
        });
        rawScores[scaleName] = score;
    });
    
    // Cinsiyet normalizasyonu (TR/EN)
    const normalizedGender = (gender || '').toString().toLowerCase();
    const isMale = normalizedGender === 'male' || normalizedGender === 'erkek';
    const isFemale = normalizedGender === 'female' || normalizedGender === 'kadın' || normalizedGender === 'kadin';

    // Cinsiyet için Mf ölçeğini ayarla
    if (isMale && rawScores['Mf_Male'] !== undefined) {
        rawScores['Mf'] = rawScores['Mf_Male'];
        delete rawScores['Mf_Male'];
        delete rawScores['Mf_Female'];
    } else if (isFemale && rawScores['Mf_Female'] !== undefined) {
        rawScores['Mf'] = rawScores['Mf_Female'];
        delete rawScores['Mf_Male'];
        delete rawScores['Mf_Female'];
    }
    
    // K düzeltmesi uygula (veritabanından parametreler kullanarak)
    const kScore = rawScores['K'] || 0;
    const kCorrectedScores = { ...rawScores };
    
    try {
        // K düzeltme parametrelerini veritabanından al
        const { data: kParams, error: kError } = await supabase
            .from('t_score_params')
            .select('scale_name, k_correction')
            .eq('gender', isMale ? 'male' : 'female');
            
        if (kError) {
            console.error('K düzeltme parametreleri alınırken hata:', kError);
            // Hata durumunda varsayılan katsayıları kullan
            const kCorrections = {
                'Hs': 0.5,
                'Pd': 0.4,
                'Pt': 1.0,
                'Sc': 1.0,
                'Ma': 0.2
            };
            Object.keys(kCorrections).forEach(scale => {
                if (kCorrectedScores[scale] !== undefined) {
                    kCorrectedScores[scale] += Math.round(kScore * kCorrections[scale]);
                }
            });
        } else {
            // Veritabanından alınan parametreleri kullan
            kParams.forEach(param => {
                const scale = param.scale_name;
                const kCoef = Number(param.k_correction || 0);
                if (kCorrectedScores[scale] !== undefined && kCoef !== 0) {
                    kCorrectedScores[scale] += Math.round(kScore * kCoef);
                }
            });
        }
    } catch (error) {
        console.error('K düzeltmesi hesaplamasında hata:', error);
        // Hata durumunda varsayılan katsayıları kullan
        const kCorrections = {
            'Hs': 0.5,
            'Pd': 0.4,
            'Pt': 1.0,
            'Sc': 1.0,
            'Ma': 0.2
        };
        Object.keys(kCorrections).forEach(scale => {
            if (kCorrectedScores[scale] !== undefined) {
                kCorrectedScores[scale] += Math.round(kScore * kCorrections[scale]);
            }
        });
    }
    
    // T-skorlarını hesapla (veritabanından parametreler kullanarak)
    const tScores = {};
    
    try {
        // T-skor parametrelerini veritabanından al
        const { data: tScoreParams, error: paramsError } = await supabase
            .from('t_score_params')
            .select('scale_name, gender, mean_m, sd, k_correction')
            .eq('gender', isMale ? 'male' : 'female');
            
        if (paramsError) {
            console.error('T-skor parametreleri alınırken hata:', paramsError);
        } else {
            // Parametreleri ölçeğe göre organize et
            const paramsByScale = {};
            tScoreParams.forEach(param => {
                paramsByScale[param.scale_name] = param;
            });
            
            // Her ölçek için T-skor hesapla
            Object.keys(kCorrectedScores).forEach(scale => {
                const param = paramsByScale[scale];
                if (param && param.sd && Number(param.sd) !== 0) {
                    const rawScore = kCorrectedScores[scale];
                    const mean = Number(param.mean_m);
                    const sd = Number(param.sd);
                    const tScore = 50 + (10 * (rawScore - mean)) / sd;
                    tScores[scale] = Math.round(tScore);
                } else {
                    // Parametre bulunamazsa basit hesaplama
                    console.error('Parametre bulunamadı', 'parametre-yok');

                }
            });
        }
    } catch (error) {
        console.error('T-skor hesaplamasında hata:', error);
    }
    
    // Yorumları oluştur
    const interpretations = generateInterpretations(tScores);
    
    // Geçerlilik değerlendirmesi
    const validityAssessment = assessValidity(tScores);
    
    // Özet ve öneriler
    const summary = generateSummary(tScores, interpretations);
    const recommendations = generateRecommendations(tScores, interpretations);
    
    return {
        rawScores,
        tScores,
        interpretations,
        validityAssessment,
        summary,
        recommendations
    };
}

// Yorumlama fonksiyonu
function generateInterpretations(tScores) {
    const interpretations = {};
    
    Object.keys(tScores).forEach(scale => {
        const score = tScores[scale];
        let interpretation = '';
        
        if (score >= 65) {
            interpretation = 'Yüksek - Klinik olarak anlamlı';
        } else if (score >= 60) {
            interpretation = 'Orta-Yüksek - Dikkat edilmesi gereken';
        } else if (score >= 40) {
            interpretation = 'Normal aralık';
        } else {
            interpretation = 'Düşük';
        }
        
        interpretations[scale] = interpretation;
    });
    
    return interpretations;
}

// Geçerlilik değerlendirmesi
function assessValidity(tScores) {
    const validity = {
        isValid: true,
        warnings: []
    };
    
    if (tScores['L'] > 70) {
        validity.warnings.push('L ölçeği yüksek - Aşırı sosyal istenirlik');
    }
    
    if (tScores['F'] > 80) {
        validity.warnings.push('F ölçeği çok yüksek - Profil geçersiz olabilir');
        validity.isValid = false;
    } else if (tScores['F'] > 70) {
        validity.warnings.push('F ölçeği yüksek - Dikkatli yorumlama gerekli');
    }
    
    if (tScores['K'] > 70) {
        validity.warnings.push('K ölçeği yüksek - Savunuculuk');
    }
    
    return validity;
}

// Özet oluşturma
function generateSummary(tScores, interpretations) {
    const elevatedScales = Object.keys(tScores)
        .filter(scale => !['L', 'F', 'K'].includes(scale) && tScores[scale] >= 65)
        .sort((a, b) => tScores[b] - tScores[a]);
    
    if (elevatedScales.length === 0) {
        return 'MMPI profili normal sınırlar içerisindedir. Klinik olarak anlamlı yükselme gözlenmemektedir.';
    }
    
    const scaleNames = {
        'Hs': 'Hipokondriazis',
        'D': 'Depresyon',
        'Hy': 'Histeri',
        'Pd': 'Psikopati',
        'Mf': 'Maskülinite-Femininite',
        'Pa': 'Paranoya',
        'Pt': 'Psikasteni',
        'Sc': 'Şizofreni',
        'Ma': 'Hipomani',
        'Si': 'Sosyal İçedönüklük'
    };
    
    const elevatedNames = elevatedScales.map(scale => scaleNames[scale] || scale);
    
    return `MMPI profilinde ${elevatedNames.join(', ')} ölçek(ler)inde klinik olarak anlamlı yükselme gözlenmektedir.`;
}

// Öneriler oluşturma
function generateRecommendations(tScores, interpretations) {
    const recommendations = [];
    
    const elevatedScales = Object.keys(tScores)
        .filter(scale => !['L', 'F', 'K'].includes(scale) && tScores[scale] >= 65);
    
    if (elevatedScales.length === 0) {
        recommendations.push('Rutin psikolojik takip önerilir.');
        return recommendations;
    }
    
    if (elevatedScales.includes('D') && tScores['D'] >= 70) {
        recommendations.push('Depresyon belirtileri açısından detaylı değerlendirme önerilir.');
    }
    
    if (elevatedScales.includes('Pt') && tScores['Pt'] >= 70) {
        recommendations.push('Anksiyete bozuklukları açısından değerlendirme önerilir.');
    }
    
    if (elevatedScales.includes('Sc') && tScores['Sc'] >= 70) {
        recommendations.push('Psikotik belirtiler açısından acil değerlendirme gerekebilir.');
    }
    
    if (elevatedScales.includes('Pa') && tScores['Pa'] >= 70) {
        recommendations.push('Paranoid düşünceler açısından değerlendirme önerilir.');
    }
    
    if (recommendations.length === 0) {
        recommendations.push('Psikolojik destek ve takip önerilir.');
    }
    
    recommendations.push('Sonuçlar klinik görüşme ile desteklenmelidir.');
    
    return recommendations;
}

// Özet verilerini oluştur
async function generateSummaryData(tScores, gender) {
    try {
        // Geçerlilik ölçekleri için otomatik değerlendirme
        let validityEvaluation = '';
        
        // L, F, K ölçekleri için mmpi_interpretations tablosundan değerlendirme al
        const validityScales = ['L', 'F', 'K'];
        
        for (const scale of validityScales) {
            const score = tScores[scale] || 0;
            const interpretation = await getInterpretationFromDatabase(scale, score, gender);
            if (interpretation) {
                validityEvaluation += `${scale} Ölçeği (T=${score}): ${interpretation}\n\n`;
            } else {
                validityEvaluation += `${scale} Ölçeği (T=${score}): Bu aralığa ilişkin özgün bir durum tanımlanmamıştır.\n\n`;
            }
        }
        
        // Psikolog notları için varsayılan metin
        const psychologistNotes = 'Bu bölümde psikoloğun gözlemleri ve ek değerlendirmeleri yer alacaktır.';
        
        return {
            validity_scales_summary: validityEvaluation,
            psychologist_notes_summary: psychologistNotes
        };
    } catch (error) {
        console.error('Özet verileri oluşturulurken hata:', error);
        return {
            validity_scales_summary: 'Geçerlilik ölçekleri değerlendirmesi otomatik olarak oluşturulamadı.',
            psychologist_notes_summary: 'Bu bölümde psikoloğun gözlemleri ve ek değerlendirmeleri yer alacaktır.'
        };
    }
}

// Rapor sonucu verilerini oluştur
async function generateResultData(tScores, interpretations, gender) {
    try {
        // Klinik ölçekler için otomatik değerlendirme
        let clinicalEvaluation = '';
        
        // Klinik ölçeklerin değerlendirmesi
        const clinicalScales = ['Hs', 'D', 'Hy', 'Pd', 'Mf', 'Pa', 'Pt', 'Sc', 'Ma', 'Si'];
        
        for (const scale of clinicalScales) {
            const score = tScores[scale] || 0;
            const interpretation = await getInterpretationFromDatabase(scale, score, gender);
            if (interpretation) {
                clinicalEvaluation += `${scale} Ölçeği (T=${score}): ${interpretation}\n\n`;
            } else {
                clinicalEvaluation += `${scale} Ölçeği (T=${score}): Bu aralığa ilişkin özgün bir durum tanımlanmamıştır.\n\n`;
            }
        }
        
        // Genel değerlendirme
        const generalEvaluation = 'Bu bölümde genel psikolojik değerlendirme ve bulgular yer alacaktır.';
        
        // Sonuç ve öneriler
        const conclusionRecommendations = 'Bu bölümde sonuçlar ve öneriler yer alacaktır.';
        
        return {
            clinical_scales_result: clinicalEvaluation,
            general_evaluation: generalEvaluation,
            conclusion_recommendations: conclusionRecommendations
        };
    } catch (error) {
        console.error('Rapor sonucu verileri oluşturulurken hata:', error);
        return {
            clinical_scales_result: 'Klinik ölçekler değerlendirmesi otomatik olarak oluşturulamadı.',
            general_evaluation: 'Bu bölümde genel psikolojik değerlendirme ve bulgular yer alacaktır.',
            conclusion_recommendations: 'Bu bölümde sonuçlar ve öneriler yer alacaktır.'
        };
    }
}

// mmpi_interpretations tablosundan değerlendirme al
async function getInterpretationFromDatabase(scale, tScore, gender = null) {
    try {
        let query = supabase
            .from('mmpi_interpretations')
            .select('description')
            .eq('scale_name', scale)
            .lte('min_t_score', tScore)
            .gte('max_t_score', tScore);
        
        // Mf ölçeği için cinsiyet filtresi ekle
        if (scale === 'Mf' && gender) {
            query = query.eq('gender', gender);
        }
        
        const { data, error } = await query.single();
        
        if (error) {
            console.error(`${scale} ölçeği için değerlendirme bulunamadı:`, error);
            return null;
        }
        
        return data.description;
    } catch (error) {
        console.error('Veritabanından değerlendirme alınırken hata:', error);
        return null;
    }
}

async function generateReport(testId) {
    // Parametre yoksa, detay modalında en son görüntülenen testi kullan
    if (!testId) testId = lastViewedTestId;
    const test = allTestResults.find(t => t.id == testId);
    
    if (!test) {
        showNotification('Test bulunamadı.', 'error');
        return;
    }
    
    if (test.status !== 'completed') {
        showNotification('Sadece tamamlanmış testler için rapor oluşturulabilir.', 'warning');
        return;
    }
    
    try {
        // Önce bu test için rapor var mı kontrol et
        const { data: existingReport, error: checkError } = await supabase
            .from('reports')
            .select('id')
            .eq('test_result_id', testId)
            .maybeSingle();
        
        if (existingReport) {
            showNotification('Bu test için rapor zaten mevcut. Rapor görüntüleniyor...', 'info');
            window.open(`../report.html?id=${existingReport.id}`, '_blank');
            return;
        }
        
        showNotification('Rapor oluşturuluyor...', 'info');
    
        // Test cevaplarını al (test_results tablosundan)
        const { data: testResult, error: answersError } = await supabase
            .from('test_results')
            .select('test_answers, participant_id')
            .eq('id', testId)
            .single();
        
        if (answersError || !testResult) {
            console.error('Test sonucu alınırken hata:', answersError);
            showNotification('Test sonucu alınırken hata oluştu.', 'error');
            return;
        }
        
        // JSONB formatındaki test_answers'ı dönüştür
        const testAnswers = Object.entries(testResult.test_answers || {}).map(([questionNumber, answer]) => ({
            question_number: questionNumber,
            answer: answer
        }));
        
        // Cinsiyet bilgisini participants tablosundan al
        let gender = null;
        try {
            const { data: p } = await supabase
                .from('participants')
                .select('gender')
                .eq('id', testResult.participant_id)
                .single();
            gender = p?.gender || null;
        } catch (_) {}
        
        // Scoring keys'leri al
        const { data: scoringKeys, error: keysError } = await supabase
            .from('scoring_keys')
            .select('scale_name, question_number, scoring_answer');
        
        if (keysError) {
            console.error('Puanlama anahtarları alınırken hata:', keysError);
            showNotification('Puanlama anahtarları alınırken hata oluştu.', 'error');
            return;
        }
        
        // MMPI puanlarını hesapla
        const scores = await calculateMMPIScores(testAnswers, scoringKeys, gender);
        
        // Özet ve rapor hesaplamalarını yap
        const summaryData = await generateSummaryData(scores.tScores, gender);
        const resultData = await generateResultData(scores.tScores, scores.interpretations, gender);

        if(Object.keys(scores.tScores).length === 0){
            showNotification('Skor hesaplamada bir hata oluştur. Lütfen tekrar deneyiniz', 'error');
            return;
        }
        // Raporu veritabanına kaydet (mevcut reports tablosunu kullan)
        const reportContent = {
            raw_scores: scores.rawScores,
            t_scores: scores.tScores,
            interpretations: scores.interpretations,
            validity_assessment: scores.validityAssessment,
            summary: scores.summary,
            recommendations: scores.recommendations,
            summary_data: summaryData,
            result_data: resultData,
            generated_at: new Date().toISOString()
        };
        
        const { data: reportData, error: reportError } = await supabase
            .from('reports')
            .insert({
                test_result_id: testId,
                report_content: reportContent,
                report_type: 'mmpi_standard',
                generated_by: 'system'
            })
            .select()
            .single();
        
        if (reportError) {
            console.error('Rapor kaydedilirken hata:', reportError);
            showNotification('Rapor kaydedilirken hata oluştu.', 'error');
            return;
        }
        
        showNotification('Rapor başarıyla oluşturuldu.', 'success');
        
        // Rapor sayfasını aç
        window.open(`../report.html?id=${reportData.id}`, '_blank');
        
    } catch (error) {
        console.error('Rapor oluşturulurken hata:', error);
        showNotification('Rapor oluşturulurken beklenmeyen bir hata oluştu.', 'error');
    }
}

// Sonucu indir
function downloadResult(testId) {
    const test = allTestResults.find(t => t.id == testId);
    
    if (!test) {
        showNotification('Test bulunamadı.', 'error');
        return;
    }
    
    // JSON formatında test verisini indir
    const dataStr = JSON.stringify(test, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `test_${testId}_${formatDateForFilename(new Date())}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    showNotification('Test verisi indirildi.', 'success');
}

// Sonucu sil
function deleteResult(testId) {
    if (!confirm('Bu test sonucunu silmek istediğinizden emin misiniz?')) {
        return;
    }
    
    // Demo silme işlemi
    const index = allTestResults.findIndex(t => t.id == testId);
    if (index !== -1) {
        allTestResults.splice(index, 1);
        updateTable(allTestResults);
        updateResultsCount(allTestResults.length);
        showNotification('Test sonucu silindi.', 'success');
    } else {
        showNotification('Test bulunamadı.', 'error');
    }
}

// Yardımcı fonksiyonlar
function getStatusText(status) {
    switch (status) {
        case 'completed': return 'Tamamlandı';
        case 'in_progress': return 'Devam Ediyor';
        case 'pending': return 'Bekliyor';
        default: return 'Bilinmiyor';
    }
}

function getScoreColor(score) {
    if (score >= 80) return '#28a745';
    if (score >= 60) return '#ffc107';
    return '#dc3545';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR') + ' ' + date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function formatDateForInput(date) {
    return date.toISOString().split('T')[0];
}

function formatDateForFilename(date) {
    return date.toISOString().split('T')[0].replace(/-/g, '');
}

function showLoading(show) {
    // Loading indicator göster/gizle
    if (show) {
        document.body.style.cursor = 'wait';
    } else {
        document.body.style.cursor = 'default';
    }
}

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