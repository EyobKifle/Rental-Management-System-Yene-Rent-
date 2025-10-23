// dashboard.js - Page-specific JavaScript for dashboard.html (Dashboard)

document.addEventListener('DOMContentLoaded', () => {
    const initialize = async () => {
        await window.rentalUtils.headerPromise;

        const [properties, tenants, payments, leases] = await Promise.all([
            api.get('properties'),
            api.get('tenants'),
            api.get('payments'),
            api.get('leases')
        ]);

        loadDashboardStats(properties, tenants, payments);
        loadRecentActivity(tenants);
        loadLeaseExpirations(leases, tenants, properties);
    };

    const loadDashboardStats = (properties, tenants, payments) => {
        const totalProperties = properties.length;
        const totalTenants = tenants.length;
        const monthlyRevenue = properties.reduce((sum, prop) => sum + (prop.rent || 0), 0);
        const outstandingBalance = payments.reduce((sum, payment) => {
            return sum + (payment.status === 'Unpaid' ? payment.amount : 0);
        }, 0);

        const statCards = document.querySelectorAll('#dashboard-view .data-card h2');
        if (statCards.length >= 4) {
            statCards[0].textContent = totalProperties;
            statCards[1].textContent = totalTenants;
            statCards[2].textContent = rentalUtils.formatCurrency(monthlyRevenue);
            statCards[3].textContent = rentalUtils.formatCurrency(outstandingBalance);
        }
    };

    const loadRecentActivity = (tenants) => {
        const activityTableBody = document.getElementById('recent-activity-body');
        if (!activityTableBody) return;

        const recentTenants = tenants.sort((a, b) => new Date(b.moveInDate) - new Date(a.moveInDate)).slice(0, 3);

        if (recentTenants.length > 0) {
            activityTableBody.innerHTML = recentTenants.map(tenant => {
                return `
                    <tr>
                        <td>New Tenant Added</td>
                        <td>${tenant.name}</td>
                        <td>${rentalUtils.formatDate(tenant.moveInDate)}</td>
                    </tr>
                `;
            }).join('');
        } else {
            const colSpan = activityTableBody.previousElementSibling.firstElementChild.children.length;
            activityTableBody.innerHTML = `<tr><td colspan="${colSpan}" class="text-center p-4">No recent activity.</td></tr>`;
        }
    };

    const loadLeaseExpirations = (leases, tenants, properties) => {
        const widgetContainer = document.getElementById('lease-expirations-widget');
        if (!widgetContainer) return;

        const today = new Date();
        const sixtyDaysFromNow = new Date();
        sixtyDaysFromNow.setDate(today.getDate() + 60);

        const expiringLeases = leases.filter(lease => {
            const endDate = new Date(lease.endDate);
            return endDate >= today && endDate <= sixtyDaysFromNow;
        }).sort((a, b) => new Date(a.endDate) - new Date(b.endDate));

        let content = '<h3>Upcoming Lease Expirations</h3>';
        if (expiringLeases.length > 0) {
            content += expiringLeases.map(lease => {
                const tenant = tenants.find(t => t.id === lease.tenantId);
                const property = properties.find(p => p.id === lease.propertyId);
                return `<div class="lease-expiration-item"><div><p>${tenant?.name || 'N/A'}</p><p>${property?.name || 'N/A'}</p></div><span>${rentalUtils.formatDate(lease.endDate)}</span></div>`;
            }).join('');
        } else {
            content += '<p>No leases are expiring in the next 60 days.</p>';
        }
        widgetContainer.innerHTML = content;
    };

    initialize();
});