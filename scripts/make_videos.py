#!/usr/bin/env python3
import os, re, json, subprocess, tempfile, urllib.request, shutil, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1080, 1920
MAX_PER_RUN = 60
MAX_PHOTOS  = 5

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
def tint_for(title):
    t = title.lower()
    if "one piece" in t or "onepiece" in t: return (90, 26, 30), (40, 16, 18)
    if "dragon ball" in t or "dragonball" in t: return (80, 55, 15), (36, 26, 10)
    if "pokemon" in t or "pikachu" in t: return (37, 54, 90), (18, 24, 40)
    return (45, 30, 70), (22, 16, 34)

def photo_slide(imgpath, idx, total, name, price, tint, badge):
    img = base()
    px, py, pw, ph = 45, 120, W-90, 1180
    img.paste(vgrad(tint[0], tint[1], pw, ph), (px, py), rmask(pw, ph, 40))
    try:
        ph_img = Image.open(imgpath).convert("RGB")
        ph_img.thumbnail((pw-70, ph-70))
        img.paste(ph_img, (px + (pw-ph_img.width)//2, py + (ph-ph_img.height)//2))
    except Exception:
        pass
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
    ty = py+ph+38
    for ln in wrap(d, name, fb(46), W-140)[:2]:
        ctr(d, W//2, ty, ln, fb(46), (238, 241, 246)); ty += 60
    ty += 8
    if price:
        ctr(d, W//2, ty, price, fb(90), (245, 179, 1)); ty += 128
    ctr(d, W//2, ty, "Available now on eBay", fr(38), (96, 165, 250))
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
    tint = tint_for(item.get("title", "")); name = item.get("title", ""); price = item.get("price", "")
    badge = bool(item.get("isNew")); clips = []; n = len(local)
    for i, p in enumerate(local):
        fp = os.path.join(tmp, "f%d.png" % i); photo_slide(p, i+1, n, name, price, tint, badge).save(fp)
        cp = os.path.join(tmp, "c%d.mp4" % i)
        subprocess.run(["ffmpeg","-y","-loglevel","error","-loop","1","-t","2.6","-i",fp,
            "-vf","fade=t=in:st=0:d=0.3,fade=t=out:st=2.3:d=0.3,format=yuv420p",
            "-r","30","-c:v","libx264","-preset","veryfast",cp], check=True)
        clips.append(cp)
    sp = os.path.join(tmp, "store.png"); store_slide().save(sp)
    scp = os.path.join(tmp, "cstore.mp4")
    subprocess.run(["ffmpeg","-y","-loglevel","error","-loop","1","-t","3.4","-i",sp,
        "-vf","fade=t=in:st=0:d=0.3,fade=t=out:st=3.1:d=0.3,format=yuv420p",
        "-r","30","-c:v","libx264","-preset","veryfast",scp], check=True)
    clips.append(scp)
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
    return True

def main():
    vdir = os.path.join(ROOT, "videos"); os.makedirs(vdir, exist_ok=True)
    made = 0
    for item in items:
        if made >= MAX_PER_RUN:
            print("reached MAX_PER_RUN, rest next run"); break
        iid = item.get("itemId")
        if not iid: continue
        out = os.path.join(vdir,
