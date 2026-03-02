import React, { useState } from 'react';
import './Employees.css';

const Employees: React.FC = () => {
  const [filterRole, setFilterRole] = useState('All');

  const employees = [
    { id: 'EMP001', name: 'Raj Kumar', role: 'Manager', store: 'Main Branch', email: 'raj@qualitymobiles.com', phone: '9876543210', sales: 156, joinDate: '2023-01-15' },
    { id: 'EMP002', name: 'Priya Singh', role: 'Salesman', store: 'Main Branch', email: 'priya@qualitymobiles.com', phone: '9876543211', sales: 124, joinDate: '2023-03-20' },
    { id: 'EMP003', name: 'Anil Patel', role: 'Technician', store: 'Branch 2', email: 'anil@qualitymobiles.com', phone: '9876543212', sales: 45, joinDate: '2023-05-10' },
    { id: 'EMP004', name: 'Deepak Sharma', role: 'Salesman', store: 'Branch 3', email: 'deepak@qualitymobiles.com', phone: '9876543213', sales: 98, joinDate: '2023-06-01' },
    { id: 'EMP005', name: 'Neha Verma', role: 'Manager', store: 'Branch 2', email: 'neha@qualitymobiles.com', phone: '9876543214', sales: 112, joinDate: '2023-02-28' },
  ];

  const roles = ['All', 'Manager', 'Salesman', 'Technician'];

  const filteredEmployees = filterRole === 'All' ? employees : employees.filter(e => e.role === filterRole);

  return (
    <div className="employees-container">
      <div className="employees-header">
        <h1>👥 Employee Management</h1>
        <button className="btn btn-primary">+ Add Employee</button>
      </div>

      {/* Filter Section */}
      <div className="filter-section">
        <div className="role-filter">
          {roles.map(role => (
            <button
              key={role}
              className={`filter-btn ${filterRole === role ? 'active' : ''}`}
              onClick={() => setFilterRole(role)}
            >
              {role} ({filterRole === role ? filteredEmployees.length : employees.filter(e => e.role === role || role === 'All').length})
            </button>
          ))}
        </div>
      </div>

      {/* Employees Table */}
      <div className="table-wrapper">
        <table className="employees-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Store</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Sales/Tickets</th>
              <th>Join Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map(emp => (
              <tr key={emp.id}>
                <td className="name-cell">
                  <div className="avatar">{emp.name.charAt(0)}</div>
                  <div className="name-info">
                    <strong>{emp.name}</strong>
                    <span className="emp-id">{emp.id}</span>
                  </div>
                </td>
                <td><span className="role-badge">{emp.role}</span></td>
                <td>{emp.store}</td>
                <td className="email-cell">{emp.email}</td>
                <td className="phone-cell">{emp.phone}</td>
                <td className="sales-cell"><strong>{emp.sales}</strong></td>
                <td className="date-cell">{emp.joinDate}</td>
                <td className="actions-cell">
                  <button className="action-btn" title="Edit">✏️</button>
                  <button className="action-btn" title="View">👁️</button>
                  <button className="action-btn danger" title="Remove">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      <div className="stats-section">
        <div className="stat-card">
          <h4>Total Employees</h4>
          <p className="stat-value">{employees.length}</p>
        </div>
        <div className="stat-card">
          <h4>Managers</h4>
          <p className="stat-value">{employees.filter(e => e.role === 'Manager').length}</p>
        </div>
        <div className="stat-card">
          <h4>Salesmen</h4>
          <p className="stat-value">{employees.filter(e => e.role === 'Salesman').length}</p>
        </div>
        <div className="stat-card">
          <h4>Technicians</h4>
          <p className="stat-value">{employees.filter(e => e.role === 'Technician').length}</p>
        </div>
      </div>
    </div>
  );
};

export default Employees;
