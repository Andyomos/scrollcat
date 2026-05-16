"""
ScrollCat X Article 3 Cover — Meet the Cats (Lore)
1500x600 (5:2 ratio, fits X Articles perfectly)
Output: article-3-cover.png
Run: python gen_article_cover.py
"""
from PIL import Image, ImageDraw, ImageFont
import os, math

W, H      = 1500, 600
BG        = (10, 8, 20)
PURPLE    = (168, 85, 247)
CYAN      = (34, 211, 238)
GOLD      = (250, 204, 21)
WHITE     = (255, 255, 255)
LAVENDER  = (196, 181, 253)
DARK_CARD = (19, 15, 35)
GREEN     = (74, 222, 128)
BLUE      = (96, 165, 250)
ORANGE    = (251, 146, 60)
RED       = (248, 113, 113)

LOGO = r"F:\bots\scrollcat-main\public\imgs\Neon Surfing Through Digital Cosmos.png"
OUT  = r"F:\bots\scrollcat-main\social\x\articles\article-3-lore\article-3-cover.png"

def F(name, size):
    for p in [f"C:/Windows/Fonts/{name}", f"C:/Windows/Fonts/{name.lower()}"]:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

fBlack   = F("ariblk.ttf", 70)
fBlackMd = F("ariblk.ttf", 38)
fBlackSm = F("ariblk.ttf", 22)
fBold    = F("arialbd.ttf", 26)
fBoldSm  = F("arialbd.ttf", 19)
fBoldXs  = F("arialbd.ttf", 15)
fBoldXxs = F("arialbd.ttf", 13)

# ── base canvas ───────────────────────────────────────────────────────────────
img  = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img)

# ── background glows ─────────────────────────────────────────────────────────
# purple glow top-left
glow1 = Image.new("RGB", (W, H), BG)
g1    = ImageDraw.Draw(glow1)
for r in range(420, 0, -2):
    t   = r / 420
    col = (int(168 * (1-t) * 0.45), int(85 * (1-t) * 0.35), int(247 * (1-t) * 0.45))
    g1.ellipse([-60 - r, -60 - r, -60 + r, -60 + r], fill=col)
img = Image.blend(img, glow1, 0.8)

