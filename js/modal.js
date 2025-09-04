// Modal Controller - Handles all modal interactions

class ModalController {
    constructor() {
        this.isModalOpen = false;
        this.currentModal = null;
        this.init();
    }

    // Initialize modal controller
    
    init() {
        this.setupEventListeners();
        this.setupKeyboardHandlers();
    }

    // Setup modal event listeners
    
    setupEventListeners() {
        // Setup keyboard handlers
        this.setupKeyboardHandlers();

        // Setup backdrop click handlers after DOM loads
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupBackdropHandlers());
        } else {
            this.setupBackdropHandlers();
        }

        // Handle form submissions
        document.addEventListener('DOMContentLoaded', () => {
            const taskForm = document.getElementById('taskForm');
            if (taskForm) {
                taskForm.addEventListener('submit', (e) => this.createTask(e));
            }
        });
    }

    // Setup backdrop click handlers
    
    setupBackdropHandlers() {
        // Task modal backdrop
        const taskModal = document.getElementById('taskModal');
        if (taskModal) {
            taskModal.addEventListener('click', (e) => {
                if (e.target === taskModal) {
                    this.hideTaskModal();
                }
            });
        }

        // Congratulations modal backdrop
        const congratsModal = document.getElementById('congratsModal');
        if (congratsModal) {
            congratsModal.addEventListener('click', (e) => {
                if (e.target === congratsModal) {
                    this.hideCongratulations();
                }
            });
        }
    }

    // Setup keyboard handlers for modals
    
    setupKeyboardHandlers() {
        document.addEventListener('keydown', (e) => {
            if (this.isModalOpen) {
                if (e.key === 'Escape') {
                    this.closeCurrentModal();
                } else if (e.key === 'Enter' && e.ctrlKey) {
                    // Ctrl+Enter to submit form
                    const form = document.querySelector('.modal-overlay.show form');
                    if (form) {
                        form.dispatchEvent(new Event('submit'));
                    }
                }
            }
        });
    }

    // Show task creation modal
    
    showTaskModal() {
        const modal = document.getElementById('taskModal');
        const sheet = document.getElementById('taskSheet');

        if (!modal || !sheet) return;

        this.isModalOpen = true;
        this.currentModal = 'taskModal';

        modal.style.display = 'flex';

        // Focus first input
        setTimeout(() => {
            sheet.classList.add('show');
            const firstInput = sheet.querySelector('input');
            if (firstInput) {
                firstInput.focus();
            }
        }, 10);

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    // Hide task creation modal
    
    hideTaskModal() {
        const modal = document.getElementById('taskModal');
        const sheet = document.getElementById('taskSheet');

        if (!modal || !sheet) return;

        sheet.classList.remove('show');

        setTimeout(() => {
            modal.style.display = 'none';
            this.isModalOpen = false;
            this.currentModal = null;

            // Restore body scroll
            document.body.style.overflow = '';

            // Reset form
            this.resetTaskForm();
        }, 300);
    }

    // Create new task from modal form
    
    createTask(event) {
        event.preventDefault();

        const taskName = document.getElementById('taskNameInput').value.trim();
        const category = document.getElementById('categorySelect').value;
        const workDuration = parseInt(document.getElementById('workDuration').value);
        const breakDuration = parseInt(document.getElementById('breakDuration').value);

        // Validate inputs
        if (!taskName) {
            uiComponents.showNotification('Please enter a task name', 3000);
            return;
        }

        if (workDuration < 1 || workDuration > 120) {
            uiComponents.showNotification('Work duration must be between 1 and 120 minutes', 3000);
            return;
        }

        if (breakDuration < 1 || breakDuration > 30) {
            uiComponents.showNotification('Break duration must be between 1 and 30 minutes', 3000);
            return;
        }

        // Create task object
        const task = {
            name: taskName,
            category: category,
            workDuration: workDuration,
            breakDuration: breakDuration,
            createdAt: new Date().toISOString()
        };

        // Start the task
        if (typeof timerController !== 'undefined') {
            timerController.startTask(task);
            uiComponents.showNotification(`Task "${taskName}" created successfully!`);
        }

        // Hide modal
        this.hideTaskModal();

        // Switch to timer tab if not already there
        if (typeof navigation !== 'undefined' && navigation.getCurrentTab() !== 'timer') {
            navigation.switchTab('timer');
        }
    }

    // Reset task form to default values
    
    resetTaskForm() {
        const form = document.getElementById('taskForm');
        if (form) {
            form.reset();

            // Reset to default values
            document.getElementById('workDuration').value = 25;
            document.getElementById('breakDuration').value = 5;
            document.getElementById('categorySelect').value = 'work';
        }
    }

    // Show congratulations modal
    
    showCongratulations() {
        const modal = document.getElementById('congratsModal');
        if (!modal) return;

        this.isModalOpen = true;
        this.currentModal = 'congratsModal';

        modal.style.display = 'flex';

        // Add celebration animation
        const trophyIcon = modal.querySelector('.trophy-icon');
        if (trophyIcon) {
            trophyIcon.style.animation = 'bounce 0.6s ease-in-out';
        }

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Auto-hide after 15 seconds
        setTimeout(() => {
            if (this.currentModal === 'congratsModal') {
                this.hideCongratulations();
            }
        }, 15000);

        // Vibrate device if supported
        uiComponents.vibrate([200, 100, 200, 100, 200]);
    }

    // Hide congratulations modal
    
    hideCongratulations() {
        const modal = document.getElementById('congratsModal');
        if (!modal) return;

        modal.style.display = 'none';
        this.isModalOpen = false;
        this.currentModal = null;

        // Restore body scroll
        document.body.style.overflow = '';
    }

    // Show history modal
    
    showHistoryModal() {
        const history = storage.getHistory();

        if (history.length === 0) {
            uiComponents.showNotification('No history yet. Complete some sessions to see your progress!');
            return;
        }

        const modal = this.createHistoryModal(history);
        document.body.appendChild(modal);

        this.isModalOpen = true;
        this.currentModal = 'historyModal';

        // Show modal
        setTimeout(() => {
            const sheet = modal.querySelector('.bottom-sheet');
            if (sheet) {
                sheet.classList.add('show');
            }
        }, 10);

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    // Create history modal HTML
    
    createHistoryModal(history) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.display = 'flex';
        modal.id = 'historyModal';

        const recentHistory = history.slice(0, 20);
        const totalSessions = history.filter(h => h.completed).length;
        const totalTime = history.reduce((sum, h) => sum + (h.completed ? h.duration : 0), 0);

        modal.innerHTML = `
            <div class="bottom-sheet">
                <div class="sheet-header">
                    <h3 class="sheet-title">
                        <i class="fas fa-history"></i>
                        Your Focus History
                    </h3>
                    <button class="close-btn" onclick="modal.hideHistoryModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div style="margin-bottom: 24px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                        <div style="background: var(--bg-secondary); padding: 16px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: var(--accent-primary);">${totalSessions}</div>
                            <div style="font-size: 14px; color: var(--text-secondary);">Completed Sessions</div>
                        </div>
                        <div style="background: var(--bg-secondary); padding: 16px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: var(--accent-secondary);">${Math.floor(totalTime / 60)}h ${totalTime % 60}m</div>
                            <div style="font-size: 14px; color: var(--text-secondary);">Total Focus Time</div>
                        </div>
                    </div>
                    
                    <div style="max-hight: 300px; overflow-y: ato;">
                        ${recentHistory.map(entry => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-color);">
                                <div>
                                    <div style="font-weight: 600; color: var(--text-primary);">${entry.task}</div>
                                    <div style="font-size: 14px; color: var(--text-secondary);">${entry.category} • ${uiComponents.formatDate(entry.completedAt)}</div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-weight: 600; color: ${entry.completed ? 'var(--accent-primary)' : 'var(--accent-warning)'};">
                                    <i class="${entry.completed ? 'fas fa-check' : 'fas fa-pause'}"></i>
                                    <span>${entry.duration}min</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <button class="submit-btn" onclick="modal.hideHistoryModal()">
                    <i class="fas fa-check"></i>
                    Close
                </button>
            </div>
        `;

        // Add event listeners
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideHistoryModal();
            }
        });

        return modal;
    }

    // Hide history modal
    
    hideHistoryModal() {
        const modal = document.getElementById('historyModal');
        if (!modal) return;

        const sheet = modal.querySelector('.bottom-sheet');
        if (sheet) {
            sheet.classList.remove('show');
        }

        setTimeout(() => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
            this.isModalOpen = false;
            this.currentModal = null;

            // Restore body scroll
            document.body.style.overflow = '';
        }, 300);
    }

    // Show settings reset confirmation
    
    showResetConfirmation(onConfirm) {
        uiComponents.showConfirmDialog(
            'Reset All Data',
            'Are you sure you want to reset all data? This will permanently delete your history, incomplete tasks, and preferences. This action cannot be undone.',
            () => {
                if (onConfirm) onConfirm();
                uiComponents.showNotification('All data has been reset successfully.');
            },
            () => {
                // User cancelled - no action needed
            }
        );
    }

    // Close current modal
    
    closeCurrentModal() {
        switch (this.currentModal) {
            case 'taskModal':
                this.hideTaskModal();
                break;
            case 'congratsModal':
                this.hideCongratulations();
                break;
            case 'historyModal':
                this.hideHistoryModal();
                break;
        }
    }

    // Check if any modal is open
    
    isAnyModalOpen() {
        return this.isModalOpen;
    }

    // Get current modal name
    
    getCurrentModal() {
        return this.currentModal;
    }

    // Show modal with custom content
    
    showCustomModal(title, content, actions = []) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.display = 'flex';
        modal.id = 'customModal';

        const actionsHtml = actions.map(action => `
            <button class="modal-btn ${action.type || ''}" onclick="${action.onClick}">
                ${action.icon ? `<i class="${action.icon}"></i>` : ''}
                ${action.text}
            </button>
        `).join('');

        modal.innerHTML = `
            <div class="bottom-sheet ">
                <div class="sheet-header">
                    <h3 class="sheet-title">${title}</h3>
                    <button class="close-btn" onclick="modal.hideCustomModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div style="margin-bottom: 24px;">
                    ${content}
                </div>
                
                ${actionsHtml ? `<div style="display: flex; gap: 12px;">${actionsHtml}</div>` : ''}
            </div>
        `;

        document.body.appendChild(modal);

        this.isModalOpen = true;
        this.currentModal = 'customModal';

        // Show modal
        setTimeout(() => {
            const sheet = modal.querySelector('.bottom-sheet');
            if (sheet) {
                sheet.classList.add('show');
            }
        }, 10);

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        return modal;
    }

    // Hide custom modal
    
    hideCustomModal() {
        const modal = document.getElementById('customModal');
        if (!modal) return;

        const sheet = modal.querySelector('.bottom-sheet');
        if (sheet) {
            sheet.classList.remove('show');
        }

        setTimeout(() => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
            this.isModalOpen = false;
            this.currentModal = null;

            // Restore body scroll
            document.body.style.overflow = '';
        }, 300);
    }

    // Show quick action modal for templates
    
    showTemplateModal(template) {
        const content = `
            <div style="text-align: center; padding: 20px 0;">
                <div style="width: 60px; height: 60px; background: var(${template.gradient}); border-radius: 15px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; font-size: 24px; color: white;">
                    <i class="${template.icon}"></i>
                </div>
                <h3 style="margin-bottom: 8px;">${template.name}</h3>
                <p style="color: var(--text-secondary); margin-bottom: 20px;">
                    ${template.workDuration} minutes of focused work with ${template?.breakDuration} minute breaks
                </p>
                <div style="background: var(--bg-secondary); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 8px;">Category: ${template.category}</div>
                    <div style="font-size: 14px; color: var(--text-secondary);">Perfect for ${this.getTemplateDescription(template.category)}</div>
                </div>
            </div>
        `;

        const actions = [
            {
                text: 'Cancel',
                icon: 'fas fa-times',
                type: 'muted',
                onClick: 'modal.hideCustomModal()'
            },
            {
                text: 'Start Session',
                icon: 'fas fa-play',
                type: 'primary',
                onClick: `modal.hideCustomModal(); home.startTemplateSession('${template.name}');`
            }
        ];

        this.showCustomModal(`Start ${template.name}?`, content, actions);
    }

    // Get template category description
    
    getTemplateDescription(category) {
        const descriptions = {
            work: 'professional tasks, meetings, and project work',
            study: 'learning, research, and academic work',
            reading: 'books, articles, and educational content',
            exercise: 'workouts, stretching, and physical activity',
            creative: 'design, writing, and artistic projects',
            other: 'general tasks and personal projects'
        };
        return descriptions[category] || descriptions.other;
    }
}

window.ModalController = ModalController;