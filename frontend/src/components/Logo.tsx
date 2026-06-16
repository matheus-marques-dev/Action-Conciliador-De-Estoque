interface Props {
  size?: number;
  className?: string;
  id?: string;
}

export default function Logo({ size = 44, className = "", id = "a" }: Props) {
  const bg   = `act-bg-${id}`;
  const gl   = `act-gl-${id}`;
  const sh   = `act-sh-${id}`;
  const dot  = `act-dot-${id}`;
  const blur = `act-blur-${id}`;

  // Filled A with evenodd void:
  //   Outer: apex(24,8) → right outer(40,41) → right inner(32,41)
  //          → crossbar-right(30,32) → crossbar-left(18,32)
  //          → left inner(16,41) → left outer(8,41) → close
  //   Void:  upward triangle (24,13)→(19,28)→(29,28)
  //          Negative space reads as an upward arrow ▲
  const A =
    "M 24,8 L 40,41 L 32,41 L 30,32 L 18,32 L 16,41 L 8,41 Z " +
    "M 24,13 L 19,28 L 29,28 Z";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Background: matches site hero slate-950→indigo-950→violet-950 */}
        <linearGradient id={bg} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#0f0c29" />
          <stop offset="52%"  stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#2e1065" />
        </linearGradient>

        {/* Indigo gloss — top-left light source */}
        <radialGradient id={gl} cx="30%" cy="24%" r="56%" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="#a5b4fc" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#a5b4fc" stopOpacity="0" />
        </radialGradient>

        {/* Depth shadow — bottom-right */}
        <radialGradient id={sh} cx="74%" cy="78%" r="54%" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="#000" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>

        {/* Beacon dot: white core → soft indigo halo */}
        <radialGradient id={dot} cx="40%" cy="35%" r="65%" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="white"   stopOpacity="1" />
          <stop offset="70%"  stopColor="#e0e7ff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
        </radialGradient>

        {/* Gaussian blur for the indigo glow layer */}
        <filter id={blur} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      {/* ── Background ── */}
      <rect width="48" height="48" rx="13" fill={`url(#${bg})`} />
      <rect width="48" height="48" rx="13" fill={`url(#${gl})`} />
      <rect width="48" height="48" rx="13" fill={`url(#${sh})`} />

      {/* Subtle inner rim */}
      <rect
        x="0.75" y="0.75" width="46.5" height="46.5" rx="12.5"
        stroke="white" strokeOpacity="0.10" strokeWidth="1"
      />

      {/* ── Glow layer: blurred indigo A behind the white A ── */}
      <path
        fillRule="evenodd" d={A}
        fill="#818cf8" opacity="0.55" filter={`url(#${blur})`}
      />

      {/* ── Sharp layer: crisp white A ── */}
      <path fillRule="evenodd" d={A} fill="white" />

      {/* ── Beacon dot — floats just above the apex ── */}
      <circle cx="24" cy="6.5" r="4.5" fill={`url(#${dot})`} />
      <circle cx="24" cy="6.5" r="2.2" fill="white" />
    </svg>
  );
}
