document.addEventListener('DOMContentLoaded', () => {
    const tabsContainer = document.querySelector('.settings-tabs');
    const tabLinks = document.querySelectorAll('.setting-tab');
    const tabPanels = document.querySelectorAll('.setting-tab-content');
    const taxForm = document.getElementById('tax-settings-form');
    const preferencesForm = document.getElementById('preferences-tab-panel'); // A container for preferences
    const addReminderBtn = document.getElementById('add-reminder-btn');
    const darkModeToggle = document.getElementById('dark-mode-toggle');

    const initialize = async () => {
        await window.rentalUtils.headerPromise;

        // Load existing settings into the form
        loadTaxSettings();
        setupEventListeners();
        loadRegionalSettings();
        loadNotificationSettings();
        loadAppearanceSettings();
        
        const switchTab = (tabId) => {
            const targetTab = document.querySelector(`.setting-tab[data-tab="${tabId}"]`);
            if (!targetTab) return;

            tabLinks.forEach(link => {
                link.classList.toggle('active-tab', link === targetTab);
            });

            tabPanels.forEach(panel => {
                panel.classList.toggle('hidden', panel.id !== `${tabId}-tab-panel`);
            });
        };

        tabsContainer.addEventListener('click', (e) => {
            e.preventDefault();
            const clickedTab = e.target.closest('.setting-tab');
            if (clickedTab) {
                window.location.hash = clickedTab.dataset.tab;
            }
        });

        window.addEventListener('hashchange', () => switchTab(window.location.hash.substring(1)));

        const initialTab = window.location.hash.substring(1) || 'profile';
        switchTab(initialTab);
    };

    const loadTaxSettings = () => {
        const settings = window.settingsService.getSettings();
        document.getElementById('vat-rate-tax').value = settings.tax.vatRate * 100;
        document.getElementById('withholding-tax-rate').value = settings.tax.withholdingTaxRate * 100;
        document.getElementById('business-income-tax-rate').value = settings.tax.businessIncomeTaxRate * 100;
        document.getElementById('expense-vat-deductible-rate').value = settings.tax.expenseVatDeductibleRate * 100;
    };

    const loadRegionalSettings = () => {
        const settings = window.settingsService.getSettings();
        const calendarSystemSelect = document.getElementById('calendar-system');
        if (calendarSystemSelect) calendarSystemSelect.value = settings.regional.calendar;
    };

    const loadAppearanceSettings = () => {
        const settings = window.settingsService.getSettings();
        if (darkModeToggle) darkModeToggle.checked = settings.appearance.theme === 'dark';
    };


    const loadNotificationSettings = () => {
        const remindersList = document.getElementById('tax-reminders-list');
        const settings = window.settingsService.getSettings();
        remindersList.innerHTML = '';

        if (!settings.notifications.taxReminders || settings.notifications.taxReminders.length === 0) {
            remindersList.innerHTML = `<p class="text-center text-gray-500 p-4">No tax reminders set. Click "Add New Reminder" to get started.</p>`;
            return;
        }

        settings.notifications.taxReminders.forEach(reminder => {
            const item = document.createElement('div');
            item.className = 'notification-item';
            item.innerHTML = `
                <div>
                    <p>${reminder.name}</p>
                    <p>Repeats: ${reminder.type}</p>
                </div>
                <div>
                    <button class="btn-icon edit-reminder-btn" data-id="${reminder.id}"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-icon btn-icon-danger delete-reminder-btn" data-id="${reminder.id}"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            remindersList.appendChild(item);
        });
    };

    const openReminderModal = async (reminder = null) => {
        const isEditing = reminder !== null;
        const title = isEditing ? 'Edit Tax Reminder' : 'Add New Tax Reminder';
        // Use reminder's calendar, or global default for new ones
        const reminderCalendar = reminder?.calendar || window.settingsService.getSettings().regional.calendar;

        const bodyHtml = `
            <form id="reminder-form" novalidate>
                <input type="hidden" id="reminder-id" value="${isEditing ? reminder.id : rentalUtils.generateId()}">
                <div class="form-row-columns">
                    <div class="form-group">
                        <label for="reminder-name" class="form-label">Reminder Name</label>
                        <input type="text" id="reminder-name" class="form-input" value="${isEditing ? reminder.name : ''}" placeholder="e.g., Monthly VAT Payment" required>
                    </div>
                    <div class="form-group" style="max-width: 180px;">
                        <label for="reminder-calendar" class="form-label">Calendar</label>
                        <select id="reminder-calendar" class="form-input">
                            <option value="gregorian" ${reminderCalendar === 'gregorian' ? 'selected' : ''}>Gregorian</option>
                            <option value="ethiopian" ${reminderCalendar === 'ethiopian' ? 'selected' : ''}>Ethiopian</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="reminder-type" class="form-label">Frequency</label>
                    <select id="reminder-type" class="form-input" required></select>
                </div>

                <!-- Dynamic content area for frequency options -->
                <div id="reminder-options-container"></div>

                <div class="form-group">
                    <label for="reminder-time" class="form-label">Reminder Time</label>
                    <input type="time" id="reminder-time" class="form-input" value="${isEditing && reminder.hour !== undefined ? `${String(reminder.hour).padStart(2, '0')}:${String(reminder.minute).padStart(2, '0')}` : '09:00'}" required style="max-width: 200px;">
                </div>
                <div class="form-actions">
                    <button type="button" class="close-modal-btn btn-secondary">Cancel</button>
                    <button type="submit" class="btn-primary">Save Reminder</button>
                </div>
            </form>
        `;

        await rentalUtils.createAndOpenModal({ modalId: 'reminder-modal', title, bodyHtml, formId: 'reminder-form', onSubmit: handleReminderFormSubmit, maxWidth: '700px' });

        // --- Post-Modal-Creation Logic ---
        const modal = document.getElementById('reminder-modal');
        const calendarSelect = modal.querySelector('#reminder-calendar');
        const typeSelect = modal.querySelector('#reminder-type');
        const optionsContainer = modal.querySelector('#reminder-options-container');

        const getNextOccurrence = (calendar, type, data) => {
            const today = new Date();
            let nextDate;

            if (type === 'monthly') {
                nextDate = new Date(today.getFullYear(), today.getMonth(), data.day);
                if (nextDate < today) nextDate.setMonth(nextDate.getMonth() + 1);
            } else if (type === 'annually') {
                nextDate = new Date(today.getFullYear(), data.month - 1, data.day);
                if (nextDate < today) nextDate.setFullYear(nextDate.getFullYear() + 1);
            } else {
                return ''; // Not applicable for other types in this preview
            }

            if (calendar === 'ethiopian') {
                const etDate = new EthiopianDate(nextDate);
                return `ቀጣይ: ${etDate.dayName}, ${etDate.monthName} ${etDate.date}, ${etDate.year} ${etDate.era}`;
            } else {
                return `Next: ${nextDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
            }
        };

        const renderFrequencyOptions = () => {
            const calendar = calendarSelect.value;
            const type = typeSelect.value;
            const isEthiopian = calendar === 'ethiopian';
            const dateInputType = isEthiopian ? 'text' : 'date';

            let content = '';

            if (type === 'monthly') {
                const day = reminder?.type === 'monthly' ? reminder.day : 15;
                content = `
                    <div class="form-group">
                        <label for="reminder-day" class="form-label">Day of the month</label>
                        <input type="number" id="reminder-day" class="form-input" min="1" max="31" value="${day}" style="width: 100px;">
                        <div class="form-hint" id="monthly-preview"></div>
                    </div>`;
            } else if (type === 'annually') {
                const months = isEthiopian
                    ? ['መስከረም', 'ጥቅምት', 'ኅዳር', 'ታኅሣሥ', 'ጥር', 'የካቲት', 'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜ']
                    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                const monthOptions = months.map((m, i) => `<option value="${i + 1}" ${reminder?.month === (i + 1) ? 'selected' : ''}>${m}</option>`).join('');
                content = `
                    <div class="form-row-columns">
                        <div class="form-group">
                            <label for="reminder-month" class="form-label">Month</label> 
                            <select id="reminder-month" class="form-input">${monthOptions}</select>
                        </div>
                        <div class="form-group">
                            <label for="reminder-day" class="form-label">Day</label>
                            <input type="number" id="reminder-day" class="form-input" min="1" max="31" value="${reminder?.day || 1}" style="width: 100px;">
                        </div>
                    </div>
                    <div class="form-hint" id="annual-preview"></div>`;
            } else if (type === 'quarterly') {
                const dates = reminder?.quarterlyDates || ['2025-01-15', '2025-04-15', '2025-07-15', '2025-10-15'];
                 content = `
                    <p class="form-label">Set the four quarterly reminder dates:</p>
                    <div class="form-row-columns" style="flex-wrap: wrap;">
                        ${[0, 1, 2, 3].map(i => `
                            <div class="form-group">
                                <label for="q-date-${i}" class="form-label" style="font-size: 0.8rem;">Quarter ${i + 1}</label>
                                <input type="${dateInputType}" id="q-date-${i}" class="form-input quarterly-date" value="${dates[i]}" placeholder="${isEthiopian ? 'DD/MM/YYYY' : ''}">
                                <div class="form-hint" id="q-preview-${i}"></div>
                            </div>
                        `).join('')}
                    </div>`;
            } else if (type === 'specific') {
                content = `
                    <div class="form-group">
                        <label for="reminder-specific-date" class="form-label">Date</label>
                        <input type="${dateInputType}" id="reminder-specific-date" class="form-input" value="${reminder?.date || ''}" placeholder="${isEthiopian ? 'DD/MM/YYYY' : ''}">
                        <div class="form-hint" id="specific-preview"></div>
                    </div>`;
            }
            optionsContainer.innerHTML = content;
            updatePreviews();
        };

        const updatePreviews = () => {
            const calendar = calendarSelect.value;
            const type = typeSelect.value;
            const isEthiopian = calendar === 'ethiopian';

            if (type === 'monthly') {
                const day = parseInt(modal.querySelector('#reminder-day').value, 10);
                if (!day) return;
                modal.querySelector('#monthly-preview').textContent = getNextOccurrence(calendar, 'monthly', { day });
            } else if (type === 'annually') {
                const month = parseInt(modal.querySelector('#reminder-month').value, 10);
                const day = parseInt(modal.querySelector('#reminder-day').value, 10);
                if (!month || !day) return;
                modal.querySelector('#annual-preview').textContent = getNextOccurrence(calendar, 'annually', { month, day });
            } else if (type === 'quarterly') {
                modal.querySelectorAll('.quarterly-date').forEach((input, i) => {
                    const dateVal = input.value;
                    if (!dateVal) return;
                    let dateObj;
                    if (isEthiopian) {
                        const [d, m, y] = dateVal.split('/').map(p => parseInt(p, 10));
                        if (!d || !m || !y) return;
                        const gArr = EthiopianDate.toGregorian(y, m, d);
                        dateObj = new Date(gArr[0], gArr[1] - 1, gArr[2]);
                    } else {
                        dateObj = new Date(dateVal.replace(/-/g, '/'));
                    }
                    const previewEl = modal.querySelector(`#q-preview-${i}`);
                    if (isEthiopian) {
                        const etDate = new EthiopianDate(dateObj);
                        previewEl.textContent = `${etDate.dayName}, ${etDate.monthName} ${etDate.date}, ${etDate.year}`;
                    } else {
                        previewEl.textContent = dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                    }
                });
            } else if (type === 'specific') {
                 const dateVal = modal.querySelector('#reminder-specific-date').value;
                 if (!dateVal) return;
                 // Logic is the same as quarterly, just for one field
                 let dateObj;
                 if (isEthiopian) {
                     const [d, m, y] = dateVal.split('/').map(p => parseInt(p, 10));
                     if (!d || !m || !y) return;
                     const gArr = EthiopianDate.toGregorian(y, m, d);
                     dateObj = new Date(gArr[0], gArr[1] - 1, gArr[2]);
                 } else {
                     dateObj = new Date(dateVal.replace(/-/g, '/'));
                 }
                 const previewEl = modal.querySelector('#specific-preview');
                 if (isEthiopian) {
                     const etDate = new EthiopianDate(dateObj);
                     previewEl.textContent = `${etDate.dayName}, ${etDate.monthName} ${etDate.date}, ${etDate.year}`;
                 } else {
                     previewEl.textContent = dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                 }
            }
        };

        const populateTypeSelect = () => {
            const types = [
                { value: 'monthly', text: 'Monthly' },
                { value: 'quarterly', text: 'Quarterly' },
                { value: 'annually', text: 'Annually' },
                { value: 'specific', text: 'Specific Date' },
            ];
            typeSelect.innerHTML = types.map(t => `<option value="${t.value}">${t.text}</option>`).join('');
            if (isEditing) {
                typeSelect.value = reminder.type;
            }
        };

        // Setup
        populateTypeSelect();
        renderFrequencyOptions();

        // Event Listeners
        calendarSelect.addEventListener('change', renderFrequencyOptions);
        typeSelect.addEventListener('change', renderFrequencyOptions);
        optionsContainer.addEventListener('input', (e) => {
            if (e.target.matches('input') || e.target.matches('select')) {
                updatePreviews();
            }
        });
    };


    const handleReminderFormSubmit = async (e) => {
        e.preventDefault();
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const id = form.querySelector('#reminder-id').value;
        rentalUtils.toggleButtonLoading(submitBtn, true);
        const type = form.querySelector('#reminder-type')?.value;
        const timeStr = form.querySelector('#reminder-time').value;
        const calendar = form.querySelector('#reminder-calendar').value;

        const [hour, minute] = timeStr.split(':').map(p => parseInt(p, 10));

        const reminderData = {
            id: id,
            name: form.querySelector('#reminder-name').value,
            calendar: calendar,
            type: type,
            hour: hour,
            minute: minute,
            enabled: true,
        };
        if (!rentalUtils.validateForm(form)) { rentalUtils.toggleButtonLoading(submitBtn, false); return; }

        if (type === 'monthly') {
            reminderData.day = parseInt(form.querySelector('#reminder-day').value, 10);
        } else if (type === 'annually') {
            reminderData.month = parseInt(form.querySelector('#reminder-month').value, 10);
            reminderData.day = parseInt(form.querySelector('#reminder-day').value, 10);
        } else if (type === 'quarterly') {
            reminderData.quarterlyDates = Array.from(form.querySelectorAll('.quarterly-date')).map(input => {
                return calendar === 'ethiopian' ? getGregorianDate(input.value) : input.value;
            });
        } else if (type === 'specific') {
            const specificDateStr = form.querySelector('#reminder-specific-date').value;
            reminderData.date = calendar === 'ethiopian' ? getGregorianDate(specificDateStr) : specificDateStr;
        }

        await saveReminder(reminderData);
        rentalUtils.toggleButtonLoading(submitBtn, false);
        rentalUtils.closeModal(form.closest('.modal-overlay'));
        rentalUtils.showNotification('Tax reminder saved!');
    };


    const saveReminder = async (reminderData) => {
        const settings = window.settingsService.getSettings();
        const existingIndex = settings.notifications.taxReminders.findIndex(r => r.id === reminderData.id);

        if (existingIndex > -1) {
            settings.notifications.taxReminders[existingIndex] = reminderData;
        } else {
            settings.notifications.taxReminders.push(reminderData);
        }
        await saveAllSettings(settings);
    };

    const deleteReminder = (reminderId) => {
        if (!rentalUtils.confirm('Are you sure you want to delete this reminder?')) return;
        const settings = window.settingsService.getSettings();
        settings.notifications.taxReminders = settings.notifications.taxReminders.filter(r => r.id !== reminderId);
        saveAllSettings(settings);
        rentalUtils.showNotification('Reminder deleted.', 'error');
    };

    const saveTaxSettings = () => {
        const currentSettings = window.settingsService.getSettings();
        const newTaxSettings = {
            vatRate: parseFloat(document.getElementById('vat-rate-tax').value) / 100,
            withholdingTaxRate: parseFloat(document.getElementById('withholding-tax-rate').value) / 100,
            businessIncomeTaxRate: parseFloat(document.getElementById('business-income-tax-rate').value) / 100,
            expenseVatDeductibleRate: parseFloat(document.getElementById('expense-vat-deductible-rate').value) / 100,
        };

        const updatedSettings = {
            ...currentSettings,
            tax: newTaxSettings,
        };

        window.settingsService.saveSettings(updatedSettings);
        window.rentalUtils.showNotification('Tax settings saved successfully!', 'success');
    };

    const saveRegionalSettings = () => {
        const currentSettings = window.settingsService.getSettings();
        const calendarSystem = document.getElementById('calendar-system').value;

        const newRegionalSettings = {
            ...currentSettings.regional,
            calendar: calendarSystem,
        };

        const updatedSettings = {
            ...currentSettings,
            regional: newRegionalSettings,
        };

        window.settingsService.saveSettings(updatedSettings);
        window.rentalUtils.showNotification('Regional settings saved successfully!', 'success');
    };

    const saveAllSettings = async (settings) => {
        window.settingsService.saveSettings(settings);
        loadNotificationSettings(); // Re-render the list
    };

    const getGregorianDate = (dateString) => {
        // Convert from Ethiopian DD/MM/YYYY to Gregorian YYYY-MM-DD
        const parts = dateString.split('/');
        if (parts.length !== 3) return null; // Invalid format
        const [day, month, year] = parts.map(p => parseInt(p, 10));
        try {
            const gregorianArr = EthiopianDate.toGregorian(year, month, day);
            const gDate = new Date(gregorianArr[0], gregorianArr[1] - 1, gregorianArr[2]);
            return gDate.toISOString().split('T')[0];
        } catch (e) {
            console.error("Ethiopian date conversion failed:", e);
            return null;
        }
    };

    const setupEventListeners = () => {
        if (taxForm) {
            taxForm.addEventListener('submit', (e) => {
                e.preventDefault();
                saveTaxSettings();
            });
        }

        // Save regional settings on change
        const calendarSystemSelect = document.getElementById('calendar-system');
        if (calendarSystemSelect) {
            calendarSystemSelect.addEventListener('change', saveRegionalSettings);
        }

        if (darkModeToggle) {
            darkModeToggle.addEventListener('change', rentalUtils.toggleTheme);
        }

        addReminderBtn.addEventListener('click', () => openReminderModal());

        const remindersList = document.getElementById('tax-reminders-list');
        remindersList.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-reminder-btn');
            const deleteBtn = e.target.closest('.delete-reminder-btn');
            const settings = window.settingsService.getSettings();

            if (editBtn) {
                const reminder = settings.notifications.taxReminders.find(r => r.id === editBtn.dataset.id);
                if (reminder) openReminderModal(reminder);
            } else if (deleteBtn) {
                deleteReminder(deleteBtn.dataset.id);
            }
        });
    };

    initialize();
});