// =================================================================
// Shared Utility Functions
// =================================================================

/**
 * Formats a number as Ethiopian Birr (ETB).
 * @param {number} amount - The number to format.
 * @returns {string} - The formatted currency string.
 */
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ETB',
        minimumFractionDigits: 2,
    }).format(amount).replace('ETB', 'ETB ');
};

/**
 * Formats a date string into a more readable format (e.g., "Jun 5, 2024").
 * @param {string} dateString - The date string to format.
 * @returns {string} - The formatted date string.
 */
export const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

/**
 * Determines the status of a payment (Paid, Overdue, Scheduled).
 * @param {object} payment - The payment object.
 * @returns {{text: string, class: string}} - The status text and CSS class.
 */
export const getPaymentStatus = (payment) => {
    if (payment.status && payment.status === 'Paid') {
        return { text: 'Paid', class: 'status-paid' };
    }
    const today = new Date().setHours(0, 0, 0, 0);
    const dueDate = new Date(payment.dueDate).setHours(0, 0, 0, 0);

    if (today > dueDate) {
        return { text: 'Overdue', class: 'status-overdue' };
    }
    return { text: 'Scheduled', class: 'status-scheduled' };
};

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds have elapsed.
 * @param {Function} func - The function to debounce.
 * @param {number} wait - The number of milliseconds to delay.
 * @returns {Function} - The new debounced function.
 */
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};
