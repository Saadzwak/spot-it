// ============================================================================
// Icon — thin-line SVG icon set, ported from design-ref/spot-it/app/icons.jsx
// All icons use react-native-svg. strokeWidth default 1.6.
// ============================================================================

import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { colors } from '@/design/tokens';

export type IconName =
  | 'discover'
  | 'map'
  | 'heart'
  | 'heartFill'
  | 'profile'
  | 'search'
  | 'close'
  | 'chevronRight'
  | 'chevronLeft'
  | 'arrowUp'
  | 'walk'
  | 'target'
  | 'sparkle'
  | 'pin'
  | 'gift'
  | 'bell'
  | 'check'
  | 'nav'
  | 'plus'
  | 'lock'
  | 'sliders'
  | 'user'
  | 'list'
  | 'cards'
  | 'settings'
  | 'location'
  | 'x';

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

type RenderFn = (c: string, w: number) => React.ReactNode;

const ICONS: Record<IconName, RenderFn> = {
  discover: (c, w) => (
    <>
      <Circle cx="12" cy="12" r="9" fill="none" stroke={c} strokeWidth={w} />
      <Path d="M15.6 8.4l-2 5.2-5.2 2 2-5.2 5.2-2z" fill="none" stroke={c} strokeWidth={w} strokeLinejoin="round" />
    </>
  ),
  map: (c, w) => (
    <>
      <Path d="M12 21s7-6.3 7-11a7 7 0 10-14 0c0 4.7 7 11 7 11z" fill="none" stroke={c} strokeWidth={w} strokeLinejoin="round" />
      <Circle cx="12" cy="10" r="2.4" fill="none" stroke={c} strokeWidth={w} />
    </>
  ),
  heart: (c, w) => (
    <Path d="M12 20.5C5.5 16 3 12.5 3 8.9 3 6.2 5.1 4 7.8 4c1.7 0 3.2.9 4.2 2.3C13 4.9 14.5 4 16.2 4 18.9 4 21 6.2 21 8.9c0 3.6-2.5 7.1-9 11.6z" fill="none" stroke={c} strokeWidth={w} strokeLinejoin="round" />
  ),
  heartFill: (c, w) => (
    <Path d="M12 20.5C5.5 16 3 12.5 3 8.9 3 6.2 5.1 4 7.8 4c1.7 0 3.2.9 4.2 2.3C13 4.9 14.5 4 16.2 4 18.9 4 21 6.2 21 8.9c0 3.6-2.5 7.1-9 11.6z" fill={c} stroke={c} strokeWidth={w} strokeLinejoin="round" />
  ),
  profile: (c, w) => (
    <>
      <Circle cx="12" cy="8" r="3.6" fill="none" stroke={c} strokeWidth={w} />
      <Path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" />
    </>
  ),
  // alias: user = profile
  user: (c, w) => (
    <>
      <Circle cx="12" cy="8" r="3.6" fill="none" stroke={c} strokeWidth={w} />
      <Path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" />
    </>
  ),
  search: (c, w) => (
    <>
      <Circle cx="11" cy="11" r="6.5" fill="none" stroke={c} strokeWidth={w} />
      <Path d="M16 16l4.5 4.5" stroke={c} strokeWidth={w} strokeLinecap="round" />
    </>
  ),
  close: (c, w) => (
    <Path d="M6 6l12 12M18 6L6 18" stroke={c} strokeWidth={w} strokeLinecap="round" />
  ),
  // alias: x = close
  x: (c, w) => (
    <Path d="M6 6l12 12M18 6L6 18" stroke={c} strokeWidth={w} strokeLinecap="round" />
  ),
  chevronRight: (c, w) => (
    <Path d="M9 5l7 7-7 7" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
  ),
  chevronLeft: (c, w) => (
    <Path d="M15 5l-7 7 7 7" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
  ),
  arrowUp: (c, w) => (
    <Path d="M12 19V5M6 11l6-6 6 6" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
  ),
  walk: (c, w) => (
    <>
      <Circle cx="13" cy="4.4" r="1.8" fill={c} />
      <Path d="M12.5 8l-2.5 4 1.5 1.5L11 21M12.5 8l3 1.5 2.5 1M12.5 8L9 9.5 7 13" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  target: (c, w) => (
    <>
      <Circle cx="12" cy="12" r="7.5" fill="none" stroke={c} strokeWidth={w} />
      <Circle cx="12" cy="12" r="2.4" fill={c} />
      <Path d="M12 1.5V4M12 20v2.5M22.5 12H20M4 12H1.5" stroke={c} strokeWidth={w} strokeLinecap="round" />
    </>
  ),
  sparkle: (c, _w) => (
    <>
      <Path d="M12 3l1.7 5.1L19 10l-5.3 1.9L12 17l-1.7-5.1L5 10l5.3-1.9L12 3z" fill={c} />
      <Path d="M19 3.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z" fill={c} opacity={0.8} />
    </>
  ),
  pin: (c, w) => (
    <Path d="M12 21s7-6.3 7-11a7 7 0 10-14 0c0 4.7 7 11 7 11z" fill="none" stroke={c} strokeWidth={w} strokeLinejoin="round" />
  ),
  // alias: location = pin
  location: (c, w) => (
    <Path d="M12 21s7-6.3 7-11a7 7 0 10-14 0c0 4.7 7 11 7 11z" fill="none" stroke={c} strokeWidth={w} strokeLinejoin="round" />
  ),
  gift: (c, w) => (
    <>
      <Path d="M4 11h16v8a1 1 0 01-1 1H5a1 1 0 01-1-1v-8z" fill="none" stroke={c} strokeWidth={w} strokeLinejoin="round" />
      <Path d="M3 7.5h18V11H3z" fill="none" stroke={c} strokeWidth={w} strokeLinejoin="round" />
      <Path d="M12 7.5V20" stroke={c} strokeWidth={w} />
      <Path d="M12 7.5C12 5 10.5 3.5 8.8 3.5 7.5 3.5 7 4.4 7 5.2 7 6.8 9.2 7.5 12 7.5zm0 0C12 5 13.5 3.5 15.2 3.5c1.3 0 1.8.9 1.8 1.7C17 6.8 14.8 7.5 12 7.5z" fill="none" stroke={c} strokeWidth={w} strokeLinejoin="round" />
    </>
  ),
  bell: (c, w) => (
    <>
      <Path d="M6 9a6 6 0 1112 0c0 5 1.5 6.5 1.5 6.5H4.5S6 14 6 9z" fill="none" stroke={c} strokeWidth={w} strokeLinejoin="round" />
      <Path d="M10 19a2 2 0 004 0" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" />
    </>
  ),
  check: (c, w) => (
    <Path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
  ),
  nav: (c, _w) => (
    <Path d="M12 3l8 18-8-4-8 4 8-18z" fill={c} />
  ),
  plus: (c, w) => (
    <Path d="M12 5v14M5 12h14" stroke={c} strokeWidth={w} strokeLinecap="round" />
  ),
  lock: (c, w) => (
    <>
      <Rect x="5" y="10.5" width="14" height="9.5" rx="2.4" fill="none" stroke={c} strokeWidth={w} />
      <Path d="M8 10.5V8a4 4 0 018 0v2.5" fill="none" stroke={c} strokeWidth={w} />
    </>
  ),
  sliders: (c, w) => (
    <>
      <Path d="M4 7h10M18 7h2M4 12h2M10 12h10M4 17h8M16 17h4" stroke={c} strokeWidth={w} strokeLinecap="round" />
      <Circle cx="16" cy="7" r="2.2" fill="none" stroke={c} strokeWidth={w} />
      <Circle cx="8" cy="12" r="2.2" fill="none" stroke={c} strokeWidth={w} />
      <Circle cx="14" cy="17" r="2.2" fill="none" stroke={c} strokeWidth={w} />
    </>
  ),
  // list / cards / settings — utility icons for tab bar / views
  list: (c, w) => (
    <>
      <Path d="M8 6h11M8 12h11M8 18h11" stroke={c} strokeWidth={w} strokeLinecap="round" />
      <Circle cx="4.5" cy="6" r="1" fill={c} />
      <Circle cx="4.5" cy="12" r="1" fill={c} />
      <Circle cx="4.5" cy="18" r="1" fill={c} />
    </>
  ),
  cards: (c, w) => (
    <>
      <Rect x="3" y="5" width="8" height="14" rx="2" fill="none" stroke={c} strokeWidth={w} />
      <Rect x="13" y="5" width="8" height="14" rx="2" fill="none" stroke={c} strokeWidth={w} />
    </>
  ),
  settings: (c, w) => (
    <>
      <Path d="M12 15a3 3 0 100-6 3 3 0 000 6z" fill="none" stroke={c} strokeWidth={w} />
      <Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" fill="none" stroke={c} strokeWidth={w} />
    </>
  ),
};

function Icon({ name, size = 22, color = colors.ink, strokeWidth = 1.6 }: IconProps): React.ReactElement | null {
  const render = ICONS[name];
  if (!render) return null;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      {render(color, strokeWidth)}
    </Svg>
  );
}

export { Icon };
export default Icon;
