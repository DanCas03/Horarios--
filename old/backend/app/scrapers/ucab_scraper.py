"""
Scraper for Universidad Católica Andrés Bello (UCAB).
Extracts career listings, pensum data, and schedule information.

Sources:
- Carreras: https://www.ucab.edu.ve/estudios/pregrado/
- Pensum/Materias: Pages linked from each career page
- Horarios: Sistema de inscripción UCAB (may require auth)
"""
import re
from typing import List, Dict, Optional
from bs4 import BeautifulSoup

from app.scrapers.base_scraper import BaseScraper


class UCABScraper(BaseScraper):
    """Scraper for UCAB data."""

    CAREERS_URL = "https://www.ucab.edu.ve/estudios/pregrado/"
    BASE_URL = "https://www.ucab.edu.ve"

    def __init__(self):
        super().__init__(
            university_name="Universidad Católica Andrés Bello",
            base_url=self.BASE_URL,
        )

    async def scrape_careers(self) -> List[Dict]:
        """
        Scrape the list of undergraduate careers from UCAB website.
        Returns a list of career dictionaries.
        """
        soup = await self.fetch_page(self.CAREERS_URL)
        if not soup:
            print("[UCAB] No se pudo acceder a la página de carreras")
            return []

        careers = []
        # UCAB lists careers typically in card/link structures
        # This selector may need adjustment based on actual page structure
        career_links = soup.select("a[href*='pregrado']")

        for link in career_links:
            name = link.get_text(strip=True)
            href = link.get("href", "")
            if name and href and len(name) > 3:
                # Filter out navigation links
                if any(kw in name.lower() for kw in ["inicio", "menu", "ver más", "ucab"]):
                    continue
                careers.append({
                    "name": name,
                    "url": href if href.startswith("http") else f"{self.BASE_URL}{href}",
                    "university_short_name": "UCAB",
                    "academic_period_type": "semestre",
                })

        print(f"[UCAB] Se encontraron {len(careers)} carreras")
        return careers

    async def scrape_subjects(self, career_url: str) -> List[Dict]:
        """
        Scrape the pensum/subjects for a specific career.
        Attempts to find subject tables with codes, names, credits, and prerequisites.
        """
        soup = await self.fetch_page(career_url)
        if not soup:
            return []

        subjects = []
        # Look for tables that contain subject data
        tables = soup.find_all("table")

        for table in tables:
            rows = table.find_all("tr")
            for row in rows[1:]:  # Skip header
                cells = row.find_all(["td", "th"])
                if len(cells) >= 3:
                    subject = self._parse_subject_row(cells)
                    if subject:
                        subjects.append(subject)

        # Also try to find subject info in structured lists/divs
        if not subjects:
            subjects = self._parse_subjects_from_divs(soup)

        print(f"[UCAB] Se encontraron {len(subjects)} materias en {career_url}")
        return subjects

    def _parse_subject_row(self, cells: list) -> Optional[Dict]:
        """Parse a table row into a subject dictionary."""
        try:
            texts = [cell.get_text(strip=True) for cell in cells]
            # Common patterns: Code | Name | Credits | Prerequisites
            code = texts[0] if texts[0] else None
            name = texts[1] if len(texts) > 1 else None
            credits = None
            prerequisites = []

            # Try to extract credits (look for numbers)
            for t in texts[2:]:
                if t.isdigit():
                    credits = int(t)
                    break

            # Try to extract prerequisites
            for t in texts:
                prereq_match = re.findall(r"[A-Z]{2,4}-?\d{3,4}", t)
                if prereq_match and t != code:
                    prerequisites.extend(prereq_match)

            if code and name:
                return {
                    "code": code,
                    "name": name,
                    "credits": credits or 0,
                    "prerequisites": prerequisites,
                    "subject_type": "obligatoria",
                }
        except (IndexError, ValueError):
            pass
        return None

    def _parse_subjects_from_divs(self, soup: BeautifulSoup) -> List[Dict]:
        """Fallback: try to parse subject data from div/list structures."""
        subjects = []
        # Look for common patterns in UCAB pages
        items = soup.select(".materia, .subject, .asignatura, [class*='materia']")
        for item in items:
            code_el = item.select_one(".codigo, .code, [class*='codigo']")
            name_el = item.select_one(".nombre, .name, [class*='nombre']")
            if code_el and name_el:
                subjects.append({
                    "code": code_el.get_text(strip=True),
                    "name": name_el.get_text(strip=True),
                    "credits": 0,
                    "prerequisites": [],
                    "subject_type": "obligatoria",
                })
        return subjects

    async def scrape_schedule(self, period: str) -> List[Dict]:
        """
        Scrape schedule data for a given period.
        NOTE: UCAB schedule system may require authentication.
        This is a placeholder for future implementation.
        """
        print(f"[UCAB] Scraping de horarios para periodo {period} - Pendiente de implementación")
        return []
