/**
 * Weekly Execution Planner - Main Application Logic
 */

// Application state
let appState = {
    weekStart: null,
    tasks: [],
    lifeAreas: [],
    sprintBlocks: [],
    currentTaskId: null
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadFromLocalStorage();
    setCurrentWeek();
});

/**
 * Initialize the application
 */
function initializeApp() {
    console.log('Initializing Weekly Execution Planner...');
    
    // Set default week to current week
    const today = new Date();
    const weekStart = DateUtils.getWeekStart(today);
    document.getElementById('weekStartDate').value = DateUtils.formatDate(weekStart);
    updateWeekRange();
    
    // Initialize life areas
    initializeLifeAreas();
    
    // Add initial task
    addNewTask();
    
    // Update progress
    updateProgress();
    
    console.log('Application initialized successfully');
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Week date change
    document.getElementById('weekStartDate').addEventListener('change', updateWeekRange);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Auto-save on changes
    const debouncedSave = UIUtils.debounce(() => {
        saveToLocalStorage();
    }, 1000);
    
    document.addEventListener('input', debouncedSave);
    document.addEventListener('change', debouncedSave);
    
    // Prevent form submission on Enter
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
        }
    });
}

/**
 * Handle keyboard shortcuts
 */
function handleKeyboardShortcuts(e) {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 'n':
                e.preventDefault();
                addNewTask();
                break;
            case 's':
                e.preventDefault();
                saveToLocalStorage();
                break;
            case 'e':
                e.preventDefault();
                exportToJSON();
                break;
            case 'g':
                e.preventDefault();
                generateInsights();
                break;
            case 'p':
                e.preventDefault();
                printSummary();
                break;
            case '?':
                e.preventDefault();
                showShortcutsModal();
                break;
        }
    }
}

/**
 * Set current week
 */
function setCurrentWeek() {
    const today = new Date();
    const weekStart = DateUtils.getWeekStart(today);
    document.getElementById('weekStartDate').value = DateUtils.formatDate(weekStart);
    updateWeekRange();
    UIUtils.showNotification('Set to current week', 'success');
}

/**
 * Update week range display
 */
function updateWeekRange() {
    const weekStartInput = document.getElementById('weekStartDate');
    const weekDisplay = document.getElementById('weekDisplay');
    
    if (weekStartInput.value) {
        appState.weekStart = weekStartInput.value;
        const startDate = new Date(weekStartInput.value);
        weekDisplay.textContent = DateUtils.getWeekRange(startDate);
    } else {
        weekDisplay.textContent = 'Please select a week start date';
    }
    
    updateProgress();
}

/**
 * Initialize life areas checkboxes
 */
function initializeLifeAreas() {
    const container = document.getElementById('lifeAreasContainer');
    container.innerHTML = '';
    
    DEFAULT_LIFE_AREAS.forEach(area => {
        const label = document.createElement('label');
        label.className = 'checkbox-label';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = area;
        checkbox.addEventListener('change', updateLifeAreas);
        
        const span = document.createElement('span');
        span.textContent = area;
        
        label.appendChild(checkbox);
        label.appendChild(span);
        container.appendChild(label);
    });
}

/**
 * Update selected life areas
 */
function updateLifeAreas() {
    const checkboxes = document.querySelectorAll('#lifeAreasContainer input[type="checkbox"]');
    appState.lifeAreas = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
    
    updateProgress();
}

/**
 * Add new task
 */
function addNewTask() {
    const taskList = document.getElementById('taskList');
    const taskId = UIUtils.generateId();
    
    const taskItem = document.createElement('div');
    taskItem.className = 'task-item';
    taskItem.dataset.taskId = taskId;
    
    taskItem.innerHTML = `
        <div class="task-header">
            <input type="text" placeholder="Enter a task..." onchange="updateTask('${taskId}')" data-field="text">
            <button class="btn btn-secondary btn-small" onclick="toggleTaskEvaluation('${taskId}')">
                <i class="fas fa-cog"></i> Evaluate
            </button>
            <button class="btn btn-danger btn-small" onclick="removeTask('${taskId}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <div class="task-evaluation" id="evaluation-${taskId}">
            <div class="evaluation-field">
                <label>How important is this to your personal goals?</label>
                <select onchange="updateTask('${taskId}')" data-field="importance">
                    <option value="">Select importance</option>
                    <option value="critical">Critical - Core to my success</option>
                    <option value="important">Important - Supports my goals</option>
                    <option value="moderate">Moderate - Nice to have</option>
                    <option value="low">Low - Not essential</option>
                </select>
            </div>
            <div class="evaluation-field">
                <label>Is there a real or perceived deadline?</label>
                <select onchange="updateTask('${taskId}')" data-field="urgency">
                    <option value="">Select urgency</option>
                    <option value="immediate">Immediate - Due today/tomorrow</option>
                    <option value="this-week">This week - Due within 7 days</option>
                    <option value="flexible">Flexible - No strict deadline</option>
                    <option value="someday">Someday - Future consideration</option>
                </select>
            </div>
            <div class="evaluation-field">
                <label>If you don't do this, what happens?</label>
                <textarea rows="2" placeholder="Describe the consequences..." onchange="updateTask('${taskId}')" data-field="consequences"></textarea>
                <div class="consequence-display" id="consequence-${taskId}" style="display: none;"></div>
            </div>
            <div class="evaluation-field">
                <label>This task is related to (Project):</label>
                <input type="text" placeholder="e.g., AdsMobil, ISC2, Job Search" onchange="updateTask('${taskId}')" data-field="project">
            </div>
            <div class="evaluation-field">
                <label>Estimated time needed:</label>
                <select onchange="updateTask('${taskId}')" data-field="timeEstimate">
                    <option value="">Select time estimate</option>
                    <option value="15-30 minutes">15-30 minutes</option>
                    <option value="30-60 minutes">30-60 minutes</option>
                    <option value="1-2 hours">1-2 hours</option>
                    <option value="2-4 hours">2-4 hours</option>
                    <option value="4+ hours">4+ hours</option>
                    <option value="Multi-day">Multi-day project</option>
                </select>
            </div>
        </div>
    `;
    
    taskList.appendChild(taskItem);
    
    // Initialize task in state
    appState.tasks.push({
        id: taskId,
        text: '',
        importance: '',
        urgency: '',
        consequences: '',
        project: '',
        timeEstimate: '',
        category: '',
        priorityScore: 0
    });
    
    // Focus on the new task input
    const newInput = taskItem.querySelector('input[type="text"]');
    if (newInput) {
        newInput.focus();
    }
    
    updateProgress();
}

