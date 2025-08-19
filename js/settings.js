// Settings Controller - Handles application settings and preferences

class SettingsController {
    constructor() {
        this.currentTheme = 'light';
        this.preferences = {};
        this.init();
    }

    // Initialize settings controller
    
    init() {
        this.loadSettings();
        console.log('SettingsController: Initialized');
    }

    // Load all settings from storage
    
    loadSettings() {
        // Load theme
        this.currentTheme = storage.getTheme();
        console.log('SettingsController: Loaded theme:', this.currentTheme);
        
        // Apply theme immediately
        this.applyTheme(this.currentTheme);
        
        // Load preferences
        this.preferences = storage.getPreferences();
        console.log('SettingsController: Loaded preferences:', this.preferences);
    }

    // Apply theme to the application
    
    applyTheme(theme) {
        console.log('SettingsController: Applying theme:', theme);
        
        // Set data attribute on body
        document.body.setAttribute('data-theme', theme);
        
        // Update current theme
        this.currentTheme = theme;
        
        // Update meta theme color for mobile browsers
        this.updateMetaThemeColor(theme);
        
        // Update theme toggle UI
        this.updateThemeToggleUI();
        
        console.log('SettingsController: Theme applied successfully');
    }

    // Update meta theme color for mobile browsers
    
    updateMetaThemeColor(theme) {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        
        metaThemeColor.content = theme === 'dark' ? '#0f172a' : '#ffffff';
    }

    // Toggle between light and dark theme
    
    toggleTheme() {
        console.log('SettingsController: Toggle theme called, current:', this.currentTheme);
        
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        
        // Apply the new theme
        this.applyTheme(newTheme);
        
        // Save to storage
        storage.saveTheme(newTheme);
        console.log('SettingsController: Theme saved to storage:', newTheme);
        
        // Show notification
        uiComponents.showNotification(`Switched to ${newTheme} theme`);
        
        // Add smooth transition effect
        this.addThemeTransition();
    }

    // Add smooth transition effect for theme change
    
    addThemeTransition() {
        document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
    }

    // Update theme toggle UI element
    
    updateThemeToggleUI() {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) {
            console.warn('SettingsController: Theme toggle element not found');
            return;
        }

        console.log('SettingsController: Updating theme toggle UI for:', this.currentTheme);
        
