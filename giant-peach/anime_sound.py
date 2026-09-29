"""9-second sound design for the anime test: wind, swell, heartbeat on the shock, impact, final chord."""
import numpy as np, wave
from scipy.signal import butter, lfilter
SR = 48000; D = 9.0; N = int(SR * D); rng = np.random.default_rng(4)
out = np.zeros((N, 2))
def T(d): return np.arange(int(d * SR)) / SR
def filt(x, k, f): b, a = butter(2, np.array(f) / (SR / 2), k); return lfilter(b, a, x)
def env(d, a=0.003, dec=5): t = T(d); return np.minimum(1, t / a) * np.exp(-dec * t)
def adsr(d, a, r): t = T(d); return np.minimum(1, t / a) * np.minimum(1, np.maximum(0, (d - t) / r))
def add(x, t0, g=1, pan=0):
    i = int(t0 * SR); x = x[:N - i]; L, R = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414
    out[i:i + len(x), 0] += x * g * L; out[i:i + len(x), 1] += x * g * R
def mtof(m): return 440 * 2 ** ((m - 69) / 12)
def pad(ms, d, a=0.8, r=1.0):
    t = T(d); x = sum(np.sin(2 * np.pi * mtof(m) * k * t * (1 + dt)) / k for m in ms for k in (1, 2, 3) for dt in (-0.003, 0.003))
    return filt(x, 'lowpass', 2400) * adsr(d, a, r) / (len(ms) * 3)
def boom(f0=80, d=1.6): t = T(d); f = 30 + (f0 - 30) * np.exp(-4 * t); return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, 0.002, 2.5) + filt(rng.standard_normal(len(t)), 'lowpass', 500) * env(d, 0.001, 12) * 0.6
def shing(): t = T(1.4); return sum(np.sin(2 * np.pi * f * t) * np.exp(-dk * t) * g for f, dk, g in [(1760, 3, 1), (2637, 4, 0.6), (3520, 6, 0.4), (5274, 9, 0.2)]) * 0.35
def heartbeat(): return boom(60, 0.35) * 0.9
# wind + rising swell over the wide shot
t = T(2.7); add(filt(rng.standard_normal(len(t)), 'bandpass', [200, 1500]) * adsr(2.7, 0.8, 0.4) * 0.25, 0.0)
add(pad([57, 64, 69, 73], 2.8, 1.2, 0.3), 0.0, 0.8)
t = T(2.4); add(np.sin(2 * np.pi * np.cumsum(200 * 2 ** (t / 2.4 * 1.5)) / SR) * adsr(2.4, 0.5, 0.1) * 0.08, 0.3)
# close-up: silence, then the heartbeat and a sting on the shock
add(heartbeat(), 3.2, 0.9); add(heartbeat(), 3.45, 0.7)
add(shing(), 3.55, 0.6); add(filt(rng.standard_normal(int(0.4 * SR)), 'highpass', 3000) * adsr(0.4, 0.01, 0.35) * 0.4, 3.55)
t = T(1.0); add(np.sin(2 * np.pi * np.cumsum(300 * 2 ** (t * 2.5)) / SR) * adsr(1.0, 0.1, 0.05) * 0.12, 3.6)
# impact frame
add(boom(90, 2.0), 4.6, 1.2); add(filt(rng.standard_normal(int(0.25 * SR)), 'highpass', 1500) * env(0.25, 0.001, 12) * 0.8, 4.6)
add(pad([45, 52, 57, 61, 64], 2.0, 0.02, 0.6), 4.6, 1.0)
# hero pull-back: big warm chord
add(pad([57, 64, 69, 73, 76, 81], 2.6, 0.4, 1.2), 6.5, 1.1)
add(shing(), 6.7, 0.35, 0.4)
m = out / np.abs(out).max() * 0.89
m[int(8.5 * SR):] *= np.linspace(1, 0, N - int(8.5 * SR))[:, None]
w = wave.open('anime_audio.wav', 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((m * 32767).astype('<i2').tobytes()); w.close()
print('ok')
