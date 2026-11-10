import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { platformAnalytics } from '../lib/analyticsApi';
import { getHealth } from '../lib/systemApi';
import { messageFor } from '../lib/errors';
import DailyAnalytics from '../components/DailyAnalytics.jsx';
import './AdminOverview.css';

const DAY_MS = 24 * 60 * 60 * 1000;
const number = new Intl.NumberFormat('en-US');
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function utcDateValue(date) {
  return date.toISOString().slice(0, 10);
}

function defaultPeriod() {
  const today = new Date();
  const to = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const from = new Date(to.getTime() - 29 * DAY_MS);
  return { from: utcDateValue(from), to: utcDateValue(to) };
}

function exclusiveEnd(date) {
  return new Date(new Date(`${date}T00:00:00.000Z`).getTime() + DAY_MS).toISOString();
}

function CountList({ title, entries, emptyText }) {
  const rows = Object.entries(entries ?? {});
  return (
    <section className="section platform-panel">
      <div className="between">
        <h2>{title}</h2>
        {rows.length > 0 && <span className="badge">{number.format(rows.reduce((sum, [, count]) => sum + count, 0))} total</span>}
      </div>
      {rows.length ? (
        <dl className="platform-count-list">
          {rows.map(([name, count]) => (
            <div key={name}>
              <dt>{name.replaceAll('_', ' ')}</dt>
              <dd>{number.format(count)}</dd>
            </div>
          ))}
        </dl>
      ) : <p className="muted">{emptyText}</p>}
    </section>
  );
}

function Metric({ label, value, detail }) {
  const icon = label === 'Net revenue' ? (
    <><path d="M12 3v18" /><path d="M17 7.5c0-1.7-2.2-3-5-3s-5 1.3-5 3 1.7 2.5 5 3 5 1.3 5 3-2.2 3-5 3-5-1.3-5-3" /></>
  ) : label === 'Attendance' ? (
    <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 8v6M23 11h-6" /></>
  ) : label === 'Open refunds' ? (
    <><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></>
  ) : (
    <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H18a2 2 0 0 1 2 2v15H6a2 2 0 0 1-2-2z" /><path d="M4 17a2 2 0 0 1 2-2h14M8 7h8M8 11h6" /></>
  );
  return (
    <section className="section platform-metric">
      <span className="platform-metric-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{icon}</svg></span>
      <span className="eyebrow">{label}</span>
      <strong>{value}</strong>
      <span className="muted">{detail}</span>
    </section>
  );
}

