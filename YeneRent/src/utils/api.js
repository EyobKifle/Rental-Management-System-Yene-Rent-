// Minimal API utility to support Analytics page
// In a real setup, replace with real HTTP calls.

const mock = {
  properties: [
    { id: 'prop-1', name: 'Sunset Apartments', address: '123 Sunshine St, Addis Ababa', taxType: 'standard', rent: 8000 },
    { id: 'prop-2', name: 'Hilltop Condos', address: '456 Hill Rd, Addis Ababa', taxType: 'standard', rent: 9000 },
  ],
  tenants: [
    { id: 'ten-1', name: 'Abel Tesfaye', moveInDate: new Date(new Date().setMonth(new Date().getMonth()-1)).toISOString().slice(0,10) },
    { id: 'ten-2', name: 'Lulit Bekele', moveInDate: new Date(new Date().setMonth(new Date().getMonth()-2)).toISOString().slice(0,10) },
    { id: 'ten-3', name: 'Samuel Girma', moveInDate: new Date(new Date().setMonth(new Date().getMonth()-3)).toISOString().slice(0,10) },
  ],
  units: [
    { id: 'unit-1', propertyId: 'prop-1', unitNumber: '101', rent: 8000, bedrooms: 2, bathrooms: 1, tenantId: 'ten-1' },
    { id: 'unit-2', propertyId: 'prop-1', unitNumber: '102', rent: 7500, bedrooms: 2, bathrooms: 2, tenantId: null },
    { id: 'unit-3', propertyId: 'prop-2', unitNumber: '201', rent: 9000, bedrooms: 3, bathrooms: 2, tenantId: 'ten-2' },
  ],
  leases: [
    { id: 'lease-1', unitId: 'unit-1', tenantId: 'ten-1', startDate: new Date(new Date().setMonth(new Date().getMonth()-2)).toISOString().slice(0,10), endDate: new Date(new Date().setMonth(new Date().getMonth()+10)).toISOString().slice(0,10) },
    { id: 'lease-2', unitId: 'unit-2', tenantId: null, startDate: null, endDate: null },
    { id: 'lease-3', unitId: 'unit-3', tenantId: 'ten-2', startDate: new Date(new Date().setMonth(new Date().getMonth()-6)).toISOString().slice(0,10), endDate: new Date(new Date().setMonth(new Date().getMonth()+6)).toISOString().slice(0,10) },
  ],
  payments: Array.from({ length: 12 }).flatMap((_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (11 - i))
    const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-10`
    return [
      { id: `p-${i}-1`, leaseId: 'lease-1', date: iso, amount: 8000, status: 'Paid' },
      { id: `p-${i}-2`, leaseId: 'lease-2', date: iso, amount: 7500, status: 'Paid' },
      { id: `p-${i}-3`, leaseId: 'lease-3', date: iso, amount: 9000, status: 'Paid' },
    ]
  }),
  expenses: Array.from({ length: 12 }).map((_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (11 - i))
    const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-15`
    const cats = ['Maintenance', 'Utilities', 'Taxes']
    return { id: `e-${i}`, propertyId: i%2===0 ? 'prop-1' : 'prop-2', date: iso, category: cats[i%cats.length], description: `${cats[i%cats.length]} expense`, amount: 3000 + (i%3)*500 }
  }),
}

export const api = {
  async get(resource) {
    // simulate latency
    await new Promise(r => setTimeout(r, 50))
    const data = mock[resource]
    if (!data) return []
    return JSON.parse(JSON.stringify(data))
  }
}
