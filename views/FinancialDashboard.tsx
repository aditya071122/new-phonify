import React, { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './FinancialDashboard.css';

const FinancialDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('Month');

  const cashflowData = [
    { month: 'Jan', revenue: 450000, expenses: 280000, profit: 170000 },
    { month: 'Feb', revenue: 520000, expenses: 310000, profit: 210000 },
    { month: 'Mar', revenue: 610000, expenses: 350000, profit: 260000 },
    { month: 'Apr', revenue: 480000, expenses: 290000, profit: 190000 },
    { month: 'May', revenue: 750000, expenses: 420000, profit: 330000 },
    { month: 'Jun', revenue: 890000, expenses: 480000, profit: 410000 },
  ];

  const receivablesData = [
    { range: 'Current', amount: 450000, count: 12, days: '0-30' },
    { range: '30-60 Days', amount: 180000, count: 5, days: '31-60' },
    { range: '60-90 Days', amount: 95000, count: 2, days: '61-90' },
    { range: '90+ Days', amount: 45000, count: 1, days: '90+' },
  ];

  const payablesData = [
    { range: 'Current', amount: 280000, count: 8, days: '0-30' },
    { range: '30-60 Days', amount: 120000, count: 3, days: '31-60' },
    { range: '60-90 Days', amount: 55000, count: 1, days: '61-90' },
    { range: '90+ Days', amount: 25000, count: 0, days: '90+' },
  ];

  const storeProfit = [
    { name: 'Main Branch', revenue: 1200000, target: 1000000, profit: 480000 },
    { name: 'Branch 2', revenue: 580000, target: 650000, profit: 232000 },
    { name: 'Branch 3', revenue: 420000, target: 500000, profit: 168000 },
  ];

  const kpis = [
    { label: 'Monthly Revenue', value: '₹50,44,000', trend: '+12.5%', bg: 'linear-gradient(135deg, var(--primary) 0%, #1e40af 100%)' },
    { label: 'Monthly Expenses', value: '₹28,50,000', trend: '+3.2%', bg: 'linear-gradient(135deg, var(--warning) 0%, #f97316 100%)' },
    { label: 'Net Profit', value: '₹21,94,000', trend: '+18.3%', bg: 'linear-gradient(135deg, var(--success) 0%, #059669 100%)' },
    { label: 'Outstanding Receivables', value: '₹7,70,000', trend: '-2.1%', bg: 'linear-gradient(135deg, var(--teal) 0%, #0f766e 100%)' },
  ];

  return (
    <div className="financial-container">
      <div className="financial-header">
        <h1>💰 Financial Dashboard</h1>
        <div className="time-selector">
          {['Day', 'Week', 'Month', 'Quarter', 'Year'].map(range => (
            <button
              key={range}
              className={`time-btn ${timeRange === range ? 'active' : ''}`}
              onClick={() => setTimeRange(range)}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        {kpis.map((kpi, i) => (
          <div key={i} className="kpi-card-fin" style={{ background: kpi.bg }}>
            <div className="kpi-content">
              <p className="kpi-label">{kpi.label}</p>
              <h2 className="kpi-value">{kpi.value}</h2>
              <span className="kpi-trend">{kpi.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Cashflow Chart */}
        <div className="chart-card chart-lg">
          <div className="chart-header">
            <h3>Cash Flow Trend</h3>
            <span className="chart-info">Last 6 months</span>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={cashflowData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--warning)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--warning)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="month" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} />
              <Legend />
              <Area type="monotone" dataKey="revenue" stroke="var(--primary)" fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
              <Area type="monotone" dataKey="expenses" stroke="var(--warning)" fillOpacity={1} fill="url(#colorExpenses)" name="Expenses" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Store Profitability */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Store Profitability</h3>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={storeProfit}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="name" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} />
              <Legend />
              <Bar dataKey="revenue" fill="var(--primary)" name="Revenue" />
              <Bar dataKey="profit" fill="var(--success)" name="Profit" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Receivables & Payables */}
      <div className="aging-grid">
        {/* Receivables Aging */}
        <div className="aging-card">
          <h3>📊 Receivables Aging</h3>
          <table className="aging-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Amount</th>
                <th>Invoices</th>
              </tr>
            </thead>
            <tbody>
              {receivablesData.map((item, i) => (
                <tr key={i}>
                  <td className="period-cell">{item.range}</td>
                  <td className="amount-cell">₹{item.amount.toLocaleString()}</td>
                  <td className="count-cell badge">{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="total-row">
            <strong>Total Receivables</strong>
            <strong>₹{receivablesData.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}</strong>
          </div>
        </div>

        {/* Payables Aging */}
        <div className="aging-card">
          <h3>💳 Payables Aging</h3>
          <table className="aging-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Amount</th>
                <th>Bills</th>
              </tr>
            </thead>
            <tbody>
              {payablesData.map((item, i) => (
                <tr key={i}>
                  <td className="period-cell">{item.range}</td>
                  <td className="amount-cell">₹{item.amount.toLocaleString()}</td>
                  <td className="count-cell badge">{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="total-row">
            <strong>Total Payables</strong>
            <strong>₹{payablesData.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;
