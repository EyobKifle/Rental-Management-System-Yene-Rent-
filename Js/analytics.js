/**
 * Utility function to calculate monthly profit and loss data.
 * @param {Array} payments - Array of payment objects.
 * @param {Array} expenses - Array of expense objects.
 * @param {string} startDate - Start date in YYYY-MM-DD format.
 * @param {string} endDate - End date in YYYY-MM-DD format.
 * @returns {object} - Object with labels, revenues, and expenses arrays.
 */

/**
 * AnalyticsDataService
 *
 * This class acts as a data layer for the analytics page. It simulates
 * what a dedicated backend API endpoint for reports would do. It fetches
 * raw data, caches it, and processes it to generate structured report data.
 * This improves performance by avoiding re-fetching of static data and
 * centralizes data logic.
 */
class AnalyticsDataService {
  constructor(api, taxCalculator) {
    this.api = api;
    this.taxCalculator = taxCalculator;
    this.cache = {
      properties: null,
      leases: null,
      units: null,
    };
  }

  static getMonthlyProfitLoss(payments, expenses, startDate, endDate) {
    const data = {};
    const monthLabels = [];

    // Use the filter dates to create the labels dynamically
    let currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
      const label = currentDate.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      const key = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
      data[key] = { revenue: 0, expenses: 0 };
      monthLabels.push(label);
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    payments.forEach((p) => {
      // Use string splitting to avoid timezone issues with `new Date()`
      const [year, month] = p.date.split('-').map(Number);
      const key = `${year}-${month - 1}`; // month is 1-based, Date month is 0-based
      if (data[key]) data[key].revenue += p.amount;
    });
    expenses.forEach((e) => {
      const [year, month] = e.date.split('-').map(Number);
      const key = `${year}-${month - 1}`; // month is 1-based, Date month is 0-based
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

  /**
   * Fetches and processes all data required for the analytics report.
   * @param {string} start - Start date (YYYY-MM-DD)
   * @param {string} end - End date (YYYY-MM-DD)
   * @param {string} propertyId - The ID of the property or 'all'
   * @returns {Promise<object>} - The structured report data.
   */
  async getReportData(start, end, propertyId) {
    // 1. Fetch all necessary data in parallel
    const [payments, expenses, allProperties, allLeases, allUnits] =
      await Promise.all([
        this.api.get("payments"),
        this.api.get("expenses"),
        this._getProperties(),
        this._getLeases(),
        this._getUnits(),
      ]);

    // 2. Filter data based on user's selection
    const propertyUnitIds =
      propertyId !== "all"
        ? allUnits.filter((u) => u.propertyId === propertyId).map((u) => u.id)
        : null;
    const propertyLeaseIds = propertyUnitIds
      ? allLeases
          .filter((l) => propertyUnitIds.includes(l.unitId))
          .map((l) => l.id)
      : null;

    const filteredPayments = payments.filter(
      (p) =>
        p.status === "Paid" &&
        (!start || p.date >= start) &&
        (!end || p.date <= end) &&
        (propertyId === "all" ||
          (propertyLeaseIds && propertyLeaseIds.includes(p.leaseId)))
    );

    const filteredExpenses = expenses.filter(
      (e) =>
        (!start || e.date >= start) &&
        (!end || e.date <= end) &&
        (propertyId === "all" || e.propertyId === propertyId)
    );

    // 3. Process and aggregate the filtered data
    const totalRevenue = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = filteredExpenses.reduce(
      (sum, e) => sum + e.amount,
      0
    );
    const netProfit = totalRevenue - totalExpenses;

    const incomeByProperty = this._aggregateIncomeByProperty(
      filteredPayments,
      allLeases,
      allProperties
    );
    const expenseByCategory = this._aggregateExpenseByCategory(filteredExpenses);

    const taxData = this.taxCalculator.calculateAllTaxes({ totalRevenue, totalExpenses, paymentsByProperty: incomeByProperty, expenses: filteredExpenses });

    // 5. Prepare data for tables
    const transactions = this._collateTransactions(
      filteredPayments,
      filteredExpenses
    );
    const auditLog = [
      {
        timestamp: new Date().toISOString(),
        user: "admin@test.com",
        action: "Generated Report",
        entity: "Analytics",
        details: `Date Range: ${start} to ${end}`,
      },
      {
        timestamp: "2023-05-10T10:00:00Z",
        user: "admin@test.com",
        action: "Created",
        entity: "Expense",
        details: "ID: exp-123, Amount: 5000 ETB",
      },
    ];

    // 6. Return the structured report object
    return {
      summary: { totalRevenue, totalExpenses, netProfit, taxData },
      charts: {
        incomeByProperty,
        expenseByCategory,
        profitLoss: AnalyticsDataService.getMonthlyProfitLoss( // Pass the filtered data here
          filteredPayments, 
          filteredExpenses,
          start,
          end
        ),
      },
      tables: { transactions, taxSummary: taxData, auditLog },
    };
  }

  /**
   * Aggregates income by property from filtered payments.
   * @param {Array<object>} payments - Filtered payment data.
   * @param {Array<object>} leases - All lease data.
   * @param {Array<object>} properties - All property data.
   * @returns {object} - Aggregated income by property.
   */
  _aggregateIncomeByProperty(payments, leases, properties) {
    return payments.reduce((acc, p) => {
      const lease = leases.find((l) => l.id === p.leaseId);
      const property = lease
        ? properties.find((prop) => prop.id === lease.propertyId)
        : null;

      if (property) {
        if (!acc[property.id])
          acc[property.id] = { name: property.name, totalIncome: 0 };
        acc[property.id].totalIncome += p.amount;
      }
      return acc;
    }, {});
  }

  /**
   * Aggregates expenses by category from filtered expenses.
   * @param {Array<object>} expenses - Filtered expense data.
   * @returns {object} - Aggregated expenses by category.
   */
  _aggregateExpenseByCategory(expenses) {
    return expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});
  }

  /**
   * Collates filtered payments and expenses into a single sorted list of transactions.
   * @param {Array<object>} payments - Filtered payment data.
   * @param {Array<object>} expenses - Filtered expense data.
   * @returns {Array<object>} - Sorted list of transactions.
   */
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

document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements ---
  const analyticsView = document.getElementById("analytics-view");
  const filterStart = document.getElementById("filter-start");
  const filterEnd = document.getElementById("filter-end");
  const filterProperty = document.getElementById("filter-property");
  const generateReportBtn = document.getElementById("btn-generate-report");
  const exportPdfBtn = document.getElementById("export-pdf");
  const mainContent = document.getElementById("main-content");

  // --- State ---
  // Professional Chart.js global settings
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
      if (context.parsed.y !== null) {
          label += rentalUtils.formatCurrency(context.parsed.y);
      }
      return label;
  };
  let charts = {};
  let taxCalculator; // Declared here, initialized after class is loaded
  let allProperties = [];
  let currentUser = {};

