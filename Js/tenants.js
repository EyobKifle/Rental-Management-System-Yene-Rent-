document.addEventListener('DOMContentLoaded', () => {
    const addTenantBtn = document.getElementById('add-tenant-btn');
    const tenantModalContainer = document.getElementById('tenant-modal');
    const tenantList = document.getElementById('tenant-list');
    const emptyState = document.getElementById('empty-state');
    const searchInput = document.getElementById('search-input');

    const TENANT_STORAGE_KEY = 'tenants';
    const PROPERTY_STORAGE_KEY = 'properties';
    let tenants = [];
    let properties = [];
    
    const initialize = async () => {
        await window.rentalUtils.headerPromise; // Ensures shared components are loaded
        // Fetch data using the API layer
        [tenants, properties] = await Promise.all([
            api.get(TENANT_STORAGE_KEY),
            api.get(PROPERTY_STORAGE_KEY)
        ]);
        renderTenants();
    };

    const renderTenants = (filter = '') => {
        tenantList.innerHTML = '';
        const filteredTenants = tenants.filter(t => 
            t.name.toLowerCase().includes(filter.toLowerCase()) ||
            t.email.toLowerCase().includes(filter.toLowerCase())
        );

        if (filteredTenants.length === 0) {
            emptyState.classList.remove('hidden');
            tenantList.classList.add('hidden');
        } else {
            emptyState.classList.add('hidden');
            tenantList.classList.remove('hidden');
            filteredTenants.forEach(tenant => {
                const property = properties.find(p => p.id === tenant.propertyId);
                const card = document.createElement('div');
                card.className = 'data-card';
                card.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="text-lg font-bold text-gray-800">${tenant.name}</h3>
                            <p class="text-sm text-gray-500">${tenant.email}</p>
                            <p class="text-sm text-gray-500">${tenant.phone}</p>
                        </div>
                        <div class="relative">
                            <button class="action-dropdown-btn text-gray-400 hover:text-gray-700" data-id="${tenant.id}"><i data-lucide="more-horizontal" class="w-5 h-5"></i></button>
                            <div id="dropdown-${tenant.id}" class="dropdown-menu hidden">
                                <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 edit-btn" data-id="${tenant.id}">Edit</a>
                                <a href="#" class="block px-4 py-2 text-sm text-red-600 hover:bg-red-50 delete-btn" data-id="${tenant.id}">Delete</a>
                            </div>
                        </div>
                    </div>
                    <div class="mt-4 pt-4 border-t border-gray-200">
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600">Property</span>
                            <span class="font-medium">${property ? property.name : 'Unassigned'}</span>
                        </div>
                        <div class="flex justify-between text-sm mt-2">
                            <span class="text-gray-600">Move-in Date</span>
                            <span class="font-medium">${rentalUtils.formatDate(tenant.moveInDate)}</span>
                        </div>
                    </div>
                `;
                tenantList.appendChild(card);
            });
            rentalUtils.setupLucideIcons();
        }
    };

    const openTenantModal = async (tenant = null) => {
        const response = await fetch('modal.html');
        tenantModalContainer.innerHTML = await response.text();
        const modal = tenantModalContainer.querySelector('.modal-overlay');
        modal.querySelector('#modal-title').textContent = tenant ? 'Edit Tenant' : 'Add New Tenant';

        const propertyOptions = properties.map(p => `<option value="${p.id}" ${tenant && tenant.propertyId === p.id ? 'selected' : ''}>${p.name}</option>`).join('');

        modal.querySelector('#modal-content').innerHTML = `
            <form id="tenant-form" class="space-y-4">
                <input type="hidden" id="tenant-id" value="${tenant ? tenant.id : ''}">
                <div class="form-group">
                    <label for="tenant-name" class="form-label">Full Name</label>
                    <input type="text" id="tenant-name" class="form-input" value="${tenant ? tenant.name : ''}" required>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="form-group">
                        <label for="tenant-email" class="form-label">Email</label>
                        <input type="email" id="tenant-email" class="form-input" value="${tenant ? tenant.email : ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="tenant-phone" class="form-label">Phone</label>
                        <input type="tel" id="tenant-phone" class="form-input" value="${tenant ? tenant.phone : ''}" required>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="form-group">
                        <label for="tenant-property" class="form-label">Assigned Property</label>
                        <select id="tenant-property" class="form-input" required>
                            <option value="">Select a property</option>
                            ${propertyOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="tenant-move-in" class="form-label">Move-in Date</label>
                        <input type="date" id="tenant-move-in" class="form-input" value="${tenant ? tenant.moveInDate : ''}" required>
                    </div>
                </div>
                <div class="flex justify-end space-x-3 pt-4">
                    <button type="button" class="close-modal-btn btn-secondary">Cancel</button>
                    <button type="submit" class="btn-primary">Save Tenant</button>
                </div>
            </form>
        `;
        rentalUtils.openModal(modal);
        modal.querySelector('#tenant-form').addEventListener('submit', handleFormSubmit);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const form = e.target;
        if (!rentalUtils.validateForm(form)) return;

        const id = form.querySelector('#tenant-id').value;
        const tenantData = {
            id: id || rentalUtils.generateId(),
            name: form.querySelector('#tenant-name').value,
            email: form.querySelector('#tenant-email').value,
            phone: form.querySelector('#tenant-phone').value,
            propertyId: form.querySelector('#tenant-property').value,
            moveInDate: form.querySelector('#tenant-move-in').value,
        };

        if (id) {
            await api.update(TENANT_STORAGE_KEY, id, tenantData);
            tenants = tenants.map(t => t.id === id ? tenantData : t);
        } else {
            await api.create(TENANT_STORAGE_KEY, tenantData);
            tenants.push(tenantData);
        }

        renderTenants();
        rentalUtils.closeModal(form.closest('.modal-overlay'));
        rentalUtils.showNotification(`Tenant ${id ? 'updated' : 'added'} successfully!`);
    };

    tenantList.addEventListener('click', (e) => {
        const target = e.target;
        const id = e.target.closest('[data-id]')?.dataset.id;

        if (target.closest('.action-dropdown-btn')) {
            document.querySelectorAll('.dropdown-menu').forEach(menu => menu.classList.add('hidden'));
            document.getElementById(`dropdown-${id}`).classList.toggle('hidden');
        } else if (target.closest('.edit-btn')) {
            e.preventDefault();
            const tenantToEdit = tenants.find(t => t.id === id);
            openTenantModal(tenantToEdit);
        } else if (target.closest('.delete-btn')) {
            e.preventDefault();
            if (rentalUtils.confirm('Are you sure you want to delete this tenant?')) {
                api.delete(TENANT_STORAGE_KEY, id).then(() => {
                    tenants = tenants.filter(t => t.id !== id);
                    renderTenants();
                    rentalUtils.showNotification('Tenant deleted successfully!', 'error');
                });
            }
        }
    });

    addTenantBtn.addEventListener('click', () => openTenantModal());
    searchInput.addEventListener('input', rentalUtils.debounce(e => renderTenants(e.target.value), 300));

    initialize(); // Start the initialization process
});
