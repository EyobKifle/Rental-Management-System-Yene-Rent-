// lib/ethiopian-date.js should be loaded before this file in HTML

// Shared JavaScript utilities for Rental Management System
// This file contains common functions used across all pages

/**
 * Manages application settings using localStorage.
 * Provides a centralized way to get and set configuration values like tax rates.
 */
class SettingsService {
    constructor(storageKey = 'appSettings') {
        this.storageKey = storageKey;
        this.defaults = {
            appearance: { theme: 'light' }, // 'light' or 'dark'
            general: { lastNotificationCheck: null },
            tax: {
                vatRate: 0.15,
                withholdingTaxRate: 0.15,
                businessIncomeTaxRate: 0.30,
                expenseVatDeductibleRate: 1.0,
            },
            regional: {
                calendar: 'gregorian', // 'gregorian' or 'ethiopian'
                language: 'en' // 'en' or 'am'
            },
            notifications: {
                // Placeholder: User can set a specific date for a tax payment reminder.
                taxReminders: [
                    {
                        id: 'default-tax-1',
                        name: 'Annual Business Tax',
                        calendar: 'gregorian', // 'gregorian' or 'ethiopian' per reminder
                        enabled: true, // Keep track if reminder is active
                    type: 'annually', // 'monthly', 'quarterly', 'annually', 'specific'
                    day: 25,          // Day of the month (1-31)
                    month: 9,         // Month for annual reminders (1-12)
                    date: '2024-09-25',// Full date for specific reminders
                    hour: 9,           // Reminder hour (0-23)
                    minute: 0,         // Reminder minute (0-59)
                    // Dates for quarterly reminders
                    quarterlyDates: ['2025-01-15', '2025-04-15', '2025-07-15', '2025-10-15']
                    },
                    { id: 'viewedNotifications', type: 'internal', viewed: [] } // To track viewed notifications
                ]
            }
        };
    }

    /**
     * Retrieves all settings, merging stored values with defaults.
     * @returns {object} The complete settings object.
     */
    getSettings() {
        const stored = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
        // Deep merge defaults with stored settings
        return {
            ...this.defaults,
            appearance: { ...this.defaults.appearance, ...(stored.appearance || {}) },
            general: { ...this.defaults.general, ...(stored.general || {}) },
            tax: { ...this.defaults.tax, ...(stored.tax || {}) },
            regional: { ...this.defaults.regional, ...(stored.regional || {}) },
            notifications: { 
                ...this.defaults.notifications, 
                taxReminders: stored.notifications?.taxReminders || this.defaults.notifications.taxReminders
            },
        };
    }

    saveSettings(settings) {
        localStorage.setItem(this.storageKey, JSON.stringify(settings));
    }
}


/**
 * A utility class for common functions used throughout the Rental Management System.
 * It handles navigation, global event listeners, modals, icons, form validation, and more.
 */
class RentalUtils {
    constructor() {
        this.headerPromise = null;
        this.notificationInterval = null;
        this.sidebarPromise = null;
        this.init();
    }

