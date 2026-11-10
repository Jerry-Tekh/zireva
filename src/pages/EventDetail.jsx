import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../lib/api';
import { messageFor } from '../lib/errors';
import { heroFor } from '../lib/images';
import Checkout from '../features/checkout/Checkout.jsx';

const money = (cents) => `$${(Number(cents ?? 0) / 100).toFixed(2)}`;

function dateParts(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return {
    date: date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
    time: date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
  };
}

function saleState(category, now) {
  if (category.available_quantity <= 0) return { label: 'Sold out', unavailable: true };
  const opensAt = Date.parse(category.sales_open_at);
  if (Number.isFinite(opensAt) && opensAt > now) {
    return { label: `Sales open ${new Date(opensAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`, unavailable: true };
  }
  const closesAt = Date.parse(category.sales_close_at);
  if (Number.isFinite(closesAt) && closesAt <= now) return { label: 'Sales closed', unavailable: true };
  return { label: 'Available', unavailable: false };
}

function priceRange(categories) {
  const prices = categories.map((category) => Number(category.price_cents)).filter(Number.isFinite);
  if (!prices.length) return 'Price not listed';
  const lowest = Math.min(...prices);
  const highest = Math.max(...prices);
  return lowest === highest ? money(lowest) : `${money(lowest)} – ${money(highest)}`;
}

