#!/usr/bin/env python3
import os, re, json, subprocess, tempfile, urllib.request, shutil, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1080, 1920
MAX_PER_RUN = 60
MAX_PHOTOS  = 5
VERSION     = "v2-noprice"

def font(paths, size):
    for p in paths:
        if os.path.exists(p): return ImageFont.truetype(p, size)
    return ImageFont.load_default()
DEJA_B = ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"]
DEJA_R = ["/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]
def fb(s): return font(DEJA_B, s)
def fr(s): return font(DEJA_R, s)

cfg = json.load(open(os.path.join(ROOT, "config.json"), encoding="utf-8"))
BRAND = cfg.get("brandName", "My eBay Store")
STORE = cfg.get("ebayStoreUrl", "")
data = json.load(open(os.path.join(ROOT, "data.json"), encoding="utf-8"))
items = data.get("items", [])

THEME = os.path.join(ROOT, "theme.mp3")
LOGO_PATH = os.path.join(ROOT, "logo.png")
HAS_THEME = os.path.exists(THEME)
LOGO = Image.open(LOGO_PATH).convert("RGBA") if os.path.exists(LOGO_PATH) else None

def logo_scaled(alpha, size):
    if LOGO is None: return None
    l = LOGO.copy(); l.thumbnail((size, size))
    a = np.array(l); a[:, :, 3] = (a[:, :, 3].astype(float) * alpha).astype(np.uint8)
    return Image.fromarray(a)

def vgrad(top, bot, w=W, h=H):
    a = np.zeros((h, w, 3), np.uint8)
    for i, (t, b) in enumerate(zip(top, bot)):
        a[:, :, i] = np.linspace(t, b, h).astype(np.uint8)[:, None]
    return Image.fromarray(a)
def rmask(w, h, r):
    m = Image.new("L", (w, h), 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, w-1, h-1], radius=r, fill=255); return m
def ctr(d, cx, y, t, fo, fi):
    bb = d.textbbox((0, 0), t, font=fo); d.text((cx-(bb[2]-bb[0])/2, y), t, font=fo, fill=fi)
def wrap(d, text, fo, maxw):
    L, c = [], ""
    for w_ in text.split():
        t = (c + " " + w_).strip()
        if d.textlength(t, font=fo) <= maxw: c = t
        else:
            if c: L.append(c)
            c = w_
    if c: L.append(c)
    return L
def base(): return vgrad((14, 17, 26), (24, 30, 46))
def category_label(t):
    tl = t.lower()
    if "pokemon" in tl and ("card" in tl or "tcg" in tl or "booster" in tl or "psa" in tl): return "POKEMON CARDS"
    if ("one piece" in tl or "onepiece" in tl) and ("card" in tl or "op-" in tl or "booster" in tl): return "ONE PIECE CARDS"
    if "one piece" in tl and "figure" in tl: return "ONE PIECE FIGURE"
    if "dragon ball" in tl or "dragonball" in tl: return "DRAGON BALL"
    if "pokemon" in tl or "pikachu" in tl: return "POKEMON"
    if "figure" in tl or "banpresto" in tl or "megahouse" in tl or "nendoroid" in tl: return "ANIME FIGURE"
    return "JAPAN COLLECTIBLE"
def tint_for(title):
    t = title.lower()
    if "one piece" in t or "onepiece" in t: return (90, 26, 30), (40, 16, 18)
    if "dragon ball" in t or "dragonball" in t: return (80, 55, 15), (36, 26, 10)
    if "pokemon" in t or "pikachu" in t: return (37, 54, 90), (18, 24, 40)
    return (45, 30, 70), (22, 16, 34)

