document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const mainContent = document.getElementById('main-content');
    const notificationsList = document.getElementById('notifications-list');
    const emptyState = document.getElementById('empty-state');

    // Data
    let allData = {};

    const initialize = async () => {
        await window.rentalUtils.headerPromise;
        const [payments, leases, tenants, properties, units, settings] = await Promise.all([
            api.get('payments'),
            api.get('leases'),
            api.get('tenants'),
            api.get('properties'),
            api.get('units'),
            window.settingsService.getSettings() // Get settings
        ]);
        allData = { payments, leases, tenants, properties, units, settings };

        renderNotifications();
        // Mark notifications as "viewed" by updating the last check time
        markNotificationsAsViewed();
    };

    const getPaymentStatus = (payment) => {
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

    const getDueTaxReminders = (reminders = []) => {
        if (!reminders) return [];
        const dueReminders = [];
        const today = new Date();
        const todayDate = today.getDate();
        const todayMonth = today.getMonth() + 1; // 1-12
        const currentHour = today.getHours();
        const currentMinute = today.getMinutes();

        reminders.forEach(reminder => {
            if (!reminder.enabled) return; // Skip disabled reminders

            let isDue = false;
            switch (reminder.type) {
                case 'monthly':
                    isDue = todayDate === reminder.day;
                    break;
                case 'quarterly': {
                    // Check if today matches any of the user-defined quarterly dates
                    const todayStr = today.toISOString().split('T')[0];
                    isDue = reminder.quarterlyDates?.includes(todayStr);
                    break;
                }
                case 'annually':
                    isDue = todayDate === reminder.day && todayMonth === reminder.month;
                    break;
                case 'specific':
                    const specificDate = new Date(reminder.date);
                    isDue = today.getFullYear() === specificDate.getFullYear() && todayMonth === (specificDate.getMonth() + 1) && todayDate === specificDate.getDate();
                    break;
            }
            // Also check if the time has passed for today's reminders
            const reminderHour = reminder.hour || 0;
            const reminderMinute = reminder.minute || 0;
            if (isDue && (currentHour > reminderHour || (currentHour === reminderHour && currentMinute >= reminderMinute))) {
                dueReminders.push(reminder);
            }
        });
        return dueReminders;
    };

    const markNotificationsAsViewed = () => {
        const settings = window.settingsService.getSettings();
        settings.general.lastNotificationCheck = new Date().toISOString();
        window.settingsService.saveSettings(settings);
        rentalUtils.stopNotificationAnimation(); // Immediately stop animation
    };

    const renderNotifications = () => {
        notificationsList.innerHTML = '';
        let notificationCount = 0;

        const overduePayments = allData.payments.filter(p => getPaymentStatus(p).text === 'Overdue');
        notificationCount += overduePayments.length;

        // Check for tax reminders
        const dueTaxReminders = getDueTaxReminders(allData.settings.notifications.taxReminders);
        notificationCount += dueTaxReminders.length;

        dueTaxReminders.forEach(reminder => {
            const card = document.createElement('div');
            card.className = 'notification-card tax-due'; // New class for styling
            card.innerHTML = `
                <div class="notification-icon"><i class="fa-solid fa-landmark"></i></div>
                <div class="notification-content">
                    <p class="notification-title">${reminder.name || 'Tax Payment Due'}</p>
                    <p class="notification-details">
                        This is a scheduled reminder to pay your taxes.
                    </p>
                </div>
                <div class="notification-actions">
                    <a href="settings.html#tax" class="btn-secondary">View Settings</a>
                </div>
            `;
            notificationsList.appendChild(card);
        });

        if (notificationCount === 0) {
            emptyState.classList.remove('hidden');
            notificationsList.classList.add('hidden');
        } else {
            emptyState.classList.add('hidden');
            notificationsList.classList.remove('hidden');
            overduePayments.forEach(payment => {
                const lease = allData.leases.find(l => l.id === payment.leaseId);
                if (!lease) return;

                const tenant = allData.tenants.find(t => t.id === lease.tenantId);
                const property = allData.properties.find(p => p.id === lease.propertyId);

                const card = document.createElement('div');
                card.className = 'notification-card overdue';
                card.innerHTML = `
                    <div class="notification-icon"><i class="fa-solid fa-file-invoice-dollar"></i></div>
                    <div class="notification-content">
                        <p class="notification-title">Overdue Rent Payment</p>
                        <p class="notification-details">
                            <strong>${tenant?.name || 'N/A'}</strong> owes <strong>${rentalUtils.formatCurrency(payment.amount)}</strong> for <strong>${property?.name || 'N/A'}</strong>.
                            Due on ${rentalUtils.formatDate(payment.dueDate)}.
                        </p>
                    </div>
                    <div class="notification-actions">
                        <button class="btn-primary mark-paid-btn" data-id="${payment.id}">Mark as Paid</button>
                        <a href="payments.html?editId=${payment.id}" class="btn-secondary">View Details</a>
                    </div>
                `;
                notificationsList.appendChild(card);
            });
        }
    };

    const openMarkAsPaidModal = async (paymentId) => {
        const payment = allData.payments.find(p => p.id === paymentId);
        if (!payment) return;

        const lease = allData.leases.find(l => l.id === payment.leaseId);
        const tenant = lease ? allData.tenants.find(t => t.id === lease.tenantId) : null;

        const bodyHtml = `
            <form id="payment-form">
                <input type="hidden" id="payment-id" value="${payment.id}">
                <p>Confirming payment for <strong>${tenant?.name || 'N/A'}</strong> for amount <strong>${rentalUtils.formatCurrency(payment.amount)}</strong> due on ${rentalUtils.formatDate(payment.dueDate)}.</p>
                <div class="form-group">
                    <label for="payment-date" class="form-label">Payment Date</label>
                    <input type="date" id="payment-date" class="form-input" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="form-group">
                    <label for="payment-method" class="form-label">Method</label>
                    <select id="payment-method" class="form-input" required>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cash">Cash</option>
                        <option value="CBE Birr">CBE Birr</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="button" class="close-modal-btn btn-secondary">Cancel</button>
                    <button type="submit" class="btn-primary">Confirm Payment</button>
                </div>
            </form>
        `;
        await rentalUtils.createAndOpenModal({ modalId: 'payment-modal', title: 'Confirm Payment Received', bodyHtml, formId: 'payment-form', onSubmit: handleMarkAsPaidSubmit });
    };

    const handleMarkAsPaidSubmit = async (e) => {
        e.preventDefault();
        const form = e.target;
        if (!rentalUtils.validateForm(form)) return;

        const id = form.querySelector('#payment-id').value;
        const paymentData = {
            status: 'Paid',
            date: form.querySelector('#payment-date').value,
            method: form.querySelector('#payment-method').value,
        };

        await api.update('payments', id, paymentData);
        allData.payments = allData.payments.map(p => p.id === id ? { ...p, ...paymentData } : p);

        renderNotifications();
        rentalUtils.closeModal(form.closest('.modal-overlay'));
        rentalUtils.showNotification(`Payment recorded successfully!`);
    };

    notificationsList.addEventListener('click', (e) => {
        const markPaidBtn = e.target.closest('.mark-paid-btn');
        if (markPaidBtn) {
            const paymentId = markPaidBtn.dataset.id;
            openMarkAsPaidModal(paymentId);
        }
    });

    initialize();

    // Handle hash for settings link
    if(window.location.hash === '#preferences') {
        document.getElementById('preferences-tab-link')?.click();
    }
});