# gold glow right
glow2 = Image.new("RGB", (W, H), BG)
g2    = ImageDraw.Draw(glow2)
for r in range(480, 0, -2):
    t   = r / 480
    col = (int(250 * (1-t) * 0.35), int(204 * (1-t) * 0.25), int(21 * (1-t) * 0.08))
    g2.ellipse([W + 60 - r, H // 2 - r, W + 60 + r, H // 2 + r], fill=col)
img = Image.blend(img, glow2, 0.75)

# cyan glow bottom-center
glow3 = Image.new("RGB", (W, H), BG)
g3    = ImageDraw.Draw(glow3)
for r in range(280, 0, -2):
    t   = r / 280
    col = (int(34 * (1-t) * 0.35), int(211 * (1-t) * 0.35), int(238 * (1-t) * 0.35))
    g3.ellipse([W // 2 - r, H + 10 - r, W // 2 + r, H + 10 + r], fill=col)
img = Image.blend(img, glow3, 0.55)

draw = ImageDraw.Draw(img)

# ── grid ─────────────────────────────────────────────────────────────────────
for x in range(0, W + 1, 120):
    draw.line([(x, 0), (x, H)], fill=(30, 18, 55), width=1)
for y in range(0, H + 1, 80):
    draw.line([(0, y), (W, y)], fill=(30, 18, 55), width=1)

# ── top + bottom accent bars ─────────────────────────────────────────────────
draw.rectangle([0, 0, W, 5], fill=PURPLE)
draw.rectangle([0, 0, W // 3, 5], fill=GOLD)
draw.rectangle([0, H - 5, W, H], fill=GOLD)
draw.rectangle([W * 2 // 3, H - 5, W, H], fill=PURPLE)

# ── vertical divider ─────────────────────────────────────────────────────────
DIV = 820
draw.rectangle([DIV, 40, DIV + 2, H - 40], fill=(50, 30, 90))

# ═══════════════════════════════════════════════════════
# LEFT PANEL — headline + rarity tier grid
# ═══════════════════════════════════════════════════════
pad = 60

# pill badge
pill_w = 270
draw.rounded_rectangle([pad, 44, pad + pill_w, 84], radius=8, fill=(25, 15, 40))
draw.rounded_rectangle([pad, 44, pad + pill_w, 84], radius=8, outline=PURPLE, width=2)
draw.text((pad + pill_w // 2, 64), "🐱 12 ARCHETYPES", font=fBoldSm, fill=LAVENDER, anchor="mm")

# main headline
draw.text((pad, 100), "MEET THE",  font=fBlack, fill=WHITE)
draw.text((pad, 168), "CATS.",     font=fBlack, fill=GOLD)

# underline
_, _, tw, _ = draw.textbbox((0, 0), "CATS.", font=fBlack)
draw.rectangle([pad, 240, pad + tw, 245], fill=GOLD)

# subline
draw.text((pad, 262), "6 rarity tiers. 12 archetypes. 1 Mythic.", font=fBold, fill=LAVENDER)

# ── rarity tier rows ──────────────────────────────────────────────────────────
tiers = [
    ("⬜ COMMON",    "Doomscroller · Grid Watcher · Feed Phantom",  WHITE,   (40, 40, 50)),
    ("🟩 UNCOMMON",  "Void Rider · Chain Ghost",                    GREEN,   (15, 35, 20)),
    ("🟦 RARE",      "Sigma Scroll · Degen Oracle",                 BLUE,    (15, 25, 45)),
    ("🟪 EPIC",      "Flame Keeper · Shadow Glitch",                PURPLE,  (30, 15, 50)),
    ("🟨 LEGENDARY", "Genesis One · Cosmic Sovereign",              GOLD,    (40, 30, 5)),
    ("🌈 MYTHIC",    "The Infinite Scroller — 1 of 1",              CYAN,    (5, 35, 40)),
]

ry = 310
for tier_label, cats, col, bg_col in tiers:
    draw.rounded_rectangle([pad, ry, DIV - 40, ry + 36], radius=5, fill=bg_col)
    draw.rounded_rectangle([pad, ry, DIV - 40, ry + 36], radius=5, outline=col, width=1)
    draw.text((pad + 10, ry + 18), tier_label, font=fBoldXs, fill=col,   anchor="lm")
    draw.text((pad + 175, ry + 18), cats,      font=fBoldXxs, fill=WHITE, anchor="lm")
    ry += 44

# CTA
draw.text((pad, 578), "crystara.trade/marketplace/scrollcat", font=fBoldXs, fill=CYAN)

# ═══════════════════════════════════════════════════════
# RIGHT PANEL — logo + collection card
# ═══════════════════════════════════════════════════════
center_x = (DIV + W) // 2

# glowing ring behind logo
for r in range(210, 185, -1):
    t   = (r - 185) / 25
    col = (int(250 * t * 0.4), int(204 * t * 0.3), int(21 * t * 0.1))
    draw.ellipse([center_x - r, H//2 - 20 - r, center_x + r, H//2 - 20 + r], outline=col, width=2)

# logo
try:
    logo = Image.open(LOGO).convert("RGBA")
    lh   = 295
    lw   = int(logo.width * lh / logo.height)
    logo = logo.resize((lw, lh), Image.LANCZOS)
    paste_x = center_x - lw // 2
    paste_y = H // 2 - lh // 2 - 40
    img.paste(logo, (paste_x, paste_y), logo)
except Exception as e:
    print(f"logo skip: {e}")

draw = ImageDraw.Draw(img)

# collection stats card
rpad = DIV + 30
card_x1, card_y1 = rpad + 10, H - 160
card_x2, card_y2 = W - 30,    H - 30
draw.rounded_rectangle([card_x1, card_y1, card_x2, card_y2], radius=10, fill=DARK_CARD)
draw.rounded_rectangle([card_x1, card_y1, card_x2, card_y2], radius=10, outline=GOLD, width=2)

card_cx = (card_x1 + card_x2) // 2
draw.text((card_cx, card_y1 + 22), "📖  THE COLLECTION",        font=fBoldXs, fill=GOLD,     anchor="mm")
draw.text((card_cx, card_y1 + 48), "12 NFTs · 6 Rarity Tiers", font=fBoldSm, fill=WHITE,    anchor="mm")
draw.text((card_cx, card_y1 + 72), "Supra Blockchain · HyperNova", font=fBoldXs, fill=LAVENDER, anchor="mm")
draw.text((card_cx, card_y1 + 96), "1-of-1 Mythic: The Infinite Scroller", font=fBoldXs, fill=CYAN, anchor="mm")
draw.text((card_cx, card_y1 + 120), "scrollcat.org", font=fBoldXs, fill=PURPLE, anchor="mm")

# badge top-right
draw.rounded_rectangle([W - 210, 44, W - 20, 84], radius=8, fill=(20, 10, 35))
draw.rounded_rectangle([W - 210, 44, W - 20, 84], radius=8, outline=LAVENDER, width=2)
draw.text(((W - 210 + W - 20) // 2, 64), "LORE EXPANSION", font=fBoldXs, fill=LAVENDER, anchor="mm")

# ── save ──────────────────────────────────────────────────────────────────────
img.save(OUT, "PNG")
print(f"Saved → {OUT}  ({W}x{H})")
