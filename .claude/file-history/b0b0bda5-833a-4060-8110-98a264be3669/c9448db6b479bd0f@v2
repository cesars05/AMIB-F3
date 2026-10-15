"""Find numbers in a deck dump, normalise units, categorise them and flag conflicts.

    python extract_numbers.py deck_content.md            # list every figure by slide
    python extract_numbers.py deck_content.md --check    # only potential inconsistencies

Input: markdown with '## Slide N' markers (extract_text.py output).
Normalises $500M / $500MM / $0.5bn / $500,000,000 / Ps. 46,600 mm to one base value.
Categorises by keywords on the same line (revenue, EBITDA, net income, EPS, margin, multiple,
leverage, growth/CAGR, yield, price, value, debt, shares). Flags:
  * same category + same period label with different values on different slides
  * unit-style drift ($M vs $MM vs mm) across the deck
It is a screen, not proof: check every flag against the source and the narrative.
"""
import argparse
import collections
import re
import sys

CATS = {
    "revenue": r"revenue|sales|ventas|ingresos",
    "ebitda": r"ebitda",
    "net_income": r"net income|utilidad neta",
    "eps": r"\beps\b|per share|por acci[oó]n|\bupa\b",
    "margin": r"margin|margen",
    "leverage": r"net debt ?/ ?ebitda|leverage|apalancamiento|deuda neta ?/ ?ebitda",
    "multiple": r"ev ?/ ?ebitda|p ?/ ?e\b|multiple|m[uú]ltiplo",
    "growth": r"cagr|growth|crecimiento|yoy|y/y",
    "yield": r"yield|rendimiento",
    "price": r"price|precio|target|offer|oferta",
    "value": r"market cap|enterprise value|equity value|valor de mercado",
    "debt": r"\bdebt\b|deuda|notes|bond|bono",
    "shares": r"shares|acciones|units",
}
SCALE = {"k": 1e3, "thousand": 1e3, "m": 1e6, "mm": 1e6, "mn": 1e6, "million": 1e6, "millones": 1e6,
         "b": 1e9, "bn": 1e9, "billion": 1e9, "mil millones": 1e9, "t": 1e12, "tn": 1e12, "trillion": 1e12}
NUM = re.compile(
    r"(?P<cur>US\$|\$|Ps\.?|MXN|USD|EUR|€|£|¥)?\s?"
    r"(?P<num>\(?[-+]?\d{1,3}(?:,\d{3})+(?:\.\d+)?\)?|\(?[-+]?\d+(?:\.\d+)?\)?)"
    r"\s?(?P<unit>mil millones|thousand|million|millones|billion|trillion|bn|mm|mn|tn|[kmbt](?![a-z])|%|pp|bps|x)?",
    re.I)
PERIOD = re.compile(r"\b(?:FY|CY|LTM|NTM|Q[1-4])\s?'?\d{2,4}[AE]?\b|\b20\d{2}[AE]?\b", re.I)
MILLION_STYLES = ("m", "mm", "mn", "million", "millones")


def parse(md):
    slides, cur = {}, None
    for ln in md.splitlines():
        m = re.match(r"^##\s*Slide\s*(\d+)", ln, re.I)
        if m:
            cur = int(m.group(1))
            slides[cur] = []
        elif cur is not None and ln.strip():
            slides[cur].append(ln.strip())
    return slides


def figures(slides):
    out = []
    for n, lines in slides.items():
        for ln in lines:
            low = ln.lower()
            cats = [c for c, rx in CATS.items() if re.search(rx, low)]
            per = PERIOD.findall(ln)
            for m in NUM.finditer(ln):
                num, unit, cur = m.group("num"), (m.group("unit") or "").lower(), m.group("cur") or ""
                if not num:
                    continue
                bare = not unit and not cur
                if bare and re.fullmatch(r"\(?\d\)?", num):
                    continue  # footnote markers / list numbers
                if bare and re.fullmatch(r"(19|20)\d{2}", num):
                    continue  # years
                neg = num.startswith("(") or num.startswith("-")
                try:
                    v = float(num.strip("()+-").replace(",", ""))
                except ValueError:
                    continue
                base = v * SCALE.get(unit, 1) * (-1 if neg else 1)
                kind = ("pct" if unit in ("%", "pp", "bps") else "x" if unit == "x"
                        else "money" if (cur or unit in SCALE) else "num")
                out.append(dict(slide=n, raw=m.group(0).strip(), base=base, unit=unit, kind=kind,
                                cats=cats, periods=per, line=ln[:140]))
    return out


def check(figs):
    issues = []
    styles = collections.Counter(f["unit"] for f in figs if f["kind"] == "money" and f["unit"] in MILLION_STYLES)
    if len(styles) > 1:
        issues.append(f"UNIT STYLE DRIFT: millions written as {dict(styles)} - pick one ($M or $MM / mm)")
    groups = collections.defaultdict(list)
    for f in figs:
        if f["kind"] == "num" or not f["cats"] or not f["periods"]:
            continue
        for p in f["periods"]:
            groups[(f["cats"][0], p.upper().replace("'", "").replace(" ", ""), f["kind"])].append(f)
    for (c, p, k), fs in sorted(groups.items()):
        vals = collections.defaultdict(set)
        raw = {}
        for f in fs:
            key = round(f["base"], 4)
            vals[key].add(f["slide"])
            raw.setdefault(key, f["raw"])
        involved = {s for ss in vals.values() for s in ss}
        if len(vals) > 1 and len(involved) > 1:
            desc = "; ".join(f"{raw[v]} on slide(s) {sorted(s)}" for v, s in vals.items())
            issues.append(f"[{c} | {p} | {k}] different values: {desc}")
    return issues


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("md")
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    figs = figures(parse(open(a.md, encoding="utf-8").read()))
    if a.check:
        iss = check(figs)
        print(f"{len(figs)} figures scanned; {len(iss)} potential issues")
        for i in iss:
            print(" -", i)
        if not iss:
            print("No number inconsistencies flagged by the screen (still verify totals, CAGRs and narrative).")
    else:
        for f in figs:
            print(f"S{f['slide']:>2} {f['raw']:>16}  {f['kind']:<5} {','.join(f['cats']) or '-':<22} {' '.join(f['periods'])}")
