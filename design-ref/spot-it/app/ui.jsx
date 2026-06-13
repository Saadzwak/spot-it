// ui.jsx — Spot.it shared visual language: logo, spot mark, brand tiles, chips, pills.
// Depends on window.Icon, window.CATEGORIES. Exports several components to window.
(function () {
  const { Icon } = window;

  // Entrance flag. Resolves visible immediately so content is never stuck
  // hidden if frame callbacks are throttled; interaction motion uses CSS
  // transitions elsewhere, which animate normally on state change.
  function useRise(dep) {
    return true;
  }
  window.useRise = useRise;

  // ── Signature "spot": a luminous point that pulses, with concentric ripple.
  function SpotMark({ size = 22, color = 'var(--accent)', pulse = true, ripple = true }) {
    return (
      <span style={{ position: 'relative', display: 'inline-flex', width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        {ripple && (
          <span className="spot-ripple" style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: `1.5px solid ${color}`, opacity: 0,
            animation: pulse ? 'spotRipple 2.4s ease-out infinite' : 'none',
          }} />
        )}
        <span style={{
          position: 'absolute', width: size * 0.95, height: size * 0.95, borderRadius: '50%',
          background: color, opacity: 0.18, filter: 'blur(4px)',
          animation: pulse ? 'spotGlow 2.4s ease-in-out infinite' : 'none',
        }} />
        <span style={{
          position: 'relative', width: size * 0.42, height: size * 0.42, borderRadius: '50%',
          background: color, boxShadow: `0 0 ${size * 0.5}px ${color}`,
        }} />
      </span>
    );
  }

  // ── Wordmark: "Spot" · spot · "it"
  function SpotLogo({ size = 22, color = 'var(--ink)', mark = true }) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: size * 0.16,
        fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: size,
        letterSpacing: '-0.02em', color, lineHeight: 1,
      }}>
        <span>Spot</span>
        {mark
          ? <SpotMark size={size * 0.5} />
          : <span style={{ color: 'var(--accent)' }}>.</span>}
        <span>it</span>
      </span>
    );
  }

  // ── Subtle film grain overlay (premium tactility on "photo" tiles)
  const GRAIN = "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(#n)' opacity='0.5'/></svg>`
  );

  // ── Brand "photo" placeholder — duotone editorial tile with wordmark.
  //    (Dev swaps the background for a real product/boutique image.)
  function BrandTile({ offer, rounded = 22, showMark = true, children, style }) {
    const w = offer.wordmark || {};
    const fam = w.serif ? "'Hoefler Text', Georgia, 'Times New Roman', serif" : "var(--font-body)";
    return (
      <div style={{
        position: 'absolute', inset: 0, borderRadius: rounded, overflow: 'hidden',
        background: `linear-gradient(150deg, ${offer.grad[0]} 0%, ${offer.grad[1]} 100%)`,
        ...style,
      }}>
        {/* soft top highlight + bottom vignette to read as a photo */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 80% at 28% 12%, rgba(255,255,255,0.22), transparent 55%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 38%, rgba(0,0,0,0.34) 100%)' }} />
        {/* big watermark "spot" circle motif */}
        {showMark && (
          <div style={{
            position: 'absolute', right: '-14%', top: '-12%', width: '58%', aspectRatio: '1',
            borderRadius: '50%', border: `1.5px solid ${offer.ink}`, opacity: 0.12,
          }} />
        )}
        {/* wordmark */}
        <div style={{
          position: 'absolute', left: 22, bottom: 20, right: 22,
          fontFamily: fam, color: offer.ink,
          fontWeight: w.weight || 500, fontStyle: w.italic ? 'italic' : 'normal',
          fontSize: w.size || 26, letterSpacing: (w.spacing || 2),
          textTransform: w.serif ? 'none' : 'uppercase',
          textShadow: '0 1px 14px rgba(0,0,0,0.25)',
        }}>{w.text || offer.brand}</div>
        {/* grain */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("${GRAIN}")`, mixBlendMode: 'overlay', opacity: 0.5, pointerEvents: 'none' }} />
        {children}
      </div>
    );
  }

  // ── Small circular brand avatar (logo monogram) for list rows & map pins.
  function BrandAvatar({ offer, size = 44, ring = false }) {
    const initials = offer.brand.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: `linear-gradient(150deg, ${offer.grad[0]}, ${offer.grad[1]})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: offer.ink, fontFamily: 'var(--font-display)', fontWeight: 600,
        fontSize: size * 0.34, letterSpacing: '0.02em',
        boxShadow: ring ? '0 0 0 3px var(--surface), 0 6px 16px rgba(23,19,15,0.18)' : 'none',
        position: 'relative', overflow: 'hidden',
      }}>
        <span style={{ position: 'relative', textShadow: '0 1px 6px rgba(0,0,0,0.25)' }}>{initials}</span>
      </div>
    );
  }

  // ── Category chip / dot
  function CatChip({ catId, active = false, onClick }) {
    const cat = window.CATEGORIES[catId];
    if (!cat) return null;
    return (
      <button onClick={onClick} style={{
        display: 'inline-flex', alignItems: 'center', gap: 7, cursor: 'pointer',
        padding: '8px 14px', borderRadius: 999, border: 'none',
        background: active ? cat.hue : cat.tint,
        color: active ? '#fff' : cat.hue,
        fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em',
        transition: 'transform .15s var(--spring), background .2s ease',
      }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: active ? '#fff' : cat.hue }} />
        {cat.label}
      </button>
    );
  }

  function CatDot({ catId, size = 7 }) {
    const cat = window.CATEGORIES[catId];
    return <span style={{ width: size, height: size, borderRadius: '50%', background: cat ? cat.hue : 'var(--ink-3)', flexShrink: 0 }} />;
  }

  // ── Distance pill (walk time)
  function DistancePill({ offer, dark = false }) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '6px 11px 6px 9px', borderRadius: 999,
        background: dark ? 'rgba(255,255,255,0.16)' : 'var(--canvas)',
        color: dark ? '#fff' : 'var(--ink)',
        fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13,
        backdropFilter: dark ? 'blur(8px)' : 'none',
      }}>
        <Icon name="walk" size={14} stroke={dark ? '#fff' : 'var(--ink)'} width={1.6} />
        {offer.distanceLabel} · {offer.walk} min
      </span>
    );
  }

  function Sponsored({ dark = false }) {
    return (
      <span style={{
        padding: '5px 10px', borderRadius: 999,
        background: dark ? 'rgba(0,0,0,0.32)' : 'rgba(23,19,15,0.06)',
        color: dark ? 'rgba(255,255,255,0.92)' : 'var(--ink-2)',
        fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11,
        letterSpacing: '0.04em', textTransform: 'uppercase',
        backdropFilter: dark ? 'blur(8px)' : 'none',
      }}>Sponsorisé</span>
    );
  }

  // ── "Pourquoi pour toi ✨" — the visible AI reasoning
  function WhyForYou({ text, dark = false, compact = false }) {
    const bg = dark ? 'rgba(255,255,255,0.12)' : 'var(--accent-soft)';
    const fg = dark ? '#fff' : 'var(--accent-ink)';
    return (
      <div style={{
        display: 'flex', gap: 9, alignItems: 'flex-start',
        padding: compact ? '10px 12px' : '12px 14px', borderRadius: 14,
        background: bg, backdropFilter: dark ? 'blur(10px)' : 'none',
      }}>
        <span style={{ marginTop: 1, flexShrink: 0 }}>
          <Icon name="sparkle" size={16} stroke={fg} />
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11.5,
            letterSpacing: '0.04em', textTransform: 'uppercase', color: fg, opacity: 0.7, marginBottom: 2,
          }}>Pourquoi pour toi</div>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: compact ? 13 : 14, lineHeight: 1.34, color: fg }}>
            {text}
          </div>
        </div>
      </div>
    );
  }

  Object.assign(window, { SpotMark, SpotLogo, BrandTile, BrandAvatar, CatChip, CatDot, DistancePill, Sponsored, WhyForYou });
})();
