// Navigation Controller - Handles tab switching and navigation

class NavigationController {
    constructor() {
        this.currentTab = 'home';
        this.tabHistory = ['home'];
        this.init();
    }

    // Initialize navigation
    
    init() {
        this.setupNavigation();
        this.handleUrlNavigation();
    }

    // Setup navigation event listeners
    
    setupNavigation() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.bindNavigationEvents());
        } else {
            this.bindNavigationEvents();
        }

        // Handle back button
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.tab) {
                this.switchTab(e.state.tab, false);
            }
        });

        // Handle keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        this.switchTab('home');
                        break;
                    case '2':
                        e.preventDefault();
                        this.switchTab('timer');
                        break;
                    case '3':
                        e.preventDefault();
                        this.switchTab('settings');
                        break;
                }
            }
        });
    }

    // Bind navigation events to DOM elements
    
    bindNavigationEvents() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach((item, index) => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = item.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });
    }

    // Handle URL-based navigation
    
    handleUrlNavigation() {
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab');
        
        if (tabParam && ['home', 'timer', 'settings'].includes(tabParam)) {
            this.switchTab(tabParam, false);
        }
    }

    // Switch to specified tab
    
    switchTab(tabName, updateHistory = true) {
        if (!tabName || tabName === this.currentTab) return;

        const validTabs = ['home', 'timer', 'settings'];
        if (!validTabs.includes(tabName)) {
            console.warn(`Invalid tab name: ${tabName}`);
            return;
        }

        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Show selected tab
        const targetTab = document.getElementById(`${tabName}Tab`);
        if (targetTab) {
            targetTab.classList.add('active');
            uiComponents.animateIn(targetTab);
        }

        // Update navigation active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        const activeNavItem = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }

        // Update current tab
        const previousTab = this.currentTab;
        this.currentTab = tabName;

        // Add to tab history
        if (updateHistory) {
            this.tabHistory.push(tabName);
            
            // Keep history length reasonable
            if (this.tabHistory.length > 10) {
                this.tabHistory.shift();
            }

            // Update URL without full page reload
            const newUrl = new URL(window.location);
            newUrl.searchParams.set('tab', tabName);
            window.history.pushState({ tab: tabName }, '', newUrl);
        }

        // Handle tab-specific initialization
        this.handleTabSwitch(tabName, previousTab);

        // Fire custom event
        const event = new CustomEvent('tabChanged', {
            detail: { 
                from: previousTab, 
                to: tabName,
                timestamp: Date.now()
            }
        });
        document.dispatchEvent(event);
    }

    // Handle tab-specific logic when switching
    
    handleTabSwitch(newTab, previousTab) {
        switch (newTab) {
            case 'home':
                // Refresh home data when switching to home
                if (typeof home !== 'undefined') {
                    home.refreshData();
                }
                break;

            case 'timer':
                // Update timer display when switching to timer
                if (typeof timerController !== 'undefined') {
                    timerController.updateDisplay();
                    timerController.updateTaskDisplay();
                    // timerController.updateModeChip();
                }
                break;

            case 'settings':
                // Update settings when switching to settings
                if (typeof settings !== 'undefined') {
                    settings.refreshSettings();
                }
                break;
        }

        // Handle specific transitions
        if (previousTab === 'timer' && newTab !== 'timer') {
            // Save timer state when leaving timer tab
            if (typeof timerController !== 'undefined' && 
                (timerController.isRunning || timerController.isPaused)) {
                timerController.saveSession();
            }
        }
    }

    // Go back to previous tab
    
    goBack() {
        if (this.tabHistory.length > 1) {
            // Remove current tab from history
            this.tabHistory.pop();
            
            // Get previous tab
            const previousTab = this.tabHistory[this.tabHistory.length - 1];
            
            // Switch to previous tab without adding to history
            this.switchTab(previousTab, false);
        }
    }

    // Get current tab
    
    getCurrentTab() {
        return this.currentTab;
    }

    // Check if tab is active
    
    isTabActive(tabName) {
        return this.currentTab === tabName;
    }

    // Get tab history
    
    getTabHistory() {
        return [...this.tabHistory];
    }

    // Clear tab history
    
    clearHistory() {
        this.tabHistory = [this.currentTab];
    }

    // Navigate to tab with animation
    
    navigateWithAnimation(tabName, animation = 'slide') {
        const currentTabElement = document.querySelector('.tab-content.active');
        const targetTabElement = document.getElementById(`${tabName}Tab`);

        if (!currentTabElement || !targetTabElement) {
            this.switchTab(tabName);
            return;
        }

        // Animate out current tab
        uiComponents.animateOut(currentTabElement, () => {
            // Switch tabs
            this.switchTab(tabName, true);
        });
    }

    // Set up PWA-style navigation
    
    setupPWANavigation() {
        // Handle hardware back button on mobile
        if ('serviceWorker' in navigator) {
            window.addEventListener('beforeinstallprompt', (e) => {
                // Prevent Chrome 67 and earlier from automatically showing the prompt
                e.preventDefault();
                
                // Store the event so it can be triggered later
                this.deferredPrompt = e;
                
                // Show custom install button if needed
                this.showInstallPrompt();
            });
        }

        // Handle app state changes
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                // App became visible, refresh current tab if needed
                this.handleTabSwitch(this.currentTab, this.currentTab);
            }
        });
    }

    // Show install prompt for PWA
    
    showInstallPrompt() {
        // This would show a custom install prompt
        // Implementation depends on specific PWA requirements
        console.log('PWA install prompt available');
    }

    // Handle deep linking
    
    handleDeepLink(link) {
        const linkParts = link.split('/');
        const tabName = linkParts[0];
        const action = linkParts[1];
        const params = linkParts.slice(2);

        if (['home', 'timer', 'settings'].includes(tabName)) {
            this.switchTab(tabName);

            // Handle specific actions within tabs
            switch (action) {
                case 'start':
                    if (tabName === 'timer' && params[0]) {
                        // Start specific template
                        if (typeof home !== 'undefined') {
                            home.useTemplate(params[0]);
                        }
                    }
                    break;
                case 'settings':
                    if (tabName === 'settings' && params[0]) {
                        // Open specific settings section
                        if (typeof settings !== 'undefined') {
                            settings.openSection(params[0]);
                        }
                    }
                    break;
            }
        }
    }

    // Generate shareable link for current state
    
    generateShareableLink() {
        const baseUrl = window.location.origin + window.location.pathname;
        const params = new URLSearchParams();
        
        params.set('tab', this.currentTab);
        
        // Add tab-specific parameters
        if (this.currentTab === 'timer' && typeof timerController !== 'undefined' && timerController.currentTask) {
            params.set('task', timerController.currentTask.name);
        }
        
        return `${baseUrl}?${params.toString()}`;
    }
}

window.NavigationController = NavigationController;