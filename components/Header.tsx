import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  onLogout,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [showStoreMenu, setShowStoreMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));

  const storeMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const stores = [
    { id: 'all', name: 'All Stores', type: 'Main' as const },
    { id: 'main', name: 'Main Branch', type: 'Main' as const },
    { id: 'a', name: 'Store A', type: 'Secondary' as const },
    { id: 'b', name: 'Store B', type: 'Secondary' as const },
  ];

  const notifications = [
    { id: '1', message: 'Low stock alert', icon: '!', type: 'warning' },
    { id: '2', message: 'New repair ticket assigned', icon: 'R', type: 'info' },
    { id: '3', message: 'Weekly report ready', icon: 'G', type: 'success' },
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (storeMenuRef.current && !storeMenuRef.current.contains(e.target as Node)) setShowStoreMenu(false);
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const syncThemeState = () => setIsDarkMode(root.classList.contains('dark'));
    syncThemeState();

    const observer = new MutationObserver(syncThemeState);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const next = searchParams.get('q') || '';
    if (next !== searchQuery) setSearchQuery(next);
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      else params.delete('q');
      setSearchParams(params, { replace: true });
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  const selectedStore = searchParams.get('store') || currentStore?.name || 'All Stores';

  const selectStore = (storeName: string, storeId: string) => {
    const params = new URLSearchParams(searchParams);
    if (storeName === 'All Stores') params.delete('store');
    else params.set('store', storeName);
    setSearchParams(params, { replace: true });
    onStoreChange?.(storeId);
    setShowStoreMenu(false);
  };

  return (
    <header className="header">
      <div className="header-container">
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

        <div className={`search-container ${isSearchFocused ? 'focused' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            placeholder="Search customer, IMEI, job, product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="search-input"
          />
          {searchQuery && (
            <button
              className="search-clear"
              onClick={() => setSearchQuery('')}
            >
              x
            </button>
          )}
        </div>

        <div className="header-right">
          <div className="store-switcher-wrapper" ref={storeMenuRef}>
            <button className="store-switcher" onClick={() => setShowStoreMenu(!showStoreMenu)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <span>{selectedStore}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {showStoreMenu && (
              <div className="dropdown-menu store-menu">
                {stores.map((store) => (
                  <button
                    key={store.id}
                    className={`dropdown-item ${selectedStore === store.name ? 'active' : ''}`}
                    onClick={() => selectStore(store.name, store.id)}
                  >
                    <span className="store-icon">{store.type === 'Main' ? 'M' : 'S'}</span>
                    <span>{store.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="notification-wrapper" ref={notificationRef}>
            <button className="header-icon-btn notification-btn" onClick={() => setShowNotifications(!showNotifications)} title="Notifications">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span className="notification-badge">{notifications.length}</span>
            </button>
          </div>

          <button className="header-icon-btn" onClick={toggleDarkMode} title={isDarkMode ? 'Light Mode' : 'Dark Mode'}>
            {isDarkMode ? 'L' : 'D'}
          </button>

          <div className="user-menu-wrapper" ref={userMenuRef}>
            <button className="user-profile" onClick={() => setShowUserMenu(!showUserMenu)} title={user.name}>
              <div className="avatar"><span>{user.name.charAt(0)}</span></div>
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-role">{user.role}</span>
              </div>
            </button>

            {showUserMenu && (
              <div className="dropdown-menu user-menu">
                <button className="dropdown-item text-error" onClick={() => { setShowUserMenu(false); onLogout(); }}>
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
