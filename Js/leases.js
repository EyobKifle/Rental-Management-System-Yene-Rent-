document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const addLeaseBtn = document.getElementById('add-lease-btn');
    const leaseModalContainer = document.getElementById('lease-modal');
    const leasesTableBody = document.getElementById('leases-table-body');
    const emptyState = document.getElementById('empty-state');
    const searchInput = document.getElementById('search-input');

    // Storage Keys
    const LEASE_KEY = 'leases';
    const TENANT_KEY = 'tenants';
    const PROPERTY_KEY = 'properties';
    const UNIT_KEY = 'units';

    // Data
    let leases = [];
    let tenants = [];
    let properties = [];
    let units = [];

    const initialize = async () => {
        await window.rentalUtils.headerPromise; // Ensures shared components are loaded
        [leases, tenants, properties, units] = await Promise.all([
            api.get(LEASE_KEY),
            api.get(TENANT_KEY),
            api.get(PROPERTY_KEY),
            api.get(UNIT_KEY)
        ]);
        renderLeases();
    };

    const getLeaseStatus = (lease) => {
        const today = new Date().setHours(0, 0, 0, 0);
        const startDate = new Date(lease.startDate).setHours(0, 0, 0, 0);
        const endDate = new Date(lease.endDate).setHours(0, 0, 0, 0);

        if (today > endDate) {
            return { text: 'Expired', class: 'status-expired' };
        }
        if (today >= startDate && today <= endDate) {
            return { text: 'Active', class: 'status-active' };
        }
        return { text: 'Upcoming', class: 'status-upcoming' };
    };

    const renderLeases = (filter = '') => {
        leasesTableBody.innerHTML = '';
        
        const filteredLeases = leases.filter(lease => {
            const tenant = tenants.find(t => t.id === lease.tenantId);
            const unit = units.find(u => u.id === lease.unitId);
            const property = unit ? properties.find(p => p.id === unit.propertyId) : null;
            const searchLower = filter.toLowerCase();
            return (tenant && tenant.name.toLowerCase().includes(searchLower)) ||
                   (property && property.name.toLowerCase().includes(searchLower)) ||
                   (unit && unit.unitNumber.toLowerCase().includes(searchLower));
        });

        if (filteredLeases.length === 0) {
            emptyState.classList.remove('hidden');
            leasesTableBody.parentElement.classList.add('hidden');
        } else {
            emptyState.classList.add('hidden');
            leasesTableBody.parentElement.classList.remove('hidden');
            filteredLeases.forEach(lease => {
                const tenant = tenants.find(t => t.id === lease.tenantId);
                const unit = units.find(u => u.id === lease.unitId);
                const property = unit ? properties.find(p => p.id === unit.propertyId) : null;
                const status = getLeaseStatus(lease);
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${tenant?.name || 'N/A'}</td>
                    <td>${property?.name || 'N/A'} <span class="lease-property-unit">Unit ${unit?.unitNumber || 'N/A'}</span></td>
                    <td>${rentalUtils.formatDate(lease.startDate)}</td>
                    <td>${rentalUtils.formatDate(lease.endDate)}</td>
                    <td>${rentalUtils.formatCurrency(lease.rentAmount)}</td>
                    <td><span class="status-badge ${status.class}">${status.text}</span></td>
                    <td>
                        <div class="action-dropdown">
                            <button type="button" class="action-dropdown-btn" data-id="${lease.id}"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                            <div id="dropdown-${lease.id}" class="dropdown-menu hidden">
                                <a href="#" class="dropdown-item edit-btn" data-id="${lease.id}"><i class="fa-solid fa-pencil"></i>Edit</a>
                                <a href="#" class="dropdown-item renew-btn" data-id="${lease.id}"><i class="fa-solid fa-rotate"></i>Renew</a>
                                <a href="#" class="dropdown-item delete-btn" data-id="${lease.id}"><i class="fa-solid fa-trash-can"></i>Delete</a>
                            </div>
                        </div>
                    </td>
                `;
                leasesTableBody.appendChild(row);
            });
        }
    };

    const openLeaseModal = async (lease = null, isRenewal = false) => {
        const response = await fetch('modal.html');
        leaseModalContainer.innerHTML = await response.text();
        const modal = leaseModalContainer.querySelector('.modal-overlay');
        modal.querySelector('#modal-title').textContent = isRenewal ? 'Renew Lease' : (lease && lease.id ? 'Edit Lease' : 'Add New Lease');
        
        // Tenants not already in an active lease (or the current tenant if editing)
        const activeLeaseTenantIds = leases.filter(l => getLeaseStatus(l).text === 'Active' && l.id !== lease?.id).map(l => l.tenantId);
        const availableTenants = tenants.filter(t => !activeLeaseTenantIds.includes(t.id) || t.id === lease?.tenantId);
        const tenantOptions = availableTenants.map(t => `<option value="${t.id}" ${lease && lease.tenantId === t.id ? 'selected' : ''}>${t.name}</option>`).join('');

        const assignedUnit = lease ? units.find(u => u.id === lease.unitId) : null;
        const assignedPropertyId = assignedUnit ? assignedUnit.propertyId : null;
        const propertyOptions = properties.map(p => `<option value="${p.id}" ${assignedPropertyId === p.id ? 'selected' : ''}>${p.name}</option>`).join('');

        modal.querySelector('#modal-body').innerHTML = `
            <form id="lease-form">
                <input type="hidden" id="lease-id" value="${lease ? lease.id : ''}">
                <div class="form-row">
                    <div class="form-group">
                        <label for="lease-tenant" class="form-label">Tenant</label>
                        <select id="lease-tenant" class="form-input" required>
                            <option value="">Select a tenant</option>
                            ${tenantOptions}
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="lease-property" class="form-label">Property</label>
                        <select id="lease-property" class="form-input" required>
                            <option value="">Select a property</option>
                            ${propertyOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="lease-unit" class="form-label">Unit</label>
                        <select id="lease-unit" class="form-input" required>
                            <option value="">Select a property first</option>
                        </select>
                    </div>
                </div>    
                <div class="form-row">
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
                <div class="form-group">
                    <label for="lease-document" class="form-label">Lease Agreement (PDF)</label>
                    <input type="file" id="lease-document" class="form-input" accept=".pdf">
                    <div id="lease-document-info">
                        ${lease && lease.leaseDocumentName ? `Current file: ${lease.leaseDocumentName}` : ''}
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="close-modal-btn btn-secondary">Cancel</button>
                    <button type="submit" class="btn-primary">Save Lease</button>
                </div>
            </form>
        `;

        const propertySelect = modal.querySelector('#lease-property');
        const unitSelect = modal.querySelector('#lease-unit');

        const populateUnits = (propertyId) => {
            unitSelect.innerHTML = '<option value="">Select a unit</option>';
            if (!propertyId) return;

            // Find units for the property that are not occupied by an active lease
            const activeLeaseUnitIds = leases.filter(l => getLeaseStatus(l).text === 'Active' && l.id !== lease?.id).map(l => l.unitId);
            const availableUnits = units.filter(u => u.propertyId === propertyId && !activeLeaseUnitIds.includes(u.id));
            
            availableUnits.forEach(u => {
                const option = document.createElement('option');
                option.value = u.id;
                option.textContent = `Unit ${u.unitNumber}`;
                if (assignedUnit && assignedUnit.id === u.id) option.selected = true;
                unitSelect.appendChild(option);
            });
        };

        propertySelect.addEventListener('change', () => populateUnits(propertySelect.value));
        if (assignedPropertyId) populateUnits(assignedPropertyId);

        modal.querySelector('#lease-document').addEventListener('change', (e) => {
            modal.querySelector('#lease-document-info').textContent = e.target.files.length > 0 ? `New file: ${e.target.files[0].name}` : (lease && lease.leaseDocumentName ? `Current file: ${lease.leaseDocumentName}` : 'No file chosen');
        });
        rentalUtils.openModal(modal);
        modal.querySelector('#lease-form').addEventListener('submit', handleFormSubmit);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const form = e.target;
        if (!rentalUtils.validateForm(form)) return;

        const leaseId = form.querySelector('#lease-id').value;
        const existingLease = leases.find(l => l.id === leaseId);

        let leaseDocumentUrl = existingLease ? existingLease.leaseDocumentUrl : null;
        let leaseDocumentName = existingLease ? existingLease.leaseDocumentName : null;

        const fileInput = form.querySelector('#lease-document');
        const file = fileInput.files[0];

        if (file) {
            if (file.type !== 'application/pdf') {
                rentalUtils.showNotification('Please upload a valid PDF file.', 'error');
                return;
            }
            leaseDocumentUrl = await rentalUtils.readFileAsDataURL(file);
            leaseDocumentName = file.name;
        }

        const id = form.querySelector('#lease-id').value;
        const leaseData = {
            id: id || rentalUtils.generateId(),
            tenantId: form.querySelector('#lease-tenant').value,
            unitId: form.querySelector('#lease-unit').value,
            startDate: form.querySelector('#lease-start-date').value,
            endDate: form.querySelector('#lease-end-date').value,
            rentAmount: parseFloat(form.querySelector('#lease-rent').value),
            leaseDocumentUrl: leaseDocumentUrl,
            leaseDocumentName: leaseDocumentName
        };

        if (id) {
            await api.update(LEASE_KEY, id, leaseData);
            leases = leases.map(l => l.id === id ? leaseData : l);
        } else {
            await api.create(LEASE_KEY, leaseData);
            leases.push(leaseData);
        }

        // Update tenant and unit records
        const tenantToUpdate = tenants.find(t => t.id === leaseData.tenantId);
        if (tenantToUpdate) await api.update(TENANT_KEY, tenantToUpdate.id, { ...tenantToUpdate, unitId: leaseData.unitId });

        const unitToUpdate = units.find(u => u.id === leaseData.unitId);
        if (unitToUpdate) await api.update(UNIT_KEY, unitToUpdate.id, { ...unitToUpdate, tenantId: leaseData.tenantId });

        renderLeases();
        rentalUtils.closeModal(form.closest('.modal-overlay'));
        rentalUtils.showNotification(`Lease ${id ? 'updated' : 'created'} successfully!`);
    };

    leasesTableBody.addEventListener('click', (e) => {
        const id = e.target.closest('[data-id]')?.dataset.id;
        if (!id) return;

        if (e.target.closest('.action-dropdown-btn')) {
            // Close all other dropdowns first
            document.querySelectorAll('.dropdown-menu').forEach(menu => menu.classList.add('hidden'));
            // Then toggle the clicked one
            document.getElementById(`dropdown-${id}`).classList.toggle('hidden');
        } else if (e.target.closest('.edit-btn')) {
            e.preventDefault();
            const leaseToEdit = leases.find(l => l.id === id);
            openLeaseModal(leaseToEdit);
        } else if (e.target.closest('.renew-btn')) {
            e.preventDefault();
            const leaseToRenew = leases.find(l => l.id === id);
            if (leaseToRenew) {
                const newStartDate = new Date(leaseToRenew.endDate);
                newStartDate.setDate(newStartDate.getDate() + 1); // Start the day after the old one ends

                const newEndDate = new Date(newStartDate);
                newEndDate.setFullYear(newEndDate.getFullYear() + 1); // Set for one year

                const renewalLease = { ...leaseToRenew };
                delete renewalLease.id; // It's a new lease, so no ID
                renewalLease.startDate = newStartDate.toISOString().split('T')[0];
                renewalLease.endDate = newEndDate.toISOString().split('T')[0];
                openLeaseModal(renewalLease, true);
            }
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