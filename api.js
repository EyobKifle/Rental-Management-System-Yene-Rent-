// api.js - Placeholder API for Supabase interaction

const api = {
    async get(table) {
        console.log(`API: Fetching all from ${table}`);
        await new Promise(res => setTimeout(res, 200)); // Simulate network delay
        // In a real app, this would be a Supabase call. For now, we fall back to localStorage.
        const data = localStorage.getItem(table);
        return data ? JSON.parse(data) : [];
    },

    async create(table, data) {
        console.log(`API: Creating in ${table}`, data);
        await new Promise(res => setTimeout(res, 200));
        // Real app: supabase.from(table).insert(data)
        const currentData = await this.get(table);
        const newData = [...currentData, data];
        localStorage.setItem(table, JSON.stringify(newData));
        return data;
    },

    async update(table, id, data) {
        console.log(`API: Updating ${id} in ${table}`, data);
        await new Promise(res => setTimeout(res, 200));
        // Real app: supabase.from(table).update(data).eq('id', id)
        let currentData = await this.get(table);
        currentData = currentData.map(item => (item.id === id ? { ...item, ...data } : item));
        localStorage.setItem(table, JSON.stringify(currentData));
        return data;
    },

    async delete(table, id) {
        console.log(`API: Deleting ${id} from ${table}`);
        await new Promise(res => setTimeout(res, 200));
        // Real app: supabase.from(table).delete().eq('id', id)
        let currentData = await this.get(table);
        currentData = currentData.filter(item => item.id !== id);
        localStorage.setItem(table, JSON.stringify(currentData));
        return { id };
    }
};