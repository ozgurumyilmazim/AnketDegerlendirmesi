// Tamamlanmamış Testler JS Controller
// Incomplete MMPI Tests Management & Session Troubleshooting

let incompleteTestsTable = null;
let currentUser = null;
let allIncompleteResults = [];
let filteredIncompleteResults = [];

document.addEventListener('DOMContentLoaded', async function () {
    const isAuthenticated = await checkAuthentication();
    if (!isAuthenticated) return;

    // Check page permission with fallback
    try {
        if (typeof checkPagePermission === 'function') {
            const hasPermission = await checkPagePermission('incomplete-tests');
            if (!hasPermission) return;
        }
    } catch (e) {
        console.warn('Page permission check skipped:', e);
    }

    initializeDataTable();
    loadIncompleteTests();
    setupEventListeners();
});

// Authentication Check
async function checkAuthentication() {
    try {
        if (typeof AuthService === 'undefined' || !AuthService.getSession) {
            console.error('AuthService is undefined');
            window.location.href = 'login.html';
            return false;
        }

        const { data: { session } } = await AuthService.getSession();

        if (session && session.user) {
            const userRole = await AuthService.getUserRole();
            const isAdmin = await AuthService.isAdmin();

            currentUser = {
                userId: session.user.id,
                email: session.user.email,
                name: session.user.name || session.user.email,
                role: userRole || session.user.role,
                isAdmin: isAdmin
            };

            updateUserInfo();
            return true;
        }

        sessionStorage.removeItem('adminLogin');
        localStorage.removeItem('adminLogin');
        window.location.href = 'login.html';
        return false;
    } catch (error) {
        console.error('Authentication error:', error);
        window.location.href = 'login.html';
        return false;
    }
}

function updateUserInfo() {
    if (currentUser) {
        const userNameEl = document.getElementById('userName');
        const userInitialsEl = document.getElementById('userInitials');

        if (userNameEl) userNameEl.textContent = currentUser.name;
        if (userInitialsEl) {
            const initials = currentUser.name
                .split(' ')
                .map(n => n.charAt(0))
                .join('')
                .toUpperCase();
            userInitialsEl.textContent = initials;
        }
    }
}

