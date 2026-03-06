import React, { useEffect, useMemo, useState } from 'react';
import { PaymentMethod } from '../types';
import {
  createCustomer,
  createSale,
  listCustomers,
  listProducts,
  type ApiCustomer,
  type ApiProduct,
} from '../services/api';
import './POS.css';

type PosProduct = {
  id: string;
  backendId: number;
  name: string;
  brand: string;
  model: string;
  retailPrice: number;
  barcode: string;
  stockQuantity: number;
  category: 'New Phones' | 'Used Phones' | 'Accessories' | 'Services';
  avatarIcon: string;
  avatarColor: string;
};

type PosCartItem = PosProduct & {
  cartQuantity: number;
  itemDiscount: number;
};

const categories = [
  { id: 'new-phones', label: 'New Phones', icon: 'NP' },
  { id: 'used-phones', label: 'Used Phones', icon: 'UP' },
  { id: 'accessories', label: 'Accessories', icon: 'AC' },
  { id: 'services', label: 'Services', icon: 'SV' },
];

const categorizeProduct = (product: ApiProduct): PosProduct['category'] => {
  const category = (product as ApiProduct & { category?: string }).category;
  if (category === 'used_phone') return 'Used Phones';
  if (category === 'accessories') return 'Accessories';
  if (category === 'services') return 'Services';
  return 'New Phones';
};

const getCategoryIcon = (category: PosProduct['category']): string => {
  if (category === 'Used Phones') return 'smartphone';
  if (category === 'Accessories') return 'headphones';
  if (category === 'Services') return 'build_circle';
  return 'phone_iphone';
};

const avatarColors = ['pos-avatar-teal', 'pos-avatar-blue', 'pos-avatar-orange', 'pos-avatar-pink'];
const pickAvatarColor = (text: string): string => {
  const key = text || 'default';
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash + key.charCodeAt(i)) % avatarColors.length;
  }
  return avatarColors[hash];
};

const mapProduct = (product: ApiProduct): PosProduct => {
  const category = categorizeProduct(product);
  return {
    id: String(product.id),
    backendId: product.id,
    name: product.name,
    brand: product.name.split(' ')[0] || 'Generic',
    model: product.sku || 'N/A',
    retailPrice: Number(product.price),
    barcode: product.sku,
    stockQuantity: product.stock_quantity,
    category,
    avatarIcon: getCategoryIcon(category),
    avatarColor: pickAvatarColor(`${product.sku}-${product.name}`),
  };
};

