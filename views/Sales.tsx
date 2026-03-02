
import React, { useState, useEffect, useRef } from 'react';
import { Transaction, Product, CartItem, StoreInventory, Store } from '../types';

const Sales: React.FC = () => {
  // --- Global State Simulation ---
  const [stores] = useState<Store[]>([
    { id: 'S1', name: 'Main Warehouse', location: 'Downtown', type: 'Warehouse' },
    { id: 'S2', name: 'Retail Store A', location: 'City Mall', type: 'Retail' },
    { id: 'S3', name: 'Repair Center', location: 'West End', type: 'Repair' },
  ]);

  const [products] = useState<Product[]>([
    // FIX: Replaced price/costPrice with sellingPrice/purchasePrice, fixed category, and added minStockLevel to conform to Product type.
    { id: 'P1', name: 'iPhone 15 Pro Max', brand: 'Apple', model: 'A3102', storage: '256GB', color: 'Natural Titanium', barcode: '1001', sellingPrice: 1199, purchasePrice: 950, category: 'New Phones', minStockLevel: 5, image: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?w=200' },
    // FIX: Replaced price/costPrice with sellingPrice/purchasePrice, fixed category, and added minStockLevel to conform to Product type.
    { id: 'P2', name: 'S24 Ultra', brand: 'Samsung', model: 'SM-S928', storage: '512GB', color: 'Titanium Black', barcode: '1002', sellingPrice: 1299, purchasePrice: 1050, category: 'New Phones', minStockLevel: 5, image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=200' },
  ]);

  // Stock specifically for S2 (Retail Store A) and others
  const [stockLevels, setStockLevels] = useState<StoreInventory[]>([
    // FIX: Added missing 'id' and 'lastUpdated' properties to conform to StoreInventory type.
    { id: 'si1', storeId: 'S2', productId: 'P1', quantity: 5, lastUpdated: new Date().toISOString() }, 
    { id: 'si2', storeId: 'S2', productId: 'P2', quantity: 3, lastUpdated: new Date().toISOString() },
    { id: 'si3', storeId: 'S1', productId: 'P1', quantity: 50, lastUpdated: new Date().toISOString() }, // Warehouse stock (not accessible in POS unless switched)
  ]);

  const [salesRecords, setSalesRecords] = useState<Transaction[]>([]);

  // --- POS Session ---
  const [currentStoreId, setCurrentStoreId] = useState<string>('S2'); // Login as Retail Store A
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [payment, setPayment] = useState({ cash: 0, online: 0 });
  const [gstEnabled, setGstEnabled] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const barcodeRef = useRef<HTMLInputElement>(null);

  // --- Logic ---
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getStoreStock = (pId: string) => {
    return stockLevels.find(s => s.storeId === currentStoreId && s.productId === pId)?.quantity || 0;
  };

  const addToCart = (product: Product) => {
    const available = getStoreStock(product.id);
    
    // Check if enough stock in THIS store
    const inCart = cart.find(c => c.id === product.id)?.cartQuantity || 0;
    
    if (available - inCart <= 0) {
      showToast("Insufficient stock in this store!", "error");
      return;
    }

    setCart(prev => {
      const existing = prev.find(p => p.id === product.id);
      if (existing) {
        return prev.map(p => p.id === product.id ? { ...p, cartQuantity: p.cartQuantity + 1 } : p);
      }
      return [...prev, { ...product, cartQuantity: 1, itemDiscount: 0, storeId: currentStoreId }];
    });
    setBarcodeInput('');
    barcodeRef.current?.focus();
  };

  const finalizeSale = () => {
    if (cart.length === 0) return;
    
    // 1. Deduct Stock (Only from currentStoreId)
    setStockLevels(prev => prev.map(s => {
      if (s.storeId !== currentStoreId) return s; // Don't touch other stores
      const item = cart.find(c => c.id === s.productId);
      if (item) return { ...s, quantity: s.quantity - item.cartQuantity };
      return s;
    }));

    // 2. Record Transaction
    // FIX: Replaced 'c.price' with 'c.sellingPrice' to match the Product type.
    const subtotal = cart.reduce((a,c) => a + (c.sellingPrice * c.cartQuantity), 0);
    const tax = gstEnabled ? subtotal * 0.18 : 0;
    const total = subtotal + tax;
    
    const tx: Transaction = {
      slNo: salesRecords.length + 1,
      id: `INV-${Date.now().toString().slice(-6)}`,
      storeId: currentStoreId,
      date: new Date().toLocaleString(),
      customer: customer.name || 'Walk-in',
      phone: customer.phone || '-',
      items: cart,
      subtotal,
      tax,
      discount: 0,
      grandTotal: total,
      cashPaid: payment.cash,
      onlinePaid: payment.online,
      change: Math.max(0, (payment.cash + payment.online) - total),
      gotGift: false,
      salesman: 'Alex M',
      status: 'completed'
    };

    setSalesRecords([tx, ...salesRecords]);
    showToast("Transaction Completed");
    setIsModalOpen(false);
    setCart([]);
    setCustomer({ name: '', phone: '' });
    setPayment({ cash: 0, online: 0 });
  };

  // --- Computed ---
  // FIX: Replaced 'c.price' with 'c.sellingPrice' to match the Product type.
  const subtotal = cart.reduce((a,c) => a + (c.sellingPrice * c.cartQuantity), 0);
  const tax = gstEnabled ? subtotal * 0.18 : 0;
  const grandTotal = subtotal + tax;

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-8 right-8 z-[250] px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 ${toast.type==='error'?'bg-red-600':'bg-slate-900'} text-white`}>
          <span className="font-bold">{toast.msg}</span>
        </div>
      )}

      {/* POS Login Simulator */}
      <div className="bg-white dark:bg-dark-card p-4 rounded-3xl border border-slate-100 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center">
            <span className="material-icons">store</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Terminal</p>
            <select 
              value={currentStoreId} 
              onChange={e => setCurrentStoreId(e.target.value)}
              className="bg-transparent text-lg font-black text-slate-800 dark:text-slate-100 border-none p-0 focus:ring-0 cursor-pointer"
            >
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-transform">
          New Sale
        </button>
      </div>

      {/* Sales History */}
      <div className="bg-white dark:bg-dark-card rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <tr>
              <th className="px-8 py-5">Invoice</th>
              <th className="px-6 py-5">Store</th>
              <th className="px-6 py-5 text-right">Amount</th>
              <th className="px-6 py-5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {salesRecords.filter(r => r.storeId === currentStoreId).map(sale => (
              <tr key={sale.id}>
                <td className="px-8 py-5 font-bold text-blue-600">{sale.id}</td>
                <td className="px-6 py-5 text-xs font-bold text-slate-500">{stores.find(s=>s.id===sale.storeId)?.name}</td>
                <td className="px-6 py-5 text-right font-black text-slate-800">${sale.grandTotal.toFixed(2)}</td>
                <td className="px-6 py-5 text-center"><span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold uppercase">Paid</span></td>
              </tr>
            ))}
            {salesRecords.filter(r => r.storeId === currentStoreId).length === 0 && (
              <tr><td colSpan={4} className="py-12 text-center text-slate-400 italic">No sales in this store yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* POS Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-dark-card w-full h-full max-w-[95vw] max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="px-8 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-800">POS: {stores.find(s=>s.id===currentStoreId)?.name}</h2>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"><span className="material-icons">close</span></button>
            </div>
            
            <div className="flex-1 grid grid-cols-12 overflow-hidden">
               {/* Left: Product Picker */}
               <div className="col-span-8 p-6 bg-slate-50/50 overflow-y-auto">
                 <div className="mb-6 flex gap-4">
                   <div className="flex-1 bg-white rounded-2xl px-4 py-2 flex items-center border border-slate-200">
                     <span className="material-icons text-slate-400 mr-2">qr_code</span>
                     <form onSubmit={e => {
                       e.preventDefault();
                       const p = products.find(i => i.barcode === barcodeInput);
                       if (p) addToCart(p); else showToast("Not found", "error");
                     }} className="flex-1">
                       <input ref={barcodeRef} autoFocus value={barcodeInput} onChange={e=>setBarcodeInput(e.target.value)} placeholder="Scan Barcode" className="w-full border-none focus:ring-0 text-sm font-bold" />
                     </form>
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-4 gap-4">
                   {products.map(p => {
                     const stock = getStoreStock(p.id);
                     return (
                       <button key={p.id} onClick={() => addToCart(p)} disabled={stock <= 0} className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-500 shadow-sm text-left disabled:opacity-50 transition-all">
                         <div className="flex justify-between mb-2">
                           <span className="text-[10px] font-black uppercase text-slate-400">{p.brand}</span>
                           <span className={`text-[10px] font-black px-1.5 rounded ${stock>0?'bg-green-100 text-green-600':'bg-red-100 text-red-600'}`}>{stock}</span>
                         </div>
                         <h4 className="font-bold text-slate-800 text-sm truncate">{p.name}</h4>
                         {/* FIX: Replaced 'p.price' with 'p.sellingPrice' to match the Product type. */}
                         <p className="font-black text-blue-600 mt-1">${p.sellingPrice}</p>
                       </button>
                     )
                   })}
                 </div>
               </div>

               {/* Right: Cart */}
               <div className="col-span-4 bg-white border-l border-slate-100 p-6 flex flex-col">
                 <div className="flex-1 overflow-y-auto space-y-3">
                   {cart.map(item => (
                     <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                       <div>
                         <p className="text-sm font-bold">{item.name}</p>
                         {/* FIX: Replaced 'item.price' with 'item.sellingPrice' to match the Product type. */}
                         <p className="text-xs text-slate-500">{item.cartQuantity} x ${item.sellingPrice}</p>
                       </div>
                       {/* FIX: Replaced 'item.price' with 'item.sellingPrice' to match the Product type. */}
                       <p className="font-black">${(item.cartQuantity * item.sellingPrice).toFixed(2)}</p>
                     </div>
                   ))}
                   {cart.length === 0 && <p className="text-center text-slate-400 italic mt-10">Cart is empty</p>}
                 </div>

                 <div className="mt-6 space-y-4 pt-6 border-t border-slate-100">
                   <div className="flex justify-between font-black text-xl">
                     <span>Total</span>
                     <span>${grandTotal.toFixed(2)}</span>
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                     <input type="number" placeholder="Cash" value={payment.cash||''} onChange={e=>setPayment({...payment, cash: Number(e.target.value)})} className="bg-slate-50 rounded-xl border-none font-bold" />
                     <input type="number" placeholder="Online" value={payment.online||''} onChange={e=>setPayment({...payment, online: Number(e.target.value)})} className="bg-slate-50 rounded-xl border-none font-bold" />
                   </div>
                   <button onClick={finalizeSale} className="w-full py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-xs">Complete Sale</button>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
