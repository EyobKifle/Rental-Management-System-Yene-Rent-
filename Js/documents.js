document.addEventListener('DOMContentLoaded', () => {
    const uploadBtn = document.getElementById('upload-document-btn');
    const docModalContainer = document.getElementById('document-modal');
    const docList = document.getElementById('document-list');
    const emptyState = document.getElementById('empty-state');
    const searchInput = document.getElementById('search-input');
    const filterNav = document.getElementById('document-filter-nav');

    const DOC_KEY = 'documents';
    const PROPERTY_KEY = 'properties';
    const TENANT_KEY = 'tenants';

    let documents = [];
    let properties = [];
    let tenants = [];
    let activeCategory = 'all';

    const initialize = async () => {
        await window.rentalUtils.headerPromise;
        [documents, properties, tenants] = await Promise.all([
            api.get(DOC_KEY),
            api.get(PROPERTY_KEY),
            api.get(TENANT_KEY)
        ]);

        // Check for editId in URL params (if redirected from document-details.html)
        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('editId');
        if (editId) {
            const docToEdit = documents.find(doc => doc.id === editId);
            if (docToEdit) openDocumentModal(docToEdit);
        }
        renderDocuments();
    };

    const getFileIcon = (fileType) => {
        if (fileType.startsWith('image/')) return { icon: 'fa-solid fa-file-image', class: 'icon-image' };
        if (fileType === 'application/pdf') return { icon: 'fa-solid fa-file-pdf', class: 'icon-pdf' };
        if (fileType.includes('wordprocessingml')) return { icon: 'fa-solid fa-file-word', class: 'icon-doc' };
        return { icon: 'fa-solid fa-file', class: 'icon-other' };
    };

    const renderDocuments = () => {
        docList.innerHTML = '';
        const searchTerm = searchInput.value.toLowerCase();

        const filteredDocs = documents.filter(doc => {
            const matchesCategory = activeCategory === 'all' || doc.category === activeCategory;
            const matchesSearch = doc.name.toLowerCase().includes(searchTerm) || doc.category.toLowerCase().includes(searchTerm);
            return matchesCategory && matchesSearch;
        });

        if (filteredDocs.length === 0) {
            emptyState.classList.remove('hidden');
            docList.closest('table').classList.add('hidden');
        } else {
            emptyState.classList.add('hidden');
            docList.closest('table').classList.remove('hidden');
            filteredDocs.forEach(doc => {
                const row = document.createElement('tr');
                const { icon, class: iconClass } = getFileIcon(doc.type);
                const linkedTo = doc.propertyId ? properties.find(p => p.id === doc.propertyId)?.name : (doc.tenantId ? tenants.find(t => t.id === doc.tenantId)?.name : 'General');

                row.innerHTML = `
                    <td>
                        <div class="document-name-cell">
                            <i class="${icon} ${iconClass}"></i>
                            <span>${doc.name}</span>
                        </div>
                    </td>
                    <td>${doc.category}</td>
                    <td>${linkedTo}</td>
                    <td>${rentalUtils.formatFileSize(doc.size)}</td>
                    <td>${rentalUtils.formatDate(doc.uploadDate)}</td>
                    <td>
                        <div class="action-dropdown">
                            <button class="action-dropdown-btn" data-id="${doc.id}"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                            <div id="dropdown-${doc.id}" class="dropdown-menu hidden">
                                <a href="document-details.html?documentId=${doc.id}" class="dropdown-item"><i class="fa-solid fa-eye"></i>View Details</a>
                                <a href="#" class="dropdown-item edit-btn" data-id="${doc.id}"><i class="fa-solid fa-pencil"></i>Edit</a>
                                <a href="#" class="dropdown-item delete-btn" data-id="${doc.id}"><i class="fa-solid fa-trash-can"></i>Delete</a>
                            </div>
                        </div>
                    </td>
                `;
                docList.appendChild(row);
            });
        }
    };

    const openDocumentModal = async (doc = null) => {
        const propertyOptions = properties.map(p => `<option value="${p.id}" ${doc?.propertyId === p.id ? 'selected' : ''}>${p.name}</option>`).join('');
        const tenantOptions = tenants.map(t => `<option value="${t.id}" ${doc?.tenantId === t.id ? 'selected' : ''}>${t.name}</option>`).join('');
        const categories = ['Lease Agreement', 'Tenant ID', 'Payment Receipt', 'Property Title', 'Tax Document', 'Other'];
        const categoryOptions = categories.map(c => `<option value="${c}" ${doc?.category === c ? 'selected' : ''}>${c}</option>`).join('');

        const bodyHtml = `
            <form id="document-form">
             <div class="image-preview" id="doc-preview">
               <!-- Preview will be rendered here -->
           </div>
           <input type="hidden" id="doc-id" value="${doc?.id || ''}">
                <div class="form-group">
                    <label for="doc-file" class="form-label">File</label>
                    <input type="file" id="doc-file" class="form-input" ${doc ? '' : 'required'}>
                    ${doc ? `<small class="form-hint">Current file: ${doc.name}. Upload a new file to replace it.</small>` : ''}
                </div>
                <div class="form-group">
                    <label for="doc-name" class="form-label">Document Name (Optional)</label>
                    <input type="text" id="doc-name" class="form-input" value="${doc?.name || ''}" placeholder="e.g., 'January Rent Receipt'">
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
                    <button type="submit" class="btn-primary">${doc ? 'Save Changes' : 'Upload'}</button>
                </div>
            </form>
        `;

        const title = doc ? 'Edit Document' : 'Upload Document';
        await rentalUtils.createAndOpenModal({
            modalId: 'document-modal',
            title: title,
            bodyHtml: bodyHtml,
            formId: 'document-form',
            onSubmit: handleFormSubmit
        });

        // --- Preview Logic ---
        const modal = document.getElementById('document-modal').querySelector('.modal-overlay');
        const fileInput = modal.querySelector('#doc-file');
        const previewContainer = modal.querySelector('#doc-preview');

        const renderPreview = (fileName, fileUrl, fileType) => {
            previewContainer.innerHTML = ''; // Clear previous preview
            if (fileType?.startsWith('image/') && fileUrl) {
                previewContainer.innerHTML = `<img src="${fileUrl}" alt="Preview" class="preview-image">`;
            } else if (fileName) {
                const { icon, class: iconClass } = getFileIcon(fileType);
                previewContainer.innerHTML = `
                    <div class="preview-placeholder">
                        <i class="${icon} ${iconClass}" style="font-size: 3rem;"></i>
                        <span>${fileName}</span>
                    </div>`;
            } else {
                 previewContainer.innerHTML = `
                    <div class="preview-placeholder">
                        <i class="fa-solid fa-file-arrow-up" style="font-size: 3rem;"></i>
                        <span>No file selected</span>
                    </div>`;
            }
        };

        // Initial preview for editing
        if (doc) {
            renderPreview(doc.name, doc.url, doc.type);
        } else {
            renderPreview(null, null, null);
        }

        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                const url = await rentalUtils.readFileAsDataURL(file);
                renderPreview(file.name, url, file.type);
            }
        });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const form = e.target;
        const id = form.querySelector('#doc-id').value;
        const existingDoc = documents.find(d => d.id === id);

        const fileInput = form.querySelector('#doc-file');
        const file = fileInput.files[0];

        if (!file && !id) {
            rentalUtils.showNotification('Please select a file to upload.', 'error');
            return;
        }

        let fileUrl = existingDoc?.url || null;
        let fileType = existingDoc?.type || null;
        let fileSize = existingDoc?.size || 0;

        if (file) {
            fileUrl = await rentalUtils.readFileAsDataURL(file);
            fileType = file.type;
            fileSize = file.size;
        }

        const docData = {
            id: id || rentalUtils.generateId(),
            name: form.querySelector('#doc-name').value || file?.name || existingDoc.name,
            type: fileType,
            category: form.querySelector('#doc-category').value,
            size: fileSize,
            uploadDate: existingDoc?.uploadDate || new Date().toISOString(),
            propertyId: form.querySelector('#doc-property').value || null,
            tenantId: form.querySelector('#doc-tenant').value || null,
            url: fileUrl
        };

        if (id) {
            await api.update(DOC_KEY, id, docData);
            documents = documents.map(d => d.id === id ? docData : d);
        } else {
            await api.create(DOC_KEY, docData);
            documents.push(docData);
        }

        renderDocuments();
        rentalUtils.closeModal(form.closest('.modal-overlay'));
        rentalUtils.showNotification(`Document ${id ? 'updated' : 'uploaded'} successfully!`);
    };

    docList.addEventListener('click', (e) => {
        const target = e.target;
        const id = target.closest('[data-id]')?.dataset.id;
        if (!id) return;

        if (target.closest('.action-dropdown-btn')) {
            document.querySelectorAll('.dropdown-menu').forEach(menu => menu.classList.add('hidden'));
            document.getElementById(`dropdown-${id}`).classList.toggle('hidden');
        } else if (target.closest('.edit-btn')) {
            e.preventDefault();
            const docToEdit = documents.find(doc => doc.id === id);
            openDocumentModal(docToEdit);
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

    uploadBtn.addEventListener('click', () => openDocumentModal());
    searchInput.addEventListener('input', rentalUtils.debounce(() => renderDocuments(), 300));

    filterNav.addEventListener('click', (e) => {
        if (e.target.matches('.filter-btn')) {
            const category = e.target.dataset.category;
            activeCategory = category;

            filterNav.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            e.target.classList.add('active');
            renderDocuments();
        }
    });

    initialize();
});