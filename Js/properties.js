document.addEventListener('DOMContentLoaded', () => {
    const addPropertyBtn = document.getElementById('add-property-btn');
    const propertyModalContainer = document.getElementById('property-modal');
    const propertyList = document.getElementById('property-list');
    const emptyState = document.getElementById('empty-state');
    const sidebarContainer = document.getElementById('sidebar-container');
    const searchInput = document.getElementById('search-input');

    const STORAGE_KEY = 'properties';
    let properties = [];

    const loadSidebar = async () => {
        const response = await fetch('sidebar.html');
        sidebarContainer.innerHTML = await response.text();
        // Re-run nav setup after sidebar is loaded
        rentalUtils.setupNavigation();
        rentalUtils.setupLucideIcons();
    };

    const initialize = async () => {
        await loadSidebar();
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
                card.className = 'data-card';
                card.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="text-lg font-bold text-gray-800">${prop.name}</h3>
                            <p class="text-sm text-gray-500">${prop.address}</p>
                        </div>
                        <div class="relative">
                            <button class="action-dropdown-btn text-gray-400 hover:text-gray-700" data-id="${prop.id}">
                                <i data-lucide="more-horizontal" class="w-5 h-5"></i>
                            </button>
                            <div id="dropdown-${prop.id}" class="dropdown-menu hidden absolute w-40 mt-2 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 edit-btn" data-id="${prop.id}">Edit</a>
                                <a href="#" class="block px-4 py-2 text-sm text-red-600 hover:bg-red-50 delete-btn" data-id="${prop.id}">Delete</a>
                            </div>
                        </div>
                    </div>
                    <div class="mt-4 pt-4 border-t border-gray-200">
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600">Type</span>
                            <span class="font-medium">${prop.type}</span>
                        </div>
                        <div class="flex justify-between text-sm mt-2">
                            <span class="text-gray-600">Rent</span>
                            <span class="font-medium">${rentalUtils.formatCurrency(prop.rent)}</span>
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
        const modalTitle = modal.querySelector('#modal-title');
        const modalContent = modal.querySelector('#modal-content');

        modalTitle.textContent = property ? 'Edit Property' : 'Add New Property';
        modalContent.innerHTML = `
            <form id="property-form" class="space-y-4">
                <input type="hidden" id="property-id" value="${property ? property.id : ''}">
                <div class="form-group">
                    <label for="property-name" class="form-label">Property Name</label>
                    <input type="text" id="property-name" class="form-input" value="${property ? property.name : ''}" required>
                </div>
                <div class="form-group">
                    <label for="property-address" class="form-label">Address</label>
                    <input type="text" id="property-address" class="form-input" value="${property ? property.address : ''}" required>
                </div>
                <div class="grid grid-cols-2 gap-4">
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
                <div class="flex justify-end space-x-3 pt-4">
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
        const target = e.target.closest('a, button');
        const id = target.closest('[data-id]')?.dataset.id;

        if (target.closest('.action-dropdown-btn')) {
            document.querySelectorAll('.dropdown-menu').forEach(menu => menu.classList.add('hidden'));
            document.getElementById(`dropdown-${id}`).classList.toggle('hidden');
        } else if (target.closest('.edit-btn')) {
            e.preventDefault();
            const propertyToEdit = properties.find(p => p.id === id);
            openPropertyModal(propertyToEdit);
        } else if (target.closest('.delete-btn') && rentalUtils.confirm('Are you sure you want to delete this property?')) {
            e.preventDefault();
            api.delete(STORAGE_KEY, id).then(() => {
                properties = properties.filter(p => p.id !== id);
                renderProperties();
                rentalUtils.showNotification('Property deleted successfully!', 'error');
            });
        }
    });

    addPropertyBtn.addEventListener('click', () => openPropertyModal());

    searchInput.addEventListener('input', rentalUtils.debounce((e) => {
        renderProperties(e.target.value);
    }, 300));

    // Initial Load
    initialize();
});