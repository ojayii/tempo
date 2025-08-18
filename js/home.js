// import { Carousel } from "./Carousel";

/**
 * Home Controller - Handles home page functionality
 */
class HomeController {
    constructor() {
        this.templates = [
            {
                name: 'Deep Work',
                category: 'work',
                workDuration: 50,
                breakDuration: 10,
                icon: 'fas fa-briefcase',
                gradient: '--gradient-primary',
                description: 'Extended focus sessions for complex tasks'
            },
            {
                name: 'Study Session',
                category: 'study',
                workDuration: 45,
                breakDuration: 15,
                icon: 'fas fa-graduation-cap',
                gradient: '--gradient-secondary',
                description: 'Perfect for learning and academic work'
            },
            {
                name: 'Reading Time',
                category: 'reading',
                workDuration: 30,
                breakDuration: 5,
                icon: 'fas fa-book-open',
                gradient: '--gradient-warning',
                description: 'Focused reading with short breaks'
            },
            {
                name: 'Exercise Break',
                category: 'exercise',
                workDuration: 20,
                breakDuration: 10,
                icon: 'fas fa-dumbbell',
                gradient: '--gradient-danger',
                description: 'Quick workout sessions'
            },
            {
                name: 'Creative Work',
                category: 'creative',
                workDuration: 40,
                breakDuration: 10,
                icon: 'fas fa-palette',
                gradient: '--gradient-primary',
                description: 'For design, writing, and artistic projects'
            },
            {
                name: 'Quick Task',
                category: 'other',
                workDuration: 15,
                breakDuration: 5,
                icon: 'fas fa-bolt',
                gradient: '--gradient-secondary',
                description: 'Short bursts for quick tasks'
            }
        ];
        this.init();
    }

    /**
     * Initialize home controller
     */
    init() {
        this.renderCarousel();
        this.renderTemplates();
        this.renderRecentTasks();
        this.renderIncompleteTasks();
        this.setupEventListeners();
        this.renderStats()

        // Debug: Log incomplete tasks
        const incompleteTasks = storage.getIncompleteTasks();
        console.log('Incomplete tasks on init:', incompleteTasks);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for tab changes to refresh data
        document.addEventListener('tabChanged', (e) => {
            if (e.detail.to === 'home') {
                this.refreshData();
            }
        });

        // Listen for storage changes (if multiple tabs)
        window.addEventListener('storage', () => {
            this.refreshData();
        });
    }

    /**
     * Render carousel based on user history
     */
    renderCarousel() {
        const carousel = document.getElementById('carousel');
        if (!carousel) return;

        const history = storage.getHistory();
        const hasHistory = history.length > 0;

        let carouselItems = [];

        if (hasHistory) {
            // Encouraging messages for returning users
            carouselItems = [
                {
                    title: 'Welcome Back!',
                    content: 'Ready to tackle another productive session? Your focus journey continues!',
                    icon: 'fas fa-star'
                },
                {
                    title: 'Keep It Up!',
                    content: 'You\'re building great habits. Every session brings you closer to your goals.',
                    icon: 'fas fa-trophy'
                },
                {
                    title: 'Focus & Flow',
                    content: 'Find your rhythm with focused work sessions. You\'ve got this!',
                    icon: 'fas fa-brain'
                },
                {
                    title: 'Progress Matters',
                    content: 'Small consistent efforts lead to remarkable achievements over time.',
                    icon: 'fas fa-chart-line'
                },
                {
                    title: 'Stay Motivated',
                    content: 'Each completed session is a step forward. Keep pushing your limits!',
                    icon: 'fas fa-fire'
                }
            ];
        } else {
            // Instructional content for new users
            carouselItems = [
                {
                    title: 'Get Started in 3 Steps',
                    content: 'Create a task, set your timer, and start focusing! It\'s that simple.',
                    icon: 'fas fa-play-circle'
                },
                {
                    title: 'Step 1: Choose Your Task',
                    content: 'Select from our templates or create your own custom task with personalized timings.',
                    icon: 'fas fa-tasks'
                },
                {
                    title: 'Step 2: Set Your Timer',
                    content: 'Customize work and break durations to match your workflow and preferences.',
                    icon: 'fas fa-clock'
                },
                {
                    title: 'Step 3: Focus & Succeed',
                    content: 'Start the timer, eliminate distractions, and focus completely on your task.',
                    icon: 'fas fa-bullseye'
                }
            ];
        }

        carousel.innerHTML = carouselItems.map(item =>
            uiComponents.createCarouselCard(item)
        ).join('');

        if (this.carouselInstance) {
            this.carouselInstance.destroy();
        }
        this.carouselInstance = new Carousel('carousel-container', {
            interval: 3000,
            autoPlay: true
        });
    }

