"""
ScrollCat X Article Cover — 1500x600 (5:2, as recommended by X Articles)
Output: article-cover.png
"""
from PIL import Image, ImageDraw, ImageFont
import os, math

W, H   = 1500, 600
BG     = (10, 8, 20)        # #0a0814
PURPLE = (168, 85, 247)     # #a855f7
CYAN   = (34, 211, 238)     # #22d3ee
WHITE  = (255, 255, 255)
LAVENDER = (196, 181, 253)  # #c4b5fd
DARK_CARD = (19, 15, 35)

LOGO   = r"D:\bots\scrollcat-main\public\imgs\Neon Surfing Through Digital Cosmos.png"
OUT    = r"D:\bots\scrollcat-main\social\x\article-cover.png"

# ── font loader ──────────────────────────────────────────────────────────────
def F(name, size):
    for p in [f"C:/Windows/Fonts/{name}", f"C:/Windows/Fonts/{name.lower()}"]:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

fBlack = F("ariblk.ttf", 74)
fBlackMd = F("ariblk.ttf", 36)
fBlackSm = F("ariblk.ttf", 24)
fBold  = F("arialbd.ttf", 26)
fBoldSm = F("arialbd.ttf", 20)

# ── base canvas ───────────────────────────────────────────────────────────────
img  = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img)

# ── background: deep purple nebula mesh ──────────────────────────────────────
# large radial glow top-right (purple)
glow1 = Image.new("RGB", (W, H), BG)
g1    = ImageDraw.Draw(glow1)
cx1, cy1 = W - 120, -80
for r in range(500, 0, -2):
    t   = r / 500
    col = (int(168 * (1 - t) * 0.6), int(85 * (1 - t) * 0.6), int(247 * (1 - t) * 0.6))
    g1.ellipse([cx1 - r, cy1 - r, cx1 + r, cy1 + r], fill=col)
img = Image.blend(img, glow1, 0.7)

# secondary cyan glow bottom-left
glow2 = Image.new("RGB", (W, H), BG)
g2    = ImageDraw.Draw(glow2)
cx2, cy2 = 160, H + 60
for r in range(400, 0, -2):
    t   = r / 400
    col = (int(34 * (1 - t) * 0.5), int(211 * (1 - t) * 0.5), int(238 * (1 - t) * 0.5))
    g2.ellipse([cx2 - r, cy2 - r, cx2 + r, cy2 + r], fill=col)
img = Image.blend(img, glow2, 0.6)

