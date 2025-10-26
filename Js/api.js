// api.js - Placeholder API for Supabase interaction

const api = {
    getDemoData(table) {
        const today = new Date();
        const properties = [
            { id: 'prop-1', name: 'Bole Apartment Complex', address: 'Bole, Addis Ababa', taxType: 'all-taxes' },
            { id: 'prop-2', name: 'CMC Residential', address: 'CMC, Addis Ababa', taxType: 'withholding-only' },
        ];
        const units = [
            { id: 'unit-1a', propertyId: 'prop-1', unitNumber: '1A', rent: 25000, bedrooms: 2, bathrooms: 1, tenantId: 'tenant-1' },
            { id: 'unit-1b', propertyId: 'prop-1', unitNumber: '1B', rent: 22000, bedrooms: 1, bathrooms: 1, tenantId: 'tenant-2' },
            { id: 'unit-2a', propertyId: 'prop-2', unitNumber: '2A', rent: 18000, bedrooms: 3, bathrooms: 2, tenantId: 'tenant-3' },
        ];
        const tenants = [
            { id: 'tenant-1', name: 'Abebe Kebede', email: 'abebe@example.com', phone: '0911123456', unitId: 'unit-1a' },
            { id: 'tenant-2', name: 'Sofia Girma', email: 'sofia@example.com', phone: '0912987654', unitId: 'unit-1b' },
            { id: 'tenant-3', name: 'Yonas Berhanu', email: 'yonas@example.com', phone: '0921456789', unitId: 'unit-2a' },
        ];
        const leases = [
            { id: 'lease-1', tenantId: 'tenant-1', unitId: 'unit-1a', propertyId: 'prop-1', startDate: new Date(today.getFullYear(), today.getMonth() - 6, 1).toISOString().split('T')[0], endDate: new Date(today.getFullYear() + 1, 5, 30).toISOString().split('T')[0], rentAmount: 25000, withholdingAmount: 7500 },
            { id: 'lease-2', tenantId: 'tenant-2', unitId: 'unit-1b', propertyId: 'prop-1', startDate: new Date(today.getFullYear(), today.getMonth() - 4, 1).toISOString().split('T')[0], endDate: new Date(today.getFullYear() + 1, 3, 30).toISOString().split('T')[0], rentAmount: 22000, withholdingAmount: null },
            { id: 'lease-3', tenantId: 'tenant-3', unitId: 'unit-2a', propertyId: 'prop-2', startDate: new Date(today.getFullYear(), today.getMonth() - 5, 1).toISOString().split('T')[0], endDate: new Date(today.getFullYear() + 1, 4, 30).toISOString().split('T')[0], rentAmount: 18000, withholdingAmount: 5400 },
        ];

        const payments = [];
        leases.forEach(lease => {
            for (let i = 0; i < 6; i++) {
                const paymentDate = new Date(today.getFullYear(), today.getMonth() - i, 5);
                payments.push({
                    id: `payment-${lease.id}-${i}`,
                    leaseId: lease.id,
                    amount: lease.rentAmount,
                    date: paymentDate.toISOString().split('T')[0],
                    status: 'Paid',
                    method: 'Bank Transfer'
                });
            }
        });

        const expenses = [
            { id: 'exp-1', propertyId: 'prop-1', category: 'Maintenance', description: 'Plumbing repair for Unit 1A', amount: 1500, date: new Date(today.getFullYear(), today.getMonth() - 1, 10).toISOString().split('T')[0] },
            { id: 'exp-2', propertyId: 'prop-1', category: 'Utilities', description: 'Common area electricity bill', amount: 2500, date: new Date(today.getFullYear(), today.getMonth() - 1, 15).toISOString().split('T')[0] },
            { id: 'exp-3', propertyId: 'prop-2', category: 'Maintenance', description: 'Gate repair', amount: 3000, date: new Date(today.getFullYear(), today.getMonth() - 2, 20).toISOString().split('T')[0] },
            { id: 'exp-4', propertyId: 'prop-1', category: 'Management Fee', description: 'Monthly management fee', amount: 5000, date: new Date(today.getFullYear(), today.getMonth() - 3, 28).toISOString().split('T')[0] },
            { id: 'exp-5', propertyId: 'prop-2', category: 'Utilities', description: 'Water bill', amount: 1200, date: new Date(today.getFullYear(), today.getMonth() - 4, 5).toISOString().split('T')[0] },
        ];

        const documents = [
            { id: 'doc-1', name: 'Lease Agreement - A. Kebede.pdf', type: 'application/pdf', category: 'Lease Agreement', size: 120400, uploadDate: new Date(today.getFullYear(), today.getMonth() - 6, 1).toISOString(), propertyId: null, tenantId: 'tenant-1', url: '#' },
            { id: 'doc-2', name: 'Bole Complex Title Deed.pdf', type: 'application/pdf', category: 'Property Title', size: 540300, uploadDate: new Date(today.getFullYear() - 1, 0, 15).toISOString(), propertyId: 'prop-1', tenantId: null, url: '#' },
            { id: 'doc-3', name: 'Tenant ID - S. Girma.jpg', type: 'image/jpeg', category: 'Tenant ID', size: 85200, uploadDate: new Date(today.getFullYear(), today.getMonth() - 4, 1).toISOString(), propertyId: null, tenantId: 'tenant-2', url: '#' },
        ];

        const demoData = {
            properties,
            units,
            tenants,
            leases,
            payments,
            expenses,
            documents,
        };

        // Also save this demo data to localStorage so it persists for the session
        if (demoData[table]) {
            localStorage.setItem(table, JSON.stringify(demoData[table]));
        }

        return demoData[table] || [];
    },

    async get(table) {
        console.log(`API: Fetching all from ${table}`);
        await new Promise(res => setTimeout(res, 200)); // Simulate network delay
        // In a real app, this would be a Supabase call. For now, we fall back to localStorage.
        try {
            const data = localStorage.getItem(table);
            // If data is null or an empty array string, return and set demo data.
            if (!data || data === '[]') {
                console.log(`API: No data for ${table} in localStorage. Using demo data.`);
                return this.getDemoData(table);
            }
            return JSON.parse(data);
        } catch (error) {
            console.error(`Error retrieving ${table} from localStorage:`, error);
            return [];
        }
    },

    async create(table, data) {
        console.log(`API: Creating in ${table}`, data);
        await new Promise(res => setTimeout(res, 200));
        // Real app: supabase.from(table).insert(data)
        try {
            const currentData = await this.get(table);
            const newData = [...currentData, data];
            localStorage.setItem(table, JSON.stringify(newData));
            return data;
        } catch (error) {
            console.error(`Error creating item in ${table}:`, error);
            throw error;
        }
    },

    async update(table, id, data) {
        console.log(`API: Updating ${id} in ${table}`, data);
        await new Promise(res => setTimeout(res, 200));
        // Real app: supabase.from(table).update(data).eq('id', id)
        try {
            let currentData = await this.get(table);
            currentData = currentData.map(item => (item.id === id ? { ...item, ...data } : item));
            localStorage.setItem(table, JSON.stringify(currentData));
            return data;
        } catch (error) {
            console.error(`Error updating item ${id} in ${table}:`, error);
            throw error;
        }
    },

    async delete(table, id) {
        console.log(`API: Deleting ${id} from ${table}`);
        await new Promise(res => setTimeout(res, 200));
        // Real app: supabase.from(table).delete().eq('id', id)
        try {
            let currentData = await this.get(table);
            currentData = currentData.filter(item => item.id !== id);
            localStorage.setItem(table, JSON.stringify(currentData.length > 0 ? currentData : [])); // Ensure we don't save an empty array that looks like data
            return { id };
        } catch (error) {
            console.error(`Error deleting item ${id} from ${table}:`, error);
            throw error;
        }
    }
};
