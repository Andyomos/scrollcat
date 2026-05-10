"""
ScrollCat X Article 2 Cover — Swap Leaderboard
1500x600 (5:2 ratio, fits X Articles perfectly)
Output: article-2-cover.png
Run: python gen_article_cover.py
"""
from PIL import Image, ImageDraw, ImageFont
import os, math

W, H     = 1500, 600
BG       = (10, 8, 20)
PURPLE   = (168, 85, 247)
CYAN     = (34, 211, 238)
GOLD     = (250, 204, 21)
WHITE    = (255, 255, 255)
LAVENDER = (196, 181, 253)
DARK_CARD = (19, 15, 35)
GREEN    = (74, 222, 128)

LOGO = r"F:\bots\scrollcat-main\public\imgs\Neon Surfing Through Digital Cosmos.png"
OUT  = r"F:\bots\scrollcat-main\social\x\articles\article-2-leaderboard\article-2-cover.png"

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

# ── base canvas ───────────────────────────────────────────────────────────────
img  = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img)

# ── background glows ─────────────────────────────────────────────────────────
# gold/trophy glow top-left
glow1 = Image.new("RGB", (W, H), BG)
g1    = ImageDraw.Draw(glow1)
for r in range(420, 0, -2):
    t   = r / 420
    col = (int(250 * (1-t) * 0.35), int(204 * (1-t) * 0.25), int(21 * (1-t) * 0.1))
    g1.ellipse([-80 - r, -80 - r, -80 + r, -80 + r], fill=col)
img = Image.blend(img, glow1, 0.8)

