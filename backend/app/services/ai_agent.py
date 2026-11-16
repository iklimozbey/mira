import json
import httpx
from typing import Dict, Any, List, Optional
from app.core.config import settings


SYSTEM_PROMPT = """You are MIRA, an objective, rigorous, and personalized AI shopping and research assistant specializing in cosmetics and personal care.
Your purpose:
1. Provide an unbiased, critical analysis of the requested product.
2. Cross-reference real user reviews, recurring complaints, performance under different skin types, oxidation tendencies, and finish.
3. Personalize the evaluation specifically against the user's skin profile, undertone, concerns, and past experiences.
4. Detect and flag likely sponsored content or marketing hype.
5. Emphasize why the user might NOT want to buy the product if it doesn't match their profile.

You must respond ONLY with a valid JSON object matching this schema:
{
  "product_name": "Standardized Product Name",
  "summary": "Concise 2-3 sentence overview covering general performance and texture.",
  "pros": ["Key verified benefit 1", "Benefit 2", "Benefit 3"],
  "cons": ["Potential issue or complaint 1 (e.g. oxidizes, clings to dry patches)", "Complaint 2"],
  "suitability_score": 85, // Integer 1-100 indicating match for THIS specific user
  "suitability_reason": "Detailed explanation of why this product fits or fails the user's specific skin type, undertone, and concerns.",
  "sponsored_flags": ["Noted sponsored campaigns on TikTok/Instagram to take with caution"],
  "sources": [
    {
      "title": "Source name or review summary",
      "url": "https://source-link.com",
      "source_type": "web_review",
      "sentiment": "positive | mixed | critical"
    }
  ]
}
"""


class AIAgentService:
    """Core AI agent orchestrating research data synthesis and personalized evaluation."""

    def __init__(self):
        self.gemini_api_key = settings.GEMINI_API_KEY
        self.openai_api_key = settings.OPENAI_API_KEY

    async def analyze_product(
        self,
        query: str,
        user_profile: Optional[Dict[str, Any]] = None,
        search_results: Optional[List[Dict[str, Any]]] = None,
        user_inventory_notes: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Synthesize product inquiry against user profile and gathered search evidence."""
        user_context_str = json.dumps({
            "skin_type": user_profile.get("skin_type") if user_profile else "unspecified",
            "skin_undertone": user_profile.get("skin_undertone") if user_profile else "unspecified",
            "skin_concerns": user_profile.get("skin_concerns", []) if user_profile else [],
            "allergies_sensitivities": user_profile.get("allergies_sensitivities", []) if user_profile else [],
            "budget_level": user_profile.get("budget_level", "medium") if user_profile else "medium",
            "past_tested_products_notes": user_inventory_notes or []
        }, indent=2)

        evidence_str = json.dumps(search_results or [], indent=2)

        prompt = f"""Target Product / Query: "{query}"

USER PROFILE:
{user_context_str}

COLLECTED ONLINE SEARCH EVIDENCE & USER REVIEWS:
{evidence_str}

Please generate the structured JSON evaluation following the instructions."""

        # 1. If Gemini API key is configured
        if self.gemini_api_key and self.gemini_api_key.strip():
            return await self._call_gemini(prompt)

        # 2. If OpenAI API key is configured
        if self.openai_api_key and self.openai_api_key.strip():
            return await self._call_openai(prompt)

        # 3. Fallback: Deterministic mock agent response for local testing without external API costs
        return self._generate_mock_analysis(query, user_profile, search_results)

    async def _call_gemini(self, prompt: str) -> Dict[str, Any]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.gemini_api_key}"
        payload = {
            "contents": [{"parts": [{"text": f"{SYSTEM_PROMPT}\n\n{prompt}"}]}],
            "generationConfig": {"response_mime_type": "application/json"}
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
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
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"}
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            raw_text = data["choices"][0]["message"]["content"]
            return json.loads(raw_text)

    def _generate_mock_analysis(
        self,
        query: str,
        user_profile: Optional[Dict[str, Any]],
        search_results: Optional[List[Dict[str, Any]]]
    ) -> Dict[str, Any]:
        """Provides an immediate, high-fidelity mock response during development without API keys."""
        skin_type = user_profile.get("skin_type", "combination") if user_profile else "combination"
        undertone = user_profile.get("skin_undertone", "warm") if user_profile else "warm"

        sources = []
        if search_results:
            for s in search_results[:3]:
                sources.append({
                    "title": s.get("title", "Community Discussion"),
                    "url": s.get("url", "https://example.com/review"),
                    "source_type": "web_review",
                    "sentiment": "mixed"
                })
        else:
            sources.append({
                "title": "Verified Community Forum Reviews",
                "url": "https://mira.app/reviews",
                "source_type": "web_review",
                "sentiment": "mixed"
            })

        return {
            "product_name": query.title(),
            "summary": f"{query.title()} offers medium-to-buildable coverage with a natural satin finish. Widely praised for spreadability, though several long-wear reviews highlight slight midday shine in T-zone areas.",
            "pros": [
                "Lightweight formulation that doesn't feel heavy on skin",
                "Smooth blur effect on minor pore texture",
                "Blendable without requiring heavy skin prep"
            ],
            "cons": [
                "May oxidize by half a shade within 60-90 minutes on oily or combination skin",
                "Requires setting powder for longevity exceeding 6 hours"
            ],
            "suitability_score": 78,
            "suitability_reason": f"Given your {skin_type} skin type and {undertone} undertone, this product aligns well in tone but requires a mattifying primer in the T-zone to prevent slight oxidation.",
            "sponsored_flags": [
                "Significant influx of sponsored TikTok micro-influencer reviews observed in the last 60 days; take extreme longevity claims with caution."
            ],
            "sources": sources
        }


ai_agent_service = AIAgentService()
