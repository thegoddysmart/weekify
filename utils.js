/**
 * Utility functions for the Weekly Execution Planner
 */

// Date utility functions
const DateUtils = {
    /**
     * Get the start of the week (Monday) for a given date
     */
    getWeekStart(date = new Date()) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        return new Date(d.setDate(diff));
    },

    /**
     * Get the end of the week (Sunday) for a given date
     */
    getWeekEnd(date = new Date()) {
        const weekStart = this.getWeekStart(date);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return weekEnd;
    },

    /**
     * Format date to YYYY-MM-DD
     */
    formatDate(date) {
        return date.toISOString().split('T')[0];
    },

    /**
     * Format date to readable format
     */
    formatDateReadable(date) {
        return date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    },

    /**
     * Get week range string
     */
    getWeekRange(startDate) {
        const start = new Date(startDate);
        const end = this.getWeekEnd(start);
        return `${this.formatDateReadable(start)} - ${this.formatDateReadable(end)}`;
    }
};

// Local Storage utilities
const StorageUtils = {
    /**
     * Save data to localStorage
     */
    save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
            return false;
        }
    },

    /**
     * Load data from localStorage
     */
    load(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
            return null;
        }
    },

    /**
     * Remove data from localStorage
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Failed to remove from localStorage:', error);
            return false;
        }
    }
};

// Task categorization utilities
const TaskUtils = {
    /**
     * Categorize task based on Eisenhower Matrix
     */
    categorizeTask(importance, urgency) {
        const isImportant = ['critical', 'important'].includes(importance);
        const isUrgent = ['immediate', 'this-week'].includes(urgency);

        if (isImportant && isUrgent) return 'do-now';
        if (isImportant && !isUrgent) return 'schedule-later';
        if (!isImportant && isUrgent) return 'optional';
        return 'ignore';
    },

    /**
     * Get priority score for sorting
     */
    getPriorityScore(importance, urgency) {
        const importanceScore = {
            'critical': 4,
            'important': 3,
            'moderate': 2,
            'low': 1
        }[importance] || 0;

        const urgencyScore = {
            'immediate': 4,
            'this-week': 3,
            'flexible': 2,
            'someday': 1
        }[urgency] || 0;

        return importanceScore * urgencyScore;
    },

    /**
     * Extract project tags from text
     */
    extractProjects(text) {
        if (!text) return [];
        return text.split(',').map(p => p.trim()).filter(p => p.length > 0);
    },

    /**
     * Get status class for task
     */
    getStatusClass(category) {
        return `status-${category.replace('-', '')}`;
    },

    /**
     * Get priority class
     */
    getPriorityClass(score) {
        if (score >= 12) return 'priority-high';
        if (score >= 6) return 'priority-medium';
        return 'priority-low';
    }
};

// Export utilities
const ExportUtils = {
    /**
     * Download data as JSON file
     */
    downloadJSON(data, filename = 'weekly-planner-export.json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { 
            type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * Read JSON file
     */
    readJSONFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    resolve(data);
                } catch (error) {
                    reject(new Error('Invalid JSON file'));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }
};

// UI utilities
const UIUtils = {
    /**
     * Show notification/toast
     */
    showNotification(message, type = 'info', duration = 3000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: 'bold',
            zIndex: '9999',
            opacity: '0',
            transform: 'translateY(-20px)',
            transition: 'all 0.3s ease'
        });

        // Set background color based on type
        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        // Add to DOM and animate in
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 100);

        // Remove after duration
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    },

    /**
     * Generate unique ID
     */
    generateId() {
        return 'id-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
    },

    /**
     * Sanitize HTML to prevent XSS
     */
    sanitizeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Debounce function
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
    },

    /**
     * Animate element
     */
    animate(element, animation, duration = 300) {
        return new Promise((resolve) => {
            element.style.animation = `${animation} ${duration}ms ease`;
            setTimeout(() => {
                element.style.animation = '';
                resolve();
            }, duration);
        });
    }
};

// Validation utilities
const ValidationUtils = {
    /**
     * Validate email
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Validate required field
     */
    isRequired(value) {
        return value !== null && value !== undefined && value.toString().trim() !== '';
    },

    /**
     * Validate task data
     */
    validateTask(task) {
        const errors = [];
        
        if (!this.isRequired(task.text)) {
            errors.push('Task description is required');
        }
        
        if (task.text && task.text.length > 500) {
            errors.push('Task description must be less than 500 characters');
        }
        
        return errors;
    },

    /**
     * Validate planner data
     */
    validatePlannerData(data) {
        const errors = [];
        
        if (!data.weekStart) {
            errors.push('Week start date is required');
        }
        
        if (!Array.isArray(data.tasks)) {
            errors.push('Tasks must be an array');
        }
        
        return errors;
    }
};

// Performance utilities
const PerformanceUtils = {
    /**
     * Throttle function
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
    },

    /**
     * Measure performance
     */
    measure(name, func) {
        const start = performance.now();
        const result = func();
        const end = performance.now();
        console.log(`${name} took ${end - start} milliseconds`);
        return result;
    }
};

// Default life areas
const DEFAULT_LIFE_AREAS = [
    'Health & Fitness',
    'Career & Professional',
    'Family & Relationships',
    'Finance & Money',
    'Learning & Education',
    'Hobbies & Recreation',
    'Home & Environment',
    'Spiritual & Personal Growth',
    'Social & Community',
    'Travel & Adventure'
];

// Default sprint time options
const SPRINT_TIME_OPTIONS = [
    '6:00 AM - 9:00 AM',
    '9:00 AM - 12:00 PM', 
    '12:00 PM - 3:00 PM',
    '3:00 PM - 6:00 PM',
    '6:00 PM - 9:00 PM',
    '9:00 PM - 12:00 AM'
];

// Days of the week
const DAYS_OF_WEEK = [
    'Monday',
    'Tuesday', 
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
];

// Export all utilities
window.DateUtils = DateUtils;
window.StorageUtils = StorageUtils;
window.TaskUtils = TaskUtils;
window.ExportUtils = ExportUtils;
window.UIUtils = UIUtils;
window.ValidationUtils = ValidationUtils;
window.PerformanceUtils = PerformanceUtils;
window.DEFAULT_LIFE_AREAS = DEFAULT_LIFE_AREAS;
window.SPRINT_TIME_OPTIONS = SPRINT_TIME_OPTIONS;
window.DAYS_OF_WEEK = DAYS_OF_WEEK;
