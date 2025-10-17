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
                const card = document.createElement('div');
                card.className = 'data-card maintenance-card';
                card.innerHTML = `
                    <div class="maintenance-card-header">
                        <h3>${req.title}</h3>
                        <div class="action-dropdown">
                            <button class="action-dropdown-btn" data-id="${req.id}"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                            <div id="dropdown-${req.id}" class="dropdown-menu hidden">
                                <a href="#" class="dropdown-item edit-btn" data-id="${req.id}"><i class="fa-solid fa-pencil"></i>Edit</a>
                                <a href="#" class="dropdown-item delete-btn" data-id="${req.id}"><i class="fa-solid fa-trash-can"></i>Delete</a>
                            </div>
                        </div>
                    </div>
                    <div class="maintenance-card-details">
                        <div><span>Status</span><span class="status-badge status-${statusClass}">${req.status}</span></div>
                        <div><span>Property</span><span>${property?.name || 'N/A'} ${unit ? `(Unit ${unit.unitNumber})` : ''}</span></div>
                        <div><span>Reported</span><span>${rentalUtils.formatDate(req.reportedDate)}</span></div>
                        <div><span>Cost</span><span>${req.cost ? rentalUtils.formatCurrency(req.cost) : 'N/A'}</span></div>
                    </div>
                `;
                maintenanceList.appendChild(card);
            });
        }
    };

    const openMaintenanceModal = async (request = null) => {
        const response = await fetch('modal.html');
        maintenanceModalContainer.innerHTML = await response.text();
        const modal = maintenanceModalContainer.querySelector('.modal-overlay');
        modal.querySelector('#modal-title').textContent = request ? 'Edit Maintenance Request' : 'Add Maintenance Request';

        const propertyOptions = properties.map(p => `<option value="${p.id}" ${request?.propertyId === p.id ? 'selected' : ''}>${p.name}</option>`).join('');
        const categories = ['Plumbing', 'Electrical', 'HVAC', 'Painting', 'General Repair', 'Other'];
        const categoryOptions = categories.map(c => `<option value="${c}" ${request?.category === c ? 'selected' : ''}>${c}</option>`).join('');
        const statuses = ['Pending', 'In Progress', 'Completed'];
        const statusOptions = statuses.map(s => `<option value="${s}" ${request?.status === s ? 'selected' : ''}>${s}</option>`).join('');

        modal.querySelector('#modal-body').innerHTML = `
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
                </div>
                <div class="form-actions">
                    <button type="button" class="close-modal-btn btn-secondary">Cancel</button>
                    <button type="submit" class="btn-primary">Save Request</button>
                </div>
            </form>
        `;
        rentalUtils.openModal(modal);

        const propertySelect = modal.querySelector('#request-property');
        const unitSelect = modal.querySelector('#request-unit');

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

        const requestData = {
            id: id || rentalUtils.generateId(),
            title: form.querySelector('#request-title').value,
            propertyId: form.querySelector('#request-property').value,
            unitId: form.querySelector('#request-unit').value || null,
            category: form.querySelector('#request-category').value,
            status: form.querySelector('#request-status').value,
            reportedDate: form.querySelector('#request-date').value,
            cost: parseFloat(form.querySelector('#request-cost').value) || null,
            beforeImageUrl: beforeImageFile ? await rentalUtils.convertFileToBase64(beforeImageFile) : existingRequest?.beforeImageUrl || null,
            afterImageUrl: afterImageFile ? await rentalUtils.convertFileToBase64(afterImageFile) : existingRequest?.afterImageUrl || null,
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