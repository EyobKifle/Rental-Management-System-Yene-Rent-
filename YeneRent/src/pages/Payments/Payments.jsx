import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../utils/api';
import { formatCurrency, formatDate, getPaymentStatus, debounce } from '../../utils/utils';
import Card from '../../components/ui/Card';
import StatsCard from '../../components/ui/StatsCard';
import Button from '../../components/ui/Button';
import './Payments.css';

const SimpleTable = ({ headers, data, renderRow }) => (
    <div className="table-container">
        <table className="data-table">
            <thead>
                <tr>
                    {headers.map((header) => <th key={header}>{header}</th>)}
                </tr>
            </thead>
            <tbody>
                {data.map(renderRow)}
            </tbody>
        </table>
    </div>
);

const Payments = () => {
    const [payments, setPayments] = useState([]);
    const [leases, setLeases] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [properties, setProperties] = useState([]);
    const [units, setUnits] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [paymentsData, leasesData, tenantsData, propertiesData, unitsData] = await Promise.all([
                    api.get('payments'),
                    api.get('leases'),
                    api.get('tenants'),
                    api.get('properties'),
                    api.get('units'),
                ]);
                setPayments(paymentsData);
                setLeases(leasesData);
                setTenants(tenantsData);
                setProperties(propertiesData);
                setUnits(unitsData);
            } catch (error) {
                console.error("Failed to fetch payments data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const enrichedPayments = useMemo(() => {
        return payments.map(payment => {
            const lease = leases.find(l => l.id === payment.leaseId);
            const tenant = lease ? tenants.find(t => t.id === lease.tenantId) : null;
            const property = lease ? properties.find(p => p.id === lease.propertyId) : null;
            const unit = lease ? units.find(u => u.id === lease.unitId) : null;
            const status = getPaymentStatus(payment);
            return { ...payment, tenant, property, unit, status };
        }).sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
    }, [payments, leases, tenants, properties, units]);

    const filteredPayments = useMemo(() => {
        if (!searchTerm) return enrichedPayments;
        const lowercasedFilter = searchTerm.toLowerCase();
        return enrichedPayments.filter(p =>
            p.tenant?.name.toLowerCase().includes(lowercasedFilter) ||
            p.property?.name.toLowerCase().includes(lowercasedFilter)
        );
    }, [enrichedPayments, searchTerm]);

    const stats = useMemo(() => {
        const totalCollected = payments
            .filter(p => p.status === 'Paid')
            .reduce((sum, p) => sum + p.amount, 0);

        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthCollected = payments
            .filter(p => p.status === 'Paid' && new Date(p.date) >= firstDayOfMonth)
            .reduce((sum, p) => sum + p.amount, 0);

        const overduePayments = enrichedPayments.filter(p => p.status.text === 'Overdue');
        const overdueAmount = overduePayments.reduce((sum, p) => sum + p.amount, 0);

        return {
            totalCollected,
            thisMonthCollected,
            overdueAmount,
            overdueCount: overduePayments.length,
        };
    }, [payments, enrichedPayments]);

    const handleSearch = debounce((event) => {
        setSearchTerm(event.target.value);
    }, 300);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div id="payments-view">
            <div className="page-header">
                <div>
                    <h1>Payment Schedule</h1>
                    <p>Track all scheduled, paid, and overdue rent payments.</p>
                </div>
                <Button className="btn-primary">
                    <i className="fa-solid fa-plus"></i>
                    Record Payment
                </Button>
            </div>

            <div className="stats-grid">
                <StatsCard title="Total Collected" value={formatCurrency(stats.totalCollected)} />
                <StatsCard title="This Month" value={formatCurrency(stats.thisMonthCollected)} />
                <StatsCard title="Total Overdue Amount" value={formatCurrency(stats.overdueAmount)} />
                <StatsCard title="Overdue Payments" value={stats.overdueCount} />
            </div>

            <Card>
                <div className="table-header">
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Search by tenant or property..."
                        onChange={handleSearch}
                    />
                </div>
                {filteredPayments.length > 0 ? (
                    <SimpleTable
                        headers={['Tenant', 'Property / Unit', 'Due Date', 'Amount', 'Status', 'Actions']}
                        data={filteredPayments}
                        renderRow={(payment) => (
                            <tr key={payment.id}>
                                <td>{payment.tenant?.name || 'N/A'}</td>
                                <td>{`${payment.property?.name || 'N/A'} ${payment.unit ? `(Unit ${payment.unit.unitNumber})` : ''}`}</td>
                                <td>{formatDate(payment.dueDate)}</td>
                                <td>{formatCurrency(payment.amount)}</td>
                                <td><span className={`status-badge ${payment.status.class}`}>{payment.status.text}</span></td>
                                <td>
                                    <div className="action-dropdown">
                                        <button className="action-dropdown-btn"><i className="fa-solid fa-ellipsis-vertical"></i></button>
                                        {/* Dropdown menu would be implemented here */}
                                    </div>
                                </td>
                            </tr>
                        )}
                    />
                ) : (
                    <div className="empty-state">
                        <i className="fa-solid fa-receipt"></i>
                        <h3>No Payments Found</h3>
                        <p>Get started by recording a new payment.</p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default Payments;