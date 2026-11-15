import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../lib/api';
import QrCode from '../components/QrCode.jsx';
import { LoadingSkeleton } from '../components/LoadingSkeleton.jsx';

const money = (c) => `$${(c / 100).toFixed(2)}`;

export default function Confirmation() {
  const { id } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => apiGet(`/orders/${id}`),
    refetchInterval: (q) => (['paid', 'failed', 'refunded'].includes(q.state.data?.status) ? false : 1500),
  });
  if (isLoading || !data) return <div className="page"><LoadingSkeleton label="Loading order details" className="loading-skeleton--confirmation"><span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" /></LoadingSkeleton></div>;
  if (data.status === 'failed') {
    return (
      <div className="order-state-page"><section className="panel order-state-card">
        <span className="badge danger">Payment failed</span>
        <h1>Your order could not be completed.</h1>
        <p className="muted">No tickets were issued. Please return to the event and try again.</p>
      </section></div>
    );
  }
  if (data.status === 'refunded') {
    return (
      <div className="order-state-page"><section className="panel order-state-card">
        <span className="badge warn">Refunded</span>
        <h1>This order has been refunded.</h1>
        <p className="muted">Issued tickets for this order are no longer valid for entry.</p>
      </section></div>
    );
  }
  if (data.status !== 'paid') {
    return (
      <div className="order-state-page"><section className="panel order-state-card">
        <span className="badge">Processing</span>
        <h1>Finalizing your order…</h1>
        <p className="muted">Reversing the charge and minting your tickets. This only takes a moment.</p>
      </section></div>
    );
  }

  return (
    <div className="page reveal order-confirmation-page">
      <section className="panel order-confirmation-summary">
        <div className="order-confirmation-copy">
          <div>
            <span className="badge ok">Confirmed</span>
            <h1>You're in.</h1>
            <p className="mono muted">
              ORDER {data.id.slice(0, 8).toUpperCase()} · {money(data.amount_cents)} · {(data.tickets ?? []).length} TICKET(S)
            </p>
          </div>
          <Link to="/tickets" className="btn primary">View in Wallet</Link>
        </div>
      </section>

      <div className="grid-2 order-ticket-grid">
        {(data.tickets ?? []).map((t, i) => (
          <article key={t.id} className="ticket-card card reveal order-ticket-card" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="order-ticket-copy">
              <div>
                <span className="eyebrow">Admit one</span>
                <h2>Zireva</h2>
                <p className="mono muted">{t.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <span className="badge ok">{t.status}</span>
            </div>
            <div className="order-ticket-qr">
              <QrCode value={t.qr_token} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
