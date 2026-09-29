"""Sound design for the little labs promo.

Writes two 48 kHz stereo stems next to this file:
  music.wav  - 120 BPM bed (ducked under the voiceover at mix time)
  sfx.wav    - effects timed to the animation in index.html
Every sound is synthesized here, so there is nothing to license.
"""
import numpy as np, wave
from scipy.signal import butter, lfilter

SR = 48000
DUR = 25.5
N = int(SR * DUR)
rng = np.random.default_rng(7)
music = np.zeros((N, 2))
sfx = np.zeros((N, 2))


def T(d): return np.arange(int(d * SR)) / SR
def env(d, a=0.002, dec=8.0): t = T(d); return np.minimum(1, t / a) * np.exp(-dec * t)
def noise(d): return rng.standard_normal(int(d * SR))
def filt(x, kind, f):
    b, a = butter(2, np.array(f) / (SR / 2), kind)
    return lfilter(b, a, x)
def sweep(f0, f1, d, curve=5.0):
    t = T(d); f = f1 + (f0 - f1) * np.exp(-curve * t / d)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)
def mx(*xs):
    n = max(len(x) for x in xs); o = np.zeros(n)
    for x in xs: o[:len(x)] += x
    return o
def add(bus, sig, t, g=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N: return
    sig = sig[:N - i]
    L, R = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414
    bus[i:i + len(sig), 0] += sig * g * L
    bus[i:i + len(sig), 1] += sig * g * R

# ---------- effect palette ----------
def pop(pitch=1.0): return sweep(380 * pitch, 1100 * pitch, 0.08, -2.5) * env(0.08, 0.001, 45)
def bubble(pitch=1.0): return sweep(600 * pitch, 1600 * pitch, 0.12, -3) * env(0.12, 0.002, 30) * 0.8
def tick(f=3500, d=0.025): return np.sin(2 * np.pi * f * T(d)) * env(d, 0.0005, 180)
def key_click(): return filt(noise(0.03), 'bandpass', [1800, 6000]) * env(0.03, 0.0005, 160) * 0.9
def mouse_click(): return mx(tick(2600, 0.02), filt(noise(0.02), 'highpass', 3000) * env(0.02, 0.0003, 250) * 0.6)
def whoosh(d, up=True, lo=300, hi=6000):
    x = noise(d); t = T(d); u = t / d
    shape = (np.sin(np.pi * u) ** 2) if not up else (u ** 1.8) * np.minimum(1, (1 - u) / 0.08)
    band = filt(x, 'bandpass', [lo, hi])
    return band * shape * 1.2
def slam():
    return mx(sweep(170, 48, 0.45, 6) * env(0.45, 0.001, 7), filt(noise(0.22), 'lowpass', 3000) * env(0.22, 0.001, 20) * 1.6)
def boing(f=220):
    t = T(0.45); f_t = f * (1 + 0.5 * np.exp(-9 * t)) * (1 + 0.06 * np.sin(2 * np.pi * 14 * t))
    return np.sin(2 * np.pi * np.cumsum(f_t) / SR) * env(0.45, 0.003, 6) * 0.8
def bell(f, d=1.4, g=1.0):
    t = T(d); out = np.zeros(len(t))
    for r, a, dc in [(1, 1, 3), (2.0, .5, 4), (3.01, .3, 6), (4.2, .15, 8), (5.4, .08, 10)]:
        out += a * np.sin(2 * np.pi * f * r * t) * np.exp(-dc * t)
    return out * np.minimum(1, t / 0.002) * 0.45 * g
def ding(): return mx(bell(1568, 1.6), bell(2093, 1.2, 0.5))
def buzz(d=0.14): t = T(d); return np.sign(np.sin(2 * np.pi * 120 * t)) * filt(noise(d), 'bandpass', [200, 1500]) * 0.25 * (np.sin(2 * np.pi * 30 * t) > 0)
def scribble(d):
    t = T(d); am = 0.5 + 0.5 * np.sin(2 * np.pi * 9 * t + 3 * np.sin(2 * np.pi * 2.3 * t))
    return filt(noise(d), 'bandpass', [2500, 7000]) * am * np.minimum(1, t / 0.02) * np.minimum(1, (d - t) / 0.03) * 0.6
def pencil(): return filt(noise(0.05), 'bandpass', [3000, 8000]) * env(0.05, 0.004, 50) * 0.7
def zip_(d=0.25, up=True):
    return sweep(500 if up else 2500, 2500 if up else 500, d, 1.5) * env(d, 0.005, 5) * 0.35 + filt(noise(d), 'bandpass', [2000, 6000]) * 0.15 * env(d, 0.005, 5)
def thud(): return mx(sweep(120, 40, 0.4, 5) * env(0.4, 0.001, 9) * 1.3, filt(noise(0.12), 'lowpass', 1200) * env(0.12, 0.001, 35))
def stamp(): return mx(thud() * 1.3, filt(noise(0.08), 'bandpass', [800, 4000]) * env(0.08, 0.0005, 60) * 1.2)
def swish(d=0.3): return whoosh(d, False, 1500, 9000) * 0.8
def page_turn(): return mx(filt(noise(0.35), 'bandpass', [800, 7000]) * np.sin(np.pi * T(0.35) / 0.35) ** 3 * 1.0, filt(noise(0.05), 'highpass', 2000) * env(0.05, 0.001, 60) * 0.5)
def shimmer(d, f0=900, f1=2600):
    out = np.zeros(int(d * SR)); r = np.random.default_rng(3)
    for k in range(int(d * 28)):
        t0 = k / 28; f = f0 * (f1 / f0) ** (t0 / d) * (1 + r.random() * 0.08)
        s = bell(f, 0.35, 0.35); i = int(t0 * SR); out[i:i + len(s)] += s[:len(out) - i]
    return out
def sparkle_burst():
    out = np.zeros(int(1.0 * SR)); r = np.random.default_rng(9)
    for k in range(14):
        s = bell(2000 + r.random() * 3000, 0.4, 0.4); i = int(r.random() * 0.45 * SR); out[i:i + len(s)] += s[:len(out) - i]
    return out
def chime_up(notes=(523.25, 659.25, 783.99, 1046.5), step=0.07):
    out = np.zeros(int((len(notes) * step + 1.2) * SR))
    for k, f in enumerate(notes): s = bell(f, 1.1, 0.9); i = int(k * step * SR); out[i:i + len(s)] += s
    return out
def popper():
    crack = filt(noise(0.06), 'highpass', 1500) * env(0.06, 0.0003, 70) * 2.2
    crackle = np.zeros(int(0.9 * SR)); r = np.random.default_rng(4)
    for k in range(60):
        i = int((0.03 + r.random() ** 1.6 * 0.8) * SR); c = filt(noise(0.006), 'highpass', 4000) * env(0.006, 0.0002, 600) * (0.2 + r.random() * 0.4)
        crackle[i:i + len(c)] += c[:len(crackle) - i]
    return mx(crack, crackle, thud() * 0.8)
def riser(d, lo=200, hi=900):
    t = T(d); return (sweep(lo, hi, d, -2) * 0.3 + filt(noise(d), 'bandpass', [1000, 5000]) * 0.3) * (t / d) ** 2
def tock(f=1200): return np.sin(2 * np.pi * f * T(0.04)) * env(0.04, 0.0005, 120) * 0.6

# ---------- S1: hook ----------
add(sfx, pop(1.0), 0.11, 0.5)
add(sfx, slam(), 0.56, 1.0); add(sfx, whoosh(0.16, True, 800, 8000), 0.42, 0.35)
add(sfx, zip_(0.3), 0.85, 0.45, 0.3)
add(sfx, pop(1.2), 0.84, 0.4, -0.2)
add(sfx, whoosh(0.3, True, 400, 7000), 1.3, 0.35)
add(sfx, bubble(0.9), 1.5, 0.6)
for i in range(9): add(sfx, pop(1.1 + i * 0.05), 1.55 + i * 0.035, 0.22, -0.6 + i * 0.12)
for i in range(5): add(sfx, pop(0.8 + i * 0.05), 1.85 + i * 0.035, 0.3, -0.3 + i * 0.15)
for k in range(8): add(sfx, tock(1300 if k % 2 else 900), 1.6 + k * 0.125, 0.4)
add(sfx, whoosh(0.3, True, 300, 5000), 2.5, 0.4, -0.5)
add(sfx, scribble(0.55), 2.68, 0.55)
add(sfx, pop(1.4), 2.83, 0.45)
add(sfx, bubble(0.7), 3.13, 0.5, 0.3)
add(sfx, whoosh(0.45, True, 150, 6000), 3.42, 0.6)
# ---------- S2: the trick ----------
add(sfx, riser(0.4, 300, 700) * 0.7, 3.87, 0.5)
add(sfx, buzz(0.14), 4.29, 0.45); add(sfx, ding(), 4.29, 0.7)
add(sfx, whoosh(0.3, False, 600, 6000), 4.95, 0.35)
add(sfx, whoosh(0.35, True, 200, 3000), 5.1, 0.45); add(sfx, thud(), 5.47, 0.7)
for i, f in enumerate([523.25, 659.25, 783.99, 1046.5]): add(sfx, mx(bubble(f / 700), bell(f, 0.5, 0.5)), 5.55 + i * 0.09, 0.45, [-0.6, 0.6, -0.6, 0.6][i])
add(sfx, boing(200), 6.2, 0.55, -0.7); add(sfx, boing(300), 6.33, 0.5, 0.7)
add(sfx, whoosh(0.34, True, 300, 8000), 6.78, 0.55, 0.6)
# ---------- S3: step one ----------
add(sfx, slam(), 7.29, 0.9); add(sfx, whoosh(0.3, False, 800, 7000), 7.9, 0.35); add(sfx, pop(1.5), 8.22, 0.45)
add(sfx, whoosh(0.45, True, 150, 4000), 8.02, 0.45)
url = 'canva.com/templates'
for i in range(len(url)): add(sfx, key_click(), 8.25 + i / 40, 0.28, 0.2)
add(sfx, pop(1.1), 9.07, 0.5)
q = "children's book template"
for i in range(len(q)): add(sfx, key_click(), 9.18 + i * 1.2 / len(q), 0.33, -0.1 + (i % 3) * 0.1)
add(sfx, chime_up((783.99, 1046.5), 0.08) * 0.8, 9.85, 0.45)
add(sfx, mouse_click(), 10.42, 0.8, 0.4)
add(sfx, whoosh(0.4, True, 200, 7000), 10.68, 0.5)
# ---------- S4: step two ----------
add(sfx, slam(), 11.27, 0.9); add(sfx, whoosh(0.3, False, 800, 7000), 11.9, 0.35); add(sfx, pop(1.6), 12.2, 0.45)
add(sfx, swish(0.25), 12.25, 0.6, -0.3); add(sfx, swish(0.3), 12.5, 0.6, 0.3)
add(sfx, stamp(), 12.8, 1.0, 0.3)
add(sfx, zip_(0.3), 13.0, 0.3)
add(sfx, page_turn(), 13.62, 0.7, 0.3)
for a, b, s in [(13.95, 14.35, 'Where Is Cami?'), (14.4, 14.85, 'Cami is a chameleon.'), (14.85, 15.3, 'She can change color'), (15.3, 15.75, 'to hide in the leaves!')]:
    for i in range(0, len(s), 2): add(sfx, pencil(), a + (b - a) * i / len(s), 0.35, 0.4)
add(sfx, bubble(1.0), 14.79, 0.55, 0.4)
add(sfx, shimmer(0.65, 700, 2000), 15.45, 0.4, 0.3)
add(sfx, boing(420), 16.05, 0.35, 0.5)
add(sfx, sparkle_burst(), 16.42, 0.6); add(sfx, pop(1.3), 16.52, 0.45)
add(sfx, page_turn(), 17.0, 0.9)
# ---------- S5: step three ----------
add(sfx, slam(), 17.57, 0.9); add(sfx, whoosh(0.3, False, 800, 7000), 18.2, 0.35); add(sfx, pop(1.7), 18.5, 0.45)
add(sfx, whoosh(0.4, True, 150, 4000), 18.4, 0.45)
add(sfx, zip_(0.3), 18.9, 0.35, 0.2)
add(sfx, pop(1.2), 19.3, 0.5, 0.5); add(sfx, zip_(0.25, False), 19.4, 0.25, 0.4)
add(sfx, mouse_click(), 19.5, 0.8, 0.1)
add(sfx, whoosh(0.3, True, 300, 7000), 19.55, 0.45, -0.5)
t = 'Where Is Cami?'
for i in range(len(t)): add(sfx, key_click(), 19.85 + i * 0.45 / len(t), 0.3)
add(sfx, whoosh(0.35, True, 300, 5000), 19.95, 0.3, -0.6); add(sfx, bubble(0.6), 20.3, 0.55)
add(sfx, mouse_click(), 20.65, 0.8); add(sfx, chime_up(), 20.72, 0.6)
add(sfx, whoosh(0.3, False, 300, 5000), 21.0, 0.35)
add(sfx, bubble(0.8), 21.12, 0.55)
add(sfx, riser(0.7, 250, 1000), 21.12, 0.55)
for k in range(10): add(sfx, tock(1500 if k % 2 else 1100), 21.15 + k * 0.066, 0.3)
add(sfx, popper(), 21.82, 0.95); add(sfx, slam(), 21.82, 0.6)
add(sfx, chime_up((1046.5, 1318.5, 1568.0, 2093.0), 0.05), 21.85, 0.4)
add(sfx, boing(240), 22.42, 0.5, -0.7); add(sfx, boing(330), 22.52, 0.45, 0.7)
add(sfx, whoosh(0.3, True, 200, 7000), 22.78, 0.55)
# ---------- S6: end card ----------
add(sfx, mx(bubble(0.7), bell(523.25, 1.5, 0.8)), 23.12, 0.6)
add(sfx, boing(260), 23.35, 0.3, -0.5); add(sfx, boing(350), 23.45, 0.3, 0.5)
add(sfx, pop(1.0), 23.55, 0.35); add(sfx, pop(1.15), 23.7, 0.35)
add(sfx, pop(1.3), 23.9, 0.45); add(sfx, sparkle_burst(), 23.95, 0.35)
add(sfx, pop(1.5), 24.15, 0.4, 0.5)

# ---------- music: 120 BPM, C - G - Am - F ----------
BEAT = 0.5
def kick(): return sweep(140, 45, 0.3, 7) * env(0.3, 0.001, 12)
def clap():
    x = np.zeros(int(0.2 * SR))
    for k, o in enumerate([0, 0.01, 0.02]):
        b = filt(noise(0.15), 'bandpass', [900, 3500]) * env(0.15, 0.0005, 30 if k == 2 else 150); i = int(o * SR); x[i:i + len(b)] += b[:len(x) - i]
    return x * 0.6
def shaker(): return filt(noise(0.05), 'highpass', 6000) * env(0.05, 0.004, 70) * 0.5
def mallet(f, d=0.5):
    t = T(d); return (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * f * 4.0 * t) * np.exp(-30 * t)) * env(d, 0.002, 7)
