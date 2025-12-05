import { useEffect, useMemo, useRef, useState } from 'react'
import './Analytics.css'
import Card from '../../components/ui/Card'
import StatsCard from '../../components/ui/StatsCard'
import Button from '../../components/ui/Button'
import { api } from '../../utils/api'

// Lightweight helpers (backup if formatCurrency not available)
const fmtCurrency = (v) => {
  try { return new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(v || 0) } catch { return `ETB ${Number(v||0).toLocaleString()}` }
}

// Analytics data service adapted from legacy analytics.js
class AnalyticsDataService {
  constructor(api, taxCalculator) {
    this.api = api
    this.taxCalculator = taxCalculator
  }
  static getMonthlyProfitLoss(payments, expenses, startDate, endDate) {
    const data = {}
    const labels = []
    let cur = new Date(startDate)
    const end = new Date(endDate)
    while (cur <= end) {
      const key = `${cur.getFullYear()}-${cur.getMonth()}`
      data[key] = { revenue: 0, expenses: 0 }
      labels.push(cur.toLocaleString('default', { month: 'short', year: 'numeric' }))
      cur.setMonth(cur.getMonth() + 1)
    }
    payments.forEach(p => {
      const [y, m] = p.date.split('-').map(Number)
      const key = `${y}-${m-1}`
      if (data[key]) data[key].revenue += p.amount
    })
    expenses.forEach(e => {
      const [y, m] = e.date.split('-').map(Number)
      const key = `${y}-${m-1}`
      if (data[key]) data[key].expenses += e.amount
    })
    return { labels, revenues: Object.values(data).map(d=>d.revenue), expenses: Object.values(data).map(d=>d.expenses) }
  }
  async getReportData(start, end, propertyId) {
    const [payments, expenses, properties, leases, units] = await Promise.all([
      this.api.get('payments'),
      this.api.get('expenses'),
      this.api.get('properties'),
      this.api.get('leases'),
      this.api.get('units'),
    ])

    const unitIds = propertyId !== 'all' ? units.filter(u=>u.propertyId===propertyId).map(u=>u.id) : null
    const leaseIds = unitIds ? leases.filter(l=>unitIds.includes(l.unitId)).map(l=>l.id) : null

    const fp = payments.filter(p => p.status==='Paid' && (!start || p.date>=start) && (!end || p.date<=end) && (propertyId==='all' || (leaseIds && leaseIds.includes(p.leaseId))))
    const fe = expenses.filter(e => (!start || e.date>=start) && (!end || e.date<=end) && (propertyId==='all' || e.propertyId===propertyId))

    const totalRevenue = fp.reduce((s,p)=>s+p.amount,0)
    const totalExpenses = fe.reduce((s,e)=>s+e.amount,0)
    const netProfit = totalRevenue - totalExpenses

    const incomeByProperty = fp.reduce((acc,p)=>{
      const lease = leases.find(l=>l.id===p.leaseId)
      if (!lease) return acc
      const unit = units.find(u=>u.id===lease.unitId)
      if (!unit) return acc
      const prop = properties.find(pr=>pr.id===unit.propertyId)
      if (!prop) return acc
      if (!acc[prop.id]) acc[prop.id] = { name: prop.name, totalIncome: 0, taxType: prop.taxType }
      acc[prop.id].totalIncome += p.amount
      return acc
    }, {})

    const expenseByCategory = fe.reduce((acc,e)=>{ acc[e.category] = (acc[e.category]||0)+e.amount; return acc }, {})

    // naive tax calculator fallback
    const taxData = this.taxCalculator ? this.taxCalculator({ totalRevenue, totalExpenses, paymentsByProperty: incomeByProperty, expenses: fe }) : { vat: { payable: 0 }, businessIncomeTax: { payable: 0 }, withholdingTax: { total: 0 }, totalTaxLiability: 0 }

    const transactions = [
      ...fp.map(p=>({ date: p.date, description: `Rent Payment for Lease ${p.leaseId}`, category: 'Rent', type: 'Income', amount: p.amount, recordedBy: 'System' })),
      ...fe.map(e=>({ date: e.date, description: e.description, category: e.category, type: 'Expense', amount: -e.amount, recordedBy: 'System' })),
    ].sort((a,b)=> new Date(b.date) - new Date(a.date))

    return {
      summary: { totalRevenue, totalExpenses, netProfit, taxData },
      charts: {
        incomeByProperty,
        expenseByCategory,
        profitLoss: AnalyticsDataService.getMonthlyProfitLoss(fp, fe, start, end),
      },
      tables: {
        transactions,
        taxSummary: taxData,
        auditLog: [
          { timestamp: new Date().toISOString(), user: 'admin@test.com', action: 'Generated Report', entity: 'Analytics', details: `Date Range: ${start} to ${end}` },
        ],
      },
    }
  }
}

