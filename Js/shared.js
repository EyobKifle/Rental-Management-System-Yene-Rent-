// Shared JavaScript utilities for Rental Management System
// This file contains common functions used across all pages


/**
 * A utility class for common functions used throughout the Rental Management System.
 * It handles navigation, global event listeners, modals, icons, form validation, and more.
 */
class RentalUtils {
    constructor() {
        this.headerPromise = null;
        this.sidebarPromise = null;
        this.init();
    }

    /**
     * Initializes all the utility setups.
     */
    init() {
        this.headerPromise = this.loadComponent('#header-container', 'header.html').then(headerContainer => {
            if (headerContainer) {
                this.setPageTitle();
                this.setupUserAvatar();
            }
            return headerContainer;
        });
        this.sidebarPromise = this.loadComponent('#sidebar-container', 'sidebar.html').then(() => {
            this.setupNavigation();
        });
        // Wait for both header and sidebar to load before setting up interactions
        Promise.all([this.headerPromise, this.sidebarPromise]).then(([headerContainer]) => {
            if (headerContainer) {
                this.setupHeaderInteractions(headerContainer);
            }
        });
        this.setupGlobalEventListeners(); // This now includes modal handlers
    }

    /**
     * Loads the header component and sets the page title.
     */
    async loadComponent(selector, filePath) {
        const container = document.querySelector(selector);
        if (container && !container.dataset.loaded) { // Prevent re-loading
            try {
                const response = await fetch(filePath);
                if (!response.ok) {
                    console.error(`Failed to load component from ${filePath}. Status: ${response.status}`);
                    return null;
                }
                let htmlContent = await response.text();
                if (filePath.endsWith('header.html') || filePath.endsWith('sidebar.html')) htmlContent = this.extractComponentHtml(htmlContent, selector);
                container.innerHTML = htmlContent;
                return container;
            } catch (error) {
                console.error(`Error loading component from ${filePath}:`, error);
                return null;
            }
        } else if (!container) {
            // This is not an error on pages that don't have these containers (e.g., login page)
            return null;
        }
        return container;
    }

    /**
     * Extracts the relevant HTML from a file that contains multiple components.
     * @param {string} html - The full HTML content.
     * @param {string} selector - The selector for the container ('#sidebar-container' or '#header-container').
     * @returns {string} The extracted HTML for the component.
     */
    extractComponentHtml(html, selector) {
        const parser = new DOMParser(); 
        const doc = parser.parseFromString(html, 'text/html');
        if (selector === '#sidebar-container') {
            return doc.querySelector('.sidebar')?.outerHTML || '';
        } else if (selector === '#header-container') {
            return doc.querySelector('.header')?.outerHTML || '';
        }
    }
    /**
     * Sets the page title in the header.
     */
    setPageTitle() {
        const pageTitleEl = document.getElementById('page-title');
        const pageTitle = document.title.split(' - ')[0];
        if (pageTitleEl && pageTitle) pageTitleEl.textContent = pageTitle;
    }

    /**
     * Sets up the user avatar in the header.
     * Displays the user's image or their first initial as a fallback.
     */
    setupUserAvatar() {
        const avatarContainer = document.getElementById('user-avatar-container');
        if (!avatarContainer) return;

        try {
            const user = JSON.parse(sessionStorage.getItem('currentUser'));
            if (user?.avatarUrl) {
                avatarContainer.innerHTML = `<img src="${user.avatarUrl}" alt="${user.name}">`;
            } else if (user?.name) {
                const initial = user.name.charAt(0).toUpperCase();
                avatarContainer.textContent = initial;
            } else {
                avatarContainer.textContent = 'U'; // Default fallback
            }
        } catch (e) {
            console.error("Could not parse user from sessionStorage", e);
            avatarContainer.textContent = 'U'; // Default fallback on error
        }
    }