const POS: React.FC = () => {
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('new-phones');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [currentStore, setCurrentStore] = useState('Main Branch');
  const [exchangeCredit, setExchangeCredit] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [productData, customerData] = await Promise.all([listProducts(), listCustomers()]);
        setProducts(productData.filter((p) => p.active).map(mapProduct));
        setCustomers(customerData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load POS data');
      }
    };

    void load();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory = selectedCategory === 'all' ||
        (selectedCategory === 'new-phones' && p.category === 'New Phones') ||
        (selectedCategory === 'used-phones' && p.category === 'Used Phones') ||
        (selectedCategory === 'accessories' && p.category === 'Accessories') ||
        (selectedCategory === 'services' && p.category === 'Services');

      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.toLowerCase().includes(searchQuery.toLowerCase());

      return matchCategory && matchSearch;
    });
  }, [products, searchQuery, selectedCategory]);

  const suggestedProducts = useMemo(() => {
    const list = filteredProducts.slice();
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list.sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(q) || a.barcode.toLowerCase().startsWith(q) ? 1 : 0;
        const bStarts = b.name.toLowerCase().startsWith(q) || b.barcode.toLowerCase().startsWith(q) ? 1 : 0;
        if (aStarts !== bStarts) return bStarts - aStarts;
        return b.stockQuantity - a.stockQuantity;
      });
      return list.slice(0, 6);
    }
    list.sort((a, b) => b.stockQuantity - a.stockQuantity);
    return list.slice(0, 6);
  }, [filteredProducts, searchQuery]);

  const addToCart = (product: PosProduct) => {
    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem) {
      setCart((prev) => prev.map((item) =>
        item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item
      ));
      return;
    }

    setCart((prev) => [...prev, { ...product, cartQuantity: 1, itemDiscount: 0 }]);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prev) => prev.map((item) =>
      item.id === productId ? { ...item, cartQuantity: quantity } : item
    ));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.retailPrice * item.cartQuantity) - item.itemDiscount, 0);
  const tax = Math.round(subtotal * 0.18);
  const total = Math.max(0, subtotal + tax - discount + exchangeCredit);

  const findOrCreateCustomer = async (): Promise<number | null> => {
    const name = customerName.trim();
    const phone = customerPhone.trim();

    if (!name && !phone) return null;

    const existing = customers.find((c) =>
      (phone && c.phone === phone) || (name && c.name.toLowerCase() === name.toLowerCase())
    );

    if (existing) return existing.id;

    if (!name) return null;

    const created = await createCustomer({ name, phone, email: '' });
    setCustomers((prev) => [created, ...prev]);
    return created.id;
  };

  const handleProcessSale = async () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const customerId = await findOrCreateCustomer();
      await createSale({
        customer: customerId,
        notes: `POS checkout | store=${currentStore} | payment=${paymentMethod} | discount=${discount} | exchange=${exchangeCredit}`,
        items: cart.map((item) => ({
          product: item.backendId,
          quantity: item.cartQuantity,
          unit_price: item.retailPrice.toFixed(2),
        })),
      });

      alert(`Sale processed. Total: Rs ${total.toLocaleString()}`);
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setDiscount(0);
      setExchangeCredit(0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process sale';
      setError(message);
      alert(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="pos-container">
      <div className="pos-header">
        <div className="store-info">
          <h2 className="pos-title">POS Terminal</h2>
          <p className="store-name">{currentStore} - Terminal 01</p>
        </div>
        <select value={currentStore} onChange={(e) => setCurrentStore(e.target.value)} className="input-field" style={{ maxWidth: 180 }}>
          <option value="Main Branch">Main Branch</option>
          <option value="Store A">Store A</option>
          <option value="Store B">Store B</option>
        </select>
        <div className="pos-time">{new Date().toLocaleTimeString()}</div>
      </div>

      {error && <p style={{ color: '#dc2626', marginBottom: 12 }}>{error}</p>}

      <div className="pos-layout">
        <div className="pos-panel product-panel">
          <div className="panel-header">
            <h3>Product Catalog</h3>
          </div>

          <div className="search-section">
            <div className="barcode-input">
              <input
                type="text"
                placeholder="Barcode or search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-field"
                autoFocus
              />
            </div>
          </div>

          <div className="category-tabs">
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`category-tab ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span>{cat.icon}</span>
                <span className="label">{cat.label}</span>
              </button>
            ))}
          </div>

          <div className="suggestion-strip">
            <p className="suggestion-title">{searchQuery.trim() ? 'Suggested Matches' : 'Suggested Products'}</p>
            <div className="suggestion-list">
              {suggestedProducts.map((product) => (
                <button key={`suggest-${product.id}`} className="suggestion-chip" onClick={() => addToCart(product)}>
                  <span className={`material-icons suggestion-icon ${product.avatarColor}`}>{product.avatarIcon}</span>
                  <span>{product.name}</span>
                </button>
              ))}
              {suggestedProducts.length === 0 && <span className="suggestion-empty">No suggestions</span>}
            </div>
          </div>

          <div className="products-grid">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <button
                  key={product.id}
                  className="product-card"
                  onClick={() => addToCart(product)}
                >
                  <div className={`product-image-avatar ${product.avatarColor}`}>
                    <span className="material-icons">{product.avatarIcon}</span>
                  </div>
                  <div className="product-info">
                    <h4 className="product-name">{product.name}</h4>
                    <p className="product-model">{product.model}</p>
                    <p className="product-model">Stock: {product.stockQuantity}</p>
                    <p className="product-price">Rs {product.retailPrice.toLocaleString()}</p>
                  </div>
                </button>
              ))
            ) : (
              <div className="no-products">No products found</div>
            )}
          </div>
        </div>

        <div className="pos-panel cart-panel">
          <div className="panel-header">
            <h3>Cart</h3>
            <span className="item-count">{cart.length} items</span>
          </div>

          <div className="customer-section">
            <div className="customer-header">
              <h4>Customer</h4>
            </div>
            <input
              type="text"
              placeholder="Customer Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="input-field"
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="cart-items">
            {cart.length > 0 ? (
              cart.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="item-details">
                    <h4 className="item-name">{item.name}</h4>
                    <p className="item-code">{item.barcode}</p>
                  </div>
                  <div className="item-quantity">
                    <button onClick={() => updateQuantity(item.id, item.cartQuantity - 1)}>-</button>
                    <input
                      type="number"
                      value={item.cartQuantity}
                      onChange={(e) => updateQuantity(item.id, parseInt(e.target.value, 10) || 0)}
                      className="qty-input"
                    />
                    <button onClick={() => updateQuantity(item.id, item.cartQuantity + 1)}>+</button>
                  </div>
                  <div className="item-price">Rs {(item.retailPrice * item.cartQuantity).toLocaleString()}</div>
                  <button className="remove-btn" onClick={() => removeFromCart(item.id)}>x</button>
                </div>
              ))
            ) : (
              <div className="empty-cart">Cart is empty</div>
            )}
          </div>
        </div>

        <div className="pos-panel payment-panel">
          <div className="panel-header">
            <h3>Checkout</h3>
          </div>

          <div className="bill-summary">
            <div className="summary-row">
              <span>Subtotal</span>
              <span className="amount">Rs {subtotal.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Tax (18%)</span>
              <span className="amount">Rs {tax.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Discount</span>
              <div className="discount-input">
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(parseInt(e.target.value, 10) || 0)}
                  className="input-field"
                />
              </div>
            </div>
            <div className="summary-row">
              <span>Exchange Credit</span>
              <div className="exchange-input">
                <input
                  type="number"
                  value={exchangeCredit}
                  onChange={(e) => setExchangeCredit(parseInt(e.target.value, 10) || 0)}
                  className="input-field"
                />
              </div>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-row grand-total">
              <span>Grand Total</span>
              <span className="amount">Rs {total.toLocaleString()}</span>
            </div>
          </div>

          <div className="payment-method">
            <h4>Payment Method</h4>
            <div className="method-buttons">
              {(['Cash', 'Card', 'UPI', 'Bank Transfer'] as PaymentMethod[]).map((method) => (
                <button
                  key={method}
                  className={`method-btn ${paymentMethod === method ? 'active' : ''}`}
                  onClick={() => setPaymentMethod(method)}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          <div className="action-buttons">
            <button className="btn btn-secondary" onClick={() => setCart([])}>Cancel</button>
            <button
              className="btn btn-primary process-btn"
              onClick={handleProcessSale}
              disabled={cart.length === 0 || isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Process Sale'}
            </button>
          </div>

          <div className="quick-stats">
            <div className="stat">
              <span className="stat-label">Items</span>
              <span className="stat-value">{cart.length}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Total</span>
              <span className="stat-value">Rs {total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POS;

