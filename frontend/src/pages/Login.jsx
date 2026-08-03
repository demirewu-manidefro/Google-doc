import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { FileText, ArrowRight, Lock, Mail } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await login(email, password);
      setIsLoading(false);
      navigate('/dashboard');
    } catch (err) {
      setIsLoading(false);
      alert('Login failed: ' + err.message);
    }
  };

  return (
    <div className="container flex-center" style={{ minHeight: '100vh' }}>
      <div className="glass-panel animate-fade-in" style={{ padding: '3rem', width: '100%', maxWidth: '440px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="flex-center" style={{ marginBottom: '1rem' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              padding: '12px',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)'
            }}>
              <FileText size={32} color="white" />
            </div>
          </div>
          <h1 className="heading-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>SyncWrite</h1>
          <p className="text-muted">Sign in to continue to your documents</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label className="input-label" htmlFor="email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="var(--text-tertiary)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
              <input 
                type="email" 
                id="email" 
                className="input-field" 
                placeholder="you@example.com" 
                style={{ paddingLeft: '40px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
          </div>
          
          <div className="input-group" style={{ marginBottom: '2rem' }}>
            <div className="flex-between">
              <label className="input-label" htmlFor="password">Password</label>
              <a href="#" style={{ fontSize: '0.8rem', color: 'var(--accent-primary)' }}>Forgot password?</a>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="var(--text-tertiary)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
              <input 
                type="password" 
                id="password" 
                className="input-field" 
                placeholder="••••••••" 
                style={{ paddingLeft: '40px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
            {!isLoading && <ArrowRight size={18} />}
          </button>

          <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', color: 'var(--text-tertiary)' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(0,0,0,0.1)' }} />
            <span style={{ padding: '0 1rem', fontSize: '0.85rem' }}>Or continue with</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(0,0,0,0.1)' }} />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                try {
                  setIsLoading(true);
                  await useAuthStore.getState().googleLogin(credentialResponse.credential);
                  setIsLoading(false);
                  navigate('/dashboard');
                } catch (err) {
                  setIsLoading(false);
                  alert(err.message);
                }
              }}
              onError={() => alert('Google Sign-In failed')}
            />
          </div>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.9rem' }}>
          <span className="text-muted">Don't have an account? </span>
          <Link to="/register" style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Create one now</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
