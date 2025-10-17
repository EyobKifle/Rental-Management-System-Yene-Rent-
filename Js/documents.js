document.addEventListener('DOMContentLoaded', () => {
    const uploadBtn = document.getElementById('upload-document-btn');
    const docModalContainer = document.getElementById('document-modal');
    const docList = document.getElementById('document-list');
    const emptyState = document.getElementById('empty-state');
    const searchInput = document.getElementById('search-input');

    const DOC_KEY = 'documents';
    const PROPERTY_KEY = 'properties';
    const TENANT_KEY = 'tenants';

    let documents = [];
    let properties = [];
    let tenants = [];

    const initialize = async () => {
        await window.rentalUtils.headerPromise;
        [documents, properties, tenants] = await Promise.all([
            api.get(DOC_KEY),
            api.get(PROPERTY_KEY),
            api.get(TENANT_KEY)
        ]);
        renderDocuments();
    };

    const getFileIcon = (fileType) => {
        if (fileType.startsWith('image/')) return { icon: 'fa-solid fa-file-image', class: 'icon-image' };
        if (fileType === 'application/pdf') return { icon: 'fa-solid fa-file-pdf', class: 'icon-pdf' };
        if (fileType.includes('wordprocessingml')) return { icon: 'fa-solid fa-file-word', class: 'icon-doc' };
        return { icon: 'fa-solid fa-file', class: 'icon-other' };
    };

    const renderDocuments = (filter = '') => {
        docList.innerHTML = '';
        const searchLower = filter.toLowerCase();
        const filteredDocs = documents.filter(doc => 
            doc.name.toLowerCase().includes(searchLower) ||
            doc.category.toLowerCase().includes(searchLower)
        );

        if (filteredDocs.length === 0) {
            emptyState.classList.remove('hidden');
            docList.closest('.data-card').classList.add('hidden');
        } else {
            emptyState.classList.add('hidden');
            docList.closest('.data-card').classList.remove('hidden');
            filteredDocs.forEach(doc => {
                const card = document.createElement('div');
                card.className = 'data-card document-card';
                const { icon, class: iconClass } = getFileIcon(doc.type);
                const linkedTo = doc.propertyId ? properties.find(p => p.id === doc.propertyId)?.name : (doc.tenantId ? tenants.find(t => t.id === doc.tenantId)?.name : 'General');

                card.innerHTML = `
                    <div class="document-icon ${iconClass}">
                        <i class="${icon}"></i>
                    </div>
                    <div class="document-info">
                        <h3>${doc.name}</h3>
                        <p>${rentalUtils.formatFileSize(doc.size)} &bull; ${linkedTo}</p>
                    </div>
                    <div class="document-actions">
                        <div class="action-dropdown">
                            <button class="action-dropdown-btn" data-id="${doc.id}"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                            <div id="dropdown-${doc.id}" class="dropdown-menu hidden">
                                <a href="${doc.url}" target="_blank" class="dropdown-item"><i class="fa-solid fa-eye"></i>View</a>
                                <a href="#" class="dropdown-item delete-btn" data-id="${doc.id}"><i class="fa-solid fa-trash-can"></i>Delete</a>
                            </div>
                        </div>
                    </div>
                `;
                docList.appendChild(card);
            });
        }
    };

    const openUploadModal = async () => {
        const response = await fetch('modal.html');
        docModalContainer.innerHTML = await response.text();
        const modal = docModalContainer.querySelector('.modal-overlay');
        modal.querySelector('#modal-title').textContent = 'Upload Document';

        const propertyOptions = properties.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        const tenantOptions = tenants.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
        const categories = ['Lease Agreement', 'Tenant ID', 'Payment Receipt', 'Property Title', 'Other'];
        const categoryOptions = categories.map(c => `<option value="${c}">${c}</option>`).join('');

        modal.querySelector('#modal-body').innerHTML = `
            <form id="document-form">
                <div class="form-group">
                    <label for="doc-file" class="form-label">File</label>
                    <input type="file" id="doc-file" class="form-input" required>
                </div>
                <div class="form-group">
                    <label for="doc-name" class="form-label">Document Name (Optional)</label>
                    <input type="text" id="doc-name" class="form-input" placeholder="e.g., 'January Rent Receipt'">
                </div>
                <div class="form-group">
                    <label for="doc-category" class="form-label">Category</label>
                    <select id="doc-category" class="form-input" required>
                        <option value="">Select a category</option>
                        ${categoryOptions}
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="doc-property" class="form-label">Link to Property (Optional)</label>
                        <select id="doc-property" class="form-input">
                            <option value="">None</option>
                            ${propertyOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="doc-tenant" class="form-label">Link to Tenant (Optional)</label>
                        <select id="doc-tenant" class="form-input">
                            <option value="">None</option>
                            ${tenantOptions}
                        </select>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="close-modal-btn btn-secondary">Cancel</button>
                    <button type="submit" class="btn-primary">Upload</button>
                </div>
            </form>
        `;
        rentalUtils.openModal(modal);
        modal.querySelector('#document-form').addEventListener('submit', handleFormSubmit);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const form = e.target;
        const fileInput = form.querySelector('#doc-file');
        const file = fileInput.files[0];

        if (!file) {
            rentalUtils.showNotification('Please select a file to upload.', 'error');
            return;
        }

        const fileUrl = await rentalUtils.convertFileToBase64(file);

        const docData = {
            id: rentalUtils.generateId(),
            name: form.querySelector('#doc-name').value || file.name,
            type: file.type,
            category: form.querySelector('#doc-category').value,
            size: file.size,
            uploadDate: new Date().toISOString(),
            propertyId: form.querySelector('#doc-property').value || null,
            tenantId: form.querySelector('#doc-tenant').value || null,
            url: fileUrl
        };

        await api.create(DOC_KEY, docData);
        documents.push(docData);

        renderDocuments();
        rentalUtils.closeModal(form.closest('.modal-overlay'));
        rentalUtils.showNotification('Document uploaded successfully!');
    };

    docList.addEventListener('click', (e) => {
        const target = e.target;
        const id = target.closest('[data-id]')?.dataset.id;
        if (!id) return;

        if (target.closest('.action-dropdown-btn')) {
            document.querySelectorAll('.dropdown-menu').forEach(menu => menu.classList.add('hidden'));
            document.getElementById(`dropdown-${id}`).classList.toggle('hidden');
        } else if (target.closest('.delete-btn')) {
            e.preventDefault();
            if (rentalUtils.confirm('Are you sure you want to delete this document?')) {
                api.delete(DOC_KEY, id).then(() => {
                    documents = documents.filter(doc => doc.id !== id);
                    renderDocuments();
                    rentalUtils.showNotification('Document deleted successfully!', 'error');
                });
            }
        }
    });

    uploadBtn.addEventListener('click', openUploadModal);
    searchInput.addEventListener('input', rentalUtils.debounce(e => renderDocuments(e.target.value), 300));

    initialize();
});