import { useState, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import BrandMark from '../components/BrandMark.jsx';
import { apiGet } from '../lib/api';
import { heroFor } from '../lib/images';

const PAGE = 8;
const JOURNEY_STEPS = [
  { number: '01', title: 'Find the right event', copy: 'Browse published events, search by title or location, and open an event to read its details before you decide.' },
  { number: '02', title: 'Choose your ticket', copy: 'Compare available ticket tiers, prices, and remaining quantities on the event page.' },
  { number: '03', title: 'Reserve and pay', copy: 'Choose how many tickets you need and reserve them at checkout. Your reservation has an expiry, so you can see how much time remains to pay.' },
  { number: '04', title: 'Keep your QR ticket close', copy: 'After successful payment, issued tickets and their QR codes are available from your ticket wallet for event entry.' },
];
const fmtDate = (s) => (s ? new Date(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Date TBA');
const fmtFullDate = (s) => (s ? new Date(s).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Date TBA');

export default function Browse() {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('date');

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['events'],
    queryFn: ({ pageParam }) => apiGet(`/events?page=${pageParam}&pageSize=${PAGE}`),
    initialPageParam: 1,
    getNextPageParam: (last, all) => (last.length === PAGE ? all.length + 1 : undefined),
  });

  const events = useMemo(() => {
    const all = (data?.pages ?? []).flat();
    const needle = q.trim().toLowerCase();
    const filtered = needle
      ? all.filter((e) => `${e.title} ${e.location ?? ''}`.toLowerCase().includes(needle))
      : all;
    return [...filtered].sort((a, b) => {
      if (sort === 'name') return a.title.localeCompare(b.title);
      return (a.starts_at || '9999').localeCompare(b.starts_at || '9999'); // date asc, undated last
    });
  }, [data, q, sort]);

  const allEvents = useMemo(() => (data?.pages ?? []).flat(), [data]);
  const locations = useMemo(() => {
    const grouped = new Map();
    allEvents.forEach((event) => {
      const name = event.location?.trim();
      if (!name) return;
      const key = name.toLocaleLowerCase();
      const place = grouped.get(key) ?? { name, events: 0, eventId: event.id };
      place.events += 1;
      grouped.set(key, place);
    });
    return [...grouped.values()].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 4);
  }, [allEvents]);
  const featuredEvents = useMemo(() => {
    return allEvents
      .filter((event) => !event.starts_at || Number.isNaN(Date.parse(event.starts_at)) || Date.parse(event.starts_at) >= Date.now())
      .slice()
      .sort((a, b) => (a.starts_at || '9999').localeCompare(b.starts_at || '9999'))
      .slice(0, 4);
  }, [allEvents]);
  const hasEvents = events.length > 0;
  const hasFeatured = featuredEvents.length > 0;

  return (
    <div className="page browse-page">
      <header className="browse-hero reveal" id="top">
        <div className="browse-hero-inner">
          <div className="hero-copy">
            <span className="eyebrow"><span className="live-dot" /> WHAT'S ON</span>
            <h1>Events, all in <span>one place.</span></h1>
            <p>Browse concerts, comedy, food, workshops, and more. Check the details and ticket options before you book.</p>
            <form className="browse-search" role="search" onSubmit={(e) => {
              e.preventDefault();
              const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
              document.getElementById('all-events')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
            }}>
              <div className={`hero-search-row${q ? ' has-clear' : ''}`}>
                <input
                  id="event-search"
                  aria-label="Search events"
                  placeholder="Search events or locations"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                {q && (
                  <button type="button" className="ghost" onClick={() => setQ('')}>
                    Clear
                  </button>
                )}
                <button type="submit" className="primary">Explore events <span aria-hidden="true">→</span></button>
              </div>
            </form>
            <a className="hero-secondary-link" href="#events">See what’s coming up <span aria-hidden="true">↓</span></a>
          </div>
        </div>
        <video className="hero-video" autoPlay muted loop playsInline preload="metadata" poster="/images/events/nicholas-green-nPz8akkUmDI-unsplash.webp" aria-hidden="true" tabIndex={-1}>
          <source src="/video/herovideobg.mp4" type="video/mp4" />
        </video>
        <div className="hero-shade" aria-hidden="true" />
      </header>

      <section className="browse-section reveal upcoming-section" id="events" aria-labelledby="featured-heading">
        <div className="section-heading upcoming-heading">
          <div>
            <span className="eyebrow">COMING UP</span>
            <h2 id="featured-heading">Events coming up.</h2>
          </div>
          <a className="section-text-link" href="#all-events">Explore every event <span aria-hidden="true">→</span></a>
        </div>

        {error ? (
          <div className="empty-state compact"><span className="eyebrow">Events unavailable</span><h3>Upcoming events could not load.</h3><p>Check the API connection and try again.</p></div>
        ) : !isLoading && !hasFeatured ? (
          <div className="empty-state compact"><span className="eyebrow">Coming soon</span><h3>No upcoming events yet.</h3><p>New dates will appear here as organizers publish them.</p></div>
        ) : isLoading ? (
          <div className="upcoming-layout" aria-hidden="true"><div className="upcoming-lead-skeleton"/><div className="upcoming-list-skeleton"><i/><i/><i/></div></div>
        ) : (
          <div className="upcoming-layout">
            {featuredEvents.slice(0, 1).map((ev) => (
              <Link key={ev.id} to={`/events/${ev.id}`} className="upcoming-lead">
                <img src={heroFor(ev.id)} alt="" loading="lazy" decoding="async" />
                <span className="upcoming-lead-badge">Featured <span>·</span> Upcoming</span>
                <div className="upcoming-lead-content">
                  <p className="upcoming-lead-meta">{fmtFullDate(ev.starts_at)}{ev.location ? `  ·  ${ev.location}` : ''}</p>
                  <h3>{ev.title}</h3>
                  <span className="upcoming-lead-action">Explore event <span aria-hidden="true">↗</span></span>
                </div>
              </Link>
            ))}
            <div className="upcoming-list" aria-label="More upcoming events">
              {featuredEvents.slice(1).map((ev) => (
                <Link key={ev.id} to={`/events/${ev.id}`} className="upcoming-list-card">
                  <div className="upcoming-list-media"><img src={heroFor(ev.id)} alt="" loading="lazy" decoding="async"/><span>{fmtDate(ev.starts_at)}</span></div>
                  <div className="upcoming-list-copy"><h3>{ev.title}</h3><p>{fmtFullDate(ev.starts_at)}</p>{ev.location && <p>{ev.location}</p>}</div>
                  <span className="upcoming-list-arrow" aria-hidden="true">↗</span>
                </Link>
              ))}
              {featuredEvents.length === 1 && <p className="upcoming-list-note">More dates are on the way. Explore all events to see what’s happening.</p>}
            </div>
          </div>
        )}
      </section>

      <section className="browse-section reveal explore-section" id="all-events" aria-labelledby="events-heading">
        <div className="section-heading">
          <div className="explore-heading-copy"><span className="eyebrow">THE EVENT LIST</span><h2 id="events-heading">Find something to do.</h2><p>Search by event or place. Open a listing for the full details and ticket options.</p></div>
          <label className="sort-control">Sort
            <select aria-label="Sort events" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="date">Soonest first</option>
              <option value="name">A-Z</option>
            </select>
          </label>
        </div>

      {isLoading && <p className="muted">Loading events…</p>}
      {error && <p className="muted">Could not load events.</p>}

      {!isLoading && !error && !hasEvents ? (
        <div className="empty-state">
          <span className="eyebrow">No events available</span>
          <h3>{q ? `No events match "${q}".` : 'No published events yet.'}</h3>
          <p>{q ? 'Try another search term.' : 'Create or publish events in the organizer dashboard to make them available for buyers.'}</p>
        </div>
      ) : (
        <div className={`event-grid${events.length === 4 ? ' event-grid-four' : ''}`}>
          {events.map((ev, i) => (
            <Link
              key={ev.id}
              to={`/events/${ev.id}`}
              className="event-card reveal"
              style={{ animationDelay: `${(i % PAGE) * 70}ms` }}
            >
              <div className="event-card-media">
                <img src={heroFor(ev.id)} alt="" loading="lazy" decoding="async" />
                <span className="date-chip">{fmtDate(ev.starts_at)}</span>
              </div>
              <div className="event-card-body">
                <h2 className="event-card-title">{ev.title}</h2>
                <p className="event-meta">{fmtFullDate(ev.starts_at)}{ev.location ? ` · ${ev.location}` : ''}</p>
                <div className="between" style={{ marginTop: 4 }}>
                  <span className="badge ok">Event details</span>
                  <span style={{ color: 'var(--accent)', fontWeight: 800 }}>Get tickets</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {hasNextPage && !q && (
        <div className="load-more-row">
          <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? 'Loading…' : 'Load more events'}
          </button>
        </div>
      )}
      </section>



      <section className="browse-section reveal locations-section" id="venues" aria-labelledby="venues-heading">
        <div className="section-heading">
          <div><span className="eyebrow">VENUES & CITIES</span><h2 id="venues-heading">Pick a place. See what’s on.</h2></div>
          <p className="muted">A few of the places hosting upcoming events.</p>
        </div>
        {locations.length ? <div className="location-grid">
          {locations.map((place) => {
            const event = allEvents.find((item) => item.id === place.eventId);
            return <Link key={place.name} to={event ? '/events/' + event.id : '#all-events'} className="location-card">
              {event && <img src={heroFor(event.id)} alt="" loading="lazy" decoding="async" />}
              <span className="location-card-copy"><span className="location-label">{place.events} {place.events === 1 ? 'event' : 'events'} listed</span><strong>{place.name}</strong><span className="location-explore">See the event <span aria-hidden="true">&nearr;</span></span></span>
            </Link>;
          })}
        </div> : <div className="locations-empty"><h3>New places will appear here.</h3><p>When an organizer publishes an event with a location, you will find it in this list.</p></div>}
      </section>

      <section className="how-section reveal" id="how-it-works" aria-labelledby="how-heading">
        <div className="section-heading journey-heading">
          <div><span className="eyebrow">BOOKING, MADE CLEAR</span><h2 id="how-heading">From choosing a show to walking in.</h2></div>
          <p className="muted">The event page has the information you need before you book. Your tickets and entry QR codes stay together in your account.</p>
        </div>
        <div className="journey-grid">
          {JOURNEY_STEPS.map((step) => (
            <article key={step.number} className="journey-card">
              <span className="journey-number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </article>
          ))}
        </div>
        <div className="journey-note">
          <div><span className="journey-note-label">Your ticket wallet</span><p>See your orders, ticket status, QR codes, and refund request history together.</p></div>
          <Link className="text-link" to="/tickets">View your tickets <span aria-hidden="true">&rarr;</span></Link>
        </div>
      </section>

      <section className="audience-section reveal" id="for-everyone" aria-labelledby="audience-heading">
        <div className="section-heading">
          <div><span className="eyebrow">MADE FOR EVENT DAYS</span><h2 id="audience-heading">For the crowd, the host, and the door.</h2></div>
          <p className="muted">A place to find events, sell tickets, and check guests in.</p>
        </div>
        <div className="audience-grid">
          <article className="audience-card audience-attendee"><span className="audience-index">01 / ATTENDEES</span><h3>Find your seat in the crowd.</h3><p>Check the date, venue, and ticket choices before you book. After payment, find your order and entry QR code under My tickets.</p><a href="#all-events">Browse events <span aria-hidden="true">&rarr;</span></a></article>
          <article className="audience-card audience-host"><span className="audience-index">02 / ORGANIZERS</span><h3>Put your event on sale.</h3><p>Add the event details, set ticket types and quantities, then publish when you are ready. Track sales, refunds, and capacity from your dashboard.</p><Link to="/register">Create an event <span aria-hidden="true">&rarr;</span></Link></article>
          <article className="audience-card audience-team"><span className="audience-index">03 / EVENT STAFF</span><h3>Keep the queue moving.</h3><p>Use the event scanner to check a guest's ticket at the door. Sign in with the staff account assigned to your event.</p><Link to="/login">Staff sign in <span aria-hidden="true">&rarr;</span></Link></article>
        </div>
      </section>

      <section className="organizer-section reveal" id="organizers" aria-labelledby="organizer-heading">
        <div className="organizer-art" aria-hidden="true"><BrandMark className="organizer-brand-mark" /></div>
        <div className="organizer-copy"><span className="eyebrow">FOR ORGANIZERS</span><h2 id="organizer-heading">Your next event, on the calendar.</h2><p>Set the date and venue, describe what guests can expect, and choose your ticket options. Publish when it’s ready, then manage sales and check-ins from your organizer dashboard.</p><Link className="btn organizer-button" to="/register">Start an event <span aria-hidden="true">&rarr;</span></Link></div>
      </section>
    </div>
  );
}
