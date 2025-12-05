import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, create, update, remove } from '../../utils/api';
import { formatDate, formatCurrency, debounce, generateId, readFileAsDataURL } from '../../utils/utils';
import './Leases.css';

// Placeholder for a generic Modal component (to be replaced by a proper UI component later)
const Modal = ({ title, children, onClose, isOpen, maxWidth = '500px' }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content-wrapper" style={{ maxWidth }}>
                <div className="modal-header">
                    <h2 className="modal-title">{title}</h2>
                    <button className="close-modal-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

const Leases = () => {
    const navigate = useNavigate();
    const [leases, setLeases] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [properties, setProperties] = useState([]);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLeaseModalOpen, setIsLeaseModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [currentLease, setCurrentLease] = useState(null);
    const [isRenewal, setIsRenewal] = useState(false);

    const LEASE_KEY = 'leases';
    const TENANT_KEY = 'tenants';
    const PROPERTY_KEY = 'properties';
    const UNIT_KEY = 'units';
    const DOCUMENT_KEY = 'documents'; // Not directly used here, but good to keep in mind
    const PAYMENT_KEY = 'payments'; // For generating payment schedules

    const fetchAllData = useCallback(async () => {
        try {
            setLoading(true);
            const [fetchedLeases, fetchedTenants, fetchedProperties, fetchedUnits] = await Promise.all([
                get(LEASE_KEY),
                get(TENANT_KEY),
                get(PROPERTY_KEY),
                get(UNIT_KEY)
            ]);
            setLeases(fetchedLeases);
            setTenants(fetchedTenants);
            setProperties(fetchedProperties);
            setUnits(fetchedUnits);
        } catch (err) {
            console.error('Failed to fetch data:', err);
            setError('Failed to load data.');
            alert('Failed to load data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const getLeaseStatus = useCallback((lease) => {
        const today = new Date().setHours(0, 0, 0, 0);
        const startDate = new Date(lease.startDate).setHours(0, 0, 0, 0);
        const endDate = new Date(lease.endDate).setHours(0, 0, 0, 0);

        if (today > endDate) {
            return { text: 'Expired', class: 'status-expired' };
        }
        if (today >= startDate && today <= endDate) {
            return { text: 'Active', class: 'status-active' };
        }
        return { text: 'Upcoming', class: 'status-upcoming' };
    }, []);

    const filteredLeases = leases.filter(lease => {
        const tenant = tenants.find(t => t.id === lease.tenantId);
        const unit = units.find(u => u.id === lease.unitId);
        const property = unit ? properties.find(p => p.id === unit.propertyId) : null;
        const searchLower = searchTerm.toLowerCase();
        return (tenant && tenant.name.toLowerCase().includes(searchLower)) ||
               (property && property.name.toLowerCase().includes(searchLower)) ||
               (unit && unit.unitNumber.toLowerCase().includes(searchLower));
    });

    // --- Lease Form Modal Logic ---
    const leaseFormRef = useRef(null);
    const [formTenantId, setFormTenantId] = useState('');
    const [formPropertyId, setFormPropertyId] = useState('');
    const [formUnitId, setFormUnitId] = useState('');
    const [formStartDate, setFormStartDate] = useState('');
    const [formEndDate, setFormEndDate] = useState('');
    const [formRentAmount, setFormRentAmount] = useState('');
    const [formWithholdingAmount, setFormWithholdingAmount] = useState('');
    const [leaseAgreementFile, setLeaseAgreementFile] = useState(null);
    const [withholdingReceiptFile, setWithholdingReceiptFile] = useState(null);
    const [leaseAgreementFileName, setLeaseAgreementFileName] = useState('');
    const [withholdingReceiptFileName, setWithholdingReceiptFileName] = useState('');
    const [availableUnitsForProperty, setAvailableUnitsForProperty] = useState([]);

    const openLeaseModal = useCallback((lease = null, renewal = false) => {
        setCurrentLease(lease);
        setIsRenewal(renewal);
        setFormTenantId(lease?.tenantId || '');
        setFormPropertyId(lease?.unitId ? units.find(u => u.id === lease.unitId)?.propertyId || '' : '');
        setFormUnitId(lease?.unitId || '');
        setFormStartDate(renewal ? (new Date(new Date(lease.endDate).setDate(new Date(lease.endDate).getDate() + 1))).toISOString().split('T')[0] : lease?.startDate || '');
        setFormEndDate(renewal ? (new Date(new Date(lease.endDate).setFullYear(new Date(lease.endDate).getFullYear() + 1))).toISOString().split('T')[0] : lease?.endDate || '');
        setFormRentAmount(lease?.rentAmount || '');
        setFormWithholdingAmount(lease?.withholdingAmount || '');
        setLeaseAgreementFile(null);
        setWithholdingReceiptFile(null);
        setLeaseAgreementFileName(lease?.leaseAgreementName || '');
        setWithholdingReceiptFileName(lease?.withholdingReceiptName || '');
        setIsLeaseModalOpen(true);
    }, [units]);

    useEffect(() => {
        if (formPropertyId) {
            const activeLeaseUnitIds = leases.filter(l => getLeaseStatus(l).text === 'Active' && l.id !== currentLease?.id).map(l => l.unitId);
            const unitsForProperty = units.filter(u => u.propertyId === formPropertyId && !activeLeaseUnitIds.includes(u.id));
            setAvailableUnitsForProperty(unitsForProperty);
        } else {
            setAvailableUnitsForProperty([]);
        }
    }, [formPropertyId, units, leases, currentLease, getLeaseStatus]);

    const handleLeaseFormSubmit = async (e) => {
        e.preventDefault();

        // Basic form validation
        if (!formTenantId || !formPropertyId || !formUnitId || !formStartDate || !formEndDate || !formRentAmount) {
            alert('Please fill in all required fields.');
            return;
        }

        let leaseAgreementUrl = currentLease?.leaseAgreementUrl || null;
        let withholdingReceiptUrl = currentLease?.withholdingReceiptUrl || null;
        let leaseAgreementName = currentLease?.leaseAgreementName || null;
        let withholdingReceiptName = currentLease?.withholdingReceiptName || null;

        if (leaseAgreementFile) {
            leaseAgreementUrl = await readFileAsDataURL(leaseAgreementFile);
            leaseAgreementName = leaseAgreementFile.name;
        }
        if (withholdingReceiptFile) {
            withholdingReceiptUrl = await readFileAsDataURL(withholdingReceiptFile);
            withholdingReceiptName = withholdingReceiptFile.name;
        }

        const leaseData = {
            id: currentLease && !isRenewal ? currentLease.id : generateId(),
            tenantId: formTenantId,
            propertyId: formPropertyId,
            unitId: formUnitId,
            startDate: formStartDate,
            endDate: formEndDate,
            rentAmount: parseFloat(formRentAmount),
            withholdingAmount: parseFloat(formWithholdingAmount) || null,
            leaseAgreementUrl,
            leaseAgreementName,
            withholdingReceiptUrl,
            withholdingReceiptName,
        };

        try {
            if (currentLease && !isRenewal) {
                await update(LEASE_KEY, leaseData.id, leaseData);
                setLeases(leases.map(l => l.id === leaseData.id ? leaseData : l));
                alert('Lease updated successfully!');
            } else {
                await create(LEASE_KEY, leaseData);
                setLeases([...leases, leaseData]);
                alert('Lease created successfully!');
            }

            // Update tenant and unit records (simplified for now, actual logic might be more complex)
            const tenantToUpdate = tenants.find(t => t.id === leaseData.tenantId);
            if (tenantToUpdate) await update(TENANT_KEY, tenantToUpdate.id, { ...tenantToUpdate, unitId: leaseData.unitId });

            const unitToUpdate = units.find(u => u.id === leaseData.unitId);
            if (unitToUpdate) await update(UNIT_KEY, unitToUpdate.id, { ...unitToUpdate, tenantId: leaseData.tenantId });

            // TODO: Generate or update payment schedule for this lease
            // This would involve creating/updating payment records based on leaseData

            setIsLeaseModalOpen(false);
            fetchAllData(); // Re-fetch all data to ensure consistency
        } catch (err) {
            console.error('Failed to save lease:', err);
            alert('Failed to save lease.');
        }
    };

    // --- Lease Details Modal Logic ---
    const openLeaseDetailsModal = useCallback((lease) => {
        setCurrentLease(lease);
        setIsDetailsModalOpen(true);
    }, []);

    const renderDocPreview = (url, name) => {
        if (!url) return <p className="text-sm text-gray-500">Not provided</p>;
        return (
            <a href={url} target="_blank" rel="noopener noreferrer" className="document-preview-sm">
                <i className="fa-solid fa-file-lines fa-2x"></i>
                <p className="text-sm">{name || 'View File'}</p>
            </a>
        );
    };

    // --- Action Handlers ---
    const handleAddLease = () => openLeaseModal();

    const handleEditLease = (leaseId) => {
        const leaseToEdit = leases.find(l => l.id === leaseId);
        if (leaseToEdit) openLeaseModal(leaseToEdit);
    };

    const handleRenewLease = (leaseId) => {
        const leaseToRenew = leases.find(l => l.id === leaseId);
        if (leaseToRenew) openLeaseModal(leaseToRenew, true);
    };

    const handleDeleteLease = async (leaseId) => {
        if (window.confirm('Are you sure you want to delete this lease?')) {
            try {
                await remove(LEASE_KEY, leaseId);
                setLeases(leases.filter(l => l.id !== leaseId));
                alert('Lease deleted successfully!');
                fetchAllData(); // Re-fetch all data to ensure consistency
            } catch (err) {
                console.error('Failed to delete lease:', err);
                alert('Failed to delete lease.');
            }
        }
    };

    const debouncedSearch = useCallback(
        debounce((value) => setSearchTerm(value), 300),
        []
    );

    if (loading) {
        return <div className="loading">Loading leases...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <main id="main-content" className="main-content">
            <div id="leases-view">
                <div className="page-header">
                    <div>
                        <h1>Lease Agreements</h1>
                        <p>Manage all active, expired, and upcoming leases.</p>
                    </div>
                    <button onClick={handleAddLease} className="btn-primary">
                        <i className="fa-solid fa-plus"></i>
                        <span>Add Lease</span>
                    </button>
                </div>

                <div className="data-card">
                    <div className="table-header">
                        <input
                            type="text"
                            id="search-input"
                            className="form-input"
                            placeholder="Search by tenant, property, or unit..."
                            onChange={(e) => debouncedSearch(e.target.value)}
                        />
                    </div>
                    <div className="table-container">
                        {filteredLeases.length > 0 ? (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Tenant</th>
                                        <th>Property / Unit</th>
                                        <th>Lease Period</th>
                                        <th>Withholding</th>
                                        <th>Rent</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="leases-table-body">
                                    {filteredLeases.map(lease => {
                                        const tenant = tenants.find(t => t.id === lease.tenantId);
                                        const unit = units.find(u => u.id === lease.unitId);
                                        const property = unit ? properties.find(p => p.id === unit.propertyId) : null;
                                        const status = getLeaseStatus(lease);
                                        return (
                                            <tr key={lease.id}>
                                                <td>{tenant?.name || 'N/A'}</td>
                                                <td>
                                                    {property?.name || 'N/A'}
                                                    <span className="lease-property-unit"> Unit {unit?.unitNumber || 'N/A'}</span>
                                                </td>
                                                <td>{formatDate(lease.startDate)} - {formatDate(lease.endDate)}</td>
                                                <td>{lease.withholdingAmount ? formatCurrency(lease.withholdingAmount) : 'None'}</td>
                                                <td>{formatCurrency(lease.rentAmount)}</td>
                                                <td><span className={`status-badge ${status.class}`}>{status.text}</span></td>
                                                <td>
                                                    <div className="action-dropdown">
                                                        <button type="button" className="action-dropdown-btn" onClick={() => {
                                                            // Simple dropdown toggle for now, can be improved with a dedicated component
                                                            const dropdown = document.getElementById(`dropdown-${lease.id}`);
                                                            if (dropdown) dropdown.classList.toggle('hidden');
                                                        }}>
                                                            <i className="fa-solid fa-ellipsis-vertical"></i>
                                                        </button>
                                                        <div id={`dropdown-${lease.id}`} className="dropdown-menu hidden">
                                                            <a href="#" className="dropdown-item" onClick={(e) => { e.preventDefault(); openLeaseDetailsModal(lease); }}>
                                                                <i className="fa-solid fa-eye"></i>View Details
                                                            </a>
                                                            <a href="#" className="dropdown-item" onClick={(e) => { e.preventDefault(); handleEditLease(lease.id); }}>
                                                                <i className="fa-solid fa-pencil"></i>Edit
                                                            </a>
                                                            <a href="#" className="dropdown-item" onClick={(e) => { e.preventDefault(); handleRenewLease(lease.id); }}>
                                                                <i className="fa-solid fa-rotate"></i>Renew
                                                            </a>
                                                            <a href="#" className="dropdown-item" onClick={(e) => { e.preventDefault(); handleDeleteLease(lease.id); }}>
                                                                <i className="fa-solid fa-trash-can"></i>Delete
                                                            </a>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <div id="empty-state" className="empty-state">
                                <i className="fa-solid fa-file-signature"></i>
                                <h3>No Leases Found</h3>
                                <p>Get started by adding a new lease agreement.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Lease Add/Edit Modal */}
            <Modal
                title={isRenewal ? 'Renew Lease' : (currentLease ? 'Edit Lease' : 'Add New Lease')}
                isOpen={isLeaseModalOpen}
                onClose={() => setIsLeaseModalOpen(false)}
                maxWidth="700px"
            >
                <form ref={leaseFormRef} onSubmit={handleLeaseFormSubmit}>
                    <input type="hidden" id="lease-id" value={currentLease?.id || ''} />
                    <div className="form-group">
                        <div className="form-label-group">
                            <label htmlFor="lease-tenant" className="form-label">Tenant</label>
                            <a href="/tenants" target="_blank" className="form-label-action">Add New Tenant <i className="fa-solid fa-external-link-alt fa-xs"></i></a>
                        </div>
                        <select
                            id="lease-tenant"
                            className="form-input"
                            value={formTenantId}
                            onChange={(e) => setFormTenantId(e.target.value)}
                            required
                        >
                            <option value="">Select a tenant</option>
                            {tenants.filter(t => {
                                const activeLeaseTenantIds = leases.filter(l => getLeaseStatus(l).text === 'Active' && l.id !== currentLease?.id).map(l => l.tenantId);
                                return !activeLeaseTenantIds.includes(t.id) || t.id === currentLease?.tenantId;
                            }).map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-row-columns">
                        <div className="form-group">
                            <label htmlFor="lease-property" className="form-label">Property</label>
                            <select
                                id="lease-property"
                                className="form-input"
                                value={formPropertyId}
                                onChange={(e) => {
                                    setFormPropertyId(e.target.value);
                                    setFormUnitId(''); // Reset unit when property changes
                                }}
                                required
                            >
                                <option value="">Select a property</option>
                                {properties.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="lease-unit" className="form-label">Unit</label>
                            <select
                                id="lease-unit"
                                className="form-input"
                                value={formUnitId}
                                onChange={(e) => setFormUnitId(e.target.value)}
                                required
                            >
                                <option value="">Select a unit</option>
                                {availableUnitsForProperty.map(u => (
                                    <option key={u.id} value={u.id}>Unit {u.unitNumber}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="form-row-columns">
                        <div className="form-group">
                            <label htmlFor="lease-start-date" className="form-label">Start Date</label>
                            <input
                                type="date"
                                id="lease-start-date"
                                className="form-input"
                                value={formStartDate}
                                onChange={(e) => setFormStartDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="lease-end-date" className="form-label">End Date</label>
                            <input
                                type="date"
                                id="lease-end-date"
                                className="form-input"
                                value={formEndDate}
                                onChange={(e) => setFormEndDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="form-row-columns">
                        <div className="form-group">
                            <label htmlFor="lease-rent" className="form-label">Monthly Rent (ETB)</label>
                            <input
                                type="number"
                                id="lease-rent"
                                className="form-input"
                                value={formRentAmount}
                                onChange={(e) => setFormRentAmount(e.target.value)}
                                required
                                min="0"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="lease-withholding" className="form-label">Withholding Amount (Optional)</label>
                            <input
                                type="number"
                                id="lease-withholding"
                                className="form-input"
                                value={formWithholdingAmount}
                                onChange={(e) => setFormWithholdingAmount(e.target.value)}
                                min="0"
                            />
                        </div>
                    </div>
                    <div className="form-row-columns">
                        <div className="form-group">
                            <label htmlFor="lease-agreement-file" className="form-label">Lease Agreement</label>
                            <input
                                type="file"
                                id="lease-agreement-file"
                                className="form-input"
                                accept="image/*,.pdf"
                                onChange={(e) => setLeaseAgreementFile(e.target.files[0])}
                            />
                            <small className="form-hint" id="lease-agreement-info">
                                {leaseAgreementFile?.name || leaseAgreementFileName || 'Upload PDF or image'}
                            </small>
                        </div>
                        <div className="form-group">
                            <label htmlFor="withholding-receipt-file" className="form-label">Withholding Receipt</label>
                            <input
                                type="file"
                                id="withholding-receipt-file"
                                className="form-input"
                                accept="image/*,.pdf"
                                onChange={(e) => setWithholdingReceiptFile(e.target.files[0])}
                            />
                            <small className="form-hint" id="withholding-receipt-info">
                                {withholdingReceiptFile?.name || withholdingReceiptFileName || 'Upload PDF or image'}
                            </small>
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="button" className="close-modal-btn btn-secondary" onClick={() => setIsLeaseModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn-primary">Save Lease</button>
                    </div>
                </form>
            </Modal>

            {/* Lease Details Modal */}
            <Modal
                title={`Lease Details: ${tenants.find(t => t.id === currentLease?.tenantId)?.name || 'N/A'}`}
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                maxWidth="800px"
            >
                {currentLease && (
                    <div className="lease-details-grid">
                        <div className="detail-section">
                            <h4>Lease & Property</h4>
                            <div className="detail-item"><span>Tenant</span><span>{tenants.find(t => t.id === currentLease.tenantId)?.name || 'N/A'}</span></div>
                            <div className="detail-item"><span>Property</span><span>{properties.find(p => p.id === units.find(u => u.id === currentLease.unitId)?.propertyId)?.name || 'N/A'}</span></div>
                            <div className="detail-item"><span>Unit</span><span>{units.find(u => u.id === currentLease.unitId)?.unitNumber || 'N/A'}</span></div>
                            <div className="detail-item"><span>Period</span><span>{formatDate(currentLease.startDate)} to {formatDate(currentLease.endDate)}</span></div>
                            <div className="detail-item"><span>Status</span><span><span className={`status-badge ${getLeaseStatus(currentLease).class}`}>{getLeaseStatus(currentLease).text}</span></span></div>
                        </div>
                        <div className="detail-section">
                            <h4>Financials</h4>
                            <div className="detail-item"><span>Monthly Rent</span><span>{formatCurrency(currentLease.rentAmount)}</span></div>
                            <div className="detail-item"><span>Withholding</span><span>{currentLease.withholdingAmount ? formatCurrency(currentLease.withholdingAmount) : 'N/A'}</span></div>
                        </div>
                        <div className="detail-section">
                            <h4>Documents</h4>
                            <div className="detail-item">
                                <span>Lease Agreement</span>
                                <span>{renderDocPreview(currentLease.leaseAgreementUrl, currentLease.leaseAgreementName)}</span>
                            </div>
                            <div className="detail-item">
                                <span>Withholding Receipt</span>
                                <span>{renderDocPreview(currentLease.withholdingReceiptUrl, currentLease.withholdingReceiptName)}</span>
                            </div>
                        </div>
                    </div>
                )}
                <div className="form-actions">
                    <button type="button" className="close-modal-btn btn-secondary" onClick={() => setIsDetailsModalOpen(false)}>Close</button>
                </div>
            </Modal>
        </main>
    );
};

export default Leases;
