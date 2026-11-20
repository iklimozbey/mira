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

// Sephora-inspired Luxury Black & Pink Theme Palette
export const lightTheme: ThemeColors = {
  background: '#F8F9FA',
  cardBg: '#FFFFFF',
  cardBgSecondary: '#FFF1F5',
  textPrimary: '#0A0A0A',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  headerBg: '#000000',
  headerText: '#FFFFFF',
  accent: '#FF1493',       // Hot Luxury Pink
  accentPink: '#FF2E63',
  border: '#E5E7EB',
  inputBg: '#FFFFFF',
  inputBorder: '#D1D5DB',
  inputText: '#000000',
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
  navBarBorder: '#E5E7EB',
  navText: '#6B7280',
  navTextActive: '#FF1493',
  badgeBg: '#FFF1F5',
  badgeText: '#FF1493',
  divider: '#F3F4F6',
  statusBar: 'light-content',
};

export const darkTheme: ThemeColors = {
  background: '#09090B',
  cardBg: '#141416',
  cardBgSecondary: '#1F181B',
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  headerBg: '#000000',
  headerText: '#FFFFFF',
  accent: '#FF2E63',
  accentPink: '#FF3B6E',
  border: '#27272A',
  inputBg: '#18181B',
  inputBorder: '#3F3F46',
  inputText: '#FFFFFF',
  proBg: '#052E16',
  proBorder: '#14532D',
  proText: '#4ADE80',
  conBg: '#4C0519',
  conBorder: '#881337',
  conText: '#FB7185',
  warningBg: '#451A03',
  warningBorder: '#78350F',
  warningText: '#FCD34D',
  navBarBg: '#09090B',
  navBarBorder: '#27272A',
  navText: '#71717A',
  navTextActive: '#FF2E63',
  badgeBg: '#2A141D',
  badgeText: '#FF3B6E',
  divider: '#27272A',
  statusBar: 'light-content',
};
