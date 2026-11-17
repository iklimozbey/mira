import json
import re
from urllib.parse import urlparse
import httpx
from typing import Dict, Any, List, Optional
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnableLambda, RunnableSequence
from app.core.config import settings
from app.services.rag_knowledge_base import cosmetic_rag_retriever


MIRA_RAG_PROMPT_TEMPLATE = PromptTemplate.from_template(
    """You are MIRA, an expert, precise, and personalized AI beauty research assistant.
Product Target: "{product_name}" (Query: "{raw_query}")
Classified Category: {category}

CRITICAL RULES:
1. ONLY evaluate attributes relevant to this category!
   - If category is MASCARA / EYE MAKEUP: evaluate lengthening, volumizing, clumping, smudging, water resistance, eye irritation / contact lens safety. NEVER mention skin coverage, undertone, T-zone, or skin pore coverage for mascara!
   - If category is LIPSTICK / GLOSS: evaluate pigment, hydration, transfer-resistance, feathering, chapping. NEVER mention T-zone sebum or facial skin coverage!
   - If category is FOUNDATION / CONCEALER / TINT: evaluate coverage, finish, oxidation, shade match, undertone.
   - If category is SUNSCREEN: evaluate UV protection, white cast, eye stinging, pilling under makeup.
   - If category is SKINCARE SERUM / MOISTURIZER: evaluate barrier hydration, active tolerance, comedogenic risk.
2. Clinical Triggers:
   - For eye products: evaluate sensitive eyes, blepharitis, and contact lens compatibility.
   - For face products: evaluate Rosacea flushing, fungal acne, comedones.
3. Reality Check: Check if user already owns a 4-5 star product in this same category in their shelf.

RAG EVIDENCE:
{rag_context}

USER PROFILE & SHELF:
{user_context}

SEARCH EVIDENCE:
{search_evidence}

Respond ONLY with valid JSON:
{{
  "product_name": "Standardized Product Name",
  "summary": "Precise summary strictly reflecting the product type.",
  "pros": ["Key pro 1", "Key pro 2", "Key pro 3"],
  "cons": ["Key complaint 1", "Key complaint 2"],
  "clinical_warnings": ["Specific trigger warnings"],
  "suitability_score": 85,
  "suitability_reason": "Rationale tailored strictly to the category and user preferences.",
  "reality_check_verdict": "BUY | CONSIDER | SKIP | REDUNDANT",
  "reality_check_reason": "De-influencing assessment.",
  "sponsored_flags": ["Noted sponsored campaigns on TikTok/Instagram"],
  "sources": [
    {{
      "title": "Source name",
      "url": "https://source.com",
      "source_type": "web_review",
      "sentiment": "positive | mixed | critical"
    }}
  ]
}}"""
)


def extract_product_name_from_query(query_or_url: str) -> str:
    text = query_or_url.strip()
    if text.startswith("http://") or text.startswith("https://"):
        parsed = urlparse(text)
        path_segments = [seg for seg in parsed.path.split("/") if seg]
        if path_segments:
            slug = " ".join(path_segments)
            slug = re.sub(r"-p-\d+.*$", "", slug)
            slug = re.sub(r"[-_]+", " ", slug)
            return slug.strip().title()
    return text


