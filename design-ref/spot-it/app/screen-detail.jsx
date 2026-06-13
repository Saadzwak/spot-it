// screen-detail.jsx — offer detail overlay. Exposes window.OfferDetail
(function () {
  const { Icon, BrandTile, WhyForYou, CATEGORIES, SpotMark } = window;

  function OfferDetail({ offer, onClose, onAddWish, onOpenMap, inWish }) {
    const shown = window.useRise(offer && offer.id);
    if (!offer) return null;
    const cat = CATEGORIES[offer.category];
    return (
      <div style={{ position: 'absolute', inset: 0, zIndex: 80, background: 'var(--canvas)', display: 'flex', flexDirection: 'column', transform: shown ? 'translateY(0)' : 'translateY(100%)', transition: 'transform .42s var(--spring)' }}>
        {/* hero */}
        <div style={{ position: 'relative', height: 340, flexShrink: 0 }}>
          <BrandTile offer={offer} rounded={0} />
          {/* close */}
          <button onClick={onClose} style={{
            position: 'absolute', top: 56, left: 16, width: 40, height: 40, borderRadius: 999,
            background: 'rgba(255,255,255,0.92)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)',
          }}>
            <Icon name="chevronLeft" size={22} stroke="var(--ink)" />
          </button>
          {offer.sponsored && <div style={{ position: 'absolute', top: 56, right: 16 }}><window.Sponsored dark /></div>}
          <div style={{ position: 'absolute', left: 20, bottom: 18 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.92)', color: cat.hue, fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12.5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: cat.hue }} />{cat.label}
            </span>
          </div>
        </div>

        {/* body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '22px 20px 150px' }} className="no-scrollbar">
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 30, letterSpacing: '-0.02em', color: 'var(--ink)', lineHeight: 1.05 }}>{offer.brand}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--ink-2)' }}>
              <Icon name="walk" size={16} stroke="var(--ink-2)" />{offer.distanceLabel} · {offer.walk} min à pied
            </span>
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--ink-3)' }} />
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14, color: 'var(--ink-2)' }}>{offer.address}</span>
          </div>

          {/* the offer */}
          <div style={{ marginTop: 18, padding: 16, borderRadius: 18, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Icon name="gift" size={24} stroke="var(--accent)" width={1.6} />
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 19, color: 'var(--accent-ink)', letterSpacing: '-0.01em' }}>{offer.offer}</div>
          </div>

          <div style={{ marginTop: 18 }}>
            <WhyForYou text={offer.why} />
          </div>

          <div style={{ marginTop: 20 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12.5, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 8 }}>À propos</div>
            <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: 15.5, lineHeight: 1.5, color: 'var(--ink)', textWrap: 'pretty' }}>{offer.desc}</p>
          </div>

          {/* mini map preview */}
          <div onClick={onOpenMap} style={{ marginTop: 20, height: 130, borderRadius: 18, overflow: 'hidden', position: 'relative', cursor: 'pointer', background: '#ECE6DB', border: '0.5px solid var(--line)' }}>
            <svg viewBox="0 0 360 130" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
              <rect width="360" height="130" fill="#ECE6DB" />
              <g stroke="#FBF8F2" strokeWidth="12" fill="none"><path d="M-10 40 L370 60" /><path d="M120 -10 L150 140" /></g>
              <g stroke="#E0D8CB" strokeWidth="3" fill="none"><path d="M-10 90 L370 100" /><path d="M250 -10 L270 140" /></g>
            </svg>
            <div style={{ position: 'absolute', left: '38%', top: '46%', transform: 'translate(-50%,-50%)' }}><SpotMark size={20} pulse={false} /></div>
            <div style={{ position: 'absolute', left: '64%', top: '40%', transform: 'translate(-50%,-100%)' }}>
              <span style={{ display: 'block', borderRadius: '50%', boxShadow: '0 0 0 2.5px #fff, 0 4px 10px rgba(0,0,0,0.2)' }}><window.BrandAvatar offer={offer} size={34} /></span>
            </div>
            <span style={{ position: 'absolute', right: 12, bottom: 12, padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.95)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12.5, color: 'var(--ink)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon name="map" size={14} stroke="var(--ink)" /> Voir sur la carte
            </span>
          </div>
        </div>

        {/* sticky actions */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '14px 20px 26px', background: 'linear-gradient(180deg, transparent, var(--canvas) 28%)', display: 'flex', gap: 10 }}>
          <button onClick={onAddWish} style={{
            width: 56, height: 56, borderRadius: 18, flexShrink: 0, cursor: 'pointer',
            border: '0.5px solid var(--line)', background: inWish ? 'var(--accent-soft)' : 'var(--surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)',
          }}>
            <Icon name={inWish ? 'heartFill' : 'heart'} size={24} stroke="var(--accent)" width={1.8} />
          </button>
          <button onClick={onOpenMap} style={{
            flex: 1, height: 56, borderRadius: 18, border: 'none', cursor: 'pointer',
            background: 'var(--accent)', color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, boxShadow: '0 10px 24px rgba(249,83,46,0.34)',
          }}>
            <Icon name="nav" size={20} stroke="#fff" /> Y aller
          </button>
        </div>
      </div>
    );
  }
  window.OfferDetail = OfferDetail;
})();
