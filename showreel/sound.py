import numpy as np, wave
SR = 48000; DUR = 15.0; N = int(SR * DUR)
rng = np.random.default_rng(3)
sfx = np.zeros((N, 2)); mus = np.zeros((N, 2))

def T(d): return np.arange(int(d * SR)) / SR
def add(bus, sig, t, g=1.0, pan=0.0):
    i = int(t * SR); sig = sig[: max(0, N - i)]
    L, R = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    bus[i:i + len(sig), 0] += sig * g * L * 1.414; bus[i:i + len(sig), 1] += sig * g * R * 1.414
def sweep(f0, f1, d, curve=4):
    t = T(d); f = f1 + (f0 - f1) * np.exp(-curve * t / d)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)
def lp(x, fc):  # one-pole lowpass, fc may be array
    fc = np.broadcast_to(fc, x.shape); a = 1 - np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); s = 0.0
    for i in range(len(x)): s += a[i] * (x[i] - s); y[i] = s
    return y
def env(d, a=0.002, dec=8):
    t = T(d); return np.minimum(1, t / a) * np.exp(-dec * t)

def thump(f0=120, f1=45, d=0.35, dec=9): return sweep(f0, f1, d) * env(d, dec=dec) + rng.standard_normal(int(d*SR)) * env(d, dec=180) * 0.3
def tick(f=3200, d=0.03): return np.sin(2*np.pi*f*T(d)) * env(d, 0.0005, 160)
def pop(): return sweep(500, 1400, 0.09, -3) * env(0.09, 0.001, 40)
def whoosh(d, up=True, f0=300, f1=6000):
    t = T(d); u = t / d; shape = np.sin(np.pi * (u if up else 1-u) ** (1.6 if up else 0.6) ) if False else (u**2 if up else (1-u)**2)
    fc = f0 + (f1 - f0) * (u if up else 1 - u) ** 2
    x = lp(rng.standard_normal(len(t)), fc)
    e = np.sin(np.pi * np.clip(u, 0, 1)) ** 1.5 if not up else (u ** 2.2) * (1 - np.clip((u - 0.97) / 0.03, 0, 1))
    return x * e * 3
def mx(*xs):
    n = max(len(x) for x in xs); o = np.zeros(n)
    for x in xs: o[:len(x)] += x
    return o
def slam(): return mx(thump(160, 50, 0.5, 7), lp(rng.standard_normal(int(.25*SR)), 2500) * env(.25, .001, 22) * 2.5)
def boom(): return mx(thump(90, 28, 1.4, 3.2) * 1.2, lp(rng.standard_normal(int(1.2*SR)), 900) * env(1.2, .002, 5) * 3)
def shing(f=620, d=1.8):
    t = T(d); out = np.zeros(len(t))
    for k, (r, a, dc) in enumerate([(1, 1, 2.5), (2.76, .6, 3.5), (5.4, .4, 5), (8.93, .25, 7), (13.3, .15, 9)]):
        out += a * np.sin(2*np.pi*f*r*t + k) * np.exp(-dc*t)
    return out * np.minimum(1, t/0.004) * 0.5
def chime(f=1320): return shing(f, 1.2) * 0.8
def blip(f): return np.sin(2*np.pi*f*T(.06)) * env(.06, .001, 60)

# ---- scene 1: bounce ----
for t, g in [(0.45, 1.0), (0.95, 0.7), (1.2, 0.5)]: add(sfx, thump(), t, g)
add(sfx, whoosh(0.42, True, 200, 5000), 1.2, 0.35)
for i in range(8): add(sfx, tick(2400 + i * 90), 1.47 + i * 0.035, 0.35, -0.6 + i * 0.17)
for i in range(0, 42, 2): add(sfx, tick(4200, 0.015), 1.55 + i / 70, 0.12, 0.2)
add(sfx, whoosh(0.3, False, 400, 5000), 1.93, 0.25)
# ---- scene 2: easing ----
for i, s in enumerate([0.2, 0.85, 1.5]):
    add(sfx, whoosh(0.18, True, 500, 7000), 2.2 + s - 0.14, 0.3, 0.5)
    add(sfx, slam(), 2.2 + s + 0.04, 0.85, 0.25)
    add(sfx, pop(), 2.2 + s + 0.28, 0.3, 0.5)
