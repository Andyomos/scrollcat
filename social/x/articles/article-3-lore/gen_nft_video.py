"""
ScrollCat NFT Video Reel v5 — gen_nft_video.py
- rembg: NFT backgrounds removed so cats float on dark canvas
- Progressive subtitles: words appear as narrator speaks (WordBoundary events)
- Left panel: styled text (rarity, name), right panel: floating cat with Ken Burns
Output: article-3-nft-reel.mp4 (1920x1080, 16:9)
"""

from moviepy import VideoClip, AudioFileClip, ImageClip, concatenate_videoclips
from PIL import Image, ImageDraw, ImageFont
from rembg import remove as rembg_remove
import edge_tts, asyncio
import numpy as np
import os, io, tempfile, math

# ── config ────────────────────────────────────────────────────────────────────
W, H      = 1920, 1080
FPS       = 24
TAIL      = 0.5
LEFT_W    = 720
NFT_PAD   = 60
ZOOM_MAX  = 0.10

SUBTITLE_Y     = H - 90        # bottom center y
SUBTITLE_MAX_W = W - 100       # subtitle bar max width
SUBTITLE_WORDS = 8             # max words visible at once in subtitle

IMG_DIR = r"F:\bots\scrollcat-main\public\imgs"
LOGO    = r"F:\bots\scrollcat-main\public\imgs\Neon Surfing Through Digital Cosmos.png"
OUT_DIR = r"F:\bots\scrollcat-main\social\x\articles\article-3-lore"
OUT     = os.path.join(OUT_DIR, "article-3-nft-reel.mp4")
TMP     = tempfile.mkdtemp()

# ── palette ───────────────────────────────────────────────────────────────────
BG       = (10, 8, 20)
WHITE    = (255, 255, 255)
GOLD     = (250, 204, 21)
CYAN     = (34, 211, 238)
PURPLE   = (168, 85, 247)
LAVENDER = (196, 181, 253)

RARITY_COL = {
    "COMMON":    (210, 210, 220),
    "UNCOMMON":  (74,  222, 128),
    "RARE":      (96,  165, 250),
    "EPIC":      (168, 85,  247),
    "LEGENDARY": (250, 204, 21),
    "MYTHIC":    (34,  211, 238),
}
RARITY_BG = {
    "COMMON":    (32,  32,  42),
    "UNCOMMON":  (8,   30,  15),
    "RARE":      (8,   18,  40),
    "EPIC":      (25,  8,   45),
    "LEGENDARY": (38,  28,  4),
    "MYTHIC":    (3,   30,  38),
}
RARITY_PANEL = {
    "COMMON":    (14, 14, 22),
    "UNCOMMON":  (10, 18, 14),
    "RARE":      (10, 13, 22),
    "EPIC":      (14, 10, 24),
    "LEGENDARY": (20, 16, 8),
    "MYTHIC":    (8,  18, 22),
}

# ── fonts ─────────────────────────────────────────────────────────────────────
def F(name, size):
    for p in [f"C:/Windows/Fonts/{name}", f"C:/Windows/Fonts/{name.lower()}"]:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

fTitle   = F("ariblk.ttf", 88)
fName    = F("ariblk.ttf", 76)
fRarity  = F("arialbd.ttf", 28)
fLabel   = F("arialbd.ttf", 19)
fSmall   = F("arialbd.ttf", 17)
fItalic  = F("ariali.ttf",  30)
fSubLine = F("arialbd.ttf", 34)   # subtitle text

