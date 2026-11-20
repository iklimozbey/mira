export interface ThemeColors {
  background: string;
  cardBg: string;
  cardBgSecondary: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  headerBg: string;
  headerText: string;
  accent: string;
  accentPink: string;
  border: string;
  inputBg: string;
  inputBorder: string;
  inputText: string;
  proBg: string;
  proBorder: string;
  proText: string;
  conBg: string;
  conBorder: string;
  conText: string;
  warningBg: string;
  warningBorder: string;
  warningText: string;
  navBarBg: string;
  navBarBorder: string;
  navText: string;
  navTextActive: string;
  badgeBg: string;
  badgeText: string;
  divider: string;
  statusBar: 'light-content' | 'dark-content';
}

// Powder Pink & White/Mauve-Rose Luxury Beauty Palette
export const lightTheme: ThemeColors = {
  background: '#FAF7F9',        // Soft pearlescent white
  cardBg: '#FFFFFF',            // Crisp luxury white
  cardBgSecondary: '#F8EEF2',   // Delicate powder pink wash
  textPrimary: '#1F151C',       // Rich plum-noir espresso
  textSecondary: '#6B5461',     // Soft rose-taupe
  textMuted: '#9E8694',         // Muted mauve-dust
  headerBg: '#21151D',          // Luxury deep plum-noir header
  headerText: '#FFFFFF',
  accent: '#C87D8A',            // Elegant Powder Pink (Non-neon, Rose Poudré)
  accentPink: '#A65A76',        // Muted Plum-Rose Mauve blend
  border: '#EADCE3',            // Soft powder hairline border
  inputBg: '#FFFFFF',
  inputBorder: '#E0CDD6',
  inputText: '#1F151C',
  proBg: '#F0FDF4',
  proBorder: '#BBF7D0',
  proText: '#15803D',
  conBg: '#FFF1F2',
  conBorder: '#FECDD3',
  conText: '#BE123C',
  warningBg: '#FFFBEB',
  warningBorder: '#FDE68A',
  warningText: '#B45309',
  navBarBg: '#FFFFFF',
  navBarBorder: '#EADCE3',
  navText: '#886E7E',
  navTextActive: '#C87D8A',
  badgeBg: '#F8EEF2',
  badgeText: '#A65A76',
  divider: '#F1E5EC',
  statusBar: 'light-content',
};

export const darkTheme: ThemeColors = {
  background: '#120E11',        // Deep velvet noir
  cardBg: '#1A1418',            // Dark plum-charcoal card
  cardBgSecondary: '#261C23',   // Muted dark powder wash
  textPrimary: '#FAF5F8',       // Crisp porcelain
  textSecondary: '#BAA2AF',     // Powder rose-gray
  textMuted: '#826D7A',         // Soft muted plum
  headerBg: '#140E13',          // Velvet noir header
  headerText: '#FAF5F8',
  accent: '#DE93A0',            // Luminous Powder Pink (Pudra)
  accentPink: '#C4768F',        // Soft Plum-Pink
  border: '#382832',            // Dark powder hairline border
  inputBg: '#1F171D',
  inputBorder: '#47333F',
  inputText: '#FAF5F8',
  proBg: '#052E16',
  proBorder: '#14532D',
  proText: '#4ADE80',
  conBg: '#4C0519',
  conBorder: '#881337',
  conText: '#FB7185',
  warningBg: '#451A03',
  warningBorder: '#78350F',
  warningText: '#FCD34D',
  navBarBg: '#140E13',
  navBarBorder: '#382832',
  navText: '#826D7A',
  navTextActive: '#DE93A0',
  badgeBg: '#33202B',
  badgeText: '#DE93A0',
  divider: '#382832',
  statusBar: 'light-content',
};
