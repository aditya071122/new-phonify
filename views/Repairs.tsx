import React, { useState } from 'react';
import './Repairs.css';

interface ServiceTicket {
  ticketNo: string;
  customerName: string;
  deviceModel: string;
  technicianName: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Delivered';
  parts: Array<{ name: string; qty: number; unitCost: number; status: 'Pending' | 'Purchased' }>;
  laborCost: number;
  warranty: '3 months' | '6 months' | '12 months';
  createdAt: string;
  estimatedCompletion: string;
}

const Repairs: React.FC = () => {
  const [selectedTicket, setSelectedTicket] = useState(0);
  const [showForm, setShowForm] = useState(false);

  const tickets: ServiceTicket[] = [
    {
      ticketNo: 'SVC2024001',
      customerName: 'Amit Kumar',
      deviceModel: 'iPhone 12 Pro',
      technicianName: 'Anil Patel',
      status: 'In Progress',
      parts: [
        { name: 'Battery', qty: 1, unitCost: 1500, status: 'Purchased' },
        { name: 'Screen Protector', qty: 2, unitCost: 200, status: 'Pending' },
      ],
      laborCost: 800,
      warranty: '6 months',
      createdAt: '2024-03-01',
      estimatedCompletion: '2024-03-05',
    },
    {
      ticketNo: 'SVC2024002',
      customerName: 'Priya Sharma',
      deviceModel: 'Samsung S21',
      technicianName: 'Anil Patel',
      status: 'Completed',
      parts: [
        { name: 'Charging Port', qty: 1, unitCost: 2000, status: 'Purchased' },
      ],
      laborCost: 1200,
      warranty: '3 months',
      createdAt: '2024-02-28',
      estimatedCompletion: '2024-03-02',
    },
    {
      ticketNo: 'SVC2024003',
      customerName: 'Rajesh Verma',
      deviceModel: 'OnePlus 11',
      technicianName: 'Deepak Sharma',
      status: 'Pending',
      parts: [
        { name: 'Display Glass', qty: 1, unitCost: 3500, status: 'Pending' },
        { name: 'Adhesive Tape', qty: 1, unitCost: 300, status: 'Purchased' },
      ],
      laborCost: 1500,
      warranty: '12 months',
      createdAt: '2024-03-02',
      estimatedCompletion: '2024-03-06',
    },
  ];

  const ticket = tickets[selectedTicket];
  const statuses = ['Pending', 'In Progress', 'Completed', 'Delivered'] as const;
  const currentStatusIndex = statuses.indexOf(ticket.status);
  const totalPartsCost = ticket.parts.reduce((sum, part) => sum + part.qty * part.unitCost, 0);
  const grandTotal = totalPartsCost + ticket.laborCost;

  return (
    <div className="repairs-container">
      <div className="repairs-header">
        <h1>🔧 Repair Service Module</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          + New Service Ticket
        </button>
      </div>

      {/* Ticket List */}
      <div className="tickets-section">
        <h3>Active Service Tickets</h3>
        <div className="ticket-list">
          {tickets.map((t, i) => (
            <div
              key={t.ticketNo}
              className={`ticket-card ${selectedTicket === i ? 'active' : ''}`}
              onClick={() => setSelectedTicket(i)}
            >
              <div className="ticket-header">
                <strong>{t.ticketNo}</strong>
                <span className={`status-badge status-${t.status.toLowerCase().replace(' ', '-')}`}>
                  {t.status}
                </span>
              </div>
              <p className="ticket-info">{t.customerName} • {t.deviceModel}</p>
              <p className="ticket-tech">👨‍🔧 {t.technicianName}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Ticket Details */}
      <div className="ticket-details">
        {/* Status Stepper */}
        <div className="status-stepper">
          <div className="stepper-header">
            <h3>Service Status</h3>
            <span className="stepper-info">Step {currentStatusIndex + 1} of 4</span>
          </div>
          <div className="stepper-container">
            {statuses.map((status, index) => (
              <div key={status} className="stepper-item">
                <div className={`stepper-dot ${index <= currentStatusIndex ? 'active' : ''}`}>
                  {index < currentStatusIndex ? '✓' : index + 1}
                </div>
                <span className={`stepper-label ${index <= currentStatusIndex ? 'active' : ''}`}>
                  {status}
                </span>
                {index < statuses.length - 1 && (
                  <div className={`stepper-line ${index < currentStatusIndex ? 'active' : ''}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Customer & Device Info */}
        <div className="info-section">
          <div className="info-card">
            <h4>👤 Customer Information</h4>
            <div className="info-grid">
              <div className="info-item">
                <label>Customer Name</label>
                <p>{ticket.customerName}</p>
              </div>
              <div className="info-item">
                <label>Ticket ID</label>
                <p className="monospace">{ticket.ticketNo}</p>
              </div>
              <div className="info-item">
                <label>Device Model</label>
                <p>{ticket.deviceModel}</p>
              </div>
              <div className="info-item">
                <label>Technician</label>
                <p>{ticket.technicianName}</p>
              </div>
            </div>
          </div>

          {/* Warranty & Timeline */}
          <div className="info-card warranty-card">
            <h4>📅 Timeline & Warranty</h4>
            <div className="timeline-info">
              <div className="timeline-item">
                <span className="label">Date Received</span>
                <span className="value">{ticket.createdAt}</span>
              </div>
              <div className="timeline-item">
                <span className="label">Est. Completion</span>
                <span className="value">{ticket.estimatedCompletion}</span>
              </div>
              <div className="timeline-item">
                <span className="label">Warranty Period</span>
                <span className={`warranty-badge warranty-${ticket.warranty.split(' ')[0].toLowerCase()}`}>
                  {ticket.warranty}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Parts & Labor */}
        <div className="costs-section">
          <div className="parts-card">
            <h4>🔩 Replacement Parts</h4>
            <table className="parts-table">
              <thead>
                <tr>
                  <th>Part Name</th>
                  <th>Quantity</th>
                  <th>Unit Cost</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {ticket.parts.map((part, i) => (
                  <tr key={i}>
                    <td className="part-name">{part.name}</td>
                    <td className="qty">{part.qty}</td>
                    <td className="price">₹{part.unitCost.toLocaleString()}</td>
                    <td className="total">₹{(part.qty * part.unitCost).toLocaleString()}</td>
                    <td>
                      <span className={`part-status status-${part.status.toLowerCase()}`}>
                        {part.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cost Summary */}
          <div className="cost-summary">
            <h4>💰 Cost Summary</h4>
            <div className="summary-item">
              <span>Parts Cost</span>
              <strong>₹{totalPartsCost.toLocaleString()}</strong>
            </div>
            <div className="summary-item">
              <span>Labor Cost</span>
              <strong>₹{ticket.laborCost.toLocaleString()}</strong>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-item total">
              <span>Grand Total</span>
              <strong>₹{grandTotal.toLocaleString()}</strong>
            </div>
            <button className="btn btn-primary full-width">
              📄 Generate Invoice
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="actions-section">
          <button className="btn btn-secondary">📋 Add Part</button>
          <button className="btn btn-secondary">✏️ Edit Ticket</button>
          <button className="btn btn-secondary">📸 Upload Images</button>
          {ticket.status !== 'Delivered' && (
            <button className="btn btn-primary">➡️ Move to Next Status</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Repairs;
