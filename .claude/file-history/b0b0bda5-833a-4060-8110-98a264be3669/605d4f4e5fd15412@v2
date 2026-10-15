"""tclib.py - reuse think-cell library diagrams (funnels, pyramids, cycles, swim lanes, road maps,
timelines, matrices, Venn, icons ...) as native, recoloured, text-replaceable shapes.

Sources
  * the user's curated deck: PROJECT/06_Templates/Thinkcell.pptx           (key "tc:<n>")
  * the installed think-cell library: C:/Program Files (x86)/think-cell/templates/**.potx
    (key "<file stem>:<n>", e.g. "Processes, Flow Charts, Phases:12"; see references/thinkcell-library.md)

Usage (through house.Deck):
    s = d.content_slide("Three-Step Integration Plan", "...", source="...")
    slots = d.tc_slots("tc:13")                       # print/inspect text slots in reading order
    d.import_elements(s, "tc:13", box=(0.575, 1.5, 12.3, 5.2),
                      texts={0: "Diligence", 1: "Weeks 1-4", 2: ["Line 1", "Line 2"], ...})

What happens
  1. every shape of the library slide is deep-copied except the title placeholder, the
     'Keywords:' caption and think-cell data objects (OLE);
  2. scheme colours are resolved through the SOURCE theme and re-mapped to the deck's style
     system (teal -> primary, light grey -> grey1, green icons -> primary ...); SVG icons too;
  3. fonts are forced to the system font; think-cell tags are stripped (shapes become plain
     PowerPoint shapes, so no think-cell licence is needed to edit them);
  4. everything is wrapped in one group scaled into `box` (aspect kept, centred).
Text sizes do not scale with the group - keep boxes close to the original size (scale 0.8-1.1).
"""
from __future__ import annotations

import copy
import glob
import os
import re

from lxml import etree
from pptx import Presentation
from pptx.opc.constants import RELATIONSHIP_TYPE as RT
from pptx.opc.package import Part
from pptx.opc.packuri import PackURI

NS = {"a": "http://schemas.openxmlformats.org/drawingml/2006/main",
      "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
      "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships"}
A, P, R = NS["a"], NS["p"], NS["r"]
EMU = 914400

PROJECT = r"C:\Users\cesar\OneDrive\Documentos\Slide Construction"
USER_DECK = os.path.join(PROJECT, "06_Templates", "Thinkcell.pptx")
TC_ROOT = r"C:\Program Files (x86)\think-cell\templates"

_cache = {}


def _x(el, path):
    return etree.XPath(path, namespaces=NS)(el)


def resolve(key):
    """'tc:13' -> (user deck, 13); '<stem>:<n>' -> (library potx, n); or (path, n)."""
    if isinstance(key, tuple):
        return key
    src, n = key.rsplit(":", 1)
    n = int(n)
    if src == "tc":
        return USER_DECK, n
    want = src.replace("/", os.sep).lower()
    allf = glob.glob(os.path.join(TC_ROOT, "**", "*.potx"), recursive=True)
    rel = lambda f: os.path.splitext(os.path.relpath(f, TC_ROOT))[0].lower()
    hits = [f for f in allf if rel(f) == want] or            [f for f in allf if rel(f).endswith(os.sep + want) or os.path.splitext(os.path.basename(f))[0].lower() == want]
    if not hits:
        raise FileNotFoundError(f"think-cell library file '{src}' not found under {TC_ROOT}")
    if len(hits) > 1:
        hits.sort(key=lambda f: ("useful elements" in f.lower(), f))  # prefer the full-slide 'Diagrams' version
    return hits[0], n


def _open(path):
    if path not in _cache:
        if path.lower().endswith(".potx"):  # python-pptx refuses the template content type
            import shutil
            import tempfile
            tmp = os.path.join(tempfile.gettempdir(), "tclib_" + re.sub(r"[^\w]", "_", os.path.basename(path)) + ".pptx")
            if not os.path.exists(tmp):
                shutil.copy(path, tmp)
                _fix_potx(tmp)
            _cache[path] = Presentation(tmp)
        else:
            _cache[path] = Presentation(path)
    return _cache[path]


def _fix_potx(path):
    """Rewrite the main content type from template to presentation so python-pptx can open it."""
    import zipfile
    import shutil
    tmp = path + ".tmp"
    with zipfile.ZipFile(path) as zin, zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zout:
        for it in zin.infolist():
            data = zin.read(it.filename)
            if it.filename == "[Content_Types].xml":
                data = data.replace(b"application/vnd.openxmlformats-officedocument.presentationml.template.main+xml",
                                    b"application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml")
            zout.writestr(it, data)
    shutil.move(tmp, path)