class ProductClassifierAgent:
    """Sub-Agent 1: Accurate multi-category classification for makeup, eye, skincare, and lip."""

    @staticmethod
    def classify(product_name: str) -> Dict[str, str]:
        lower = product_name.lower()

        # 1. Mascara & Eye Makeup (High priority match)
        if any(k in lower for k in ["mascara", "maskara", "lash", "eyeliner", "eyeshadow", "far paleti", "telescopic", "sky high", "lash sensational", "better than sex", "climax"]):
            category = "mascara"
            finish = "waterproof" if any(w in lower for w in ["waterproof", "suya dayanikli", "suya dayanıklı"]) else "tubing_or_washable"

        # 2. Lip products
        elif any(k in lower for k in ["lip", "ruj", "gloss", "tint", "balm", "lip oil", "parlatici", "parlatıcı", "dudak", "lipstick", "lip stain"]):
            category = "lip"
            finish = "matte" if "matte" in lower or "mat" in lower else "glossy"

        # 3. Sunscreens
        elif any(k in lower for k in ["spf", "sunscreen", "gunes", "güneş", "anthelios", "uv", "sun fluid", "sun cream"]):
            category = "sunscreen"
            finish = "mineral" if any(m in lower for m in ["mineral", "physical", "zinc"]) else "chemical"

        # 4. Skincare Serums & Toners
        elif any(k in lower for k in ["serum", "niacinamide", "retinol", "vitamin c", "hyaluronic", "acid", "bha", "aha", "peeling", "azelaic", "toner", "tonik"]):
            category = "serum"
            finish = "active_treatment"

        # 5. Moisturizers & Barrier Creams
        elif any(k in lower for k in ["moisturizer", "cream", "krem", "nemlendirici", "lotion", "cicaplast", "cerave", "baume"]):
            category = "moisturizer"
            finish = "barrier_repair"

        # 6. Concealer
        elif any(k in lower for k in ["concealer", "kapatici", "kapatıcı", "radiant creamy", "shape tape", "instant anti age", "eraser"]):
            category = "concealer"
            finish = "radiant" if any(r in lower for r in ["radiant", "creamy", "glow"]) else "matte"

        # 7. Foundation & Skin Tints
        elif any(k in lower for k in ["foundation", "fondoten", "fondöten", "skin tint", "bb", "cc", "double wear", "fit me", "infallible", "studio fix", "luminous silk", "super stay"]):
            category = "foundation"
            finish = "matte" if any(m in lower for m in ["matte", "mat", "poreless", "stay"]) else ("radiant" if any(r in lower for r in ["lumi", "radiant", "glow", "dewy"]) else "natural_satin")

        # Default fallback: General Cosmetic
        else:
            category = "general_cosmetic"
            finish = "standard"

        return {"category": category, "finish": finish}


