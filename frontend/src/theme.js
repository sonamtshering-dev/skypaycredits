// src/theme.js
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CHANGE ONLY THIS FILE TO RETHEME THE ENTIRE SITE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const P  = '76,0,176'       // primary RGB — #4c00b0
const PD = '60,0,140'       // primary dark RGB

const theme = {
  primary:     `#4c00b0`,
  primaryDark: `#3c008c`,
  primaryGlow: `rgba(${P},0.35)`,

  grad:        `linear-gradient(135deg,#6d28d9,#4c00b0)`,
  gradSoft:    `linear-gradient(135deg,#7c3aed,#4c00b0)`,

  bg:          '#000000',
  bgCard:      'rgba(76,0,176,0.06)',
  bgCardHover: 'rgba(76,0,176,0.12)',

  border:      'rgba(255,255,255,0.1)',
  borderGlow:  `rgba(${P},0.4)`,

  text:        '#ffffff',
  textSub:     'rgba(255,255,255,0.5)',
  textMuted:   'rgba(255,255,255,0.25)',

  alpha:     (opacity) => `rgba(${P},${opacity})`,
  alphaDark: (opacity) => `rgba(${PD},${opacity})`,
}

export default theme
