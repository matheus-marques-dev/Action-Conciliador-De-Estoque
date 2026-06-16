// Stable particle grid using golden-angle distribution
// Negative delays start each particle mid-animation for instant visual density
const DRIFTS = ["drift-a", "drift-b", "drift-c", "drift-d", "drift-e"];
const SIZES  = [1, 1.5, 2, 1, 2.5, 1.5, 3, 1, 2, 1.5];
const OPACITIES = [0.12, 0.20, 0.15, 0.25, 0.10, 0.18, 0.14, 0.22, 0.16, 0.11];

const particles = Array.from({ length: 35 }, (_, i) => ({
  x:        ((i * 137.508) % 100).toFixed(2),
  y:        ((i * 97.31)   % 100).toFixed(2),
  size:     SIZES[i % SIZES.length],
  drift:    DRIFTS[i % DRIFTS.length],
  duration: 7 + (i % 8),
  delay:    -(i * 1.05 % 9),
  opacity:  OPACITIES[i % OPACITIES.length],
}));

export default function Particles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left:      `${p.x}%`,
            top:       `${p.y}%`,
            width:     p.size,
            height:    p.size,
            opacity:   p.opacity,
            animation: `${p.drift} ${p.duration}s ${p.delay}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}
