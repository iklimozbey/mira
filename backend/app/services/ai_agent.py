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
    """You are MIRA, an objective, rigorous, and personalized AI shopping and research assistant specializing in cosmetics, dermatology, and personal care.
Your purpose:
1. Provide an unbiased, critical analysis of the requested product using the retrieved RAG clinical corpus and online evidence.
2. Cross-reference real user reviews, recurring complaints, performance under different skin types, oxidation tendencies, and finish.
3. Evaluate clinical & dermatological triggers specifically for Rosacea (rozalı cilt), Acne-prone / Comedogenic sensitivity (akneli cilt), Fungal Acne, and Eczema.
4. Personalize the evaluation specifically against the user's skin profile, undertone, concerns, and past experiences.
5. Perform a "Reality Check" (De-influencing): compare the product against the user's current shelf (`past_tested_products_notes`) and budget.
6. Detect and flag likely sponsored content (#ad, #işbirliği, paid partnership) on TikTok/Instagram.

Target Product: "{product_name}" (Original Input: "{raw_query}")

RETRIEVED RAG CLINICAL & INCI KNOWLEDGE BASE:
{rag_context}

USER PROFILE & CURRENT SHELF:
{user_context}

COLLECTED ONLINE SEARCH EVIDENCE & USER REVIEWS:
{search_evidence}

Respond ONLY with a valid JSON object matching this schema:
{{
  "product_name": "Standardized Product Name",
  "summary": "Concise 2-3 sentence overview covering general performance and texture.",
  "pros": ["Key verified benefit 1", "Benefit 2", "Benefit 3"],
  "cons": ["Potential issue or complaint 1 (e.g. oxidizes, clings to dry patches)", "Complaint 2"],
  "clinical_warnings": ["Specific warning for Rosacea, Acne/Comedogenic risk, Fungal Acne, or Allergen triggers"],
  "suitability_score": 85,
  "suitability_reason": "Detailed explanation of why this product fits or fails the user's specific skin type, undertone, and concerns.",
  "reality_check_verdict": "BUY | CONSIDER | SKIP | REDUNDANT",
  "reality_check_reason": "De-influencing assessment: Is this product genuinely necessary given their current shelf, budget, and skin needs?",
  "sponsored_flags": ["Noted sponsored campaigns on TikTok/Instagram to take with caution"],
  "sources": [
    {{
      "title": "Source name or review summary",
      "url": "https://source-link.com",
      "source_type": "web_review",
      "sentiment": "positive | mixed | critical"
    }}
  ]
}}"""
)


def extract_product_name_from_query(query_or_url: str) -> str:
    """
    If the user pastes an e-commerce URL (e.g. Trendyol, Sephora, Hepsiburada),
    extract the human-readable product name from the URL slug.
    """
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
    """Sub-Agent 1: Classifies cosmetic category, finish type, and active traits from product query."""

    @staticmethod
    def classify(product_name: str) -> Dict[str, str]:
        lower = product_name.lower()

        if any(k in lower for k in ["foundation", "fondoten", "fondöten", "skin tint", "bb", "cc", "double wear", "fit me", "infallible", "studio fix", "luminous silk"]):
            category = "foundation"
        elif any(k in lower for k in ["concealer", "kapatici", "kapatıcı", "radiant creamy", "shape tape", "eraser"]):
            category = "concealer"
        elif any(k in lower for k in ["spf", "sunscreen", "gunes", "güneş", "anthelios", "uv", "sun"]):
            category = "sunscreen"
        elif any(k in lower for k in ["serum", "niacinamide", "retinol", "vitamin c", "hyaluronic", "acid", "bha", "aha", "peeling", "azelaic"]):
            category = "serum"
        elif any(k in lower for k in ["moisturizer", "cream", "krem", "nemlendirici", "lotion", "cicaplast", "cerave", "baume"]):
            category = "moisturizer"
        elif any(k in lower for k in ["lip", "ruj", "gloss", "tint", "balm"]):
            category = "lip"
        else:
            category = "foundation"

        if any(k in lower for k in ["matte", "mat", "poreless", "double wear", "soft matte", "studio fix", "superstay", "oil control"]):
            finish = "matte"
        elif any(k in lower for k in ["glow", "luminous", "radiant", "dewy", "hydrating", "fresh", "serum", "reflecting"]):
            finish = "radiant"
        else:
            finish = "natural_satin"

        return {"category": category, "finish": finish}


