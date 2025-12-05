import { useEffect, useMemo, useState } from 'react'
import './Units.css'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { api } from '../../utils/api'

const fmtCurrency = (v) => {
  try { return new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(v || 0) } catch { return `ETB ${Number(v||0).toLocaleString()}` }
}

export default function UnitsPage() {
  const [propertyId, setPropertyId] = useState('prop-1')
  const [properties, setProperties] = useState([])
  const [units, setUnits] = useState([])
  const [tenants, setTenants] = useState([])

  useEffect(() => {
    (async () => {
      const [ps, us, ts] = await Promise.all([
        api.get('properties'), api.get('units'), api.get('tenants')
      ])
      setProperties(ps || [])
      setUnits(us || [])
      setTenants(ts || [])
      if (ps && ps.length > 0) setPropertyId(ps[0].id)
    })()
  }, [])

  const currentProperty = useMemo(() => properties.find(p => p.id === propertyId) || null, [properties, propertyId])
  const propertyUnits = useMemo(() => units.filter(u => u.propertyId === propertyId), [units, propertyId])

  return (
    <div className="units-page">
      <div className="page-header">
        <div>
          <h1 id="property-name-header">{currentProperty ? `Units for ${currentProperty.name}` : 'Units'}</h1>
          <p id="property-address-subheader">{currentProperty?.address || 'Manage units for the selected property.'}</p>
        </div>
        <div className="header-actions">
          <a href="/properties" className="btn-secondary"><i className="fa-solid fa-arrow-left"></i><span>Back to Properties</span></a>
          <Button variant="primary" onClick={() => alert('Implement unit modal in app shared components') }><i className="fa-solid fa-plus"></i><span>Add Unit</span></Button>
        </div>
      </div>

      <Card>
        <div className="form-group">
          <label className="form-label" htmlFor="prop">Property</label>
          <select id="prop" className="form-input" value={propertyId} onChange={e=>setPropertyId(e.target.value)}>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </Card>

      <div id="unit-list" className="unit-grid">
        {propertyUnits.length === 0 ? (
          <div id="empty-state" className="empty-state"><i className="fa-solid fa-door-open"></i><h3>No Units Found</h3><p>Get started by adding a new unit to this property.</p></div>
        ) : (
          propertyUnits.map(u => {
            const tenant = tenants.find(t => t.id === u.tenantId)
            return (
              <div key={u.id} className="unit-card" data-id={u.id}>
                <div className="unit-card-header">
                  <h3>Unit {u.unitNumber}</h3>
                  <span className={`status-badge ${tenant ? 'status-occupied' : 'status-vacant'}`}>{tenant ? 'Occupied' : 'Vacant'}</span>
                </div>
                <div className="unit-card-details">
                  <div><span>Tenant</span><span>{tenant?.name || 'N/A'}</span></div>
                  <div><span>Rent</span><span>{fmtCurrency(u.rent)}</span></div>
                  <div><span>Bedrooms / Bathrooms</span><span>{u.bedrooms || 0} / {u.bathrooms || 0}</span></div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
