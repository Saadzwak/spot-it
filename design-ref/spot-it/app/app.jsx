// app.jsx — Spot.it root: state, navigation, custom adaptive iPhone frame. window.SpotApp
(function () {
  const { useState, useMemo, useEffect } = React;
  const { Onboarding, Discover, MapScreen, OfferDetail, Wishlist, Profile, TabBar, NotifBanner, AgentSheet, OFFERS } = window;

  // ── Adaptive status bar (dark text on light screens, light on dark map)
  function StatusBar({ light }) {
    const c = light ? '#fff' : 'var(--ink)';
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 54, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', pointerEvents: 'none' }}>
        <span style={{ fontFamily: '-apple-system, system-ui', fontWeight: 600, fontSize: 16, color: c, marginTop: 4 }}>9:41</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
          <svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="7" width="3" height="5" rx="0.6" fill={c}/><rect x="5" y="4.5" width="3" height="7.5" rx="0.6" fill={c}/><rect x="10" y="2" width="3" height="10" rx="0.6" fill={c}/><rect x="15" y="0" width="3" height="12" rx="0.6" fill={c}/></svg>
          <svg width="16" height="12" viewBox="0 0 17 12"><path d="M8.5 3.2C10.8 3.2 12.9 4.1 14.4 5.6L15.5 4.5C13.7 2.7 11.2 1.5 8.5 1.5 5.8 1.5 3.3 2.7 1.5 4.5L2.6 5.6C4.1 4.1 6.2 3.2 8.5 3.2z" fill={c}/><path d="M8.5 6.8c1.4 0 2.6.5 3.5 1.4l1.1-1.1C11.8 5.9 10.2 5.1 8.5 5.1S5.2 5.9 3.9 7.1L5 8.2c.9-.9 2.1-1.4 3.5-1.4z" fill={c}/><circle cx="8.5" cy="10.5" r="1.4" fill={c}/></svg>
          <svg width="26" height="13" viewBox="0 0 26 13"><rect x="0.5" y="0.5" width="22" height="12" rx="3.5" stroke={c} strokeOpacity="0.4" fill="none"/><rect x="2" y="2" width="19" height="9" rx="2" fill={c}/><path d="M24 4.5v4c.8-.3 1.5-1.3 1.5-2s-.7-1.7-1.5-2z" fill={c} fillOpacity="0.5"/></svg>
        </div>
      </div>
    );
  }

  function Phone({ statusLight, children, radius }) {
    return (
      <div style={{
        width: 390, height: 844, borderRadius: 54, position: 'relative', overflow: 'hidden',
        background: 'var(--canvas)', boxShadow: '0 50px 90px -20px rgba(23,19,15,0.4), 0 0 0 11px #14110d, 0 0 0 12px #2a2520',
      }}>
        {children}
        {/* dynamic island */}
        <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', width: 120, height: 35, borderRadius: 22, background: '#000', zIndex: 60 }} />
        <StatusBar light={statusLight} />
        {/* home indicator */}
        <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', width: 134, height: 5, borderRadius: 999, background: statusLight ? 'rgba(255,255,255,0.8)' : 'rgba(23,19,15,0.32)', zIndex: 62, pointerEvents: 'none' }} />
      </div>
    );
  }

  const BASE_TASTE = { mode: 58, tech: 26, maison: 38, beaute: 50 };

  function SpotApp({ tweaks }) {
    const t = tweaks || {};
    const [onboarded, setOnboarded] = useState(false);
    const [tab, setTab] = useState('discover');
    const [detail, setDetail] = useState(null);
    const [agent, setAgent] = useState(false);
    const [query, setQuery] = useState('');
    const [wishIds, setWishIds] = useState([]);
    const [mapFilter, setMapFilter] = useState('all');
    const [notif, setNotif] = useState(false);
    const [controls, setControls] = useState({ location: true, perso: true, share: false });
    const notifOffer = OFFERS.find(o => o.id === 'lbm');

    // deck order: reset on query
    const deck = useMemo(() => OFFERS, []);
    const [deckKey, setDeckKey] = useState(0);

    const wishItems = wishIds.map(id => OFFERS.find(o => o.id === id)).filter(Boolean);
    const taste = useMemo(() => {
      const t2 = { ...BASE_TASTE };
      wishItems.forEach(o => { t2[o.category] = Math.min(100, t2[o.category] + 9); });
      return t2;
    }, [wishIds]);

    const addWish = (o) => setWishIds(ids => ids.includes(o.id) ? ids : [...ids, o.id]);
    const toggleWish = (o) => setWishIds(ids => ids.includes(o.id) ? ids.filter(x => x !== o.id) : [...ids, o.id]);

    const openMapFor = (o) => { setDetail(null); setTab('map'); if (o) setMapFilter('all'); };

    // notification appears shortly after first landing on the map
    useEffect(() => {
      if (tab === 'map' && controls.location && !notif) {
        const id = setTimeout(() => setNotif(true), 1400);
        return () => clearTimeout(id);
      }
    }, [tab]);

    // allow the external navigator to drive screens
    useEffect(() => {
      window.__spotGo = (screen) => {
        if (screen === 'onboarding') { setOnboarded(false); setDetail(null); setAgent(false); return; }
        setOnboarded(true);
        if (screen === 'detail') { setTab('discover'); setDetail(OFFERS[0]); return; }
        setDetail(null); setAgent(false);
        if (screen === 'notif') { setTab('map'); setNotif(true); return; }
        if (['discover', 'map', 'wishlist', 'profile'].includes(screen)) setTab(screen);
      };
    });

    const statusLight = onboarded && tab === 'map' && t.mapDark;

    return (
      <Phone statusLight={statusLight}>
        {!onboarded ? (
          <Onboarding onDone={() => { setOnboarded(true); setTab('discover'); }} />
        ) : (
          <>
            <div style={{ position: 'absolute', inset: 0 }}>
              {tab === 'discover' && (
                <Discover deck={deck} key={deckKey}
                  query={query} onOpenAgent={() => setAgent(true)}
                  onLike={addWish} onNope={() => {}} onDetail={setDetail} onOpenMap={openMapFor} />
              )}
              {tab === 'map' && (
                <MapScreen offers={OFFERS} filter={mapFilter} setFilter={setMapFilter} dark={t.mapDark}
                  onOpenDetail={setDetail}
                  notif={notif ? <NotifBanner offer={notifOffer} onOpen={() => { setNotif(false); setDetail(notifOffer); }} onDismiss={() => setNotif(false)} /> : null} />
              )}
              {tab === 'wishlist' && (
                <Wishlist items={wishItems} onOpenDetail={setDetail} onGoDiscover={() => setTab('discover')} />
              )}
              {tab === 'profile' && (
                <Profile taste={taste} wishItems={wishItems} controls={controls}
                  setControl={(k, v) => setControls(c => ({ ...c, [k]: v }))}
                  onOpenDetail={setDetail} onReplayOnboarding={() => setOnboarded(false)} />
              )}
            </div>

            <TabBar active={tab} onChange={(x) => { setDetail(null); setTab(x); }} wishCount={wishIds.length} />

            {detail && (
              <OfferDetail offer={detail} inWish={wishIds.includes(detail.id)}
                onClose={() => setDetail(null)} onAddWish={() => toggleWish(detail)} onOpenMap={() => openMapFor(detail)} />
            )}

            <AgentSheet open={agent} query={query} onClose={() => setAgent(false)}
              onApply={(q) => { setQuery(q); setAgent(false); setDeckKey(k => k + 1); }} />
          </>
        )}
      </Phone>
    );
  }

  window.SpotApp = SpotApp;
})();
