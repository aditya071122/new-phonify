
import React from 'react';
import KpiCard from '../components/KpiCard';

const Expenses: React.FC = () => {
  const kpis = [
    { label: 'Total Expenses (Today)', value: '$1,240.50', trend: '+12%', trendLabel: 'vs yesterday', icon: 'money_off', color: '#ef4444', bgLight: 'rgba(239, 68, 68, 0.1)' },
    { label: 'Cash Flow Out', value: '$450.00', trendLabel: 'Physical cash spent', icon: 'payments', color: '#2563eb', bgLight: 'rgba(37, 99, 235, 0.1)' },
    { label: 'Online Transfers', value: '$790.50', trendLabel: 'Bank & digital payments', icon: 'account_balance', color: '#8b5cf6', bgLight: 'rgba(139, 92, 246, 0.1)' },
  ];

  const transactions = [
    { id: '#EXP-802', time: '10:45 AM', reason: 'Shop Electricity Bill', category: 'Utilities', method: 'Online', amount: '- $120.00' },
    { id: '#EXP-801', time: '09:30 AM', reason: 'Morning Coffee & Snacks', category: 'Food & Bev', method: 'Cash', amount: '- $15.50' },
    { id: '#EXP-800', time: '09:15 AM', reason: 'Cleaning Supplies', category: 'Maintenance', method: 'Cash', amount: '- $42.00' },
    { id: '#EXP-799', time: 'Yesterday', reason: 'New Display Units (Partial)', category: 'Inventory', method: 'Online', amount: '- $650.00' },
    { id: '#EXP-798', time: 'Yesterday', reason: 'Employee Bonus (Cash)', category: 'Salary', method: 'Cash', amount: '- $100.00' },
  ];

  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Expense Management</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Monitor and control your store's operational costs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpis.map((kpi, i) => <KpiCard key={i} data={kpi} />)}
      </div>

      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-slate-100 dark:border-dark-border overflow-hidden transition-colors duration-200">
        <div className="p-4 border-b border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span className="material-icons text-blue-600 dark:text-blue-400">add_circle</span>
            Quick Expense Entry
          </h3>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-white dark:bg-slate-900 border border-slate-200 dark:border-dark-border px-2 py-1 rounded">Today: Oct 24, 2023</span>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
            <div className="lg:col-span-5">
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Expense Reason</label>
              <div className="relative">
                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 text-lg">description</span>
                <input type="text" placeholder="e.g. Shop supplies..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 dark:text-slate-200" />
              </div>
            </div>
            <div className="lg:col-span-3">
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Cash Out</label>
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold">$</span>
                <input type="text" placeholder="0.00" className="w-full pl-7 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-sm font-bold text-red-500 dark:text-red-400 focus:ring-2 focus:ring-red-500/20" />
              </div>
            </div>
            <div className="lg:col-span-3">
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Online Out</label>
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold">$</span>
                <input type="text" placeholder="0.00" className="w-full pl-7 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-sm font-bold text-red-500 dark:text-red-400 focus:ring-2 focus:ring-red-500/20" />
              </div>
            </div>
            <div className="lg:col-span-1">
              <button className="w-full h-[42px] bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95">
                <span className="material-icons">check</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-slate-100 dark:border-dark-border overflow-hidden transition-colors duration-200">
        <div className="p-6 border-b border-slate-100 dark:border-dark-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Recent Transactions</h3>
          <div className="relative w-full md:w-64">
            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm">search</span>
            <input type="text" placeholder="Search reason..." className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-900 border-none rounded-lg text-xs dark:text-slate-200" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-dark-border">
              <tr>
                <th className="px-6 py-4">ID & Time</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {transactions.map((t, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{t.id}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">{t.time}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{t.reason}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                      {t.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <span className="material-icons text-sm">{t.method === 'Online' ? 'account_balance' : 'payments'}</span>
                      {t.method}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-red-500 dark:text-red-400">{t.amount}</td>
                  <td className="px-6 py-4 text-center">
                    <button className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                      <span className="material-icons text-lg">delete</span>
                    </button>
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

export default Expenses;
