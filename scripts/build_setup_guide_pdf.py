#!/usr/bin/env python3
"""Build docs/SETUP_GUIDE.pdf from docs/SETUP_GUIDE.md.

Run with the backend virtualenv, which already pins reportlab:
    backend/.venv/bin/python scripts/build_setup_guide_pdf.py
"""

from __future__ import annotations

import re
import unicodedata
from datetime import date
from html import escape
from pathlib import Path

import reportlab
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas as pdf_canvas
from reportlab.platypus import (
    KeepTogether,
    ListFlowable,
    ListItem,
    Paragraph,
    Preformatted,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "SETUP_GUIDE.md"
TARGET = ROOT / "docs" / "SETUP_GUIDE.pdf"

TITLE = "AGOS Local Setup Guide"
MARGIN = 2 * cm
CODE_PAD = 6
CODE_SIZE = 8.5

INK = colors.HexColor("#003135")
BODY = colors.HexColor("#24464a")
CODE_BG = colors.HexColor("#f1f3f4")
CODE_BORDER = colors.HexColor("#d5dadb")

MONO_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
    "/usr/share/fonts/dejavu/DejaVuSansMono.ttf",
    "/Library/Fonts/DejaVuSansMono.ttf",
    "/System/Library/Fonts/Supplemental/Courier New.ttf",
    "C:/Windows/Fonts/consola.ttf",
    "C:/Windows/Fonts/cour.ttf",
]

ASCII_MAP = {
    "\u2018": "'", "\u2019": "'", "\u201c": '"', "\u201d": '"',
    "\u2013": "-", "\u2014": " - ", "\u2026": "...", "\u2192": "->",
    "\u2190": "<-", "\u2022": "-", "\u00a0": " ", "\u2713": "OK", "\u2714": "OK",
}


def register_fonts() -> tuple[str, str, str]:
    font_dir = Path(reportlab.__file__).parent / "fonts"
    pdfmetrics.registerFont(TTFont("GuideSans", str(font_dir / "Vera.ttf")))
    pdfmetrics.registerFont(TTFont("GuideSans-Bold", str(font_dir / "VeraBd.ttf")))
    pdfmetrics.registerFont(TTFont("GuideSans-Italic", str(font_dir / "VeraIt.ttf")))
    pdfmetrics.registerFont(TTFont("GuideSans-BoldItalic", str(font_dir / "VeraBI.ttf")))
    pdfmetrics.registerFontFamily(
        "GuideSans",
        normal="GuideSans",
        bold="GuideSans-Bold",
        italic="GuideSans-Italic",
        boldItalic="GuideSans-BoldItalic",
    )
    mono = "Courier"
    for candidate in MONO_CANDIDATES:
        if Path(candidate).is_file():
            pdfmetrics.registerFont(TTFont("GuideMono", candidate))
            mono = "GuideMono"
            break
    return "GuideSans", "GuideSans-Bold", mono


def clean_text(text: str) -> str:
    """Map typographic characters to ASCII and drop anything else (emoji, symbols)."""
    for src, dst in ASCII_MAP.items():
        text = text.replace(src, dst)
    text = unicodedata.normalize("NFKD", text)
    return text.encode("ascii", "ignore").decode("ascii")


def inline_markup(text: str, mono: str) -> str:
    text = clean_text(text)
    codes: list[str] = []

    def stash(match: re.Match) -> str:
        codes.append(match.group(1))
        return f"\x00{len(codes) - 1}\x00"

    text = re.sub(r"`([^`]+)`", stash, text)
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r"\1 (\2)", text)
    text = escape(text, quote=False)
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"(?<!\w)\*(?!\s)(.+?)(?<!\s)\*(?!\w)", r"<i>\1</i>", text)
    return re.sub(
        r"\x00(\d+)\x00",
        lambda m: f'<font name="{mono}">{escape(codes[int(m.group(1))], quote=False)}</font>',
        text,
    )


def wrap_code(lines: list[str], mono: str, width: float) -> list[str]:
    """Hard-wrap code lines to the box width, breaking at spaces when possible."""
    out: list[str] = []
    for raw in lines:
        line = clean_text(raw.expandtabs(4))
        prefix = ""
        while pdfmetrics.stringWidth(prefix + line, mono, CODE_SIZE) > width:
            room = len(line)
            while room > 1 and pdfmetrics.stringWidth(prefix + line[:room], mono, CODE_SIZE) > width:
                room -= 1
            cut = line.rfind(" ", 0, room)
            if cut <= len(line) // 4:
                cut = room
            out.append(prefix + line[:cut].rstrip())
            line = line[cut:].lstrip()
            prefix = "    "
        out.append(prefix + line)
    return out


