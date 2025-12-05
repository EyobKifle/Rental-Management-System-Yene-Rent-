// YeneRent/src/pages/Analytics/Analytics.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Chart from 'chart.js/auto';
import api from '../../utils/api';
import TaxCalculator from '../../utils/taxCalculator';
import PageHeader from '../../components/shared/PageHeader';
import Card from '../../components/ui/Card';
import './Analytics.css';

// Utility function to format currency (assuming it's in utils.js)
const formatCurrency = (amount, currency = 'ETB', compact = false) => {
    if (typeof amount !== 'number') return '';
    const options = {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    };
    if (compact) {
        options.notation = 'compact';
        options.compactDisplay = 'short';
    }
    return new Intl.NumberFormat('en-US', options).format(amount);
};

// Utility function to format date (assuming it's in utils.js)
const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// Utility function to format date-time (assuming it's in utils.js)
const formatDateTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};


// AnalyticsDataService adapted for React
class AnalyticsDataService {
    constructor(apiInstance, taxCalculatorInstance) {
        this.api = apiInstance;
        this.taxCalculator = taxCalculatorInstance;
        this.cache = {
            properties: null,
            leases: null,
            units: null,
        };
    }

    static getMonthlyProfitLoss(payments, expenses, startDate, endDate) {
        const data = {};
        const monthLabels = [];

        let currentDate = new Date(startDate);
        const end = new Date(endDate);

        while (currentDate <= end) {
            const label = currentDate.toLocaleString("en-US", { month: "short", year: "numeric" });
            const key = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
            data[key] = { revenue: 0, expenses: 0 };
            monthLabels.push(label);
            currentDate.setMonth(currentDate.getMonth() + 1);
        }

        payments.forEach((p) => {
            const [year, month] = p.date.split('-').map(Number);
            const key = `${year}-${month - 1}`;
            if (data[key]) data[key].revenue += p.amount;
        });

        expenses.forEach((e) => {
            const [year, month] = e.date.split('-').map(Number);
            const key = `${year}-${month - 1}`;
            if (data[key]) data[key].expenses += e.amount;
        });

        return {
            labels: monthLabels,
            revenues: Object.values(data).map((d) => d.revenue),
            expenses: Object.values(data).map((d) => d.expenses),
        };
    }

    async _getProperties() {
        if (!this.cache.properties) {
            this.cache.properties = await this.api.get("properties");
        }
        return this.cache.properties;
    }

    async _getLeases() {
        if (!this.cache.leases) {
            this.cache.leases = await this.api.get("leases");
        }
        return this.cache.leases;
    }

    async _getUnits() {
        if (!this.cache.units) {
            this.cache.units = await this.api.get("units");
        }
        return this.cache.units;
    }

    async getReportData(start, end, propertyId) {
        const [payments, expenses, allProperties, allLeases, allUnits] = await Promise.all([
            this.api.get("payments"),
            this.api.get("expenses"),
            this._getProperties(),
            this._getLeases(),
            this._getUnits(),
        ]);

        const propertyUnitIds = propertyId !== "all"
            ? allUnits.filter((u) => u.propertyId === propertyId).map((u) => u.id)
            : null;
        const propertyLeaseIds = propertyUnitIds
            ? allLeases.filter((l) => propertyUnitIds.includes(l.unitId)).map((l) => l.id)
            : null;

        const filteredPayments = payments.filter(
            (p) =>
                p.status === "Paid" &&
                (!start || p.date >= start) &&
                (!end || p.date <= end) &&
                (propertyId === "all" || (propertyLeaseIds && propertyLeaseIds.includes(p.leaseId)))
        );

        const filteredExpenses = expenses.filter(
            (e) =>
                (!start || e.date >= start) &&
                (!end || e.date <= end) &&
                (propertyId === "all" || e.propertyId === propertyId)
        );

        const totalRevenue = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
        const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
        const netProfit = totalRevenue - totalExpenses;

        const incomeByProperty = this._aggregateIncomeByProperty(filteredPayments, allLeases, allUnits, allProperties);
        const expenseByCategory = this._aggregateExpenseByCategory(filteredExpenses);
        const taxData = this.taxCalculator.calculateAllTaxes({ totalRevenue, totalExpenses, paymentsByProperty: incomeByProperty, expenses: filteredExpenses });

        const transactions = this._collateTransactions(filteredPayments, filteredExpenses);
        const auditLog = [
            { timestamp: new Date().toISOString(), user: "admin@test.com", action: "Generated Report", entity: "Analytics", details: `Date Range: ${start} to ${end}` },
            { timestamp: "2023-05-10T10:00:00Z", user: "admin@test.com", action: "Created", entity: "Expense", details: "ID: exp-123, Amount: 5000 ETB" },
        ];

        return {
            summary: { totalRevenue, totalExpenses, netProfit, taxData },
            charts: {
                incomeByProperty,
                expenseByCategory,
                profitLoss: AnalyticsDataService.getMonthlyProfitLoss(filteredPayments, filteredExpenses, start, end),
            },
            tables: { transactions, taxSummary: taxData, auditLog },
        };
    }

