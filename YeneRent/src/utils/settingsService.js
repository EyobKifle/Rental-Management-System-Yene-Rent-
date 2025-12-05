// YeneRent/src/utils/settingsService.js

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

export const settingsService = new SettingsService();
