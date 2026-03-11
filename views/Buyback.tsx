import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, isPrivilegedUser } from '../types';
import {
  createBuyback,
  deleteBuyback,
  listBuybacks,
  listCustomers,
  listStores,
  updateBuyback,
  type ApiBuyback,
  type ApiCustomer,
  type ApiStore,
} from '../services/api';
import './Buyback.css';

const Buyback: React.FC<{ user: User }> = ({ user }) => {
  const [searchParams] = useSearchParams();
  const q = (searchParams.get('q') || '').toLowerCase();
  const storeFilter = searchParams.get('store') || 'All Stores';
  const [imei, setImei] = useState('');
  const [condition, setCondition] = useState<'Excellent' | 'Good' | 'Fair' | 'Poor'>('Good');
  const [marketValue, setMarketValue] = useState(0);
  const [negotiatedPrice, setNegotiatedPrice] = useState(0);
  const [deviceInfo, setDeviceInfo] = useState({ brand: '', model: '', color: '' });
  const [customer, setCustomer] = useState('');
  const [storeRef, setStoreRef] = useState('');
  const [jobNo, setJobNo] = useState('');
  const [icNumber, setIcNumber] = useState('');
  const [cashAmount, setCashAmount] = useState(0);
  const [onlineAmount, setOnlineAmount] = useState(0);
  const [exchangeAmount, setExchangeAmount] = useState(0);
  const [exchangeModel, setExchangeModel] = useState('');
  const [buybackList, setBuybackList] = useState<ApiBuyback[]>([]);
  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const [stores, setStores] = useState<ApiStore[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setError('');
        const [buybackData, customerData, storeData] = await Promise.all([
          listBuybacks(),
          listCustomers(),
          listStores(),
        ]);
        setBuybackList(buybackData);
        setCustomers(customerData);
        setStores(storeData.filter((store) => store.is_active));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load buybacks');
      }
    };

    void load();
  }, []);

  const customerById = useMemo(() => {
    const map = new Map<number, ApiCustomer>();
    customers.forEach((entry) => map.set(entry.id, entry));
    return map;
  }, [customers]);

  const storeById = useMemo(() => {
    const map = new Map<number, ApiStore>();
    stores.forEach((entry) => map.set(entry.id, entry));
    return map;
  }, [stores]);

  const filteredBuybacks = useMemo(() => {
    return buybackList.filter((item) => {
      const textMatch = !q
        || item.imei.includes(q)
        || item.brand.toLowerCase().includes(q)
        || item.model.toLowerCase().includes(q)
        || (customerById.get(item.customer || -1)?.name || '').toLowerCase().includes(q);
      const storeName = storeById.get(item.store_ref || -1)?.name || '';
      const storeMatch = storeFilter === 'All Stores' || storeName === storeFilter;
      return textMatch && storeMatch;
    });
  }, [buybackList, q, storeFilter, customerById, storeById]);

  const resetForm = () => {
    setImei('');
    setCondition('Good');
    setMarketValue(0);
    setNegotiatedPrice(0);
    setDeviceInfo({ brand: '', model: '', color: '' });
    setCustomer('');
    setStoreRef('');
    setJobNo('');
    setIcNumber('');
    setCashAmount(0);
    setOnlineAmount(0);
    setExchangeAmount(0);
    setExchangeModel('');
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
    if (!storeRef) {
      alert('Select a store');
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
        customer: customer ? Number(customer) : null,
        store_ref: Number(storeRef),
        job_no: jobNo.trim(),
        ic_number: icNumber.trim(),
        cash_amount: cashAmount.toFixed(2),
        online_amount: onlineAmount.toFixed(2),
        exchange_amount: exchangeAmount.toFixed(2),
        exchange_model: exchangeModel.trim(),
        condition,
        market_value: marketValue.toFixed(2),
        negotiated_price: negotiatedPrice.toFixed(2),
        status: 'Pending',
      });
      setBuybackList((prev) => [created, ...prev]);
      resetForm();
      alert('Buyback added successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit buyback';
      setError(message);
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (item: ApiBuyback) => {
    const status = window.prompt('Status (Pending/Accepted/Processed/Rejected)', item.status);
    if (status === null) return;
    const offer = window.prompt('Negotiated price', String(item.negotiated_price));
    if (offer === null) return;
    const cash = window.prompt('Cash amount', String(item.cash_amount || 0));
    if (cash === null) return;

    try {
      const updated = await updateBuyback(item.id, {
        negotiated_price: Number(offer || item.negotiated_price).toFixed(2),
        cash_amount: Number(cash || item.cash_amount || 0).toFixed(2),
        status: status as ApiBuyback['status'],
      });
      setBuybackList((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)));
      alert('Buyback updated successfully.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update buyback');
    }
  };

  const handleDelete = async (item: ApiBuyback) => {
    if (!window.confirm(`Delete buyback ${item.imei}?`)) return;
    try {
      await deleteBuyback(item.id);
      setBuybackList((prev) => prev.filter((entry) => entry.id !== item.id));
      alert('Buyback deleted successfully.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete buyback');
    }
  };

  return (
    <div className="buyback-container">
      <h1>Buyback Module</h1>

      {error && <p style={{ color: '#dc2626' }}>{error}</p>}

      <div className="buyback-grid">
        {!isPrivilegedUser(user) && (
          <div className="entry-card">
            <h2>New Buyback Request</h2>

            <div className="form-group">
              <label>Store</label>
              <select value={storeRef} onChange={(e) => setStoreRef(e.target.value)} className="form-input">
                <option value="">Select Store</option>
                {stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Customer</label>
              <select value={customer} onChange={(e) => setCustomer(e.target.value)} className="form-input">
                <option value="">Walk-in / Unknown</option>
                {customers.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Job No</label>
              <input type="text" value={jobNo} onChange={(e) => setJobNo(e.target.value)} className="form-input" />
            </div>

            <div className="form-group">
              <label>IC</label>
              <input type="text" value={icNumber} onChange={(e) => setIcNumber(e.target.value)} className="form-input" />
            </div>

            <div className="form-group">
              <label>Brand</label>
              <input type="text" placeholder="Apple, Samsung..." value={deviceInfo.brand} onChange={(e) => setDeviceInfo((prev) => ({ ...prev, brand: e.target.value }))} className="form-input" />
            </div>

            <div className="form-group">
              <label>Model</label>
              <input type="text" placeholder="iPhone 13, S23..." value={deviceInfo.model} onChange={(e) => setDeviceInfo((prev) => ({ ...prev, model: e.target.value }))} className="form-input" />
            </div>

            <div className="form-group">
              <label>Color</label>
              <input type="text" placeholder="Black, Blue..." value={deviceInfo.color} onChange={(e) => setDeviceInfo((prev) => ({ ...prev, color: e.target.value }))} className="form-input" />
            </div>

            <div className="form-group">
              <label>IMEI Number</label>
              <input type="text" placeholder="Enter IMEI (15 digits)" value={imei} onChange={(e) => setImei(e.target.value.replace(/\D/g, ''))} maxLength={15} className="form-input" />
            </div>

            <div className="form-group">
              <label>Device Condition</label>
              <select value={condition} onChange={(e) => setCondition(e.target.value as 'Excellent' | 'Good' | 'Fair' | 'Poor')} className="form-input">
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Market Value</label>
                <input type="number" value={marketValue} onChange={(e) => setMarketValue(parseInt(e.target.value, 10) || 0)} className="form-input" placeholder="Rs 0" min={0} />
              </div>
              <div className="form-group">
                <label>Offer Price</label>
                <input type="number" value={negotiatedPrice} onChange={(e) => setNegotiatedPrice(parseInt(e.target.value, 10) || 0)} className="form-input" placeholder="Rs 0" min={0} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Cash</label>
                <input type="number" value={cashAmount} onChange={(e) => setCashAmount(parseInt(e.target.value, 10) || 0)} className="form-input" placeholder="Rs 0" min={0} />
              </div>
              <div className="form-group">
                <label>Online</label>
                <input type="number" value={onlineAmount} onChange={(e) => setOnlineAmount(parseInt(e.target.value, 10) || 0)} className="form-input" placeholder="Rs 0" min={0} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Ex Amount</label>
                <input type="number" value={exchangeAmount} onChange={(e) => setExchangeAmount(parseInt(e.target.value, 10) || 0)} className="form-input" placeholder="Rs 0" min={0} />
              </div>
              <div className="form-group">
                <label>Ex Model</label>
                <input type="text" value={exchangeModel} onChange={(e) => setExchangeModel(e.target.value)} className="form-input" placeholder="Old device model" />
              </div>
            </div>

            <button className="btn btn-primary" onClick={() => void handleSubmit()} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Buyback'}
            </button>
          </div>
        )}

        <div className="list-card">
          <h2>{isPrivilegedUser(user) ? 'Buyback Reports View' : 'Recent Buybacks'}</h2>
          <table className="buyback-table">
            <thead>
              <tr>
                <th>Store</th>
                <th>Customer</th>
                <th>Device</th>
                <th>IMEI</th>
                <th>Condition</th>
                <th>Offer Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBuybacks.map((item) => (
                <tr key={item.id}>
                  <td>{storeById.get(item.store_ref || -1)?.name || '-'}</td>
                  <td>{customerById.get(item.customer || -1)?.name || 'Walk-in'}</td>
                  <td className="device-name">{`${item.brand || 'Unknown'} ${item.model || ''}`.trim()}</td>
                  <td className="imei">{item.imei}</td>
                  <td><span className="condition-badge">{item.condition}</span></td>
                  <td className="price highlight">Rs {Number(item.negotiated_price).toLocaleString()}</td>
                  <td><span className={`status-badge status-${item.status.toLowerCase()}`}>{item.status}</span></td>
                  <td>
                    {!isPrivilegedUser(user) ? (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button className="btn" style={{ padding: '6px 10px' }} onClick={() => void handleEdit(item)}>Edit</button>
                        <button className="btn" style={{ padding: '6px 10px', background: '#fee2e2', color: '#b91c1c' }} onClick={() => void handleDelete(item)}>Delete</button>
                      </div>
                    ) : '-'}
                  </td>
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
