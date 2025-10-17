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
            unitList.classList.add('hidden');
        } else {
            emptyState.classList.add('hidden');
            unitList.classList.remove('hidden');
            propertyUnits.forEach(unit => {
                const tenant = tenants.find(t => t.id === unit.tenantId);
                const card = document.createElement('div');
                card.className = 'data-card unit-card';
                card.innerHTML = `
                    <div class="unit-card-header">
                        <h3>Unit ${unit.unitNumber}</h3>
                        <div class="action-dropdown">
                            <button class="action-dropdown-btn" data-id="${unit.id}"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                            <div id="dropdown-${unit.id}" class="dropdown-menu hidden">
                                <a href="#" class="dropdown-item edit-btn" data-id="${unit.id}"><i class="fa-solid fa-pencil"></i>Edit</a>
                                <a href="#" class="dropdown-item delete-btn" data-id="${unit.id}"><i class="fa-solid fa-trash-can"></i>Delete</a>
                            </div>
                        </div>
                    </div>
                    <div class="unit-card-details">
                        <div>
                            <span>Status</span>
                            <span class="status-badge ${tenant ? 'status-occupied' : 'status-active'}">${tenant ? 'Occupied' : 'Vacant'}</span>
                        </div>
                        <div>
                            <span>Tenant</span>
                            <span>${tenant ? tenant.name : 'N/A'}</span>
                        </div>
                        <div>
                            <span>Rent</span>
                            <span>${rentalUtils.formatCurrency(unit.rent)}</span>
                        </div>
                    </div>
                `;
                unitList.appendChild(card);
            });
        }
    };

    const openUnitModal = async (unit = null) => {
        const response = await fetch('modal.html');
        unitModalContainer.innerHTML = await response.text();
        const modal = unitModalContainer.querySelector('.modal-overlay');
        modal.querySelector('#modal-title').textContent = unit ? 'Edit Unit' : 'Add New Unit';

        modal.querySelector('#modal-body').innerHTML = `
            <form id="unit-form">
                <input type="hidden" id="unit-id" value="${unit ? unit.id : ''}">
                <div class="form-group">
                    <label for="unit-number" class="form-label">Unit Number / Name</label>
                    <input type="text" id="unit-number" class="form-input" value="${unit ? unit.unitNumber : ''}" required>
                </div>
                <div class="form-group">
                    <label for="unit-rent" class="form-label">Monthly Rent (ETB)</label>
                    <input type="number" id="unit-rent" class="form-input" value="${unit ? unit.rent : currentProperty.rent || ''}" required>
                </div>
                <div class="form-actions">
                    <button type="button" class="close-modal-btn btn-secondary">Cancel</button>
                    <button type="submit" class="btn-primary">Save Unit</button>
                </div>
            </form>
        `;
        rentalUtils.openModal(modal);
        modal.querySelector('#unit-form').addEventListener('submit', handleFormSubmit);
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
            tenantId: null // Tenant assignment will be handled via leases
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
        const card = target.closest('.unit-card');
        const id = e.target.closest('[data-id]')?.dataset.id;

        if (target.closest('.action-dropdown-btn')) {
            document.querySelectorAll('.dropdown-menu').forEach(menu => menu.classList.add('hidden'));
            document.getElementById(`dropdown-${id}`).classList.toggle('hidden');
        } else if (target.closest('.edit-btn')) {
            e.preventDefault();
            const unitToEdit = units.find(u => u.id === id);
            openUnitModal(unitToEdit);
        } else if (target.closest('.delete-btn')) {
            e.preventDefault();
            if (rentalUtils.confirm('Are you sure you want to delete this unit?')) {
                api.delete(UNIT_KEY, id).then(() => {
                    units = units.filter(u => u.id !== id);
                    renderUnits();
                    rentalUtils.showNotification('Unit deleted successfully!', 'error');
                });
            }
        } else if (card && !target.closest('.action-dropdown')) {
            // Click on unit card (excluding dropdown) navigates to unit details
            window.location.href = `units-details.html?unitId=${id}`;
        }
    });

    addUnitBtn.addEventListener('click', () => openUnitModal());

    initialize();
});