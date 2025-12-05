// YeneRent/src/utils/utils.js
// This file will contain generic utility functions for the React application.

import { settingsService } from './settingsService';
// Assuming EthiopianDate will be migrated to ./ethiopianDate.js
import { EthiopianDate } from './ethiopianDate'; 

/**
 * Formats a number as a currency string.
 * @param {number} amount - The amount to format.
 * @param {string} [currency='ETB'] - The currency code.
 * @param {boolean} [compact=false] - If true, uses compact notation (e.g., 'K' for thousands).
 * @returns {string} - The formatted currency string.
 */
export function formatCurrency(amount, currency = 'ETB', compact = false) {
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
export function formatDate(date, options = {}) {
    if (!date) return 'N/A';
    const settings = settingsService.getSettings();
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
export function formatDateTime(date, options = {}) {
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
export function formatFileSize(bytes) {
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
export function generateId() {
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
export function readFileAsDataURL(file) {
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
export function debounce(func, wait) {
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
export function confirm(message) {
    return window.confirm(message);
}

/**
 * Formats a date string into a human-readable relative time (e.g., "5 minutes ago", "yesterday").
 * @param {string} dateString - The date string to format.
 * @returns {string} - The relative time string.
 */
export function getRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);
    const weeks = Math.round(days / 7);
    const months = Math.round(days / 30);
    const years = Math.round(days / 365);

    if (seconds < 45) {
        return 'just now';
    } else if (seconds < 90) {
        return 'a minute ago';
    } else if (minutes < 45) {
        return `${minutes} minutes ago`;
    } else if (minutes < 90) {
        return 'an hour ago';
    } else if (hours < 24) {
        return `${hours} hours ago`;
    } else if (hours < 48) {
        return 'yesterday';
    } else if (days < 7) {
        return `${days} days ago`;
    } else if (weeks < 4) {
        return `${weeks} weeks ago`;
    } else if (months < 12) {
        return `${months} months ago`;
    } else {
        return `${years} years ago`;
    }
}