export default function EventDetail() {
  const { id } = useParams();
  const [activeCat, setActiveCat] = useState(null);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['event', id],
    queryFn: () => apiGet(`/events/${id}`),
  });

  if (isLoading) {
    return (
      <div className="event-detail-loading" role="status" aria-label="Loading event details">
        <div className="event-loading-hero" />
        <div className="event-loading-columns"><i /><i /></div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="event-detail-state" role="alert">
        <span className="eyebrow">Event details unavailable</span>
        <h1>We couldn’t load this event.</h1>
        <p>{isError ? messageFor(error) : 'This listing may have been removed or is no longer available.'} You can retry or return to the event list.</p>
        <div className="event-state-actions">
          <button type="button" className="primary" onClick={() => refetch()}>Try again</button>
          <Link to="/#all-events" className="btn">Browse events</Link>
        </div>
      </div>
    );
  }

  const categories = data.categories ?? [];
  const starts = dateParts(data.starts_at);
  const now = Date.now();
  const availableCount = categories.filter((category) => !saleState(category, now).unavailable).length;
  const allSoldOut = categories.length > 0 && categories.every((category) => category.available_quantity <= 0);
  const lowestPrice = priceRange(categories);

  function scrollToTickets() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('ticket-options')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  }

  return (
    <div className="event-detail-page">
      <Link to="/#all-events" className="event-back-link"><span aria-hidden="true">←</span> All events</Link>

      <section className="event-detail-hero" aria-labelledby="event-title">
        <img src={heroFor(data.id)} alt="" className="event-detail-image" />
        <span className="event-detail-shade" aria-hidden="true" />
        <div className="event-detail-hero-copy">
          <span className="event-hero-label">Event details</span>
          <h1 id="event-title">{data.title}</h1>
          <div className="event-hero-meta">
            <span>{starts ? `${starts.date} · ${starts.time}` : 'Date to be announced'}</span>
            {data.location && <><span className="event-meta-separator" aria-hidden="true">/</span><span>{data.location}</span></>}
          </div>
          <button type="button" className="event-hero-cta" onClick={scrollToTickets} disabled={!categories.length || allSoldOut}>
            {!categories.length ? 'Tickets not listed yet' : allSoldOut ? 'Tickets sold out' : 'Choose a ticket'}
            {!allSoldOut && categories.length > 0 && <span aria-hidden="true">↓</span>}
          </button>
        </div>
      </section>

      <section className="event-facts" aria-label="Event summary">
        <div className="event-fact"><span>Date &amp; time</span><strong>{starts ? `${starts.date} · ${starts.time}` : 'To be announced'}</strong><small>Shown in your local time</small></div>
        <div className="event-fact"><span>Location</span><strong>{data.location || 'To be announced'}</strong><small>See the event listing for venue details</small></div>
        <div className="event-fact"><span>Ticket options</span><strong>{categories.length ? `${categories.length} ${categories.length === 1 ? 'option' : 'options'}` : 'Not listed yet'}</strong><small>{allSoldOut ? 'All listed options are sold out' : `${availableCount} currently available`}</small></div>
        <div className="event-fact"><span>Price</span><strong>{lowestPrice}</strong><small>{categories.length ? 'Based on listed ticket options' : 'Pricing has not been added'}</small></div>
      </section>

      <div className="event-detail-content">
        <div className="event-detail-main">
          <section className="event-about" aria-labelledby="event-about-title">
            <span className="eyebrow">About this event</span>
            <h2 id="event-about-title">What the organizer shared.</h2>
            {data.description?.trim()
              ? <p className="event-description">{data.description}</p>
              : <p className="event-description event-description-empty">The organizer hasn’t added a description yet. Check the date, location, and ticket options on this page, and return for more information when it becomes available.</p>}
          </section>

          <section className="event-how" aria-labelledby="event-how-title">
            <span className="eyebrow">Your booking, step by step</span>
            <h2 id="event-how-title">Know what happens next.</h2>
            <ol className="event-steps">
              <li><span>01</span><div><h3>Choose an option</h3><p>Review the ticket name, price, and current availability before selecting how many you want.</p></div></li>
              <li><span>02</span><div><h3>Reserve and pay</h3><p>Enter your email and ticket quantity to place a temporary hold. The checkout shows when that hold expires and lets you cancel it.</p></div></li>
              <li><span>03</span><div><h3>Open your QR ticket</h3><p>After payment is confirmed, your order page displays your issued QR ticket. Signed-in buyers can also return to their ticket wallet.</p></div></li>
            </ol>
          </section>

          <aside className="event-refund-note">
            <span className="event-refund-icon" aria-hidden="true">↺</span>
            <div><h3>Need to request a refund?</h3><p>Paid orders can submit a refund request from the ticket wallet. You can see its status there while it is reviewed.</p></div>
            <Link to="/login">Sign in <span aria-hidden="true">→</span></Link>
          </aside>
        </div>

        <aside className="event-ticket-panel" id="ticket-options" aria-labelledby="ticket-options-title">
          <div className="event-ticket-heading">
            <div><span className="eyebrow">Ticket options</span><h2 id="ticket-options-title">Choose your access.</h2></div>
            <p>Prices and availability are shown for each option. Select a ticket to continue to checkout.</p>
          </div>

          {categories.length ? (
            <div className="event-ticket-list">
              {categories.map((category) => {
                const state = saleState(category, now);
                const opensAt = dateParts(category.sales_open_at);
                const closesAt = dateParts(category.sales_close_at);
                return (
                  <article className={`event-ticket-option${state.unavailable ? ' is-unavailable' : ''}`} key={category.id}>
                    <div className="event-ticket-option-top">
                      <div><h3>{category.name}</h3><span className={`event-ticket-state${state.unavailable ? ' is-muted' : ''}`}>{state.label}</span></div>
                      <strong className="event-ticket-price">{money(category.price_cents)}</strong>
                    </div>
                    <dl className="event-ticket-meta">
                      <div><dt>Remaining</dt><dd>{category.available_quantity ?? 'Not provided'}</dd></div>
                      {category.max_per_customer != null && Number.isFinite(Number(category.max_per_customer)) && <div><dt>Per order limit</dt><dd>{category.max_per_customer}</dd></div>}
                      {opensAt && <div><dt>Sales open</dt><dd>{opensAt.date} · {opensAt.time}</dd></div>}
                      {closesAt && <div><dt>Sales close</dt><dd>{closesAt.date} · {closesAt.time}</dd></div>}
                    </dl>
                    <button type="button" className="event-ticket-button" disabled={state.unavailable} onClick={() => setActiveCat(category)}>
                      {state.unavailable ? state.label : 'Select this ticket'}
                      {!state.unavailable && <span aria-hidden="true">→</span>}
                    </button>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="event-no-tickets"><span aria-hidden="true">＋</span><h3>Ticket options are on the way.</h3><p>The organizer hasn’t added ticket categories to this listing yet. Check back later for prices and availability.</p></div>
          )}

          <p className="event-ticket-footnote">Your reservation is temporary. Complete payment before its countdown ends to continue.</p>
        </aside>
      </div>

      {categories.length > 0 && (
        <div className="event-mobile-ticket-bar">
          <div><span>Tickets from</span><strong>{lowestPrice}</strong></div>
          <button type="button" onClick={scrollToTickets} disabled={allSoldOut}>{allSoldOut ? 'Sold out' : 'View tickets'}</button>
        </div>
      )}

      {activeCat && <Checkout category={activeCat} onClose={() => setActiveCat(null)} />}
    </div>
  );
}