    /**
     * Sets up interactive elements within the header, like dropdowns and the sidebar toggle.
     * @param {HTMLElement} headerContainer - The container element for the header.
     */
    setupHeaderInteractions(headerContainer) {
        const sidebar = document.getElementById('sidebar');
        const sidebarToggle = headerContainer.querySelector('#sidebar-toggle');
        const userMenuButton = headerContainer.querySelector('#user-menu-button');
        const userMenuDropdown = headerContainer.querySelector('#user-menu-dropdown');
        const languageMenuButton = headerContainer.querySelector('#language-menu-button');
        const languageMenuDropdown = headerContainer.querySelector('#language-menu-dropdown');

        // Function to update toggle icon based on sidebar state
        const updateToggleIcon = () => {
            const icon = sidebarToggle.querySelector('i');
            if (window.innerWidth <= 1024) {
                // Mobile: check if sidebar has 'open' class
                if (sidebar.classList.contains('open')) {
                    icon.className = 'fa-solid fa-times';
                } else {
                    icon.className = 'fa-solid fa-bars';
                }
            } else {
                // Desktop: check if body has 'sidebar-collapsed'
                if (document.body.classList.contains('sidebar-collapsed')) {
                    icon.className = 'fa-solid fa-bars';
                } else {
                    icon.className = 'fa-solid fa-times';
                }
            }
        };

        if (sidebarToggle && sidebar) {
            // Initialize icon
            updateToggleIcon();

            sidebarToggle.addEventListener('click', () => {
                if (window.innerWidth <= 1024) {
                    // Mobile: toggle 'open' class on sidebar
                    sidebar.classList.toggle('open');
                } else {
                    // Desktop: toggle 'sidebar-collapsed' on body
                    document.body.classList.toggle('sidebar-collapsed');
                }
                // Update icon after toggle
                updateToggleIcon();
            });
        }

        const setupDropdown = (button, dropdown) => {
            if (button && dropdown) {
                button.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent the global click listener from closing it immediately
                    // Close other dropdowns
                    document.querySelectorAll('.dropdown-menu').forEach(d => {
                        if (d !== dropdown) d.classList.add('hidden');
                    });
                    dropdown.classList.toggle('hidden');
                });
            }
        };

        setupDropdown(userMenuButton, userMenuDropdown);
        setupDropdown(languageMenuButton, languageMenuDropdown);
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
        });
    }

    /**
     * Sets up global event listeners, such as closing dropdowns when clicking outside.
     */
    setupGlobalEventListeners() {
        document.addEventListener('click', (event) => {
            // Close all open dropdowns if click is outside
            const dropdownBtn = event.target.closest('.action-dropdown-btn');
            const openDropdowns = document.querySelectorAll('.dropdown-menu:not(.hidden)');

            // If the click is not on a dropdown button, close all open dropdowns.
            if (!dropdownBtn) {
                openDropdowns.forEach(dropdown => {
                    dropdown.classList.add('hidden');
                });
            }

            // This logic seems outdated, the new dropdown logic handles this better.
            // Close user menu if click is outside
            const userMenu = document.getElementById('user-menu');
            if (userMenu && userMenu.classList.contains('active') && !event.target.closest('.user-menu-container')) {
                userMenu.classList.remove('active');
            }

            // Close sidebar on mobile if click is outside
            const sidebar = document.getElementById('sidebar');
            const sidebarToggle = document.getElementById('sidebar-toggle');
            if (sidebar && window.innerWidth <= 1024 && sidebar.classList.contains('open') &&
                !sidebar.contains(event.target) && !sidebarToggle.contains(event.target)) {
                sidebar.classList.remove('open');
            }

            // Modal closing logic
            if (event.target.classList.contains('modal-overlay')) {
                this.closeModal(event.target);
            }
            if (event.target.closest('.close-modal-btn')) {
                const modal = event.target.closest('.modal-overlay');
                if (modal) this.closeModal(modal);
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal-overlay:not(.hidden)');
                if (openModal) this.closeModal(openModal);

                // Close sidebar on mobile
                const sidebar = document.getElementById('sidebar');
                if (sidebar && window.innerWidth <= 1024 && sidebar.classList.contains('open')) {
                    sidebar.classList.remove('open');
                }
            }
        });
    }
    
    /**
     * Sets up handlers for opening and closing modals globally.
     * @deprecated This method is merged into setupGlobalEventListeners for efficiency.
     */
    setupModalHandlers() {
        // This method is now part of setupGlobalEventListeners.
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
     * Validates a form's required fields.
     * @param {HTMLFormElement} form - The form to validate.
     * @returns {boolean} - True if the form is valid, false otherwise.
     */
    validateForm(form) {
        const inputs = form.querySelectorAll('[required]');
        let isValid = true;

        inputs.forEach(input => {
            this.clearError(input); // Clear previous errors before validating
            let hasError = false;

            // Rule 1: Check if the field is empty
            if (!input.value.trim()) {
                this.showError(input, 'This field is required');
                isValid = false;
                hasError = true;
            }

            // Rule 2: Check for specific types if the field is not empty
            if (!hasError) {
                switch (input.type) {
                    case 'email':
                        // A simple regex to check for a valid email format
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailRegex.test(input.value)) {
                            this.showError(input, 'Please enter a valid email address.');
                            isValid = false;
                        }
                        break;
                    
                    case 'tel':
                        // A simple regex for phone numbers (allows digits, spaces, dashes, parens)
                        const phoneRegex = /^[0-9\s\-\(\)]+$/;
                        if (!phoneRegex.test(input.value)) {
                            this.showError(input, 'Please enter a valid phone number.');
                            isValid = false;
                        }
                        break;

                    case 'number':
                        const min = input.getAttribute('min');
                        const max = input.getAttribute('max');
                        if (min && parseFloat(input.value) < parseFloat(min)) {
                            this.showError(input, `Value must be at least ${min}.`);
                            isValid = false;
                        }
                        if (max && parseFloat(input.value) > parseFloat(max)) {
                            this.showError(input, `Value cannot exceed ${max}.`);
                            isValid = false;
                        }
                        break;
                }
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

        // Add error class to the input
        input.classList.add('input-error');

        // Create error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;

        // Insert the error message after the input field
        if (input.parentNode) {
            // Using insertAdjacentElement is safer if other elements are siblings
            input.parentNode.insertBefore(errorDiv, input.nextSibling);
        }
    }

    /**
     * Clears the error message and styling from a form input.
     * @param {HTMLElement} input - The input element to clear.
     */
    clearError(input) {
        input.classList.remove('input-error');
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
        notification.className = `notification notification-${type} notification-base`;
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
     * @param {boolean} [compact=false] - If true, uses compact notation (e.g., 'K' for thousands).
     * @returns {string} - The formatted currency string.
     */
    formatCurrency(amount, currency = 'ETB', compact = false) {
        const options = {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0
        };
        if (compact) options.notation = 'compact';
        return new Intl.NumberFormat('en-US', {
            ...options
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
     * Reads a file and returns its content as a Data URL.
     * @param {File} file - The file to read.
     * @returns {Promise<string>} A promise that resolves with the Data URL.
     */
    readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    }

    /**
     * Converts a file to base64 string.
     * @param {File} file - The file to convert.
     * @returns {Promise<string>} A promise that resolves with the base64 string.
     */
    convertFileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
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
