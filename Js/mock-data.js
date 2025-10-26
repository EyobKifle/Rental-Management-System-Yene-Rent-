// mock-data.js

const MOCK_DATA = {
    properties: [
        { id: 'prop-1', name: 'Bole Apartments', address: 'Bole, Addis Ababa', type: 'Apartment', taxType: 'all-taxes', rent: 25000, units: 2, image: null },
        { id: 'prop-2', name: 'CMC Heights', address: 'CMC, Addis Ababa', type: 'Villa', taxType: 'withholding-annual', rent: 45000, units: 1, image: null },
        { id: 'prop-3', name: 'Kazanchis Business Center', address: 'Kazanchis, Addis Ababa', type: 'Office', taxType: 'withholding-property', rent: 60000, units: 1, image: null },
    ],
    units: [
        { id: 'unit-1', propertyId: 'prop-1', unitNumber: 'A101', rent: 25000, tenantId: 'tenant-1' },
        { id: 'unit-2', propertyId: 'prop-1', unitNumber: 'A102', rent: 26000, tenantId: 'tenant-2' },
        { id: 'unit-3', propertyId: 'prop-2', unitNumber: 'V1', rent: 45000, tenantId: 'tenant-3' },
        { id: 'unit-4', propertyId: 'prop-3', unitNumber: 'Floor 5', rent: 60000, tenantId: null }, // Vacant
    ],
    tenants: [
        { id: 'tenant-1', name: 'Abebe Kebede', email: 'abebe@example.com', phone: '0911123456', unitId: 'unit-1', moveInDate: '2023-01-15' },
        { id: 'tenant-2', name: 'Hana Girma', email: 'hana@example.com', phone: '0912987654', unitId: 'unit-2', moveInDate: '2023-03-01' },
        { id: 'tenant-3', name: 'Solomon Tadesse', email: 'solomon@example.com', phone: '0921456789', unitId: 'unit-3', moveInDate: '2022-11-20' },
    ],
    leases: [
        { id: 'lease-1', tenantId: 'tenant-1', unitId: 'unit-1', propertyId: 'prop-1', startDate: '2024-01-15', endDate: '2025-01-14', rentAmount: 25000, leaseDocumentUrl: null, leaseDocumentName: null },
        { id: 'lease-2', tenantId: 'tenant-2', unitId: 'unit-2', propertyId: 'prop-1', startDate: '2024-03-01', endDate: '2025-02-28', rentAmount: 26000, leaseDocumentUrl: null, leaseDocumentName: null },
        { id: 'lease-3', tenantId: 'tenant-3', unitId: 'unit-3', propertyId: 'prop-2', startDate: '2023-11-20', endDate: '2024-11-19', rentAmount: 45000, leaseDocumentUrl: null, leaseDocumentName: null },
    ],
    payments: [], // Payments will be generated dynamically
    expenses: [], // Expenses will be generated dynamically
    documents: [
        { id: 'doc-1', name: 'Abebe Lease Agreement.pdf', type: 'application/pdf', category: 'Lease Agreement', size: 123456, uploadDate: '2024-01-15T10:00:00Z', propertyId: 'prop-1', tenantId: 'tenant-1', url: '#' },
        { id: 'doc-2', name: 'Hana ID Card.jpg', type: 'image/jpeg', category: 'Tenant ID', size: 78910, uploadDate: '2024-03-01T11:00:00Z', propertyId: 'prop-1', tenantId: 'tenant-2', url: '#' },
    ],
    maintenance: [
        { id: 'maint-1', title: 'Leaky Faucet in A101', propertyId: 'prop-1', unitId: 'unit-1', category: 'Plumbing', status: 'Completed', reportedDate: '2024-05-10', cost: 500, beforeImageUrl: null, afterImageUrl: null },
        { id: 'maint-2', title: 'Power outage in common area', propertyId: 'prop-2', unitId: null, category: 'Electrical', status: 'In Progress', reportedDate: '2024-06-20', cost: null, beforeImageUrl: null, afterImageUrl: null },
    ],
    utilities: [
        { id: 'util-1', type: 'Water', propertyId: 'prop-1', amount: 1200, dueDate: '2024-07-15', status: 'Unpaid' },
        { id: 'util-2', type: 'Electricity', propertyId: 'prop-2', amount: 3500, dueDate: '2024-06-25', status: 'Paid' },
    ]
};

/**
 * Generates mock payments and expenses for the last 6 months.
 */
function generateDynamicData() {
    const payments = [];
    const expenses = [];
    const today = new Date();

    MOCK_DATA.leases.forEach(lease => {
        for (let i = 0; i < 6; i++) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 15);
            const leaseStartDate = new Date(lease.startDate);
            if (date < leaseStartDate) continue;

            // Generate a payment - mark all as Paid for analytics
            payments.push({
                id: `payment-${lease.id}-${i}`,
                leaseId: lease.id,
                amount: lease.rentAmount,
                date: date.toISOString().split('T')[0],
                dueDate: date.toISOString().split('T')[0],
                method: ['Bank Transfer', 'Cash', 'CBE Birr'][Math.floor(Math.random() * 3)],
                status: 'Paid', // All payments are Paid
                receiptUrl: null,
                receiptName: null,
            });
        }
    });

    const commonExpenseCategories = ['Utilities', 'Salaries', 'Supplies', 'Marketing', 'Insurance', 'Property Tax'];
    for (let i = 0; i < 6; i++) {
        const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);

        // Generate common expenses for each property
        MOCK_DATA.properties.forEach(property => {
            commonExpenseCategories.forEach(category => {
                const randomDay = Math.floor(Math.random() * 28) + 1;
                const expenseDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), randomDay);
                let amount = 0;
                if (category === 'Utilities') amount = Math.floor(Math.random() * 2000) + 1000;
                else if (category === 'Salaries') amount = Math.floor(Math.random() * 5000) + 8000; // e.g., for guards, cleaners
                else if (category === 'Insurance') amount = 4500; // Fixed monthly premium
                else if (category === 'Property Tax') amount = (property.rent * 12 * 0.02) / 12; // Estimated annual tax divided by 12
                else amount = Math.floor(Math.random() * 1500) + 200;

                expenses.push({
                    id: `expense-${property.id}-${category}-${i}`,
                    propertyId: property.id,
                    date: expenseDate.toISOString().split('T')[0],
                    amount: parseFloat(amount.toFixed(2)),
                    category: category,
                    description: `Monthly ${category} for ${property.name}`,
                });
            });
        });

        // Generate some random, one-off maintenance expenses
        for (let j = 0; j < 2; j++) { // 2 random maintenance jobs per month
            const randomDay = Math.floor(Math.random() * 28) + 1;
            const expenseDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), randomDay);
            const property = MOCK_DATA.properties[Math.floor(Math.random() * MOCK_DATA.properties.length)];
            expenses.push({
                id: `expense-maint-${i}-${j}`,
                propertyId: property.id,
                date: expenseDate.toISOString().split('T')[0],
                amount: Math.floor(Math.random() * 4000) + 500,
                category: 'Maintenance',
                description: `Repair work at ${property.name}`,
            });
        }
    }

    MOCK_DATA.payments = payments;
    MOCK_DATA.expenses = expenses;
}
window.seedMockData = seedMockData;
