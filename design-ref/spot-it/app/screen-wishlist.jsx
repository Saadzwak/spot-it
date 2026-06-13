// screen-wishlist.jsx — saved offers (from right-swipes). Exposes window.Wishlist
(function () {
  const { Icon, BrandTile, CATEGORIES, SpotMark } = window;

  function Wishlist({ items, onOpenDetail, onGoDiscover }) {
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '60px 20px 12px', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 32, letterSpacing: '-0.025em', color: 'var(--ink)' }}>Wishlist</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 14.5, color: 'var(--ink-2)', marginTop: 2 }}>
            {items.length ? `${items.length} offre${items.length > 1 ? 's' : ''} sauvegardée${items.length > 1 ? 's' : ''}` : 'Tes coups de cœur atterrissent ici'}
          </div>
        </div>

        {items.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 14, padding: '0 40px 90px' }}>
            <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="heart" size={34} stroke="var(--accent)" width={1.6} />
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 21, color: 'var(--ink)' }}>Rien encore</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 14.5, color: 'var(--ink-2)', lineHeight: 1.4 }}>Swipe à droite sur les offres que tu aimes dans Découvrir pour les retrouver ici.</div>
            <button onClick={onGoDiscover} style={{ marginTop: 6, padding: '12px 20px', borderRadius: 999, border: 'none', background: 'var(--accent)', color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14.5, cursor: 'pointer' }}>Découvrir des offres</button>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 96px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignContent: 'start' }} className="no-scrollbar">
            {items.map(o => {
              const cat = CATEGORIES[o.category];
              return (
                <button key={o.id} onClick={() => onOpenDetail(o)} style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '0.82', borderRadius: 'var(--r-card)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                    <BrandTile offer={o} rounded={0} />
                    <div style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="heartFill" size={16} stroke="var(--accent)" />
                    </div>
                    <div style={{ position: 'absolute', left: 10, bottom: 10, padding: '5px 9px', borderRadius: 999, background: 'rgba(255,255,255,0.92)', color: 'var(--ink)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11.5 }}>{o.distanceLabel}</div>
                  </div>
                  <div style={{ padding: '8px 4px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cat.hue }} />
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>{o.brand}</span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 12.5, color: 'var(--ink-2)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.offer}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }
  window.Wishlist = Wishlist;
})();
