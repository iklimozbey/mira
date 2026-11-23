export interface UserProfile {
  id?: string;
  user_id?: string;
  skin_type: string | null;
  skin_undertone: string | null;
  skin_concerns: string[];
  allergies_sensitivities: string[];
  budget_level: string | null;
  budget_max?: number | null;
  onboarding_completed?: boolean;
}

export interface QuotaInfo {
  tier: string;
  daily_limit: number;
  used_today: number;
  remaining_today: number;
}

export interface InventoryItem {
  id: string;
  product_name: string;
  brand?: string | null;
  category?: string | null;
  status: string;
  created_at: string;
}

export interface CatalogProduct {
  product_name: string;
  brand: string;
  category: string;
  price?: number;
  rating: number;
  review_count: number;
  image_url?: string;
  shade_hex?: string;
  shade_name?: string;
  fit_score?: number;
  match_reason?: string;
}

export interface RecommendResponse {
  reply: string;
  products: CatalogProduct[];
}

export interface SourceItem {
  title: string;
  url: string;
}

export interface ResearchReport {
  mode?: 'report' | 'suggestions';
  suggested_products?: CatalogProduct[];
  disambiguation_message?: string;
  product_name?: string;
  summary?: string;
  pros?: string[];
  cons?: string[];
  clinical_warnings?: string[];
  suitability_score?: number;
  suitability_reason?: string;
  reality_check_verdict?: string;
  reality_check_reason?: string;
  sources?: SourceItem[];
}
