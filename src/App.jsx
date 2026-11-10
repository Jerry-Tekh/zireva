import { useEffect, useState } from 'react';
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
import BrandMark from './components/BrandMark.jsx';
import { RequireAuth, RequireRole } from './components/RouteGuards.jsx';
import DashboardLayout from './components/DashboardLayout.jsx';

function FooterSectionLink({ landingRoute, id, className, children }) {
  return landingRoute
    ? <a className={className} href={`#${id}`}>{children}</a>
    : <a className={className} href={`/#${id}`}>{children}</a>;
}

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
          <a href="#venues" className="nav-link" onClick={scrollTo('venues')}>Places</a>
          <a href="#for-everyone" className="nav-link" onClick={scrollTo('for-everyone')}>For everyone</a>
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
            {isLanding
              ? <Link to="/register" className="btn primary nav-join" onClick={close}>Get started</Link>
              : <NavLink to="/login" className={link} onClick={close}>Log in</NavLink>}
          </>
        )}
      </div>
    </>
  );
}

export default function App() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) return;
    window.scrollTo(0, 0);
  }, [pathname]);
  const landingRoute = pathname === '/';
  const authRoute = pathname === '/login' || pathname === '/register';
  const eventRoute = pathname.startsWith('/events/');
  const dashboardRoute = ['/dashboard', '/account', '/tickets', '/scan', '/admin/overview', '/admin/users'].includes(pathname)
    || pathname.startsWith('/organizer');
  return (
    <div className={`app-shell${dashboardRoute ? ' has-dashboard' : ''}${landingRoute ? ' landing-shell' : ''}${authRoute ? ' auth-shell' : ''}${eventRoute ? ' event-shell' : ''}`}>
      <header className="app-header">
        <div className="app-header-inner">
        <Link to="/" className="brand">
          <BrandMark />
          <span className="brand-name">Zireva</span>
        </Link>
        {!authRoute && <Nav isLanding={landingRoute} />}
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
      {landingRoute || authRoute || eventRoute ? (
        <footer className="app-footer landing-footer">
          <div className="landing-footer-cta">
            <div><span className="eyebrow">Make room for the next one</span><h2>Find your next live moment.</h2><p>Explore the events already listed on Zireva, or create an account and start planning.</p></div>
            <div className="landing-footer-actions"><FooterSectionLink landingRoute={landingRoute} id="all-events" className="footer-action-primary">Explore events <span aria-hidden="true">→</span></FooterSectionLink><Link to="/register" className="footer-action-secondary">Create an account</Link></div>
          </div>
          <div className="landing-footer-main">
            <div className="landing-footer-brand">
              <Link to="/" className="brand">
                <BrandMark />
                <span className="brand-name">Zireva</span>
              </Link>
              <p>Find your people. Find your next.<br />Make more room for live experiences.</p>
            </div>
            <nav className="landing-footer-column" aria-label="Discover">
              <h2>Discover</h2>
              <FooterSectionLink landingRoute={landingRoute} id="events">Upcoming events</FooterSectionLink>
              <FooterSectionLink landingRoute={landingRoute} id="all-events">All events</FooterSectionLink>
              <FooterSectionLink landingRoute={landingRoute} id="venues">Places</FooterSectionLink>
              <FooterSectionLink landingRoute={landingRoute} id="for-everyone">Who it is for</FooterSectionLink>
            </nav>
            <nav className="landing-footer-column" aria-label="How Zireva works">
              <h2>The experience</h2>
              <FooterSectionLink landingRoute={landingRoute} id="how-it-works">How it works</FooterSectionLink>
              <Link to="/tickets">My tickets</Link>
              <Link to="/login">Sign in</Link>
            </nav>
            <nav className="landing-footer-column" aria-label="For organizers">
              <h2>For organizers</h2>
              <FooterSectionLink landingRoute={landingRoute} id="organizers">Why Zireva</FooterSectionLink>
              <Link to="/register">Start hosting</Link>
              <Link to="/login">Organizer sign in</Link>
            </nav>
          </div>
          <div className="landing-footer-bottom">
            <span>© {new Date().getFullYear()} Zireva. Made for live moments.</span>
            <div className="landing-footer-status"><span>Platform status</span><SystemHealth /></div>
          </div>
        </footer>
      ) : (
        <footer className="app-footer">
          <div className="app-footer-inner">
            <span className="eyebrow">Zireva Live Events</span>
            <SystemHealth />
          </div>
        </footer>
      )}
    </div>
  );
}