  // --- Initialization ---
  const initialize = async () => {
    await window.rentalUtils.headerPromise;

    // Initialize services and calculators first
    if (typeof TaxCalculator !== "undefined") {
      const settings = window.settingsService.getSettings();
      taxCalculator = new TaxCalculator(settings.tax);
    } else {
      console.error("TaxCalculator class is not defined. Make sure taxCalculator.js is loaded correctly.");
      return; // Stop initialization if critical component is missing
    }

    try {
      currentUser = JSON.parse(sessionStorage.getItem("currentUser")) || {};
    } catch (e) {
      currentUser = {};
    }

    allProperties = await api.get("properties"); // Fetch once for the filter
    populatePropertyFilter();

    // Set default date range (e.g., this month)
    setDefaultDateFilters();

    // Generate initial report on page load
    await generateReport();

    // Setup event listeners
    generateReportBtn.addEventListener("click", generateReport);
    exportPdfBtn.addEventListener("click", exportToPDF);

    await rentalUtils.setupFontAwesomeIcons();
  };

  // --- Data Fetching & Processing ---
  const generateReport = async () => {
    const start = filterStart.value;
    const end = filterEnd.value;
    const propertyId = filterProperty.value;

    // Show a loading state
    mainContent.classList.add("loading");

    try {
      // Instantiate the service and fetch the fully processed report data.
      const dataService = new AnalyticsDataService(api, taxCalculator);
      const reportData = await dataService.getReportData(
        start,
        end,
        propertyId
      );

      // Render all sections with the new data
      renderStats(reportData.summary);
      renderCharts(reportData.charts);
      renderFinancialSummary(reportData.summary, reportData.charts);
      renderDetailedTables(reportData.tables);
    } catch (error) {
      console.error("Failed to generate report:", error); // Keep detailed log for developers
      rentalUtils.showNotification(
        "Error generating report. Please try again.",
        "error"
      );
    } finally {
      // Hide loading state
      mainContent.classList.remove("loading");
    }
  };