    /**
     * Initializes all the utility setups.
     */
    init() {
        this.initI18n();
        this.applyTheme(); // Apply theme as early as possible
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
                this.updateNotificationBadge();
            }
        });
        this.setupGlobalEventListeners(); // This now includes modal handlers
    }
    
    /**
     * Initializes the internationalization setup.
     */
    async initI18n() {
        const settings = window.settingsService.getSettings();
        const lang = settings.regional.language || 'en';
        if (lang === 'am') {
            // Load the Amharic translation file
            await this.loadScript('/Js/i18n/am.js');
        }
        this.translatePage();
    }

    /**
     * Translates a given key into the current language.
     * @param {string} key - The key to translate.
     * @returns {string} - The translated string or the key itself.
     */
    t(key) {
        const settings = window.settingsService.getSettings();
        const lang = settings.regional.language || 'en';
        if (lang === 'en') return key;
        return window.translations?.[lang]?.[key] || key;
    }

    /**
     * Finds all elements with a `data-i18n` attribute and translates them.
     */
    translatePage() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = this.t(key);
        });
    }

    /**
     * Applies the saved theme (light/dark) to the body.
     */
    applyTheme() {
        const settings = window.settingsService.getSettings();
        const theme = settings.appearance.theme || 'light';
        document.body.setAttribute('data-theme', theme);
    }

    /**
     * Toggles the theme and saves the preference.
     */
    toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        const settings = window.settingsService.getSettings();
        window.settingsService.saveSettings({ ...settings, appearance: { theme: newTheme } });
    }
    
    /**
     * Dynamically loads a script.
     * @param {string} src - The source URL of the script.
     * @returns {Promise} - A promise that resolves when the script is loaded.
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Script load error for ${src}`));
            document.head.appendChild(script);
        });
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
        const notificationBtn = headerContainer.querySelector('.notification-btn');

        // Language switcher logic
        if (languageMenuDropdown) {
            languageMenuDropdown.addEventListener('click', (e) => {
                const langItem = e.target.closest('.dropdown-item');
                if (langItem) {
                    e.preventDefault();
                    const lang = langItem.dataset.lang;
                    const settings = window.settingsService.getSettings();
                    settings.regional.language = lang;
                    window.settingsService.saveSettings(settings);
                    window.location.reload(); // Reload to apply the new language
                }
            });
        }


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

        // Make the notification bell navigate to the notifications page
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => window.location.href = 'notifications.html');
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
            const modalOverlay = event.target.closest('.modal-overlay');
            if (modalOverlay) {
                // Close if clicking the overlay itself or a button with .close-modal-btn
                if (event.target === modalOverlay || event.target.closest('.close-modal-btn')) {
                    this.closeModal(modalOverlay);
                }
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
        modal.classList.remove('visible');
        // Wait for the animation to finish before hiding it completely
        modal.addEventListener('transitionend', () => {
            modal.classList.add('hidden');
            // Clean up the container to prevent multiple modals from stacking
            if (modal.parentElement.id.endsWith('-modal')) modal.parentElement.innerHTML = '';
        }, { once: true });
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

                    case 'date':
                        // Basic date validation: ensure it's not in the past for future dates
                        if (input.hasAttribute('data-future-only')) {
                            const selectedDate = new Date(input.value);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            if (selectedDate < today) {
                                this.showError(input, 'Date cannot be in the past.');
                                isValid = false;
                            }
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
        const settings = window.settingsService.getSettings();
        const calendarType = settings.regional.calendar;

        if (calendarType === 'ethiopian') {
            const etDate = new EthiopianDate(date);
            // Format to 'DD/MM/YYYY'
            return `${String(etDate.date).padStart(2, '0')}/${String(etDate.month).padStart(2, '0')}/${etDate.year}`;
        } else {
            // Default Gregorian formatting
            const defaultOptions = {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            };
            // Ensure the date object is created correctly, especially on Safari
            const safeDate = new Date(date.replace(/-/g, '/'));
            return safeDate.toLocaleDateString('en-US', { ...defaultOptions, ...options });
        }
    }

    /**
     * Formats a date-time string into a more readable format.
     * @param {string} date - The date-time string to format.
     * @param {object} [options] - Formatting options for toLocaleString.
     * @returns {string} - The formatted date-time string.
     */
    formatDateTime(date, options = {}) {
        if (!date) return 'N/A';
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(date).toLocaleString('en-US', { ...defaultOptions, ...options });
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
     * Generates a more robust unique ID using crypto API if available, fallback to timestamp + random.
     * @returns {string}
     */
    generateId() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        // Fallback for older browsers
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
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
     * Converts a file to a base64 Data URL string.
     * @param {File} file - The file to convert.
     * @returns {Promise<string>} A promise that resolves with the base64 string.
     */
    // The 'convertFileToBase64' method was a duplicate of 'readFileAsDataURL' and has been removed.

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

    /**
     * Creates and opens a modal with the specified content.
     * @param {Object} options - Options for the modal.
     * @param {string} options.modalId - The ID of the modal container.
     * @param {string} options.title - The title of the modal.
     * @param {string} options.bodyHtml - The HTML content for the modal body.
     * @param {string} [options.formId] - The ID of the form inside the modal.
     * @param {Function} [options.onSubmit] - The submit handler for the form.
     * @param {string} [options.maxWidth] - The maximum width of the modal (e.g., '700px').
     */
    async createAndOpenModal({ modalId, title, bodyHtml, formId, onSubmit, maxWidth = '500px' }) {
        const modalContainer = document.getElementById(modalId);
        const modalHtml = `
            <div class="modal-overlay hidden">
                <div class="modal-content-wrapper" style="max-width: ${maxWidth};">
                    <div class="modal-header">
                        <h2 id="modal-title">${title}</h2>
                        <button class="close-modal-btn">&times;</button>
                    </div>
                    <div id="modal-body">
                        ${bodyHtml}
                    </div>
                </div>
            </div>`;
        modalContainer.innerHTML = modalHtml;
        const modal = modalContainer.querySelector('.modal-overlay');
        this.openModal(modal);
        if (formId && onSubmit) {
            const form = modal.querySelector(`#${formId}`);
            if (form) form.addEventListener('submit', onSubmit);
        }
    }

    /**
     * Sets up Font Awesome icons. Since Font Awesome is loaded via CDN in the HTML, this method ensures it's ready.
     */
    async setupFontAwesomeIcons() {
        return new Promise((resolve) => {
            const checkFontAwesome = () => {
                if (typeof FontAwesome !== 'undefined' || document.querySelector('link[href*="font-awesome"]')) {
                    resolve();
                } else {
                    // If not ready, check again shortly.
                    setTimeout(checkFontAwesome, 50);
                }
            };

            // Set a timeout to prevent an infinite loop if the library fails to load
            const timeout = setTimeout(() => {
                console.warn('Font Awesome library not loaded after 3 seconds. Icons may not render properly.');
                resolve(); // Resolve anyway to not block other scripts
            }, 3000);

            checkFontAwesome();
        });
    }

    /**
     * Checks for overdue payments and updates the notification badge visibility.
     */
    async updateNotificationBadge() {
        const notificationBtn = document.querySelector('.notification-btn');
        if (!notificationBtn) return;

        const notificationBadge = notificationBtn.querySelector('.notification-badge');
        const bellIcon = notificationBtn.querySelector('i');

        try {
            const payments = await api.get('payments');
            const settings = window.settingsService.getSettings();
            const lastCheck = settings.general.lastNotificationCheck ? new Date(settings.general.lastNotificationCheck) : new Date(0);

            const overduePayments = payments.filter(payment => {
                if (payment.status && payment.status === 'Paid') {
                    return false;
                }
                const today = new Date().setHours(0, 0, 0, 0);
                const dueDate = new Date(payment.dueDate);
                return dueDate.setHours(0, 0, 0, 0) < today;
            });

            const dueTaxReminders = this.getDueTaxReminders(settings.notifications.taxReminders);
            const totalNotifications = overduePayments.length + dueTaxReminders.length;

            // A notification is "new" if it became due after the last time the user checked the notifications page.
            const hasUnviewedNotifications = overduePayments.some(p => new Date(p.dueDate) > lastCheck) || dueTaxReminders.length > 0;

            if (totalNotifications > 0) {
                notificationBadge.classList.remove('hidden');
                // Only animate if there are unviewed notifications
                if (hasUnviewedNotifications) {
                    this.startNotificationAnimation(bellIcon);
                } else {
                    this.stopNotificationAnimation();
                }
            } else {
                notificationBadge.classList.add('hidden');
                this.stopNotificationAnimation();
            }
        } catch (error) {
            console.error("Failed to update notification badge:", error);
        }
    }

    getDueTaxReminders(reminders = []) {
        const dueReminders = [];
        const today = new Date();
        const todayDate = today.getDate();
        const todayMonth = today.getMonth() + 1;
        const currentHour = today.getHours();
        const currentMinute = today.getMinutes();

        reminders.forEach(reminder => {
            if (!reminder.enabled || reminder.type === 'internal') return;
            let isDue = false;
            switch (reminder.type) {
                case 'monthly': isDue = todayDate === reminder.day; break;
                case 'quarterly': isDue = reminder.quarterlyDates?.includes(today.toISOString().split('T')[0]); break;
                case 'annually': isDue = todayDate === reminder.day && todayMonth === reminder.month; break;
                case 'specific': isDue = reminder.date === today.toISOString().split('T')[0]; break;
            }
            const reminderHour = reminder.hour || 0;
            const reminderMinute = reminder.minute || 0;
            if (isDue && (currentHour > reminderHour || (currentHour === reminderHour && currentMinute >= reminderMinute))) {
                dueReminders.push(reminder);
            }
        });
        return dueReminders;
    }

    startNotificationAnimation(iconElement) {
        if (this.notificationInterval) clearInterval(this.notificationInterval);
        this.notificationInterval = setInterval(() => {
            iconElement.classList.add('notification-ring');
            setTimeout(() => iconElement.classList.remove('notification-ring'), 1000);
        }, 10000); // Every 10 seconds
    }

    stopNotificationAnimation() {
        if (this.notificationInterval) clearInterval(this.notificationInterval);
        this.notificationInterval = null;
    }
}

// Initialize utilities when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.rentalUtils = new RentalUtils();
    window.settingsService = new SettingsService();
});
