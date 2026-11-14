// Trailcross Overland — "One life." scroll story (canvas crowd + one diamond that leaves it)
(function () {
  var S = document.getElementById('story'); if (!S) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) { S.classList.add('static'); return; }
  var pin = S.querySelector('.story-pin'), cv = S.querySelector('.story-canvas'), ctx = cv.getContext('2d');
  var bar = S.querySelector('.story-prog i'), stepEl = S.querySelector('.story-step');
  var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), dots = [], p = 0, stage = 0, f = .25, raf = 0;
  var clamp = function (v) { return Math.max(0, Math.min(1, v)); };
  var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

  function size() {
    W = pin.clientWidth; H = pin.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.round(Math.min(380, (W * H) / 4200)); dots = [];
    for (var i = 0; i < n; i++) dots.push({ x: Math.random(), y: Math.random(), r: .8 + Math.random() * 1.6, vx: (Math.random() - .5) * .00006 - .00003, vy: (Math.random() - .5) * .00004, a: .25 + Math.random() * .55, ph: Math.random() * 6.28 });
  }
  function progress() {
    var r = S.getBoundingClientRect(), total = S.offsetHeight - window.innerHeight;
    p = clamp(total > 0 ? -r.top / total : 0);
    var st = p < .16 ? 1 : p < .4 ? 2 : p < .68 ? 3 : 4;
    if (st !== stage) { stage = st; S.setAttribute('data-stage', st); if (stepEl) stepEl.textContent = '0' + st + ' / 04'; }
    if (bar) bar.style.transform = 'scaleX(' + p + ')';
  }
  function bez(t, P) {
    var u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
    return [a * P[0][0] + b * P[1][0] + c * P[2][0] + d * P[3][0], a * P[0][1] + b * P[1][1] + c * P[2][1] + d * P[3][1]];
  }
  function draw(now) {
    ctx.clearRect(0, 0, W, H);
    var target = stage === 1 ? .25 : stage === 2 ? 1 : stage === 3 ? .38 : .2; f += (target - f) * .06;
    for (var i = 0; i < dots.length; i++) {
      var d = dots[i]; d.x += d.vx * 16; d.y += d.vy * 16;
      if (d.x < 0) d.x = 1; if (d.x > 1) d.x = 0; if (d.y < 0) d.y = 1; if (d.y > 1) d.y = 0;
      ctx.fillStyle = 'rgba(244,241,232,' + (d.a * f * (.75 + .25 * Math.sin(now * .0015 + d.ph))).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(d.x * W, d.y * H, d.r, 0, 6.283); ctx.fill();
    }
    var P = [[.16 * W, .64 * H], [.30 * W, .98 * H], [.52 * W, .10 * H], [.90 * W, .34 * H]];
    var vis = clamp((p - .1) / .08); if (vis <= 0) return;
    if (stage >= 2) {                                  // faint planned route
      ctx.save(); ctx.setLineDash([6, 10]); ctx.strokeStyle = 'rgba(232,106,51,' + (.28 * vis) + ')'; ctx.lineWidth = 1.5; ctx.beginPath();
      ctx.moveTo(P[0][0], P[0][1]); ctx.bezierCurveTo(P[1][0], P[1][1], P[2][0], P[2][1], P[3][0], P[3][1]); ctx.stroke(); ctx.restore();
    }
    var t = ease(clamp((p - .28) / .6)), len = Math.min(t, .4);
    for (var k = 0; k < 34; k++) {                     // comet trail
      var q = bez(Math.max(0, t - (k / 34) * len), P), al = (1 - k / 34) * .85 * vis;
      ctx.fillStyle = 'rgba(232,106,51,' + al.toFixed(3) + ')'; ctx.beginPath(); ctx.arc(q[0], q[1], (1 - k / 34) * 4.5 + 1, 0, 6.283); ctx.fill();
    }
    var c = bez(t, P), pulse = 1 + .18 * Math.sin(now * .004);
    ctx.save(); ctx.translate(c[0], c[1]); ctx.rotate(Math.PI / 4); ctx.scale(pulse, pulse);
    ctx.shadowColor = 'rgba(232,106,51,.95)'; ctx.shadowBlur = 28; ctx.fillStyle = 'rgba(232,106,51,' + vis + ')'; ctx.fillRect(-7, -7, 14, 14);
    ctx.restore();
  }
  function loop(now) { progress(); draw(now); raf = requestAnimationFrame(loop); }
  size(); progress();
  window.addEventListener('resize', function () { size(); progress(); });
  new IntersectionObserver(function (e) {
    if (e[0].isIntersecting) { if (!raf) raf = requestAnimationFrame(loop); } else { cancelAnimationFrame(raf); raf = 0; }
  }, { rootMargin: '100px' }).observe(S);
})();
