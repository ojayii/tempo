/**
 * UI Components - Reusable UI elements and utilities
 */
class UIComponents {
    constructor() {
        this.notificationTimeout = null;
    }

    /**
     * Show notification message
     */
    showNotification(message, duration = 3000) {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notificationText');
        
        if (!notification || !notificationText) return;

        // Clear existing timeout
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
        }

        notificationText.textContent = message;
        notification.style.display = 'block';
        
        this.notificationTimeout = setTimeout(() => {
            notification.style.display = 'none';
        }, duration);
    }

    /**
     * Create template card HTML
     */
    createTemplateCard(template) {
        return `
            <div class="template-card">
                <div class="template-icon" style="background: var(${template.gradient})">
                    <i class="${template.icon}"></i>
                </div>
                <div class="template-info">
                    <h4>${template.name}</h4>
                    <p>${template.workDuration}min work, ${template?.breakDuration}min break</p>
                </div>
            </div>
        `;
    }

    /**
     * Create recent task card HTML
     */
    createRecentTaskCard(entry) {
        const categoryIcons = {
            work: 'fas fa-briefcase',
            study: 'fas fa-book',
            reading: 'fas fa-book-open',
            exercise: 'fas fa-dumbbell',
            creative: 'fas fa-palette',
            other: 'fas fa-circle'
        };

        const icon = categoryIcons[entry.category] || categoryIcons.other;
        const date = new Date(entry.completedAt).toLocaleDateString();

        return `
            <div class="recent-task-card">
                <div class="task-icon" style="background: var(--gradient-primary)">
                    <i class="${icon}"></i>
                </div>
                <div class="task-info-content">
                    <h4>${entry.task}</h4>
                    <p>${entry.category} • ${date} • ${entry.duration}min</p>
                </div>
            </div>
        `;
    }

    /**
     * Create incomplete task card HTML
     */
    createIncompleteTaskCard(incompleteTask) {
        const categoryIcons = {
            work: 'fas fa-briefcase',
            study: 'fas fa-book',
            reading: 'fas fa-book-open',
            exercise: 'fas fa-dumbbell',
            creative: 'fas fa-palette',
            other: 'fas fa-circle'
        };

        const icon = categoryIcons[incompleteTask.task.category] || categoryIcons.other;
        const timeSpent = Math.floor(incompleteTask.totalTimeSpent / 60);
        const totalTime = incompleteTask.task.workDuration;
        const progress = Math.round((timeSpent / totalTime) * 100);

        return `
            <div class="incomplete-task-card" data-task-id="${incompleteTask.id}">
                <div class="task-icon" style="background: var(--gradient-warning)">
                    <i class="${icon}"></i>
                </div>
                <div class="task-info-content">
                    <h4>${incompleteTask.task.name}</h4>
                    <p>${incompleteTask.task.category} • ${timeSpent}/${totalTime} minutes</p>
                    <div class="progress-info">${progress}% completed</div>
                </div>
            </div>
        `;
    }

    /**
     * Create carousel card HTML
     */
    createCarouselCard(item) {
        return `
            <div class="carousel-card">
                <h3>
                    <i class="${item.icon || 'fas fa-lightbulb'}"></i>
                    ${item.title}
                </h3>
                <p>${item.content}</p>
            </div>
        `;
    }

    /**
     * Format time duration
     */
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    /**
     * Create loading spinner
     */
    createLoader() {
        return `
            <div class="loader">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Loading...</span>
            </div>
        `;
    }

    /**
     * Create empty state message
     */
    createEmptyState(title, message, icon = 'fas fa-inbox') {
        return `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="${icon}"></i>
                </div>
                <h3>${title}</h3>
                <p>${message}</p>
            </div>
        `;
    }

    /**
     * Animate element entrance
     */
    animateIn(element, animation = 'fadeInUp') {
        if (!element) return;
        
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, 10);
    }

    /**
     * Animate element exit
     */
    animateOut(element, callback) {
        if (!element) return;
        
        element.style.transition = 'all 0.3s ease';
        element.style.opacity = '0';
        element.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            if (callback) callback();
        }, 300);
    }

    /**
     * Create confirmation dialog
     */
    showConfirmDialog(title, message, onConfirm, onCancel) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay modal';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        
        overlay.innerHTML = `
            <div class="bottom-sheet modal show" style="transform: translateY(0); max-height: none; margin: 20px;">
                <div class="sheet-header">
                    <h3 class="sheet-title">${title}</h3>
                </div>
                <div style="margin-bottom: 24px;">
                    <p style="color: var(--text-secondary); line-height: 1.5;">${message}</p>
                </div>
                <div style="display: flex; gap: 12px;">
                    <button class="modal-btn muted" style="flex: 1;" id="cancelBtn">
                        <i class="fas fa-times"></i>
                        Cancel
                    </button>
                    <button class="modal-btn danger" style="flex: 1;" id="confirmBtn">
                        <i class="fas fa-check"></i>
                        Confirm
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        const cancelBtn = overlay.querySelector('#cancelBtn');
        const confirmBtn = overlay.querySelector('#confirmBtn');
        
        const cleanup = () => {
            document.body.removeChild(overlay);
        };
        
        cancelBtn.onclick = () => {
            cleanup();
            if (onCancel) onCancel();
        };
        
        confirmBtn.onclick = () => {
            cleanup();
            if (onConfirm) onConfirm();
        };
        
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                cleanup();
                if (onCancel) onCancel();
            }
        };
    }

    /**
     * Create toast notification
     */
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="${icons[type] || icons.info}"></i>
            <span>${message}</span>
        `;
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 12px 16px;
            box-shadow: var(--shadow-lg);
            z-index: 5000;
            display: flex;
            align-items: center;
            gap: 8px;
            max-width: 300px;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 10);
        
        // Auto remove
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    /**
     * Vibrate device if supported
     */
    vibrate(pattern = [200, 100, 200]) {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }

    /**
     * Check if element is in viewport
     */
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    /**
     * Smooth scroll to element
     */
    scrollToElement(element, offset = 0) {
        if (!element) return;
        
        const targetPosition = element.offsetTop - offset;
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }

    /**
     * Debounce function calls
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
     * Throttle function calls
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Export the class, don't instantiate yet
window.UIComponents = UIComponents;