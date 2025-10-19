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

    let allData = {};
    let currentUnit = null;
    let currentTenant = null;
    let payments = [];
    let unitDocuments = [];

    const initialize = async () => {
        await window.rentalUtils.headerPromise;

        if (!unitId) {
            window.location.href = 'units.html';
            return;
        }

        // Load all necessary data at once
        const [units, properties, tenants, allPayments, allDocuments, leases] = await Promise.all([
            api.get('units'),
            api.get('properties'),
            api.get('tenants'),
            api.get('payments'),
            api.get('documents'),
            api.get('leases')
        ]);

        allData = { units, properties, tenants, payments: allPayments, documents: allDocuments, leases };

        currentUnit = allData.units.find(u => u.id === unitId);
        if (!currentUnit) {
            rentalUtils.showNotification('Unit not found!', 'error');
            window.location.href = 'units.html';
            return;
        }

        currentUnit.propertyName = allData.properties.find(p => p.id === currentUnit.propertyId)?.name;
        currentTenant = allData.tenants.find(t => t.id === currentUnit.tenantId);

        // Load payments and documents for this unit
        const unitLeaseIds = allData.leases.filter(l => l.unitId === unitId).map(l => l.id);
        payments = allData.payments.filter(p => unitLeaseIds.includes(p.leaseId));
        unitDocuments = allData.documents.filter(d => d.unitId === unitId || (currentTenant && d.tenantId === currentTenant.id));

        populateTenantForm();
        renderPayments();
        renderDocuments();
        populateSummaryCard();
        updatePageTitle();
        handleTabNavigation();
        rentalUtils.setupLucideIcons();
    };

    const populateSummaryCard = () => {
        document.getElementById('summary-property-name').textContent = currentUnit.propertyName || 'N/A';
        document.getElementById('summary-rent').textContent = rentalUtils.formatCurrency(currentUnit.rent);
        const status = currentUnit.tenantId ? 'Occupied' : 'Vacant';
        const statusClass = currentUnit.tenantId ? 'status-occupied' : 'status-vacant';
        document.getElementById('summary-status').innerHTML = `<span class="status-badge ${statusClass}">${status}</span>`;
    };

    const updatePageTitle = () => {
        document.getElementById('unit-title').textContent = `Unit ${currentUnit.unitNumber} Details`;
        document.getElementById('unit-subtitle').textContent = `Manage tenant information, payments, and documents for ${currentUnit.propertyName}`;
    };

    const populateTenantForm = () => {
        if (currentTenant) {
            document.getElementById('tenant-id').value = currentTenant.id;
            document.getElementById('tenant-name').value = currentTenant.name || '';
            document.getElementById('tenant-phone').value = currentTenant.phone || '';
            document.getElementById('tenant-email').value = currentTenant.email || '';
        } else {
            tenantForm.reset();
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
                    <td>${payment.method}</td>
                `;
                paymentsTbody.appendChild(row);
            });
        }
    };

    const renderDocuments = () => {
        documentsTbody.innerHTML = '';

        if (unitDocuments.length === 0) {
            documentsEmptyState.classList.remove('hidden');
            document.getElementById('documents-table-container').classList.add('hidden');
        } else {
            documentsEmptyState.classList.add('hidden');
            document.getElementById('documents-table-container').classList.remove('hidden');

            unitDocuments.forEach(doc => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${doc.name}</td>
                    <td>${doc.type}</td>
                    <td>${rentalUtils.formatDate(doc.date)}</td>
                    <td>
                        <button class="btn-icon view-doc-btn" data-id="${doc.id}" title="View">
                            <i data-lucide="eye"></i>
                        </button>
                        <button class="btn-icon edit-doc-btn" data-id="${doc.id}" title="Edit">
                            <i data-lucide="pencil"></i>
                        </button>
                        <button class="btn-icon delete-doc-btn" data-id="${doc.id}" title="Delete">
                            <i data-lucide="trash"></i>
                        </button>
                    </td>
                `;
                documentsTbody.appendChild(row);
            });
        }
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
                        <label for="payment-method" class="form-label">Payment Method</label>
                        <select id="payment-method" class="form-input" required>
                            <option value="Bank Transfer" ${payment && payment.method === 'Bank Transfer' ? 'selected' : ''}>Bank Transfer</option>
                            <option value="Cash" ${payment && payment.method === 'Cash' ? 'selected' : ''}>Cash</option>
                            <option value="CBE Birr" ${payment && payment.method === 'CBE Birr' ? 'selected' : ''}>CBE Birr</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="payment-amount" class="form-label">Amount (ETB)</label>
                        <input type="number" id="payment-amount" class="form-input" value="${payment ? payment.amount : ''}" min="0" step="0.01" required>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="close-modal-btn btn-secondary">Cancel</button>
                    <button type="submit" class="btn-primary">Save Payment</button>
                </div>
            </form>
        `;

        await rentalUtils.createAndOpenModal({
            modalId: 'payment-modal',
            title: title,
            bodyHtml: bodyHtml,
            formId: 'payment-form',
            onSubmit: handlePaymentFormSubmit
        });
    };

    const handlePaymentFormSubmit = async (e) => {
        e.preventDefault();
        const form = e.target;
        if (!rentalUtils.validateForm(form)) return;

        const id = form.querySelector('#payment-id').value;
        const activeLease = allData.leases.find(l => l.unitId === unitId && getLeaseStatus(l).text === 'Active');
        if (!activeLease) {
            rentalUtils.showNotification('Cannot record payment: No active lease for this unit.', 'error');
            return;
        }
        const paymentData = {
            id: id || rentalUtils.generateId(),
            leaseId: activeLease.id,
            date: form.querySelector('#payment-date').value,
            type: form.querySelector('#payment-type').value,
            amount: parseFloat(form.querySelector('#payment-amount').value),
            method: form.querySelector('#payment-method').value
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
                        <label for="document-category" class="form-label">Category</label>
                        <select id="document-category" class="form-input" required>
                            <option value="Lease Agreement" ${document && document.category === 'Lease Agreement' ? 'selected' : ''}>Lease Agreement</option>
                            <option value="Tenant ID" ${document && document.category === 'Tenant ID' ? 'selected' : ''}>Tenant ID</option>
                            <option value="Payment Receipt" ${document && document.category === 'Payment Receipt' ? 'selected' : ''}>Payment Receipt</option>
                            <option value="Other" ${document && document.category === 'Other' ? 'selected' : ''}>Other</option>
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
            </form>
        `;

        await rentalUtils.createAndOpenModal({
            modalId: 'document-modal',
            title: title,
            bodyHtml: bodyHtml,
            formId: 'document-form',
            onSubmit: handleDocumentFormSubmit
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
            fileData = await rentalUtils.readFileAsDataURL(file);
        }

        const documentData = {
            id: id || rentalUtils.generateId(),
            unitId: unitId, // Link to unit
            propertyId: currentUnit.propertyId, // Link to property
            tenantId: currentTenant ? currentTenant.id : null, // Link to tenant
            name: form.querySelector('#document-name').value,
            category: form.querySelector('#document-category').value,
            date: form.querySelector('#document-date').value,
            url: fileData || (document ? document.url : null),
            fileName: fileInput.files && fileInput.files[0] ? fileInput.files[0].name : null
        };

        if (id) {
            await api.update('documents', id, documentData);
            unitDocuments = unitDocuments.map(d => d.id === id ? documentData : d);
        } else {
            await api.create('documents', documentData);
            unitDocuments.push(documentData);
        }
        renderDocuments();
        rentalUtils.closeModal(form.closest('.modal-overlay'));
        rentalUtils.showNotification(`Document ${id ? 'updated' : 'uploaded'} successfully!`);
    };

    const viewDocument = async(docId) => {
        const doc = unitDocuments.find(d => d.id === docId);
        if (!doc) return;

        const title = doc.name;
        const bodyHtml = `
            <div class="document-view">
                <div class="document-info">
                    <p><strong>Type:</strong> ${doc.category}</p>
                    <p><strong>Date:</strong> ${rentalUtils.formatDate(doc.uploadDate || doc.date)}</p>
                    ${doc.fileName ? `<p><strong>File:</strong> ${doc.fileName}</p>` : ''}
                </div>
                ${doc.url ? `<div class="document-preview">
                    ${doc.fileName && doc.fileName.toLowerCase().endsWith('.pdf') ?
                        `<iframe src="${doc.url}" width="100%" height="500px"></iframe>` :
                        `<img src="${doc.url}" alt="${doc.name}" style="max-width: 100%; max-height: 500px;">`
                    }
                </div>` : '<p>No file attached</p>'}
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary close-modal-btn">Close</button>
            </div>
        `;

        await rentalUtils.createAndOpenModal({
            modalId: 'document-view-modal',
            title: title,
            bodyHtml: bodyHtml
        });
    };

    const switchTab = (tabId) => {
        tabContents.forEach(content => {
            content.classList.remove('active');
        });
        tabBtns.forEach(btn => {
            btn.classList.remove('active');
        });
        const activeContent = document.getElementById(tabId);
        const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);

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

    const getLeaseStatus = (lease) => {
        const today = new Date().setHours(0, 0, 0, 0);
        const startDate = new Date(lease.startDate).setHours(0, 0, 0, 0);
        const endDate = new Date(lease.endDate).setHours(0, 0, 0, 0);

        if (today > endDate) return { text: 'Expired' };
        if (today >= startDate && today <= endDate) return { text: 'Active' };
        return { text: 'Upcoming' };
    };

    // Tenant form submit
    tenantForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!rentalUtils.validateForm(tenantForm)) return;

        const tenantId = document.getElementById('tenant-id').value;
        const isNewTenant = !tenantId;

        const tenantData = {
            id: tenantId || rentalUtils.generateId(),
            name: document.getElementById('tenant-name').value,
            phone: document.getElementById('tenant-phone').value,
            email: document.getElementById('tenant-email').value,
            unitId: unitId
        };

        if (isNewTenant) {
            // This flow is simplified. A new tenant should ideally be created via the Tenants or Leases page.
            // Here, we create the tenant and assign them to the unit.
            await api.create('tenants', tenantData);
            allData.tenants.push(tenantData);
            currentTenant = tenantData;
            await api.update('units', unitId, { tenantId: tenantData.id });
            currentUnit.tenantId = tenantData.id;
        } else {
            await api.update('tenants', tenantData.id, tenantData);
            allData.tenants = allData.tenants.map(t => t.id === tenantData.id ? tenantData : t);
            currentTenant = tenantData;
        }

        populateSummaryCard();
        // No modal to close here as this form is inline on the page, not in a modal.
        rentalUtils.showNotification('Tenant information saved successfully!');
    });

    // Documents table event delegation
    documentsTbody.addEventListener('click', (e) => {
        const target = e.target;
        const id = target.closest('[data-id]')?.dataset.id;

        if (target.closest('.view-doc-btn')) {
            viewDocument(id);
        } else if (target.closest('.edit-doc-btn')) {
            const docToEdit = unitDocuments.find(d => d.id === id);
            openDocumentModal(docToEdit);
        } else if (target.closest('.delete-doc-btn')) {
            if (rentalUtils.confirm('Are you sure you want to delete this document?')) {
                api.delete('documents', id).then(() => {
                    unitDocuments = unitDocuments.filter(d => d.id !== id);
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
