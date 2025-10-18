document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const filterStart = document.getElementById('filter-start');
    const filterEnd = document.getElementById('filter-end');
    const filterProperty = document.getElementById('filter-property');
    const generateReportBtn = document.getElementById('btn-generate-report');
    const exportPdfBtn = document.getElementById('export-pdf');

    // --- State ---
    let charts = {};
    let taxCalculator;
    let allProperties = [];
    let currentUser = {};

    // --- Initialization ---
    const initialize = async () => {
        await window.rentalUtils.headerPromise;
        currentUser = await auth.getCurrentUser();

        // Initialize tax calculator (settings could be fetched from user profile)
        const taxSettings = { /* Fetch from localStorage or use defaults */ };
        taxCalculator = new TaxCalculator(taxSettings);

        // Populate property filter
        allProperties = await api.get('properties');
        populatePropertyFilter();

        // Set default date range (e.g., this month)
        setDefaultDateFilters();

        // Generate initial report on page load
        await generateReport();

        // Setup event listeners
        generateReportBtn.addEventListener('click', generateReport);
        exportPdfBtn.addEventListener('click', exportToPDF);

        rentalUtils.setupLucideIcons();
    };

    // --- Data Fetching & Processing ---
    const generateReport = async () => {
        const start = filterStart.value;
        const end = filterEnd.value;
        const propertyId = filterProperty.value;

        // In a real app, this would be a single API call:
        // const reportData = await api.get(`audit-report?start=${start}&end=${end}&property=${propertyId}`);
        // For now, we'll simulate it by fetching all data and filtering.
        const reportData = await getMockReportData(start, end, propertyId);

        // Render all sections with the new data
        renderStats(reportData.summary);
        renderCharts(reportData.charts);
        renderFinancialSummary(reportData.summary, reportData.charts);
        renderDetailedTables(reportData.tables);
    };

    const getMockReportData = async (start, end, propertyId) => {
        // This function simulates the backend API call.
        const [payments, expenses, leases, units, users] = await Promise.all([
            api.get('payments'), api.get('expenses'), api.get('leases'), api.get('units'), api.get('users')
        ]);

        // Filter data based on date range and property
        const propertyUnitIds = propertyId !== 'all' ? units.filter(u => u.propertyId === propertyId).map(u => u.id) : null;
        const propertyLeaseIds = propertyUnitIds ? leases.filter(l => propertyUnitIds.includes(l.unitId)).map(l => l.id) : null;

        const filteredPayments = payments.filter(p =>
            (!start || p.date >= start) &&
            (!end || p.date <= end) &&
            (propertyId === 'all' || propertyLeaseIds.includes(p.leaseId))
        );
        const filteredExpenses = expenses.filter(e =>
            (!start || e.date >= start) &&
            (!end || e.date <= end) &&
            (propertyId === 'all' || e.propertyId === propertyId)
        );

        // --- Process Data ---
        const totalRevenue = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
        const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
        const netProfit = totalRevenue - totalExpenses;

        const incomeByProperty = filteredPayments.reduce((acc, p) => {
            const lease = leases.find(l => l.id === p.leaseId);
            const unit = lease ? units.find(u => u.id === lease.unitId) : null;
            const property = unit ? allProperties.find(prop => prop.id === unit.propertyId) : null;
            if (property) {
                if (!acc[property.id]) acc[property.id] = { name: property.name, totalIncome: 0 };
                acc[property.id].totalIncome += p.amount;
            }
            return acc;
        }, {});

        const expenseByCategory = filteredExpenses.reduce((acc, e) => {
            acc[e.category] = (acc[e.category] || 0) + e.amount;
            return acc;
        }, {});

        // Mock tax calculation
        const taxData = taxCalculator.calculateAllTaxes({
            totalRevenue, totalExpenses, paymentsByProperty: incomeByProperty, expenses: filteredExpenses
        });

        // Mock detailed transactions
        const transactions = [
            ...filteredPayments.map(p => ({ date: p.date, description: `Payment from Tenant for Lease ${p.leaseId}`, category: p.type, type: 'Income', amount: p.amount, recordedBy: 'System' })),
            ...filteredExpenses.map(e => ({ date: e.date, description: e.description, category: e.category, type: 'Expense', amount: -e.amount, recordedBy: 'System' }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date));

        // Mock audit log
        const auditLog = [
            { timestamp: new Date().toISOString(), user: 'admin@test.com', action: 'Generated Report', entity: 'Analytics', details: `Date Range: ${start} to ${end}` },
            { timestamp: '2023-05-10T10:00:00Z', user: 'admin@test.com', action: 'Created', entity: 'Expense', details: 'ID: exp-123, Amount: 5000 ETB' }
        ];

        return {
            summary: { totalRevenue, totalExpenses, netProfit, taxData },
            charts: { incomeByProperty, expenseByCategory, profitLoss: getMonthlyProfitLoss(filteredPayments, filteredExpenses) },
            tables: { transactions, taxSummary: taxData, auditLog }
        };
    };

    // --- Rendering Functions ---
    const renderStats = (summary) => {
        document.getElementById('stat-total-revenue').textContent = rentalUtils.formatCurrency(summary.totalRevenue);
        document.getElementById('stat-total-expenses').textContent = rentalUtils.formatCurrency(summary.totalExpenses);
        document.getElementById('stat-net-profit').textContent = rentalUtils.formatCurrency(summary.netProfit);
        document.getElementById('stat-estimated-tax').textContent = rentalUtils.formatCurrency(summary.taxData.totalTaxLiability);

        const netProfitEl = document.getElementById('stat-net-profit');
        netProfitEl.classList.remove('text-green', 'text-red', 'text-gray-800');
        netProfitEl.classList.add(summary.netProfit > 0 ? 'text-green' : (summary.netProfit < 0 ? 'text-red' : 'text-gray-800'));
    };

    const renderCharts = (chartData) => {
        renderProfitLossChart(chartData.profitLoss);
        renderIncomeOverviewChart(chartData.incomeByProperty);
        renderExpenseBreakdownChart(chartData.expenseByCategory);
    };

    const renderFinancialSummary = (summary, chartData) => {
        const { totalRevenue, totalExpenses, netProfit, taxData } = summary;
        const { incomeByProperty, expenseByCategory } = chartData;

        document.getElementById('summary-income-sources').innerHTML = Object.values(incomeByProperty).map(prop => `
            <div class="summary-item"><span>${prop.name}</span><span>${rentalUtils.formatCurrency(prop.totalIncome)}</span></div>
        `).join('');

        document.getElementById('summary-expense-categories').innerHTML = Object.entries(expenseByCategory).map(([key, value]) => `
            <div class="summary-item"><span>${key}</span><span>${rentalUtils.formatCurrency(value)}</span></div>
        `).join('');

        document.getElementById('summary-total-income').textContent = rentalUtils.formatCurrency(totalRevenue);
        document.getElementById('summary-total-expenses').textContent = rentalUtils.formatCurrency(totalExpenses);
        document.getElementById('summary-net-profit').textContent = rentalUtils.formatCurrency(netProfit);

        document.getElementById('summary-tax-breakdown').innerHTML = `
            <div class="summary-item"><span>VAT Payable</span><span>${rentalUtils.formatCurrency(taxData.vat.payable)}</span></div>
            <div class="summary-item"><span>Business Income Tax</span><span>${rentalUtils.formatCurrency(taxData.businessIncomeTax.payable)}</span></div>
            <div class="summary-item"><span>Withholding Tax</span><span>${rentalUtils.formatCurrency(taxData.withholdingTax.total)}</span></div>
        `;
        document.getElementById('summary-total-tax').textContent = rentalUtils.formatCurrency(taxData.totalTaxLiability);
    };

    const renderDetailedTables = (tables) => {
        populateTable('transactions-table-body', tables.transactions, (row) => `
            <td>${rentalUtils.formatDate(row.date)}</td>
            <td>${row.description}</td>
            <td>${row.category}</td>
            <td><span class="status-badge ${row.type === 'Income' ? 'status-active' : 'status-expired'}">${row.type}</span></td>
            <td class="${row.amount > 0 ? 'text-green' : 'text-red'}">${rentalUtils.formatCurrency(row.amount)}</td>
            <td>${row.recordedBy}</td>
        `);

        const taxRows = [
            { type: 'VAT Payable', amount: tables.taxSummary.vat.payable, period: 'Monthly', status: 'Pending' },
            { type: 'Business Income Tax', amount: tables.taxSummary.businessIncomeTax.payable, period: 'Annual', status: 'Estimated' },
            { type: 'Withholding Tax', amount: tables.taxSummary.withholdingTax.total, period: 'As Incurred', status: 'Tracked' },
        ];
        populateTable('tax-summary-table-body', taxRows, (row) => `
            <td>${row.type}</td>
            <td>${rentalUtils.formatCurrency(row.amount)}</td>
            <td>${row.period}</td>
            <td><span class="status-badge status-upcoming">${row.status}</span></td>
        `);

        populateTable('audit-log-table-body', tables.auditLog, (row) => `
            <td>${rentalUtils.formatDateTime(row.timestamp)}</td>
            <td>${row.user}</td>
            <td>${row.action}</td>
            <td>${row.entity}</td>
            <td>${row.details}</td>
        `);
    };

    // --- Chart Rendering ---
    const renderChart = (ctx, type, data, options) => {
        const chartId = ctx.canvas.id;
        if (charts[chartId]) {
            charts[chartId].destroy();
        }
        charts[chartId] = new Chart(ctx, { type, data, options: { responsive: true, maintainAspectRatio: false, ...options } });
    };

    const renderProfitLossChart = (monthlyData) => {
        const ctx = document.getElementById('profitLossChart').getContext('2d');
        renderChart(ctx, 'bar', {
            labels: monthlyData.labels,
            datasets: [
                { label: 'Revenue', data: monthlyData.revenues, backgroundColor: 'rgba(75, 192, 192, 0.6)' },
                { label: 'Expenses', data: monthlyData.expenses, backgroundColor: 'rgba(255, 99, 132, 0.6)' }
            ]
        });
    };

    const renderIncomeOverviewChart = (incomeData) => {
        const ctx = document.getElementById('incomeOverviewChart').getContext('2d');
        renderChart(ctx, 'pie', {
            labels: Object.values(incomeData).map(d => d.name),
            datasets: [{
                label: 'Income by Property',
                data: Object.values(incomeData).map(d => d.totalIncome),
                backgroundColor: ['#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384'],
            }]
        });
    };

    const renderExpenseBreakdownChart = (expenseData) => {
        const ctx = document.getElementById('expenseBreakdownChart').getContext('2d');
        renderChart(ctx, 'doughnut', {
            labels: Object.keys(expenseData),
            datasets: [{
                label: 'Expenses by Category',
                data: Object.values(expenseData),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
            }]
        });
    };

    // --- Utility Functions ---
    const populatePropertyFilter = () => {
        allProperties.forEach(prop => {
            const option = document.createElement('option');
            option.value = prop.id;
            option.textContent = prop.name;
            filterProperty.appendChild(option);
        });
    };

    const setDefaultDateFilters = () => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        filterStart.value = firstDay.toISOString().split('T')[0];
        filterEnd.value = lastDay.toISOString().split('T')[0];
    };

    const getMonthlyProfitLoss = (payments, expenses) => {
        const data = {};
        const monthLabels = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            data[key] = { revenue: 0, expenses: 0 };
            monthLabels.push(label);
        }
        payments.forEach(p => {
            const d = new Date(p.date);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            if (data[key]) data[key].revenue += p.amount;
        });
        expenses.forEach(e => {
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

    const populateTable = (tbodyId, data, rowTemplate) => {
        const tbody = document.getElementById(tbodyId);
        tbody.innerHTML = '';
        if (!data || data.length === 0) {
            const colSpan = tbody.previousElementSibling.firstElementChild.children.length;
            tbody.innerHTML = `<tr><td colspan="${colSpan}" class="text-center p-4">No data available for the selected period.</td></tr>`;
            return;
        }
        data.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = rowTemplate(row);
            tbody.appendChild(tr);
        });
    };

    const exportToPDF = () => {
        const element = document.getElementById('analytics-view');
        const reportFooter = document.getElementById('report-footer');
        
        // Inject user and date info into the footer for printing
        reportFooter.innerHTML = `
            <p><strong>TIN:</strong> 1234567890</p>
            <p>Report generated by <strong>${currentUser.name || 'N/A'}</strong> on ${new Date().toLocaleString()}</p>
        `;

        const opt = {
            margin: 0.5,
            filename: `Audit_Report_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().from(element).set(opt).save();
    };

    // --- Load tax calculator script and initialize ---
    const script = document.createElement('script');
    script.src = '../Js/taxCalculator.js';
    document.body.appendChild(script);
    script.onload = initialize;
});