  // --- Rendering Functions ---
  const renderStats = (summary) => {
    const statRevenue = analyticsView.querySelector("#stat-total-revenue");
    const statExpenses = analyticsView.querySelector("#stat-total-expenses");
    const netProfitEl = analyticsView.querySelector("#stat-net-profit");
    const statTax = analyticsView.querySelector("#stat-estimated-tax");

    if (statRevenue)
      statRevenue.textContent = rentalUtils.formatCurrency(
        summary.totalRevenue
      );
    if (statExpenses)
      statExpenses.textContent = rentalUtils.formatCurrency(
        summary.totalExpenses
      );
    if (netProfitEl)
      netProfitEl.textContent = rentalUtils.formatCurrency(summary.netProfit);
    if (statTax)
      statTax.textContent = rentalUtils.formatCurrency(
        summary.taxData.totalTaxLiability
      );

    netProfitEl.classList.remove("text-green", "text-red", "text-gray-800");
    netProfitEl.classList.add(
      summary.netProfit > 0
        ? "text-green"
        : summary.netProfit < 0
        ? "text-red"
        : "text-gray-800"
    );
  };

  const renderCharts = (chartData) => {
    renderProfitLossChart(chartData.profitLoss);
    renderIncomeOverviewChart(chartData.incomeByProperty);
    renderExpenseBreakdownChart(chartData.expenseByCategory);
  };

  const renderFinancialSummary = (summary, chartData) => {
    const { totalRevenue, totalExpenses, netProfit, taxData } = summary;
    const { incomeByProperty, expenseByCategory } = chartData;

    analyticsView.querySelector("#summary-income-sources").innerHTML =
      Object.values(incomeByProperty)
        .map(
          (prop) => `
            <div class="summary-item"><span>${
              prop.name
            }</span><span>${rentalUtils.formatCurrency(
            prop.totalIncome
          )}</span></div>
        `
        )
        .join("");

    analyticsView.querySelector("#summary-expense-categories").innerHTML =
      Object.entries(expenseByCategory)
        .map(
          ([key, value]) => `
            <div class="summary-item"><span>${key}</span><span>${rentalUtils.formatCurrency(
            value
          )}</span></div>
        `
        )
        .join("");

    analyticsView.querySelector("#summary-total-income").textContent =
      rentalUtils.formatCurrency(totalRevenue);
    analyticsView.querySelector("#summary-total-expenses").textContent =
      rentalUtils.formatCurrency(totalExpenses);
    analyticsView.querySelector("#summary-net-profit").textContent =
      rentalUtils.formatCurrency(netProfit);

    analyticsView.querySelector("#summary-tax-breakdown").innerHTML = `
            <div class="summary-item"><span>VAT Payable</span><span>${rentalUtils.formatCurrency(
              taxData.vat.payable
            )}</span></div>
            <div class="summary-item"><span>Business Income Tax</span><span>${rentalUtils.formatCurrency(
              taxData.businessIncomeTax.payable
            )}</span></div>
            <div class="summary-item"><span>Withholding Tax</span><span>${rentalUtils.formatCurrency(
              taxData.withholdingTax.total
            )}</span></div>
        `;
    analyticsView.querySelector("#summary-total-tax").textContent =
      rentalUtils.formatCurrency(taxData.totalTaxLiability);
  };

