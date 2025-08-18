/**
 * Main Application Controller
 * Initializes and coordinates all application modules
 */
class FocusTimerApp {
    constructor() {
        this.version = '1.0.0';
        this.initialized = false;
        this.modules = {};
        // Don't auto-init since main.js will handle it
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('FocusTimerApp: Initializing...');

            // Setup global event listeners
            this.setupGlobalEventListeners();

            // Setup error handling
            this.setupErrorHandling();

            // Setup PWA features
            this.setupPWAFeatures();

            // Check for updates
            this.checkForUpdates();

            // Mark as initialized
            this.initialized = true;

            console.log('FocusTimerApp: Initialized successfully');
        } catch (error) {
            console.error('FocusTimerApp: Failed to initialize:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * Setup global event listeners
     */
    setupGlobalEventListeners() {
        // Handle online/offline status
        window.addEventListener('online', () => {
            if (typeof uiComponents !== 'undefined') {
                uiComponents.showNotification('Connection restored', 2000);
            }
        });

        window.addEventListener('offline', () => {
            if (typeof uiComponents !== 'undefined') {
                uiComponents.showNotification('You\'re offline - app will continue working', 3000);
            }
        });

        // Handle app installation
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredInstallPrompt = e;
            this.showInstallPrompt();
        });

        // Handle window focus/blur
        window.addEventListener('focus', () => {
            if (typeof timerController !== 'undefined' && (timerController.isRunning || timerController.isPaused)) {
                timerController.updateDisplay();
            }
        });

        window.addEventListener('blur', () => {
            if (typeof timerController !== 'undefined' && (timerController.isRunning || timerController.isPaused)) {
                timerController.saveSession();
            }
        });

        // Handle resize events
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));
    }

    /**
     * Setup error handling
     */
    setupErrorHandling() {
        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.handleError(event.error);
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleError(event.reason);
        });
    }

    /**
     * Setup PWA features
     */
    setupPWAFeatures() {
        // Register service worker if available
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }

        // Setup theme color meta tag
        let themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (!themeColorMeta) {
            themeColorMeta = document.createElement('meta');
            themeColorMeta.name = 'theme-color';
            themeColorMeta.content = '#ffffff';
            document.head.appendChild(themeColorMeta);
        }

        // Setup viewport meta tag for mobile
        let viewportMeta = document.querySelector('meta[name="viewport"]');
        if (!viewportMeta) {
            viewportMeta = document.createElement('meta');
            viewportMeta.name = 'viewport';
            viewportMeta.content = 'width=device-width, initial-scale=1.0, user-scalable=no';
            document.head.appendChild(viewportMeta);
        }
    }

    /**
     * Handle application errors
     */
    handleError(error) {
        console.error('Application error:', error);
        
        // Don't show error notifications for minor issues
        if (error.name === 'NetworkError' || error.message.includes('fetch')) {
            return;
        }

        if (typeof uiComponents !== 'undefined') {
            uiComponents.showNotification('Something went wrong. Please refresh the page.', 5000);
        }
    }

    /**
     * Handle initialization errors
     */
    handleInitializationError(error) {
        console.error('Initialization error:', error);
        
        // Show fallback UI
        document.body.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; padding: 20px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
                <h2 style="margin-bottom: 16px;">Failed to Load App</h2>
                <p style="margin-bottom: 24px; color: #666;">There was an error loading the Focus Timer app.</p>
                <button onclick="window.location.reload()" style="background: #10b981; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer;">
                    Reload App
                </button>
            </div>
        `;
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Update any size-dependent calculations
        if (typeof timerController !== 'undefined' && timerController.currentTask) {
            timerController.updateDisplay();
        }
    }

    /**
     * Show PWA install prompt
     */
    showInstallPrompt() {
        
        if (!this.deferredInstallPrompt) return;
        
        const content = `
        <div style="text-align: center; padding: 20px 0;">
        <div style="width: 80px; height: 80px; background: var(--gradient-primary); border-radius: 20px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 32px; color: white;">
        <i class="fas fa-mobile-alt"></i>
        </div>
        <h3 style="margin-bottom: 12px;">Install Focus Timer</h3>
        <p style="color: var(--text-secondary); margin-bottom: 20px; line-height: 1.5;">
        Install Focus Timer on your device for quick access and a native app experience. 
        Works offline and starts faster!
        </p>
        </div>
        `;
        
        const actions = [
            {
                text: 'Maybe Later',
                icon: 'fas fa-times',
                type: 'muted',
                onClick: 'app.dismissInstallPrompt(); modal.hideCustomModal();'
            },
            {
                text: 'Install App',
                icon: 'fas fa-download',
                type: 'primary',
                onClick: 'app.installApp(); modal.hideCustomModal();'
            }
        ];
        
        if (typeof modal !== 'undefined') {
            modal.showCustomModal('Install App', content, actions);
        }
    }

    /**
     * Install the PWA
     */
    async installApp() {
        if (!this.deferredInstallPrompt) return;

        try {
            const result = await this.deferredInstallPrompt.prompt();
            console.log('Install prompt result:', result);
            
            if (result.outcome === 'accepted') {
                if (typeof uiComponents !== 'undefined') {
                    uiComponents.showNotification('App installed successfully!');
                }
            }
        } catch (error) {
            console.error('Install failed:', error);
            if (typeof uiComponents !== 'undefined') {
                uiComponents.showNotification('Install failed. Please try again.');
            }
        }

        this.deferredInstallPrompt = null;
    }

    /**
     * Dismiss install prompt
     */
    dismissInstallPrompt() {
        this.deferredInstallPrompt = null;
        localStorage.setItem('installPromptDismissed', Date.now().toString());
    }

    /**
     * Check for app updates
     */
    async checkForUpdates() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.ready;
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showUpdatePrompt();
                        }
                    });
                });
            } catch (error) {
                console.log('Update check failed:', error);
            }
        }
    }

    /**
     * Show update prompt
     */
    showUpdatePrompt() {
        const content = `
            <div style="text-align: center; padding: 20px 0;">
                <div style="width: 60px; height: 60px; background: var(--gradient-secondary); border-radius: 15px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; font-size: 24px; color: white;">
                    <i class="fas fa-sync-alt"></i>
                </div>
                <h3 style="margin-bottom: 12px;">Update Available</h3>
                <p style="color: var(--text-secondary); margin-bottom: 20px;">
                    A new version of Focus Timer is available with improvements and bug fixes.
                </p>
            </div>
        `;

        const actions = [
            {
                text: 'Later',
                icon: 'fas fa-times',
                onClick: 'modal.hideCustomModal()'
            },
            {
                text: 'Update Now',
                icon: 'fas fa-download',
                type: 'primary',
                onClick: 'app.applyUpdate(); modal.hideCustomModal();'
            }
        ];

        if (typeof modal !== 'undefined') {
            modal.showCustomModal('Update Available', content, actions);
        }
    }

    /**
     * Apply app update
     */
    async applyUpdate() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.ready;
                if (registration.waiting) {
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                }
            } catch (error) {
                console.error('Update failed:', error);
                if (typeof uiComponents !== 'undefined') {
                    uiComponents.showNotification('Update failed. Please refresh manually.');
                }
            }
        }
    }

    /**
     * Get app information
     */
    getAppInfo() {
        return {
            version: this.version,
            initialized: this.initialized,
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            online: navigator.onLine,
            storage: {
                localStorage: !!window.localStorage,
                sessionStorage: !!window.sessionStorage,
                indexedDB: !!window.indexedDB
            },
            features: {
                serviceWorker: 'serviceWorker' in navigator,
                notifications: 'Notification' in window,
                vibration: 'vibrate' in navigator,
                fullscreen: !!document.documentElement.requestFullscreen
            }
        };
    }

    /**
     * Debounce utility function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Export app state for debugging
     */
    exportState() {
        const state = {
            app: this.getAppInfo(),
            storage: typeof storage !== 'undefined' ? storage.getState() : null,
            timer: typeof timerController !== 'undefined' ? {
                currentTask: timerController.currentTask,
                isRunning: timerController.isRunning,
                isPaused: timerController.isPaused,
                timeRemaining: timerController.timeRemaining,
                currentMode: timerController.currentMode
            } : null,
            navigation: typeof navigation !== 'undefined' ? {
                currentTab: navigation.getCurrentTab(),
                tabHistory: navigation.getTabHistory()
            } : null,
            settings: typeof settings !== 'undefined' ? settings.getCurrentSettings() : null
        };
        
        console.log('App state exported:', state);
        return state;
    }
}

// Export the class, don't instantiate yet
window.FocusTimerApp = FocusTimerApp;