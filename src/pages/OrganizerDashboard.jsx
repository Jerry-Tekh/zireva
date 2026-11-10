import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createEvent } from '../lib/organizerApi';
import { eventPerformance } from '../lib/analyticsApi';
import { messageFor } from '../lib/errors';
import { EVENT_STATUSES, fromDateTimeLocal, optionalText } from '../lib/eventForms';
import Pagination from '../components/Pagination.jsx';
import EventPerformanceChart from '../components/EventPerformanceChart.jsx';
import './OrganizerDashboardPerformance.css';

const DAY_MS = 24 * 60 * 60 * 1000;
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function utcDateValue(date) {
  return date.toISOString().slice(0, 10);
}

function defaultPeriod() {
  const today = new Date();
  const to = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  return { from: utcDateValue(new Date(to.getTime() - 29 * DAY_MS)), to: utcDateValue(to) };
}

function exclusiveEnd(date) {
  return new Date(new Date(`${date}T00:00:00.000Z`).getTime() + DAY_MS).toISOString();
}

function eventStartLabel(startsAt) {
  if (!startsAt) return 'Date not set';
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(startsAt));
}

export default function OrganizerDashboard() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [status, setStatus] = useState('draft');
  const [err, setErr] = useState(null);
  const [period, setPeriod] = useState(defaultPeriod);
  const [periodDraft, setPeriodDraft] = useState(defaultPeriod);
  const [periodError, setPeriodError] = useState('');

  const pageSize = 20;
  const eventsQuery = useQuery({
    queryKey: ['organizer-performance', page, search, filterStatus, period.from, period.to],
    queryFn: () => eventPerformance({
      page,
      pageSize,
      search,
      status: filterStatus,
      from: new Date(`${period.from}T00:00:00.000Z`).toISOString(),
      to: exclusiveEnd(period.to),
    }),
  });
  const { data: result, isLoading, isError, error } = eventsQuery;
  const events = result?.rows ?? [];
  const create = useMutation({
    mutationFn: () => createEvent({
      title,
      description: optionalText(description),
      location: optionalText(location),
      startsAt: fromDateTimeLocal(startsAt),
      status,
    }),
    onSuccess: () => {
      setTitle('');
      setDescription('');
      setLocation('');
      setStartsAt('');
      setStatus('draft');
      setPage(1);
      qc.invalidateQueries({ queryKey: ['organizer-performance'] });
    },
    onError: (e) => setErr(messageFor(e)),
  });
  function applyPeriod(e) {
    e.preventDefault();
    const fromDate = new Date(`${periodDraft.from}T00:00:00.000Z`);
    const toDate = new Date(`${periodDraft.to}T00:00:00.000Z`);
    const days = (toDate - fromDate) / DAY_MS + 1;
    if (!periodDraft.from || !periodDraft.to || days < 1 || days > 366) {
      setPeriodError('Choose a valid date range of no more than 366 days.');
      return;
    }
    setPeriodError('');
    setPage(1);
    setPeriod(periodDraft);
  }

  return (
    <div className="page reveal organizer-dashboard-page">
      <header className="page-hero workspace-page-hero">
        <span className="eyebrow">Organizer workspace</span>
        <h1>Your events</h1>
        <p>Review publication status, ticket sales, capacity, and refunds across the events you manage.</p>
      </header>

      {isError && (
        <div>
          <p role="alert" className="alert danger">{messageFor(error)}</p>
          <button type="button" onClick={() => eventsQuery.refetch()}>Retry loading events</button>
        </div>
      )}

      <div className="grid-3 organizer-summary-grid" aria-label="Event totals">
        <section className="section organizer-summary-card">
          <span className="eyebrow">Events managed</span>
          <strong>{isLoading || isError ? '—' : Object.values(result?.statusCounts ?? {}).reduce((sum, count) => sum + count, 0)}</strong>
          <p className="muted">Across all event statuses</p>
        </section>
        <section className="section organizer-summary-card">
          <span className="eyebrow">Published</span>
          <strong>{isLoading || isError ? '—' : result?.statusCounts?.published ?? 0}</strong>
          <p className="muted">Available for guests to discover</p>
        </section>
        <section className="section organizer-summary-card">
          <span className="eyebrow">Drafts</span>
          <strong>{isLoading || isError ? '—' : result?.statusCounts?.draft ?? 0}</strong>
          <p className="muted">Not yet visible to guests</p>
        </section>
      </div>

      <details className="organizer-create">
        <summary>
          <span>
            <span className="eyebrow">Quick action</span>
            <strong>Create an event</strong>
          </span>
          <span className="organizer-create-toggle" aria-hidden="true">+</span>
        </summary>
        <form onSubmit={(e) => { e.preventDefault(); setErr(null); create.mutate(); }}
          className="section form-grid">
          <label style={{ flex: '1 1 240px' }}>Event title<input value={title} onChange={(e) => setTitle(e.target.value)} required /></label>
          <label>Location<input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Venue or city" /></label>
          <label>Starts at<input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} /></label>
          <label>Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {EVENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label style={{ gridColumn: '1 / -1' }}>Description<textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></label>
          <button className="primary" type="submit" disabled={!title || create.isPending}>{create.isPending ? 'Creating…' : 'Create event'}</button>
        </form>
      </details>
      {err && <p className="alert danger">{err}</p>}

      <section className="section organizer-performance-section" id="events">
      <div className="between organizer-performance-heading">
        <div>
          <span className="eyebrow">Sales and attendance</span>
          <h2 style={{ marginTop: 6 }}>Event performance</h2>
          <p className="muted">Compare gross sales, refunds, and net revenue for the selected reporting window.</p>
        </div>
      </div>
      <form
        className="organizer-performance-period"
        onSubmit={applyPeriod}
        aria-label="Performance reporting period"
      >
        <label>From
          <input type="date" value={periodDraft.from} max={periodDraft.to || undefined}
            onChange={(e) => setPeriodDraft((current) => ({ ...current, from: e.target.value }))} />
        </label>
        <label>To
          <input type="date" value={periodDraft.to} min={periodDraft.from || undefined}
            onChange={(e) => setPeriodDraft((current) => ({ ...current, to: e.target.value }))} />
        </label>
        <button type="submit">Apply dates</button>
      </form>
      {periodError && <p role="alert" className="alert danger">{periodError}</p>}
      <form
        className="row organizer-event-filters"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearch(searchInput.trim());
        }}
        style={{ marginTop: 16 }}
      >
        <label>Search events<input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} /></label>
        <label>Status
          <select value={filterStatus} onChange={(e) => { setPage(1); setFilterStatus(e.target.value); }}>
            <option value="">All statuses</option>
            {EVENT_STATUSES.map((eventStatus) => <option key={eventStatus} value={eventStatus}>{eventStatus}</option>)}
          </select>
        </label>
        <button type="submit">Search</button>
        {(search || filterStatus) && (
          <button type="button" onClick={() => { setPage(1); setSearchInput(''); setSearch(''); setFilterStatus(''); }}>
            Clear filters
          </button>
        )}
      </form>
      {isLoading ? <p className="muted">Loading events…</p> : isError ? null : !events?.length ? (
        <p className="muted" style={{ marginTop: 16 }}>{search || filterStatus ? 'No events match these filters.' : 'No events yet. Create an event to get started.'}</p>
      ) : (
        <>
        <EventPerformanceChart events={events} />
        <div className="organizer-mobile-events" aria-label="Event performance list">
          {events.map((event) => (
            <article className="organizer-mobile-event" key={event.id}>
              <div className="organizer-mobile-event-title">
                <div><span className="eyebrow">{eventStartLabel(event.startsAt)}</span><h3>{event.title}</h3></div>
                <span className={`badge${event.status === 'published' ? ' ok' : ''}`}>{event.status}</span>
              </div>
              <dl>
                <div><dt>Tickets sold</dt><dd>{event.ticketsSold}</dd></div>
                <div><dt>Capacity left</dt><dd>{event.capacityRemaining} / {event.capacity}</dd></div>
                <div><dt>Net revenue</dt><dd>{money.format(event.netRevenueCents / 100)}</dd></div>
              </dl>
              <Link to={`/organizer/events/${event.id}`} className="btn ghost">Manage event <span aria-hidden="true">→</span></Link>
            </article>
          ))}
        </div>
        <div className="table-card organizer-performance-table">
          <table>
            <caption className="sr-only">Event performance and sales for the selected reporting window</caption>
            <thead>
              <tr>
                <th scope="col">Event</th>
                <th scope="col">Status / date</th>
                <th scope="col">Tickets sold</th>
                <th scope="col">Capacity remaining</th>
                <th scope="col">Gross sales</th>
                <th scope="col">Refunds</th>
                <th scope="col">Net revenue</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <th scope="row">
                    <strong>{event.title}</strong>
                    <span className="mono muted" style={{ display: 'block', fontSize: '0.72rem' }}>{event.id}</span>
                  </th>
                  <td>
                    <span className={`badge${event.status === 'published' ? ' ok' : ''}`}>{event.status}</span>
                    <span className="organizer-performance-date">{eventStartLabel(event.startsAt)}</span>
                  </td>
                  <td>{event.ticketsSold}</td>
                  <td>{event.capacityRemaining} / {event.capacity}</td>
                  <td>{money.format(event.grossRevenueCents / 100)}</td>
                  <td>{money.format(event.refundedAmountCents / 100)}</td>
                  <td><strong>{money.format(event.netRevenueCents / 100)}</strong></td>
                  <td><Link to={`/organizer/events/${event.id}`} className="btn ghost">Manage</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
      {!isLoading && !isError && result && (
        <Pagination
          page={result.page}
          pageSize={result.pageSize}
          total={result.total}
          totalPages={result.totalPages}
          onPageChange={setPage}
        />
      )}
      </section>
    </div>
  );
}
