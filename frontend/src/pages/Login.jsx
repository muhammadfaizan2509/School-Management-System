import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import QuickLoginCards from '../components/QuickLoginCards';
import { GraduationCap, ArrowRight, AlertCircle } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid login credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = async (u, p) => {
    setUsername(u);
    setPassword(p);
    setError('');
    setLoading(true);
    try {
      await login(u, p);
      navigate('/dashboard');
    } catch (err) {
      setError('Login failed for demo account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div className="glass-panel" style={{
        maxWidth: 480,
        width: '100%',
        padding: '2.5rem',
        borderRadius: '24px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img 
            src="/logo.png" 
            alt="ITC Ghotki Logo" 
            style={{ 
              width: 95, 
              height: 95, 
              objectFit: 'contain', 
              marginBottom: '1rem',
              filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.4))'
            }} 
          />
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '0.2px', color: '#f8fafc', lineHeight: 1.3 }}>
            INFORMATION TECHNOLOGY COLLEGE GHOTKI
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.35rem' }}>
            College Management System & Student Portal
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#fca5a5',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.5rem'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. alex_morgan or admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : (
              <>
                <span>Sign In to Portal</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <QuickLoginCards onSelect={handleQuickSelect} />
      </div>
    </div>
  );
};

export default Login;