def place_photo(img, imgpath, px, py, pw, ph, margin=70):
    try:
        p = Image.open(imgpath).convert("RGB")
        p.thumbnail((pw-margin, ph-margin))
        img.paste(p, (px + (pw-p.width)//2, py + (ph-p.height)//2))
        return True
    except Exception:
        return False

def photo_slide(imgpath, idx, total, name, tint, badge):
    img = base()
    px, py, pw, ph = 45, 120, W-90, 1180
    img.paste(vgrad(tint[0], tint[1], pw, ph), (px, py), rmask(pw, ph, 40))
    place_photo(img, imgpath, px, py, pw, ph)
    big = logo_scaled(0.10, 560)
    if big: img.paste(big, (W//2-big.width//2, py+ph//2-big.height//2), big)
    sm = logo_scaled(0.9, 130)
    if sm: img.paste(sm, (px+pw-sm.width-28, py+ph-sm.height-28), sm)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([px+26, py+26, px+238, py+88], radius=14, fill=(0, 0, 0))
    d.text((px+46, py+38), "PHOTO %d/%d" % (idx, total), font=fb(28), fill=(255, 255, 255))
    if badge:
        d.rounded_rectangle([px+pw-190, py+26, px+pw-26, py+88], radius=14, fill=(244, 63, 94))
        ctr(d, px+pw-26-82, py+38, "NEW", fb(30), (255, 255, 255))
    ty = py+ph+34
    cat = category_label(name)
    cw = int(d.textlength(cat, font=fb(30))) + 48
    d.rounded_rectangle([W//2-cw//2, ty, W//2+cw//2, ty+54], radius=16, fill=(59, 130, 246))
    ctr(d, W//2, ty+9, cat, fb(30), (255, 255, 255))
    ty += 84
    for ln in wrap(d, name, fb(44), W-150)[:3]:
        ctr(d, W//2, ty, ln, fb(44), (238, 241, 246)); ty += 56
    ty += 16
    ctr(d, W//2, ty, "See more in our eBay store", fr(40), (245, 179, 1))
    ctr(d, W//2, ty+56, "link in bio", fr(32), (154, 166, 184))
    return img

def store_slide():
    img = base(); d = ImageDraw.Draw(img)
    px, py, pw, ph = 90, 300, W-180, 760
    img.paste(vgrad((30, 37, 56), (18, 22, 36), pw, ph), (px, py), rmask(pw, ph, 46))
    lo = logo_scaled(1.0, 300)
    if lo: img.paste(lo, (W//2-lo.width//2, py+70), lo)
    d = ImageDraw.Draw(img)
    ctr(d, W//2, py+430, BRAND.upper(), fb(58), (238, 241, 246))
    ctr(d, W//2, py+520, "100% positive  |  Worldwide shipping", fr(34), (154, 166, 184))
    ctr(d, W//2, 1150, "VISIT OUR eBay STORE", fb(56), (245, 179, 1))
    d.rounded_rectangle([W//2-330, 1250, W//2+330, 1338], radius=44, fill=(59, 130, 246))
    ctr(d, W//2, 1270, "Search:  " + BRAND, fb(42), (255, 255, 255))
    return img

def slugify(s):
    return re.sub(r'-+$', '', re.sub(r'^-+', '', re.sub(r'[^a-zA-Z0-9]+', '-', str(s or "")))) or "item"

def download(url, dest):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=25) as r, open(dest, "wb") as f:
        shutil.copyfileobj(r, f)

def clip_from(png, dur, tmp, tag):
    cp = os.path.join(tmp, "clip_%s.mp4" % tag)
    fo = round(dur-0.3, 2)
    subprocess.run(["ffmpeg","-y","-loglevel","error","-loop","1","-t",str(dur),"-i",png,
        "-vf","fade=t=in:st=0:d=0.3,fade=t=out:st=%s:d=0.3,format=yuv420p" % fo,
        "-r","30","-c:v","libx264","-preset","veryfast",cp], check=True)
    return cp

def concat_mux(clips, outpath, tmp):
    listf = os.path.join(tmp, "list.txt")
    with open(listf, "w") as f:
        for c in clips: f.write("file '%s'\n" % c)
    silent = os.path.join(tmp, "silent.mp4")
    subprocess.run(["ffmpeg","-y","-loglevel","error","-f","concat","-safe","0","-i",listf,
        "-c:v","libx264","-pix_fmt","yuv420p","-preset","veryfast",silent], check=True)
    if HAS_THEME:
        subprocess.run(["ffmpeg","-y","-loglevel","error","-i",silent,"-stream_loop","-1","-i",THEME,
            "-c:v","copy","-c:a","aac","-b:a","192k","-shortest","-movflags","+faststart",outpath], check=True)
    else:
        shutil.move(silent, outpath)

def build_video(item, outpath, tmp):
    imgs = (item.get("images") or [])[:MAX_PHOTOS]
    if not imgs and item.get("image"): imgs = [item["image"]]
    if not imgs: return False
    local = []
    for i, u in enumerate(imgs):
        p = os.path.join(tmp, "src%d.jpg" % i)
        try:
            download(u, p); Image.open(p).verify(); local.append(p)
        except Exception:
            pass
    if not local: return False
    tint = tint_for(item.get("title", "")); name = item.get("title", "")
    badge = bool(item.get("isNew")); clips = []; n = len(local)
    for i, p in enumerate(local):
        fp = os.path.join(tmp, "f%d.png" % i); photo_slide(p, i+1, n, name, tint, badge).save(fp)
        clips.append(clip_from(fp, 2.6, tmp, "p%d" % i))
    sp = os.path.join(tmp, "store.png"); store_slide().save(sp)
    clips.append(clip_from(sp, 3.4, tmp, "store"))
    concat_mux(clips, outpath, tmp)
    return True

def firstimg(it):
    ims = it.get("images") or ([it["image"]] if it.get("image") else [])
    return ims[0] if ims else None
def best_item(scorer):
    best, bs = None, 0
    for it in items:
        if not firstimg(it): continue
        s = scorer(it["title"].lower())
        if s > bs: bs, best = s, it
    return best
def sc_poke(t):
    s = 0
    if "storm emeralda" in t: s += 6
    if "box" in t: s += 3
    if "special" in t: s += 3
    if "booster box" in t: s += 3
    if "sealed" in t: s += 2
    if "pokemon" in t and ("card" in t or "tcg" in t): s += 1
    return s
def sc_opcard(t):
    s = 0
    if ("one piece" in t) and ("card" in t or "op-" in t): s += 4
    if "booster box" in t: s += 3
    if "box" in t: s += 2
    if "sealed" in t: s += 1
    return s
def sc_opfig(t):
    s = 0
    if "one piece" in t and "figure" in t: s += 3
    if "limited" in t: s += 4
    if "ichiban" in t or "grandista" in t or "megahouse" in t or "p.o.p" in t: s += 2
    return s
def sc_dbfig(t):
    s = 0
    if "dragon ball" in t: s += 3
    if "limited" in t: s += 4
    if "ichiban" in t or "grandista" in t: s += 2
    if "figure" in t: s += 1
    return s
def sc_fig(t):
    s = 0
    if "limited" in t: s += 4
    if "figure" in t: s += 1
    if "ichiban" in t or "banpresto" in t or "megahouse" in t: s += 1
    return s

def intro_slide():
    img = base(); d = ImageDraw.Draw(img)
    lo = logo_scaled(1.0, 340)
    if lo: img.paste(lo, (W//2-lo.width//2, 540-lo.height//2), lo)
    ctr(d, W//2, 760, BRAND.upper(), fb(78), (238, 241, 246))
    ctr(d, W//2, 870, "Japanese Cards & Figures", fr(46), (154, 166, 184))
    d.rounded_rectangle([W//2-130, 950, W//2+130, 964], radius=7, fill=(245, 179, 1))
    ctr(d, W//2, 1010, "JAPAN  to  THE WORLD", fb(44), (96, 165, 250))
    return img

def showcase_slide(imgpath, label, tint):
    img = base(); d = ImageDraw.Draw(img)
    ctr(d, W//2, 92, BRAND.upper(), fb(38), (120, 130, 150))
    ctr(d, W//2, 150, label, fb(70), (245, 179, 1))
    px, py, pw, ph = 70, 290, W-140, 1040
    img.paste(vgrad(tint[0], tint[1], pw, ph), (px, py), rmask(pw, ph, 44))
    place_photo(img, imgpath, px, py, pw, ph, margin=60)
    big = logo_scaled(0.10, 470)
    if big: img.paste(big, (W//2-big.width//2, py+ph//2-big.height//2), big)
    sm = logo_scaled(0.9, 118)
    if sm: img.paste(sm, (px+pw-sm.width-24, py+ph-sm.height-24), sm)
    ctr(ImageDraw.Draw(img), W//2, py+ph+50, "shipped worldwide from Japan", fr(40), (199, 206, 222))
    return img

def build_store_intro(outpath, tmp):
    wants = [
        ("POKEMON CARDS", sc_poke, (37, 54, 90), (18, 24, 40)),
        ("ONE PIECE CARDS", sc_opcard, (90, 26, 30), (40, 16, 18)),
        ("ONE PIECE FIGURE", sc_opfig, (90, 40, 20), (40, 20, 12)),
        ("DRAGON BALL", sc_dbfig, (80, 55, 15), (36, 26, 10)),
        ("ANIME FIGURES", sc_fig, (45, 30, 70), (22, 16, 34)),
    ]
    picks, used = [], set()
    for label, sc, tt, tb in wants:
        it = best_item(sc)
        if it and it["itemId"] not in used:
            used.add(it["itemId"]); picks.append((label, it, tt, tb))
    clips = []
    ip = os.path.join(tmp, "intro.png"); intro_slide().save(ip)
    clips.append(clip_from(ip, 2.6, tmp, "intro"))
    for i, (label, it, tt, tb) in enumerate(picks):
        src = os.path.join(tmp, "sc%d.jpg" % i)
        try:
            download(firstimg(it), src); Image.open(src).verify()
        except Exception:
            continue
        sp = os.path.join(tmp, "sc%d.png" % i)
        showcase_slide(src, label, (tt, tb)).save(sp)
        clips.append(clip_from(sp, 2.6, tmp, "sc%d" % i))
    cp = os.path.join(tmp, "cta.png"); store_slide().save(cp)
    clips.append(clip_from(cp, 3.6, tmp, "cta"))
    if len(clips) >= 3:
        concat_mux(clips, outpath, tmp); return True
    return False

def main():
    vdir = os.path.join(ROOT, "videos"); os.makedirs(vdir, exist_ok=True)
    verf = os.path.join(vdir, ".version")
    cur = open(verf).read().strip() if os.path.exists(verf) else ""
    if cur != VERSION:
        for fn in os.listdir(vdir):
            if fn.endswith(".mp4"):
                try: os.remove(os.path.join(vdir, fn))
                except Exception: pass
        open(verf, "w").write(VERSION)
        print("version changed -> regenerating all videos")
    with tempfile.TemporaryDirectory() as tmp:
        try:
            if build_store_intro(os.path.join(vdir, "store_intro.mp4"), tmp):
                print("built store_intro.mp4")
        except Exception as e:
            print("store intro skip:", e)
    made = 0
    for item in items:
        if made >= MAX_PER_RUN:
            print("reached MAX_PER_RUN, rest next run"); break
        iid = item.get("itemId")
        if not iid: continue
        out = os.path.join(vdir, slugify(iid) + ".mp4")
        if os.path.exists(out): continue
        with tempfile.TemporaryDirectory() as tmp:
            try:
                if build_video(item, out, tmp):
                    made += 1; print("[%d] built %s.mp4" % (made, slugify(iid)))
            except Exception as e:
                print("skip %s: %s" % (slugify(iid), e))
    print("done. built %d new product video(s)." % made)

if __name__ == "__main__":
    main()
