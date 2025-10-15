// Shared JavaScript utilities for Rental Management System
// This file contains common functions used across all pages


/**
 * A utility class for common functions used throughout the Rental Management System.
 * It handles navigation, global event listeners, modals, icons, form validation, and more.
 */
class RentalUtils {
    constructor() {
        this.init();
    }

    /**
     * Initializes all the utility setups.
     */
    init() {
        this.loadHeader();
        this.setupNavigation();
        this.setupGlobalEventListeners();
        this.setupModalHandlers();
        this.setupLucideIcons();
    }

    /**
     * Loads the header component and sets the page title.
     */
    async loadHeader() {
        const headerContainer = document.querySelector('main');
        if (headerContainer) {
            const response = await fetch('header.html');
            const headerHtml = await response.text();
            headerContainer.insertAdjacentHTML('afterbegin', headerHtml);
            const pageTitle = document.title.split(' - ')[0];
            document.getElementById('page-title').textContent = pageTitle;
        }
    }

    /**
     * Sets up active states for navigation links based on the current page.
     */
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';

        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPath) {
                link.classList.add('active');
            }

            link.addEventListener('click', (e) => {
                // Remove active class from all links
                navLinks.forEach(l => l.classList.remove('active'));
                // Add active class to clicked link
                link.classList.add('active');
            });
        });
    }

    /**
     * Sets up global event listeners, such as closing dropdowns when clicking outside.
     */
    setupGlobalEventListeners() {
        document.addEventListener('click', (e) => {
            // Close all open dropdowns if click is outside
            const dropdownBtn = e.target.closest('.action-dropdown-btn');
            const openDropdowns = document.querySelectorAll('.dropdown-menu:not(.hidden)');
            
            if (!dropdownBtn) {
                openDropdowns.forEach(dropdown => {
                    dropdown.classList.add('hidden');
                });
            }
        });
    }

    /**
     * Sets up handlers for opening and closing modals globally.
     */
    setupModalHandlers() {
        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeModal(e.target);
            }
        });

        // Close modal with close buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-modal-btn')) {
                const modal = e.target.closest('.modal-overlay');
                if (modal) this.closeModal(modal);
            }
        });

        // ESC key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal-overlay:not(.hidden)');
                if (openModal) this.closeModal(openModal);
            }
        });
    }

    /**
     * Opens a modal and prevents background scrolling.
     * @param {HTMLElement} modal - The modal element to open.
     */
    openModal(modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    /**
     * Closes a modal and restores background scrolling.
     * @param {HTMLElement} modal - The modal element to close.
     */
    closeModal(modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    /**
     * Initializes Lucide icons on the page.
     */
    setupLucideIcons() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * Validates a form's required fields.
     * @param {HTMLFormElement} form - The form to validate.
     * @returns {boolean} - True if the form is valid, false otherwise.
     */
    validateForm(form) {
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!input.value.trim()) {
                this.showError(input, 'This field is required');
                isValid = false;
            } else {
                this.clearError(input);
            }
        });

        return isValid;
    }

    /**
     * Displays an error message for a form input.
     * @param {HTMLElement} input - The input element with an error.
     * @param {string} message - The error message to display.
     */
    showError(input, message) {
        // Remove existing error
        this.clearError(input);

        // Add error class
        input.classList.add('border-red-500');

        // Create error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'text-red-500 text-xs mt-1 error-message';
        errorDiv.textContent = message;

        input.parentNode.appendChild(errorDiv);
    }

    /**
     * Clears the error message and styling from a form input.
     * @param {HTMLElement} input - The input element to clear.
     */
    clearError(input) {
        input.classList.remove('border-red-500');
        const errorMsg = input.parentNode.querySelector('.error-message');
        if (errorMsg) errorMsg.remove();
    }

    // Data persistence with localStorage
    /**
     * Displays a temporary notification message.
     * @param {string} message - The message to display.
     * @param {'success' | 'error' | 'warning' | 'info'} [type='success'] - The type of notification.
     */
    showNotification(message, type = 'success') {
        // Remove existing notifications
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();

        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            type === 'success' ? 'bg-green-500' :
            type === 'error' ? 'bg-red-500' :
            type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
        } text-white`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    /**
     * Formats a number as a currency string.
     * @param {number} amount - The amount to format.
     * @param {string} [currency='ETB'] - The currency code.
     * @returns {string} - The formatted currency string.
     */
    formatCurrency(amount, currency = 'ETB') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0
        }).format(amount || 0);
    }

    /**
     * Formats a date string into a more readable format.
     * @param {string} date - The date string to format.
     * @param {object} [options] - Formatting options for toLocaleDateString.
     * @returns {string} - The formatted date string.
     */
    formatDate(date, options = {}) {
        if (!date) return 'N/A';
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        return new Date(date).toLocaleDateString('en-US', { ...defaultOptions, ...options });
    }

    /**
     * Formats a file size in bytes into a human-readable string.
     * @param {number} bytes - The file size in bytes.
     * @returns {string} - The formatted file size string.
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Generates a simple unique ID.
     * @returns {string}
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Creates a debounced function that delays invoking func until after wait milliseconds.
     * @param {Function} func - The function to debounce.
     * @param {number} wait - The number of milliseconds to delay.
     * @returns {Function} - The new debounced function.
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
     * Shows a native browser confirmation dialog.
     * @param {string} message - The message to display in the dialog.
     * @returns {boolean} - True if the user clicked OK, false otherwise.
     */
    confirm(message) {
        return window.confirm(message);
    }
}

// Initialize utilities when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.rentalUtils = new RentalUtils();
});
