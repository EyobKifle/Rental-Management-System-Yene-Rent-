document.addEventListener('DOMContentLoaded', () => {
    const addPropertyBtn = document.getElementById('add-property-btn');
    const propertyModalContainer = document.getElementById('property-modal');
    const propertyList = document.getElementById('property-list');
    const emptyState = document.getElementById('empty-state');
    const searchInput = document.getElementById('search-input');

    const STORAGE_KEY = 'properties';
    let properties = [];

    const initialize = async () => {
        await window.rentalUtils.headerPromise;
        properties = await api.get(STORAGE_KEY);
        renderProperties();
    };

    const renderProperties = (filter = '') => {
        propertyList.innerHTML = '';
        const filteredProperties = properties.filter(prop => 
            prop.name.toLowerCase().includes(filter.toLowerCase()) ||
            prop.address.toLowerCase().includes(filter.toLowerCase())
        );

        if (filteredProperties.length === 0) {
            emptyState.classList.remove('hidden');
            propertyList.classList.add('hidden');
            if (properties.length > 0) { // If properties exist but don't match search
                emptyState.querySelector('h3').textContent = 'No properties match your search.';
            }
        } else {
            emptyState.classList.add('hidden');
            propertyList.classList.remove('hidden');
            filteredProperties.forEach(prop => {
                const card = document.createElement('div');
                card.className = 'data-card property-card';
                card.innerHTML = `
                    <div class="property-card-header">
                        <div>
                            <h3>${prop.name}</h3>
                            <p>${prop.address}</p>
                        </div>
                        <div class="action-dropdown">
                            <button class="action-dropdown-btn" data-id="${prop.id}"><i data-lucide="more-horizontal"></i></button>
                            <div id="dropdown-${prop.id}" class="dropdown-menu hidden">
                                <a href="#" class="dropdown-item edit-btn" data-id="${prop.id}">Edit</a>
                                <a href="#" class="dropdown-item delete-btn" data-id="${prop.id}">Delete</a>
                            </div>
                        </div>
                    </div>
                    <div class="property-card-details">
                        <div>
                            <span>Type</span>
                            <span>${prop.type}</span>
                        </div>
                        <div>
                            <span>Rent</span>
                            <span>${rentalUtils.formatCurrency(prop.rent)}</span>
                        </div>
                    </div>
                `;
                propertyList.appendChild(card);
            });
            rentalUtils.setupLucideIcons();
        }
    };

    const openPropertyModal = async (property = null) => {
        const response = await fetch('modal.html');
        propertyModalContainer.innerHTML = await response.text();
        const modal = propertyModalContainer.querySelector('.modal-overlay');
        modal.querySelector('#modal-title').textContent = property ? 'Edit Property' : 'Add New Property';

        modal.querySelector('#modal-body').innerHTML = `
            <form id="property-form">
                <input type="hidden" id="property-id" value="${property ? property.id : ''}">
                <div class="form-group">
                    <label for="property-name" class="form-label">Property Name</label>
                    <input type="text" id="property-name" class="form-input" value="${property ? property.name : ''}" required>
                </div>
                <div class="form-group">
                    <label for="property-address" class="form-label">Address</label>
                    <input type="text" id="property-address" class="form-input" value="${property ? property.address : ''}" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="property-type" class="form-label">Type</label>
                        <select id="property-type" class="form-input" required>
                            <option value="Apartment" ${property && property.type === 'Apartment' ? 'selected' : ''}>Apartment</option>
                            <option value="Villa" ${property && property.type === 'Villa' ? 'selected' : ''}>Villa</option>
                            <option value="Office" ${property && property.type === 'Office' ? 'selected' : ''}>Office</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="property-rent" class="form-label">Monthly Rent (ETB)</label>
                        <input type="number" id="property-rent" class="form-input" value="${property ? property.rent : ''}" required>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="close-modal-btn btn-secondary">Cancel</button>
                    <button type="submit" class="btn-primary">Save Property</button>
                </div>
            </form>
        `;
        rentalUtils.openModal(modal);

        const form = modal.querySelector('#property-form');
        form.addEventListener('submit', handleFormSubmit);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const form = e.target;
        if (!rentalUtils.validateForm(form)) return;

        const id = form.querySelector('#property-id').value;
        const propertyData = {
            id: id || rentalUtils.generateId(),
            name: form.querySelector('#property-name').value,
            address: form.querySelector('#property-address').value,
            type: form.querySelector('#property-type').value,
            rent: parseFloat(form.querySelector('#property-rent').value)
        };

        if (id) {
            // Update existing property
            await api.update(STORAGE_KEY, id, propertyData);
            properties = properties.map(p => p.id === id ? propertyData : p);
        } else {
            // Add new property
            await api.create(STORAGE_KEY, propertyData);
            properties.push(propertyData);
        }
        renderProperties();
        rentalUtils.closeModal(form.closest('.modal-overlay'));
        rentalUtils.showNotification(`Property ${id ? 'updated' : 'added'} successfully!`);
    };

    // Event Delegation for actions
    propertyList.addEventListener('click', (e) => {
        const target = e.target;
        const id = target.closest('[data-id]')?.dataset.id;

        if (target.closest('.action-dropdown-btn')) {
            document.querySelectorAll('.dropdown-menu').forEach(menu => menu.classList.add('hidden'));
            document.getElementById(`dropdown-${id}`).classList.toggle('hidden');
        } else if (target.closest('.edit-btn')) {
            e.preventDefault();
            const propertyToEdit = properties.find(p => p.id === id);
            openPropertyModal(propertyToEdit);
        } else if (target.closest('.delete-btn')) {
            e.preventDefault();
            if (rentalUtils.confirm('Are you sure you want to delete this property?')) {
            api.delete(STORAGE_KEY, id).then(() => {
                properties = properties.filter(p => p.id !== id);
                renderProperties();
                rentalUtils.showNotification('Property deleted successfully!', 'error');
            });
            }
        }
    });

    addPropertyBtn.addEventListener('click', () => openPropertyModal());

    searchInput.addEventListener('input', rentalUtils.debounce((e) => {
        renderProperties(e.target.value);
    }, 300));

    // Initial Load
    initialize();
});