  const renderDetailedTables = (tables) => {
    populateTable(
      "transactions-table-body",
      tables.transactions,
      (row) => `
            <td>${rentalUtils.formatDate(row.date)}</td>
            <td>${row.description}</td>
            <td>${row.category}</td>
            <td><span class="status-badge ${
              row.type === "Income" ? "status-active" : "status-expired"
            }">${row.type}</span></td>
            <td class="${
              row.amount > 0 ? "text-green" : "text-red"
            }">${rentalUtils.formatCurrency(row.amount)}</td>
            <td>${row.recordedBy}</td>
        `
    );

    const taxRows = [
      {
        type: "VAT Payable",
        amount: tables.taxSummary.vat.payable,
        period: "Monthly",
        status: "Pending",
      },
      {
        type: "Business Income Tax",
        amount: tables.taxSummary.businessIncomeTax.payable,
        period: "Annual",
        status: "Estimated",
      },
      {
        type: "Withholding Tax",
        amount: tables.taxSummary.withholdingTax.total,
        period: "As Incurred",
        status: "Tracked",
      },
    ];
    populateTable(
      "tax-summary-table-body",
      taxRows,
      (row) => `
            <td>${row.type}</td>
            <td>${rentalUtils.formatCurrency(row.amount)}</td>
            <td>${row.period}</td>
            <td><span class="status-badge status-upcoming">${
              row.status
            }</span></td>
        `
    );

    const auditLogTbody = document.getElementById("audit-log-table-body");
    if (auditLogTbody) {
      auditLogTbody.innerHTML = `
                <thead>
                    <tr><th>Timestamp</th><th>User</th><th>Action</th><th>Entity</th><th>Details</th></tr>
                </thead>
                <tbody>
                    ${tables.auditLog
                      .map(
                        (row) => `
                        <tr>
                            <td>${rentalUtils.formatDateTime(
                              row.timestamp
                            )}</td><td>${row.user}</td><td>${
                          row.action
                        }</td><td>${row.entity}</td><td>${row.details}</td>
                        </tr>
                    `
                      )
                      .join("")}
                </tbody>
            `;
    }
  };

  // --- Chart Rendering ---
  const renderChart = (ctx, type, data, options) => {
    const chartId = ctx.canvas.id;
    if (charts[chartId]) {
      charts[chartId].destroy();
    }
    // Check if data is empty and show placeholder text
    const isEmpty =
      (type === "bar" &&
        (!data.datasets ||
          data.datasets.every((ds) => !ds.data || ds.data.length === 0))) ||
      ((type === "pie" || type === "doughnut") &&
        (!data.datasets ||
          !data.datasets[0] ||
          !data.datasets[0].data ||
          data.datasets[0].data.length === 0));
    if (isEmpty) {
      // Clear canvas and draw placeholder text
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.font = "16px Arial";
      ctx.fillStyle = "#666";
      ctx.textAlign = "center";
      ctx.fillText(
        "No data available",
        ctx.canvas.width / 2,
        ctx.canvas.height / 2
      );
      return;
    }
    charts[chartId] = new Chart(ctx, {
      type, 
      data,
      options: { 
        responsive: true, 
        maintainAspectRatio: false, 
        plugins: { legend: { labels: { usePointStyle: true, boxWidth: 8 } } },
        ...options 
      },
    });
  };

