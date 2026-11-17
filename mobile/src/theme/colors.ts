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

export const lightTheme: ThemeColors = {
  background: '#FAF6F4',
  cardBg: '#FFFFFF',
  cardBgSecondary: '#FAF0F4',
  textPrimary: '#1F141B',
  textSecondary: '#685A62',
  textMuted: '#9E8D96',
  headerBg: '#6D4658',
  headerText: '#FFFFFF',
  accent: '#7A4D62',
  border: '#EFE5EA',
  inputBg: '#FFFFFF',
  inputBorder: '#E8DCE1',
  inputText: '#2E1E26',
  proBg: '#F0FDF4',
  proBorder: '#DCFCE7',
  proText: '#15803D',
  conBg: '#FEF2F2',
  conBorder: '#FEE2E2',
  conText: '#B91C1C',
  warningBg: '#FFFBEB',
  warningBorder: '#FDE68A',
  warningText: '#92400E',
  navBarBg: '#FFFFFF',
  navBarBorder: '#EFE5EA',
  navText: '#888888',
  navTextActive: '#7A4D62',
  badgeBg: '#F5EBF0',
  badgeText: '#7A4D62',
  divider: '#F0E5EB',
  statusBar: 'light-content',
};

export const darkTheme: ThemeColors = {
  background: '#131012',
  cardBg: '#1E191C',
  cardBgSecondary: '#291F24',
  textPrimary: '#F6EFF3',
  textSecondary: '#BDB1B8',
  textMuted: '#85777F',
  headerBg: '#23181E',
  headerText: '#FBEFF5',
  accent: '#C77999',
  border: '#33272E',
  inputBg: '#261F23',
  inputBorder: '#42333C',
  inputText: '#F6EFF3',
  proBg: '#13281B',
  proBorder: '#1B4728',
  proText: '#4ADE80',
  conBg: '#2E1317',
  conBorder: '#4E1B21',
  conText: '#F87171',
  warningBg: '#2B210F',
  warningBorder: '#4A3715',
  warningText: '#FBBF24',
  navBarBg: '#1A1518',
  navBarBorder: '#2E2229',
  navText: '#7A6E75',
  navTextActive: '#E8A3BE',
  badgeBg: '#33212B',
  badgeText: '#E8A3BE',
  divider: '#2E2229',
  statusBar: 'light-content',
};