def _theme_colors(prs):
    th = prs.slide_master.part.part_related_by(RT.THEME)
    x = etree.fromstring(th.blob)
    out = {}
    for c in x.find(".//a:clrScheme", NS):
        name = etree.QName(c).localname
        v = c[0].get("lastClr") or c[0].get("val")
        out[name] = v.upper()
    out.update({"tx1": out.get("dk1", "000000"), "bg1": out.get("lt1", "FFFFFF"),
                "tx2": out.get("dk2", "0E2841"), "bg2": out.get("lt2", "E8E8E8")})
    if out.get("tx1") in ("WINDOWTEXT",):
        out["tx1"] = "000000"
    if out.get("bg1") in ("WINDOW",):
        out["bg1"] = "FFFFFF"
    out["dk1"], out["lt1"] = out["tx1"], out["bg1"]
    return out


def palette_map(S):
    """Source hex (think-cell default theme) -> deck colour."""
    h = lambda k: S[k].lstrip("#").upper()
    return {
        "156082": h("primary"),        # accent1 teal (main highlight)
        "0E2841": h("primary_dark"),   # dk2 navy
        "0F9ED5": h("tint1"),          # accent4 light blue
        "4EA72E": h("primary"),        # accent6 green (icons, road pins) -> brand
        "196B24": h("primary_dark"),   # accent3 dark green
        "E97132": h("accent"),         # accent2 orange
        "A02B93": h("tint1"),          # accent5 purple
        "E8E8E8": h("grey1") if S["name"] != "femsa" else "EFEFEF",  # lt2 panels
        "467886": h("primary"),
        "_primary": h("primary"), "_tint1": h("tint1"), "_tint2": h("tint2"),
    }


def _remap(hexv, pmap):
    """Exact map first; otherwise any saturated colour -> primary / tint by lightness; greys unchanged."""
    import colorsys
    hexv = hexv.upper()
    if hexv in pmap:
        return pmap[hexv]
    r, g, b = (int(hexv[i:i + 2], 16) / 255 for i in (0, 2, 4))
    h, l, sat = colorsys.rgb_to_hls(r, g, b)
    if sat < 0.25 or max(r, g, b) - min(r, g, b) < 0.12:
        return hexv
    if l > 0.85:
        return pmap.get("_tint2", hexv)
    if l > 0.62:
        return pmap.get("_tint1", hexv)
    return pmap.get("_primary", hexv)


def _resolve_colors(root, theme, pmap):
    """schemeClr -> srgbClr (through source theme) then palette map; keeps lumMod/alpha children."""
    for sc in list(root.iter(f"{{{A}}}schemeClr")):
        val = sc.get("val")
        hexv = theme.get(val, None)
        if hexv is None or val == "phClr":
            continue
        new = etree.Element(f"{{{A}}}srgbClr", val=_remap(hexv, pmap) if pmap else hexv)
        for ch in sc:
            new.append(ch)
        sc.getparent().replace(sc, new)
    for rc in root.iter(f"{{{A}}}srgbClr"):
        v = (rc.get("val") or "").upper()
        if pmap and len(v) == 6:
            rc.set("val", _remap(v, pmap))


def _force_font(root, font):
    for tag in ("rPr", "defRPr", "endParaRPr"):
        for rp in root.iter(f"{{{A}}}{tag}"):
            lat = rp.find(f"{{{A}}}latin")
            if lat is None:
                lat = etree.Element(f"{{{A}}}latin")
                # schema: ln, fill, effect, highlight, uLnTx/uLn, uFillTx/uFill, latin, ea, cs, sym, hlink...
                anchor = None
                for prev in ("ea", "cs", "sym", "hlinkClick", "hlinkMouseOver", "rtl", "extLst"):
                    anchor = rp.find(f"{{{A}}}{prev}")
                    if anchor is not None:
                        break
                if anchor is not None:
                    anchor.addprevious(lat)
                else:
                    rp.append(lat)
            lat.set("typeface", font)


def _strip_tc(root):
    for tag in (f"{{{P}}}custDataLst",):
        for e in list(root.iter(tag)):
            e.getparent().remove(e)
    for e in list(root.iter(f"{{{A}}}hlinkClick")):
        e.getparent().remove(e)


def _text_of(el):
    return "".join(t.text or "" for t in el.iter(f"{{{A}}}t")).strip()


def _keep(el):
    tag = etree.QName(el).localname
    if tag not in ("sp", "grpSp", "pic", "cxnSp", "graphicFrame"):
        return False
    if tag == "graphicFrame":
        if _x(el, ".//p:oleObj") or "oleObj" in etree.tostring(el).decode()[:4000]:
            return False  # think-cell data object
        return bool(_x(el, ".//a:tbl"))  # keep tables, drop charts/OLE
    if _x(el, "./p:nvSpPr/p:nvPr/p:ph"):
        return False  # title placeholder
    txt = _text_of(el)
    if txt.lower().startswith("keywords:"):
        return False
    return True


