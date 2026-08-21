#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json, re, html
from pathlib import Path

ROOT = Path("/home/user/PAIA_ECOSYSTEME_REFONTE")
SRC = ROOT / "01_LIVRE_PRINCIPAL"
OUT = ROOT / "14_MACHINE_PAIA" / "js" / "book.js"

CAS = {
    "Mariam, Bamako": "cas_mariam.png",
    "Idrissa, Niamey": "cas_idrissa.png",
    "Awa, Dakar": "cas_awa.png",
    "Jean, Douala": "cas_jean.png",
    "Fatou, Abidjan": "cas_fatou.png",
    "Aminata, Ouagadougou": "cas_aminata.png",
    "Serge, Cotonou": "cas_serge.png",
    "Nadia, Lomé": "cas_nadia.png",
    "Moussa, Bamako": "cas_moussa.png",
    "Clarisse, Bujumbura": "cas_clarisse.png",
}

def md_inline(s):
    s = html.escape(s, quote=False)
    s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"\*(.+?)\*", r"<em>\1</em>", s)
    s = s.replace("&quot;", "«&nbsp;").replace("« ", "«&nbsp;").replace(" »", "&nbsp;»")
    return s

def md_block(text):
    lines = text.replace("\r\n", "\n").split("\n")
    out, i = [], 0
    while i < len(lines):
        ln = lines[i]
        if ln.startswith("# "):
            out.append(f"<h2>{md_inline(ln[2:].strip())}</h2>"); i += 1; continue
        if ln.startswith("## "):
            out.append(f"<h3>{md_inline(ln[3:].strip())}</h3>"); i += 1; continue
        if ln.startswith("### "):
            t = ln[4:].strip()
            m = re.match(r"CAS D’AFRIQUE — (.+)", t)
            if m and m.group(1) in CAS:
                who = m.group(1)
                out.append(
                    f'<figure class="cas"><img src="assets/cas/{CAS[who]}" alt="{html.escape(who)}">'
                    f"<figcaption>Cas d’Afrique — {md_inline(who)}</figcaption></figure>"
                )
                i += 1; continue
            cls = ""
            if t.startswith("LE DÉCLIC") or t.startswith("EN CHIFFRES") or t.startswith("ARME IA") or t.startswith("CHECKLIST") or t.startswith("À retenir"):
                cls = ' class="rub"'
            out.append(f"<h4{cls}>{md_inline(t)}</h4>"); i += 1; continue
        if ln.startswith("#### "):
            out.append(f"<h5>{md_inline(ln[5:].strip())}</h5>"); i += 1; continue
        if ln.strip() == "---":
            out.append("<hr>"); i += 1; continue
        if ln.startswith("> "):
            buf = []
            while i < len(lines) and (lines[i].startswith("> ") or lines[i].startswith(">")):
                buf.append(re.sub(r"^>\s?", "", lines[i])); i += 1
            out.append(f'<blockquote class="declic">{md_inline(" ".join(buf))}</blockquote>')
            continue
        if ln.startswith("|") and i + 1 < len(lines) and "---" in lines[i+1]:
            rows = []
            while i < len(lines) and lines[i].startswith("|"):
                cells = [c.strip() for c in lines[i].strip().strip("|").split("|")]
                if not re.match(r"^[-: ]+$", "".join(cells).replace(" ", "")):
                    rows.append(cells)
                i += 1
            if rows:
                head, body = rows[0], rows[1:]
                th = "".join(f"<th>{md_inline(c)}</th>" for c in head)
                trs = "".join("<tr>" + "".join(f"<td>{md_inline(c)}</td>" for c in r) + "</tr>" for r in body)
                out.append(f'<div class="tbl"><table><thead><tr>{th}</tr></thead><tbody>{trs}</tbody></table></div>')
            continue
        if re.match(r"^[-*] ", ln) or re.match(r"^\d+\. ", ln):
            items, ordered = [], bool(re.match(r"^\d+\. ", ln))
            while i < len(lines) and (re.match(r"^[-*] ", lines[i]) or re.match(r"^\d+\. ", lines[i])):
                items.append(re.sub(r"^([-*]|\d+\.)\s+", "", lines[i])); i += 1
            tag = "ol" if ordered else "ul"
            out.append(f"<{tag}>" + "".join(f"<li>{md_inline(x)}</li>" for x in items) + f"</{tag}>")
            continue
        if not ln.strip():
            i += 1; continue
        buf = [ln]
        i += 1
        while i < len(lines) and lines[i].strip() and not lines[i].startswith("#") and not lines[i].startswith(">") and not lines[i].startswith("|") and not re.match(r"^[-*] ", lines[i]) and not re.match(r"^\d+\. ", lines[i]) and lines[i].strip() != "---":
            buf.append(lines[i]); i += 1
        para = " ".join(x.strip() for x in buf)
        out.append(f"<p>{md_inline(para)}</p>")
    return "\n".join(out)

def split_chapters(md, vol):
    # Split on lines that are a single # heading (chapter-level)
    parts = re.split(r"\n(?=# [^\n]+)", "\n" + md)
    chs = []
    for part in parts:
        part = part.strip()
        if not part:
            continue
        first = part.split("\n", 1)[0]
        title = re.sub(r"^#\s+", "", first).strip()
        body = part.split("\n", 1)[1] if "\n" in part else ""
        chs.append((title, body))
    return chs

def slug(title, vol, i):
    t = title.lower()
    if "préface" in t or "preface" in t: return "preface"
    if "introduction" in t: return "intro"
    if title.startswith("CHAPITRE"):
        m = re.search(r"(\d)", title)
        return f"ch{m.group(1)}" if m else f"v{vol}-c{i}"
    if "conclusion" in t: return "fin"
    if "manifeste" in t: return "manifeste"
    if "partie iii" in t: return "p3"
    if "partie ii" in t and "suite" in t: return "p2s"
    if "partie ii" in t: return "p2"
    if "partie i" in t: return "p1"
    if "pont" in t or "volume 2" in t and "créer" not in t: return "pont"
    if "ressources" in t or "dernier mot" in t: return "ressources"
    if title.startswith("VOLUME"): return f"v{vol}-ouv"
    return f"v{vol}-{i}"

def main():
    files = [
        (SRC / "00_Preface_et_Introduction.md", 1),
        (SRC / "01_Volume_1_Comprendre_et_se_positionner.md", 1),
        (SRC / "02_Volume_2_Creer_de_la_valeur.md", 2),
    ]
    book = []
    seen = set()
    for path, vol in files:
        md = path.read_text(encoding="utf-8")
        for i, (title, body) in enumerate(split_chapters(md, vol)):
            if title.lower().startswith("préface et introduction"):
                continue
            sid = slug(title, vol, i)
            if sid in seen:
                sid = f"{sid}-{vol}-{i}"
            seen.add(sid)
            kind = "part" if title.upper().startswith("PARTIE") or title.upper().startswith("VOLUME") else "ch"
            html_body = md_block(body)
            # subtitle: first ## 
            sub = ""
            m = re.search(r"^## (.+)$", body, re.M)
            if m:
                sub = m.group(1).strip()
            book.append({
                "id": sid, "vol": vol, "kind": kind,
                "title": title, "sub": sub,
                "html": html_body,
            })
    OUT.write_text("window.PAIA_BOOK = " + json.dumps(book, ensure_ascii=False) + ";\n", encoding="utf-8")
    print("chapters", len(book), "bytes", OUT.stat().st_size)
    for c in book:
        print(f"  v{c['vol']} {c['id']:16} {c['title'][:60]}")

if __name__ == "__main__":
    main()
