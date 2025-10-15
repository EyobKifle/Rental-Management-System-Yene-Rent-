// dashboard.js - Page-specific JavaScript for index.html (Dashboard)

document.addEventListener('DOMContentLoaded', () => {
    const sidebarContainer = document.getElementById('sidebar-container');

    const loadSidebar = async () => {
        const response = await fetch('sidebar.html');
        sidebarContainer.innerHTML = await response.text();
        rentalUtils.setupNavigation();
        rentalUtils.setupLucideIcons();
    };

    const loadDashboardStats = () => {
        const properties = rentalUtils.loadData('properties') || [];
        const tenants = rentalUtils.loadData('tenants') || [];
        const payments = rentalUtils.loadData('payments') || []; // Assuming payments will be stored

        const totalProperties = properties.length;
        const totalTenants = tenants.length;
        
        // Calculate monthly revenue from properties
        const monthlyRevenue = properties.reduce((sum, prop) => sum + (prop.rent || 0), 0);

        // Placeholder for outstanding balance logic
        const outstandingBalance = 0; 

        const statCards = document.querySelectorAll('#dashboard-view .data-card h2');
        if (statCards.length >= 4) {
            statCards[0].textContent = totalProperties;
            statCards[1].textContent = totalTenants;
            statCards[2].textContent = rentalUtils.formatCurrency(monthlyRevenue);
            statCards[3].textContent = rentalUtils.formatCurrency(outstandingBalance);
        }
    };

    const loadRecentActivity = () => {
        // This can be expanded to show recent property/tenant additions
        const activityContainer = document.querySelector('#dashboard-view .space-y-4');
        const tenants = rentalUtils.loadData('tenants') || [];
        
        if (tenants.length > 0) {
            activityContainer.innerHTML = tenants.slice(-3).reverse().map(tenant => {
                return `<div class="flex items-center space-x-3 text-sm"><p class="text-gray-600">New tenant added: <strong>${tenant.name}</strong></p><span class="text-xs text-gray-400 ml-auto whitespace-nowrap">${rentalUtils.formatDate(tenant.moveInDate)}</span></div>`;
            }).join('');
        } else {
            activityContainer.innerHTML = '<p class="text-sm text-gray-500">No recent activity.</p>';
        }
    };

    loadSidebar().then(loadDashboardStats).then(loadRecentActivity);
});