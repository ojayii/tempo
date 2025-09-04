/**
 * Main Application Controller
 * Initializes and coordinates all application modules
 */
class FocusTimerApp {
    constructor() {
        this.version = '1.0.0';
        this.initialized = false;
        this.modules = {};
        this.deferredInstallPrompt = null;
        this.installPromptFired = false;
        this.userHasInteracted = false;
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
        // Enhanced beforeinstallprompt handler
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('beforeinstallprompt event fired!');
            e.preventDefault();
            this.deferredInstallPrompt = e;
            this.installPromptFired = true;
            
            // Optional: Show install button immediately if you have one in UI
            this.updateInstallButtonVisibility();
        });

        window.addEventListener('appinstalled', () => {
            console.log('App was installed successfully!');
            this.deferredInstallPrompt = null;
            this.installPromptFired = false;
            
            if (typeof uiComponents !== 'undefined') {
                uiComponents.showNotification('App installed successfully! 🎉', 3000);
            }
            
            // Hide install button if you have one
            this.updateInstallButtonVisibility();
        });

        // Track user interaction to help with install prompt timing
        const trackInteraction = () => {
            if (!this.userHasInteracted) {
                this.userHasInteracted = true;
                console.log('👆 User interaction detected - install prompt may now be available');
            }
        };

        document.addEventListener('click', trackInteraction, { once: true });
        document.addEventListener('keydown', trackInteraction, { once: true });
        document.addEventListener('touchstart', trackInteraction, { once: true });

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
                    // Create a minimal service worker if registration fails
                    this.createMinimalServiceWorker();
                });
        }

        // Setup theme color meta tag
        let themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (!themeColorMeta) {
            themeColorMeta = document.createElement('meta');
            themeColorMeta.name = 'theme-color';
            themeColorMeta.content = '#10b981';
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

        // Check if manifest is linked
        const manifestLink = document.querySelector('link[rel="manifest"]');
        if (!manifestLink) {
            console.warn('No manifest link found. PWA installation may not work.');
        }

        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
            console.log('App is running as installed PWA');
        }
    }

    /**
     * Create a minimal service worker if none exists
     */
    async createMinimalServiceWorker() {
        try {
            const swCode = `
                console.log('Minimal service worker loaded');
                
                self.addEventListener('install', (event) => {
                    console.log('SW: Install event');
                    self.skipWaiting();
                });
                
                self.addEventListener('activate', (event) => {
                    console.log('SW: Activate event');
                    event.waitUntil(clients.claim());
                });
                
                self.addEventListener('fetch', (event) => {
                    // Let browser handle all fetch requests normally
                    return;
                });
            `;
            
            const blob = new Blob([swCode], { type: 'application/javascript' });
            const swUrl = URL.createObjectURL(blob);
            
            const registration = await navigator.serviceWorker.register(swUrl);
            console.log('Minimal service worker created and registered');
            
            // Clean up
            URL.revokeObjectURL(swUrl);
            
        } catch (error) {
            console.error('Failed to create minimal service worker:', error);
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
     * Check if PWA installation is available
     */
    canInstallPWA() {
        // Check if install prompt is available
        if (this.deferredInstallPrompt) {
            return true;
        }

        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
            return false;
        }

        // Check if running on HTTPS or localhost
        const isSecure = location.protocol === 'https:' || location.hostname === 'localhost';
        if (!isSecure) {
            console.warn('PWA installation requires HTTPS or localhost');
            return false;
        }

        // Check if service worker is supported
        if (!('serviceWorker' in navigator)) {
            console.warn('Service Worker not supported');
            return false;
        }

        // Check if beforeinstallprompt is supported
        if (!('onbeforeinstallprompt' in window)) {
            console.warn('beforeinstallprompt not supported');
            return false;
        }

        return true;
    }

    /**
     * Show PWA install prompt - FIXED VERSION
     */
    showInstallPrompt() {
        console.log('showInstallPrompt called');
        console.log('Deferred prompt available:', !!this.deferredInstallPrompt);
        console.log('User has interacted:', this.userHasInteracted);
        console.log('Install prompt fired:', this.installPromptFired);

        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
            console.log('App is already installed');
            if (typeof uiComponents !== 'undefined') {
                uiComponents.showNotification('App is already installed!', 3000);
            }
            return;
        }

        // If we have the deferred prompt, use it directly
        if (this.deferredInstallPrompt) {
            console.log('Using deferred install prompt');
            this.installApp();
            return;
        }

        // If we don't have the deferred prompt yet, show the modal anyway
        // This covers cases where the prompt hasn't fired yet but user wants to install
        console.log('No deferred prompt yet, showing install info modal');

        const content = `
            <div style="text-align: center; padding: 20px 0;">
                <div style="width: 80px; height: 80px; background: var(--gradient-primary); border-radius: 20px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 32px; color: white;">
                    <i class="fas fa-mobile-alt"></i>
                </div>
                <h3 style="margin-bottom: 12px;">Install Tempo</h3>
                <p style="color: var(--text-secondary); margin-bottom: 20px; line-height: 1.5;">
                    ${this.deferredInstallPrompt ? 
                        'Install Tempo on your device for quick access and a native app experience. Works offline and starts faster!' :
                        'To install this app, use your browser\'s install option (usually in the address bar or menu). Or wait a moment and try again - the install prompt may become available shortly.'
                    }
                </p>
                ${!this.canInstallPWA() ? `
                    <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px; margin: 16px 0; text-align: left;">
                        <strong style="color: #92400e;">Requirements for installation:</strong>
                        <ul style="margin: 8px 0 0 16px; color: #92400e; font-size: 0.9rem;">
                            <li>Must be served over HTTPS (or localhost)</li>
                            <li>Requires a compatible browser (Chrome, Edge, etc.)</li>
                            <li>App must not already be installed</li>
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
        
        const actions = [
            {
                text: 'Maybe Later',
                icon: 'fas fa-times',
                type: 'muted',
                onClick: 'app.dismissInstallPrompt(); modal.hideCustomModal();'
            }
        ];

        // Only show install button if we have the deferred prompt
        if (this.deferredInstallPrompt) {
            actions.push({
                text: 'Install App',
                icon: 'fas fa-download',
                type: 'primary',
                onClick: 'app.installApp(); modal.hideCustomModal();'
            });
        } else {
            actions.push({
                text: 'Try Again',
                icon: 'fas fa-redo',
                type: 'primary',
                onClick: 'app.retryInstallPrompt(); modal.hideCustomModal();'
            });
        }
        
        if (typeof modal !== 'undefined') {
            modal.showCustomModal('Install App', content, actions);
        } else {
            // Fallback if modal is not available
            if (this.deferredInstallPrompt) {
                this.installApp();
            } else {
                alert('Install option not ready yet. Please try again in a moment or use your browser\'s install option.');
            }
        }
    }

    /**
     * Retry install prompt after a delay
     */
    retryInstallPrompt() {
        console.log('Retrying install prompt...');
        
        // Wait a bit and try again
        setTimeout(() => {
            this.showInstallPrompt();
        }, 1000);
    }

    /**
     * Install the PWA - IMPROVED VERSION
     */
    async installApp() {
        console.log('📲 installApp called');
        
        if (!this.deferredInstallPrompt) {
            console.log('No deferred install prompt available');
            
            // Provide helpful feedback
            if (typeof uiComponents !== 'undefined') {
                if (window.matchMedia('(display-mode: standalone)').matches) {
                    uiComponents.showNotification('App is already installed!', 3000);
                } else {
                    uiComponents.showNotification('Install option not ready yet. Please try again in a moment.', 4000);
                }
            }
            return;
        }

        try {
            console.log('Showing install prompt...');
            const result = await this.deferredInstallPrompt.prompt();
            console.log('Install prompt result:', result);
            
            if (result.outcome === 'accepted') {
                console.log('User accepted the install prompt!');
                if (typeof uiComponents !== 'undefined') {
                    uiComponents.showNotification('Installing app...', 2000);
                }
            } else {
                console.log('User dismissed the install prompt');
                if (typeof uiComponents !== 'undefined') {
                    uiComponents.showNotification('Installation cancelled', 2000);
                }
            }
        } catch (error) {
            console.error('Install failed:', error);
            if (typeof uiComponents !== 'undefined') {
                uiComponents.showNotification('Install failed. Please try again.', 3000);
            }
        }

        // Clear the deferred prompt
        this.deferredInstallPrompt = null;
    }

    /**
     * Dismiss install prompt
     */
    dismissInstallPrompt() {
        console.log('Install prompt dismissed by user');
        this.deferredInstallPrompt = null;
        localStorage.setItem('installPromptDismissed', Date.now().toString());
    }

    /**
     * Update install button visibility (if you have one in your UI)
     */
    updateInstallButtonVisibility() {
        const installButton = document.querySelector('[data-install-button]');
        if (installButton) {
            const canInstall = this.canInstallPWA() && this.deferredInstallPrompt;
            installButton.style.display = canInstall ? 'block' : 'none';
        }
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
            installPromptFired: this.installPromptFired,
            deferredPromptAvailable: !!this.deferredInstallPrompt,
            userHasInteracted: this.userHasInteracted,
            canInstall: this.canInstallPWA(),
            isInstalled: window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true,
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