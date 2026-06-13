// Task Definitions Management Script
class TaskDefinitionsManager {
    constructor() {
        console.log('TaskDefinitionsManager constructor called');
        this.tasks = [];
        this.filteredTasks = [];
        this.currentEditId = null;
        this.currentDeleteId = null;
        
        this.init();
    }

    async init() {
        console.log('TaskDefinitionsManager init called');
        await this.loadTasks();
        this.bindEvents();
        this.updateStatistics();
        console.log('TaskDefinitionsManager initialization complete');
    }

    async loadTasks() {
        try {
            this.showLoading(true);
            
            if (window.supabase) {
                try {
                    const { data, error } = await window.supabase
                        .from('task_definitions')
                        .select('*')
                        .order('task_number', { ascending: true });
                    
                    if (error) {
                        throw error;
                    }
                    
                    if (data && data.length > 0) {
                        this.tasks = data;
                        console.log('Tasks loaded from database:', this.tasks.length, 'tasks');
                    } else {
                        this.tasks = [];
                        console.log('No tasks found in database');
                    }
                } catch (dbError) {
                    console.error('Error loading from database:', dbError);
                    this.showError('Veritabanından görevler yüklenirken hata oluştu: ' + dbError.message);
                    this.tasks = [];
                }
            } else {
                console.error('Database client not available');
                this.showError('Veritabanı bağlantısı mevcut değil.');
                this.tasks = [];
            }
            
            this.filteredTasks = [...this.tasks];
            this.renderTasks();
            this.updateStatistics();
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.showError('Görevler yüklenirken hata oluştu: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }



    bindEvents() {
        console.log('Binding events...');
        
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterTasks();
            });
        }

        // Clear filters
        const clearFilters = document.getElementById('clearFilters');
        if (clearFilters) {
            clearFilters.addEventListener('click', () => {
                document.getElementById('searchInput').value = '';
                document.getElementById('statusFilter').value = '';
                this.filterTasks();
            });
        }

        // Add task
        const saveTaskBtn = document.getElementById('saveTaskBtn');
        if (saveTaskBtn) {
            console.log('Binding saveTaskBtn');
            saveTaskBtn.addEventListener('click', () => {
                console.log('Save task button clicked');
                this.saveTask();
            });
        } else {
            console.error('saveTaskBtn not found');
        }

        // Update task
        const updateTaskBtn = document.getElementById('updateTaskBtn');
        if (updateTaskBtn) {
            console.log('Binding updateTaskBtn');
            updateTaskBtn.addEventListener('click', () => {
                console.log('Update task button clicked');
                this.updateTask();
            });
        } else {
            console.error('updateTaskBtn not found');
        }

        // Delete task
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => {
                this.deleteTask();
            });
        }
        
        console.log('Events bound successfully');
    }

    filterTasks() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter').value;
        // Removed category filter

        this.filteredTasks = this.tasks.filter(task => {
            const matchesSearch = task.task_description.toLowerCase().includes(searchTerm) ||
                                task.task_number.toString().includes(searchTerm);
            
            const matchesStatus = !statusFilter || 
                                (statusFilter === 'active' && task.is_active) ||
                                (statusFilter === 'inactive' && !task.is_active);
            
            // Removed category matching since no category filter

            return matchesSearch && matchesStatus;
        });

        this.renderTasks();
    }

    renderTasks() {
        const tbody = document.getElementById('tasksTableBody');
        
        if (this.filteredTasks.length === 0) {
            document.getElementById('noResults').style.display = 'block';
            tbody.innerHTML = '';
            return;
        }

        document.getElementById('noResults').style.display = 'none';

        tbody.innerHTML = this.filteredTasks.map(task => `
            <tr>
                <td class="fw-bold">${task.task_number}</td>
                <td>
                    <div class="task-description" title="${this.escapeHtml(task.task_description)}">
                        ${this.truncateText(task.task_description, 120)}
                    </div>
                </td>
                <td>
                    <div class="d-flex justify-content-end">
                        <div class="btn-group btn-group-sm" role="group">
                            <button type="button" class="btn btn-outline-info btn-sm" 
                                    onclick="taskManager.viewTask('${task.id}')" title="Görüntüle">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button type="button" class="btn btn-outline-primary btn-sm" 
                                    onclick="taskManager.editTask('${task.id}')" title="Düzenle">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button type="button" class="btn btn-outline-danger btn-sm" 
                                    onclick="taskManager.confirmDelete('${task.id}')" title="Sil">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    updateStatistics() {
        const total = this.filteredTasks.length; // Show filtered count instead of all tasks
        document.getElementById('totalTasks').textContent = total;
    }

    async saveTask() {
        try {
            console.log('saveTask called');
            console.log('window.supabase:', window.supabase);
            
            const formData = this.getFormData('addTaskForm');
            console.log('Form data:', formData);
            
            if (!this.validateTaskData(formData)) {
                return;
            }

            // Check if task number already exists
            if (this.tasks.find(t => t.task_number === formData.task_number)) {
                this.showError('Bu görev numarası zaten kullanılıyor.');
                return;
            }

            let newTask = {
                ...formData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            let savedToDb = false;

            if (window.supabase) {
                try {
                    console.log('Saving to database...');
                    
                    const { data, error } = await window.supabase
                        .from('task_definitions')
                        .insert([newTask]);
                    
                    if (error) {
                        console.error('Database save error:', error);
                        throw error;
                    }
                    
                    if (data && data.length > 0) {
                        newTask = data[0]; // Use the complete record returned with UUID
                        console.log('Successfully saved to database with ID:', newTask.id);
                        savedToDb = true;
                    }
                } catch (dbError) {
                    console.error('Database error details:', dbError);
                    this.showError(`Veritabanına kaydetme hatası: ${dbError.message || 'Bilinmeyen hata'}`);
                    return;
                }
            } else {
                newTask.id = 'local-' + Date.now();
                console.warn('Database client not available, saving locally only');
                this.showError('Veritabanı bağlantısı yok. Görev sadece yerel olarak kaydedildi.');
            }

            this.tasks.push(newTask);
            this.tasks.sort((a, b) => a.task_number - b.task_number);
            
            this.filterTasks();
            this.updateStatistics();
            
            // Close modal and reset form
            const modal = bootstrap.Modal.getInstance(document.getElementById('addTaskModal'));
            if (modal) {
                modal.hide();
            }
            document.getElementById('addTaskForm').reset();
            
            if (savedToDb) {
                this.showSuccess('Görev başarıyla veritabanına kaydedildi.');
            } else {
                this.showSuccess('Görev yerel olarak kaydedildi.');
            }
        } catch (error) {
            console.error('Error saving task:', error);
            this.showError('Görev kaydedilirken hata oluştu: ' + error.message);
        }
    }

    async updateTask() {
        try {
            console.log('updateTask called');
            const formData = this.getFormData('editTaskForm');
            console.log('Edit form data:', formData);
            
            if (!this.validateTaskData(formData)) {
                return;
            }

            const taskIndex = this.tasks.findIndex(t => t.id === this.currentEditId);
            if (taskIndex === -1) {
                this.showError('Görev bulunamadı.');
                return;
            }

            // Check if task number conflicts with another task
            const existingTask = this.tasks.find(t => t.task_number === formData.task_number && t.id !== this.currentEditId);
            if (existingTask) {
                this.showError('Bu görev numarası başka bir görev tarafından kullanılıyor.');
                return;
            }

            const updatedTask = {
                ...this.tasks[taskIndex],
                ...formData,
                updated_at: new Date().toISOString()
            };
            
            console.log('Updated task:', updatedTask);
            
            let savedToDb = false;

            if (window.supabase && !this.currentEditId.startsWith('static-') && !this.currentEditId.startsWith('local-')) {
                try {
                    const { error } = await window.supabase
                        .from('task_definitions')
                        .update(formData)
                        .eq('id', this.currentEditId);
                    
                    if (error) {
                        console.error('Database update error:', error);
                        this.showError(`Veritabanı güncelleme hatası: ${error.message}`);
                        return;
                    }
                    
                    savedToDb = true;
                    console.log('Successfully updated in database');
                } catch (dbError) {
                    console.error('Database update error:', dbError);
                    this.showError(`Veritabanı güncelleme hatası: ${dbError.message}`);
                    return;
                }
            }

            this.tasks[taskIndex] = updatedTask;
            this.tasks.sort((a, b) => a.task_number - b.task_number);
            
            this.filterTasks();
            this.updateStatistics();
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editTaskModal'));
            if (modal) {
                modal.hide();
            }
            
            if (savedToDb) {
                this.showSuccess('Görev başarıyla veritabanında güncellendi.');
            } else if (this.currentEditId.startsWith('static-')) {
                this.showSuccess('Statik görev yerel olarak güncellendi.');
            } else {
                this.showSuccess('Görev yerel olarak güncellendi.');
            }
        } catch (error) {
            console.error('Error updating task:', error);
            this.showError('Görev güncellenirken hata oluştu: ' + error.message);
        }
    }

    async deleteTask() {
        try {
            const taskIndex = this.tasks.findIndex(t => t.id === this.currentDeleteId);
            if (taskIndex === -1) {
                this.showError('Görev bulunamadı.');
                return;
            }

            if (window.supabase && !this.currentDeleteId.startsWith('static-')) {
                try {
                    const { error } = await window.supabase
                        .from('task_definitions')
                        .delete()
                        .eq('id', this.currentDeleteId);
                    
                    if (error) throw error;
                } catch (dbError) {
                    console.warn('Could not delete from database:', dbError);
                }
            }

            this.tasks.splice(taskIndex, 1);
            
            this.filterTasks();
            this.updateStatistics();
            
            // Close modal
            bootstrap.Modal.getInstance(document.getElementById('deleteTaskModal')).hide();
            
            this.showSuccess('Görev başarıyla silindi.');
        } catch (error) {
            console.error('Error deleting task:', error);
            this.showError('Görev silinirken hata oluştu: ' + error.message);
        }
    }

    async toggleTask(taskId) {
        try {
            const taskIndex = this.tasks.findIndex(t => t.id === taskId);
            if (taskIndex === -1) {
                this.showError('Görev bulunamadı.');
                return;
            }

            const task = this.tasks[taskIndex];
            const newStatus = !task.is_active;

            if (window.supabase && !taskId.startsWith('static-')) {
                try {
                    const { error } = await window.supabase
                        .from('task_definitions')
                        .update({ is_active: newStatus, updated_at: new Date().toISOString() })
                        .eq('id', taskId);
                    
                    if (error) throw error;
                } catch (dbError) {
                    console.warn('Could not update in database:', dbError);
                }
            }

            this.tasks[taskIndex].is_active = newStatus;
            this.tasks[taskIndex].updated_at = new Date().toISOString();
            
            this.filterTasks();
            this.updateStatistics();
            
            this.showSuccess(`Görev ${newStatus ? 'aktifleştirildi' : 'pasifleştirildi'}.`);
        } catch (error) {
            console.error('Error toggling task:', error);
            this.showError('Görev durumu değiştirilirken hata oluştu: ' + error.message);
        }
    }

    viewTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        // Create a modal to show full task details
        const modalHtml = `
            <div class="modal fade" id="viewTaskModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Görev Detayı - ${task.task_number}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <p><strong>Görev Numarası:</strong> ${task.task_number}</p>
                                    <p><strong>Durum:</strong> 
                                        <span class="badge ${task.is_active ? 'bg-success' : 'bg-secondary'}">
                                            ${task.is_active ? 'Aktif' : 'Pasif'}
                                        </span>
                                    </p>
                                </div>
                                <div class="col-md-6">
                                    <p><strong>Kategori:</strong> ${this.getCategoryName(task.category)}</p>
                                    <p><strong>Güncelleme:</strong> ${new Date(task.updated_at).toLocaleString('tr-TR')}</p>
                                </div>
                            </div>
                            <hr>
                            <div>
                                <strong>Görev Tanımı:</strong>
                                <p class="mt-2">${task.task_description}</p>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Kapat</button>
                            <button type="button" class="btn btn-primary" onclick="taskManager.editTask('${taskId}')">
                                <i class="fas fa-edit"></i> Düzenle
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove any existing view modal
        const existingModal = document.getElementById('viewTaskModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to document
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('viewTaskModal'));
        modal.show();

        // Remove modal from DOM when hidden
        document.getElementById('viewTaskModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }

    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        this.currentEditId = taskId;

        // Populate form - only show editable fields
        document.getElementById('editTaskId').value = task.id;
        document.getElementById('editTaskNumber').value = task.task_number;
        document.getElementById('editTaskDescription').value = task.task_description;
        // Category and Active status are hidden and automatically set

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editTaskModal'));
        modal.show();
    }

    confirmDelete(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        this.currentDeleteId = taskId;
        document.getElementById('deleteTaskNumber').textContent = task.task_number;

        const modal = new bootstrap.Modal(document.getElementById('deleteTaskModal'));
        modal.show();
    }

    getFormData(formId) {
        const isEditForm = formId === 'editTaskForm';
        return {
            task_number: parseInt(document.getElementById(isEditForm ? 'editTaskNumber' : 'taskNumber').value),
            task_description: document.getElementById(isEditForm ? 'editTaskDescription' : 'taskDescription').value,
            category: 'security', // Always set to security
            is_active: true // Always set to active
        };
    }

    validateTaskData(data) {
        if (!data.task_number || data.task_number < 1) {
            this.showError('Geçerli bir görev numarası giriniz.');
            return false;
        }

        if (!data.task_description || data.task_description.trim().length < 10) {
            this.showError('Görev tanımı en az 10 karakter olmalıdır.');
            return false;
        }

        return true;
    }

    getCategoryName(category) {
        const categories = {
            'security': 'Güvenlik',
            'maintenance': 'Bakım',
            'customer': 'Müşteri Hizmetleri'
        };
        return categories[category] || category;
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
        // Create toast if it doesn't exist
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

        // Remove toast after it's hidden
        toastElement.addEventListener('hidden.bs.toast', function() {
            this.remove();
        });
    }
}

// Initialize when DOM is loaded - removed automatic initialization
// since we now initialize manually from the HTML script loader
// document.addEventListener('DOMContentLoaded', function() {
//     window.taskManager = new TaskDefinitionsManager();
// });

// Make sure the class is available globally
if (typeof window !== 'undefined') {
    window.TaskDefinitionsManager = TaskDefinitionsManager;
}