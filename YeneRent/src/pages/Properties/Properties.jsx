import { useEffect, useMemo, useState } from 'react'
import './Properties.css'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import api from '../../utils/api'

export default function PropertiesPage() {
  const [search, setSearch] = useState('')
  const [properties, setProperties] = useState([])

  useEffect(() => {
    (async () => {
      const ps = await api.get('properties')
      setProperties(ps || [])
    })()
  }, [])

  const filtered = useMemo(() => {
    const s = search.toLowerCase()
    return (properties || []).filter(p =>
      (p.name || '').toLowerCase().includes(s) || (p.address || '').toLowerCase().includes(s)
    )
  }, [properties, search])

  if (loading) {
    return (
      <div className="properties-page">
        <div className="page-header">
          <div>
            <h1>Properties</h1>
            <p>Loading properties...</p>
          </div>
        </div>
        <div className="empty-state">
          <i className="fa-solid fa-spinner fa-spin"></i>
          <h3>Loading...</h3>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="properties-page">
        <div className="page-header">
          <div>
            <h1>Properties</h1>
            <p>View and manage all your properties</p>
          </div>
        </div>
        <div className="empty-state">
          <i className="fa-solid fa-exclamation-triangle"></i>
          <h3>Error</h3>
          <p>{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="properties-page">
      <div className="page-header">
        <div>
          <h1>Properties</h1>
          <p>View and manage all your properties</p>
        </div>
        <Button variant="primary" onClick={() => alert('Implement property modal in app shared components')}>
          <i className="fa-solid fa-plus"></i>
          <span>Add Property</span>
        </Button>
      </div>

      <div className="search-container">
        <i className="fa-solid fa-search"></i>
        <input type="text" id="search-input" placeholder="Search by name or address..." className="form-input" value={search} onChange={e=>setSearch(e.target.value)} />
      </div>

      <div id="property-list">
        {filtered.length === 0 ? (
          <div id="empty-state" className="empty-state">
            <i className="fa-solid fa-building"></i>
            <h3>{properties.length>0 ? 'No properties match your search.' : 'No properties found'}</h3>
            <p>Get started by adding a new property.</p>
          </div>
        ) : (
          filtered.map(prop => {
            const taxTypeMap = {
              'property-only': 'Property Tax',
              'withholding-annual': 'Withholding + Annual',
              'withholding-property': 'Withholding + Property',
              'all-taxes': 'All Taxes',
            }
            const taxTypeText = taxTypeMap[prop.taxType] || 'Not Set'
            return (
              <div key={prop.id} className="data-card property-card" data-id={prop.id}>
                <div className="property-image-container">
                  {prop.image ? (
                    <img src={prop.image} alt={prop.name} className="property-image" />
                  ) : (
                    <div className="property-placeholder">
                      <i className="fa-solid fa-building"></i>
                      <span>No image</span>
                    </div>
                  )}
                </div>
                <div className="property-content">
                  <h3>{prop.name}</h3>
                  <p><i className="fa-solid fa-map-pin"></i> {prop.address}</p>
                  <div className="property-details">
                    <span>Total Units: {prop.units || 0}</span>
                    <span className="tax-info"><i className="fa-solid fa-landmark"></i> {taxTypeText}</span>
                  </div>
                </div>
                <div className="property-card-details">
                  <div>
                    <span>Default Monthly Rent</span>
                    <span>ETB {(prop.rent||0).toLocaleString()}</span>
                  </div>
                </div>
                <div className="action-dropdown">
                  <Button variant="secondary" size="small" onClick={() => alert('Implement edit property modal')}>Edit</Button>
                  <a href="/units" className="btn btn-secondary" style={{ marginLeft: '0.5rem' }}>View Units</a>
                  <Button variant="error" size="small" style={{ marginLeft: '0.5rem' }} onClick={() => alert('Implement delete property flow')}>Delete</Button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
