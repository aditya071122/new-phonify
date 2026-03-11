import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, isPrivilegedUser } from '../types';
import {
  createExpense,
  deleteExpense,
  listExpenses,
  listStores,
  updateExpense,
  type ApiExpense,
  type ApiStore,
} from '../services/api';

const Expenses: React.FC<{ user: User }> = ({ user }) => {
  const fieldStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 };
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' };
  const [searchParams] = useSearchParams();
  const q = (searchParams.get('q') || '').toLowerCase();
  const storeFilter = searchParams.get('store') || 'All Stores';
  const [expenses, setExpenses] = useState<ApiExpense[]>([]);
  const [stores, setStores] = useState<ApiStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  const [form, setForm] = useState({
    store_ref: '',
    reason: '',
    out_cash: '0',
    out_online: '0',
    expense_date: new Date().toISOString().slice(0, 10),
    notes: '',
  });
  const [editForm, setEditForm] = useState({
    store_ref: '',
    reason: '',
    out_cash: '0',
    out_online: '0',
    expense_date: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const [expenseData, storeData] = await Promise.all([listExpenses(), listStores()]);
        setExpenses(expenseData);
        setStores(storeData.filter((store) => store.is_active));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load expenses');
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

  const filteredExpenses = useMemo(() => expenses.filter((expense) => {
    const matchesText = !q || expense.reason.toLowerCase().includes(q) || (expense.notes || '').toLowerCase().includes(q);
    const storeName = storeById.get(expense.store_ref || -1)?.name || '';
    const matchesStore = storeFilter === 'All Stores' || storeName === storeFilter;
    return matchesText && matchesStore;
  }), [expenses, q, storeFilter, storeById]);

  const totals = useMemo(() => ({
    total: filteredExpenses.reduce((sum, entry) => sum + Number(entry.out_cash || 0) + Number(entry.out_online || 0), 0),
    cash: filteredExpenses.reduce((sum, entry) => sum + Number(entry.out_cash || 0), 0),
    online: filteredExpenses.reduce((sum, entry) => sum + Number(entry.out_online || 0), 0),
  }), [filteredExpenses]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.reason.trim()) {
      setError('Expense reason is required.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      const created = await createExpense({
        store_ref: form.store_ref ? Number(form.store_ref) : null,
        reason: form.reason.trim(),
        out_cash: Number(form.out_cash || 0).toFixed(2),
        out_online: Number(form.out_online || 0).toFixed(2),
        expense_date: form.expense_date,
        notes: form.notes.trim(),
      });
      setExpenses((prev) => [created, ...prev]);
      setForm({
        store_ref: '',
        reason: '',
        out_cash: '0',
        out_online: '0',
        expense_date: new Date().toISOString().slice(0, 10),
        notes: '',
      });
      alert('Expense added successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (expense: ApiExpense) => {
    setEditingExpenseId(expense.id);
    setEditForm({
      store_ref: expense.store_ref ? String(expense.store_ref) : '',
      reason: expense.reason,
      out_cash: String(expense.out_cash),
      out_online: String(expense.out_online),
      expense_date: expense.expense_date,
      notes: expense.notes || '',
    });
  };

  const handleEdit = async (expense: ApiExpense) => {
    try {
      setUpdating(true);
      const updated = await updateExpense(expense.id, {
        store_ref: editForm.store_ref ? Number(editForm.store_ref) : null,
        reason: editForm.reason,
        out_cash: Number(editForm.out_cash || expense.out_cash).toFixed(2),
        out_online: Number(editForm.out_online || expense.out_online).toFixed(2),
        expense_date: editForm.expense_date,
        notes: editForm.notes,
      });
      setExpenses((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)));
      setEditingExpenseId(null);
      alert('Expense updated successfully.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update expense');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (expense: ApiExpense) => {
    if (!window.confirm(`Delete expense ${expense.reason}?`)) return;
    try {
      await deleteExpense(expense.id);
      setExpenses((prev) => prev.filter((entry) => entry.id !== expense.id));
      alert('Expense deleted successfully.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete expense');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="card" style={{ padding: 24 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>Expense Management</h1>
        <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)' }}>Real expense records synced to backend and filtered by store.</p>
      </div>

      {isPrivilegedUser(user) && (
        <form onSubmit={handleSubmit} className="card" style={{ padding: 16 }}>
          <h3 style={{ margin: '0 0 12px', color: 'var(--text-primary)', fontWeight: 800 }}>Add Expense</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div style={fieldStyle}><label style={labelStyle}>Store</label><select className="form-input" value={form.store_ref} onChange={(e) => setForm((prev) => ({ ...prev, store_ref: e.target.value }))}>
              <option value="">Select Store</option>
              {stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
            </select></div>
            <div style={fieldStyle}><label style={labelStyle}>Expense Reason</label><input className="form-input" placeholder="Reason" value={form.reason} onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))} /></div>
            <div style={fieldStyle}><label style={labelStyle}>Out Cash</label><input className="form-input" type="number" min="0" step="0.01" placeholder="Out Cash" value={form.out_cash} onChange={(e) => setForm((prev) => ({ ...prev, out_cash: e.target.value }))} /></div>
            <div style={fieldStyle}><label style={labelStyle}>Out Online</label><input className="form-input" type="number" min="0" step="0.01" placeholder="Out Online" value={form.out_online} onChange={(e) => setForm((prev) => ({ ...prev, out_online: e.target.value }))} /></div>
            <div style={fieldStyle}><label style={labelStyle}>Expense Date</label><input className="form-input" type="date" value={form.expense_date} onChange={(e) => setForm((prev) => ({ ...prev, expense_date: e.target.value }))} /></div>
          </div>
          <div style={{ ...fieldStyle, marginTop: 12 }}><label style={labelStyle}>Notes</label><textarea className="form-input" style={{ minHeight: 80 }} placeholder="Notes" value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} /></div>
          <button className="btn btn-primary" type="submit" style={{ marginTop: 12 }} disabled={saving}>{saving ? 'Saving...' : '+ Add Expense'}</button>
        </form>
      )}

      {isPrivilegedUser(user) && editingExpenseId !== null && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const expense = expenses.find((entry) => entry.id === editingExpenseId);
            if (expense) {
              void handleEdit(expense);
            }
          }}
          className="card"
          style={{ padding: 16 }}
        >
          <h3 style={{ margin: '0 0 12px', color: 'var(--text-primary)', fontWeight: 800 }}>Edit Expense</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div style={fieldStyle}><label style={labelStyle}>Store</label><select className="form-input" value={editForm.store_ref} onChange={(e) => setEditForm((prev) => ({ ...prev, store_ref: e.target.value }))}>
              <option value="">Select Store</option>
              {stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
            </select></div>
            <div style={fieldStyle}><label style={labelStyle}>Expense Reason</label><input className="form-input" placeholder="Reason" value={editForm.reason} onChange={(e) => setEditForm((prev) => ({ ...prev, reason: e.target.value }))} /></div>
            <div style={fieldStyle}><label style={labelStyle}>Out Cash</label><input className="form-input" type="number" min="0" step="0.01" placeholder="Out Cash" value={editForm.out_cash} onChange={(e) => setEditForm((prev) => ({ ...prev, out_cash: e.target.value }))} /></div>
            <div style={fieldStyle}><label style={labelStyle}>Out Online</label><input className="form-input" type="number" min="0" step="0.01" placeholder="Out Online" value={editForm.out_online} onChange={(e) => setEditForm((prev) => ({ ...prev, out_online: e.target.value }))} /></div>
            <div style={fieldStyle}><label style={labelStyle}>Expense Date</label><input className="form-input" type="date" value={editForm.expense_date} onChange={(e) => setEditForm((prev) => ({ ...prev, expense_date: e.target.value }))} /></div>
          </div>
          <div style={{ ...fieldStyle, marginTop: 12 }}><label style={labelStyle}>Notes</label><textarea className="form-input" style={{ minHeight: 80 }} placeholder="Notes" value={editForm.notes} onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))} /></div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn btn-primary" type="submit" disabled={updating}>{updating ? 'Saving...' : 'Save Changes'}</button>
            <button className="btn btn-secondary" type="button" onClick={() => setEditingExpenseId(null)}>Cancel</button>
          </div>
        </form>
      )}

      {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading expenses...</p>}
      {error && <p style={{ color: 'var(--color-error-600)' }}>{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card" style={{ padding: 16 }}><p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', fontWeight: 700 }}>Total Expense</p><p style={{ fontSize: 28, fontWeight: 800, marginTop: 4, color: 'var(--text-primary)' }}>Rs {Math.round(totals.total).toLocaleString()}</p></div>
        <div className="card" style={{ padding: 16 }}><p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', fontWeight: 700 }}>Cash Out</p><p style={{ fontSize: 28, fontWeight: 800, marginTop: 4, color: 'var(--text-primary)' }}>Rs {Math.round(totals.cash).toLocaleString()}</p></div>
        <div className="card" style={{ padding: 16 }}><p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', fontWeight: 700 }}>Online Out</p><p style={{ fontSize: 28, fontWeight: 800, marginTop: 4, color: 'var(--text-primary)' }}>Rs {Math.round(totals.online).toLocaleString()}</p></div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: 'var(--bg-secondary)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 10 }}>
            <tr>
              <th style={{ padding: '14px 16px', textAlign: 'left' }}>Store</th>
              <th style={{ padding: '14px 16px', textAlign: 'left' }}>Reason</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Cash</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Online</th>
              <th style={{ padding: '14px 16px', textAlign: 'left' }}>Date</th>
              <th style={{ padding: '14px 16px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map((expense) => (
              <tr key={expense.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                <td style={{ padding: '14px 16px', color: 'var(--text-primary)' }}>{storeById.get(expense.store_ref || -1)?.name || '-'}</td>
                <td style={{ padding: '14px 16px', color: 'var(--text-primary)' }}>{expense.reason}</td>
                <td style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--text-primary)' }}>Rs {Number(expense.out_cash).toLocaleString()}</td>
                <td style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--text-primary)' }}>Rs {Number(expense.out_online).toLocaleString()}</td>
                <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{expense.expense_date}</td>
                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                  {isPrivilegedUser(user) ? (
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button className="btn" style={{ padding: '6px 10px' }} onClick={() => handleStartEdit(expense)}>Edit</button>
                      <button className="btn" style={{ padding: '6px 10px', background: 'var(--color-error-100)', color: 'var(--color-error-700)' }} onClick={() => void handleDelete(expense)}>Delete</button>
                    </div>
                  ) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Expenses;
