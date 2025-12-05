import { useEffect, useMemo, useState } from 'react'
import './Documents.css'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { api } from '../../utils/api'

const formatBytes = (bytes) => {
  if (!bytes || bytes <= 0) return '0 B'
  const sizes = ['B','KB','MB','GB','TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

const getFileIcon = (mime) => {
  if (!mime) return { icon: 'fa-solid fa-file', className: 'icon-other' }
  if (mime.startsWith('image/')) return { icon: 'fa-solid fa-file-image', className: 'icon-image' }
  if (mime === 'application/pdf') return { icon: 'fa-solid fa-file-pdf', className: 'icon-pdf' }
  if (mime.includes('wordprocessingml')) return { icon: 'fa-solid fa-file-word', className: 'icon-doc' }
  return { icon: 'fa-solid fa-file', className: 'icon-other' }
}

export default function DocumentsPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [documents, setDocuments] = useState([])
  const [properties, setProperties] = useState([])
  const [tenants, setTenants] = useState([])

  useEffect(() => {
    (async () => {
      const [docs, props, tens] = await Promise.all([
        api.get('documents'), api.get('properties'), api.get('tenants')
      ])
      setDocuments(docs || [])
      setProperties(props || [])
      setTenants(tens || [])
    })()
  }, [])

  const filtered = useMemo(() => {
    const s = search.toLowerCase()
    return (documents || []).filter(d => {
      const matchesCategory = category === 'all' || d.category === category
      const matchesSearch = (d.name || '').toLowerCase().includes(s) || (d.category || '').toLowerCase().includes(s)
      return matchesCategory && matchesSearch
    })
  }, [documents, search, category])

  const linkedTo = (doc) => {
    if (doc.propertyId) {
      const p = properties.find(x => x.id === doc.propertyId)
      return p?.name || 'Property'
    }
    if (doc.tenantId) {
      const t = tenants.find(x => x.id === doc.tenantId)
      return t?.name || 'Tenant'
    }
    return 'General'
  }

  return (
    <div className="documents-page">
      <div className="page-header">
        <div>
          <h1>Documents</h1>
          <p>Manage all your important documents in one place.</p>
        </div>
        <Button variant="primary" onClick={() => alert('Implement upload modal in app shared components')}>
          <i className="fa-solid fa-upload"></i>
          <span>Upload Document</span>
        </Button>
      </div>

      <Card>
        <div className="table-header">
          <input type="text" className="form-input" placeholder="Search by document name..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div className="filter-nav">
          {[
            { key: 'all', label: 'All Agreements' },
            { key: 'Lease Agreement', label: 'Lease Agreements' },
            { key: 'Payment Receipt', label: 'Receipts' },
            { key: 'Tax Document', label: 'Tax Documents' },
            { key: 'Other', label: 'Others' },
          ].map(f => (
            <button key={f.key} className={`filter-btn ${category===f.key ? 'active' : ''}`} onClick={() => setCategory(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Linked To</th>
                <th>Size</th>
                <th>Upload Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center p-4">No Documents Found</td></tr>
              ) : filtered.map(doc => {
                const { icon, className } = getFileIcon(doc.type)
                return (
                  <tr key={doc.id}>
                    <td>
                      <div className="document-name-cell">
                        <i className={`${icon} ${className}`}></i>
                        <span>{doc.name}</span>
                      </div>
                    </td>
                    <td>{doc.category}</td>
                    <td>{linkedTo(doc)}</td>
                    <td>{formatBytes(doc.size)}</td>
                    <td>{doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString() : '-'}</td>
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

      {filtered.length === 0 && (
        <div className="empty-state">
          <i className="fa-solid fa-folder-open"></i>
          <h3>No Documents Found</h3>
          <p>Get started by uploading a new document.</p>
        </div>
      )}
    </div>
  )
}
