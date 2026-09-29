// Cut-paper storybook engine: math, paper shading, camera, and the cast.
(() => {
  const W = 1920, H = 1080;
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');

  const C = {
    cream: '#FBF1DD', paper: '#F4E6C8', ink: '#2B1E16', inkSoft: '#4A382B',
    peach1: '#FFC08A', peach2: '#F7894F', peach3: '#E0573E', blush: '#EE5A5E', leaf: '#5E9B45', leafDark: '#3F7431', stem: '#6B4428',
    skin: '#F4C39C', skinShade: '#E3A77D', hair: '#6A3B22', sweater: '#3F72B8', sweaterDark: '#2F5790', shorts: '#8A5A36', sock: '#F5EFE3', shoe: '#3A2A20',
    grass1: '#9CC46A', grass2: '#7BAA52', grass3: '#5E8C42', grass4: '#46703A',
    sky1: '#FCE3C0', sky2: '#F8C9A0', sky3: '#A9D1E8',
    gloom1: '#9C98A8', gloom2: '#7D788C', gloom3: '#5E596E', gloom4: '#474257',
    night1: '#1C2546', night2: '#2A3765', night3: '#3B4C85', moon: '#FBEFC8',
    sea1: '#4AA3C9', sea2: '#2F7EAA', sea3: '#1E5C84', foam: '#EAF6F8',
    magic: '#8CFF6A', magicDeep: '#2FCB5A',
    spiker: '#6F6A8A', sponge: '#D9687A',
  };

  // ---------- math ----------
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const E = {
    outExpo: t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t),
    inExpo: t => t <= 0 ? 0 : Math.pow(2, 10 * t - 10),
    inOutExpo: t => t <= 0 ? 0 : t >= 1 ? 1 : t < .5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
    inOutCubic: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
    outCubic: t => 1 - Math.pow(1 - t, 3),
    inCubic: t => t * t * t,
    outBack: t => { if (t >= 1) return 1; const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
    inBack: t => { if (t >= 1) return 1; const c = 1.7; return (c + 1) * t * t * t - c * t * t; },
    outElastic: t => t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1,
    outBounce: t => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375; return n * (t -= 2.625 / d) * t + .984375; },
  };
  const pop = (t, t0, d = 0.45) => E.outBack(prog(t, t0, t0 + d));
  function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  // smooth 1D value noise
  const NZ = (() => { const r = rng(99), a = []; for (let i = 0; i < 512; i++) a.push(r() * 2 - 1); return a; })();
  function nz(x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(NZ[i & 511], NZ[(i + 1) & 511], u); }
  // hand-made "boil": steps 8 times a second
  const boil = (t, seed, amp = 1.2) => nz(seed * 13.7 + Math.floor(t * 8) * 3.1) * amp;
  function mix(c1, c2, t) {
    const a = hex(c1), b = hex(c2);
    return `rgb(${Math.round(lerp(a[0], b[0], t))},${Math.round(lerp(a[1], b[1], t))},${Math.round(lerp(a[2], b[2], t))})`;
  }
  function hex(c) {
    if (c.startsWith('rgb')) return c.match(/\d+/g).map(Number);
    const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255];
  }

  // ---------- drawing primitives ----------
  const FONT_SERIF = '"Fraunces Local", Georgia, serif';
  const FONT_ROUND = '"Fredoka Local", "Arial Rounded MT Bold", sans-serif';
  function withT(x, y, s, r, fn) { ctx.save(); ctx.translate(x, y); if (r) ctx.rotate(r); if (s !== 1) { if (Array.isArray(s)) ctx.scale(s[0], s[1]); else ctx.scale(s, s); } fn(); ctx.restore(); }
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  function ell(x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, Math.PI * 2); }
  function circ(x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0.01, r), 0, Math.PI * 2); }
  function poly(pts, close = true) { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); if (close) ctx.closePath(); }
  function smoothPoly(pts) { // closed Catmull-Rom through points
    const n = pts.length; ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      if (i === 0) ctx.moveTo(p1[0], p1[1]);
      ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
    }
    ctx.closePath();
  }
  // Paper layer: soft cast shadow, flat fill, faint lit edge.
  function paper(fill, depth = 1, edge = true) {
    ctx.save();
    ctx.shadowColor = 'rgba(52,28,12,0.30)'; ctx.shadowBlur = 9 * depth; ctx.shadowOffsetX = 2.5 * depth; ctx.shadowOffsetY = 5 * depth;
    ctx.fillStyle = fill; ctx.fill();
    ctx.restore();
    if (edge) { ctx.save(); ctx.strokeStyle = 'rgba(255,248,235,0.22)'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.restore(); }
  }
  function flat(fill) { ctx.fillStyle = fill; ctx.fill(); }
  function line(pts, col, w, cap = 'round') { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = cap; ctx.lineJoin = 'round'; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); }
  function txt(str, x, y, px, col, font = FONT_SERIF, w = 700, align = 'center', italic = false) {
    ctx.font = `${italic ? 'italic ' : ''}${w} ${px}px ${font}`; ctx.fillStyle = col; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(str, x, y);
  }
  function linGrad(x0, y0, x1, y1, stops) { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }
  function radGrad(x, y, r0, r1, stops) { const g = ctx.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }
  function sky(stops) { ctx.fillStyle = linGrad(0, 0, 0, H, stops); ctx.fillRect(-10, -10, W + 20, H + 20); }

  // ---------- camera ----------
  // cam = {x, y, z}: world point at screen centre and zoom. Parallax p: 0 = fixed to screen, 1 = world.
  function layer(cam, p, fn) {
    ctx.save();
    const z = lerp(1, cam.z, p);
    ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-cam.x * p - (1 - p) * W / 2, -cam.y * p - (1 - p) * H / 2);
    fn(); ctx.restore();
  }
  // keyframed camera: keys = [[t, x, y, z, ease?], ...]
  function camAt(keys, t) {
    if (t <= keys[0][0]) return { x: keys[0][1], y: keys[0][2], z: keys[0][3] };
    for (let i = 1; i < keys.length; i++) {
      const [t1, x1, y1, z1, ez] = keys[i];
      if (t <= t1) { const [t0, x0, y0, z0] = keys[i - 1]; const e = (ez || E.inOutCubic)(prog(t, t0, t1)); return { x: lerp(x0, x1, e), y: lerp(y0, y1, e), z: lerp(z0, z1, e) }; }
    }
    const k = keys[keys.length - 1]; return { x: k[1], y: k[2], z: k[3] };
  }

  // ---------- scenery ----------
  function hill(y0, amp, freq, ph, fill, depth = 1, x0 = -400, x1 = W + 400, seed = 1, t = 0) {
    const pts = [[x0, H + 900]];
    for (let x = x0; x <= x1; x += 40) pts.push([x, y0 - amp * (Math.sin(x * freq + ph) * 0.6 + Math.sin(x * freq * 2.3 + ph * 1.7) * 0.25 + nz(x * 0.004 + seed) * 0.3) + boil(t, seed + x * 0.01, 0.8)]);
    pts.push([x1, H + 900]);
    poly(pts); paper(fill, depth);
  }
  function cloud(x, y, s, fill = '#FFFFFF', depth = 1) {
    withT(x, y, s, 0, () => {
      ctx.beginPath();
      [[-70, 10, 48], [-25, -18, 60], [30, -8, 52], [75, 14, 40], [0, 20, 55]].forEach(([cx, cy, r]) => { ctx.moveTo(cx + r, cy); ctx.arc(cx, cy, r, 0, Math.PI * 2); });
      paper(fill, depth, false);
    });
  }
  function tree(x, y, s, t, bare = false, leafCol = C.leaf, amt = 1) {
    withT(x, y, s, 0, () => {
      ctx.beginPath(); ctx.moveTo(-22, 0); ctx.quadraticCurveTo(-12, -120, -26, -230); ctx.lineTo(18, -230); ctx.quadraticCurveTo(8, -120, 24, 0); ctx.closePath(); paper('#7A4E2E', 1);
      line([[-10, -200], [-80, -290]], '#7A4E2E', 16); line([[8, -210], [85, -300]], '#7A4E2E', 14); line([[0, -225], [10, -330]], '#7A4E2E', 14);
      if (!bare && amt > 0) {
        const sw = Math.sin(t * 1.3) * 3;
        [[-90, -300, 70], [80, -310, 75], [5, -350, 85], [-30, -260, 60], [50, -250, 58]].forEach(([cx, cy, r], i) => { const a = E.outBack(clamp(amt * 5 - i)); if (a <= 0) return; circ(cx + sw * (i % 2 ? 1 : -1), cy, r * a); paper(i % 2 ? leafCol : mix(leafCol, C.leafDark, 0.35), 1, false); });
      }
    });
  }
  function star(x, y, r, a = 1) { ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = '#FFF6D8'; ctx.beginPath(); for (let i = 0; i < 10; i++) { const ang = -Math.PI / 2 + i * Math.PI / 5, rr2 = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(ang) * rr2, y + Math.sin(ang) * rr2); } ctx.closePath(); ctx.fill(); ctx.restore(); }
  function sparkle(x, y, r, col = '#FFFFFF', a = 1) {
    if (r <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = col; ctx.beginPath();
    ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r); ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r); ctx.fill(); ctx.restore();
  }
  function glow(x, y, r, col, a = 1) { ctx.save(); ctx.globalAlpha *= a * 0.8; ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = radGrad(x, y, 0, r, [[0, col], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore(); }

  // ---------- the peach ----------
  function peach(x, y, r, t, opts = {}) {
    const { leaf = true, stem = true, bites = 0, rot = 0, squash = 0, hole = 0, glowA = 0 } = opts;
    withT(x, y, 1, rot, () => {
      ctx.scale(1 + squash, 1 - squash);
      if (glowA > 0) glow(0, 0, r * 1.9, 'rgba(255,190,120,0.55)', glowA);
      // body: slightly heart-shaped peach with a crease
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.82);
      ctx.bezierCurveTo(r * 0.55, -r * 1.08, r * 1.05, -r * 0.55, r * 1.0, r * 0.05);
      ctx.bezierCurveTo(r * 0.96, r * 0.7, r * 0.5, r * 1.0, 0, r * 1.0);
      ctx.bezierCurveTo(-r * 0.5, r * 1.0, -r * 0.96, r * 0.7, -r * 1.0, r * 0.05);
      ctx.bezierCurveTo(-r * 1.05, -r * 0.55, -r * 0.55, -r * 1.08, 0, -r * 0.82);
      ctx.closePath();
      ctx.save();
      ctx.shadowColor = 'rgba(52,28,12,0.32)'; ctx.shadowBlur = Math.min(40, r * 0.12 + 8); ctx.shadowOffsetX = 3; ctx.shadowOffsetY = Math.min(18, r * 0.05 + 4);
      ctx.fillStyle = radGrad(-r * 0.35, -r * 0.35, r * 0.1, r * 1.35, [[0, C.peach1], [0.55, C.peach2], [1, C.peach3]]);
      ctx.fill(); ctx.restore();
      ctx.save(); ctx.clip();
      // blush
      ctx.fillStyle = radGrad(r * 0.45, r * 0.25, 0, r * 0.9, [[0, 'rgba(238,90,94,0.55)'], [1, 'rgba(238,90,94,0)']]); ctx.fillRect(-r * 1.2, -r * 1.2, r * 2.4, r * 2.4);
      // fuzz highlight
      ctx.fillStyle = radGrad(-r * 0.45, -r * 0.45, 0, r * 0.55, [[0, 'rgba(255,245,225,0.55)'], [1, 'rgba(255,245,225,0)']]); ctx.fillRect(-r * 1.2, -r * 1.2, r * 2.4, r * 2.4);
      // bites
      for (let i = 0; i < bites; i++) {
        const a = -0.6 + i * 0.9, bx = Math.cos(a) * r * 1.02, by = Math.sin(a) * r * 1.02;
        ctx.save(); ctx.globalCompositeOperation = 'destination-out';
        for (let k = -1; k <= 1; k++) { circ(bx + Math.cos(a + Math.PI / 2) * k * r * 0.13, by + Math.sin(a + Math.PI / 2) * k * r * 0.13, r * 0.2); ctx.fill(); }
        ctx.restore();
      }
      ctx.restore();
      // crease
      ctx.strokeStyle = 'rgba(160,60,40,0.45)'; ctx.lineWidth = Math.max(1.5, r * 0.03); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, -r * 0.8); ctx.bezierCurveTo(r * 0.22, -r * 0.35, r * 0.2, r * 0.3, r * 0.02, r * 0.9); ctx.stroke();
      if (hole > 0) { ell(-r * 0.42, r * 0.62, r * 0.17 * hole, r * 0.2 * hole); ctx.fillStyle = '#5A2A1A'; ctx.fill(); ell(-r * 0.42, r * 0.65, r * 0.12 * hole, r * 0.14 * hole); ctx.fillStyle = '#FFB24D'; ctx.globalAlpha = 0.5; ctx.fill(); ctx.globalAlpha = 1; }
      if (stem) { ctx.beginPath(); ctx.moveTo(-r * 0.03, -r * 0.8); ctx.quadraticCurveTo(-r * 0.02, -r * 1.02, r * 0.1, -r * 1.12); ctx.lineWidth = Math.max(2, r * 0.07); ctx.strokeStyle = C.stem; ctx.stroke(); }
      if (leaf) withT(r * 0.08, -r * 0.95, 1, -0.5 + Math.sin(t * 2) * 0.06, () => {
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(r * 0.28, -r * 0.3, r * 0.62, -r * 0.12); ctx.quadraticCurveTo(r * 0.3, r * 0.1, 0, 0); ctx.closePath(); paper(C.leaf, 0.6);
        line([[r * 0.04, -r * 0.01], [r * 0.5, -r * 0.1]], C.leafDark, Math.max(1, r * 0.015));
      });
    });
  }

  // ---------- humans ----------
  // Paper puppet with feet at (0,0). p: pose/style parameters.
  function face(x, y, s, mood, t, look = 0, seed = 0) {
    const blink = ((t + seed) % 3.7) < 0.12 ? 0.12 : 1;
    const eyeY = y - 2 * s, dx = 11 * s;
    if (mood === 'closed') { line([[x - dx - 5 * s + look, eyeY], [x - dx + 5 * s + look, eyeY]], C.ink, 2.5 * s); line([[x + dx - 5 * s + look, eyeY], [x + dx + 5 * s + look, eyeY]], C.ink, 2.5 * s); }
    else {
      const er = (mood === 'surprised' || mood === 'awe') ? 5.2 : 4;
      [-dx, dx].forEach(ox => { ell(x + ox + look, eyeY, er * s * 0.9, er * s * blink); ctx.fillStyle = C.ink; ctx.fill(); ell(x + ox + look + 1.4 * s, eyeY - 1.6 * s, 1.3 * s, 1.3 * s * blink); ctx.fillStyle = '#fff'; ctx.fill(); });
    }
    // brows
    const b = { sad: [-0.35, 0.35], worried: [-0.3, 0.3], angry: [0.45, -0.45], mean: [0.45, -0.45], surprised: [0, 0], happy: [-0.05, 0.05], awe: [-0.1, 0.1] }[mood] || [0, 0];
    [[-dx, b[0]], [dx, b[1]]].forEach(([ox, r]) => withT(x + ox + look, eyeY - 11 * s - (mood === 'surprised' || mood === 'awe' ? 3 * s : 0), 1, r, () => line([[-6 * s, 0], [6 * s, 0]], C.ink, 2.6 * s)));
    // mouth
    ctx.strokeStyle = C.ink; ctx.lineWidth = 2.6 * s; ctx.lineCap = 'round';
    const my = y + 14 * s;
    ctx.beginPath();
    if (mood === 'happy' || mood === 'closed') ctx.arc(x + look * 0.5, my - 4 * s, 8 * s, 0.25, Math.PI - 0.25);
    else if (mood === 'sad' || mood === 'mean') ctx.arc(x + look * 0.5, my + 6 * s, 7 * s, Math.PI + 0.4, -0.4);
    else if (mood === 'surprised' || mood === 'awe') { ell(x + look * 0.5, my, 4.5 * s, 6 * s); ctx.fillStyle = '#7A2E2A'; ctx.fill(); ctx.beginPath(); }
    else if (mood === 'grin') { ctx.arc(x + look * 0.5, my - 6 * s, 11 * s, 0.2, Math.PI - 0.2); ctx.closePath(); ctx.fillStyle = '#7A2E2A'; ctx.fill(); }
    else { ctx.moveTo(x - 6 * s + look * 0.5, my); ctx.lineTo(x + 6 * s + look * 0.5, my); }
    ctx.stroke();
    if (mood === 'happy' || mood === 'grin' || mood === 'closed' || mood === 'awe') { ctx.fillStyle = 'rgba(238,90,94,0.35)'; [-1, 1].forEach(k => { ell(x + k * 20 * s + look, y + 8 * s, 6 * s, 4 * s); ctx.fill(); }); }
  }
  function limb(x0, y0, len, ang, col, w, bend = 0) {
    const mx = x0 + Math.sin(ang) * len * 0.5 + Math.cos(ang) * bend, my = y0 + Math.cos(ang) * len * 0.5 - Math.sin(ang) * bend;
    const ex = x0 + Math.sin(ang) * len, ey = y0 + Math.cos(ang) * len;
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(mx, my, ex, ey); ctx.stroke();
    return [ex, ey];
  }
  // James: small boy. p = {walk, armL, armR, mood, look, lean, hold}
  function james(x, y, s, t, p = {}) {
    const { walk = null, armL = 0.15, armR = -0.15, mood = 'happy', look = 0, lean = 0, bob = 0, flip = 1, crouch = 0 } = p;
    withT(x, y, [s * flip, s], lean, () => {
      const wl = walk == null ? 0 : Math.sin(walk) * 0.55;
      const hipY = -70 + crouch * 20 + (walk == null ? 0 : Math.abs(Math.cos(walk)) * -4) + bob;
      const shY = hipY - 62;
      // back arm + leg
      const handR = limb(10, shY + 8, 52, armR, C.sweaterDark, 15, -4);
      circ(handR[0], handR[1], 7); flat(C.skinShade);
      if (p.holdR) p.holdR(handR[0], handR[1]);
      limb(7, hipY, 66 - crouch * 18, -wl, C.skinShade, 13); ell(7 + Math.sin(-wl) * 64, hipY + Math.cos(wl) * (66 - crouch * 18) - 2, 13, 7); flat(C.shoe);
      // body
      rr(-24, shY - 4, 48, 60, [18, 18, 12, 12]); paper(C.sweater, 0.8);
      rr(-24, hipY - 12, 48, 24, 8); paper(C.shorts, 0.6);
      line([[-16, shY + 14], [16, shY + 14]], 'rgba(255,255,255,0.25)', 4);
      // front leg
      limb(-7, hipY, 66 - crouch * 18, wl, C.skin, 13); ell(-7 + Math.sin(wl) * 64, hipY + Math.cos(wl) * (66 - crouch * 18) - 2, 13, 7); flat(C.shoe);
      // head
      const hy = shY - 42;
      circ(0, hy, 38); paper(C.skin, 0.8);
      ell(-36, hy + 2, 7, 10); flat(C.skinShade); ell(36, hy + 2, 7, 10); flat(C.skinShade);
      // hair: messy tufts
      ctx.beginPath(); ctx.moveTo(-38, hy - 4);
      [[-40, -30], [-24, -48], [-10, -40], [2, -54], [14, -42], [30, -50], [40, -24], [36, -8]].forEach(([hx, hy2]) => ctx.lineTo(hx + boil(t, hx, 1), hy + hy2 + boil(t, hy2, 1)));
      ctx.quadraticCurveTo(10, hy - 26, -38, hy - 4); ctx.closePath(); paper(C.hair, 0.6);
      face(look * 4, hy + 4, 1, mood, t, look * 3, 1);
      // front arm
      const handL = limb(-10, shY + 8, 52, armL, C.sweater, 15, 4);
      circ(handL[0], handL[1], 7); flat(C.skin);
      if (p.holdL) p.holdL(handL[0], handL[1]);
      james.handL = handL; james.handR = handR;
    });
  }
  // Aunt Spiker: tall, thin, grey-violet dress, glasses, bun.
  function spiker(x, y, s, t, p = {}) {
    const { mood = 'mean', armL = 0.2, armR = -0.2, lean = 0, flat: fl = 0, look = 0 } = p;
    withT(x, y, [s * (1 + fl * 0.6), s * (1 - fl * 0.92)], lean, () => {
      limb(10, -250, 95, armR, '#595372', 12);
      ctx.beginPath(); ctx.moveTo(-26, -260); ctx.lineTo(26, -260); ctx.lineTo(44, -10); ctx.lineTo(-44, -10); ctx.closePath(); paper(C.spiker, 1);
      line([[-14, -10], [-14, 0]], C.ink, 8); line([[14, -10], [14, 0]], C.ink, 8);
      ell(0, -300, 30, 44); paper('#EBD2B8', 0.8);
      circ(0, -352, 18); paper('#8E8A98', 0.6); ell(0, -334, 34, 14); paper('#8E8A98', 0.6);
      // pointy nose
      poly([[4 + look, -300], [30 + look, -290], [4 + look, -284]]); flat('#DDBC9E');
      face(look, -304, 0.9, mood, t, look, 7);
      ctx.strokeStyle = C.ink; ctx.lineWidth = 2; circ(-10 + look, -306, 9); ctx.stroke(); circ(12 + look, -306, 9); ctx.stroke();
      limb(-10, -250, 95, armL, C.spiker, 12);
    });
  }
  // Aunt Sponge: short, round, rosy dress, curls.
  function sponge(x, y, s, t, p = {}) {
    const { mood = 'mean', armL = 0.5, armR = -0.5, lean = 0, flat: fl = 0, look = 0 } = p;
    withT(x, y, [s * (1 + fl * 0.6), s * (1 - fl * 0.92)], lean, () => {
      limb(40, -120, 55, armR, '#B24F62', 18);
      ell(0, -85, 78, 85); paper(C.sponge, 1);
      line([[-24, -8], [-24, 0]], C.ink, 10); line([[24, -8], [24, 0]], C.ink, 10);
      circ(0, -190, 50); paper('#F0C4A6', 0.8);
      [[-40, -220], [-20, -238], [5, -242], [30, -234], [45, -212]].forEach(([cx, cy]) => { circ(cx, cy, 16); flat('#C9A15A'); });
      face(look, -186, 1.05, mood, t, look, 11);
      limb(-40, -120, 55, armL, C.sponge, 18);
    });
  }
  // The strange old man: hunched, long coat, beard, hat, cane.
  function oldMan(x, y, s, t, p = {}) {
    const { walk = null, arm = 0.4, look = 0 } = p;
    withT(x, y, s, 0.08, () => {
      const wl = walk == null ? 0 : Math.sin(walk) * 0.3;
      line([[46, -150], [60 + Math.sin(wl) * 6, 0]], '#5A3A22', 7);
      ctx.beginPath(); ctx.moveTo(-30, -210); ctx.quadraticCurveTo(20, -236, 40, -190); ctx.lineTo(56, -8); ctx.lineTo(-50, -8); ctx.closePath(); paper('#4E6B4A', 1);
      ell(-14, -2, 16, 8); flat(C.shoe); ell(26, -2, 16, 8); flat(C.shoe);
      circ(10, -245, 32); paper('#EACBAA', 0.8);
      // beard
      ctx.beginPath(); ctx.moveTo(-18, -238); ctx.quadraticCurveTo(10, -150 + Math.sin(t * 2) * 3, 40, -236); ctx.closePath(); paper('#F2EEE6', 0.5);
      face(10 + look, -252, 0.8, 'closed', t, look, 3);
      // hat
      rr(-30, -290, 80, 12, 6); paper('#3A3A48', 0.6); rr(-14, -330, 48, 44, 8); paper('#3A3A48', 0.6);
      limb(30, -190, 70, arm, '#4E6B4A', 16);
      oldMan.hand = [30 + Math.sin(arm) * 70, -190 + Math.cos(arm) * 70];
    });
  }
  // Child from the city (varied colours).
  function kid(x, y, s, t, seed, p = {}) {
    const r = rng(seed), top = ['#E86A5B', '#F2B84B', '#5BB0E8', '#8E6FD6', '#57B97A'][seed % 5], hair = ['#2B1E16', '#6A3B22', '#C9A15A', '#8B4A2B'][seed % 4], skin = ['#F4C39C', '#C98E62', '#8D5A3B', '#EBC1A0'][Math.floor(r() * 4)];
    const { jump = 0, arm = 0 } = p;
    withT(x, y - jump, s, 0, () => {
      line([[-6, -40], [-8, 0]], skin, 9); line([[6, -40], [8, 0]], skin, 9);
      rr(-17, -86, 34, 50, 12); paper(top, 0.6);
      limb(-14, -80, 34, 2.4 + arm, top, 9); limb(14, -80, 34, -2.4 - arm, top, 9);
      circ(0, -108, 24); paper(skin, 0.6);
      ctx.beginPath(); ctx.arc(0, -112, 25, Math.PI * 1.05, Math.PI * 1.95); ctx.closePath(); flat(hair);
      face(0, -106, 0.6, 'happy', t, 0, seed);
    });
  }

  // ---------- the bugs ----------
  function eyesBig(x, y, s, t, seed, mood = 'happy', look = 0) {
    const blink = ((t + seed) % 4.1) < 0.12 ? 0.12 : 1;
    [-1, 1].forEach(k => { ell(x + k * 16 * s, y, 13 * s, 15 * s * blink); flat('#FFFFFF'); ell(x + k * 16 * s + look * 3 * s, y + 2 * s, 6 * s, 7 * s * blink); flat(C.ink); ell(x + k * 16 * s + look * 3 * s + 2 * s, y - 1 * s, 2 * s, 2 * s * blink); flat('#fff'); });
    const br = { worried: [-0.35, 0.35], proud: [0.18, -0.18], happy: [0, 0] }[mood] || [0, 0];
    [[-1, br[0]], [1, br[1]]].forEach(([k, r]) => withT(x + k * 16 * s, y - 20 * s, 1, r, () => line([[-8 * s, 0], [8 * s, 0]], C.ink, 3 * s)));
  }
  function grasshopper(x, y, s, t, lit = 1) {
    withT(x, y, s, 0, () => {
      const bob = Math.sin(t * 2.2) * 3;
      line([[-40, -60], [-90, -150], [-70, 0]], '#4F8A3A', 12); // back leg
      ell(-10, -110 + bob, 70, 34, -0.3); paper('#79B85A', 1);
      [0, 1, 2].forEach(i => line([[-40 + i * 25, -130 + bob], [-34 + i * 25, -92 + bob]], 'rgba(40,80,30,0.35)', 3));
      line([[10, -95 + bob], [20, 0]], '#4F8A3A', 8); line([[30, -100 + bob], [52, 0]], '#4F8A3A', 8);
      ell(58, -160 + bob, 38, 44); paper('#8FCB6B', 0.8);
      // bow tie
      poly([[40, -118 + bob], [58, -110 + bob], [40, -102 + bob]]); flat('#C8413B'); poly([[76, -118 + bob], [58, -110 + bob], [76, -102 + bob]]); flat('#C8413B');
      line([[48, -196 + bob], [30, -250 + bob], [10, -262 + bob]], '#4F8A3A', 4); line([[68, -198 + bob], [80, -255 + bob], [100, -262 + bob]], '#4F8A3A', 4);
      eyesBig(58, -168 + bob, 1, t, 1, 'happy', 0.4);
      ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(58, -150 + bob, 12, 0.3, Math.PI - 0.3); ctx.stroke();
      circ(74, -168 + bob, 16); ctx.strokeStyle = '#C9A15A'; ctx.lineWidth = 3; ctx.stroke(); // monocle
    });
  }
  function ladybird(x, y, s, t) {
    withT(x, y, s, 0, () => {
      const bob = Math.sin(t * 2.5 + 1) * 3;
      [-40, 0, 40].forEach((lx, i) => line([[lx, -30], [lx - 10 + i * 10, 0]], C.ink, 7));
      ctx.beginPath(); ctx.arc(0, -40 + bob, 90, Math.PI, 0); ctx.closePath(); paper('#E3423B', 1);
      line([[0, -130 + bob], [0, -40 + bob]], C.ink, 4);
      [[-50, -80], [-25, -110], [40, -95], [55, -60], [-60, -55], [20, -60]].forEach(([dx, dy]) => { circ(dx, dy + bob, 12); flat(C.ink); });
      circ(0, -135 + bob, 40); paper('#2E2420', 0.8);
      eyesBig(0, -140 + bob, 0.9, t, 2, 'happy');
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -125 + bob, 10, 0.3, Math.PI - 0.3); ctx.stroke();
      ctx.fillStyle = 'rgba(238,90,94,0.6)'; ell(-24, -124 + bob, 6, 4); ctx.fill(); ell(24, -124 + bob, 6, 4); ctx.fill();
    });
  }
  function spider(x, y, s, t) {
    withT(x, y, s, 0, () => {
      const bob = Math.sin(t * 2 + 2) * 4;
      for (let i = 0; i < 4; i++) {
        const a = 0.35 + i * 0.28, w = Math.sin(t * 3 + i) * 0.06;
        [-1, 1].forEach(k => line([[k * 30, -80 + bob], [k * Math.cos(a) * 110, -80 - Math.sin(a) * 60 + bob], [k * (Math.cos(a + w) * 150), 0]], '#5B3F7A', 7));
      }
      ell(0, -85 + bob, 62, 52); paper('#8A5FB6', 1);
      ell(0, -145 + bob, 42, 38); paper('#9D72C8', 0.8);
      eyesBig(0, -150 + bob, 0.9, t, 3, 'happy');
      [-1, 1].forEach(k => line([[k * 18, -166 + bob], [k * 24, -172 + bob]], C.ink, 2)); // lashes
      ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -134 + bob, 10, 0.3, Math.PI - 0.3); ctx.stroke();
    });
  }
  function earthworm(x, y, s, t) {
    withT(x, y, s, 0, () => {
      const n = 9;
      for (let i = n - 1; i >= 0; i--) {
        const u = i / (n - 1), px = -140 + i * 22, py = -30 - Math.sin(u * Math.PI * 0.9) * 120 - (i > 6 ? (i - 6) * 20 : 0) + Math.sin(t * 2.4 + i * 0.6) * 4;
        circ(px, py, 30 - u * 2); paper(i % 2 ? '#F2A0A8' : '#E88B96', 0.6);
      }
      const hx = -140 + (n - 1) * 22, hy = -30 - Math.sin(0.9 * Math.PI) * 120 - 40 + Math.sin(t * 2.4 + (n - 1) * 0.6) * 4;
      circ(hx + 10, hy - 20, 38); paper('#F2A0A8', 0.8);
      // closed worried eyes and brows
      [-1, 1].forEach(k => { line([[hx + 10 + k * 14 - 6, hy - 26], [hx + 10 + k * 14 + 6, hy - 24]], C.ink, 3); withT(hx + 10 + k * 14, hy - 40, 1, k * 0.35, () => line([[-8, 0], [8, 0]], C.ink, 3)); });
      ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(hx + 10, hy + 2, 8, Math.PI + 0.5, -0.5); ctx.stroke();
      // sweat drop
      const d = (t * 0.8) % 1; ell(hx + 44, hy - 30 + d * 20, 5, 8); ctx.fillStyle = `rgba(140,200,255,${1 - d})`; ctx.fill();
    });
  }
  function centipede(x, y, s, t, p = {}) {
    const { chew = 0 } = p;
    withT(x, y, s, 0, () => {
      const n = 8;
      for (let i = n - 1; i >= 0; i--) {
        const px = -200 + i * 38, py = -60 + Math.sin(t * 4 + i * 0.8) * 4 - (i === n - 1 ? 30 : 0);
        [-1, 1].forEach(k => { line([[px + k * 6, py + 20], [px + k * 10, 0]], '#8A4A20', 6); ell(px + k * 10 + 4, -2, 9, 5); flat('#2B1E16'); });
        circ(px, py, 28); paper(i % 2 ? '#E0873A' : '#D4762E', 0.6);
      }
      const hx = -200 + (n - 1) * 38 + 30, hy = -130;
      circ(hx, hy, 40); paper('#EE9A4A', 0.8);
      line([[hx - 10, hy - 36], [hx - 30, hy - 80]], '#8A4A20', 4); line([[hx + 10, hy - 36], [hx + 30, hy - 82]], '#8A4A20', 4);
      eyesBig(hx, hy - 8, 0.85, t, 5, 'proud', 0.5);
      // proud grin / chewing
      ctx.fillStyle = '#7A2E2A'; ctx.beginPath(); ctx.arc(hx + 2, hy + 12, 14, 0.15, Math.PI - 0.15); ctx.closePath(); ctx.fill();
      if (chew > 0) { const o = Math.abs(Math.sin(t * 18)) * 6; ell(hx + 2, hy + 18, 12, 4 + o); flat('#7A2E2A'); }
      poly([[hx - 8, hy + 14], [hx + 12, hy + 14], [hx + 2, hy + 20]]); flat('#fff');
    });
  }

  // ---------- birds, sharks, city ----------
  function gull(x, y, s, t, seed = 0) {
    const f = Math.sin(t * 10 + seed) * 0.6;
    withT(x, y, s, 0, () => {
      ell(0, 0, 22, 9); flat('#FFFFFF');
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-4, -2); ctx.quadraticCurveTo(-24, -18 - f * 20, -46, -6 - f * 34); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(4, -2); ctx.quadraticCurveTo(24, -18 - f * 20, 46, -6 - f * 34); ctx.stroke();
      circ(18, -3, 7); flat('#FFFFFF'); poly([[24, -3], [33, -1], [24, 1]]); flat('#F2B84B');
      circ(20, -5, 1.6); flat(C.ink);
    });
  }
  function fin(x, y, s) { withT(x, y, s, 0, () => { ctx.beginPath(); ctx.moveTo(-40, 0); ctx.quadraticCurveTo(-10, -30, 8, -80); ctx.quadraticCurveTo(20, -30, 42, 0); ctx.closePath(); paper('#5E6E7E', 0.8); }); }
  function building(x, y, w, h, col, t, seed, lit = 0.6) {
    rr(x, y - h, w, h, 2); paper(col, 0.6, false);
    const r = rng(seed); ctx.fillStyle = 'rgba(255,214,140,0.9)';
    for (let yy = y - h + 16; yy < y - 14; yy += 22) for (let xx = x + 8; xx < x + w - 12; xx += 16) if (r() < lit) ctx.fillRect(xx, yy, 7, 11);
  }
  function empireState(x, y, s, col = '#4A4068') {
    withT(x, y, s, 0, () => {
      const tiers = [[160, 420], [120, 560], [86, 650], [56, 700], [30, 740]];
      tiers.forEach(([w, h]) => { rr(-w / 2, -h, w, h, 2); paper(col, 0.6, false); });
      ctx.fillStyle = 'rgba(255,214,140,0.85)';
      for (let yy = -400; yy < -20; yy += 24) for (let xx = -70; xx < 70; xx += 18) if (((xx * 7 + yy * 3) >>> 0) % 5 < 3) ctx.fillRect(xx, yy, 7, 12);
      line([[0, -740], [0, -860]], col, 8);
      empireState.tip = [0, -860];
    });
  }

  // ---------- paper grain + vignette (screen space) ----------
  const grain = (() => {
    const g = document.createElement('canvas'); g.width = 512; g.height = 512;
    const gx = g.getContext('2d'), im = gx.createImageData(512, 512), r = rng(3);
    for (let i = 0; i < im.data.length; i += 4) { const v = 200 + r() * 55; im.data[i] = v; im.data[i + 1] = v * 0.97; im.data[i + 2] = v * 0.9; im.data[i + 3] = 255; }
    gx.putImageData(im, 0, 0);
    // paper fibres
    for (let i = 0; i < 260; i++) { gx.strokeStyle = `rgba(120,90,60,${0.05 + r() * 0.06})`; gx.lineWidth = 0.6 + r(); gx.beginPath(); const x0 = r() * 512, y0 = r() * 512, a = r() * 6.28; gx.moveTo(x0, y0); gx.lineTo(x0 + Math.cos(a) * 20, y0 + Math.sin(a) * 20); gx.stroke(); }
    return g;
  })();
  let grainPat = null;
  function finish(t, vignette = 0.35) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (!grainPat) grainPat = ctx.createPattern(grain, 'repeat');
    const j = Math.floor(t * 8) % 4;
    ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.22;
    ctx.translate(-j * 37, -j * 23); ctx.fillStyle = grainPat; ctx.fillRect(0, 0, W + 200, H + 200);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.fillStyle = radGrad(W / 2, H / 2, H * 0.45, H * 1.05, [[0, 'rgba(40,20,10,0)'], [1, `rgba(40,20,10,${vignette})`]]);
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  window.PE = { W, H, ctx, cv, C, clamp, lerp, prog, E, pop, rng, nz, boil, mix, FONT_SERIF, FONT_ROUND, withT, rr, ell, circ, poly, smoothPoly, paper, flat, line, txt, linGrad, radGrad, sky, layer, camAt, hill, cloud, tree, star, sparkle, glow, peach, face, limb, james, spiker, sponge, oldMan, kid, grasshopper, ladybird, spider, earthworm, centipede, gull, fin, building, empireState, finish };
})();
