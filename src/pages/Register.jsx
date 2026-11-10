import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { messageFor } from '../lib/errors';
import AuthVisual from '../components/AuthVisual.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await register({ name, email, password });
      navigate('/dashboard');
    } catch (ex) {
      setErr(messageFor(ex));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap auth-split reveal">
      <AuthVisual
        kicker="Live starts here"
        title="Make more room for live."
        copy="Discover events, bring your people together, and keep every ticket close in one place."
        linkLabel="Browse events"
      />
      <section className="auth-card panel register-card">
        <span className="eyebrow">Welcome to Zireva</span>
        <h1>Create your account</h1>
        <p className="auth-intro">Create an account to book and manage your tickets.</p>
        {err && <p className="alert danger" style={{ marginTop: 16 }}>{err}</p>}
        <form onSubmit={onSubmit} className="stack auth-form register-form">
          <label>Name<input autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required /></label>
          <label>Email<input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label>Password<input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={10} /></label>
          <span className="register-password-hint">Use at least 10 characters for a stronger password.</span>
          <button className="primary" disabled={busy} type="submit">{busy ? 'Creating…' : 'Create account'}</button>
        </form>
        <p className="muted auth-switch register-login">
          Have an account? <Link to="/login">Log in</Link>
        </p>
      </section>
    </div>
  );
}
