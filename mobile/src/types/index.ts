export interface UserProfile {
  id?: string;
  user_id?: string;
  skin_type: string;
  skin_undertone: string;
  skin_concerns: string[];
  allergies_sensitivities: string[];
  budget_level: string;
}

export interface QuotaInfo {
  tier: string;
  daily_limit: number;
  used_today: number;
  remaining_today: number;
}

export interface InventoryItem {
  id: string;
  user_id: string;
  product_name: string;
  brand?: string;
  category?: string;
  status: string;
  rating?: number;
  experience_notes?: string;
  created_at: string;
}

export interface SourceItem {
  title: string;
  url: string;
  source_type: string;
  sentiment?: string;
}

export interface ProductSuggestionItem {
  product_name: string;
  brand: string;
  category: string;
  rating: number;
  review_count: number;
  image_url?: string;
  badge?: string;
  key_pro?: string;
  key_con?: string;
  finish_or_tag?: string;
  brief_highlight?: string;
  shade_hex?: string;
  shade_name?: string;
}

export interface DecisionEngineMetadata {
  engine: string;
  latency_ms: number;
  guardrails_passed: boolean;
  guardrail_violations: string[];
  verdict_choice: string;
  choice_confidence: number;
  calibrated_score: number;
  is_comedogenic_bool: boolean;
  is_barrier_safe_bool: boolean;
  is_shelf_duplicate_bool: boolean;
}

export interface ResearchReport {
  mode?: 'report' | 'suggestions';
  suggested_products?: ProductSuggestionItem[];
  disambiguation_message?: string;
  id?: string;
  query_id?: string;
  product_name?: string;
  summary?: string;
  pros?: string[];
  cons?: string[];
  clinical_warnings?: string[];
  suitability_score?: number;
  suitability_reason?: string;
  reality_check_verdict?: string;
  reality_check_reason?: string;
  decision_engine?: DecisionEngineMetadata;
  sources?: SourceItem[];
  sponsored_flags?: string[];
  created_at?: string;
}