    /**
     * Render template cards
     */
    renderTemplates() {
        const templatesGrid = document.getElementById('templatesGrid');
        if (!templatesGrid) return;

        templatesGrid.innerHTML = this.templates.map(template =>
            uiComponents.createTemplateCard(template)
        ).join('');
    }

    /**
     * Render recent completed tasks
     */
    renderRecentTasks() {
        const history = storage.getHistory();
        const recentSection = document.getElementById('recentSection');
        const recentTasks = document.getElementById('recentTasks');

        if (!recentSection || !recentTasks) return;

        const completedHistory = history.filter(entry => entry.completed);

        if (completedHistory.length > 0) {
            recentSection.style.display = 'block';
            const recentEntries = completedHistory.slice(0, 5);

            recentTasks.innerHTML = recentEntries.map(entry =>
                uiComponents.createRecentTaskCard(entry)
            ).join('');
        } else {
            recentSection.style.display = 'none';
        }
    }

    /**
     * Render incomplete tasks that can be resumed
     */
    renderIncompleteTasks() {
        const incompleteTasks = storage.getIncompleteTasks();
        const incompleteSection = document.getElementById('incompleteSection');
        const incompleteTasksContainer = document.getElementById('incompleteTasks');

        console.log('Rendering incomplete tasks:', incompleteTasks);

        if (!incompleteSection || !incompleteTasksContainer) {
            console.error('Incomplete tasks elements not found');
            return;
        }

        if (incompleteTasks.length > 0) {
            incompleteSection.style.display = 'block';

            incompleteTasksContainer.innerHTML = incompleteTasks.map(incompleteTask =>
                uiComponents.createIncompleteTaskCard(incompleteTask)
            ).join('');

            console.log('Displayed', incompleteTasks.length, 'incomplete tasks');
        } else {
            incompleteSection.style.display = 'none';
            console.log('No incomplete tasks to display');
        }
    }

    /**
     * Use a template to start a new task
     */
    useTemplate(templateName) {
        const template = this.templates.find(t => t.name === templateName);
        if (!template) {
            uiComponents.showNotification('Template not found');
            return;
        }

        // Show template preview modal
        modal.showTemplateModal(template);
    }

    /**
     * Start template session directly without modal
     */
    startTemplateSession(templateName) {
        const template = this.templates.find(t => t.name === templateName);
        if (!template) return;

        const task = {
            name: template.name,
            category: template.category,
            workDuration: template.workDuration,
            breakDuration: template?.breakDuration,
            createdAt: new Date().toISOString()
        };

        if (typeof timerController !== 'undefined') {
            timerController.startTask(task);
            uiComponents.showNotification(`Started ${template.name} session!`);
        }

        // Switch to timer tab
        if (typeof navigation !== 'undefined') {
            navigation.switchTab('timer');
        }
    }

    /**
     * Start template directly (called from modal)
     */
    startTemplate(templateName) {
        const template = this.templates.find(t => t.name === templateName);
        if (!template) return;

        const task = {
            name: template.name,
            category: template.category,
            workDuration: template.workDuration,
            breakDuration: template?.breakDuration,
            createdAt: new Date().toISOString()
        };

        if (typeof timerController !== 'undefined') {
            timerController.startTask(task);
            uiComponents.showNotification(`Started ${template.name} session!`);
        }

        // Switch to timer tab
        if (typeof navigation !== 'undefined') {
            navigation.switchTab('timer');
        }
    }

