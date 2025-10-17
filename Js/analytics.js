document.addEventListener('DOMContentLoaded', () => {
    let allData = {};
    let charts = {};
    let taxCalculator;

    const initialize = async () => {
        await window.rentalUtils.headerPromise;

        // TODO: In a real app, tax settings would be fetched from a user profile/settings API.
        // For now, we'll use defaults which can be configured in settings.html.
        const taxSettings = { /* Fetch from localStorage or use defaults */ };
        taxCalculator = new TaxCalculator(taxSettings);

        const [payments, expenses, properties, leases, units] = await Promise.all([
            api.get('payments'),
            api.get('expenses'),
            api.get('properties'),
            api.get('leases'),
            api.get('units') // Needed to link payments to properties
        ]);

        allData = { payments, expenses, properties, leases };

        processAndRenderAnalytics();
    };

    const processAndRenderAnalytics = () => {
        // Calculate stats
        const totalRevenue = allData.payments.reduce((sum, p) => sum + p.amount, 0);
        const totalExpenses = allData.expenses.reduce((sum, e) => sum + e.amount, 0);
        const netProfit = totalRevenue - totalExpenses;

        // Calculate taxes
        const incomeByProperty = getIncomeByProperty();
        const taxData = taxCalculator.calculateAllTaxes({
            totalRevenue,
            totalExpenses,
            paymentsByProperty: incomeByProperty,
            expenses: allData.expenses
        });

        // Render top stats
        document.getElementById('stat-total-revenue').textContent = rentalUtils.formatCurrency(totalRevenue);
        document.getElementById('stat-total-expenses').textContent = rentalUtils.formatCurrency(totalExpenses);
        document.getElementById('stat-net-profit').textContent = rentalUtils.formatCurrency(netProfit);
        document.getElementById('stat-estimated-tax').textContent = rentalUtils.formatCurrency(taxData.totalTaxLiability);

        // Color-code the net profit
        const netProfitEl = document.getElementById('stat-net-profit');
        netProfitEl.classList.remove('text-green', 'text-red');
        netProfitEl.classList.add(netProfit >= 0 ? 'text-green' : 'text-red');


        // Prepare chart data
        const monthlyData = getMonthlyProfitLoss();
        const expenseByCategory = getExpenseByCategory();

        // Render charts
        renderProfitLossChart(monthlyData);
        renderIncomeOverviewChart(incomeByProperty);
        renderExpenseBreakdownChart(expenseByCategory);

        // Render financial summary
        renderFinancialSummary(incomeByProperty, expenseByCategory, totalRevenue, totalExpenses, netProfit, taxData);
    };

    const getMonthlyProfitLoss = () => {
        const data = {};
        const monthLabels = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const label = d.toLocaleString('default', { month: 'short' });
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            data[key] = { revenue: 0, expenses: 0 };
            monthLabels.push(label);
        }

        allData.payments.forEach(p => {
            const d = new Date(p.date);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            if (data[key]) data[key].revenue += p.amount;
        });

        allData.expenses.forEach(e => {
            const d = new Date(e.date);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            if (data[key]) data[key].expenses += e.amount;
        });

        return {
            labels: monthLabels,
            revenues: Object.values(data).map(d => d.revenue),
            expenses: Object.values(data).map(d => d.expenses),
        };
    };

    const getIncomeByProperty = () => {
        const data = {};
        allData.payments.forEach(p => {
            const lease = allData.leases.find(l => l.id === p.leaseId);
            if (!lease) return;
            const property = allData.properties.find(prop => prop.id === lease.propertyId);
            if (!property) return;
            
            if (!data[property.id]) {
                data[property.id] = { name: property.name, totalIncome: 0, taxType: property.taxType };
            }
            data[property.id].totalIncome += p.amount;
        });
        return data;
    };

    const getExpenseByCategory = () => {
        const data = {};
        allData.expenses.forEach(e => {
            data[e.category] = (data[e.category] || 0) + e.amount;
        });
        return data;
    };

    const renderChart = (ctx, type, data, options) => {
        const chartId = ctx.canvas.id;
        if (charts[chartId]) {
            charts[chartId].destroy();
        }
        charts[chartId] = new Chart(ctx, { type, data, options });
    };

    const renderProfitLossChart = (data) => {
        const ctx = document.getElementById('profitLossChart').getContext('2d');
        renderChart(ctx, 'line', {
            labels: data.labels,
            datasets: [
                { label: 'Revenue', data: data.revenues, borderColor: 'rgba(75, 192, 192, 1)', backgroundColor: 'rgba(75, 192, 192, 0.2)', fill: true, tension: 0.1 },
                { label: 'Expenses', data: data.expenses, borderColor: 'rgba(255, 99, 132, 1)', backgroundColor: 'rgba(255, 99, 132, 0.2)', fill: true, tension: 0.1 }
            ]
        });
    };

    const renderIncomeOverviewChart = (data) => {
        const ctx = document.getElementById('incomeOverviewChart').getContext('2d');
        renderChart(ctx, 'doughnut', {
            labels: Object.keys(data),
            datasets: [{
                label: 'Income by Property',
                data: Object.values(data),
                backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF'],
            }]
        });
    };

    const renderExpenseBreakdownChart = (data) => {
        const ctx = document.getElementById('expenseBreakdownChart').getContext('2d');
        renderChart(ctx, 'pie', {
            labels: Object.keys(data),
            datasets: [{
                label: 'Expenses by Category',
                data: Object.values(data),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
            }]
        });
    };

    const renderFinancialSummary = (incomeData, expenseData, totalIncome, totalExpenses, netProfit, taxData) => {
        const incomeContainer = document.getElementById('summary-income-sources');
        const expenseContainer = document.getElementById('summary-expense-categories');
        const taxContainer = document.getElementById('summary-tax-breakdown');
        incomeContainer.innerHTML = Object.values(incomeData).map(prop => `
            <div class="summary-item"><span>${prop.name}</span><span>${rentalUtils.formatCurrency(prop.totalIncome)}</span></div>
        `).join('');

        expenseContainer.innerHTML = Object.entries(expenseData).map(([key, value]) => `
            <div class="summary-item"><span>${key}</span><span>${rentalUtils.formatCurrency(value)}</span></div>
        `).join('');

        document.getElementById('summary-total-income').textContent = rentalUtils.formatCurrency(totalIncome);
        document.getElementById('summary-total-expenses').textContent = rentalUtils.formatCurrency(totalExpenses);
        document.getElementById('summary-net-profit').textContent = rentalUtils.formatCurrency(netProfit);

        // Render Tax Summary
        taxContainer.innerHTML = `
            <div class="summary-item"><span>VAT Payable</span><span>${rentalUtils.formatCurrency(taxData.vat.payable)}</span></div>
            <div class="summary-item"><span>Business Income Tax</span><span>${rentalUtils.formatCurrency(taxData.businessIncomeTax.payable)}</span></div>
            <div class="summary-item"><span>Withholding Tax (Tracked)</span><span>${rentalUtils.formatCurrency(taxData.withholdingTax.total)}</span></div>
        `;
        document.getElementById('summary-total-tax').textContent = rentalUtils.formatCurrency(taxData.totalTaxLiability);
    };

    // Make sure to include the new script in analytics.html
    const script = document.createElement('script');
    script.src = '../Js/taxCalculator.js';
    document.body.appendChild(script);

    initialize();
});