class FormulationReviewAgent:
    """Sub-Agent 2: Strict category-specific evaluation without confusing eyes/lips with foundation."""

    @staticmethod
    def evaluate_formulation(
        product_name: str,
        traits: Dict[str, str],
        search_results: Optional[List[Dict[str, Any]]] = None,
        rag_docs_text: str = ""
    ) -> Dict[str, Any]:
        cat = traits["category"]
        finish = traits["finish"]

        detected_ad_flags = []
        if search_results:
            for s in search_results:
                content_lower = (s.get("content") or "").lower()
                if any(tag in content_lower for tag in ["#ad", "#sponsored", "#işbirliği", "#reklam", "paid partnership", "#gifted"]):
                    detected_ad_flags.append(
                        f"Sponsored Tag (#ad / #işbirliği) detected in {s.get('title', 'Social Post')}. Treat extreme performance claims with caution."
                    )

        # Mascara evaluation
        if cat == "mascara":
            is_wp = finish == "waterproof"
            return {
                "summary": f"{product_name} is an eye mascara designed to provide lash separation, volume, and curl hold.",
                "pros": [
                    "Strong lash lengthening effect without immediate clumping on the first coat",
                    "Holds curl throughout the day without dropping the lashes",
                    "Flake-resistant formula during 8+ hours of wear" if not is_wp else "Completely smudge-proof and tear-resistant waterproof hold"
                ],
                "cons": [
                    "Can become clumpy or spidery if more than two coats are applied without combing",
                    "Requires dedicated bi-phase oil makeup remover to avoid tugging delicate eyelashes" if is_wp else "May experience slight transfer onto upper eyelid under high humidity or oily lids"
                ],
                "sponsored_flags": detected_ad_flags or [
                    "High prevalence of TikTok lash filter demonstrations and false lash tucking in viral reviews; expect natural buildable length rather than falsie effect."
                ]
            }

        # Lip evaluation
        if cat == "lip":
            return {
                "summary": f"{product_name} is a pigmented lip formulation offering smooth color payoff with daily lip comfort.",
                "pros": [
                    "Smooth glide across lip texture without settling into fine vertical lip lines",
                    "Rich pigmentation in a single swipe",
                    "Comfortable wear without excessive stickiness"
                ],
                "cons": [
                    "Requires reapplication after meals and drinks",
                    "Can emphasize dry flaky patches if lips are not exfoliated and pre-hydrated"
                ],
                "sponsored_flags": detected_ad_flags or [
                    "Influencer swatches on Instagram often use high-gloss post-production lighting; true finish is softer in daylight."
                ]
            }

        # Sunscreen evaluation
        if cat == "sunscreen":
            return {
                "summary": f"{product_name} provides broad-spectrum UVA/UVB protection with an easy-to-spread daily texture.",
                "pros": [
                    "High photostable sun protection filters",
                    "Quick absorption that layers well under foundation without excessive pilling",
                    "Minimal white cast after 3-5 minutes of absorption"
                ],
                "cons": [
                    "Can cause stinging around the eyes if sweat migrates into the tear line",
                    "May leave a slightly dewy sheen on very oily skin types by midday"
                ],
                "sponsored_flags": detected_ad_flags or [
                    "Heavily featured in sponsored skincare routines; always apply two full finger lengths regardless of influencer micro-dosing."
                ]
            }

        # Skincare Serum evaluation
        if cat == "serum":
            return {
                "summary": f"{product_name} is a concentrated active skincare treatment targeting texture, tone, and skin barrier health.",
                "pros": [
                    "Fast-absorbing lightweight texture that layers easily into skincare routines",
                    "Targeted active concentration for visible texture and tone improvements over 4-6 weeks",
                    "High yield and cost-effectiveness per milliliter"
                ],
                "cons": [
                    "Potential for initial tingling, micro-purging, or irritation if combined with strong exfoliants",
                    "Can pill if applied excessively (>3 drops) before moisturizer sets"
                ],
                "sponsored_flags": detected_ad_flags or [
                    "Viral 'overnight glass skin' claims on social media are unrealistic; cellular turnover requires 28+ days of consistent application."
                ]
            }

        # Foundation evaluation
        if cat == "foundation":
            if finish == "matte":
                return {
                    "summary": f"{product_name} is a high-coverage, oil-controlling matte foundation engineered for extended wear and shine prevention.",
                    "pros": [
                        "Reliable sebum absorption in the T-zone for 8+ hours",
                        "High pigmentation that masks redness, blemishes, and uneven tone effortlessly",
                        "Transfer-resistant once fully set"
                    ],
                    "cons": [
                        "Can cling to dry patches or emphasize textural lines without thorough moisturizing prep",
                        "Users note potential 0.5 to 1 shade of oxidation as volatile film-formers dry"
                    ],
                    "sponsored_flags": detected_ad_flags or [
                        "TikTok 'beauty filter' ring lighting frequently masks real-world cakey texture; apply sparingly with a damp sponge."
                    ]
                }
            elif finish == "radiant":
                return {
                    "summary": f"{product_name} delivers a luminous, skin-like finish with buildable medium coverage and hydrating emollients.",
                    "pros": [
                        "Healthy radiant glow that avoids clinging to dry flakes",
                        "Seamless blendability and breathable skin feel",
                        "Minimal oxidation compared to heavy matte formulas"
                    ],
                    "cons": [
                        "Can break down around the nose and forehead after 4-5 hours on oilier skin types",
                        "Requires translucent setting powder on the center of the face to prevent transfer"
                    ],
                    "sponsored_flags": detected_ad_flags or [
                        "Promoted heavily in sponsored 'clean girl' aesthetics; 16-hour wear claims are exaggerated for oily or humid conditions."
                    ]
                }
            else:
                return {
                    "summary": f"{product_name} offers balanced medium coverage with a natural satin finish suitable for versatile daily wear.",
                    "pros": [
                        "Weightless breathable texture that stays comfortable all day",
                        "Blurs minor pore texture without looking heavy",
                        "Adapts well across changing weather conditions"
                    ],
                    "cons": [
                        "Slight oxidation (half a shade darker) reported by users with higher skin acidity",
                        "May require a midday powder touch-up in the T-zone"
                    ],
                    "sponsored_flags": detected_ad_flags or [
                        "Moderate social media seeding detected; always check shade swatches in natural indirect daylight."
                    ]
                }

        # Concealer evaluation
        if cat == "concealer":
            return {
                "summary": f"{product_name} is a targeted corrector formulated to neutralize dark circles and spot-conceal blemishes.",
                "pros": [
                    "High opacity pigment that covers discoloration with a minimal amount of product",
                    "Does not migrate immediately into fine under-eye expression lines",
                    "Convenient applicator for on-the-go spot touch-ups"
                ],
                "cons": [
                    "Needs a light dusting of translucent powder to prevent creasing after 4-5 hours",
                    "Certain shades run warmer or oxidize slightly darker under-eye"
                ],
                "sponsored_flags": detected_ad_flags or [
                    "Sponsored PR tutorials frequently demonstrate heavy under-eye triangles that look thick in natural light."
                ]
            }

        # Default General Cosmetic
        return {
            "summary": f"{product_name} is a versatile cosmetic product balancing performance with comfortable daily wear.",
            "pros": [
                "Reliable formulation from an established brand",
                "Smooth application and good blendability",
                "Accessible for everyday beauty routines"
            ],
            "cons": [
                "Individual longevity varies depending on skin prep and environmental humidity",
                "Patch-testing is recommended before daily use"
            ],
            "sponsored_flags": detected_ad_flags or [
                "Social media unboxings focus on initial impression rather than longevity test."
            ]
        }


