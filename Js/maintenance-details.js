document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const backBtn = document.getElementById('back-btn');
    const requestTitle = document.getElementById('request-title');
    const requestSubtitle = document.getElementById('request-subtitle');
    const editRequestBtn = document.getElementById('edit-request-btn');
    const deleteRequestBtn = document.getElementById('delete-request-btn');
    const printRequestBtn = document.getElementById('print-request-btn');

    // Detail Fields
    const detailTitle = document.getElementById('detail-title');
    const detailProperty = document.getElementById('detail-property');
    const detailUnit = document.getElementById('detail-unit');
    const detailCategory = document.getElementById('detail-category');
    const detailStatus = document.getElementById('detail-status');
    const detailReportedDate = document.getElementById('detail-reported-date');
    const detailCost = document.getElementById('detail-cost');
    const detailReceiptNumber = document.getElementById('detail-receipt-number');
    const receiptImageWrapper = document.getElementById('receipt-image-wrapper');
    const imageGallery = document.querySelector('.maintenance-image-gallery');

    // URL Params
    const urlParams = new URLSearchParams(window.location.search);
    const requestId = urlParams.get('requestId');

    // Keys
    const MAINTENANCE_KEY = 'maintenance';
    const PROPERTY_KEY = 'properties';
    const UNIT_KEY = 'units';

    // State
    let currentRequest = null;
    let properties = [];
    let units = [];

    const initialize = async () => {
        await window.rentalUtils.headerPromise;

        if (!requestId) {
            rentalUtils.showNotification('Request ID not found.', 'error');
            window.location.href = 'maintenance.html';
            return;
        }

        [properties, units] = await Promise.all([
            api.get(PROPERTY_KEY),
            api.get(UNIT_KEY)
        ]);

        const requests = await api.get(MAINTENANCE_KEY);
        currentRequest = requests.find(req => req.id === requestId);

        if (!currentRequest) {
            rentalUtils.showNotification('Maintenance request not found.', 'error');
            window.location.href = 'maintenance.html';
            return;
        }

        renderRequestDetails();
        setupEventListeners();
    };

    const renderRequestDetails = () => {
        const property = properties.find(p => p.id === currentRequest.propertyId);
        const unit = units.find(u => u.id === currentRequest.unitId);
        const statusClass = currentRequest.status.toLowerCase().replace(' ', '-');

        // Header
        requestTitle.textContent = currentRequest.title;
        requestSubtitle.textContent = `For ${property?.name || 'N/A'} - Reported on ${rentalUtils.formatDate(currentRequest.reportedDate)}`;

        // Details
        detailTitle.textContent = currentRequest.title;
        detailProperty.textContent = property?.name || 'N/A';
        detailUnit.textContent = unit ? `Unit ${unit.unitNumber}` : 'Property-wide';
        detailCategory.textContent = currentRequest.category;
        detailStatus.innerHTML = `<span class="status-badge status-${statusClass}">${currentRequest.status}</span>`;
        detailReportedDate.textContent = rentalUtils.formatDate(currentRequest.reportedDate);
        detailCost.textContent = currentRequest.cost ? rentalUtils.formatCurrency(currentRequest.cost) : 'N/A';
        detailReceiptNumber.textContent = currentRequest.receiptNumber || 'N/A';

        // Images
        const renderImage = (url, title) => {
            if (!url) {
                return `<div class="detail-image-placeholder">
                            <i class="fa-solid fa-image"></i>
                            <span>${title} Not Provided</span>
                        </div>`;
            }
            return `<a href="${url}" target="_blank" class="detail-image-preview">
                        <img src="${url}" alt="${title} image">
                        <span>${title}</span>
                    </a>`;
        };

        receiptImageWrapper.innerHTML = renderImage(currentRequest.receiptImageUrl, 'Receipt');
        imageGallery.innerHTML = `
            ${renderImage(currentRequest.beforeImageUrl, 'Before')}
            ${renderImage(currentRequest.afterImageUrl, 'After')}
        `;
    };

    const setupEventListeners = () => {
        backBtn.addEventListener('click', () => {
            window.location.href = 'maintenance.html';
        });

        editRequestBtn.addEventListener('click', () => {
            window.location.href = `maintenance.html?editId=${currentRequest.id}`;
        });

        deleteRequestBtn.addEventListener('click', async () => {
            if (rentalUtils.confirm(`Are you sure you want to delete the request: "${currentRequest.title}"?`)) {
                try {
                    await api.delete(MAINTENANCE_KEY, currentRequest.id);
                    rentalUtils.showNotification('Request deleted successfully!', 'error');
                    window.location.href = 'maintenance.html';
                } catch (error) {
                    rentalUtils.showNotification('Failed to delete request.', 'error');
                    console.error('Delete request error:', error);
                }
            }
        });

        printRequestBtn.addEventListener('click', () => {
            window.print();
        });
    };

    initialize();
});