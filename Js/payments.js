document.addEventListener('DOMContentLoaded', () => {
    const addPaymentBtn = document.getElementById('add-payment-btn');
    const paymentModalContainer = document.getElementById('payment-modal');
    const paymentsTableBody = document.getElementById('payments-table-body');
    const emptyState = document.getElementById('empty-state');
    const searchInput = document.getElementById('search-input');
    const statsCards = {
        totalCollected: document.getElementById('stat-total-collected'),
        thisMonth: document.getElementById('stat-this-month'),
        outstanding: document.getElementById('stat-outstanding'),
        overdue: document.getElementById('stat-overdue'),
    };

    const PAYMENT_KEY = 'payments';
    const TENANT_KEY = 'tenants';
    const PROPERTY_KEY = 'properties';
    const UNIT_KEY = 'units';
    const LEASE_KEY = 'leases';

    let payments = [];
    let tenants = [];
    let properties = [];
    let units = [];
    let leases = [];

    const initialize = async () => {
        await window.rentalUtils.headerPromise;
        [payments, tenants, properties, units, leases] = await Promise.all([
            api.get(PAYMENT_KEY),
            api.get(TENANT_KEY),
            api.get(PROPERTY_KEY),
            api.get(UNIT_KEY),
            api.get(LEASE_KEY)
        ]);
        renderPayments();
        renderStats();
    };

    const renderStats = () => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
        const thisMonthCollected = payments
            .filter(p => {
                const paymentDate = new Date(p.date);
                return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
            })
            .reduce((sum, p) => sum + p.amount, 0);

        // Simplified outstanding/overdue logic
        const activeLeases = leases.filter(l => new Date(l.endDate) >= today);
        const totalMonthlyRent = activeLeases.reduce((sum, l) => sum + l.rentAmount, 0);
        const outstanding = Math.max(0, totalMonthlyRent - thisMonthCollected);

        statsCards.totalCollected.textContent = rentalUtils.formatCurrency(totalCollected);
        statsCards.thisMonth.textContent = rentalUtils.formatCurrency(thisMonthCollected);
        statsCards.outstanding.textContent = rentalUtils.formatCurrency(outstanding);
        statsCards.overdue.textContent = rentalUtils.formatCurrency(0); // More complex logic needed
    };

    const renderPayments = (filter = '') => {
        paymentsTableBody.innerHTML = '';
        
        const filteredPayments = payments.filter(payment => {
            const lease = leases.find(l => l.id === payment.leaseId);
            if (!lease) return false;
            const tenant = tenants.find(t => t.id === lease.tenantId);
            const unit = units.find(u => u.id === lease.unitId);
            const property = unit ? properties.find(p => p.id === unit.propertyId) : null;
            const searchLower = filter.toLowerCase();

            return (tenant && tenant.name.toLowerCase().includes(searchLower)) ||
                   (property && property.name.toLowerCase().includes(searchLower));
        });

        if (filteredPayments.length === 0) {
            emptyState.classList.remove('hidden');
            paymentsTableBody.closest('.data-card').classList.add('hidden');
        } else {
            emptyState.classList.add('hidden');
            paymentsTableBody.closest('.data-card').classList.remove('hidden');
            filteredPayments.forEach(payment => {
                const lease = leases.find(l => l.id === payment.leaseId);
                const tenant = lease ? tenants.find(t => t.id === lease.tenantId) : null;
                const unit = lease ? units.find(u => u.id === lease.unitId) : null;
                const property = unit ? properties.find(p => p.id === unit.propertyId) : null;
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${tenant?.name || 'N/A'}</td>
                    <td>${property?.name || 'N/A'} <span class="lease-property-unit">Unit ${unit?.unitNumber || 'N/A'}</span></td>
                    <td>${rentalUtils.formatCurrency(payment.amount)}</td>
                    <td>${rentalUtils.formatDate(payment.date)}</td>
                    <td>${payment.method}</td>
                    <td>${payment.receiptUrl ? `<a href="${payment.receiptUrl}" target="_blank" class="receipt-link">View</a>` : 'None'}</td>
                    <td>
                        <div class="action-dropdown">
                            <button type="button" class="action-dropdown-btn" data-id="${payment.id}"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                            <div id="dropdown-${payment.id}" class="dropdown-menu hidden">
                                <a href="#" class="dropdown-item edit-btn" data-id="${payment.id}"><i class="fa-solid fa-pencil"></i>Edit</a>
                                <a href="#" class="dropdown-item delete-btn" data-id="${payment.id}"><i class="fa-solid fa-trash-can"></i>Delete</a>
                            </div>
                        </div>
                    </td>
                `;
                paymentsTableBody.appendChild(row);
            });
        }
    };

    const openPaymentModal = async (payment = null) => {

        const activeLeases = leases.filter(l => new Date(l.endDate) >= new Date());
        const leaseOptions = activeLeases.map(lease => {
            const tenant = tenants.find(t => t.id === lease.tenantId);
            const unit = units.find(u => u.id === lease.unitId);
            const property = unit ? properties.find(p => p.id === unit.propertyId) : null;
            return `<option value="${lease.id}" ${payment && payment.leaseId === lease.id ? 'selected' : ''}>
                        ${tenant?.name} - ${property?.name} (Unit ${unit?.unitNumber})
                    </option>`;
        }).join('');

        const bodyHtml = `
            <form id="payment-form">
                <input type="hidden" id="payment-id" value="${payment ? payment.id : ''}">
                <div class="form-group">
                    <label for="payment-lease" class="form-label">Lease</label>
                    <select id="payment-lease" class="form-input" required>
                        <option value="">Select an active lease</option>
                        ${leaseOptions}
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="payment-type" class="form-label">Payment Type</label>
                        <select id="payment-type" class="form-input" required>
                            <option value="Rent" ${payment && payment.type === 'Rent' ? 'selected' : ''}>Rent</option>
                            <option value="Deposit" ${payment && payment.type === 'Deposit' ? 'selected' : ''}>Deposit</option>
                            <option value="Late Fee" ${payment && payment.type === 'Late Fee' ? 'selected' : ''}>Late Fee</option>
                            <option value="Other" ${payment && payment.type === 'Other' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="payment-amount" class="form-label">Amount (ETB)</label>
                        <input type="number" id="payment-amount" class="form-input" value="${payment ? payment.amount : ''}" required min="0">
                    </div>
                    <div class="form-group">
                        <label for="payment-date" class="form-label">Payment Date</label>
                        <input type="date" id="payment-date" class="form-input" value="${payment ? payment.date : new Date().toISOString().split('T')[0]}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="payment-method" class="form-label">Payment Method</label>
                    <select id="payment-method" class="form-input" required>
                        <option value="Bank Transfer" ${payment && payment.method === 'Bank Transfer' ? 'selected' : ''}>Bank Transfer</option>
                        <option value="Cash" ${payment && payment.method === 'Cash' ? 'selected' : ''}>Cash</option>
                        <option value="CBE Birr" ${payment && payment.method === 'CBE Birr' ? 'selected' : ''}>CBE Birr</option>
                        <option value="Telebirr" ${payment && payment.method === 'Telebirr' ? 'selected' : ''}>Telebirr</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="payment-receipt" class="form-label">Payment Receipt</label>
                    <input type="file" id="payment-receipt" class="form-input" accept="image/*,.pdf">
                    <small class="form-hint" id="receipt-info">${payment?.receiptName || 'Upload an image or PDF of the receipt.'}</small>
                </div>
                <div class="form-actions">
                    <button type="button" class="close-modal-btn btn-secondary">Cancel</button>
                    <button type="submit" class="btn-primary">Save Payment</button>
                </div>
            </form>
        `;

        const title = payment ? 'Edit Payment' : 'Record Payment';
        const modalHtml = `
            <div class="modal-overlay hidden">
                <div class="modal-content-wrapper" style="max-width: 700px;">
                    <div class="modal-header">
                        <h2 id="modal-title">${title}</h2>
                        <button class="close-modal-btn">&times;</button>
                    </div>
                    <div id="modal-body">${bodyHtml}</div>
                </div>
            </div>`;
        paymentModalContainer.innerHTML = modalHtml;
        const modal = paymentModalContainer.querySelector('.modal-overlay');
        rentalUtils.openModal(modal);
        modal.querySelector('#payment-form').addEventListener('submit', handleFormSubmit);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const form = e.target;
        if (!rentalUtils.validateForm(form)) return;

        const id = form.querySelector('#payment-id').value;
        const existingPayment = payments.find(p => p.id === id);
        const receiptInput = form.querySelector('#payment-receipt');
        let receiptUrl = existingPayment?.receiptUrl || null;
        let receiptName = existingPayment?.receiptName || null;

        if (receiptInput.files[0]) {
            receiptUrl = await rentalUtils.convertFileToBase64(receiptInput.files[0]);
            receiptName = receiptInput.files[0].name;
        }

        const paymentData = {
            id: id || rentalUtils.generateId(),
            leaseId: form.querySelector('#payment-lease').value,
            type: form.querySelector('#payment-type').value,
            amount: parseFloat(form.querySelector('#payment-amount').value),
            date: form.querySelector('#payment-date').value,
            method: form.querySelector('#payment-method').value,
            receiptUrl: receiptUrl,
            receiptName: receiptName,
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
        const target = e.target;

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
        } else if (target.closest('.action-dropdown-btn')) {
            e.preventDefault();
            document.querySelectorAll('.dropdown-menu').forEach(menu => menu.classList.add('hidden'));
            document.getElementById(`dropdown-${id}`).classList.toggle('hidden');
        }
    });

    addPaymentBtn.addEventListener('click', () => openPaymentModal());
    searchInput.addEventListener('input', rentalUtils.debounce(e => renderPayments(e.target.value), 300));

    initialize();
});