    /**
     * Use a recent task to start a new session
     */
    useRecentTask(taskName, category) {
        const preferences = storage.getPreferences();
        const task = {
            name: taskName,
            category: category,
            workDuration: preferences.defaultWorkDuration || 25,
            breakDuration: preferences.defaultBreakDuration || 5,
            createdAt: new Date().toISOString()
        };

        if (typeof timerController !== 'undefined') {
            timerController.startTask(task);
            uiComponents.showNotification(`Restarted "${taskName}" session!`);
        }

        // Switch to timer tab
        if (typeof navigation !== 'undefined') {
            navigation.switchTab('timer');
        }
    }

    /**
     * Resume an incomplete task
     */
    /**
     * Resume an incomplete task
     */
    resumeIncompleteTask(taskId) {
        const incompleteTasks = storage.getIncompleteTasks();
        const incompleteTask = incompleteTasks.find(t => t.id === taskId);

        if (!incompleteTask) {
            uiComponents.showNotification('Task not found');
            return;
        }

        if (typeof timerController !== 'undefined') {
            timerController.resumeTask(incompleteTask);
            uiComponents.showNotification(`Resumed "${incompleteTask.task.name}"!`);
        }

        // Refresh incomplete tasks display
        this.renderIncompleteTasks();

        // Switch to timer tab
        if (typeof navigation !== 'undefined') {
            navigation.switchTab('timer');
        }
    }

    /**
     * Get user statistics for dashboard
     */
    getUserStats() {
        const history = storage.getHistory();
        const completedSessions = history.filter(h => h.completed);
        const totalFocusTime = completedSessions.reduce((sum, h) => sum + h.duration, 0);

        const today = new Date().toDateString();
        const todaySessions = completedSessions.filter(h =>
            new Date(h.completedAt).toDateString() === today
        );

        const thisWeek = new Date();
        thisWeek.setDate(thisWeek.getDate() - 7);
        const weekSessions = completedSessions.filter(h =>
            new Date(h.completedAt) >= thisWeek
        );

        return {
            totalSessions: completedSessions.length,
            totalFocusTime: totalFocusTime,
            todaySessions: todaySessions.length,
            weekSessions: weekSessions.length,
            avgSessionLength: completedSessions.length > 0 ?
                Math.round(totalFocusTime / completedSessions.length) : 0,
            mostUsedCategory: this.getMostUsedCategory(completedSessions),
            currentStreak: this.getCurrentStreak(completedSessions)
        };
    }

    /**
     * Get most frequently used category
     */
    getMostUsedCategory(sessions) {
        const categoryCounts = {};
        sessions.forEach(session => {
            categoryCounts[session.category] = (categoryCounts[session.category] || 0) + 1;
        });

        const mostUsed = Object.entries(categoryCounts)
            .sort(([, a], [, b]) => b - a)[0];

        return mostUsed ? mostUsed[0] : null;
    }

