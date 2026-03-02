import React, { useState } from 'react';
import './Customers.css';

const Customers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const customers = [
    { id: 'CUST001', name: 'Mohit Verma', phone: '9876543210', email: 'mohit@example.com', store: 'Main Branch', totalSpent: 125000, purchases: 8, lastVisit: '2024-03-02' },
    { id: 'CUST002', name: 'Anjali Gupta', phone: '9876543211', email: 'anjali@example.com', store: 'Branch 2', totalSpent: 85000, purchases: 5, lastVisit: '2024-02-28' },
    { id: 'CUST003', name: 'Vikram Singh', phone: '9876543212', email: 'vikram@example.com', store: 'Main Branch', totalSpent: 250000, purchases: 15, lastVisit: '2024-03-01' },
    { id: 'CUST004', name: 'Priya Sharma', phone: '9876543213', email: 'priya@example.com', store: 'Branch 3', totalSpent: 45000, purchases: 3, lastVisit: '2024-02-25' },
    { id: 'CUST005', name: 'Arjun Patel', phone: '9876543214', email: 'arjun@example.com', store: 'Main Branch', totalSpent: 180000, purchases: 12, lastVisit: '2024-03-02' },
  ];

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.id.includes(searchTerm)
  );

  const getTierBadge = (spent: number) => {
    if (spent >= 200000) return { label: 'Gold', color: '#f59e0b' };
    if (spent >= 100000) return { label: 'Silver', color: '#8b5cf6' };
    if (spent >= 50000) return { label: 'Bronze', color: '#ea580c' };
    return { label: 'Regular', color: '#6b7280' };
  };

  return (
    <div className="customers-container">
      <div className="customers-header">
        <h1>🧑‍💼 Customer Management</h1>
        <button className="btn btn-primary">+ Add Customer</button>
      </div>

      {/* Search Section */}
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

      {/* Customers Table */}
      <div className="table-wrapper">
        <table className="customers-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Store</th>
              <th>Tier</th>
              <th>Total Spent</th>
              <th>Purchases</th>
              <th>Last Visit</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map(customer => {
              const tier = getTierBadge(customer.totalSpent);
              return (
                <tr key={customer.id}>
                  <td className="name-cell">
                    <div className="avatar">{customer.name.charAt(0)}</div>
                    <div className="name-info">
                      <strong>{customer.name}</strong>
                      <span className="cust-id">{customer.id}</span>
                    </div>
                  </td>
                  <td className="phone-cell">{customer.phone}</td>
                  <td className="email-cell">{customer.email}</td>
                  <td className="store-cell">{customer.store}</td>
                  <td>
                    <span className="tier-badge" style={{ borderColor: tier.color }}>
                      {tier.label}
                    </span>
                  </td>
                  <td className="amount-cell">₹{customer.totalSpent.toLocaleString()}</td>
                  <td className="count-cell"><strong>{customer.purchases}</strong></td>
                  <td className="date-cell">{customer.lastVisit}</td>
                  <td className="actions-cell">
                    <button className="action-btn" title="View Profile">👁️</button>
                    <button className="action-btn" title="Transaction History">📜</button>
                    <button className="action-btn" title="Send Message">💬</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      <div className="summary-cards">
        <div className="summary-card">
          <h4>Total Customers</h4>
          <p className="value">{customers.length}</p>
          <span className="subtitle">Active customers</span>
        </div>
        <div className="summary-card">
          <h4>Gold Tier</h4>
          <p className="value">{customers.filter(c => c.totalSpent >= 200000).length}</p>
          <span className="subtitle">High value</span>
        </div>
        <div className="summary-card">
          <h4>Total Revenue</h4>
          <p className="value">₹{(customers.reduce((sum, c) => sum + c.totalSpent, 0) / 100000).toFixed(1)}L</p>
          <span className="subtitle">From customers</span>
        </div>
        <div className="summary-card">
          <h4>Avg. Spent</h4>
          <p className="value">₹{Math.round(customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length).toLocaleString()}</p>
          <span className="subtitle">Per customer</span>
        </div>
      </div>
    </div>
  );
};

export default Customers;
