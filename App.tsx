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
import { User, isPrivilegedUser } from './types';
import POS from './views/POS';
import Buyback from './views/Buyback';
import FinancialDashboard from './views/FinancialDashboard';
import Employees from './views/Employees';
import Customers from './views/Customers';
import { clearAuthToken, getAuthToken, logout as apiLogout } from './services/api';

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

  useEffect(() => {
    if (user && !getAuthToken()) {
      localStorage.removeItem('quality-mobiles-user');
      setUser(null);
    }
  }, [user]);

  const handleLogin = (loggedInUser: User) => {
    localStorage.setItem('quality-mobiles-user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  };

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch {
      // Ignore logout API failures; local session should still clear.
    }
    clearAuthToken();
    localStorage.removeItem('quality-mobiles-user');
    setUser(null);
  };

  const defaultPath = isPrivilegedUser(user) ? '/dashboard' : '/pos';

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
                  <Route path="/dashboard" element={isPrivilegedUser(user) ? <Dashboard user={user} /> : <Navigate to={defaultPath} replace />} />
                  <Route path="/sales" element={<Sales user={user} />} />
                  <Route path="/pos" element={<POS />} />
                  <Route path="/buyback" element={<Buyback user={user} />} />
                  <Route path="/inventory" element={isPrivilegedUser(user) ? <Inventory user={user} /> : <Navigate to={defaultPath} replace />} />
                  <Route path="/repairs" element={<Repairs user={user} />} />
                  <Route path="/expenses" element={isPrivilegedUser(user) ? <Expenses user={user} /> : <Navigate to={defaultPath} replace />} />
                  <Route path="/payments" element={isPrivilegedUser(user) ? <Payments user={user} /> : <Navigate to={defaultPath} replace />} />
                  <Route path="/accessories" element={<Accessories />} />
                  <Route path="/financial" element={<Navigate to="/reports" replace />} />
                  <Route path="/reports" element={<FinancialDashboard user={user} />} />
                  <Route path="/customers" element={<Customers user={user} />} />
                  <Route path="/employees" element={isPrivilegedUser(user) ? <Employees user={user} /> : <Navigate to={defaultPath} replace />} />
                  <Route path="/" element={<Navigate to={defaultPath} replace />} />
                  <Route path="/login" element={<Navigate to={defaultPath} replace />} />
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
