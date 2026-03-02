import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './views/Dashboard';
import Sales from './views/Sales';
import Repairs from './views/Repairs';
import Expenses from './views/Expenses';
import Payments from './views/Payments';
import Accessories from './views/Accessories';
import Inventory from './views/Inventory';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './views/Login';
import { User } from './types';
import POS from './views/POS';
import Buyback from './views/Buyback';
import FinancialDashboard from './views/FinancialDashboard';
import Employees from './views/Employees';
import Customers from './views/Customers';

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('quality-mobiles-user');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  // Load theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const handleLogin = (loggedInUser: User) => {
    localStorage.setItem('quality-mobiles-user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('quality-mobiles-user');
    setUser(null);
  };

  return (
    <Router>
      {!user ? (
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <div style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
          <Header 
            onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            user={user}
            onLogout={handleLogout}
          />
          
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            <Sidebar 
              isOpen={isSidebarOpen} 
              setIsOpen={setIsSidebarOpen} 
              user={user}
              onLogout={handleLogout}
            />
            
            <main style={{ flex: 1, overflow: 'auto', backgroundColor: 'var(--bg-secondary)', padding: '24px' }}>
              <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard user={user} />} />
                  <Route path="/sales" element={<Sales />} />
                  <Route path="/pos" element={<POS />} />
                  <Route path="/buyback" element={<Buyback />} />
                  <Route path="/inventory" element={<Inventory user={user} />} />
                  <Route path="/repairs" element={<Repairs />} />
                  <Route path="/expenses" element={<Expenses />} />
                  <Route path="/payments" element={<Payments />} />
                  <Route path="/accessories" element={<Accessories />} />
                  <Route path="/financial" element={<FinancialDashboard />} />
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/employees" element={<Employees />} />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/login" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </div>
            </main>
          </div>
        </div>
      )}
    </Router>
  );
};

export default App;