document.addEventListener('DOMContentLoaded', () => {
    const sidebarContainer = document.getElementById('sidebar-container');
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

    const loadSidebar = async () => {
        const response = await fetch('sidebar.html');
        sidebarContainer.innerHTML = await response.text();
        rentalUtils.setupNavigation();
        rentalUtils.setupLucideIcons();
    };

    const initialize = async () => {
        await loadSidebar();
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
            paymentsTableBody.classList.add('hidden');
        } else {
            emptyState.classList.add('hidden');
            paymentsTableBody.classList.remove('hidden');
            filteredPayments.forEach(payment => {
                const tenant = tenants.find(t => t.id === payment.tenantId);
                const property = properties.find(p => p.id === tenant?.propertyId);
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50';
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${tenant?.name || 'N/A'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${property?.name || 'N/A'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${rentalUtils.formatCurrency(payment.amount)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${rentalUtils.formatDate(payment.date)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${payment.method}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-600 cursor-pointer hover:underline">RCP-${payment.id.slice(0, 5)}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full status-completed">
                            <i data-lucide="check" class="w-3 h-3 mr-1"></i> Completed
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium relative">
                        <div class="relative inline-block text-left">
                            <button type="button" class="action-dropdown-btn text-gray-400 hover:text-gray-700" data-id="${payment.id}">
                                <i data-lucide="more-horizontal" class="w-5 h-5"></i>
                            </button>
                            <div id="dropdown-${payment.id}" class="dropdown-menu hidden">
                                <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 edit-btn" data-id="${payment.id}">Edit</a>
                                <a href="#" class="block px-4 py-2 text-sm text-red-600 hover:bg-red-50 delete-btn" data-id="${payment.id}">Delete</a>
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

        modal.querySelector('#modal-content').innerHTML = `
            <form id="payment-form" class="space-y-4">
                <input type="hidden" id="payment-id" value="${payment ? payment.id : ''}">
                <div class="form-group">
                    <label for="payment-tenant" class="form-label">Tenant</label>
                    <select id="payment-tenant" class="form-input" required>
                        <option value="">Select a tenant</option>
                        ${tenantOptions}
                    </select>
                </div>
                <div class="grid grid-cols-2 gap-4">
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
                <div class="flex justify-end space-x-3 pt-4">
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
        const target = e.target;
        const id = e.target.closest('[data-id]')?.dataset.id;

        if (target.closest('.action-dropdown-btn')) {
            document.querySelectorAll('.dropdown-menu').forEach(menu => menu.classList.add('hidden'));
            document.getElementById(`dropdown-${id}`).classList.toggle('hidden');
        } else if (target.closest('.edit-btn')) {
            e.preventDefault();
            const paymentToEdit = payments.find(p => p.id === id);
            openPaymentModal(paymentToEdit);
        } else if (target.closest('.delete-btn')) {
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