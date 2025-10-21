document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const addUnitBtn = document.getElementById('add-unit-btn');
    const unitModalContainer = document.getElementById('unit-modal');
    const unitList = document.getElementById('unit-list');
    const emptyState = document.getElementById('empty-state');
    const propertyNameHeader = document.getElementById('property-name-header');
    const propertyAddressSubheader = document.getElementById('property-address-subheader');

    // Storage Keys
    const UNIT_KEY = 'units';
    const PROPERTY_KEY = 'properties';
    const TENANT_KEY = 'tenants';

    // Data
    let units = [];
    let properties = [];
    let tenants = [];
    let currentProperty = null;

    const initialize = async () => {
        await window.rentalUtils.headerPromise; // Ensures shared components are loaded

        const urlParams = new URLSearchParams(window.location.search);
        const propertyId = urlParams.get('propertyId');

        if (!propertyId) {
            window.location.href = 'properties.html';
            return;
        }

        [units, properties, tenants] = await Promise.all([
            api.get(UNIT_KEY),
            api.get(PROPERTY_KEY),
            api.get(TENANT_KEY)
        ]);

        currentProperty = properties.find(p => p.id === propertyId);

        if (!currentProperty) {
            window.location.href = 'properties.html';
            return;
        }

        propertyNameHeader.textContent = `Units for ${currentProperty.name}`;
        propertyAddressSubheader.textContent = currentProperty.address;

        renderUnits();
    };

    const renderUnits = () => {
        unitList.innerHTML = '';
        const propertyUnits = units.filter(u => u.propertyId === currentProperty.id);

        if (propertyUnits.length === 0) {
            emptyState.classList.remove('hidden');
            unitList.closest('.data-card').classList.add('hidden');
        } else {
            emptyState.classList.add('hidden');
            unitList.closest('.data-card').classList.remove('hidden');
            propertyUnits.forEach(unit => {
                const tenant = tenants.find(t => t.id === unit.tenantId);
                const row = document.createElement('tr');
                row.dataset.id = unit.id; // For click navigation
                row.innerHTML = `
                    <td>${unit.unitNumber}</td>
                    <td>${tenant?.name || 'N/A'}</td>
                    <td>${rentalUtils.formatCurrency(unit.rent)}</td>
                    <td>${unit.bedrooms || 0} / ${unit.bathrooms || 0}</td>
                    <td><span class="status-badge ${tenant ? 'status-occupied' : 'status-vacant'}">${tenant ? 'Occupied' : 'Vacant'}</span></td>
                    <td>
                        <div class="action-dropdown">
                            <button class="action-dropdown-btn" data-id="${unit.id}"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                            <div id="dropdown-${unit.id}" class="dropdown-menu hidden">
                                <a href="units-details.html?unitId=${unit.id}" class="dropdown-item"><i class="fa-solid fa-eye"></i>View Details</a>
                                <a href="#" class="dropdown-item edit-btn" data-id="${unit.id}"><i class="fa-solid fa-pencil"></i>Edit</a>
                                <a href="#" class="dropdown-item delete-btn" data-id="${unit.id}"><i class="fa-solid fa-trash-can"></i>Delete</a>
                            </div>
                        </div>
                    </td>
                `;
                unitList.appendChild(row);
            });
        }
    };

    const openUnitModal = async (unit = null) => {
        const tenant = unit ? tenants.find(t => t.id === unit.tenantId) : null;

        const bodyHtml = `
            <form id="unit-form">
                <input type="hidden" id="unit-id" value="${unit ? unit.id : ''}">
                <div class="form-row">
                    <div class="form-group">
                        <label for="unit-number" class="form-label">Unit Number / Name</label>
                        <input type="text" id="unit-number" class="form-input" value="${unit?.unitNumber || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="unit-rent" class="form-label">Default Monthly Rent (ETB)</label>
                        <input type="number" id="unit-rent" class="form-input" value="${unit?.rent || ''}" required min="0">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="unit-bedrooms" class="form-label">Bedrooms</label>
                        <input type="number" id="unit-bedrooms" class="form-input" value="${unit?.bedrooms || '1'}" min="0">
                    </div>
                    <div class="form-group">
                        <label for="unit-bathrooms" class="form-label">Bathrooms</label>
                        <input type="number" id="unit-bathrooms" class="form-input" value="${unit?.bathrooms || '1'}" min="0">
                    </div>
                </div>
                <div class="form-group">
                    <label for="unit-tenant" class="form-label">Current Tenant</label>
                    <input 
                        type="text" 
                        id="unit-tenant" 
                        class="form-input" 
                        value="${tenant ? tenant.name : 'Vacant'}" 
                        disabled 
                        style="background-color: var(--gray-100);"
                    >
                    <small class="form-hint">Tenant is assigned via the Leases page.</small>
                </div>
                <div class="form-actions">
                    <button type="button" class="close-modal-btn btn-secondary">Cancel</button>
                    <button type="submit" class="btn-primary">Save Unit</button>
                </div>
            </form>
        `;

        // Use the modern, consistent modal creation utility
        await rentalUtils.createAndOpenModal({
            modalId: 'unit-modal',
            title: unit ? 'Edit Unit' : 'Add New Unit',
            bodyHtml: bodyHtml,
            formId: 'unit-form',
            onSubmit: handleFormSubmit
        });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const form = e.target;
        if (!rentalUtils.validateForm(form)) return;

        const id = form.querySelector('#unit-id').value;
        const unitData = {
            id: id || rentalUtils.generateId(),
            propertyId: currentProperty.id,
            unitNumber: form.querySelector('#unit-number').value,
            rent: parseFloat(form.querySelector('#unit-rent').value),
            bedrooms: parseInt(form.querySelector('#unit-bedrooms').value, 10),
            bathrooms: parseInt(form.querySelector('#unit-bathrooms').value, 10),
            tenantId: id ? units.find(u => u.id === id)?.tenantId : null // Preserve tenant if editing
        };

        if (id) {
            await api.update(UNIT_KEY, id, unitData);
            units = units.map(u => u.id === id ? unitData : u);
        } else {
            await api.create(UNIT_KEY, unitData);
            units.push(unitData);
        }

        renderUnits();
        rentalUtils.closeModal(form.closest('.modal-overlay'));
        rentalUtils.showNotification(`Unit ${id ? 'updated' : 'added'} successfully!`);
    };

    unitList.addEventListener('click', (e) => {
        const target = e.target;
        const id = e.target.closest('[data-id]')?.dataset.id;
        if (!id) return;

        if (target.closest('.action-dropdown-btn')) {
            e.stopPropagation();
            document.querySelectorAll('.dropdown-menu').forEach(menu => menu.classList.add('hidden'));
            document.getElementById(`dropdown-${id}`).classList.toggle('hidden');
        } else if (target.closest('.edit-btn')) {
            e.preventDefault();
            const unitToEdit = units.find(u => u.id === id);
            openUnitModal(unitToEdit);
        } else if (target.closest('.delete-btn')) {
            e.preventDefault();
            const unitToDelete = units.find(u => u.id === id);
            if (unitToDelete.tenantId) {
                rentalUtils.showNotification('Cannot delete an occupied unit. Please remove the tenant first.', 'error');
            } else if (rentalUtils.confirm('Are you sure you want to delete this unit?')) {
                api.delete(UNIT_KEY, id).then(() => {
                    units = units.filter(u => u.id !== id);
                    renderUnits();
                    rentalUtils.showNotification('Unit deleted successfully!', 'error');
                });
            }
        } else if (target.closest('tr')) {
            // Click on unit card (excluding dropdown) navigates to unit details
            window.location.href = `units-details.html?unitId=${id}`;
        }
    });

    addUnitBtn.addEventListener('click', () => openUnitModal());

    initialize();
});