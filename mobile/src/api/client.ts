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
  private savedEmail = 'demo@mira.app';
  private savedPassword = 'mira1234';

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

  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    if (!this.token) {
      try {
        await this.login(this.savedEmail, this.savedPassword);
      } catch (e) {}
    }

    const mergedHeaders = {
      ...this.getHeaders(options.headers ? (options.headers as any)['Content-Type'] : 'application/json'),
      ...(options.headers as any),
    };
    let res = await fetch(url, { ...options, headers: mergedHeaders });

    if (res.status === 401) {
      // Auto self-heal: re-authenticate in background and retry request once
      try {
        await this.login(this.savedEmail, this.savedPassword);
        const retryHeaders = {
          ...this.getHeaders(options.headers ? (options.headers as any)['Content-Type'] : 'application/json'),
          ...(options.headers as any),
        };
        res = await fetch(url, { ...options, headers: retryHeaders });
      } catch (e) {}
    }
    return res;
  }

  async register(email: string, password: string): Promise<any> {
    this.savedEmail = email;
    this.savedPassword = password;
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
    this.savedEmail = email;
    this.savedPassword = password;
    const formBody = new URLSearchParams();
    formBody.append('username', email);
    formBody.append('password', password);

    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
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
    const res = await this.fetchWithAuth(`${API_BASE_URL}/auth/export-data`);
    if (!res.ok) throw new Error('Failed to export data');
    return res.json();
  }

  async deleteAccount(): Promise<void> {
    const res = await this.fetchWithAuth(`${API_BASE_URL}/auth/delete-account`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete account');
    this.token = null;
  }

  async getQuota(): Promise<QuotaInfo> {
    const res = await this.fetchWithAuth(`${API_BASE_URL}/research/quota`);
    if (!res.ok) throw new Error('Failed to fetch quota');
    return res.json();
  }

  async getProfile(): Promise<UserProfile> {
    const res = await this.fetchWithAuth(`${API_BASE_URL}/profile/me`);
    if (!res.ok) throw new Error('Failed to load profile');
    return res.json();
  }

  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const res = await this.fetchWithAuth(`${API_BASE_URL}/profile/me`, {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  }

  async analyzeProduct(queryOrUrl: string): Promise<ResearchReport> {
    const res = await this.fetchWithAuth(`${API_BASE_URL}/research/analyze`, {
      method: 'POST',
      body: JSON.stringify({ query_or_url: queryOrUrl }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to analyze product');
    }
    return res.json();
  }

  async getHistory(): Promise<ResearchReport[]> {
    const res = await this.fetchWithAuth(`${API_BASE_URL}/research/history`);
    if (!res.ok) throw new Error('Failed to fetch history');
    return res.json();
  }

  async getInventory(): Promise<InventoryItem[]> {
    const res = await this.fetchWithAuth(`${API_BASE_URL}/inventory/`);
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
    const res = await this.fetchWithAuth(`${API_BASE_URL}/inventory/`, {
      method: 'POST',
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error('Failed to add item to inventory');
    return res.json();
  }

  async deleteInventoryItem(id: string): Promise<void> {
    const res = await this.fetchWithAuth(`${API_BASE_URL}/inventory/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete item from inventory');
  }
}

export const apiClient = new MiraApiClient();
