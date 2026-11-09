#!/usr/bin/env python3
"""Convierte protocolos/*.txt en protocolos.js y coteja cada uno con el texto del PDF.
Uso: python3 prot.py [ficheros.txt]   (sin argumentos: todos)
El cotejo necesita el texto del PDF en orden visual en protocolos/_pdf/<nombre>.txt
(se genera con la herramienta lineas)."""
import sys, os, re, json, html, difflib, unicodedata, glob

DIR = os.path.dirname(os.path.abspath(__file__))

def inline(s):
    s = html.escape(s, quote=False)
    s = s.replace("^**^", "\x01").replace("^*^", "\x02")
    s = re.sub(r"\*\*\*(.+?)\*\*\*", r"<b><i>\1</i></b>", s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    s = re.sub(r"__(.+?)__", r"<u>\1</u>", s)
    s = re.sub(r"(?<![*\w])\*(?!\s)(.+?)(?<!\s)\*(?![*\w])", r"<i>\1</i>", s)
    s = re.sub(r"\^(.+?)\^", r"<sup>\1</sup>", s)
    s = re.sub(r"~(.+?)~", r"<sub>\1</sub>", s)
    s = re.sub(r"\{\{(#[0-9a-fA-F]{6})\}\}", r'<span class="pdot" style="background:\1"></span>', s)
    return s.replace("\x01", "<sup>**</sup>").replace("\x02", "<sup>*</sup>")

def plain(s):
    s = re.sub(r"\{\{#[0-9a-fA-F]{6}\}\}", " ", s)
    s = re.sub(r"[~^]", "", s)
    return re.sub(r"\*\*|__|(?<![*\w])\*|\*(?![*\w])", " ", s)

def parse(path):
    meta, out, texto, img = {}, [], [], []
    para, lista, tabla, bib = [], [], [], False
    flujo = False
    ancha = False
    def cerrar():
        nonlocal para, lista, tabla, ancha
        if para:
            out.append("<p>" + "<br>".join(inline(x) for x in para) + "</p>"); para = []
        if lista:
            h, nivel = "", 0
            for n, t in lista:
                while nivel < n + 1: h += "<ul>"; nivel += 1
                while nivel > n + 1: h += "</ul>"; nivel -= 1
                h += "<li>" + inline(t) + "</li>"
            out.append(h + "</ul>" * nivel); lista = []
        if tabla:
            filas = [r for r in tabla if not re.fullmatch(r"\|[-\s|:]+\|?", r)]
            cab = len(tabla) > 1 and re.fullmatch(r"\|[-\s|:]+\|?", tabla[1])
            h = '<div class="ptab%s"><table>' % (" ancha" if ancha else ""); ancha = False
            for i, r in enumerate(filas):
                celdas = [c.strip() for c in r.strip().strip("|").split("|")]
                tg = "th" if (cab and i == 0) else "td"
                h += "<tr>"
                for c in celdas:
                    m = re.match(r"^\{(\d+)\}", c)
                    span = ' colspan="%s"' % m.group(1) if m else ""
                    c = re.sub(r"^\{\d+\}\s*", "", c)
                    mf = re.match(r"^\{fondo (#[0-9a-fA-F]{6})\}\s*", c)
                    if mf: span += ' class="pfondo" style="background:%s"' % mf.group(1); c = c[mf.end():]
                    cuerpo = inline(c).replace("//", "<br>")
                    h += "<%s%s>%s</%s>" % (tg, span, cuerpo, tg)
                h += "</tr>"
            out.append(h + "</table></div>"); tabla = []
    for raw in open(path, encoding="utf-8").read().splitlines():
        ln = raw.rstrip()
        if ln.startswith("@f "): meta["f"] = ln[3:].strip(); continue
        if ln.startswith("@p "): cerrar(); continue
        if ln.startswith("@flujo"):
            cerrar(); flujo = True; out.append('<div class="flujo">'); continue
        if ln.startswith("@finflujo"):
            flujo = False; out.append("</div>"); continue
        if ln.startswith("@deimg"):
            cerrar(); real = texto; texto = img; continue
        if ln.startswith("@findeimg"):
            cerrar(); texto = real; continue
        if ln.startswith("@pie "):
            texto.append(ln[5:]); continue
        if flujo:
            t = ln.strip()
            if not t: continue
            if t.startswith("@cols"): out.append('<div class="fcols%s"><div class="fcel">' % (" c3" if t == "@cols 3" else "")); continue
            if t == "---": out.append('</div><div class="fcel">'); continue
            if t == "@fincols": out.append("</div></div>"); continue
            if t == "v": out.append('<div class="farr">↓</div>'); continue
            m = re.match(r"^(\[\[|\[|\(|\? |\{(\d+)\} ?)(.*?)(\]\]|\]|\))?$", t)
            k = m.group(1) if m else ""
            cuerpo = (m.group(3) if m else t)
            cls = {"[[": "fbox dash", "[": "fbox", "(": "fside", "? ": "fq"}.get(k, "fnum" if k.startswith("{") else "ftxt")
            num = f'<span class="fn">{m.group(2)}</span>' if k.startswith("{") else ""
            out.append(f'<div class="{cls}">{num}{inline(cuerpo).replace("//", "<br>")}</div>')
            texto.append((m.group(2) + " " if num else "") + cuerpo.replace("//", " ")); continue
        if ln.strip() == "@ancha":
            cerrar(); ancha = True; continue
        if ln.startswith("@caja"):
            cerrar(); out.append('<div class="pcaja">'); continue
        if ln.startswith("@fin"):
            cerrar(); out.append("</div>"); continue
        if ln.startswith("@bib"):
            cerrar(); bib = True; tit = ln[4:].strip() or "Bibliografía"
            if ln[4:].strip(): texto.append(tit)
            out.append(f'<details class="pbib"><summary>{inline(tit)}</summary>'); continue
        if ln.startswith("@img "):
            cerrar(); out.append(f'<img class="fig" src="protocolos/img/{html.escape(ln[5:].strip())}" alt="">'); continue
        if not ln.strip(): cerrar(); continue
        if ln.startswith("!"):
            cerrar(); out.append('<div class="note n-info"><b>Nota del visor:</b> ' + inline(ln[1:].strip()) + "</div>"); continue
        if ln.startswith("|"):
            if para or lista: cerrar()
            tabla.append(ln); texto.append(re.sub(r"\{fondo #[0-9a-fA-F]{6}\}", "", re.sub(r"\|\s*\{\d+\}", "|", ln)).replace("|", " ").replace("//", " ")); continue
        if tabla: cerrar()
        m = re.match(r"^(#{1,3}) (.*)", ln)
        if m:
            cerrar(); out.append(f"<h{len(m.group(1))+2}>{inline(m.group(2))}</h{len(m.group(1))+2}>")
            texto.append(m.group(2)); continue
        m = re.match(r"^( *)- (.*)", ln)
        if m:
            if para: cerrar()
            lista.append((len(m.group(1)) // 2, m.group(2))); texto.append(m.group(2)); continue
        if lista:
            n, t = lista[-1]; lista[-1] = (n, t + " " + ln.strip()); texto.append(ln); continue
        para.append(ln.strip()); texto.append(ln)
    cerrar()
    if bib: out.append("</details>")
    return meta, "\n".join(out), plain("\n".join(texto)), len(" ".join(img).split())

def toks(s):
    s = unicodedata.normalize("NFC", s)
    s = s.replace(" ", " ").replace("ﬁ", "fi").replace("ﬂ", "fl")
    return re.findall(r"[<>≥≤±]|[\wºª%µ=+/·.,:;()\-]+", s.lower())

def norm_tok(t):
    return re.sub(r"[.,:;()\-]+$|^[.,:;()\-]+", "", t)

def cotejo(nombre, texto):
    ref = os.path.join(DIR, "_pdf", nombre + ".txt")
    if not os.path.exists(ref): return "sin texto del PDF"
    pdf = re.sub(r"^=== \[p\.\d+\] ===$", "", open(ref, encoding="utf-8").read(), flags=re.M)
    pdf = pdf.replace(" | ", " ")
    pdf = re.sub(r"[èàßÆ]", " ", pdf)  # flechas de Wingdings mal mapeadas (no hay francés ni alemán en el corpus)
    pdf = re.sub(r"(\w)-\n(\w)", r"\1-\2", pdf)
    pdf = re.sub(r"^\s*(o|Ø|[\uf000-\uf0ff•▪§·➢✓])\s+", "", pdf, flags=re.M)
    a = [x for x in map(norm_tok, toks(pdf)) if x]
    b = [x for x in map(norm_tok, toks(texto)) if x]
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    dif = []
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == "equal": continue
        dif.append(f"  PDF: {' '.join(a[i1:i2])[:200]!r}\n  APP: {' '.join(b[j1:j2])[:200]!r}")
    from collections import Counter
    ca, cb = Counter(a), Counter(b)
    falta = sorted((ca - cb).elements()); sobra = sorted((cb - ca).elements())
    r = f"{len(a)} palabras PDF, {len(b)} app, {len(dif)} tramos en distinto orden o distintos"
    if falta: r += f"\n  FALTA en la app: {' '.join(falta)}"
    if sobra: r += f"\n  SOBRA en la app: {' '.join(sobra)}"
    if VERB and dif: r += "\n" + "\n".join(dif)
    return r

VERB = "-v" in sys.argv
def main():
    fs = [f for f in sys.argv[1:] if f != "-v"] or sorted(glob.glob(os.path.join(DIR, "*.txt")))
    fs = [f for f in fs if not f.endswith("LEEME.txt")]
    js = os.path.join(DIR, "..", "protocolos.js")
    data = {}
    if os.path.exists(js):
        s = open(js, encoding="utf-8").read()
        data = json.loads(s[s.index("=") + 1:].rstrip().rstrip(";"))
    for f in fs:
        nombre = os.path.splitext(os.path.basename(f))[0]
        meta, h, texto, nimg = parse(f)
        data["1. Protocolos/" + meta["f"]] = {"h": h, "src": nombre}
        print(f"== {nombre}: {cotejo(nombre, texto)}" + (f"\n  ({nimg} palabras copiadas de imágenes, fuera del cotejo automático)" if nimg else ""))
    with open(js, "w", encoding="utf-8") as o:
        o.write("// Protocolos del servicio transcritos del PDF. Generado por protocolos/prot.py, no editar a mano.\n")
        o.write("window.PROTO=" + json.dumps(data, ensure_ascii=False, indent=0) + ";\n")

main()
