"""Score and sound effects for James and the Giant Peach.

Writes music.wav and sfx.wav (48 kHz stereo). Everything is synthesized here.
Times match the voiceover line times used in scenes.js.
"""
import numpy as np, wave
from scipy.signal import butter, lfilter

SR = 48000
DUR = 121.5
N = int(SR * DUR)
rng = np.random.default_rng(11)
music = np.zeros((N, 2))
sfx = np.zeros((N, 2))
SPLASH_T = 74.93


def T(d): return np.arange(int(d * SR)) / SR
def env(d, a=0.003, dec=6.0): t = T(d); return np.minimum(1, t / a) * np.exp(-dec * t)
def adsr(d, a=0.05, r=0.3): t = T(d); return np.minimum(1, t / a) * np.minimum(1, np.maximum(0, (d - t) / r))
def noise(d): return rng.standard_normal(int(d * SR))
def filt(x, kind, f, order=2):
    b, a = butter(order, np.array(f) / (SR / 2), kind); return lfilter(b, a, x)
def mtof(m): return 440 * 2 ** ((m - 69) / 12)
def sweep(f0, f1, d, curve=4.0):
    t = T(d); f = f1 + (f0 - f1) * np.exp(-curve * t / d); return np.sin(2 * np.pi * np.cumsum(f) / SR)
def glide(f0, f1, d):
    t = T(d); f = f0 * (f1 / f0) ** (t / d); return np.sin(2 * np.pi * np.cumsum(f) / SR)
def place(x, s, i):
    if 0 <= i < len(x): m = min(len(s), len(x) - i); x[i:i + m] += s[:m]

def mx(*xs):
    n = max(len(x) for x in xs); o = np.zeros(n)
    for x in xs: o[:len(x)] += x
    return o
def add(bus, sig, t, g=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N or i + len(sig) <= 0: return
    if i < 0: sig = sig[-i:]; i = 0
    sig = sig[:N - i]
    L, R = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414
    bus[i:i + len(sig), 0] += sig * g * L; bus[i:i + len(sig), 1] += sig * g * R

# ---------------- instruments ----------------
def musicbox(f, d=1.6):
    t = T(d); x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 3.0 * t) * np.exp(-6 * t) + 0.15 * np.sin(2 * np.pi * f * 5.02 * t) * np.exp(-9 * t)
    return x * env(d, 0.002, 2.6) * 0.5
def celesta(f, d=1.2):
    t = T(d); x = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 4.0 * t) * np.exp(-10 * t)
    return x * env(d, 0.002, 3.5) * 0.45
def pluck(f, d=0.6, bright=0.5, decay=0.996):
    n = int(d * SR); P = max(2, int(SR / f)); exc = np.zeros(n); burst = filt(rng.standard_normal(P), 'lowpass', min(0.99 * SR / 2, 1500 + bright * 8000)); exc[:P] = burst
    a = np.zeros(P + 2); a[0] = 1; a[P] = -0.5 * decay; a[P + 1] = -0.5 * decay
    y = lfilter([1], a, exc); return y / (np.abs(y).max() + 1e-9) * env(d, 0.001, 1.5) * 0.6
def saw(f, t, n=12): return sum(np.sin(2 * np.pi * f * k * t) / k for k in range(1, n))
def pad(freqs, d, a=0.6, r=0.8, cut=1800):
    t = T(d); x = sum(saw(f * (1 + dt), t, 8) for f in freqs for dt in (-0.004, 0.004)) / (2 * len(freqs))
    return filt(x, 'lowpass', cut) * adsr(d, a, r) * 0.5
def strings(f, d, a=0.3, r=0.4, cut=2200):
    t = T(d); vib = 1 + 0.004 * np.sin(2 * np.pi * 5.5 * t)
    x = sum(np.sin(2 * np.pi * np.cumsum(np.full(len(t), f * k) * vib) / SR) / k for k in range(1, 9))
    return filt(x, 'lowpass', cut) * adsr(d, a, r) * 0.35
def brass(f, d, a=0.04, r=0.2):
    t = T(d); x = saw(f, t, 16); e = adsr(d, a, r)
    return filt(x, 'lowpass', 900 + 2500 * np.exp(-3 * t).mean()) * e * 0.35
