document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const addRequestBtn = document.getElementById('add-request-btn');
    const maintenanceModalContainer = document.getElementById('maintenance-modal');
    const maintenanceList = document.getElementById('maintenance-list');
    const emptyState = document.getElementById('empty-state');
    const searchInput = document.getElementById('search-input');

    // Storage Keys
    const MAINTENANCE_KEY = 'maintenance';
    const PROPERTY_KEY = 'properties';
    const UNIT_KEY = 'units';

    // Data
    let requests = [];
    let properties = [];
    let units = [];

    const initialize = async () => {
        await window.rentalUtils.headerPromise;
        [requests, properties, units] = await Promise.all([
            api.get(MAINTENANCE_KEY),
            api.get(PROPERTY_KEY),
            api.get(UNIT_KEY)
        ]);

        // Check for editId in URL params to open modal directly
        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('editId');
        if (editId) {
            const requestToEdit = requests.find(req => req.id === editId);
            if (requestToEdit) openMaintenanceModal(requestToEdit);
        }
        renderRequests();
    };

    const renderRequests = (filter = '') => {
        maintenanceList.innerHTML = '';
        const searchLower = filter.toLowerCase();
        const filteredRequests = requests.filter(req => {
            const property = properties.find(p => p.id === req.propertyId);
            return req.title.toLowerCase().includes(searchLower) ||
                   req.status.toLowerCase().includes(searchLower) ||
                   (property && property.name.toLowerCase().includes(searchLower));
        });

        if (filteredRequests.length === 0) {
            emptyState.classList.remove('hidden');
            maintenanceList.closest('.data-card').classList.add('hidden');
        } else {
            emptyState.classList.add('hidden');
            maintenanceList.closest('.data-card').classList.remove('hidden');
            filteredRequests.forEach(req => {
                const property = properties.find(p => p.id === req.propertyId);
                const unit = units.find(u => u.id === req.unitId);
                const statusClass = req.status.toLowerCase().replace(' ', '-');
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${req.title}</td>
                    <td>${property?.name || 'N/A'} ${unit ? `<span class="lease-property-unit">(Unit ${unit.unitNumber})</span>` : ''}</td>
                    <td><span class="status-badge status-${statusClass}">${req.status}</span></td>
                    <td>${rentalUtils.formatDate(req.reportedDate)}</td>
                    <td>${req.cost ? rentalUtils.formatCurrency(req.cost) : 'N/A'}</td>
                    <td>
                        <div class="action-dropdown">
                            <button class="action-dropdown-btn" data-id="${req.id}"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                            <div id="dropdown-${req.id}" class="dropdown-menu hidden">
                                <a href="#" class="dropdown-item view-details-btn" data-id="${req.id}"><i class="fa-solid fa-eye"></i>View Details</a>
                                <a href="#" class="dropdown-item edit-btn" data-id="${req.id}"><i class="fa-solid fa-pencil"></i>Edit</a>
                                <a href="#" class="dropdown-item delete-btn" data-id="${req.id}"><i class="fa-solid fa-trash-can"></i>Delete</a>
                            </div>
                        </div>
                    </td>
                `;
                maintenanceList.appendChild(row);
            });
        }
    };

    const openMaintenanceModal = async (request = null) => {
        const propertyOptions = properties.map(p => `<option value="${p.id}" ${request?.propertyId === p.id ? 'selected' : ''}>${p.name}</option>`).join('');
        const categories = ['Plumbing', 'Electrical', 'HVAC', 'Painting', 'General Repair', 'Other'];
        const categoryOptions = categories.map(c => `<option value="${c}" ${request?.category === c ? 'selected' : ''}>${c}</option>`).join('');
        const statuses = ['Pending', 'In Progress', 'Completed'];
        const statusOptions = statuses.map(s => `<option value="${s}" ${request?.status === s ? 'selected' : ''}>${s}</option>`).join('');

        const bodyHtml = `
            <form id="maintenance-form">
                <input type="hidden" id="request-id" value="${request?.id || ''}">
                <div class="form-group">
                    <label for="request-title" class="form-label">Title / Issue</label>
                    <input type="text" id="request-title" class="form-input" value="${request?.title || ''}" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="request-property" class="form-label">Property</label>
                        <select id="request-property" class="form-input" required><option value="">Select Property</option>${propertyOptions}</select>
                    </div>
                    <div class="form-group">
                        <label for="request-unit" class="form-label">Unit (Optional)</label>
                        <select id="request-unit" class="form-input"><option value="">Property-wide</option></select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="request-category" class="form-label">Category</label>
                        <select id="request-category" class="form-input" required>${categoryOptions}</select>
                    </div>
                    <div class="form-group">
                        <label for="request-status" class="form-label">Status</label>
                        <select id="request-status" class="form-input" required>${statusOptions}</select>
                    </div>
                </div>
                <div class="form-row">
                     <div class="form-group">
                        <label for="request-date" class="form-label">Date Reported</label>
                        <input type="date" id="request-date" class="form-input" value="${request?.reportedDate || new Date().toISOString().split('T')[0]}" required>
                    </div>
                    <div class="form-group">
                        <label for="request-cost" class="form-label">Cost (ETB, Optional)</label>
                        <input type="number" id="request-cost" class="form-input" value="${request?.cost || ''}">
                    </div>
                </div>
                <div class="form-row hidden" id="receipt-details-container">
                    <div class="form-group">
                        <label for="request-receipt-number" class="form-label">Receipt Number (Optional)</label>
                        <input type="text" id="request-receipt-number" class="form-input" value="${request?.receiptNumber || ''}">
                    </div>
                    <div class="form-group"></div>
                </div>
                <div class="image-upload-group">
                    <div class="image-upload-container form-group">
                        <label for="before-image" class="form-label">"Before" Photo</label>
                        <input type="file" id="before-image" class="form-input" accept="image/*">
                        <div class="image-preview">${request?.beforeImageUrl ? `<img src="${request.beforeImageUrl}">` : ''}</div>
                    </div>
                    <div class="image-upload-container form-group">
                        <label for="after-image" class="form-label">"After" Photo</label>
                        <input type="file" id="after-image" class="form-input" accept="image/*">
                        <div class="image-preview">${request?.afterImageUrl ? `<img src="${request.afterImageUrl}">` : ''}</div>
                    </div>
                    <div class="image-upload-container form-group hidden" id="receipt-image-container">
                        <label for="receipt-image" class="form-label">Receipt Photo</label>
                        <input type="file" id="receipt-image" class="form-input" accept="image/*">
                        <div class="image-preview">${request?.receiptImageUrl ? `<img src="${request.receiptImageUrl}">` : ''}</div>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="close-modal-btn btn-secondary">Cancel</button>
                    <button type="submit" class="btn-primary">Save Request</button>
                </div>
            </form>
        `;

        const title = request ? 'Edit Maintenance Request' : 'Add Maintenance Request';
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
        maintenanceModalContainer.innerHTML = modalHtml;
        const modal = maintenanceModalContainer.querySelector('.modal-overlay');
        rentalUtils.openModal(modal);

        const propertySelect = modal.querySelector('#request-property');
        const unitSelect = modal.querySelector('#request-unit');
        const costInput = modal.querySelector('#request-cost');
        const receiptDetailsContainer = modal.querySelector('#receipt-details-container');
        const receiptImageContainer = modal.querySelector('#receipt-image-container');

        const toggleReceiptFields = () => {
            const show = !!costInput.value && parseFloat(costInput.value) > 0;
            receiptDetailsContainer.classList.toggle('hidden', !show);
            receiptImageContainer.classList.toggle('hidden', !show);
        };


        const populateUnits = (propertyId) => {
            unitSelect.innerHTML = '<option value="">Property-wide</option>';
            if (!propertyId) return;
            const propertyUnits = units.filter(u => u.propertyId === propertyId);
            propertyUnits.forEach(u => {
                const option = document.createElement('option');
                option.value = u.id;
                option.textContent = `Unit ${u.unitNumber}`;
                if (request?.unitId === u.id) option.selected = true;
                unitSelect.appendChild(option);
            });
        };

        propertySelect.addEventListener('change', () => populateUnits(propertySelect.value));
        if (request?.propertyId) populateUnits(request.propertyId);

        costInput.addEventListener('input', toggleReceiptFields);
        toggleReceiptFields(); // Initial check

        modal.querySelector('#maintenance-form').addEventListener('submit', handleFormSubmit);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const form = e.target;
        if (!rentalUtils.validateForm(form)) return;

        const id = form.querySelector('#request-id').value;
        const existingRequest = requests.find(r => r.id === id);

        const beforeImageFile = form.querySelector('#before-image').files[0];
        const afterImageFile = form.querySelector('#after-image').files[0];
        const receiptImageFile = form.querySelector('#receipt-image').files[0];

        const requestData = {
            id: id || rentalUtils.generateId(),
            title: form.querySelector('#request-title').value,
            propertyId: form.querySelector('#request-property').value,
            unitId: form.querySelector('#request-unit').value || null,
            category: form.querySelector('#request-category').value,
            status: form.querySelector('#request-status').value,
            reportedDate: form.querySelector('#request-date').value,
            cost: parseFloat(form.querySelector('#request-cost').value) || null,
            receiptNumber: form.querySelector('#request-receipt-number').value || null,
            beforeImageUrl: beforeImageFile ? await rentalUtils.readFileAsDataURL(beforeImageFile) : existingRequest?.beforeImageUrl || null,
            afterImageUrl: afterImageFile ? await rentalUtils.readFileAsDataURL(afterImageFile) : existingRequest?.afterImageUrl || null,
            receiptImageUrl: receiptImageFile ? await rentalUtils.readFileAsDataURL(receiptImageFile) : existingRequest?.receiptImageUrl || null,
        };

        if (id) {
            await api.update(MAINTENANCE_KEY, id, requestData);
            requests = requests.map(r => r.id === id ? requestData : r);
        } else {
            await api.create(MAINTENANCE_KEY, requestData);
            requests.push(requestData);
        }

        renderRequests();
        rentalUtils.closeModal(form.closest('.modal-overlay'));
        rentalUtils.showNotification(`Maintenance request ${id ? 'updated' : 'added'} successfully!`);
    };

    maintenanceList.addEventListener('click', (e) => {
        const id = e.target.closest('[data-id]')?.dataset.id;
        if (!id) return;

        if (e.target.closest('.action-dropdown-btn')) {
            document.querySelectorAll('.dropdown-menu').forEach(menu => menu.classList.add('hidden'));
            document.getElementById(`dropdown-${id}`).classList.toggle('hidden');
        } else if (e.target.closest('.view-details-btn')) {
            e.preventDefault();
            window.location.href = `maintenance-details.html?requestId=${id}`;
        } else if (e.target.closest('.edit-btn')) {
            e.preventDefault();
            const requestToEdit = requests.find(r => r.id === id);
            openMaintenanceModal(requestToEdit);
        } else if (e.target.closest('.delete-btn')) {
            e.preventDefault();
            if (rentalUtils.confirm('Are you sure you want to delete this maintenance request?')) {
                api.delete(MAINTENANCE_KEY, id).then(() => {
                    requests = requests.filter(r => r.id !== id);
                    renderRequests();
                    rentalUtils.showNotification('Request deleted successfully!', 'error');
                });
            }
        }
    });

    addRequestBtn.addEventListener('click', () => openMaintenanceModal());
    searchInput.addEventListener('input', rentalUtils.debounce(e => renderRequests(e.target.value), 300));

    initialize();
});