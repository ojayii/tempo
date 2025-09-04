// Storage Manager - Handles all localStorage operations
// Designed for easy migration to remote database

class StorageManager {
    constructor() {
        this.storageKey = 'focusTimer';
        this.sessionKey = 'activeSession';
        this.themeKey = 'theme';
    }

    // Get the complete application state
    
    getState() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            return saved ? JSON.parse(saved) : this.getDefaultState();
        } catch (error) {
            console.error('Error loading state:', error);
            return this.getDefaultState();
        }
    }

    // Save the complete application state
    
    saveState(state) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(state));
            return true;
        } catch (error) {
            console.error('Error saving state:', error);
            return false;
        }
    }

    // Get default state structure
    
    getDefaultState() {
        return {
            history: [],
            incompleteTasks: [],
            preferences: {
                defaultWorkDuration: 25,
                defaultBreakDuration: 5,
                soundEnabled: true
            },
            stats: {
                totalSessions: 0,
                totalFocusTime: 0,
                longestStreak: 0
            }
        };
    }

    // Get user's session history
    
    getHistory() {
        const state = this.getState();
        return state.history || [];
    }

    // Add entry to history
    
    addToHistory(task, duration, completed = true) {
        const state = this.getState();
        const entry = {
            id: Date.now(),
            task: task.name,
            category: task.category,
            duration: duration,
            completedAt: new Date().toISOString(),
            completed: completed,
            workDuration: task.workDuration,
            breakDuration: task?.breakDuration
        };

        state.history = state.history || [];
        state.history.unshift(entry);

        // Keep only last 100 entries
        if (state.history.length > 100) {
            state.history.splice(100);
        }

        // Update stats
        if (completed) {
            state.stats = state.stats || {};
            state.stats.totalSessions = (state.stats.totalSessions || 0) + 1;
            state.stats.totalFocusTime = (state.stats.totalFocusTime || 0) + duration;
        }

        const saved = this.saveState(state);
        console.log('Saved to storage:', saved, 'Entry:', entry);
        return entry;
    }

    // Get incomplete tasks
    
    getIncompleteTasks() {
        const state = this.getState();
        return state.incompleteTasks || [];
    }

    // Save incomplete task
    
    saveIncompleteTask(task, timeRemaining, mode) {
        const state = this.getState();
        state.incompleteTasks = state.incompleteTasks || [];

        // Remove existing incomplete task with same name
        state.incompleteTasks = state.incompleteTasks.filter(t => t.task.name !== task.name);

        // Add new incomplete task
        const totalTimeForTask = task.workDuration * 60;
        const timeSpent = totalTimeForTask - timeRemaining;
        
        const incompleteTask = {
            id: Date.now(),
            task: task,
            timeRemaining: timeRemaining,
            mode: mode,
            savedAt: new Date().toISOString(),
            totalTimeSpent: timeSpent
        };

        state.incompleteTasks.unshift(incompleteTask);

        // Keep only last 10 incomplete tasks
        if (state.incompleteTasks.length > 10) {
            state.incompleteTasks.splice(10);
        }

        const saved = this.saveState(state);
        console.log('Saved incomplete task to storage:', saved, 'Task:', incompleteTask);
        console.log('Updated state:', state);
        return incompleteTask;
    }

    // Remove incomplete task
    
    removeIncompleteTask(taskId) {
        const state = this.getState();
        state.incompleteTasks = (state.incompleteTasks || []).filter(t => t.id !== taskId);
        this.saveState(state);
    }

    // Get user preferences
    
    getPreferences() {
        const state = this.getState();
        return state.preferences || {};
    }

    // Update user preferences
    
    updatePreferences(newPreferences) {
        const state = this.getState();
        state.preferences = { ...state.preferences, ...newPreferences };
        this.saveState(state);
    }

    // Save active session for crash recovery
    
    saveActiveSession(sessionData) {
        try {
            localStorage.setItem(this.sessionKey, JSON.stringify({
                ...sessionData,
                timestamp: Date.now()
            }));
        } catch (error) {
            console.error('Error saving active session:', error);
        }
    }

    // Get active session for crash recovery
    
    getActiveSession() {
        try {
            const saved = localStorage.getItem(this.sessionKey);
            return saved ? JSON.parse(saved) : null;
        } catch (error) {
            console.error('Error loading active session:', error);
            return null;
        }
    }

    // Clear active session
    
    clearActiveSession() {
        localStorage.removeItem(this.sessionKey);
    }

    // Get theme preference
    
    getTheme() {
        return localStorage.getItem(this.themeKey) || 'light';
    }

    // Save theme preference
    
    saveTheme(theme) {
        localStorage.setItem(this.themeKey, theme);
    }

    // Get user statistics
    
    getStats() {
        const state = this.getState();
        return state.stats || {};
    }

    // Reset all data
    
    resetAllData() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.sessionKey);
        // Keep theme preference
        return true;
    }

    // Export data for backup
    
    exportData() {
        const state = this.getState();
        return {
            ...state,
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };
    }

    // Import data from backup
    
    importData(data) {
        try {
            // Validate data structure
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid data format');
            }

            // Merge with current state to preserve any new fields
            const currentState = this.getState();
            const mergedState = {
                ...currentState,
                ...data,
                importedAt: new Date().toISOString()
            };

            this.saveState(mergedState);
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
}

window.StorageManager = StorageManager;