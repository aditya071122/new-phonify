import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { User, KpiData, OperationalFeedItem } from '../types';
import './Dashboard.css';

interface DashboardProps {
  user: User;
}


// --- Base Mock Data ---
const recentSalesData = [
    { id: '#JOB2024001', customer: 'Rajesh Kumar', amount: 35000, store: 'Main Branch', salesman: 'Ahmed Hassan', time: '2:15 PM', status: 'Completed' },
    { id: '#JOB2024002', customer: 'Priya Sharma', amount: 8500, store: 'Branch 2', salesman: 'Neha Singh', time: '2:45 PM', status: 'Completed' },
    { id: '#JOB2024003', customer: 'Arjun Patel', amount: 42000, store: 'Main Branch', salesman: 'Vikram Reddy', time: '3:20 PM', status: 'Completed' },
    { id: '#JOB2024004', customer: 'Meera Chopra', amount: 12000, store: 'Branch 3', salesman: 'Suresh Kumar', time: '3:50 PM', status: 'Pending' },
    { id: '#JOB2024005', customer: 'Suresh Iyer', amount: 11500, store: 'Branch 2', salesman: 'Neha Singh', time: '4:10 PM', status: 'Completed' },
];
  
const inventoryAlertsData = [
    { product: 'iPhone 15 Pro (Black)', stock: 2, min: 5, store: 'Main Branch', status: 'Critical' },
    { product: 'Samsung Galaxy A14 (Blue)', stock: 4, min: 8, store: 'Branch 2', status: 'Low' },
    { product: 'Tempered Glass (Universal)', stock: 15, min: 20, store: 'Main Branch', status: 'Monitor' },
    { product: 'USB-C Cable', stock: 3, min: 5, store: 'Branch 3', status: 'Low' },
];

