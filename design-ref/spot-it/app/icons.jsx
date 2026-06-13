// icons.jsx — thin-line icon set, consistent 1.7 stroke. Exposes window.Icon
// <Icon name="search" size={22} stroke="#17130F" />
(function () {
  const P = (d, extra) => ({ d, ...extra });

  // Each icon = array of <path>/<circle> specs or a render fn.
  const ICONS = {
    // Tab bar
    discover: (s, c, w) => [
      <circle key="o" cx="12" cy="12" r="9" fill="none" stroke={c} strokeWidth={w} />,
      <path key="n" d="M15.6 8.4l-2 5.2-5.2 2 2-5.2 5.2-2z" fill="none" stroke={c} strokeWidth={w} strokeLinejoin="round" />,
    ],
    map: (s, c, w) => [
      <path key="p" d="M12 21s7-6.3 7-11a7 7 0 10-14 0c0 4.7 7 11 7 11z" fill="none" stroke={c} strokeWidth={w} strokeLinejoin="round" />,
      <circle key="d" cx="12" cy="10" r="2.4" fill="none" stroke={c} strokeWidth={w} />,
    ],
    heart: (s, c, w) => [
      <path key="h" d="M12 20.5C5.5 16 3 12.5 3 8.9 3 6.2 5.1 4 7.8 4c1.7 0 3.2.9 4.2 2.3C13 4.9 14.5 4 16.2 4 18.9 4 21 6.2 21 8.9c0 3.6-2.5 7.1-9 11.6z" fill="none" stroke={c} strokeWidth={w} strokeLinejoin="round" />,
    ],
    heartFill: (s, c, w) => [
      <path key="h" d="M12 20.5C5.5 16 3 12.5 3 8.9 3 6.2 5.1 4 7.8 4c1.7 0 3.2.9 4.2 2.3C13 4.9 14.5 4 16.2 4 18.9 4 21 6.2 21 8.9c0 3.6-2.5 7.1-9 11.6z" fill={c} stroke={c} strokeWidth={w} strokeLinejoin="round" />,
    ],
    profile: (s, c, w) => [
      <circle key="h" cx="12" cy="8" r="3.6" fill="none" stroke={c} strokeWidth={w} />,
      <path key="b" d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" />,
    ],
    // Utility
    search: (s, c, w) => [
      <circle key="o" cx="11" cy="11" r="6.5" fill="none" stroke={c} strokeWidth={w} />,
      <path key="l" d="M16 16l4.5 4.5" stroke={c} strokeWidth={w} strokeLinecap="round" />,
    ],
    close: (s, c, w) => [
      <path key="x" d="M6 6l12 12M18 6L6 18" stroke={c} strokeWidth={w} strokeLinecap="round" />,
    ],
    chevronRight: (s, c, w) => [
      <path key="c" d="M9 5l7 7-7 7" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />,
    ],
    chevronLeft: (s, c, w) => [
      <path key="c" d="M15 5l-7 7 7 7" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />,
    ],
    arrowUp: (s, c, w) => [
      <path key="a" d="M12 19V5M6 11l6-6 6 6" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />,
    ],
    walk: (s, c, w) => [
      <circle key="h" cx="13" cy="4.4" r="1.8" fill={c} />,
      <path key="b" d="M12.5 8l-2.5 4 1.5 1.5L11 21M12.5 8l3 1.5 2.5 1M12.5 8L9 9.5 7 13" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />,
    ],
    target: (s, c, w) => [
      <circle key="o" cx="12" cy="12" r="7.5" fill="none" stroke={c} strokeWidth={w} />,
      <circle key="d" cx="12" cy="12" r="2.4" fill={c} />,
      <path key="t" d="M12 1.5V4M12 20v2.5M22.5 12H20M4 12H1.5" stroke={c} strokeWidth={w} strokeLinecap="round" />,
    ],
    sparkle: (s, c, w) => [
      <path key="s" d="M12 3l1.7 5.1L19 10l-5.3 1.9L12 17l-1.7-5.1L5 10l5.3-1.9L12 3z" fill={c} stroke="none" />,
      <path key="s2" d="M19 3.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z" fill={c} stroke="none" opacity="0.8" />,
    ],
    pin: (s, c, w) => [
      <path key="p" d="M12 21s7-6.3 7-11a7 7 0 10-14 0c0 4.7 7 11 7 11z" fill="none" stroke={c} strokeWidth={w} strokeLinejoin="round" />,
    ],
    gift: (s, c, w) => [
      <path key="b" d="M4 11h16v8a1 1 0 01-1 1H5a1 1 0 01-1-1v-8z" fill="none" stroke={c} strokeWidth={w} strokeLinejoin="round" />,
      <path key="t" d="M3 7.5h18V11H3z" fill="none" stroke={c} strokeWidth={w} strokeLinejoin="round" />,
      <path key="m" d="M12 7.5V20" stroke={c} strokeWidth={w} />,
      <path key="r" d="M12 7.5C12 5 10.5 3.5 8.8 3.5 7.5 3.5 7 4.4 7 5.2 7 6.8 9.2 7.5 12 7.5zm0 0C12 5 13.5 3.5 15.2 3.5c1.3 0 1.8.9 1.8 1.7C17 6.8 14.8 7.5 12 7.5z" fill="none" stroke={c} strokeWidth={w} strokeLinejoin="round" />,
    ],
    bell: (s, c, w) => [
      <path key="b" d="M6 9a6 6 0 1112 0c0 5 1.5 6.5 1.5 6.5H4.5S6 14 6 9z" fill="none" stroke={c} strokeWidth={w} strokeLinejoin="round" />,
      <path key="c" d="M10 19a2 2 0 004 0" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" />,
    ],
    check: (s, c, w) => [
      <path key="c" d="M5 12.5l4.5 4.5L19 7" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />,
    ],
    nav: (s, c, w) => [
      <path key="n" d="M12 3l8 18-8-4-8 4 8-18z" fill={c} stroke="none" />,
    ],
    plus: (s, c, w) => [
      <path key="p" d="M12 5v14M5 12h14" stroke={c} strokeWidth={w} strokeLinecap="round" />,
    ],
    lock: (s, c, w) => [
      <rect key="b" x="5" y="10.5" width="14" height="9.5" rx="2.4" fill="none" stroke={c} strokeWidth={w} />,
      <path key="s" d="M8 10.5V8a4 4 0 018 0v2.5" fill="none" stroke={c} strokeWidth={w} />,
    ],
    sliders: (s, c, w) => [
      <path key="a" d="M4 7h10M18 7h2M4 12h2M10 12h10M4 17h8M16 17h4" stroke={c} strokeWidth={w} strokeLinecap="round" />,
      <circle key="c1" cx="16" cy="7" r="2.2" fill="none" stroke={c} strokeWidth={w} />,
      <circle key="c2" cx="8" cy="12" r="2.2" fill="none" stroke={c} strokeWidth={w} />,
      <circle key="c3" cx="14" cy="17" r="2.2" fill="none" stroke={c} strokeWidth={w} />,
    ],
  };

  function Icon({ name, size = 24, stroke = 'currentColor', width = 1.7, style }) {
    const render = ICONS[name];
    if (!render) return null;
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', flexShrink: 0, ...style }}>
        {render(size, stroke, width)}
      </svg>
    );
  }
  window.Icon = Icon;
})();
