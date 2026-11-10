import { Link } from 'react-router-dom';

const POSTER = '/images/events/nicholas-green-nPz8akkUmDI-unsplash.webp';

export default function AuthVisual({ kicker, title, copy, linkLabel, linkTo = '/' }) {
  return (
    <aside className="auth-visual">
      <video className="auth-visual-video" autoPlay muted loop playsInline preload="metadata" poster={POSTER} aria-hidden="true" tabIndex={-1}>
        <source src="/video/herovideobg.mp4" type="video/mp4" />
      </video>
      <span className="auth-visual-shade" aria-hidden="true" />
      <div className="auth-visual-copy">
        <span className="auth-visual-kicker">{kicker}</span>
        <h2>{title}</h2>
        <p>{copy}</p>
        <Link to={linkTo} className="auth-visual-link">{linkLabel}<span aria-hidden="true">→</span></Link>
      </div>
      <span className="auth-visual-mark" aria-hidden="true">Z</span>
    </aside>
  );
}
