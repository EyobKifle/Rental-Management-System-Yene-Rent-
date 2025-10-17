document.addEventListener('DOMContentLoaded', () => {
    const addTenantBtn = document.getElementById('add-tenant-btn');
    const tenantModalContainer = document.getElementById('tenant-modal');
    const tenantList = document.getElementById('tenant-list');
    const emptyState = document.getElementById('empty-state');
    const searchInput = document.getElementById('search-input');

    const TENANT_STORAGE_KEY = 'tenants';
    const PROPERTY_STORAGE_KEY = 'properties';
    const UNIT_STORAGE_KEY = 'units';
    let tenants = [];
    let properties = [];
    let units = [];
    
    const initialize = async () => {
        await window.rentalUtils.headerPromise; // Ensures shared components are loaded
        // Fetch data using the API layer
        [tenants, properties, units] = await Promise.all([
            api.get(TENANT_STORAGE_KEY),
            api.get(PROPERTY_STORAGE_KEY),
            api.get(UNIT_STORAGE_KEY)
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
                const unit = units.find(u => u.id === tenant.unitId);
                const property = unit ? properties.find(p => p.id === unit.propertyId) : null;
                const card = document.createElement('div');
                card.className = 'data-card tenant-card';
                card.innerHTML = `
                    <div class="tenant-card-header">
                        <div>
                            <h3>${tenant.name}</h3>
                            <p>${tenant.email}</p>
                            <p>${tenant.phone}</p>
                        </div>
                        <div class="action-dropdown">
                            <button class="action-dropdown-btn" data-id="${tenant.id}"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                            <div id="dropdown-${tenant.id}" class="dropdown-menu hidden">
                                <a href="#" class="dropdown-item edit-btn" data-id="${tenant.id}"><i class="fa-solid fa-pencil"></i>Edit</a>
                                <a href="#" class="dropdown-item delete-btn" data-id="${tenant.id}"><i class="fa-solid fa-trash-can"></i>Delete</a>
                            </div>
                        </div>
                    </div>
                    <div class="tenant-card-details">
                        <div>
                            <span>Property</span>
                            <span>${property ? property.name : 'N/A'}</span>
                        </div>
                        <div>
                            <span>Unit</span>
                            <span>${unit ? `Unit ${unit.unitNumber}` : 'Unassigned'}</span>
                        </div>
                        <div>
                            <span>Move-in Date</span>
                            <span>${rentalUtils.formatDate(tenant.moveInDate)}</span>
                        </div>
                    </div>
                `;
                tenantList.appendChild(card);
            });
        }
    };

    const openTenantModal = async (tenant = null) => {
        const response = await fetch('modal.html');
        tenantModalContainer.innerHTML = await response.text();
        const modal = tenantModalContainer.querySelector('.modal-overlay');
        modal.querySelector('#modal-title').textContent = tenant ? 'Edit Tenant' : 'Add New Tenant';

        const assignedUnit = tenant ? units.find(u => u.id === tenant.unitId) : null;
        const assignedPropertyId = assignedUnit ? assignedUnit.propertyId : null;

        const propertyOptions = properties.map(p => `<option value="${p.id}" ${assignedPropertyId === p.id ? 'selected' : ''}>${p.name}</option>`).join('');

        modal.querySelector('#modal-body').innerHTML = `
            <form id="tenant-form">
                <input type="hidden" id="tenant-id" value="${tenant ? tenant.id : ''}">
                <div class="form-group">
                    <label for="tenant-name" class="form-label">Full Name</label>
                    <input type="text" id="tenant-name" class="form-input" value="${tenant ? tenant.name : ''}" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="tenant-email" class="form-label">Email</label>
                        <input type="email" id="tenant-email" class="form-input" value="${tenant ? tenant.email : ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="tenant-phone" class="form-label">Phone</label>
                        <input type="tel" id="tenant-phone" class="form-input" value="${tenant ? tenant.phone : ''}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="tenant-property" class="form-label">Property</label>
                        <select id="tenant-property" class="form-input" required>
                            <option value="">Select a property</option>
                            ${propertyOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="tenant-unit" class="form-label">Unit</label>
                        <select id="tenant-unit" class="form-input" required>
                            <option value="">Select a property first</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="tenant-move-in" class="form-label">Move-in Date</label>
                        <input type="date" id="tenant-move-in" class="form-input" value="${tenant ? tenant.moveInDate : ''}" required>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="close-modal-btn btn-secondary">Cancel</button>
                    <button type="submit" class="btn-primary">Save Tenant</button>
                </div>
            </form>
        `;
        rentalUtils.openModal(modal);

        const propertySelect = modal.querySelector('#tenant-property');
        const unitSelect = modal.querySelector('#tenant-unit');

        const populateUnits = (propertyId) => {
            unitSelect.innerHTML = '<option value="">Select a unit</option>';
            if (!propertyId) return;

            const availableUnits = units.filter(u => u.propertyId === propertyId && (!u.tenantId || u.tenantId === tenant?.id));
            availableUnits.forEach(u => {
                const option = document.createElement('option');
                option.value = u.id;
                option.textContent = `Unit ${u.unitNumber}`;
                if (assignedUnit && assignedUnit.id === u.id) {
                    option.selected = true;
                }
                unitSelect.appendChild(option);
            });
        };

        propertySelect.addEventListener('change', () => populateUnits(propertySelect.value));
        
        // Initial population if editing
        if (assignedPropertyId) populateUnits(assignedPropertyId);

        modal.querySelector('#tenant-form').addEventListener('submit', handleFormSubmit);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const form = e.target;
        if (!rentalUtils.validateForm(form)) return;

        const id = form.querySelector('#tenant-id').value;
        const unitId = form.querySelector('#tenant-unit').value;
        const oldTenantData = id ? tenants.find(t => t.id === id) : null;

        const tenantData = {
            id: id || rentalUtils.generateId(),
            name: form.querySelector('#tenant-name').value,
            email: form.querySelector('#tenant-email').value,
            phone: form.querySelector('#tenant-phone').value,
            unitId: unitId,
            moveInDate: form.querySelector('#tenant-move-in').value,
        };

        if (id) {
            await api.update(TENANT_STORAGE_KEY, id, tenantData);
            tenants = tenants.map(t => t.id === id ? tenantData : t);
            // If unit changed, update old and new units
            if (oldTenantData && oldTenantData.unitId !== unitId) {
                const oldUnit = units.find(u => u.id === oldTenantData.unitId);
                if (oldUnit) await api.update(UNIT_STORAGE_KEY, oldUnit.id, { ...oldUnit, tenantId: null });
            }
        } else {
            await api.create(TENANT_STORAGE_KEY, tenantData);
            tenants.push(tenantData);
        }
        
        // Update the new unit to be occupied
        const newUnit = units.find(u => u.id === unitId);
        if (newUnit) await api.update(UNIT_STORAGE_KEY, newUnit.id, { ...newUnit, tenantId: tenantData.id });

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
                    const deletedTenant = tenants.find(t => t.id === id);
                    tenants = tenants.filter(t => t.id !== id);
                    // Make the unit vacant
                    if (deletedTenant && deletedTenant.unitId) {
                        const unit = units.find(u => u.id === deletedTenant.unitId);
                        if (unit) api.update(UNIT_STORAGE_KEY, unit.id, { ...unit, tenantId: null });
                    }
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
