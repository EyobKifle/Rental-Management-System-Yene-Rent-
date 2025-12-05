import { useEffect, useMemo, useState } from 'react'
import './Tenants.css'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { api } from '../../utils/api'

export default function TenantsPage() {
  const [search, setSearch] = useState('')
  const [tenants, setTenants] = useState([])
  const [properties, setProperties] = useState([])
  const [units, setUnits] = useState([])
  const [leases, setLeases] = useState([])

  useEffect(() => {
    (async () => {
      const [ts, ps, us, ls] = await Promise.all([
        api.get('tenants'), api.get('properties'), api.get('units'), api.get('leases')
      ])
      setTenants(ts || [])
      setProperties(ps || [])
      setUnits(us || [])
      setLeases(ls || [])
    })()
  }, [])

  const getLeaseStatus = (lease) => {
    if (!lease) return { text: 'No Lease', class: 'status-expired' }
    const today = new Date().setHours(0,0,0,0)
    const start = new Date(lease.startDate || Date.now()).setHours(0,0,0,0)
    const end = new Date(lease.endDate || Date.now()).setHours(0,0,0,0)
    if (today > end) return { text: 'Expired', class: 'status-expired' }
    if (today >= start && today <= end) return { text: 'Active', class: 'status-active' }
    return { text: 'Upcoming', class: 'status-upcoming' }
  }

  const filtered = useMemo(() => {
    const s = search.toLowerCase()
    return tenants.filter(t => {
      const unit = units.find(u => u.id === t.unitId)
      const prop = unit ? properties.find(p => p.id === unit.propertyId) : null
      return (t.name||'').toLowerCase().includes(s) || (t.email||'').toLowerCase().includes(s) || (prop?.name||'').toLowerCase().includes(s)
    })
  }, [search, tenants, units, properties])

  return (
    <div className="tenants-page">
      <div className="page-header">
        <div>
          <h1>Tenants</h1>
          <p>Manage all tenants across your properties.</p>
        </div>
        <Button variant="primary" onClick={() => alert('Implement modal in app shared components')}> <i className="fa-solid fa-plus"></i> <span>Add Tenant</span></Button>
      </div>

      <Card>
        <div className="table-header">
          <input type="text" className="form-input" placeholder="Search by name, email, or property..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Property / Unit</th>
                <th>Lease Period</th>
                <th>TIN Number</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center p-4">No Tenants Found</td></tr>
              ) : filtered.map(t => {
                const unit = units.find(u=>u.id===t.unitId)
                const prop = unit ? properties.find(p=>p.id===unit.propertyId) : null
                const lease = leases.find(l=>l.tenantId===t.id) || null
                const status = getLeaseStatus(lease)
                return (
                  <tr key={t.id}>
                    <td>{t.name}</td>
                    <td>{t.email}<br/><span className="text-sm text-gray-500">{t.phone}</span></td>
                    <td>{prop?.name || 'N/A'} <span className="lease-property-unit">Unit {unit?.unitNumber || 'N/A'}</span></td>
                    <td>{lease ? `${new Date(lease.startDate).toLocaleDateString()} - ${new Date(lease.endDate).toLocaleDateString()}` : 'N/A'}</td>
                    <td>{t.tinNumber || 'N/A'}</td>
                    <td><span className={`status-badge ${status.class}`}>{status.text}</span></td>
                    <td>
                      <div className="action-dropdown">
                        <button className="action-dropdown-btn"><i className="fa-solid fa-ellipsis-vertical"></i></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
