import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listCustomers, listSales, type ApiCustomer, type ApiSale } from '../services/api';

const getStoreFromSale = (sale: ApiSale): string => {
  const match = sale.notes?.match(/store=([^|]+)/i);
  return match?.[1]?.trim() || 'Main Branch';
};

const Sales: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = (searchParams.get('q') || '').toLowerCase();
  const storeFilter = searchParams.get('store') || 'All Stores';

  const [sales, setSales] = useState<ApiSale[]>([]);
  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const [salesData, customerData] = await Promise.all([listSales(), listCustomers()]);
        setSales(salesData);
        setCustomers(customerData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load sales');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const customerById = useMemo(() => {
    const map = new Map<number, ApiCustomer>();
    customers.forEach((c) => map.set(c.id, c));
    return map;
  }, [customers]);

  const stores = useMemo(() => ['All Stores', ...Array.from(new Set(sales.map(getStoreFromSale)))], [sales]);

  const filteredSales = useMemo(() => {
    let list = sales;
    if (storeFilter !== 'All Stores') {
      list = list.filter((s) => getStoreFromSale(s) === storeFilter);
    }
    if (query) {
      list = list.filter((sale) => {
        const customerName = sale.customer ? (customerById.get(sale.customer)?.name || `Customer ${sale.customer}`) : 'Walk-in';
        return customerName.toLowerCase().includes(query)
          || getStoreFromSale(sale).toLowerCase().includes(query)
          || `sale${sale.id}`.includes(query);
      });
    }
    return list;
  }, [sales, storeFilter, query, customerById]);

  const totals = useMemo(() => {
    const revenue = filteredSales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
    const orders = filteredSales.length;
    const avg = orders ? revenue / orders : 0;
    return { revenue, orders, avg };
  }, [filteredSales]);

  const handleStoreChange = (store: string) => {
    const params = new URLSearchParams(searchParams);
    if (store === 'All Stores') params.delete('store');
    else params.set('store', store);
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Sales</h1>
          <p className="text-sm text-slate-500 mt-1">Live sales from backend API</p>
        </div>
        <select value={storeFilter} onChange={(e) => handleStoreChange(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-xl">
          {stores.map((store) => <option key={store} value={store}>{store}</option>)}
        </select>
      </div>

      {loading && <p className="text-slate-500">Loading sales...</p>}
      {error && <p className="text-red-600">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-dark-card rounded-2xl p-4 border border-slate-100"><p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Total Revenue</p><p className="text-2xl font-black mt-1">Rs {totals.revenue.toLocaleString()}</p></div>
        <div className="bg-white dark:bg-dark-card rounded-2xl p-4 border border-slate-100"><p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Total Orders</p><p className="text-2xl font-black mt-1">{totals.orders}</p></div>
        <div className="bg-white dark:bg-dark-card rounded-2xl p-4 border border-slate-100"><p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Avg Order Value</p><p className="text-2xl font-black mt-1">Rs {Math.round(totals.avg).toLocaleString()}</p></div>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest"><tr><th className="px-6 py-4">Sale #</th><th className="px-6 py-4">Customer</th><th className="px-6 py-4 text-center">Items</th><th className="px-6 py-4 text-right">Amount</th><th className="px-6 py-4">Store</th><th className="px-6 py-4">Sold At</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {filteredSales.map((sale) => {
              const customerName = sale.customer ? (customerById.get(sale.customer)?.name || `Customer ${sale.customer}`) : 'Walk-in';
              return (
                <tr key={sale.id}>
                  <td className="px-6 py-4 font-bold text-blue-600">SALE{String(sale.id).padStart(5, '0')}</td>
                  <td className="px-6 py-4">{customerName}</td>
                  <td className="px-6 py-4 text-center">{sale.items.length}</td>
                  <td className="px-6 py-4 text-right font-black">Rs {Number(sale.total_amount).toLocaleString()}</td>
                  <td className="px-6 py-4">{getStoreFromSale(sale)}</td>
                  <td className="px-6 py-4 text-xs text-slate-500">{new Date(sale.sold_at).toLocaleString()}</td>
                </tr>
              );
            })}
            {!loading && filteredSales.length === 0 && <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400 italic">No sales found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Sales;
