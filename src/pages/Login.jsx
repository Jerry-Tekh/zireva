import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { messageFor } from '../lib/errors';
import { DEMO_CREDENTIALS, DEMO_PASSWORD } from '../lib/demoCredentials';
import AuthVisual from '../components/AuthVisual.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (ex) {
      setErr(messageFor(ex));
    } finally {
      setBusy(false);
    }
  }

  function fillDemo(email) {
    setEmail(email);
    setPassword(DEMO_PASSWORD);
  }

  return (
    <div className="auth-wrap auth-split reveal">
      <AuthVisual
        kicker="Your next live moment"
        title="Good to have you back."
        copy="Pick up where your plans left off. Find an event, manage your tickets, or get ready to host."
        linkLabel="Explore events"
      />
      <section className="auth-card panel">
        <span className="eyebrow">Welcome back</span>
        <h1>Log in to Zireva</h1>
        <p className="auth-intro">Sign in to continue to your tickets and events.</p>
        {err && <p className="alert danger" style={{ marginTop: 16 }}>{err}</p>}
        <form onSubmit={onSubmit} className="stack auth-form">
          <label>Email<input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
          <button className="primary" disabled={busy} type="submit">{busy ? 'Logging in…' : 'Log in'}</button>
        </form>
        <div className="stack demo-roles">
          <span className="eyebrow">Demo roles</span>
          <div className="grid-2" style={{ gap: 8 }}>
            {DEMO_CREDENTIALS.map((demo) => (
              <button key={demo.role} type="button" className="ghost" onClick={() => fillDemo(demo.email)}>
                {demo.label}
              </button>
            ))}
          </div>
        </div>
        <p className="muted auth-switch">
          No account? <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 800 }}>Create one</Link>
        </p>
      </section>
    </div>
  );
}
