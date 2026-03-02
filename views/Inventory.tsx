
import React, { useState, useMemo, FC, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// FIX: Imported KpiData to resolve 'Cannot find name' error.
import { Product, Store, StoreInventory, User, KpiData } from '../types';
import KpiCard from '../components/KpiCard';

// --- MOCK DATABASE ---
const mockStores: Store[] = [
    { id: 'S1', name: 'Main Warehouse', location: 'Downtown', type: 'Warehouse' },
    { id: 'S2', name: 'Retail Store A', location: 'City Mall', type: 'Retail' },
    { id: 'S3', name: 'Repair Center', location: 'West End', type: 'Repair' },
];

const mockProducts: Product[] = [
    { id: 'P1', name: 'iPhone 15 Pro', brand: 'Apple', model: 'A3102', storage: '256GB', color: 'Natural Titanium', barcode: '1001', purchasePrice: 95000, sellingPrice: 139999, minStockLevel: 5, category: 'New Phones', image: 'https://images.unsplash.com/photo-1695026522854-4a242d31518f?w=100' },
    { id: 'P2', name: 'Samsung S24 Ultra', brand: 'Samsung', model: 'SM-S928', storage: '512GB', color: 'Titanium Black', barcode: '1002', purchasePrice: 65000, sellingPrice: 79999, minStockLevel: 8, category: 'New Phones', image: 'https://images.unsplash.com/photo-1705096954269-37651a147775?w=100' },
    { id: 'B1', name: 'iPhone 12 (Used)', brand: 'Apple', model: 'A2403', storage: '128GB', color: 'Blue', barcode: '8001', purchasePrice: 22000, sellingPrice: 28000, minStockLevel: 1, category: 'Buyback Phones', image: 'https://images.unsplash.com/photo-1611791485440-24e8239a0377?w=100' },
    { id: 'A1', name: 'Tempered Glass', brand: 'Generic', model: 'Universal', storage: '', color: '', barcode: '2001', purchasePrice: 50, sellingPrice: 299, minStockLevel: 20, category: 'Accessories', image: 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=100' },
    { id: 'RP1', name: 'iPhone 15 Pro Screen', brand: 'OEM', model: 'OEM-SCR-15P', storage: '', color: '', barcode: '7001', purchasePrice: 12000, sellingPrice: 15000, minStockLevel: 10, category: 'Repair Parts', image: 'https://images.unsplash.com/photo-1603893353568-d0b7010a4a8a?w=100' },
];

const mockStoreInventory: StoreInventory[] = [
    { id: 'SI1', storeId: 'S1', productId: 'P1', quantity: 50, lastUpdated: new Date().toISOString() },
    { id: 'SI2', storeId: 'S2', productId: 'P1', quantity: 3, lastUpdated: new Date().toISOString() },
    { id: 'SI3', storeId: 'S1', productId: 'P2', quantity: 30, lastUpdated: new Date().toISOString() },
    { id: 'SI4', storeId: 'S3', productId: 'RP1', quantity: 15, lastUpdated: new Date().toISOString() },
    { id: 'SI5', storeId: 'S2', productId: 'A1', quantity: 45, lastUpdated: new Date().toISOString() },
    { id: 'SI6', storeId: 'S2', productId: 'B1', quantity: 1, lastUpdated: new Date().toISOString() },
];

const Inventory: FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const importFileRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState(mockProducts);
  const [stock, setStock] = useState(mockStoreInventory);
  
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStore, setSelectedStore] = useState(user.role === 'Admin' ? 'All' : user.assignedStoreId || 'All');
  
  const categories = ['All', 'New Phones', 'Buyback Phones', 'Accessories'];

  const displayData = useMemo(() => {
    // Client-side "JOIN" between products and their stock levels
    const joined = products.map(product => {
      const stockRecords = stock.filter(s => s.productId === product.id);
      return { ...product, stockRecords };
    });

    let categoryFiltered = selectedCategory === 'All' ? joined : joined.filter(p => p.category === selectedCategory);
    
    return categoryFiltered.flatMap(product => {
        if (selectedStore === 'All') {
            if (product.stockRecords.length === 0) {
                // FIX: Added storeId: undefined to ensure a consistent object shape, fixing the 'property does not exist' error.
                return [{ ...product, storeName: 'N/A', quantity: 0, stockId: `none-${product.id}`, storeId: undefined }];
            }
            return product.stockRecords.map(s => {
                const store = mockStores.find(st => st.id === s.storeId);
                return { ...product, storeId: store?.id, storeName: store?.name, quantity: s.quantity, stockId: s.id };
            });
        }
        const stockInStore = product.stockRecords.find(s => s.storeId === selectedStore);
        return [{ ...product, storeId: selectedStore, storeName: mockStores.find(st => st.id === selectedStore)?.name, quantity: stockInStore?.quantity || 0, stockId: stockInStore?.id || `none-${product.id}-${selectedStore}` }];
    });
  }, [products, stock, selectedCategory, selectedStore]);

  const lowStockCount = useMemo(() => {
      return displayData.filter(item => item.quantity > 0 && item.quantity < item.minStockLevel).length;
  }, [displayData]);
  
  const handleStockAdjustment = (stockId: string, delta: number, productId: string, storeId: string) => {
    setStock(prev => {
        const existing = prev.find(s => s.id === stockId);
        if (existing) {
            return prev.map(s => s.id === stockId ? { ...s, quantity: Math.max(0, s.quantity + delta) } : s);
        }
        if (delta > 0) {
            const newStockItem: StoreInventory = { id: `SI${Date.now()}`, productId, storeId, quantity: delta, lastUpdated: new Date().toISOString() };
            return [...prev, newStockItem];
        }
        return prev;
    });
  };

  const handleExport = () => {
    const headers = ['Barcode', 'Brand', 'Model', 'Category', 'Store Name', 'Stock Quantity', 'Selling Price'];
    const rows = displayData.map(item => [item.barcode, item.brand, item.model, item.category, item.storeName, item.quantity, item.sellingPrice].join(','));
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "inventory_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        alert(`CSV import simulation for: ${file.name}`);
    };
    reader.readAsText(file);
  };

  const getStatus = (quantity: number, minStock: number) => {
    if (quantity <= 0) return { label: 'Out of Stock', color: 'bg-error/10 text-error' };
    if (quantity < minStock) return { label: 'Low Stock', color: 'bg-warning/10 text-warning' };
    return { label: 'In Stock', color: 'bg-success/10 text-success' };
  };

  const kpis: KpiData[] = [
      { label: 'Total Products', value: products.length.toString(), icon: 'inventory_2', color: '#208091', bgLight: 'rgba(32,128,145,0.1)', trendLabel: 'Master records' },
      { label: 'Total Stock Units', value: stock.reduce((s,i) => s + i.quantity, 0).toLocaleString(), icon: 'all_inbox', color: '#20C08D', bgLight: 'rgba(32,192,141,0.1)', trendLabel: 'Across all stores' },
      { label: 'Low Stock Items', value: lowStockCount.toString(), icon: 'warning', color: '#FF9900', bgLight: 'rgba(255,153,0,0.1)', trendLabel: 'Needs reordering' },
      { label: 'Inventory Value', value: '₹1.2Cr', icon: 'account_balance_wallet', color: '#E6815F', bgLight: 'rgba(230,129,95,0.1)', trendLabel: 'Estimated purchase cost' },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
        <h1 className="text-2xl font-black text-text-dark uppercase tracking-tight">Inventory Management</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {kpis.map(kpi => <KpiCard key={kpi.label} data={kpi} />)}
        </div>

        <div className="bg-surface rounded-2xl shadow-sm border border-secondary/20 overflow-hidden">
            <div className="p-4 border-b border-secondary/20 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex items-center gap-2">
                    {categories.map(cat => (
                        <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-primary text-white' : 'bg-background text-text-secondary hover:text-text-dark'}`}>{cat}</button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <select value={selectedStore} onChange={e => setSelectedStore(e.target.value)} disabled={user.role === 'Staff'} className="w-48 bg-background border-none rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary">
                        {user.role === 'Admin' && <option value="All">All Stores</option>}
                        {mockStores.filter(s => user.role === 'Admin' || user.assignedStoreId === s.id).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    {user.role === 'Admin' && <>
                        <input type="file" ref={importFileRef} onChange={handleImport} accept=".csv" className="hidden" />
                        <button onClick={() => importFileRef.current?.click()} className="p-2 bg-background rounded-lg text-text-secondary hover:text-primary"><span className="material-icons text-base">upload</span></button>
                        <button onClick={handleExport} className="p-2 bg-background rounded-lg text-text-secondary hover:text-primary"><span className="material-icons text-base">download</span></button>
                    </>}
                </div>
            </div>

            <div className="overflow-x-auto max-h-[calc(100vh-450px)]">
                <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-background text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                        <tr>
                            <th className="px-4 py-3">Product</th>
                            <th className="px-4 py-3">Category</th>
                            {selectedStore === 'All' && <th className="px-4 py-3">Store</th>}
                            <th className="px-4 py-3 text-right">Selling Price</th>
                            <th className="px-4 py-3 text-center">Stock</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary/20">
                        {displayData.map(item => {
                            const status = getStatus(item.quantity, item.minStockLevel);
                            return (
                                <tr key={item.stockId} className="hover:bg-background">
                                    <td className="px-4 py-2"><div className="flex items-center gap-3"><img src={item.image} alt={item.name} className="w-9 h-9 rounded-md object-cover bg-background" /><div><p className="font-bold text-text-dark text-xs">{item.name}</p><p className="text-[10px] text-text-secondary font-mono">{item.barcode}</p></div></div></td>
                                    <td className="px-4 py-2 text-xs text-text-secondary">{item.category}</td>
                                    {selectedStore === 'All' && <td className="px-4 py-2 text-xs font-bold text-text-secondary">{item.storeName}</td>}
                                    <td className="px-4 py-2 text-right font-bold text-primary text-xs">₹{item.sellingPrice.toLocaleString()}</td>
                                    {/* FIX: Conditionally call handleStockAdjustment and disable buttons when storeId is unavailable to prevent runtime errors. */}
                                    <td className="px-4 py-2"><div className="flex items-center justify-center gap-1.5"><button onClick={() => item.storeId && handleStockAdjustment(item.stockId, -1, item.id, item.storeId)} disabled={!item.storeId} className="w-5 h-5 rounded bg-background text-text-secondary font-bold text-xs hover:bg-secondary/20 disabled:opacity-50">-</button><span className="w-8 text-center font-bold">{item.quantity}</span><button onClick={() => item.storeId && handleStockAdjustment(item.stockId, 1, item.id, item.storeId)} disabled={!item.storeId} className="w-5 h-5 rounded bg-background text-text-secondary font-bold text-xs hover:bg-secondary/20 disabled:opacity-50">+</button></div></td>
                                    <td className="px-4 py-2 text-center"><span className={`px-2 py-1 rounded text-[9px] font-bold uppercase ${status.color}`}>{status.label}</span></td>
                                    <td className="px-4 py-2 text-center"><button onClick={(e) => { e.stopPropagation(); navigate(`/pos?barcode=${item.barcode}`); }} className="p-1 rounded bg-background text-text-secondary hover:bg-primary hover:text-white text-[10px]"><span className="material-icons text-sm">point_of_sale</span></button></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default Inventory;