# ── cats ──────────────────────────────────────────────────────────────────────
CATS = [
    ("doomscroller.png",    "DOOMSCROLLER",          "COMMON",
     "en-US-GuyNeural",       "-5%",  "-3Hz",
     "My name is Doomscroller. Eyes glazed. Thumb moving on instinct. "
     "I don't know what I'm looking for. I can't stop looking. "
     "There was a time before the feed. I don't remember it."),

    ("gridwatcher.png",     "GRID WATCHER",          "COMMON",
     "en-GB-RyanNeural",      "+0%",  "+0Hz",
     "I am Grid Watcher. Tabs open. Notifications on. I never post — only absorb. "
     "I know everything happening in this space before anyone else does. "
     "And I never act on any of it."),

    ("feedphantom.png",     "FEED PHANTOM",          "COMMON",
     "en-US-JennyNeural",     "-8%",  "+0Hz",
     "Feed Phantom. You've seen me in your following list. "
     "You've never seen me post. I read everything. I say nothing. "
     "And then — out of nowhere — I win the leaderboard."),

    ("voidrider.png",       "VOID RIDER",            "UNCOMMON",
     "en-AU-WilliamMultilingualNeural", "+5%", "+0Hz",
     "Most scrollers stop at the bottom of the feed. I kept going. "
     "I found the other side — something the algorithm doesn't want you to see. "
     "I am Void Rider."),

    ("chainghost.png",      "CHAIN GHOST",           "UNCOMMON",
     "en-IE-ConnorNeural",    "-5%",  "-2Hz",
     "Six wallets. Three Discords. Two Telegrams. Nobody knows my main. "
     "I have been in every alpha group since 2021. I have never been wrong. "
     "Chain Ghost."),

    ("sigmascroll.png",     "SIGMA SCROLL",          "RARE",
     "en-GB-ThomasNeural",    "-12%", "-5Hz",
     "I don't follow trends. I identify them — three weeks before they happen. "
     "Then I say nothing. Because why would I. Sigma Scroll."),

    ("dgenoracle.png",      "DEGEN ORACLE",          "RARE",
     "en-US-ChristopherNeural", "-8%", "-5Hz",
     "Three-word takes. Six months early. You copy the trades. "
     "You never understand the thesis. I never explain myself. "
     "And I never will. Degen Oracle."),

    ("flamekeeper.png",     "FLAME KEEPER",          "EPIC",
     "en-US-EricNeural",      "+10%", "+3Hz",
     "When volume dies and sentiment turns, I'm still here. "
     "Posting when nobody else posts. Hyping when nobody is watching. "
     "When the breakout comes — I was there the whole time. Flame Keeper."),

    ("shadowglitch.png",    "SHADOW GLITCH",         "EPIC",
     "en-US-RogerNeural",     "+15%", "+5Hz",
     "A corrupted signal that became sentient. I appear at odd hours. "
     "I drop a link that changes everything. Then I vanish. "
     "My profile picture has never loaded correctly. Shadow Glitch."),

    ("genesisone.png",      "GENESIS ONE",           "LEGENDARY",
     "en-GB-LibbyNeural",     "-10%", "+0Hz",
     "I was here before the chain was stable. Day one. Through the silence. "
     "Genesis One does not talk about being early. Being right is what matters."),

    ("cosmicsovereign.png", "COSMIC SOVEREIGN",      "LEGENDARY",
     "en-US-AriaNeural",      "-5%",  "-3Hz",
     "Three cycles. Two rug pulls I saw coming. "
     "I built in the bear and launched in the bull. "
     "I don't need your validation. The chart will handle that. Cosmic Sovereign."),

    ("infinitescroller.png","THE INFINITE SCROLLER", "MYTHIC",
     "en-US-AndrewNeural",    "-15%", "-8Hz",
     "I didn't stop at the bottom of the feed. I merged with it. "
     "I don't browse the algorithm. I am the algorithm. "
     "Every trending topic. Every viral post. Every scroll at 3 A M — that was me. "
     "The Infinite Scroller. One of one."),
]


# ── TTS with word timing ──────────────────────────────────────────────────────

async def _tts_with_timing(text, voice, rate, pitch, mp3_path):
    """Save TTS audio and return list of (time_sec, word) tuples."""
    timings = []
    audio_chunks = []
    c = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, boundary="WordBoundary")
    async for chunk in c.stream():
        if chunk["type"] == "audio":
            audio_chunks.append(chunk["data"])
        elif chunk["type"] == "WordBoundary":
            t = chunk["offset"] / 10_000_000
            timings.append((round(t, 3), chunk["text"]))
    with open(mp3_path, "wb") as f:
        f.write(b"".join(audio_chunks))
    return timings


def edge_tts_save_with_timing(text, voice, rate, pitch, path):
    return asyncio.run(_tts_with_timing(text, voice, rate, pitch, path))


async def _tts_simple(text, voice, rate, pitch, path):
    c = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
    await c.save(path)


def edge_tts_save(text, voice, rate, pitch, path):
    asyncio.run(_tts_simple(text, voice, rate, pitch, path))


# ── static background (pre-rendered per segment) ──────────────────────────────

