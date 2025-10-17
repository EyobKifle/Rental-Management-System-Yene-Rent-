document.addEventListener('DOMContentLoaded', () => {
    // Chart instances
    let profitLossChartInstance, incomeOverviewChartInstance, expenseBreakdownChartInstance;

    const initialize = async () => {
        await window.rentalUtils.headerPromise; // Ensure header/sidebar are loaded
        const [payments, expenses] = await Promise.all([
            api.get('payments'),
            api.get('expenses')
        ]);

        const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const netProfit = totalRevenue - totalExpenses;

        const { incomeByMethod, expenseByCategory } = aggregateData(payments, expenses);

        updateStatCards(totalRevenue, totalExpenses, netProfit);
        renderProfitLossChart(payments, expenses);
        renderIncomeOverviewChart(incomeByMethod);
        renderExpenseBreakdownChart(expenseByCategory);
        updateFinancialSummary(incomeByMethod, expenseByCategory, totalRevenue, totalExpenses, netProfit);
    };

    /**
     * Updates the main statistic cards at the top of the page.
     * @param {number} totalRevenue 
     * @param {number} totalExpenses 
     * @param {number} netProfit 
     */
    const updateStatCards = (totalRevenue, totalExpenses, netProfit) => {
        document.getElementById('stat-total-revenue').textContent = rentalUtils.formatCurrency(totalRevenue);
        document.getElementById('stat-total-expenses').textContent = rentalUtils.formatCurrency(totalExpenses);
        document.getElementById('stat-net-profit').textContent = rentalUtils.formatCurrency(netProfit);
    };

    const renderProfitLossChart = (payments, expenses) => {
        const ctx = document.getElementById('profitLossChart').getContext('2d');
        if (profitLossChartInstance) profitLossChartInstance.destroy();

        const { labels, monthlyIncome } = getMonthlyData(payments);
        const { monthlyExpenses } = getMonthlyData(expenses);

        const incomeData = labels.map(label => monthlyIncome[label] || 0);
        const expenseData = labels.map(label => monthlyExpenses[label] || 0);
        const profitData = incomeData.map((income, i) => income - expenseData[i]);

        profitLossChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    { label: 'Income', data: incomeData, borderColor: 'var(--success-color)', tension: 0.1, fill: false },
                    { label: 'Expenses', data: expenseData, borderColor: 'var(--danger-color)', tension: 0.1, fill: false },
                    { label: 'Profit', data: profitData, borderColor: 'var(--primary-color)', tension: 0.1, fill: false, borderDash: [5, 5] }
                ]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                scales: {
                    y: {
                        ticks: {
                            callback: (value) => rentalUtils.formatCurrency(value, 'ETB', true)
                        }
                    }
                }
            }
        });
    };

    const renderIncomeOverviewChart = (incomeByMethod) => {
        const ctx = document.getElementById('incomeOverviewChart').getContext('2d');
        if (incomeOverviewChartInstance) incomeOverviewChartInstance.destroy();

        incomeOverviewChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(incomeByMethod),
                datasets: [{
                    data: Object.values(incomeByMethod),
                    backgroundColor: ['#1d4ed8', 'var(--success-color)', 'var(--warning-color)', '#8b5cf6'],
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.label}: ${rentalUtils.formatCurrency(context.raw)}`
                        }
                    }
                }
            }
        });
    };

    const renderExpenseBreakdownChart = (expenseByCategory) => {
        const ctx = document.getElementById('expenseBreakdownChart').getContext('2d');
        if (expenseBreakdownChartInstance) expenseBreakdownChartInstance.destroy();

        expenseBreakdownChartInstance = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(expenseByCategory),
                datasets: [{
                    data: Object.values(expenseByCategory),
                    backgroundColor: ['var(--danger-color)', 'var(--warning-color)', '#8b5cf6', '#3b82f6', 'var(--success-color)', 'var(--secondary-color)'],
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.label}: ${rentalUtils.formatCurrency(context.raw)}`
                        }
                    }
                }
            }
        });
    };

    const updateFinancialSummary = (incomeByMethod, expenseByCategory, totalRevenue, totalExpenses, netProfit) => {
        const incomeSourcesContainer = document.getElementById('summary-income-sources');
        const expenseCategoriesContainer = document.getElementById('summary-expense-categories');

        incomeSourcesContainer.innerHTML = Object.entries(incomeByMethod).map(([method, amount]) => 
            `<div><span>${method}</span><span>${rentalUtils.formatCurrency(amount)}</span></div>`
        ).join('');

        expenseCategoriesContainer.innerHTML = Object.entries(expenseByCategory).map(([category, amount]) => 
            `<div><span>${category}</span><span>${rentalUtils.formatCurrency(amount)}</span></div>`
        ).join('');

        document.getElementById('summary-total-income').textContent = rentalUtils.formatCurrency(totalRevenue);
        document.getElementById('summary-total-expenses').textContent = rentalUtils.formatCurrency(totalExpenses);
        document.getElementById('summary-net-profit').textContent = rentalUtils.formatCurrency(netProfit);
    };

    const aggregateData = (payments, expenses) => {
        const incomeByMethod = payments.reduce((acc, p) => {
            acc[p.method] = (acc[p.method] || 0) + p.amount;
            return acc;
        }, {});

        const expenseByCategory = expenses.reduce((acc, e) => {
            acc[e.category] = (acc[e.category] || 0) + e.amount;
            return acc;
        }, {});

        return { incomeByMethod, expenseByCategory };
    };

    const getLastSixMonths = () => {
        const months = [];
        const date = new Date();
        for (let i = 0; i < 6; i++) {
            months.push(new Date(date.getFullYear(), date.getMonth() - i, 1));
        }
        return months.reverse();
    };

    const getMonthlyData = (data, type = 'income') => {
        const sixMonths = getLastSixMonths();
        const labels = sixMonths.map(d => d.toLocaleString('default', { month: 'short' }));
        
        const monthlyTotals = data.reduce((acc, item) => {
            const itemDate = new Date(item.date);
            const monthYear = `${itemDate.getFullYear()}-${itemDate.getMonth()}`;
            acc[monthYear] = (acc[monthYear] || 0) + item.amount;
            return acc;
        }, {});

        const result = {};
        sixMonths.forEach(date => {
            const monthLabel = date.toLocaleString('default', { month: 'short' });
            const monthYearKey = `${date.getFullYear()}-${date.getMonth()}`;
            result[monthLabel] = monthlyTotals[monthYearKey] || 0;
        });

        const key = type === 'expense' ? 'monthlyExpenses' : 'monthlyIncome';
        return { labels, [key]: result };
    };

    initialize();
});