document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const addPaymentBtn = document.getElementById('add-payment-btn');
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

    const renderPayments = (filter = '') => {
        paymentsTableBody.innerHTML = '';
        const searchLower = filter.toLowerCase();

        const filteredPayments = allData.payments.filter(payment => {
            const lease = allData.leases.find(l => l.id === payment.leaseId);
            if (!lease) return false;
            const tenant = allData.tenants.find(t => t.id === lease.tenantId);
            const property = allData.properties.find(p => p.id === lease.propertyId);
            return (tenant?.name.toLowerCase().includes(searchLower) || property?.name.toLowerCase().includes(searchLower));
        });

        if (filteredPayments.length === 0) {
            emptyState.classList.remove('hidden');
            paymentsTableBody.closest('.data-card').classList.add('hidden');
        } else {
            emptyState.classList.add('hidden');
            paymentsTableBody.closest('.data-card').classList.remove('hidden');
            filteredPayments.forEach(payment => {
                const lease = allData.leases.find(l => l.id === payment.leaseId);
                const tenant = lease ? allData.tenants.find(t => t.id === lease.tenantId) : null;
                const property = lease ? allData.properties.find(p => p.id === lease.propertyId) : null;
                const unit = lease ? allData.units.find(u => u.id === lease.unitId) : null;

                const row = document.createElement('tr');
                row.dataset.id = payment.id; // Add ID to row for click events
                row.innerHTML = `
                    <td>${tenant?.name || 'N/A'}</td>
                    <td>${property?.name || 'N/A'} ${unit ? `(Unit ${unit.unitNumber})` : ''}</td>
                    <td>${rentalUtils.formatCurrency(payment.amount)}</td>
                    <td>${rentalUtils.formatDate(payment.date)}</td>
                    <td>${payment.method}</td>
                    <td>${payment.receiptNumber || 'N/A'}</td>
                    <td>
                        <div class="action-dropdown">
                            <button class="action-dropdown-btn" data-id="${payment.id}"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                            <div id="dropdown-${payment.id}" class="dropdown-menu hidden">
                                <a href="payments-details.html?paymentId=${payment.id}" class="dropdown-item"><i class="fa-solid fa-eye"></i>View Details</a>
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

    const calculateStats = () => {
        const totalCollected = allData.payments.reduce((sum, p) => sum + p.amount, 0);
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthCollected = allData.payments
            .filter(p => new Date(p.date) >= firstDayOfMonth)
            .reduce((sum, p) => sum + p.amount, 0);

        statTotalCollected.textContent = rentalUtils.formatCurrency(totalCollected);
        statThisMonth.textContent = rentalUtils.formatCurrency(thisMonthCollected);
        // Placeholder for outstanding/overdue logic
        statOutstanding.textContent = rentalUtils.formatCurrency(0);
        statOverdue.textContent = rentalUtils.formatCurrency(0);
    };

    const openPaymentModal = async (payment = null) => {
        // Get all leases that are not expired.
        let availableLeases = allData.leases.filter(l => new Date(l.endDate) >= new Date());

        // If editing a payment, ensure its current lease is in the list, even if it's expired.
        if (payment && payment.leaseId) {
            const isCurrentLeaseInList = availableLeases.some(l => l.id === payment.leaseId);
            if (!isCurrentLeaseInList) {
                const currentLease = allData.leases.find(l => l.id === payment.leaseId);
                if (currentLease) availableLeases.push(currentLease);
            }
        }

        const leaseOptions = availableLeases.map(lease => {
            const tenant = allData.tenants.find(t => t.id === lease.tenantId);
            const property = allData.properties.find(p => p.id === lease.propertyId);
            return `<option value="${lease.id}" ${payment?.leaseId === lease.id ? 'selected' : ''}>${tenant?.name} at ${property?.name}</option>`;
        }).join('');

        const bodyHtml = `
            <form id="payment-form">
                <input type="hidden" id="payment-id" value="${payment?.id || ''}">
                <div class="form-group">
                    <label for="payment-lease" class="form-label">Lease</label>
                    <select id="payment-lease" class="form-input" required>
                        <option value="">Select a lease</option>
                        ${leaseOptions}
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="payment-amount" class="form-label">Amount (ETB)</label>
                        <input type="number" id="payment-amount" class="form-input" value="${payment?.amount || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="payment-date" class="form-label">Payment Date</label>
                        <input type="date" id="payment-date" class="form-input" value="${payment?.date || new Date().toISOString().split('T')[0]}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="payment-method" class="form-label">Method</label>
                        <select id="payment-method" class="form-input" required>
                            <option value="Bank Transfer" ${payment?.method === 'Bank Transfer' ? 'selected' : ''}>Bank Transfer</option>
                            <option value="Cash" ${payment?.method === 'Cash' ? 'selected' : ''}>Cash</option>
                            <option value="CBE Birr" ${payment?.method === 'CBE Birr' ? 'selected' : ''}>CBE Birr</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="payment-type" class="form-label">Payment For</label>
                        <select id="payment-type" class="form-input" required>
                            <option value="Rent" ${payment?.type === 'Rent' ? 'selected' : ''}>Rent</option>
                            <option value="Deposit" ${payment?.type === 'Deposit' ? 'selected' : ''}>Deposit</option>
                            <option value="Other" ${payment?.type === 'Other' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="payment-receipt-number" class="form-label">Receipt Number (Optional)</label>
                    <input type="text" id="payment-receipt-number" class="form-input" value="${payment?.receiptNumber || ''}">
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
        await rentalUtils.createAndOpenModal({ modalId: 'payment-modal', title: payment ? 'Edit Payment' : 'Record Payment', bodyHtml, formId: 'payment-form', onSubmit: handleFormSubmit });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const form = e.target;
        if (!rentalUtils.validateForm(form)) return;

        const id = form.querySelector('#payment-id').value;
        const existingPayment = allData.payments.find(p => p.id === id);
        const receiptFile = form.querySelector('#receipt-file').files[0];

        const paymentData = {
            id: id || rentalUtils.generateId(),
            leaseId: form.querySelector('#payment-lease').value,
            amount: parseFloat(form.querySelector('#payment-amount').value),
            date: form.querySelector('#payment-date').value,
            method: form.querySelector('#payment-method').value,
            type: form.querySelector('#payment-type').value,
            receiptNumber: form.querySelector('#payment-receipt-number').value || null,
            receiptUrl: receiptFile ? await rentalUtils.readFileAsDataURL(receiptFile) : existingPayment?.receiptUrl || null,
        };

        if (id) {
            await api.update(PAYMENT_KEY, id, paymentData);
            allData.payments = allData.payments.map(p => p.id === id ? paymentData : p);
        } else {
            await api.create(PAYMENT_KEY, paymentData);
            allData.payments.push(paymentData);
        }

        renderPayments();
        calculateStats();
        rentalUtils.closeModal(form.closest('.modal-overlay'));
        rentalUtils.showNotification(`Payment ${id ? 'updated' : 'recorded'} successfully!`);
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

    addPaymentBtn.addEventListener('click', () => openPaymentModal());
    searchInput.addEventListener('input', rentalUtils.debounce(e => renderPayments(e.target.value), 300));

    initialize();
});