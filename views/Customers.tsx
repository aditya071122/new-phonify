import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createCustomer, listCustomers, listSales, type ApiCustomer, type ApiSale } from '../services/api';
import { User } from '../types';
import './Customers.css';

type CustomerWithStats = ApiCustomer & {
  totalSpent: number;
  purchases: number;
  lastVisit: string;
};

interface CustomersProps {
  user: User;
}

const Customers: React.FC<CustomersProps> = ({ user }) => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const [sales, setSales] = useState<ApiSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const [customerData, salesData] = await Promise.all([listCustomers(), listSales()]);
        setCustomers(customerData);
        setSales(salesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load customers');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  useEffect(() => {
    setSearchTerm(searchParams.get('q') || '');
  }, [searchParams]);

  const customerStats = useMemo<CustomerWithStats[]>(() => {
    return customers.map((customer) => {
      const customerSales = sales.filter((sale) => sale.customer === customer.id);
      const totalSpent = customerSales.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0);
      const lastVisit = customerSales.length > 0
        ? customerSales[0].sold_at.slice(0, 10)
        : customer.created_at.slice(0, 10);

      return {
        ...customer,
        totalSpent,
        purchases: customerSales.length,
        lastVisit,
      };
    });
  }, [customers, sales]);

  const filteredCustomers = customerStats.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    String(c.id).includes(searchTerm)
  );

  const getTierBadge = (spent: number) => {
    if (spent >= 200000) return { label: 'Gold', color: '#f59e0b' };
    if (spent >= 100000) return { label: 'Silver', color: '#8b5cf6' };
    if (spent >= 50000) return { label: 'Bronze', color: '#ea580c' };
    return { label: 'Regular', color: '#6b7280' };
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!formData.name.trim()) {
      setFormError('Customer name is required.');
      return;
    }

    try {
      setCreating(true);
      const created = await createCustomer({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
      });
      setCustomers((prev) => [created, ...prev]);
      setFormData({ name: '', phone: '', email: '' });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to create customer');
    } finally {
      setCreating(false);
    }
  };

  const totalRevenue = customerStats.reduce((sum, c) => sum + c.totalSpent, 0);

  return (
    <div className="customers-container">
      <div className="customers-header">
        <h1>Customer Management</h1>
      </div>

      {user.role === 'Admin' && (
        <form onSubmit={handleAddCustomer} className="card" style={{ marginBottom: 16, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Add Customer</h3>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <input className="form-input" placeholder="Customer Name *" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} />
            <input className="form-input" placeholder="Phone" value={formData.phone} onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))} />
            <input className="form-input" placeholder="Email" value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} />
          </div>
          {formError && <p style={{ color: 'var(--color-error-600)', margin: '8px 0 0' }}>{formError}</p>}
          <button className="btn btn-primary" type="submit" style={{ marginTop: 12 }} disabled={creating}>
            {creating ? 'Creating...' : '+ Add Customer'}
          </button>
        </form>
      )}

      {user.role !== 'Admin' && (
        <p style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>
          Customers can only be added by Admin.
        </p>
      )}

      {loading && <p>Loading customers...</p>}
      {error && <p style={{ color: 'var(--color-error-600)' }}>{error}</p>}

      <div className="search-section">
        <input
          type="text"
          placeholder="Search by name, phone, or customer ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <span className="search-count">{filteredCustomers.length} results</span>
      </div>

      <div className="table-wrapper">
        <table className="customers-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Tier</th>
              <th>Total Spent</th>
              <th>Purchases</th>
              <th>Last Visit</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer) => {
              const tier = getTierBadge(customer.totalSpent);
              return (
                <tr key={customer.id}>
                  <td className="name-cell">
                    <div className="avatar">{customer.name.charAt(0)}</div>
                    <div className="name-info">
                      <strong>{customer.name}</strong>
                      <span className="cust-id">CUST{String(customer.id).padStart(4, '0')}</span>
                    </div>
                  </td>
                  <td className="phone-cell">{customer.phone || '-'}</td>
                  <td className="email-cell">{customer.email || '-'}</td>
                  <td>
                    <span className="tier-badge" style={{ borderColor: tier.color }}>
                      {tier.label}
                    </span>
                  </td>
                  <td className="amount-cell">Rs {customer.totalSpent.toLocaleString()}</td>
                  <td className="count-cell"><strong>{customer.purchases}</strong></td>
                  <td className="date-cell">{customer.lastVisit}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <h4>Total Customers</h4>
          <p className="value">{customerStats.length}</p>
          <span className="subtitle">Active customers</span>
        </div>
        <div className="summary-card">
          <h4>Gold Tier</h4>
          <p className="value">{customerStats.filter((c) => c.totalSpent >= 200000).length}</p>
          <span className="subtitle">High value</span>
        </div>
        <div className="summary-card">
          <h4>Total Revenue</h4>
          <p className="value">Rs {(totalRevenue / 100000).toFixed(1)}L</p>
          <span className="subtitle">From customers</span>
        </div>
        <div className="summary-card">
          <h4>Avg. Spent</h4>
          <p className="value">Rs {customerStats.length ? Math.round(totalRevenue / customerStats.length).toLocaleString() : 0}</p>
          <span className="subtitle">Per customer</span>
        </div>
      </div>
    </div>
  );
};

export default Customers;
