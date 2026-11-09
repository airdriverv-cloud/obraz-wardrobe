#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Convert ANALYSIS.md (markdown subset) into a styled DOCX ready for PDF export."""

import re
import sys
from pathlib import Path

from docx import Document
from docx.enum.section import WD_ORIENT, WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_TAB_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

INK = RGBColor(0x16, 0x13, 0x0F)
INK2 = RGBColor(0x3B, 0x35, 0x2D)
MUTED = RGBColor(0x7A, 0x71, 0x66)
ACCENT = RGBColor(0xC8, 0x55, 0x3D)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)

BODY_FONT = "Calibri"
HEAD_FONT = "Georgia"

A4_W, A4_H = Cm(21.0), Cm(29.7)
MARGIN_PORTRAIT = 1.8
MARGIN_LANDSCAPE = 1.4

BULLET = "\u2022"


# --- low-level helpers -------------------------------------------------
def shade(cell, hex_color):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hex_color)
    tc_pr.append(shd)


def cell_margins(table, top=40, bottom=40, left=70, right=70):
    tbl_pr = table._tbl.tblPr
    mar = OxmlElement("w:tblCellMar")
    for name, val in (("top", top), ("left", left), ("bottom", bottom), ("right", right)):
        el = OxmlElement("w:" + name)
        el.set(qn("w:w"), str(val))
        el.set(qn("w:type"), "dxa")
        mar.append(el)
    tbl_pr.append(mar)


def repeat_header(row):
    tr_pr = row._tr.get_or_add_trPr()
    el = OxmlElement("w:tblHeader")
    el.set(qn("w:val"), "true")
    tr_pr.append(el)


def no_split(row):
    tr_pr = row._tr.get_or_add_trPr()
    el = OxmlElement("w:cantSplit")
    el.set(qn("w:val"), "true")
    tr_pr.append(el)


def bottom_border(paragraph, color="DED4C5", size=6):
    p_pr = paragraph._p.get_or_add_pPr()
    borders = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), str(size))
    bottom.set(qn("w:space"), "4")
    bottom.set(qn("w:color"), color)
    borders.append(bottom)
    p_pr.append(borders)


def add_field(paragraph, instr, size=8, color=MUTED):
    run = paragraph.add_run()
    run.font.size = Pt(size)
    run.font.color.rgb = color
    fld_begin = OxmlElement("w:fldChar")
    fld_begin.set(qn("w:fldCharType"), "begin")
    instr_el = OxmlElement("w:instrText")
    instr_el.set(qn("xml:space"), "preserve")
    instr_el.text = instr
    fld_sep = OxmlElement("w:fldChar")
    fld_sep.set(qn("w:fldCharType"), "separate")
    txt = OxmlElement("w:t")
    txt.text = "1"
    fld_end = OxmlElement("w:fldChar")
    fld_end.set(qn("w:fldCharType"), "end")
    for el in (fld_begin, instr_el, fld_sep, txt, fld_end):
        run._r.append(el)


# --- inline markup -----------------------------------------------------
INLINE_RE = re.compile(r"(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))")


def add_inline(paragraph, text, size=10, color=INK):
    text = text.replace("\\|", "|")
    for token in INLINE_RE.split(text):
        if not token:
            continue
        if token.startswith("**") and token.endswith("**"):
            run = paragraph.add_run(token[2:-2])
            run.bold = True
            run.font.size = Pt(size)
            run.font.color.rgb = color
        elif token.startswith("*") and token.endswith("*") and len(token) > 2:
            run = paragraph.add_run(token[1:-1])
            run.italic = True
            run.font.size = Pt(size)
            run.font.color.rgb = color
        elif token.startswith("`") and token.endswith("`"):
            run = paragraph.add_run(token[1:-1])
            run.font.name = "Consolas"
            run.font.size = Pt(size - 0.5)
            run.font.color.rgb = ACCENT
        elif token.startswith("[") and "](" in token:
            label = token[1:token.index("](")]
            run = paragraph.add_run(label)
            run.font.size = Pt(size)
            run.font.color.rgb = ACCENT
            run.underline = True
        else:
            run = paragraph.add_run(token)
            run.font.size = Pt(size)
            run.font.color.rgb = color


# --- tables ------------------------------------------------------------
def parse_row(line):
    cells = line.strip().strip("|").split("|")
    return [c.strip().replace("\\|", "|") for c in cells]


def is_separator(line):
    return bool(re.match(r"^\|[\s:\-|]+\|?\s*$", line)) and "-" in line


