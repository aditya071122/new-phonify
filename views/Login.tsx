
import React, { useState } from 'react';
import { User, Store } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [role, setRole] = useState<'Admin' | 'Staff'>('Admin');
  const [selectedStore, setSelectedStore] = useState<string>('S1');
  const [error, setError] = useState('');

  const staffStores: Store[] = [
    { id: 'S1', name: 'Main Warehouse', location: 'Downtown', type: 'Warehouse' },
    { id: 'S2', name: 'Retail Store A', location: 'City Mall', type: 'Retail' },
    { id: 'S3', name: 'Repair Center', location: 'West End', type: 'Repair' },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (role === 'Staff' && !selectedStore) {
      setError('Please select a store to continue.');
      return;
    }

    let user: User;
    if (role === 'Admin') {
      user = { id: 'admin-01', name: 'Admin User', role: 'Admin' };
    } else {
      user = { id: 'staff-01', name: 'Staff User', role: 'Staff', assignedStoreId: selectedStore };
    }
    
    onLogin(user);
  };

  return (
    <div className="w-full h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4 shadow-lg">
            <span className="material-icons text-white text-4xl">smartphone</span>
          </div>
          <h1 className="text-3xl font-black text-text-dark tracking-tight">Welcome to MobMastery</h1>
          <p className="text-text-secondary mt-2">Sign in to access your store's dashboard.</p>
        </div>

        <div className="bg-surface p-8 rounded-3xl shadow-xl border border-secondary/20">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Select Your Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  type="button" 
                  onClick={() => setRole('Admin')}
                  className={`py-3 rounded-xl font-bold text-sm transition-all ${role === 'Admin' ? 'bg-primary text-white shadow-md' : 'bg-background text-text-secondary'}`}
                >
                  Admin
                </button>
                <button 
                  type="button"
                  onClick={() => setRole('Staff')}
                  className={`py-3 rounded-xl font-bold text-sm transition-all ${role === 'Staff' ? 'bg-primary text-white shadow-md' : 'bg-background text-text-secondary'}`}
                >
                  Staff
                </button>
              </div>
            </div>

            {role === 'Staff' && (
              <div className="animate-in fade-in duration-300">
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Assign to Store</label>
                <select 
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="w-full px-4 py-3 bg-background border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/50"
                >
                  {staffStores.map(store => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            {error && <p className="text-xs text-center font-bold text-error">{error}</p>}

            <div>
              <button 
                type="submit"
                className="w-full py-4 bg-text-dark text-white rounded-xl font-bold uppercase tracking-widest text-xs shadow-xl hover:scale-105 active:scale-100 transition-transform"
              >
                Login
              </button>
            </div>
            <p className="text-center text-[10px] text-text-secondary uppercase tracking-widest font-bold">Authentication Simulated</p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;