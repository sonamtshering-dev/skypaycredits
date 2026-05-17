// src/theme.js
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CHANGE ONLY THIS FILE TO RETHEME THE ENTIRE SITE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const P  = '0,170,255'      // primary RGB — Sky Blue
const PD = '0,140,230'      // primary dark RGB

const theme = {
  primary:     `#00aaff`,
  primaryDark: `#008ce6`,
  primaryGlow: `rgba(${P},0.35)`,

  grad:        `linear-gradient(135deg,#00aaff,#008ce6)`,
  gradSoft:    `linear-gradient(135deg,#00aaff,#38bdf8)`,

  bg:          '#060a0f',
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