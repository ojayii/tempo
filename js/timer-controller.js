/**
 * Timer Controller
 * Pause = Break Mode | Play During Break = Resume Focus | Break Completion = Alert + Focus Ready
 */
class TimerController {
    constructor() {
        this.currentTask = null;
        this.isRunning = false;
        this.isPaused = false;
        this.currentMode = 'focus'; // 'focus' or 'break'
        this.focusTimeRemaining = 0; // Focus time left
        this.breakTimeRemaining = 0; // Break time left
        this.intervalId = null;
        this.startTime = null;
        
        this.init();
    }

    /**
     * Initialize timer controller
     */
    init() {
        this.restoreSession();
        this.updateDisplay();
        this.setupEventListeners();
        console.log('TimerController: Initialized with new logic');
    }

    /**
     * Setup event listeners for page visibility and unload
     */
    setupEventListeners() {
        // Handle page visibility change for session persistence
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden' && (this.isRunning || this.isPaused)) {
                this.saveSession();
            }
        });

        // Handle beforeunload for session persistence
        window.addEventListener('beforeunload', () => {
            if (this.isRunning || this.isPaused) {
                this.saveSession();
            }
        });
    }

    /**
     * Start a new task
     */
    startTask(task) {
        console.log('TimerController: Starting new task:', task.name);
        this.currentTask = task;
        this.focusTimeRemaining = task.workDuration * 60;
        this.breakTimeRemaining = task?.breakDuration * 60;
        this.currentMode = 'focus';
        this.isRunning = false;
        this.isPaused = false;
        
        this.updateDisplay();
        this.updateTaskDisplay();
        this.enableControls();
        this.saveSession();
        
        console.log('TimerController: Task ready to start');
    }

    /**
     * Resume an incomplete task
     */
    resumeTask(incompleteTask) {
        console.log('TimerController: Resuming incomplete task:', incompleteTask.task.name);
        this.currentTask = incompleteTask.task;
        this.focusTimeRemaining = incompleteTask.timeRemaining;
        this.breakTimeRemaining = incompleteTask.task?.breakDuration * 60;
        this.currentMode = 'focus'; // Always resume in focus mode
        this.isRunning = false;
        this.isPaused = false;
        
        this.updateDisplay();
        this.updateTaskDisplay();
        this.enableControls();
        
        // Remove from incomplete tasks
        if (typeof storage !== 'undefined') {
            storage.removeIncompleteTask(incompleteTask.id);
        }
        
        console.log('TimerController: Task resumed in focus mode');
    }

    toggleTimer() {
        if (!this.currentTask) {
            console.log('TimerController: No task set');
            return;
        }

        console.log('TimerController: Toggle called - isRunning:', this.isRunning, 'currentMode:', this.currentMode, 'isPaused:', this.isPaused);

        if (this.currentMode === 'break' && this.isRunning) {
            // Break is actively running - clicking pause/play should CANCEL BREAK and go to focus
            console.log('TimerController: Break is running - CANCELLING break and switching to focus');
            this.cancelBreakAndResumeFocus();
        } else if (this.currentMode === 'focus' && this.isRunning) {
            // Focus is actively running - clicking pause should START BREAK
            console.log('TimerController: Focus is running - PAUSING and starting break');
            this.pauseAndStartBreak();
        } else if (this.currentMode === 'focus' && !this.isRunning) {
            // Focus is paused/stopped - clicking play should START FOCUS
            console.log('TimerController: Focus is paused - STARTING focus');
            this.startFocus();
        } else {
            console.log('TimerController: Unexpected state - mode:', this.currentMode, 'isRunning:', this.isRunning);
        }
    }

    pauseAndStartBreak() {
        console.log('TimerController: PAUSE clicked - switching to break mode');
        
        // Stop current focus timer
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        // Update states FIRST
        this.isRunning = false;
        this.isPaused = true;
        this.currentMode = 'break';
        
        // Reset break time to full duration
        this.breakTimeRemaining = this.currentTask?.breakDuration * 60;
        
        console.log('TimerController: Switched to break mode. Break time:', this.breakTimeRemaining);
        
        // Auto-start break countdown
        this.startBreakCountdown();
        
        this.updateDisplay();
        this.updateControls();
        this.saveSession();
        
        if (typeof uiComponents !== 'undefined') {
            uiComponents.showNotification('Break started! Take a moment to relax.', 3000);
        }
    }

    cancelBreakAndResumeFocus() {
        console.log('TimerController: CANCELLING BREAK - returning to focus mode');
        
        // Stop break timer
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        // Switch back to focus mode (focus time remains where it was)
        this.currentMode = 'focus';
        this.isRunning = false;
        this.isPaused = false;
        
        // Reset break time (break progress is never saved)
        this.breakTimeRemaining = this.currentTask?.breakDuration * 60;
        
        console.log('TimerController: Switched to focus mode. Focus time remaining:', this.focusTimeRemaining);
        
        this.updateDisplay();
        this.updateControls();
        this.saveSession();
        
        if (typeof uiComponents !== 'undefined') {
            uiComponents.showNotification('Back to focus mode.', 3000);
        }
    }

    /**
     * START FOCUS = Begin focus countdown
     */
    startFocus() {
        console.log('TimerController: Starting focus countdown');
        
        this.isRunning = true;
        this.isPaused = false;
        this.currentMode = 'focus';
        this.startTime = Date.now();

        this.intervalId = setInterval(() => {
            this.focusTimeRemaining--;
            this.updateDisplay();

            if (this.focusTimeRemaining <= 0) {
                this.completeFocusSession();
            }
        }, 1000);

        this.updateControls();
        this.saveSession();
        
        if (typeof uiComponents !== 'undefined') {
            uiComponents.showNotification('Focus session active! Stay concentrated.', 3000);
        }
    }

    startBreakCountdown() {
        console.log('TimerController: Starting break countdown for', this.breakTimeRemaining, 'seconds');
        
        // Mark as running (break countdown is active)
        this.isRunning = true;
        this.startTime = Date.now();

        this.intervalId = setInterval(() => {
            this.breakTimeRemaining--;
            this.updateDisplay();

            if (this.breakTimeRemaining <= 0) {
                this.completeBreak();
            }
        }, 1000);
        
        // Update controls to show pause button during break
        this.updateControls();
    }

    /**
     * Break time completed
     */
    completeBreak() {
        console.log('TimerController: Break completed');
        
        // Stop break timer
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        this.isRunning = false;
        this.isPaused = false;
        
        // Switch back to focus mode but keep it paused
        this.currentMode = 'focus';
        this.breakTimeRemaining = this.currentTask?.breakDuration * 60; // Reset break time
        
        // Play alert sound
        this.playAlert();
        
        this.updateDisplay();
        this.updateControls();
        this.saveSession();
        
        if (typeof uiComponents !== 'undefined') {
            uiComponents.showNotification('Break time is over! Ready to focus again?', 5000);
        }
    }

    /**
     * Focus session completed
     */
    completeFocusSession() {
        console.log('TimerController: Focus session completed');
        
        this.isRunning = false;

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        if (this.currentTask) {
            // Add to history as completed
            if (typeof storage !== 'undefined') {
                const historyEntry = storage.addToHistory(this.currentTask, this.currentTask.workDuration, true);
                console.log('TimerController: Added to history:', historyEntry);
            }
            
            // Play completion sound
            this.playAlert();
            
            // Show congratulations modal
            setTimeout(() => {
                if (typeof modal !== 'undefined') {
                    modal.showCongratulations();
                } else {
                    console.error('TimerController: Modal not available');
                }
            }, 500);
            
            if (typeof uiComponents !== 'undefined') {
                uiComponents.showNotification('Congratulations! Session completed successfully!', 5000);
            }
        }

        this.resetTimer();
        
        // Refresh home page to show new completion
        setTimeout(() => {
            if (typeof home !== 'undefined') {
                home.renderRecentTasks();
                home.renderCarousel();
                home.renderStats();
                home.renderIncompleteTasks();
            }
        }, 100);
    }

    /**
     * Stop the timer
     */
    stopTimer() {
        console.log('TimerController: Stop timer clicked');
        
        const wasActive = this.isRunning || this.isPaused;
        
        this.isRunning = false;
        this.isPaused = false;

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        // Save incomplete task if there was progress in FOCUS mode only
        if (this.currentTask && wasActive && this.currentMode === 'focus') {
            const totalFocusTime = this.currentTask.workDuration * 60;
            const timeSpent = totalFocusTime - this.focusTimeRemaining;
            
            console.log('TimerController: Stopping task:', {
                task: this.currentTask.name,
                timeSpent: timeSpent,
                focusTimeRemaining: this.focusTimeRemaining,
                totalFocusTime: totalFocusTime,
                mode: this.currentMode
            });
            
            // Only save if worked for more than 1 minute
            if (timeSpent > 60) {
                if (typeof storage !== 'undefined') {
                    const incompleteTask = storage.saveIncompleteTask(this.currentTask, this.focusTimeRemaining, 'focus');
                    console.log('TimerController: Saved incomplete task:', incompleteTask);
                    
                    if (typeof uiComponents !== 'undefined') {
                        uiComponents.showNotification('Progress saved! You can continue later from the home tab.', 4000);
                    }
                    
                    // Refresh home page to show incomplete task
                    setTimeout(() => {
                        if (typeof home !== 'undefined') {
                            home.renderIncompleteTasks();
                        }
                    }, 100);
                }
            } else {
                if (typeof uiComponents !== 'undefined') {
                    uiComponents.showNotification('Task stopped.', 2000);
                }
            }
        } else {
            if (typeof uiComponents !== 'undefined') {
                uiComponents.showNotification('Task stopped.', 2000);
            }
        }

        this.resetTimer();
        
        if (typeof storage !== 'undefined') {
            storage.clearActiveSession();
        }
    }

    /**
     * Reset timer state
     */
    resetTimer() {
        console.log('TimerController: Resetting timer');
        
        this.currentTask = null;
        this.focusTimeRemaining = 0;
        this.breakTimeRemaining = 0;
        this.currentMode = 'focus';
        this.isRunning = false;
        this.isPaused = false;
        
        this.updateDisplay();
        this.updateTaskDisplay();
        this.disableControls();
    }

    /**
     * Update timer display with NEW VISUAL LOGIC
     */
    updateDisplay() {
        const timerTime = document.getElementById('timerTime');
        const timerLabel = document.getElementById('timerLabel');
        const progressContainer = document.getElementById('progressContainer');

        if (!timerTime) return;

        let displayTime, totalTime, progress, progressColor, labelText;

        if (this.currentMode === 'focus') {
            // FOCUS MODE - GREEN
            displayTime = this.focusTimeRemaining;
            totalTime = this.currentTask ? this.currentTask.workDuration * 60 : 1500;
            progressColor = '#10b981'; // Green
            labelText = 'Work Time';
        } else {
            // BREAK MODE - BLUE
            displayTime = this.breakTimeRemaining;
            totalTime = this.currentTask ? this.currentTask?.breakDuration * 60 : 300;
            progressColor = '#3b82f6'; // Blue
            labelText = 'Break Time';
        }

        // Update time display
        const minutes = Math.floor(displayTime / 60);
        const seconds = displayTime % 60;
        timerTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Update label
        timerLabel.textContent = this.currentTask ? labelText : 'Ready to Focus';

        // Update progress ring
        if (this.currentTask) {
            progress = Math.max(0, Math.min(100, ((totalTime - displayTime) / totalTime) * 100));
            progressContainer.innerHTML = this.createProgressRing(280, progress, 100, 12, progressColor);
        } else {
            progressContainer.innerHTML = this.createProgressRing(280, 0, 100, 12, '#ddd');
        }

        // Update button colors based on mode
        this.updateButtonColors();
    }

    /**
     * Update button colors based on current mode
     */
    updateButtonColors() {
        const playBtn = document.getElementById('playBtn');
        const pauseBtn = document.getElementById('pauseBtn');

        if (this.currentMode === 'focus') {
            // FOCUS MODE - GREEN BUTTONS
            if (playBtn) {
                playBtn.style.background = 'var(--gradient-primary)'; // Green
            }
            if (pauseBtn) {
                pauseBtn.style.background = 'var(--gradient-primary)'; // Green
                // pauseBtn.style.background = 'var(--gradient-warning)'; // Yellow for pause
            }
        } else {
            // BREAK MODE - BLUE BUTTONS
            if (playBtn) {
                playBtn.style.background = 'var(--gradient-secondary)'; // Blue
            }
            if (pauseBtn) {
                pauseBtn.style.background = 'var(--gradient-secondary)'; // Blue
            }
        }
    }

    /**
     * Create SVG progress ring
     */
    createProgressRing(size, value, max, strokeWidth, stroke) {
        const radius = (size - strokeWidth) / 2;
        const viewBox = `0 0 ${size} ${size}`;
        const dashArray = radius * Math.PI * 2;
        const dashOffset = dashArray - (dashArray * value / max);
        
        return `
            <svg width="${size}" height="${size}" viewBox="${viewBox}" class="progress-ring">
                <circle
                    fill="none"
                    stroke="#ddd"
                    cx="${size / 2}"
                    cy="${size / 2}"
                    r="${radius}"
                    stroke-width="${strokeWidth}px" />
                <circle
                    fill="none"
                    stroke="${stroke}"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-dasharray="${dashArray}"
                    stroke-dashoffset="${dashOffset}"
                    cx="${size / 2}"
                    cy="${size / 2}"
                    r="${radius}"
                    stroke-width="${strokeWidth}px"
                    transform="rotate(-90 ${size / 2} ${size / 2})" />
            </svg>
        `;
    }

    /**
     * Update task display
     */
    updateTaskDisplay() {
        const taskInfo = document.getElementById('taskInfo');
        const addTaskBtn = document.getElementById('addTaskBtn');
        const currentTaskName = document.getElementById('currentTaskName');
        const currentTaskCategory = document.getElementById('currentTaskCategory');

        if (this.currentTask) {
            if (taskInfo) taskInfo.classList.remove('hidden');
            // if (addTaskBtn) addTaskBtn.style.display = 'none !important';
            if (addTaskBtn) addTaskBtn.classList.add('hidden')
            if (currentTaskName) currentTaskName.textContent = this.currentTask.name;
            if (currentTaskCategory) currentTaskCategory.textContent = this.currentTask.category;
        } else {
            if (taskInfo) taskInfo.classList.add('hidden');
            // if (addTaskBtn) addTaskBtn.style.display = 'flex';
            if (addTaskBtn) addTaskBtn.classList.remove('hidden')
        }
    }

    /**
     * Update control buttons
     */
    updateControls() {
        const playBtn = document.getElementById('playBtn');
        const pauseBtn = document.getElementById('pauseBtn');

        if (this.isRunning) {
            if (playBtn) playBtn.style.display = 'none';
            if (pauseBtn) pauseBtn.style.display = 'flex';
        } else {
            if (playBtn) playBtn.style.display = 'flex';
            if (pauseBtn) pauseBtn.style.display = 'none';
        }
    }

    /**
     * Enable timer controls
     */
    enableControls() {
        const playBtn = document.getElementById('playBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const stopBtn = document.getElementById('stopBtn');

        if (playBtn) playBtn.disabled = false;
        if (pauseBtn) pauseBtn.disabled = false;
        if (stopBtn) stopBtn.disabled = false;
    }

    /**
     * Disable timer controls
     */
    disableControls() {
        const playBtn = document.getElementById('playBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const stopBtn = document.getElementById('stopBtn');

        if (playBtn) playBtn.disabled = true;
        if (pauseBtn) pauseBtn.disabled = true;
        if (stopBtn) stopBtn.disabled = true;
    }

    /**
     * Save current session state
     */
    saveSession() {
        if (this.currentTask && (this.isRunning || this.isPaused)) {
            if (typeof storage !== 'undefined') {
                storage.saveActiveSession({
                    task: this.currentTask,
                    focusTimeRemaining: this.focusTimeRemaining,
                    breakTimeRemaining: this.breakTimeRemaining,
                    currentMode: this.currentMode,
                    isRunning: this.isRunning,
                    isPaused: this.isPaused
                });
            }
        }
    }

    /**
     * Restore session from storage
     */
    restoreSession() {
        if (typeof storage === 'undefined') return;
        
        const session = storage.getActiveSession();
        if (!session) return;

        const timeElapsed = Math.floor((Date.now() - session.timestamp) / 1000);
        
        console.log('TimerController: Restoring session:', session);
        
        // Restore session based on mode
        if (session.isRunning && session.currentMode === 'focus') {
            // Was running in focus mode
            if (timeElapsed < session.focusTimeRemaining) {
                this.currentTask = session.task;
                this.focusTimeRemaining = Math.max(0, session.focusTimeRemaining - timeElapsed);
                this.breakTimeRemaining = session.breakTimeRemaining;
                this.currentMode = 'focus';
                
                this.updateDisplay();
                this.updateTaskDisplay();
                this.enableControls();
                
                if (typeof uiComponents !== 'undefined') {
                    uiComponents.showNotification('Focus session restored! Continue where you left off.', 4000);
                }
            } else {
                // Focus session completed while away
                this.completeFocusSession();
            }
        } else if (session.isRunning && session.currentMode === 'break') {
            // Was running in break mode
            if (timeElapsed < session.breakTimeRemaining) {
                this.currentTask = session.task;
                this.focusTimeRemaining = session.focusTimeRemaining;
                this.breakTimeRemaining = Math.max(0, session.breakTimeRemaining - timeElapsed);
                this.currentMode = 'break';
                this.isPaused = true;
                
                // Continue break countdown
                this.startBreakCountdown();
                
                this.updateDisplay();
                this.updateTaskDisplay();
                this.enableControls();
                
                if (typeof uiComponents !== 'undefined') {
                    uiComponents.showNotification('Break session restored!', 3000);
                }
            } else {
                // Break completed while away
                this.completeBreak();
            }
        } else if (session.isPaused) {
            // Was paused
            this.currentTask = session.task;
            this.focusTimeRemaining = session.focusTimeRemaining;
            this.breakTimeRemaining = session.breakTimeRemaining;
            this.currentMode = session.currentMode;
            this.isPaused = true;
            
            this.updateDisplay();
            this.updateTaskDisplay();
            this.enableControls();
            
            if (typeof uiComponents !== 'undefined') {
                uiComponents.showNotification(`${session.currentMode === 'focus' ? 'Focus' : 'Break'} session restored!`, 3000);
            }
        }
        
        // Clear the session after processing
        storage.clearActiveSession();
    }

    /**
     * Play alert sound
     */
    playAlert() {
        const audio = document.getElementById('alertSound');
        if (audio) {
            audio.play().catch(e => console.log('Audio play failed:', e));
        }
    }

    updateModeChip() { }
}

window.TimerController = TimerController;