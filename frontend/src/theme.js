// src/theme.js
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CHANGE ONLY THIS FILE TO RETHEME THE ENTIRE SITE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const P = '249,115,22'      // primary RGB — change this one value to retheme
const PD = '234,106,16'     // primary dark RGB

const theme = {
  primary:     `#f97316`,
  primaryDark: `#ea6a10`,
  primaryGlow: `rgba(${P},0.35)`,

  grad:        `linear-gradient(135deg,#f97316,#ea6a10)`,
  gradSoft:    `linear-gradient(135deg,#f97316,#fbbf24)`,

  bg:          '#0a0a0a',
  bgCard:      'rgba(255,255,255,0.06)',
  bgCardHover: 'rgba(255,255,255,0.1)',

  border:      'rgba(255,255,255,0.1)',
  borderGlow:  `rgba(${P},0.4)`,

  text:        '#ffffff',
  textSub:     'rgba(255,255,255,0.5)',
  textMuted:   'rgba(255,255,255,0.25)',

  // Helper — use like theme.alpha(0.2) to get rgba with opacity
  alpha: (opacity) => `rgba(${P},${opacity})`,
  alphaDark: (opacity) => `rgba(${PD},${opacity})`,
}

export default theme