def boom(f0=90, d=1.2, g=1.0): return mx(sweep(f0, 30, d, 5) * env(d, 0.002, 3.5), filt(noise(0.3), 'lowpass', 600) * env(0.3, 0.001, 18) * 0.8) * g
def timp(f, d=1.0): t = T(d); return mx((np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.5 * t) * np.exp(-6 * t)) * env(d, 0.003, 3) * 0.7, filt(noise(0.05), 'lowpass', 1500) * env(0.05, 0.001, 60) * 0.3)
def woodblock(f=900): return mx(np.sin(2 * np.pi * f * T(0.08)) * env(0.08, 0.0005, 60), filt(noise(0.02), 'bandpass', [1500, 4000]) * env(0.02, 0.0005, 200) * 0.3)
def shaker(): return filt(noise(0.06), 'highpass', 6000) * env(0.06, 0.004, 60) * 0.4
def chord(root, kind='maj'):
    iv = {'maj': [0, 4, 7], 'min': [0, 3, 7], 'maj7': [0, 4, 7, 11], 'sus': [0, 5, 7], 'dim': [0, 3, 6], 'add9': [0, 4, 7, 14]}[kind]
    return [mtof(root + i) for i in iv]

# ---------------- effects palette ----------------
def pop(p=1.0): return sweep(380 * p, 1100 * p, 0.08, -2.5) * env(0.08, 0.001, 45)
def swish(d=0.35, lo=800, hi=8000): t = T(d); return filt(noise(d), 'bandpass', [lo, hi]) * np.sin(np.pi * t / d) ** 2 * 0.9
def whoosh(d=0.5, up=True): t = T(d); u = t / d; return filt(noise(d), 'bandpass', [300, 5000]) * ((u ** 2) if up else (1 - u) ** 2) * np.sin(np.pi * np.clip(u * 0.999, 0, 1)) ** 0.3 * 1.2
def chime(freqs, step=0.07, d=1.6):
    out = np.zeros(int((len(freqs) * step + d) * SR))
    for k, f in enumerate(freqs): s = celesta(f, d); i = int(k * step * SR); place(out, s, i)
    return out
def sparkles(d, lo=1500, hi=5000, dens=26, seed=1):
    r = np.random.default_rng(seed); out = np.zeros(int((d + 0.6) * SR))
    for k in range(int(d * dens)): f = lo * (hi / lo) ** r.random(); s = celesta(f, 0.5) * (0.3 + 0.5 * r.random()); i = int(r.random() * d * SR); place(out, s, i)
    return out
def thud(g=1.0): return mx(sweep(120, 40, 0.4, 5) * env(0.4, 0.001, 9) * 1.3, filt(noise(0.12), 'lowpass', 1200) * env(0.12, 0.001, 35)) * g
def step(): return filt(noise(0.06), 'bandpass', [150, 1200]) * env(0.06, 0.002, 50) * 0.8
def thunder(d=3.5):
    t = T(d); x = filt(noise(d), 'lowpass', 400) * (np.exp(-1.2 * t) + 0.6 * np.exp(-3 * np.maximum(0, t - 0.4)) * (t > 0.4))
    crack = filt(noise(0.25), 'highpass', 1500) * env(0.25, 0.001, 14)
    return mx(x * 2.2, crack * 1.2)
def rain_loop(d):
    x = filt(noise(d), 'bandpass', [800, 8000]) * 0.25
    r = np.random.default_rng(3)
    for k in range(int(d * 40)): i = int(r.random() * d * SR); s = filt(noise(0.01), 'highpass', 3000) * env(0.01, 0.0005, 400) * (0.2 + 0.3 * r.random()); place(x, s, i)
    return x * adsr(d, 0.8, 1.0)
def twang(): t = T(0.5); return np.sin(2 * np.pi * np.cumsum(420 + 200 * np.exp(-12 * t)) / SR) * env(0.5, 0.001, 9) * 0.6
def creak(d=0.7): t = T(d); f = 180 + 60 * np.sin(2 * np.pi * 3 * t); return filt(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.3, 'bandpass', [300, 2000]) * adsr(d, 0.05, 0.2)
def boing(f=220, d=0.5):
    t = T(d); ft = f * (1 + 0.6 * np.exp(-8 * t)) * (1 + 0.07 * np.sin(2 * np.pi * 14 * t)); return np.sin(2 * np.pi * np.cumsum(ft) / SR) * env(d, 0.003, 6) * 0.7