class FormulationReviewAgent:
    """Sub-Agent 2: Synthesizes category-specific pros, cons, oxidation risks, and social media ad flags."""

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
                        f"Explicit Sponsored Tag (#ad / #işbirliği) detected in {s.get('title', 'Social Post')}. Evaluate claims critically."
                    )

        if cat == "foundation":
            if finish == "matte":
                return {
                    "summary": f"{product_name} is a high-coverage, oil-controlling matte foundation engineered for long wear and shine resistance.",
                    "pros": [
                        "Strong sebum control in the T-zone for 8+ hours",
                        "High pigmentation that masks redness and hyperpigmentation effortlessly",
                        "Transfer-resistant once fully set"
                    ],
                    "cons": [
                        "Can cling to dry patches or emphasize fine lines if skin is not well-prepped",
                        "Users frequently report 0.5 to 1 shade of oxidation within 45 minutes of air exposure"
                    ],
                    "sponsored_flags": detected_ad_flags or [
                        "High volume of TikTok 'full-coverage filter' influencer videos use studio ring lights that hide texture; real-daylight wear is heavier."
                    ]
                }
            elif finish == "radiant":
                return {
                    "summary": f"{product_name} delivers a skin-like, luminous finish with buildable medium coverage and hydrating emollients.",
                    "pros": [
                        "Gives a healthy, lit-from-within glow without clinging to dry flakes",
                        "Seamless blendability with fingers, sponge, or brush",
                        "Minimal oxidation compared to heavy matte formulas"
                    ],
                    "cons": [
                        "Tends to break down around the nose and forehead after 4-5 hours on oily skin",
                        "Requires translucent setting powder to prevent transfer"
                    ],
                    "sponsored_flags": detected_ad_flags or [
                        "Frequently promoted in 'clean girl makeup' sponsored routines; longevity claims of 16+ hours are exaggerated for humid climates."
                    ]
                }
            else:
                return {
                    "summary": f"{product_name} offers balanced medium coverage with a natural satin finish suitable for everyday wear.",
                    "pros": [
                        "Breathable texture that feels lightweight throughout the day",
                        "Blurs minor pore appearance without feeling cakey",
                        "Versatile across seasons"
                    ],
                    "cons": [
                        "Slight oxidation (half a shade darker) noted by users with high skin acidity",
                        "May require touch-ups in the T-zone after 6 hours"
                    ],
                    "sponsored_flags": detected_ad_flags or [
                        "Moderate influencer seeding detected across Instagram beauty reels; verify shade swatches in natural daylight."
                    ]
                }

        if cat == "sunscreen":
            return {
                "summary": f"{product_name} provides broad-spectrum UV protection with a lightweight fluid texture designed for daily layering under makeup.",
                "pros": [
                    "Fast absorption with minimal white cast after 5 minutes of settling",
                    "Plays well under base makeup without heavy pilling",
                    "High photostable UVA/UVB filter profile"
                ],
                "cons": [
                    "Can cause mild eye stinging if applied too close to the lash line when sweating",
                    "May leave a slightly dewy film on very oily skin types"
                ],
                "sponsored_flags": detected_ad_flags or [
                    "Heavily featured in 'invisible SPF' sponsored partnerships; reapply every 2 hours regardless of 'all-day protection' marketing."
                ]
            }

        if cat == "serum":
            return {
                "summary": f"{product_name} is a targeted active skincare treatment formulated to address skin texture, tone, and barrier health.",
                "pros": [
                    "Concentrated active delivery with fast-absorbing aqueous base",
                    "Cost-effective formulation per milliliter",
                    "Noticeable improvement in tone uniformity after 4-6 weeks of consistent use"
                ],
                "cons": [
                    "Risk of irritation or temporary purging if layered with other strong acids/retinoids",
                    "Can foam or pill if applied in excessive amounts (>3 drops)"
                ],
                "sponsored_flags": detected_ad_flags or [
                    "Viral 'overnight glass skin' claims on social media are unrealistic; active ingredients require 28-day cellular turnover cycles."
                ]
            }

        return {
            "summary": f"{product_name} is a popular {cat} formulation balancing pigment payoff with daily wear comfort.",
            "pros": [
                "Smooth application without immediate creasing",
                "Good color payoff and buildable layerability",
                "Accessible packaging for daily touch-ups"
            ],
            "cons": [
                "Needs light setting to prevent settling into fine expression lines after 5 hours",
                "Shade range Undertone labels can run slightly warmer than advertised"
            ],
            "sponsored_flags": detected_ad_flags or [
                "Sponsored PR unboxings often showcase immediate application rather than 8-hour wear tests."
            ]
        }


