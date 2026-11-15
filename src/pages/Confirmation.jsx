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
      <div className="panel reveal" style={{ textAlign: 'center', padding: '54px 24px', maxWidth: 760, margin: '0 auto' }}>
        <span className="badge danger">Payment failed</span>
        <h1 style={{ marginTop: 12 }}>Your order could not be completed.</h1>
        <p className="muted" style={{ marginTop: 10 }}>No tickets were issued. Please return to the event and try again.</p>
      </div>
    );
  }
  if (data.status === 'refunded') {
    return (
      <div className="panel reveal" style={{ textAlign: 'center', padding: '54px 24px', maxWidth: 760, margin: '0 auto' }}>
        <span className="badge warn">Refunded</span>
        <h1 style={{ marginTop: 12 }}>This order has been refunded.</h1>
        <p className="muted" style={{ marginTop: 10 }}>Issued tickets for this order are no longer valid for entry.</p>
      </div>
    );
  }
  if (data.status !== 'paid') {
    return (
      <div className="panel reveal" style={{ textAlign: 'center', padding: '54px 24px', maxWidth: 760, margin: '0 auto' }}>
        <span className="badge">Processing</span>
        <h1 style={{ marginTop: 12 }}>Finalizing your order…</h1>
        <p className="muted" style={{ marginTop: 10 }}>Reversing the charge and minting your tickets. This only takes a moment.</p>
      </div>
    );
  }

  return (
    <div className="page reveal">
      <section className="panel" style={{ padding: 28 }}>
        <div className="between" style={{ alignItems: 'start' }}>
          <div>
            <span className="badge ok">Confirmed</span>
            <h1 style={{ marginTop: 12 }}>You're in.</h1>
            <p className="mono muted" style={{ marginTop: 8, fontSize: '0.86rem' }}>
              ORDER {data.id.slice(0, 8).toUpperCase()} · {money(data.amount_cents)} · {(data.tickets ?? []).length} TICKET(S)
            </p>
          </div>
          <Link to="/tickets" className="btn primary">View in Wallet</Link>
        </div>
      </section>

      <div className="grid-2">
        {(data.tickets ?? []).map((t, i) => (
          <div key={t.id} className="ticket-card card reveal" style={{ animationDelay: `${i * 80}ms` }}>
            <div style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 220 }}>
              <div>
                <span className="eyebrow">Admit one</span>
                <h2 style={{ marginTop: 8 }}>Zireva</h2>
                <p className="mono muted" style={{ marginTop: 8, fontSize: '0.78rem' }}>{t.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <span className="badge ok" style={{ alignSelf: 'flex-start', marginTop: 18 }}>{t.status}</span>
            </div>
            <div style={{ borderLeft: '2px dashed var(--border)', padding: 18, background: '#fff', display: 'flex', alignItems: 'center' }}>
              <QrCode value={t.qr_token} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
