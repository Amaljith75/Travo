/** Travo design tokens — premium, calm, Kerala-green identity. */
export const colors = {
  forest: '#17382A',
  forestDeep: '#0F2A1E',
  emerald: '#2E6B4F',
  emeraldSoft: '#E3EEE7',
  sage: '#9DB8A6',
  sand: '#E9DFCC',
  sandSoft: '#F4EEE2',
  cream: '#FAF7F1',
  white: '#FFFFFF',
  charcoal: '#1F2326',
  ink: '#3B4146',
  muted: '#6E767C',
  faint: '#9AA2A8',
  line: '#E6E1D6',
  lineSoft: '#EFEBE2',
  gold: '#C48A2C',
  danger: '#B3412E',
  dangerSoft: '#F8E5E0',
  warning: '#A86A12',
  warningSoft: '#FBF0DA',
  info: '#2F5F8A',
  infoSoft: '#E4EDF6',
  overlay: 'rgba(15, 42, 30, 0.45)',
} as const;

export const spacing = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 48 } as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, pill: 999 } as const;

export const font = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const, letterSpacing: -0.4 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const, letterSpacing: -0.3 },
  heading: { fontSize: 17, lineHeight: 22, fontWeight: '600' as const, letterSpacing: -0.1 },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600' as const },
  small: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  smallStrong: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const },
  caption: { fontSize: 11, lineHeight: 14, fontWeight: '600' as const, letterSpacing: 0.4 },
};

export const shadow = {
  card: {
    shadowColor: '#0F2A1E',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  floating: {
    shadowColor: '#0F2A1E',
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
} as const;
