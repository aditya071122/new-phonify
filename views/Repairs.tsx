import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, isPrivilegedUser } from '../types';
import {
  createRepair,
  deleteRepair,
  listRepairs,
  listStores,
  updateRepair,
  type ApiRepairTicket,
  type ApiStore,
} from '../services/api';
import './Repairs.css';

const statuses = ['Pending', 'In Progress', 'Completed', 'Delivered'] as const;

const Repairs: React.FC<{ user: User }> = ({ user }) => {
  const [searchParams] = useSearchParams();
  const q = (searchParams.get('q') || '').toLowerCase();
  const storeFilter = searchParams.get('store') || 'All Stores';
  const [tickets, setTickets] = useState<ApiRepairTicket[]>([]);
  const [stores, setStores] = useState<ApiStore[]>([]);
  const [selectedTicket, setSelectedTicket] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    customer_name: '',
    store_ref: '',
    device_model: '',
    problem: '',
    technician_name: '',
    parts_charge: '0',
    labor_cost: '0',
    got_amount: '0',
    in_cash: '0',
    in_online: '0',
    out_cash: '0',
    out_online: '0',
    warranty: '3 months' as '3 months' | '6 months' | '12 months',
    estimated_completion: '',
    notes: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const [repairData, storeData] = await Promise.all([listRepairs(), listStores()]);
        setTickets(repairData);
        setStores(storeData.filter((store) => store.is_active));
        setSelectedTicket(0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load repairs');
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

  const filteredTickets = useMemo(() => tickets.filter((ticket) => {
    const matchesText = !q
      || ticket.ticket_no.toLowerCase().includes(q)
      || ticket.customer_name.toLowerCase().includes(q)
      || ticket.device_model.toLowerCase().includes(q);
    const storeName = storeById.get(ticket.store_ref || -1)?.name || '';
    const matchesStore = storeFilter === 'All Stores' || storeName === storeFilter;
    return matchesText && matchesStore;
  }), [tickets, q, storeFilter, storeById]);

  useEffect(() => {
    if (selectedTicket >= filteredTickets.length) {
      setSelectedTicket(0);
    }
  }, [filteredTickets.length, selectedTicket]);

  const ticket = filteredTickets[selectedTicket];

  const totals = useMemo(() => {
    if (!ticket) return { partsCost: 0, grandTotal: 0, stepIndex: 0 };
    const jsonPartsCost = (ticket.parts || []).reduce((sum, part) => sum + (part.qty * part.unitCost), 0);
    const partsCost = Math.max(jsonPartsCost, Number(ticket.parts_charge || 0));
    const labor = Number(ticket.labor_cost || 0);
    const stepIndex = statuses.indexOf(ticket.status);
    return { partsCost, grandTotal: partsCost + labor, stepIndex: Math.max(0, stepIndex) };
  }, [ticket]);

  const handleCreateTicket = async () => {
    if (!form.customer_name.trim() || !form.device_model.trim()) {
      alert('Customer name and device model are required');
      return;
    }
    if (!form.store_ref) {
      alert('Store is required');
      return;
    }

    const ticketNo = `SVC${Date.now().toString().slice(-8)}`;

    try {
      const created = await createRepair({
        ticket_no: ticketNo,
        customer_name: form.customer_name.trim(),
        store_ref: Number(form.store_ref),
        device_model: form.device_model.trim(),
        problem: form.problem.trim(),
        technician_name: form.technician_name.trim(),
        parts_charge: Number(form.parts_charge || 0).toFixed(2),
        labor_cost: Number(form.labor_cost || 0).toFixed(2),
        got_amount: Number(form.got_amount || 0).toFixed(2),
        in_cash: Number(form.in_cash || 0).toFixed(2),
        in_online: Number(form.in_online || 0).toFixed(2),
        out_cash: Number(form.out_cash || 0).toFixed(2),
        out_online: Number(form.out_online || 0).toFixed(2),
        warranty: form.warranty,
        estimated_completion: form.estimated_completion || null,
        notes: form.notes,
        status: 'Pending',
        parts: [],
      });

      setTickets((prev) => [created, ...prev]);
      setSelectedTicket(0);
      setShowForm(false);
      setForm({
        customer_name: '',
        store_ref: '',
        device_model: '',
        problem: '',
        technician_name: '',
        parts_charge: '0',
        labor_cost: '0',
        got_amount: '0',
        in_cash: '0',
        in_online: '0',
        out_cash: '0',
        out_online: '0',
        warranty: '3 months',
        estimated_completion: '',
        notes: '',
      });
      alert('Repair ticket created successfully.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create ticket');
    }
  };

  const handleMoveNextStatus = async () => {
    if (!ticket || isPrivilegedUser(user)) return;
    const idx = statuses.indexOf(ticket.status);
    if (idx >= statuses.length - 1) return;

    const nextStatus = statuses[idx + 1];
    try {
      const updated = await updateRepair(ticket.id, { status: nextStatus });
      setTickets((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)));
      alert('Repair status updated successfully.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update ticket status');
    }
  };

  const handleEdit = async (current: ApiRepairTicket) => {
    const technician = window.prompt('Technician', current.technician_name || '');
    if (technician === null) return;
    const status = window.prompt('Status (Pending/In Progress/Completed/Delivered)', current.status);
    if (status === null) return;
    const partsCharge = window.prompt('Parts charge', current.parts_charge || '0');
    if (partsCharge === null) return;
    try {
      const updated = await updateRepair(current.id, {
        technician_name: technician,
        parts_charge: Number(partsCharge || current.parts_charge || 0).toFixed(2),
        status: status as ApiRepairTicket['status'],
      });
      setTickets((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)));
      alert('Repair updated successfully.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update repair');
    }
  };

  const handleDelete = async (current: ApiRepairTicket) => {
    if (!window.confirm(`Delete repair ticket ${current.ticket_no}?`)) return;
    try {
      await deleteRepair(current.id);
      setTickets((prev) => prev.filter((entry) => entry.id !== current.id));
      alert('Repair deleted successfully.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete repair');
    }
  };

  return (
    <div className="repairs-container">
      <div className="repairs-header">
        <h1>Repair Service Module</h1>
        {!isPrivilegedUser(user) && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Close Form' : '+ New Service Ticket'}
          </button>
        )}
      </div>

      {loading && <p>Loading repair tickets...</p>}
      {error && <p style={{ color: '#dc2626' }}>{error}</p>}

      {showForm && !isPrivilegedUser(user) && (
        <div className="info-card" style={{ marginBottom: 20 }}>
          <h4>Create Repair Ticket</h4>
          <div className="info-grid">
            <div className="info-item">
              <label>Customer Name</label>
              <input value={form.customer_name} onChange={(e) => setForm((p) => ({ ...p, customer_name: e.target.value }))} className="form-input" />
            </div>
            <div className="info-item">
              <label>Store</label>
              <select value={form.store_ref} onChange={(e) => setForm((p) => ({ ...p, store_ref: e.target.value }))} className="form-input">
                <option value="">Select Store</option>
                {stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
              </select>
            </div>
            <div className="info-item">
              <label>Device Model</label>
              <input value={form.device_model} onChange={(e) => setForm((p) => ({ ...p, device_model: e.target.value }))} className="form-input" />
            </div>
            <div className="info-item">
              <label>Problem</label>
              <input value={form.problem} onChange={(e) => setForm((p) => ({ ...p, problem: e.target.value }))} className="form-input" />
            </div>
            <div className="info-item">
              <label>Technician</label>
              <input value={form.technician_name} onChange={(e) => setForm((p) => ({ ...p, technician_name: e.target.value }))} className="form-input" />
            </div>
            <div className="info-item">
              <label>Parts Charge</label>
              <input type="number" value={form.parts_charge} onChange={(e) => setForm((p) => ({ ...p, parts_charge: e.target.value }))} className="form-input" />
            </div>
            <div className="info-item">
              <label>Labor Cost</label>
              <input type="number" value={form.labor_cost} onChange={(e) => setForm((p) => ({ ...p, labor_cost: e.target.value }))} className="form-input" />
            </div>
            <div className="info-item">
              <label>Got</label>
              <input type="number" value={form.got_amount} onChange={(e) => setForm((p) => ({ ...p, got_amount: e.target.value }))} className="form-input" />
            </div>
            <div className="info-item">
              <label>In Cash</label>
              <input type="number" value={form.in_cash} onChange={(e) => setForm((p) => ({ ...p, in_cash: e.target.value }))} className="form-input" />
            </div>
            <div className="info-item">
              <label>In Online</label>
              <input type="number" value={form.in_online} onChange={(e) => setForm((p) => ({ ...p, in_online: e.target.value }))} className="form-input" />
            </div>
            <div className="info-item">
              <label>Out Cash</label>
              <input type="number" value={form.out_cash} onChange={(e) => setForm((p) => ({ ...p, out_cash: e.target.value }))} className="form-input" />
            </div>
            <div className="info-item">
              <label>Out Online</label>
              <input type="number" value={form.out_online} onChange={(e) => setForm((p) => ({ ...p, out_online: e.target.value }))} className="form-input" />
            </div>
            <div className="info-item">
              <label>Warranty</label>
              <select value={form.warranty} onChange={(e) => setForm((p) => ({ ...p, warranty: e.target.value as '3 months' | '6 months' | '12 months' }))} className="form-input">
                <option value="3 months">3 months</option>
                <option value="6 months">6 months</option>
                <option value="12 months">12 months</option>
              </select>
            </div>
            <div className="info-item">
              <label>Estimated Completion</label>
              <input type="date" value={form.estimated_completion} onChange={(e) => setForm((p) => ({ ...p, estimated_completion: e.target.value }))} className="form-input" />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <button className="btn btn-primary" onClick={() => void handleCreateTicket()}>Create Ticket</button>
          </div>
        </div>
      )}

      <div className="tickets-section">
        <h3>{isPrivilegedUser(user) ? 'Repair Reports View' : 'Active Service Tickets'}</h3>
        <div className="ticket-list">
          {filteredTickets.map((entry, index) => (
            <div key={entry.id} className={`ticket-card ${selectedTicket === index ? 'active' : ''}`} onClick={() => setSelectedTicket(index)}>
              <div className="ticket-header">
                <strong>{entry.ticket_no}</strong>
                <span className={`status-badge status-${entry.status.toLowerCase().replace(' ', '-')}`}>
                  {entry.status}
                </span>
              </div>
              <p className="ticket-info">{entry.customer_name} - {entry.device_model}</p>
              <p className="ticket-tech">Store: {storeById.get(entry.store_ref || -1)?.name || '-'}</p>
              <p className="ticket-tech">Technician: {entry.technician_name || '-'}</p>
            </div>
          ))}
          {!loading && filteredTickets.length === 0 && <p>No repair tickets found.</p>}
        </div>
      </div>

      {ticket && (
        <div className="ticket-details">
          <div className="status-stepper">
            <div className="stepper-header">
              <h3>Service Status</h3>
              <span className="stepper-info">Step {totals.stepIndex + 1} of 4</span>
            </div>
            <div className="stepper-container">
              {statuses.map((status, index) => (
                <div key={status} className="stepper-item">
                  <div className={`stepper-dot ${index <= totals.stepIndex ? 'active' : ''}`}>
                    {index < totals.stepIndex ? 'OK' : index + 1}
                  </div>
                  <span className={`stepper-label ${index <= totals.stepIndex ? 'active' : ''}`}>{status}</span>
                  {index < statuses.length - 1 && <div className={`stepper-line ${index < totals.stepIndex ? 'active' : ''}`} />}
                </div>
              ))}
            </div>
          </div>

          <div className="info-section">
            <div className="info-card">
              <h4>Customer Information</h4>
              <div className="info-grid">
                <div className="info-item"><label>Customer Name</label><p>{ticket.customer_name}</p></div>
                <div className="info-item"><label>Ticket ID</label><p className="monospace">{ticket.ticket_no}</p></div>
                <div className="info-item"><label>Device Model</label><p>{ticket.device_model}</p></div>
                <div className="info-item"><label>Problem</label><p>{ticket.problem || '-'}</p></div>
                <div className="info-item"><label>Store</label><p>{storeById.get(ticket.store_ref || -1)?.name || '-'}</p></div>
                <div className="info-item"><label>Technician</label><p>{ticket.technician_name || '-'}</p></div>
              </div>
            </div>

            <div className="info-card warranty-card">
              <h4>Timeline & Warranty</h4>
              <div className="timeline-info">
                <div className="timeline-item"><span className="label">Date Received</span><span className="value">{ticket.created_at.slice(0, 10)}</span></div>
                <div className="timeline-item"><span className="label">Est. Completion</span><span className="value">{ticket.estimated_completion || '-'}</span></div>
                <div className="timeline-item"><span className="label">Warranty</span><span className="warranty-badge">{ticket.warranty}</span></div>
              </div>
            </div>
          </div>

          <div className="costs-section">
            <div className="parts-card">
              <h4>Replacement Parts</h4>
              <table className="parts-table">
                <thead>
                  <tr><th>Part Name</th><th>Quantity</th><th>Unit Cost</th><th>Total</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {(ticket.parts || []).map((part, index) => (
                    <tr key={index}>
                      <td className="part-name">{part.name}</td>
                      <td className="qty">{part.qty}</td>
                      <td className="price">Rs {part.unitCost.toLocaleString()}</td>
                      <td className="total">Rs {(part.qty * part.unitCost).toLocaleString()}</td>
                      <td><span className={`part-status status-${part.status.toLowerCase()}`}>{part.status}</span></td>
                    </tr>
                  ))}
                  {ticket.parts.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 12 }}>No parts added</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="cost-summary">
              <h4>Cost Summary</h4>
              <div className="summary-item"><span>Parts Cost</span><strong>Rs {totals.partsCost.toLocaleString()}</strong></div>
              <div className="summary-item"><span>Parts Charge</span><strong>Rs {Number(ticket.parts_charge || 0).toLocaleString()}</strong></div>
              <div className="summary-item"><span>Labor Cost</span><strong>Rs {Number(ticket.labor_cost).toLocaleString()}</strong></div>
              <div className="summary-item"><span>Got</span><strong>Rs {Number(ticket.got_amount || 0).toLocaleString()}</strong></div>
              <div className="summary-divider"></div>
              <div className="summary-item total"><span>Grand Total</span><strong>Rs {totals.grandTotal.toLocaleString()}</strong></div>
            </div>
          </div>

          <div className="actions-section">
            {!isPrivilegedUser(user) && (
              <>
                {ticket.status !== 'Delivered' && (
                  <button className="btn btn-primary" onClick={() => void handleMoveNextStatus()}>Move to Next Status</button>
                )}
                <button className="btn" onClick={() => void handleEdit(ticket)}>Edit Ticket</button>
                <button className="btn" style={{ background: '#fee2e2', color: '#b91c1c' }} onClick={() => void handleDelete(ticket)}>Delete Ticket</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Repairs;
