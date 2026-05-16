"""
Scraper for Universidad Metropolitana (UNIMET).
Extracts career listings, pensum data, and schedule information.

Sources:
- Carreras: https://www.unimet.edu.ve/carreras/ (or similar)
- Pensum/Materias: Individual career pages
- Horarios: Sistema Banner UNIMET
"""
import re
from typing import List, Dict, Optional
from bs4 import BeautifulSoup

from app.scrapers.base_scraper import BaseScraper


class UNIMETScraper(BaseScraper):
    """Scraper for UNIMET data."""

    CAREERS_URL = "https://www.unimet.edu.ve/estudios/pregrado/"
    BASE_URL = "https://www.unimet.edu.ve"

    def __init__(self):
        super().__init__(
            university_name="Universidad Metropolitana",
            base_url=self.BASE_URL,
        )

    async def scrape_careers(self) -> List[Dict]:
        """
        Scrape the list of undergraduate careers from UNIMET website.
        UNIMET uses a trimester system.
        """
        soup = await self.fetch_page(self.CAREERS_URL)
        if not soup:
            print("[UNIMET] No se pudo acceder a la página de carreras")
            return []

        careers = []
        # UNIMET typically lists careers in card layouts
        career_elements = soup.select(
            "a[href*='pregrado'], a[href*='carrera'], .career-card a, "
            ".programa a, [class*='career'] a"
        )

        seen_names = set()
        for elem in career_elements:
            name = elem.get_text(strip=True)
            href = elem.get("href", "")

            if not name or len(name) < 4 or name in seen_names:
                continue
            # Filter navigation/generic links
            if any(kw in name.lower() for kw in [
                "inicio", "menu", "ver más", "unimet", "contacto", "admisión"
            ]):
                continue

            seen_names.add(name)
            careers.append({
                "name": name,
                "url": href if href.startswith("http") else f"{self.BASE_URL}{href}",
                "university_short_name": "UNIMET",
                "academic_period_type": "trimestre",
            })

        print(f"[UNIMET] Se encontraron {len(careers)} carreras")
        return careers

    async def scrape_subjects(self, career_url: str) -> List[Dict]:
        """
        Scrape the pensum/subjects for a specific UNIMET career.
        UNIMET uses a trimester system with specific code formats.
        """
        soup = await self.fetch_page(career_url)
        if not soup:
            return []

        subjects = []

        # Look for pensum tables
        tables = soup.find_all("table")
        for table in tables:
            rows = table.find_all("tr")
            for row in rows[1:]:
                cells = row.find_all(["td", "th"])
                if len(cells) >= 2:
                    subject = self._parse_subject_row(cells)
                    if subject:
                        subjects.append(subject)

        # Fallback: structured content
        if not subjects:
            subjects = self._parse_structured_content(soup)

        # Fallback: PDF links (UNIMET sometimes hosts pensum as PDFs)
        if not subjects:
            pdf_links = soup.select("a[href$='.pdf']")
            for link in pdf_links:
                text = link.get_text(strip=True).lower()
                if any(kw in text for kw in ["pensum", "plan de estudio", "malla"]):
                    print(f"[UNIMET] Pensum en PDF encontrado: {link.get('href')}")

        print(f"[UNIMET] Se encontraron {len(subjects)} materias en {career_url}")
        return subjects

    def _parse_subject_row(self, cells: list) -> Optional[Dict]:
        """Parse a table row into a subject dictionary."""
        try:
            texts = [cell.get_text(strip=True) for cell in cells]
            code = texts[0]
            name = texts[1] if len(texts) > 1 else None

            # UNIMET codes often follow patterns like BPTC1121
            if not re.match(r"^[A-Z]{2,5}\d{3,5}$", code):
                # Try other cells
                for t in texts:
                    if re.match(r"^[A-Z]{2,5}\d{3,5}$", t):
                        code = t
                        break

            credits = None
            for t in texts[2:]:
                if t.isdigit() and int(t) <= 12:
                    credits = int(t)
                    break

            prerequisites = []
            for t in texts:
                prereqs = re.findall(r"[A-Z]{2,5}\d{3,5}", t)
                prereqs = [p for p in prereqs if p != code]
                prerequisites.extend(prereqs)

            if code and name and len(name) > 2:
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

    def _parse_structured_content(self, soup: BeautifulSoup) -> List[Dict]:
        """Parse subjects from structured div/list content."""
        subjects = []
        # Common class patterns for subject listings
        selectors = [
            ".materia", ".subject", ".asignatura",
            "[class*='materia']", "[class*='subject']",
            "li[class*='plan']", ".pensum-item",
        ]
        for selector in selectors:
            items = soup.select(selector)
            for item in items:
                text = item.get_text(strip=True)
                # Try to extract code and name from text
                match = re.match(r"([A-Z]{2,5}\d{3,5})\s*[-–]\s*(.+?)(?:\s*\((\d+)\s*cr)", text)
                if match:
                    subjects.append({
                        "code": match.group(1),
                        "name": match.group(2).strip(),
                        "credits": int(match.group(3)) if match.group(3) else 0,
                        "prerequisites": [],
                        "subject_type": "obligatoria",
                    })
        return subjects

    async def scrape_schedule(self, period: str) -> List[Dict]:
        """
        Scrape schedule data from UNIMET for a given period.
        NOTE: UNIMET uses Banner system which may require auth.
        This is a placeholder for future implementation.
        """
        print(f"[UNIMET] Scraping de horarios para periodo {period} - Pendiente de implementación")
        return []
