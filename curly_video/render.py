"""Render the Curly motion-comic: camera moves over the illustrations plus drawn gags."""
import math, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from timeline import VO_OFFSET, TOTAL, CAPTIONS, SCENES

W, H, FPS = 1280, 720, 24
FF = open("ff.env").read().strip().split("=", 1)[1]
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
font = lambda s, f=BOLD: ImageFont.truetype(f, s)
rng = np.random.default_rng(3)

CHAR = Image.open("character.png").convert("RGB")
S1 = Image.open("scene1.png").convert("RGB")
S2 = Image.open("scene2.png").convert("RGB")
SW, SH = CHAR.size

# hair mask on the character sheet: dark pixels inside the hair box
arr = np.asarray(CHAR).astype(np.float32)
lum = arr.mean(axis=2)
hair = np.zeros(lum.shape, bool)
hair[0:360, 430:915] = lum[0:360, 430:915] < 70
hair[244:298, 628:788] = False  # keep the glasses frames untouched
HAIR = np.asarray(Image.fromarray((hair * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2)), np.float32)[..., None] / 255


def ease(x):
    x = min(max(x, 0.0), 1.0)
    return x * x * (3 - 2 * x)


def lerp(a, b, x):
    return a + (b - a) * x


def cam(img, cx, cy, z, shake=0.0):
    cw, ch = SW / z, SH / z
    cx += rng.uniform(-shake, shake); cy += rng.uniform(-shake, shake)
    cx = min(max(cx, cw / 2), SW - cw / 2); cy = min(max(cy, ch / 2), SH - ch / 2)
    box = (cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2)
    return img.resize((W, H), Image.LANCZOS, box=box)


