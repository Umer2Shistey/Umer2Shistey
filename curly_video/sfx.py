"""Synthesize sound effects + music bed, and mix with the voiceover."""
import numpy as np, wave, subprocess, os

SR = 44100
rng = np.random.default_rng(7)
FF = open("ff.env").read().strip().split("=", 1)[1]


def env(n, a=0.005, r=0.2):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    e[:na] = np.linspace(0, 1, na)
    if nr: e[-nr:] *= np.linspace(1, 0, nr)
    return e


def lowpass(x, k):
    return np.convolve(x, np.ones(k) / k, mode="same")


def whoosh(d=0.6):
    n = int(d * SR); x = rng.standard_normal(n)
    out = np.zeros(n)
    for i, k in enumerate(np.linspace(60, 4, 8)):
        seg = slice(i * n // 8, (i + 1) * n // 8)
        out[seg] = lowpass(x, int(k))[seg]
    return out * np.sin(np.linspace(0, np.pi, n)) * 1.5


def boing(d=0.7):
    t = np.arange(int(d * SR)) / SR
    f = 180 + 120 * np.sin(2 * np.pi * 9 * t) * np.exp(-4 * t)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-4 * t) * 0.8


def scratch(d=0.5):
    t = np.arange(int(d * SR)) / SR
    f = 900 * np.exp(-5 * t) + 80
    s = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.3 + lowpass(rng.standard_normal(len(t)), 3) * 0.3
    return s * env(len(t), 0.005, 0.1)


def crickets(d=2.0):
    t = np.arange(int(d * SR)) / SR
    chirp = (np.sin(2 * np.pi * 30 * t) > 0.3) * (np.sin(2 * np.pi * 1.5 * t) > 0)
    return np.sin(2 * np.pi * 4400 * t) * chirp * 0.25 * env(len(t), 0.05, 0.3)


def click():
    n = int(0.05 * SR)
    return rng.standard_normal(n) * np.exp(-np.linspace(0, 12, n)) * 0.9


def fizz_boom(d=1.6):
    n = int(d * SR); x = rng.standard_normal(n)
    boom = np.sin(2 * np.pi * np.cumsum(np.linspace(90, 30, n)) / SR) * np.exp(-np.linspace(0, 5, n))
    hiss = (x - lowpass(x, 8)) * np.exp(-np.linspace(0, 3, n)) * 0.7
    return boom * 0.9 + hiss


def chomp():
    parts = []
    for _ in range(3):
        n = int(0.09 * SR)
        parts.append(lowpass(rng.standard_normal(n), 6) * np.exp(-np.linspace(0, 6, n)) * 1.5)
        parts.append(np.zeros(int(0.07 * SR)))
    return np.concatenate(parts)


def ding():
    t = np.arange(int(0.9 * SR)) / SR
    return (np.sin(2 * np.pi * 1320 * t) + 0.5 * np.sin(2 * np.pi * 2640 * t)) * np.exp(-5 * t) * 0.4


def crowd(d=3.0):
    n = int(d * SR); x = rng.standard_normal(n)
    c = lowpass(x, 12) - lowpass(x, 60)
    return c * np.sin(np.linspace(0, np.pi, n)) ** 0.5 * 2.5


def airhorn(d=0.8):
    t = np.arange(int(d * SR)) / SR
    s = sum(np.sign(np.sin(2 * np.pi * f * t)) for f in (440, 554, 659)) / 3
    return lowpass(s, 4) * env(len(t), 0.01, 0.1) * 0.35


def pluck(freq, d):
    n = int(d * SR); p = int(SR / freq)
    buf = rng.uniform(-1, 1, p); out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = 0.5 * (buf[i % p] + buf[(i + 1) % p]) * 0.996
    return out


def tarantella(total):
    # A-minor tarantella-ish mandolin loop in 6/8, tremolo-free but bouncy
    note = {"A4": 440, "B4": 494, "C5": 523, "D5": 587, "E5": 659, "F5": 698, "G#4": 415, "E4": 330, "A3": 220, "E3": 165, "D4": 294, "G4": 392}
    mel = ("E5 E5 E5 C5 D5 E5 F5 E5 D5 C5 B4 A4 D5 D5 D5 B4 C5 D5 E5 D5 C5 B4 A4 G#4 "
           "E5 E5 E5 C5 D5 E5 F5 E5 D5 C5 B4 A4 B4 C5 D5 C5 B4 G#4 A4 A4 A4 A4 E4 A4").split()
    bass = "A3 E3 A3 E3 E3 E3 E3 E3 A3 E3 A3 E3 E3 E3 A3 A3".split()
    step = 0.14
    cache = {}
    loop = np.zeros(int(len(mel) * step * SR) + SR)
    for i, m in enumerate(mel):
        if m not in cache: cache[m] = pluck(note[m], 0.4)
        s = int(i * step * SR); loop[s:s + len(cache[m])] += cache[m] * 0.5
    for i, b in enumerate(bass):
        if b not in cache: cache[b] = pluck(note[b], 0.6)
        s = int(i * 3 * step * SR); loop[s:s + len(cache[b])] += cache[b] * 0.5
    loop = loop[: int(len(mel) * step * SR)]
    reps = int(np.ceil(total * SR / len(loop)))
    return np.tile(loop, reps)[: int(total * SR)]


def load_vo(path):
    raw = subprocess.run([FF, "-v", "quiet", "-i", path, "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float64) / 32768


if __name__ == "__main__":
    from timeline import VO_OFFSET, TOTAL, SFX
    mix = np.zeros(int(TOTAL * SR) + SR)
    vo = load_vo("audio/vo.mp3")
    s = int(VO_OFFSET * SR); mix[s:s + len(vo)] += vo * 1.0
    music = tarantella(TOTAL) * 0.09
    # duck the music a bit, swell on title and ending
    t = np.arange(len(music)) / SR
    gain = np.where((t < VO_OFFSET) | (t > TOTAL - 4.5), 2.2, 1.0)
    mix[: len(music)] += music * lowpass(gain, 2000)
    fx = {"whoosh": whoosh, "boing": boing, "scratch": scratch, "crickets": crickets, "click": click,
          "boom": fizz_boom, "chomp": chomp, "ding": ding, "crowd": crowd, "airhorn": airhorn}
    for at, name, vol in SFX:
        clip = fx[name]() * vol
        s = int(at * SR); mix[s:s + len(clip)] += clip[: len(mix) - s]
    mix = mix[: int(TOTAL * SR)]
    mix = mix / max(1.0, np.abs(mix).max() / 0.95)
    with wave.open("audio/mix.wav", "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((mix * 32767).astype(np.int16).tobytes())
    print("mix written", len(mix) / SR, "s")