        if (this.currentTheme === 'dark') {
            themeToggle.classList.add('active');
        } else {
            themeToggle.classList.remove('active');
        }
    }

    // Get current theme
    
    getCurrentTheme() {
        return this.currentTheme;
    }

    // Show user history modal
    
    showHistory() {
        if (typeof modal !== 'undefined') {
            modal.showHistoryModal();
        } else {
            console.error('SettingsController: Modal module not available');
        }
    }

    // Reset all application data
    
    resetData() {
        if (typeof modal !== 'undefined') {
            modal.showResetConfirmation(() => {
                this.performDataReset();
            });
        } else {
            // Fallback confirmation
            if (confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
                this.performDataReset();
            }
        }
    }

    // Perform the actual data reset
    
    performDataReset() {
        console.log('SettingsController: Performing data reset');
        
        // Stop any running timer
        if (typeof timerController !== 'undefined') {
            timerController.resetTimer();
        }

        // Clear all data from storage
        storage.resetAllData();

        // Reset theme to light (but keep the theme preference)
        const currentTheme = this.currentTheme;
        this.applyTheme('light');
        storage.saveTheme('light');

        // Refresh all UI components
        this.refreshAllComponents();

        // Show success message
        uiComponents.showNotification('All data has been reset successfully.');
        
        // Switch to home tab
        if (typeof navigation !== 'undefined') {
            navigation.switchTab('home');
        }

        console.log('SettingsController: Data reset completed');
    }

    // Refresh all UI components after reset
    
    refreshAllComponents() {
        // Refresh home page
        if (typeof home !== 'undefined') {
            setTimeout(() => {
                home.renderCarousel();
                home.renderRecentTasks();
                home.renderIncompleteTasks();
                home.renderStats()
            }, 100);
        }

        // Reset timer display
        if (typeof timerController !== 'undefined') {
            setTimeout(() => {
                timerController.updateDisplay();
                timerController.updateTaskDisplay();
                // timerController.updateModeChip();
            }, 100);
        }
    }

    // Get current settings state
    
    getCurrentSettings() {
        return {
            theme: this.currentTheme,
            preferences: this.preferences,
            stats: storage.getStats()
        };
    }

    // Update user preferences
    
    updatePreferences(newPreferences) {
        console.log('SettingsController: Updating preferences:', newPreferences);
        
        this.preferences = { ...this.preferences, ...newPreferences };
        storage.updatePreferences(this.preferences);
        
        uiComponents.showNotification('Preferences updated successfully');
    }

    // Export user data
    
    exportData() {
        try {
            console.log('SettingsController: Exporting data');
            
            const data = storage.exportData();
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `focus-timer-backup-${new Date().toISOString().split('T')[0]}.json`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            uiComponents.showNotification('Data exported successfully');
            console.log('SettingsController: Data export completed');
        } catch (error) {
            console.error('SettingsController: Export failed:', error);
            uiComponents.showNotification('Export failed. Please try again.');
        }
    }

    // Import user data
    
    importData() {
        console.log('SettingsController: Starting data import');
        
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (event) => {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    const success = storage.importData(data);
                    
                    if (success) {
                        uiComponents.showNotification('Data imported successfully');
                        this.refreshAllComponents();
                        console.log('SettingsController: Data import completed');
                    } else {
                        uiComponents.showNotification('Import failed. Invalid data format.');
                    }
                } catch (error) {
                    console.error('SettingsController: Import failed:', error);
                    uiComponents.showNotification('Import failed. Invalid file format.');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }

    // Show advanced settings modal
    
    showAdvancedSettings() {
        const preferences = this.preferences;
        const stats = storage.getStats();
        
        const content = `
            <div style="margin-bottom: 20px;">
                <h4 style="margin-bottom: 12px; color: var(--text-primary);">
                    <i class="fas fa-cog"></i>
                    Preferences
                </h4>
                
                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600;">Default Work Duration</label>
                    <input type="number" id="defaultWorkDuration" value="${preferences.defaultWorkDuration || 25}" 
                           min="1" max="120" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color);">
                </div>
                
                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600;">Default Break Duration</label>
                    <input type="number" id="defaultBreakDuration" value="${preferences.defaultBreakDuration || 5}" 
                           min="1" max="30" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color);">
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: flex; align-items: center; gap: 8px; font-weight: 600;">
                        <input type="checkbox" id="soundEnabled" ${preferences.soundEnabled !== false ? 'checked' : ''}>
                        Enable completion sounds
                    </label>
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h4 style="margin-bottom: 12px; color: var(--text-primary);">
                    <i class="fas fa-chart-bar"></i>
                    Statistics
                </h4>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div style="background: var(--bg-secondary); padding: 12px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 20px; font-weight: bold; color: var(--accent-primary);">${stats.totalSessions || 0}</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">Total Sessions</div>
                    </div>
                    <div style="background: var(--bg-secondary); padding: 12px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 20px; font-weight: bold; color: var(--accent-secondary);">${Math.floor((stats.totalFocusTime || 0) / 60)}h</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">Focus Time</div>
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h4 style="margin-bottom: 12px; color: var(--text-primary);">
                    <i class="fas fa-download"></i>
                    Data Management
                </h4>
                
                <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                    <button onclick="settings.exportData()" style="flex: 1; padding: 8px; background: var(--gradient-secondary); color: white; border: none; border-radius: 4px;">
                        <i class="fas fa-download"></i> Export
                    </button>
                    <button onclick="settings.importData()" style="flex: 1; padding: 8px; background: var(--gradient-primary); color: white; border: none; border-radius: 4px;">
                        <i class="fas fa-upload"></i> Import
                    </button>
                </div>
            </div>
        `;

        const actions = [
            {
                text: 'Cancel',
                icon: 'fas fa-times',
                onClick: 'modal.hideCustomModal()'
            },
            {
                text: 'Save Settings',
                icon: 'fas fa-save',
                type: 'primary',
                onClick: 'settings.saveAdvancedSettings(); modal.hideCustomModal();'
            }
        ];

        if (typeof modal !== 'undefined') {
            modal.showCustomModal('Advanced Settings', content, actions);
        }
    }

    // Save advanced settings from modal
    
    saveAdvancedSettings() {
        const workDuration = parseInt(document.getElementById('defaultWorkDuration').value);
        const breakDuration = parseInt(document.getElementById('defaultBreakDuration').value);
        const soundEnabled = document.getElementById('soundEnabled').checked;

        if (workDuration < 1 || workDuration > 120) {
            uiComponents.showNotification('Work duration must be between 1 and 120 minutes');
            return;
        }

        if (breakDuration < 1 || breakDuration > 30) {
            uiComponents.showNotification('Break duration must be between 1 and 30 minutes');
            return;
        }

        const newPreferences = {
            defaultWorkDuration: workDuration,
            defaultBreakDuration: breakDuration,
            soundEnabled: soundEnabled
        };

        this.updatePreferences(newPreferences);
    }

    // Auto-detect system theme preference
    
    detectSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    // Set up system theme listener
    
    setupSystemThemeListener() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                if (this.preferences.autoTheme) {
                    const systemTheme = e.matches ? 'dark' : 'light';
                    this.applyTheme(systemTheme);
                    storage.saveTheme(systemTheme);
                    uiComponents.showNotification(`Theme auto-switched to ${systemTheme} (system preference)`);
                }
            });
        }
    }

    // Refresh settings display
    
    refreshSettings() {
        this.loadSettings();
        console.log('SettingsController: Settings refreshed');
    }

    // Validate theme value
    
    validateTheme(theme) {
        return ['light', 'dark'].includes(theme) ? theme : 'light';
    }

    // Force reload theme from storage
    
    reloadTheme() {
        const savedTheme = storage.getTheme();
        const validTheme = this.validateTheme(savedTheme);
        
        console.log('SettingsController: Reloading theme from storage:', validTheme);
        this.applyTheme(validTheme);
    }
}

window.SettingsController = SettingsController;