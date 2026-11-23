export type Mode = 'dark' | 'light';

export interface Colors {
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  onAccent: string;
  success: string;
  warn: string;
  danger: string;
}

export const darkColors: Colors = {
  bg: '#0B0B0D',
  surface: '#141417',
  surface2: '#1C1C21',
  border: '#2A2A30',
  text: '#F4F4F5',
  muted: '#8E8E98',
  accent: '#E7A4B1',
  onAccent: '#1A0F12',
  success: '#5FD0A0',
  warn: '#E5B567',
  danger: '#E5707E',
};

export const lightColors: Colors = {
  bg: '#FAF6F7',
  surface: '#FFFFFF',
  surface2: '#F3EAEC',
  border: '#E8DADD',
  text: '#17161A',
  muted: '#77707A',
  accent: '#C7768A',
  onAccent: '#FFFFFF',
  success: '#2E9E73',
  warn: '#B98524',
  danger: '#C4485A',
};

export const colorsFor = (mode: Mode): Colors => (mode === 'dark' ? darkColors : lightColors);
