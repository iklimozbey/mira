export interface UserProfile {
  id?: string;
  user_id?: string;
  skin_type: string;
  skin_undertone: string;
  skin_concerns: string[];
  allergies_sensitivities: string[];
  budget_level: string;
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

export interface ResearchReport {
  id: string;
  query_id: string;
  product_name: string;
  summary: string;
  pros: string[];
  cons: string[];
  suitability_score: number;
  suitability_reason: string;
  reality_check_verdict: string;
  reality_check_reason?: string;
  sources: SourceItem[];
  sponsored_flags: string[];
  created_at: string;
}
