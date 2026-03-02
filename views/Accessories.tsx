
import React from 'react';
import KpiCard from '../components/KpiCard';

const Accessories: React.FC = () => {
  const kpis = [
    { label: 'Total Sales Today', value: '42', trend: '+12%', trendLabel: 'from yesterday', icon: 'shopping_bag', color: '#2563eb', bgLight: 'rgba(37, 99, 235, 0.1)' },
    { label: 'Top Accessory', value: 'Tempered Glass', trendLabel: 'Most sold item (24 units)', icon: 'star', color: '#8b5cf6', bgLight: 'rgba(139, 92, 246, 0.1)' },
    { label: 'Total Revenue', value: '$1,248.50', trend: '+5%', trendLabel: 'from average', icon: 'attach_money', color: '#10b981', bgLight: 'rgba(16, 185, 129, 0.1)' },
  ];

  const items = [
    { type: 'Tempered Glass', device: 'iPhone 14 Pro Max', code: 'IC-9921', cash: '$15.00', online: '$0.00', salesman: 'John D.', gift: false, image: 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&q=80&w=100' },
    { type: 'Fast Charger 20W', device: 'USB-C Adapter', code: 'IC-4421', cash: '$0.00', online: '$25.00', salesman: 'Sarah M.', gift: true, image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&q=80&w=100' },
    { type: 'AirPods Pro Case', device: 'Silicone Blue', code: 'IC-1102', cash: '$12.00', online: '$0.00', salesman: 'Mike R.', gift: false, image: 'https://images.unsplash.com/photo-1588156979435-379b9d802b0a?auto=format&fit=crop&q=80&w=100' },
    { type: 'Lightning Cable', device: '2m Braided', code: 'IC-3392', cash: '$0.00', online: '$18.50', salesman: 'Alex M.', gift: false, image: 'https://images.unsplash.com/photo-1594914141274-b551482a3ba9?auto=format&fit=crop&q=80&w=100' },
  ];

  return (
    <div className="space-y-8 animate-in slide-in-from-left-8 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Accessories Sales</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage accessory inventory and daily sales records.</p>
        </div>
        <button className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/20 flex items-center gap-2 hover:bg-blue-700 active:scale-95 transition-all">
          <span className="material-icons text-sm">add</span>
          Add Accessories Sale
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpis.map((kpi, i) => <KpiCard key={i} data={kpi} />)}
      </div>

      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-slate-100 dark:border-dark-border overflow-hidden transition-colors duration-200">
        <div className="p-5 border-b border-slate-100 dark:border-dark-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-lg">search</span>
            <input type="text" placeholder="Search item code..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-slate-200" />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-dark-border rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
              <span className="material-icons text-lg text-slate-400 dark:text-slate-500">calendar_today</span>
              Today
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-dark-border">
              <tr>
                <th className="px-6 py-4">Accessory Type</th>
                <th className="px-6 py-4">IC Code</th>
                <th className="px-6 py-4 text-center">Gift</th>
                <th className="px-6 py-4 text-right">Cash</th>
                <th className="px-6 py-4 text-right">Online</th>
                <th className="px-6 py-4">Salesman</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {items.map((item, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={item.image} alt={item.type} className="w-10 h-10 rounded-lg object-cover bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-dark-border" />
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.type}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">{item.device}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-500 dark:text-slate-500">{item.code}</td>
                  <td className="px-6 py-4 text-center">
                    {item.gift ? <span className="material-icons text-green-500 dark:text-green-400 text-lg">card_giftcard</span> : <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700"></span>}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-800 dark:text-slate-200">{item.cash}</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-800 dark:text-slate-200">{item.online}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[10px] uppercase">
                        {item.salesman.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{item.salesman}</span>
                    </div>
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

export default Accessories;
