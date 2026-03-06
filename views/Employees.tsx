import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createEmployee, listEmployees, type ApiEmployee } from '../services/api';
import { User } from '../types';
import './Employees.css';

interface EmployeesProps {
  user: User;
}

const Employees: React.FC<EmployeesProps> = ({ user }) => {
  const [searchParams] = useSearchParams();
  const q = (searchParams.get('q') || '').toLowerCase();
  const [filterRole, setFilterRole] = useState('All');
  const [filterStore, setFilterStore] = useState('All Stores');
  const [employees, setEmployees] = useState<ApiEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    role: 'Staff' as ApiEmployee['role'],
    store: 'Main Branch',
    email: '',
    phone: '',
    username: '',
    password: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await listEmployees();
        setEmployees(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load employees');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  useEffect(() => {
    setFilterStore(searchParams.get('store') || 'All Stores');
  }, [searchParams]);

  const roles = ['All', 'Manager', 'Salesman', 'Technician', 'Staff'];
  const stores = useMemo(() => ['All Stores', ...Array.from(new Set(employees.map((e) => e.store || 'Unassigned')))], [employees]);

  const filteredEmployees = employees.filter((e) => {
    const roleOk = filterRole === 'All' || e.role === filterRole;
    const empStore = e.store || 'Unassigned';
    const storeOk = filterStore === 'All Stores' || empStore === filterStore;
    const queryOk = !q || e.name.toLowerCase().includes(q) || (e.email || '').toLowerCase().includes(q) || (e.phone || '').includes(q);
    return roleOk && storeOk && queryOk;
  });

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Employee name is required.');
      return;
    }
    if (formData.username.trim() && !formData.password) {
      setFormError('Password is required when username is provided.');
      return;
    }

    try {
      setCreating(true);
      const created = await createEmployee({
        name: formData.name.trim(),
        role: formData.role,
        store: formData.store.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        ...(formData.username.trim() ? { username: formData.username.trim(), password: formData.password } : {}),
        sales_count: 0,
        join_date: new Date().toISOString().slice(0, 10),
      });
      setEmployees((prev) => [created, ...prev]);
      setFormData({
        name: '',
        role: 'Staff',
        store: 'Main Branch',
        email: '',
        phone: '',
        username: '',
        password: '',
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to create employee');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="employees-container">
      <div className="employees-header">
        <h1>Employee Management</h1>
      </div>

      {user.role === 'Admin' && (
        <form onSubmit={handleAddEmployee} className="card" style={{ marginBottom: 16, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Add Employee Credentials</h3>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <input className="form-input" placeholder="Name *" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} />
            <select className="form-input" value={formData.role} onChange={(e) => setFormData((p) => ({ ...p, role: e.target.value as ApiEmployee['role'] }))}>
              <option value="Manager">Manager</option>
              <option value="Salesman">Salesman</option>
              <option value="Technician">Technician</option>
              <option value="Staff">Staff</option>
            </select>
            <input className="form-input" placeholder="Store" value={formData.store} onChange={(e) => setFormData((p) => ({ ...p, store: e.target.value }))} />
            <input className="form-input" placeholder="Email" value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} />
            <input className="form-input" placeholder="Phone" value={formData.phone} onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))} />
            <input className="form-input" placeholder="Username (login)" value={formData.username} onChange={(e) => setFormData((p) => ({ ...p, username: e.target.value }))} />
            <input type="password" className="form-input" placeholder="Password (login)" value={formData.password} onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))} />
          </div>
          {formError && <p style={{ color: 'var(--color-error-600)', margin: '8px 0 0' }}>{formError}</p>}
          <button className="btn btn-primary" type="submit" style={{ marginTop: 12 }} disabled={creating}>
            {creating ? 'Creating...' : '+ Add Employee'}
          </button>
        </form>
      )}

      {user.role !== 'Admin' && (
        <p style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>
          Employee credentials can only be created by Admin.
        </p>
      )}

      {loading && <p>Loading employees...</p>}
      {error && <p style={{ color: 'var(--color-error-600)' }}>{error}</p>}

      <div className="filter-section" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div className="role-filter">
          {roles.map((role) => (
            <button key={role} className={`filter-btn ${filterRole === role ? 'active' : ''}`} onClick={() => setFilterRole(role)}>
              {role}
            </button>
          ))}
        </div>
        <select value={filterStore} onChange={(e) => setFilterStore(e.target.value)} className="form-input" style={{ maxWidth: 220 }}>
          {stores.map((store) => <option key={store} value={store}>{store}</option>)}
        </select>
      </div>

      <div className="table-wrapper">
        <table className="employees-table">
          <thead><tr><th>Name</th><th>Role</th><th>Store</th><th>Login</th><th>Email</th><th>Phone</th><th>Sales/Tickets</th><th>Join Date</th></tr></thead>
          <tbody>
            {filteredEmployees.map((emp) => (
              <tr key={emp.id}>
                <td className="name-cell"><div className="avatar">{emp.name.charAt(0)}</div><div className="name-info"><strong>{emp.name}</strong><span className="emp-id">EMP{String(emp.id).padStart(4, '0')}</span></div></td>
                <td><span className="role-badge">{emp.role}</span></td>
                <td>{emp.store || 'Unassigned'}</td>
                <td>{emp.login_username || '-'}</td>
                <td className="email-cell">{emp.email || '-'}</td>
                <td className="phone-cell">{emp.phone || '-'}</td>
                <td className="sales-cell"><strong>{emp.sales_count}</strong></td>
                <td className="date-cell">{emp.join_date || '-'}</td>
              </tr>
            ))}
            {!loading && filteredEmployees.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 16 }}>No employees found</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="stats-section">
        <div className="stat-card"><h4>Total Employees</h4><p className="stat-value">{employees.length}</p></div>
        <div className="stat-card"><h4>Managers</h4><p className="stat-value">{employees.filter((e) => e.role === 'Manager').length}</p></div>
        <div className="stat-card"><h4>Salesmen</h4><p className="stat-value">{employees.filter((e) => e.role === 'Salesman').length}</p></div>
        <div className="stat-card"><h4>Technicians</h4><p className="stat-value">{employees.filter((e) => e.role === 'Technician').length}</p></div>
      </div>
    </div>
  );
};

export default Employees;