    /**
     * Calculate current streak of consecutive days with sessions
     */
    getCurrentStreak(sessions) {
        if (sessions.length === 0) return 0;

        const sessionDates = [...new Set(sessions.map(s =>
            new Date(s.completedAt).toDateString()
        ))].sort((a, b) => new Date(b) - new Date(a));

        let streak = 0;
        const today = new Date();

        for (let i = 0; i < sessionDates.length; i++) {
            const sessionDate = new Date(sessionDates[i]);
            const expectedDate = new Date(today);
            expectedDate.setDate(today.getDate() - i);

            if (sessionDate.toDateString() === expectedDate.toDateString()) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    }

    getStatsContent() {
        const stats = this.getUserStats();

        const content = `
            <div style="pdding: 20px 0;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                    <div style="background: var(--bg-secondary); padding: 16px; border-radius: 12px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: var(--accent-primary);">${stats.totalSessions}</div>
                        <div style="font-size: 14px; color: var(--text-secondary);">Total Sessions</div>
                    </div>
                    <div style="background: var(--bg-secondary); padding: 16px; border-radius: 12px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: var(--accent-secondary);">${Math.floor(stats.totalFocusTime / 60)}h ${stats.totalFocusTime % 60}m</div>
                        <div style="font-size: 14px; color: var(--text-secondary);">Focus Time</div>
                    </div>
                    <div style="background: var(--bg-secondary); padding: 16px; border-radius: 12px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: var(--accent-warning);">${stats.todaySessions}</div>
                        <div style="font-size: 14px; color: var(--text-secondary);">Today</div>
                    </div>
                    <div style="background: var(--bg-secondary); padding: 16px; border-radius: 12px; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: var(--accent-danger);">${stats.currentStreak}</div>
                        <div style="font-size: 14px; color: var(--text-secondary);">Day Streak</div>
                    </div>
                </div>
                
                <div style="background: var(--bg-secondary); padding: 16px; border-radius: 12px; margin-bottom: 16px;">
                    <h4 style="margin-bottom: 12px; color: var(--text-primary);">This Week</h4>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: var(--text-secondary);">Sessions Completed:</span>
                        <span style="font-weight: bold; color: var(--accent-primary);">${stats.weekSessions}</span>
                    </div>
                </div>
                
                ${stats.mostUsedCategory ? `
                <div style="background: var(--bg-secondary); padding: 16px; border-radius: 12px; margin-bottom: 16px;">
                    <h4 style="margin-bottom: 12px; color: var(--text-primary);">Most Used Category</h4>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: var(--text-secondary);">Category:</span>
                        <span style="font-weight: bold; color: var(--accent-secondary); text-transform: capitalize;">${stats.mostUsedCategory}</span>
                    </div>
                </div>
                ` : ''}
                
                ${stats.avgSessionLength > 0 ? `
                <div style="background: var(--bg-secondary); padding: 16px; border-radius: 12px;">
                    <h4 style="margin-bottom: 12px; color: var(--text-primary);">Average Session</h4>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: var(--text-secondary);">Duration:</span>
                        <span style="font-weight: bold; color: var(--accent-warning);">${stats.avgSessionLength} minutes</span>
                    </div>
                </div>
                ` : ''}
            </div>
        `;

        return content;
    }

    /**
     * Show user statistics modal
     */
    showStatsModal() {
        const content = this.getStatsContent();

        const actions = [
            {
                text: 'Close',
                icon: 'fas fa-check',
                onClick: 'modal.hideCustomModal()'
            }
        ];

        modal.showCustomModal('Your Focus Statistics', content, actions);
    }

    renderStats() {
        const content = this.getStatsContent()
        const history = storage.getHistory();
        const statsSection = document.getElementById('statsSection');
        const statsContainer = document.getElementById('statsContainer')

        if (!statsSection || !statsContainer) return;

        const completedHistory = history.filter(entry => entry.completed);

        if (completedHistory.length > 0) {
            statsSection.style.display = 'block';
            statsContainer.innerHTML = content;
        } else {
            statsSection.style.display = 'none';
        }
    }

    /**
     * Show quick start options
     */
    showQuickStart() {
        const recentCategories = this.getRecentCategories();
        const preferences = storage.getPreferences();

        const content = `
            <div style="padding: 20px 0;">
                <div style="margin-bottom: 24px; text-align: center;">
                    <div style="width: 60px; height: 60px; backgrund: var(--gradient-primary); border-radius: 15px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; font-size: 24px; color: white;">
                        <i class="fas fa-bolt" style="font-size: 4rem; color: gold;"></i>
                    </div>
                    <h3 style="margin-bottom: 8px;">Quick Start</h3>
                    <p style="color: var(--text-secondary);">Jump right into a focus session</p>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600;">Task Name</label>
                    <input type="text" id="quickTaskName" placeholder="What are you working on?" 
                           style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary);">
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600;">Category</label>
                    <select id="quickCategory" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary);">
                        ${recentCategories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                    </select>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 600;">Work (min)</label>
                        <input type="number" id="quickWorkDuration" value="${preferences.defaultWorkDuration || 25}" 
                               min="1" max="120" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary);">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 8px; font-weight: 600;">Break (min)</label>
                        <input type="number" id="quickBreakDuration" value="${preferences.defaultBreakDuration || 5}" 
                               min="1" max="30" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary);">
                    </div>
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
                text: 'Start Now',
                icon: 'fas fa-play',
                type: 'primary',
                onClick: 'home.startQuickTask(); modal.hideCustomModal();'
            }
        ];

        modal.showCustomModal('Quick Start Session', content, actions);

        // Focus the task name input
        setTimeout(() => {
            const taskNameInput = document.getElementById('quickTaskName');
            if (taskNameInput) taskNameInput.focus();
        }, 100);
    }

    /**
     * Start quick task from modal
     */
    startQuickTask() {
        const taskName = document.getElementById('quickTaskName').value.trim();
        const category = document.getElementById('quickCategory').value;
        const workDuration = parseInt(document.getElementById('quickWorkDuration').value);
        const breakDuration = parseInt(document.getElementById('quickBreakDuration').value);

        if (!taskName) {
            uiComponents.showNotification('Please enter a task name');
            return;
        }

        const task = {
            name: taskName,
            category: category,
            workDuration: workDuration,
            breakDuration: breakDuration,
            createdAt: new Date().toISOString()
        };

        if (typeof timerController !== 'undefined') {
            timerController.startTask(task);
            uiComponents.showNotification(`Started "${taskName}" session!`);
        }

        // Switch to timer tab
        if (typeof navigation !== 'undefined') {
            navigation.switchTab('timer');
        }
    }

    /**
     * Get recent categories for quick start
     */
    getRecentCategories() {
        const history = storage.getHistory();
        const categories = [...new Set(history.map(h => h.category))];
        const defaultCategories = ['work', 'study', 'reading', 'exercise', 'creative', 'other'];

        // Merge recent categories with defaults, removing duplicates
        const allCategories = [...categories, ...defaultCategories.filter(c => !categories.includes(c))];

        return allCategories.slice(0, 6); // Limit to 6 categories
    }

    /**
     * Refresh all data on the home page
     */
    refreshData() {
        this.renderCarousel();
        this.renderRecentTasks();
        this.renderIncompleteTasks();
    }

    /**
     * Handle search functionality
     */
    searchTasks(query) {
        const history = storage.getHistory();
        const filteredTasks = history.filter(task =>
            task.task.toLowerCase().includes(query.toLowerCase()) ||
            task.category.toLowerCase().includes(query.toLowerCase())
        );

        return filteredTasks;
    }

    /**
     * Show motivational message based on progress
     */
    showMotivationalMessage() {
        const stats = this.getUserStats();
        let message = '';

        if (stats.currentStreak >= 7) {
            message = `Amazing! You're on a ${stats.currentStreak}-day streak! 🔥`;
        } else if (stats.currentStreak >= 3) {
            message = `Great momentum! ${stats.currentStreak} days in a row! 💪`;
        } else if (stats.totalSessions >= 50) {
            message = `You're a focus champion with ${stats.totalSessions} sessions! 🏆`;
        } else if (stats.totalSessions >= 10) {
            message = `You're building great habits! Keep it up! ⭐`;
        } else if (stats.totalSessions > 0) {
            message = `Great start! Every session counts! 🌟`;
        } else {
            message = `Ready to start your focus journey? 🚀`;
        }

        if (message) {
            uiComponents.showNotification(message, 4000);
        }
    }

