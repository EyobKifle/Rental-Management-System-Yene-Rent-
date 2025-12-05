import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import PageHeader from '../../components/shared/PageHeader';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import SearchBar from '../../components/shared/SearchBar';
import EmptyState from '../../components/shared/EmptyState';
import { LanguageContext } from '../../contexts/LanguageContext';
import { api } from '../../utils/api';
import { formatEthiopianDate } from '../../utils/ethiopianDate';
import './Payments.css';

const Payments = () => {
  const navigate = useNavigate();
  const { t } = useContext(LanguageContext);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalReceived: 0,
    pendingPayments: 0,
    overduePayments: 0,
    monthlyRevenue: 0
  });

  useEffect(() => {
    loadPayments();
    loadStats();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/payments');
      setPayments(response.data);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/payments/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error loading payment stats:', error);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const filteredPayments = payments.filter(payment =>
    payment.tenantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.propertyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.amount?.toString().includes(searchTerm)
  );

  const handleRowClick = (payment) => {
    navigate(`/payments/${payment.id}`);
  };

  const handleEdit = (payment) => {
    navigate(`/payments/${payment.id}/edit`);
  };

  const handleDelete = async (payment) => {
    if (window.confirm(t('confirmDeletePayment'))) {
      try {
        await api.delete(`/payments/${payment.id}`);
        loadPayments();
        loadStats();
      } catch (error) {
        console.error('Error deleting payment:', error);
        alert(t('errorDeletingPayment'));
      }
    }
  };

  const columns = [
    {
      key: 'tenantName',
      header: t('tenant'),
      sortable: true,
      render: (value) => <span className="font-medium">{value}</span>
    },
    {
      key: 'propertyName',
      header: t('property'),
      sortable: true
    },
    {
      key: 'amount',
      header: t('amount'),
      sortable: true,
      render: (value) => `ETB ${value?.toLocaleString()}`
    },
    {
      key: 'dueDate',
      header: t('dueDate'),
      sortable: true,
      render: (value) => formatEthiopianDate(value)
    },
    {
      key: 'paymentDate',
      header: t('paymentDate'),
      sortable: true,
      render: (value) => value ? formatEthiopianDate(value) : '-'
    },
    {
      key: 'status',
      header: t('status'),
      sortable: true,
      render: (value) => (
        <span className={`status-badge status-${value?.toLowerCase()}`}>
          {t(value?.toLowerCase())}
        </span>
      )
    },
    {
      key: 'actions',
      header: t('actions'),
      render: (_, payment) => (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(payment);
            }}
          >
            {t('edit')}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(payment);
            }}
          >
            {t('delete')}
          </Button>
        </div>
      )
    }
  ];

  const statsCards = [
    {
      title: t('totalReceived'),
      value: `ETB ${stats.totalReceived?.toLocaleString()}`,
      icon: 'fas fa-money-bill-wave',
      color: 'success'
    },
    {
      title: t('pendingPayments'),
      value: stats.pendingPayments,
      icon: 'fas fa-clock',
      color: 'warning'
    },
    {
      title: t('overduePayments'),
      value: stats.overduePayments,
      icon: 'fas fa-exclamation-triangle',
      color: 'danger'
    },
    {
      title: t('monthlyRevenue'),
      value: `ETB ${stats.monthlyRevenue?.toLocaleString()}`,
      icon: 'fas fa-chart-line',
      color: 'info'
    }
  ];

  return (
    <div className="payments-page">
      <PageHeader
        title={t('payments')}
        subtitle={t('managePayments')}
        actions={
          <Button
            variant="primary"
            onClick={() => navigate('/payments/new')}
          >
            <i className="fas fa-plus mr-2"></i>
            {t('addPayment')}
          </Button>
        }
      />

      <div className="payments-stats">
        {statsCards.map((stat, index) => (
          <Card key={index} className="stats-card">
            <div className="stats-card-content">
              <div className="stats-icon" style={{ backgroundColor: `var(--${stat.color}-color)` }}>
                <i className={stat.icon}></i>
              </div>
              <div className="stats-info">
                <div className="stats-value">{stat.value}</div>
                <div className="stats-title">{stat.title}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="payments-filters">
          <SearchBar
            placeholder={t('searchPayments')}
            onSearch={handleSearch}
            onSubmit={handleSearch}
          />
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>{t('loadingPayments')}</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <EmptyState
            icon="fas fa-money-bill-wave"
            title={t('noPaymentsFound')}
            description={searchTerm ? t('tryDifferentSearch') : t('noPaymentsYet')}
            actions={
              <Button
                variant="primary"
                onClick={() => navigate('/payments/new')}
              >
                <i className="fas fa-plus mr-2"></i>
                {t('addFirstPayment')}
              </Button>
            }
          />
        ) : (
          <DataTable
            columns={columns}
            data={filteredPayments}
            onRowClick={handleRowClick}
            searchable={false}
            sortable={true}
            paginated={true}
            pageSize={10}
          />
        )}
      </Card>
    </div>
  );
};

export default Payments;