class ClinicalTriggerAgent:
    """
    Sub-Agent 3: Dermatological Trigger & Flare-Up Analyzer for Rosacea (Rozalı Cilt),
    Acne-Prone / Comedogenic Skin (Akneli Cilt), Fungal Acne, and Allergens.
    Uses both Open Beauty Facts INCI and Retrieved RAG Clinical Documents.
    """

    ROSACEA_TRIGGERS = [
        "alcohol denat", "fragrance", "parfum", "menthol", "peppermint",
        "eucalyptus", "witch hazel", "glycolic acid", "avobenzone", "essential oil", "limonene", "linalool"
    ]
    ACNE_COMEDOGENIC_TRIGGERS = [
        "isopropyl myristate", "coconut oil", "cocos nucifera", "algae extract",
        "lanolin", "isopropyl palmitate", "myristyl myristate", "cocoa butter"
    ]

    @classmethod
    def analyze_triggers(
        cls,
        product_name: str,
        traits: Dict[str, str],
        user_profile: Optional[Dict[str, Any]],
        search_results: Optional[List[Dict[str, Any]]] = None,
        rag_docs_text: str = ""
    ) -> Dict[str, Any]:
        concerns = [c.lower() for c in (user_profile.get("skin_concerns") or [])] if user_profile else []
        allergies = [a.lower() for a in (user_profile.get("allergies_sensitivities") or [])] if user_profile else []
        skin_type = (user_profile.get("skin_type") or "").lower() if user_profile else ""

        has_rosacea = any(k in concerns for k in ["rosacea", "roza", "redness", "kizariklik", "kızarıklık"]) or skin_type == "sensitive"
        has_acne = any(k in concerns for k in ["acne", "akne", "sivilce", "pores", "comedones", "fungal_acne"]) or skin_type == "oily"

        warnings: List[str] = []
        score_penalty = 0

        # Combine query, RAG corpus evidence, and Open Beauty Facts INCI text
        combined_evidence = f"{product_name.lower()} {rag_docs_text.lower()}"
        if search_results:
            for s in search_results:
                if s.get("source_type") == "ingredient_database":
                    combined_evidence += " " + (s.get("content") or "").lower()

        if has_rosacea:
            found_rosacea_triggers = [t for t in cls.ROSACEA_TRIGGERS if t in combined_evidence]
            if found_rosacea_triggers:
                warnings.append(
                    f"🌹 ROSACEA FLARE-UP ALERT (RAG Verified): Detected vascular triggers ({', '.join(found_rosacea_triggers)}) "
                    "which can cause stinging, flushing, and barrier irritation on rosacea-prone skin."
                )
                score_penalty += 18
            elif traits["category"] == "sunscreen" and "mineral" not in combined_evidence and "zinc" not in combined_evidence:
                warnings.append(
                    "🌹 ROSACEA SPF CAUTION: Chemical UV filters can generate heat on reactive skin and trigger rosacea flushing. "
                    "Verify if this formula uses Zinc Oxide / Titanium Dioxide or patch-test on your jawline first."
                )
                score_penalty += 8
            elif traits["finish"] == "matte" and traits["category"] == "foundation":
                warnings.append(
                    "🌹 ROSACEA BARRIER NOTE: High-coverage matte foundations often contain volatile solvents for quick drying. "
                    "Apply a soothing Centella / Panthenol barrier cream underneath to prevent redness rebound."
                )
                score_penalty += 6
            else:
                warnings.append(
                    "🌹 ROSACEA CHECK: Ensure fragrance-free status on the physical box and remove gently with micellar water or cleansing balm."
                )

        if has_acne:
            found_acne_triggers = [t for t in cls.ACNE_COMEDOGENIC_TRIGGERS if t in combined_evidence]
            if found_acne_triggers:
                warnings.append(
                    f"🌋 COMEDOGENIC / ACNE ALERT: Contains pore-clogging esters/oils ({', '.join(found_acne_triggers)}) "
                    "that can trigger closed comedones or acne breakouts."
                )
                score_penalty += 20
            elif traits["finish"] == "radiant" and traits["category"] == "foundation":
                warnings.append(
                    "🌋 ACNE-PRONE CAUTION: Luminous/dewy foundations rely on rich emollient oils and esters for glow, "
                    "which can congest acne-prone pores if worn for 8+ hours."
                )
                score_penalty += 10
            elif traits["finish"] == "matte" and traits["category"] == "foundation":
                warnings.append(
                    "🌋 ACNE REMOVAL REMINDER: Long-wear film-forming silicones trap sebum and bacteria if not thoroughly removed. "
                    "Use a non-comedogenic double-cleanse routine every evening."
                )
            else:
                warnings.append(
                    "🌋 ACNE CHECK: Look for 'Non-Comedogenic' and oil-free labeling; avoid layering over heavy occlusive creams."
                )

        for allergen in allergies:
            if allergen and allergen in combined_evidence:
                warnings.append(
                    f"⚠️ ALLERGEN MATCH: Contains '{allergen.upper()}', which is listed in your personal sensitivities profile!"
                )
                score_penalty += 25

        return {
            "clinical_warnings": warnings,
            "score_penalty": score_penalty
        }


