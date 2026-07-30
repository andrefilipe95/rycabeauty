"""Audit the rendered Jekyll site using only the Python standard library."""

from __future__ import annotations

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "_site"
errors: list[str] = []
titles: dict[str, Path] = {}
descriptions: dict[str, Path] = {}


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.tags: list[tuple[str, dict[str, str]]] = []
        self.h1 = 0
        self.title = ""
        self._in_title = False
        self.json_ld: list[str] = []
        self._json_parts: list[str] | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = {key: value or "" for key, value in attrs}
        self.tags.append((tag, data))
        self.h1 += tag == "h1"
        self._in_title = tag == "title"
        if tag == "script" and data.get("type") == "application/ld+json":
            self._json_parts = []

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self._in_title = False
        if tag == "script" and self._json_parts is not None:
            self.json_ld.append("".join(self._json_parts))
            self._json_parts = None

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.title += data
        if self._json_parts is not None:
            self._json_parts.append(data)


def local_target(value: str, page: Path) -> Path | None:
    if not value or value.startswith(("#", "mailto:", "tel:", "data:")):
        return None
    parsed = urlparse(value)
    if parsed.scheme or parsed.netloc:
        return None
    clean = parsed.path
    if not clean:
        return None
    if clean.startswith("/"):
        target = SITE / clean.lstrip("/")
    else:
        target = page.parent / clean
    if clean.endswith("/"):
        target /= "index.html"
    return target


for page in SITE.rglob("*.html"):
    parser = PageParser()
    text = page.read_text(encoding="utf-8")
    parser.feed(text)
    is_404 = page.name == "404.html"
    if parser.h1 != 1:
        errors.append(f"{page.relative_to(SITE)}: {parser.h1} elementos H1")
    if not parser.title.strip():
        errors.append(f"{page.relative_to(SITE)}: title em falta")
    elif not is_404:
        key = parser.title.strip()
        if key in titles:
            errors.append(f"title duplicado: {key}")
        titles[key] = page

    metas = [attrs for tag, attrs in parser.tags if tag == "meta"]
    desc = next((m.get("content", "") for m in metas if m.get("name") == "description"), "")
    if not desc:
        errors.append(f"{page.relative_to(SITE)}: meta description em falta")
    elif not is_404:
        if desc in descriptions:
            errors.append(f"meta description duplicada: {desc}")
        descriptions[desc] = page

    canonicals = [a for tag, a in parser.tags if tag == "link" and a.get("rel") == "canonical"]
    if len(canonicals) != 1 or not canonicals[0].get("href", "").startswith("https://rycabeauty.com/"):
        errors.append(f"{page.relative_to(SITE)}: canonical inválido")

    for tag, attrs in parser.tags:
        if tag == "a" and attrs.get("target") == "_blank":
            rel = set(attrs.get("rel", "").split())
            if not {"noopener", "noreferrer"}.issubset(rel):
                errors.append(f"{page.relative_to(SITE)}: link externo sem rel seguro")
        for attribute in ("href", "src"):
            target = local_target(attrs.get(attribute, ""), page)
            if target and not target.exists():
                errors.append(
                    f"{page.relative_to(SITE)}: recurso local inexistente {attrs.get(attribute)}"
                )

    for block in parser.json_ld:
        try:
            json.loads(block)
        except json.JSONDecodeError as exc:
            errors.append(f"{page.relative_to(SITE)}: JSON-LD inválido ({exc})")

homepage = (SITE / "index.html").read_text(encoding="utf-8")
js = (SITE / "assets/js/site.js").read_text(encoding="utf-8")
required_home = [
    'id="tratamentos"',
    'id="problemas"',
    'id="resultados"',
    'id="galeria"',
    'id="avaliacoes"',
    'id="localizacao"',
    'id="contactos"',
    'id="perguntas"',
    'name="contact_method"',
    'id="privacy"',
]
for marker in required_home:
    if marker not in homepage:
        errors.append(f"homepage: falta {marker}")

for marker in ("encodeURIComponent", "mailto:", "data-before-after", "data-gallery-image", "form.checkValidity"):
    if marker not in js:
        errors.append(f"JavaScript: falta {marker}")

for forbidden in (
    "innerHTML",
    "localStorage",
    "eval(",
    "googletagmanager",
    "facebook.net",
    "AggregateRating",
):
    if forbidden in homepage + js:
        errors.append(f"conteúdo proibido encontrado: {forbidden}")

if (ROOT / "CNAME").read_text(encoding="utf-8").strip() != "rycabeauty.com":
    errors.append("CNAME não preserva rycabeauty.com")

sitemap = (SITE / "sitemap.xml").read_text(encoding="utf-8")
for route in [
    "/tratamentos/limpeza-de-pele-seixal/",
    "/tratamentos/depilacao-a-laser-seixal/",
    "/problemas/acne-e-pele-acneica/",
    "/blog/",
    "/legal/politica-de-privacidade/",
]:
    if f"https://rycabeauty.com{route}" not in sitemap:
        errors.append(f"sitemap: falta {route}")

if re.search(r"(api[_-]?key|password|secret)\s*[:=]\s*['\"][^'\"]+", homepage + js, re.I):
    errors.append("possível segredo encontrado")

if errors:
    print("\n".join(f"ERRO: {error}" for error in errors))
    sys.exit(1)

print(
    f"Auditoria concluída: {len(list(SITE.rglob('*.html')))} páginas HTML, "
    f"{len(titles)} titles únicos, {len(descriptions)} descriptions únicas."
)
