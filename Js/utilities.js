document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const addUtilityBtn = document.getElementById('add-utility-btn');
    const utilityModalContainer = document.getElementById('utility-modal');
    const utilitiesTableBody = document.getElementById('utilities-table-body');
    const emptyState = document.getElementById('empty-state');
    const searchInput = document.getElementById('search-input');

    // Storage Keys
    const UTILITY_KEY = 'utilities';
    const PROPERTY_KEY = 'properties';

    // Data
    let utilities = [];
    let properties = [];

    const initialize = async () => {
        await window.rentalUtils.headerPromise; // Ensure shared components are loaded
        [utilities, properties] = await Promise.all([
            api.get(UTILITY_KEY),
            api.get(PROPERTY_KEY)
        ]);
        renderUtilities();
    };

    const renderUtilities = (filter = '') => {
        utilitiesTableBody.innerHTML = '';
        
        const filteredUtilities = utilities.filter(util => 
            util.type.toLowerCase().includes(filter.toLowerCase()) ||
            properties.find(p => p.id === util.propertyId)?.name.toLowerCase().includes(filter.toLowerCase())
        );

        if (filteredUtilities.length === 0) {
            emptyState.classList.remove('hidden');
            utilitiesTableBody.parentElement.classList.add('hidden');
        } else {
            emptyState.classList.add('hidden');
            utilitiesTableBody.parentElement.classList.remove('hidden');
            filteredUtilities.forEach(util => {
                const property = properties.find(p => p.id === util.propertyId);
                const row = document.createElement('tr');
                const statusClass = util.status.toLowerCase();
                row.innerHTML = `
                    <td>${util.type}</td>
                    <td>${property?.name || 'N/A'}</td>
                    <td>${rentalUtils.formatCurrency(util.amount)}</td>
                    <td>${rentalUtils.formatDate(util.dueDate)}</td>
                    <td>
                        <span class="status-badge status-${statusClass}">
                            ${util.status}
                        </span>
                    </td>
                    <td>
                        <div class="action-dropdown">
                            <button type="button" class="action-dropdown-btn" data-id="${util.id}"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                            <div id="dropdown-${util.id}" class="dropdown-menu hidden">
                                <a href="#" class="dropdown-item edit-btn" data-id="${util.id}"><i class="fa-solid fa-pencil"></i>Edit</a>
                                <a href="#" class="dropdown-item delete-btn" data-id="${util.id}"><i class="fa-solid fa-trash-can"></i>Delete</a>
                            </div>
                        </div>
                    </td>
                `;
                utilitiesTableBody.appendChild(row);
            });
        }
    };

    const openUtilityModal = async (utility = null) => {
        const propertyOptions = properties.map(p => `<option value="${p.id}" ${utility && utility.propertyId === p.id ? 'selected' : ''}>${p.name}</option>`).join('');
        const types = ['Electricity', 'Water', 'Gas', 'Internet', 'Trash'];
        const typeOptions = types.map(t => `<option value="${t}" ${utility && utility.type === t ? 'selected' : ''}>${t}</option>`).join('');
        const statuses = ['Unpaid', 'Paid'];
        const statusOptions = statuses.map(s => `<option value="${s}" ${utility && utility.status === s ? 'selected' : ''}>${s}</option>`).join('');

        const bodyHtml = `
            <form id="utility-form">
                <input type="hidden" id="utility-id" value="${utility ? utility.id : ''}">
                <div class="form-row">
                    <div class="form-group">
                        <label for="utility-type" class="form-label">Utility Type</label>
                        <select id="utility-type" class="form-input" required>${typeOptions}</select>
                    </div>
                    <div class="form-group">
                        <label for="utility-property" class="form-label">Property</label>
                        <select id="utility-property" class="form-input" required>
                            <option value="">Select a property</option>
                            ${propertyOptions}
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="utility-amount" class="form-label">Amount (ETB)</label>
                        <input type="number" id="utility-amount" class="form-input" value="${utility ? utility.amount : ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="utility-due-date" class="form-label">Due Date</label>
                        <input type="date" id="utility-due-date" class="form-input" value="${utility ? utility.dueDate : ''}" required>
                    </div>
                </div>
                 <div class="form-group">
                    <label for="utility-status" class="form-label">Status</label>
                    <select id="utility-status" class="form-input" required>${statusOptions}</select>
                </div>
                <div class="form-actions">
                    <button type="button" class="close-modal-btn btn-secondary">Cancel</button>
                    <button type="submit" class="btn-primary">Save Bill</button>
                </div>
            </form>
        `;

        const title = utility ? 'Edit Utility Bill' : 'Add New Utility Bill';
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
        utilityModalContainer.innerHTML = modalHtml;
        const modal = utilityModalContainer.querySelector('.modal-overlay');
        rentalUtils.openModal(modal);

        modal.querySelector('#utility-form').addEventListener('submit', handleFormSubmit);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const form = e.target;
        if (!rentalUtils.validateForm(form)) return;

        const id = form.querySelector('#utility-id').value;
        const utilityData = {
            id: id || rentalUtils.generateId(),
            type: form.querySelector('#utility-type').value,
            propertyId: form.querySelector('#utility-property').value,
            amount: parseFloat(form.querySelector('#utility-amount').value),
            dueDate: form.querySelector('#utility-due-date').value,
            status: form.querySelector('#utility-status').value,
        };

        if (id) {
            await api.update(UTILITY_KEY, id, utilityData);
            utilities = utilities.map(util => util.id === id ? utilityData : util);
        } else {
            await api.create(UTILITY_KEY, utilityData);
            utilities.push(utilityData);
        }

        renderUtilities();
        rentalUtils.closeModal(form.closest('.modal-overlay'));
        rentalUtils.showNotification(`Utility bill ${id ? 'updated' : 'added'} successfully!`);
    };

    utilitiesTableBody.addEventListener('click', (e) => {
        const id = e.target.closest('[data-id]')?.dataset.id;
        if (!id) return;

        if (e.target.closest('.action-dropdown-btn')) {
            // Close all other dropdowns first
            document.querySelectorAll('.dropdown-menu').forEach(menu => menu.classList.add('hidden'));
            document.getElementById(`dropdown-${id}`).classList.toggle('hidden');
        } else if (e.target.closest('.edit-btn')) {
            e.preventDefault();
            const utilityToEdit = utilities.find(util => util.id === id);
            openUtilityModal(utilityToEdit);
        } else if (e.target.closest('.delete-btn')) {
            e.preventDefault();
            if (rentalUtils.confirm('Are you sure you want to delete this bill?')) {
                api.delete(UTILITY_KEY, id).then(() => {
                    utilities = utilities.filter(util => util.id !== id);
                    renderUtilities();
                    rentalUtils.showNotification('Utility bill deleted successfully!', 'error');
                });
            }
        }
    });

    addUtilityBtn.addEventListener('click', () => openUtilityModal());
    searchInput.addEventListener('input', rentalUtils.debounce(e => renderUtilities(e.target.value), 300));

    initialize();
});