    _aggregateIncomeByProperty(payments, leases, units, properties) {
        return payments.reduce((acc, p) => {
            const lease = leases.find((l) => l.id === p.leaseId);
            if (!lease) return acc;

            const unit = units.find(u => u.id === lease.unitId);
            if (!unit) return acc;

            const property = properties.find((prop) => prop.id === unit.propertyId);

            if (property) {
                if (!acc[property.id]) {
                    acc[property.id] = { name: property.name, totalIncome: 0, taxType: property.taxType };
                }
                acc[property.id].totalIncome += p.amount;
            }
            return acc;
        }, {});
    }

    _aggregateExpenseByCategory(expenses) {
        return expenses.reduce((acc, e) => {
            acc[e.category] = (acc[e.category] || 0) + e.amount;
            return acc;
        }, {});
    }

    _collateTransactions(payments, expenses) {
        const transactions = [
            ...payments.map((p) => ({
                date: p.date,
                description: `Rent Payment for Lease ${p.leaseId}`,
                category: "Rent",
                type: "Income",
                amount: p.amount,
                recordedBy: "System",
            })),
            ...expenses.map((e) => ({
                date: e.date,
                description: e.description,
                category: e.category,
                type: "Expense",
                amount: -e.amount,
                recordedBy: "System",
            })),
        ];
        return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
}

const Analytics = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedProperty, setSelectedProperty] = useState('all');
    const [properties, setProperties] = useState([]);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const profitLossChartRef = useRef(null);
    const incomeOverviewChartRef = useRef(null);
    const expenseBreakdownChartRef = useRef(null);

    const analyticsDataService = useRef(null);
    const taxCalculator = useRef(null);

    // Initialize Chart.js defaults once
    useEffect(() => {
        Chart.defaults.font.family = "'Inter', sans-serif";
        Chart.defaults.font.size = 12;
        Chart.defaults.color = '#6b7280'; // gray-500
        Chart.defaults.plugins.legend.position = 'bottom';
        Chart.defaults.plugins.tooltip.enabled = true;
        Chart.defaults.plugins.tooltip.backgroundColor = '#111827'; // gray-900
        Chart.defaults.plugins.tooltip.titleFont = { size: 14, weight: 'bold' };
        Chart.defaults.plugins.tooltip.bodyFont = { size: 12 };
        Chart.defaults.plugins.tooltip.padding = 10;
        Chart.defaults.plugins.tooltip.cornerRadius = 4;
        Chart.defaults.plugins.tooltip.displayColors = true;
        Chart.defaults.plugins.tooltip.boxPadding = 4;
        Chart.defaults.plugins.tooltip.callbacks.label = function(context) {
            let label = context.dataset.label || '';
            if (label) {
                label += ': ';
            }
            if (context.parsed.y !== null && context.chart.config.type !== 'pie' && context.chart.config.type !== 'doughnut') {
                label += formatCurrency(context.parsed.y);
            } else if (context.chart.config.type === 'pie' || context.chart.config.type === 'doughnut') {
                const total = context.dataset.data.reduce((sum, value) => sum + value, 0);
                const value = context.parsed;
                const percentage = total === 0 ? 0 : ((value / total) * 100).toFixed(1);
                return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
            }
            return label;
        };
    }, []);

    // Initialize services and fetch properties
    useEffect(() => {
        const init = async () => {
            try {
                // Assuming settingsService is available globally or imported
                // For now, hardcode a default tax setting if settingsService is not ready
                const settings = { tax: { vatRate: 0.15, withholdingTaxRate: 0.15, businessIncomeTaxRate: 0.30, expenseVatDeductibleRate: 1.0 } };
                taxCalculator.current = new TaxCalculator(settings.tax);
                analyticsDataService.current = new AnalyticsDataService(api, taxCalculator.current);

                const fetchedProperties = await api.get('properties');
                setProperties(fetchedProperties);

                // Set default date range (last 12 months)
                const today = new Date();
                const twelveMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 11, 1);
                setStartDate(twelveMonthsAgo.toISOString().split('T')[0]);
                setEndDate(today.toISOString().split('T')[0]);
            } catch (err) {
                console.error("Failed to initialize analytics:", err);
                setError("Failed to load initial data.");
            }
        };
        init();
    }, []);

    const renderChart = useCallback((chartRef, type, data, options) => {
        if (chartRef.current) {
            chartRef.current.destroy();
        }

        let hasData = false;
        if (type === 'pie' || type === 'doughnut') {
            const dataArray = data.datasets?.[0]?.data || [];
            hasData = dataArray.length > 0 && dataArray.some(val => val > 0);
        } else {
            hasData = data.datasets && data.datasets.some(ds => ds.data && ds.data.some(val => val !== 0));
        }

        if (!hasData) {
            const ctx = chartRef.current.getContext('2d');
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.font = "16px 'Inter', sans-serif";
            ctx.fillStyle = "#666";
            ctx.textAlign = "center";
            const x = ctx.canvas.width / 2;
            const y = ctx.canvas.height / 2;
            ctx.fillText("No data available for this period", x, y);
            return;
        }

        const ctx = chartRef.current.getContext('2d');
        chartRef.current = new Chart(ctx, {
            type,
            data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { usePointStyle: true, boxWidth: 8 } } },
                ...options,
            },
        });
    }, []);

    const generateReport = useCallback(async () => {
        if (!analyticsDataService.current || !startDate || !endDate) return;

        setLoading(true);
        setError(null);
        try {
            const data = await analyticsDataService.current.getReportData(startDate, endDate, selectedProperty);
            setReportData(data);
        } catch (err) {
            console.error("Failed to generate report:", err);
            setError("Error generating report. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate, selectedProperty]);

    // Re-generate report when filters change
    useEffect(() => {
        if (startDate && endDate) {
            generateReport();
        }
    }, [startDate, endDate, selectedProperty, generateReport]);

    // Render charts when reportData is available
    useEffect(() => {
        if (reportData) {
            const { profitLoss, incomeByProperty, expenseByCategory } = reportData.charts;

            renderChart(profitLossChartRef, 'bar', {
                labels: profitLoss.labels,
                datasets: [
                    {
                        label: "Revenue",
                        data: profitLoss.revenues,
                        backgroundColor: "rgba(16, 185, 129, 0.6)", // success-color
                        borderColor: "rgba(16, 185, 129, 1)",
                        borderWidth: 1,
                    },
                    {
                        label: "Expenses",
                        data: profitLoss.expenses,
                        backgroundColor: "rgba(239, 68, 68, 0.6)", // danger-color
                        borderColor: "rgba(239, 68, 68, 1)",
                        borderWidth: 1,
                    },
                ],
            }, {
                interaction: { mode: 'index', intersect: false },
                scales: {
                    x: { stacked: false, grid: { display: false } },
                    y: {
                        stacked: false,
                        beginAtZero: true,
                        grid: { color: '#e5e7eb', borderDash: [2, 4] },
                        ticks: { callback: (value) => formatCurrency(value, 'ETB', true) },
                    },
                },
            });

            renderChart(incomeOverviewChartRef, 'pie', {
                labels: Object.values(incomeByProperty).map((d) => d.name),
                datasets: [{
                    label: "Income by Property",
                    data: Object.values(incomeByProperty).map((d) => d.totalIncome),
                    backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981', '#f97316', '#ef4444', '#f59e0b'],
                    hoverOffset: 4,
                }],
            }, { plugins: { legend: { display: true } } });

            renderChart(expenseBreakdownChartRef, 'doughnut', {
                labels: Object.keys(expenseByCategory),
                datasets: [{
                    label: "Expenses by Category",
                    data: Object.values(expenseByCategory),
                    backgroundColor: ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#14b8a6'],
                    hoverOffset: 4,
                }],
            }, { plugins: { legend: { display: true } } });
        }
    }, [reportData, renderChart]);

    const exportToPDF = () => {
        // This functionality requires a library like html2pdf.js
        // For now, we'll just log a message.
        console.log("Export to PDF functionality not yet implemented in React.");
        // In a real app, you'd use a library like html2pdf.js or generate a PDF on the server.
        // Example: html2pdf().from(document.getElementById('analytics-report-content')).save();
    };

    if (loading && !reportData) {
        return (
            <div className="analytics-page analytics-loading">
                <PageHeader title="Analytics & Reports" description="Comprehensive overview of your rental property performance." />
                <Card>
                    <p>Loading analytics data...</p>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="analytics-page">
                <PageHeader title="Analytics & Reports" description="Comprehensive overview of your rental property performance." />
                <Card>
                    <p className="text-red-500">{error}</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="analytics-page">
            <PageHeader title="Analytics & Reports" description="Comprehensive overview of your rental property performance." />

            <div className="filters-card card mb-4">
                <div className="form-group">
                    <label htmlFor="filter-start" className="form-label">Start Date</label>
                    <input type="date" id="filter-start" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="form-group">
                    <label htmlFor="filter-end" className="form-label">End Date</label>
                    <input type="date" id="filter-end" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
                <div className="form-group">
                    <label htmlFor="filter-property" className="form-label">Property</label>
                    <select id="filter-property" className="form-input" value={selectedProperty} onChange={(e) => setSelectedProperty(e.target.value)}>
                        <option value="all">All Properties</option>
                        {properties.map(prop => (
                            <option key={prop.id} value={prop.id}>{prop.name}</option>
                        ))}
                    </select>
                </div>
                <div className="form-actions">
                    <button className="btn btn-primary" onClick={generateReport} disabled={loading}>
                        {loading ? 'Generating...' : 'Generate Report'}
                    </button>
                    <button className="btn btn-secondary" onClick={exportToPDF}>Export to PDF</button>
                </div>
            </div>

            {reportData && (
                <div id="analytics-report-content">
                    <div className="dashboard-stats">
                        <Card>
                            <p>Total Revenue</p>
                            <h2 id="stat-total-revenue">{formatCurrency(reportData.summary.totalRevenue)}</h2>
                        </Card>
                        <Card>
                            <p>Total Expenses</p>
                            <h2 id="stat-total-expenses">{formatCurrency(reportData.summary.totalExpenses)}</h2>
                        </Card>
                        <Card>
                            <p>Net Profit</p>
                            <h2 id="stat-net-profit" className={reportData.summary.netProfit > 0 ? 'text-green' : reportData.summary.netProfit < 0 ? 'text-red' : ''}>
                                {formatCurrency(reportData.summary.netProfit)}
                            </h2>
                        </Card>
                        <Card>
                            <p>Estimated Tax</p>
                            <h2 id="stat-estimated-tax">{formatCurrency(reportData.summary.taxData.totalTaxLiability)}</h2>
                        </Card>
                    </div>

                    <div className="chart-grid">
                        <Card className="chart-card">
                            <h3>Monthly Profit & Loss</h3>
                            <div className="chart-container">
                                <canvas ref={profitLossChartRef} id="profitLossChart"></canvas>
                            </div>
                        </Card>
                        <Card className="chart-card">
                            <h3>Income by Property</h3>
                            <div className="chart-container">
                                <canvas ref={incomeOverviewChartRef} id="incomeOverviewChart"></canvas>
                            </div>
                        </Card>
                        <Card className="chart-card">
                            <h3>Expense Breakdown</h3>
                            <div className="chart-container">
                                <canvas ref={expenseBreakdownChartRef} id="expenseBreakdownChart"></canvas>
                            </div>
                        </Card>
                    </div>

                    <div className="financial-summary card mb-4">
                        <h2>Financial Summary</h2>
                        <div className="summary-grid">
                            <div className="summary-section">
                                <h3>Income Sources</h3>
                                <div id="summary-income-sources">
                                    {Object.values(reportData.charts.incomeByProperty).map(prop => (
                                        <div className="summary-item" key={prop.name}>
                                            <span>{prop.name}</span>
                                            <span>{formatCurrency(prop.totalIncome)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="summary-item mt-3">
                                    <span><strong>Total Income</strong></span>
                                    <span id="summary-total-income"><strong>{formatCurrency(reportData.summary.totalRevenue)}</strong></span>
                                </div>
                            </div>
                            <div className="summary-section">
                                <h3>Expense Categories</h3>
                                <div id="summary-expense-categories">
                                    {Object.entries(reportData.charts.expenseByCategory).map(([key, value]) => (
                                        <div className="summary-item" key={key}>
                                            <span>{key}</span>
                                            <span>{formatCurrency(value)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="summary-item mt-3">
                                    <span><strong>Total Expenses</strong></span>
                                    <span id="summary-total-expenses"><strong>{formatCurrency(reportData.summary.totalExpenses)}</strong></span>
                                </div>
                            </div>
                            <div className="summary-section">
                                <h3>Profit & Tax</h3>
                                <div className="summary-item">
                                    <span>Net Profit</span>
                                    <span id="summary-net-profit">{formatCurrency(reportData.summary.netProfit)}</span>
                                </div>
                                <div id="summary-tax-breakdown">
                                    <div className="summary-item"><span>VAT Payable</span><span>{formatCurrency(reportData.summary.taxData.vat.payable)}</span></div>
                                    <div className="summary-item"><span>Business Income Tax</span><span>{formatCurrency(reportData.summary.taxData.businessIncomeTax.payable)}</span></div>
                                    <div className="summary-item"><span>Withholding Tax</span><span>{formatCurrency(reportData.summary.taxData.withholdingTax.total)}</span></div>
                                </div>
                                <div className="summary-item mt-3">
                                    <span><strong>Total Estimated Tax</strong></span>
                                    <span id="summary-total-tax"><strong>{formatCurrency(reportData.summary.taxData.totalTaxLiability)}</strong></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="detailed-tables card">
                        <h2>Detailed Transactions</h2>
                        <div className="table-responsive">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Description</th>
                                        <th>Category</th>
                                        <th>Type</th>
                                        <th>Amount</th>
                                        <th>Recorded By</th>
                                    </tr>
                                </thead>
                                <tbody id="transactions-table-body">
                                    {reportData.tables.transactions.length > 0 ? (
                                        reportData.tables.transactions.map((row, index) => (
                                            <tr key={index}>
                                                <td>{formatDate(row.date)}</td>
                                                <td>{row.description}</td>
                                                <td>{row.category}</td>
                                                <td><span className={`status-badge ${row.type === "Income" ? "status-active" : "status-expired"}`}>{row.type}</span></td>
                                                <td className={row.amount > 0 ? "text-green" : "text-red"}>{formatCurrency(row.amount)}</td>
                                                <td>{row.recordedBy}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="6" className="text-center p-4">No data available for the selected period.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="detailed-tables card mt-4">
                        <h2>Tax Summary</h2>
                        <div className="table-responsive">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Tax Type</th>
                                        <th>Amount</th>
                                        <th>Period</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody id="tax-summary-table-body">
                                    {[
                                        { type: "VAT Payable", amount: reportData.summary.taxData.vat.payable, period: "Monthly", status: "Pending" },
                                        { type: "Business Income Tax", amount: reportData.summary.taxData.businessIncomeTax.payable, period: "Annual", status: "Estimated" },
                                        { type: "Withholding Tax", amount: reportData.summary.taxData.withholdingTax.total, period: "As Incurred", status: "Tracked" },
                                    ].map((row, index) => (
                                        <tr key={index}>
                                            <td>{row.type}</td>
                                            <td>{formatCurrency(row.amount)}</td>
                                            <td>{row.period}</td>
                                            <td><span className="status-badge status-upcoming">{row.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="detailed-tables card mt-4">
                        <h2>Audit Log</h2>
                        <div className="table-responsive">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Timestamp</th>
                                        <th>User</th>
                                        <th>Action</th>
                                        <th>Entity</th>
                                        <th>Details</th>
                                    </tr>
                                </thead>
                                <tbody id="audit-log-table-body">
                                    {reportData.tables.auditLog.length > 0 ? (
                                        reportData.tables.auditLog.map((row, index) => (
                                            <tr key={index}>
                                                <td>{formatDateTime(row.timestamp)}</td>
                                                <td>{row.user}</td>
                                                <td>{row.action}</td>
                                                <td>{row.entity}</td>
                                                <td>{row.details}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="5" className="text-center p-4">No audit log data available.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div id="report-footer" className="text-center text-gray-500 text-sm mt-5 p-3 border-t border-gray-200">
                        {/* Footer content for PDF export */}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Analytics;