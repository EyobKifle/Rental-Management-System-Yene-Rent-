document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const paymentModalContainer = document.getElementById('payment-modal');
    const paymentsTableBody = document.getElementById('payments-table-body');
    const emptyState = document.getElementById('empty-state');
    const searchInput = document.getElementById('search-input');

    // Stat Elements
    const statTotalCollected = document.getElementById('stat-total-collected');
    const statThisMonth = document.getElementById('stat-this-month');
    const statOutstanding = document.getElementById('stat-outstanding');
    const statOverdue = document.getElementById('stat-overdue');

    // Keys
    const PAYMENT_KEY = 'payments';
    const LEASE_KEY = 'leases';
    const TENANT_KEY = 'tenants';
    const PROPERTY_KEY = 'properties';
    const UNIT_KEY = 'units';

    // Data
    let allData = {};

    const initialize = async () => {
        await window.rentalUtils.headerPromise;
        const [payments, leases, tenants, properties, units] = await Promise.all([
            api.get(PAYMENT_KEY),
            api.get(LEASE_KEY),
            api.get(TENANT_KEY),
            api.get(PROPERTY_KEY),
            api.get(UNIT_KEY)
        ]);
        allData = { payments, leases, tenants, properties, units };

        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('editId');
        if (editId) {
            const paymentToEdit = allData.payments.find(p => p.id === editId);
            if (paymentToEdit) openPaymentModal(paymentToEdit);
        }

        renderPayments();
        calculateStats();
    };

    const getPaymentStatus = (payment) => {
        if (payment.status === 'Paid') {
            return { text: 'Paid', class: 'status-paid' };
        }
        const today = new Date().setHours(0, 0, 0, 0);
        const dueDate = new Date(payment.dueDate).setHours(0, 0, 0, 0);

        if (today > dueDate) {
            return { text: 'Overdue', class: 'status-overdue' };
        }
        return { text: 'Scheduled', class: 'status-scheduled' };
    };


    const renderPayments = (filter = '') => {
        paymentsTableBody.innerHTML = '';
        const searchLower = filter.toLowerCase();

        const filteredPayments = allData.payments.filter(payment => {
            const lease = allData.leases.find(l => l.id === payment.leaseId);
            if (!lease) return false;
            const tenant = allData.tenants.find(t => t.id === lease.tenantId);
            const property = allData.properties.find(p => p.id === lease.propertyId); // This was incorrect, property is on lease
            return (tenant?.name.toLowerCase().includes(searchLower) || property?.name.toLowerCase().includes(searchLower));
        });

        if (filteredPayments.length === 0) {
            emptyState.classList.remove('hidden');
            paymentsTableBody.closest('.data-card').classList.add('hidden');
        } else {
            emptyState.classList.add('hidden');
            paymentsTableBody.closest('.data-card').classList.remove('hidden');
            // Sort by due date, most recent first
            filteredPayments.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate)).forEach(payment => {
                const lease = allData.leases.find(l => l.id === payment.leaseId);
                const tenant = lease ? allData.tenants.find(t => t.id === lease.tenantId) : null;
                const property = lease ? allData.properties.find(p => p.id === lease.propertyId) : null;
                const unit = lease ? allData.units.find(u => u.id === lease.unitId) : null;
                const status = getPaymentStatus(payment);

                const row = document.createElement('tr');
                row.dataset.id = payment.id; // Add ID to row for click events
                row.innerHTML = `
                    <td>${tenant?.name || 'N/A'}</td>
                    <td>${property?.name || 'N/A'} ${unit ? `(Unit ${unit.unitNumber})` : ''}</td>
                    <td>${rentalUtils.formatDate(payment.dueDate)}</td>
                    <td>${rentalUtils.formatCurrency(payment.amount)}</td>
                    <td><span class="status-badge ${status.class}">${status.text}</span></td>
                    <td>
                        <div class="action-dropdown">
                            <button class="action-dropdown-btn" data-id="${payment.id}"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                            <div id="dropdown-${payment.id}" class="dropdown-menu hidden">
                                <a href="payments-details.html?paymentId=${payment.id}" class="dropdown-item"><i class="fa-solid fa-eye"></i>View Details</a>
                                ${status.text !== 'Paid' ? `<a href="#" class="dropdown-item edit-btn" data-id="${payment.id}"><i class="fa-solid fa-check-circle"></i>Mark as Paid</a>` : ''}
                                <a href="#" class="dropdown-item delete-btn" data-id="${payment.id}"><i class="fa-solid fa-trash-can"></i>Delete</a>
                            </div>
                        </div>
                    </td>
                `;
                paymentsTableBody.appendChild(row);
            });
        }
    };

    const calculateStats = () => {
        const totalCollected = allData.payments
            .filter(p => p.status === 'Paid')
            .reduce((sum, p) => sum + p.amount, 0);

        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthCollected = allData.payments
            .filter(p => p.status === 'Paid' && new Date(p.date) >= firstDayOfMonth)
            .reduce((sum, p) => sum + p.amount, 0);

        const overduePayments = allData.payments.filter(p => getPaymentStatus(p).text === 'Overdue');
        const overdueAmount = overduePayments.reduce((sum, p) => sum + p.amount, 0);

        statTotalCollected.textContent = rentalUtils.formatCurrency(totalCollected);
        statThisMonth.textContent = rentalUtils.formatCurrency(thisMonthCollected);
        statOutstanding.textContent = rentalUtils.formatCurrency(overdueAmount); // Using this for overdue
        statOverdue.textContent = overduePayments.length; // Using this for count
    };

    const openPaymentModal = async (payment = null) => {
        const lease = allData.leases.find(l => l.id === payment.leaseId);
        const tenant = lease ? allData.tenants.find(t => t.id === lease.tenantId) : null;

        const bodyHtml = `
            <form id="payment-form">
                <input type="hidden" id="payment-id" value="${payment?.id || ''}">
                <p>Marking payment for <strong>${tenant?.name || 'N/A'}</strong> for amount <strong>${rentalUtils.formatCurrency(payment.amount)}</strong> due on ${rentalUtils.formatDate(payment.dueDate)}.</p>
                <div class="form-row">
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
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="payment-receipt-number" class="form-label">Receipt Number (Optional)</label>
                        <input type="text" id="payment-receipt-number" class="form-input" value="">
                    </div>
                    <div class="form-group">
                        <label for="tenant-tin" class="form-label">Tenant TIN (Optional)</label>
                        <input type="text" id="tenant-tin" class="form-input" value="">
                    </div>
                </div>
                <div class="form-group">
                    <label for="receipt-file" class="form-label">Receipt (Optional)</label>
                    <input type="file" id="receipt-file" class="form-input" accept="image/*">
                </div>
                <div class="form-actions">
                    <button type="button" class="close-modal-btn btn-secondary">Cancel</button>
                    <button type="submit" class="btn-primary">Save Payment</button>
                </div>
            </form>
        `;
        await rentalUtils.createAndOpenModal({ modalId: 'payment-modal', title: 'Record Payment', bodyHtml, formId: 'payment-form', onSubmit: handleFormSubmit });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const form = e.target;
        if (!rentalUtils.validateForm(form)) return;

        const id = form.querySelector('#payment-id').value;
        const existingPayment = allData.payments.find(p => p.id === id);
        const receiptFile = form.querySelector('#receipt-file').files[0];

        const paymentData = {
            ...existingPayment, // Keep all original scheduled data
            status: 'Paid',
            date: form.querySelector('#payment-date').value,
            method: form.querySelector('#payment-method').value,
            receiptNumber: form.querySelector('#payment-receipt-number').value || null,
            receiptUrl: receiptFile ? await rentalUtils.readFileAsDataURL(receiptFile) : existingPayment?.receiptUrl || null,
            // Note: TIN and withholding would ideally be saved on the tenant/lease or payment record
        };

        await api.update(PAYMENT_KEY, id, paymentData);
        allData.payments = allData.payments.map(p => p.id === id ? paymentData : p);

        renderPayments();
        calculateStats();
        rentalUtils.closeModal(form.closest('.modal-overlay'));
        rentalUtils.showNotification(`Payment recorded successfully!`);
    };

    paymentsTableBody.addEventListener('click', (e) => {
        const row = e.target.closest('tr');
        const id = row?.dataset.id;
        if (!id) return;

        if (e.target.closest('.action-dropdown-btn')) {
            e.stopPropagation(); // Prevent row click from firing
            // Close all other dropdowns first
            document.querySelectorAll('.dropdown-menu').forEach(menu => menu.classList.add('hidden'));
            document.getElementById(`dropdown-${id}`).classList.toggle('hidden');
        } else if (e.target.closest('.edit-btn')) {
            e.preventDefault();
            const paymentToEdit = allData.payments.find(p => p.id === id);
            openPaymentModal(paymentToEdit);
        } else if (e.target.closest('.delete-btn')) {
            e.preventDefault();
            if (rentalUtils.confirm('Are you sure you want to delete this payment?')) {
                api.delete(PAYMENT_KEY, id).then(() => {
                    allData.payments = allData.payments.filter(p => p.id !== id);
                    renderPayments();
                    calculateStats();
                    rentalUtils.showNotification('Payment deleted successfully!', 'error');
                });
            }
        } else {
            // If the click is on the row but not an action button, navigate to details
            window.location.href = `payments-details.html?paymentId=${id}`;
        }
    });

    searchInput.addEventListener('input', rentalUtils.debounce(e => renderPayments(e.target.value), 300));

    initialize();
});