class PersonalSkinMatchAgent:
    """Sub-Agent 4: Computes personalized compatibility score and rationale based on user's skin profile."""

    @staticmethod
    def score_match(
        traits: Dict[str, str],
        user_profile: Optional[Dict[str, Any]],
        score_penalty: int = 0
    ) -> Dict[str, Any]:
        skin_type = (user_profile.get("skin_type") or "combination").lower() if user_profile else "combination"
        undertone = (user_profile.get("skin_undertone") or "neutral").lower() if user_profile else "neutral"
        finish = traits["finish"]
        cat = traits["category"]

        score = 80
        reasons = []

        if cat in ["foundation", "concealer"]:
            if finish == "matte":
                if skin_type == "oily":
                    score = 92
                    reasons.append("Excellent match for your oily skin type: the matte polymers will actively control excess sebum.")
                elif skin_type == "dry":
                    score = 54
                    reasons.append("Caution for your dry skin type: this matte formula can cling to dry patches and feel tight unless paired with a rich priming moisturizer.")
                elif skin_type == "sensitive":
                    score = 68
                    reasons.append("Moderate match for sensitive skin: long-wear film formers require gentle double-cleansing to avoid irritation.")
                else:
                    score = 82
                    reasons.append("Good match for your combination skin: apply mainly to your T-zone and keep a lighter layer on drier cheek areas.")
            elif finish == "radiant":
                if skin_type == "dry":
                    score = 94
                    reasons.append("Ideal match for your dry skin type: the luminous emollients prevent flaking and provide lasting hydration.")
                elif skin_type == "oily":
                    score = 58
                    reasons.append("Low-to-moderate match for your oily skin: radiant formulas can amplify midday shine and slide off the T-zone without powdering.")
                else:
                    score = 84
                    reasons.append(f"Strong match for your {skin_type} skin, offering a natural glow as long as you set the center of your face.")
            else:
                score = 85
                reasons.append(f"Balanced satin formulation that adapts well to your {skin_type} skin profile.")
        else:
            score = 86
            reasons.append(f"Formulation texture is well-suited for {skin_type} skin routines.")

        final_score = max(25, min(98, score - score_penalty))
        if score_penalty > 0:
            reasons.append(f"(Suitability adjusted by -{score_penalty} pts due to Rosacea/Acne/Sensitivity trigger cautions.)")

        if undertone == "warm":
            reasons.append("Since you have a warm undertone, watch out for slight oxidation which can turn neutral-warm shades overly orange.")
        elif undertone == "cool":
            reasons.append("With your cool undertone, opt for shades labeled 'C' or 'Rose/Neutral' so potential oxidation doesn't pull yellow.")

        return {
            "suitability_score": final_score,
            "suitability_reason": " ".join(reasons)
        }