export default function AdminOverview() {
  const initialPeriod = defaultPeriod();
  const [period, setPeriod] = useState(initialPeriod);
  const [draftPeriod, setDraftPeriod] = useState(initialPeriod);
  const [periodError, setPeriodError] = useState('');
  const validPeriod = Boolean(period.from && period.to && period.to >= period.from
    && (new Date(`${period.to}T00:00:00.000Z`) - new Date(`${period.from}T00:00:00.000Z`)) < 366 * DAY_MS);
  const summary = useQuery({
    queryKey: ['platform-analytics', period.from, period.to],
    queryFn: () => platformAnalytics({
      from: new Date(`${period.from}T00:00:00.000Z`).toISOString(),
      to: exclusiveEnd(period.to),
    }),
    enabled: validPeriod,
  });
  const health = useQuery({
    queryKey: ['system-health'],
    queryFn: getHealth,
    refetchInterval: 30000,
  });

  function applyPeriod(event) {
    event.preventDefault();
    const fromDate = new Date(`${draftPeriod.from}T00:00:00.000Z`);
    const toDate = new Date(`${draftPeriod.to}T00:00:00.000Z`);
    const days = (toDate - fromDate) / DAY_MS + 1;
    if (!draftPeriod.from || !draftPeriod.to || days < 1 || days > 366) {
      setPeriodError('Choose a valid date range of no more than 366 days.');
      return;
    }
    setPeriodError('');
    setPeriod(draftPeriod);
  }

  const data = summary.data;
  const metrics = data?.metrics;
  const healthOk = health.data?.status === 'ok';
  const healthAvailable = health.isSuccess;

  return (
    <div className="page reveal platform-overview">
      <div className="platform-overview-header">
        <header className="page-hero workspace-page-hero">
          <span className="eyebrow">Super admin</span>
          <h1>Platform overview</h1>
          <p>Monitor ticket activity, revenue, attendance, and service availability.</p>
        </header>

        <section className="platform-health" aria-labelledby="platform-health-heading">
          <div className="platform-health-heading">
            <h2 id="platform-health-heading" className="sr-only">Service status</h2>
          {health.isLoading ? (
              <span className="badge" role="status">Checking services…</span>
          ) : health.isError ? (
            <div className="platform-health-error">
              <span role="alert">{messageFor(health.error)}</span>
              <button type="button" onClick={() => health.refetch()}>Retry health check</button>
            </div>
          ) : (
              <span className={`badge${healthOk ? ' ok' : ' danger'}`}>{healthOk ? 'All services operational' : 'Service degradation reported'}</span>
          )}
          </div>
          {!health.isLoading && !health.isError && (
            <ul className="platform-health-services">
              {[
                ['API', true],
                ['Database', health.data.db],
                ['Redis', health.data.redis],
              ].map(([service, online]) => (
                <li key={service}>
                  <span>{service}</span>
                  <strong className={online ? 'service-online' : 'service-offline'}>
                    <i aria-hidden="true" />{online ? 'Online' : 'Unavailable'}
                  </strong>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <form className="section platform-period" onSubmit={applyPeriod}>
        <div className="platform-period-copy">
          <span className="eyebrow">Reporting window</span>
          <p className="muted">Choose up to 366 calendar days. Metrics are calculated in UTC.</p>
        </div>
        <label>From
          <input type="date" value={draftPeriod.from} max={draftPeriod.to || undefined}
            onChange={(event) => setDraftPeriod((current) => ({ ...current, from: event.target.value }))} />
        </label>
        <label>To
          <input type="date" value={draftPeriod.to} min={draftPeriod.from || undefined}
            onChange={(event) => setDraftPeriod((current) => ({ ...current, to: event.target.value }))} />
        </label>
        <button className="primary" type="submit">Apply dates</button>
      </form>
      {periodError && <p role="alert" className="alert danger">{periodError}</p>}

      {healthAvailable && !healthOk && (
        <p role="status" className="alert danger">One or more platform dependencies need attention.</p>
      )}
      {data?.metrics.openRefundRequests > 0 && (
        <p role="status" className="alert">There {data.metrics.openRefundRequests === 1 ? 'is' : 'are'} {number.format(data.metrics.openRefundRequests)} refund request{data.metrics.openRefundRequests === 1 ? '' : 's'} awaiting review.</p>
      )}

      {summary.isLoading ? (
        <div className="platform-loading-layout" role="status" aria-label="Loading platform overview">
          <div className="platform-metric-skeletons">{[0, 1, 2, 3].map((item) => <div className="platform-skeleton metric-skeleton" key={item} />)}</div>
          <div className="platform-skeleton platform-chart-skeleton" />
          <div className="platform-side-skeletons"><div className="platform-skeleton" /><div className="platform-skeleton" /></div>
        </div>
      ) : summary.isError ? (
        <div className="section platform-summary-error">
          <p role="alert" className="alert danger">{messageFor(summary.error)}</p>
          <button type="button" onClick={() => summary.refetch()}>Retry platform metrics</button>
        </div>
      ) : !data ? (
        <div className="section"><p role="alert" className="muted">Platform metrics are unavailable.</p></div>
      ) : (
        <>
          <div className="platform-metrics">
            <Metric label="Tickets sold" value={number.format(metrics.ticketsSold)} detail="Issued or used during this window" />
            <Metric label="Net revenue" value={money.format(metrics.netRevenueCents / 100)} detail={`${money.format(metrics.grossRevenueCents / 100)} gross less ${money.format(metrics.refundedAmountCents / 100)} refunded`} />
            <Metric label="Attendance" value={number.format(metrics.attendance)} detail="Unique accepted ticket scans in this window" />
            <Metric label="Open refunds" value={number.format(metrics.openRefundRequests)} detail="Requests awaiting platform review" />
          </div>
          <div className="platform-dashboard-grid">
            <section className="section platform-trends">
              <div className="platform-section-heading">
                <div>
                  <span className="eyebrow">Platform activity</span>
                  <h2>Daily trends</h2>
                </div>
                <p className="muted">UTC totals for the selected reporting window.</p>
              </div>
              {data.daily.length === 0
                ? <p className="muted">No daily data was returned for this reporting window.</p>
                : <DailyAnalytics daily={data.daily} showCategories={false} />}
            </section>
            <aside className="platform-side-column" aria-label="Platform breakdowns">
              <CountList title="Users by role" entries={data.usersByRole} emptyText="No user accounts have been created." />
              <CountList title="Events by status" entries={data.eventsByStatus} emptyText="No events have been created." />
            </aside>
          </div>
          <section className="section platform-refunds">
            <div>
              <span className="eyebrow">Refund operations</span>
              <h2>{number.format(metrics.openRefundRequests)} open request{metrics.openRefundRequests === 1 ? '' : 's'}</h2>
              <p className="muted">{money.format(metrics.refundedAmountCents / 100)} completed refunds in the selected reporting window.</p>
            </div>
            <Link className="btn ghost" to="/organizer#events">Review event operations</Link>
          </section>
          {metrics.ticketsSold === 0 && metrics.grossRevenueCents === 0
            && metrics.refundedAmountCents === 0 && metrics.attendance === 0 && (
              <p className="muted">No ticket sales, refunds, or attendance were recorded in this reporting window.</p>
            )}
        </>
      )}
    </div>
  );
}
