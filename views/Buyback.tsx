import React, { useState } from 'react';
import './Buyback.css';

const Buyback: React.FC = () => {
  const [imei, setImei] = useState('');
  const [condition, setCondition] = useState<'Excellent' | 'Good' | 'Fair' | 'Poor'>('Good');
  const [marketValue, setMarketValue] = useState(0);
  const [negotiatedPrice, setNegotiatedPrice] = useState(0);
  const [deviceInfo, setDeviceInfo] = useState({ brand: '', model: '', color: '' });

  const buybackList = [
    { id: 'BYK001', imei: '358240051111110', device: 'iPhone 12', condition: 'Good', value: 25000, price: 23000, status: 'Accepted', date: '2024-03-01' },
    { id: 'BYK002', imei: '358240051111111', device: 'Samsung S21', condition: 'Fair', value: 18000, price: 16000, status: 'Pending', date: '2024-03-02' },
    { id: 'BYK003', imei: '358240051111112', device: 'OnePlus 11', condition: 'Excellent', value: 35000, price: 33000, status: 'Processed', date: '2024-03-02' },
  ];

  return (
    <div className="buyback-container">
      <h1>🔄 Buyback Module</h1>
      
      <div className="buyback-grid">
        {/* Entry Form */}
        <div className="entry-card">
          <h2>New Buyback Request</h2>
          
          <div className="form-group">
            <label>IMEI Number</label>
            <input
              type="text"
              placeholder="Enter IMEI (15 digits)"
              value={imei}
              onChange={(e) => setImei(e.target.value)}
              maxLength={15}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Device Condition</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as any)}
              className="form-input"
            >
              <option value="Excellent">Excellent (New)</option>
              <option value="Good">Good (Minor Scratches)</option>
              <option value="Fair">Fair (Normal Wear)</option>
              <option value="Poor">Poor (Heavy Damage)</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Market Value</label>
              <input
                type="number"
                value={marketValue}
                onChange={(e) => setMarketValue(parseInt(e.target.value))}
                className="form-input"
                placeholder="₹0"
              />
            </div>
            <div className="form-group">
              <label>Offer Price</label>
              <input
                type="number"
                value={negotiatedPrice}
                onChange={(e) => setNegotiatedPrice(parseInt(e.target.value))}
                className="form-input"
                placeholder="₹0"
              />
            </div>
          </div>

          <button className="btn btn-primary">Submit Buyback</button>
        </div>

        {/* Buyback List */}
        <div className="list-card">
          <h2>Recent Buybacks</h2>
          <table className="buyback-table">
            <thead>
              <tr>
                <th>Device</th>
                <th>IMEI</th>
                <th>Condition</th>
                <th>Market Value</th>
                <th>Offer Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {buybackList.map(item => (
                <tr key={item.id}>
                  <td className="device-name">{item.device}</td>
                  <td className="imei">{item.imei}</td>
                  <td><span className="condition-badge">{item.condition}</span></td>
                  <td className="price">₹{item.value.toLocaleString()}</td>
                  <td className="price highlight">₹{item.price.toLocaleString()}</td>
                  <td><span className={`status-badge status-${item.status.toLowerCase()}`}>{item.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Buyback;