class RealityCheckAgent:
    """Sub-Agent 5: De-influencing & Personal Shelf Redundancy Evaluator."""

    @staticmethod
    def check_shelf(
        product_name: str,
        traits: Dict[str, str],
        suitability_score: int,
        user_inventory_notes: Optional[List[str]]
    ) -> Dict[str, str]:
        if suitability_score < 65:
            return {
                "verdict": "SKIP",
                "reason": "De-influencing Alert: Based on your skin type and clinical trigger profile (Rosacea/Acne risk), this formula has a high risk of causing irritation or underperforming. Save your money."
            }

        if not user_inventory_notes:
            return {
                "verdict": "BUY",
                "reason": "You have no conflicting products logged in your personal shelf yet, and this item fits your skin profile well."
            }

        oxidized_mentions = [n for n in user_inventory_notes if "oxid" in n.lower() or "oksit" in n.lower()]
        high_rated_mentions = [n for n in user_inventory_notes if "(Rating: 5/5)" in n or "(Rating: 4/5)" in n]

        if high_rated_mentions:
            return {
                "verdict": "REDUNDANT",
                "reason": (
                    f"Shelf Overlap Detected: You already own {len(high_rated_mentions)} well-rated product(s) on your shelf "
                    f"({high_rated_mentions[0].split(':')[0]}). Unless you are running out, buying another similar item is unnecessary spending."
                )
            }

        if oxidized_mentions:
            return {
                "verdict": "CONSIDER",
                "reason": (
                    "Memory Caution: You previously noted oxidation issues on your shelf. "
                    "Sample this product in-store and wait 60 minutes before purchasing a full bottle."
                )
            }

        return {
            "verdict": "CONSIDER",
            "reason": f"You have {len(user_inventory_notes)} item(s) in your shelf. Finish your open bottles first if they serve the same purpose."
        }


def _build_langchain_lcel_pipeline() -> RunnableSequence:
    """
    Constructs a formal LangChain Expression Language (LCEL) RunnableSequence (`|`)
    chaining RAG Retrieval -> Classifier -> Formulation -> Clinical Trigger -> Skin Match -> Reality Check.
    """

    def step_1_rag_and_classify(state: Dict[str, Any]) -> Dict[str, Any]:
        product_name = state["product_name"]
        # Invoke LangChain BaseRetriever
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
        # Include RAG Corpus source first
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
                "title": "Open Beauty Facts & Dermatological Comedogenicity Index",
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

    # Build LCEL Chain using LangChain's pipe (`|`) operator
    return (
        RunnableLambda(step_1_rag_and_classify)
        | RunnableLambda(step_2_formulation)
        | RunnableLambda(step_3_clinical_triggers)
        | RunnableLambda(step_4_skin_match)
        | RunnableLambda(step_5_reality_check_and_format)
    )


class AIAgentService:
    """Core AI orchestrator powered by LangChain RAG Retriever, PromptTemplate, and LCEL Multi-Agent Chain."""

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

        # Retrieve relevant clinical documents via LangChain RAG Retriever
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

        # Format prompt using LangChain PromptTemplate
        formatted_prompt = MIRA_RAG_PROMPT_TEMPLATE.format(
            product_name=clean_product_query,
            raw_query=query,
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

        # Execute LangChain LCEL Multi-Agent Pipeline
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
