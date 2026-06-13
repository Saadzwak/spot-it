// screen-onboarding.jsx — 3-step low-friction onboarding. window.Onboarding
(function () {
  const { Icon, SpotLogo, SpotMark, CATEGORIES } = window;
  const { useState } = React;

  const OCCASIONS = [
    { id: 'soi', label: 'Pour moi', icon: 'heart' },
    { id: 'cadeau', label: 'Un cadeau', icon: 'gift' },
    { id: 'sortie', label: 'Une sortie', icon: 'sparkle' },
  ];

  function Onboarding({ onDone }) {
    const [step, setStep] = useState(0);
    const [cats, setCats] = useState([]);
    const [budget, setBudget] = useState(150);
    const [occasion, setOccasion] = useState('soi');
    const shown = window.useRise(step);
    const rise = { opacity: shown ? 1 : 0, transform: shown ? 'translateY(0)' : 'translateY(10px)', transition: 'opacity .35s ease, transform .35s var(--spring)' };

    const toggleCat = (id) => setCats(c => c.includes(id) ? c.filter(x => x !== id) : [...c, id]);
    const next = () => step < 2 ? setStep(step + 1) : onDone({ cats, budget, occasion });
    const canNext = step === 0 ? cats.length > 0 : true;

    return (
      <div style={{ position: 'absolute', inset: 0, background: 'var(--canvas)', display: 'flex', flexDirection: 'column' }}>
        {/* top: logo + progress */}
        <div style={{ padding: '58px 24px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SpotLogo size={20} />
            {step < 2 && <button onClick={() => onDone({ cats, budget, occasion })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--ink-3)' }}>Passer</button>}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 20 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 999, background: i <= step ? 'var(--accent)' : 'var(--line)', transition: 'background .3s ease' }} />
            ))}
          </div>
        </div>

        {/* steps */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 24px 0' }} className="no-scrollbar">
          {step === 0 && (
            <div style={rise}>
              <H>Que cherches-tu aujourd’hui ?</H>
              <Sub>Choisis une ou plusieurs envies. On ajuste tout de suite.</Sub>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 24 }}>
                {Object.values(CATEGORIES).map(c => {
                  const on = cats.includes(c.id);
                  return (
                    <button key={c.id} onClick={() => toggleCat(c.id)} style={{
                      position: 'relative', aspectRatio: '1.1', borderRadius: 22, cursor: 'pointer',
                      border: on ? `2px solid ${c.hue}` : '2px solid transparent',
                      background: c.tint, padding: 18, textAlign: 'left',
                      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                      transition: 'transform .2s var(--spring)', transform: on ? 'scale(0.98)' : 'none',
                    }}>
                      <span style={{ width: 40, height: 40, borderRadius: '50%', background: on ? c.hue : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .2s' }}>
                        <CatGlyph id={c.id} color={on ? '#fff' : c.hue} />
                      </span>
                      <div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, color: c.hue, letterSpacing: '-0.01em' }}>{c.label}</div>
                      </div>
                      {on && <span style={{ position: 'absolute', top: 12, right: 12, width: 22, height: 22, borderRadius: '50%', background: c.hue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={14} stroke="#fff" width={2.4} /></span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 1 && (
            <div style={rise}>
              <H>Quel budget, quelle occasion ?</H>
              <Sub>Approximatif — juste pour mieux cibler.</Sub>
              <div style={{ marginTop: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--ink-2)' }}>Budget approximatif</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 24, color: 'var(--accent)' }}>{budget < 300 ? `${budget} €` : '300 €+'}</span>
                </div>
                <input type="range" min="25" max="300" step="25" value={budget} onChange={e => setBudget(+e.target.value)} className="spot-range" style={{ width: '100%', marginTop: 14 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}><span>25 €</span><span>300 €+</span></div>
              </div>
              <div style={{ marginTop: 30 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--ink-2)' }}>Pour quelle occasion ?</span>
                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  {OCCASIONS.map(o => {
                    const on = occasion === o.id;
                    return (
                      <button key={o.id} onClick={() => setOccasion(o.id)} style={{
                        flex: 1, padding: '16px 8px', borderRadius: 18, cursor: 'pointer',
                        border: on ? '2px solid var(--accent)' : '2px solid transparent', background: on ? 'var(--accent-soft)' : 'var(--surface)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, boxShadow: on ? 'none' : 'var(--shadow-sm)',
                      }}>
                        <Icon name={o.icon} size={24} stroke={on ? 'var(--accent)' : 'var(--ink-2)'} width={1.7} />
                        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13.5, color: on ? 'var(--accent-ink)' : 'var(--ink)' }}>{o.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ ...rise, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: 10 }}>
              <div style={{ position: 'relative', width: 150, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                <SpotMark size={120} />
              </div>
              <H center>Repérer les bonnes offres près de toi</H>
              <Sub center>Active ta position pour qu’on te prévienne quand une offre pertinente est à ~5 min. Tu gardes le contrôle, à tout moment.</Sub>
              <div style={{ width: '100%', marginTop: 22, padding: 14, borderRadius: 18, background: 'var(--surface)', boxShadow: 'var(--shadow-sm)', display: 'flex', gap: 12, alignItems: 'center', textAlign: 'left' }}>
                <Icon name="lock" size={22} stroke="var(--accent)" />
                <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.4 }}>Ta position n’est jamais partagée. Tu peux la couper quand tu veux.</span>
              </div>
            </div>
          )}
        </div>

        {/* footer cta */}
        <div style={{ padding: '14px 24px 30px', flexShrink: 0 }}>
          <button onClick={next} disabled={!canNext} style={{
            width: '100%', height: 56, borderRadius: 18, border: 'none', cursor: canNext ? 'pointer' : 'default',
            background: canNext ? 'var(--accent)' : 'var(--line)', color: canNext ? '#fff' : 'var(--ink-3)',
            fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16.5,
            boxShadow: canNext ? '0 10px 24px rgba(249,83,46,0.32)' : 'none', transition: 'background .2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {step === 2 ? <><Icon name="target" size={20} stroke="#fff" /> Activer ma position</> : 'Continuer'}
          </button>
          {step === 2 && <button onClick={() => onDone({ cats, budget, occasion })} style={{ width: '100%', marginTop: 8, padding: 8, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--ink-3)' }}>Plus tard</button>}
        </div>
      </div>
    );
  }

  function CatGlyph({ id, color }) {
    const map = { mode: 'sparkle', tech: 'sliders', maison: 'pin', beaute: 'heart' };
    return <Icon name={map[id] || 'sparkle'} size={20} stroke={color} width={1.8} />;
  }
  function H({ children, center }) {
    return <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 30, lineHeight: 1.08, letterSpacing: '-0.025em', color: 'var(--ink)', textAlign: center ? 'center' : 'left', textWrap: 'balance' }}>{children}</div>;
  }
  function Sub({ children, center }) {
    return <p style={{ margin: '8px 0 0', fontFamily: 'var(--font-body)', fontSize: 15.5, lineHeight: 1.42, color: 'var(--ink-2)', textAlign: center ? 'center' : 'left', maxWidth: center ? 300 : 'none' }}>{children}</p>;
  }
  window.Onboarding = Onboarding;
})();
