import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { FileText, ArrowRight, Lock, Mail, User } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const register = useAuthStore((state) => state.register);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await register(name, email, password);
      setIsLoading(false);
      navigate('/dashboard');
    } catch (err) {
      setIsLoading(false);
      alert('Registration failed: ' + err.message);
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
          <h1 className="heading-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Create Account</h1>
          <p className="text-muted">Join SyncWrite to start collaborating</p>
        </div>

        <form onSubmit={handleRegister}>
          <div className="input-group">
            <label className="input-label" htmlFor="name">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={18} color="var(--text-tertiary)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
              <input 
                type="text" 
                id="name" 
                className="input-field" 
                placeholder="John Doe" 
                style={{ paddingLeft: '40px' }}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required 
              />
            </div>
          </div>

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
            <label className="input-label" htmlFor="password">Password</label>
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

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '1.5rem' }} disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Sign Up'}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.9rem' }}>
          <span className="text-muted">Already have an account? </span>
          <Link to="/login" style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Sign in here</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