def slide_whistle(f0, f1, d): return glide(f0, f1, d) * adsr(d, 0.05, 0.1) * 0.35
def crunch(): return filt(noise(0.09), 'bandpass', [900, 5000]) * env(0.09, 0.001, 40) * (0.6 + 0.4 * rng.random())
def snap(): return mx(filt(noise(0.05), 'highpass', 2000) * env(0.05, 0.0005, 70) * 1.8, thud(0.6))
def rumble(d):
    t = T(d); x = filt(noise(d), 'lowpass', 220) * (0.6 + 0.4 * np.sin(2 * np.pi * 5 * t)) * np.minimum(1, t / 0.4) * np.minimum(1, (d - t) / 0.2)
    return x * 1.6
def splat(): return mx(filt(noise(0.25), 'lowpass', 1800) * env(0.25, 0.002, 14) * 1.2, sweep(300, 90, 0.3, 4) * env(0.3, 0.002, 10) * 0.6)
def splash(d=1.6):
    t = T(d); x = filt(noise(d), 'bandpass', [400, 7000]) * (np.exp(-2.5 * t)) * 1.8
    r = np.random.default_rng(5)
    for k in range(40): i = int((0.1 + r.random() ** 1.5 * 1.2) * SR); s = celesta(700 + r.random() * 1600, 0.12) * 0.4; place(x, s, i)
    return mx(x, boom(70, 0.8, 0.9))
def surf(d):
    t = T(d); return filt(noise(d), 'lowpass', 900) * (0.55 + 0.45 * np.sin(2 * np.pi * 0.18 * t) ** 2) * adsr(d, 1.0, 1.0) * 0.5
def gull_call(f=1500):
    d = 0.45; t = T(d); ft = f * (1 + 0.35 * np.sin(np.pi * t / d)) * (1 - 0.25 * t / d)
    x = np.sign(np.sin(2 * np.pi * np.cumsum(ft) / SR)) * 0.2 + np.sin(2 * np.pi * np.cumsum(ft) / SR) * 0.5
    return filt(x, 'bandpass', [900, 4500]) * adsr(d, 0.03, 0.12) * 0.5
def zip_(d=0.18): return glide(900, 3200, d) * env(d, 0.002, 6) * 0.25
def jaw(): return mx(filt(noise(0.06), 'bandpass', [600, 3000]) * env(0.06, 0.0005, 60) * 1.6, woodblock(400) * 0.8)
def wind(d): t = T(d); return filt(noise(d), 'bandpass', [200, 1400]) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.23 * t) ** 2) * adsr(d, 1.5, 1.5) * 0.45
def crickets(d):
    out = np.zeros(int(d * SR)); r = np.random.default_rng(8)
    for k in range(int(d * 3.2)):
        i = int(r.random() * (d - 0.4) * SR); f = 4200 + r.random() * 900
        for j in range(3): s = np.sin(2 * np.pi * f * T(0.03)) * env(0.03, 0.002, 60) * 0.25; o = i + int(j * 0.055 * SR); place(out, s, o)
    return out * adsr(d, 0.8, 0.8)
def munch(): return mx(*[np.pad(crunch() * 0.7, (int(k * 0.11 * SR), 0)) for k in range(3)])
def patter(d):
    out = np.zeros(int(d * SR)); r = np.random.default_rng(12)
    for k in range(int(d * 14)): i = int(r.random() * (d - 0.1) * SR); s = step() * (0.3 + 0.4 * r.random()); place(out, s, i)
    return out
def birds(d):
    out = np.zeros(int(d * SR)); r = np.random.default_rng(14)
    for k in range(int(d * 2.5)):
        i = int(r.random() * (d - 0.4) * SR); f = 2500 + r.random() * 1500
        for j in range(r.integers(2, 5)): s = glide(f, f * 1.3, 0.07) * env(0.07, 0.003, 30) * 0.25; o = i + int(j * 0.1 * SR); place(out, s, o)
    return out

