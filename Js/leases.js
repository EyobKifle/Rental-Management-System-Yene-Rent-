document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const sidebarContainer = document.getElementById('sidebar-container');
    const addLeaseBtn = document.getElementById('add-lease-btn');
    const leaseModalContainer = document.getElementById('lease-modal');
    const leasesTableBody = document.getElementById('leases-table-body');
    const emptyState = document.getElementById('empty-state');
    const searchInput = document.getElementById('search-input');

    // Storage Keys
    const LEASE_KEY = 'leases';
    const TENANT_KEY = 'tenants';
    const PROPERTY_KEY = 'properties';

    // Data
    let leases = [];
    let tenants = [];
    let properties = [];

    const initialize = async () => {
        await loadSidebar();
        [leases, tenants, properties] = await Promise.all([
            api.get(LEASE_KEY),
            api.get(TENANT_KEY),
            api.get(PROPERTY_KEY)
        ]);
        renderLeases();
    };

    const loadSidebar = async () => {
        const response = await fetch('sidebar.html');
        sidebarContainer.innerHTML = await response.text();
        rentalUtils.setupNavigation();
        rentalUtils.setupLucideIcons();
    };

    const getLeaseStatus = (lease) => {
        const today = new Date().setHours(0, 0, 0, 0);
        const startDate = new Date(lease.startDate).setHours(0, 0, 0, 0);
        const endDate = new Date(lease.endDate).setHours(0, 0, 0, 0);

        if (today > endDate) {
            return { text: 'Expired', class: 'status-overdue' };
        }
        if (today >= startDate && today <= endDate) {
            return { text: 'Active', class: 'status-completed' };
        }
        return { text: 'Upcoming', class: 'status-unpaid' };
    };

    const renderLeases = (filter = '') => {
        leasesTableBody.innerHTML = '';
        
        const filteredLeases = leases.filter(lease => {
            const tenant = tenants.find(t => t.id === lease.tenantId);
            const property = properties.find(p => p.id === lease.propertyId);
            const searchLower = filter.toLowerCase();
            return (tenant && tenant.name.toLowerCase().includes(searchLower)) ||
                   (property && property.name.toLowerCase().includes(searchLower));
        });

        if (filteredLeases.length === 0) {
            emptyState.classList.remove('hidden');
            leasesTableBody.parentElement.classList.add('hidden');
        } else {
            emptyState.classList.add('hidden');
            leasesTableBody.parentElement.classList.remove('hidden');
            filteredLeases.forEach(lease => {
                const tenant = tenants.find(t => t.id === lease.tenantId);
                const property = properties.find(p => p.id === lease.propertyId);
                const status = getLeaseStatus(lease);
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50';
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${tenant?.name || 'N/A'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${property?.name || 'N/A'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${rentalUtils.formatDate(lease.startDate)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${rentalUtils.formatDate(lease.endDate)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${rentalUtils.formatCurrency(lease.rentAmount)}</td>
                    <td class="px-6 py-4 whitespace-nowrap"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status.class}">${status.text}</span></td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium relative">
                        <div class="relative inline-block text-left">
                            <button type="button" class="action-dropdown-btn text-gray-400 hover:text-gray-700" data-id="${lease.id}"><i data-lucide="more-horizontal" class="w-5 h-5"></i></button>
                            <div id="dropdown-${lease.id}" class="dropdown-menu hidden">
                                <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 edit-btn" data-id="${lease.id}">Edit</a>
                                <a href="#" class="block px-4 py-2 text-sm text-red-600 hover:bg-red-50 delete-btn" data-id="${lease.id}">Delete</a>
                            </div>
                        </div>
                    </td>
                `;
                leasesTableBody.appendChild(row);
            });
            rentalUtils.setupLucideIcons();
        }
    };

    const openLeaseModal = async (lease = null) => {
        const response = await fetch('modal.html');
        leaseModalContainer.innerHTML = await response.text();
        const modal = leaseModalContainer.querySelector('.modal-overlay');
        modal.querySelector('#modal-title').textContent = lease ? 'Edit Lease' : 'Create New Lease';

        const tenantOptions = tenants.map(t => `<option value="${t.id}" ${lease && lease.tenantId === t.id ? 'selected' : ''}>${t.name}</option>`).join('');
        const propertyOptions = properties.map(p => `<option value="${p.id}" ${lease && lease.propertyId === p.id ? 'selected' : ''}>${p.name}</option>`).join('');

        modal.querySelector('#modal-content').innerHTML = `
            <form id="lease-form" class="space-y-4">
                <input type="hidden" id="lease-id" value="${lease ? lease.id : ''}">
                <div class="form-group">
                    <label for="lease-tenant" class="form-label">Tenant</label>
                    <select id="lease-tenant" class="form-input" required>${tenantOptions}</select>
                </div>
                <div class="form-group">
                    <label for="lease-property" class="form-label">Property</label>
                    <select id="lease-property" class="form-input" required>${propertyOptions}</select>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="form-group">
                        <label for="lease-start-date" class="form-label">Start Date</label>
                        <input type="date" id="lease-start-date" class="form-input" value="${lease ? lease.startDate : ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="lease-end-date" class="form-label">End Date</label>
                        <input type="date" id="lease-end-date" class="form-input" value="${lease ? lease.endDate : ''}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="lease-rent" class="form-label">Monthly Rent (ETB)</label>
                    <input type="number" id="lease-rent" class="form-input" value="${lease ? lease.rentAmount : ''}" required>
                </div>
                <div class="flex justify-end space-x-3 pt-4">
                    <button type="button" class="close-modal-btn btn-secondary">Cancel</button>
                    <button type="submit" class="btn-primary">Save Lease</button>
                </div>
            </form>
        `;
        rentalUtils.openModal(modal);
        modal.querySelector('#lease-form').addEventListener('submit', handleFormSubmit);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const form = e.target;
        if (!rentalUtils.validateForm(form)) return;

        const id = form.querySelector('#lease-id').value;
        const leaseData = {
            id: id || rentalUtils.generateId(),
            tenantId: form.querySelector('#lease-tenant').value,
            propertyId: form.querySelector('#lease-property').value,
            startDate: form.querySelector('#lease-start-date').value,
            endDate: form.querySelector('#lease-end-date').value,
            rentAmount: parseFloat(form.querySelector('#lease-rent').value),
        };

        if (id) {
            await api.update(LEASE_KEY, id, leaseData);
            leases = leases.map(l => l.id === id ? leaseData : l);
        } else {
            await api.create(LEASE_KEY, leaseData);
            leases.push(leaseData);
        }

        renderLeases();
        rentalUtils.closeModal(form.closest('.modal-overlay'));
        rentalUtils.showNotification(`Lease ${id ? 'updated' : 'created'} successfully!`);
    };

    leasesTableBody.addEventListener('click', (e) => {
        const id = e.target.closest('[data-id]')?.dataset.id;
        if (!id) return;

        if (e.target.closest('.edit-btn')) {
            e.preventDefault();
            const leaseToEdit = leases.find(l => l.id === id);
            openLeaseModal(leaseToEdit);
        } else if (e.target.closest('.delete-btn')) {
            e.preventDefault();
            if (rentalUtils.confirm('Are you sure you want to delete this lease?')) {
                api.delete(LEASE_KEY, id).then(() => {
                    leases = leases.filter(l => l.id !== id);
                    renderLeases();
                    rentalUtils.showNotification('Lease deleted successfully!', 'error');
                });
            }
        }
    });

    addLeaseBtn.addEventListener('click', () => openLeaseModal());
    searchInput.addEventListener('input', rentalUtils.debounce(e => renderLeases(e.target.value), 300));

    initialize();
});