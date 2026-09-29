// James and the Giant Peach: scenes, synced to the voiceover line times.
(() => {
  const { W, H, ctx, C, clamp, lerp, prog, E, pop, rng, nz, boil, mix, FONT_SERIF, FONT_ROUND, withT, rr, ell, circ, poly, smoothPoly, paper, flat, line, txt, linGrad, radGrad, sky, layer, camAt, hill, cloud, tree, star, sparkle, glow, peach, james, spiker, sponge, oldMan, kid, grasshopper, ladybird, spider, earthworm, centipede, gull, fin, building, empireState, finish } = PE;
  const D = 121.5;
  const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };

  // ---------- shared bits ----------
  function tag(text, x, y, t0, t, opts = {}) {
    const { size = 46, col = C.ink, bg = C.cream, rot = -0.04, out = null } = opts;
    const p = pop(t, t0, 0.5); if (p <= 0) return;
    const o = out ? 1 - prog(t, out, out + 0.3) : 1; if (o <= 0) return;
    ctx.save(); ctx.globalAlpha *= o;
    withT(x, y, p, rot * (2 - p), () => {
      ctx.font = `italic 700 ${size}px ${FONT_SERIF}`; const w = ctx.measureText(text).width + size * 1.1;
      ctx.beginPath(); ctx.moveTo(-w / 2, -size * 0.7); ctx.lineTo(w / 2, -size * 0.7); ctx.lineTo(w / 2 - size * 0.25, 0); ctx.lineTo(w / 2, size * 0.7); ctx.lineTo(-w / 2, size * 0.7); ctx.lineTo(-w / 2 + size * 0.25, 0); ctx.closePath();
      paper(bg, 0.8);
      txt(text, 0, size * 0.04, size, col, FONT_SERIF, 700, 'center', true);
      circ(-w / 2 + size * 0.55, -size * 0.35, size * 0.1); flat('#C8413B');
    });
    ctx.restore();
  }
  // Big illustrated sound word.
  function shout(text, x, y, t0, t, opts = {}) {
    const { size = 170, fill = C.peach2, stroke = C.ink, dur = 1.4, rot = -0.06, wobble = 0 } = opts;
    const a = prog(t, t0, t0 + 0.08) * (1 - prog(t, t0 + dur - 0.25, t0 + dur)); if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a;
    ctx.font = `900 ${size}px ${FONT_SERIF}`;
    const chars = [...text], widths = chars.map(c => ctx.measureText(c).width), total = widths.reduce((s, w) => s + w, 0);
    let cx = x - total / 2;
    chars.forEach((ch, i) => {
      const p = pop(t, t0 + i * 0.04, 0.35);
      const wy = Math.sin(t * 9 + i * 0.9) * wobble;
      withT(cx + widths[i] / 2, y + wy, p, rot + Math.sin(i * 1.7) * 0.06, () => {
        ctx.font = `900 ${size}px ${FONT_SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round'; ctx.lineWidth = size * 0.12; ctx.strokeStyle = stroke; ctx.strokeText(ch, 0, 0);
        ctx.fillStyle = stroke; ctx.fillText(ch, size * 0.04, size * 0.05);
        ctx.fillStyle = fill; ctx.fillText(ch, 0, 0);
      });
      cx += widths[i];
    });
    ctx.restore();
  }
  function rain(t, a, wind = 0.25) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a * 0.55; ctx.strokeStyle = '#DDE6F2'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    const r = rng(8);
    for (let i = 0; i < 170; i++) {
      const x0 = r() * (W + 400) - 200, sp = 1400 + r() * 700, ph = r();
      const y = ((t * sp + ph * (H + 200)) % (H + 200)) - 100, x = x0 + y * wind;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 18 * wind, y + 30); ctx.stroke();
    }
    ctx.restore();
  }
  function grade(col, a, op = 'multiply') { if (a <= 0) return; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = op; ctx.globalAlpha = a; ctx.fillStyle = col; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  function flash(a) { if (a <= 0) return; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = a; ctx.fillStyle = '#FFFDF4'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  function shakeAt(t, hits) { let a = 0; hits.forEach(([t0, amp, d = 0.4]) => { const p = prog(t, t0, t0 + d); if (p > 0 && p < 1) a += amp * (1 - p) * (1 - p); }); return a; }

  // Book cover (opening and closing).
  function cover(t, title2 = null) {
    ctx.fillStyle = '#2F4A3A'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = radGrad(W / 2, H / 2, 100, 1100, [[0, '#3C5E48'], [1, '#22372B']]); ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(232,196,120,0.8)'; ctx.lineWidth = 6; rr(70, 60, W - 140, H - 120, 30); ctx.stroke();
    ctx.lineWidth = 2; rr(92, 82, W - 184, H - 164, 22); ctx.stroke();
    peach(W / 2, 560, 210, t, { glowA: 0.9 });
    [[560, 380], [1360, 380], [520, 760], [1400, 760], [760, 250], [1160, 250]].forEach(([x, y], i) => sparkle(x, y, 14 + 8 * Math.sin(t * 3 + i), '#F6DDA0', 0.9));
    if (title2) {
      txt(title2, W / 2, 900, 120, '#F6DDA0', FONT_SERIF, 900);
    } else {
      ctx.font = `900 104px ${FONT_SERIF}`; const w1 = ctx.measureText('James ').width, w3 = ctx.measureText(' Giant Peach').width;
      ctx.font = `italic 500 60px ${FONT_SERIF}`; const w2 = ctx.measureText('and the').width;
      const x0 = W / 2 - (w1 + w2 + w3) / 2;
      txt('James ', x0, 200, 104, '#F6DDA0', FONT_SERIF, 900, 'left');
      txt('and the', x0 + w1, 206, 60, '#F6DDA0', FONT_SERIF, 500, 'left', true);
      txt(' Giant Peach', x0 + w1 + w2, 200, 104, '#F6DDA0', FONT_SERIF, 900, 'left');
      txt('a storybook retelling', W / 2, 890, 42, 'rgba(246,221,160,0.85)', FONT_SERIF, 500, 'center', true);
    }
  }

  // ======================================================================
  // WORLD A: meadow -> the aunts' hill (0 - 53.6)
  // ======================================================================
  const groundA = x => lerp(860, 720, smooth((x - 1800) / 1100));
  const TREE_X = 3500, HOUSE_X = 4520;
  const BR_TIP = [TREE_X + 85 * 1.3, 720 - 300 * 1.3];     // right branch tip where the peach grows
  // mood curves
  const gloomA = t => smooth(prog(t, 5.9, 8.6)) * (1 - 0.55 * smooth(prog(t, 21, 24))) * (1 - smooth(prog(t, 36, 40.5)));
  const stormA = t => smooth(prog(t, 12.9, 13.9)) * (1 - smooth(prog(t, 20.2, 22.4)));
  const amberA = t => smooth(prog(t, 21, 23.5)) * (1 - smooth(prog(t, 39, 42)));
  const nightA = t => smooth(prog(t, 47.9, 49.6));
  function toneA(col, t) {
    let c = mix(col, '#8E8A9A', gloomA(t) * 0.62);
    c = mix(c, '#5D5870', stormA(t) * 0.35);
    c = mix(c, '#E7B77B', amberA(t) * 0.18);
    c = mix(c, '#1F2A52', nightA(t) * 0.62);
    return c;
  }
  function house(x, gy, s, t) {
    withT(x, gy, s, 0, () => {
      // crooked tall house
      ctx.beginPath(); ctx.moveTo(-200, 0); ctx.lineTo(-190, -330); ctx.lineTo(205, -345); ctx.lineTo(210, 0); ctx.closePath(); paper(toneA('#A69C8C', t), 1.2);
      poly([[-240, -320], [10, -520], [250, -340]]); paper(toneA('#6C5A5A', t), 1.2);
      rr(120, -500, 44, 110, 4); paper(toneA('#7A6A62', t), 0.8);
      // windows (lit at night)
      const lit = nightA(t);
      [[-130, -250], [60, -255], [-130, -140]].forEach(([wx, wy]) => { rr(wx, wy, 64, 70, 4); paper(mix(toneA('#4E4A5A', t), '#FFD58A', lit * 0.85), 0.5); line([[wx + 32, wy], [wx + 32, wy + 70]], toneA('#A69C8C', t), 4); });
      rr(40, -150, 80, 150, [40, 40, 0, 0]); paper(toneA('#5A3E30', t), 0.7);
      circ(104, -74, 5); flat('#E8C878');
      line([[-200, -2], [210, -2]], 'rgba(0,0,0,0.15)', 4);
    });
  }
  function fence(x0, x1, gy, t) {
    for (let x = x0; x < x1; x += 70) { rr(x, gy - 90, 16, 92, [8, 8, 0, 0]); paper(toneA('#9A8A78', t), 0.5, false); }
    rr(x0 - 10, gy - 70, x1 - x0, 12, 4); paper(toneA('#8A7A68', t), 0.4, false); rr(x0 - 10, gy - 38, x1 - x0, 12, 4); paper(toneA('#8A7A68', t), 0.4, false);
  }
  // peach size/position over the growth beats
  function peachA(t) {
    if (t < 40.55) return null;
    let r;
    if (t < 42.46) r = lerp(0, 22, E.outElastic(prog(t, 40.61, 41.4)));
    else if (t < 44.66) r = lerp(22, 95, E.outBack(prog(t, 42.5, 43.5)));
    else if (t < 45.78) r = lerp(95, 200, E.outBack(prog(t, 44.66, 45.4)));
    else r = lerp(200, 290, E.outBack(prog(t, 45.78, 47.0)));
    const onGround = smooth(prog(r, 90, 200));
    const hangX = BR_TIP[0], hangY = BR_TIP[1] + r * 1.05 + 10;
    const gx = 3790, gy = 720 - r * 0.97;
    return { x: lerp(hangX, gx, onGround), y: lerp(hangY, gy, onGround), r, onGround };
  }
  function kite(x, y, t, a = 1) {
    withT(x, y, 1, Math.sin(t * 2.1) * 0.12, () => {
      ctx.globalAlpha *= a;
      poly([[0, -70], [48, 0], [0, 80], [-48, 0]]); paper('#E8503E', 0.8);
      poly([[0, -70], [48, 0], [0, 0]]); flat('#F2B84B'); poly([[0, 80], [-48, 0], [0, 0]]); flat('#F2B84B');
      line([[0, 80], [10, 130], [-12, 170], [8, 210]], C.inkSoft, 3);
      [[10, 130], [-12, 170], [8, 210]].forEach(([bx, by], i) => withT(bx, by, 1, 0.5 * i, () => { poly([[-12, -6], [12, 6], [12, -6], [-12, 6]]); flat(['#3F72B8', '#57B97A', '#E8503E'][i]); }));
    });
  }
  const camA = [
    [0, 1000, 560, 1.3], [5.6, 960, 590, 1.42, E.inOutSine], [7.84, 960, 590, 1.42],
    [10.1, 4200, 520, 1.25, E.inOutSine], [12.6, 4260, 520, 1.25], [13.4, 4380, 470, 1.55, E.outCubic], [15.4, 4380, 470, 1.55],
    [16.1, 4120, 560, 1.45, E.inOutCubic], [20.6, 4120, 560, 1.45],
    [21.6, 3560, 540, 1.5, E.inOutCubic], [26.2, 3530, 540, 1.6], [28.6, 3520, 540, 2.0, E.inOutCubic], [30.4, 3520, 530, 2.2, E.outCubic],
    [31.1, 3600, 560, 1.6, E.inOutCubic], [33.3, 3570, 560, 1.3], [35.2, 3560, 930, 1.25, E.inOutCubic], [37.4, 3560, 930, 1.25],
    [39.0, BR_TIP[0], 380, 2.0, E.inOutCubic], [41.4, BR_TIP[0], 400, 2.4], [43.2, BR_TIP[0] + 60, 460, 1.55, E.outCubic],
    [45.2, 3800, 420, 1.0, E.outCubic], [47.4, 4080, 380, 0.72, E.outCubic], [48.8, 4080, 400, 0.74],
    [51.4, 3680, 520, 1.25, E.inOutCubic], [53.6, 3520, 560, 2.6, E.inExpo],
  ];
  function jamesA(t) { // James' world position and pose by beat
    const gy = x => groundA(x);
    if (t < 7.84) return { x: 850, pose: { mood: t < 6.2 ? 'happy' : 'sad', armL: t < 6.3 ? -2.5 : lerp(-2.5, -0.3, prog(t, 6.3, 6.8)), armR: -0.2, look: t < 6.3 ? 1 : 0 } };
    if (t < 10.4) { const x = lerp(850, 3980, E.inOutSine(prog(t, 7.84, 10.4))); return { x, pose: { mood: 'sad', walk: t * 9, armR: -0.1, holdR: suitcase } }; }
    if (t < 16.0) return { x: 3980, pose: { mood: t > 12.9 ? 'worried' : 'sad', look: 1, armR: -0.1, holdR: suitcase } };
    if (t < 21.0) { const sw = Math.sin(t * 7); const ball = t > 18.2 && t < 18.75; return { x: 3860, pose: { mood: ball ? 'happy' : 'sad', armL: 0.9 + sw * 0.35, armR: 0.7 + sw * 0.35, lean: 0.12, holdL: broom(sw) } }; }
    if (t < 24.6) return { x: 3600, sit: true, pose: { mood: 'sad', crouch: 1, armL: 0.6, armR: -0.6, look: t > 23.3 ? -1 : 0 } };
    if (t < 31.1) { const handed = t > 25.5; return { x: 3600, pose: { mood: t > 26.3 ? 'awe' : 'surprised', look: -1, armL: handed ? -1.1 : 0.2, armR: -0.2, holdL: handed ? magicBag : null } }; }
    if (t < 33.2) { // run then trip
      const k = prog(t, 31.1, 31.55), x = lerp(3600, 3700, k);
      const fall = E.outCubic(prog(t, 31.5, 31.9));
      return { x, lean: fall * 1.35, drop: fall * 30, pose: { mood: 'surprised', walk: t * 16, armL: lerp(-1.1, -2.6, fall), armR: lerp(-0.2, -2.4, fall), holdL: t < 31.5 ? magicBag : null } };
    }
    if (t < 40.5) { const up = prog(t, 36.0, 36.6); return { x: 3720, lean: lerp(1.35, 0, E.outBack(up)), drop: lerp(30, 0, up), pose: { mood: up > 0.5 ? 'awe' : 'closed', look: -1, armL: -0.3, armR: 0.3 } }; }
    if (t < 48.6) { const pk = peachA(t), cheer = t > 44.6; return { x: pk && pk.onGround > 0.5 ? 3380 : 3740, pose: { mood: cheer ? 'awe' : 'happy', look: 1, armL: cheer ? -2.6 + Math.sin(t * 8) * 0.2 : -0.3, armR: cheer ? 2.6 - Math.sin(t * 8) * 0.2 : 0.3 } }; }
    // night: walk to the hole and crawl in
    const k = prog(t, 49.2, 51.6), x = lerp(3380, 3560, E.inOutSine(k));
    const crawl = prog(t, 51.6, 52.6);
    return { x, drop: crawl * 40, lean: crawl * 1.2, pose: { mood: 'awe', walk: k > 0 && k < 1 ? t * 8 : null, armL: -0.9 - crawl, armR: 0.9 + crawl, look: 1 }, fade: 1 - prog(t, 52.4, 52.9) };
  }
  function suitcase(hx, hy) { rr(hx - 26, hy, 52, 38, 5); paper('#8A5A36', 0.5); line([[hx - 8, hy], [hx - 8, hy - 8], [hx + 8, hy - 8], [hx + 8, hy]], '#5A3A22', 4); }
  function broom(sw) { return (hx, hy) => { line([[hx - 40, hy - 70], [hx + 50, hy + 70]], '#9A6A3A', 7); poly([[hx + 30, hy + 60], [hx + 90, hy + 50], [hx + 100, hy + 110], [hx + 50, hy + 118]]); flat('#D8B25A'); }; }
  function magicBag(hx, hy) { glow(hx, hy + 20, 190, 'rgba(140,255,106,0.9)'); rr(hx - 36, hy - 6, 72, 74, [12, 12, 26, 26]); paper('#B89468', 0.6); line([[hx - 24, hy + 4], [hx + 24, hy + 4]], '#6A4A2A', 5); [[-14, -14], [6, -20], [20, -10]].forEach(([dx, dy]) => { circ(hx + dx, hy + dy, 9); flat(C.magic); }); }

  function worldA(t) {
    const cam = camAt(camA, t);
    const G = gloomA(t), N = nightA(t), S = stormA(t);
    // sky
    let top = mix('#8CC8E8', '#7F7C8E', G), bot = mix('#FDE9C9', '#B9B4BF', G);
    top = mix(top, '#555066', S * 0.5); bot = mix(bot, '#8C879A', S * 0.5);
    bot = mix(bot, '#F2C98F', amberA(t) * 0.55);
    top = mix(top, '#101838', N); bot = mix(bot, '#34427A', N);
    sky([[0, top], [1, bot]]);
    // sun / moon
    layer(cam, 0.05, () => {
      const sunA = (1 - G) * (1 - N);
      if (sunA > 0.02) { glow(1500, 250, 260, 'rgba(255,220,150,0.7)', sunA); circ(1500, 250, 80); ctx.globalAlpha = sunA; paper('#FFE3A0', 0.3, false); ctx.globalAlpha = 1; }
      if (N > 0.02) {
        const r = rng(4); for (let i = 0; i < 90; i++) star(r() * W, r() * 600, 2 + r() * 4, N * (0.5 + 0.5 * Math.sin(t * 2 + i)));
        glow(1450, 200, 240, 'rgba(250,240,200,0.45)', N); circ(1450, 200, 70); ctx.globalAlpha = N; paper(C.moon, 0.3, false); ctx.globalAlpha = 1;
      }
    });
    // clouds
    layer(cam, 0.15, () => {
      const cc = toneA('#FFFFFF', t);
      [[300, 180, 1.1], [1150, 120, 0.8], [2100, 200, 1.2], [3000, 150, 1.0], [3900, 190, 1.3], [4700, 130, 0.9]].forEach(([x, y, s], i) => cloud(x + t * 6 * (i % 2 ? 1 : 0.6), y + S * 40, s * (1 + S * 0.4), mix(cc, '#6D687E', S * 0.6)));
    });
    // far and mid hills
    layer(cam, 0.35, () => { hill(700, 70, 0.003, 1.0, toneA('#B6D48A', t), 0.8, -2000, 4200, 3, t); });
    layer(cam, 0.6, () => { hill(780, 60, 0.004, 2.2, toneA('#97C06B', t), 1, -2000, 5600, 5, t); tree(1600, 790, 0.6, t, G > 0.5, toneA(C.leaf, t)); });
    // main ground + world props
    layer(cam, 1, () => {
      const pts = [[-600, 2200]]; for (let x = -600; x <= 5600; x += 50) pts.push([x, groundA(x) + boil(t, x * 0.01, 0.8)]); pts.push([5600, 2200]);
      poly(pts); paper(toneA(C.grass2, t), 1.2);
      // underground cross-section (visible when the camera tilts down)
      const ug = smooth(prog(t, 33.6, 34.6)) * (1 - smooth(prog(t, 37.6, 38.6)));
      if (ug > 0) {
        ctx.save(); ctx.globalAlpha = ug;
        for (let i = 0; i < 4; i++) { const pts2 = [[2800, 2200]]; for (let x = 2800; x <= 4400; x += 50) pts2.push([x, groundA(x) + 40 + i * 110 + Math.sin(x * 0.01 + i) * 12]); pts2.push([4400, 2200]); poly(pts2); flat(['#7A5A3E', '#6A4C34', '#5A3F2C', '#4A3324'][i]); }
        // pebbles
        const r = rng(12); for (let i = 0; i < 60; i++) { ell(2900 + r() * 1400, 800 + r() * 440, 6 + r() * 10, 4 + r() * 6, r()); flat('rgba(40,26,16,0.35)'); }
        // roots, lit by the magic travelling up
        const roots = [[[TREE_X, 720], [TREE_X - 60, 820], [TREE_X - 180, 900], [TREE_X - 260, 1010]], [[TREE_X, 720], [TREE_X + 40, 840], [TREE_X + 160, 930], [TREE_X + 220, 1060]], [[TREE_X, 720], [TREE_X - 10, 880], [TREE_X + 30, 1020], [TREE_X - 20, 1140]], [[TREE_X + 20, 760], [TREE_X + 120, 800], [TREE_X + 240, 830]]];
        const lit = prog(t, 34.6, 36.8);
        roots.forEach((pts3, ri) => {
          line(pts3, '#8A6040', 22 - ri * 3);
          if (lit > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.shadowColor = C.magic; ctx.shadowBlur = 24; const n = pts3.length - 1; const k = clamp(1 - lit) * n; const sub = [...pts3].reverse(); line(sub.slice(0, Math.max(2, Math.ceil(n + 1 - k))), 'rgba(140,255,106,0.85)', 8); ctx.restore(); }
        });
        // magic seeds sinking
        const sink = prog(t, 33.3, 35.0);
        for (let i = 0; i < 9; i++) { const sx = TREE_X + 60 + (i - 4) * 26, sy = lerp(725, 900 + (i % 3) * 40, E.inOutSine(sink)); glow(sx, sy, 40, 'rgba(140,255,106,0.7)'); circ(sx, sy, 7); flat(C.magic); }
        ctx.restore();
      }
      // road
      const rp = []; for (let x = 1750; x <= 4500; x += 50) rp.push([x, groundA(x) + 14]); line(rp, toneA('#E0CFA6', t), 12);
      // flowers in the meadow
      const fr = rng(21); for (let i = 0; i < 40; i++) { const fx = fr() * 2000 - 100, fy = groundA(fx) + 20 + fr() * 120; circ(fx, fy, 7); flat(toneA(['#F2B84B', '#EE5A5E', '#FFFFFF', '#8E6FD6'][i % 4], t)); }
      fence(4050, 4950, 722, t);
      house(HOUSE_X, 722, 1, t);
      // the peach tree: bare until the magic, then leafy
      const leaves = smooth(prog(t, 37.9, 39.6));
      tree(TREE_X, 722, 1.3, t, leaves <= 0, toneA(C.leaf, t), leaves);
      if (t > 36.8 && t < 41) { const g = prog(t, 36.8, 37.6) * (1 - prog(t, 40.6, 41)); glow(BR_TIP[0], BR_TIP[1], 180, 'rgba(140,255,106,0.6)', g); }
      // bag spill: the glowing things arc to the tree base
      if (t > 31.5 && t < 33.8) {
        const k = prog(t, 31.5, 32.3);
        for (let i = 0; i < 9; i++) { const sx = lerp(3680, TREE_X + 60 + (i - 4) * 26, k), sy = lerp(560, 725, k) - Math.sin(k * Math.PI) * (140 + i * 12); glow(sx, sy, 50, 'rgba(140,255,106,0.7)'); circ(sx, sy, 8); flat(C.magic); }
        if (k >= 1) { const gl = 1 - prog(t, 33.3, 33.8); for (let i = 0; i < 9; i++) { const sx = TREE_X + 60 + (i - 4) * 26; glow(sx, 722, 50, 'rgba(140,255,106,0.7)', gl); } }
      }
      // the peach
      const pk = peachA(t);
      if (pk) {
        if (pk.onGround < 0.9) line([[BR_TIP[0], BR_TIP[1]], [pk.x, pk.y - pk.r * 0.95]], C.stem, Math.max(4, pk.r * 0.08));
        peach(pk.x, pk.y, pk.r, t, { glowA: nightA(t) > 0 ? 0.5 : 0.25, hole: smooth(prog(t, 48.8, 49.6)), rot: 0 });
        if (t > 40.6 && t < 41.6) [0, 1, 2, 3].forEach(i => sparkle(pk.x + Math.cos(i * 1.6 + t * 3) * (pk.r + 30), pk.y + Math.sin(i * 1.6 + t * 3) * (pk.r + 30), 12, '#FFF4C8', 1 - prog(t, 41.2, 41.6)));
      }
      // kite (opening)
      if (t < 8.4) {
        const snap = prog(t, 6.3, 8.4);
        const kx = lerp(1330, 1900, E.inCubic(snap)) + Math.sin(t * 1.4) * 20, ky = lerp(240, -300, E.inCubic(snap)) + Math.sin(t * 2) * 12;
        const j = jamesA(t), hy = groundA(j.x) - 160;
        if (snap <= 0) { ctx.strokeStyle = C.inkSoft; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(j.x - 36, hy - 50); ctx.quadraticCurveTo(1100, 420, kx, ky + 70); ctx.stroke(); }
        else if (snap < 0.3) { ctx.strokeStyle = C.inkSoft; ctx.lineWidth = 2; ctx.globalAlpha = 1 - snap / 0.3; ctx.beginPath(); ctx.moveTo(kx, ky + 70); ctx.quadraticCurveTo(kx - 60, ky + 200, kx - 20, ky + 320); ctx.stroke(); ctx.globalAlpha = 1; }
        kite(kx, ky, t, 1 - prog(t, 7.6, 8.4));
      }
      // aunts
      const auntsIn = t > 10.2 && t < 48.6 && !(t >= 21 && t < 45.5);
      if (auntsIn) {
        let spX = HOUSE_X - 30, spY = 722, soX = HOUSE_X + 150;
        if (t > 15.6 && t < 21) spX = lerp(HOUSE_X - 30, 4020, E.inOutCubic(prog(t, 15.7, 16.6)));
        const late = t >= 45.5;
        const spP = late ? pop(t, 45.55, 0.45) : pop(t, 10.25, 0.5), soP = late ? pop(t, 45.7, 0.45) : pop(t, 11.15, 0.5);
        const loom = 1 + smooth(prog(t, 12.9, 13.9)) * 0.12 * (1 - prog(t, 15.5, 16));
        const surprised = t > 45.6;
        const point = t > 15.9 && t < 21 ? -1.9 : 0.2;
        if (soP > 0) sponge(soX, spY, 1.05 * soP * loom, t, { mood: surprised ? 'surprised' : 'mean', look: -1, armL: surprised ? -2.4 : 0.5 });
        if (spP > 0) spiker(spX, spY, 1.05 * spP * loom, t, { mood: surprised ? 'surprised' : 'mean', look: -1, armL: point, armR: surprised ? 2.4 : -0.2 });
        // the ball she pops
        if (t > 17.9 && t < 19.4) {
          const k = prog(t, 17.9, 18.55), bx = lerp(3500, 3950, E.outCubic(k)), by = 722 - 26 - Math.abs(Math.sin(k * Math.PI * 3)) * 60 * (1 - k);
          if (t < 18.62) { circ(bx, by, 26); paper('#E8503E', 0.6); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(bx, by, 16, 0.4, 2.2); ctx.stroke(); }
          else { const p = prog(t, 18.62, 19.1); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; line([[3950 + Math.cos(a) * (20 + 50 * p), 696 + Math.sin(a) * (20 + 50 * p)], [3950 + Math.cos(a) * (30 + 70 * p), 696 + Math.sin(a) * (30 + 70 * p)]], '#E8503E', 5 * (1 - p)); } }
        }
      }
      drawJamesA(t);
      drawOldMan(t);
    });
    // names
    { const sx = (850 - cam.x) * cam.z + W / 2, sy = (groundA(850) - 360 - cam.y) * cam.z + H / 2; tag('James Henry Trotter', sx + 60, sy, 2.85, t, { out: 5.6, size: 50 }); }
    if (t > 10 && t < 12.9) {
      const toS = (x, y) => [(x - cam.x) * cam.z + W / 2, (y - cam.y) * cam.z + H / 2];
      const [sx, sy] = toS(HOUSE_X - 30, 722 - 400), [ox, oy] = toS(HOUSE_X + 150, 722 - 300);
      tag('Aunt Spiker', sx - 60, sy - 30, 10.3, t, { size: 40, out: 12.7, bg: '#E7E1F0' });
      tag('Aunt Sponge', ox + 90, oy - 60, 11.2, t, { size: 40, out: 12.7, bg: '#F6DDE2' });
    }
    // weather + grade
    rain(t, stormA(t) * (1 - prog(t, 20.2, 21.5)));
    const fl = Math.max(0, 1 - Math.abs(t - 13.85) / 0.09) + Math.max(0, 1 - Math.abs(t - 14.05) / 0.06) * 0.6;
    flash(fl * 0.8);
    shout('TERRIBLE!', W / 2, 190, 13.82, t, { fill: '#8E6FD6', stroke: C.ink, dur: 2.3, size: 180, wobble: 4 });
    shout('BIGGER!', W / 2, 180, 44.66, t, { fill: C.peach2, dur: 1.9, size: 200 });
    // "Magic" whisper: dark vignette with green light
    const mg = smooth(prog(t, 28.5, 29.0)) * (1 - smooth(prog(t, 30.5, 31.1)));
    if (mg > 0) {
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = radGrad(W / 2, H / 2 - 40, 150, 900, [[0, 'rgba(10,20,10,0)'], [1, `rgba(8,14,10,${0.85 * mg})`]]); ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 26; i++) { const a = i * 0.9 + t * 1.3, rr2 = 180 + (i % 5) * 60 + Math.sin(t * 2 + i) * 20; sparkle(W / 2 + Math.cos(a) * rr2, H / 2 - 40 + Math.sin(a) * rr2 * 0.6, 8 + (i % 3) * 4, '#B8FF9A', mg * (0.5 + 0.5 * Math.sin(t * 5 + i))); }
      ctx.globalAlpha = mg; txt('magic...', W / 2, 150 + Math.sin(t * 2) * 6, 96, '#C8FFB0', FONT_SERIF, 600, 'center', true);
      ctx.restore();
    }
    // magic green tint during the spill
    grade('rgba(140,255,106,1)', 0.08 * smooth(prog(t, 33, 34)) * (1 - smooth(prog(t, 39, 40.5))), 'soft-light');
    return cam;
  }
  function drawJamesA(t) {
    const j = jamesA(t); if (!j) return;
    const gy = groundA(j.x) + (j.drop || 0) + (j.sit ? 0 : 0);
    ctx.save(); if (j.fade != null) ctx.globalAlpha *= j.fade;
    james(j.x, gy, 1, t, { ...j.pose, lean: j.lean || 0 });
    ctx.restore();
  }
  function drawOldMan(t) {
    if (t < 22.9 || t > 30.6) return;
    const k = prog(t, 22.96, 25.2), x = lerp(2980, 3420, E.inOutSine(k));
    const vanish = prog(t, 30.1, 30.5);
    ctx.save(); ctx.globalAlpha *= 1 - vanish;
    oldMan(x, 722, 1.05, t, { walk: k < 1 ? t * 5 : null, arm: t > 25.0 && t < 25.8 ? 1.3 : 0.5 });
    ctx.restore();
    if (k < 1) for (let i = 0; i < 6; i++) sparkle(x - 60 - i * 40, 600 + Math.sin(t * 4 + i) * 40, 10 - i, '#C8FFB0', 0.6 * (1 - i / 6));
    if (t > 25.0 && t < 25.6) magicBag(x + 60, 722 - 170);
    if (vanish > 0) for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; sparkle(x + Math.cos(a) * 120 * vanish, 600 + Math.sin(a) * 120 * vanish, 14 * (1 - vanish), '#C8FFB0'); }
  }

  // ======================================================================
  // WORLD B: inside the peach (53.6 - 66.6)
  // ======================================================================
  const BUGS = [
    { name: 'Grasshopper', x: 260, t0: 56.41, draw: (x, y, t) => grasshopper(x, y, 1.05, t) },
    { name: 'Ladybird', x: 580, t0: 58.12, draw: (x, y, t) => ladybird(x, y, 1.0, t) },
    { name: 'Spider', x: 1150, t0: 59.91, draw: (x, y, t) => spider(x, y, 0.95, t) },
    { name: 'Earthworm', x: 1440, t0: 61.68, draw: (x, y, t) => earthworm(x + 40, y, 0.95, t) },
    { name: 'Centipede', x: 1650, t0: 63.55, draw: (x, y, t) => centipede(x + 80, y, 0.95, t) },
  ];
  const ADJ = { Grasshopper: 'a wise', Ladybird: 'a kind', Spider: 'a gentle', Earthworm: 'a worried', Centipede: 'a very boastful' };
  const camB = [[53.6, 960, 560, 1.6], [55.3, 960, 560, 1.0, E.outCubic], [56.3, 960, 560, 1.0],
    [56.9, 300, 640, 1.55, E.inOutCubic], [58.1, 300, 640, 1.55], [58.6, 600, 640, 1.55, E.inOutCubic], [59.9, 600, 640, 1.55], [60.4, 1150, 640, 1.55, E.inOutCubic], [61.7, 1150, 640, 1.55], [62.2, 1480, 640, 1.55, E.inOutCubic], [63.5, 1480, 640, 1.55], [64.0, 1660, 620, 1.5, E.inOutCubic], [65.4, 1660, 620, 1.5], [66.4, 960, 560, 1.0, E.inOutCubic]];
  function worldB(t) {
    const cam = camAt(camB, t);
    const light = smooth(prog(t, 54.45, 55.1));
    // chamber walls: juicy peach flesh
    ctx.fillStyle = radGrad(W / 2, H / 2, 100, 1300, [[0, mix('#5A2A18', '#FFB070', light)], [0.6, mix('#3A1A10', '#F7894F', light)], [1, mix('#1A0A06', '#B84A2E', light)]]);
    ctx.fillRect(0, 0, W, H);
    layer(cam, 0.4, () => {
      // fibrous flesh strands
      ctx.save(); ctx.globalAlpha = 0.25 + 0.2 * light; const r = rng(31);
      for (let i = 0; i < 40; i++) { const x = r() * 2400 - 240, y = r() * 1300 - 100; ctx.strokeStyle = '#FFD2A0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 80, y + 40, x + 30, y + 160); ctx.stroke(); }
      ctx.restore();
      // the stone at the back: wrinkled brown wall
      ell(960, 1150, 1100, 620); paper(mix('#2A140C', '#8A4E2E', light), 1.4);
      ctx.save(); ctx.globalAlpha = 0.35; for (let i = 0; i < 12; i++) { ctx.strokeStyle = '#5A2E1A'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(200 + i * 140, 700); ctx.quadraticCurveTo(240 + i * 140, 850, 190 + i * 140, 1000); ctx.stroke(); } ctx.restore();
    });
    layer(cam, 1, () => {
      // floor
      ell(960, 1080, 1300, 230); paper(mix('#3A1A10', '#E07A45', light), 1);
      // lanterns (glow-worm lights)
      [[380, 260], [960, 200], [1540, 260]].forEach(([x, y], i) => { line([[x, -100], [x, y - 30]], '#5A2E1A', 3); glow(x, y, 260, 'rgba(255,230,140,0.6)', light); circ(x, y, 26); paper(mix('#3A2A10', '#FFE39A', light), 0.4, false); });
      // bugs
      BUGS.forEach((b, i) => {
        const y = 900;
        if (light < 0.99) { // eyes glinting in the dark first
          ctx.save(); ctx.globalAlpha = (1 - light) * (0.6 + 0.4 * Math.sin(t * 6 + i));
          [-14, 14].forEach(k => { ell(b.x + k + (i === 3 ? 100 : i === 4 ? 150 : 40), y - 200 + (i === 1 ? 60 : 0), 9, 11); flat('#FFF4C0'); });
          ctx.restore();
        }
        ctx.save(); ctx.globalAlpha *= light;
        const hi = t > b.t0 && t < b.t0 + 1.8;
        const boast = b.name === 'Centipede' ? 1 + 0.08 * Math.sin(prog(t, 63.6, 65) * Math.PI * 3) * (t > 63.6 ? 1 : 0) : 1;
        withT(b.x, y, boast, 0, () => b.draw(0, 0, t));
        ctx.restore();
        if (hi) { const p = prog(t, b.t0, b.t0 + 0.4); glow(b.x + (i >= 3 ? 80 : 0), y - 150, 330, 'rgba(255,240,200,0.28)', p * (1 - prog(t, b.t0 + 1.4, b.t0 + 1.8))); }
      });
      // James at the front
      ctx.save(); ctx.globalAlpha *= light; james(900, 1010, 0.95, t, { mood: t > 54.4 && t < 56.4 ? 'surprised' : 'awe', look: 0, armL: -0.6, armR: 0.6 }); ctx.restore();
      if (t > 63.8) for (let i = 0; i < 5; i++) sparkle(1820 + Math.cos(i * 1.3 + t * 2) * 120, 740 + Math.sin(i * 1.3 + t * 2) * 60, 12, '#FFF4C8', 1 - prog(t, 65.2, 65.8));
    });
    // name tags in screen space above the focused bug
    BUGS.forEach(b => {
      const sx = (b.x + (b.name === 'Earthworm' ? 40 : b.name === 'Centipede' ? 60 : 0) - cam.x) * cam.z + W / 2;
      tag(`${ADJ[b.name]} ${b.name}`, clamp(sx, 330, W - 330), 150, b.t0 + 0.05, t, { size: 52, out: b.t0 + 1.65, bg: C.cream });
    });
    // entering from the dark tunnel: iris opening
    const iris = prog(t, 53.6, 54.3);
    if (iris < 1) { ctx.save(); ctx.fillStyle = '#0C0604'; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(W / 2, H / 2, lerp(20, 1300, E.inCubic(iris)), 0, Math.PI * 2, true); ctx.fill('evenodd'); ctx.restore(); }
    shout('GIANT BUGS!', W / 2, 170, 54.45, t, { fill: '#8CFF6A', dur: 1.8, size: 150, wobble: 3 });
    return cam;
  }

  // ======================================================================
  // WORLD C: stem, rolling, splash (66.6 - 76.3)
  // ======================================================================
  const groundC = x => x < 900 ? 640 : x < 3200 ? 640 + (x - 900) * 0.16 + Math.sin((x - 900) * 0.004) * 30 : 2400;
  const SEA_Y = 1060;
  const PR = 290, RA = 15, RB = 100;
  function peachC(t) {
    if (t < 69.39) return { x: 620, y: groundC(620) - PR * 0.97, rot: 0 };
    const k = t - 69.39;
    let x = 620 + RA * k + RB * k * k; // accelerating downhill: reaches the aunts ~72.9 s, the cliff ~74.4 s
    const cliff = 3200;
    if (x < cliff) { const y = groundC(x) - PR * 0.97; return { x, y, rot: (x - 620) / PR }; }
    // flying off the cliff into the sea
    const tc = (-RA + Math.sqrt(RA * RA + 4 * RB * (cliff - 620))) / (2 * RB), vx = RA + 2 * RB * tc, dt = k - tc;
    const fx = cliff + vx * 0.7 * dt, fy = groundC(cliff - 1) - PR * 0.97 - 500 * dt + 1500 * dt * dt;
    const splashY = SEA_Y - PR * 0.55;
    if (fy < splashY) return { x: fx, y: fy, rot: (cliff - 620) / PR + dt * 4 };
    const ts = t - SPLASH_T;
    return { x: fx + ts * 150, y: splashY + Math.sin(t * 2.2) * 8, rot: (cliff - 620) / PR + 2 + Math.sin(t * 1.4) * 0.05, splashed: true };
  }
  const SPLASH_T = (() => {
    const cliff = 3200, tc = (-RA + Math.sqrt(RA * RA + 4 * RB * (cliff - 620))) / (2 * RB);
    const y0 = groundC(cliff - 1) - PR * 0.97, sy = SEA_Y - PR * 0.55;
    const dt = (500 + Math.sqrt(500 * 500 + 4 * 1500 * (sy - y0))) / (2 * 1500);
    return 69.39 + tc + dt;
  })();
  const camC = [[66.6, 590, 110, 1.7], [68.9, 600, 130, 1.7], [69.8, 900, 420, 1.05, E.inOutCubic]];
  function worldC(t) {
    const pk = peachC(t);
    let cam;
    if (t < 69.8) cam = camAt(camC, t);
    else { const follow = { x: Math.min(pk.x + 250, 3950), y: Math.min(pk.y + 20, 640), z: lerp(1.0, 0.72, smooth(prog(t, 73.8, 75.2))) }; cam = { x: follow.x, y: follow.y, z: follow.z }; const k = smooth(prog(t, 69.8, 70.6)); const c0 = camAt(camC, 69.8); cam = { x: lerp(c0.x, cam.x, k), y: lerp(c0.y, cam.y, k), z: lerp(c0.z, cam.z, k) }; }
    sky([[0, '#F7B98A'], [0.55, '#FCE0B8'], [1, '#FFF1D8']]);
    layer(cam, 0.05, () => { glow(1500, 300, 300, 'rgba(255,210,140,0.7)'); circ(1500, 300, 90); paper('#FFD98A', 0.3, false); });
    layer(cam, 0.2, () => { [[200, 160, 1], [1100, 110, 0.8], [2000, 190, 1.1], [3000, 140, 1], [4200, 170, 1.2]].forEach(([x, y, s]) => cloud(x + t * 8, y, s, '#FFF6EA')); });
    layer(cam, 0.45, () => {
      // distant sea
      ctx.fillStyle = linGrad(0, 800, 0, 1300, [[0, '#7CC0DA'], [1, C.sea2]]); ctx.fillRect(-2000, 820, 9000, 1400);
      hill(860, 60, 0.004, 0.5, '#A8C98A', 0.8, -2000, 2600, 9, t);
    });
    layer(cam, 1, () => {
      // sea near
      ctx.fillStyle = linGrad(0, SEA_Y - 40, 0, SEA_Y + 600, [[0, C.sea1], [1, C.sea3]]); ctx.fillRect(3000, SEA_Y - 20, 6000, 1400);
      for (let i = 0; i < 30; i++) { const x = 3100 + i * 120 + Math.sin(t * 1.5 + i) * 20; ell(x, SEA_Y - 10 + Math.sin(t * 2 + i) * 5, 50, 8); flat('rgba(234,246,248,0.7)'); }
      // land + cliff
      const pts = [[-800, 2600]]; for (let x = -800; x <= 3200; x += 40) pts.push([x, groundC(x) + boil(t, x * 0.01, 0.8)]); pts.push([3200, groundC(3199) + 30]); pts.push([3150, 2600]);
      poly(pts); paper(C.grass2, 1.2);
      poly([[3200, groundC(3199)], [3260, groundC(3199) + 120], [3180, 1300], [3100, 2600], [3050, 2600]]); paper('#A58A6A', 1);
      // the tree and house at the top
      house(-300, 642, 0.9, 999); tree(300, 642, 2.2, t, false, C.leaf, 1);
      // the stem: from branch to peach top; snaps at 69.0
      const snap = prog(t, 68.95, 69.4);
      const topX = 612, topY = groundC(620) - PR * 0.97 - PR * 0.8;
      const bx = 300 + 85 * 2.2, by = 642 - 300 * 2.2;
      if (t < 69.4) line([[bx, by], [lerp(topX, bx + 60, snap), lerp(topY, by + 60, snap)]], C.stem, 26);
      else line([[bx, by], [bx + 40, by + 90]], C.stem, 26);
      // aunts on the slope: flattened when the peach rolls over them
      const AX = 1900;
      const hit = pk.x > AX - 120 && t > 70;
      const flatK = hit ? E.outBack(clamp((pk.x - (AX - 120)) / 200)) : 0;
      spiker(AX - 70, groundC(AX - 70), 1.05, t, { mood: flatK > 0 ? 'surprised' : 'angry', armL: -2.5 + Math.sin(t * 10) * 0.3, flat: flatK, look: -1 });
      sponge(AX + 90, groundC(AX + 90), 1.05, t, { mood: flatK > 0 ? 'surprised' : 'angry', armR: 2.5 + Math.sin(t * 10) * 0.3, flat: flatK, look: -1 });
      if (flatK > 0.9) for (let i = 0; i < 4; i++) { const a = t * 5 + i * 1.57; star(AX + Math.cos(a) * 90, groundC(AX) - 90 + Math.sin(a) * 25, 14, 1 - prog(t, 74.5, 75.5)); }
      // peach (with the centipede on top before the roll)
      if (t < 69.8) centipede(topX + 70, topY + 6, 0.8, t, { chew: t < 69 ? 1 : 0 });
      peach(pk.x, pk.y, PR, t, { rot: pk.rot, hole: 1, leaf: t < 69.4, stem: t < 69.4 });
      
      // chew crumbs
      if (t < 69) for (let i = 0; i < 6; i++) { const ph = (t * 3 + i / 6) % 1; circ(topX + 10 + Math.cos(i) * 50 * ph, topY - 50 - ph * 40 + ph * ph * 160, 7 * (1 - ph)); flat('#8A5A36'); }
      // motion lines while rolling
      if (t > 69.6 && !pk.splashed && pk.x < 3200) for (let i = 0; i < 5; i++) line([[pk.x - PR - 40 - i * 10, pk.y - 150 + i * 70], [pk.x - PR - 180 - i * 25, pk.y - 150 + i * 70]], 'rgba(255,255,255,0.8)', 8);
      // splash
      if (pk.splashed) {
        const sp = prog(t, SPLASH_T, SPLASH_T + 1.2);
        for (let i = 0; i < 18; i++) { const a = -Math.PI * (0.1 + 0.8 * i / 17), v = 380 + (i % 4) * 90; const px = pk.x + Math.cos(a) * v * sp * 1.6, py = SEA_Y - 20 + Math.sin(a) * v * sp * 1.6 + 700 * sp * sp; if (sp < 1) { ell(px, py, 14, 18); flat('rgba(234,246,248,0.9)'); } }
        ell(pk.x, SEA_Y - 10, PR * 1.2, 26); flat('rgba(234,246,248,0.85)');
      }
    });
    shout('SNAP!', W / 2 + 260, 200, 68.95, t, { fill: '#F2B84B', dur: 0.9, size: 150 });
    shout('ROLLING!', W / 2, 170, 70.4, t, { fill: C.peach2, dur: 1.9, size: 190, wobble: 10 });
    shout('SPLASH!', W / 2, 180, SPLASH_T, t, { fill: '#7CC8E8', dur: 1.3, size: 180 });
    return cam;
  }

  // ======================================================================
  // WORLD S: sharks, idea, seagulls, lift (76.3 - 89.9)
  // ======================================================================
  const GULLS = (() => { const r = rng(77), a = []; for (let i = 0; i < 110; i++) a.push({ x: (r() - 0.5) * 1900, y: -560 - r() * 520, s: 0.35 + r() * 0.45, ph: r() * 6, dly: r() * 2.6, from: r() < 0.5 ? -1 : 1 }); return a; })();
  const camS = [[76.3, 960, 600, 1.05], [79.4, 960, 600, 1.1], [80.0, 960, 360, 1.9, E.inOutCubic], [81.5, 960, 360, 1.9], [82.6, 960, 300, 0.78, E.inOutCubic], [86.8, 960, 260, 0.74], [89.9, 960, -60, 0.8, E.inOutSine]];
  function worldS(t) {
    const cam = camAt(camS, t);
    const tense = smooth(prog(t, 76.3, 77.2)) * (1 - smooth(prog(t, 86.5, 88.5)));
    sky([[0, mix('#8CC8E8', '#5E6E8C', tense * 0.6)], [1, mix('#FCE9CE', '#9AA6B8', tense * 0.6)]]);
    layer(cam, 0.15, () => { [[200, 120], [900, 60], [1600, 140], [2300, 90]].forEach(([x, y], i) => cloud(x - t * 10, y - 200, 1 + (i % 2) * 0.3, mix('#FFFFFF', '#A8B0C0', tense * 0.5))); });
    const lift = E.inOutSine(prog(t, 86.92, 89.9));
    const px = 960, py = lerp(700, 180, lift) + (lift < 0.02 ? Math.sin(t * 2) * 8 : 0), pr = 230;
    layer(cam, 0.6, () => { ctx.fillStyle = linGrad(0, 640, 0, 1400, [[0, mix(C.sea1, '#3C6E88', tense * 0.5)], [1, mix(C.sea3, '#10324A', tense * 0.6)]]); ctx.fillRect(-3000, 640, 8000, 2600); });
    layer(cam, 1, () => {
      const seaY = 760;
      // sharks circling: behind the peach when sin < 0
      const sharks = [0, 2.1, 4.2].map((ph, i) => { const a = t * 1.3 + ph; return { x: 960 + Math.cos(a) * 560, y: seaY + 40 + Math.sin(a) * 90, s: 0.9 + Math.sin(a) * 0.2, back: Math.sin(a) < 0, dir: Math.cos(a + Math.PI / 2) }; });
      const sharkA = smooth(prog(t, 76.66, 77.4)) * (1 - smooth(prog(t, 88.6, 89.4)));
      const drawShark = s => { ctx.save(); ctx.globalAlpha *= sharkA; withT(s.x, s.y, [s.dir > 0 ? s.s * 1.7 : -s.s * 1.7, s.s * 1.7], 0, () => fin(0, 0, 1)); ell(s.x, s.y + 4, 110 * s.s, 12); flat('rgba(234,246,248,0.6)'); ctx.restore(); };
      sharks.filter(s => s.back).forEach(drawShark);
      // threads to the gulls
      const thread = prog(t, 82.2, 85.4);
      GULLS.forEach((g, i) => {
        const arrive = E.outCubic(prog(t, 81.9 + g.dly * 0.5, 83.6 + g.dly * 0.5));
        if (arrive <= 0) return;
        const gx = lerp(g.from * 1800 + 960, 960 + g.x, arrive) + Math.sin(t * 1.5 + g.ph) * 12, gy = lerp(-900, py + g.y * (0.8 + 0.2 * lift), arrive) + Math.sin(t * 2 + g.ph) * 8;
        if (i / GULLS.length < thread) { ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(px + (g.x / 1900) * 120, py - pr * 0.8); ctx.lineTo(gx, gy + 6); ctx.stroke(); }
        gull(gx, gy, g.s, t, g.ph);
      });
      // the peach, with James and friends on top
      peach(px, py, pr, t, { hole: 1, leaf: false, stem: false, rot: Math.sin(t * 1.2) * 0.04 });
      const topY = py - pr * 0.82;
      earthworm(px - 150, topY + 30, 0.35, t); ladybird(px - 70, topY + 8, 0.4, t); spider(px + 100, topY + 16, 0.4, t); grasshopper(px + 170, topY + 36, 0.35, t);
      james(px + 10, topY + 2, 0.55, t, { mood: t > 79.7 && t < 82 ? 'awe' : t > 86.9 ? 'happy' : 'worried', armL: t > 79.7 && t < 81.8 ? -2.6 : -0.3, armR: 0.3 });
      // idea lightbulb
      const bulb = pop(t, 79.75, 0.5) * (1 - prog(t, 81.6, 81.9));
      if (bulb > 0) withT(px + 10, topY - 190, bulb, 0, () => { glow(0, 0, 150, 'rgba(255,240,160,0.8)'); ctx.beginPath(); ctx.arc(0, -10, 36, Math.PI * 0.8, Math.PI * 2.2); ctx.lineTo(14, 30); ctx.lineTo(-14, 30); ctx.closePath(); paper('#FFE68A', 0.5); rr(-14, 30, 28, 14, 4); flat('#A09080'); });
      // water around the peach
      if (lift < 0.35) { ell(px, seaY + 30, pr * 1.2 * (1 - lift * 2), 26); flat('rgba(234,246,248,0.7)'); }
      if (lift > 0 && lift < 0.6) for (let i = 0; i < 10; i++) { const d = ((t * 1.5 + i / 10) % 1); ell(px - 120 + i * 26, py + pr * 0.9 + d * 200, 5, 9); flat(`rgba(200,235,250,${1 - d})`); }
      // a shark leaps and misses
      const leap = prog(t, 87.4, 88.4);
      if (leap > 0 && leap < 1) withT(px - 260 + leap * 380, seaY - Math.sin(leap * Math.PI) * 330, 1.1, -0.6 + leap * 1.2, () => {
        ctx.beginPath(); ctx.moveTo(-120, 0); ctx.quadraticCurveTo(0, -60, 120, 0); ctx.quadraticCurveTo(0, 50, -120, 0); ctx.closePath(); paper('#6E7E90', 0.8);
        poly([[-110, 0], [-160, -40], [-150, 30]]); flat('#6E7E90'); poly([[-10, -40], [20, -90], [40, -36]]); flat('#6E7E90');
        ctx.fillStyle = '#FFFFFF'; for (let i = 0; i < 5; i++) poly([[60 + i * 10, 8], [65 + i * 10, 20], [70 + i * 10, 8]]); ctx.fill();
        circ(70, -12, 6); flat(C.ink);
      });
      // front waves + sharks in front
      for (let i = 0; i < 26; i++) { const x = -300 + i * 110 + Math.sin(t * 1.4 + i) * 16; ell(x, seaY + 120 + (i % 3) * 30 + Math.sin(t * 2 + i) * 6, 60, 10); flat('rgba(234,246,248,0.55)'); }
      sharks.filter(s => !s.back).forEach(drawShark);
    });
    shout('CHOMP!', W / 2 - 300, 220, 87.7, t, { fill: '#F2B84B', dur: 0.9, size: 130 });
    grade('#23324A', tense * 0.18, 'multiply');
    return cam;
  }

  // ======================================================================
  // WORLD D: sky journey, cloud people, New York, landing (89.9 - 103.3)
  // ======================================================================
  function cloudPerson(x, y, s, t, seed, paint) {
    withT(x, y, s, 0, () => {
      cloud(0, 0, 2.2, '#FFFFFF', 1.2);
      circ(-30, -110, 70); paper('#FFFFFF', 1);
      face(-30, -110, 1.3, 'happy', t, 2, seed);
      // brush arm
      const a = -1.0 + Math.sin(t * 3 + seed) * 0.25;
      line([[20, -60], [20 + Math.cos(a) * 120, -60 + Math.sin(a) * 120]], '#FFFFFF', 26);
      withT(20 + Math.cos(a) * 120, -60 + Math.sin(a) * 120, 1, a, () => { rr(0, -6, 70, 12, 4); flat('#9A6A3A'); ell(80, 0, 16, 10); flat(['#E8503E', '#F2B84B', '#57B97A'][seed % 3]); });
    });
  }
  const face = PE.face;
  function rainbow(cx, cy, r, p, a = 1, rev = false) {
    if (p <= 0) return;
    const cols = ['#E8503E', '#F28E3E', '#F2D04B', '#6BC06A', '#4AA3C9', '#7A6FD6'];
    ctx.save(); ctx.globalAlpha *= a;
    cols.forEach((c, i) => { ctx.strokeStyle = c; ctx.lineWidth = 22; ctx.lineCap = 'round'; ctx.beginPath(); if (rev) ctx.arc(cx, cy, r - i * 22, 0, -Math.PI * p, true); else ctx.arc(cx, cy, r - i * 22, Math.PI, Math.PI + Math.PI * p); ctx.stroke(); });
    ctx.restore();
  }
  function flock(px, py, t, spread = 1) { GULLS.slice(0, 70).forEach(g => { const gx = px + g.x * 0.55 * spread + Math.sin(t * 1.5 + g.ph) * 10, gy = py - 300 + (g.y + 560) * 0.45 + Math.sin(t * 2 + g.ph) * 8; ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(px, py - 180); ctx.lineTo(gx, gy); ctx.stroke(); gull(gx, gy, g.s * 0.8, t, g.ph); }); }
  function worldD(t) {
    if (t < 98.9) {
      // sky journey: the peach drifts right to left across a sunset sky
      const k = prog(t, 89.9, 98.9);
      const dusk = smooth(prog(t, 94, 98.5));
      sky([[0, mix('#7FB8E0', '#6E5AA0', dusk)], [0.6, mix('#FCD9B0', '#F29A7A', dusk)], [1, mix('#FFE9C8', '#F7C08A', dusk)]]);
      // far sea
      ctx.fillStyle = linGrad(0, 860, 0, H, [[0, mix('#7CC0DA', '#8A7AB0', dusk)], [1, mix(C.sea2, '#4A4A80', dusk)]]); ctx.fillRect(0, 860, W, H - 860);
      for (let i = 0; i < 20; i++) { ell((i * 140 - t * 60) % (W + 200) + 100, 900 + (i % 4) * 40, 50, 5); flat('rgba(255,255,255,0.35)'); }
      // New York rising on the horizon
      const ny = smooth(prog(t, 96.0, 98.4));
      if (ny > 0) { ctx.save(); ctx.globalAlpha = ny; const r = rng(55); let x = 1100; while (x < 1900) { const w = 30 + r() * 50, h = 60 + r() * 160; rr(x, 866 - h * ny, w, h * ny, 2); flat('#5A4A7A'); x += w + 4; } ctx.fillStyle = '#5A4A7A'; rr(1500, 866 - 300 * ny, 30, 300 * ny, 2); ctx.fill(); line([[1515, 866 - 300 * ny], [1515, 866 - 360 * ny]], '#5A4A7A', 5); ctx.restore(); }
      // clouds, parallax layers
      [[0.3, 0.8, 300, '#FFF4EA'], [0.6, 1.1, 520, '#FFFFFF']].forEach(([sp, s, y, col], li) => { for (let i = 0; i < 6; i++) cloud(((i * 520 + 300 - t * 60 * sp * 3) % (W + 800)) - 200, y + (i % 2) * 90 + li * 60, s + (i % 3) * 0.2, mix(col, '#F7C9B8', dusk * 0.6)); });
      // cloud people painting rainbows
      const cp = smooth(prog(t, 92.1, 92.8)) * (1 - smooth(prog(t, 97.2, 98.0)));
      if (cp > 0) {
        ctx.save(); ctx.globalAlpha = cp;
        rainbow(620, 820, 420, E.inOutSine(prog(t, 92.6, 94.6)));
        rainbow(1420, 760, 300, E.inOutSine(prog(t, 93.4, 95.4)), 1, true);
        cloudPerson(330 + (1 - cp) * -300, 760, 0.9, t, 1); cloudPerson(1650 + (1 - cp) * 300, 700, 0.8, t, 2);
        ctx.restore();
      }
      // the peach and flock drifting
      const px = lerp(1500, 520, E.inOutSine(k)), py = 640 + Math.sin(t * 0.9) * 20;
      flock(px, py, t);
      peach(px, py, 150, t, { hole: 1, leaf: false, stem: false, rot: Math.sin(t) * 0.05 });
      james(px + 5, py - 118, 0.35, t, { mood: 'awe', armL: -2.4, armR: 0.3 });
      shout('New York City!', W / 2, 180, 96.3, t, { fill: '#F2D04B', dur: 2.5, size: 120 });
      return { x: W / 2, y: H / 2, z: 1 };
    }
    // Empire State landing
    const cam = camAt([[98.9, 960, 300, 0.9], [101.3, 960, 560, 1.18, E.inOutSine], [101.6, 960, 560, 1.26, E.outCubic], [103.3, 960, 580, 1.18]], t);
    sky([[0, '#4A3E7A'], [0.55, '#E88A78'], [1, '#FBC98A']]);
    layer(cam, 0.3, () => { const r = rng(61); let x = -400; while (x < 2400) { const w = 60 + r() * 90, h = 180 + r() * 300; building(x, 1180, w, h, '#7A5E8C', t, x, 0.25); x += w + 6; } });
    layer(cam, 0.6, () => { const r = rng(62); let x = -600; while (x < 2600) { const w = 90 + r() * 120, h = 260 + r() * 360; if (Math.abs(x + w / 2 - 960) > 170) building(x, 1300, w, h, '#5E4876', t, x + 1, 0.4); x += w + 10; } });
    layer(cam, 1, () => {
      empireState(960, 1400, 1.0, '#433660');
      const tipY = 1400 - 860;
      const land = prog(t, 98.9, 101.4);
      const py = lerp(-120, tipY - 150 * 0.75, E.inOutSine(land)), px = 960 + (1 - land) * 160;
      if (t < 101.5) flock(px, py, t, 0.9);
      else GULLS.slice(0, 40).forEach(g => { const k = prog(t, 101.5, 103.3); gull(px + g.x * (0.5 + k * 1.4), py - 300 - k * 700 + g.y * 0.3, g.s * 0.8, t, g.ph); });
      const sq = t > 101.4 ? 0.12 * Math.max(0, 1 - (t - 101.4) / 0.35) : 0;
      peach(px, py, 150, t, { hole: 1, leaf: false, stem: false, squash: sq });
      james(px - 10, py - 118, 0.35, t, { mood: t > 101.4 ? 'grin' : 'awe', armL: -2.4, armR: t > 101.4 ? 2.4 : 0.3 });
      // tiny cheering crowd lights
      if (t > 101.5) { const r = rng(5); for (let i = 0; i < 40; i++) sparkle(700 + r() * 520, 1220 + r() * 80, 6 + 4 * Math.sin(t * 8 + i), '#FFE39A', 0.8); }
    });
    shout('THUMP!', W / 2, 170, 101.42, t, { fill: C.peach2, dur: 1.2, size: 170 });
    return cam;
  }

  // ======================================================================
  // WORLD E: the park (103.3 - 116.9)
  // ======================================================================
  const KIDS = (() => { const r = rng(13), a = []; for (let i = 0; i < 12; i++) { const side = i % 2 ? 1 : -1; a.push({ seed: i + 3, side, x: 960 + side * (180 + r() * 260), y: 900 + r() * 90, dly: r() * 0.6 }); } return a; })();
  function stoneHouse(x, y, s, t, homey) {
    withT(x, y, s, 0, () => {
      ell(0, 0, 150, 120); paper('#9A6440', 1.2);
      ctx.save(); ctx.globalAlpha = 0.4; for (let i = 0; i < 7; i++) { ctx.strokeStyle = '#6A3E24'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-120 + i * 40, -90 + (i % 2) * 20); ctx.quadraticCurveTo(-100 + i * 40, 0, -126 + i * 40, 80); ctx.stroke(); } ctx.restore();
      if (homey > 0) {
        ctx.save(); ctx.globalAlpha = homey;
        rr(-32, 10, 64, 100, [32, 32, 0, 0]); paper('#5A3A22', 0.6); circ(18, 64, 5); flat('#E8C878');
        circ(70, -30, 28); paper('#FFE39A', 0.4); line([[42, -30], [98, -30]], '#6A3E24', 4); line([[70, -58], [70, -2]], '#6A3E24', 4);
        rr(-90, -150, 40, 70, 4); paper('#7A4A2E', 0.6);
        for (let i = 0; i < 4; i++) { const ph = (t * 0.4 + i / 4) % 1; circ(-70 + Math.sin(ph * 6) * 12, -170 - ph * 160, 16 + ph * 16); ctx.fillStyle = `rgba(255,255,255,${0.6 * (1 - ph)})`; ctx.fill(); }
        [-130, -100, 100, 130].forEach((fx, i) => { line([[fx, 110], [fx, 80]], C.leafDark, 4); circ(fx, 76, 11); flat(['#EE5A5E', '#F2B84B', '#8E6FD6', '#FFFFFF'][i]); });
        ctx.restore();
      }
    });
  }
  function worldE(t) {
    const cam = camAt([[103.3, 960, 560, 1.0], [106.5, 960, 580, 1.08], [108.6, 1120, 600, 1.2, E.inOutCubic], [110.3, 1120, 600, 1.2], [111.2, 960, 560, 1.02, E.inOutCubic], [116.9, 960, 540, 0.96, E.inOutSine]], t);
    const eve = smooth(prog(t, 108, 116));
    sky([[0, mix('#8CC8E8', '#F29A7A', eve)], [1, mix('#FDE9C9', '#FCD28A', eve)]]);
    layer(cam, 0.2, () => { const r = rng(71); let x = -400; while (x < 2400) { const w = 60 + r() * 90, h = 200 + r() * 320; building(x, 760, w, h, mix('#9AA0C0', '#8A6A8C', eve), t, x, 0.15 + eve * 0.4); x += w + 8; } rr(930, 760 - 560, 60, 560, 2); flat(mix('#9AA0C0', '#8A6A8C', eve)); line([[960, 200], [960, 130]], mix('#9AA0C0', '#8A6A8C', eve), 5); });
    layer(cam, 0.5, () => { hill(760, 30, 0.004, 1, mix('#A8CC7A', '#C2B070', eve * 0.5), 0.8, -1000, 3000, 14, t); [200, 520, 1500, 1800].forEach((x, i) => tree(x, 780, 0.55, t, false, mix(C.leaf, '#8A9A4A', eve * 0.4))); });
    layer(cam, 1, () => {
      hill(840, 20, 0.003, 0, mix(C.grass1, '#B8B060', eve * 0.4), 1, -1000, 3000, 15, t);
      // path
      ell(960, 1010, 900, 90); flat(mix('#E8D8B0', '#E8C890', eve));
      // peach being eaten, then the stone that becomes a home
      const eat = prog(t, 104.3, 106.3);
      const bites = Math.floor(eat * 7);
      const pr = lerp(250, 150, eat);
      const stoneA = smooth(prog(t, 105.9, 106.4));
      const grow = E.outBack(prog(t, 110.45, 111.4));
      const homey = smooth(prog(t, 110.8, 111.8));
      if (stoneA > 0) stoneHouse(960, 780, lerp(0.75, 1.55, grow), t, homey);
      if (stoneA < 1) { ctx.save(); ctx.globalAlpha = 1 - stoneA; peach(960, 780, pr, t, { bites, hole: 0, leaf: false, stem: false }); ctx.restore(); }
      if (eat > 0 && eat < 1) for (let i = 0; i < 10; i++) { const ph = (t * 2.2 + i / 10) % 1; circ(960 + Math.cos(i * 2.4) * (pr + 40 * ph), 780 + Math.sin(i * 2.4) * (pr * 0.6) - ph * 60, 7 * (1 - ph)); flat('#FFB070'); }
      // kids
      KIDS.forEach((k, i) => {
        const run = E.outCubic(prog(t, 103.7 + k.dly, 104.6 + k.dly));
        const aside = k.side > 0 ? E.inOutCubic(prog(t, 108.5, 109.2)) * 230 : 0;
        const x = lerp(k.side > 0 ? 2300 : -400, k.x, run) + aside, jump = Math.max(0, Math.sin(t * 7 + i)) * (t > 106.1 && t < 108 ? 30 : 6);
        if (run > 0) kid(x, k.y, 1.25, t, k.seed, { jump, arm: t > 106.1 ? 0.8 : 0 });
      });
      // James and the bugs
      const jIn = smooth(prog(t, 108.7, 109.3));
      if (jIn > 0) {
        ctx.save(); ctx.globalAlpha = jIn;
        const wave = t > 114.6;
        glow(1240, 800, 260, 'rgba(255,236,170,0.8)', jIn * (1 - smooth(prog(t, 111, 112))));
        const jp = E.outBack(prog(t, 108.75, 109.3));
        james(1240, 975, 1.4 * jp, t, { mood: 'happy', armL: wave ? -2.5 + Math.sin(t * 8) * 0.3 : -0.3, armR: 0.3, look: -1 });
        if (t < 110.2) for (let i = 0; i < 6; i++) sparkle(1240 + Math.cos(i + t * 3) * 170, 780 + Math.sin(i + t * 3) * 120, 12, '#FFF4C8', 1 - prog(t, 109.6, 110.2));
        const f = smooth(prog(t, 113.2, 114));
        ctx.globalAlpha = jIn * f;
        ladybird(700, 975, 0.78, t); spider(530, 995, 0.72, t); grasshopper(1500, 975, 0.78, t); earthworm(1700, 1000, 0.66, t); centipede(360, 1015, 0.72, t);
        ctx.restore();
      }
      // fireflies / hearts at the end
      if (t > 113.5) for (let i = 0; i < 14; i++) { const a = t * 0.8 + i; sparkle(960 + Math.cos(a) * (500 + i * 20), 500 + Math.sin(a * 1.3) * 180, 9, '#FFF1B0', 0.8 * smooth(prog(t, 113.5, 114.5))); }
    });
    return cam;
  }

  // ======================================================================
  // master
  // ======================================================================
  const SCENES = [[0, 'Once upon a time'], [5.9, 'The aunts'], [16.0, 'Chores'], [21.0, 'The old man'], [31.1, 'Magic'], [40.5, 'The peach'], [48.6, 'Night'], [53.6, 'Giant bugs'], [66.6, 'Rolling'], [76.3, 'Sharks'], [89.9, 'The sky'], [98.9, 'New York'], [103.3, 'Home'], [116.9, 'The end']];
  // torn-paper wipe used between worlds
  function pageWipe(t, t0, col = '#F4E6C8') {
    const p = prog(t, t0 - 0.35, t0 + 0.35); if (p <= 0 || p >= 1) return;
    const x = lerp(W + 300, -300 - W, E.inOutCubic(p));
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.shadowColor = 'rgba(40,20,10,0.4)'; ctx.shadowBlur = 30; ctx.shadowOffsetX = -10;
    ctx.beginPath(); ctx.moveTo(x, -10);
    for (let y = 0; y <= H + 20; y += 30) ctx.lineTo(x + Math.sin(y * 0.05) * 18 + nz(y * 0.1) * 14, y);
    ctx.lineTo(x + W + 400, H + 20); ctx.lineTo(x + W + 400, -10); ctx.closePath();
    ctx.fillStyle = col; ctx.fill();
    ctx.restore();
  }
  function renderAt(t) {
    t = clamp(t, 0, D - 1e-4);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    const sh = shakeAt(t, [[13.82, 10], [31.5, 8], [44.66, 10], [69.0, 8], [72.9, 12], [101.42, 18]]);
    if (sh > 0) ctx.translate(Math.sin(t * 97) * sh, Math.cos(t * 83) * sh);
    let vign = 0.35;
    if (t < 53.6) worldA(t);
    else if (t < 66.6) { worldB(t); vign = 0.5; }
    else if (t < 76.3) worldC(t);
    else if (t < 89.9) worldS(t);
    else if (t < 103.3) worldD(t);
    else if (t < 117.25) worldE(t);
    // book cover at the start and "The End" at the finish
    if (t < 1.9) {
      const open = E.inOutCubic(prog(t, 0.9, 1.9));
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.translate(0, 0); ctx.transform(1 - open, 0, -open * 0.25, 1, 0, 0);
      ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 40;
      if (open < 0.999) cover(t);
      ctx.restore();
    }
    if (t >= 116.9) {
      const close = E.inOutCubic(prog(t, 117.2, 118.1));
      if (close < 1) { worldE(t); }
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.transform(close, 0, -(1 - close) * 0.25, 1, 0, 0);
      if (close > 0.001) cover(t, 'The End');
      ctx.restore();
    }
    pageWipe(t, 53.6, '#1A0E08'); pageWipe(t, 66.6); pageWipe(t, 76.3, '#DDEFF6'); pageWipe(t, 89.9, '#FCE3C0'); pageWipe(t, 98.9, '#F2B89A'); pageWipe(t, 103.3, '#F4E6C8');
    finish(t, vign);
  }
  window.PEACH = { renderAt, D, SCENES, SPLASH_T };
})();