def bass(f, d=0.45):
    t = T(d); return (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t)) * np.minimum(1, t / 0.005) * np.exp(-4 * t)
CHORDS = {'C': (130.81, [261.63, 329.63, 392.0]), 'G': (98.0, [246.94, 293.66, 392.0]), 'Am': (110.0, [261.63, 329.63, 440.0]), 'F': (87.31, [261.63, 349.23, 440.0])}
PROG = ['C', 'G', 'Am', 'F']
# sections: (start, end, level) - drop out under "Here's the trick"
def bar_chord(tb): return PROG[int(tb // 2.0) % 4]
patt = [0, 2, 1, 2, 0, 1, 2, 1]  # mallet arpeggio index per 8th
for k in range(int(DUR / (BEAT / 2))):
    tb = k * BEAT / 2
    if tb > 23.1: break
    breakdown = 3.85 <= tb < 5.0
    root, notes = CHORDS[bar_chord(tb)]
    eighth = k % 8
    if not breakdown and tb >= 0.5:
        if eighth in (0, 4): add(music, kick(), tb, 0.8)
        if eighth in (2, 6) and tb >= 1.5: add(music, clap(), tb, 0.45, 0.1)
        add(music, shaker(), tb + 0.125, 0.25 if k % 2 else 0.15, 0.4)
        if eighth in (0, 3, 4, 6): add(music, bass(root), tb, 0.55)
    if tb >= 0.0:
        f = notes[patt[eighth]] * (2 if eighth in (3, 7) else 1)
        add(music, mallet(f), tb, 0.22 if not breakdown else 0.12, -0.4 if k % 2 else 0.4)
# build back in before "Make STEM books"
add(music, riser(1.0, 200, 800) * 0.8, 4.1, 0.5)
for k in range(8): add(music, clap(), 4.6 + k * 0.0625, 0.12 + k * 0.03)
# final hit and ring-out
root, notes = CHORDS['C']
for f in notes + [523.25]: add(music, mallet(f, 2.0) * 0.8, 23.1, 0.3)
add(music, bass(65.41, 2.0), 23.1, 0.7); add(music, kick(), 23.1, 0.9)
for k in range(8): add(music, mallet([523.25, 659.25, 783.99, 1046.5][k % 4], 0.6), 23.6 + k * 0.125, 0.12 - k * 0.01, (-1) ** k * 0.5)
music[int(24.6 * SR):] *= np.linspace(1, 0, N - int(24.6 * SR))[:, None] ** 2

# ---------- small room on the effects ----------
irl = int(0.7 * SR); ir = rng.standard_normal((irl, 2)) * np.exp(-7 * np.arange(irl) / SR)[:, None]
def conv(x, h):
    n = len(x) + len(h); F = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, F) * np.fft.rfft(h, F), F)[:len(x)]
wet = np.stack([conv(sfx[:, c], ir[:, c]) for c in range(2)], 1)
sfx = sfx + wet * (0.15 * np.abs(sfx).max() / (np.abs(wet).max() + 1e-9))

def write(name, x, peak):
    x = x / (np.abs(x).max() + 1e-9) * peak
    w = wave.open(name, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes()); w.close()
write('music.wav', music, 0.7)
write('sfx.wav', sfx, 0.9)
print('ok')
