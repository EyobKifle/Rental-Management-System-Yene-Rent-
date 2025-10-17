document.addEventListener('DOMContentLoaded', () => {
    const backBtn = document.getElementById('back-btn');
    const tenantForm = document.getElementById('tenant-form');
    const addPaymentBtn = document.getElementById('add-payment-btn');
    const addDocumentBtn = document.getElementById('add-document-btn');
    const paymentsTbody = document.getElementById('payments-tbody');
    const documentsTbody = document.getElementById('documents-tbody');
    const paymentsEmptyState = document.getElementById('payments-empty-state');
    const documentsEmptyState = document.getElementById('documents-empty-state');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    const urlParams = new URLSearchParams(window.location.search);
    const unitId = urlParams.get('unitId');

    let currentUnit = null;
    let currentTenant = null;
    let payments = [];
    let documents = [];

    const initialize = async () => {
        await window.rentalUtils.headerPromise;

        if (!unitId) {
            window.location.href = 'units.html';
            return;
        }

        // Load unit details
        currentUnit = await api.getById('units', unitId);
        if (!currentUnit) {
            rentalUtils.showNotification('Unit not found!', 'error');
            window.location.href = 'units.html';
            return;
        }

        // Load property for context
        const property = await api.getById('properties', currentUnit.propertyId);
        if (property) {
            currentUnit.propertyName = property.name;
        }

        // Load tenant if assigned
        if (currentUnit.tenantId) {
            currentTenant = await api.getById('tenants', currentUnit.tenantId);
        }

        // Load payments and documents for this unit
        payments = await api.get('payments');
        payments = payments.filter(p => p.unitId === unitId);

        documents = await api.get('documents');
        documents = documents.filter(d => d.unitId === unitId);

        populateTenantForm();
        renderPayments();
        renderDocuments();
        populateSummaryCard();
        updatePageTitle();
        handleTabNavigation(); // Initialize tab state from URL
    };

    const updatePageTitle = () => {
        document.getElementById('unit-title').textContent = `Unit ${currentUnit.unitNumber} Details`;
        document.getElementById('unit-subtitle').textContent = `Manage tenant information, payments, and documents`;
    };

    const populateSummaryCard = () => {
        document.getElementById('summary-property-name').textContent = currentUnit.propertyName || 'N/A';
        document.getElementById('summary-rent').textContent = rentalUtils.formatCurrency(currentUnit.rent);
        const status = currentUnit.tenantId ? 'Occupied' : 'Vacant';
        const statusClass = currentUnit.tenantId ? 'status-occupied' : 'status-vacant';
        document.getElementById('summary-status').innerHTML = `<span class="status-badge ${statusClass}">${status}</span>`;
    };

    const populateTenantForm = () => {
        if (currentTenant) {
            document.getElementById('tenant-id').value = currentTenant.id;
            document.getElementById('tenant-name').value = currentTenant.name || '';
            document.getElementById('tenant-phone').value = currentTenant.phone || '';
            document.getElementById('tenant-email').value = currentTenant.email || '';
            document.getElementById('tenant-tin').value = currentTenant.tin || '';
            document.getElementById('lease-start').value = currentTenant.leaseStart || '';
            document.getElementById('lease-end').value = currentTenant.leaseEnd || '';
            document.getElementById('tenant-deposit').value = currentTenant.deposit || 0;
            document.getElementById('tenant-rent').value = currentTenant.rent || currentUnit.rent || '';
        } else {
            document.getElementById('tenant-id').value = '';
            document.getElementById('tenant-name').value = '';
            document.getElementById('tenant-phone').value = '';
            document.getElementById('tenant-email').value = '';
            document.getElementById('tenant-tin').value = '';
            document.getElementById('lease-start').value = '';
            document.getElementById('lease-end').value = '';
            document.getElementById('tenant-deposit').value = 0;
            document.getElementById('tenant-rent').value = currentUnit.rent || '';
        }
    };

    const renderPayments = () => {
        paymentsTbody.innerHTML = '';

        if (payments.length === 0) {
            paymentsEmptyState.classList.remove('hidden');
            document.getElementById('payments-table-container').classList.add('hidden');
        } else {
            paymentsEmptyState.classList.add('hidden');
            document.getElementById('payments-table-container').classList.remove('hidden');

            payments.forEach(payment => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${rentalUtils.formatDate(payment.date)}</td>
                    <td>${payment.type}</td>
                    <td>${rentalUtils.formatCurrency(payment.amount)}</td>
                    <td><span class="status-badge status-${payment.status}">${payment.status}</span></td>
                `;
                paymentsTbody.appendChild(row);
            });
        }
    };

    const renderDocuments = () => {
        documentsTbody.innerHTML = '';

        if (documents.length === 0) {
            documentsEmptyState.classList.remove('hidden');
            document.getElementById('documents-table-container').classList.add('hidden');
        } else {
            documentsEmptyState.classList.add('hidden');
            document.getElementById('documents-table-container').classList.remove('hidden');

            documents.forEach(doc => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${doc.name}</td>
                    <td>${doc.type}</td>
                    <td>${rentalUtils.formatDate(doc.date)}</td>
                    <td>
                        <button class="btn-icon view-doc-btn" data-id="${doc.id}" title="View">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                        <button class="btn-icon edit-doc-btn" data-id="${doc.id}" title="Edit">
                            <i class="fa-solid fa-pencil"></i>
                        </button>
                        <button class="btn-icon delete-doc-btn" data-id="${doc.id}" title="Delete">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                `;
                documentsTbody.appendChild(row);
            });
        }
    };

    /**
     * Creates and opens a modal with the specified content.
     * @param {object} options - The options for creating the modal.
     * @param {string} options.modalId - The ID of the modal container element.
     * @param {string} options.title - The title to display in the modal header.
     * @param {string} options.bodyHtml - The HTML content for the modal body.
     * @param {function} [options.onOpen] - A callback function to execute after the modal is opened.
     */
    const createAndOpenModal = async ({ modalId, title, bodyHtml, onOpen }) => {
        const modalContainer = document.getElementById(modalId);
        if (!modalContainer) {
            console.error(`Modal container #${modalId} not found.`);
            return;
        }

        const response = await fetch('modal.html');
        modalContainer.innerHTML = await response.text();

        const modal = modalContainer.querySelector('.modal-overlay');
        modal.querySelector('#modal-title').textContent = title;
        modal.querySelector('#modal-body').innerHTML = bodyHtml;

        rentalUtils.openModal(modal);

        // Execute the onOpen callback to attach specific event listeners
        if (onOpen) onOpen(modal);
    };

    const openPaymentModal = async (payment = null) => {
        const title = payment ? 'Edit Payment' : 'Record New Payment';
        const bodyHtml = `
            <form id="payment-form" novalidate>
                <input type="hidden" id="payment-id" value="${payment ? payment.id : ''}">
                <div class="form-row">
                    <div class="form-group">
                        <label for="payment-date" class="form-label">Payment Date</label>
                        <input type="date" id="payment-date" class="form-input" value="${payment ? payment.date : new Date().toISOString().split('T')[0]}" required>
                    </div>
                    <div class="form-group">
                        <label for="payment-type" class="form-label">Payment Type</label>
                        <select id="payment-type" class="form-input" required>
                            <option value="Rent" ${payment && payment.type === 'Rent' ? 'selected' : ''}>Rent</option>
                            <option value="Deposit" ${payment && payment.type === 'Deposit' ? 'selected' : ''}>Deposit</option>
                            <option value="Late Fee" ${payment && payment.type === 'Late Fee' ? 'selected' : ''}>Late Fee</option>
                            <option value="Other" ${payment && payment.type === 'Other' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="payment-amount" class="form-label">Amount (ETB)</label>
                        <input type="number" id="payment-amount" class="form-input" value="${payment ? payment.amount : ''}" min="0" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label for="payment-status" class="form-label">Status</label>
                        <select id="payment-status" class="form-input" required>
                            <option value="paid" ${payment && payment.status === 'paid' ? 'selected' : ''}>Paid</option>
                            <option value="pending" ${payment && payment.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="overdue" ${payment && payment.status === 'overdue' ? 'selected' : ''}>Overdue</option>
                        </select>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="close-modal-btn btn-secondary">Cancel</button>
                    <button type="submit" class="btn-primary">Save Payment</button>
                </div>
            </form>`;

        await createAndOpenModal({
            modalId: 'payment-modal',
            title: title,
            bodyHtml: bodyHtml,
            onOpen: (modal) => {
                modal.querySelector('#payment-form').addEventListener('submit', handlePaymentFormSubmit);
            }
        });
    };

    const handlePaymentFormSubmit = async (e) => {
        e.preventDefault();
        const form = e.target;
        if (!rentalUtils.validateForm(form)) return;

        const id = form.querySelector('#payment-id').value;
        const paymentData = {
            id: id || rentalUtils.generateId(),
            unitId: unitId,
            date: form.querySelector('#payment-date').value,
            type: form.querySelector('#payment-type').value,
            amount: parseFloat(form.querySelector('#payment-amount').value),
            status: form.querySelector('#payment-status').value
        };

        if (id) {
            await api.update('payments', id, paymentData);
            payments = payments.map(p => p.id === id ? paymentData : p);
        } else {
            await api.create('payments', paymentData);
            payments.push(paymentData);
        }
        renderPayments();
        rentalUtils.closeModal(form.closest('.modal-overlay'));
        rentalUtils.showNotification(`Payment ${id ? 'updated' : 'recorded'} successfully!`);
    };

    const openDocumentModal = async (document = null) => {
        const title = document ? 'Edit Document' : 'Upload New Document';
        const bodyHtml = `
            <form id="document-form" novalidate>
                <input type="hidden" id="document-id" value="${document ? document.id : ''}">
                <div class="form-row">
                    <div class="form-group">
                        <label for="document-name" class="form-label">Document Name</label>
                        <input type="text" id="document-name" class="form-input" value="${document ? document.name : ''}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="document-type" class="form-label">Document Type</label>
                        <select id="document-type" class="form-input" required>
                            <option value="Receipt" ${document && document.type === 'Receipt' ? 'selected' : ''}>Receipt</option>
                            <option value="Contract" ${document && document.type === 'Contract' ? 'selected' : ''}>Contract</option>
                            <option value="Invoice" ${document && document.type === 'Invoice' ? 'selected' : ''}>Invoice</option>
                            <option value="Other" ${document && document.type === 'Other' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="document-date" class="form-label">Document Date</label>
                        <input type="date" id="document-date" class="form-input" value="${document ? document.date : new Date().toISOString().split('T')[0]}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="document-file" class="form-label">Upload File</label>
                    <input type="file" id="document-file" class="form-input" accept="image/*,.pdf,.doc,.docx">
                    <small class="form-hint">Supported formats: Images, PDF, Word documents</small>
                </div>
                <div class="form-actions">
                    <button type="button" class="close-modal-btn btn-secondary">Cancel</button>
                    <button type="submit" class="btn-primary">Save Document</button>
                </div>
            </form>`;

        await createAndOpenModal({
            modalId: 'document-modal',
            title: title,
            bodyHtml: bodyHtml,
            onOpen: (modal) => {
                modal.querySelector('#document-form').addEventListener('submit', handleDocumentFormSubmit);
            }
        });
    };

    const handleDocumentFormSubmit = async (e) => {
        e.preventDefault();
        const form = e.target;
        if (!rentalUtils.validateForm(form)) return;

        const id = form.querySelector('#document-id').value;
        const fileInput = form.querySelector('#document-file');
        let fileData = null;

        if (fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            fileData = await rentalUtils.convertFileToBase64(file);
        }

        const documentData = {
            id: id || rentalUtils.generateId(),
            unitId: unitId,
            name: form.querySelector('#document-name').value,
            type: form.querySelector('#document-type').value,
            date: form.querySelector('#document-date').value,
            file: fileData || null,
            fileName: fileInput.files && fileInput.files[0] ? fileInput.files[0].name : null
        };

        if (id) {
            await api.update('documents', id, documentData);
            documents = documents.map(d => d.id === id ? documentData : d);
        } else {
            await api.create('documents', documentData);
            documents.push(documentData);
        }
        renderDocuments();
        rentalUtils.closeModal(form.closest('.modal-overlay'));
        rentalUtils.showNotification(`Document ${id ? 'updated' : 'uploaded'} successfully!`);
    };

    const viewDocument = async (docId) => {
        const doc = documents.find(d => d.id === docId);
        if (!doc) return;

        const title = doc.name;
        const bodyHtml = `
            <div class="document-view">
                <div class="document-info">
                    <p><strong>Type:</strong> ${doc.type}</p>
                    <p><strong>Date:</strong> ${rentalUtils.formatDate(doc.date)}</p>
                    ${doc.fileName ? `<p><strong>File:</strong> ${doc.fileName}</p>` : ''}
                </div>
                ${doc.file ? `<div class="document-preview">
                    ${doc.fileName && doc.fileName.toLowerCase().endsWith('.pdf') ?
                        `<iframe src="${doc.file}" width="100%" height="500px"></iframe>` :
                        `<img src="${doc.file}" alt="${doc.name}" style="max-width: 100%; max-height: 500px;">`
                    }
                </div>` : '<p>No file attached</p>'}
            </div>
            <div class="form-actions">
                <button type="button" class="close-modal-btn btn-secondary">Close</button>
            </div>
        `;

        await createAndOpenModal({
            modalId: 'document-view-modal',
            title: title,
            bodyHtml: bodyHtml
            // No onOpen needed as there are no forms to submit
        });
    };

    const switchTab = (tabId) => {
        // Deactivate all tabs and content
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        // Activate the selected tab and content
        const activeBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        const activeContent = document.getElementById(`${tabId}-tab`);

        if (activeBtn) activeBtn.classList.add('active');
        if (activeContent) activeContent.classList.add('active');
    };

    const handleTabNavigation = () => {
        // Set up click listeners to update the hash
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = btn.dataset.tab;
                window.location.hash = tabId;
            });
        });

        // Listen for hash changes to switch tabs
        window.addEventListener('hashchange', () => switchTab(window.location.hash.substring(1)));

        // Initial tab state based on hash or default to 'tenant'
        const initialTab = window.location.hash.substring(1) || 'tenant';
        switchTab(initialTab);
        if (!window.location.hash) {
            window.location.hash = 'tenant'; // Set default hash
        }
    };
    // Tenant form submit
    tenantForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!rentalUtils.validateForm(tenantForm)) return;

        const tenantData = {
            id: document.getElementById('tenant-id').value || rentalUtils.generateId(),
            name: document.getElementById('tenant-name').value,
            phone: document.getElementById('tenant-phone').value,
            email: document.getElementById('tenant-email').value,
            tin: document.getElementById('tenant-tin').value,
            leaseStart: document.getElementById('lease-start').value,
            leaseEnd: document.getElementById('lease-end').value,
            deposit: parseFloat(document.getElementById('tenant-deposit').value),
            rent: parseFloat(document.getElementById('tenant-rent').value),
            unitId: unitId
        };

        if (tenantData.id) {
            await api.update('tenants', tenantData.id, tenantData);
            currentTenant = tenantData;
        } else {
            await api.create('tenants', tenantData);
            currentTenant = tenantData;
            // Update unit with tenant ID
            currentUnit.tenantId = tenantData.id;
            await api.update('units', unitId, currentUnit);
            populateSummaryCard(); // Refresh summary card
        }

        rentalUtils.showNotification('Tenant information saved successfully!');
    });

    // Documents table event delegation
    documentsTbody.addEventListener('click', (e) => {
        const target = e.target;
        const id = target.closest('button')?.dataset.id;

        if (target.closest('.view-doc-btn')) {
            viewDocument(id);
        } else if (target.closest('.edit-doc-btn')) {
            const docToEdit = documents.find(d => d.id === id);
            openDocumentModal(docToEdit);
        } else if (target.closest('.delete-doc-btn')) {
            if (rentalUtils.confirm('Are you sure you want to delete this document?')) {
                api.delete('documents', id).then(() => {
                    documents = documents.filter(d => d.id !== id);
                    renderDocuments();
                    rentalUtils.showNotification('Document deleted successfully!', 'error');
                });
            }
        }
    });

    // Back button
    backBtn.addEventListener('click', () => {
        window.location.href = 'units.html';
    });

    // Add payment button
    addPaymentBtn.addEventListener('click', () => openPaymentModal());

    // Add document button
    addDocumentBtn.addEventListener('click', () => openDocumentModal());

    // Initial load
    initialize();
});
