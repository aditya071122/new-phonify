import React, { useState } from 'react';
import { CartItem, PaymentMethod } from '../types';
import './POS.css';

const POS: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('new-phones');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [exchangeCredit, setExchangeCredit] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock products database
  const products = [
    { id: '1', name: 'iPhone 15 Pro', brand: 'Apple', model: 'A3093', storage: '256GB', color: 'Black', retailPrice: 129999, barcode: 'IPHONE15PRO001', category: 'New Phones', image: '📱' },
    { id: '2', name: 'Samsung Galaxy S24', brand: 'Samsung', model: 'SM-S920B', storage: '256GB', color: 'Gray', retailPrice: 79999, barcode: 'SAMS24001', category: 'New Phones', image: '📱' },
    { id: '3', name: 'iPhone 13', brand: 'Apple', model: 'A2632', storage: '128GB', color: 'Blue', retailPrice: 59999, barcode: 'IPHONE13001', category: 'Used Phones', image: '📱' },
    { id: '4', name: 'Phone Case', brand: 'Generic', retailPrice: 499, barcode: 'CASE001', category: 'Accessories', image: '🎁' },
    { id: '5', name: 'Screen Protector', brand: 'Generic', retailPrice: 299, barcode: 'SCREEN001', category: 'Accessories', image: '🎁' },
    { id: '6', name: 'USB-C Cable', brand: 'Generic', retailPrice: 399, barcode: 'CABLE001', category: 'Accessories', image: '🎁' },
    { id: '7', name: 'Screen Repair Service', brand: 'Service', retailPrice: 2000, barcode: 'SERVICE001', category: 'Services', image: '🔧' },
  ];

  const categories = [
    { id: 'new-phones', label: 'New Phones', icon: '📱' },
    { id: 'used-phones', label: 'Used Phones', icon: '⏱' },
    { id: 'accessories', label: 'Accessories', icon: '🎁' },
    { id: 'services', label: 'Services', icon: '🔧' },
  ];

  const filteredProducts = products.filter(p => {
    const matchCategory = selectedCategory === 'all' || 
      (selectedCategory === 'new-phones' && p.category === 'New Phones') ||
      (selectedCategory === 'used-phones' && p.category === 'Used Phones') ||
      (selectedCategory === 'accessories' && p.category === 'Accessories') ||
      (selectedCategory === 'services' && p.category === 'Services');
    
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchCategory && matchSearch;
  });

  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, cartQuantity: item.cartQuantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product as CartItem, cartQuantity: 1, itemDiscount: 0, storeId: '1' }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item =>
        item.id === productId ? { ...item, cartQuantity: quantity } : item
      ));
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + ((item.retailPrice || 0) * item.cartQuantity) - item.itemDiscount, 0);
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + tax - discount + exchangeCredit;

  const handleProcessSale = async () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }
    
    setIsProcessing(true);
    // Simulate processing
    setTimeout(() => {
      alert(`Sale processed! Total: ₹${total}`);
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setDiscount(0);
      setExchangeCredit(0);
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="pos-container">
      {/* Header */}
      <div className="pos-header">
        <div className="store-info">
          <h2 className="pos-title">💳 POS Terminal</h2>
          <p className="store-name">Main Branch - Terminal 01</p>
        </div>
        <div className="pos-time">{new Date().toLocaleTimeString()}</div>
      </div>

      {/* Main Layout */}
      <div className="pos-layout">
        {/* Panel 1: Product Discovery */}
        <div className="pos-panel product-panel">
          <div className="panel-header">
            <h3>Product Catalog</h3>
          </div>

          {/* Search & Filters */}
          <div className="search-section">
            <div className="barcode-input">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
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

          {/* Category Tabs */}
          <div className="category-tabs">
            {categories.map(cat => (
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

          {/* Products Grid */}
          <div className="products-grid">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => (
                <button
                  key={product.id}
                  className="product-card"
                  onClick={() => addToCart(product)}
                >
                  <div className="product-image">{product.image}</div>
                  <div className="product-info">
                    <h4 className="product-name">{product.name}</h4>
                    <p className="product-model">{product.model}</p>
                    <p className="product-price">₹{product.retailPrice.toLocaleString()}</p>
                  </div>
                </button>
              ))
            ) : (
              <div className="no-products">No products found</div>
            )}
          </div>
        </div>

        {/* Panel 2: Cart & Customer */}
        <div className="pos-panel cart-panel">
          <div className="panel-header">
            <h3>Cart</h3>
            <span className="item-count">{cart.length} items</span>
          </div>

          {/* Customer Details */}
          <div className="customer-section">
            <div className="customer-header">
              <h4>Customer</h4>
              <button className="link-btn">+ New</button>
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

          {/* Cart Items */}
          <div className="cart-items">
            {cart.length > 0 ? (
              cart.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="item-details">
                    <h4 className="item-name">{item.name}</h4>
                    <p className="item-code">{item.barcode}</p>
                  </div>
                  <div className="item-quantity">
                    <button onClick={() => updateQuantity(item.id, item.cartQuantity - 1)}>−</button>
                    <input
                      type="number"
                      value={item.cartQuantity}
                      onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                      className="qty-input"
                    />
                    <button onClick={() => updateQuantity(item.id, item.cartQuantity + 1)}>+</button>
                  </div>
                  <div className="item-price">₹{((item.retailPrice || 0) * item.cartQuantity).toLocaleString()}</div>
                  <button className="remove-btn" onClick={() => removeFromCart(item.id)}>✕</button>
                </div>
              ))
            ) : (
              <div className="empty-cart">Cart is empty</div>
            )}
          </div>

          {/* Quick Options */}
          <div className="quick-options">
            <button className="option-btn">
              <span>🎁</span>
              Gift Card
            </button>
            <button className="option-btn">
              <span>🔄</span>
              Exchange
            </button>
          </div>
        </div>

        {/* Panel 3: Payment & Checkout */}
        <div className="pos-panel payment-panel">
          <div className="panel-header">
            <h3>Checkout</h3>
          </div>

          {/* Bill Summary */}
          <div className="bill-summary">
            <div className="summary-row">
              <span>Subtotal</span>
              <span className="amount">₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Tax (18%)</span>
              <span className="amount">₹{tax.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Discount</span>
              <div className="discount-input">
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(parseInt(e.target.value) || 0)}
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
                  onChange={(e) => setExchangeCredit(parseInt(e.target.value) || 0)}
                  className="input-field"
                />
              </div>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-row grand-total">
              <span>Grand Total</span>
              <span className="amount">₹{Math.max(0, total).toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="payment-method">
            <h4>Payment Method</h4>
            <div className="method-buttons">
              {(['Cash', 'Card', 'UPI', 'Bank Transfer'] as PaymentMethod[]).map(method => (
                <button
                  key={method}
                  className={`method-btn ${paymentMethod === method ? 'active' : ''}`}
                  onClick={() => setPaymentMethod(method)}
                >
                  {method === 'Cash' && '💵'}
                  {method === 'Card' && '💳'}
                  {method === 'UPI' && '📱'}
                  {method === 'Bank Transfer' && '🏦'}
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button className="btn btn-secondary">Cancel</button>
            <button
              className="btn btn-primary process-btn"
              onClick={handleProcessSale}
              disabled={cart.length === 0 || isProcessing}
            >
              {isProcessing ? 'Processing...' : 'PROCESS SALE'}
            </button>
          </div>

          {/* Quick Stats */}
          <div className="quick-stats">
            <div className="stat">
              <span className="stat-label">Items</span>
              <span className="stat-value">{cart.length}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Total</span>
              <span className="stat-value">₹{Math.max(0, total).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POS;