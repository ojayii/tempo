/**
 * Main Application Controller
 * Handles all DOM interactions and event binding
 */
class MainController {
    constructor() {
        this.isInitialized = false;
        this.eventListeners = new Map();
        this.modules = {};
        this.init();
    }

    /**
     * Initialize the main controller
     */
    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.onDOMReady());
        } else {
            this.onDOMReady();
        }
    }

    /**
     * Called when DOM is ready
     */
    onDOMReady() {
        console.log('MainController: DOM ready, initializing...');

        try {
            // Initialize all modules in correct order
            this.initializeModules();

            // Bind all event listeners
            this.bindEventListeners();

            // Set initial states
            this.setInitialStates();

            this.isInitialized = true;
            console.log('MainController: Initialization complete');
        } catch (error) {
            console.error('MainController: Initialization failed:', error);
            this.showInitializationError(error);
        }
    }

    /**
     * Initialize all application modules in correct dependency order
     */
    initializeModules() {
        console.log('MainController: Initializing modules...');

        // Check all classes are available
        const requiredClasses = [
            'StorageManager', 'UIComponents', 'TimerController',
            'NavigationController', 'ModalController', 'SettingsController',
            'HomeController', 'SpotifyPlayer', 'FocusTimerApp'
        ];

        for (const className of requiredClasses) {
            if (typeof window[className] !== 'function') {
                throw new Error(`${className} class not loaded`);
            }
        }

        // Initialize in dependency order
        // 1. Storage (no dependencies)
        this.modules.storage = new window.StorageManager();
        window.storage = this.modules.storage;
        console.log('✓ Storage module initialized');

        // 2. UI Components (no dependencies)
        this.modules.uiComponents = new window.UIComponents();
        window.uiComponents = this.modules.uiComponents;
        console.log('✓ UI Components module initialized');

        // 3. Timer Controller (depends on storage, uiComponents)
        this.modules.timerController = new window.TimerController();
        window.timerController = this.modules.timerController;
        console.log('✓ Timer Controller module initialized');

        // 4. Navigation Controller (depends on timerController)
        this.modules.navigation = new window.NavigationController();
        window.navigation = this.modules.navigation;
        console.log('✓ Navigation module initialized');

        // 5. Modal Controller (depends on storage, timerController, navigation)
        this.modules.modal = new window.ModalController();
        window.modal = this.modules.modal;
        console.log('✓ Modal module initialized');

        // 6. Settings Controller (depends on storage, modal, uiComponents)
        this.modules.settings = new window.SettingsController();
        window.settings = this.modules.settings;
        console.log('✓ Settings module initialized');

        // 7. Home Controller (depends on storage, uiComponents, timerController, navigation)
        this.modules.home = new window.HomeController();
        window.home = this.modules.home;
        console.log('✓ Home module initialized');

        // 8. Spotify Player (depends on uiComponents)
        this.modules.spotifyPlayer = new window.SpotifyPlayer();
        window.spotifyPlayer = this.modules.spotifyPlayer;
        console.log('✓ Spotify Player module initialized');

        // 9. App Controller (depends on all modules)
        this.modules.app = new window.FocusTimerApp();
        window.app = this.modules.app;
        console.log('✓ App module initialized');

        console.log('MainController: All modules initialized successfully');
    }

    /**
     * Bind all event listeners to DOM elements
     */
    bindEventListeners() {
        // Navigation events
        this.bindNavigationEvents();

        // Theme toggle events
        this.bindThemeEvents();

        // Timer control events
        this.bindTimerEvents();

        // Modal events
        this.bindModalEvents();

        // Settings events
        this.bindSettingsEvents();

        // Spotify events
        this.bindSpotifyEvents();

        // Home page events
        this.bindHomeEvents();

        // Global events
        this.bindGlobalEvents();
    }

    /**
     * Bind navigation events
     */
    bindNavigationEvents() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach((item, index) => {
            this.addEventListenerSafe(item, 'click', (e) => {
                e.preventDefault();
                const tabName = item.getAttribute('data-tab');
                if (tabName) {
                    this.modules.navigation.switchTab(tabName);
                }
            });
        });

        // Try Now button
        const tryNowBtn = document.querySelector('.try-now-btn');
        if (tryNowBtn) {
            this.addEventListenerSafe(tryNowBtn, 'click', () => {
                this.modules.navigation.switchTab('timer');
            });
        }

        console.log('MainController: Navigation events bound');
    }

    /**
     * Bind theme toggle events
     */
    bindThemeEvents() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            this.addEventListenerSafe(themeToggle, 'click', () => {
                console.log('MainController: Theme toggle clicked');
                this.modules.settings.toggleTheme();
            });
        }

        console.log('MainController: Theme events bound');
    }

    /**
     * Bind timer control events
     */
    bindTimerEvents() {
        // Add Task button
        const addTaskBtn = document.getElementById('addTaskBtn');
        if (addTaskBtn) {
            this.addEventListenerSafe(addTaskBtn, 'click', () => {
                this.modules.modal.showTaskModal();
            });
        }

        // Play button
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            this.addEventListenerSafe(playBtn, 'click', () => {
                this.modules.timerController.toggleTimer();
            });
        }

        // Pause button
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            this.addEventListenerSafe(pauseBtn, 'click', () => {
                this.modules.timerController.toggleTimer();
            });
        }

        // Stop button
        const stopBtn = document.getElementById('stopBtn');
        if (stopBtn) {
            this.addEventListenerSafe(stopBtn, 'click', () => {
                this.modules.timerController.stopTimer();
            });
        }

        console.log('MainController: Timer events bound');
    }

    /**
     * Bind modal events
     */
    bindModalEvents() {
        // Task modal form
        const taskForm = document.getElementById('taskForm');
        if (taskForm) {
            this.addEventListenerSafe(taskForm, 'submit', (e) => {
                this.modules.modal.createTask(e);
            });
        }

        // Task modal close button
        const taskModalCloseBtn = document.querySelector('#taskModal .close-btn');
        if (taskModalCloseBtn) {
            this.addEventListenerSafe(taskModalCloseBtn, 'click', () => {
                this.modules.modal.hideTaskModal();
            });
        }

        // Task modal backdrop
        const taskModal = document.getElementById('taskModal');
        if (taskModal) {
            this.addEventListenerSafe(taskModal, 'click', (e) => {
                if (e.target === taskModal) {
                    this.modules.modal.hideTaskModal();
                }
            });
        }

        // Congratulations modal continue button
        const congratsContinueBtn = document.querySelector('#congratsModal .submit-btn');
        if (congratsContinueBtn) {
            this.addEventListenerSafe(congratsContinueBtn, 'click', () => {
                this.modules.modal.hideCongratulations();
            });
        }

        // Congratulations modal backdrop
        const congratsModal = document.getElementById('congratsModal');
        if (congratsModal) {
            this.addEventListenerSafe(congratsModal, 'click', (e) => {
                if (e.target === congratsModal) {
                    this.modules.modal.hideCongratulations();
                }
            });
        }

        console.log('MainController: Modal events bound');
    }

    /**
     * Bind settings events
     */
    bindSettingsEvents() {
        // History button
        const historyBtn = document.querySelector('.settings-item.settings-btn.history');
        if (historyBtn) {
            this.addEventListenerSafe(historyBtn, 'click', () => {
                this.modules.settings.showHistory();
            });
        }

        // Reset button
        const resetBtn = document.querySelector('.settings-item.settings-btn.reset');
        if (resetBtn) {
            this.addEventListenerSafe(resetBtn, 'click', () => {
                this.modules.settings.resetData();
            });
        }

        // Install button
        const installBtn = document.querySelector('.settings-item.settings-btn.install');
        if (installBtn) {
            this.addEventListenerSafe(installBtn, 'click', () => {
                // this.modules.app.showInstallPrompt();
                this.modules.app.showInstallPrompt();
            });
        }

        console.log('MainController: Settings events bound');
    }

    /**
     * Bind Spotify events
     */
    bindSpotifyEvents() {
        // Music button
        const musicBtn = document.getElementById('musicBtn');
        if (musicBtn) {
            this.addEventListenerSafe(musicBtn, 'click', () => {
                this.modules.spotifyPlayer.showDrawer();
            });
        }

        // Spotify close button
        const spotifyCloseBtn = document.getElementById('spotifyCloseBtn');
        if (spotifyCloseBtn) {
            this.addEventListenerSafe(spotifyCloseBtn, 'click', () => {
                this.modules.spotifyPlayer.hideDrawer();
            });
        }

        // Spotify modal backdrop
        const spotifyModal = document.getElementById('spotifyModal');
        if (spotifyModal) {
            this.addEventListenerSafe(spotifyModal, 'click', (e) => {
                if (e.target === spotifyModal) {
                    this.modules.spotifyPlayer.hideDrawer();
                }
            });
        }

        // Connect Spotify button
        const connectSpotifyBtn = document.getElementById('connectSpotifyBtn');
        if (connectSpotifyBtn) {
            this.addEventListenerSafe(connectSpotifyBtn, 'click', () => {
                this.modules.spotifyPlayer.authenticate();
            });
        }

        // Spotify tabs
        const spotifyTabs = document.querySelectorAll('.spotify-tab');
        spotifyTabs.forEach(tab => {
            this.addEventListenerSafe(tab, 'click', () => {
                const tabName = tab.getAttribute('data-tab');
                this.modules.spotifyPlayer.switchTab(tabName);
            });
        });

        // Spotify search
        const spotifySearchBtn = document.getElementById('spotifySearchBtn');
        const spotifySearchInput = document.getElementById('spotifySearchInput');

        if (spotifySearchBtn) {
            this.addEventListenerSafe(spotifySearchBtn, 'click', () => {
                const query = spotifySearchInput?.value || '';
                this.modules.spotifyPlayer.searchTracks(query);
            });
        }

        if (spotifySearchInput) {
            this.addEventListenerSafe(spotifySearchInput, 'keypress', (e) => {
                if (e.key === 'Enter') {
                    this.modules.spotifyPlayer.searchTracks(e.target.value);
                }
            });
        }

        // Player controls
        const playPauseBtn = document.getElementById('playPauseBtn');
        if (playPauseBtn) {
            this.addEventListenerSafe(playPauseBtn, 'click', () => {
                this.modules.spotifyPlayer.togglePlayback();
            });
        }

        const prevBtn = document.getElementById('prevBtn');
        if (prevBtn) {
            this.addEventListenerSafe(prevBtn, 'click', () => {
                this.modules.spotifyPlayer.previousTrack();
            });
        }

        const nextBtn = document.getElementById('nextBtn');
        if (nextBtn) {
            this.addEventListenerSafe(nextBtn, 'click', () => {
                this.modules.spotifyPlayer.nextTrack();
            });
        }

        // Progress bar interaction
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            this.addEventListenerSafe(progressBar, 'click', (e) => {
                const rect = progressBar.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                // Note: Seeking would require additional Spotify API implementation
                console.log('Seek to:', percent * 100 + '%');
            });
        }

        console.log('MainController: Spotify events bound');
    }

    /**
     * Bind home page events
     */
    bindHomeEvents() {
        // Template cards - use event delegation since they're dynamically generated
        const templatesGrid = document.getElementById('templatesGrid');
        if (templatesGrid) {
            this.addEventListenerSafe(templatesGrid, 'click', (e) => {
                const templateCard = e.target.closest('.template-card');
                if (templateCard) {
                    const templateName = this.extractTemplateNameFromCard(templateCard);
                    if (templateName) {
                        this.modules.home.useTemplate(templateName);
                    }
                }
            });
        }

        // Recent tasks - use event delegation
        const recentTasks = document.getElementById('recentTasks');
        if (recentTasks) {
            this.addEventListenerSafe(recentTasks, 'click', (e) => {
                const taskCard = e.target.closest('.recent-task-card');
                if (taskCard) {
                    const { taskName, category } = this.extractTaskInfoFromCard(taskCard);
                    if (taskName && category) {
                        this.modules.home.useRecentTask(taskName, category);
                    }
                }
            });
        }

        // Incomplete tasks - use event delegation
        const incompleteTasks = document.getElementById('incompleteTasks');
        if (incompleteTasks) {
            this.addEventListenerSafe(incompleteTasks, 'click', (e) => {
                const taskCard = e.target.closest('.incomplete-task-card');
                if (taskCard) {
                    const taskId = this.extractTaskIdFromCard(taskCard);
                    if (taskId) {
                        this.modules.home.resumeIncompleteTask(taskId);
                    }
                }
            });
        }

        console.log('MainController: Home events bound');
    }

    /**
     * Bind global events
     */
    bindGlobalEvents() {
        // Keyboard shortcuts
        this.addEventListenerSafe(document, 'keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Page visibility changes
        this.addEventListenerSafe(document, 'visibilitychange', () => {
            if (document.visibilityState === 'hidden' && this.modules.timerController.isRunning) {
                this.modules.timerController.saveSession();
            }
        });

        // Before unload
        this.addEventListenerSafe(window, 'beforeunload', () => {
            if (this.modules.timerController.isRunning || this.modules.timerController.isPaused) {
                this.modules.timerController.saveSession();
            }
        });

        console.log('MainController: Global events bound');
    }

    /**
     * Set initial states
     */
    setInitialStates() {
        // Load theme first
        this.modules.settings.loadSettings();

        // Initialize home page
        this.modules.home.renderCarousel();
        this.modules.home.renderStats();
        this.modules.home.renderTemplates();
        this.modules.home.renderRecentTasks();
        this.modules.home.renderIncompleteTasks();

        // Initialize timer display
        this.modules.timerController.updateDisplay();
        this.modules.timerController.updateTaskDisplay();

        console.log('MainController: Initial states set');
    }

    /**
     * Show initialization error
     */
    showInitializationError(error) {
        console.error('MainController: Initialization error:', error);

        // Show fallback UI

        document.body.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; padding: 20px; text-align: center;">
                    <div class='spinner'>
                    </div>
                </div>
        `;

        // document.body.innerHTML = `
        //     <div stylaccent-primarye="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; padding: 20px; text-align: center; font-family: system-ui;">
        //         <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
        //         <h2 style="margin-bottom: 16px; color: #ef4444;">Failed to Load App</h2>
        //         <p style="margin-bottom: 24px; color: #6b7280;">Error: ${error.message}</p>
        //         <button onclick="window.location.reload()" style="background: #10b981; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px;">
        //             Reload App
        //         </button>
        //     </div>
        // `;
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(e) {
        // Don't interfere with form inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        // Global shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case '1':
                    e.preventDefault();
                    this.modules.navigation.switchTab('home');
                    break;
                case '2':
                    e.preventDefault();
                    this.modules.navigation.switchTab('timer');
                    break;
                case '3':
                    e.preventDefault();
                    this.modules.navigation.switchTab('settings');
                    break;
                case 'k':
                    e.preventDefault();
                    if (this.modules.home.showQuickStart) {
                        this.modules.home.showQuickStart();
                    }
                    break;
                case 's':
                    e.preventDefault();
                    if (this.modules.home.showStatsModal) {
                        this.modules.home.showStatsModal();
                    }
                    break;
                case 'h':
                    e.preventDefault();
                    this.modules.modal.showHistoryModal();
                    break;
                case 'd':
                    e.preventDefault();
                    this.modules.settings.toggleTheme();
                    break;
            }
        }

        // Timer controls (when on timer tab)
        if (this.modules.navigation.getCurrentTab() === 'timer') {
            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    this.modules.timerController.toggleTimer();
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.modules.timerController.stopTimer();
                    break;
            }
        }

        // Modal controls
        if (this.modules.modal.isAnyModalOpen()) {
            switch (e.key) {
                case 'Escape':
                    e.preventDefault();
                    this.modules.modal.closeCurrentModal();
                    break;
            }
        }
    }

    /**
     * Extract template name from card element
     */
    extractTemplateNameFromCard(card) {
        const nameElement = card.querySelector('.template-info h4');
        return nameElement ? nameElement.textContent.trim() : null;
    }

    /**
     * Extract task info from recent task card
     */
    extractTaskInfoFromCard(card) {
        const nameElement = card.querySelector('.task-info-content h4');
        const detailsElement = card.querySelector('.task-info-content p');

        if (!nameElement || !detailsElement) return { taskName: null, category: null };

        const taskName = nameElement.textContent.trim();
        const details = detailsElement.textContent.trim();
        const category = details.split(' • ')[0];

        return { taskName, category };
    }

    /**
     * Extract task ID from incomplete task card
     */
    extractTaskIdFromCard(card) {
        return card.dataset.taskId ? parseInt(card.dataset.taskId) : null;
    }

    /**
     * Add event listener with error handling and tracking
     */
    addEventListenerSafe(element, event, handler) {
        if (!element) {
            console.warn(`MainController: Element not found for ${event} event`);
            return;
        }

        const wrappedHandler = (e) => {
            try {
                handler(e);
            } catch (error) {
                console.error(`MainController: Error in ${event} handler:`, error);
            }
        };

        element.addEventListener(event, wrappedHandler);

        // Track for cleanup if needed
        const key = `${element.id || element.className}-${event}`;
        this.eventListeners.set(key, { element, event, handler: wrappedHandler });
    }

    /**
     * Clean up event listeners
     */
    cleanup() {
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners.clear();
        console.log('MainController: Cleaned up event listeners');
    }

    /**
     * Rebind dynamic content events
     */
    rebindDynamicEvents() {
        this.bindHomeEvents();
        console.log('MainController: Rebound dynamic events');
    }
}

// Initialize the main controller - this is the ONLY instantiation
const mainController = new MainController();