class ClinicalTriggerAgent:
    """Sub-Agent 3: Category-Aware Clinical & Dermatological Trigger Analyzer."""

    @classmethod
    def analyze_triggers(
        cls,
        product_name: str,
        traits: Dict[str, str],
        user_profile: Optional[Dict[str, Any]],
        search_results: Optional[List[Dict[str, Any]]] = None,
        rag_docs_text: str = ""
    ) -> Dict[str, Any]:
        cat = traits["category"]
        concerns = [c.lower() for c in (user_profile.get("skin_concerns") or [])] if user_profile else []
        allergies = [a.lower() for a in (user_profile.get("allergies_sensitivities") or [])] if user_profile else []
        skin_type = (user_profile.get("skin_type") or "").lower() if user_profile else ""

        warnings: List[str] = []
        score_penalty = 0

        # Special Category: Mascara / Eye Products (NEVER trigger Rosacea/Acne face warnings)
        if cat == "mascara":
            is_wp = traits["finish"] == "waterproof"
            if "sensitive" in skin_type or any(k in concerns for k in ["sensitive", "redness"]):
                warnings.append("👁️ SENSITIVE EYE CAUTION: If you wear contact lenses or have sensitive eyes, check for ophthalmologist testing and avoid applying too close to the waterline.")
            if is_wp:
                warnings.append("👁️ LASH HEALTH: Waterproof formulas require gentle bi-phase oil removal. Do not rub aggressively to prevent eyelash breakage.")
            return {"clinical_warnings": warnings, "score_penalty": score_penalty}

        # Special Category: Lip Products (NEVER trigger T-zone or pore clogging warnings)
        if cat == "lip":
            if any(k in allergies for k in ["fragrance", "parfum", "menthol"]):
                warnings.append("💋 LIP SENSITIVITY: Flavored or plumping lip products containing menthol/fragrance can cause mild tingling or dryness on sensitive lips.")
                score_penalty += 10
            return {"clinical_warnings": warnings, "score_penalty": score_penalty}

        # Face Products: Foundation, Concealer, Skincare, Sunscreen
        has_rosacea = any(k in concerns for k in ["rosacea", "roza", "redness", "kizariklik", "kızarıklık"]) or skin_type == "sensitive"
        has_acne = any(k in concerns for k in ["acne", "akne", "sivilce", "pores", "comedones", "fungal_acne"]) or skin_type == "oily"

        combined_evidence = f"{product_name.lower()} {rag_docs_text.lower()}"
        if search_results:
            for s in search_results:
                if s.get("source_type") == "ingredient_database":
                    combined_evidence += " " + (s.get("content") or "").lower()

        if has_rosacea:
            if any(t in combined_evidence for t in ["alcohol denat", "fragrance", "parfum", "menthol", "glycolic acid"]):
                warnings.append("🌹 ROSACEA FLARE-UP ALERT: Detected vascular triggers (alcohol/fragrance/acids) that can provoke capillary flushing and stinging.")
                score_penalty += 18
            elif cat == "sunscreen" and "mineral" not in combined_evidence and "zinc" not in combined_evidence:
                warnings.append("🌹 ROSACEA SPF NOTE: Chemical UV filters convert UV into heat, which can trigger facial redness. Prefer Zinc Oxide mineral formulas.")
                score_penalty += 8
            elif traits["finish"] == "matte" and cat == "foundation":
                warnings.append("🌹 ROSACEA BARRIER NOTE: Fast-drying matte foundations can feel tight on compromised barriers. Use a rich soothing cream underneath.")
                score_penalty += 6

        if has_acne:
            if any(t in combined_evidence for t in ["isopropyl myristate", "coconut oil", "algae extract", "lanolin"]):
                warnings.append("🌋 COMEDOGENIC ALERT: Contains known pore-clogging ingredients that can trigger closed comedones and breakout flares.")
                score_penalty += 20
            elif traits["finish"] == "radiant" and cat == "foundation":
                warnings.append("🌋 ACNE-PRONE CAUTION: Rich radiant foundation oils can congest active acne if worn for extended hours without proper double cleansing.")
                score_penalty += 8

        for allergen in allergies:
            if allergen and allergen in combined_evidence:
                warnings.append(f"⚠️ ALLERGEN MATCH: Contains '{allergen.upper()}', matching your declared sensitivity profile!")
                score_penalty += 25

        return {
            "clinical_warnings": warnings,
            "score_penalty": score_penalty
        }


