import { useState, useMemo, useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiGet } from '../lib/api';
import { heroFor } from '../lib/images';
import { EventCardsSkeleton } from '../components/LoadingSkeleton.jsx';

const PAGE = 8;
const EVENT_CATEGORIES = ['Music', 'Social events', 'Business', 'Religious events', 'Technology', 'Community', 'Arts & culture', 'Food & drink'];
const DATE_FILTERS = [
  { value: 'all', label: 'All events' },
  { value: 'today', label: 'Happening today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'online', label: 'Online events' },
];
const JOURNEY_STEPS = [
  { number: '01', title: 'Find the right event', copy: 'Browse published events, search by title or location, and open an event to read its details before you decide.' },
  { number: '02', title: 'Choose your ticket', copy: 'Compare available ticket tiers, prices, and remaining quantities on the event page.' },
  { number: '03', title: 'Reserve and pay', copy: 'Choose how many tickets you need and reserve them at checkout. Your reservation has an expiry, so you can see how much time remains to pay.' },
  { number: '04', title: 'Keep your QR ticket close', copy: 'After successful payment, issued tickets and their QR codes are available from your ticket wallet for event entry.' },
];
const EVENT_NOTES = [
  { tag: 'FOR ORGANIZERS', title: 'Before you publish', copy: 'Have the date, venue, event description, and ticket quantities ready. Guests use these details to decide whether to book.', to: '/register', action: 'Create an event' },
  { tag: 'FOR ATTENDEES', title: 'Keep your ticket close', copy: 'After checkout, open My tickets to see your order and entry QR code. Keep the QR code ready when you reach the door.', to: '/login', action: 'Sign in to your tickets' },
  { tag: 'EVENT DAY', title: 'Check tickets at the door', copy: 'Staff sign in to the scanner workspace and validate each guest ticket as they arrive.', to: '/login', action: 'Staff sign in' },
];
const fmtDate = (s) => (s ? new Date(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Date TBA');
const fmtFullDate = (s) => (s ? new Date(s).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Date TBA');

function CarouselRail({ label, children, className = '' }) {
  const railRef = useRef(null);
  const [scrollState, setScrollState] = useState({ overflow: false, start: true, end: false });
  const updateScrollState = () => {
    const rail = railRef.current;
    if (!rail) return;
    const maxScroll = rail.scrollWidth - rail.clientWidth;
    const nextState = { overflow: maxScroll > 2, start: rail.scrollLeft <= 2, end: rail.scrollLeft >= maxScroll - 2 };
    setScrollState((current) => current.overflow === nextState.overflow && current.start === nextState.start && current.end === nextState.end ? current : nextState);
  };
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return undefined;
    updateScrollState();
    rail.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateScrollState);
    observer?.observe(rail);
    return () => {
      rail.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
      observer?.disconnect();
    };
  }, [children]);
  const scroll = (direction) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * Math.max(rail.clientWidth * 0.82, 260), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  return (
    <div className={`market-carousel ${className}`}>
      {scrollState.overflow && <div className="market-carousel-controls">
        <button type="button" aria-label={`Scroll ${label} left`} disabled={scrollState.start} onClick={() => scroll(-1)}><span aria-hidden="true">‹</span></button>
        <button type="button" aria-label={`Scroll ${label} right`} disabled={scrollState.end} onClick={() => scroll(1)}><span aria-hidden="true">›</span></button>
      </div>}
      <div className="market-carousel-track" ref={railRef} aria-label={label} tabIndex="0">{children}</div>
    </div>
  );
}

function HeroCarousel({ events }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const slides = events.length ? events.slice(0, 4) : [null, null, null];
  useEffect(() => {
    if (slides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(() => setActiveIndex((index) => (index + 1) % slides.length), 7000);
    return () => window.clearInterval(timer);
  }, [slides.length]);
  const currentIndex = activeIndex % slides.length;
  const event = slides[currentIndex];
  const move = (delta) => setActiveIndex((index) => (index + delta + slides.length) % slides.length);
  return (
    <div className="browse-hero-card" aria-roledescription="carousel" aria-label="Featured events">
      <img className="browse-hero-image" src={heroFor(event?.id ?? `hero-${activeIndex}`)} alt="" fetchPriority="high" />
      <div className="browse-hero-shade" />
      <div className="browse-hero-copy" aria-live="polite">
        <span className="hero-slide-tag">{event?.category_name ?? event?.category ?? 'LIVE IN NIGERIA'}</span>
        <h1>{event?.title ?? ['Find a night worth going out for.', 'See what is happening near you.', 'Make plans for the weekend.'][activeIndex]}</h1>
        {event && <p>{fmtFullDate(event.starts_at)}{event.location ? ` · ${event.location}` : ''}</p>}
        <Link to={event ? `/events/${event.id}` : '#all-events'} className="hero-slide-action">{event ? 'View event' : 'Browse events'} <span aria-hidden="true">→</span></Link>
      </div>
      <div className="browse-hero-controls">
        <button type="button" aria-label="Previous featured event" onClick={() => move(-1)}>‹</button>
        <div className="browse-hero-dots" role="group" aria-label="Choose featured event">
          {slides.map((slide, index) => <button key={slide?.id ?? `slide-${index}`} type="button" aria-label={`Show featured slide ${index + 1}`} aria-current={index === currentIndex ? 'true' : undefined} onClick={() => setActiveIndex(index)} />)}
        </div>
        <button type="button" aria-label="Next featured event" onClick={() => move(1)}>›</button>
      </div>
    </div>
  );
}

function EventCard({ event }) {
  const category = event.category_name ?? event.category ?? 'UPCOMING';
  return (
    <Link to={`/events/${event.id}`} className="market-event-card">
      <div className="market-event-image">
        <img src={heroFor(event.id)} alt="" loading="lazy" decoding="async" />
        <span className="market-event-category">{category}</span>
        <span className="market-event-date">{fmtDate(event.starts_at)}</span>
      </div>
      <div className="market-event-copy">
        <h3>{event.title}</h3>
        <p>{fmtFullDate(event.starts_at)}{event.location ? ` · ${event.location}` : ''}</p>
        <span className="market-event-action">Book tickets <span aria-hidden="true">→</span></span>
      </div>
    </Link>
  );
}

export default function Browse() {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('date');
  const [dateFilter, setDateFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['events'],
    queryFn: ({ pageParam }) => apiGet(`/events?page=${pageParam}&pageSize=${PAGE}`),
    initialPageParam: 1,
    getNextPageParam: (last, all) => (last.length === PAGE ? all.length + 1 : undefined),
  });

  const events = useMemo(() => {
    const all = (data?.pages ?? []).flat();
    const needle = q.trim().toLowerCase();
    const matchingQuery = needle
      ? all.filter((e) => `${e.title} ${e.location ?? ''} ${e.description ?? ''} ${e.category ?? e.category_name ?? ''}`.toLowerCase().includes(needle))
      : all;
    const matchingCategory = categoryFilter
      ? matchingQuery.filter((e) => {
        const category = `${e.category ?? ''} ${e.category_name ?? ''} ${e.category_slug ?? ''}`.toLowerCase();
        const searchable = `${e.title} ${e.location ?? ''} ${e.description ?? ''}`.toLowerCase();
        return category.includes(categoryFilter.toLowerCase()) || searchable.includes(categoryFilter.toLowerCase());
      })
      : matchingQuery;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const tomorrowStart = todayStart + 24 * 60 * 60 * 1000;
    const weekEnd = todayStart + 7 * 24 * 60 * 60 * 1000;
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
    const matchingDate = dateFilter === 'all' ? matchingCategory : matchingCategory.filter((event) => {
      if (dateFilter === 'online') return Boolean(event.is_online ?? event.isOnline ?? event.online_url ?? event.meeting_url);
      const startsAt = Date.parse(event.starts_at);
      if (Number.isNaN(startsAt) || startsAt < todayStart) return false;
      if (dateFilter === 'today') return startsAt < tomorrowStart;
      if (dateFilter === 'week') return startsAt < weekEnd;
      return startsAt < monthEnd;
    });
    return [...matchingDate].sort((a, b) => {
      if (sort === 'name') return a.title.localeCompare(b.title);
      return (a.starts_at || '9999').localeCompare(b.starts_at || '9999'); // date asc, undated last
    });
  }, [data, q, sort, dateFilter, categoryFilter]);

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
    return [...grouped.values()].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 8);
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
      <section className="market-intro" id="top" aria-label="Event discovery">
        <HeroCarousel events={featuredEvents} />
        <div className="market-search-area">
          <form className="market-search" role="search" onSubmit={(e) => {
            e.preventDefault();
            const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            document.getElementById('all-events')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
          }}>
            <svg className="market-search-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
            <input id="event-search" aria-label="Search events" placeholder="What are you looking for?" value={q} onChange={(e) => setQ(e.target.value)} />
            {q && <button type="button" className="market-search-clear" onClick={() => setQ('')}>Clear</button>}
            <button type="submit" className="market-search-submit">Search events</button>
          </form>
          <div className="market-quick-links" aria-label="Quick event filters">
            {DATE_FILTERS.map((filter) => <button key={filter.value} type="button" className={dateFilter === filter.value ? 'active' : ''} aria-pressed={dateFilter === filter.value} onClick={() => { setDateFilter(filter.value); document.getElementById('all-events')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>{filter.label}</button>)}
          </div>
        </div>
      </section>

      <section className="browse-section reveal upcoming-section" id="events" aria-labelledby="featured-heading">
        <div className="section-heading upcoming-heading">
          <div>
            <span className="eyebrow">DISCOVER EVENTS IN NAIJA</span>
            <h2 id="featured-heading">Find your next event.</h2>
          </div>
          <a className="section-text-link" href="#all-events">Explore every event <span aria-hidden="true">→</span></a>
        </div>

        {error ? (
          <div className="empty-state compact"><span className="eyebrow">Events unavailable</span><h3>Upcoming events could not load.</h3><p>Check the API connection and try again.</p></div>
        ) : isLoading ? (
          <div className="market-carousel-skeleton" aria-hidden="true"><i /><i /><i /></div>
        ) : !hasFeatured ? (
          <div className="empty-state compact"><span className="eyebrow">Coming soon</span><h3>No upcoming events yet.</h3><p>New dates will appear here as organizers publish them.</p></div>
        ) : (
          <CarouselRail label="Upcoming events" className="event-carousel">
            {featuredEvents.map((event) => <EventCard key={event.id} event={event} />)}
          </CarouselRail>
        )}
      </section>

      <section className="browse-section reveal locations-section" id="venues" aria-labelledby="venues-heading">
        <div className="section-heading">
          <div><span className="eyebrow">VENUES & CITIES</span><h2 id="venues-heading">Pick a place. See what’s on.</h2><p className="muted">Browse venues attached to events currently on the calendar.</p></div>
        </div>
        {locations.length ? <CarouselRail label="Event places" className="location-carousel">
          {locations.map((place) => {
            const event = allEvents.find((item) => item.id === place.eventId);
            return <Link key={place.name} to={event ? '/events/' + event.id : '#all-events'} className="location-card">
              {event && <img src={heroFor(event.id)} alt="" loading="lazy" decoding="async" />}
              <span className="location-card-copy"><span className="location-label">{place.events} {place.events === 1 ? 'event' : 'events'} listed</span><strong>{place.name}</strong><span className="location-explore">See the event <span aria-hidden="true">&nearr;</span></span></span>
            </Link>;
          })}
        </CarouselRail> : <div className="locations-empty"><h3>New places will appear here.</h3><p>When an organizer publishes an event with a location, you will find it in this list.</p></div>}
      </section>

      <section className="browse-section reveal explore-section" id="all-events" aria-labelledby="events-heading">
        <div className="section-heading">
          <div className="explore-heading-copy"><span className="eyebrow">ALL LISTINGS</span><h2 id="events-heading">More events to explore.</h2><p>Search by event or venue, then open a listing to see dates and ticket options.</p></div>
          <label className="sort-control">Sort
            <select aria-label="Sort events" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="date">Soonest first</option>
              <option value="name">A-Z</option>
            </select>
          </label>
        </div>

        {categoryFilter && <button type="button" className="browse-filter-reset" onClick={() => setCategoryFilter('')}>Clear {categoryFilter} filter</button>}

      {isLoading && <EventCardsSkeleton count={3} />}
      {error && <p className="muted">Could not load events.</p>}

      {!isLoading && !error && !hasEvents ? (
        <div className="empty-state">
          <span className="eyebrow">Nothing found</span>
          <h3>{q ? `No events match "${q}".` : categoryFilter ? `No ${categoryFilter.toLowerCase()} events in this list yet.` : dateFilter !== 'all' ? 'No events in this date range.' : 'No published events yet.'}</h3>
          <p>{q || categoryFilter || dateFilter !== 'all' ? 'Clear a filter or try another search.' : 'Published events will appear here.'}</p>
        </div>
      ) : isLoading || error ? null : (
        <CarouselRail label="All events" className="event-carousel browse-event-carousel">
          {events.map((event) => <EventCard key={event.id} event={event} />)}
        </CarouselRail>
      )}

      {hasNextPage && !q && (
        <div className="load-more-row">
          <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? 'Loading…' : 'Load more events'}
          </button>
        </div>
      )}
      </section>

      <section className="how-section reveal" id="how-it-works" aria-labelledby="how-heading">
        <div className="section-heading journey-heading">
          <div><span className="eyebrow">BOOKING & ENTRY</span><h2 id="how-heading">From choosing a show to walking in.</h2><p className="muted">Review the event, choose a ticket, and pay at checkout. Your order and entry QR code are saved under My tickets.</p></div>
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
          <div><span className="eyebrow">THREE SIDES OF EVERY EVENT</span><h2 id="audience-heading">For the crowd, the host, and the door.</h2><p className="muted">Find tickets, run an event, or check guests in.</p></div>
        </div>
        <div className="audience-grid">
          <article className="audience-card audience-attendee"><span className="audience-index">01 / ATTENDEES</span><h3>Find your seat in the crowd.</h3><p>Check the date, venue, and ticket choices before you book. After payment, find your order and entry QR code under My tickets.</p><a href="#all-events">Browse events <span aria-hidden="true">&rarr;</span></a></article>
          <article className="audience-card audience-host"><span className="audience-index">02 / ORGANIZERS</span><h3>Put your event on sale.</h3><p>Add the event details, set ticket types and quantities, then publish when you are ready. Track sales, refunds, and capacity from your dashboard.</p><Link to="/register">Create an event <span aria-hidden="true">&rarr;</span></Link></article>
          <article className="audience-card audience-team"><span className="audience-index">03 / EVENT STAFF</span><h3>Keep the queue moving.</h3><p>Use the event scanner to check a guest's ticket at the door. Sign in with the staff account assigned to your event.</p><Link to="/login">Staff sign in <span aria-hidden="true">&rarr;</span></Link></article>
        </div>
      </section>

      <section className="browse-section category-section" id="categories" aria-labelledby="category-heading">
        <div className="section-heading category-heading">
          <div><span className="eyebrow">BROWSE BY CATEGORY</span><h2 id="category-heading">What are you in the mood for?</h2></div>
          <p className="muted">Choose a category to narrow the event list.</p>
        </div>
        <CarouselRail label="Event categories" className="category-carousel">
          {EVENT_CATEGORIES.map((category, index) => (
            <button key={category} type="button" className={`category-card${categoryFilter === category ? ' active' : ''}`} aria-pressed={categoryFilter === category} onClick={() => {
              setCategoryFilter(categoryFilter === category ? '' : category);
              document.getElementById('all-events')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
            }}>
              <img src={heroFor(`category-${index}`)} alt="" loading="lazy" decoding="async" />
              <span>{category}<small>Explore</small></span>
            </button>
          ))}
        </CarouselRail>
      </section>

      <section className="browse-section event-notes-section" id="event-guides" aria-labelledby="event-notes-heading">
        <div className="section-heading">
          <div><span className="eyebrow">A FEW THINGS TO KNOW</span><h2 id="event-notes-heading">Before the event day.</h2></div>
        </div>
        <CarouselRail label="Event guides" className="notes-carousel">
          {EVENT_NOTES.map((note, index) => (
            <article className="event-note-card" key={note.title}>
              <img src={heroFor(`note-${index}`)} alt="" loading="lazy" decoding="async" />
              <div className="event-note-copy"><span className="event-note-tag">{note.tag}</span><h3>{note.title}</h3><p>{note.copy}</p><Link to={note.to}>{note.action} <span aria-hidden="true">→</span></Link></div>
            </article>
          ))}
        </CarouselRail>
      </section>

      <section className="organizer-section reveal" id="organizers" aria-labelledby="organizer-heading">
        <div className="organizer-copy"><span className="eyebrow">FOR ORGANIZERS</span><h2 id="organizer-heading">Your next event, on the calendar.</h2><p>Set the date and venue, describe what guests can expect, and choose your ticket options. Publish when it’s ready, then manage sales and check-ins from your organizer dashboard.</p><Link className="btn organizer-button" to="/register">Start an event <span aria-hidden="true">&rarr;</span></Link></div>
      </section>
    </div>
  );
}
