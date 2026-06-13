// extras.jsx — push notification banner + AI agent search sheet.
// Exposes window.NotifBanner, window.AgentSheet
(function () {
  const { Icon, SpotMark, BrandAvatar } = window;
  const { useState } = React;

  // Signature push moment — glowing banner over the map.
  function NotifBanner({ offer, onOpen, onDismiss }) {
    const shown = window.useRise(offer && offer.id);
    if (!offer) return null;
    return (
      <div style={{ position: 'absolute', top: 108, left: 14, right: 14, zIndex: 70, opacity: shown ? 1 : 0, transform: shown ? 'translateY(0) scale(1)' : 'translateY(-22px) scale(0.96)', transition: 'opacity .4s ease, transform .5s var(--spring)' }}>
        <div style={{ position: 'absolute', inset: -1, borderRadius: 24, background: 'var(--accent)', opacity: 0.3, filter: 'blur(14px)' }} className="notif-glow" />
        <div onClick={onOpen} style={{
          position: 'relative', borderRadius: 22, padding: 14, cursor: 'pointer',
          background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(24px) saturate(180%)',
          boxShadow: '0 12px 40px rgba(23,19,15,0.2)', border: '0.5px solid rgba(255,255,255,0.8)',
          display: 'flex', gap: 13, alignItems: 'center',
        }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <span style={{ display: 'block', borderRadius: '50%', boxShadow: '0 0 0 3px #fff, 0 6px 16px rgba(0,0,0,0.18)' }}><BrandAvatar offer={offer} size={48} /></span>
            <span style={{ position: 'absolute', bottom: -3, right: -3, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><SpotMark size={18} /></span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent)' }}>À 5 min de toi</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17, color: 'var(--ink)', marginTop: 2, lineHeight: 1.1, letterSpacing: '-0.01em' }}>{offer.brand}</div>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 12.5, color: 'var(--ink-2)', marginTop: 2 }}>Offre exclusive, aujourd’hui seulement.</div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onDismiss(); }} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'rgba(23,19,15,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="close" size={15} stroke="var(--ink-2)" width={2} />
          </button>
        </div>
      </div>
    );
  }

  const SUGGEST = [
    'Mode à prix doux', 'Un cadeau beauté', 'Tech en promo', 'Déco pour mon salon', 'Sneakers tendance', 'Offres exclusives près de moi',
  ];

  // The agent — visible reasoning, drives the deck.
  function AgentSheet({ open, onClose, query, onApply }) {
    const [val, setVal] = useState(query || '');
    const shown = window.useRise(open);
    if (!open) return null;
    return (
      <div style={{ position: 'absolute', inset: 0, zIndex: 90, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(23,19,15,0.4)', opacity: shown ? 1 : 0, transition: 'opacity .3s ease' }} />
        <div style={{ position: 'relative', background: 'var(--canvas)', borderRadius: '26px 26px 0 0', padding: '14px 22px 30px', maxHeight: '78%', transform: shown ? 'translateY(0)' : 'translateY(100%)', transition: 'transform .42s var(--spring)' }}>
          <div style={{ width: 38, height: 5, borderRadius: 999, background: 'var(--line)', margin: '0 auto 18px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <SpotMark size={22} pulse={false} />
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, letterSpacing: '-0.02em', color: 'var(--ink)' }}>Dis-moi ce que tu cherches</div>
          </div>
          <p style={{ margin: '6px 0 0', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.4 }}>Le cerveau Spot.it réorganise les offres autour de toi.</p>

          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 16, background: 'var(--surface)', boxShadow: 'var(--shadow-sm)' }}>
            <Icon name="search" size={20} stroke="var(--ink-3)" />
            <input autoFocus value={val} onChange={e => setVal(e.target.value)} placeholder="ex. une veste en lin sous 150€"
              style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 15.5, color: 'var(--ink)' }}
              onKeyDown={e => { if (e.key === 'Enter') onApply(val); }} />
            {val && <button onClick={() => setVal('')} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}><Icon name="close" size={18} stroke="var(--ink-3)" /></button>}
          </div>

          <div style={{ marginTop: 16, fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Suggestions</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 12 }}>
            {SUGGEST.map(s => (
              <button key={s} onClick={() => onApply(s)} style={{ padding: '10px 14px', borderRadius: 999, border: '0.5px solid var(--line)', background: 'var(--surface)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{s}</button>
            ))}
          </div>

          <button onClick={() => onApply(val)} style={{ width: '100%', marginTop: 22, height: 54, borderRadius: 18, border: 'none', background: 'var(--accent)', color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Icon name="sparkle" size={18} stroke="#fff" /> Trouver mes offres
          </button>
        </div>
      </div>
    );
  }

  Object.assign(window, { NotifBanner, AgentSheet });
})();
