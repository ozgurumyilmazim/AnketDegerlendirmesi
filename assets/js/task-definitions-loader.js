// Task Definitions Dynamic Loader
// Check if already declared to prevent duplicate declarations
if (typeof TaskDefinitionsLoader === 'undefined') {
    class TaskDefinitionsLoader {
    constructor() {
        this.tasks = [];
        this.loadedFromDatabase = false;
    }

    async loadTaskDefinitions() {
        try {
            // Wait for Supabase client to be available
            if (!window.supabaseClient) {
                throw new Error('Supabase client not available');
            }

            const { data, error } = await window.supabaseClient.supabaseClient
                .from('task_definitions')
                .select('*')
                .eq('is_active', true)
                .order('task_number', { ascending: true });
            
            if (error) {
                console.error('Database error loading task definitions:', error);
                throw error;
            }

            if (!data || data.length === 0) {
                console.warn('No active task definitions found in database');
                this.tasks = [];
            } else {
                this.tasks = data;
                console.log('Task definitions loaded from database:', data.length);
            }

            this.loadedFromDatabase = true;
            return this.tasks;
        } catch (error) {
            console.error('Error loading task definitions:', error);
            this.tasks = [];
            this.loadedFromDatabase = false;
            throw error;
        }
    }



    async renderTaskDefinitionsTable() {
        try {
            // Hide loading spinner
            const loadingElement = document.getElementById('task-definitions-loading');
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }

            const tasks = await this.loadTaskDefinitions();
            const tableContainer = document.getElementById('task-definition-evaluation');
            
            if (!tableContainer) {
                console.error('Task definition container not found');
                return;
            }

            // Find the card body where we should put the table
            const cardBody = tableContainer.querySelector('.card-body');
            if (!cardBody) {
                console.error('Task definition card body not found');
                return;
            }

            if (tasks.length === 0) {
                cardBody.innerHTML = '<div class="alert alert-warning">Aktif görev tanımı bulunamadı.</div>';
                return;
            }

            // Create the complete table structure
            this.createTaskDefinitionTable(cardBody);
            const tableBody = cardBody.querySelector('tbody');

            if (!tableBody) {
                console.error('Could not create or find task definition table body');
                return;
            }

            // Generate table rows
            tasks.forEach(task => {
                const row = this.createTaskDefinitionRow(task);
                tableBody.appendChild(row);
            });

            // Initialize task button event listeners
            this.initializeTaskButtons(tasks);

            // Load saved task states from localStorage
            this.loadSavedStates();

        } catch (error) {
            console.error('Error rendering task definitions table:', error);
            const tableContainer = document.getElementById('task-definition-evaluation');
            if (tableContainer) {
                const cardBody = tableContainer.querySelector('.card-body');
                if (cardBody) {
                    cardBody.innerHTML = '<div class="alert alert-danger">Görev tanımları yüklenirken hata oluştu. Sayfayı yenileyin.</div>';
                }
            }
        }
    }

    createTaskDefinitionRow(task) {
        const row = document.createElement('tr');
        row.className = 'task-row'; // Initial class, will be updated based on saved state
        row.setAttribute('data-task-number', task.task_number);
        row.innerHTML = `
            <td>${task.task_number}</td>
            <td>${task.task_description}</td>
            <td class="text-center">
                <div class="btn-group" role="group">
                    <button type="button" id="task_${task.task_number}_check" 
                            class="btn btn-sm btn-outline-success task-btn-check" 
                            data-task="${task.task_number}" title="Uygun">
                        <i class="fas fa-check"></i>
                    </button>
                    <button type="button" id="task_${task.task_number}_cross" 
                            class="btn btn-sm btn-outline-danger task-btn-cross" 
                            data-task="${task.task_number}" title="Uygun Değil">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <span id="result_${task.task_number}" class="task-result d-none" data-value=""></span>
            </td>
        `;
        return row;
    }

    initializeTaskButtons(tasks) {
        // Use event delegation for better handling of dynamically created elements
        const tableContainer = document.getElementById('task-definition-evaluation');
        if (!tableContainer) {
            console.error('task-definition-evaluation container not found');
            return;
        }

        // Remove any existing event listeners to prevent duplicates
        const existingHandler = tableContainer.getAttribute('data-event-initialized');
        if (existingHandler) {
            console.log('Event delegation already initialized, skipping...');
            return;
        }

        // Mark as initialized
        tableContainer.setAttribute('data-event-initialized', 'true');

        // Use event delegation on the table container
        tableContainer.addEventListener('click', (event) => {
            console.log('Click event detected on container');
            
            // Find the button that was clicked
            const target = event.target.closest('button');
            if (!target) {
                console.log('No button found in click target');
                return;
            }

            const taskNumber = target.getAttribute('data-task');
            if (!taskNumber) {
                console.log('No data-task attribute found on button');
                return;
            }

            console.log('Button clicked - TaskNumber:', taskNumber, 'Button classes:', target.className);

            if (target.classList.contains('task-btn-check')) {
                console.log('Check button clicked for task:', taskNumber);
                event.preventDefault();
                event.stopPropagation();
                this.handleTaskButtonClick(parseInt(taskNumber), true);
            } else if (target.classList.contains('task-btn-cross')) {
                console.log('Cross button clicked for task:', taskNumber);
                event.preventDefault();
                event.stopPropagation();
                this.handleTaskButtonClick(parseInt(taskNumber), false);
            } else {
                console.log('Button clicked but no matching class found:', target.className);
            }
        });

        console.log('Task button event delegation initialized for', tasks.length, 'tasks');
    }

    handleTaskButtonClick(taskNumber, isCheck) {
        console.log('handleTaskButtonClick called:', taskNumber, isCheck);
        
        const checkBtn = document.getElementById(`task_${taskNumber}_check`);
        const crossBtn = document.getElementById(`task_${taskNumber}_cross`);
        const resultSpan = document.getElementById(`result_${taskNumber}`);
        const taskRow = document.querySelector(`tr[data-task-number="${taskNumber}"]`);

        if (!checkBtn || !crossBtn || !resultSpan) {
            console.error('Button elements not found for task:', taskNumber);
            return;
        }

        console.log('Button elements found, updating states...');

        // Check if the clicked button is already active (for deselection)
        const isCheckActive = checkBtn.classList.contains('btn-success');
        const isCrossActive = crossBtn.classList.contains('btn-danger');
        
        // Reset both buttons first
        checkBtn.classList.remove('btn-success');
        checkBtn.classList.add('btn-outline-success');
        crossBtn.classList.remove('btn-danger');
        crossBtn.classList.add('btn-outline-danger');
        
        // Initialize final state
        let finalState = null;
        
        if (isCheck) {
            // If check button was already active, deselect it
            if (isCheckActive) {
                console.log('Deselecting check button for task:', taskNumber);
                resultSpan.classList.add('d-none');
                resultSpan.setAttribute('data-value', '');
                finalState = null;
            } else {
                // Activate check button
                checkBtn.classList.remove('btn-outline-success');
                checkBtn.classList.add('btn-success');
                resultSpan.textContent = '✓';
                resultSpan.style.color = '#28a745';
                resultSpan.classList.remove('d-none');
                resultSpan.setAttribute('data-value', 'true');
                finalState = true;
                console.log('Check button activated for task:', taskNumber);
            }
        } else {
            // If cross button was already active, deselect it
            if (isCrossActive) {
                console.log('Deselecting cross button for task:', taskNumber);
                resultSpan.classList.add('d-none');
                resultSpan.setAttribute('data-value', '');
                finalState = null;
            } else {
                // Activate cross button
                crossBtn.classList.remove('btn-outline-danger');
                crossBtn.classList.add('btn-danger');
                resultSpan.textContent = '✗';
                resultSpan.style.color = '#dc3545';
                resultSpan.classList.remove('d-none');
                resultSpan.setAttribute('data-value', 'false');
                finalState = false;
                console.log('Cross button activated for task:', taskNumber);
            }
        }

        // Mark row as selected/unselected for PDF filtering
        if (taskRow) {
            if (finalState === null) {
                taskRow.classList.add('task-unselected');
                taskRow.classList.remove('task-selected');
            } else {
                taskRow.classList.add('task-selected');
                taskRow.classList.remove('task-unselected');
            }
        }

        // Save state to localStorage
        this.saveTaskState(taskNumber, finalState);

        // Update task data state
        if (window.updateTaskResult) {
            window.updateTaskResult(taskNumber, finalState);
        }
        
        console.log('Task button click handled successfully, final state:', finalState);
    }

    getTaskEvaluationData() {
        const taskData = {};
        
        this.tasks.forEach(task => {
            const checkBtn = document.getElementById(`task_${task.task_number}_check`);
            const crossBtn = document.getElementById(`task_${task.task_number}_cross`);

            if (checkBtn && crossBtn) {
                if (checkBtn.classList.contains('btn-success')) {
                    taskData[`task_${task.task_number}`] = true;
                } else if (crossBtn.classList.contains('btn-danger')) {
                    taskData[`task_${task.task_number}`] = false;
                } else {
                    taskData[`task_${task.task_number}`] = null;
                }
            }
        });

        return taskData;
    }

    loadTaskEvaluationData(data) {
        if (!data) return;

        Object.keys(data).forEach(taskKey => {
            const taskNumber = taskKey.replace('task_', '');
            const checkBtn = document.getElementById(`task_${taskNumber}_check`);
            const crossBtn = document.getElementById(`task_${taskNumber}_cross`);
            const taskRow = document.querySelector(`tr[data-task-number="${taskNumber}"]`);
            const resultSpan = document.getElementById(`result_${taskNumber}`);
            const value = data[taskKey];

            if (checkBtn && crossBtn) {
                // Reset buttons
                checkBtn.classList.remove('btn-success');
                checkBtn.classList.add('btn-outline-success');
                crossBtn.classList.remove('btn-danger');
                crossBtn.classList.add('btn-outline-danger');

                if (value === true) {
                    checkBtn.classList.remove('btn-outline-success');
                    checkBtn.classList.add('btn-success');
                } else if (value === false) {
                    crossBtn.classList.remove('btn-outline-danger');
                    crossBtn.classList.add('btn-danger');
                }

                // Update result display
                this.updateTaskResult(taskNumber, value);
            }

            // Set result span data-value attribute
            if (resultSpan) {
                if (value === true) {
                    resultSpan.setAttribute('data-value', 'true');
                    resultSpan.textContent = '✓';
                    resultSpan.style.color = '#28a745';
                    resultSpan.classList.remove('d-none');
                } else if (value === false) {
                    resultSpan.setAttribute('data-value', 'false');
                    resultSpan.textContent = '✗';
                    resultSpan.style.color = '#dc3545';
                    resultSpan.classList.remove('d-none');
                } else {
                    resultSpan.setAttribute('data-value', '');
                    resultSpan.textContent = '';
                    resultSpan.classList.add('d-none');
                }
            }

            // Set row classes based on task state
            if (taskRow) {
                if (value === true || value === false) {
                    // Task is selected (either check or cross)
                    taskRow.classList.remove('task-unselected');
                    taskRow.classList.remove('no-print');
                    taskRow.classList.add('task-selected');
                    console.log(`Task ${taskNumber} marked as selected during loadTaskEvaluationData`);
                } else {
                    // Task is unselected (null)
                    taskRow.classList.add('task-unselected');
                    taskRow.classList.add('no-print');
                    taskRow.classList.remove('task-selected');
                    console.log(`Task ${taskNumber} marked as unselected during loadTaskEvaluationData`);
                }
            }
        });
    }

    updateTaskResult(taskNumber, value) {
        const resultSpan = document.getElementById(`result_${taskNumber}`);
        if (!resultSpan) return;

        if (value === true) {
            resultSpan.textContent = '✓';
            resultSpan.style.color = '#28a745';
            resultSpan.classList.remove('d-none');
        } else if (value === false) {
            resultSpan.textContent = '✗';
            resultSpan.style.color = '#dc3545';
            resultSpan.classList.remove('d-none');
        } else {
            resultSpan.classList.add('d-none');
        }
    }

    // Method to get all task definitions for admin or other uses
    getAllTasks() {
        return this.tasks;
    }

    // Method to check if data was loaded from database
    isLoadedFromDatabase() {
        return this.loadedFromDatabase;
    }

    createTaskDefinitionTable(container) {
        const tableHtml = `
            <div class="table-responsive">
                <table class="table table-bordered table-sm">
                    <thead class="table-light">
                        <tr>
                            <th style="width: 5%;">No</th>
                            <th style="width: 85%;">Görev Tanımı</th>
                            <th style="width: 10%;">Değerlendirme</th>
                        </tr>
                    </thead>
                    <tbody>
                    </tbody>
                </table>
            </div>
        `;
        container.innerHTML = tableHtml;
    }

    // Save task state to localStorage
    saveTaskState(taskNumber, state) {
        try {
            const taskStates = this.getTaskStates();
            if (state === null) {
                delete taskStates[taskNumber];
            } else {
                taskStates[taskNumber] = state;
            }
            localStorage.setItem('taskDefinitionStates', JSON.stringify(taskStates));
            console.log('Task state saved:', taskNumber, state);
        } catch (error) {
            console.error('Error saving task state:', error);
        }
    }

    // Get all task states from localStorage
    getTaskStates() {
        try {
            const states = localStorage.getItem('taskDefinitionStates');
            return states ? JSON.parse(states) : {};
        } catch (error) {
            console.error('Error loading task states:', error);
            return {};
        }
    }

    // Load saved states and apply them
    loadSavedStates() {
        const savedStates = this.getTaskStates();
        console.log('Loading saved task states:', savedStates);
        
        // First, ensure all tasks start as unselected
        this.tasks.forEach(task => {
            const taskRow = document.querySelector(`tr[data-task-number="${task.task_number}"]`);
            if (taskRow) {
                taskRow.classList.add('task-unselected');
                taskRow.classList.remove('task-selected');
            }
        });
        
        // Then apply saved states
        Object.keys(savedStates).forEach(taskNumber => {
            const state = savedStates[taskNumber];
            console.log(`Applying state for task ${taskNumber}:`, state);
            this.applyTaskState(parseInt(taskNumber), state);
        });
        
        console.log('Finished loading saved states');
    }

    // Apply a specific state to a task
    applyTaskState(taskNumber, state) {
        console.log(`Applying state to task ${taskNumber}:`, state);
        
        const checkBtn = document.getElementById(`task_${taskNumber}_check`);
        const crossBtn = document.getElementById(`task_${taskNumber}_cross`);
        const resultSpan = document.getElementById(`result_${taskNumber}`);
        const taskRow = document.querySelector(`tr[data-task-number="${taskNumber}"]`);

        if (!checkBtn || !crossBtn || !resultSpan) {
            console.error(`Elements not found for task ${taskNumber}`);
            return;
        }

        // Reset buttons and result span
        checkBtn.classList.remove('btn-success');
        checkBtn.classList.add('btn-outline-success');
        crossBtn.classList.remove('btn-danger');
        crossBtn.classList.add('btn-outline-danger');
        resultSpan.classList.add('d-none');
        resultSpan.setAttribute('data-value', '');
        resultSpan.textContent = '';

        if (state === true) {
            // Apply check state
            checkBtn.classList.remove('btn-outline-success');
            checkBtn.classList.add('btn-success');
            resultSpan.textContent = '✓';
            resultSpan.style.color = '#28a745';
            resultSpan.classList.remove('d-none');
            resultSpan.setAttribute('data-value', 'true');
            if (taskRow) {
                taskRow.classList.add('task-selected');
                taskRow.classList.remove('task-unselected');
            }
            console.log(`Applied check state to task ${taskNumber}`);
        } else if (state === false) {
            // Apply cross state
            crossBtn.classList.remove('btn-outline-danger');
            crossBtn.classList.add('btn-danger');
            resultSpan.textContent = '✗';
            resultSpan.style.color = '#dc3545';
            resultSpan.classList.remove('d-none');
            resultSpan.setAttribute('data-value', 'false');
            if (taskRow) {
                taskRow.classList.add('task-selected');
                taskRow.classList.remove('task-unselected');
            }
            console.log(`Applied cross state to task ${taskNumber}`);
        } else {
            // Unselected state (null or undefined)
            if (taskRow) {
                taskRow.classList.add('task-unselected');
                taskRow.classList.remove('task-selected');
            }
            console.log(`Applied unselected state to task ${taskNumber}`);
        }
    }
}

// Create global instance only if not already exists
if (!window.taskDefinitionsLoader) {
    window.taskDefinitionsLoader = new TaskDefinitionsLoader();
}

} // End of TaskDefinitionsLoader class check

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the report page
    if (document.getElementById('task-definition-evaluation')) {
        // Wait for Supabase to be initialized
        const initTaskDefinitions = async () => {
            try {
                // Wait for supabase client to be ready
                let attempts = 0;
                while (!window.supabaseClient && attempts < 50) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                }
                
                if (!window.supabaseClient) {
                    throw new Error('Supabase client not available after waiting');
                }
                
                await window.taskDefinitionsLoader.renderTaskDefinitionsTable();
            } catch (error) {
                console.error('Failed to initialize task definitions:', error);
                const container = document.getElementById('task-definition-evaluation');
                if (container) {
                    container.innerHTML = '<div class="alert alert-danger">Görev tanımları yüklenirken hata oluştu. Sayfayı yenileyin.</div>';
                }
            }
        };
        
        initTaskDefinitions();
    }
});