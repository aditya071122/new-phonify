import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User } from '../types';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  downloadBriefReportCSV,
  listBuybacks,
  listProducts,
  listRepairs,
  listSales,
  listStores,
  type ApiBuyback,
  type ApiProduct,
  type ApiRepairTicket,
  type ApiSale,
  type ApiStore
} from '../services/api';
import './FinancialDashboard.css';

const monthLabel = (iso: string) => new Date(iso).toLocaleString('en-US', { month: 'short' });

const inRange = (dateIso: string, timeRange: string): boolean => {
  const now = new Date();
  const d = new Date(dateIso);
  const msDay = 24 * 60 * 60 * 1000;
  const diffDays = (now.getTime() - d.getTime()) / msDay;

  if (timeRange === 'Day') return diffDays <= 1;
  if (timeRange === 'Week') return diffDays <= 7;
  if (timeRange === 'Month') return diffDays <= 31;
  if (timeRange === 'Quarter') return diffDays <= 92;
  return diffDays <= 366;
};

const storeFromSale = (sale: ApiSale): string => {
  const noteMatch = sale.notes?.match(/store=([^|]+)/i);
  return noteMatch?.[1]?.trim() || 'Main Branch';
};

const FinancialDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [searchParams] = useSearchParams();
  const globalStore = searchParams.get('store') || 'All Stores';

  const [timeRange, setTimeRange] = useState('Month');
  const [stores, setStores] = useState<ApiStore[]>([]);
  const [sales, setSales] = useState<ApiSale[]>([]);
  const [buybacks, setBuybacks] = useState<ApiBuyback[]>([]);
  const [repairs, setRepairs] = useState<ApiRepairTicket[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportMode, setReportMode] = useState<'days' | 'month'>('month');
  const [reportFrom, setReportFrom] = useState(new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)).toISOString().slice(0, 10));
  const [reportTo, setReportTo] = useState(new Date().toISOString().slice(0, 10));
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const [st, s, b, r, p] = await Promise.all([listStores(), listSales(), listBuybacks(), listRepairs(), listProducts()]);
        setStores(st);
        setSales(s);
        setBuybacks(b);
        setRepairs(r);
        setProducts(p);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load financial reports');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const selectedStoreId = useMemo(() => stores.find((s) => s.name === globalStore)?.id, [stores, globalStore]);

  const salesByStore = useMemo(() => {
    if (globalStore === 'All Stores') return sales;
    return sales.filter((s) => (s.store_ref ? s.store_ref === selectedStoreId : storeFromSale(s) === globalStore));
  }, [sales, globalStore, selectedStoreId]);

  const buybacksByStore = useMemo(() => {
    if (globalStore === 'All Stores') return buybacks;
    if (!selectedStoreId) return buybacks;
    return buybacks.filter((b) => b.store_ref === selectedStoreId);
  }, [buybacks, globalStore, selectedStoreId]);

  const repairsByStore = useMemo(() => {
    if (globalStore === 'All Stores') return repairs;
    if (!selectedStoreId) return repairs;
    return repairs.filter((r) => r.store_ref === selectedStoreId);
  }, [repairs, globalStore, selectedStoreId]);

  const filteredSales = useMemo(() => salesByStore.filter((s) => inRange(s.sold_at, timeRange)), [salesByStore, timeRange]);
  const filteredBuybacks = useMemo(() => buybacksByStore.filter((b) => inRange(b.created_at, timeRange)), [buybacksByStore, timeRange]);
  const filteredRepairs = useMemo(() => repairsByStore.filter((r) => inRange(r.created_at, timeRange)), [repairsByStore, timeRange]);

  const cashflowData = useMemo(() => {
    const months = new Map<string, { month: string; revenue: number; expenses: number; profit: number }>();
    filteredSales.forEach((sale) => {
      const key = new Date(sale.sold_at).toISOString().slice(0, 7);
      const prev = months.get(key) || { month: monthLabel(sale.sold_at), revenue: 0, expenses: 0, profit: 0 };
      prev.revenue += Number(sale.total_amount || 0);
      months.set(key, prev);
    });

    filteredBuybacks.forEach((b) => {
      const key = new Date(b.created_at).toISOString().slice(0, 7);
      const prev = months.get(key) || { month: monthLabel(b.created_at), revenue: 0, expenses: 0, profit: 0 };
      prev.expenses += Number(b.negotiated_price || 0);
      months.set(key, prev);
    });

    filteredRepairs.forEach((r) => {
      const key = new Date(r.created_at).toISOString().slice(0, 7);
      const prev = months.get(key) || { month: monthLabel(r.created_at), revenue: 0, expenses: 0, profit: 0 };
      prev.revenue += Number(r.labor_cost || 0);
      months.set(key, prev);
    });

    return Array.from(months.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([, v]) => ({ ...v, profit: v.revenue - v.expenses }));
  }, [filteredSales, filteredBuybacks, filteredRepairs]);

  const receivablesData = useMemo(() => {
    const pendingRepairs = filteredRepairs.filter((r) => r.status !== 'Delivered');
    const pendingAmount = pendingRepairs.reduce((sum, r) => sum + Number(r.labor_cost || 0), 0);
    return [
      { range: 'Current', amount: pendingAmount, count: pendingRepairs.length },
      { range: '30-60 Days', amount: 0, count: 0 },
      { range: '60-90 Days', amount: 0, count: 0 },
      { range: '90+ Days', amount: 0, count: 0 },
    ];
  }, [filteredRepairs]);

  const payablesData = useMemo(() => {
    const pendingBuybacks = filteredBuybacks.filter((b) => b.status === 'Pending');
    const amount = pendingBuybacks.reduce((sum, b) => sum + Number(b.negotiated_price || 0), 0);
    return [
      { range: 'Current', amount, count: pendingBuybacks.length },
      { range: '30-60 Days', amount: 0, count: 0 },
      { range: '60-90 Days', amount: 0, count: 0 },
      { range: '90+ Days', amount: 0, count: 0 },
    ];
  }, [filteredBuybacks]);

  const storeProfit = useMemo(() => {
    if (globalStore !== 'All Stores') {
      const rev = cashflowData.reduce((sum, m) => sum + m.revenue, 0);
      const prof = cashflowData.reduce((sum, m) => sum + m.profit, 0);
      return [{ name: globalStore, revenue: rev, target: Math.round(rev * 1.1), profit: prof }];
    }

    const grouped = new Map<string, { revenue: number; profit: number }>();
    sales.forEach((s) => {
      const store = s.store_ref ? stores.find((st) => st.id === s.store_ref)?.name || 'Unknown' : storeFromSale(s);
      const current = grouped.get(store) || { revenue: 0, profit: 0 };
      current.revenue += Number(s.total_amount || 0);
      current.profit += Number(s.total_amount || 0);
      grouped.set(store, current);
    });

    return Array.from(grouped.entries()).map(([name, val]) => ({
      name,
      revenue: val.revenue,
      target: Math.round(val.revenue * 1.1),
      profit: val.profit,
    }));
  }, [globalStore, cashflowData, sales, stores]);

  const metrics = useMemo(() => {
    const revenue = cashflowData.reduce((sum, m) => sum + m.revenue, 0);
    const expenses = cashflowData.reduce((sum, m) => sum + m.expenses, 0);
    const profit = revenue - expenses;
    const receivables = receivablesData.reduce((sum, d) => sum + d.amount, 0);
    const stockValue = products.reduce((sum, p) => sum + Number(p.price) * p.stock_quantity, 0);
    return { revenue, expenses, profit, receivables, stockValue };
  }, [cashflowData, receivablesData, products]);

  const kpis = [
    { label: 'Revenue', value: `Rs ${Math.round(metrics.revenue).toLocaleString()}`, trend: `${filteredSales.length} sales`, bg: 'linear-gradient(135deg, var(--primary) 0%, #1e40af 100%)' },
    { label: 'Expenses', value: `Rs ${Math.round(metrics.expenses).toLocaleString()}`, trend: `${filteredBuybacks.length} buybacks`, bg: 'linear-gradient(135deg, var(--warning) 0%, #f97316 100%)' },
    { label: 'Net Profit', value: `Rs ${Math.round(metrics.profit).toLocaleString()}`, trend: `${filteredRepairs.length} repairs`, bg: 'linear-gradient(135deg, var(--success) 0%, #059669 100%)' },
    { label: 'Receivables', value: `Rs ${Math.round(metrics.receivables).toLocaleString()}`, trend: `Stock Rs ${Math.round(metrics.stockValue).toLocaleString()}`, bg: 'linear-gradient(135deg, var(--teal) 0%, #0f766e 100%)' },
  ];

  const handleDownloadBriefReport = async () => {
    try {
      setDownloading(true);
      const params = reportMode === 'month'
        ? { month: reportMonth }
        : { from: reportFrom, to: reportTo };
      const blob = await downloadBriefReportCSV(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const label = reportMode === 'month' ? reportMonth : `${reportFrom}_to_${reportTo}`;
      a.href = url;
      a.download = `brief_report_${label}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to download report');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="financial-container">
      <div className="financial-header">
        <h1>Financial Dashboard</h1>
        <div className="time-selector">
          {['Day', 'Week', 'Month', 'Quarter', 'Year'].map((range) => (
            <button key={range} className={`time-btn ${timeRange === range ? 'active' : ''}`} onClick={() => setTimeRange(range)}>{range}</button>
          ))}
        </div>
      </div>

      {loading && <p>Loading reports...</p>}
      {error && <p style={{ color: '#dc2626' }}>{error}</p>}

      {user.role === 'Admin' && (
        <div className="chart-card" style={{ marginBottom: 16 }}>
          <div className="chart-header"><h3>Brief Report Download</h3><span className="chart-info">Admin only</span></div>
          <div style={{ padding: 16, display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className={`time-btn ${reportMode === 'month' ? 'active' : ''}`} onClick={() => setReportMode('month')}>By Month</button>
              <button className={`time-btn ${reportMode === 'days' ? 'active' : ''}`} onClick={() => setReportMode('days')}>By Day Range</button>
            </div>

            {reportMode === 'month' ? (
              <input type="month" className="time-btn" style={{ maxWidth: 220, textAlign: 'left' }} value={reportMonth} onChange={(e) => setReportMonth(e.target.value)} />
            ) : (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <input type="date" className="time-btn" style={{ maxWidth: 220, textAlign: 'left' }} value={reportFrom} onChange={(e) => setReportFrom(e.target.value)} />
                <input type="date" className="time-btn" style={{ maxWidth: 220, textAlign: 'left' }} value={reportTo} onChange={(e) => setReportTo(e.target.value)} />
              </div>
            )}

            <div>
              <button className="time-btn active" onClick={handleDownloadBriefReport} disabled={downloading}>
                {downloading ? 'Preparing CSV...' : 'Download Brief Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="kpi-grid">
        {kpis.map((kpi, i) => (
          <div key={i} className="kpi-card-fin" style={{ background: kpi.bg }}>
            <div className="kpi-content"><p className="kpi-label">{kpi.label}</p><h2 className="kpi-value">{kpi.value}</h2><span className="kpi-trend">{kpi.trend}</span></div>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="chart-card chart-lg">
          <div className="chart-header"><h3>Cash Flow Trend</h3><span className="chart-info">{globalStore} | {timeRange}</span></div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={cashflowData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} /><stop offset="95%" stopColor="var(--primary)" stopOpacity={0} /></linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--warning)" stopOpacity={0.8} /><stop offset="95%" stopColor="var(--warning)" stopOpacity={0} /></linearGradient>
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

        <div className="chart-card">
          <div className="chart-header"><h3>Store Profitability</h3></div>
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

      <div className="aging-grid">
        <div className="aging-card">
          <h3>Receivables Aging</h3>
          <table className="aging-table"><thead><tr><th>Period</th><th>Amount</th><th>Invoices</th></tr></thead><tbody>{receivablesData.map((item, i) => <tr key={i}><td className="period-cell">{item.range}</td><td className="amount-cell">Rs {item.amount.toLocaleString()}</td><td className="count-cell badge">{item.count}</td></tr>)}</tbody></table>
          <div className="total-row"><strong>Total Receivables</strong><strong>Rs {receivablesData.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}</strong></div>
        </div>

        <div className="aging-card">
          <h3>Payables Aging</h3>
          <table className="aging-table"><thead><tr><th>Period</th><th>Amount</th><th>Bills</th></tr></thead><tbody>{payablesData.map((item, i) => <tr key={i}><td className="period-cell">{item.range}</td><td className="amount-cell">Rs {item.amount.toLocaleString()}</td><td className="count-cell badge">{item.count}</td></tr>)}</tbody></table>
          <div className="total-row"><strong>Total Payables</strong><strong>Rs {payablesData.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}</strong></div>
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;
