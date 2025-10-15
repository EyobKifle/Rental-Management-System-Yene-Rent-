document.addEventListener('DOMContentLoaded', () => {
    const sidebarContainer = document.getElementById('sidebar-container');

    // Chart instances
    let profitLossChartInstance, incomeOverviewChartInstance, expenseBreakdownChartInstance;

    const initialize = async () => {
        await loadSidebar();
        const payments = await api.get('payments');
        // Mock expenses data until the feature is built
        const expenses = [
            { category: 'Maintenance', amount: 4200, date: '2024-04-15' },
            { category: 'Utilities', amount: 1500, date: '2024-04-20' },
            { category: 'Maintenance', amount: 2800, date: '2024-05-10' },
            { category: 'Taxes', amount: 12000, date: '2024-05-25' },
        ];

        updateStatCards(payments, expenses);
        renderProfitLossChart(payments, expenses);
        renderIncomeOverviewChart(payments);
        renderExpenseBreakdownChart(expenses);
        updateFinancialSummary(payments, expenses);
    };

    const loadSidebar = async () => {
        const response = await fetch('sidebar.html');
        sidebarContainer.innerHTML = await response.text();
        rentalUtils.setupNavigation();
        rentalUtils.setupLucideIcons();
    };

    const updateStatCards = (payments, expenses) => {
        const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const netProfit = totalRevenue - totalExpenses;

        document.getElementById('stat-total-revenue').textContent = rentalUtils.formatCurrency(totalRevenue);
        document.getElementById('stat-total-expenses').textContent = rentalUtils.formatCurrency(totalExpenses);
        document.getElementById('stat-net-profit').textContent = rentalUtils.formatCurrency(netProfit);
    };

    const renderProfitLossChart = (payments, expenses) => {
        const ctx = document.getElementById('profitLossChart').getContext('2d');
        if (profitLossChartInstance) profitLossChartInstance.destroy();

        // Simple monthly data for the last 6 months (in a real app, this would be more robust)
        const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const incomeData = [15000, 18000, 22000, 25000, 24000, 28000];
        const expenseData = [8000, 9000, 8500, 10000, 11000, 9500];
        const profitData = incomeData.map((income, i) => income - expenseData[i]);

        profitLossChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    { label: 'Income', data: incomeData, borderColor: '#10b981', tension: 0.1, fill: false },
                    { label: 'Expenses', data: expenseData, borderColor: '#ef4444', tension: 0.1, fill: false },
                    { label: 'Profit', data: profitData, borderColor: '#3b82f6', tension: 0.1, fill: false, borderDash: [5, 5] }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    };

    const renderIncomeOverviewChart = (payments) => {
        const ctx = document.getElementById('incomeOverviewChart').getContext('2d');
        if (incomeOverviewChartInstance) incomeOverviewChartInstance.destroy();

        const incomeByMethod = payments.reduce((acc, p) => {
            acc[p.method] = (acc[p.method] || 0) + p.amount;
            return acc;
        }, {});

        incomeOverviewChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(incomeByMethod),
                datasets: [{
                    data: Object.values(incomeByMethod),
                    backgroundColor: ['#1d4ed8', '#16a34a', '#f97316'],
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    };

    const renderExpenseBreakdownChart = (expenses) => {
        const ctx = document.getElementById('expenseBreakdownChart').getContext('2d');
        if (expenseBreakdownChartInstance) expenseBreakdownChartInstance.destroy();

        const expenseByCategory = expenses.reduce((acc, e) => {
            acc[e.category] = (acc[e.category] || 0) + e.amount;
            return acc;
        }, {});

        expenseBreakdownChartInstance = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(expenseByCategory),
                datasets: [{
                    data: Object.values(expenseByCategory),
                    backgroundColor: ['#ef4444', '#f59e0b', '#8b5cf6', '#3b82f6'],
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    };

    const updateFinancialSummary = (payments, expenses) => {
        const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const netProfit = totalRevenue - totalExpenses;

        const incomeSourcesContainer = document.getElementById('summary-income-sources');
        const expenseCategoriesContainer = document.getElementById('summary-expense-categories');

        const incomeByMethod = payments.reduce((acc, p) => {
            acc[p.method] = (acc[p.method] || 0) + p.amount;
            return acc;
        }, {});

        const expenseByCategory = expenses.reduce((acc, e) => {
            acc[e.category] = (acc[e.category] || 0) + e.amount;
            return acc;
        }, {});

        incomeSourcesContainer.innerHTML = Object.entries(incomeByMethod).map(([method, amount]) => 
            `<div class="flex justify-between text-sm py-1"><span class="text-gray-600">${method}</span><span class="font-medium">${rentalUtils.formatCurrency(amount)}</span></div>`
        ).join('');

        expenseCategoriesContainer.innerHTML = Object.entries(expenseByCategory).map(([category, amount]) => 
            `<div class="flex justify-between text-sm py-1"><span class="text-gray-600">${category}</span><span class="font-medium">${rentalUtils.formatCurrency(amount)}</span></div>`
        ).join('');

        document.getElementById('summary-total-income').textContent = rentalUtils.formatCurrency(totalRevenue);
        document.getElementById('summary-total-expenses').textContent = rentalUtils.formatCurrency(totalExpenses);
        document.getElementById('summary-net-profit').textContent = rentalUtils.formatCurrency(netProfit);
    };

    initialize();
});