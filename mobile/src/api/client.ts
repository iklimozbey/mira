import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { UserProfile, ResearchReport, InventoryItem, QuotaInfo } from '../types';

// Dynamic host detection: use host IP from Expo Go on mobile, localhost on Web, or current WiFi IP fallback
const getBaseUrl = (): string => {
  if (Platform.OS === 'web') {
    return 'http://localhost:8000/api/v1';
  }
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  const ip = hostUri ? hostUri.split(':')[0] : '192.168.43.158';
  return `http://${ip}:8000/api/v1`;
};

const API_BASE_URL = getBaseUrl();
export const STATIC_ASSETS_URL = API_BASE_URL.replace('/api/v1', '/static/images');

class MiraApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private getHeaders(contentType = 'application/json'): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': contentType,
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async register(email: string, password: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Registration failed');
    }
    return res.json();
  }

  async login(email: string, password: string): Promise<string> {
    const formBody = new URLSearchParams();
    formBody.append('username', email);
    formBody.append('password', password);

    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders('application/x-www-form-urlencoded'),
      body: formBody.toString(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Login failed');
    }
    const data = await res.json();
    this.token = data.access_token;
    return data.access_token;
  }

  async exportMyData(): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/auth/export-data`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to export data');
    return res.json();
  }

  async deleteAccount(): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/auth/delete-account`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete account');
    this.token = null;
  }

  async getQuota(): Promise<QuotaInfo> {
    const res = await fetch(`${API_BASE_URL}/research/quota`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch quota');
    return res.json();
  }

  async getProfile(): Promise<UserProfile> {
    const res = await fetch(`${API_BASE_URL}/profile/me`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load profile');
    return res.json();
  }

  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const res = await fetch(`${API_BASE_URL}/profile/me`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(profile),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  }

  async analyzeProduct(queryOrUrl: string): Promise<ResearchReport> {
    const res = await fetch(`${API_BASE_URL}/research/analyze`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ query_or_url: queryOrUrl }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to analyze product');
    }
    return res.json();
  }

  async getHistory(): Promise<ResearchReport[]> {
    const res = await fetch(`${API_BASE_URL}/research/history`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch history');
    return res.json();
  }

  async getInventory(): Promise<InventoryItem[]> {
    const res = await fetch(`${API_BASE_URL}/inventory/`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch inventory');
    return res.json();
  }

  async addInventoryItem(item: {
    product_name: string;
    brand?: string;
    category?: string;
    status?: string;
    rating?: number;
    experience_notes?: string;
  }): Promise<InventoryItem> {
    const res = await fetch(`${API_BASE_URL}/inventory/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error('Failed to add inventory item');
    return res.json();
  }

  async deleteInventoryItem(itemId: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/inventory/${itemId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete item');
  }
}

export const apiClient = new MiraApiClient();
