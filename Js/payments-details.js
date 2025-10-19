document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const backBtn = document.getElementById('back-btn');
    const paymentTitle = document.getElementById('payment-title');
    const paymentSubtitle = document.getElementById('payment-subtitle');
    const editBtn = document.getElementById('edit-btn');
    const deleteBtn = document.getElementById('delete-btn');
    const printBtn = document.getElementById('print-btn');

    // Detail Fields
    const detailTenant = document.getElementById('detail-tenant');
    const detailProperty = document.getElementById('detail-property');
    const detailAmount = document.getElementById('detail-amount');
    const detailPaymentDate = document.getElementById('detail-payment-date');
    const detailMethod = document.getElementById('detail-method');
    const detailType = document.getElementById('detail-type');
    const detailReceiptNumber = document.getElementById('detail-receipt-number');
    const receiptImageWrapper = document.getElementById('receipt-image-wrapper');

    // URL Params
    const urlParams = new URLSearchParams(window.location.search);
    const paymentId = urlParams.get('paymentId');

    // Keys
    const PAYMENT_KEY = 'payments';
    const LEASE_KEY = 'leases';
    const TENANT_KEY = 'tenants';
    const PROPERTY_KEY = 'properties';
    const UNIT_KEY = 'units';

    // State
    let currentPayment = null;
    let allData = {};

    const initialize = async () => {
        await window.rentalUtils.headerPromise;

        if (!paymentId) {
            rentalUtils.showNotification('Payment ID not found.', 'error');
            window.location.href = 'payments.html';
            return;
        }

        const [payments, leases, tenants, properties, units] = await Promise.all([
            api.get(PAYMENT_KEY),
            api.get(LEASE_KEY),
            api.get(TENANT_KEY),
            api.get(PROPERTY_KEY),
            api.get(UNIT_KEY)
        ]);
        allData = { payments, leases, tenants, properties, units };

        currentPayment = allData.payments.find(p => p.id === paymentId);

        if (!currentPayment) {
            rentalUtils.showNotification('Payment not found.', 'error');
            window.location.href = 'payments.html';
            return;
        }

        renderPaymentDetails();
        setupEventListeners();
    };

    const renderPaymentDetails = () => {
        const lease = allData.leases.find(l => l.id === currentPayment.leaseId);
        const tenant = lease ? allData.tenants.find(t => t.id === lease.tenantId) : null;
        const property = lease ? allData.properties.find(p => p.id === lease.propertyId) : null;
        const unit = lease ? allData.units.find(u => u.id === lease.unitId) : null;

        // Header
        paymentTitle.textContent = `Payment from ${tenant?.name || 'N/A'}`;
        paymentSubtitle.textContent = `Amount: ${rentalUtils.formatCurrency(currentPayment.amount)} on ${rentalUtils.formatDate(currentPayment.date)}`;

        // Details
        detailTenant.textContent = tenant?.name || 'N/A';
        detailProperty.textContent = `${property?.name || 'N/A'} ${unit ? `(Unit ${unit.unitNumber})` : ''}`;
        detailAmount.textContent = rentalUtils.formatCurrency(currentPayment.amount);
        detailPaymentDate.textContent = rentalUtils.formatDate(currentPayment.date);
        detailMethod.textContent = currentPayment.method;
        detailType.textContent = currentPayment.type;
        detailReceiptNumber.textContent = currentPayment.receiptNumber || 'N/A';

        // Receipt Image
        if (currentPayment.receiptUrl) {
            receiptImageWrapper.innerHTML = `<a href="${currentPayment.receiptUrl}" target="_blank" class="detail-image-preview">
                                                 <img src="${currentPayment.receiptUrl}" alt="Receipt image">
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
            window.location.href = 'payments.html';
        });

        editBtn.addEventListener('click', () => {
            window.location.href = `payments.html?editId=${currentPayment.id}`;
        });

        deleteBtn.addEventListener('click', async () => {
            if (rentalUtils.confirm(`Are you sure you want to delete this payment?`)) {
                try {
                    await api.delete(PAYMENT_KEY, currentPayment.id);
                    rentalUtils.showNotification('Payment deleted successfully!', 'error');
                    window.location.href = 'payments.html';
                } catch (error) {
                    rentalUtils.showNotification('Failed to delete payment.', 'error');
                    console.error('Delete payment error:', error);
                }
            }
        });

        printBtn.addEventListener('click', () => {
            window.print();
        });
    };

    initialize();
});