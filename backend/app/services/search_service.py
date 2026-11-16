import httpx
from typing import List, Dict, Any
from app.core.config import settings


class SearchService:
    """Service to fetch online discussions, reviews, and ingredient analyses."""

    def __init__(self):
        self.tavily_api_key = settings.SEARCH_API_KEY

    async def search_reviews(self, product_query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """Search for organic user discussions, reviews, complaints, and ingredients."""
        # 1. If Tavily API Key is configured, use Tavily Search API
        if self.tavily_api_key and self.tavily_api_key.strip():
            return await self._search_tavily(product_query, max_results)
        
        # 2. Fallback: DuckDuckGo HTML Instant Search (no API key required)
        return await self._search_duckduckgo(product_query, max_results)

    async def _search_tavily(self, query: str, max_results: int) -> List[Dict[str, Any]]:
        url = "https://api.tavily.com/search"
        payload = {
            "api_key": self.tavily_api_key,
            "query": f"{query} user reviews complaints oxidation finish skin type",
            "search_depth": "advanced",
            "include_answer": False,
            "max_results": max_results
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()
                results = []
                for item in data.get("results", []):
                    results.append({
                        "title": item.get("title", ""),
                        "url": item.get("url", ""),
                        "content": item.get("content", ""),
                        "source_type": "web_review"
                    })
                return results
            except Exception as e:
                # Log error and fallback
                return await self._search_duckduckgo(query, max_results)

    async def _search_duckduckgo(self, query: str, max_results: int) -> List[Dict[str, Any]]:
        """Fallback web search using DuckDuckGo HTML endpoint without requiring an API key."""
        search_query = f"{query} reviews experience complaints oxidation ingredients"
        url = "https://html.duckduckgo.com/html/"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        data = {"q": search_query}

        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
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
                # Return empty list if offline or blocked; agent will rely on internal knowledge base
                return []


search_service = SearchService()
