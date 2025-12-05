// YeneRent/src/utils/api.js
import { MOCK_DATA, generateDynamicData } from './mockData';

const api = {
    /**
     * Seeds localStorage with rich mock data if it's empty.
     * This function relies on MOCK_DATA and generateDynamicData from mock-data.js
     */
    seedData() {
        // generateDynamicData populates MOCK_DATA.payments and MOCK_DATA.expenses
        generateDynamicData();

        // Save to localStorage so it persists for the session
        for (const table in MOCK_DATA) {
            if (localStorage.getItem(table) === null) {
                localStorage.setItem(table, JSON.stringify(MOCK_DATA[table]));
            }
        }
    },

    async get(table) {
        console.log(`API: Fetching all from ${table}`);
        await new Promise(res => setTimeout(res, 200)); // Simulate network delay
        // In a real app, this would be a Supabase call. For now, we fall back to localStorage.
        try {
            const data = localStorage.getItem(table);
            // If data is null or an empty array string, return and set demo data.
            if (!data || JSON.parse(data).length === 0) {
                console.log(`API: No data for ${table} in localStorage. Seeding all mock data.`);
                this.seedData();
                return JSON.parse(localStorage.getItem(table) || '[]');
            }
            return JSON.parse(data);
        } catch (error) {
            console.error(`Error retrieving ${table} from localStorage:`, error);
            throw new Error(`Failed to retrieve data for ${table}: ${error.message}`); // Re-throw for component handling
        }
    },

    async create(table, data) {
        console.log(`API: Creating in ${table}`, data);
        await new Promise(res => setTimeout(res, 200));
        // Real app: supabase.from(table).insert(data)
        try {
            const currentData = await this.get(table);
            const newData = [...currentData, { ...data, id: data.id || `mock-${Date.now()}` }]; // Ensure ID for new items
            localStorage.setItem(table, JSON.stringify(newData));
            return data;
        } catch (error) {
            console.error(`Error creating item in ${table}:`, error);
            throw new Error(`Failed to create item in ${table}: ${error.message}`); // Re-throw for component handling
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
            throw new Error(`Failed to update item ${id} in ${table}: ${error.message}`); // Re-throw for component handling
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
            throw new Error(`Failed to delete item ${id} from ${table}: ${error.message}`); // Re-throw for component handling
        }
    }
};

export default api;