// Simple table component fallback if DataTable is not available
const SimpleTable = ({ columns, data }) => (
  <div className="table-container">
    <table className="data-table">
      <thead><tr>{columns.map(c=> <th key={c.key || c.header}>{c.header}</th>)}</tr></thead>
      <tbody>
        {data.length===0 ? (
          <tr><td colSpan={columns.length} className="text-center p-4">No data available for the selected period.</td></tr>
        ) : data.map((row, i)=> (
          <tr key={i}>{columns.map(c=> <td key={c.key || c.header}>{c.render ? c.render(row) : row[c.key]}</td>)}</tr>
        ))}
      </tbody>
    </table>
  </div>
)

export default function AnalyticsPage() {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [properties, setProperties] = useState([])
  const [propertyId, setPropertyId] = useState('all')
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState(null)

  // charts (Chart.js optional via CDN in index.html, we will degrade gracefully)
  const profitLossRef = useRef(null)
  const incomeRef = useRef(null)
  const expenseRef = useRef(null)
  const chartsRef = useRef({})

  useEffect(() => {
    // default last 12 months
    const today = new Date()
    const startDate = new Date(today.getFullYear(), today.getMonth()-11, 1)
    const endDate = today
    setStart(startDate.toISOString().split('T')[0])
    setEnd(endDate.toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    // load properties
    (async () => {
      const props = await api.get('properties')
      setProperties(props || [])
    })()
  }, [])

  const generate = async () => {
    setLoading(true)
    try {
      const svc = new AnalyticsDataService(api, null)
      const r = await svc.getReportData(start, end, propertyId)
      setReport(r)
      // render charts if Chart is available
      if (window.Chart) {
        const Chart = window.Chart
        const destroy = (id) => { if (chartsRef.current[id]) { chartsRef.current[id].destroy(); delete chartsRef.current[id] } }
        const ctx1 = profitLossRef.current?.getContext('2d')
        if (ctx1) {
          destroy('pl')
          chartsRef.current['pl'] = new Chart(ctx1, { type: 'bar', data: { labels: r.charts.profitLoss.labels, datasets: [ { label: 'Revenue', data: r.charts.profitLoss.revenues, backgroundColor: 'rgba(16,185,129,0.6)', borderColor: 'rgba(16,185,129,1)', borderWidth: 1 }, { label: 'Expenses', data: r.charts.profitLoss.expenses, backgroundColor: 'rgba(239,68,68,0.6)', borderColor: 'rgba(239,68,68,1)', borderWidth: 1 } ] }, options: { responsive: true, maintainAspectRatio: false } })
        }
        const ctx2 = incomeRef.current?.getContext('2d')
        if (ctx2) {
          destroy('income')
          const labels = Object.values(r.charts.incomeByProperty).map(d=>d.name)
          const data = Object.values(r.charts.incomeByProperty).map(d=>d.totalIncome)
          chartsRef.current['income'] = new Chart(ctx2, { type: 'pie', data: { labels, datasets: [{ data, label: 'Income by Property', backgroundColor: ['#3b82f6','#8b5cf6','#10b981','#f97316','#ef4444','#f59e0b'] }] }, options: { responsive: true, maintainAspectRatio: false } })
        }
        const ctx3 = expenseRef.current?.getContext('2d')
        if (ctx3) {
          destroy('expense')
          const labels = Object.keys(r.charts.expenseByCategory)
          const data = Object.values(r.charts.expenseByCategory)
          chartsRef.current['expense'] = new Chart(ctx3, { type: 'doughnut', data: { labels, datasets: [{ data, label: 'Expenses by Category', backgroundColor: ['#ef4444','#f97316','#f59e0b','#84cc16','#22c55e','#14b8a6'] }] }, options: { responsive: true, maintainAspectRatio: false } })
        }
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (start && end) generate() }, [start, end, propertyId])

  const stats = useMemo(() => {
    if (!report) return { revenue: 0, expenses: 0, profit: 0, tax: 0 }
    return {
      revenue: report.summary.totalRevenue,
      expenses: report.summary.totalExpenses,
      profit: report.summary.netProfit,
      tax: report.summary.taxData.totalTaxLiability || 0,
    }
  }, [report])

  return (
    <div className="analytics-page">
      <div className="page-header">
        <div>
          <h1>Analytics & Reports</h1>
          <p>Visualize your portfolio's financial performance.</p>
        </div>
        <div className="page-actions">
          <Button onClick={() => window.print()} variant="secondary">Export as PDF</Button>
        </div>
      </div>

      <Card className="filter-bar">
        <div className="form-group">
          <label className="form-label" htmlFor="start">Start Date</label>
          <input id="start" type="date" className="form-input" value={start} onChange={e=>setStart(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="end">End Date</label>
          <input id="end" type="date" className="form-input" value={end} onChange={e=>setEnd(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="property">Property</label>
          <select id="property" className="form-input" value={propertyId} onChange={e=>setPropertyId(e.target.value)}>
            <option value="all">All Properties</option>
            {properties.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <Button onClick={generate} disabled={loading}>Generate Report</Button>
      </Card>

      <div className="stats-grid">
        <StatsCard title="Total Revenue" icon="fa-sack-dollar" value={fmtCurrency(stats.revenue)} />
        <StatsCard title="Total Expenses" icon="fa-receipt" value={fmtCurrency(stats.expenses)} />
        <StatsCard title="Net Profit" icon="fa-chart-line" value={fmtCurrency(stats.profit)} />
        <StatsCard title="Estimated Tax" icon="fa-landmark" value={fmtCurrency(stats.tax)} />
      </div>

      <div className="chart-grid">
        <Card className="chart-container"><h3>Monthly Profit & Loss</h3><canvas ref={profitLossRef} /></Card>
        <Card className="chart-container"><h3>Income by Property</h3><canvas ref={incomeRef} /></Card>
        <Card className="chart-container"><h3>Expense Breakdown</h3><canvas ref={expenseRef} /></Card>
      </div>

      <Card>
        <h3>Financial Summary</h3>
        <div className="summary-grid">
          <div className="summary-section">
            <h4>Income Sources</h4>
            <div>
              {report ? Object.values(report.charts.incomeByProperty).map((p)=> (
                <div key={p.name} className="summary-item"><span>{p.name}</span><span>{fmtCurrency(p.totalIncome)}</span></div>
              )) : null}
            </div>
            <div className="summary-total"><span>Total Income</span><span>{fmtCurrency(stats.revenue)}</span></div>
          </div>
          <div className="summary-section">
            <h4>Expense Categories</h4>
            <div>
              {report ? Object.entries(report.charts.expenseByCategory).map(([k,v])=> (
                <div key={k} className="summary-item"><span>{k}</span><span>{fmtCurrency(v)}</span></div>
              )) : null}
            </div>
            <div className="summary-total"><span>Total Expenses</span><span>{fmtCurrency(stats.expenses)}</span></div>
          </div>
          <div className="summary-section">
            <h4>Profitability</h4>
            <div className="summary-item"><span>Net Profit</span><span>{fmtCurrency(stats.profit)}</span></div>
          </div>
          <div className="summary-section">
            <h4>Tax Summary</h4>
            <div>
              <div className="summary-item"><span>VAT Payable</span><span>{fmtCurrency(report?.summary.taxData.vat?.payable || 0)}</span></div>
              <div className="summary-item"><span>Business Income Tax</span><span>{fmtCurrency(report?.summary.taxData.businessIncomeTax?.payable || 0)}</span></div>
              <div className="summary-item"><span>Withholding Tax</span><span>{fmtCurrency(report?.summary.taxData.withholdingTax?.total || 0)}</span></div>
            </div>
            <div className="summary-total"><span>Total Tax Liability</span><span>{fmtCurrency(report?.summary.taxData?.totalTaxLiability || 0)}</span></div>
          </div>
        </div>
      </Card>

      <Card>
        <h3>Transactions</h3>
        <SimpleTable
          columns={[
            { header: 'Date', render: r => new Date(r.date).toLocaleDateString() },
            { header: 'Description', key: 'description' },
            { header: 'Category', key: 'category' },
            { header: 'Type', render: r => <span className={`status-badge ${r.type==='Income' ? 'status-active' : 'status-expired'}`}>{r.type}</span> },
            { header: 'Amount', render: r => <span className={r.amount>0 ? 'text-green' : 'text-red'}>{fmtCurrency(r.amount)}</span> },
            { header: 'Recorded By', key: 'recordedBy' },
          ]}
          data={report?.tables.transactions || []}
        />
      </Card>

      <Card>
        <h3>Tax Summary Table</h3>
        <SimpleTable
          columns={[
            { header: 'Tax Type', key: 'type' },
            { header: 'Amount', render: r => fmtCurrency(r.amount) },
            { header: 'Period', key: 'period' },
            { header: 'Status', render: r => <span className="status-badge status-upcoming">{r.status}</span> },
          ]}
          data={!report ? [] : [
            { type: 'VAT Payable', amount: report.tables.taxSummary.vat?.payable || 0, period: 'Monthly', status: 'Pending' },
            { type: 'Business Income Tax', amount: report.tables.taxSummary.businessIncomeTax?.payable || 0, period: 'Annual', status: 'Estimated' },
            { type: 'Withholding Tax', amount: report.tables.taxSummary.withholdingTax?.total || 0, period: 'As Incurred', status: 'Tracked' },
          ]}
        />
      </Card>

      <Card>
        <h3>Audit Log</h3>
        <SimpleTable
          columns={[
            { header: 'Timestamp', render: r => new Date(r.timestamp).toLocaleString() },
            { header: 'User', key: 'user' },
            { header: 'Action', key: 'action' },
            { header: 'Entity', key: 'entity' },
            { header: 'Details', key: 'details' },
          ]}
          data={report?.tables.auditLog || []}
        />
      </Card>
    </div>
  )
}