// DataTables Initialization
function initializeDataTable() {
    incompleteTestsTable = $('#incompleteTestsTable').DataTable({
        responsive: true,
        pageLength: 25,
        order: [[4, 'desc']], // Order by last updated descending
        language: {
            "decimal": ",",
            "thousands": ".",
            "info": "_TOTAL_ kayıttan _START_ - _END_ arası gösteriliyor",
            "infoEmpty": "Tamamlanmamış test bulunamadı",
            "infoFiltered": "(_MAX_ kayıt içerisinden filtrelendi)",
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
            }
        },
        columnDefs: [
            { targets: [0], visible: false }, // ID column hidden
            {
                targets: [1], // Session Code column
                render: function (data, type, row) {
                    if (type === 'display') {
                        if (!data) {
                            return `<span class="badge bg-secondary">Kod Yok</span>`;
                        }
                        return `
                            <div class="d-flex align-items-center">
                                <code class="fw-bold fs-6 text-primary me-2">${data}</code>
                                <button class="btn btn-sm btn-outline-secondary py-0 px-1" 
                                        onclick="copySessionCode('${data}')" title="Kodu Kopyala">
                                    <i class="fas fa-copy"></i>
                                </button>
                            </div>
                        `;
                    }
                    return data;
                }
            },
            {
                targets: [3], // Progress column
                render: function (data, type, row) {
                    if (type === 'display') {
                        const currentIndex = row[7] || 0; // current_index
                        const completedCount = row[8] || 0; // completed_questions
                        const total = 567;
                        const percent = Math.min(100, Math.round((currentIndex / total) * 100));

                        return `
                            <div>
                                <div class="d-flex justify-content-between mb-1 small fw-bold">
                                    <span>Soru: ${currentIndex} / ${total}</span>
                                    <span>%${percent}</span>
                                </div>
                                <div class="progress" style="height: 6px;">
                                    <div class="progress-bar bg-warning" role="progressbar" style="width: ${percent}%;"></div>
                                </div>
                            </div>
                        `;
                    }
                    return data;
                }
            },
            {
                targets: [5], // Status column
                render: function (data, type, row) {
                    if (type === 'display') {
                        if (data === 'in_progress') {
                            return `<span class="badge bg-warning text-dark"><i class="fas fa-spinner fa-spin me-1"></i>Devam Ediyor</span>`;
                        } else if (data === 'started') {
                            return `<span class="badge bg-info text-dark"><i class="fas fa-play me-1"></i>Başlatıldı</span>`;
                        }
                        return `<span class="badge bg-secondary">${data}</span>`;
                    }
                    return data;
                }
            },
            {
                targets: [6], // Actions column
                orderable: false,
                render: function (data, type, row) {
                    const testId = row[0];
                    return `
                        <div class="btn-group" role="group">
                            <button class="btn btn-sm btn-outline-primary action-btn" 
                                    onclick="viewTestDetail('${testId}')" title="Detayları Görüntüle">
                                <i class="fas fa-eye"></i> Detay
                            </button>
                            ${currentUser && currentUser.role === 'admin' ? `
                                <button class="btn btn-sm btn-outline-danger action-btn ms-1" 
                                        onclick="deleteIncompleteTest('${testId}')" title="Test Kaydını Sil">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                        </div>
                    `;
                }
            }
        ]
    });
}

// Load incomplete tests from database
async function loadIncompleteTests() {
    try {
        if (typeof PG_API === 'undefined' || !PG_API) {
            showToast('Veritabanı bağlantısı mevcut değil.', 'danger');
            return;
        }

        const { data, error } = await PG_API
            .from('test_results')
            .select(`
                id,
                session_code,
                current_index,
                completed_questions,
                dont_know_count,
                status,
                created,
                updated,
                start_time,
                test_answers,
                participant_id,
                participants (
                    first_name,
                    last_name,
                    tc_no,
                    age,
                    gender,
                    institution_code,
                    institution_name,
                    profession,
                    education,
                    marital_status
                )
            `)
            .in('status', ['started', 'in_progress'])
            .order('updated', { ascending: false });

        if (error) {
            console.error('Tamamlanmamış testler yüklenirken hata:', error);
            showToast('Veriler yüklenirken hata oluştu: ' + error.message, 'danger');
            return;
        }

        allIncompleteResults = data || [];
        filteredIncompleteResults = [...allIncompleteResults];

        renderTableData(filteredIncompleteResults);

    } catch (err) {
        console.error('Incomplete tests load exception:', err);
        showToast('Kayıtlar yüklenirken beklenmeyen bir hata oluştu.', 'danger');
    }
}

// Render data into DataTable
function renderTableData(results) {
    if (!incompleteTestsTable) return;

    incompleteTestsTable.clear();

    const tableRows = results.map(item => {
        const participant = item.participants || {};
        const fullName = `${participant.first_name || ''} ${participant.last_name || ''}`.trim() || 'İsimsiz Katılımcı';
        const tcNo = participant.tc_no || '-';
        const participantDisplay = `<div><strong>${escapeHtml(fullName)}</strong><br><small class="text-muted">TC: ${escapeHtml(tcNo)}</small></div>`;

        const lastUpdated = item.updated || item.created || item.start_time;
        const formattedDate = lastUpdated ? new Date(lastUpdated).toLocaleString('tr-TR') : '-';

        return [
            item.id,                         // 0: Hidden ID
            item.session_code || '',          // 1: Session Code
            participantDisplay,              // 2: Participant Name + TC
            item.current_index || 0,         // 3: Progress Render
            formattedDate,                    // 4: Last Updated
            item.status,                     // 5: Status Badge
            item.id,                         // 6: Actions
            item.current_index || 0,         // 7: Raw current_index
            item.completed_questions || 0    // 8: Raw completed_questions
        ];
    });

    incompleteTestsTable.rows.add(tableRows).draw();
    document.getElementById('totalCountBadge').textContent = `${results.length} kayıt`;
}

// Set up filter event listeners
function setupEventListeners() {
    $('#filterSearch').on('keyup', applyFilters);
    $('#filterSessionCode').on('keyup', applyFilters);
    $('#filterStatus').on('change', applyFilters);

    $('#clearFiltersBtn').on('click', function () {
        $('#filterSearch').val('');
        $('#filterSessionCode').val('');
        $('#filterStatus').val('');
        filteredIncompleteResults = [...allIncompleteResults];
        renderTableData(filteredIncompleteResults);
    });
}

function applyFilters() {
    const searchVal = ($('#filterSearch').val() || '').toLowerCase().trim();
    const sessionVal = ($('#filterSessionCode').val() || '').toUpperCase().trim();
    const statusVal = $('#filterStatus').val();

    filteredIncompleteResults = allIncompleteResults.filter(item => {
        const p = item.participants || {};
        const fullName = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
        const tcNo = (p.tc_no || '').toLowerCase();
        const sessionCode = (item.session_code || '').toUpperCase();

        const matchesSearch = !searchVal || fullName.includes(searchVal) || tcNo.includes(searchVal);
        const matchesSession = !sessionVal || sessionCode.includes(sessionVal);
        const matchesStatus = !statusVal || item.status === statusVal;

        return matchesSearch && matchesSession && matchesStatus;
    });

    renderTableData(filteredIncompleteResults);
}

// Copy session code to clipboard
function copySessionCode(code) {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
        showToast(`Oturum Kodu (${code}) panoya kopyalandı!`, 'success');
    }).catch(err => {
        console.error('Copy failed:', err);
        showToast('Kopyalama başarısız oldu.', 'warning');
    });
}

// View Detail Modal
function viewTestDetail(testId) {
    const item = allIncompleteResults.find(t => t.id === testId);
    if (!item) return;

    const p = item.participants || {};
    const answers = item.test_answers || {};
    const totalAnswered = Object.keys(answers).length;
    let trueCount = 0, falseCount = 0, dontKnowCount = item.dont_know_count || 0;

    Object.values(answers).forEach(val => {
        if (val === 'Doğru') trueCount++;
        else if (val === 'Yanlış') falseCount++;
        else if (val === 'Bilmiyorum') dontKnowCount++;
    });

    const modalBodyHtml = `
        <div class="row g-3 mb-4">
            <div class="col-md-6">
                <div class="card bg-light border-0 p-3">
                    <h6 class="text-primary fw-bold mb-3"><i class="fas fa-id-card me-2"></i>Katılımcı Bilgileri</h6>
                    <p class="mb-1"><strong>Ad Soyad:</strong> ${escapeHtml(p.first_name || '')} ${escapeHtml(p.last_name || '')}</p>
                    <p class="mb-1"><strong>TC No:</strong> ${escapeHtml(p.tc_no || '-')}</p>
                    <p class="mb-1"><strong>Yaş / Cinsiyet:</strong> ${p.age || '-'} / ${p.gender === 'erkek' ? 'Erkek' : (p.gender === 'kadin' ? 'Kadın' : '-')}</p>
                    <p class="mb-1"><strong>Meslek / Eğitim:</strong> ${escapeHtml(p.profession || '-')} / ${escapeHtml(p.education || '-')}</p>
                    <p class="mb-0"><strong>Kurum:</strong> ${escapeHtml(p.institution_name || '-')} (${escapeHtml(p.institution_code || '-')})</p>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card bg-light border-0 p-3">
                    <h6 class="text-success fw-bold mb-3"><i class="fas fa-clock me-2"></i>Oturum İlerleme Bilgileri</h6>
                    <div class="mb-2">
                        <strong>Oturum Devam Kodu:</strong> 
                        <div class="d-inline-flex align-items-center ms-2">
                            <code class="fs-5 text-primary fw-bold me-2">${item.session_code || 'Yok'}</code>
                            ${item.session_code ? `<button class="btn btn-sm btn-outline-primary py-0 px-2" onclick="copySessionCode('${item.session_code}')"><i class="fas fa-copy me-1"></i>Kopyala</button>` : ''}
                        </div>
                    </div>
                    <p class="mb-1"><strong>Kaldığı Soru İndeksi:</strong> ${item.current_index || 0} / 567</p>
                    <p class="mb-1"><strong>Son Güncelleme:</strong> ${item.updated ? new Date(item.updated).toLocaleString('tr-TR') : '-'}</p>
                    <p class="mb-0"><strong>Test Başlangıcı:</strong> ${item.start_time ? new Date(item.start_time).toLocaleString('tr-TR') : '-'}</p>
                </div>
            </div>
        </div>

        <div class="card border-0 shadow-sm p-3 mb-3">
            <h6 class="fw-bold mb-3"><i class="fas fa-chart-pie me-2"></i>Cevap Dağılım Özeti</h6>
            <div class="row text-center">
                <div class="col-4">
                    <div class="p-2 border rounded bg-success bg-opacity-10">
                        <span class="d-block text-success fw-bold fs-4">${trueCount}</span>
                        <small class="text-muted">Doğru</small>
                    </div>
                </div>
                <div class="col-4">
                    <div class="p-2 border rounded bg-danger bg-opacity-10">
                        <span class="d-block text-danger fw-bold fs-4">${falseCount}</span>
                        <small class="text-muted">Yanlış</small>
                    </div>
                </div>
                <div class="col-4">
                    <div class="p-2 border rounded bg-warning bg-opacity-10">
                        <span class="d-block text-warning fw-bold fs-4">${dontKnowCount}</span>
                        <small class="text-muted">Bilmiyorum</small>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('incompleteDetailModalBody').innerHTML = modalBodyHtml;
    const modal = new bootstrap.Modal(document.getElementById('incompleteDetailModal'));
    modal.show();
}

// Delete incomplete test session
async function deleteIncompleteTest(testId) {
    if (!confirm('Bu tamamlanmamış test kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
        return;
    }

    try {
        const { error } = await PG_API
            .from('test_results')
            .eq('id', testId)
            .delete();

        if (error) {
            showToast('Silme hatası: ' + error.message, 'danger');
            return;
        }

        showToast('Tamamlanmamış test kaydı silindi.', 'success');
        loadIncompleteTests();
    } catch (e) {
        console.error('Delete error:', e);
        showToast('Silme işlemi sırasında hata oluştu.', 'danger');
    }
}

// Helper: Toast notifications
function showToast(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3 z-3 shadow`;
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        <span>${escapeHtml(message)}</span>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);

    setTimeout(() => {
        $(alertDiv).alert('close');
    }, 4000);
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
