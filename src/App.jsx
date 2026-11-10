import { useState } from 'react';
import { Routes, Route, Link, useNavigate, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from './lib/auth.jsx';
import Browse from './pages/Browse.jsx';
import EventDetail from './pages/EventDetail.jsx';
import Confirmation from './pages/Confirmation.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Account from './pages/Account.jsx';
import MyTickets from './pages/MyTickets.jsx';
import OrganizerDashboard from './pages/OrganizerDashboard.jsx';
import OrganizerEvent from './pages/OrganizerEvent.jsx';
import Scanner from './pages/Scanner.jsx';
import AdminOverview from './pages/AdminOverview.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import SystemHealth from './components/SystemHealth.jsx';
import { RequireAuth, RequireRole } from './components/RouteGuards.jsx';
import DashboardLayout from './components/DashboardLayout.jsx';
import logoTicUrl from './assets/logoTic.jfif?url';

function Nav({ isLanding }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const link = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;
  const scrollTo = (id) => (event) => {
    if (!isLanding) return;
    event.preventDefault();
    close();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  };
  return (
    <>
      <button className="nav-toggle" aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>Menu</button>
      <div className={`nav ${open ? 'open' : ''}`}>
        {isLanding && <>
          <a href="#events" className="nav-link" onClick={scrollTo('events')}>Discover</a>
          <a href="#all-events" className="nav-link" onClick={scrollTo('all-events')}>All events</a>
          <a href="#how-it-works" className="nav-link" onClick={scrollTo('how-it-works')}>How it works</a>
          <a href="#venues" className="nav-link" onClick={scrollTo('venues')}>Venues</a>
          <a href="#organizers" className="nav-link" onClick={scrollTo('organizers')}>For organizers</a>
        </>}
        {user ? (
          <>
            <NavLink to="/dashboard" className={link} onClick={close}>Dashboard</NavLink>
            <span className="nav-email">{user.email}</span>
            <button className="ghost" onClick={async () => { close(); await logout(); navigate('/'); }}>Log out</button>
          </>
        ) : (
          <>
            <NavLink to="/login" className={link} onClick={close}>Log in</NavLink>
            {isLanding && <Link to="/register" className="btn primary nav-join" onClick={close}>Get started</Link>}
          </>
        )}
      </div>
    </>
  );
}

export default function App() {
  const { pathname } = useLocation();
  const landingRoute = pathname === '/';
  const dashboardRoute = ['/dashboard', '/account', '/tickets', '/scan', '/admin/overview', '/admin/users'].includes(pathname)
    || pathname.startsWith('/organizer');
  return (
    <div className={`app-shell${dashboardRoute ? ' has-dashboard' : ''}${landingRoute ? ' landing-shell' : ''}`}>
      <header className="app-header">
        <div className="app-header-inner">
        <Link to="/" className="brand">
          <img className="brand-logo" src={logoTicUrl} alt="" aria-hidden="true" />
          <span className="brand-name">Zireva</span>
        </Link>
        <Nav isLanding={landingRoute} />
        </div>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Browse />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/orders/:id" element={<Confirmation />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<RequireAuth><DashboardLayout /></RequireAuth>}>
            <Route path="/dashboard" element={null} />
            <Route path="/account" element={<Account />} />
            <Route path="/tickets" element={<MyTickets />} />
            <Route path="/organizer" element={<RequireRole roles={['organizer', 'super_admin']}><OrganizerDashboard /></RequireRole>} />
            <Route path="/organizer/events/:id" element={<RequireRole roles={['organizer', 'super_admin']}><OrganizerEvent /></RequireRole>} />
            <Route path="/scan" element={<RequireRole roles={['event_staff', 'super_admin']}><Scanner /></RequireRole>} />
            <Route path="/admin/overview" element={<RequireRole roles={['super_admin']}><AdminOverview /></RequireRole>} />
            <Route path="/admin/users" element={<RequireRole roles={['super_admin']}><AdminUsers /></RequireRole>} />
          </Route>
        </Routes>
      </main>
      <footer className="app-footer">
        <div className="app-footer-inner">
        <span className="eyebrow">Zireva Live Events</span>
        <SystemHealth />
        </div>
      </footer>
    </div>
  );
}