def build_table(doc, header, rows, wide):
    ncols = len(header)
    size = 7.8 if ncols >= 7 else 8.6
    avail = (29.7 - 2 * MARGIN_LANDSCAPE) if wide else (21.0 - 2 * MARGIN_PORTRAIT)
    table = doc.add_table(rows=1, cols=ncols)
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    weights = []
    for c in range(ncols):
        longest = max([len(header[c])] + [len(r[c]) if c < len(r) else 0 for r in rows])
        weights.append(max(8, min(longest, 64)))
    total_w = sum(weights)
    widths = [max(1.5, avail * w / total_w) for w in weights]
    scale = avail / sum(widths)
    widths = [w * scale for w in widths]

    tbl_pr = table._tbl.tblPr
    layout = OxmlElement("w:tblLayout")
    layout.set(qn("w:type"), "fixed")
    tbl_pr.append(layout)

    hdr = table.rows[0]
    repeat_header(hdr)
    no_split(hdr)
    for i, text in enumerate(header):
        cell = hdr.cells[i]
        cell.width = Cm(widths[i])
        cell.text = ""
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        add_inline(p, text, size=size, color=WHITE)
        for run in p.runs:
            run.bold = True
        shade(cell, "16130F")

    for idx, row in enumerate(rows):
        tr = table.add_row()
        no_split(tr)
        for i in range(ncols):
            text = row[i] if i < len(row) else ""
            cell = tr.cells[i]
            cell.width = Cm(widths[i])
            cell.text = ""
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            add_inline(p, text, size=size, color=INK2)
            if idx % 2 == 1:
                shade(cell, "F2EEE6")

    cell_margins(table)
    tail = doc.add_paragraph()
    tail.paragraph_format.space_after = Pt(2)
    tail.paragraph_format.space_before = Pt(2)
    return table


# --- document ----------------------------------------------------------
def setup_styles(doc):
    normal = doc.styles["Normal"]
    normal.font.name = BODY_FONT
    normal.font.size = Pt(10)
    normal.font.color.rgb = INK
    normal._element.rPr.rFonts.set(qn("w:eastAsia"), BODY_FONT)
    normal.paragraph_format.space_after = Pt(6)
    normal.paragraph_format.line_spacing = 1.1

    specs = {
        "Heading 1": (19, ACCENT, 16, 6),
        "Heading 2": (14.5, INK, 13, 5),
        "Heading 3": (11.5, INK, 10, 4),
        "Heading 4": (10.5, INK2, 8, 3),
    }
    for name, (size, color, before, after) in specs.items():
        st = doc.styles[name]
        st.font.name = HEAD_FONT
        st.font.size = Pt(size)
        st.font.bold = True
        st.font.color.rgb = color
        st._element.rPr.rFonts.set(qn("w:eastAsia"), HEAD_FONT)
        st.paragraph_format.space_before = Pt(before)
        st.paragraph_format.space_after = Pt(after)
        st.paragraph_format.keep_with_next = True


def add_footer(section):
    footer = section.footer
    p = footer.paragraphs[0]
    p.text = ""
    p.paragraph_format.tab_stops.add_tab_stop(Cm(16.4), WD_TAB_ALIGNMENT.RIGHT)
    run = p.add_run("ОБРАЗ · анализ рынка цифрового гардероба")
    run.font.size = Pt(8)
    run.font.color.rgb = MUTED
    tab = p.add_run("\t")
    tab.font.size = Pt(8)
    add_field(p, "PAGE", size=8)


def new_section(doc, landscape):
    sec = doc.add_section(WD_SECTION.NEW_PAGE)
    if landscape:
        sec.orientation = WD_ORIENT.LANDSCAPE
        sec.page_width, sec.page_height = A4_H, A4_W
        m = MARGIN_LANDSCAPE
    else:
        sec.orientation = WD_ORIENT.PORTRAIT
        sec.page_width, sec.page_height = A4_W, A4_H
        m = MARGIN_PORTRAIT
    sec.top_margin = Cm(m)
    sec.bottom_margin = Cm(m)
    sec.left_margin = Cm(m)
    sec.right_margin = Cm(m)
    return sec


def cover(doc, title, subtitle, lines):
    for _ in range(4):
        doc.add_paragraph()

    p = doc.add_paragraph()
    r = p.add_run("АНАЛИТИКА РЫНКА · FASHION-TECH")
    r.font.size = Pt(9)
    r.font.name = BODY_FONT
    r.font.color.rgb = ACCENT
    r.bold = True
    p.paragraph_format.space_after = Pt(14)

    p = doc.add_paragraph()
    r = p.add_run(title)
    r.font.name = HEAD_FONT
    r.font.size = Pt(34)
    r.font.color.rgb = INK
    r.bold = True
    p.paragraph_format.space_after = Pt(10)
    bottom_border(p, "C8553D", 12)

    p = doc.add_paragraph()
    r = p.add_run(subtitle)
    r.font.name = HEAD_FONT
    r.font.size = Pt(14)
    r.font.color.rgb = INK2
    p.paragraph_format.space_after = Pt(26)

    for line in lines:
        p = doc.add_paragraph()
        r = p.add_run(line)
        r.font.size = Pt(10)
        r.font.color.rgb = MUTED
        p.paragraph_format.space_after = Pt(3)

    for _ in range(6):
        doc.add_paragraph()
    p = doc.add_paragraph()
    r = p.add_run("Документ подготовлен на основе открытых данных: сайты проектов, "
                  "страницы приложений в App Store, Google Play и RuStore. "
                  "Цены и функции проверены 09.11.2026 и могут меняться.")
    r.font.size = Pt(8.5)
    r.font.color.rgb = MUTED
    r.italic = True

    doc.add_page_break()


