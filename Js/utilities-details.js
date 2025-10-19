document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const backBtn = document.getElementById('back-btn');
    const utilityTitle = document.getElementById('utility-title');
    const utilitySubtitle = document.getElementById('utility-subtitle');
    const editBtn = document.getElementById('edit-btn');
    const deleteBtn = document.getElementById('delete-btn');
    const printBtn = document.getElementById('print-btn');

    // Detail Fields
    const detailType = document.getElementById('detail-type');
    const detailProperty = document.getElementById('detail-property');
    const detailAmount = document.getElementById('detail-amount');
    const detailDueDate = document.getElementById('detail-due-date');
    const detailStatus = document.getElementById('detail-status');
    const receiptImageWrapper = document.getElementById('receipt-image-wrapper');

    // URL Params
    const urlParams = new URLSearchParams(window.location.search);
    const utilityId = urlParams.get('utilityId');

    // Keys
    const UTILITY_KEY = 'utilities';
    const PROPERTY_KEY = 'properties';

    // State
    let currentUtility = null;
    let properties = [];

    const initialize = async () => {
        await window.rentalUtils.headerPromise;

        if (!utilityId) {
            rentalUtils.showNotification('Utility ID not found.', 'error');
            window.location.href = 'utilities.html';
            return;
        }

        [properties] = await Promise.all([api.get(PROPERTY_KEY)]);
        const utilities = await api.get(UTILITY_KEY);
        currentUtility = utilities.find(util => util.id === utilityId);

        if (!currentUtility) {
            rentalUtils.showNotification('Utility bill not found.', 'error');
            window.location.href = 'utilities.html';
            return;
        }

        renderUtilityDetails();
        setupEventListeners();
    };

    const renderUtilityDetails = () => {
        const property = properties.find(p => p.id === currentUtility.propertyId);
        const statusClass = currentUtility.status.toLowerCase().replace(' ', '-');

        // Header
        utilityTitle.textContent = `${currentUtility.type} Bill for ${property?.name || 'N/A'}`;
        utilitySubtitle.textContent = `Due on ${rentalUtils.formatDate(currentUtility.dueDate)}`;

        // Details
        detailType.textContent = currentUtility.type;
        detailProperty.textContent = property?.name || 'N/A';
        detailAmount.textContent = rentalUtils.formatCurrency(currentUtility.amount);
        detailDueDate.textContent = rentalUtils.formatDate(currentUtility.dueDate);
        detailStatus.innerHTML = `<span class="status-badge status-${statusClass}">${currentUtility.status}</span>`;

        // Receipt Image
        if (currentUtility.receiptImageUrl) {
            receiptImageWrapper.innerHTML = `<a href="${currentUtility.receiptImageUrl}" target="_blank" class="detail-image-preview">
                                                 <img src="${currentUtility.receiptImageUrl}" alt="Receipt image">
                                                 <span>View Full Image</span>
                                             </a>`;
        } else {
            receiptImageWrapper.innerHTML = `<div class="detail-image-placeholder">
                                                 <i class="fa-solid fa-receipt"></i>
                                                 <span>Receipt Not Provided</span>
                                             </div>`;
        }
    };

    const setupEventListeners = () => {
        backBtn.addEventListener('click', () => {
            window.location.href = 'utilities.html';
        });

        editBtn.addEventListener('click', () => {
            window.location.href = `utilities.html?editId=${currentUtility.id}`;
        });

        deleteBtn.addEventListener('click', async () => {
            if (rentalUtils.confirm(`Are you sure you want to delete this ${currentUtility.type} bill?`)) {
                try {
                    await api.delete(UTILITY_KEY, currentUtility.id);
                    rentalUtils.showNotification('Utility bill deleted successfully!', 'error');
                    window.location.href = 'utilities.html';
                } catch (error) {
                    rentalUtils.showNotification('Failed to delete bill.', 'error');
                    console.error('Delete utility error:', error);
                }
            }
        });

        printBtn.addEventListener('click', () => {
            window.print();
        });
    };

    initialize();
});