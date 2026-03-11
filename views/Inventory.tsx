import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User } from '../types';
import {
  createProduct,
  deleteProduct,
  listProducts,
  listStores,
  updateProduct,
  type ApiProduct,
  type ApiStore,
} from '../services/api';

const Inventory: React.FC<{ user: User }> = ({ user }) => {
  const fieldStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 };
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' };
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [stores, setStores] = useState<ApiStore[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [formError, setFormError] = useState('');
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const storeFilter = searchParams.get('store') || 'All Stores';
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: 'new_phone' as NonNullable<ApiProduct['category']>,
    description: '',
    price: '',
    stock_quantity: '0',
    primary_store_ref: '',
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    category: 'new_phone' as NonNullable<ApiProduct['category']>,
    description: '',
    price: '',
    stock_quantity: '0',
    primary_store_ref: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const [productData, storeData] = await Promise.all([listProducts(), listStores()]);
        setProducts(productData);
        setStores(storeData.filter((store) => store.is_active));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load inventory');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  useEffect(() => {
    setSearch(searchParams.get('q') || '');
  }, [searchParams]);

  const storeById = useMemo(() => {
    const map = new Map<number, ApiStore>();
    stores.forEach((store) => map.set(store.id, store));
    return map;
  }, [stores]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesQuery = !q
        || product.name.toLowerCase().includes(q)
        || product.sku.toLowerCase().includes(q)
        || (product.description || '').toLowerCase().includes(q);
      const storeName = storeById.get(product.primary_store_ref || -1)?.name || '';
      const matchesStore = storeFilter === 'All Stores' || storeName === storeFilter;
      return matchesQuery && matchesStore;
    });
  }, [products, search, storeById, storeFilter]);

  const lowStock = filtered.filter((product) => product.stock_quantity < 5).length;
  const totalStock = filtered.reduce((sum, product) => sum + product.stock_quantity, 0);
  const inventoryValue = filtered.reduce((sum, product) => sum + Number(product.price) * product.stock_quantity, 0);

  const handleAddInventoryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.sku.trim() || !formData.name.trim()) {
      setFormError('SKU and product name are required.');
      return;
    }
    if (!formData.price || Number.isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      setFormError('Enter a valid price.');
      return;
    }
    if (!formData.stock_quantity || Number.isNaN(Number(formData.stock_quantity)) || Number(formData.stock_quantity) < 0) {
      setFormError('Enter a valid stock quantity.');
      return;
    }

    try {
      setCreating(true);
      const created = await createProduct({
        sku: formData.sku.trim(),
        name: formData.name.trim(),
        category: formData.category,
        description: formData.description.trim(),
        price: Number(formData.price).toFixed(2),
        stock_quantity: Number(formData.stock_quantity),
        primary_store_ref: formData.primary_store_ref ? Number(formData.primary_store_ref) : null,
        active: true,
      });
      setProducts((prev) => [created, ...prev]);
      setFormData({
        sku: '',
        name: '',
        category: 'new_phone',
        description: '',
        price: '',
        stock_quantity: '0',
        primary_store_ref: '',
      });
      alert('Inventory item added successfully.');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to create inventory item');
    } finally {
      setCreating(false);
    }
  };

  const handleStartEditProduct = (product: ApiProduct) => {
    setEditingProductId(product.id);
    setEditFormData({
      name: product.name,
      category: product.category || 'new_phone',
      description: product.description || '',
      price: String(product.price),
      stock_quantity: String(product.stock_quantity),
      primary_store_ref: product.primary_store_ref ? String(product.primary_store_ref) : '',
    });
  };

  const handleEditProduct = async (product: ApiProduct) => {

    try {
      setUpdating(true);
      const updated = await updateProduct(product.id, {
        name: editFormData.name.trim() || product.name,
        category: editFormData.category,
        description: editFormData.description.trim(),
        price: Number(editFormData.price || product.price).toFixed(2),
        stock_quantity: Number(editFormData.stock_quantity || product.stock_quantity),
        primary_store_ref: editFormData.primary_store_ref ? Number(editFormData.primary_store_ref) : null,
      });
      setProducts((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)));
      setEditingProductId(null);
      alert('Inventory item updated successfully.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update inventory item');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteProduct = async (product: ApiProduct) => {
    if (!window.confirm(`Delete ${product.name}?`)) return;
    try {
      await deleteProduct(product.id);
      setProducts((prev) => prev.filter((entry) => entry.id !== product.id));
      alert('Inventory item deleted successfully.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete inventory item');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="card" style={{ padding: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Inventory Management</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '4px 0 0' }}>Store-aware inventory catalog with basic CRUD</p>
      </div>

      <form onSubmit={handleAddInventoryItem} className="card" style={{ padding: 16 }}>
        <h3 style={{ margin: '0 0 12px', color: 'var(--text-primary)', fontWeight: 800 }}>Add Inventory Item</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div style={fieldStyle}><label style={labelStyle}>SKU</label><input className="form-input" placeholder="SKU *" value={formData.sku} onChange={(e) => setFormData((p) => ({ ...p, sku: e.target.value }))} /></div>
          <div style={fieldStyle}><label style={labelStyle}>Product Name</label><input className="form-input" placeholder="Product Name *" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} /></div>
          <div style={fieldStyle}><label style={labelStyle}>Category</label><select className="form-input" value={formData.category} onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value as NonNullable<ApiProduct['category']> }))}>
            <option value="new_phone">New Phone</option>
            <option value="used_phone">Used Phone</option>
            <option value="accessories">Accessories</option>
            <option value="services">Services</option>
          </select></div>
          <div style={fieldStyle}><label style={labelStyle}>Primary Store</label><select className="form-input" value={formData.primary_store_ref} onChange={(e) => setFormData((p) => ({ ...p, primary_store_ref: e.target.value }))}>
            <option value="">No Primary Store</option>
            {stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
          </select></div>
          <div style={fieldStyle}><label style={labelStyle}>Description</label><input className="form-input" placeholder="Description" value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} /></div>
          <div style={fieldStyle}><label style={labelStyle}>Price</label><input className="form-input" type="number" min="0" step="0.01" placeholder="Price *" value={formData.price} onChange={(e) => setFormData((p) => ({ ...p, price: e.target.value }))} /></div>
          <div style={fieldStyle}><label style={labelStyle}>Stock Quantity</label><input className="form-input" type="number" min="0" step="1" placeholder="Stock Quantity *" value={formData.stock_quantity} onChange={(e) => setFormData((p) => ({ ...p, stock_quantity: e.target.value }))} /></div>
        </div>
        {formError && <p style={{ color: 'var(--color-error-600)', margin: '8px 0 0' }}>{formError}</p>}
        <button className="btn btn-primary" style={{ marginTop: 12 }} type="submit" disabled={creating}>
          {creating ? 'Creating...' : '+ Add Inventory Item'}
        </button>
      </form>

      {editingProductId !== null && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const product = products.find((entry) => entry.id === editingProductId);
            if (product) {
              void handleEditProduct(product);
            }
          }}
          className="card"
          style={{ padding: 16 }}
        >
          <h3 style={{ margin: '0 0 12px', color: 'var(--text-primary)', fontWeight: 800 }}>Edit Inventory Item</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div style={fieldStyle}><label style={labelStyle}>Product Name</label><input className="form-input" placeholder="Product Name *" value={editFormData.name} onChange={(e) => setEditFormData((p) => ({ ...p, name: e.target.value }))} /></div>
            <div style={fieldStyle}><label style={labelStyle}>Category</label><select className="form-input" value={editFormData.category} onChange={(e) => setEditFormData((p) => ({ ...p, category: e.target.value as NonNullable<ApiProduct['category']> }))}>
              <option value="new_phone">New Phone</option>
              <option value="used_phone">Used Phone</option>
              <option value="accessories">Accessories</option>
              <option value="services">Services</option>
            </select></div>
            <div style={fieldStyle}><label style={labelStyle}>Primary Store</label><select className="form-input" value={editFormData.primary_store_ref} onChange={(e) => setEditFormData((p) => ({ ...p, primary_store_ref: e.target.value }))}>
              <option value="">No Primary Store</option>
              {stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
            </select></div>
            <div style={fieldStyle}><label style={labelStyle}>Description</label><input className="form-input" placeholder="Description" value={editFormData.description} onChange={(e) => setEditFormData((p) => ({ ...p, description: e.target.value }))} /></div>
            <div style={fieldStyle}><label style={labelStyle}>Price</label><input className="form-input" type="number" min="0" step="0.01" placeholder="Price *" value={editFormData.price} onChange={(e) => setEditFormData((p) => ({ ...p, price: e.target.value }))} /></div>
            <div style={fieldStyle}><label style={labelStyle}>Stock Quantity</label><input className="form-input" type="number" min="0" step="1" placeholder="Stock Quantity *" value={editFormData.stock_quantity} onChange={(e) => setEditFormData((p) => ({ ...p, stock_quantity: e.target.value }))} /></div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn btn-primary" type="submit" disabled={updating}>{updating ? 'Saving...' : 'Save Changes'}</button>
            <button className="btn btn-secondary" type="button" onClick={() => setEditingProductId(null)}>Cancel</button>
          </div>
        </form>
      )}

      {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading inventory...</p>}
      {error && <p style={{ color: 'var(--color-error-600)' }}>{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card" style={{ padding: 16 }}>
          <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', fontWeight: 700 }}>Products</p>
          <p style={{ fontSize: 28, fontWeight: 800, marginTop: 4, color: 'var(--text-primary)' }}>{filtered.length}</p>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', fontWeight: 700 }}>Total Units</p>
          <p style={{ fontSize: 28, fontWeight: 800, marginTop: 4, color: 'var(--text-primary)' }}>{totalStock.toLocaleString()}</p>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', fontWeight: 700 }}>Low Stock (&lt;5)</p>
          <p style={{ fontSize: 28, fontWeight: 800, marginTop: 4, color: 'var(--text-primary)' }}>{lowStock}</p>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', fontWeight: 700 }}>Inventory Value</p>
          <p style={{ fontSize: 28, fontWeight: 800, marginTop: 4, color: 'var(--text-primary)' }}>Rs {Math.round(inventoryValue).toLocaleString()}</p>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: 16, borderBottom: '1px solid var(--border-color)' }}>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, sku or description" className="form-input" style={{ maxWidth: 420 }} />
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: 'var(--bg-secondary)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 10 }}>
            <tr>
              <th style={{ padding: '14px 16px', textAlign: 'left' }}>SKU</th>
              <th style={{ padding: '14px 16px', textAlign: 'left' }}>Product</th>
              <th style={{ padding: '14px 16px', textAlign: 'left' }}>Store</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Price</th>
              <th style={{ padding: '14px 16px', textAlign: 'center' }}>Stock</th>
              <th style={{ padding: '14px 16px', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '14px 16px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => (
              <tr key={product.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                <td style={{ padding: '14px 16px', fontFamily: 'Courier New, monospace', fontSize: 12, color: 'var(--text-primary)' }}>{product.sku}</td>
                <td style={{ padding: '14px 16px' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>{product.name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>{product.description || '-'}</p>
                  </div>
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--text-primary)' }}>{storeById.get(product.primary_store_ref || -1)?.name || '-'}</td>
                <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>Rs {Number(product.price).toLocaleString()}</td>
                <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 800, color: 'var(--text-primary)' }}>{product.stock_quantity}</td>
                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    background: product.stock_quantity < 5 ? 'var(--color-warning-100)' : 'var(--color-success-100)',
                    color: product.stock_quantity < 5 ? 'var(--color-warning-600)' : 'var(--color-success-600)',
                  }}>
                    {product.stock_quantity < 5 ? 'Low Stock' : 'In Stock'}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button className="btn" style={{ padding: '6px 10px' }} onClick={() => handleStartEditProduct(product)}>Edit</button>
                    <button className="btn" style={{ padding: '6px 10px', background: 'var(--color-error-100)', color: 'var(--color-error-700)' }} onClick={() => void handleDeleteProduct(product)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No inventory items found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventory;