def _bbox(els):
    xs, ys, xe, ye = [], [], [], []
    for el in els:
        off = _x(el, "./*/a:xfrm/a:off | ./p:grpSpPr/a:xfrm/a:off | ./p:xfrm/a:off")
        ext = _x(el, "./*/a:xfrm/a:ext | ./p:grpSpPr/a:xfrm/a:ext | ./p:xfrm/a:ext")
        if not off or not ext:
            continue
        x, y = int(off[0].get("x")), int(off[0].get("y"))
        w, h = int(ext[0].get("cx")), int(ext[0].get("cy"))
        xs.append(x); ys.append(y); xe.append(x + w); ye.append(y + h)
    return min(xs), min(ys), max(xe), max(ye)


def _slot_order(els):
    """Text-bearing sp elements (recursing into groups) sorted top-to-bottom, left-to-right."""
    found = []

    def walk(e, dx=0, dy=0, sx=1.0, sy=1.0):
        tag = etree.QName(e).localname
        if tag == "grpSp":
            xf = _x(e, "./p:grpSpPr/a:xfrm")[0]
            off, ext = xf.find(f"{{{A}}}off"), xf.find(f"{{{A}}}ext")
            choff, chext = xf.find(f"{{{A}}}chOff"), xf.find(f"{{{A}}}chExt")
            gsx = int(ext.get("cx")) / max(int(chext.get("cx")), 1)
            gsy = int(ext.get("cy")) / max(int(chext.get("cy")), 1)
            ndx = dx + sx * (int(off.get("x")) - int(choff.get("x")) * gsx)
            ndy = dy + sy * (int(off.get("y")) - int(choff.get("y")) * gsy)
            for c in e:
                if etree.QName(c).localname in ("sp", "grpSp", "pic", "cxnSp"):
                    walk(c, ndx, ndy, sx * gsx, sy * gsy)
            return
        if tag == "sp" and e.find(f"{{{P}}}txBody") is not None and _text_of(e):
            off = _x(e, "./p:spPr/a:xfrm/a:off")
            x = dx + sx * int(off[0].get("x")) if off else 0
            y = dy + sy * int(off[0].get("y")) if off else 0
            found.append((round(y / EMU / 0.15), x, e))

    for el in els:
        walk(el)
    found.sort(key=lambda t: (t[0], t[1]))
    return [f[2] for f in found]


def slots(key, show=True):
    """List the text slots (index, position, current text) of a library slide."""
    path, n = resolve(key)
    sl = _open(path).slides[n - 1]
    els = [e for e in sl.shapes._spTree if _keep(e)]
    out = []
    for i, e in enumerate(_slot_order(els)):
        paras = ["".join(t.text or "" for t in p.iter(f"{{{A}}}t")) for p in e.iter(f"{{{A}}}p")]
        out.append(paras)
        if show:
            print(f"[{i:>2}] " + " / ".join(p for p in paras if p)[:110])
    return out


def _set_text(sp, value):
    """value: str or list[str] (one per paragraph). Keeps formatting of existing paragraphs/runs."""
    txb = sp.find(f"{{{P}}}txBody")
    paras = txb.findall(f"{{{A}}}p")
    lines = value if isinstance(value, list) else [value]
    while len(paras) < len(lines):  # clone the last paragraph for extra lines
        newp = copy.deepcopy(paras[-1])
        paras[-1].addnext(newp)
        paras.append(newp)
    for p, line in zip(paras, lines):
        runs = p.findall(f"{{{A}}}r")
        if not runs:
            r = etree.SubElement(p, f"{{{A}}}r")
            etree.SubElement(r, f"{{{A}}}t")
            end = p.find(f"{{{A}}}endParaRPr")
            if end is not None:
                end.addprevious(r)
            runs = [r]
        runs[0].find(f"{{{A}}}t").text = line
        for r in runs[1:]:
            p.remove(r)
        for f in p.findall(f"{{{A}}}fld"):
            p.remove(f)
    for p in paras[len(lines):]:
        txb.remove(p)


def _copy_rels(el, src_part, dst_part):
    """Re-create image/svg relationships referenced by r:embed / r:link / r:id inside el."""
    pkg = dst_part.package
    for node in el.iter():
        for attr in list(node.attrib):
            if not attr.startswith(f"{{{R}}}"):
                continue
            rid = node.get(attr)
            try:
                rel = src_part.rels[rid]
            except KeyError:
                continue
            if rel.is_external:
                node.attrib.pop(attr)
                continue
            tp = rel.target_part
            if rel.reltype != RT.IMAGE:
                node.attrib.pop(attr)
                continue
            ext = os.path.splitext(str(tp.partname))[1].lstrip(".") or "png"
            partname = pkg.next_image_partname(ext) if hasattr(pkg, "next_image_partname") else \
                PackURI(f"/ppt/media/tclib_{id(tp)}_{rid}.{ext}")
            blob = tp.blob
            new = Part(PackURI(partname) if not isinstance(partname, PackURI) else partname,
                       tp.content_type, pkg, blob)
            new_rid = dst_part.relate_to(new, RT.IMAGE)
            node.set(attr, new_rid)
            if ext == "svg":
                new._blob = blob  # recoloured later
    return el


