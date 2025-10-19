document.addEventListener('DOMContentLoaded', () => {
    const backBtn = document.getElementById('back-btn');
    const documentTitle = document.getElementById('document-title');
    const documentSubtitle = document.getElementById('document-subtitle');
    const detailName = document.getElementById('detail-name');
    const detailCategory = document.getElementById('detail-category');
    const detailLinkedTo = document.getElementById('detail-linked-to');
    const detailSize = document.getElementById('detail-size');
    const detailUploadDate = document.getElementById('detail-upload-date');
    const documentPreviewContent = document.getElementById('document-preview-content');
    const downloadDocumentBtn = document.getElementById('download-document-btn');
    const editDocumentBtn = document.getElementById('edit-document-btn');
    const deleteDocumentBtn = document.getElementById('delete-document-btn');
    const shareDocumentBtn = document.getElementById('share-document-btn');
    const printDocumentBtn = document.getElementById('print-document-btn');

    const urlParams = new URLSearchParams(window.location.search);
    const documentId = urlParams.get('documentId');

    const DOC_KEY = 'documents';
    const PROPERTY_KEY = 'properties';
    const TENANT_KEY = 'tenants';

    let currentDocument = null;
    let properties = [];
    let tenants = [];

    const initialize = async () => {
        await window.rentalUtils.headerPromise;

        if (!documentId) {
            rentalUtils.showNotification('Document ID not found in URL.', 'error');
            window.location.href = 'documents.html';
            return;
        }

        [properties, tenants] = await Promise.all([
            api.get(PROPERTY_KEY),
            api.get(TENANT_KEY)
        ]);

        const documents = await api.get(DOC_KEY);
        currentDocument = documents.find(doc => doc.id === documentId);

        if (!currentDocument) {
            rentalUtils.showNotification('Document not found.', 'error');
            window.location.href = 'documents.html';
            return;
        }

        renderDocumentDetails();
    };

    const getFileIcon = (fileType) => {
        if (fileType.startsWith('image/')) return { icon: 'fa-solid fa-file-image', class: 'icon-image' };
        if (fileType === 'application/pdf') return { icon: 'fa-solid fa-file-pdf', class: 'icon-pdf' };
        if (fileType.includes('wordprocessingml')) return { icon: 'fa-solid fa-file-word', class: 'icon-doc' };
        return { icon: 'fa-solid fa-file', class: 'icon-other' };
    };

    const renderDocumentDetails = () => {
        documentTitle.textContent = currentDocument.name;
        documentSubtitle.textContent = `Category: ${currentDocument.category}`;

        detailName.textContent = currentDocument.name;
        detailCategory.textContent = currentDocument.category;

        let linkedToText = 'General';
        if (currentDocument.propertyId) {
            const property = properties.find(p => p.id === currentDocument.propertyId);
            linkedToText = property ? `Property: ${property.name}` : 'N/A Property';
        } else if (currentDocument.tenantId) {
            const tenant = tenants.find(t => t.id === currentDocument.tenantId);
            linkedToText = tenant ? `Tenant: ${tenant.name}` : 'N/A Tenant';
        }
        detailLinkedTo.textContent = linkedToText;

        detailSize.textContent = rentalUtils.formatFileSize(currentDocument.size);
        detailUploadDate.textContent = rentalUtils.formatDate(currentDocument.uploadDate);

        renderDocumentPreview(currentDocument);

        // Set up action buttons
        editDocumentBtn.addEventListener('click', () => {
            // Redirect to documents.html with an editId parameter to open the modal
            window.location.href = `documents.html?editId=${currentDocument.id}`;
        });

        deleteDocumentBtn.addEventListener('click', async () => {
            if (rentalUtils.confirm(`Are you sure you want to delete "${currentDocument.name}"?`)) {
                try {
                    await api.delete(DOC_KEY, currentDocument.id);
                    rentalUtils.showNotification('Document deleted successfully!', 'error');
                    window.location.href = 'documents.html'; // Go back to documents list
                } catch (error) {
                    rentalUtils.showNotification('Failed to delete document.', 'error');
                    console.error('Delete document error:', error);
                }
            }
        });
    };

    const renderDocumentPreview = (doc) => {
        documentPreviewContent.innerHTML = ''; // Clear previous content
        downloadDocumentBtn.classList.add('hidden'); // Hide download button by default
        shareDocumentBtn.classList.add('hidden'); // Hide share button by default

        if (!doc.url) {
            documentPreviewContent.innerHTML = `
                <div class="placeholder-message">
                    <i class="fa-solid fa-file-circle-xmark"></i>
                    <p>No file available for preview.</p>
                </div>`;
            return;
        }

        downloadDocumentBtn.href = doc.url;
        downloadDocumentBtn.download = doc.name; // Suggest download name
        downloadDocumentBtn.classList.remove('hidden');
        shareDocumentBtn.classList.remove('hidden');

        if (doc.type.startsWith('image/')) {
            documentPreviewContent.innerHTML = `<img src="${doc.url}" alt="${doc.name}">`;
        } else if (doc.type === 'application/pdf') {
            // Use iframe for PDF preview
            documentPreviewContent.innerHTML = `<iframe src="${doc.url}" title="${doc.name}"></iframe>`;
        } else {
            // For other file types, show a generic icon and message
            const { icon, class: iconClass } = getFileIcon(doc.type);
            documentPreviewContent.innerHTML = `
                <div class="placeholder-message">
                    <i class="${icon} ${iconClass}"></i>
                    <p>Preview not available for this file type.</p>
                    <p>Click "Download File" to view.</p>
                </div>`;
        }
    };

    backBtn.addEventListener('click', () => {
        window.history.back(); // Go back to the previous page (documents list)
    });

    shareDocumentBtn.addEventListener('click', async () => {
        if (!currentDocument || !currentDocument.url) {
            rentalUtils.showNotification('No document to share.', 'error');
            return;
        }

        const shareData = {
            title: currentDocument.name,
            text: `Check out this document: ${currentDocument.name}`,
            url: window.location.href // Share the link to this details page
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
                console.log('Document shared successfully');
            } catch (err) {
                console.error('Share failed:', err.message);
            }
        } else {
            // Fallback for browsers that don't support the Web Share API
            try {
                await navigator.clipboard.writeText(window.location.href);
                rentalUtils.showNotification('Link copied to clipboard!', 'success');
            } catch (err) {
                rentalUtils.showNotification('Could not copy link.', 'error');
                console.error('Failed to copy: ', err);
            }
        }
    });

    printDocumentBtn.addEventListener('click', () => {
        if (!currentDocument || !currentDocument.url) {
            rentalUtils.showNotification('No document file to print.', 'error');
            return;
        }

        // For PDFs, print the content of the iframe directly for a clean print.
        const iframe = documentPreviewContent.querySelector('iframe');
        if (iframe && currentDocument.type === 'application/pdf') {
            try {
                iframe.contentWindow.print();
            } catch (error) {
                console.error('Could not access iframe content for printing. Falling back to window.print().', error);
                window.print(); // Fallback for cross-origin issues
            }
            return;
        }

        // For images, open in a new window and print.
        if (currentDocument.type.startsWith('image/')) {
            window.print(); // Use the @media print styles for a clean image print
            return;
        }

        // For other file types, printing is not supported.
        rentalUtils.showNotification('Printing is not supported for this file type. Please download the file to print it.', 'info');
    });

    initialize();
});