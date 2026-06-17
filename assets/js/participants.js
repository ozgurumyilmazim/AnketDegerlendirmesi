// Participants JavaScript
// Katılımcı yönetimi ve görüntüleme

// Global değişkenler
let participantsTable = null;
let currentUser = null;
let allParticipants = [];
let filteredParticipants = [];
let currentParticipant = null;
let editMode = false;

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
    // Kullanıcı kimlik doğrulaması
    checkAuthentication();
    
    // DataTable'ı başlat
    initializeDataTable();
    
    // Katılımcıları yükle
    loadParticipants();
    
    // Event listener'ları ayarla
    setupEventListeners();
});

// Kimlik doğrulama kontrolü
async function checkAuthentication() {
    try {
        // Önce PG_API session kontrolü
        const session = await AuthService.getSession();
        
        if (session && session.user) {
            // PG_API session var, kullanıcı bilgilerini al
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
        
        // Hata durumunda local storage kontrolü
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
    participantsTable = $('#participantsTable').DataTable({
        responsive: true,
        pageLength: 25,
        order: [[3, 'desc']], // Kayıt tarihine göre azalan sıralama
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/tr.json'
        },
        columnDefs: [
            {
                targets: [0], // Katılımcı sütunu
                render: function(data, type, row) {
                    if (type === 'display') {
                        const participant = allParticipants.find(p => p.id === row[8]); // ID hidden column
                        if (participant) {
                            const avatar = generateAvatar(participant.firstName, participant.lastName);
                            return `
                                <div class="d-flex align-items-center">
                                    <div class="participant-avatar me-3" style="background: ${avatar.color}">
                                        ${avatar.initials}
                                    </div>
                                    <div>
                                        <div class="fw-bold">${participant.firstName} ${participant.lastName}</div>
                                        <small class="text-muted">TC: ${participant.tcNo}</small>
                                    </div>
                                </div>
                            `;
                        }
                    }
                    return data;
                }
            },
            {
                targets: [2], // Cinsiyet sütunu
                render: function(data, type, row) {
                    if (type === 'display') {
                        return data === 'male' ? 'Erkek' : 'Kadın';
                    }
                    return data;
                }
            },
            {
                targets: [6], // Durum sütunu
                render: function(data, type, row) {
                    if (type === 'display') {
                        return `<span class="participant-status status-${data}">${getStatusText(data)}</span>`;
                    }
                    return data;
                }
            },
            {
                targets: [7], // İşlemler sütunu
                orderable: false,
                render: function(data, type, row) {
                    const participantId = row[8]; // ID hidden column
                    return `
                        <div class="btn-group" role="group">
                            <button class="btn btn-sm btn-outline-primary action-btn" 
                                    onclick="viewParticipantDetail(${participantId})" title="Detayları Görüntüle">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-success action-btn" 
                                    onclick="editParticipantInfo(${participantId})" title="Düzenle">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-info action-btn" 
                                    onclick="viewTestHistory(${participantId})" title="Test Geçmişi">
                                <i class="fas fa-history"></i>
                            </button>
                            ${currentUser.role === 'admin' ? `
                                <button class="btn btn-sm btn-outline-danger action-btn" 
                                        onclick="deleteParticipant(${participantId})" title="Sil">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                        </div>
                    `;
                }
            },
            {
                targets: [8], // ID sütunu (gizli)
                visible: false
            }
        ],
        drawCallback: function() {
            // Tablo çizildikten sonra tooltip'leri aktifleştir
            $('[title]').tooltip();
        }
    });
}

// Katılımcıları yükle
async function loadParticipants() {
    try {
        showLoading(true);

        
        // İstatistikleri güncelle
        updateStatistics();
        
    } catch (error) {
        console.error('Katılımcılar yüklenirken hata:', error);
        showNotification('Katılımcılar yüklenirken hata oluştu.', 'error');
    } finally {
        showLoading(false);
    }
}

// Tabloyu güncelle
function updateTable(participants) {
    participantsTable.clear();
    
    participants.forEach(participant => {
        participantsTable.row.add([
            `${participant.firstName} ${participant.lastName}`, // Katılımcı
            participant.age, // Yaş
            participant.gender, // Cinsiyet
            formatDate(participant.registeredAt), // Kayıt Tarihi
            participant.testCount, // Test Sayısı
            participant.lastTest ? formatDate(participant.lastTest) : 'Henüz yok', // Son Test
            participant.status, // Durum
            '', // İşlemler sütunu render fonksiyonunda doldurulacak
            participant.id // ID (gizli)
        ]);
    });
    
    participantsTable.draw();
    
    // Katılımcı sayısını güncelle
    document.getElementById('participantCount').textContent = `${participants.length} katılımcı`;
}

// İstatistikleri güncelle
function updateStatistics() {
    const total = allParticipants.length;
    const completed = allParticipants.filter(p => p.status === 'completed').length;
    const pending = allParticipants.filter(p => p.status === 'pending').length;
    
    // Ortalama test puanını hesapla
    const completedTests = allParticipants
        .flatMap(p => p.testHistory)
        .filter(t => t.status === 'completed' && t.score !== null);
    
    const avgScore = completedTests.length > 0 
        ? Math.round(completedTests.reduce((sum, test) => sum + test.score, 0) / completedTests.length)
        : 0;
    
    document.getElementById('totalParticipants').textContent = total;
    document.getElementById('completedParticipants').textContent = completed;
    document.getElementById('pendingParticipants').textContent = pending;
    document.getElementById('avgTestScore').textContent = avgScore;
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
    window.applyFilters = applyFilters;
    window.clearFilters = clearFilters;
    window.exportParticipants = exportParticipants;
    window.addNewParticipant = addNewParticipant;
    window.viewParticipantDetail = viewParticipantDetail;
    window.editParticipantInfo = editParticipantInfo;
    window.viewTestHistory = viewTestHistory;
    window.deleteParticipant = deleteParticipant;
    window.editParticipant = editParticipant;
    window.saveParticipant = saveParticipant;
}

// Filtreleri uygula
function applyFilters() {
    const status = document.getElementById('statusFilter').value;
    const ageGroup = document.getElementById('ageGroupFilter').value;
    const gender = document.getElementById('genderFilter').value;
    
    filteredParticipants = allParticipants.filter(participant => {
        // Durum filtresi
        if (status && participant.status !== status) return false;
        
        // Yaş grubu filtresi
        if (ageGroup) {
            const age = participant.age;
            switch (ageGroup) {
                case '13-17':
                    if (age < 13 || age > 17) return false;
                    break;
                case '18-25':
                    if (age < 18 || age > 25) return false;
                    break;
                case '26-35':
                    if (age < 26 || age > 35) return false;
                    break;
                case '36+':
                    if (age < 36) return false;
                    break;
            }
        }
        
        // Cinsiyet filtresi
        if (gender && participant.gender !== gender) return false;
        
        return true;
    });
    
    updateTable(filteredParticipants);
    showNotification(`${filteredParticipants.length} katılımcı bulundu.`, 'success');
}

// Filtreleri temizle
function clearFilters() {
    document.getElementById('statusFilter').value = '';
    document.getElementById('ageGroupFilter').value = '';
    document.getElementById('genderFilter').value = '';
    
    updateTable(allParticipants);
    showNotification('Filtreler temizlendi.', 'info');
}

// Katılımcıları dışa aktar
function exportParticipants() {
    const dataToExport = filteredParticipants.length > 0 ? filteredParticipants : allParticipants;
    
    if (dataToExport.length === 0) {
        showNotification('Aktarılacak veri bulunamadı.', 'warning');
        return;
    }
    
    // CSV formatında veri hazırla
    const headers = ['Ad', 'Soyad', 'TC No', 'Yaş', 'Cinsiyet', 'Eğitim', 'E-posta', 'Telefon', 'Kayıt Tarihi', 'Test Sayısı', 'Durum'];
    const csvContent = [headers.join(',')];
    
    dataToExport.forEach(participant => {
        const row = [
            `"${participant.firstName}"`,
            `"${participant.lastName}"`,
            participant.tcNo,
            participant.age,
            participant.gender === 'male' ? 'Erkek' : 'Kadın',
            participant.education,
            `"${participant.email || ''}"`,
            `"${participant.phone || ''}"`,
            formatDate(participant.registeredAt),
            participant.testCount,
            getStatusText(participant.status)
        ];
        csvContent.push(row.join(','));
    });
    
    // Dosyayı indir
    const blob = new Blob([csvContent.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `katilimcilar_${formatDateForFilename(new Date())}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Katılımcı verileri başarıyla aktarıldı.', 'success');
}

// Yeni katılımcı ekle
function addNewParticipant() {
    editMode = false;
    currentParticipant = null;
    
    // Form'u temizle
    document.getElementById('participantForm').reset();
    document.getElementById('participantFormTitle').textContent = 'Yeni Katılımcı Ekle';
    
    const modal = new bootstrap.Modal(document.getElementById('participantFormModal'));
    modal.show();
}

// Katılımcı detayını görüntüle
function viewParticipantDetail(participantId) {
    const participant = allParticipants.find(p => p.id === participantId);
    
    if (!participant) {
        showNotification('Katılımcı bulunamadı.', 'error');
        return;
    }
    
    currentParticipant = participant;
    
    const modalContent = document.getElementById('participantDetailContent');
    modalContent.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <div class="participant-details">
                    <h6 class="text-primary mb-3">Kişisel Bilgiler</h6>
                    <table class="table table-sm table-borderless">
                        <tr><td><strong>Ad Soyad:</strong></td><td>${participant.firstName} ${participant.lastName}</td></tr>
                        <tr><td><strong>TC No:</strong></td><td>${participant.tcNo}</td></tr>
                        <tr><td><strong>Yaş:</strong></td><td>${participant.age}</td></tr>
                        <tr><td><strong>Cinsiyet:</strong></td><td>${participant.gender === 'male' ? 'Erkek' : 'Kadın'}</td></tr>
                        <tr><td><strong>Eğitim:</strong></td><td>${participant.education}</td></tr>
                        <tr><td><strong>E-posta:</strong></td><td>${participant.email || 'Belirtilmemiş'}</td></tr>
                        <tr><td><strong>Telefon:</strong></td><td>${participant.phone || 'Belirtilmemiş'}</td></tr>
                    </table>
                </div>
            </div>
            <div class="col-md-6">
                <div class="participant-details">
                    <h6 class="text-primary mb-3">Test Bilgileri</h6>
                    <table class="table table-sm table-borderless">
                        <tr><td><strong>Kayıt Tarihi:</strong></td><td>${formatDate(participant.registeredAt)}</td></tr>
                        <tr><td><strong>Test Sayısı:</strong></td><td>${participant.testCount}</td></tr>
                        <tr><td><strong>Son Test:</strong></td><td>${participant.lastTest ? formatDate(participant.lastTest) : 'Henüz yok'}</td></tr>
                        <tr><td><strong>Durum:</strong></td><td><span class="participant-status status-${participant.status}">${getStatusText(participant.status)}</span></td></tr>
                    </table>
                </div>
            </div>
        </div>
        
        ${participant.notes ? `
            <div class="participant-details">
                <h6 class="text-primary mb-3">Notlar</h6>
                <p class="mb-0">${participant.notes}</p>
            </div>
        ` : ''}
        
        <div class="participant-details">
            <h6 class="text-primary mb-3">Test Geçmişi</h6>
            ${participant.testHistory.length > 0 ? `
                <div class="row">
                    ${participant.testHistory.map(test => `
                        <div class="col-md-6 mb-3">
                            <div class="test-history-item">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <div>
                                        <strong>${test.type}</strong>
                                        <br>
                                        <small class="text-muted">${formatDate(test.date)}</small>
                                    </div>
                                    ${test.score ? `
                                        <div class="test-score ${getScoreClass(test.score)}">
                                            ${test.score}
                                        </div>
                                    ` : '<span class="badge bg-warning">Devam Ediyor</span>'}
                                </div>
                                <div class="small">
                                    <i class="fas fa-clock me-1"></i> ${test.duration}
                                    <span class="ms-3">
                                        <i class="fas fa-circle me-1" style="color: ${getStatusColor(test.status)}"></i>
                                        ${getStatusText(test.status)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : '<p class="text-muted">Henüz test geçmişi bulunmuyor.</p>'}
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('participantDetailModal'));
    modal.show();
}

// Katılımcı bilgilerini düzenle
function editParticipantInfo(participantId) {
    const participant = allParticipants.find(p => p.id === participantId);
    
    if (!participant) {
        showNotification('Katılımcı bulunamadı.', 'error');
        return;
    }
    
    editMode = true;
    currentParticipant = participant;
    
    // Form'u doldur
    document.getElementById('firstName').value = participant.firstName;
    document.getElementById('lastName').value = participant.lastName;
    document.getElementById('tcNo').value = participant.tcNo;
    document.getElementById('age').value = participant.age;
    document.getElementById('gender').value = participant.gender;
    document.getElementById('education').value = participant.education;
    document.getElementById('email').value = participant.email || '';
    document.getElementById('phone').value = participant.phone || '';
    document.getElementById('notes').value = participant.notes || '';
    
    document.getElementById('participantFormTitle').textContent = 'Katılımcı Bilgilerini Düzenle';
    
    const modal = new bootstrap.Modal(document.getElementById('participantFormModal'));
    modal.show();
}

// Test geçmişini görüntüle
function viewTestHistory(participantId) {
    const participant = allParticipants.find(p => p.id === participantId);
    
    if (!participant) {
        showNotification('Katılımcı bulunamadı.', 'error');
        return;
    }
    
    // Test geçmişi detayını göster
    viewParticipantDetail(participantId);
}

// Katılımcıyı sil
function deleteParticipant(participantId) {
    const participant = allParticipants.find(p => p.id === participantId);
    
    if (!participant) {
        showNotification('Katılımcı bulunamadı.', 'error');
        return;
    }
    
    if (!confirm(`${participant.firstName} ${participant.lastName} adlı katılımcıyı silmek istediğinizden emin misiniz?`)) {
        return;
    }
    
    // Demo silme işlemi
    const index = allParticipants.findIndex(p => p.id === participantId);
    if (index !== -1) {
        allParticipants.splice(index, 1);
        updateTable(allParticipants);
        updateStatistics();
        showNotification('Katılımcı silindi.', 'success');
    }
}

// Katılımcı düzenle (modal'dan)
function editParticipant() {
    if (currentParticipant) {
        editParticipantInfo(currentParticipant.id);
        
        // Detay modal'ını kapat
        const detailModal = bootstrap.Modal.getInstance(document.getElementById('participantDetailModal'));
        if (detailModal) {
            detailModal.hide();
        }
    }
}

// Katılımcıyı kaydet
function saveParticipant() {
    const form = document.getElementById('participantForm');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const participantData = {
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        tcNo: document.getElementById('tcNo').value.trim(),
        age: parseInt(document.getElementById('age').value),
        gender: document.getElementById('gender').value,
        education: document.getElementById('education').value,
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        notes: document.getElementById('notes').value.trim()
    };
    
    // TC No validasyonu
    if (!/^\d{11}$/.test(participantData.tcNo)) {
        showNotification('TC Kimlik No 11 haneli olmalıdır.', 'error');
        return;
    }
    
    // TC No tekrar kontrolü (düzenleme modunda mevcut katılımcı hariç)
    const existingParticipant = allParticipants.find(p => 
        p.tcNo === participantData.tcNo && 
        (!editMode || p.id !== currentParticipant.id)
    );
    
    if (existingParticipant) {
        showNotification('Bu TC Kimlik No ile kayıtlı başka bir katılımcı bulunmaktadır.', 'error');
        return;
    }
    
    if (editMode && currentParticipant) {
        // Mevcut katılımcıyı güncelle
        const index = allParticipants.findIndex(p => p.id === currentParticipant.id);
        if (index !== -1) {
            allParticipants[index] = {
                ...allParticipants[index],
                ...participantData
            };
            showNotification('Katılımcı bilgileri güncellendi.', 'success');
        }
    } else {
        // Yeni katılımcı ekle
        const newParticipant = {
            id: Math.max(...allParticipants.map(p => p.id)) + 1,
            ...participantData,
            registeredAt: new Date().toISOString(),
            testCount: 0,
            lastTest: null,
            status: 'pending',
            testHistory: []
        };
        
        allParticipants.push(newParticipant);
        showNotification('Yeni katılımcı eklendi.', 'success');
    }
    
    // Tabloyu ve istatistikleri güncelle
    updateTable(allParticipants);
    updateStatistics();
    
    // Modal'ı kapat
    const modal = bootstrap.Modal.getInstance(document.getElementById('participantFormModal'));
    modal.hide();
    
    // Form'u temizle
    form.reset();
    editMode = false;
    currentParticipant = null;
}

// Yardımcı fonksiyonlar
function getStatusText(status) {
    switch (status) {
        case 'completed': return 'Tamamlandı';
        case 'active': return 'Aktif';
        case 'pending': return 'Bekliyor';
        case 'in_progress': return 'Devam Ediyor';
        default: return 'Bilinmiyor';
    }
}

function getStatusColor(status) {
    switch (status) {
        case 'completed': return '#28a745';
        case 'active': return '#17a2b8';
        case 'pending': return '#ffc107';
        case 'in_progress': return '#fd7e14';
        default: return '#6c757d';
    }
}

function getScoreClass(score) {
    if (score >= 85) return 'score-excellent';
    if (score >= 70) return 'score-good';
    if (score >= 55) return 'score-average';
    return 'score-poor';
}

function generateAvatar(firstName, lastName) {
    const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    const colors = [
        '#667eea', '#764ba2', '#f093fb', '#f5576c',
        '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
        '#fa709a', '#fee140', '#a8edea', '#fed6e3'
    ];
    
    const colorIndex = (firstName.charCodeAt(0) + lastName.charCodeAt(0)) % colors.length;
    
    return {
        initials: initials,
        color: colors[colorIndex]
    };
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR') + ' ' + date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
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