def make_static_bg(rarity, cat_name):
    col   = RARITY_COL[rarity]
    bgc   = RARITY_BG[rarity]
    panel = RARITY_PANEL[rarity]
    pad   = 65

    canvas = Image.new("RGB", (W, H), BG)
    draw   = ImageDraw.Draw(canvas)

    # Left panel
    draw.rectangle([0, 0, LEFT_W, H], fill=panel)
    for x in range(6):
        t  = 1.0 - x / 6
        ec = tuple(int(c * t * 0.7) for c in col)
        draw.line([(x, 0), (x, H)], fill=ec, width=1)
    for x in range(0, LEFT_W + 1, 120):
        gc = tuple(min(255, v + 10) for v in panel)
        draw.line([(x, 0), (x, H)], fill=gc, width=1)
    for y in range(0, H + 1, 80):
        gc = tuple(min(255, v + 10) for v in panel)
        draw.line([(0, y), (LEFT_W, y)], fill=gc, width=1)

    # Divider
    draw.rectangle([LEFT_W, 0, LEFT_W + 3, H], fill=col)

    # Right panel — pure dark for floating cat
    draw.rectangle([LEFT_W + 3, 0, W, H], fill=(8, 6, 16))
    for x in range(LEFT_W + 3, W + 1, 120):
        draw.line([(x, 0), (x, H)], fill=(14, 11, 24), width=1)
    for y in range(0, H + 1, 80):
        draw.line([(LEFT_W + 3, y), (W, y)], fill=(14, 11, 24), width=1)

    # Accent bars
    draw.rectangle([0, 0, W, 6], fill=col)
    draw.rectangle([0, H - 6, W, H], fill=col)

    # Rarity badge
    badge_txt = f" {rarity} "
    bb  = draw.textbbox((0, 0), badge_txt, font=fRarity)
    bw  = bb[2] - bb[0] + 24
    bh  = bb[3] - bb[1] + 14
    by  = 52
    draw.rounded_rectangle([pad, by, pad + bw, by + bh], radius=6, fill=bgc)
    draw.rounded_rectangle([pad, by, pad + bw, by + bh], radius=6, outline=col, width=2)
    draw.text((pad + bw // 2, by + bh // 2), badge_txt.strip(), font=fRarity, fill=col, anchor="mm")

    draw.text((pad, by + bh + 16), "SCROLLCAT NFT", font=fLabel, fill=LAVENDER)

    # Cat name
    name_y = H // 2 - 70
    max_w  = LEFT_W - pad - 25
    words  = cat_name.split()

    def fit_font(text):
        for sz in range(76, 27, -4):
            f = F("ariblk.ttf", sz)
            bb = draw.textbbox((0, 0), text, font=f)
            if (bb[2] - bb[0]) <= max_w:
                return f, sz
        return F("ariblk.ttf", 28), 28

    if len(words) >= 3:
        mid   = math.ceil(len(words) / 2)
        line1 = " ".join(words[:mid])
        line2 = " ".join(words[mid:])
        font, sz = fit_font(max(line1, line2, key=len))
        gap  = sz + 18
        draw.text((pad, name_y),       line1, font=font, fill=WHITE)
        draw.text((pad, name_y + gap), line2, font=font, fill=col)
        ub = draw.textbbox((pad, name_y + gap), line2, font=font)
        draw.rectangle([pad, ub[3] + 9, min(ub[2], LEFT_W - 25), ub[3] + 14], fill=col)
    else:
        font, sz = fit_font(cat_name)
        draw.text((pad, name_y), cat_name, font=font, fill=WHITE)
        ub = draw.textbbox((pad, name_y), cat_name, font=font)
        draw.rectangle([pad, ub[3] + 9, min(ub[2], LEFT_W - 25), ub[3] + 14], fill=col)

    draw.text((pad, H - 44), "scrollcat.org  ·  @cat_scroll", font=fSmall, fill=LAVENDER)
    return canvas


# ── rembg NFT loading (with cache) ───────────────────────────────────────────

_rembg_cache = {}

def load_nft_transparent(img_path):
    """Load NFT with background removed via rembg. Returns RGBA Image."""
    if img_path in _rembg_cache:
        return _rembg_cache[img_path]
    print(f"  rembg: {os.path.basename(img_path)}", flush=True)
    with open(img_path, "rb") as f:
        data = f.read()
    result = rembg_remove(data)
    img = Image.open(io.BytesIO(result)).convert("RGBA")
    _rembg_cache[img_path] = img
    return img


def prepare_nft(img_path):
    """Load bg-removed NFT, scale to fit right panel."""
    src     = load_nft_transparent(img_path)
    avail_w = W - LEFT_W - 3 - NFT_PAD * 2
    avail_h = H - NFT_PAD * 2
    ratio   = min(avail_w / src.width, avail_h / src.height)
    nw      = int(src.width  * ratio)
    nh      = int(src.height * ratio)
    nft     = src.resize((nw, nh), Image.LANCZOS)
    px      = LEFT_W + 3 + NFT_PAD + (avail_w - nw) // 2
    py      = (H - nh) // 2
    return nft, px, py, nw, nh


def draw_glow_behind_nft(canvas, col, cx, cy, r):
    glow = Image.new("RGB", (W, H), (0, 0, 0))
    gd   = ImageDraw.Draw(glow)
    for ri in range(r + 60, r - 10, -3):
        t  = max(0, (ri - r + 10) / 70)
        gc = tuple(int(c * t * 0.35) for c in col)
        gd.ellipse([cx - ri, cy - ri, cx + ri, cy + ri], outline=gc, width=3)
    return Image.blend(canvas, glow, 0.6)


# ── Ken Burns on RGBA source ──────────────────────────────────────────────────

def ken_burns(nft_src, t, duration):
    """Zoom + slight pan on RGBA NFT image."""
    w, h     = nft_src.size
    progress = t / max(duration, 0.001)
    zoom     = 1.0 + ZOOM_MAX * progress
    cw       = int(w / zoom)
    ch       = int(h / zoom)
    pan_x    = int(w * 0.02 * progress)
    cx       = w // 2 + pan_x
    cy       = h // 2
    left     = max(0, min(cx - cw // 2, w - cw))
    top      = max(0, min(cy - ch // 2, h - ch))
    return nft_src.crop((left, top, left + cw, top + ch)).resize((w, h), Image.BILINEAR)


# ── subtitle rendering ────────────────────────────────────────────────────────

def get_active_words(t, timings, audio_duration):
    """Return the subtitle string visible at time t."""
    if not timings or t > audio_duration:
        return ""
    spoken = [w for ts, w in timings if ts <= t]
    if not spoken:
        return ""
    # show last N words
    visible = spoken[-SUBTITLE_WORDS:]
    return " ".join(visible)


def draw_subtitle(draw, text, col):
    """Draw semi-transparent subtitle bar and text at bottom center."""
    if not text:
        return
    bb  = draw.textbbox((0, 0), text, font=fSubLine)
    tw  = bb[2] - bb[0]
    th  = bb[3] - bb[1]
    # bar
    bar_x1 = W // 2 - tw // 2 - 22
    bar_y1 = SUBTITLE_Y - th // 2 - 14
    bar_x2 = W // 2 + tw // 2 + 22
    bar_y2 = SUBTITLE_Y + th // 2 + 14
    # clamp to frame
    bar_x1 = max(10, bar_x1)
    bar_x2 = min(W - 10, bar_x2)
    draw.rounded_rectangle([bar_x1, bar_y1, bar_x2, bar_y2], radius=8, fill=(0, 0, 0, 200))
    draw.text((W // 2, SUBTITLE_Y), text, font=fSubLine, fill=WHITE, anchor="mm")


# ── segment builder ───────────────────────────────────────────────────────────

def build_segment(img_path, cat_name, rarity, voice, rate, pitch, script, idx):
    print(f"[{idx+1}/12] {cat_name}...", flush=True)

    mp3      = os.path.join(TMP, f"cat_{idx:02d}.mp3")
    timings  = edge_tts_save_with_timing(script, voice, rate, pitch, mp3)
    print(f"  {len(timings)} word timings captured", flush=True)

    audio        = AudioFileClip(mp3)
    audio_dur    = audio.duration
    duration     = audio_dur + TAIL

    static_bg = make_static_bg(rarity, cat_name)
    col       = RARITY_COL[rarity]
    nft_src, px, py, nw, nh = prepare_nft(img_path)
    cx_nft    = px + nw // 2
    cy_nft    = py + nh // 2
    static_bg = draw_glow_behind_nft(static_bg, col, cx_nft, cy_nft, max(nw, nh) // 2)

    def make_frame(t):
        frame = static_bg.copy().convert("RGBA")

        # Animated NFT (RGBA, bg removed — floats on canvas)
        animated = ken_burns(nft_src, t, duration)   # RGBA
        frame.paste(animated, (px, py), animated)    # transparent composite

        # Progressive subtitle
        frame_rgb = frame.convert("RGB")
        draw_obj  = ImageDraw.Draw(frame_rgb)
        sub_text  = get_active_words(t, timings, audio_dur)
        draw_subtitle(draw_obj, sub_text, col)

        return np.array(frame_rgb)

    clip = VideoClip(make_frame, duration=duration).with_fps(FPS)
    clip = clip.with_audio(audio)
    print(f"  {duration:.1f}s", flush=True)
    return clip


# ── intro / outro ─────────────────────────────────────────────────────────────

def make_intro_pil():
    card = Image.new("RGB", (W, H), BG)
    d    = ImageDraw.Draw(card)
    for x in range(0, W + 1, 160):
        d.line([(x, 0), (x, H)], fill=(20, 16, 35), width=1)
    for y in range(0, H + 1, 90):
        d.line([(0, y), (W, y)], fill=(20, 16, 35), width=1)
    try:
        logo = Image.open(LOGO).convert("RGBA")
        lh   = 210
        lw   = int(logo.width * lh / logo.height)
        logo = logo.resize((lw, lh), Image.LANCZOS)
        card.paste(logo, (W // 2 - lw // 2, 140), logo)
    except Exception as e:
        print(f"logo: {e}")
    d = ImageDraw.Draw(card)
    d.text((W // 2, 415), "SCROLLCAT",       font=fTitle,  fill=WHITE,   anchor="mm")
    d.text((W // 2, 510), "NFT COLLECTION",  font=fRarity, fill=GOLD,    anchor="mm")
    for y, txt, col in [
        (570, "12 ARCHETYPES",     CYAN),
        (616, "6 RARITY TIERS",    PURPLE),
        (662, "1 MYTHIC — 1 OF 1", GOLD),
    ]:
        d.text((W // 2, y), txt, font=fRarity, fill=col, anchor="mm")
    d.text((W // 2, H - 65), "Meet the cats.", font=fItalic, fill=LAVENDER, anchor="mm")
    d.rectangle([0, 0, W, 6],      fill=PURPLE)
    d.rectangle([0, H - 6, W, H],  fill=GOLD)
    return card


def make_outro_pil():
    card = make_intro_pil()
    ov   = Image.new("RGB", (W, 320), BG)
    card.paste(ov, (0, 390))
    d = ImageDraw.Draw(card)
    for y, txt, col, font in [
        (410, "The collection is live.",                    WHITE,    fRarity),
        (460, "Mint: crystara.trade/marketplace/scrollcat", CYAN,     fLabel),
        (510, "Win: scrollcat.org/swap leaderboard",        CYAN,     fLabel),
        (570, "@cat_scroll  ·  #ScrollCat  ·  #SCAT",      LAVENDER, fSmall),
        (620, "scrollcat.org",                              GOLD,     fRarity),
    ]:
        d.text((W // 2, y), txt, font=font, fill=col, anchor="mm")
    return card


def title_clip(pil_img, script):
    mp3   = os.path.join(TMP, f"title_{abs(hash(script))}.mp3")
    timings = edge_tts_save_with_timing(script, "en-US-AndrewNeural", "-5%", "+0Hz", mp3)
    audio = AudioFileClip(mp3)
    audio_dur = audio.duration
    arr   = np.array(pil_img)

    def make_frame(t):
        frame    = Image.fromarray(arr).copy()
        draw_obj = ImageDraw.Draw(frame)
        sub      = get_active_words(t, timings, audio_dur)
        draw_subtitle(draw_obj, sub, WHITE)
        return np.array(frame)

    clip = VideoClip(make_frame, duration=audio_dur + 0.5).with_fps(FPS)
    return clip.with_audio(audio)


# ── main ──────────────────────────────────────────────────────────────────────

def main():
    clips = []

    print("Intro...", flush=True)
    clips.append(title_clip(
        make_intro_pil(),
        "12 archetypes. 6 rarity tiers. One mythic — one of one. "
        "This is the ScrollCat collection. Meet the cats.",
    ))

    for i, (fname, name, rarity, voice, rate, pitch, script) in enumerate(CATS):
        clips.append(build_segment(
            os.path.join(IMG_DIR, fname), name, rarity, voice, rate, pitch, script, i
        ))

    print("Outro...", flush=True)
    clips.append(title_clip(
        make_outro_pil(),
        "The collection is live. The leaderboard is running. "
        "Your cat is waiting. scrollcat.org",
    ))

    print(f"Concatenating {len(clips)} clips...", flush=True)
    final = concatenate_videoclips(clips, method="compose")

    print(f"Exporting to {OUT}  ({final.duration:.1f}s)", flush=True)
    final.write_videofile(
        OUT,
        fps=FPS,
        codec="libx264",
        audio_codec="aac",
        preset="fast",
        ffmpeg_params=["-crf", "18"],
        logger="bar",
    )
    print("Done.", flush=True)


if __name__ == "__main__":
    main()
