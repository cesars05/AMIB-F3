"""Structural-diagram gallery: 'explain the structure with shapes' recipes + think-cell library imports.

    python gallery_structural.py femsa out.pptx ["...\\M&A FEMSA.pptx"] ["Section Header"]
    python gallery_structural.py aztlan out.pptx ["...\\AZTD vs Peers_v6.pptx"] [General]
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from house import Deck  # noqa: E402

SYSTEM = sys.argv[1] if len(sys.argv) > 1 else "femsa"
OUT = sys.argv[2] if len(sys.argv) > 2 else f"structural_{SYSTEM}.pptx"
TEMPLATE = sys.argv[3] if len(sys.argv) > 3 else None
LAYOUT = sys.argv[4] if len(sys.argv) > 4 else ("Section Header" if SYSTEM == "femsa" else "General")
SRC = "Illustrative data - structural gallery"

d = Deck(SYSTEM, template=TEMPLATE, layout=LAYOUT)
S = d.S
C = S["content"]
X0, X1 = C["x0"], C["x1"]
W = X1 - X0

# 1 Process chain (KLA s7) ---------------------------------------------------------
s = d.content_slide("The Company Sits Inside Every Step of the Chain",
                    "Metrology and inspection intercept the process after nearly every layer", SRC)
d.text(s, X0, 1.45, W, 0.55, "- Lets manufacturers **catch and correct errors before they compound**, which matters more as chips grow larger: one defect can cost 10% of a wafer's yield.", size=12)
boxes = d.process_chain(s, X0, 2.55, W,
                        [("Wafers", "input"), ("Wafer Quality", "neutral"), ("Deposition", "focus"),
                         ("Lithography", "focus"), ("Etch", "focus"), ("CMP", "focus"),
                         ("Repeat Process", "neutral"), ("Packaging", "end")],
                        focus=(2, 6), focus_label="Process Control",
                        row2=[("Reticles", "input"), ("Reticle Quality", "neutral")],
                        feedback=[(6, 2), (3, "r2_1")])
d.detail_card(s, 4.2, 4.85, 3.46, "Metrology",
              "**Measures alignment at 3,000+ points per wafer,** feeding corrections back to the tool **so the next wafer prints more precisely.**")
d.detail_card(s, 8.0, 4.85, 3.46, "Inspection & Data Analytics",
              "**Scans for random defects across the wafer** and checks **100% of every reticle**, tracing each defect to its source.")

# 2 Share structure (ALLOC s3) ------------------------------------------------------
s = d.content_slide("Share Structure: Two Listings, Three Classes",
                    "Units bundle limited- and full-vote shares; ADSs trade in New York, units in Mexico", SRC)
y = d.block_header(s, X0, 1.47, 7.0, "Share structure as of 1-Apr-2026")
lim, full, unit = S["tint2"], "#FEF3DA", S["primary"]
d.legend_items(s, X0, y + 0.05, [("Trading unit", unit), ("Limited vote", lim), ("Full vote", full)])
sd = d.struct_box(s, X0 + 2.55, y + 0.05, 1.8, 0.62, "Series D", "7,982,735,660", fill=lim)
db = d.struct_box(s, X0 + 1.7, y + 0.85, 1.6, 0.78, "Sub-series D-B", "3,991,367,830", fill=lim)
dl = d.struct_box(s, X0 + 3.55, y + 0.85, 1.6, 0.78, "Sub-series D-L", "3,991,367,830", fill=lim)
sb = d.struct_box(s, X0 + 5.4, y + 0.85, 1.6, 0.78, "Series B", "9,080,926,415", fill=full)
ads = d.struct_box(s, X0 + 0.5, y + 2.0, 1.8, 0.78, "ADS", "1:10 BD Units", fill="#C7DFEF")
bd = d.struct_box(s, X0 + 2.95, y + 2.0, 1.8, 0.78, "BD Units", "1,995,683,915", fill=unit,
                  note=["1 BD Unit:", "- 2 Series D-B", "- 2 Series D-L", "- 1 Series B"])
bu = d.struct_box(s, X0 + 5.4, y + 2.0, 1.6, 0.78, "B Units", "1,417,048,500", fill=full, note="1 B Unit = 5 Series B")
ny = d.struct_box(s, X0 + 0.5, y + 3.75, 1.8, 0.5, "NYSE", None, fill="#3D8FC9")
bmv = d.struct_box(s, X0 + 4.15, y + 3.75, 1.8, 0.5, "BMV", None, fill="#8087A1")
d.connect(s, ads, ny)
d.connect(s, (bd[0] + 1.2, bd[1], 0.4, bd[3]), (bmv[0], bmv[1], 0.4, bmv[3]))
d.connect(s, (bu[0] + 1.2, bu[1], 0.4, bu[3]), (bmv[0] + 1.4, bmv[1], 0.4, bmv[3]))
d.rect(s, 8.55, 1.42, X1 - 8.55, 5.3, fill=S["grey1"])
d.text(s, 8.65, 1.5, X1 - 8.75, 5.1, ["**Characteristics of the common shares**", "",
                                      "- **Series B:** unlimited vote; at least 51% of capital; the control series.",
                                      "- **Series D:** limited vote; up to 49% of capital; split into D-B and D-L.",
                                      "- **BD Units:** 1 Series B + 2 D-B + 2 D-L; trade on the BMV and, as ADSs, on the NYSE.",
                                      "- **B Units:** 5 Series B shares; trade only on the BMV."], size=11, align="justify")

# 3 Nested circles (ALLOC s4) --------------------------------------------------------
s = d.content_slide("A Voting Trust Controls 76% of the Vote",
                    "Free float ~52% of capital; voting trust 40.6% of capital and 76.3% of Series B", SRC)
d.nested_circles(s, X0 + 0.3, 1.55, 5.0,
                 [("Free float", ["~52% of capital", "46.4% of BD Units via ADS"], None, 1.0),
                  ("Voting Trust", ["40.6% of total capital", "76.3% of Series B (vote)"], S["tint1"], 0.62),
                  ("Single holder", ["8.2% of capital"], "#E6E6E6", 0.33)],
                 callouts=[("Institutional free float", ["Held mostly by international and domestic funds", "Sensitive to capital-return signals"]),
                           ("Voting Trust", ["Four families acting as a block until 2030", "A buyback lifts its stake without spending capital"]),
                           ("Single large holder", ["Holds mostly limited-vote Series D", "No challenge to control"])],
                 text_x=7.4)

# 4 Price range (ALLOC s14) ------------------------------------------------------------
s = d.content_slide("Buyback Range: Spot to Intrinsic Value",
                    "Repurchases create value only between $214.5 (spot) and $238.7 (DCF value)", SRC)
y = d.block_header(s, X0, 1.47, 6.0, "Buyback price range")
d.price_range(s, X0 + 0.4, y + 1.6, 5.4, 205, 245, [(214.5, "dark"), (234.4, "primary"), (238.7, "dark")],
              band=(212, 240, "Range that creates value for holders"), callout=(234.4, "Consensus"))
y2 = d.block_header(s, 7.05, 1.47, X1 - 7.05, "Where the buyback creates value")
d.text(s, 7.05, y2 + 0.05, X1 - 7.05, 3.0, [
    "- A buyback only **creates value** if executed **below intrinsic value**; paying more transfers wealth to sellers.",
    "- The lower bound is anchored at **spot**, the natural starting point of any execution.",
    "- The upper bound is the **DCF value**: buying above it **destroys value** for holders who stay."], size=12)

# 5 Cylinder bridge (ALLOC s8) ---------------------------------------------------------
s = d.content_slide("Excess Cash: Ps. 32bn of Capacity at 2.0x Leverage",
                    "Approved returns of Ps. 46.6bn still leave room before the 2.0x ND/EBITDA target", SRC)
d.cylinder_bridge(s, X0 + 0.2, 1.75, W - 0.4, 3.9,
                  [("Net debt (2025A)", "Ps. 74,920 mm", "Net debt / EBITDA", "1.02x"),
                   ("Ordinary dividend", "Ps. 15,200 mm", "Extraordinary div.", "Ps. 25,800 mm"),
                   ("Pending buybacks", "Ps. 5,600 mm", None, None),
                   ("Cash (2026E)", "Ps. 59,608 mm", "Gross debt (2026E)", "Ps. 178,372 mm"),
                   ("Net debt (2026E)", "Ps. 118,765 mm", "ND / EBITDA", "1.57x"),
                   ("Excess cash", "Ps. 32,121 mm", "ND / EBITDA", "2.00x")],
                  operators=["-", "-", "≈", "", ""], bracket=(1, 2, "Ps. 46,600 mm", "Total approved capital return"))

# 6 Conclusion: progression chevrons + boxes + tail bar + bullet columns (ALLOC s16) --------
s = d.content_slide("Executive Summary", "From today's balance sheet to the target scenario", SRC)
chev, cw = d.chevron_row(s, X0, 1.5, W, ["Current situation", "2026 programme", "The opportunity", "Target scenario"],
                         h=0.52, size=15, fills=d.progression(4), first_pentagon=True, gap=-0.05)
d.boxed_columns(s, X0 + 0.15, 2.2, W - 0.3,
                [["**Cash & equivalents**", "$99,955", "**Net debt**", "$74,920", "**ND / EBITDA**", "1.02x"],
                 ["**Returns approved**", "Ps. ~47,000 mm", "**ND / EBITDA 2026E**", "1.57x"],
                 ["**Excess cash**", "Ps. 32,121 mm"],
                 ["**Proposal**", "Dividends 30% / Buybacks 70%", "**ND / EBITDA**", "2.0x"]], h=1.95, size=11)
yb = d.tail_bar(s, X0, 4.4, W, "Conclusions", h=0.45)
d.bullet_columns(s, X0, yb + 0.15, W, [
    "**The company holds excess cash** that can be returned via dividends or buybacks without hurting its capital structure",
    "**With a dividend yield already above the market**, raising the dividend adds little perceived value",
    "**The stock trades at a discount**; buying back shares is the allocation with the highest risk-adjusted return"],
    h=1.5, size=11)

# 7-10 think-cell library imports, recoloured -------------------------------------------
s = d.content_slide("Integration Plan in Four Stages", "think-cell 'Process stages' (tc:13) recoloured to the house palette", SRC)
d.import_elements(s, "tc:13", box=(X0, 1.6, W, 4.9), texts={
    0: ["Diligence", "Weeks 1-4", "Confirm synergies, legal and tax structure"],
    1: ["Signing", "Week 6", "SPA, financing commitments and announcement"],
    2: ["Approvals", "Weeks 6-20", "Antitrust and shareholder approvals"],
    3: ["Closing", "Week 24", "Funds flow and day-one integration"],
    4: "Phase 1", 5: "Phase 2", 6: "Phase 3", 7: "Phase 4"})

s = d.content_slide("Four Levers of the Plan", "think-cell 'Four circle segments' (tc:15)", SRC)
d.import_elements(s, "tc:15", box=(X0, 1.5, W, 5.1))

s = d.content_slide("From Today to 2030", "think-cell 'Road map' (tc:18)", SRC)
d.import_elements(s, "tc:18", box=(X0, 1.5, W, 5.1))

s = d.content_slide("Phases and Milestones", "think-cell 'Phases/processes' (tc:24)", SRC)
d.import_elements(s, "tc:24", box=(X0, 1.5, W, 5.1))

s = d.content_slide("Five Layers of the Moat", "think-cell 'Pyramid with five layers' (tc:4) with icons recoloured", SRC)
d.import_elements(s, "tc:4", box=(X0, 1.5, W, 5.1), texts={
    0: "A moat is only as strong as its weakest layer",
    1: ["Scale and installed base", "17,000 tools in the field generate recurring service revenue"],
    3: ["Intellectual property", "9,100 patents; 6.5x the share of the nearest competitor"],
    5: ["Customer lock-in", "Recipes are qualified tool by tool; switching costs a full node"],
    7: ["Data", "Defect libraries improve with every wafer inspected"],
    9: ["R&D scale", "$1.5bn a year, more than the next three peers combined"]})

d.save(OUT)
print("saved", OUT, d.n)
