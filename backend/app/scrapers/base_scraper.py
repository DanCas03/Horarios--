"""
Base scraper class with shared utilities for university data extraction.
"""
import httpx
from bs4 import BeautifulSoup
from typing import List, Dict, Optional
from abc import ABC, abstractmethod


class BaseScraper(ABC):
    """Base class for university scrapers."""

    def __init__(self, university_name: str, base_url: str):
        self.university_name = university_name
        self.base_url = base_url
        self.session = httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            },
        )

    async def fetch_page(self, url: str) -> Optional[BeautifulSoup]:
        """Fetch a page and return parsed BeautifulSoup object."""
        try:
            response = await self.session.get(url)
            response.raise_for_status()
            return BeautifulSoup(response.text, "html.parser")
        except httpx.HTTPError as e:
            print(f"[ERROR] Error fetching {url}: {e}")
            return None

    @abstractmethod
    async def scrape_careers(self) -> List[Dict]:
        """Scrape list of careers/programs from the university."""
        pass

    @abstractmethod
    async def scrape_subjects(self, career_id: str) -> List[Dict]:
        """Scrape subjects/curriculum for a specific career."""
        pass

    @abstractmethod
    async def scrape_schedule(self, period: str) -> List[Dict]:
        """Scrape schedule offerings for a given academic period."""
        pass

    async def close(self):
        """Close the HTTP session."""
        await self.session.aclose()