class NumberedCanvas(pdf_canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._pages: list[dict] = []

    def showPage(self):
        self._pages.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        total = len(self._pages)
        for state in self._pages:
            self.__dict__.update(state)
            self.setFont("GuideSans", 8.5)
            self.setFillColor(BODY)
            self.drawString(MARGIN, MARGIN / 2, TITLE)
            self.drawRightString(A4[0] - MARGIN, MARGIN / 2, f"Page {self._pageNumber} of {total}")
            super().showPage()
        super().save()


def build_story(markdown: str, sans: str, bold: str, mono: str, frame_width: float) -> list:
    styles = {
        "title": ParagraphStyle("title", fontName=bold, fontSize=22, leading=27, textColor=INK, spaceAfter=4),
        "subtitle": ParagraphStyle("subtitle", fontName=sans, fontSize=10, leading=14, textColor=BODY, spaceAfter=14),
        "h2": ParagraphStyle("h2", fontName=bold, fontSize=14, leading=18, textColor=INK, spaceBefore=14, spaceAfter=6),
        "body": ParagraphStyle("body", fontName=sans, fontSize=10, leading=14.5, textColor=BODY, spaceAfter=6, alignment=TA_LEFT),
        "bullet": ParagraphStyle("bullet", fontName=sans, fontSize=10, leading=14.5, textColor=BODY),
        "code": ParagraphStyle("code", fontName=mono, fontSize=CODE_SIZE, leading=CODE_SIZE * 1.35, textColor=INK),
    }
    code_width = frame_width - 2 * CODE_PAD

    story: list = []
    bullets: list[str] = []
    paragraph: list[str] = []
    pending_label = None

    def flush_paragraph():
        nonlocal pending_label
        if paragraph:
            text = inline_markup(" ".join(paragraph), mono)
            paragraph.clear()
            if re.fullmatch(r"<b>.*</b>:?", text.strip()):
                pending_label = Paragraph(text, styles["body"])
            else:
                story.append(Paragraph(text, styles["body"]))

    def flush_bullets():
        if bullets:
            items = [ListItem(Paragraph(inline_markup(b, mono), styles["bullet"]), leftIndent=14) for b in bullets]
            story.append(ListFlowable(items, bulletType="bullet", start="\u2022", leftIndent=14, bulletFontName=sans, spaceAfter=6))
            story.append(Spacer(1, 4))
            bullets.clear()

    lines = markdown.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        if stripped.startswith("```"):
            flush_paragraph()
            flush_bullets()
            code: list[str] = []
            i += 1
            while i < len(lines) and not lines[i].strip().startswith("```"):
                code.append(lines[i])
                i += 1
            box = Table(
                [[Preformatted("\n".join(wrap_code(code, mono, code_width)), styles["code"])]],
                colWidths=[frame_width],
            )
            box.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), CODE_BG),
                ("BOX", (0, 0), (-1, -1), 0.5, CODE_BORDER),
                ("LEFTPADDING", (0, 0), (-1, -1), CODE_PAD),
                ("RIGHTPADDING", (0, 0), (-1, -1), CODE_PAD),
                ("TOPPADDING", (0, 0), (-1, -1), CODE_PAD),
                ("BOTTOMPADDING", (0, 0), (-1, -1), CODE_PAD),
            ]))
            block = [pending_label, box, Spacer(1, 8)] if pending_label else [box, Spacer(1, 8)]
            pending_label = None
            story.append(KeepTogether(block))
        elif stripped.startswith("# "):
            flush_paragraph()
            flush_bullets()
            story.append(Paragraph(escape(clean_text(stripped[2:])), styles["title"]))
            today = date.today()
            story.append(Paragraph(
                f"For groupmates running AGOS on a local PC - {today:%B} {today.day}, {today.year}",
                styles["subtitle"],
            ))
        elif stripped.startswith("## "):
            flush_paragraph()
            flush_bullets()
            story.append(Paragraph(inline_markup(stripped[3:], mono), styles["h2"]))
        elif re.match(r"^[-*] ", stripped):
            flush_paragraph()
            bullets.append(stripped[2:])
        elif not stripped:
            flush_paragraph()
            flush_bullets()
        else:
            if bullets:
                bullets[-1] += " " + stripped
            else:
                paragraph.append(stripped)
        i += 1

    flush_paragraph()
    flush_bullets()
    if pending_label is not None:
        story.append(pending_label)
    return story


def main() -> None:
    sans, bold, mono = register_fonts()
    doc = SimpleDocTemplate(
        str(TARGET),
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=MARGIN,
        bottomMargin=MARGIN,
        title=TITLE,
        author="AGOS Team",
    )
    story = build_story(SOURCE.read_text(encoding="utf-8"), sans, bold, mono, doc.width)
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Wrote {TARGET.relative_to(ROOT)} (mono font: {mono})")


if __name__ == "__main__":
    main()
