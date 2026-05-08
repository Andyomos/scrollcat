#!/usr/bin/env python3
"""ScrollCat Social Media Asset Generator — run from any directory."""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

ROOT  = r"D:\bots\scrollcat-main"
IMGS  = os.path.join(ROOT, "public", "imgs")
OUT   = os.path.join(ROOT, "social")

FONT_BLACK = r"C:\Windows\Fonts\ariblk.ttf"
FONT_BOLD  = r"C:\Windows\Fonts\arialbd.ttf"
FONT_REG   = r"C:\Windows\Fonts\arial.ttf"

BG     = (10, 8, 20)
PURPLE = (168, 85, 247)
CYAN   = (34, 211, 238)
WHITE  = (255, 255, 255)
DIM    = (180, 170, 210)
DISC   = (88, 101, 242)

RARITY = {
    "doomscroller":     ("Common",     (156, 163, 175), "40%", 200),
    "gridwatcher":      ("Common",     (156, 163, 175), "40%", 200),
    "feedphantom":      ("Common",     (156, 163, 175), "40%", 200),
    "voidrider":        ("Uncommon",   (34, 197, 94),   "25%", 200),
    "chainghost":       ("Uncommon",   (34, 197, 94),   "25%", 200),
    "sigmascroll":      ("Rare",       (59, 130, 246),  "18%", 200),
    "dgenoracle":       ("Rare",       (59, 130, 246),  "18%", 200),
    "flamekeeper":      ("Epic",       (168, 85, 247),  "10%", 200),
    "shadowglitch":     ("Epic",       (168, 85, 247),  "10%", 200),
    "genesisone":       ("Legendary",  (245, 158, 11),   "5%", 200),
    "cosmicsovereign":  ("Legendary",  (245, 158, 11),   "5%", 200),
    "infinitescroller": ("Mythic",     (244, 114, 182),  "2%", 200),
}

NAMES = {
    "doomscroller":     "Doomscroller",
    "gridwatcher":      "Grid Watcher",
    "feedphantom":      "Feed Phantom",
    "voidrider":        "Void Rider",
    "chainghost":       "Chain Ghost",
    "sigmascroll":      "Sigma Scroll",
    "dgenoracle":       "Degen Oracle",
    "flamekeeper":      "Flame Keeper",
    "shadowglitch":     "Shadow Glitch",
    "genesisone":       "Genesis One",
    "cosmicsovereign":  "Cosmic Sovereign",
    "infinitescroller": "Infinite Scroller",
}

# ── helpers ──────────────────────────────────────────────────────────────────