for i in range(17): add(sfx, tick(1800 + 60 * i, 0.02), 2.2 + 0.6 + i * 0.025, 0.18, -0.7)
for i in range(9): add(sfx, whoosh(0.35, True, 300, 4000), 2.2 + 2.28 + i * 0.02, 0.1, (-1) ** i * 0.6)
# ---- scene 3: morph ----
add(sfx, pop(), 5.0, 0.6)
for a, b, *_ in [[0.45, 0.8], [0.95, 1.3], [1.45, 1.8], [1.9, 2.15]]:
    add(sfx, whoosh(b - a, False, 600, 3500), 5.0 + a, 0.35, 0.3)
    add(sfx, blip(880), 5.0 + b - 0.02, 0.25)
add(sfx, whoosh(0.4, True, 100, 9000), 7.2, 0.6)
add(sfx, boom(), 7.6, 0.9)
# ---- scene 4: chrome ----
add(sfx, shing(620), 7.72, 0.55, -0.3); add(sfx, shing(931), 7.85, 0.35, 0.4)
add(sfx, whoosh(0.5, False, 200, 2500), 8.8, 0.25, 0.2)
add(sfx, shing(1240, 1.0), 9.2, 0.18, 0.6)
add(sfx, whoosh(0.4, True, 3000, 200), 9.65, 0.45)
add(sfx, blip(1760), 10.05, 0.4)
# ---- scene 5: particles ----
for k in range(140):
    t = 10.25 + rng.random() * 0.95; add(sfx, tick(3000 + rng.random() * 5000, 0.012), t, 0.06 + 0.06 * rng.random(), rng.random() * 2 - 1)
for k in range(60):
    t = 11.45 + (k / 60) * 0.65 + rng.random() * 0.03; add(sfx, tick(2000 + 50 * k, 0.012), t, 0.08, -0.9 + 1.8 * k / 60)
add(sfx, whoosh(0.45, True, 150, 8000), 12.35, 0.55)
# ---- scene 6: outro ----
add(sfx, slam(), 12.8, 0.9)
for i in range(6): add(sfx, tick(2000 + 100 * i), 12.82 + i * 0.05, 0.3, -0.5 + i * 0.2)
add(sfx, chime(1320), 13.75, 0.35, 0.3)
add(sfx, whoosh(0.47, False, 300, 7000), 14.35, 0.45)
add(sfx, pop(), 14.82, 0.5)
add(sfx, whoosh(0.18, True, 800, 9000), 14.82, 0.25)

# ---- music bed: 120 bpm pulse + pad, key of A minor ----
beat = 0.5
for b in range(30):
    t = b * beat
    if t < 1.2: continue
    add(mus, thump(70, 40, 0.3, 11), t, 0.45)
    if b % 2 == 1 or t > 5: add(mus, lp(rng.standard_normal(int(.05*SR)), 9000) * env(.05, .0005, 90), t + 0.25, 0.12, 0.3)
chords = [(0, 2.2, [220, 261.6, 329.6]), (2.2, 5.0, [174.6, 220, 261.6]), (5.0, 7.6, [261.6, 329.6, 392]),
          (7.6, 10.2, [196, 246.9, 293.7]), (10.2, 12.8, [220, 261.6, 329.6]), (12.8, 15.0, [174.6, 220, 261.6, 329.6])]
for a, b, fs in chords:
    t = T(b - a); u = t / (b - a); e = np.minimum(1, t / 0.08) * np.minimum(1, (b - a - t) / 0.1)
    sig = sum(np.sin(2*np.pi*f*t) + 0.5*np.sin(2*np.pi*f*1.003*t) + 0.25*np.sin(2*np.pi*f*2*t) for f in fs) / len(fs)
    sig *= e * (0.6 + 0.4 * np.sin(2 * np.pi * 4 * t) ** 2)  # 8th-note gate
    add(mus, sig, a, 0.07, -0.2); add(mus, np.roll(sig, 700), a, 0.07, 0.2)
mus[int(14.85*SR):] *= np.linspace(1, 0, N - int(14.85*SR))[:, None]

# ---- reverb on sfx, mix, master ----
irl = int(0.9 * SR); ir = rng.standard_normal((irl, 2)) * np.exp(-6 * np.arange(irl) / SR)[:, None]
def conv(x, h):
    n = len(x) + len(h); F = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, F) * np.fft.rfft(h, F), F)[:len(x)]
wet = np.stack([conv(sfx[:, c], ir[:, c]) for c in range(2)], 1)
wet *= 0.2 * np.abs(sfx).max() / (np.abs(wet).max() + 1e-9)
mix = sfx + wet + mus
mix = np.tanh(mix / np.abs(mix).max() * 1.6) / np.tanh(1.6) * 0.89
w = wave.open('reel_audio.wav', 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((mix * 32767).astype('<i2').tobytes()); w.close()
print('peak', np.abs(mix).max(), 'rms dB', 20*np.log10(np.sqrt((mix**2).mean())))