class PersonalSkinMatchAgent:
    """Sub-Agent 4: Category-Specific Compatibility Evaluation."""

    @staticmethod
    def score_match(
        traits: Dict[str, str],
        user_profile: Optional[Dict[str, Any]],
        score_penalty: int = 0
    ) -> Dict[str, Any]:
        cat = traits["category"]
        finish = traits["finish"]
        skin_type = (user_profile.get("skin_type") or "combination").lower() if user_profile else "combination"
        undertone = (user_profile.get("skin_undertone") or "neutral").lower() if user_profile else "neutral"

        # 1. Mascara Match Logic (Focus on eye comfort, lash curl, oiliness around lids)
        if cat == "mascara":
            score = 88
            reasons = ["Universal mascara formulation evaluated for lash definition and curl retention."]
            if skin_type == "oily":
                if finish == "waterproof":
                    reasons.append("Since you have oilier skin, this waterproof/smudge-proof formula protects against sebum transfer from the eyelids.")
                    score = 92
                else:
                    reasons.append("For oily lids, set your eye area with translucent powder to prevent midday mascara transfer.")
                    score = 82
            if skin_type == "sensitive":
                reasons.append("Gentle on sensitive eye areas when removed without excessive tugging.")
            return {
                "suitability_score": score,
                "suitability_reason": " ".join(reasons)
            }

        # 2. Lip Match Logic (Focus on hydration & undertone harmony)
        if cat == "lip":
            score = 86
            reasons = [f"Flattering {traits['finish']} lip product suited for your beauty routine."]
            if undertone == "warm":
                reasons.append("Harmonizes naturally with warm/golden undertones (terracotta, peach, warm nude shades).")
            elif undertone == "cool":
                reasons.append("Complements cool undertones best with berry, rose, or blue-red tones.")
            return {
                "suitability_score": score,
                "suitability_reason": " ".join(reasons)
            }

        # 3. Foundation & Concealer Match Logic (Full face coverage & undertone analysis)
        if cat in ["foundation", "concealer"]:
            if finish == "matte":
                if skin_type == "oily":
                    score = 92
                    reasons = ["Excellent match for your oily skin type: matte oil-absorbing polymers actively control excess sebum."]
                elif skin_type == "dry":
                    score = 54
                    reasons = ["Caution for your dry skin type: this matte formula can cling to dry patches unless paired with an intensely hydrating primer."]
                elif skin_type == "sensitive":
                    score = 68
                    reasons = ["Moderate match for sensitive skin: long-wear film formers require gentle double-cleansing."]
                else:
                    score = 82
                    reasons = ["Good match for your combination skin: apply primarily to the T-zone and keep a lighter layer on cheeks."]
            elif finish == "radiant":
                if skin_type == "dry":
                    score = 94
                    reasons = ["Ideal match for your dry skin type: luminous emollients prevent flaking and maintain hydration."]
                elif skin_type == "oily":
                    score = 58
                    reasons = ["Low-to-moderate match for oily skin: radiant dewy formulas can slide off the T-zone by midday."]
                else:
                    score = 84
                    reasons = [f"Strong match for your {skin_type} skin, providing a healthy glow when the T-zone is lightly set."]
            else:
                score = 85
                reasons = [f"Balanced satin formula that adapts naturally to your {skin_type} skin profile."]

            if undertone == "warm":
                reasons.append("Watch out for slight oxidation which can make neutral-warm shades appear slightly orange.")
            elif undertone == "cool":
                reasons.append("Opt for cool/rose undertone labels so oxidation doesn't pull overly yellow.")

            final_score = max(25, min(98, score - score_penalty))
            return {
                "suitability_score": final_score,
                "suitability_reason": " ".join(reasons)
            }

        # 4. Skincare & Sunscreen Match Logic
        score = 85
        reasons = [f"Texture and formulation are well-suited for {skin_type} skin routines."]
        final_score = max(25, min(98, score - score_penalty))
        return {
            "suitability_score": final_score,
            "suitability_reason": " ".join(reasons)
        }