const storeMap: { [key: string]: string } = {
  main: 'Main Branch',
  b2: 'Branch 2',
  b3: 'Branch 3',
};

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [storeFilter, setStoreFilter] = useState('all');

  const textColor = '#626C7C'; // text-secondary
  const gridColor = '#5E5240'; // secondary

  // KPI Data
  const kpiData: KpiData[] = [
    {
      label: "Today's Revenue",
      value: '₹45,320',
      trend: 12.5,
      trendDirection: 'up',
      icon: '💵',
      color: '#10b981',
      bgLight: '#d1fae5',
    },
    {
      label: 'Monthly Revenue',
      value: '₹8,54,200',
      trend: 8.2,
      trendDirection: 'up',
      icon: '📊',
      color: '#2878b5',
      bgLight: '#d9eaf5',
    },
    {
      label: 'Pending Repairs',
      value: '24',
      trend: -2.1,
      trendDirection: 'down',
      icon: '🔧',
      color: '#f59e0b',
      bgLight: '#fef3c7',
    },
    {
      label: 'Low Stock Items',
      value: '8',
      trend: 0,
      trendDirection: 'stable',
      icon: '📦',
      color: '#ef4444',
      bgLight: '#fee2e2',
    },
    {
      label: 'Buyback Inventory',
      value: '₹2,34,000',
      trend: 5.3,
      trendDirection: 'up',
      icon: '🔄',
      color: '#3b82f6',
      bgLight: '#dbeafe',
    },
    {
      label: 'Outstanding Receivables',
      value: '₹1,28,500',
      trend: 3.1,
      trendDirection: 'up',
      icon: '💰',
      color: '#8b5cf6',
      bgLight: '#ede9fe',
    },
  ];

  // Sales Trend Data
  const salesTrendData = [
    { date: 'Mon', revenue: 12400, transactions: 24 },
    { date: 'Tue', revenue: 13210, transactions: 28 },
    { date: 'Wed', revenue: 11290, transactions: 22 },
    { date: 'Thu', revenue: 15640, transactions: 31 },
    { date: 'Fri', revenue: 18490, transactions: 36 },
    { date: 'Sat', revenue: 22100, transactions: 42 },
    { date: 'Sun', revenue: 14080, transactions: 28 },
  ];

  // Store Comparison Data
  const storeComparisonData = [
    { store: 'Main Branch', revenue: 245000, target: 300000 },
    { store: 'Branch 2', revenue: 168000, target: 200000 },
    { store: 'Branch 3', revenue: 142000, target: 180000 },
  ];

  // Revenue Breakdown
  const revenueBreakdownData = [
    { name: 'New Phones', value: 45, color: '#3284c8' },
    { name: 'Accessories', value: 25, color: '#14b8a6' },
    { name: 'Used Phones', value: 20, color: '#f59e0b' },
    { name: 'Services', value: 10, color: '#10b981' },
  ];

  // Top Employees
  const topEmployees = [
    { id: 1, name: 'Rajesh Kumar', role: 'Sales Executive', sales: 127, revenue: 285000, rating: 4.8 },
    { id: 2, name: 'Priya Singh', role: 'Sales Manager', sales: 94, revenue: 215000, rating: 4.6 },
    { id: 3, name: 'Amit Patel', role: 'Technician', sales: 0, revenue: 0, rating: 4.9 },
    { id: 4, name: 'Neha Sharma', role: 'Sales Executive', sales: 78, revenue: 185000, rating: 4.5 },
  ];

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Critical': return 'text-error bg-error/10 border border-error/20';
      case 'Low': return 'text-warning bg-warning/10 border border-warning/20';
      default: return 'text-text-secondary bg-secondary/10';
    }
  };

  return (
    <div className="dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Welcome back, {user.name} 👋</p>
        </div>

        <div className="header-controls">
          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            className="store-filter"
          >
            <option value="all">All Stores</option>
            <option value="main">Main Branch</option>
            <option value="b2">Branch 2</option>
            <option value="b3">Branch 3</option>
          </select>

          <button className="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 17v6h16v-6M16 2v8M12 8v2M8 8v2"></path>
            </svg>
            Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        {kpiData.map((kpi, idx) => (
          <div key={idx} className="kpi-card">
            <div className="kpi-header">
              <div className="kpi-icon" style={{ backgroundColor: kpi.bgLight }}>
                <span>{kpi.icon}</span>
              </div>
              <div className={`kpi-trend ${kpi.trendDirection}`}>
                {kpi.trendDirection === 'up' && <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polyline points="23 6 13.46 15.54 8 10.09 1 17"></polyline><polyline points="23 6 23 16 13 16"></polyline></svg>}
                {kpi.trendDirection === 'down' && <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polyline points="23 18 13.46 8.46 8 13.91 1 7"></polyline><polyline points="23 18 23 8 13 8"></polyline></svg>}
                {kpi.trendDirection === 'stable' && <span>→</span>}
                <span>{Math.abs(kpi.trend || 0)}%</span>
              </div>
            </div>

            <div className="kpi-content">
              <p className="kpi-label">{kpi.label}</p>
              <h3 className="kpi-value">{kpi.value}</h3>
            </div>

            <div className="kpi-sparkline">
              <ResponsiveContainer width="100%" height={40}>
                <LineChart data={[{ v: 10 }, { v: 12 }, { v: 9 }, { v: 14 }, { v: 11 }]}>
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke={kpi.color}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* Sales Trend */}
        <div className="chart-card chart-lg">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Sales Trend</h3>
              <p className="chart-subtitle">Revenue & Transaction Count</p>
            </div>
            <button className="btn btn-secondary btn-sm">This Week</button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="date" stroke="var(--text-tertiary)" />
              <YAxis stroke="var(--text-tertiary)" />
              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', border: `1px solid var(--border-color)` }} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#2878b5" name="Revenue (₹)" strokeWidth={2} />
              <Line type="monotone" dataKey="transactions" stroke="#14b8a6" name="Transactions" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Store Comparison */}
        <div className="chart-card chart-md">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Store Performance</h3>
              <p className="chart-subtitle">Revenue vs Target</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={storeComparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="store" stroke="var(--text-tertiary)" />
              <YAxis stroke="var(--text-tertiary)" />
              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', border: `1px solid var(--border-color)` }} />
              <Legend />
              <Bar dataKey="revenue" fill="#2878b5" name="Actual Revenue" />
              <Bar dataKey="target" fill="#cbd5e1" name="Target" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Breakdown */}
        <div className="chart-card chart-md">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Revenue Mix</h3>
              <p className="chart-subtitle">By Category</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={revenueBreakdownData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {revenueBreakdownData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', border: `1px solid var(--border-color)` }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pie-legend">
            {revenueBreakdownData.map((item, idx) => (
              <div key={idx} className="pie-legend-item">
                <div className="pie-color" style={{ backgroundColor: item.color }}></div>
                <span>{item.name}</span>
                <span className="pie-value">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section - Employees & Feed */}
      <div className="bottom-section">
        {/* Top Employees */}
        <div className="list-card">
          <div className="card-header">
            <h3 className="card-title">Top Performers</h3>
            <a href="#" className="view-all">View All →</a>
          </div>
          <table className="performance-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Role</th>
                <th>Sales</th>
                <th>Revenue</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {topEmployees.map(emp => (
                <tr key={emp.id}>
                  <td className="emp-cell">
                    <div className="emp-avatar">{emp.name.charAt(0)}</div>
                    <span>{emp.name}</span>
                  </td>
                  <td>{emp.role}</td>
                  <td className="number">{emp.sales}</td>
                  <td className="number">₹{emp.revenue.toLocaleString()}</td>
                  <td>
                    <span className="rating">
                      ⭐ {emp.rating}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Sales Table */}
        <div className="list-card">
          <div className="card-header">
            <h3 className="card-title">Recent Sales</h3>
            <a href="#" className="view-all">View All →</a>
          </div>
          <table className="sales-table">
            <thead>
              <tr>
                <th>Job #</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Store</th>
                <th>Salesman</th>
                <th>status</th>
              </tr>
            </thead>
            <tbody>
              {recentSalesData.map(sale => (
                <tr key={sale.id}>
                  <td className="job-id">{sale.id}</td>
                  <td>{sale.customer}</td>
                  <td className="amount">₹{sale.amount.toLocaleString()}</td>
                  <td>{sale.store}</td>
                  <td>{sale.salesman}</td>
                  <td>
                    <span className={`status-badge ${sale.status.toLowerCase()}`}>
                      {sale.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;