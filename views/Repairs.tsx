import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createRepair, listRepairs, updateRepair, type ApiRepairTicket } from '../services/api';
import './Repairs.css';

const statuses = ['Pending', 'In Progress', 'Completed', 'Delivered'] as const;

const Repairs: React.FC = () => {
  const [searchParams] = useSearchParams();
  const q = (searchParams.get('q') || '').toLowerCase();
  const [tickets, setTickets] = useState<ApiRepairTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    customer_name: '',
    device_model: '',
    technician_name: '',
    labor_cost: '0',
    warranty: '3 months' as '3 months' | '6 months' | '12 months',
    estimated_completion: '',
    notes: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await listRepairs();
        setTickets(data);
        setSelectedTicket(0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load repairs');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const ticket = tickets[selectedTicket];

  const totals = useMemo(() => {
    if (!ticket) return { partsCost: 0, grandTotal: 0, stepIndex: 0 };
    const partsCost = (ticket.parts || []).reduce((sum, part) => sum + (part.qty * part.unitCost), 0);
    const labor = Number(ticket.labor_cost || 0);
    const stepIndex = statuses.indexOf(ticket.status);
    return { partsCost, grandTotal: partsCost + labor, stepIndex: Math.max(0, stepIndex) };
  }, [ticket]);

  const handleCreateTicket = async () => {
    if (!form.customer_name.trim() || !form.device_model.trim()) {
      alert('Customer name and device model are required');
      return;
    }

    const ticketNo = `SVC${Date.now().toString().slice(-8)}`;

    try {
      const created = await createRepair({
        ticket_no: ticketNo,
        customer_name: form.customer_name.trim(),
        device_model: form.device_model.trim(),
        technician_name: form.technician_name.trim(),
        labor_cost: Number(form.labor_cost || 0).toFixed(2),
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
        device_model: '',
        technician_name: '',
        labor_cost: '0',
        warranty: '3 months',
        estimated_completion: '',
        notes: '',
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create ticket');
    }
  };

  const handleMoveNextStatus = async () => {
    if (!ticket) return;
    const idx = statuses.indexOf(ticket.status);
    if (idx >= statuses.length - 1) return;

    const nextStatus = statuses[idx + 1];
    try {
      const updated = await updateRepair(ticket.id, { status: nextStatus });
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update ticket status');
    }
  };

  return (
    <div className="repairs-container">
      <div className="repairs-header">
        <h1>Repair Service Module</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Close Form' : '+ New Service Ticket'}
        </button>
      </div>

      {loading && <p>Loading repair tickets...</p>}
      {error && <p style={{ color: '#dc2626' }}>{error}</p>}

      {showForm && (
        <div className="info-card" style={{ marginBottom: 20 }}>
          <h4>Create Repair Ticket</h4>
          <div className="info-grid">
            <div className="info-item">
              <label>Customer Name</label>
              <input value={form.customer_name} onChange={(e) => setForm((p) => ({ ...p, customer_name: e.target.value }))} className="form-input" />
            </div>
            <div className="info-item">
              <label>Device Model</label>
              <input value={form.device_model} onChange={(e) => setForm((p) => ({ ...p, device_model: e.target.value }))} className="form-input" />
            </div>
            <div className="info-item">
              <label>Technician</label>
              <input value={form.technician_name} onChange={(e) => setForm((p) => ({ ...p, technician_name: e.target.value }))} className="form-input" />
            </div>
            <div className="info-item">
              <label>Labor Cost</label>
              <input type="number" value={form.labor_cost} onChange={(e) => setForm((p) => ({ ...p, labor_cost: e.target.value }))} className="form-input" />
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
            <button className="btn btn-primary" onClick={handleCreateTicket}>Create Ticket</button>
          </div>
        </div>
      )}

      <div className="tickets-section">
        <h3>Active Service Tickets</h3>
        <div className="ticket-list">
          {tickets.filter((t) => !q || t.ticket_no.toLowerCase().includes(q) || t.customer_name.toLowerCase().includes(q) || t.device_model.toLowerCase().includes(q)).map((t, i) => (
            <div
              key={t.id}
              className={`ticket-card ${selectedTicket === i ? 'active' : ''}`}
              onClick={() => setSelectedTicket(i)}
            >
              <div className="ticket-header">
                <strong>{t.ticket_no}</strong>
                <span className={`status-badge status-${t.status.toLowerCase().replace(' ', '-')}`}>
                  {t.status}
                </span>
              </div>
              <p className="ticket-info">{t.customer_name} - {t.device_model}</p>
              <p className="ticket-tech">Technician: {t.technician_name || '-'}</p>
            </div>
          ))}
          {!loading && tickets.length === 0 && <p>No repair tickets found.</p>}
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
                  {(ticket.parts || []).map((part, i) => (
                    <tr key={i}>
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
              <div className="summary-item"><span>Labor Cost</span><strong>Rs {Number(ticket.labor_cost).toLocaleString()}</strong></div>
              <div className="summary-divider"></div>
              <div className="summary-item total"><span>Grand Total</span><strong>Rs {totals.grandTotal.toLocaleString()}</strong></div>
            </div>
          </div>

          <div className="actions-section">
            {ticket.status !== 'Delivered' && (
              <button className="btn btn-primary" onClick={handleMoveNextStatus}>Move to Next Status</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Repairs;

