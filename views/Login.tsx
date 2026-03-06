import React, { useState } from 'react';
import { User } from '../types';
import { login, setAuthToken } from '../services/api';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Username and password are required.');
      return;
    }

    try {
      setIsLoading(true);
      const response = await login({ username: username.trim(), password });
      setAuthToken(response.token);
      onLogin(response.user as User);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4 shadow-lg">
            <span className="material-icons text-white text-4xl">smartphone</span>
          </div>
          <h1 className="text-3xl font-black text-text-dark tracking-tight">Welcome to MobMastery</h1>
          <p className="text-text-secondary mt-2">Sign in with your assigned credentials.</p>
        </div>

        <div className="bg-surface p-8 rounded-3xl shadow-xl border border-secondary/20">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-background border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/50"
                placeholder="Enter username"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-background border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/50"
                placeholder="Enter password"
              />
            </div>

            {error && <p className="text-xs text-center font-bold text-error">{error}</p>}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-text-dark text-white rounded-xl font-bold uppercase tracking-widest text-xs shadow-xl hover:scale-105 active:scale-100 transition-transform disabled:opacity-70"
              >
                {isLoading ? 'Signing In...' : 'Login'}
              </button>
            </div>
            <p className="text-center text-[10px] text-text-secondary uppercase tracking-widest font-bold">Admin provides each employee username and password.</p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
