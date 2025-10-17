document.addEventListener('DOMContentLoaded', () => {
    const addPaymentBtn = document.getElementById('add-payment-btn');
    const paymentModalContainer = document.getElementById('payment-modal');
    const paymentsTableBody = document.getElementById('payments-table-body');
    const emptyState = document.getElementById('empty-state');
    const searchInput = document.getElementById('search-input');
    const statsCards = {
        totalCollected: document.getElementById('stat-total-collected'),
        outstanding: document.getElementById('stat-outstanding'),
        prepaid: document.getElementById('stat-prepaid'),
        thisMonth: document.getElementById('stat-this-month'),
    };

    const PAYMENT_KEY = 'payments';
    const TENANT_KEY = 'tenants';
    const PROPERTY_KEY = 'properties';

    let payments = [];
    let tenants = [];
    let properties = [];

    const initialize = async () => {
        await window.rentalUtils.headerPromise;
        [payments, tenants, properties] = await Promise.all([
            api.get(PAYMENT_KEY),
            api.get(TENANT_KEY),
            api.get(PROPERTY_KEY)
        ]);
        renderPayments();
        renderStats();
    };

    const renderStats = () => {
        const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
        // Placeholder logic for other stats
        statsCards.totalCollected.textContent = rentalUtils.formatCurrency(totalCollected);
        statsCards.outstanding.textContent = rentalUtils.formatCurrency(0);
        statsCards.prepaid.textContent = rentalUtils.formatCurrency(0);
        statsCards.thisMonth.textContent = rentalUtils.formatCurrency(0);
    };

    const renderPayments = (filter = '') => {
        paymentsTableBody.innerHTML = '';
        
        const filteredPayments = payments.filter(payment => {
            const tenant = tenants.find(t => t.id === payment.tenantId);
            return tenant && tenant.name.toLowerCase().includes(filter.toLowerCase());
        });

        if (filteredPayments.length === 0) {
            emptyState.classList.remove('hidden');
            paymentsTableBody.parentElement.parentElement.classList.add('hidden');
        } else {
            emptyState.classList.add('hidden');
            paymentsTableBody.parentElement.parentElement.classList.remove('hidden');
            filteredPayments.forEach(payment => {
                const tenant = tenants.find(t => t.id === payment.tenantId);
                const property = properties.find(p => p.id === tenant?.propertyId);
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${tenant?.name || 'N/A'}</td>
                    <td>${property?.name || 'N/A'}</td>
                    <td>${rentalUtils.formatCurrency(payment.amount)}</td>
                    <td>${rentalUtils.formatDate(payment.date)}</td>
                    <td>${payment.method}</td>
                    <td><a href="#" class="receipt-link">RCP-${payment.id.slice(0, 5)}</a></td>
                    <td><span class="status-badge status-completed">Completed</span></td>
                    <td>
                        <div class="action-dropdown">
                            <button type="button" class="action-dropdown-btn" data-id="${payment.id}"><i data-lucide="more-horizontal"></i></button>
                            <div id="dropdown-${payment.id}" class="dropdown-menu hidden">
                                <a href="#" class="dropdown-item edit-btn" data-id="${payment.id}"><i data-lucide="edit-2"></i>Edit</a>
                                <a href="#" class="dropdown-item delete-btn" data-id="${payment.id}"><i data-lucide="trash-2"></i>Delete</a>
                            </div>
                        </div>
                    </td>
                `;
                paymentsTableBody.appendChild(row);
            });
            rentalUtils.setupLucideIcons();
        }
    };

    const openPaymentModal = async (payment = null) => {
        const response = await fetch('modal.html');
        paymentModalContainer.innerHTML = await response.text();
        const modal = paymentModalContainer.querySelector('.modal-overlay');
        modal.querySelector('#modal-title').textContent = payment ? 'Edit Payment' : 'Record Payment';

        const tenantOptions = tenants.map(t => `<option value="${t.id}" ${payment && payment.tenantId === t.id ? 'selected' : ''}>${t.name}</option>`).join('');

        modal.querySelector('#modal-body').innerHTML = `
            <form id="payment-form">
                <input type="hidden" id="payment-id" value="${payment ? payment.id : ''}">
                <div class="form-group">
                    <label for="payment-tenant" class="form-label">Tenant</label>
                    <select id="payment-tenant" class="form-input" required>
                        <option value="">Select a tenant</option>
                        ${tenantOptions}
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="payment-amount" class="form-label">Amount (ETB)</label>
                        <input type="number" id="payment-amount" class="form-input" value="${payment ? payment.amount : ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="payment-date" class="form-label">Payment Date</label>
                        <input type="date" id="payment-date" class="form-input" value="${payment ? payment.date : ''}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="payment-method" class="form-label">Payment Method</label>
                    <select id="payment-method" class="form-input" required>
                        <option value="Bank Transfer" ${payment && payment.method === 'Bank Transfer' ? 'selected' : ''}>Bank Transfer</option>
                        <option value="Cash" ${payment && payment.method === 'Cash' ? 'selected' : ''}>Cash</option>
                        <option value="Mobile Money" ${payment && payment.method === 'Mobile Money' ? 'selected' : ''}>Mobile Money</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="button" class="close-modal-btn btn-secondary">Cancel</button>
                    <button type="submit" class="btn-primary">Save Payment</button>
                </div>
            </form>
        `;
        rentalUtils.openModal(modal);
        modal.querySelector('#payment-form').addEventListener('submit', handleFormSubmit);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const form = e.target;
        if (!rentalUtils.validateForm(form)) return;

        const id = form.querySelector('#payment-id').value;
        const paymentData = {
            id: id || rentalUtils.generateId(),
            tenantId: form.querySelector('#payment-tenant').value,
            amount: parseFloat(form.querySelector('#payment-amount').value),
            date: form.querySelector('#payment-date').value,
            method: form.querySelector('#payment-method').value,
        };

        if (id) {
            await api.update(PAYMENT_KEY, id, paymentData);
            payments = payments.map(p => p.id === id ? paymentData : p);
        } else {
            await api.create(PAYMENT_KEY, paymentData);
            payments.push(paymentData);
        }

        renderPayments();
        renderStats();
        rentalUtils.closeModal(form.closest('.modal-overlay'));
        rentalUtils.showNotification(`Payment ${id ? 'updated' : 'recorded'} successfully!`);
    };

    paymentsTableBody.addEventListener('click', (e) => {
        const id = e.target.closest('[data-id]')?.dataset.id;
        if (!id) return;

        if (e.target.closest('.edit-btn')) {
            e.preventDefault();
            const paymentToEdit = payments.find(p => p.id === id);
            openPaymentModal(paymentToEdit);
        } else if (e.target.closest('.delete-btn')) {
            e.preventDefault();
            if (rentalUtils.confirm('Are you sure you want to delete this payment record?')) {
                api.delete(PAYMENT_KEY, id).then(() => {
                    payments = payments.filter(p => p.id !== id);
                    renderPayments();
                    renderStats();
                    rentalUtils.showNotification('Payment deleted successfully!', 'error');
                });
            }
        }
    });

    addPaymentBtn.addEventListener('click', () => openPaymentModal());
    searchInput.addEventListener('input', rentalUtils.debounce(e => renderPayments(e.target.value), 300));

    initialize();
});