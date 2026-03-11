import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, isPrivilegedUser } from '../types';
import {
  createPaymentEntry,
  deletePaymentEntry,
  listPaymentEntries,
  listStores,
  updatePaymentEntry,
  type ApiPaymentEntry,
  type ApiStore,
} from '../services/api';

const Payments: React.FC<{ user: User }> = ({ user }) => {
  const fieldStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 };
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' };
  const [searchParams] = useSearchParams();
  const q = (searchParams.get('q') || '').toLowerCase();
  const storeFilter = searchParams.get('store') || 'All Stores';
  const [payments, setPayments] = useState<ApiPaymentEntry[]>([]);
  const [stores, setStores] = useState<ApiStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);
  const [form, setForm] = useState({
    store_ref: '',
    entry_type: 'in' as 'in' | 'out',
    dealer_name: '',
    cash_amount: '0',
    online_amount: '0',
    entry_date: new Date().toISOString().slice(0, 10),
    notes: '',
  });
  const [editForm, setEditForm] = useState({
    store_ref: '',
    entry_type: 'in' as 'in' | 'out',
    dealer_name: '',
    cash_amount: '0',
    online_amount: '0',
    entry_date: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const [paymentData, storeData] = await Promise.all([listPaymentEntries(), listStores()]);
        setPayments(paymentData);
        setStores(storeData.filter((store) => store.is_active));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load payments');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const storeById = useMemo(() => {
    const map = new Map<number, ApiStore>();
    stores.forEach((store) => map.set(store.id, store));
    return map;
  }, [stores]);

  const filteredPayments = useMemo(() => payments.filter((entry) => {
    const matchesText = !q || entry.dealer_name.toLowerCase().includes(q) || (entry.notes || '').toLowerCase().includes(q);
    const storeName = storeById.get(entry.store_ref || -1)?.name || '';
    const matchesStore = storeFilter === 'All Stores' || storeName === storeFilter;
    return matchesText && matchesStore;
  }), [payments, q, storeFilter, storeById]);

  const inEntries = filteredPayments.filter((entry) => entry.entry_type === 'in');
  const outEntries = filteredPayments.filter((entry) => entry.entry_type === 'out');

  const metrics = useMemo(() => ({
    receivable: inEntries.reduce((sum, entry) => sum + Number(entry.cash_amount || 0) + Number(entry.online_amount || 0), 0),
    payable: outEntries.reduce((sum, entry) => sum + Number(entry.cash_amount || 0) + Number(entry.online_amount || 0), 0),
  }), [inEntries, outEntries]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.dealer_name.trim()) {
      setError('Dealer name is required.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      const created = await createPaymentEntry({
        store_ref: form.store_ref ? Number(form.store_ref) : null,
        entry_type: form.entry_type,
        dealer_name: form.dealer_name.trim(),
        cash_amount: Number(form.cash_amount || 0).toFixed(2),
        online_amount: Number(form.online_amount || 0).toFixed(2),
        entry_date: form.entry_date,
        notes: form.notes.trim(),
      });
      setPayments((prev) => [created, ...prev]);
      setForm({
        store_ref: '',
        entry_type: 'in',
        dealer_name: '',
        cash_amount: '0',
        online_amount: '0',
        entry_date: new Date().toISOString().slice(0, 10),
        notes: '',
      });
      alert('Payment entry added successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save payment entry');
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (entry: ApiPaymentEntry) => {
    setEditingPaymentId(entry.id);
    setEditForm({
      store_ref: entry.store_ref ? String(entry.store_ref) : '',
      entry_type: entry.entry_type,
      dealer_name: entry.dealer_name,
      cash_amount: String(entry.cash_amount),
      online_amount: String(entry.online_amount),
      entry_date: entry.entry_date,
      notes: entry.notes || '',
    });
  };

  const handleEdit = async (entry: ApiPaymentEntry) => {
    try {
      setUpdating(true);
      const updated = await updatePaymentEntry(entry.id, {
        store_ref: editForm.store_ref ? Number(editForm.store_ref) : null,
        entry_type: editForm.entry_type,
        dealer_name: editForm.dealer_name,
        cash_amount: Number(editForm.cash_amount || entry.cash_amount).toFixed(2),
        online_amount: Number(editForm.online_amount || entry.online_amount).toFixed(2),
        entry_date: editForm.entry_date,
        notes: editForm.notes,
      });
      setPayments((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setEditingPaymentId(null);
      alert('Payment entry updated successfully.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update entry');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (entry: ApiPaymentEntry) => {
    if (!window.confirm(`Delete ${entry.dealer_name}?`)) return;
    try {
      await deletePaymentEntry(entry.id);
      setPayments((prev) => prev.filter((item) => item.id !== entry.id));
      alert('Payment entry deleted successfully.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete entry');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="card" style={{ padding: 24 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>Pending Payments & Dues</h1>
        <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)' }}>Manage receivables and outgoing payments with store-wise filtering.</p>
      </div>

      {isPrivilegedUser(user) && (
        <form onSubmit={handleSubmit} className="card" style={{ padding: 16 }}>
          <h3 style={{ margin: '0 0 12px', color: 'var(--text-primary)', fontWeight: 800 }}>Add Payment Entry</h3>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div style={fieldStyle}><label style={labelStyle}>Store</label><select className="form-input" value={form.store_ref} onChange={(e) => setForm((prev) => ({ ...prev, store_ref: e.target.value }))}>
              <option value="">Select Store</option>
              {stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
            </select></div>
            <div style={fieldStyle}><label style={labelStyle}>Entry Type</label><select className="form-input" value={form.entry_type} onChange={(e) => setForm((prev) => ({ ...prev, entry_type: e.target.value as 'in' | 'out' }))}>
              <option value="in">Pending In</option>
              <option value="out">Payments Out</option>
            </select></div>
            <div style={fieldStyle}><label style={labelStyle}>Dealer Name</label><input className="form-input" placeholder="Dealer Name" value={form.dealer_name} onChange={(e) => setForm((prev) => ({ ...prev, dealer_name: e.target.value }))} /></div>
            <div style={fieldStyle}><label style={labelStyle}>Cash Amount</label><input className="form-input" type="number" min="0" step="0.01" placeholder="Cash" value={form.cash_amount} onChange={(e) => setForm((prev) => ({ ...prev, cash_amount: e.target.value }))} /></div>
            <div style={fieldStyle}><label style={labelStyle}>Online Amount</label><input className="form-input" type="number" min="0" step="0.01" placeholder="Online" value={form.online_amount} onChange={(e) => setForm((prev) => ({ ...prev, online_amount: e.target.value }))} /></div>
            <div style={fieldStyle}><label style={labelStyle}>Entry Date</label><input className="form-input" type="date" value={form.entry_date} onChange={(e) => setForm((prev) => ({ ...prev, entry_date: e.target.value }))} /></div>
          </div>
          <div style={{ ...fieldStyle, marginTop: 12 }}><label style={labelStyle}>Notes</label><textarea className="form-input" style={{ minHeight: 80 }} placeholder="Notes" value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} /></div>
          <button className="btn btn-primary" type="submit" style={{ marginTop: 12 }} disabled={saving}>{saving ? 'Saving...' : '+ Add Entry'}</button>
        </form>
      )}

      {isPrivilegedUser(user) && editingPaymentId !== null && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const entry = payments.find((item) => item.id === editingPaymentId);
            if (entry) {
              void handleEdit(entry);
            }
          }}
          className="card"
          style={{ padding: 16 }}
        >
          <h3 style={{ margin: '0 0 12px', color: 'var(--text-primary)', fontWeight: 800 }}>Edit Payment Entry</h3>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div style={fieldStyle}><label style={labelStyle}>Store</label><select className="form-input" value={editForm.store_ref} onChange={(e) => setEditForm((prev) => ({ ...prev, store_ref: e.target.value }))}>
              <option value="">Select Store</option>
              {stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
            </select></div>
            <div style={fieldStyle}><label style={labelStyle}>Entry Type</label><select className="form-input" value={editForm.entry_type} onChange={(e) => setEditForm((prev) => ({ ...prev, entry_type: e.target.value as 'in' | 'out' }))}>
              <option value="in">Pending In</option>
              <option value="out">Payments Out</option>
            </select></div>
            <div style={fieldStyle}><label style={labelStyle}>Dealer Name</label><input className="form-input" placeholder="Dealer Name" value={editForm.dealer_name} onChange={(e) => setEditForm((prev) => ({ ...prev, dealer_name: e.target.value }))} /></div>
            <div style={fieldStyle}><label style={labelStyle}>Cash Amount</label><input className="form-input" type="number" min="0" step="0.01" placeholder="Cash" value={editForm.cash_amount} onChange={(e) => setEditForm((prev) => ({ ...prev, cash_amount: e.target.value }))} /></div>
            <div style={fieldStyle}><label style={labelStyle}>Online Amount</label><input className="form-input" type="number" min="0" step="0.01" placeholder="Online" value={editForm.online_amount} onChange={(e) => setEditForm((prev) => ({ ...prev, online_amount: e.target.value }))} /></div>
            <div style={fieldStyle}><label style={labelStyle}>Entry Date</label><input className="form-input" type="date" value={editForm.entry_date} onChange={(e) => setEditForm((prev) => ({ ...prev, entry_date: e.target.value }))} /></div>
          </div>
          <div style={{ ...fieldStyle, marginTop: 12 }}><label style={labelStyle}>Notes</label><textarea className="form-input" style={{ minHeight: 80 }} placeholder="Notes" value={editForm.notes} onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))} /></div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn btn-primary" type="submit" disabled={updating}>{updating ? 'Saving...' : 'Save Changes'}</button>
            <button className="btn btn-secondary" type="button" onClick={() => setEditingPaymentId(null)}>Cancel</button>
          </div>
        </form>
      )}

      {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading payment entries...</p>}
      {error && <p style={{ color: 'var(--color-error-600)' }}>{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card" style={{ padding: 16 }}><p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', fontWeight: 700 }}>Pending In</p><p style={{ fontSize: 28, fontWeight: 800, marginTop: 4, color: 'var(--text-primary)' }}>Rs {Math.round(metrics.receivable).toLocaleString()}</p></div>
        <div className="card" style={{ padding: 16 }}><p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', fontWeight: 700 }}>Payments Out</p><p style={{ fontSize: 28, fontWeight: 800, marginTop: 4, color: 'var(--text-primary)' }}>Rs {Math.round(metrics.payable).toLocaleString()}</p></div>
        <div className="card" style={{ padding: 16 }}><p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', fontWeight: 700 }}>Net Flow</p><p style={{ fontSize: 28, fontWeight: 800, marginTop: 4, color: 'var(--text-primary)' }}>Rs {Math.round(metrics.receivable - metrics.payable).toLocaleString()}</p></div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {[
          { title: 'Pending IN', type: 'in' as const },
          { title: 'Payments OUT', type: 'out' as const },
        ].map((section) => (
          <div key={section.type} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: 16, borderBottom: '1px solid var(--border-color)', fontWeight: 800, color: 'var(--text-primary)' }}>{section.title}</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'var(--bg-secondary)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 10 }}>
                <tr>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Store</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Dealer Name</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right' }}>Cash</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right' }}>Online</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.filter((entry) => entry.entry_type === section.type).map((entry) => (
                  <tr key={entry.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '14px 16px', color: 'var(--text-primary)' }}>{storeById.get(entry.store_ref || -1)?.name || '-'}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-primary)' }}>{entry.dealer_name}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--text-primary)' }}>Rs {Number(entry.cash_amount).toLocaleString()}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--text-primary)' }}>Rs {Number(entry.online_amount).toLocaleString()}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{entry.entry_date}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      {isPrivilegedUser(user) ? (
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                          <button className="btn" style={{ padding: '6px 10px' }} onClick={() => handleStartEdit(entry)}>Edit</button>
                          <button className="btn" style={{ padding: '6px 10px', background: 'var(--color-error-100)', color: 'var(--color-error-700)' }} onClick={() => void handleDelete(entry)}>Delete</button>
                        </div>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Payments;