def text(d, xy, s, size, fill="white", stroke="black", sw=None, anchor="mm", f=BOLD):
    d.text(xy, s, font=font(size, f), fill=fill, stroke_width=sw if sw is not None else max(2, size // 12),
           stroke_fill=stroke, anchor=anchor)


def wrap(s, size, maxw):
    f = font(size); words = s.split(); lines = [""]
    for w in words:
        t = (lines[-1] + " " + w).strip()
        if f.getlength(t) <= maxw: lines[-1] = t
        else: lines.append(w)
    return lines


def caption(frame, vt):
    for a, b, s in CAPTIONS:
        if a <= vt < b:
            d = ImageDraw.Draw(frame)
            lines = wrap(s, 38, W - 160)
            for i, ln in enumerate(lines):
                text(d, (W // 2, H - 60 - (len(lines) - 1 - i) * 46), ln, 38, sw=4)


def pop(x):  # 0..1 overshoot scale
    x = min(max(x, 0), 1)
    return 1 + 0.35 * math.sin(x * math.pi) * (1 - x) if x < 1 else 1


def label(frame, s, size, xy, t_in, t, fill="white", bg=None):
    if t < t_in: return
    k = min(1, (t - t_in) / 0.25)
    sz = int(size * (0.3 + 0.7 * ease(k)) * pop((t - t_in) / 0.5))
    d = ImageDraw.Draw(frame)
    if bg:
        f = font(sz); tw = f.getlength(s)
        d.rounded_rectangle((xy[0] - tw / 2 - 18, xy[1] - sz * 0.75, xy[0] + tw / 2 + 18, xy[1] + sz * 0.75), 14, fill=bg, outline="black", width=4)
    text(d, xy, s, sz, fill=fill)


def bubble(img, box, tail, s, size):
    d = ImageDraw.Draw(img)
    d.polygon([tail, (box[0] + 40, box[3] - 5), (box[0] + 100, box[3] - 5)], fill="white", outline="black")
    d.rounded_rectangle(box, 30, fill="white", outline="black", width=5)
    d.polygon([tail, (box[0] + 43, box[3] - 8), (box[0] + 97, box[3] - 8)], fill="white")
    lines = wrap(s, size, box[2] - box[0] - 30)
    cy = (box[1] + box[3]) / 2 - (len(lines) - 1) * size * 0.6
    for i, ln in enumerate(lines):
        d.text(((box[0] + box[2]) / 2, cy + i * size * 1.2), ln, font=font(size), fill="black", anchor="mm")


def tinted(amount):
    if amount <= 0: return CHAR.copy()
    brown = np.array([95, 52, 22], np.float32)
    out = arr * (1 - HAIR * amount * 0.75) + brown * HAIR * amount * 0.75
    return Image.fromarray(out.clip(0, 255).astype(np.uint8))


def draw_hair_items(img):
    d = ImageDraw.Draw(img)
    # smartphone sticking out, a pencil, a TV remote, a tiny bird
    ph = Image.new("RGBA", (70, 130), (0, 0, 0, 0)); pd = ImageDraw.Draw(ph)
    pd.rounded_rectangle((0, 0, 69, 129), 10, fill=(25, 25, 30), outline=(200, 200, 210), width=3)
    pd.rectangle((7, 12, 62, 110), fill=(70, 140, 230))
    img.paste(ph.rotate(28, expand=True), (500, 70), ph.rotate(28, expand=True))
    d.line((820, 60, 900, 10), fill=(250, 200, 40), width=12); d.polygon([(900, 10), (915, 2), (906, 18)], fill=(240, 200, 150))
    rm = Image.new("RGBA", (40, 120), (0, 0, 0, 0)); rd = ImageDraw.Draw(rm)
    rd.rounded_rectangle((0, 0, 39, 119), 8, fill=(50, 50, 55)); [rd.ellipse((12, 15 + 18 * i, 27, 30 + 18 * i), fill=(200, 60, 60) if i == 0 else (150, 150, 150)) for i in range(5)]
    img.paste(rm.rotate(-35, expand=True), (760, 40), rm.rotate(-35, expand=True))
    d.ellipse((620, 30, 670, 70), fill=(250, 210, 60), outline="black", width=2)  # bird body
    d.ellipse((650, 38, 657, 45), fill="black"); d.polygon([(668, 45), (682, 50), (668, 55)], fill=(240, 140, 30))


def draw_bottle(img, x, y, ang):
    b = Image.new("RGBA", (70, 190), (0, 0, 0, 0)); d = ImageDraw.Draw(b)
    d.rounded_rectangle((8, 50, 62, 188), 18, fill=(70, 35, 15, 235), outline=(220, 220, 220), width=3)
    d.polygon([(22, 10), (48, 10), (60, 55), (10, 55)], fill=(90, 45, 20, 235))
    d.rectangle((20, 0, 50, 14), fill=(220, 30, 30))
    d.rectangle((8, 95, 62, 135), fill=(215, 25, 30)); d.text((35, 115), "Cola", font=font(16, SERIF), fill="white", anchor="mm")
    r = b.rotate(ang, expand=True)
    img.paste(r, (int(x - r.width / 2), int(y - r.height / 2)), r)


def draw_pizza(img, x, y, r):
    if r < 4: return
    d = ImageDraw.Draw(img)
    d.ellipse((x - r, y - r * 0.45, x + r, y + r * 0.45), fill=(200, 140, 60), outline=(120, 70, 20), width=4)
    d.ellipse((x - r * 0.85, y - r * 0.38, x + r * 0.85, y + r * 0.38), fill=(245, 200, 90))
    for px, py in [(-.5, -.1), (.2, -.2), (.5, .1), (-.1, .15), (-.3, .2), (.1, 0)]:
        rr = r * 0.12
        d.ellipse((x + px * r - rr, y + py * r - rr * 0.5, x + px * r + rr, y + py * r + rr * 0.5), fill=(185, 30, 25))


def hair_mouth(img, open_k):
    d = ImageDraw.Draw(img)
    cx, cy, w, h = 690, 120, 150, 20 + 90 * open_k
    d.ellipse((cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2), fill=(90, 10, 15), outline="black", width=5)
    for i in range(5):
        tx = cx - w / 2 + 25 + i * 25
        d.polygon([(tx - 10, cy - h / 2 + 4), (tx + 10, cy - h / 2 + 4), (tx, cy - h / 2 + 22)], fill="white")
        d.polygon([(tx - 10, cy + h / 2 - 4), (tx + 10, cy + h / 2 - 4), (tx, cy + h / 2 - 22)], fill="white")
    for ex in (cx - 60, cx + 60):  # angry little eyes
        d.ellipse((ex - 18, cy - h / 2 - 50, ex + 18, cy - h / 2 - 14), fill="white", outline="black", width=3)
        d.ellipse((ex - 7, cy - h / 2 - 40, ex + 7, cy - h / 2 - 26), fill="black")


def thought(img, k):
    d = ImageDraw.Draw(img)
    for i, (x, y, r) in enumerate([(930, 330, 12), (975, 280, 20), (1030, 215, 30)]):
        if k > i * 0.15: d.ellipse((x - r, y - r, x + r, y + r), fill="white", outline="black", width=4)
    if k > 0.5:
        d.ellipse((990, 20, 1330, 200), fill="white", outline="black", width=5)
        d.text((1080, 110), "?", font=font(110), fill="black", anchor="mm")
        d.rectangle((1180, 40, 1250, 130), fill="black"); d.rectangle((1150, 125, 1280, 145), fill="black")
        d.rectangle((1180, 105, 1250, 118), fill=(200, 30, 40))
        d.text((1215, 175), "= hat?", font=font(26), fill="black", anchor="mm")


def title_card(t):
    img = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(img)
    for i, c in enumerate([(0, 146, 70), (244, 245, 240), (206, 43, 55)]):
        d.rectangle((i * W // 3, 0, (i + 1) * W // 3, H), fill=c)
    k = ease(t / 0.6)
    text(d, (W // 2, H // 2 - 50), "CURLY", int(40 + 140 * k), sw=10)
    if t > 0.8: text(d, (W // 2, H // 2 + 80), "A Nature Documentary", 50, sw=5)
    return img


def end_card(t):
    img = Image.new("RGB", (W, H), (15, 15, 20)); d = ImageDraw.Draw(img)
    text(d, (W // 2, H // 2 - 40), "THE END", int(60 + 50 * ease(t / 0.5)), sw=6)
    if t > 0.7: text(d, (W // 2, H // 2 + 60), "(the hair wins)", 40, fill=(255, 210, 90), sw=3)
    if t > 1.6: text(d, (W // 2, H - 60), "No hoodies were harmed. Several pizzas were.", 26, fill=(180, 180, 180), sw=2)
    return img


def scene_frame(name, st, vt):
    """st = seconds into scene, vt = voiceover time."""
    if name == "entrance":
        f = cam(S1, lerp(690, 715, ease(st / 13)), lerp(420, 300, ease(st / 13)), lerp(1.0, 1.35, ease(st / 13)))
        if vt >= 10.9: label(f, "VISITS: 43", 56, (1060, 90), 10.9, vt, fill=(255, 225, 60), bg=(200, 30, 40))
        if 4.6 <= vt < 6.6: label(f, "ITALIAN?", 60, (230, 110), 4.6, vt, fill="white", bg=(0, 146, 70))
        if 7.5 <= vt < 9.0: label(f, "ITALY VISITS: 0", 48, (240, 110), 7.5, vt, fill="white", bg=(40, 40, 40))
        return f
    if name == "order":
        src = S2.copy()
        if 17.8 <= vt < 22.4:
            s = "Uno pizza-a..." if vt < 19.4 else ("...per favore..." if vt < 20.7 else "...MAMMA MIA!")
            bubble(src, (860, 60, 1320, 220), (790, 320), s, 44)
        if vt < 22.4:
            k = ease(st / 9.4)
            return cam(src, lerp(700, 760, k), lerp(380, 300, k), lerp(1.05, 1.35, k))
        k = ease((vt - 22.4) / 3.5)
        f = cam(src, 290, 320, lerp(2.1, 2.5, k), shake=6 if vt < 22.7 else 0)
        if vt >= 24.7: label(f, "UNIMPRESSED", 60, (W // 2, 90), 24.7, vt, fill="white", bg=(40, 40, 40))
        return f
    if name == "think":
        src = CHAR.copy()
        if vt >= 32.0: thought(src, ease((vt - 32.0) / 0.8))
        k = ease(st / 9.5)
        if vt < 32.0:
            f = cam(src, 700, 260, lerp(1.7, 2.0, k))
            if vt >= 27.4:
                d = ImageDraw.Draw(f)
                d.rectangle((40, 60, 600, 170), fill=(0, 0, 0))
                d.text((60, 95), "CURLIUS HOODICUS", font=font(40, SERIF), fill="white", anchor="lm")
                d.text((60, 140), "Habitat: pizza shops, Canada", font=font(26), fill=(220, 220, 220), anchor="lm")
            return f
        return cam(src, lerp(820, 900, k), 230, 1.35)
    if name == "phone":
        src = CHAR.copy(); draw_hair_items(src)
        if vt < 41.2:
            k = ease((vt - 36.0) / 0.4)
            f = cam(src, lerp(700, 845, k), lerp(384, 520, k), lerp(1.0, 2.4, k))
            if vt >= 38.5: label(f, "THE AESTHETIC™", 54, (W // 2, 90), 38.5, vt, fill=(255, 150, 220), bg=(30, 30, 30))
            return f
        k = ease((vt - 42.3) / 1.0)
        f = cam(src, lerp(845, 690, k), lerp(520, 170, k), lerp(2.4, 1.8, k))
        if vt >= 44.3: label(f, "LOST & FOUND", 52, (W // 2, 70), 44.3, vt, fill="white", bg=(200, 30, 40))
        return f
    if name == "coke":
        amt = ease((vt - 52.2) / 2.5) if vt > 52.2 else 0
        src = tinted(amt)
        shake_b = 8 * math.sin(vt * 40) if 47.8 <= vt < 52.0 else 0
        if vt < 52.0: draw_bottle(src, 850 + shake_b, 520, 10 + 2 * shake_b)
        else: draw_bottle(src, 850, 540, 0)
        d = ImageDraw.Draw(src)
        if 52.0 <= vt < 55.5:  # geyser into the hair
            p = min(1, (vt - 52.0) / 0.35)
            for i in range(320):
                u = (i / 160 + vt * 1.7) % 1.0
                y = lerp(450, lerp(430, 120, p), u)
                x = 850 + (690 - 850) * u + rng.normal(0, 28) * (0.3 + u)
                r = rng.uniform(9, 22) * (1 - 0.4 * u)
                c = (150, 95, 50) if i % 3 else (235, 220, 190)
                d.ellipse((x - r, y - r, x + r, y + r), fill=c)
        if 52.0 <= vt < 54.0:  # the cap escapes
            u = (vt - 52.0) / 1.2
            cx, cy = 850 + 700 * u, 440 - 600 * u + 400 * u * u
            d.ellipse((cx - 14, cy - 14, cx + 14, cy + 14), fill=(220, 30, 30), outline="black", width=2)
        if vt < 52.0:
            k = ease((vt - 46.0) / 6)
            f = cam(src, lerp(700, 790, k), lerp(380, 420, k), lerp(1.2, 1.6, k))
            if vt >= 49.6: label(f, "WHY?!", 70, (W // 2, 90), 49.6, vt, fill="white", bg=(200, 30, 40))
            return f
        if vt < 57.0:
            f = cam(src, 740, 300, 1.25, shake=22 if vt < 53.5 else 0)
            if 52.1 <= vt < 53.6: label(f, "DISASTER!", 110, (W // 2, H // 2 - 100), 52.1, vt, fill=(255, 60, 40))
            if vt >= 54.8: label(f, "ABSORBED", 60, (W // 2, 80), 54.8, vt, fill=(255, 225, 60), bg=(70, 40, 15))
            return f
        f = cam(src, 700, 360, 1.05)
        label(f, "BOTTLE CAP STATUS: MISSING", 44, (W // 2, 80), 57.2, vt, fill="white", bg=(20, 60, 140))
        return f
    if name == "pizza":
        src = tinted(1.0)
        # pizza slides in, sits, then flies into the hair
        if vt < 65.4:
            px, py, pr = lerp(1500, 780, ease((vt - 60.0) / 1.2)), 580, 110
        else:
            u = ease((vt - 65.4) / 1.0)
            px, py, pr = lerp(780, 690, u), lerp(580, 130, u), lerp(110, 30 if vt < 66.5 else 0, u)
        chomping = 66.4 <= vt < 67.6
        if chomping or 65.9 <= vt < 66.4:
            hair_mouth(src, abs(math.sin((vt - 65.9) * 9)) if chomping else ease((vt - 65.9) / 0.5))
        if vt < 66.5: draw_pizza(src, px, py, pr)
        if vt < 65.4:
            k = ease((vt - 60.0) / 5)
            f = cam(src, 740, lerp(420, 380, k), lerp(1.15, 1.35, k))
            if vt >= 62.9: label(f, "*chef's kiss*", 58, (W // 2, 90), 62.9, vt, fill=(255, 225, 60), bg=(0, 146, 70))
            return f
        if vt < 69.2:
            z = 1.35 + (0.06 * math.sin(vt * 30) if chomping else 0)
            f = cam(src, 700, lerp(380, 220, ease((vt - 65.4) / 0.8)), z, shake=5 if chomping else 0)
            if chomping: label(f, "CHOMP", 80, (1030, 300), 66.4, vt, fill=(255, 150, 40))
            return f
        f = cam(src, 700, 300, 1.1)
        d = ImageDraw.Draw(f)
        if vt >= 69.2:
            k = pop((vt - 69.2) / 0.5)
            d.rounded_rectangle((W // 2 - 330, 40, W // 2 + 330, 170), 20, fill=(20, 20, 25), outline=(255, 225, 60), width=6)
            text(d, (W // 2 - 170, 105), "CURLY", 46)
            text(d, (W // 2, 105), "0 - 2" if vt >= 70.4 else "0 - 1", int(64 * k), fill=(255, 225, 60))
            text(d, (W // 2 + 170, 105), "HAIR", 46)
        if vt >= 71.2:
            label(f, "FORZA HAIR!", 120, (W // 2, H // 2 + 120), 71.2, vt, fill="white", bg=(0, 146, 70))
        return f


def frame_at(t):
    if t < VO_OFFSET: return title_card(t)
    vt = t - VO_OFFSET
    if vt >= 73.0: return end_card(vt - 73.0)
    for a, b, name in SCENES:
        if a <= vt < b:
            f = scene_frame(name, vt - a, vt)
            caption(f, vt)
            return f
    return end_card(0)


if __name__ == "__main__":
    n = int(TOTAL * FPS)
    preview = sys.argv[1:] and sys.argv[1] == "preview"
    if preview:
        for t in [58]:
            frame_at(t).save(f"clips/p_{t:05.1f}.jpg", quality=80)
        sys.exit()
    p = subprocess.Popen([FF, "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                          "-i", "audio/mix.wav", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
                          "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", "curly_the_documentary.mp4"],
                         stdin=subprocess.PIPE)
    for i in range(n):
        p.stdin.write(frame_at(i / FPS).tobytes())
        if i % 240 == 0: print(f"{i}/{n}", flush=True)
    p.stdin.close(); p.wait()
    print("done", p.returncode)
