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
                    <div class="property-image-container">
                        ${prop.image ? `<img src="${prop.image}" alt="${prop.name}" class="property-image">` : `<div class="property-placeholder"><i data-lucide="building"></i><span>No image</span></div>`}
                    </div>
                    <div class="property-content">
                        <h3>${prop.name}</h3>
                        <p><i data-lucide="map-pin"></i> ${prop.address}</p>
                        <div class="property-details">
                            <span>Total Units: ${prop.units || 0}</span>
                        </div>
                    </div>
                    <div class="action-dropdown">
                        <button class="action-dropdown-btn" data-id="${prop.id}"><i data-lucide="more-horizontal"></i></button>
                        <div id="dropdown-${prop.id}" class="dropdown-menu hidden">
                            <a href="#" class="dropdown-item edit-btn" data-id="${prop.id}">Edit</a>
                            <a href="#" class="dropdown-item delete-btn" data-id="${prop.id}">Delete</a>
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
                            <option value="Commercial" ${property && property.type === 'Commercial' ? 'selected' : ''}>Commercial</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="property-rent" class="form-label">Monthly Rent (ETB)</label>
                        <input type="number" id="property-rent" class="form-input" value="${property ? property.rent : ''}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="property-tax-type" class="form-label">Tax Type</label>
                    <select id="property-tax-type" class="form-input" required>
                        <option value="property-only" ${property && property.taxType === 'property-only' ? 'selected' : ''}>Property Tax Only</option>
                        <option value="withholding-annual" ${property && property.taxType === 'withholding-annual' ? 'selected' : ''}>Withholding + Annual Tax</option>
                        <option value="withholding-property" ${property && property.taxType === 'withholding-property' ? 'selected' : ''}>Withholding + Property Tax</option>
                        <option value="all-taxes" ${property && property.taxType === 'all-taxes' ? 'selected' : ''}>All Taxes (Withholding + Property + Annual)</option>
                    </select>
                    <small class="form-hint">Select applicable taxes for this property type in Ethiopia.</small>
                </div>
                <div class="form-group">
                    <label for="property-units" class="form-label">Total Units</label>
                    <input type="number" id="property-units" class="form-input" value="${property ? property.units || '' : ''}" min="0">
                </div>
                <div class="form-group">
                    <label for="property-image" class="form-label">Property Image</label>
                    <input type="file" id="property-image" class="form-input" accept="image/*">
                    <small class="form-hint">Upload an image for the property. If not provided, a placeholder will be used.</small>
                </div>
                <div class="form-actions">
                    <button type="button" class="clear-btn btn-secondary">Clear</button>
                    <button type="button" class="close-modal-btn btn-secondary">Cancel</button>
                    <button type="submit" class="btn-primary">Save Property</button>
                </div>
            </form>
        `;
        rentalUtils.openModal(modal);

        const form = modal.querySelector('#property-form');
        const imageInput = form.querySelector('#property-image');
        const imagePreview = form.querySelector('#image-preview');
        const closeModalBtn = modal.querySelector('.close-modal-btn');
        const clearBtn = modal.querySelector('.clear-btn');

        // Image preview functionality
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview" class="preview-image">`;
                };
                reader.readAsDataURL(file);
            } else {
                imagePreview.innerHTML = `<div class="preview-placeholder"><i data-lucide="building"></i><span>No image selected</span></div>`;
                rentalUtils.setupLucideIcons();
            }
        });

        // Close modal on cancel button click
        closeModalBtn.addEventListener('click', () => {
            rentalUtils.closeModal(modal);
        });

        // Clear form on clear button click
        clearBtn.addEventListener('click', () => {
            form.reset();
            imagePreview.innerHTML = `<div class="preview-placeholder"><i data-lucide="building"></i><span>No image selected</span></div>`;
            rentalUtils.setupLucideIcons();
        });

        form.addEventListener('submit', handleFormSubmit);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const form = e.target;
        if (!rentalUtils.validateForm(form)) return;

        const id = form.querySelector('#property-id').value;
        const imageInput = form.querySelector('#property-image');
        let imageData = null;

        if (imageInput.files && imageInput.files[0]) {
            const file = imageInput.files[0];
            imageData = await rentalUtils.convertFileToBase64(file);
        }

        const propertyData = {
            id: id || rentalUtils.generateId(),
            name: form.querySelector('#property-name').value,
            address: form.querySelector('#property-address').value,
            type: form.querySelector('#property-type').value,
            taxType: form.querySelector('#property-tax-type').value,
            rent: parseFloat(form.querySelector('#property-rent').value),
            units: parseInt(form.querySelector('#property-units').value) || 0,
            image: imageData || null
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