# ======================= SFX timeline =======================
add(sfx, swish(0.9, 300, 4000), 0.9, 0.5, -0.3)                         # cover opens
add(sfx, pop(1.2), 2.85, 0.35)                                          # name tag
add(sfx, twang(), 6.3, 0.5, 0.4)                                        # kite string snaps
for k in range(14): add(sfx, step() * 0.5, 7.9 + k * 0.18, 0.5, -0.2 + k * 0.03)  # footsteps on the road
add(sfx, creak(0.7), 10.15, 0.4, 0.4); add(sfx, pop(0.9), 10.3, 0.35, 0.3); add(sfx, pop(0.8), 11.2, 0.35, 0.5)
add(sfx, thunder(4.0), 13.8, 0.95)
add(sfx, rain_loop(7.6), 13.9, 0.55)
for k in range(9): add(sfx, swish(0.22, 1500, 7000) * 0.6, 16.2 + k * 0.45, 0.5, -0.2)   # broom
for k, (tt, g) in enumerate([(17.95, 1), (18.2, 0.7), (18.4, 0.5)]): add(sfx, boing(260 - k * 20, 0.25) * 0.5, tt, g, -0.3)
add(sfx, mx(filt(noise(0.08), 'highpass', 1500) * env(0.08, 0.0005, 50) * 1.4, pop(0.6)), 18.62, 0.8, 0.1)   # ball pops
for k in range(8): add(sfx, step() * 0.5, 23.0 + k * 0.28, 0.5, -0.5); add(sfx, woodblock(1400) * 0.4, 23.14 + k * 0.56, 0.4, -0.5)  # old man + cane
add(sfx, chime([1568, 2093, 2637], 0.08), 25.5, 0.45)                    # bag handed over
t_ = T(2.5); add(sfx, (np.sin(2 * np.pi * 110 * t_) + 0.5 * np.sin(2 * np.pi * 165 * t_)) * adsr(2.5, 0.8, 0.5) * 0.15, 26.4, 0.6)  # magic hum
add(sfx, sparkles(2.0, 2000, 6000, 18, 2), 28.9, 0.5)
add(sfx, sparkles(0.5, 1500, 5000, 30, 3), 30.1, 0.6)                    # poof
add(sfx, whoosh(0.3), 31.2, 0.4); add(sfx, thud(0.9), 31.62, 0.9)        # trip
add(sfx, sparkles(0.9, 1200, 4000, 30, 4), 31.6, 0.6)                    # scatter
t_ = T(2.2); add(sfx, np.sin(2 * np.pi * (70 + 25 * np.sin(2 * np.pi * 3 * t_)) * t_) * adsr(2.2, 0.3, 0.5) * 0.35, 33.3, 0.6)   # sinking gurgle
add(sfx, glide(200, 900, 2.2) * adsr(2.2, 0.2, 0.3) * 0.2, 34.6, 0.5)    # glow rising through roots
for k in range(5): add(sfx, pop(0.9 + k * 0.12), 38.0 + k * 0.3, 0.45, -0.4 + k * 0.2)   # leaves pop out
add(sfx, mx(pop(1.8), chime([2093, 3136], 0.06)), 40.62, 0.6)             # a peach!
add(sfx, slide_whistle(400, 900, 0.9), 42.5, 0.6)                        # it grew bigger
add(sfx, slide_whistle(300, 700, 0.7), 44.66, 0.7); add(sfx, boom(80, 1.0, 0.8), 44.7, 0.7)
add(sfx, slide_whistle(200, 520, 1.0), 45.8, 0.7); add(sfx, boom(60, 1.4, 1.0), 46.7, 0.8)
add(sfx, crickets(5.6), 48.0, 0.5)
for k in range(8): add(sfx, step() * 0.35, 49.3 + k * 0.3, 0.4, -0.2)
add(sfx, filt(noise(0.9), 'bandpass', [400, 2500]) * adsr(0.9, 0.1, 0.3) * 0.3, 51.7, 0.5)   # crawling rustle
add(sfx, whoosh(0.6, True), 53.1, 0.5)
add(sfx, mx(boom(110, 0.8, 0.6), chime([523, 659, 784, 1047], 0.05)), 54.45, 0.7)          # lights on
add(sfx, mx(*[np.pad(strings(mtof(m), 0.18, 0.01, 0.05), (int(i * 0.07 * SR), 0)) for i, m in enumerate([84, 86, 84, 86, 88])]), 56.45, 0.5, -0.6)   # grasshopper: fiddle trill
add(sfx, chime([1319, 1568, 2093], 0.09), 58.15, 0.55, -0.3)             # ladybird
add(sfx, mx(*[np.pad(pluck(mtof(m), 0.5), (int(i * 0.05 * SR), 0)) for i, m in enumerate([60, 64, 67, 72, 76, 79])]), 59.95, 0.5, 0.1)   # spider: harp
add(sfx, slide_whistle(300, 180, 0.7) * 1.2, 61.72, 0.5, 0.4)             # earthworm: uh-oh
add(sfx, mx(brass(mtof(60), 0.18), np.pad(brass(mtof(64), 0.18), (int(0.16 * SR), 0)), np.pad(brass(mtof(67), 0.7), (int(0.32 * SR), 0))), 63.6, 0.6, 0.6)   # centipede: ta-da
add(sfx, swish(0.7, 500, 6000), 66.3, 0.4)
for k in range(12): add(sfx, crunch(), 67.1 + k * 0.16, 0.55, 0.2)
add(sfx, snap(), 68.95, 0.9)
add(sfx, rumble(5.2), 69.4, 0.8)
add(sfx, mx(splat(), np.pad(boing(180, 0.5), (int(0.1 * SR), 0))), 72.85, 0.8, -0.2)
add(sfx, whoosh(0.5, True), 74.35, 0.5)
add(sfx, splash(), SPLASH_T, 1.0)
add(sfx, surf(13.8), 76.1, 0.6)
t_ = T(3.0); add(sfx, np.sin(2 * np.pi * 55 * t_) * adsr(3.0, 0.6, 0.6) * 0.3, 76.7, 0.6)   # low tension
add(sfx, mx(celesta(1568, 1.0), celesta(2093, 1.0)), 79.75, 0.7)         # idea!
r_ = np.random.default_rng(21)
for k in range(16): add(sfx, gull_call(1300 + r_.random() * 700), 81.8 + r_.random() * 7.5, 0.25 + r_.random() * 0.2, r_.random() * 2 - 1)
for k in range(14): add(sfx, zip_(), 82.2 + k * 0.23, 0.35, r_.random() * 2 - 1)
add(sfx, glide(150, 600, 2.8) * adsr(2.8, 0.3, 0.4) * 0.25, 86.9, 0.6)   # lift
add(sfx, whoosh(1.2, True), 87.2, 0.5)
add(sfx, mx(jaw(), splash(0.8) * 0.5), 87.75, 0.8, -0.3)                  # chomp
add(sfx, swish(0.7, 500, 6000), 89.6, 0.4)
add(sfx, wind(9.2), 89.9, 0.55)
add(sfx, sparkles(2.2, 1200, 4200, 14, 6), 92.6, 0.45, -0.4); add(sfx, sparkles(2.2, 1200, 4200, 14, 7), 93.4, 0.45, 0.4)
add(sfx, swish(0.7, 400, 5000), 98.6, 0.4)
add(sfx, slide_whistle(1200, 500, 2.0) * 0.8, 99.4, 0.4)
add(sfx, mx(boom(55, 1.6, 1.2), creak(0.5) * 0.6), 101.42, 1.0)
add(sfx, sparkles(1.6, 1500, 5000, 30, 9), 101.6, 0.5)
add(sfx, swish(0.7, 400, 5000), 103.0, 0.4)
add(sfx, patter(1.4), 103.7, 0.7)
for k in range(7): add(sfx, munch(), 104.3 + k * 0.3, 0.5, (k % 3 - 1) * 0.4)
add(sfx, chime([1047, 1319, 1568, 2093], 0.06), 106.06, 0.5)
add(sfx, sparkles(1.4, 1500, 4500, 22, 10), 110.45, 0.5)
add(sfx, birds(4.0), 112.8, 0.45)
add(sfx, chime([1568, 2093, 2637, 3136], 0.08), 114.8, 0.4)
add(sfx, mx(thud(0.6), swish(0.6, 300, 3000)), 117.6, 0.6)
add(sfx, sparkles(2.0, 1500, 5000, 16, 12), 118.2, 0.4)

