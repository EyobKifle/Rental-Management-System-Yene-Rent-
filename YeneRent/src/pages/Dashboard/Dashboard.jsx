import { useEffect, useMemo, useState } from 'react'
import './Dashboard.css'
import Card from '../../components/ui/Card'
import StatsCard from '../../components/ui/StatsCard'
import Button from '../../components/ui/Button'
import { api } from '../../utils/api'

const fmtCurrency = (v) => {
  try { return new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(v || 0) } catch { return `ETB ${Number(v||0).toLocaleString()}` }
}

export default function DashboardPage() {
  const [properties, setProperties] = useState([])
  const [tenants, setTenants] = useState([])
  const [payments, setPayments] = useState([])

  useEffect(() => {
    (async () => {
      const [props, tens, pays] = await Promise.all([
        api.get('properties'),
        api.get('tenants'),
        api.get('payments'),
      ])
      setProperties(props || [])
      setTenants(tens || [])
      setPayments(pays || [])
    })()
  }, [])

  const stats = useMemo(() => {
    const totalProperties = properties.length
    const totalTenants = tenants.length
    const monthlyRevenue = properties.reduce((sum, p) => sum + (p.rent || 0), 0)
    const outstanding = payments.reduce((sum, p) => sum + (p.status === 'Unpaid' ? p.amount : 0), 0)
    return { totalProperties, totalTenants, monthlyRevenue, outstanding }
  }, [properties, tenants, payments])

  const recentActivity = useMemo(() => {
    const sorted = [...tenants].sort((a,b)=> new Date(b.moveInDate) - new Date(a.moveInDate))
    return sorted.slice(0,3)
  }, [tenants])

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back, here's your rental overview.</p>
      </div>

      <div className="stats-grid">
        <Card className="data-card"><p>Total Properties</p><h2>{stats.totalProperties}</h2></Card>
        <Card className="data-card"><p>Active Tenants</p><h2>{stats.totalTenants}</h2></Card>
        <Card className="data-card"><p>Monthly Revenue</p><h2 className="text-green">{fmtCurrency(stats.monthlyRevenue)}</h2></Card>
        <Card className="data-card"><p>Outstanding Balance</p><h2 className="text-red">{fmtCurrency(stats.outstanding)}</h2></Card>
      </div>

      <div className="activity-grid">
        <Card className="activity-card">
          <h3 className="data-card-header">Recent Activity</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr><th>Activity</th><th>Tenant</th><th>Date</th></tr>
              </thead>
              <tbody>
                {recentActivity.length === 0 ? (
                  <tr><td colSpan={3} className="text-center p-4">No recent activity.</td></tr>
                ) : recentActivity.map(t => (
                  <tr key={t.id}>
                    <td>New Tenant Added</td>
                    <td>{t.name}</td>
                    <td>{new Date(t.moveInDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="quick-actions-card">
          <h3>Quick Actions</h3>
          <div className="quick-actions">
            <a href="/properties#add" className="action-link"><i className="fa-solid fa-plus"></i><span>Add Property</span></a>
            <a href="/tenants#add" className="action-link"><i className="fa-solid fa-user-plus"></i><span>Add Tenant</span></a>
            <a href="/payments#record" className="action-link"><i className="fa-solid fa-money-bill-wave"></i><span>Record Payment</span></a>
          </div>
        </Card>
      </div>
    </div>
  )
}