    /**
     * Get template by name
     */
    getTemplate(name) {
        return this.templates.find(t => t.name === name);
    }

    /**
     * Add custom template
     */
    addCustomTemplate(template) {
        this.templates.push({
            ...template,
            gradient: '--gradient-primary',
            icon: 'fas fa-star'
        });
        this.renderTemplates();
    }

    /**
     * Handle template long press for edit/delete
     */
    handleTemplateLongPress(templateName) {
        const template = this.getTemplate(templateName);
        if (!template) return;

        // Show context menu for template actions
        const actions = [
            {
                text: 'Start Session',
                icon: 'fas fa-play',
                onClick: `home.useTemplate('${templateName}'); modal.hideCustomModal();`
            },
            {
                text: 'Edit Template',
                icon: 'fas fa-edit',
                onClick: `home.editTemplate('${templateName}'); modal.hideCustomModal();`
            }
        ];

        modal.showCustomModal(`${template.name} Options`, '', actions);
    }

    /**
     * Check if it's a new day and show daily motivation
     */
    checkDailyMotivation() {
        const lastShown = localStorage.getItem('lastMotivationShown');
        const today = new Date().toDateString();

        if (lastShown !== today) {
            setTimeout(() => {
                this.showMotivationalMessage();
                localStorage.setItem('lastMotivationShown', today);
            }, 2000);
        }
    }
}

// Export the class, don't instantiate yet
window.HomeController = HomeController;