import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createBuyback, listBuybacks, type ApiBuyback } from '../services/api';
import './Buyback.css';

const Buyback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const q = (searchParams.get('q') || '').toLowerCase();
  const [imei, setImei] = useState('');
  const [condition, setCondition] = useState<'Excellent' | 'Good' | 'Fair' | 'Poor'>('Good');
  const [marketValue, setMarketValue] = useState(0);
  const [negotiatedPrice, setNegotiatedPrice] = useState(0);
  const [deviceInfo, setDeviceInfo] = useState({ brand: '', model: '', color: '' });
  const [buybackList, setBuybackList] = useState<ApiBuyback[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await listBuybacks();
        setBuybackList(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load buybacks');
      }
    };

    void load();
  }, []);

  const resetForm = () => {
    setImei('');
    setCondition('Good');
    setMarketValue(0);
    setNegotiatedPrice(0);
    setDeviceInfo({ brand: '', model: '', color: '' });
  };

  const handleSubmit = async () => {
    if (!/^\d{15}$/.test(imei)) {
      alert('IMEI must be exactly 15 digits');
      return;
    }
    if (marketValue <= 0 || negotiatedPrice <= 0) {
      alert('Market value and offer price must be greater than 0');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const created = await createBuyback({
        imei,
        brand: deviceInfo.brand.trim(),
        model: deviceInfo.model.trim(),
        color: deviceInfo.color.trim(),
        condition,
        market_value: marketValue.toFixed(2),
        negotiated_price: negotiatedPrice.toFixed(2),
        status: 'Pending',
      });
      setBuybackList((prev) => [created, ...prev]);
      resetForm();
      alert('Buyback submitted successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit buyback';
      setError(message);
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="buyback-container">
      <h1>Buyback Module</h1>

      {error && <p style={{ color: '#dc2626' }}>{error}</p>}

      <div className="buyback-grid">
        <div className="entry-card">
          <h2>New Buyback Request</h2>

          <div className="form-group">
            <label>Brand</label>
            <input
              type="text"
              placeholder="Apple, Samsung..."
              value={deviceInfo.brand}
              onChange={(e) => setDeviceInfo((prev) => ({ ...prev, brand: e.target.value }))}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Model</label>
            <input
              type="text"
              placeholder="iPhone 13, S23..."
              value={deviceInfo.model}
              onChange={(e) => setDeviceInfo((prev) => ({ ...prev, model: e.target.value }))}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Color</label>
            <input
              type="text"
              placeholder="Black, Blue..."
              value={deviceInfo.color}
              onChange={(e) => setDeviceInfo((prev) => ({ ...prev, color: e.target.value }))}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>IMEI Number</label>
            <input
              type="text"
              placeholder="Enter IMEI (15 digits)"
              value={imei}
              onChange={(e) => setImei(e.target.value.replace(/\D/g, ''))}
              maxLength={15}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Device Condition</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as 'Excellent' | 'Good' | 'Fair' | 'Poor')}
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
                onChange={(e) => setMarketValue(parseInt(e.target.value, 10) || 0)}
                className="form-input"
                placeholder="Rs 0"
                min={0}
              />
            </div>
            <div className="form-group">
              <label>Offer Price</label>
              <input
                type="number"
                value={negotiatedPrice}
                onChange={(e) => setNegotiatedPrice(parseInt(e.target.value, 10) || 0)}
                className="form-input"
                placeholder="Rs 0"
                min={0}
              />
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Buyback'}
          </button>
        </div>

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
              {buybackList.filter((item) => !q || item.imei.includes(q) || item.brand.toLowerCase().includes(q) || item.model.toLowerCase().includes(q)).map((item) => (
                <tr key={item.id}>
                  <td className="device-name">{`${item.brand || 'Unknown'} ${item.model || ''}`.trim()}</td>
                  <td className="imei">{item.imei}</td>
                  <td><span className="condition-badge">{item.condition}</span></td>
                  <td className="price">Rs {Number(item.market_value).toLocaleString()}</td>
                  <td className="price highlight">Rs {Number(item.negotiated_price).toLocaleString()}</td>
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