# centre subtle purple cloud
glow3 = Image.new("RGB", (W, H), BG)
g3    = ImageDraw.Draw(glow3)
for r in range(280, 0, -2):
    t   = r / 280
    col = (int(100 * (1 - t) * 0.3), int(50 * (1 - t) * 0.3), int(180 * (1 - t) * 0.3))
    g3.ellipse([W//2 - r, H//2 - r, W//2 + r, H//2 + r], fill=col)
img = Image.blend(img, glow3, 0.5)

draw = ImageDraw.Draw(img)

# ── grid lines (subtle perspective) ─────────────────────────────────────────
for x in range(0, W + 1, 120):
    draw.line([(x, 0), (x, H)], fill=(40, 20, 70), width=1)
for y in range(0, H + 1, 80):
    draw.line([(0, y), (W, y)], fill=(40, 20, 70), width=1)

# ── top accent stripe ────────────────────────────────────────────────────────
draw.rectangle([0, 0, W, 5], fill=PURPLE)
draw.rectangle([0, 0, W // 4, 5], fill=CYAN)

# ── LEFT PANEL — text content ─────────────────────────────────────────────────
pad = 68

# pill label
pill_w = 260
draw.rounded_rectangle([pad, 48, pad + pill_w, 88], radius=8, fill=(30, 10, 60))
draw.rounded_rectangle([pad, 48, pad + pill_w, 88], radius=8, outline=PURPLE, width=2)
draw.text((pad + pill_w // 2, 68), "OFFICIAL ARTICLE", font=fBoldSm, fill=PURPLE, anchor="mm")

# main headline — two lines
line1 = "SCROLLCAT:"
line2 = "THE CAT THAT"
line3 = "NEVER STOPS."
draw.text((pad, 104), line1, font=fBlack, fill=WHITE)
draw.text((pad, 174), line2, font=fBlack, fill=WHITE)
draw.text((pad, 244), line3, font=fBlack, fill=CYAN)

# cyan underline under line3
_, _, tw, _ = draw.textbbox((0, 0), line3, font=fBlack)
draw.rectangle([pad, 318, pad + tw, 323], fill=CYAN)

# subheadline
sub = "NFTs. Token. Community. All on Supra."
draw.text((pad, 342), sub, font=fBold, fill=LAVENDER)

# divider dot row
dots_y = 395
for i, label in enumerate(["12 NFTs", "6 Rarities", "0.05% Swap Fee", "$SCAT Token"]):
    bx = pad + i * 190
    draw.rounded_rectangle([bx, dots_y, bx + 174, dots_y + 48], radius=6, fill=DARK_CARD)
    draw.rounded_rectangle([bx, dots_y, bx + 174, dots_y + 48], radius=6, outline=PURPLE, width=1)
    draw.text((bx + 87, dots_y + 24), label, font=fBoldSm, fill=CYAN, anchor="mm")

# author line
draw.text((pad, 466), "@cat_scroll  |  scrollcat.org", font=fBoldSm, fill=(110, 100, 140))

# CTA strip
cta_x1, cta_y1, cta_x2, cta_y2 = pad, 500, pad + 360, 550
draw.rounded_rectangle([cta_x1, cta_y1, cta_x2, cta_y2], radius=10, fill=PURPLE)
draw.text(((cta_x1 + cta_x2) // 2, (cta_y1 + cta_y2) // 2),
          "Read the Full Story on X Articles", font=fBoldSm, fill=WHITE, anchor="mm")

# hashtags bottom
draw.text((pad, 565), "#ScrollCat  #SCAT  #SupraBlockchain  #NFT  #Web3", font=fBoldSm, fill=(80, 70, 110))

# ── RIGHT PANEL — logo + decorative ──────────────────────────────────────────
logo_x = 900
try:
    logo = Image.open(LOGO).convert("RGBA")
    lh   = 380
    lw   = int(logo.width * lh / logo.height)
    logo = logo.resize((lw, lh), Image.LANCZOS)
    # centre logo in right panel
    paste_x = logo_x + (W - logo_x - lw) // 2
    paste_y = (H - lh) // 2 - 10
    img.paste(logo, (paste_x, paste_y), logo)
except Exception as e:
    print(f"logo skip: {e}")

draw = ImageDraw.Draw(img)

# glowing ring behind logo area
for r in range(220, 200, -1):
    t = (r - 200) / 20
    col = (int(168 * t * 0.4), int(85 * t * 0.4), int(247 * t * 0.4))
    draw.ellipse([logo_x + 130 - r, H // 2 - r, logo_x + 130 + r, H // 2 + r], outline=col, width=2)

# rarity name stack (right of logo)
rarity_names = [
    ("MYTHIC",    CYAN),
    ("LEGENDARY", (250, 204, 21)),
    ("EPIC",      (192, 132, 252)),
    ("RARE",      (96, 165, 250)),
    ("UNCOMMON",  (74, 222, 128)),
    ("COMMON",    (156, 163, 175)),
]
rx, ry = 1360, 100
for name, col in rarity_names:
    draw.text((rx, ry), name, font=fBlackSm, fill=col, anchor="ra")
    ry += 68

# vertical separator line
draw.rectangle([logo_x - 2, 40, logo_x, H - 40], fill=(50, 30, 90))

# ── bottom accent ─────────────────────────────────────────────────────────────
draw.rectangle([0, H - 5, W, H], fill=CYAN)
draw.rectangle([W * 3 // 4, H - 5, W, H], fill=PURPLE)

# ── save ──────────────────────────────────────────────────────────────────────
img.save(OUT, "PNG")
print(f"Saved -> {OUT}  ({W}x{H})")
