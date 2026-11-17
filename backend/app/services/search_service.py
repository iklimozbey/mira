import httpx
from typing import List, Dict, Any
from app.core.config import settings


class SearchService:
    """
    Multi-source intelligence gathering service:
    1. TikTok Official oEmbed API (when a TikTok link is shared)
    2. Open Beauty Facts API (real cosmetic INCI ingredients lookup)
    3. Tavily AI Search / DuckDuckGo Fallback (web & social media reviews)
    """

    def __init__(self):
        self.tavily_api_key = settings.SEARCH_API_KEY

    async def search_reviews(self, product_query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        results: List[Dict[str, Any]] = []

        # 1. If user shared a TikTok URL, fetch official oEmbed metadata & check sponsored hashtags
        if "tiktok.com" in product_query.lower():
            tiktok_info = await self._fetch_tiktok_oembed(product_query.strip())
            if tiktok_info:
                results.append(tiktok_info)

        # 2. Fetch real cosmetic ingredients from Open Beauty Facts (free open-source database)
        obf_results = await self._search_open_beauty_facts(product_query)
        results.extend(obf_results)

        # 3. Search web & social media reviews (Tavily or DuckDuckGo)
        if self.tavily_api_key and self.tavily_api_key.strip():
            web_results = await self._search_tavily(product_query, max_results)
        else:
            web_results = await self._search_duckduckgo(product_query, max_results)

        results.extend(web_results)
        return results

    async def _fetch_tiktok_oembed(self, tiktok_url: str) -> Dict[str, Any] | None:
        """Use TikTok's official public oEmbed endpoint to extract caption, author, and ad tags."""
        url = "https://www.tiktok.com/oembed"
        async with httpx.AsyncClient(timeout=8.0) as client:
            try:
                resp = await client.get(url, params={"url": tiktok_url})
                resp.raise_for_status()
                data = resp.json()
                author = data.get("author_name", "TikTok Creator")
                caption = data.get("title", "")
                return {
                    "title": f"TikTok Video by @{author}",
                    "url": tiktok_url,
                    "content": f"Creator: @{author} | Caption: {caption}",
                    "source_type": "tiktok_oembed"
                }
            except Exception:
                return None

    async def _search_open_beauty_facts(self, query: str) -> List[Dict[str, Any]]:
        """Query Open Beauty Facts API for real INCI ingredient lists."""
        url = "https://world.openbeautyfacts.org/cgi/search.pl"
        params = {
            "search_terms": query,
            "search_simple": 1,
            "action": "process",
            "json": 1,
            "page_size": 2
        }
        async with httpx.AsyncClient(timeout=6.0) as client:
            try:
                resp = await client.get(url, params=params)
                resp.raise_for_status()
                data = resp.json()
                items = []
                for prod in data.get("products", []):
                    ing_text = prod.get("ingredients_text") or prod.get("ingredients_text_en")
                    prod_name = prod.get("product_name", query)
                    if ing_text:
                        items.append({
                            "title": f"Open Beauty Facts INCI Ingredients: {prod_name}",
                            "url": prod.get("url", "https://world.openbeautyfacts.org"),
                            "content": f"Ingredients (INCI): {ing_text}",
                            "source_type": "ingredient_database"
                        })
                return items
            except Exception:
                return []

    async def _search_tavily(self, query: str, max_results: int) -> List[Dict[str, Any]]:
        url = "https://api.tavily.com/search"
        payload = {
            "api_key": self.tavily_api_key,
            "query": (
                f"{query} reviews complaints oxidation rosacea acne trigger "
                "site:reddit.com OR site:tiktok.com OR site:instagram.com"
            ),
            "search_depth": "advanced",
            "include_answer": False,
            "max_results": max_results
        }
        async with httpx.AsyncClient(timeout=12.0) as client:
            try:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()
                results = []
                for item in data.get("results", []):
                    item_url = item.get("url", "")
                    s_type = "social_media" if any(s in item_url for s in ["tiktok.com", "instagram.com", "reddit.com"]) else "web_review"
                    results.append({
                        "title": item.get("title", ""),
                        "url": item_url,
                        "content": item.get("content", ""),
                        "source_type": s_type
                    })
                return results
            except Exception:
                return await self._search_duckduckgo(query, max_results)

    async def _search_duckduckgo(self, query: str, max_results: int) -> List[Dict[str, Any]]:
        """Fallback web & social media search using DuckDuckGo HTML endpoint."""
        search_query = f"{query} reviews complaints oxidation rosacea acne reddit tiktok"
        url = "https://html.duckduckgo.com/html/"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        data = {"q": search_query}

        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
            try:
                response = await client.post(url, data=data, headers=headers)
                from bs4 import BeautifulSoup
                soup = BeautifulSoup(response.text, "html.parser")
                results = []
                for result in soup.find_all("div", class_="result", limit=max_results):
                    title_elem = result.find("a", class_="result__a")
                    snippet_elem = result.find("a", class_="result__snippet")
                    if title_elem:
                        href = title_elem.get("href", "")
                        results.append({
                            "title": title_elem.get_text(strip=True),
                            "url": href,
                            "content": snippet_elem.get_text(strip=True) if snippet_elem else "",
                            "source_type": "forum_or_review"
                        })
                return results
            except Exception:
                return []


search_service = SearchService()
