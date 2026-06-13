// screen-discover.jsx — the SWIPE pillar. Gestural deck + button fallback.
// Exposes window.Discover
(function () {
  const { Icon, BrandTile, WhyForYou, DistancePill, Sponsored, SpotLogo, CATEGORIES } = window;
  const { useState, useRef, useCallback } = React;

  const SWIPE_X = 110;   // px threshold for like/nope
  const SWIPE_UP = 120;  // px threshold for "see on map"

  function Discover({ deck, onLike, onNope, onDetail, onOpenMap, query, onOpenAgent }) {
    const [idx, setIdx] = useState(0);
    const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
    const [exit, setExit] = useState(null); // {dir, offer}
    const startRef = useRef(null);
    const topOffer = deck[idx];

    const reset = () => setDrag({ x: 0, y: 0, active: false });

    const fling = useCallback((dir) => {
      const offer = deck[idx];
      if (!offer) return;
      setExit({ dir, id: offer.id });
      if (dir === 'right') onLike && onLike(offer);
      if (dir === 'left') onNope && onNope(offer);
      if (dir === 'up') { onOpenMap && onOpenMap(offer); }
      setTimeout(() => {
        setExit(null);
        reset();
        if (dir === 'up') return; // up navigates away, keep card
        setIdx(i => i + 1);
      }, dir === 'up' ? 60 : 300);
    }, [deck, idx, onLike, onNope, onOpenMap]);

    // pointer drag
    const onPointerDown = (e) => {
      if (exit) return;
      startRef.current = { x: e.clientX, y: e.clientY };
      setDrag(d => ({ ...d, active: true }));
      e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e) => {
      if (!startRef.current) return;
      setDrag({ x: e.clientX - startRef.current.x, y: e.clientY - startRef.current.y, active: true });
    };
    const onPointerUp = () => {
      if (!startRef.current) return;
      const { x, y } = drag;
      startRef.current = null;
      if (x > SWIPE_X) return fling('right');
      if (x < -SWIPE_X) return fling('left');
      if (y < -SWIPE_UP) return fling('up');
      reset();
    };

    const likeAmt = Math.max(0, Math.min(1, drag.x / SWIPE_X));
    const nopeAmt = Math.max(0, Math.min(1, -drag.x / SWIPE_X));
    const mapAmt = Math.max(0, Math.min(1, -drag.y / SWIPE_UP));

    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
        {/* top bar */}
        <div style={{
          paddingTop: 56, padding: '56px 20px 8px', display: 'flex', flexDirection: 'column', gap: 12,
          flexShrink: 0, zIndex: 5,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <SpotLogo size={22} />
            <button onClick={onOpenAgent} style={{
              width: 40, height: 40, borderRadius: 999, border: '0.5px solid var(--line)',
              background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
            }}>
              <Icon name="sliders" size={20} stroke="var(--ink)" />
            </button>
          </div>
          {/* agent chip — drives the search */}
          <button onClick={onOpenAgent} style={{
            display: 'flex', alignItems: 'center', gap: 10, width: '100%',
            padding: '13px 16px', borderRadius: 999, border: 'none', cursor: 'pointer',
            background: 'var(--surface)', boxShadow: 'var(--shadow-sm)', textAlign: 'left',
          }}>
            <Icon name="sparkle" size={18} stroke="var(--accent)" />
            <span style={{
              flex: 1, fontFamily: 'var(--font-body)', fontWeight: query ? 600 : 500, fontSize: 15,
              color: query ? 'var(--ink)' : 'var(--ink-3)',
            }}>{query || 'Que cherches-tu aujourd’hui ?'}</span>
            <Icon name="search" size={18} stroke="var(--ink-3)" />
          </button>
        </div>

        {/* deck */}
        <div style={{ flex: 1, position: 'relative', margin: '6px 20px 0', minHeight: 0 }}>
          {/* End state */}
          {idx >= deck.length && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 16, padding: 24,
            }}>
              <window.SpotMark size={52} />
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 26, lineHeight: 1.1, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
                Tu as tout vu près de toi
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--ink-2)', maxWidth: 240, lineHeight: 1.4 }}>
                Élargis la zone ou change ta recherche pour découvrir d’autres offres.
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button onClick={() => setIdx(0)} style={btnSolid}>Revoir les offres</button>
                <button onClick={onOpenAgent} style={btnGhost}>Changer ma recherche</button>
              </div>
            </div>
          )}

          {/* cards (render top 3 for depth, back→front) */}
          {deck.slice(idx, idx + 3).map((offer, i) => {
            const isTop = i === 0;
            const isExiting = exit && exit.id === offer.id;
            let transform, transition;
            if (isTop && isExiting) {
              const fly = exit.dir === 'right' ? 'translate(140%, -10%) rotate(18deg)'
                        : exit.dir === 'left' ? 'translate(-140%, -10%) rotate(-18deg)'
                        : 'translate(0, -130%) scale(0.96)';
              transform = fly;
              transition = 'transform .3s cubic-bezier(.4,0,.2,1)';
            } else if (isTop) {
              transform = `translate(${drag.x}px, ${drag.y}px) rotate(${drag.x * 0.05}deg)`;
              transition = drag.active ? 'none' : 'transform .4s var(--spring)';
            } else {
              const s = 1 - i * 0.05;
              const ty = i * 14;
              transform = `translateY(${ty}px) scale(${s})`;
              transition = 'transform .4s var(--spring)';
            }
            return (
              <div key={offer.id}
                onPointerDown={isTop ? onPointerDown : undefined}
                onPointerMove={isTop ? onPointerMove : undefined}
                onPointerUp={isTop ? onPointerUp : undefined}
                onPointerCancel={isTop ? onPointerUp : undefined}
                onClick={() => { if (isTop && Math.abs(drag.x) < 6 && Math.abs(drag.y) < 6) onDetail(offer); }}
                style={{
                  position: 'absolute', inset: 0, zIndex: 10 - i,
                  transform, transition, cursor: isTop ? 'grab' : 'default',
                  touchAction: 'none', willChange: 'transform',
                }}>
                <SwipeCard offer={offer} likeAmt={isTop ? likeAmt : 0} nopeAmt={isTop ? nopeAmt : 0} mapAmt={isTop ? mapAmt : 0} />
              </div>
            );
          })}
        </div>

        {/* action buttons */}
        {idx < deck.length && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, padding: '16px 0 96px', flexShrink: 0 }}>
            <RoundBtn kind="nope" onClick={() => fling('left')} />
            <RoundBtn kind="map" small onClick={() => fling('up')} />
            <RoundBtn kind="like" big onClick={() => fling('right')} />
            <RoundBtn kind="detail" small onClick={() => onDetail(topOffer)} />
          </div>
        )}
      </div>
    );
  }

  function SwipeCard({ offer, likeAmt, nopeAmt, mapAmt }) {
    const cat = CATEGORIES[offer.category];
    return (
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 'var(--r-card)', overflow: 'hidden',
        boxShadow: `var(--shadow-card)${likeAmt > 0.1 ? `, 0 0 ${40 * likeAmt}px rgba(249,83,46,${0.5 * likeAmt})` : ''}`,
        background: '#000',
      }}>
        <BrandTile offer={offer} rounded={0} />

        {/* top row: sponsored + distance */}
        <div style={{ position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span>{offer.sponsored && <Sponsored dark />}</span>
          <DistancePill offer={offer} dark />
        </div>

        {/* like / nope / map stamps */}
        <Stamp label="J’AIME" color="var(--accent)" rot={-14} side="left" amt={likeAmt} />
        <Stamp label="PASSE" color="#7C756E" rot={14} side="right" amt={nopeAmt} />
        <div style={{
          position: 'absolute', top: '38%', left: 0, right: 0, textAlign: 'center', opacity: mapAmt,
          transform: `translateY(${(1 - mapAmt) * 14}px)`,
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 999,
            background: 'rgba(255,255,255,0.92)', color: 'var(--ink)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }}><Icon name="map" size={16} stroke="var(--ink)" /> Voir sur la carte</span>
        </div>

        {/* bottom content */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '20px 18px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 999,
              background: 'rgba(255,255,255,0.92)', color: cat.hue, fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12,
            }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: cat.hue }} />{cat.label}</span>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 26, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.05, textShadow: '0 2px 18px rgba(0,0,0,0.4)' }}>
              {offer.brand}
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 16, color: '#fff', marginTop: 4, textShadow: '0 2px 14px rgba(0,0,0,0.5)' }}>
              {offer.offer}
            </div>
          </div>
          <WhyForYou text={offer.why} dark compact />
        </div>
      </div>
    );
  }

  function Stamp({ label, color, rot, side, amt }) {
    return (
      <div style={{
        position: 'absolute', top: 70, [side]: 22,
        transform: `rotate(${rot}deg) scale(${0.8 + amt * 0.2})`, opacity: Math.min(1, amt * 1.4),
        padding: '6px 14px', borderRadius: 12, border: `3px solid ${color}`,
        color, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, letterSpacing: '0.04em',
        background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(2px)',
      }}>{label}</div>
    );
  }

  function RoundBtn({ kind, onClick, big, small }) {
    const size = big ? 68 : small ? 50 : 58;
    const map = {
      nope:   { icon: 'close',  stroke: '#7C756E', bg: 'var(--surface)' },
      like:   { icon: 'heartFill', stroke: '#fff', bg: 'var(--accent)' },
      detail: { icon: 'chevronRight', stroke: 'var(--ink)', bg: 'var(--surface)' },
      map:    { icon: 'arrowUp', stroke: 'var(--ink)', bg: 'var(--surface)' },
    }[kind];
    return (
      <button onClick={onClick} className="round-btn" style={{
        width: size, height: size, borderRadius: '50%', border: kind === 'like' ? 'none' : '0.5px solid var(--line)',
        background: map.bg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: kind === 'like' ? '0 10px 26px rgba(249,83,46,0.4)' : 'var(--shadow-sm)',
        transition: 'transform .18s var(--spring)',
      }}>
        <Icon name={map.icon} size={big ? 30 : 22} stroke={map.stroke} width={2} />
      </button>
    );
  }

  const btnSolid = { padding: '12px 18px', borderRadius: 999, border: 'none', background: 'var(--accent)', color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, cursor: 'pointer' };
  const btnGhost = { padding: '12px 18px', borderRadius: 999, border: '0.5px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, cursor: 'pointer' };

  window.Discover = Discover;
})();
