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

            // Generate a payment
            payments.push({
                id: `payment-${lease.id}-${i}`,
                leaseId: lease.id,
                amount: lease.rentAmount,
                date: date.toISOString().split('T')[0],
                method: ['Bank Transfer', 'Cash', 'CBE Birr'][Math.floor(Math.random() * 3)],
                receiptUrl: null,
                receiptName: null,
            });
        }
    });

    const expenseCategories = ['Maintenance', 'Utilities', 'Salaries', 'Supplies', 'Marketing'];
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 3; j++) { // 3 expenses per month
            const date = new Date(today.getFullYear(), today.getMonth() - i, Math.floor(Math.random() * 28) + 1);
            const category = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
            const property = MOCK_DATA.properties[Math.floor(Math.random() * MOCK_DATA.properties.length)];
            expenses.push({
                id: `expense-${i}-${j}`,
                propertyId: property.id,
                date: date.toISOString().split('T')[0],
                amount: Math.floor(Math.random() * (category === 'Salaries' ? 15000 : 5000)) + 500,
                category: category,
                description: `Monthly ${category.toLowerCase()} for ${property.name}`,
            });
        }
    }

    MOCK_DATA.payments = payments;
    MOCK_DATA.expenses = expenses;
}

/**
 * Seeds the localStorage with mock data if it's not already present.
 * This function should be called once when the application starts.
 */
function seedMockData() {
    // Check if data already exists to avoid overwriting user changes
    const hasData = localStorage.getItem('properties');
    if (hasData && JSON.parse(hasData).length > 0) {
        console.log('Mock data already exists. Seeding skipped.');
        return;
    }

    console.log('Seeding mock data into localStorage...');

    // Generate dynamic payments and expenses before seeding
    generateDynamicData();

    Object.keys(MOCK_DATA).forEach(key => {
        try {
            localStorage.setItem(key, JSON.stringify(MOCK_DATA[key]));
            console.log(`- Seeded ${MOCK_DATA[key].length} items into '${key}'`);
        } catch (error) {
            console.error(`Error seeding mock data for key "${key}":`, error);
        }
    });

    console.log('Mock data seeding complete.');
}

// Expose the seeder function to be called from other scripts
window.seedMockData = seedMockData;