// Page-specific JavaScript for index.html (Dashboard)
// This file handles dashboard-specific functionality

document.addEventListener('DOMContentLoaded', function() {
    // Dashboard-specific initialization
    initializeDashboard();

    // Use shared utilities for common functionality
    if (window.rentalUtils) {
        // Navigation is handled by shared.js
        // Modal handling is handled by shared.js
    }
});

function initializeDashboard() {
    // Load dashboard data
    loadDashboardStats();
    loadRecentActivity();
}

function loadDashboardStats() {
    // In a real app, this would fetch data from an API
    // For now, using mock data
    const stats = {
        properties: 12,
        tenants: 8,
        revenue: 450000,
        outstanding: 45000
    };

    // Update stats cards
    document.querySelectorAll('.data-card h2').forEach((el, index) => {
        const values = [stats.properties, stats.tenants, `ETB ${stats.revenue.toLocaleString()}`, `ETB ${stats.outstanding.toLocaleString()}`];
        if (values[index]) {
            el.textContent = values[index];
        }
    });
}

function loadRecentActivity() {
    // Mock recent activity data
    const activities = [
        { type: 'payment', message: 'Payment received from John Doe - ETB 25,000', time: '2 hours ago', color: 'green' },
        { type: 'lease', message: 'New lease signed for Apartment 101', time: '1 day ago', color: 'blue' },
        { type: 'maintenance', message: 'Maintenance request for Villa 5', time: '2 days ago', color: 'yellow' }
    ];

    const activityContainer = document.querySelector('.space-y-4');
    if (activityContainer) {
        activityContainer.innerHTML = activities.map(activity => `
            <div class="flex items-center space-x-3">
                <div class="w-2 h-2 bg-${activity.color}-500 rounded-full"></div>
                <p class="text-sm text-gray-600">${activity.message}</p>
                <span class="text-xs text-gray-400 ml-auto">${activity.time}</span>
            </div>
        `).join('');
    }
}
