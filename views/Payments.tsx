
import React from 'react';
import KpiCard from '../components/KpiCard';

const Payments: React.FC = () => {
  const kpis = [
    { label: 'Total Receivables', value: '$24,592.00', trendLabel: 'Incoming from dealers', icon: 'arrow_downward', color: '#10b981', bgLight: 'rgba(16, 185, 129, 0.1)' },
    { label: 'Total Payables', value: '$18,240.50', trendLabel: 'Outgoing to vendors', icon: 'arrow_upward', color: '#ef4444', bgLight: 'rgba(239, 68, 68, 0.1)' },
    { label: 'Overdue (IN)', value: '4', trendLabel: 'Payment requested', icon: 'priority_high', color: '#f59e0b', bgLight: 'rgba(245, 158, 11, 0.1)' },
    { label: 'Net Flow', value: '+$6,351.50', trendLabel: 'Estimated balance', icon: 'show_chart', color: '#2563eb', bgLight: 'rgba(37, 99, 235, 0.1)' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Pending Payments & Dues</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage incoming receivables and outgoing supplier payments.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border px-4 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all">Export</button>
          <button className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all">Record Payment</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => <KpiCard key={i} data={kpi} />)}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 h-[calc(100vh-320px)] min-h-[500px]">
        {/* Receivables */}
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-lg border border-slate-100 dark:border-dark-border flex flex-col h-full overflow-hidden transition-colors duration-200">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center">
                <span className="material-icons">call_received</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Pending IN</h2>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-widest">Receivables</p>
              </div>
            </div>
            <span className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">12 Pending</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {[
              { name: 'Michael Stevens', device: 'iPhone 15 Pro Max', due: 'Overdue (2d)', total: '$1,200', urgent: true },
              { name: 'TechHub Store', device: 'Bulk Order #4492', due: 'Due Today', total: '$4,500', urgent: false },
              { name: 'Sarah Jenkins', device: 'Samsung S24 Ultra', due: 'Oct 24, 2023', total: '$800', urgent: false },
            ].map((item, i) => (
              <div key={i} className="group p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-dashed border-slate-100 dark:border-dark-border last:border-0 relative">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.name}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.device}</p>
                    <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[9px] font-bold uppercase ${item.urgent ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>{item.due}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-slate-800 dark:text-slate-100">{item.total}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payables */}
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-lg border border-slate-100 dark:border-dark-border flex flex-col h-full overflow-hidden transition-colors duration-200">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <span className="material-icons">call_made</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Payments OUT</h2>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-widest">Payables</p>
              </div>
            </div>
            <span className="bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">5 Due</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {[
              { name: 'Apple Distribution Inc.', inv: 'INV-2023-001', due: 'Overdue (5d)', amount: '$12,400.00', urgent: true },
              { name: 'Samsung Global', inv: 'INV-9921-X', due: 'Due Today', amount: '$8,200.50', urgent: false },
            ].map((item, i) => (
              <div key={i} className="group p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-dashed border-slate-100 dark:border-dark-border last:border-0">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                      <span className="material-icons text-sm">business</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.name}</h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">{item.inv}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{item.amount}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase ${item.urgent ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>{item.due}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payments;