# ======================= SCORE =======================
BEAT = 0.6  # 100 bpm
THEME = [(76, 1), (79, 1), (84, 1.5), (83, 0.5), (81, 1), (79, 1), (76, 2), (77, 1), (81, 1), (79, 1), (76, 1), (74, 2), (72, 2)]  # main music-box theme (C major)
def play_melody(bus, notes, t0, beat, inst=musicbox, g=0.5, transpose=0, pan=0.0, until=None):
    t = t0
    for m, d in notes:
        if until is not None and t >= until: break
        if m: add(bus, inst(mtof(m + transpose), max(0.6, d * beat * 2)), t, g, pan)
        t += d * beat
    return t
def pad_prog(bus, chords, t0, bar, g=0.35, cut=1600):
    t = t0
    for root, kind in chords: add(bus, pad(chord(root, kind), bar + 0.6, 0.5, 0.7, cut), t, g); t += bar
    return t
def bass_line(bus, roots, t0, bar, g=0.4, pattern=(0, 2)):
    t = t0
    for r in roots:
        for p in pattern: add(bus, pluck(mtof(r - 12), 0.7, 0.3), t + p * bar / 4, g)
        t += bar
    return t

# 0 - 5.9 once upon a time: warm C major
pad_prog(music, [(60, 'maj'), (65, 'maj'), (67, 'sus'), (60, 'maj')], 0.3, 2.4, 0.3)
play_melody(music, THEME, 0.4, 0.42, musicbox, 0.45, 0, 0.2, until=5.8)
# 5.9 - 12.9 sad: A minor, sparse
pad_prog(music, [(57, 'min'), (53, 'maj'), (57, 'min')], 5.9, 2.4, 0.3, 1100)
for i, m in enumerate([76, 74, 72, 71, 69]): add(music, musicbox(mtof(m), 2.0), 6.3 + i * 1.3, 0.35, -0.2)
# 12.9 - 21 terrible aunts: D minor stomp + mean pizzicato
add(music, timp(mtof(38), 2.0), 13.82, 0.9)
pad_prog(music, [(50, 'min'), (50, 'min'), (46, 'maj'), (45, 'maj')], 13.9, 1.8, 0.28, 900)
pizz = [62, 65, 69, 65, 62, 65, 69, 70, 69, 65, 62, 61]
for k in range(40):
    tt = 14.2 + k * 0.3
    if tt > 20.8: break
    add(music, pluck(mtof(pizz[k % len(pizz)]), 0.3, 0.2), tt, 0.35, 0.3 if k % 2 else -0.3)
    if k % 2 == 0: add(music, pluck(mtof(38), 0.5, 0.1), tt, 0.4)