# purple glow right
glow2 = Image.new("RGB", (W, H), BG)
g2    = ImageDraw.Draw(glow2)
for r in range(500, 0, -2):
    t   = r / 500
    col = (int(168 * (1-t) * 0.55), int(85 * (1-t) * 0.55), int(247 * (1-t) * 0.55))
    g2.ellipse([W + 40 - r, H//2 - r, W + 40 + r, H//2 + r], fill=col)
img = Image.blend(img, glow2, 0.75)

# cyan glow bottom-center
glow3 = Image.new("RGB", (W, H), BG)
g3    = ImageDraw.Draw(glow3)
for r in range(300, 0, -2):
    t   = r / 300
    col = (int(34 * (1-t) * 0.4), int(211 * (1-t) * 0.4), int(238 * (1-t) * 0.4))
    g3.ellipse([W//2 - r, H + 20 - r, W//2 + r, H + 20 + r], fill=col)
img = Image.blend(img, glow3, 0.6)

draw = ImageDraw.Draw(img)

# ── grid ─────────────────────────────────────────────────────────────────────
for x in range(0, W + 1, 120):
    draw.line([(x, 0), (x, H)], fill=(30, 18, 55), width=1)
for y in range(0, H + 1, 80):
    draw.line([(0, y), (W, y)], fill=(30, 18, 55), width=1)

# ── top + bottom accent bars ─────────────────────────────────────────────────
draw.rectangle([0, 0, W, 5], fill=GOLD)
draw.rectangle([0, 0, W // 3, 5], fill=PURPLE)
draw.rectangle([0, H - 5, W, H], fill=PURPLE)
draw.rectangle([W * 2 // 3, H - 5, W, H], fill=CYAN)

# ── vertical divider ─────────────────────────────────────────────────────────
DIV = 820
draw.rectangle([DIV, 40, DIV + 2, H - 40], fill=(50, 30, 90))

# ═══════════════════════════════════════════════════════
# LEFT PANEL — headline + leaderboard mockup
# ═══════════════════════════════════════════════════════
pad = 60

# pill badge
pill_w = 290
draw.rounded_rectangle([pad, 44, pad + pill_w, 84], radius=8, fill=(30, 20, 5))
draw.rounded_rectangle([pad, 44, pad + pill_w, 84], radius=8, outline=GOLD, width=2)
draw.text((pad + pill_w // 2, 64), "🏆 SWAP COMPETITION", font=fBoldSm, fill=GOLD, anchor="mm")

# main headline
draw.text((pad, 100), "SWAP TO WIN.", font=fBlack, fill=WHITE)
draw.text((pad, 168), "LEADERBOARD", font=fBlack, fill=CYAN)
draw.text((pad, 236), "IS LIVE.", font=fBlack, fill=PURPLE)

# cyan underline
_, _, tw, _ = draw.textbbox((0, 0), "IS LIVE.", font=fBlack)
draw.rectangle([pad, 308, pad + tw, 313], fill=PURPLE)

# subline
draw.text((pad, 330), "Swap on scrollcat.org/swap · Win NFTs · Fully Automated", font=fBold, fill=LAVENDER)

# ── leaderboard mockup rows ───────────────────────────────────────────────────
rows = [
    ("🥇", "#1", "0x3f8a…c21d", "$12,840",  "Feed Phantom NFT", GOLD),
    ("🥈", "#2", "0xa12b…ff03", "$8,210",   "500K SCAT Tokens",  LAVENDER),
    ("🥉", "#3", "0xcc90…88ab", "$5,490",   "250K SCAT Tokens",  GREEN),
]
ry = 388
for medal, rank, wallet, vol, prize, col in rows:
    draw.rounded_rectangle([pad, ry, DIV - 40, ry + 42], radius=6, fill=(19, 14, 36))
    draw.rounded_rectangle([pad, ry, DIV - 40, ry + 42], radius=6, outline=col, width=1)
    draw.text((pad + 10, ry + 21), f"{medal} {rank}", font=fBoldSm, fill=col,     anchor="lm")
    draw.text((pad + 90, ry + 21), wallet,            font=fBoldXs, fill=WHITE,   anchor="lm")
    draw.text((pad + 270, ry + 21), vol,              font=fBoldXs, fill=CYAN,    anchor="lm")
    draw.text((pad + 390, ry + 21), prize,            font=fBoldXs, fill=LAVENDER,anchor="lm")
    ry += 50

# scrollcat.org/leaderboard CTA
draw.text((pad, 548), "scrollcat.org/leaderboard", font=fBold, fill=CYAN)
draw.text((pad, 572), "@cat_scroll", font=fBoldSm, fill=(90, 80, 120))

# ═══════════════════════════════════════════════════════
# RIGHT PANEL — logo + prize card
# ═══════════════════════════════════════════════════════
rpad = DIV + 40
center_x = (DIV + W) // 2

# glowing ring
for r in range(200, 180, -1):
    t   = (r - 180) / 20
    col = (int(168 * t * 0.5), int(85 * t * 0.5), int(247 * t * 0.5))
    draw.ellipse([center_x - r, H//2 - 10 - r, center_x + r, H//2 - 10 + r], outline=col, width=2)

# logo
try:
    logo = Image.open(LOGO).convert("RGBA")
    lh   = 300
    lw   = int(logo.width * lh / logo.height)
    logo = logo.resize((lw, lh), Image.LANCZOS)
    paste_x = center_x - lw // 2
    paste_y = H // 2 - lh // 2 - 30
    img.paste(logo, (paste_x, paste_y), logo)
except Exception as e:
    print(f"logo skip: {e}")

draw = ImageDraw.Draw(img)

# prize card below logo
card_x1, card_y1 = rpad + 20, H - 155
card_x2, card_y2 = W - 30,    H - 30
draw.rounded_rectangle([card_x1, card_y1, card_x2, card_y2], radius=10, fill=DARK_CARD)
draw.rounded_rectangle([card_x1, card_y1, card_x2, card_y2], radius=10, outline=GOLD, width=2)

card_cx = (card_x1 + card_x2) // 2
draw.text((card_cx, card_y1 + 22), "🏆  THIS MONTH'S PRIZE",  font=fBoldXs, fill=GOLD,     anchor="mm")
draw.text((card_cx, card_y1 + 50), "Feed Phantom NFT",         font=fBoldSm, fill=WHITE,    anchor="mm")
draw.text((card_cx, card_y1 + 74), "108 SUPRA · Uncommon",    font=fBoldXs, fill=LAVENDER, anchor="mm")
draw.text((card_cx, card_y1 + 98), "Auto-sent to winner's wallet", font=fBoldXs, fill=CYAN, anchor="mm")

# fee badge top-right of right panel
draw.rounded_rectangle([W - 195, 44, W - 20, 84], radius=8, fill=(10, 30, 20))
draw.rounded_rectangle([W - 195, 44, W - 20, 84], radius=8, outline=GREEN, width=2)
draw.text(((W - 195 + W - 20) // 2, 64), "0.05% FEE · LOWEST", font=fBoldXs, fill=GREEN, anchor="mm")

# ── save ──────────────────────────────────────────────────────────────────────
img.save(OUT, "PNG")
print(f"Saved → {OUT}  ({W}x{H})")
