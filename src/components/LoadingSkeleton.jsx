const widths = ['72%', '48%', '86%', '61%'];

function Bar({ width = '100%', className = '' }) {
  return <span className={`loading-skeleton__bar ${className}`} style={{ '--skeleton-width': width }} aria-hidden="true" />;
}

export function LoadingSkeleton({ label = 'Loading content', className = '', children }) {
  return <div className={`loading-skeleton ${className}`} role="status" aria-label={label}>{children}</div>;
}

export function EventCardsSkeleton({ count = 3 }) {
  return <LoadingSkeleton label="Loading events" className="loading-skeleton--cards">
    {Array.from({ length: count }, (_, index) => <article className="loading-skeleton__event" key={index} aria-hidden="true">
      <Bar className="loading-skeleton__image" />
      <div className="loading-skeleton__event-copy"><Bar width="38%" /><Bar width={widths[index % widths.length]} /><Bar width="62%" /><Bar width="28%" /></div>
    </article>)}
  </LoadingSkeleton>;
}

export function RowsSkeleton({ count = 3, label = 'Loading records' }) {
  return <LoadingSkeleton label={label} className="loading-skeleton--rows">
    {Array.from({ length: count }, (_, index) => <div className="loading-skeleton__row" key={index} aria-hidden="true">
      <span className="loading-skeleton__avatar" /><span className="loading-skeleton__row-copy"><Bar width={widths[index % widths.length]} /><Bar width="42%" /></span><Bar width="76px" />
    </div>)}
  </LoadingSkeleton>;
}

export function TicketWalletSkeleton() {
  return <LoadingSkeleton label="Loading your ticket wallet" className="loading-skeleton--wallet">
    <div className="loading-skeleton__wallet-heading"><Bar width="24%" /><Bar width="42%" /></div>
    {[0, 1].map((group) => <section className="loading-skeleton__wallet-group" key={group} aria-hidden="true">
      <Bar width="22%" />
      {[0, 1].map((ticket) => <div className="loading-skeleton__ticket" key={ticket}><Bar className="loading-skeleton__ticket-image" /><div><Bar width="72%" /><Bar width="42%" /><Bar width="58%" /></div></div>)}
    </section>)}
  </LoadingSkeleton>;
}

export function SummarySkeleton({ count = 3 }) {
  return <LoadingSkeleton label="Loading summary" className="loading-skeleton--summary">
    {Array.from({ length: count }, (_, index) => <div className="loading-skeleton__summary-card" key={index} aria-hidden="true"><Bar width="45%" /><Bar width="30%" className="loading-skeleton__summary-value" /><Bar width="68%" /></div>)}
  </LoadingSkeleton>;
}
