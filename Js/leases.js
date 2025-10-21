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
    const DOCUMENT_KEY = 'documents';
    const PAYMENT_KEY = 'payments';

    // Data
    let leases = [];
    let tenants = [];
    let properties = [];
    let units = [];


    const initialize = async () => {
        await window.rentalUtils.headerPromise; // Ensures shared components are loaded
        [leases, tenants, properties, units, documents] = await Promise.all([
            api.get(LEASE_KEY),
            api.get(TENANT_KEY),
            api.get(PROPERTY_KEY),
            api.get(UNIT_KEY),
            api.get(DOCUMENT_KEY)
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
                    <td>${rentalUtils.formatDate(lease.startDate)} - ${rentalUtils.formatDate(lease.endDate)}</td>
                    <td>${lease.withholdingAmount ? rentalUtils.formatCurrency(lease.withholdingAmount) : 'None'}</td>
                    <td>${rentalUtils.formatCurrency(lease.rentAmount)}</td>
                    <td><span class="status-badge ${status.class}">${status.text}</span></td>
                    <td>
                        <div class="action-dropdown">
                            <button type="button" class="action-dropdown-btn" data-id="${lease.id}"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                            <div id="dropdown-${lease.id}" class="dropdown-menu hidden">
                                <a href="#" class="dropdown-item view-details-btn" data-id="${lease.id}"><i class="fa-solid fa-eye"></i>View Details</a>
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
        
        // Tenants not already in an active lease (or the current tenant if editing)
        const activeLeaseTenantIds = leases.filter(l => getLeaseStatus(l).text === 'Active' && l.id !== lease?.id).map(l => l.tenantId);
        const availableTenants = tenants.filter(t => !activeLeaseTenantIds.includes(t.id) || t.id === lease?.tenantId);
        const tenantOptions = availableTenants.map(t => `<option value="${t.id}" ${lease && lease.tenantId === t.id ? 'selected' : ''}>${t.name}</option>`).join('');

        const assignedUnit = lease ? units.find(u => u.id === lease.unitId) : null;
        const assignedPropertyId = assignedUnit ? assignedUnit.propertyId : null;
        const propertyOptions = properties.map(p => `<option value="${p.id}" ${assignedPropertyId === p.id ? 'selected' : ''}>${p.name}</option>`).join('');

        const bodyHtml = `
            <form id="lease-form">
                <input type="hidden" id="lease-id" value="${lease ? lease.id : ''}">
                <div class="form-group">
                    <div class="form-label-group">
                        <label for="lease-tenant" class="form-label">Tenant</label>
                        <a href="tenants.html" target="_blank" class="form-label-action">Add New Tenant <i class="fa-solid fa-external-link-alt fa-xs"></i></a>
                    </div>
                    <select id="lease-tenant" class="form-input" required>
                        <option value="">Select a tenant</option>
                        ${tenantOptions}
                    </select>
                </div>
                <div class="form-row-columns">
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
                <div class="form-row-columns">
                    <div class="form-group">
                        <label for="lease-start-date" class="form-label">Start Date</label>
                        <input type="date" id="lease-start-date" class="form-input" value="${lease ? lease.startDate : ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="lease-end-date" class="form-label">End Date</label>
                        <input type="date" id="lease-end-date" class="form-input" value="${lease ? lease.endDate : ''}" required>
                    </div>
                </div>
                <div class="form-row-columns">
                    <div class="form-group">
                        <label for="lease-rent" class="form-label">Monthly Rent (ETB)</label>
                        <input type="number" id="lease-rent" class="form-input" value="${lease?.rentAmount || ''}" required min="0">
                    </div>
                    <div class="form-group">
                        <label for="lease-withholding" class="form-label">Withholding Amount (Optional)</label>
                        <input type="number" id="lease-withholding" class="form-input" value="${lease?.withholdingAmount || ''}" min="0">
                    </div>
                </div>
                <div class="form-row-columns">
                    <div class="form-group">
                        <label for="lease-agreement-file" class="form-label">Lease Agreement</label>
                        <input type="file" id="lease-agreement-file" class="form-input" accept="image/*,.pdf">
                        <small class="form-hint" id="lease-agreement-info">${lease?.leaseAgreementName || 'Upload PDF or image'}</small>
                    </div>
                    <div class="form-group">
                        <label for="withholding-receipt-file" class="form-label">Withholding Receipt</label>
                        <input type="file" id="withholding-receipt-file" class="form-input" accept="image/*,.pdf">
                        <small class="form-hint" id="withholding-receipt-info">${lease?.withholdingReceiptName || 'Upload PDF or image'}</small>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="close-modal-btn btn-secondary">Cancel</button>
                    <button type="submit" class="btn-primary">Save Lease</button>
                </div>
            </form>
        `;

        const title = isRenewal ? 'Renew Lease' : (lease && lease.id ? 'Edit Lease' : 'Add New Lease');
        await rentalUtils.createAndOpenModal({
            modalId: 'lease-modal',
            title: title,
            bodyHtml: bodyHtml,
            formId: 'lease-form',
            onSubmit: handleFormSubmit,
            maxWidth: '700px'
        });

        const modal = leaseModalContainer.querySelector('.modal-overlay');
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
    };

    const openLeaseDetailsModal = (lease) => {
        const tenant = tenants.find(t => t.id === lease.tenantId);
        const unit = units.find(u => u.id === lease.unitId);
        const property = unit ? properties.find(p => p.id === unit.propertyId) : null;

        const renderDocPreview = (url, name) => {
            if (!url) return '<p class="text-sm text-gray-500">Not provided</p>';
            return `<a href="${url}" target="_blank" class="document-preview-sm">
                        <i class="fa-solid fa-file-lines fa-2x"></i>
                        <p class="text-sm">${name || 'View File'}</p>
                    </a>`;
        };

        const bodyHtml = `
            <div class="lease-details-grid">
                <div class="detail-section">
                    <h4>Lease & Property</h4>
                    <div class="detail-item"><span>Tenant</span><span>${tenant?.name || 'N/A'}</span></div>
                    <div class="detail-item"><span>Property</span><span>${property?.name || 'N/A'}</span></div>
                    <div class="detail-item"><span>Unit</span><span>${unit?.unitNumber || 'N/A'}</span></div>
                    <div class="detail-item"><span>Period</span><span>${rentalUtils.formatDate(lease.startDate)} to ${rentalUtils.formatDate(lease.endDate)}</span></div>
                    <div class="detail-item"><span>Status</span><span><span class="status-badge ${getLeaseStatus(lease).class}">${getLeaseStatus(lease).text}</span></span></div>
                </div>
                <div class="detail-section">
                    <h4>Financials</h4>
                    <div class="detail-item"><span>Monthly Rent</span><span>${rentalUtils.formatCurrency(lease.rentAmount)}</span></div>
                    <div class="detail-item"><span>Withholding</span><span>${lease.withholdingAmount ? rentalUtils.formatCurrency(lease.withholdingAmount) : 'N/A'}</span></div>
                </div>
                <div class="detail-section">
                    <h4>Documents</h4>
                    <div class="detail-item">
                        <span>Lease Agreement</span>
                        <span>${renderDocPreview(lease.leaseAgreementUrl, lease.leaseAgreementName)}</span>
                    </div>
                    <div class="detail-item">
                        <span>Withholding Receipt</span>
                        <span>${renderDocPreview(lease.withholdingReceiptUrl, lease.withholdingReceiptName)}</span>
                    </div>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="close-modal-btn btn-secondary">Close</button>
            </div>
        `;

        const title = `Lease Details: ${tenant?.name || 'N/A'}`;
        const modalHtml = `
            <div class="modal-overlay hidden">
                <div class="modal-content-wrapper" style="max-width: 800px;">
                    <div class="modal-header">
                        <h2 id="modal-title">${title}</h2>
                        <button class="close-modal-btn">&times;</button>
                    </div>
                    <div id="modal-body">${bodyHtml}</div>
                </div>
            </div>`;
        
        const modalContainer = document.getElementById('lease-details-modal');
        modalContainer.innerHTML = modalHtml;
        const modal = modalContainer.querySelector('.modal-overlay');
        rentalUtils.openModal(modal);
    };

    const uploadFile = async (fileInput) => {
        const file = fileInput.files[0];
        if (!file) return null;
        const url = await rentalUtils.readFileAsDataURL(file);
        return { url, name: file.name };
    };


    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const form = e.target;
        if (!rentalUtils.validateForm(form)) return;

        const leaseId = form.querySelector('#lease-id').value;
        const existingLease = leases.find(l => l.id === leaseId);
        
        const leaseAgreement = await uploadFile(form.querySelector('#lease-agreement-file'));
        const withholdingReceipt = await uploadFile(form.querySelector('#withholding-receipt-file'));

        const id = form.querySelector('#lease-id').value;
        const leaseData = {
            id: leaseId || rentalUtils.generateId(),
            tenantId: form.querySelector('#lease-tenant').value,
            propertyId: form.querySelector('#lease-property').value,
            unitId: form.querySelector('#lease-unit').value,
            startDate: form.querySelector('#lease-start-date').value,
            endDate: form.querySelector('#lease-end-date').value,
            rentAmount: parseFloat(form.querySelector('#lease-rent').value),
            withholdingAmount: parseFloat(form.querySelector('#lease-withholding').value) || null,
            leaseAgreementUrl: leaseAgreement?.url || existingLease?.leaseAgreementUrl || null,
            leaseAgreementName: leaseAgreement?.name || existingLease?.leaseAgreementName || null,
            withholdingReceiptUrl: withholdingReceipt?.url || existingLease?.withholdingReceiptUrl || null,
            withholdingReceiptName: withholdingReceipt?.name || existingLease?.withholdingReceiptName || null,
        };

        if (leaseId) {
            await api.update(LEASE_KEY, leaseId, leaseData);
            leases = leases.map(l => l.id === leaseId ? leaseData : l);
        } else {
            await api.create(LEASE_KEY, leaseData);
            leases.push(leaseData);
        }

        // Generate or update the payment schedule for this lease
        await generatePaymentSchedule(leaseData);

        // Update tenant and unit records
        const tenantToUpdate = tenants.find(t => t.id === leaseData.tenantId);
        if (tenantToUpdate) await api.update(TENANT_KEY, tenantToUpdate.id, { ...tenantToUpdate, unitId: leaseData.unitId });

        const unitToUpdate = units.find(u => u.id === leaseData.unitId);
        if (unitToUpdate) await api.update(UNIT_KEY, unitToUpdate.id, { ...unitToUpdate, tenantId: leaseData.tenantId });

        renderLeases();
        rentalUtils.closeModal(form.closest('.modal-overlay'));
        rentalUtils.showNotification(`Lease ${leaseId ? 'updated' : 'created'} successfully!`);
    };

    leasesTableBody.addEventListener('click', (e) => {
        const id = e.target.closest('[data-id]')?.dataset.id;
        if (!id) return;

        if (e.target.closest('.action-dropdown-btn')) {
            // Close all other dropdowns first
            document.querySelectorAll('.dropdown-menu').forEach(menu => menu.classList.add('hidden'));
            // Then toggle the clicked one
            document.getElementById(`dropdown-${id}`).classList.toggle('hidden');
        } else if (e.target.closest('.view-details-btn')) {
            e.preventDefault();
            const leaseToView = leases.find(l => l.id === id);
            openLeaseDetailsModal(leaseToView);
        }else if (e.target.closest('.edit-btn')) {
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