def fnt(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()

def mkdir(p): os.makedirs(p, exist_ok=True)

def save(img, path):
    img.convert("RGB").save(path, "PNG", optimize=True)
    print(f"  OK {os.path.relpath(path, ROOT)}")

def canvas(w, h):
    return Image.new("RGBA", (w, h), (*BG, 255))

def overlay(img, shape_fn):
    """Draw on a transparent overlay then alpha_composite onto img."""
    ov = Image.new("RGBA", img.size, (0, 0, 0, 0))
    shape_fn(ImageDraw.Draw(ov))
    img.alpha_composite(ov)

def scanlines(img, step=5, alpha=18):
    def _draw(d):
        for y in range(0, img.height, step):
            d.line([(0, y), (img.width, y)], fill=(0, 0, 0, alpha))
    overlay(img, _draw)

def glow(img, cx, cy, r, color, alpha=90):
    def _draw(d):
        d.ellipse([cx-r, cy-r, cx+r, cy+r], fill=(*color, alpha))
    ov = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(ov).ellipse([cx-r, cy-r, cx+r, cy+r], fill=(*color, alpha))
    ov = ov.filter(ImageFilter.GaussianBlur(r // 2))
    img.alpha_composite(ov)

def nft(slug, size):
    img = Image.open(os.path.join(IMGS, f"{slug}.png")).convert("RGBA")
    return img.resize((size, size), Image.LANCZOS)

def logo(size):
    img = Image.open(os.path.join(IMGS, "Neon Surfing Through Digital Cosmos.png")).convert("RGBA")
    return img.resize((size, size), Image.LANCZOS)

def badge(draw, text, x, y, color, font, pad=(18, 8)):
    bb = draw.textbbox((0, 0), text, font=font)
    tw, th = bb[2]-bb[0], bb[3]-bb[1]
    px, py = pad
    bw, bh = tw + px*2, th + py*2
    r = min(bh//2, 20)
    draw.rounded_rectangle([x, y, x+bw, y+bh], radius=r, fill=(*color, 255))
    draw.text((x+px-bb[0], y+py-bb[1]), text, font=font, fill=BG)
    return bw, bh

def glowtext(draw, text, pos, font, color=WHITE, gc=None, ga=55):
    if gc:
        c = gc[:3] if len(gc) > 3 else gc
        for dx, dy in [(-2,0),(2,0),(0,-2),(0,2)]:
            draw.text((pos[0]+dx, pos[1]+dy), text, font=font, fill=(*c, ga))
    draw.text(pos, text, font=font, fill=color)

def handles_strip(img, draw, h_strip=54, accent=CYAN):
    H = img.height
    W = img.width
    ov = Image.new("RGBA", img.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(ov)
    od.rectangle([0, H-h_strip, W, H], fill=(12, 8, 28, 210))
    od.line([(0, H-h_strip), (W, H-h_strip)], fill=(*accent, 70), width=1)
    img.alpha_composite(ov)
    f = fnt(FONT_REG, 20)
    txt = "🐱  scrollcat.org   ·   @cat_scroll   ·   discord.gg/6NKeEzUt5   ·   t.me/cat_scroll"
    bb = draw.textbbox((0, 0), txt, font=f)
    tw = bb[2]-bb[0]
    draw.text(((W-tw)//2, H-h_strip+(h_strip-(bb[3]-bb[1]))//2), txt, font=f, fill=(*DIM, 210))

# ── X NFT spotlight 1200×675 ──────────────────────────────────────────────────

def x_spotlight(slug, out_dir):
    W, H = 1200, 675
    NFT_SZ, PAD = 460, 44
    rar_name, rar_col, rar_pct, supply = RARITY[slug]
    name = NAMES[slug]

    img = canvas(W, H)
    glow(img, 0, 0, 340, PURPLE, 42)
    glow(img, W, H, 280, CYAN, 32)
    glow(img, PAD+NFT_SZ//2, H//2, NFT_SZ//2+70, rar_col, 55)
    scanlines(img)

    d = ImageDraw.Draw(img)

    # NFT + border
    ny = (H-NFT_SZ)//2
    d.rectangle([PAD-3, ny-3, PAD+NFT_SZ+3, ny+NFT_SZ+3], outline=(*rar_col, 160), width=3)
    img.alpha_composite(nft(slug, NFT_SZ), (PAD, ny))

    # divider
    div_x = PAD+NFT_SZ+44
    d.line([(div_x, 60), (div_x, H-60)], fill=(*rar_col, 55), width=1)

    tx, ty = div_x+44, 85
    glowtext(d, name, (tx, ty), fnt(FONT_BLACK, 52), WHITE, rar_col, 50)
    ty += 68

    bw, bh = badge(d, f"  {rar_name.upper()}  ", tx, ty, rar_col, fnt(FONT_BOLD, 22))
    d.text((tx+bw+16, ty+6), f"Supply: {supply}  ·  500 total", font=fnt(FONT_REG, 20), fill=(*DIM, 190))
    ty += bh+18

    d.line([(tx, ty), (tx+380, ty)], fill=(*rar_col, 80), width=1)
    ty += 18

    glowtext(d, "Mint for 50 SUPRA", (tx, ty), fnt(FONT_BOLD, 28), CYAN, CYAN, 55)
    ty += 44
    d.text((tx, ty), "crystara.trade  ·  scrollcat.org/nfts", font=fnt(FONT_REG, 22), fill=(*DIM, 190))
    ty += 40
    d.text((tx, ty), "⛓  Supra Blockchain  ·  $SCAT", font=fnt(FONT_REG, 19), fill=(*DIM, 150))

    img.alpha_composite(logo(72), (W-72-20, H-72-h_strip(H)-8))
    handles_strip(img, d, accent=rar_col)
    save(img, os.path.join(out_dir, f"spotlight-{slug}.png"))

def h_strip(H): return 54

# ── Instagram spotlight 1080×1080 ────────────────────────────────────────────

def ig_spotlight(slug, out_dir):
    W, H = 1080, 1080
    NFT_SZ = 580
    rar_name, rar_col, rar_pct, supply = RARITY[slug]
    name = NAMES[slug]

    img = canvas(W, H)
    glow(img, W//2, H//2, NFT_SZ//2+90, rar_col, 62)
    glow(img, 0, 0, 280, PURPLE, 38)
    glow(img, W, H, 260, CYAN, 28)
    scanlines(img)

    d = ImageDraw.Draw(img)

    # Header
    img.alpha_composite(logo(58), (28, 28))
    d.text((96, 40), "ScrollCat  ·  $SCAT", font=fnt(FONT_BOLD, 26), fill=(*DIM, 190))

    # NFT
    nx, ny = (W-NFT_SZ)//2, 110
    d.rectangle([nx-3, ny-3, nx+NFT_SZ+3, ny+NFT_SZ+3], outline=(*rar_col, 150), width=3)
    img.alpha_composite(nft(slug, NFT_SZ), (nx, ny))

    ty = ny+NFT_SZ+22
    f_name = fnt(FONT_BLACK, 56)
    bb = d.textbbox((0, 0), name, font=f_name)
    glowtext(d, name, ((W-(bb[2]-bb[0]))//2, ty), f_name, WHITE, rar_col, 52)
    ty += 68

    # Badge centred
    f_b = fnt(FONT_BOLD, 24)
    bt = f"  {rar_name.upper()}  "
    bb2 = d.textbbox((0, 0), bt, font=f_b)
    bw = bb2[2]-bb2[0]+36
    bh = bb2[3]-bb2[1]+16
    badge(d, bt, (W-bw)//2, ty, rar_col, f_b)
    ty += bh+16

    sup = f"Supply: {supply}  ·  500 total  ·  50 SUPRA"
    bb3 = d.textbbox((0, 0), sup, font=fnt(FONT_REG, 22))
    d.text(((W-(bb3[2]-bb3[0]))//2, ty), sup, font=fnt(FONT_REG, 22), fill=(*DIM, 180))

    handles_strip(img, d, h_strip=60, accent=rar_col)
    save(img, os.path.join(out_dir, f"spotlight-{slug}.png"))

# ── X rarity reveal 1200×675 ─────────────────────────────────────────────────

def x_rarity_reveal(out_dir):
    W, H = 1200, 675
    tiers = [
        ("doomscroller",     "Common",     (156,163,175), "40%"),
        ("voidrider",        "Uncommon",   (34,197,94),   "25%"),
        ("sigmascroll",      "Rare",       (59,130,246),  "18%"),
        ("flamekeeper",      "Epic",       (168,85,247),  "10%"),
        ("genesisone",       "Legendary",  (245,158,11),   "5%"),
        ("infinitescroller", "Mythic",     (244,114,182),  "2%"),
    ]
    img = canvas(W, H)
    glow(img, W//2, H//2, 320, PURPLE, 30)
    glow(img, 0, H, 240, CYAN, 25)
    scanlines(img)
    d = ImageDraw.Draw(img)

    f_t = fnt(FONT_BLACK, 44)
    title = "ScrollCat  ·  6 Rarities  ·  12 Cats"
    bb = d.textbbox((0,0), title, font=f_t)
    glowtext(d, title, ((W-(bb[2]-bb[0]))//2, 22), f_t, WHITE, CYAN, 50)

    cw = W // len(tiers)
    sz = 140
    for i, (slug, rn, rc, pct) in enumerate(tiers):
        cx = cw*i + cw//2
        cy = H//2+14
        glow(img, cx, cy, sz//2+32, rc, 55)
        img.alpha_composite(nft(slug, sz), (cx-sz//2, cy-sz//2))
        f_r = fnt(FONT_BOLD, 20)
        bb2 = d.textbbox((0,0), rn, font=f_r)
        d.text((cx-(bb2[2]-bb2[0])//2, cy+sz//2+10), rn, font=f_r, fill=(*rc, 235))
        f_p = fnt(FONT_REG, 17)
        bb3 = d.textbbox((0,0), pct, font=f_p)
        d.text((cx-(bb3[2]-bb3[0])//2, cy+sz//2+34), pct, font=f_p, fill=(*DIM, 155))

    handles_strip(img, d, accent=CYAN)
    save(img, os.path.join(out_dir, "post-rarity-reveal.png"))

# ── X FOMO 1200×675 ───────────────────────────────────────────────────────────

def x_fomo(out_dir):
    W, H = 1200, 675
    img = canvas(W, H)
    glow(img, W//2, H//2, 360, PURPLE, 50)
    glow(img, W, 0, 240, CYAN, 35)
    scanlines(img)
    d = ImageDraw.Draw(img)

    f1 = fnt(FONT_BLACK, 96)
    t1 = "500 CATS."
    bb = d.textbbox((0,0), t1, font=f1)
    glowtext(d, t1, ((W-(bb[2]-bb[0]))//2, 70), f1, WHITE, CYAN, 85)

    f2 = fnt(FONT_BLACK, 68)
    t2 = "THAT'S IT. FOREVER."
    bb2 = d.textbbox((0,0), t2, font=f2)
    glowtext(d, t2, ((W-(bb2[2]-bb2[0]))//2, 192), f2, PURPLE, PURPLE, 65)

    d.line([(180,295),(1020,295)], fill=(*CYAN,70), width=1)

    f3 = fnt(FONT_BOLD, 32)
    t3 = "12 unique cats  ·  6 rarities  ·  Supra blockchain"
    bb3 = d.textbbox((0,0), t3, font=f3)
    d.text(((W-(bb3[2]-bb3[0]))//2, 316), t3, font=f3, fill=(*DIM, 215))

    f4 = fnt(FONT_BOLD, 38)
    t4 = "Mint now  →  crystara.trade"
    bb4 = d.textbbox((0,0), t4, font=f4)
    glowtext(d, t4, ((W-(bb4[2]-bb4[0]))//2, 378), f4, CYAN, CYAN, 60)

    img.alpha_composite(logo(80), ((W-80)//2, 468))
    handles_strip(img, d, accent=PURPLE)
    save(img, os.path.join(out_dir, "post-fomo-supply.png"))

# ── X Discord join 1200×675 ───────────────────────────────────────────────────

def x_discord(out_dir):
    W, H = 1200, 675
    img = canvas(W, H)
    glow(img, W//2, H//2, 350, DISC, 50)
    glow(img, 0, H, 240, PURPLE, 32)
    scanlines(img)
    d = ImageDraw.Draw(img)

    img.alpha_composite(logo(96), ((W-96)//2, 46))

    f1 = fnt(FONT_BLACK, 66)
    t1 = "JOIN THE SCROLL"
    bb = d.textbbox((0,0), t1, font=f1)
    glowtext(d, t1, ((W-(bb[2]-bb[0]))//2, 168), f1, WHITE, DISC, 70)

    f2 = fnt(FONT_BOLD, 28)
    t2 = "The ScrollCat community is live. Come build with us."
    bb2 = d.textbbox((0,0), t2, font=f2)
    d.text(((W-(bb2[2]-bb2[0]))//2, 256), t2, font=f2, fill=(*DIM, 205))

    d.line([(260,312),(940,312)], fill=(*DISC,70), width=1)

    f3 = fnt(FONT_BOLD, 40)
    t3 = "discord.gg/6NKeEzUt5"
    bb3 = d.textbbox((0,0), t3, font=f3)
    glowtext(d, t3, ((W-(bb3[2]-bb3[0]))//2, 336), f3, DISC, DISC, 72)

    f4 = fnt(FONT_REG, 24)
    t4 = "#ScrollCat  #NFT  #SupraBlockchain  #Web3  #SCAT"
    bb4 = d.textbbox((0,0), t4, font=f4)
    d.text(((W-(bb4[2]-bb4[0]))//2, 408), t4, font=f4, fill=(*DIM, 145))

    handles_strip(img, d, accent=DISC)
    save(img, os.path.join(out_dir, "post-discord-join.png"))

# ── X GM v2 1200×675 ──────────────────────────────────────────────────────────

def x_gm_v2(out_dir):
    W, H = 1200, 675
    img = canvas(W, H)
    glow(img, W//2, H//2, 340, PURPLE, 40)
    glow(img, W, 0, 220, CYAN, 28)
    scanlines(img)
    d = ImageDraw.Draw(img)

    f1 = fnt(FONT_BLACK, 104)
    t1 = "gm, scrollers 🐱"
    bb = d.textbbox((0,0), t1, font=f1)
    glowtext(d, t1, ((W-(bb[2]-bb[0]))//2, 48), f1, WHITE, PURPLE, 80)

    f2 = fnt(FONT_BOLD, 28)
    t2 = "ScrollCat ($SCAT) — 12 NFTs live on Supra Blockchain"
    bb2 = d.textbbox((0,0), t2, font=f2)
    d.text(((W-(bb2[2]-bb2[0]))//2, 185), t2, font=f2, fill=(*DIM, 195))

    # strip of all 12 cats
    slugs = list(NAMES.keys())
    sz = 72
    gap = (W - sz*len(slugs)) // (len(slugs)+1)
    sy = H - sz - 58 - 16
    for i, s in enumerate(slugs):
        nx = gap + i*(sz+gap)
        rc = RARITY[s][1]
        glow(img, nx+sz//2, sy+sz//2, sz//2+10, rc, 40)
        img.alpha_composite(nft(s, sz), (nx, sy))

    handles_strip(img, d, accent=CYAN)
    save(img, os.path.join(out_dir, "post-gm-v2.png"))

# ── Instagram Discord join 1080×1080 ─────────────────────────────────────────

def ig_discord(out_dir):
    W, H = 1080, 1080
    img = canvas(W, H)
    glow(img, W//2, H//2, 420, DISC, 55)
    glow(img, 0, 0, 260, PURPLE, 32)
    scanlines(img)
    d = ImageDraw.Draw(img)

    img.alpha_composite(logo(130), ((W-130)//2, 110))

    f1 = fnt(FONT_BLACK, 82)
    for i, (t, col) in enumerate([("JOIN THE", WHITE), ("SCROLL", CYAN)]):
        bb = d.textbbox((0,0), t, font=f1)
        glowtext(d, t, ((W-(bb[2]-bb[0]))//2, 280+i*98), f1, col, DISC if i==0 else CYAN, 70)

    d.line([(160,492),(920,492)], fill=(*DISC,70), width=1)

    f2 = fnt(FONT_BOLD, 46)
    t2 = "discord.gg/6NKeEzUt5"
    bb2 = d.textbbox((0,0), t2, font=f2)
    glowtext(d, t2, ((W-(bb2[2]-bb2[0]))//2, 516), f2, DISC, DISC, 72)

    f3 = fnt(FONT_REG, 28)
    t3 = "NFTs · $SCAT Token · Community · Alpha"
    bb3 = d.textbbox((0,0), t3, font=f3)
    d.text(((W-(bb3[2]-bb3[0]))//2, 588), t3, font=f3, fill=(*DIM, 175))

    handles_strip(img, d, h_strip=64, accent=DISC)
    save(img, os.path.join(out_dir, "post-discord-join.png"))

# ── Instagram story mint CTA 1080×1920 ───────────────────────────────────────

def ig_story_mint(out_dir):
    W, H = 1080, 1920
    img = canvas(W, H)
    glow(img, W//2, 420, 400, PURPLE, 60)
    glow(img, W//2, 1400, 340, CYAN, 48)
    scanlines(img)
    d = ImageDraw.Draw(img)

    img.alpha_composite(logo(96), ((W-96)//2, 78))
    d.text(((W - d.textbbox((0,0),"ScrollCat",font=fnt(FONT_BOLD,30))[2])//2, 188), "ScrollCat", font=fnt(FONT_BOLD,30), fill=(*DIM,195))

    f1 = fnt(FONT_BLACK, 114)
    for i, (t, col) in enumerate([("MINT", WHITE), ("NOW", CYAN)]):
        bb = d.textbbox((0,0), t, font=f1)
        glowtext(d, t, ((W-(bb[2]-bb[0]))//2, 268+i*130), f1, col, CYAN, 92)

    # price pill
    f_pr = fnt(FONT_BLACK, 52)
    pt = "50 SUPRA"
    bb_p = d.textbbox((0,0), pt, font=f_pr)
    pw = bb_p[2]-bb_p[0]+60; ph = bb_p[3]-bb_p[1]+20
    px = (W-pw)//2
    ov2 = Image.new("RGBA", img.size, (0,0,0,0))
    ImageDraw.Draw(ov2).rounded_rectangle([px,554,px+pw,554+ph], radius=ph//2, fill=(*PURPLE,225))
    img.alpha_composite(ov2)
    d.text(((W-(bb_p[2]-bb_p[0]))//2, 558), pt, font=f_pr, fill=WHITE)

    # 4-cat grid
    grid = ["genesisone","infinitescroller","cosmicsovereign","flamekeeper"]
    sz = 220
    gx0 = (W - sz*2 - 20)//2
    gy0 = 668
    for i, s in enumerate(grid):
        gx = gx0 + (i%2)*(sz+20)
        gy = gy0 + (i//2)*(sz+20)
        rc = RARITY[s][1]
        glow(img, gx+sz//2, gy+sz//2, sz//2+20, rc, 48)
        img.alpha_composite(nft(s, sz), (gx, gy))

    f_w = fnt(FONT_BOLD, 40)
    tw = "crystara.trade"
    bb_w = d.textbbox((0,0), tw, font=f_w)
    glowtext(d, tw, ((W-(bb_w[2]-bb_w[0]))//2, 1164), f_w, CYAN, CYAN, 62)
    d.text(((W - d.textbbox((0,0),"or visit scrollcat.org",font=fnt(FONT_REG,28))[2])//2, 1220), "or visit scrollcat.org", font=fnt(FONT_REG,28), fill=(*DIM,165))

    d.line([(150,1276),(930,1276)], fill=(*CYAN,60), width=1)

    d.text(((W - d.textbbox((0,0),"⛓  Supra Blockchain  ·  $SCAT Token",font=fnt(FONT_REG,27))[2])//2, 1296), "⛓  Supra Blockchain  ·  $SCAT Token", font=fnt(FONT_REG,27), fill=(*DIM,148))

    f_tap = fnt(FONT_BOLD,34)
    bt = "↑  Link in bio  ↑"
    bb_t = d.textbbox((0,0),bt,font=f_tap)
    glowtext(d, bt, ((W-(bb_t[2]-bb_t[0]))//2, 1796), f_tap, WHITE, PURPLE, 68)

    f_h = fnt(FONT_REG,22)
    ht = "#ScrollCat  #NFT  #SupraBlockchain  #SCAT  #NFTDrop"
    bh2 = d.textbbox((0,0),ht,font=f_h)
    d.text(((W-(bh2[2]-bh2[0]))//2,1852), ht, font=f_h, fill=(*DIM,125))

    save(img, os.path.join(out_dir, "story-mint-cta.png"))

# ── Instagram story rarity 1080×1920 ─────────────────────────────────────────

def ig_story_rarity(out_dir):
    W, H = 1080, 1920
    tiers = [
        ("doomscroller",     "Common",     (156,163,175), "40%"),
        ("voidrider",        "Uncommon",   (34,197,94),   "25%"),
        ("sigmascroll",      "Rare",       (59,130,246),  "18%"),
        ("flamekeeper",      "Epic",       (168,85,247),  "10%"),
        ("genesisone",       "Legendary",  (245,158,11),   "5%"),
        ("infinitescroller", "Mythic",     (244,114,182),  "2%"),
    ]
    img = canvas(W, H)
    glow(img, W//2, H//2, 500, PURPLE, 32)
    scanlines(img)
    d = ImageDraw.Draw(img)

    img.alpha_composite(logo(78), (36, 36))
    d.text((124,52), "ScrollCat  ·  $SCAT", font=fnt(FONT_BOLD,29), fill=(*DIM,185))

    f_t = fnt(FONT_BLACK,62)
    for i, (t, col) in enumerate([("THE RARITY", WHITE),("BREAKDOWN", CYAN)]):
        bb = d.textbbox((0,0),t,font=f_t)
        glowtext(d, t, ((W-(bb[2]-bb[0]))//2, 142+i*76), f_t, col, CYAN, 58)

    row_h, row_start, NFT_SZ = 228, 322, 158
    for i, (slug, rn, rc, pct) in enumerate(tiers):
        ry = row_start + i*row_h
        # row bg
        ov3 = Image.new("RGBA", img.size, (0,0,0,0))
        ImageDraw.Draw(ov3).rectangle([28, ry, W-28, ry+row_h-10], fill=(20,14,38,175))
        img.alpha_composite(ov3)

        # nft
        nfy = ry + (row_h-10-NFT_SZ)//2
        glow(img, 38+NFT_SZ//2, nfy+NFT_SZ//2, NFT_SZ//2+12, rc, 48)
        img.alpha_composite(nft(slug, NFT_SZ), (38, nfy))

        # rarity name
        d.text((222, ry+26), rn, font=fnt(FONT_BLACK,38), fill=(*rc,235))

        # progress bar
        bar_y = ry+78; bar_total = W-258-48
        ov4 = Image.new("RGBA", img.size, (0,0,0,0))
        od4 = ImageDraw.Draw(ov4)
        od4.rounded_rectangle([222,bar_y,222+bar_total,bar_y+13], radius=6, fill=(38,32,58,255))
        filled = int(bar_total * float(pct.rstrip('%')) / 40)
        if filled > 0:
            od4.rounded_rectangle([222,bar_y,222+filled,bar_y+13], radius=6, fill=(*rc,225))
        img.alpha_composite(ov4)
        d.text((222+bar_total+12, bar_y-4), pct, font=fnt(FONT_BOLD,30), fill=(*rc,215))

        # nft name
        d.text((222, bar_y+24), NAMES[slug], font=fnt(FONT_REG,25), fill=(*DIM,162))

    handles_strip(img, d, h_strip=60, accent=CYAN)
    save(img, os.path.join(out_dir, "story-rarity-breakdown.png"))

# ── Telegram banner 1280×640 ──────────────────────────────────────────────────

def telegram_banner(out_dir):
    W, H = 1280, 640
    img = canvas(W, H)
    glow(img, 0, H//2, 340, PURPLE, 52)
    glow(img, W, H//2, 300, CYAN, 44)
    glow(img, W//2, H//2, 190, PURPLE, 22)
    scanlines(img)
    d = ImageDraw.Draw(img)

    img.alpha_composite(logo(176), (W//2-88, H//2-106))

    f1 = fnt(FONT_BLACK,64)
    bb = d.textbbox((0,0),"ScrollCat",font=f1)
    glowtext(d, "ScrollCat", ((W-(bb[2]-bb[0]))//2, H//2+82), f1, WHITE, CYAN, 68)

    f2 = fnt(FONT_BOLD,28)
    t2 = "$SCAT  ·  NFTs on Supra Blockchain"
    bb2 = d.textbbox((0,0),t2,font=f2)
    d.text(((W-(bb2[2]-bb2[0]))//2, H//2+158), t2, font=f2, fill=(*DIM,185))

    f3 = fnt(FONT_REG,22)
    t3 = "scrollcat.org  ·  t.me/cat_scroll  ·  @cat_scroll"
    bb3 = d.textbbox((0,0),t3,font=f3)
    d.text(((W-(bb3[2]-bb3[0]))//2, H//2+200), t3, font=f3, fill=(*DIM,145))

    save(img, os.path.join(out_dir, "telegram-channel-banner.png"))

# ── Telegram launch post 1280×720 ────────────────────────────────────────────

def telegram_launch(out_dir):
    W, H = 1280, 720
    img = canvas(W, H)
    glow(img, W//4, H//2, 310, PURPLE, 48)
    glow(img, W*3//4, H//2, 270, CYAN, 38)
    scanlines(img)
    d = ImageDraw.Draw(img)

    showcase = ["genesisone","infinitescroller","cosmicsovereign"]
    sz = 178
    for i, s in enumerate(showcase):
        nx = 36 + i*(sz+14)
        ny = (H-sz)//2
        rc = RARITY[s][1]
        glow(img, nx+sz//2, ny+sz//2, sz//2+22, rc, 52)
        img.alpha_composite(nft(s, sz), (nx, ny))

    tx = 36 + 3*(sz+14) + 38
    glowtext(d, "ScrollCat", (tx,85), fnt(FONT_BLACK,56), WHITE, CYAN, 58)
    glowtext(d, "$SCAT is LIVE", (tx,155), fnt(FONT_BLACK,50), PURPLE, PURPLE, 52)

    d.line([(tx,224),(tx+454,224)], fill=(*CYAN,72), width=1)

    lines = ["12 unique cats. 6 rarities.","500 ever minted. 50 SUPRA each.","Supra Blockchain via Crystara."]
    ty = 244
    for l in lines:
        d.text((tx,ty), l, font=fnt(FONT_BOLD,25), fill=(*DIM,205))
        ty += 40

    glowtext(d, "scrollcat.org", (tx,ty+18), fnt(FONT_BOLD,32), CYAN, CYAN,58)
    glowtext(d, "crystara.trade", (tx,ty+62), fnt(FONT_BOLD,32), PURPLE, PURPLE,52)

    handles_strip(img, d, accent=PURPLE)
    save(img, os.path.join(out_dir, "telegram-launch-post.png"))

# ── Discord server banner 960×540 ────────────────────────────────────────────

def discord_banner(out_dir):
    W, H = 960, 540
    img = canvas(W, H)
    glow(img, 0, H//2, 270, PURPLE, 52)
    glow(img, W, H//2, 240, CYAN, 44)
    glow(img, W//2, H//2, 170, DISC, 28)
    scanlines(img)
    d = ImageDraw.Draw(img)

    img.alpha_composite(logo(148), (W//2-74, 52))

    f1 = fnt(FONT_BLACK,54)
    bb = d.textbbox((0,0),"ScrollCat",font=f1)
    glowtext(d, "ScrollCat", ((W-(bb[2]-bb[0]))//2, 216), f1, WHITE, CYAN, 64)

    f2 = fnt(FONT_BOLD,24)
    t2 = "NFTs · $SCAT Token · Supra Blockchain"
    bb2 = d.textbbox((0,0),t2,font=f2)
    d.text(((W-(bb2[2]-bb2[0]))//2, 284), t2, font=f2, fill=(*DIM,185))

    # join badge
    f3 = fnt(FONT_BOLD,22)
    bt = "  Join the Community  "
    bb3 = d.textbbox((0,0),bt,font=f3)
    bw = bb3[2]-bb3[0]+28; bh3 = bb3[3]-bb3[1]+16
    bx = (W-bw)//2; by = H-bh3-46
    ov5 = Image.new("RGBA", img.size, (0,0,0,0))
    ImageDraw.Draw(ov5).rounded_rectangle([bx,by,bx+bw,by+bh3], radius=bh3//2, fill=(*DISC,225))
    img.alpha_composite(ov5)
    d.text((bx+14, by+8-bb3[1]), bt.strip(), font=f3, fill=WHITE)

    save(img, os.path.join(out_dir, "discord-server-banner.png"))

# ── main ──────────────────────────────────────────────────────────────────────

def main():
    print("ScrollCat Social Asset Generator")
    print("=" * 48)

    x_dir      = os.path.join(OUT, "x")
    ig_dir     = os.path.join(OUT, "instagram")
    x_spots    = os.path.join(x_dir, "nft-spotlights")
    ig_spots   = os.path.join(ig_dir, "nft-spotlights")
    ig_stories = os.path.join(ig_dir, "stories")
    tg_dir     = os.path.join(OUT, "telegram")
    dc_dir     = os.path.join(OUT, "discord")

    for d in [x_spots, ig_spots, ig_stories, tg_dir, dc_dir]:
        mkdir(d)

    print("\n[X] NFT Spotlights ×12  (1200×675)")
    for slug in NAMES:
        x_spotlight(slug, x_spots)

    print("\n[Instagram] NFT Spotlights ×12  (1080×1080)")
    for slug in NAMES:
        ig_spotlight(slug, ig_spots)

    print("\n[X] Themed posts")
    x_rarity_reveal(x_dir)
    x_fomo(x_dir)
    x_discord(x_dir)
    x_gm_v2(x_dir)

    print("\n[Instagram] Stories  (1080×1920)")
    ig_story_mint(ig_stories)
    ig_story_rarity(ig_stories)

    print("\n[Instagram] Posts  (1080×1080)")
    ig_discord(ig_dir)

    print("\n[Telegram]  (banner 1280×640 · launch 1280×720)")
    telegram_banner(tg_dir)
    telegram_launch(tg_dir)

    print("\n[Discord]  (banner 960×540)")
    discord_banner(dc_dir)

    print("\n✅  34 new assets generated under social/")

if __name__ == "__main__":
    main()
