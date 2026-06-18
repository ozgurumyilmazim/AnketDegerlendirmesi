class QuestionsManager {
    constructor() {
        this.questions = [];
        this.filteredQuestions = [];
        this.currentEditId = null;
        this.currentDeleteId = null;
        this.categories = [];
        
        this.init();
    }

    async init() {
        await this.checkAuth();
        await this.loadCategories();
        await this.loadQuestions();
        this.bindEvents();
        this.updateStatistics();
    }

    async checkAuth() {
        if (window.AuthService) {
            try {
                const { data: { user } } = await AuthService.getUser();
                if (!user) {
                    window.location.href = 'login.html';
                    return;
                }
            } catch (e) {
                console.warn('Auth check failed, proceeding anyway:', e);
            }
        }
    }

    async loadCategories() {
        if (!window.PG_API) return;
        try {
            const { data, error } = await window.PG_API
                .from('question_category')
                .select('*')
                .order('sort_order', { ascending: true });
            if (!error && data) this.categories = data;
        } catch (e) {
            console.warn('Kategoriler yüklenemedi:', e);
        }
        this.populateCategorySelects();
    }

    populateCategorySelects() {
        const selects = ['categoryFilter', 'addQuestionCategory', 'editQuestionCategory'];
        selects.forEach(id => {
            const sel = document.getElementById(id);
            if (!sel) return;
            const currentVal = sel.value;
            sel.innerHTML = '';
            if (id === 'categoryFilter') {
                const opt = document.createElement('option');
                opt.value = '';
                opt.textContent = 'Tüm Kategoriler';
                sel.appendChild(opt);
            }
            this.categories.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.name;
                opt.textContent = c.name;
                sel.appendChild(opt);
            });
            if (currentVal) sel.value = currentVal;
        });
    }

    async loadQuestions() {
        try {
            this.showLoading(true);
            
            if (window.PG_API) {
                try {
                    const { data, error } = await window.PG_API
                        .from('questions')
                        .select('*')
                        .order('question_number', { ascending: true });
                    
                    if (error) throw error;
                    
                    this.questions = data || [];
                } catch (dbError) {
                    console.error('Error loading from database:', dbError);
                    this.showError('Veritabanından sorular yüklenirken hata oluştu: ' + dbError.message);
                    this.questions = [];
                }
            } else {
                console.error('Database client not available');
                this.showError('Veritabanı bağlantısı mevcut değil.');
                this.questions = [];
            }
            
            this.filteredQuestions = [...this.questions];
            this.renderQuestions();
            this.updateStatistics();
        } catch (error) {
            console.error('Error loading questions:', error);
            this.showError('Sorular yüklenirken hata oluştu: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    bindEvents() {
        // Search
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterQuestions());
        }

        // Category filter
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.filterQuestions());
        }

        // Clear filters
        const clearFilters = document.getElementById('clearFilters');
        if (clearFilters) {
            clearFilters.addEventListener('click', () => {
                document.getElementById('searchInput').value = '';
                document.getElementById('categoryFilter').value = '';
                this.filterQuestions();
            });
        }

        // Save question
        const saveBtn = document.getElementById('saveQuestionBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveQuestion());
        }

        // Update question
        const updateBtn = document.getElementById('updateQuestionBtn');
        if (updateBtn) {
            updateBtn.addEventListener('click', () => this.updateQuestion());
        }

        // Delete question
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => this.deleteQuestion());
        }

        // Reset add form on modal show
        const addModal = document.getElementById('addQuestionModal');
        if (addModal) {
            addModal.addEventListener('show.bs.modal', () => {
                document.getElementById('addQuestionForm').reset();
                if (this.categories.length > 0) {
                    document.getElementById('addQuestionCategory').value = this.categories[0].name;
                }
            });
        }
    }

    filterQuestions() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;

        this.filteredQuestions = this.questions.filter(q => {
            const matchesSearch = q.question_text.toLowerCase().includes(searchTerm) ||
                                q.question_number.toString().includes(searchTerm);
            const matchesCategory = !categoryFilter || q.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });

        this.renderQuestions();
    }

    renderQuestions() {
        const tbody = document.getElementById('questionsTableBody');
        
        if (this.filteredQuestions.length === 0) {
            document.getElementById('noResults').style.display = 'block';
            tbody.innerHTML = '';
            return;
        }

        document.getElementById('noResults').style.display = 'none';

        tbody.innerHTML = this.filteredQuestions.map(q => `
            <tr>
                <td class="fw-bold">${q.question_number}</td>
                <td>
                    <div class="question-text-cell" title="${this.escapeHtml(q.question_text)}">
                        ${this.truncateText(q.question_text, 150)}
                    </div>
                </td>
                <td>
                    <span class="badge bg-info text-dark">${this.getCategoryName(q.category)}</span>
                </td>
                <td>
                    <div class="d-flex justify-content-end">
                        <div class="btn-group btn-group-sm" role="group">
                            <button type="button" class="btn btn-outline-info btn-sm" 
                                    onclick="questionManager.viewQuestion('${q.id}')" title="Görüntüle">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button type="button" class="btn btn-outline-primary btn-sm" 
                                    onclick="questionManager.editQuestion('${q.id}')" title="Düzenle">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button type="button" class="btn btn-outline-danger btn-sm" 
                                    onclick="questionManager.confirmDelete('${q.id}')" title="Sil">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    updateStatistics() {
        const total = this.filteredQuestions.length;
        document.getElementById('totalQuestions').textContent = total;
    }

    async saveQuestion() {
        try {
            const formData = this.getFormData('addQuestionForm');
            
            if (!this.validateQuestionData(formData)) return;

            if (this.questions.find(q => q.question_number === formData.question_number)) {
                this.showError('Bu soru numarası zaten kullanılıyor.');
                return;
            }

            let newQuestion = {
                ...formData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            let savedToDb = false;

            if (window.PG_API) {
                try {
                    const { data, error } = await window.PG_API
                        .from('questions')
                        .insert([newQuestion]);
                    
                    if (error) throw error;
                    
                    if (data && data.length > 0) {
                        newQuestion = data[0];
                        savedToDb = true;
                    }
                } catch (dbError) {
                    this.showError('Veritabanına kaydetme hatası: ' + (dbError.message || 'Bilinmeyen hata'));
                    return;
                }
            } else {
                newQuestion.id = 'local-' + Date.now();
                this.showError('Veritabanı bağlantısı yok. Soru sadece yerel olarak kaydedildi.');
            }

            this.questions.push(newQuestion);
            this.questions.sort((a, b) => a.question_number - b.question_number);
            
            this.filterQuestions();
            this.updateStatistics();
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('addQuestionModal'));
            if (modal) modal.hide();
            document.getElementById('addQuestionForm').reset();
            
            this.showSuccess(savedToDb ? 'Soru başarıyla kaydedildi.' : 'Soru yerel olarak kaydedildi.');
        } catch (error) {
            this.showError('Soru kaydedilirken hata oluştu: ' + error.message);
        }
    }

    async updateQuestion() {
        try {
            const formData = this.getFormData('editQuestionForm');
            
            if (!this.validateQuestionData(formData)) return;

            const questionIndex = this.questions.findIndex(q => q.id === this.currentEditId);
            if (questionIndex === -1) {
                this.showError('Soru bulunamadı.');
                return;
            }

            const existing = this.questions.find(q => q.question_number === formData.question_number && q.id !== this.currentEditId);
            if (existing) {
                this.showError('Bu soru numarası başka bir soru tarafından kullanılıyor.');
                return;
            }

            const updatedQuestion = {
                ...this.questions[questionIndex],
                ...formData,
                updated_at: new Date().toISOString()
            };
            
            let savedToDb = false;

            if (window.PG_API && !this.currentEditId.startsWith('local-')) {
                try {
                    const { error } = await window.PG_API
                        .from('questions')
                        .update(formData)
                        .eq('id', this.currentEditId);
                    
                    if (error) throw error;
                    savedToDb = true;
                } catch (dbError) {
                    this.showError('Veritabanı güncelleme hatası: ' + dbError.message);
                    return;
                }
            }

            this.questions[questionIndex] = updatedQuestion;
            this.questions.sort((a, b) => a.question_number - b.question_number);
            
            this.filterQuestions();
            this.updateStatistics();
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('editQuestionModal'));
            if (modal) modal.hide();
            
            this.showSuccess(savedToDb ? 'Soru başarıyla güncellendi.' : 'Soru yerel olarak güncellendi.');
        } catch (error) {
            this.showError('Soru güncellenirken hata oluştu: ' + error.message);
        }
    }

    async deleteQuestion() {
        try {
            const questionIndex = this.questions.findIndex(q => q.id === this.currentDeleteId);
            if (questionIndex === -1) {
                this.showError('Soru bulunamadı.');
                return;
            }

            if (window.PG_API && !this.currentDeleteId.startsWith('local-')) {
                try {
                    const { error } = await window.PG_API
                        .from('questions')
                        .delete()
                        .eq('id', this.currentDeleteId);
                    
                    if (error) throw error;
                } catch (dbError) {
                    this.showError('Veritabanından silinirken hata: ' + dbError.message);
                    return;
                }
            }

            this.questions.splice(questionIndex, 1);
            this.filterQuestions();
            this.updateStatistics();
            
            bootstrap.Modal.getInstance(document.getElementById('deleteQuestionModal')).hide();
            
            this.showSuccess('Soru başarıyla silindi.');
        } catch (error) {
            this.showError('Soru silinirken hata oluştu: ' + error.message);
        }
    }

    viewQuestion(questionId) {
        const q = this.questions.find(q => q.id === questionId);
        if (!q) return;

        const modalHtml = `
            <div class="modal fade" id="viewQuestionModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Soru Detayı - #${q.question_number}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <p><strong>Soru Numarası:</strong> ${q.question_number}</p>
                                    <p><strong>Kategori:</strong> ${this.getCategoryName(q.category)}</p>
                                </div>
                                <div class="col-md-6">
                                    <p><strong>ID:</strong> ${q.id}</p>
                                    <p><strong>Güncelleme:</strong> ${new Date(q.updated_at).toLocaleString('tr-TR')}</p>
                                </div>
                            </div>
                            <hr>
                            <div>
                                <strong>Soru Metni:</strong>
                                <p class="mt-2">${q.question_text}</p>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Kapat</button>
                            <button type="button" class="btn btn-primary" onclick="questionManager.editQuestion('${questionId}')">
                                <i class="fas fa-edit"></i> Düzenle
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const existingModal = document.getElementById('viewQuestionModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const modal = new bootstrap.Modal(document.getElementById('viewQuestionModal'));
        modal.show();

        document.getElementById('viewQuestionModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }

    editQuestion(questionId) {
        const q = this.questions.find(q => q.id === questionId);
        if (!q) return;

        this.currentEditId = questionId;

        document.getElementById('editQuestionId').value = q.id;
        document.getElementById('editQuestionNumber').value = q.question_number;
        document.getElementById('editQuestionText').value = q.question_text;
        document.getElementById('editQuestionCategory').value = q.category || (this.categories.length > 0 ? this.categories[0].name : '');

        const modal = new bootstrap.Modal(document.getElementById('editQuestionModal'));
        modal.show();
    }

    confirmDelete(questionId) {
        const q = this.questions.find(q => q.id === questionId);
        if (!q) return;

        this.currentDeleteId = questionId;
        document.getElementById('deleteQuestionNumber').textContent = q.question_number;

        const modal = new bootstrap.Modal(document.getElementById('deleteQuestionModal'));
        modal.show();
    }

    getFormData(formId) {
        const isEdit = formId === 'editQuestionForm';
        return {
            question_number: parseInt(document.getElementById(isEdit ? 'editQuestionNumber' : 'questionNumber').value),
            question_text: document.getElementById(isEdit ? 'editQuestionText' : 'questionText').value,
            category: document.getElementById(isEdit ? 'editQuestionCategory' : 'addQuestionCategory').value
        };
    }

    validateQuestionData(data) {
        if (!data.question_number || data.question_number < 1 || data.question_number > 567) {
            this.showError('Geçerli bir soru numarası giriniz (1-567).');
            return false;
        }

        if (!data.question_text || data.question_text.trim().length < 5) {
            this.showError('Soru metni en az 5 karakter olmalıdır.');
            return false;
        }

        return true;
    }

    getCategoryName(category) {
        if (!category) return 'Belirtilmemiş';
        const found = this.categories.find(c => c.name === category);
        return found ? found.name : category;
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showLoading(show) {
        document.getElementById('loadingSpinner').style.display = show ? 'block' : 'none';
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        this.showToast(message, 'danger');
    }

    showToast(message, type = 'info') {
        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
            document.body.appendChild(toastContainer);
        }

        const toastId = 'toast-' + Date.now();
        const toastHtml = `
            <div id="${toastId}" class="toast align-items-center text-white bg-${type} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">${message}</div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;

        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement);
        toast.show();

        toastElement.addEventListener('hidden.bs.toast', function() {
            this.remove();
        });
    }
}

if (typeof window !== 'undefined') {
    window.QuestionsManager = QuestionsManager;
}
