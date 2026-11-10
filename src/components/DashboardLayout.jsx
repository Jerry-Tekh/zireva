import { useEffect, useState } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import SystemHealth from './SystemHealth.jsx';
import BrandMark from './BrandMark.jsx';

const ROLE_NAMES = {
  registered_user: 'Attendee',
  organizer: 'Organizer',
  event_staff: 'Event staff',
  super_admin: 'Administrator',
};

const ROLE_LINKS = {
  registered_user: [
    { to: '/tickets', label: 'My tickets', icon: 'ticket' },
    { to: '/account', label: 'Account', icon: 'person' },
  ],
  organizer: [
    { to: '/organizer', label: 'Overview', icon: 'overview', end: true },
    { to: '/organizer#events', label: 'Events', icon: 'calendar' },
    { to: '/tickets', label: 'My tickets', icon: 'ticket' },
    { to: '/account', label: 'Account', icon: 'person' },
  ],
  event_staff: [
    { to: '/scan', label: 'Ticket scanner', icon: 'scan', end: true },
    { to: '/tickets', label: 'My tickets', icon: 'ticket' },
    { to: '/account', label: 'Account', icon: 'person' },
  ],
  super_admin: [
    { to: '/admin/overview', label: 'Platform overview', icon: 'overview', end: true },
    { to: '/organizer#events', label: 'Events', icon: 'calendar' },
    { to: '/scan', label: 'Ticket scanner', icon: 'scan', end: true },
    { to: '/admin/users', label: 'Users', icon: 'group' },
    { to: '/tickets', label: 'My tickets', icon: 'ticket' },
    { to: '/account', label: 'Account', icon: 'person' },
  ],
};

function WorkspaceIcon({ name }) {
  const shared = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const shapes = {
    overview: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
    calendar: <><rect x="3.5" y="5" width="17" height="16" rx="2.5" /><path d="M7.5 3v4M16.5 3v4M3.5 9.5h17M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01" /></>,
    ticket: <><path d="M4 7.5A2.5 2.5 0 0 0 6.5 5h11A2.5 2.5 0 0 0 20 7.5v2a2.5 2.5 0 0 0 0 5v2a2.5 2.5 0 0 0-2.5 2.5h-11A2.5 2.5 0 0 0 4 16.5v-2a2.5 2.5 0 0 0 0-5z" /><path d="M12 8v1m0 3v1m0 3v1" /></>,
    person: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
    scan: <><path d="M8 4H5a1 1 0 0 0-1 1v3m12-4h3a1 1 0 0 1 1 1v3M4 16v3a1 1 0 0 0 1 1h3m12-4v3a1 1 0 0 1-1 1h-3M7 12h10" /></>,
    group: <><circle cx="9" cy="8" r="3" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 5.8M17 14.5a5 5 0 0 1 3.5 4.8" /></>,
  };
  return <svg className="dashboard-glyph" viewBox="0 0 24 24" aria-hidden="true" {...shared}>{shapes[name] ?? shapes.overview}</svg>;
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = ROLE_LINKS[user?.role] ?? ROLE_LINKS.registered_user;
  const roleName = ROLE_NAMES[user?.role] ?? 'Account';
  const initials = user?.name?.trim()?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U';

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobileOpen]);

  if (location.pathname === '/dashboard') {
    const startPath = user?.role === 'super_admin'
      ? '/admin/overview'
      : user?.role === 'organizer'
        ? '/organizer'
      : user?.role === 'event_staff'
        ? '/scan'
        : '/tickets';
    return <Navigate to={startPath} replace />;
  }

  return (
    <div className={`dashboard-layout${collapsed ? ' is-collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
      {mobileOpen && (
        <button
          type="button"
          className="dashboard-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside className="dashboard-sidebar" aria-label={`${roleName} navigation`}>
        <div className="dashboard-sidebar-top">
          <Link to="/" className="dashboard-sidebar-brand" aria-label="Zireva home">
            <BrandMark className="dashboard-brand-mark" />
            <span className="dashboard-brand-name">Zireva</span>
          </Link>
          <button
            type="button"
            className="dashboard-mobile-close"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="dashboard-workspace">
          <span className="dashboard-avatar">{initials}</span>
          <span className="dashboard-workspace-copy">
            <strong>{roleName} workspace</strong>
            <span>{user?.email}</span>
          </span>
        </div>

        <span className="dashboard-nav-heading">Workspace</span>
        <nav className="dashboard-nav">
          {links.map(({ to, label, icon }) => {
            const [path, hash] = to.split('#');
            const active = location.pathname === path
              ? (hash ? location.hash === `#${hash}` : !location.hash)
              : to === '/organizer#events' && location.pathname.startsWith('/organizer/events/');
            return (
              <Link
                key={to}
                to={to}
                aria-current={active ? 'page' : undefined}
                className={`dashboard-nav-link${active ? ' active' : ''}`}
                title={collapsed ? label : undefined}
              >
              <span className="dashboard-nav-icon"><WorkspaceIcon name={icon} /></span>
              <span className="dashboard-nav-label">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="dashboard-sidebar-bottom">
          <Link to="/" className="dashboard-back-link" title={collapsed ? 'Back to events' : undefined}>
            <span className="dashboard-nav-icon" aria-hidden="true">←</span>
            <span className="dashboard-nav-label">Back to events</span>
          </Link>
          <button
            type="button"
            className="dashboard-back-link dashboard-logout"
            title={collapsed ? 'Log out' : undefined}
            onClick={async () => {
              await logout();
              navigate('/');
            }}
          >
            <span className="dashboard-nav-icon" aria-hidden="true">↗</span>
            <span className="dashboard-nav-label">Log out</span>
          </button>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <button
            type="button"
            className="dashboard-collapse-toggle"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((value) => !value)}
          >
            <span aria-hidden="true">{collapsed ? '›' : '‹'}</span>
          </button>
          <button
            type="button"
            className="dashboard-menu-toggle"
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
          >
            <span aria-hidden="true">☰</span>
          </button>
          <div className="dashboard-topbar-context">
            <span>{roleName} workspace</span>
          </div>
          <SystemHealth />
          <span className="dashboard-topbar-user">{user?.email}</span>
        </header>
        <main className="dashboard-content">
          <Outlet />
        </main>
      </section>
    </div>
  );
}
