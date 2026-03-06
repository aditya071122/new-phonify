import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User } from '../types';
import { createProduct, listProducts, type ApiProduct } from '../services/api';

const Inventory: React.FC<{ user: User }> = ({ user }) => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: 'new_phone' as NonNullable<ApiProduct['category']>,
    description: '',
    price: '',
    stock_quantity: '0',
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await listProducts();
        setProducts(data);
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    );
  }, [products, search]);

  const lowStock = filtered.filter((p) => p.stock_quantity < 5).length;
  const totalStock = filtered.reduce((sum, p) => sum + p.stock_quantity, 0);
  const inventoryValue = filtered.reduce((sum, p) => sum + Number(p.price) * p.stock_quantity, 0);

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
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to create inventory item');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="card" style={{ padding: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Inventory Management</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '4px 0 0' }}>Live inventory from backend products</p>
      </div>

      {user.role === 'Admin' && (
        <form onSubmit={handleAddInventoryItem} className="card" style={{ padding: 16 }}>
          <h3 style={{ margin: '0 0 12px', color: 'var(--text-primary)', fontWeight: 800 }}>Add Inventory Item</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="form-input" placeholder="SKU *" value={formData.sku} onChange={(e) => setFormData((p) => ({ ...p, sku: e.target.value }))} />
            <input className="form-input" placeholder="Product Name *" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} />
            <select className="form-input" value={formData.category} onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value as NonNullable<ApiProduct['category']> }))}>
              <option value="new_phone">New Phone</option>
              <option value="used_phone">Used Phone</option>
              <option value="accessories">Accessories</option>
              <option value="services">Services</option>
            </select>
            <input className="form-input" placeholder="Description" value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} />
            <input className="form-input" type="number" min="0" step="0.01" placeholder="Price *" value={formData.price} onChange={(e) => setFormData((p) => ({ ...p, price: e.target.value }))} />
            <input className="form-input" type="number" min="0" step="1" placeholder="Stock Quantity *" value={formData.stock_quantity} onChange={(e) => setFormData((p) => ({ ...p, stock_quantity: e.target.value }))} />
          </div>
          {formError && <p style={{ color: 'var(--color-error-600)', margin: '8px 0 0' }}>{formError}</p>}
          <button className="btn btn-primary" style={{ marginTop: 12 }} type="submit" disabled={creating}>
            {creating ? 'Creating...' : '+ Add Inventory Item'}
          </button>
        </form>
      )}

      {user.role !== 'Admin' && (
        <p style={{ color: 'var(--text-secondary)' }}>Inventory items can only be added by Admin.</p>
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
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, sku or description"
            className="form-input"
            style={{ maxWidth: 420 }}
          />
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: 'var(--bg-secondary)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 10 }}>
            <tr>
              <th style={{ padding: '14px 16px', textAlign: 'left' }}>SKU</th>
              <th style={{ padding: '14px 16px', textAlign: 'left' }}>Product</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Price</th>
              <th style={{ padding: '14px 16px', textAlign: 'center' }}>Stock</th>
              <th style={{ padding: '14px 16px', textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                <td style={{ padding: '14px 16px', fontFamily: 'Courier New, monospace', fontSize: 12, color: 'var(--text-primary)' }}>{p.sku}</td>
                <td style={{ padding: '14px 16px' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>{p.description || '-'}</p>
                  </div>
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>Rs {Number(p.price).toLocaleString()}</td>
                <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 800, color: 'var(--text-primary)' }}>{p.stock_quantity}</td>
                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    background: p.stock_quantity < 5 ? 'var(--color-warning-100)' : 'var(--color-success-100)',
                    color: p.stock_quantity < 5 ? 'var(--color-warning-600)' : 'var(--color-success-600)',
                  }}>
                    {p.stock_quantity < 5 ? 'Low Stock' : 'In Stock'}
                  </span>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No inventory items found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventory;
