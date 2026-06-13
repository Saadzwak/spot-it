// screen-profile.jsx — "Mon profil de goûts" + data controls + Spot.it+. window.Profile
(function () {
  const { Icon, CATEGORIES, SpotLogo, SpotMark, BrandTile } = window;

  function Profile({ taste, wishItems, controls, setControl, onOpenDetail, onReplayOnboarding }) {
    return (
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto' }} className="no-scrollbar">
        <div style={{ padding: '58px 20px 96px' }}>
          {/* header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(150deg, #2C2622, #6E625A)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 24, boxShadow: 'var(--shadow-sm)' }}>CL</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 24, letterSpacing: '-0.02em', color: 'var(--ink)' }}>Camille</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 4, padding: '3px 10px', borderRadius: 999, background: 'var(--ink)', color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11.5 }}>
                <Icon name="sparkle" size={13} stroke="#F9532E" /> Membre Spot.it+
              </div>
            </div>
          </div>

          {/* taste profile */}
          <Card>
            <SectionTitle>Mon profil de goûts</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
              {Object.values(CATEGORIES).map(c => (
                <div key={c.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{c.label}</span>
                    <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: c.hue }}>{taste[c.id]}%</span>
                  </div>
                  <div style={{ height: 9, borderRadius: 999, background: 'var(--canvas)', overflow: 'hidden' }}>
                    <div style={{ width: `${taste[c.id]}%`, height: '100%', borderRadius: 999, background: c.hue, transition: 'width .6s var(--spring)' }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14, alignItems: 'flex-start' }}>
              <Icon name="sparkle" size={16} stroke="var(--accent)" style={{ marginTop: 1 }} />
              <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.4, color: 'var(--ink-2)' }}>Plus tu swipes et interagis, plus Spot.it affine tes recommandations.</p>
            </div>
          </Card>

          {/* wishlist preview */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <SectionTitle nomargin>Aperçu wishlist</SectionTitle>
              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: 'var(--ink-3)' }}>{wishItems.length} items</span>
            </div>
            {wishItems.length ? (
              <div style={{ display: 'flex', gap: 10, marginTop: 12, overflowX: 'auto' }} className="no-scrollbar">
                {wishItems.slice(0, 6).map(o => (
                  <button key={o.id} onClick={() => onOpenDetail(o)} style={{ flexShrink: 0, width: 84, border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}>
                    <div style={{ position: 'relative', width: 84, height: 100, borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                      <BrandTile offer={o} rounded={0} showMark={false} />
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: 'var(--ink)', marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.brand}</div>
                  </button>
                ))}
              </div>
            ) : (
              <p style={{ margin: '10px 0 0', fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'var(--ink-2)' }}>Swipe à droite pour remplir ta wishlist.</p>
            )}
          </Card>

          {/* data controls */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="lock" size={18} stroke="var(--ink)" />
              <SectionTitle nomargin>Tu contrôles tes données</SectionTitle>
            </div>
            <p style={{ margin: '8px 0 4px', fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.4, color: 'var(--ink-2)' }}>Tu décides de ce que Spot.it utilise. Tu peux tout changer à tout moment.</p>
            <Toggle label="Localisation" sub="Pour repérer les offres près de toi" on={controls.location} onToggle={() => setControl('location', !controls.location)} />
            <Toggle label="Personnalisation" sub="Adapter les offres à tes goûts" on={controls.perso} onToggle={() => setControl('perso', !controls.perso)} />
            <Toggle label="Partage de données" sub="Désactivé par défaut" on={controls.share} onToggle={() => setControl('share', !controls.share)} last />
          </Card>

          {/* spot.it+ */}
          <div style={{ marginTop: 16, padding: 18, borderRadius: 'var(--r-card)', background: 'var(--ink)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -20, top: -20 }}><SpotMark size={90} /></div>
            <div style={{ position: 'relative' }}>
              <SpotLogo size={20} color="#fff" />
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, color: '#fff', marginTop: 10, letterSpacing: '-0.01em' }}>Spot.it+ activé</div>
              <p style={{ margin: '4px 0 0', fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4, maxWidth: 230 }}>Offres exclusives, alertes prioritaires et zéro publicité non pertinente.</p>
            </div>
          </div>

          <button onClick={onReplayOnboarding} style={{ width: '100%', marginTop: 14, padding: '13px', borderRadius: 16, border: '0.5px solid var(--line)', background: 'var(--surface)', color: 'var(--ink-2)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Revoir l’onboarding</button>
        </div>
      </div>
    );
  }

  function Card({ children }) {
    return <div style={{ marginTop: 16, padding: 18, borderRadius: 'var(--r-card)', background: 'var(--surface)', boxShadow: 'var(--shadow-sm)' }}>{children}</div>;
  }
  function SectionTitle({ children, nomargin }) {
    return <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, letterSpacing: '-0.01em', color: 'var(--ink)', marginBottom: nomargin ? 0 : 0 }}>{children}</div>;
  }
  function Toggle({ label, sub, on, onToggle, last }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', borderBottom: last ? 'none' : '0.5px solid var(--line)' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>{label}</div>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: 12.5, color: 'var(--ink-3)', marginTop: 1 }}>{sub}</div>
        </div>
        <button onClick={onToggle} style={{ width: 50, height: 30, borderRadius: 999, border: 'none', cursor: 'pointer', background: on ? 'var(--accent)' : 'var(--line)', position: 'relative', transition: 'background .25s ease', flexShrink: 0 }}>
          <span style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 24, height: 24, borderRadius: '50%', background: '#fff', transition: 'left .25s var(--spring)', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }} />
        </button>
      </div>
    );
  }
  window.Profile = Profile;
})();