def convert(md_path: Path, out_path: Path):
    text = md_path.read_text(encoding="utf-8")
    lines = text.splitlines()

    doc = Document()
    setup_styles(doc)
    sec = doc.sections[0]
    sec.orientation = WD_ORIENT.PORTRAIT
    sec.page_width, sec.page_height = A4_W, A4_H
    sec.top_margin = Cm(MARGIN_PORTRAIT)
    sec.bottom_margin = Cm(MARGIN_PORTRAIT)
    sec.left_margin = Cm(MARGIN_PORTRAIT)
    sec.right_margin = Cm(MARGIN_PORTRAIT)
    add_footer(sec)

    title = "Анализ рынка цифрового гардероба и ИИ-стилистов"
    cover(doc, title,
          "27 сервисов, разбор пяти российских проектов и рекомендации для собственного продукта",
          ["Объекты разбора: Tidy · YeetStyle · Garde · Wearly · LOOKLAB",
           "Плюс 22 похожих сервиса из России, Европы, США и Азии",
           "Ноябрь 2026"])

    landscape = False
    i = 0
    skipped_title = False

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if not stripped:
            i += 1
            continue

        if stripped.startswith("<!--"):
            while i < len(lines) and "-->" not in lines[i]:
                i += 1
            i += 1
            continue

        if re.match(r"^-{3,}$", stripped):
            p = doc.add_paragraph()
            p.paragraph_format.space_after = Pt(2)
            i += 1
            continue

        if stripped.startswith("|") and i + 1 < len(lines) and is_separator(lines[i + 1]):
            header = parse_row(stripped)
            i += 2
            rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                rows.append(parse_row(lines[i]))
                i += 1
            wide = len(header) >= 7

            if wide and not landscape:
                new_section(doc, True)
                landscape = True
            elif not wide and landscape:
                new_section(doc, False)
                landscape = False

            build_table(doc, header, rows, wide)
            continue

        m = re.match(r"^(#{1,4})\s+(.*)$", stripped)
        if m:
            level = len(m.group(1))
            body = m.group(2).strip()
            if level == 1 and not skipped_title:
                skipped_title = True
                i += 1
                continue
            if landscape:
                new_section(doc, False)
                landscape = False
            if level == 2:
                p = doc.add_heading(level=1)
                add_inline(p, body, size=19, color=ACCENT)
                bottom_border(p, "DED4C5", 6)
            elif level == 3:
                p = doc.add_heading(level=2)
                add_inline(p, body, size=14.5, color=INK)
            elif level == 4:
                p = doc.add_heading(level=3)
                add_inline(p, body, size=11.5, color=INK)
            else:
                p = doc.add_heading(level=4)
                add_inline(p, body, size=10.5, color=INK2)
            for run in p.runs:
                run.font.name = HEAD_FONT
                run.bold = True
            i += 1
            continue

        if stripped.startswith(">"):
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Cm(0.6)
            add_inline(p, stripped.lstrip("> ").strip(), size=9.5, color=INK2)
            for run in p.runs:
                run.italic = True
            i += 1
            continue

        m = re.match(r"^(\s*)([-*+]|\d+\.)\s+(.*)$", line)
        if m:
            indent, marker, body = m.groups()
            level = 1 if len(indent) >= 2 else 0
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Cm(0.65 + level * 0.6)
            p.paragraph_format.first_line_indent = Cm(-0.45)
            p.paragraph_format.space_after = Pt(3)
            if marker in "-*+":
                bullet = BULLET + "  " if level == 0 else "\u2013  "
            else:
                bullet = marker + "  "
            r = p.add_run(bullet)
            r.font.size = Pt(9.5)
            r.font.color.rgb = ACCENT
            r.bold = True
            add_inline(p, body, size=10, color=INK2)
            i += 1
            continue

        buf = [stripped]
        i += 1
        while i < len(lines):
            nxt = lines[i]
            ns = nxt.strip()
            if (not ns or ns.startswith("#") or ns.startswith("|") or ns.startswith(">")
                    or re.match(r"^(\s*)([-*+]|\d+\.)\s+", nxt)
                    or re.match(r"^-{3,}$", ns)):
                break
            buf.append(ns)
            i += 1
        p = doc.add_paragraph()
        add_inline(p, " ".join(buf), size=10, color=INK)

    doc.core_properties.title = title
    doc.core_properties.author = "ОБРАЗ"
    doc.core_properties.subject = "Анализ рынка цифрового гардероба и ИИ-стилистов"
    doc.save(str(out_path))
    print("saved " + str(out_path) + " (" + str(out_path.stat().st_size) + " bytes)")


if __name__ == "__main__":
    convert(Path(sys.argv[1]), Path(sys.argv[2]))