# 21 - 28.9 curious: whole-tone celesta arpeggios + soft strings
add(music, strings(mtof(52), 7.8, 1.5, 1.2, 1200), 21.2, 0.35)
wt = [64, 66, 68, 70, 72, 74, 76, 74, 72, 70, 68, 66]
for k in range(30):
    tt = 21.4 + k * 0.25
    if tt > 28.7: break
    add(music, celesta(mtof(wt[k % len(wt)] + 12), 0.8), tt, 0.25, np.sin(k) * 0.6)
# 28.9 - 31.1 hush for "magic": only a high shimmer
add(music, pad([mtof(76), mtof(83), mtof(88)], 2.2, 0.4, 0.8, 4000), 28.9, 0.2)
# 31.1 - 40.5 magic: rising lydian runs over pulsing pad
pad_prog(music, [(60, 'maj7'), (62, 'maj'), (60, 'maj7'), (62, 'maj')], 31.2, 2.35, 0.3, 2200)
lyd = [60, 62, 64, 66, 67, 69, 71, 72, 74, 76, 78, 79]
for k in range(36):
    tt = 33.3 + k * 0.15
    if tt > 38.9: break
    add(music, celesta(mtof(lyd[k % 12] + 12 * ((k // 12) % 2)), 0.6), tt, 0.22, np.sin(k * 0.7) * 0.7)
add(music, glide(mtof(48), mtof(72), 2.6) * adsr(2.6, 0.2, 0.2) * 0.12, 38.0, 0.8)
# 40.5 - 48.6 the peach grows: bouncy F major with a hit on each growth
BAR = 1.2
bass_line(music, [53, 53, 58, 60, 53, 58], 40.6, BAR, 0.45, (0, 1, 2, 3))
pad_prog(music, [(65, 'maj'), (65, 'maj'), (70, 'maj'), (72, 'maj'), (65, 'add9'), (70, 'maj')], 40.6, BAR, 0.25, 2600)
for tt in [40.61, 42.46, 44.66, 45.78]: add(music, timp(mtof(41), 1.2), tt, 0.7)
add(music, brass(mtof(65), 1.2), 45.8, 0.5); add(music, brass(mtof(69), 1.2), 45.8, 0.4); add(music, brass(mtof(72), 1.2), 45.8, 0.35)
play_melody(music, [(77, 1), (81, 1), (84, 2), (82, 1), (81, 1), (79, 2)], 40.7, 0.3, musicbox, 0.35, 0, 0.3)
# 48.6 - 53.6 night lullaby: G major music box
pad_prog(music, [(55, 'maj'), (60, 'maj')], 48.6, 2.5, 0.22, 1200)
play_melody(music, [(74, 1), (79, 1), (78, 1), (76, 1), (74, 2), (71, 1), (72, 1), (74, 2)], 49.0, 0.5, musicbox, 0.35, 0, -0.2, until=53.4)
# 53.6 - 66.6 the bugs: playful pizzicato march in G
march_roots = [55, 55, 60, 62, 55, 55, 60, 62, 55, 60]
bass_line(music, march_roots, 55.0, 1.2, 0.4, (0, 2))
for k in range(int((66.3 - 55.0) / 0.3)):
    tt = 55.0 + k * 0.3; add(music, pluck(mtof([67, 71, 74, 71][k % 4]), 0.3, 0.4), tt, 0.25, 0.4 if k % 2 else -0.4)
    if k % 4 == 2: add(music, woodblock(1100), tt, 0.25)
pad_prog(music, [(55, 'maj'), (60, 'maj'), (62, 'maj'), (55, 'maj')], 54.45, 3.0, 0.2, 2000)
# 66.6 - 76.3 rolling: fast comic galop in C
add(music, pluck(mtof(60), 0.3), 67.1, 0.3)
for k in range(int((68.9 - 67.1) / 0.32)): add(music, pluck(mtof([72, 74][k % 2]), 0.2, 0.5), 67.1 + k * 0.32, 0.22, 0.3)   # sneaky chewing tiptoe
gal = [72, 76, 79, 76, 72, 76, 79, 84, 83, 79, 77, 74, 71, 74, 77, 79]
for k in range(int((74.9 - 69.4) / 0.17)):
    tt = 69.4 + k * 0.17
    add(music, pluck(mtof(gal[k % len(gal)]), 0.25, 0.6), tt, 0.28, 0.3 if k % 2 else -0.3)
    if k % 2 == 0: add(music, pluck(mtof([48, 55][k // 2 % 2]), 0.3, 0.2), tt, 0.35)
    if k % 4 == 2: add(music, woodblock(900), tt, 0.2)
add(music, timp(mtof(36), 1.5), SPLASH_T, 0.7)
# 76.3 - 79.6 sharks: two-note low ostinato
for k in range(int((79.5 - 76.6) / 0.35)): add(music, strings(mtof(40 + (k % 2)), 0.32, 0.01, 0.08, 800), 76.6 + k * 0.35, 0.8 + k * 0.04)
# 79.6 - 89.9 the idea, the gulls, the lift: hopeful build
pad_prog(music, [(62, 'sus'), (62, 'maj'), (67, 'maj'), (69, 'sus'), (69, 'maj')], 79.7, 1.45, 0.3, 2400)
for k in range(int((86.8 - 81.9) / 0.2)): add(music, celesta(mtof([74, 78, 81, 86][k % 4]), 0.5), 81.9 + k * 0.2, 0.18 + 0.1 * k / 25, np.sin(k) * 0.5)
for m in [62, 66, 69, 74]: add(music, strings(mtof(m), 3.0, 0.4, 1.2, 3000), 86.92, 0.35)
add(music, timp(mtof(38), 1.4), 86.92, 0.7)
# 89.9 - 98.9 floating: soaring D major theme
pad_prog(music, [(62, 'maj'), (67, 'maj'), (71, 'min'), (69, 'maj'), (62, 'maj'), (67, 'maj'), (69, 'maj')], 89.9, 1.3, 0.3, 2600)
play_melody(music, THEME, 90.3, 0.5, musicbox, 0.45, 2, 0.2, until=98.6)
for m in [50, 55, 59, 57]: pass
bass_line(music, [62, 67, 71, 69, 62, 67, 69], 89.9, 1.3, 0.3, (0,))
# 98.9 - 103.3 New York: fanfare, then the landing hit
for i, (m, d) in enumerate([(67, 0.3), (72, 0.3), (76, 0.3), (79, 1.2)]): add(music, mx(brass(mtof(m), d + 0.3), brass(mtof(m - 12), d + 0.3)), 96.3 + sum(x[1] for x in [(67, 0.3), (72, 0.3), (76, 0.3), (79, 1.2)][:i]), 0.35)
add(music, strings(mtof(55), 2.4, 0.2, 0.3, 1500), 99.2, 0.3); add(music, glide(mtof(79), mtof(60), 2.2) * adsr(2.2, 0.1, 0.2) * 0.1, 99.2, 0.8)
for m in [48, 55, 60, 64, 67, 72]: add(music, brass(mtof(m), 1.4), 101.42, 0.25)
add(music, timp(mtof(36), 1.8), 101.42, 1.0)
# 103.3 - 116.9 home: the theme returns, warm and full
pad_prog(music, [(60, 'maj'), (65, 'maj'), (57, 'min'), (67, 'maj'), (60, 'maj'), (65, 'maj'), (67, 'sus'), (67, 'maj'), (60, 'add9'), (60, 'maj')], 103.4, 1.36, 0.32, 2200)
bass_line(music, [60, 65, 57, 67, 60, 65, 67, 67, 60, 60], 103.4, 1.36, 0.35, (0, 2))
t_end = play_melody(music, THEME, 104.0, 0.46, musicbox, 0.5, 0, -0.2)
play_melody(music, THEME, 110.2, 0.46, celesta, 0.3, 12, 0.3, until=116.8)
for m in [60, 64, 67, 72]: add(music, strings(mtof(m), 4.0, 1.0, 1.5, 2400), 110.45, 0.3)
# 116.9 - 121.5 the end: final cadence and chime
for m in [48, 55, 60, 64, 67, 72, 76]: add(music, pad([mtof(m)], 4.4, 0.3, 2.2, 2600), 117.25, 0.35)
add(music, chime([1047, 1319, 1568, 2093, 2637], 0.12, 2.5), 117.3, 0.5)
music[int(120.3 * SR):] *= np.linspace(1, 0, N - int(120.3 * SR))[:, None]

# ---------------- room + write ----------------
irl = int(1.1 * SR); ir = rng.standard_normal((irl, 2)) * np.exp(-4.5 * np.arange(irl) / SR)[:, None]
def conv(x, h):
    n = len(x) + len(h); F = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, F) * np.fft.rfft(h, F), F)[:len(x)]
def verb(bus, amt):
    wet = np.stack([conv(bus[:, c], ir[:, c]) for c in range(2)], 1)
    return bus + wet * (amt * np.abs(bus).max() / (np.abs(wet).max() + 1e-9))
music = verb(music, 0.35); sfx = verb(sfx, 0.12)
def write(name, x, peak):
    x = x / (np.abs(x).max() + 1e-9) * peak
    w = wave.open(name, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes()); w.close()
write('music.wav', music, 0.7); write('sfx.wav', sfx, 0.9)
print('ok')