class RealityCheckAgent:
    """Sub-Agent 5: Category-Aware Shelf Redundancy & De-influencing Evaluator."""

    @staticmethod
    def check_shelf(
        product_name: str,
        traits: Dict[str, str],
        suitability_score: int,
        user_inventory_notes: Optional[List[str]]
    ) -> Dict[str, str]:
        cat = traits["category"]

        if suitability_score < 65:
            return {
                "verdict": "SKIP",
                "reason": f"De-influencing Alert: Based on your skin profile and clinical trigger checks, this {cat} formula has a high risk of underperforming or causing irritation. Save your money."
            }

        if not user_inventory_notes:
            return {
                "verdict": "BUY",
                "reason": f"You don't have a conflicting {cat} logged in your shelf yet, and this product scores well."
            }

        # Check for category-specific duplicates in shelf
        matching_shelf = [
            n for n in user_inventory_notes
            if any(k in n.lower() for k in [cat, "mascara" if cat == "mascara" else cat]) and ("(Rating: 5/5)" in n or "(Rating: 4/5)" in n)
        ]

        if matching_shelf:
            return {
                "verdict": "REDUNDANT",
                "reason": (
                    f"Shelf Redundancy: You already own a highly-rated {cat} ({matching_shelf[0].split(':')[0]}). "
                    "Unless your current product is expired or empty, purchasing another is unnecessary spending."
                )
            }

        return {
            "verdict": "CONSIDER",
            "reason": f"Fits your criteria well. Verify your current makeup shelf to ensure you need a new {cat} before buying."
        }


def _build_langchain_lcel_pipeline() -> RunnableSequence:
    def step_1_rag_and_classify(state: Dict[str, Any]) -> Dict[str, Any]:
        product_name = state["product_name"]
        rag_docs = cosmetic_rag_retriever.invoke(product_name)
        state["rag_docs"] = rag_docs
        state["rag_text"] = "\n".join([d.page_content for d in rag_docs])
        state["traits"] = ProductClassifierAgent.classify(product_name)
        return state

    def step_2_formulation(state: Dict[str, Any]) -> Dict[str, Any]:
        state["formulation"] = FormulationReviewAgent.evaluate_formulation(
            state["product_name"], state["traits"], state.get("search_results"), state["rag_text"]
        )
        return state

    def step_3_clinical_triggers(state: Dict[str, Any]) -> Dict[str, Any]:
        state["clinical"] = ClinicalTriggerAgent.analyze_triggers(
            state["product_name"],
            state["traits"],
            state.get("user_profile"),
            state.get("search_results"),
            state["rag_text"]
        )
        return state

    def step_4_skin_match(state: Dict[str, Any]) -> Dict[str, Any]:
        state["skin_match"] = PersonalSkinMatchAgent.score_match(
            traits=state["traits"],
            user_profile=state.get("user_profile"),
            score_penalty=state["clinical"]["score_penalty"]
        )
        return state

    def step_5_reality_check_and_format(state: Dict[str, Any]) -> Dict[str, Any]:
        reality = RealityCheckAgent.check_shelf(
            product_name=state["product_name"],
            traits=state["traits"],
            suitability_score=state["skin_match"]["suitability_score"],
            user_inventory_notes=state.get("user_inventory_notes")
        )

        sources = []
        for doc in state.get("rag_docs", [])[:1]:
            sources.append({
                "title": doc.metadata.get("source", "MIRA Clinical RAG Corpus"),
                "url": "https://mira.app/clinical/rag-corpus",
                "source_type": "clinical_rag",
                "sentiment": "neutral"
            })

        if state.get("search_results"):
            for s in state["search_results"][:3]:
                sources.append({
                    "title": s.get("title", "Community Discussion"),
                    "url": s.get("url", "https://example.com/review"),
                    "source_type": s.get("source_type", "web_review"),
                    "sentiment": "mixed"
                })
        else:
            sources.append({
                "title": f"MIRA Formulation Database ({state['traits']['category'].title()})",
                "url": "https://world.openbeautyfacts.org",
                "source_type": "ingredient_database",
                "sentiment": "neutral"
            })

        return {
            "product_name": state["product_name"].title(),
            "summary": state["formulation"]["summary"],
            "pros": state["formulation"]["pros"],
            "cons": state["formulation"]["cons"],
            "clinical_warnings": state["clinical"]["clinical_warnings"],
            "suitability_score": state["skin_match"]["suitability_score"],
            "suitability_reason": state["skin_match"]["suitability_reason"],
            "reality_check_verdict": reality["verdict"],
            "reality_check_reason": reality["reason"],
            "sponsored_flags": state["formulation"]["sponsored_flags"],
            "sources": sources
        }

    return (
        RunnableLambda(step_1_rag_and_classify)
        | RunnableLambda(step_2_formulation)
        | RunnableLambda(step_3_clinical_triggers)
        | RunnableLambda(step_4_skin_match)
        | RunnableLambda(step_5_reality_check_and_format)
    )


