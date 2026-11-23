import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { UserProfile, ResearchReport, InventoryItem, QuotaInfo, CatalogProduct, RecommendResponse } from '../types';
import { storage } from '../storage';

declare const process: { env?: Record<string, string | undefined> };

const getOrigin = (): string => {
  const envUrl = process?.env?.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }
  if (Platform.OS === 'web') {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return `http://${host}:8000`;
  }
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  const ip = hostUri ? hostUri.split(':')[0] : 'localhost';
  return `http://${ip}:8000`;
};

export const API_ORIGIN = getOrigin();
const API = `${API_ORIGIN}/api/v1`;

export const imageUrl = (url?: string): string | undefined =>
  url ? (url.startsWith('/static') ? `${API_ORIGIN}${url}` : url) : undefined;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

class MiraApiClient {
  private token: string | null = storage.get('token');
  onUnauthorized: () => void = () => {};

  hasToken() {
    return !!this.token;
  }

  private setToken(token: string | null) {
    this.token = token;
    if (token) storage.set('token', token);
    else storage.remove('token');
  }

  logout() {
    this.setToken(null);
  }

  private async request<T>(path: string, init: RequestInit = {}, auth = true): Promise<T> {
    const headers: Record<string, string> = { ...(init.headers as Record<string, string>) };
    if (!headers['Content-Type'] && typeof init.body === 'string') headers['Content-Type'] = 'application/json';
    if (auth && this.token) headers.Authorization = `Bearer ${this.token}`;

    let res: Response;
    try {
      res = await fetch(`${API}${path}`, { ...init, headers });
    } catch {
      throw new ApiError(0, 'network');
    }
    if (res.status === 401 && auth) {
      this.logout();
      this.onUnauthorized();
    }
    if (!res.ok) {
      let detail = '';
      try {
        detail = (await res.json()).detail || '';
      } catch {}
      throw new ApiError(res.status, typeof detail === 'string' ? detail : '');
    }
    return res.status === 204 ? (undefined as T) : res.json();
  }

  async login(email: string, password: string) {
    const body = new URLSearchParams({ username: email, password }).toString();
    const data = await this.request<{ access_token: string }>(
      '/auth/login',
      { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body },
      false,
    );
    this.setToken(data.access_token);
  }

  async register(email: string, password: string) {
    await this.request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }, false);
    await this.login(email, password);
  }

  getCatalog(category?: string, q?: string) {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (q && q.trim()) params.set('q', q.trim());
    const qs = params.toString();
    return this.request<CatalogProduct[]>(`/catalog/${qs ? `?${qs}` : ''}`, {}, false);
  }

  lookupProduct(name: string) {
    return this.request<CatalogProduct | null>(`/catalog/lookup?name=${encodeURIComponent(name)}`, {}, false);
  }

  getDailyTop3(lang: string) {
    return this.request<RecommendResponse>(`/catalog/daily-top3?lang=${lang}`);
  }

  chatRecommend(prompt: string, lang: string, history: { role: string; text: string }[] = []) {
    return this.request<RecommendResponse>('/catalog/chat', {
      method: 'POST',
      body: JSON.stringify({ prompt, lang, history }),
    });
  }

  analyze(queryOrUrl: string, lang: string) {
    return this.request<ResearchReport>('/research/analyze', {
      method: 'POST',
      body: JSON.stringify({ query_or_url: queryOrUrl, lang }),
    });
  }

  getQuota() {
    return this.request<QuotaInfo>('/research/quota');
  }

  getProfile() {
    return this.request<UserProfile>('/profile/me');
  }

  updateProfile(profile: Partial<UserProfile>) {
    return this.request<UserProfile>('/profile/me', { method: 'PUT', body: JSON.stringify(profile) });
  }

  getInventory() {
    return this.request<InventoryItem[]>('/inventory/');
  }

  addInventoryItem(item: { product_name: string; brand?: string; category?: string; status?: string }) {
    return this.request<InventoryItem>('/inventory/', { method: 'POST', body: JSON.stringify(item) });
  }

  deleteInventoryItem(id: string) {
    return this.request<void>(`/inventory/${id}`, { method: 'DELETE' });
  }
}

export const apiClient = new MiraApiClient();