/**
 * Remove task
 */
function removeTask(taskId) {
    const taskItem = document.querySelector(`[data-task-id="${taskId}"]`);
    if (taskItem) {
        UIUtils.animate(taskItem, 'fadeOut', 300).then(() => {
            taskItem.remove();
        });
    }
    
    // Remove from state
    appState.tasks = appState.tasks.filter(task => task.id !== taskId);
    updateProgress();
    UIUtils.showNotification('Task removed', 'info');
}

/**
 * Toggle task evaluation section
 */
function toggleTaskEvaluation(taskId) {
    const evaluation = document.getElementById(`evaluation-${taskId}`);
    const isVisible = evaluation.classList.contains('active');
    
    if (isVisible) {
        evaluation.classList.remove('active');
    } else {
        evaluation.classList.add('active');
        // Auto-scroll to the evaluation section
        setTimeout(() => {
            evaluation.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }
}

/**
 * Update task data
 */
function updateTask(taskId) {
    const taskItem = document.querySelector(`[data-task-id="${taskId}"]`);
    const task = appState.tasks.find(t => t.id === taskId);
    
    if (!task || !taskItem) return;
    
    // Update task data from form elements
    const inputs = taskItem.querySelectorAll('[data-field]');
    inputs.forEach(input => {
        const field = input.dataset.field;
        task[field] = input.value;
    });
    
    // Update consequence display
    if (task.consequences) {
        const consequenceDisplay = document.getElementById(`consequence-${taskId}`);
        if (consequenceDisplay) {
            consequenceDisplay.textContent = `⚠️ Consequence: ${task.consequences}`;
            consequenceDisplay.style.display = 'block';
        }
    }
    
    // Categorize task
    if (task.importance && task.urgency) {
        task.category = TaskUtils.categorizeTask(task.importance, task.urgency);
        task.priorityScore = TaskUtils.getPriorityScore(task.importance, task.urgency);
    }
    
    updateProgress();
}

/**
 * Add sprint block
 */
function addSprintBlock() {
    const container = document.getElementById('sprintBlocksList');
    const blockId = UIUtils.generateId();
    
    const sprintBlock = document.createElement('div');
    sprintBlock.className = 'sprint-block';
    sprintBlock.dataset.blockId = blockId;
    
    sprintBlock.innerHTML = `
        <input type="text" placeholder="What will you work on?" onchange="updateSprintBlock('${blockId}')" data-field="activity">
        <select onchange="updateSprintBlock('${blockId}')" data-field="timeSlot">
            <option value="">Select time slot</option>
            ${SPRINT_TIME_OPTIONS.map(time => `<option value="${time}">${time}</option>`).join('')}
        </select>
        <div class="day-selector">
            ${DAYS_OF_WEEK.map(day => `
                <div class="day-option" onclick="toggleDay('${blockId}', '${day}')" data-day="${day}">
                    ${day.substring(0, 3)}
                </div>
            `).join('')}
        </div>
        <button class="btn btn-danger btn-small" onclick="removeSprintBlock('${blockId}')">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    container.appendChild(sprintBlock);
    
    // Initialize in state
    appState.sprintBlocks.push({
        id: blockId,
        activity: '',
        timeSlot: '',
        days: []
    });
    
    updateProgress();
}

/**
 * Remove sprint block
 */
function removeSprintBlock(blockId) {
    const block = document.querySelector(`[data-block-id="${blockId}"]`);
    if (block) {
        block.remove();
    }
    
    appState.sprintBlocks = appState.sprintBlocks.filter(block => block.id !== blockId);
    updateProgress();
    UIUtils.showNotification('Sprint block removed', 'info');
}

/**
 * Update sprint block
 */
function updateSprintBlock(blockId) {
    const blockElement = document.querySelector(`[data-block-id="${blockId}"]`);
    const block = appState.sprintBlocks.find(b => b.id === blockId);
    
    if (!block || !blockElement) return;
    
    // Update block data from form elements
    const inputs = blockElement.querySelectorAll('[data-field]');
    inputs.forEach(input => {
        const field = input.dataset.field;
        block[field] = input.value;
    });
    
    updateProgress();
}

/**
 * Toggle day selection for sprint block
 */
function toggleDay(blockId, day) {
    const block = appState.sprintBlocks.find(b => b.id === blockId);
    const dayElement = document.querySelector(`[data-block-id="${blockId}"] [data-day="${day}"]`);
    
    if (!block || !dayElement) return;
    
    if (block.days.includes(day)) {
        block.days = block.days.filter(d => d !== day);
        dayElement.classList.remove('selected');
    } else {
        block.days.push(day);
        dayElement.classList.add('selected');
    }
    
    updateProgress();
}

/**
 * Generate insights and categorize tasks
 */
function generateInsights() {
    const validTasks = appState.tasks.filter(task => 
        task.text && task.importance && task.urgency
    );
    
    if (validTasks.length === 0) {
        UIUtils.showNotification('Please add and evaluate some tasks first', 'warning');
        return;
    }
    
    // Show insights container
    document.getElementById('insightsContainer').style.display = 'block';
    
    // Generate Top 3 Goals
    generateTop3Goals(validTasks);
    
    // Categorize tasks
    categorizeTasks(validTasks);
    
    // Generate project and focus area tags
    generateProjectTags(validTasks);
    
    // Generate smart recommendations
    generateSmartRecommendations(validTasks);
    
    UIUtils.showNotification('Insights generated successfully!', 'success');
}

/**
 * Generate top 3 goals
 */
function generateTop3Goals(tasks) {
    const goalsList = document.getElementById('goalsList');
    
    // Sort by priority score and take top 3
    const topTasks = [...tasks]
        .sort((a, b) => b.priorityScore - a.priorityScore)
        .slice(0, 3);
    
    if (topTasks.length === 0) {
        goalsList.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>No prioritized tasks available</p></div>';
        return;
    }
    
    goalsList.innerHTML = topTasks.map((task, index) => `
        <div class="goal-item">
            <h4><i class="fas fa-medal"></i> Goal ${index + 1}: ${UIUtils.sanitizeHTML(task.text)}</h4>
            <p><strong>Project:</strong> ${UIUtils.sanitizeHTML(task.project || 'Not specified')}</p>
            <p><strong>Time Estimate:</strong> ${UIUtils.sanitizeHTML(task.timeEstimate || 'Not specified')}</p>
            <span class="tag ${TaskUtils.getPriorityClass(task.priorityScore)}">
                Priority Score: ${task.priorityScore}
            </span>
        </div>
    `).join('');
}

/**
 * Categorize tasks using Eisenhower Matrix
 */
function categorizeTasks(tasks) {
    const categories = {
        'do-now': [],
        'schedule-later': [],
        'optional': [],
        'ignore': []
    };
    
    // Group tasks by category
    tasks.forEach(task => {
        if (task.category) {
            categories[task.category].push(task);
        }
    });
    
    // Display categorized tasks
    Object.entries(categories).forEach(([category, categoryTasks]) => {
        const containerId = category === 'do-now' ? 'doNowTasks' :
                           category === 'schedule-later' ? 'scheduleLaterTasks' :
                           category === 'optional' ? 'optionalTasks' : 'ignoreTasks';
        
        const container = document.getElementById(containerId);
        
        if (categoryTasks.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>No tasks in this category</p></div>';
        } else {
            container.innerHTML = categoryTasks.map(task => `
                <div class="categorized-task-item">
                    <h5>${UIUtils.sanitizeHTML(task.text)}</h5>
                    <p><strong>Project:</strong> ${UIUtils.sanitizeHTML(task.project || 'Not specified')}</p>
                    <p><strong>Time:</strong> ${UIUtils.sanitizeHTML(task.timeEstimate || 'Not specified')}</p>
                    ${task.consequences ? `<p class="consequence-display">⚠️ ${UIUtils.sanitizeHTML(task.consequences)}</p>` : ''}
                    <span class="task-status ${TaskUtils.getStatusClass(category)}">
                        ${category.replace('-', ' ').toUpperCase()}
                    </span>
                </div>
            `).join('');
        }
    });
    
    // Show categorized tasks section
    document.getElementById('categorizedTasks').style.display = 'block';
}

/**
 * Generate project and focus area tags
 */
function generateProjectTags(tasks) {
    const projectTags = document.getElementById('projectTags');
    const focusAreaTags = document.getElementById('focusAreaTags');
    
    // Extract unique projects
    const projects = [...new Set(
        tasks.map(task => task.project)
             .filter(project => project && project.trim())
             .flatMap(project => TaskUtils.extractProjects(project))
    )];
    
    // Display project tags
    if (projects.length > 0) {
        projectTags.innerHTML = `
            <h4><i class="fas fa-briefcase"></i> Projects This Week</h4>
            <div class="tags-container">
                ${projects.map(project => `<span class="tag">${UIUtils.sanitizeHTML(project)}</span>`).join('')}
            </div>
        `;
    } else {
        projectTags.innerHTML = '<p><i class="fas fa-info-circle"></i> No projects specified</p>';
    }
    
    // Display selected life areas
    if (appState.lifeAreas.length > 0) {
        focusAreaTags.innerHTML = `
            <h4><i class="fas fa-heart"></i> Life Areas Focus</h4>
            <div class="tags-container">
                ${appState.lifeAreas.map(area => `<span class="tag">${UIUtils.sanitizeHTML(area)}</span>`).join('')}
            </div>
        `;
    } else {
        focusAreaTags.innerHTML = '<p><i class="fas fa-info-circle"></i> No life areas selected</p>';
    }
}

/**
 * Generate weekly table
 */
function generateWeeklyTable() {
    const container = document.getElementById('weeklyTableContainer');
    const validTasks = appState.tasks.filter(task => task.text && task.importance && task.urgency);
    
    if (validTasks.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-table"></i><p>Please add and evaluate tasks to generate the weekly table</p></div>';
        return;
    }
    
    // Sort tasks by priority
    const sortedTasks = [...validTasks].sort((a, b) => b.priorityScore - a.priorityScore);
    
    const table = document.createElement('table');
    table.className = 'weekly-table';
    
    table.innerHTML = `
        <thead>
            <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Priority</th>
                <th>Category</th>
                <th>Time Estimate</th>
                <th>Consequences</th>
            </tr>
        </thead>
        <tbody>
            ${sortedTasks.map(task => `
                <tr>
                    <td><strong>${UIUtils.sanitizeHTML(task.text)}</strong></td>
                    <td>${UIUtils.sanitizeHTML(task.project || 'Not specified')}</td>
                    <td>
                        <span class="${TaskUtils.getPriorityClass(task.priorityScore)}">
                            ${task.priorityScore}
                        </span>
                    </td>
                    <td>
                        <span class="task-status ${TaskUtils.getStatusClass(task.category)}">
                            ${task.category.replace('-', ' ').toUpperCase()}
                        </span>
                    </td>
                    <td>${UIUtils.sanitizeHTML(task.timeEstimate || 'Not specified')}</td>
                    <td>${UIUtils.sanitizeHTML(task.consequences || 'None specified')}</td>
                </tr>
            `).join('')}
        </tbody>
    `;
    
    container.innerHTML = '';
    container.appendChild(table);
    
    UIUtils.showNotification('Weekly table generated!', 'success');
}

/**
 * Update progress bar
 */
function updateProgress() {
    const progressFill = document.getElementById('progressFill');
    
    let totalFields = 0;
    let completedFields = 0;
    
    // Count week identification
    if (appState.weekStart) completedFields++;
    totalFields++;
    
    // Count tasks and evaluations
    appState.tasks.forEach(task => {
        totalFields += 6; // text, importance, urgency, consequences, project, timeEstimate
        
        if (task.text) completedFields++;
        if (task.importance) completedFields++;
        if (task.urgency) completedFields++;
        if (task.consequences) completedFields++;
        if (task.project) completedFields++;
        if (task.timeEstimate) completedFields++;
    });
    
    // Count life areas (at least one selected)
    if (appState.lifeAreas.length > 0) completedFields++;
    totalFields++;
    
    // Count sprint blocks
    appState.sprintBlocks.forEach(block => {
        totalFields += 3; // activity, timeSlot, days
        
        if (block.activity) completedFields++;
        if (block.timeSlot) completedFields++;
        if (block.days.length > 0) completedFields++;
    });
    
    const percentage = totalFields > 0 ? (completedFields / totalFields) * 100 : 0;
    progressFill.style.width = `${percentage}%`;
}

/**
 * Export to JSON
 */
function exportToJSON() {
    const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        weekStart: appState.weekStart,
        weekRange: appState.weekStart ? DateUtils.getWeekRange(new Date(appState.weekStart)) : null,
        tasks: appState.tasks,
        lifeAreas: appState.lifeAreas,
        sprintBlocks: appState.sprintBlocks,
        summary: {
            totalTasks: appState.tasks.length,
            evaluatedTasks: appState.tasks.filter(t => t.importance && t.urgency).length,
            selectedLifeAreas: appState.lifeAreas.length,
            sprintBlocks: appState.sprintBlocks.length
        }
    };
    
    const filename = `weekly-planner-${appState.weekStart || 'draft'}.json`;
    ExportUtils.downloadJSON(exportData, filename);
    
    UIUtils.showNotification('Data exported successfully!', 'success');
}

/**
 * Import from JSON
 */
async function importFromJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        const data = await ExportUtils.readJSONFile(file);
        
        // Validate imported data
        const errors = ValidationUtils.validatePlannerData(data);
        if (errors.length > 0) {
            UIUtils.showNotification(`Import failed: ${errors.join(', ')}`, 'error');
            return;
        }
        
        // Load data into application
        if (data.weekStart) {
            document.getElementById('weekStartDate').value = data.weekStart;
            updateWeekRange();
        }
        
        if (data.tasks) {
            // Clear existing tasks
            document.getElementById('taskList').innerHTML = '';
            appState.tasks = [];
            
            // Import tasks
            data.tasks.forEach(taskData => {
                addNewTask();
                const newTask = appState.tasks[appState.tasks.length - 1];
                Object.assign(newTask, taskData);
                
                // Update UI elements
                const taskElement = document.querySelector(`[data-task-id="${newTask.id}"]`);
                if (taskElement) {
                    const inputs = taskElement.querySelectorAll('[data-field]');
                    inputs.forEach(input => {
                        const field = input.dataset.field;
                        if (newTask[field]) {
                            input.value = newTask[field];
                        }
                    });
                }
            });
        }
        
        if (data.lifeAreas) {
            // Update life area checkboxes
            const checkboxes = document.querySelectorAll('#lifeAreasContainer input[type="checkbox"]');
            checkboxes.forEach(cb => {
                cb.checked = data.lifeAreas.includes(cb.value);
            });
            updateLifeAreas();
        }
        
        if (data.sprintBlocks) {
            // Clear existing sprint blocks
            document.getElementById('sprintBlocksList').innerHTML = '';
            appState.sprintBlocks = [];
            
            // Import sprint blocks
            data.sprintBlocks.forEach(blockData => {
                addSprintBlock();
                const newBlock = appState.sprintBlocks[appState.sprintBlocks.length - 1];
                Object.assign(newBlock, blockData);
                
                // Update UI elements
                const blockElement = document.querySelector(`[data-block-id="${newBlock.id}"]`);
                if (blockElement) {
                    const inputs = blockElement.querySelectorAll('[data-field]');
                    inputs.forEach(input => {
                        const field = input.dataset.field;
                        if (newBlock[field]) {
                            input.value = newBlock[field];
                        }
                    });
                    
                    // Update selected days
                    newBlock.days.forEach(day => {
                        const dayElement = blockElement.querySelector(`[data-day="${day}"]`);
                        if (dayElement) {
                            dayElement.classList.add('selected');
                        }
                    });
                }
            });
        }
        
        updateProgress();
        UIUtils.showNotification(`Data imported successfully! Version: ${data.version}`, 'success');
        
    } catch (error) {
        console.error('Import error:', error);
        UIUtils.showNotification(`Import failed: ${error.message}`, 'error');
    }
    
    // Clear file input
    event.target.value = '';
}

/**
 * Save to local storage
 */
function saveToLocalStorage() {
    const saveData = {
        weekStart: appState.weekStart,
        tasks: appState.tasks,
        lifeAreas: appState.lifeAreas,
        sprintBlocks: appState.sprintBlocks,
        lastSaved: new Date().toISOString()
    };
    
    const success = StorageUtils.save('weeklyPlannerData', saveData);
    if (success) {
        UIUtils.showNotification('Data saved locally!', 'success');
    } else {
        UIUtils.showNotification('Failed to save data locally', 'error');
    }
}

/**
 * Load from local storage
 */
function loadFromLocalStorage() {
    const savedData = StorageUtils.load('weeklyPlannerData');
    if (!savedData) return;
    
    try {
        // Load week start
        if (savedData.weekStart) {
            document.getElementById('weekStartDate').value = savedData.weekStart;
            updateWeekRange();
        }
        
        // Load life areas
        if (savedData.lifeAreas) {
            const checkboxes = document.querySelectorAll('#lifeAreasContainer input[type="checkbox"]');
            checkboxes.forEach(cb => {
                cb.checked = savedData.lifeAreas.includes(cb.value);
            });
            updateLifeAreas();
        }
        
        console.log('Data loaded from local storage');
        
    } catch (error) {
        console.error('Failed to load saved data:', error);
        UIUtils.showNotification('Failed to load saved data', 'error');
    }
}

/**
 * Print summary
 */
function printSummary() {
    // Generate a comprehensive summary
    const printWindow = window.open('', '_blank');
    const weekRange = appState.weekStart ? DateUtils.getWeekRange(new Date(appState.weekStart)) : 'Not set';
    
    const validTasks = appState.tasks.filter(task => task.text && task.importance && task.urgency);
    const topTasks = [...validTasks].sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 3);
    
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Weekly Execution Planner - ${weekRange}</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }
                h1, h2, h3 { color: #333; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #667eea; padding-bottom: 20px; }
                .section { margin-bottom: 30px; }
                .task-item { margin: 10px 0; padding: 10px; border-left: 4px solid #667eea; background: #f9f9f9; }
                .priority-high { color: #e74c3c; font-weight: bold; }
                .priority-medium { color: #f39c12; font-weight: bold; }
                .priority-low { color: #27ae60; font-weight: bold; }
                .tag { background: #667eea; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.8em; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background: #667eea; color: white; }
                @media print {
                    body { margin: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Weekly Execution Planner</h1>
                <p><strong>Week:</strong> ${weekRange}</p>
                <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <div class="section">
                <h2>Top 3 Goals This Week</h2>
                ${topTasks.length > 0 ? topTasks.map((task, index) => `
                    <div class="task-item">
                        <h3>Goal ${index + 1}: ${task.text}</h3>
                        <p><strong>Project:</strong> ${task.project || 'Not specified'}</p>
                        <p><strong>Time Estimate:</strong> ${task.timeEstimate || 'Not specified'}</p>
                        <p><strong>Priority Score:</strong> <span class="${TaskUtils.getPriorityClass(task.priorityScore)}">${task.priorityScore}</span></p>
                    </div>
                `).join('') : '<p>No prioritized goals available</p>'}
            </div>
            
            <div class="section">
                <h2>All Tasks</h2>
                ${validTasks.length > 0 ? `
                    <table>
                        <thead>
                            <tr>
                                <th>Task</th>
                                <th>Project</th>
                                <th>Priority</th>
                                <th>Category</th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${validTasks.sort((a, b) => b.priorityScore - a.priorityScore).map(task => `
                                <tr>
                                    <td>${task.text}</td>
                                    <td>${task.project || 'Not specified'}</td>
                                    <td class="${TaskUtils.getPriorityClass(task.priorityScore)}">${task.priorityScore}</td>
                                    <td>${task.category ? task.category.replace('-', ' ').toUpperCase() : 'Not categorized'}</td>
                                    <td>${task.timeEstimate || 'Not specified'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : '<p>No evaluated tasks available</p>'}
            </div>
            
            <div class="section">
                <h2>Life Areas Focus</h2>
                ${appState.lifeAreas.length > 0 ? 
                    appState.lifeAreas.map(area => `<span class="tag">${area}</span>`).join(' ') :
                    '<p>No life areas selected</p>'
                }
            </div>
            
            <div class="section">
                <h2>Sprint Blocks</h2>
                ${appState.sprintBlocks.length > 0 ? 
                    appState.sprintBlocks.map(block => `
                        <div class="task-item">
                            <h4>${block.activity || 'Activity not specified'}</h4>
                            <p><strong>Time:</strong> ${block.timeSlot || 'Not specified'}</p>
                            <p><strong>Days:</strong> ${block.days.length > 0 ? block.days.join(', ') : 'Not specified'}</p>
                        </div>
                    `).join('') :
                    '<p>No sprint blocks scheduled</p>'
                }
            </div>
        </body>
        </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
    }, 250);
    
    UIUtils.showNotification('Opening print preview...', 'info');
}

/**
 * Show keyboard shortcuts modal
 */
function showShortcutsModal() {
    document.getElementById('shortcutsModal').style.display = 'block';
}

/**
 * Close keyboard shortcuts modal
 */
function closeShortcutsModal() {
    document.getElementById('shortcutsModal').style.display = 'none';
}

/**
 * Generate analytics and metrics
 */
function generateAnalytics() {
    const validTasks = appState.tasks.filter(task => 
        task.text && task.importance && task.urgency
    );
    
    if (validTasks.length === 0) {
        UIUtils.showNotification('Please add and evaluate some tasks first', 'warning');
        return;
    }
    
    // Generate productivity metrics
    generateProductivityMetrics(validTasks);
    
    // Generate time distribution
    generateTimeDistribution(validTasks);
    
    // Generate focus analysis
    generateFocusAnalysis(validTasks);
    
    UIUtils.showNotification('Analytics generated successfully!', 'success');
}

/**
 * Generate productivity metrics
 */
function generateProductivityMetrics(tasks) {
    const container = document.getElementById('productivityMetrics');
    
    const highPriorityTasks = tasks.filter(task => task.priorityScore >= 12).length;
    const mediumPriorityTasks = tasks.filter(task => task.priorityScore >= 6 && task.priorityScore < 12).length;
    const lowPriorityTasks = tasks.filter(task => task.priorityScore < 6).length;
    
    const doNowTasks = tasks.filter(task => task.category === 'do-now').length;
    const scheduleLaterTasks = tasks.filter(task => task.category === 'schedule-later').length;
    
    const avgPriorityScore = tasks.reduce((sum, task) => sum + task.priorityScore, 0) / tasks.length;
    
    container.innerHTML = `
        <div class="metric-item">
            <span>Total Tasks</span>
            <span class="metric-value">${tasks.length}</span>
        </div>
        <div class="metric-item">
            <span>High Priority Tasks</span>
            <span class="metric-value">${highPriorityTasks}</span>
        </div>
        <div class="metric-item">
            <span>Do Now Tasks</span>
            <span class="metric-value priority-high">${doNowTasks}</span>
        </div>
        <div class="metric-item">
            <span>Schedule Later Tasks</span>
            <span class="metric-value priority-medium">${scheduleLaterTasks}</span>
        </div>
        <div class="metric-item">
            <span>Average Priority Score</span>
            <span class="metric-value">${avgPriorityScore.toFixed(1)}</span>
        </div>
        <div class="metric-item">
            <span>Focus Efficiency</span>
            <span class="metric-value">${((doNowTasks + scheduleLaterTasks) / tasks.length * 100).toFixed(0)}%</span>
        </div>
    `;
}

/**
 * Generate time distribution analysis
 */
function generateTimeDistribution(tasks) {
    const container = document.getElementById('timeDistribution');
    
    const timeEstimates = {
        '15-30 minutes': 0,
        '30-60 minutes': 0,
        '1-2 hours': 0,
        '2-4 hours': 0,
        '4+ hours': 0,
        'Multi-day': 0,
        'Not specified': 0
    };
    
    tasks.forEach(task => {
        const estimate = task.timeEstimate || 'Not specified';
        if (timeEstimates.hasOwnProperty(estimate)) {
            timeEstimates[estimate]++;
        } else {
            timeEstimates['Not specified']++;
        }
    });
    
    const maxValue = Math.max(...Object.values(timeEstimates));
    
    container.innerHTML = `
        <div class="chart-container">
            <div class="chart-bar">
                ${Object.entries(timeEstimates).map(([time, count]) => `
                    <div class="bar" style="height: ${(count / maxValue) * 100}%">
                        <div class="bar-value">${count}</div>
                        <div class="bar-label">${time.split(' ')[0]}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="metric-item">
            <span>Most Common Duration</span>
            <span class="metric-value">${Object.entries(timeEstimates).reduce((a, b) => timeEstimates[a[0]] > timeEstimates[b[0]] ? a : b)[0]}</span>
        </div>
    `;
}

/**
 * Generate focus analysis
 */
function generateFocusAnalysis(tasks) {
    const container = document.getElementById('focusAnalysis');
    
    // Analyze projects
    const projects = {};
    tasks.forEach(task => {
        if (task.project) {
            const projectList = TaskUtils.extractProjects(task.project);
            projectList.forEach(project => {
                projects[project] = (projects[project] || 0) + 1;
            });
        }
    });
    
    // Sort projects by frequency
    const sortedProjects = Object.entries(projects)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
    
    // Analyze life areas focus
    const lifeAreasFocus = appState.lifeAreas.length;
    const focusScore = lifeAreasFocus <= 3 ? 'High Focus' : 
                     lifeAreasFocus <= 5 ? 'Moderate Focus' : 'Low Focus';
    
    container.innerHTML = `
        <div class="metric-item">
            <span>Active Projects</span>
            <span class="metric-value">${Object.keys(projects).length}</span>
        </div>
        <div class="metric-item">
            <span>Selected Life Areas</span>
            <span class="metric-value">${lifeAreasFocus}</span>
        </div>
        <div class="metric-item">
            <span>Focus Rating</span>
            <span class="metric-value ${lifeAreasFocus <= 3 ? 'priority-high' : lifeAreasFocus <= 5 ? 'priority-medium' : 'priority-low'}">${focusScore}</span>
        </div>
        ${sortedProjects.length > 0 ? `
            <div style="margin-top: 15px;">
                <strong>Top Projects:</strong>
                ${sortedProjects.map(([project, count]) => `
                    <div class="metric-item" style="padding: 4px 0;">
                        <span>${project}</span>
                        <span class="metric-value">${count} tasks</span>
                    </div>
                `).join('')}
            </div>
        ` : ''}
    `;
}

/**
 * Generate smart recommendations
 */
function generateSmartRecommendations(tasks) {
    const container = document.getElementById('recommendationsContainer');
    const recommendations = [];
    
    // Analyze task distribution
    const doNowTasks = tasks.filter(task => task.category === 'do-now');
    const scheduleLaterTasks = tasks.filter(task => task.category === 'schedule-later');
    const optionalTasks = tasks.filter(task => task.category === 'optional');
    const ignoreTasks = tasks.filter(task => task.category === 'ignore');
    
    // Check for overcommitment
    if (doNowTasks.length > 5) {
        recommendations.push({
            type: 'Priority Management',
            text: `You have ${doNowTasks.length} urgent tasks. Consider delegating or rescheduling some to avoid burnout.`
        });
    }
    
    // Check for procrastination patterns
    if (scheduleLaterTasks.length > doNowTasks.length * 2) {
        recommendations.push({
            type: 'Procrastination Alert',
            text: 'You have many important but non-urgent tasks. Set specific deadlines to prevent them from becoming urgent.'
        });
    }
    
    // Check for too many optional tasks
    if (optionalTasks.length > tasks.length * 0.3) {
        recommendations.push({
            type: 'Focus Improvement',
            text: 'Consider eliminating some urgent but unimportant tasks to focus on what truly matters.'
        });
    }
    
    // Check for life areas balance
    if (appState.lifeAreas.length > 6) {
        recommendations.push({
            type: 'Life Balance',
            text: 'You\'ve selected many life areas. Focus on 3-5 key areas this week for better results.'
        });
    }
    
    // Check for time estimates
    const tasksWithoutTime = tasks.filter(task => !task.timeEstimate).length;
    if (tasksWithoutTime > tasks.length * 0.5) {
        recommendations.push({
            type: 'Time Planning',
            text: 'Add time estimates to your tasks for better sprint planning and realistic scheduling.'
        });
    }
    
    // Check for consequences
    const tasksWithoutConsequences = tasks.filter(task => !task.consequences).length;
    if (tasksWithoutConsequences > tasks.length * 0.4) {
        recommendations.push({
            type: 'Motivation Boost',
            text: 'Define consequences for incomplete tasks to increase motivation and clarity.'
        });
    }
    
    // Sprint block recommendations
    if (appState.sprintBlocks.length === 0) {
        recommendations.push({
            type: 'Time Blocking',
            text: 'Add sprint blocks to schedule focused work time for your high-priority tasks.'
        });
    } else if (appState.sprintBlocks.length < doNowTasks.length) {
        recommendations.push({
            type: 'Schedule Optimization',
            text: 'You have more urgent tasks than sprint blocks. Consider adding more focused work sessions.'
        });
    }
    
    // Project focus recommendations
    const projects = {};
    tasks.forEach(task => {
        if (task.project) {
            const projectList = TaskUtils.extractProjects(task.project);
            projectList.forEach(project => {
                projects[project] = (projects[project] || 0) + 1;
            });
        }
    });
    
    if (Object.keys(projects).length > 5) {
        recommendations.push({
            type: 'Project Focus',
            text: 'You\'re working on many projects simultaneously. Consider focusing on 2-3 key projects this week.'
        });
    }
    
    // Generate HTML
    if (recommendations.length === 0) {
        container.innerHTML = `
            <div class="recommendation-item">
                <div class="recommendation-type">Excellent Work</div>
                <div class="recommendation-text">Your planning looks well-balanced! Keep up the great work with prioritization and focus.</div>
            </div>
        `;
    } else {
        container.innerHTML = recommendations.map(rec => `
            <div class="recommendation-item">
                <div class="recommendation-type">${rec.type}</div>
                <div class="recommendation-text">${rec.text}</div>
            </div>
        `).join('');
    }
}

/**
 * Export to PDF (client-side)
 */
function exportToPDF() {
    // Create a new window with print-friendly content
    const printWindow = window.open('', '_blank');
    const printContent = generatePrintContent();
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Weekly Execution Planner</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .section { margin-bottom: 25px; page-break-inside: avoid; }
                .section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #667eea; padding-bottom: 5px; }
                .task-item { margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
                .priority-high { color: #e74c3c; font-weight: bold; }
                .priority-medium { color: #f39c12; font-weight: bold; }
                .priority-low { color: #27ae60; font-weight: bold; }
                table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .tag { background: #667eea; color: white; padding: 2px 6px; border-radius: 10px; font-size: 12px; }
            </style>
        </head>
        <body>
            ${printContent}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
    
    UIUtils.showNotification('PDF export opened in new window', 'success');
}

/**
 * Export to CSV
 */
function exportToCSV() {
    const validTasks = appState.tasks.filter(task => task.text);
    
    if (validTasks.length === 0) {
        UIUtils.showNotification('No tasks to export', 'warning');
        return;
    }
    
    const headers = ['Task', 'Project', 'Importance', 'Urgency', 'Category', 'Priority Score', 'Time Estimate', 'Consequences'];
    const csvRows = [headers.join(',')];
    
    validTasks.forEach(task => {
        const row = [
            `"${task.text || ''}"`,
            `"${task.project || ''}"`,
            `"${task.importance || ''}"`,
            `"${task.urgency || ''}"`,
            `"${task.category || ''}"`,
            task.priorityScore || 0,
            `"${task.timeEstimate || ''}"`,
            `"${task.consequences || ''}"`.replace(/"/g, '""')
        ];
        csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `weekly-planner-tasks-${appState.weekStart || 'draft'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    UIUtils.showNotification('CSV exported successfully!', 'success');
}

/**
 * Generate print content
 */
function generatePrintContent() {
    const validTasks = appState.tasks.filter(task => task.text);
    const weekRange = appState.weekStart ? DateUtils.getWeekRange(new Date(appState.weekStart)) : 'Not specified';
    
    return `
        <div class="header">
            <h1>Weekly Execution Planner</h1>
            <h2>${weekRange}</h2>
        </div>
        
        <div class="section">
            <div class="section-title">Life Areas Focus</div>
            <p>${appState.lifeAreas.join(', ') || 'None selected'}</p>
        </div>
        
        <div class="section">
            <div class="section-title">Tasks Overview</div>
            ${validTasks.map(task => `
                <div class="task-item">
                    <strong>${task.text}</strong><br>
                    Project: ${task.project || 'Not specified'}<br>
                    Priority: <span class="${TaskUtils.getPriorityClass(task.priorityScore)}">${task.priorityScore}</span><br>
                    Category: ${task.category ? task.category.replace('-', ' ').toUpperCase() : 'Not categorized'}<br>
                    Time: ${task.timeEstimate || 'Not specified'}
                    ${task.consequences ? `<br>Consequences: ${task.consequences}` : ''}
                </div>
            `).join('')}
        </div>
        
        <div class="section">
            <div class="section-title">Sprint Blocks</div>
            ${appState.sprintBlocks.map(block => `
                <div class="task-item">
                    <strong>${block.activity || 'Activity not specified'}</strong><br>
                    Time: ${block.timeSlot || 'Not specified'}<br>
                    Days: ${block.days.join(', ') || 'None selected'}
                </div>
            `).join('') || '<p>No sprint blocks scheduled</p>'}
        </div>
    `;
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('shortcutsModal');
    if (event.target === modal) {
        closeShortcutsModal();
    }
});

// Export functions to global scope for HTML onclick handlers
window.setCurrentWeek = setCurrentWeek;
window.updateWeekRange = updateWeekRange;
window.addNewTask = addNewTask;
window.removeTask = removeTask;
window.toggleTaskEvaluation = toggleTaskEvaluation;
window.updateTask = updateTask;
window.addSprintBlock = addSprintBlock;
window.removeSprintBlock = removeSprintBlock;
window.updateSprintBlock = updateSprintBlock;
window.toggleDay = toggleDay;
window.generateInsights = generateInsights;
window.generateWeeklyTable = generateWeeklyTable;
window.exportToJSON = exportToJSON;
window.importFromJSON = importFromJSON;
window.saveToLocalStorage = saveToLocalStorage;
window.loadFromLocalStorage = loadFromLocalStorage;
window.printSummary = printSummary;
window.showShortcutsModal = showShortcutsModal;
window.closeShortcutsModal = closeShortcutsModal;