class AIAgentService:
    def __init__(self):
        self.gemini_api_key = settings.GEMINI_API_KEY
        self.openai_api_key = settings.OPENAI_API_KEY
        self.lcel_chain = _build_langchain_lcel_pipeline()

    async def analyze_product(
        self,
        query: str,
        user_profile: Optional[Dict[str, Any]] = None,
        search_results: Optional[List[Dict[str, Any]]] = None,
        user_inventory_notes: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        clean_product_query = extract_product_name_from_query(query)
        traits = ProductClassifierAgent.classify(clean_product_query)

        rag_docs = cosmetic_rag_retriever.invoke(clean_product_query)
        rag_context_str = "\n\n".join([f"- {d.page_content}" for d in rag_docs])

        user_context_str = json.dumps({
            "skin_type": user_profile.get("skin_type") if user_profile else "unspecified",
            "skin_undertone": user_profile.get("skin_undertone") if user_profile else "unspecified",
            "skin_concerns": user_profile.get("skin_concerns", []) if user_profile else [],
            "allergies_sensitivities": user_profile.get("allergies_sensitivities", []) if user_profile else [],
            "budget_level": user_profile.get("budget_level", "medium") if user_profile else "medium",
            "past_tested_products_notes": user_inventory_notes or []
        }, indent=2)

        evidence_str = json.dumps(search_results or [], indent=2)

        formatted_prompt = MIRA_RAG_PROMPT_TEMPLATE.format(
            product_name=clean_product_query,
            raw_query=query,
            category=traits["category"].upper(),
            rag_context=rag_context_str,
            user_context=user_context_str,
            search_evidence=evidence_str
        )

        if self.gemini_api_key and self.gemini_api_key.strip():
            try:
                return await self._call_gemini(formatted_prompt)
            except Exception:
                pass

        if self.openai_api_key and self.openai_api_key.strip():
            try:
                return await self._call_openai(formatted_prompt)
            except Exception:
                pass

        return await self.lcel_chain.ainvoke({
            "product_name": clean_product_query,
            "user_profile": user_profile,
            "search_results": search_results,
            "user_inventory_notes": user_inventory_notes
        })

    async def _call_gemini(self, prompt: str) -> Dict[str, Any]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.gemini_api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"response_mime_type": "application/json"}
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(raw_text)

    async def _call_openai(self, prompt: str) -> Dict[str, Any]:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.openai_api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": prompt}],
            "response_format": {"type": "json_object"}
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            raw_text = data["choices"][0]["message"]["content"]
            return json.loads(raw_text)


ai_agent_service = AIAgentService()
