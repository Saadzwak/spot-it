// screen-map.jsx — the MAP pillar. Custom Spot.it map (NOT a navigation look).
// Offer-first bubbles, proximity ring, pulsing spot, nearby sheet. Exposes window.MapScreen
(function () {
  const { Icon, BrandAvatar, SpotMark, CATEGORIES, DistancePill } = window;
  const { useState, useRef } = React;

  // Map palettes — cream/sand light, elegant dark.
  const PAL = {
    light: { land: '#ECE6DB', block: '#E4DDD0', blockHi: '#E9E3D7', water: '#D9E4E1', road: '#FBF8F2', roadMinor: '#E0D8CB', green: '#DDE2CE', stroke: 'rgba(23,19,15,0.05)' },
    dark:  { land: '#1C1915', block: '#252019', blockHi: '#2B261E', water: '#16201E', road: '#37322A', roadMinor: '#262119', green: '#212413', stroke: 'rgba(255,255,255,0.04)' },
  };

  // ── The stylised map artwork (offer-centric, labels hidden, minor roads thinned)
  function MapArt({ p }) {
    return (
      <svg viewBox="0 0 520 760" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ display: 'block' }}>
        <rect x="-40" y="-40" width="600" height="840" fill={p.land} />
        {/* river Seine — faintly tinted water, soft curve */}
        <path d="M-40 600 C 120 560, 180 700, 320 660 C 420 632, 470 700, 560 680 L560 840 L-40 840 Z" fill={p.water} />
        <path d="M-40 600 C 120 560, 180 700, 320 660 C 420 632, 470 700, 560 680" fill="none" stroke={p.stroke} strokeWidth="1.5" />
        {/* park / green */}
        <rect x="40" y="90" width="150" height="120" rx="16" fill={p.green} />
        <rect x="350" y="430" width="140" height="110" rx="16" fill={p.green} />
        {/* city blocks (subtle filled rectangles) */}
        {BLOCKS.map((b, i) => (
          <rect key={i} x={b[0]} y={b[1]} width={b[2]} height={b[3]} rx="7"
                fill={i % 3 === 0 ? p.blockHi : p.block} stroke={p.stroke} strokeWidth="1" />
        ))}
        {/* major avenues (wide, cream) */}
        <g stroke={p.road} strokeLinecap="round" fill="none">
          <path d="M-20 250 L540 210" strokeWidth="16" />
          <path d="M250 -20 L300 560" strokeWidth="15" />
          <path d="M-20 430 L540 470" strokeWidth="14" />
          <path d="M60 -20 L470 600" strokeWidth="13" />
        </g>
        {/* étoile-like roundabout */}
        <circle cx="300" cy="250" r="34" fill="none" stroke={p.road} strokeWidth="13" />
        <circle cx="300" cy="250" r="34" fill={p.land} />
        {/* minor streets (thin) */}
        <g stroke={p.roadMinor} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.9">
          <path d="M-20 150 L540 130" />
          <path d="M-20 340 L540 360" />
          <path d="M120 -20 L150 560" />
          <path d="M400 -20 L430 560" />
          <path d="M-20 520 L300 540" />
        </g>
      </svg>
    );
  }

  const BLOCKS = [
    [40,230,80,70],[130,235,70,80],[330,150,80,70],[420,150,70,80],
    [60,360,90,80],[170,370,80,70],[330,300,80,90],[60,460,80,70],
    [200,470,90,70],[330,560,80,60],[430,540,70,70],[200,150,60,60],
  ];

  function MapScreen({ offers, filter, setFilter, onOpenDetail, dark, notif }) {
    const p = dark ? PAL.dark : PAL.light;
    const [sel, setSel] = useState(null);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [sheet, setSheet] = useState('half'); // 'half' | 'full' | 'peek'
    const startRef = useRef(null);

    const shown = filter === 'all' ? offers : offers.filter(o => o.category === filter);
    const recenter = () => { setPan({ x: 0, y: 0 }); setSel(null); };

    // gentle map pan
    const md = (e) => { startRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }; };
    const mm = (e) => {
      if (!startRef.current) return;
      const nx = Math.max(-70, Math.min(70, e.clientX - startRef.current.x));
      const ny = Math.max(-70, Math.min(70, e.clientY - startRef.current.y));
      setPan({ x: nx, y: ny });
    };
    const mu = () => { startRef.current = null; };

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: p.land }}>
        {/* MAP LAYER (pannable) */}
        <div onPointerDown={md} onPointerMove={mm} onPointerUp={mu} onPointerCancel={mu}
          style={{ position: 'absolute', inset: -30, transform: `translate(${pan.x}px, ${pan.y}px)`, transition: startRef.current ? 'none' : 'transform .5s var(--spring)', touchAction: 'none' }}>
          <MapArt p={p} />

          {/* proximity ring (~400 m) around my position */}
          <div style={{ position: 'absolute', left: '50%', top: '46%', width: 230, height: 230, transform: 'translate(-50%,-50%)' }}>
            <div className="prox-ring" style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(249,83,46,0.12), rgba(249,83,46,0.04) 60%, transparent 72%)',
              border: '1.5px dashed rgba(249,83,46,0.45)',
            }} />
            <span style={{
              position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
              padding: '4px 10px', borderRadius: 999, background: 'var(--accent)', color: '#fff',
              fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(249,83,46,0.4)',
            }}>5 min à pied</span>
          </div>

          {/* my position — signature spot */}
          <div style={{ position: 'absolute', left: '50%', top: '46%', transform: 'translate(-50%,-50%)' }}>
            <SpotMark size={26} />
          </div>

          {/* offer bubbles */}
          {offers.map(o => {
            const visible = filter === 'all' || o.category === filter;
            const active = sel === o.id;
            const cat = CATEGORIES[o.category];
            return (
              <div key={o.id} onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setSel(active ? null : o.id)}
                style={{
                  position: 'absolute', left: `${o.x * 100}%`, top: `${o.y * 100}%`,
                  transform: `translate(-50%,-110%) scale(${active ? 1.08 : 1})`,
                  transition: 'transform .3s var(--spring), opacity .3s ease',
                  opacity: visible ? 1 : 0.18, zIndex: active ? 30 : 10, cursor: 'pointer',
                }}>
                {/* callout */}
                {active && (
                  <div onClick={(e) => { e.stopPropagation(); onOpenDetail(o); }} style={{
                    position: 'absolute', bottom: '125%', left: '50%', transform: 'translateX(-50%)',
                    width: 180, padding: 10, borderRadius: 16, background: 'var(--surface)',
                    boxShadow: 'var(--shadow-card)', display: 'flex', gap: 10, alignItems: 'center',
                  }}>
                    <BrandAvatar offer={o} size={40} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.brand}</div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 11.5, color: cat.hue, fontWeight: 600 }}>{o.teaser} · {o.distanceLabel}</div>
                    </div>
                  </div>
                )}
                {/* halo + bubble */}
                <span style={{ position: 'relative', display: 'block' }}>
                  {active && <span style={{ position: 'absolute', inset: -6, borderRadius: '50%', background: cat.hue, opacity: 0.25, filter: 'blur(6px)' }} />}
                  <span style={{ display: 'block', position: 'relative', borderRadius: '50%', boxShadow: `0 0 0 3px var(--surface), 0 6px 16px rgba(23,19,15,0.22)` }}>
                    <BrandAvatar offer={o} size={active ? 50 : 42} />
                    {o.sponsored && <span style={{ position: 'absolute', top: -2, right: -2, width: 14, height: 14, borderRadius: '50%', background: 'var(--accent)', border: '2px solid var(--surface)' }} />}
                  </span>
                  {/* pin tail */}
                  <span style={{ position: 'absolute', left: '50%', bottom: -7, width: 12, height: 12, background: 'var(--surface)', transform: 'translateX(-50%) rotate(45deg)', borderRadius: 2, boxShadow: '3px 3px 6px rgba(23,19,15,0.12)' }} />
                </span>
              </div>
            );
          })}
        </div>

        {/* TOP — search + filters */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '54px 16px 8px', zIndex: 50, pointerEvents: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, pointerEvents: 'auto' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', borderRadius: 999, background: 'var(--surface)', boxShadow: 'var(--shadow-sm)' }}>
              <Icon name="search" size={18} stroke="var(--ink-3)" />
              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 15, color: 'var(--ink-3)' }}>Je cherche...</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto', pointerEvents: 'auto', paddingBottom: 2 }} className="no-scrollbar">
            <FilterChip id="all" label="Tout" filter={filter} setFilter={setFilter} />
            {Object.values(CATEGORIES).map(c => <FilterChip key={c.id} id={c.id} label={c.label} hue={c.hue} filter={filter} setFilter={setFilter} />)}
          </div>
        </div>

        {/* recenter */}
        <button onClick={recenter} style={{
          position: 'absolute', right: 16, bottom: 296, zIndex: 45, width: 46, height: 46, borderRadius: 14,
          background: 'var(--surface)', border: '0.5px solid var(--line)', boxShadow: 'var(--shadow-sm)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <Icon name="target" size={22} stroke="var(--accent)" />
        </button>

        {/* notification overlay slot */}
        {notif}

        {/* BOTTOM SHEET — nearby offers */}
        <NearbySheet offers={shown} state={sheet} setState={setSheet} onOpenDetail={onOpenDetail} setSel={setSel} />
      </div>
    );
  }

  function FilterChip({ id, label, hue, filter, setFilter }) {
    const on = filter === id;
    return (
      <button onClick={() => setFilter(id)} style={{
        flexShrink: 0, padding: '8px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
        background: on ? (hue || 'var(--ink)') : 'var(--surface)',
        color: on ? '#fff' : 'var(--ink)', boxShadow: 'var(--shadow-sm)',
        fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13.5, whiteSpace: 'nowrap',
        display: 'inline-flex', alignItems: 'center', gap: 6,
      }}>
        {hue && <span style={{ width: 6, height: 6, borderRadius: '50%', background: on ? '#fff' : hue }} />}
        {label}
      </button>
    );
  }

  function NearbySheet({ offers, state, setState, onOpenDetail, setSel }) {
    const startRef = useRef(null);
    const heights = { peek: 90, half: 268, full: 560 };
    const h = heights[state];
    const onDown = (e) => { startRef.current = e.clientY; };
    const onUp = (e) => {
      if (startRef.current == null) return;
      const dy = e.clientY - startRef.current; startRef.current = null;
      if (dy < -40) setState(state === 'peek' ? 'half' : 'full');
      else if (dy > 40) setState(state === 'full' ? 'half' : 'peek');
    };
    return (
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 42, height: h,
        background: 'var(--surface)', borderRadius: '26px 26px 0 0',
        boxShadow: '0 -10px 40px rgba(23,19,15,0.14)', transition: 'height .42s var(--spring)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div onPointerDown={onDown} onPointerUp={onUp} style={{ padding: '12px 20px 8px', cursor: 'grab', touchAction: 'none', flexShrink: 0 }}>
          <div style={{ width: 38, height: 5, borderRadius: 999, background: 'var(--line)', margin: '0 auto 12px' }} />
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 19, color: 'var(--ink)', letterSpacing: '-0.02em' }}>Autour de toi</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-2)' }}>{offers.length} offres à proximité</div>
            </div>
            <button onClick={() => setState(state === 'full' ? 'half' : 'full')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--accent)' }}>
              {state === 'full' ? 'Réduire' : 'Voir tout'}
            </button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 14px 90px' }} className="no-scrollbar">
          {offers.map(o => (
            <button key={o.id} onClick={() => { setSel(o.id); onOpenDetail(o); }} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 13, padding: '11px 8px',
              border: 'none', borderBottom: '0.5px solid var(--line)', background: 'none', cursor: 'pointer', textAlign: 'left',
            }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                <window.BrandTile offer={o} rounded={16} showMark={false} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15.5, color: 'var(--ink)' }}>{o.brand}</span>
                  <window.CatDot catId={o.category} />
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13, color: 'var(--ink-2)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.offer}</div>
              </div>
              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12.5, color: 'var(--accent)', whiteSpace: 'nowrap' }}>{o.distanceLabel}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  window.MapScreen = MapScreen;
})();
