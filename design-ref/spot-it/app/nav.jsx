// nav.jsx — bottom tab bar (4 equal tabs). Exposes window.TabBar
(function () {
  const { Icon } = window;
  const TABS = [
    { id: 'discover', label: 'Découvrir', icon: 'discover' },
    { id: 'map',      label: 'Carte',     icon: 'map' },
    { id: 'wishlist', label: 'Wishlist',  icon: 'heart' },
    { id: 'profile',  label: 'Profil',    icon: 'profile' },
  ];

  function TabBar({ active, onChange, wishCount = 0 }) {
    return (
      <div style={{
        position: 'absolute', left: 12, right: 12, bottom: 10, zIndex: 40,
        height: 64, borderRadius: 26,
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(22px) saturate(180%)',
        WebkitBackdropFilter: 'blur(22px) saturate(180%)',
        boxShadow: '0 8px 30px rgba(23,19,15,0.14), 0 1px 0 rgba(255,255,255,0.7) inset',
        border: '0.5px solid rgba(23,19,15,0.06)',
        display: 'flex', alignItems: 'stretch', padding: '0 6px',
      }}>
        {TABS.map(t => {
          const on = active === t.id;
          return (
            <button key={t.id} onClick={() => onChange(t.id)} style={{
              flex: 1, border: 'none', background: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
              position: 'relative', padding: 0,
            }}>
              <span style={{ position: 'relative', transition: 'transform .25s var(--spring)', transform: on ? 'translateY(-1px)' : 'none' }}>
                <Icon name={t.icon === 'heart' && on ? 'heartFill' : t.icon} size={24}
                      stroke={on ? 'var(--accent)' : 'var(--ink-3)'} width={1.8} />
                {t.id === 'wishlist' && wishCount > 0 && (
                  <span style={{
                    position: 'absolute', top: -4, right: -7, minWidth: 16, height: 16, padding: '0 4px',
                    borderRadius: 999, background: 'var(--accent)', color: '#fff',
                    fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 0 2px rgba(255,255,255,0.9)',
                  }}>{wishCount}</span>
                )}
              </span>
              <span style={{
                fontFamily: 'var(--font-body)', fontWeight: on ? 700 : 500, fontSize: 10.5,
                letterSpacing: '-0.01em', color: on ? 'var(--accent)' : 'var(--ink-3)',
              }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    );
  }
  window.TabBar = TabBar;
})();
