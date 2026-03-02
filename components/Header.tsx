import React, { useState, useRef, useEffect } from 'react';
import { User, Store } from '../types';
import './Header.css';

interface HeaderProps {
  onMenuClick: () => void;
  user: User;
  currentStore?: Store;
  onStoreChange?: (storeId: string) => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onMenuClick, 
  user, 
  currentStore,
  onStoreChange,
  onLogout 
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showStoreMenu, setShowStoreMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.classList.contains('dark')
  );

  const storeMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const stores = [
    { id: '1', name: 'All Stores', type: 'Main' as const },
    { id: '2', name: 'Main Branch', type: 'Main' as const },
    { id: '3', name: 'Branch 2', type: 'Secondary' as const },
    { id: '4', name: 'Branch 3', type: 'Secondary' as const },
  ];

  const notifications = [
    { id: '1', message: 'Low stock: iPhone 15 Pro (5 units)', icon: '⚠️', type: 'warning' },
    { id: '2', message: 'New repair ticket #1234 assigned', icon: '🔧', type: 'info' },
    { id: '3', message: 'Weekly report ready for download', icon: '📊', type: 'success' },
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (storeMenuRef.current && !storeMenuRef.current.contains(e.target as Node)) {
        setShowStoreMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDarkMode = () => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setIsDarkMode(!isDarkMode);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Left Side - Logo & Menu */}
        <div className="header-left">
          <button className="menu-toggle" onClick={onMenuClick} title="Toggle Sidebar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          <div className="logo">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <g clipPath="url(#clip0_93_122)">
                <circle cx="14" cy="14" r="12" fill="var(--color-primary-600)"></circle>
                <path d="M14 6v12m-4-4h8" stroke="white" strokeWidth="2" strokeLinecap="round"></path>
              </g>
            </svg>
            <span className="logo-text">Quality Mobiles</span>
          </div>
        </div>

        {/* Center - Search */}
        <div className={`search-container ${isSearchFocused ? 'focused' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            placeholder="Search customer, IMEI, job, product..."
            value={searchQuery}
            onChange={handleSearch}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="search-input"
          />
          {searchQuery && (
            <button 
              className="search-clear"
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>

        {/* Right Side - Actions */}
        <div className="header-right">
          {/* Store Switcher */}
          <div className="store-switcher-wrapper" ref={storeMenuRef}>
            <button 
              className="store-switcher"
              onClick={() => setShowStoreMenu(!showStoreMenu)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <span>{currentStore?.name || 'All Stores'}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {showStoreMenu && (
              <div className="dropdown-menu store-menu">
                {stores.map(store => (
                  <button
                    key={store.id}
                    className={`dropdown-item ${currentStore?.id === store.id ? 'active' : ''}`}
                    onClick={() => {
                      onStoreChange?.(store.id);
                      setShowStoreMenu(false);
                    }}
                  >
                    <span className="store-icon">
                      {store.type === 'Main' ? '🏢' : '🏪'}
                    </span>
                    <span>{store.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="notification-wrapper" ref={notificationRef}>
            <button 
              className="header-icon-btn notification-btn"
              onClick={() => setShowNotifications(!showNotifications)}
              title="Notifications"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span className="notification-badge">3</span>
            </button>

            {showNotifications && (
              <div className="dropdown-menu notification-menu">
                <div className="menu-header">
                  <h3>Notifications</h3>
                  <button className="mark-read">Mark all read</button>
                </div>
                <div className="notification-list">
                  {notifications.map(notif => (
                    <div key={notif.id} className={`notification-item type-${notif.type}`}>
                      <span className="notif-icon">{notif.icon}</span>
                      <span className="notif-text">{notif.message}</span>
                    </div>
                  ))}
                </div>
                <div className="menu-footer">
                  <a href="#">View all notifications</a>
                </div>
              </div>
            )}
          </div>

          {/* Dark Mode Toggle */}
          <button 
            className="header-icon-btn"
            onClick={toggleDarkMode}
            title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {isDarkMode ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>

          {/* User Menu */}
          <div className="user-menu-wrapper" ref={userMenuRef}>
            <button 
              className="user-profile"
              onClick={() => setShowUserMenu(!showUserMenu)}
              title={user.name}
            >
              <div className="avatar">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} />
                ) : (
                  <span>{user.name.charAt(0)}</span>
                )}
              </div>
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-role">{user.role}</span>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {showUserMenu && (
              <div className="dropdown-menu user-menu">
                <div className="menu-header">
                  <div className="avatar-large">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} />
                    ) : (
                      <span>{user.name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <p className="user-name-large">{user.name}</p>
                    <p className="user-role-large">{user.role}</p>
                  </div>
                </div>
                <a className="dropdown-item" href="#profile">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span>Profile Settings</span>
                </a>
                <a className="dropdown-item" href="#security">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  <span>Security & Privacy</span>
                </a>
                <a className="dropdown-item" href="#settings">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="1"></circle>
                    <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24"></path>
                  </svg>
                  <span>Settings</span>
                </a>
                <div className="dropdown-divider"></div>
                <button 
                  className="dropdown-item text-error"
                  onClick={() => {
                    setShowUserMenu(false);
                    onLogout();
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;