def _recolor_svgs(dst_part, el, pmap, icon_color=None):
    for node in el.iter():
        rid = node.get(f"{{{R}}}embed")
        if not rid:
            continue
        try:
            part = dst_part.related_part(rid)
        except KeyError:
            continue
        if str(part.partname).endswith(".svg"):
            txt = part.blob.decode("utf-8", "ignore")
            # Office theme classes (MsftOfcThm_Accent6_Fill_v2 ...) make PowerPoint re-tint the icon with the
            # TARGET theme's accent -> drop them and paint every non-white fill/stroke in the icon colour.
            txt = re.sub(r'\s*class="MsftOfcThm_[^"]*"', "", txt)
            txt = re.sub(r"\.MsftOfcThm_[^{]*\{[^}]*\}", "", txt)
            icon = icon_color or next(iter(pmap.values()), None)
            if icon:
                txt = re.sub(r"(fill|stroke)(=\"|:\s*)#(?!FFFFFF|ffffff)[0-9A-Fa-f]{6}",
                             lambda m: f"{m.group(1)}{m.group(2)}#{icon}", txt)
            part._blob = txt.encode("utf-8")


def import_elements(slide, key, S, box=None, texts=None, recolor=True, font=True, align="center"):
    """Copy a library slide's diagram into `slide`, scaled into box=(x,y,w,h) inches. Returns the group element."""
    path, n = resolve(key)
    src_prs = _open(path)
    src_sl = src_prs.slides[n - 1]
    theme = _theme_colors(src_prs)
    pmap = palette_map(S) if recolor else {}
    els = [copy.deepcopy(e) for e in src_sl.shapes._spTree if _keep(e)]
    if not els:
        raise ValueError(f"{key}: nothing to import")
    x0, y0, x1, y1 = _bbox(els)
    for e in els:
        _strip_tc(e)
        _copy_rels(e, src_sl.part, slide.part)
        _resolve_colors(e, theme, pmap)
        if font:
            _force_font(e, S["font"])
    if texts:
        order = _slot_order(els)
        items = texts.items() if isinstance(texts, dict) else enumerate(texts)
        for i, v in items:
            if v is not None and i < len(order):
                _set_text(order[i], v)
    # wrapper group
    w0, h0 = x1 - x0, y1 - y0
    if box:
        bx, by, bw, bh = [int(v * EMU) for v in box]
        k = min(bw / w0, bh / h0)
        tw, th = int(w0 * k), int(h0 * k)
        tx = bx + (bw - tw) // 2 if align == "center" else bx
        ty = by + (bh - th) // 2 if align == "center" else by
    else:
        tx, ty, tw, th = x0, y0, w0, h0
    sptree = slide.shapes._spTree
    gid = max([int(i) for i in _x(sptree, ".//p:cNvPr/@id")] + [1]) + 1
    grp = etree.SubElement(sptree, f"{{{P}}}grpSp")
    nv = etree.SubElement(grp, f"{{{P}}}nvGrpSpPr")
    etree.SubElement(nv, f"{{{P}}}cNvPr", id=str(gid), name=f"tclib {os.path.basename(path)} #{n}")
    etree.SubElement(nv, f"{{{P}}}cNvGrpSpPr")
    etree.SubElement(nv, f"{{{P}}}nvPr")
    gpr = etree.SubElement(grp, f"{{{P}}}grpSpPr")
    xf = etree.SubElement(gpr, f"{{{A}}}xfrm")
    etree.SubElement(xf, f"{{{A}}}off", x=str(tx), y=str(ty))
    etree.SubElement(xf, f"{{{A}}}ext", cx=str(tw), cy=str(th))
    etree.SubElement(xf, f"{{{A}}}chOff", x=str(x0), y=str(y0))
    etree.SubElement(xf, f"{{{A}}}chExt", cx=str(w0), cy=str(h0))
    # unique ids for copied shapes
    nid = gid + 1
    for e in els:
        for c in e.iter(f"{{{P}}}cNvPr"):
            c.set("id", str(nid))
            nid += 1
        grp.append(e)
    if recolor:
        _recolor_svgs(slide.part, grp, pmap, icon_color=S["primary"].lstrip("#").upper())
    return grp
