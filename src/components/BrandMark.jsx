export default function BrandMark({ className = '' }) {
  return (
    <span className={`brand-mark ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 48 48" focusable="false">
        <path className="brand-mark-orbit" d="M5 36C14 22 27 11 42 8M8 7c14 4 25 15 33 33" />
        <path className="brand-mark-ray" d="M24 8v32M8 24h32M13 13l22 22M35 13 13 35" />
        <path className="brand-mark-spark" d="m24 16 2.35 5.65L32 24l-5.65 2.35L24 32l-2.35-5.65L16 24l5.65-2.35L24 16Z" />
        <circle cx="24" cy="24" r="1.35" />
      </svg>
    </span>
  );
}