  const renderProfitLossChart = (monthlyData) => {
    const ctx = document.getElementById("profitLossChart").getContext("2d");
    renderChart(
      ctx,
      "bar",
      {
        labels: monthlyData.labels,
        datasets: [
          {
            label: "Revenue",
            data: monthlyData.revenues,
            backgroundColor: "rgba(16, 185, 129, 0.6)", // success-color
            borderColor: "rgba(16, 185, 129, 1)",
            borderWidth: 1,
          },
          {
            label: "Expenses",
            data: monthlyData.expenses,
            backgroundColor: "rgba(239, 68, 68, 0.6)", // danger-color
            borderColor: "rgba(239, 68, 68, 1)",
            borderWidth: 1,
          },
        ],
      },
      {
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: {
            stacked: false,
            grid: { display: false },
          },
          y: {
            stacked: false,
            beginAtZero: true, // Ensures a stable baseline for the bars
            grid: {
                color: '#e5e7eb', // gray-200
                borderDash: [2, 4],
            },
            ticks: {
              callback: function (value) {
                // Use compact notation for cleaner y-axis
                return rentalUtils.formatCurrency(value, 'ETB', true);
              },
            },
          },
        },
      }
    );
  };

  const renderIncomeOverviewChart = (incomeData) => {
    const ctx = document.getElementById("incomeOverviewChart").getContext("2d");
    renderChart(ctx, "pie", {
      labels: Object.values(incomeData).map((d) => d.name),
      datasets: [
        {
          label: "Income by Property",
          data: Object.values(incomeData).map((d) => d.totalIncome),
          backgroundColor: [
            '#3b82f6', // blue-500
            '#8b5cf6', // violet-500
            '#10b981', // emerald-500
            '#f97316', // orange-500
            '#ef4444', // red-500
            '#f59e0b', // amber-500
          ],
          hoverOffset: 4,
        },
      ],
    }, {
        plugins: { legend: { display: true } }
    });
  };

  const renderExpenseBreakdownChart = (expenseData) => {
    const ctx = document
      .getElementById("expenseBreakdownChart")
      .getContext("2d");
    renderChart(ctx, "doughnut", {
      labels: Object.keys(expenseData),
      datasets: [
        {
          label: "Expenses by Category",
          data: Object.values(expenseData),
          backgroundColor: [
            '#ef4444', // red-500
            '#f97316', // orange-500
            '#f59e0b', // amber-500
            '#84cc16', // lime-500
            '#22c55e', // green-500
            '#14b8a6', // teal-500
          ],
          hoverOffset: 4,
        },
      ],
    }, {
        plugins: { legend: { display: true } }
    });
  };

  // --- Utility Functions ---
  const populatePropertyFilter = () => {
    allProperties.forEach((prop) => {
      const option = document.createElement("option");
      option.value = prop.id;
      option.textContent = prop.name;
      filterProperty.appendChild(option);
    });
  };

  const setDefaultDateFilters = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(); // Use today as the end date
    filterStart.value = firstDay.toISOString().split("T")[0];
    filterEnd.value = lastDay.toISOString().split("T")[0];
  };

  const populateTable = (tbodyId, data, rowTemplate) => {
    const tbody = document.getElementById(tbodyId);
    tbody.innerHTML = "";
    if (!data || data.length === 0) {
      const colSpan =
        tbody.previousElementSibling.firstElementChild.children.length;
      tbody.innerHTML = `<tr><td colspan="${colSpan}" class="text-center p-4">No data available for the selected period.</td></tr>`;
      return;
    }
    data.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = rowTemplate(row);
      tbody.appendChild(tr);
    });
  };

  const exportToPDF = () => {
    const element = analyticsView;
    const reportFooter = document.getElementById("report-footer");

    // Inject user and date info into the footer for printing
    reportFooter.innerHTML = `
            <p><strong>TIN:</strong> 1234567890</p>
            <p>Report generated by <strong>${
              currentUser.name || "N/A"
            }</strong> on ${new Date().toLocaleString()}</p>
        `;

    const opt = {
      margin: 0.5,
      filename: `Audit_Report_${new Date().toISOString().split("T")[0]}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };
    html2pdf().from(element).set(opt).save();
  };

  initialize();
});
