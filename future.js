// Trailcross Overland — futuristic layer (HUD, floating header, decode headline, pointer light)
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && matchMedia('(pointer:fine)').matches && innerWidth > 900;

  /* ---- floating header: hides on scroll down, returns on scroll up ---- */
  var header = document.querySelector('.site-header'), menu = document.querySelector('.nav-links'), last = 0;
  var hudDot, hudPct;
  function onScroll() {
    var y = window.pageYOffset;
    if (header) {
      header.classList.toggle('solid', y > 40);
      var open = menu && menu.classList.contains('open');
      if (y > last && y > 240 && !open) header.classList.add('hide');
      else if (y < last) header.classList.remove('hide');
    }
    last = y;
    if (hudDot) {
      var max = document.documentElement.scrollHeight - innerHeight, p = max > 0 ? Math.min(y / max, 1) : 0;
      hudDot.style.top = (p * 100) + '%';
      hudPct.textContent = 'Route ' + String(Math.round(p * 100)).padStart(3, '0') + '%';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- HUD frame, route rail, coordinates, cursor ring ---- */
  if (fine) {
    root.classList.add('hud-on');
    var hud = document.createElement('div'); hud.className = 'hud';
    hud.innerHTML = '<i class="c1"></i><i class="c2"></i><i class="c3"></i><i class="c4"></i>' +
      '<span class="hud-xy">X 0000&nbsp;&nbsp;Y 0000</span>' +
      '<div class="hud-rail"><span class="hud-dot"></span></div><span class="hud-pct">Route 000%</span>';
    document.body.appendChild(hud);
    hudDot = hud.querySelector('.hud-dot'); hudPct = hud.querySelector('.hud-pct');
    var xy = hud.querySelector('.hud-xy');
    var ring = document.createElement('div'); ring.className = 'hud-ring'; document.body.appendChild(ring);
    var tx = -100, ty = -100, rx = -100, ry = -100;
    window.addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
      xy.innerHTML = 'X ' + String(tx).padStart(4, '0') + '&nbsp;&nbsp;Y ' + String(ty).padStart(4, '0');
      var big = e.target.closest && e.target.closest('a, button, .btn, input, select, textarea');
      ring.classList.toggle('big', !!big);
    }, { passive: true });
    (function loop() { rx += (tx - rx) * .18; ry += (ty - ry) * .18; ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)'; requestAnimationFrame(loop); })();
    onScroll();
  }

  /* ---- headline: a beam of light sweeps across and focuses the text ---- */
  var HERO = document.querySelector('.photo-hero h1, .page-hero h1');
  var MASK = 'linear-gradient(90deg,#000 0,#000 46%,transparent 50%,transparent 100%)';
  function clearHero() {
    if (!HERO) return; var s = HERO.style;
    s.webkitMaskImage = s.maskImage = 'none'; s.filter = '';
  }
  function holdHero() {            // hide the headline until its moment
    if (!HERO || reduce) return; var s = HERO.style;
    s.webkitMaskImage = s.maskImage = MASK;
    s.webkitMaskSize = s.maskSize = '200% 100%';
    s.webkitMaskRepeat = s.maskRepeat = 'no-repeat';
    s.webkitMaskPosition = s.maskPosition = '100% 0';
    s.filter = 'blur(10px)';
    setTimeout(clearHero, 14000);  // safety net
  }
  function startHero() {
    if (!HERO || reduce) return;
    var w = HERO.offsetWidth, dur = 1800, ease = 'cubic-bezier(.6,.05,.2,1)';
    var beam = document.createElement('div'); beam.className = 'hero-beam';
    beam.style.cssText = 'left:' + HERO.offsetLeft + 'px;top:' + (HERO.offsetTop - 8) + 'px;height:' + (HERO.offsetHeight + 16) + 'px';
    HERO.parentNode.appendChild(beam);
    var a = HERO.animate([
      { maskPosition: '100% 0', webkitMaskPosition: '100% 0', filter: 'blur(10px)' },
      { maskPosition: '0% 0', webkitMaskPosition: '0% 0', filter: 'blur(0px)' }
    ], { duration: dur, easing: ease, fill: 'forwards' });
    beam.animate([
      { transform: 'translateX(0)', opacity: 0 }, { opacity: 1, offset: .1 }, { opacity: 1, offset: .88 },
      { transform: 'translateX(' + w + 'px)', opacity: 0 }
    ], { duration: dur, easing: ease, fill: 'forwards' });
    a.onfinish = function () { clearHero(); a.cancel(); beam.remove(); };
  }
  holdHero();

  /* ---- hero decodes as the portal opens ---- */
  var intro = document.getElementById('intro');
  if (intro && !root.classList.contains('no-intro')) {
    new MutationObserver(function (m, ob) {
      if (intro.classList.contains('leaving')) { ob.disconnect(); setTimeout(startHero, 900); }
    }).observe(intro, { attributes: true, attributeFilter: ['class'] });
  } else { setTimeout(startHero, 350); }

  /* ---- intro caption: starts after the logo draws; coordinates travel Mumbai → London ---- */
  if (intro && !root.classList.contains('no-intro')) {
    var la = intro.querySelector('.geo-lat'), lo = intro.querySelector('.geo-lon');
    var A = [19.0760, 72.8777], B = [51.5072, -0.1276];
    var fmt = function (v, p, n) { return Math.abs(v).toFixed(4) + '\u00B0' + (v >= 0 ? p : n); };
    var countGeo = function () {
      var t0 = performance.now() + 300, D = 2600;
      (function f(now) {
        var t = Math.max(0, Math.min((now - t0) / D, 1)), e = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        if (la) la.textContent = fmt(A[0] + (B[0] - A[0]) * e, 'N', 'S');
        if (lo) lo.textContent = fmt(A[1] + (B[1] - A[1]) * e, 'E', 'W');
        if (t < 1 && document.body.contains(intro)) requestAnimationFrame(f);
      })(t0);
    };
    setTimeout(function () { intro.classList.add('go'); if (!reduce) countGeo(); else { if (la) la.textContent = fmt(B[0], 'N', 'S'); if (lo) lo.textContent = fmt(B[1], 'E', 'W'); } }, reduce ? 200 : 3300);
  }

  /* ---- header mark: real vector logo symbol, compass needle swings ---- */
  var SYMBOL = '<svg viewBox="146.7 181.5 301.6 366.3" aria-hidden="true"><path class="dk" d="M 345.417969 470.394531 C 342.773438 468.546875 340.332031 466.664062 337.730469 465.046875 C 323.546875 456.234375 309.1875 447.703125 295.191406 438.609375 C 290.414062 435.5 285.992188 431.46875 282.351562 427.078125 C 277.375 421.078125 278.015625 414.429688 283.730469 409.082031 C 287.183594 405.851562 291.179688 402.902344 295.425781 400.871094 C 304.707031 396.433594 314.398438 392.867188 323.738281 388.539062 C 329.132812 386.039062 334.425781 383.121094 339.273438 379.699219 C 342.738281 377.25 342.507812 373.628906 339.347656 370.714844 C 337.617188 369.117188 335.554688 367.585938 333.359375 366.847656 C 325.425781 364.171875 317.410156 361.699219 309.34375 359.449219 C 305.601562 358.402344 301.667969 358.035156 297.820312 357.355469 C 298.621094 358.285156 299.578125 358.503906 300.472656 358.871094 C 306.734375 361.453125 313.269531 363.542969 319.144531 366.820312 C 324.6875 369.914062 324.074219 374.992188 318.269531 377.703125 C 315.113281 379.171875 311.734375 380.214844 308.386719 381.195312 C 294.953125 385.132812 281.40625 388.703125 268.070312 392.933594 C 258.425781 395.992188 249.234375 400.246094 241.246094 406.691406 C 230.210938 415.59375 226.378906 428.433594 231.554688 441.640625 C 233.828125 447.445312 236.847656 453.136719 240.492188 458.183594 C 256.242188 479.996094 272.34375 501.550781 288.320312 523.195312 C 291.277344 527.199219 294.257812 531.179688 297.390625 535.386719 C 298.226562 534.296875 298.902344 533.449219 299.546875 532.582031 C 305.789062 524.136719 312.019531 515.683594 318.277344 507.25 C 319.640625 505.414062 321.367188 503.742188 319.839844 501.148438 C 319.714844 500.9375 320.226562 500.347656 320.472656 499.871094 C 321.328125 500.320312 322.050781 500.699219 322.761719 501.074219 C 330.328125 490.824219 337.746094 480.78125 345.417969 470.394531 M 150.660156 345.960938 L 202.644531 345.960938 C 201.261719 349.703125 198.964844 351.042969 195.082031 350.9375 C 184.886719 350.660156 174.675781 350.84375 164.46875 350.84375 L 160.625 350.84375 C 181.984375 379.632812 202.925781 407.855469 224.136719 436.441406 C 224.246094 435.78125 224.375 435.460938 224.335938 435.15625 C 222.40625 418.988281 230.082031 407.882812 243.234375 399.882812 C 253.230469 393.808594 264.210938 389.988281 275.453125 387 C 285.308594 384.378906 295.300781 382.265625 305.167969 379.683594 C 309.492188 378.550781 313.800781 377.117188 317.855469 375.25 C 321.453125 373.59375 321.585938 370.945312 318.375 368.574219 C 315.988281 366.8125 313.304688 365.363281 310.582031 364.164062 C 300.261719 359.617188 289.355469 357.09375 278.292969 355.15625 C 277.921875 355.089844 277.550781 355.019531 277.183594 354.953125 C 277.214844 354.652344 277.253906 354.351562 277.289062 354.050781 C 286.363281 355.070312 295.53125 355.574219 304.480469 357.246094 C 313.582031 358.949219 322.542969 361.554688 331.414062 364.273438 C 334.753906 365.292969 337.882812 367.445312 340.707031 369.605469 C 344.453125 372.464844 344.949219 377.078125 341.574219 380.363281 C 338.550781 383.308594 334.960938 385.941406 331.167969 387.78125 C 320.914062 392.75 310.359375 397.089844 300.054688 401.960938 C 296.015625 403.875 292.117188 406.257812 288.535156 408.9375 C 281.066406 414.53125 280.464844 421.300781 287.257812 427.644531 C 291.523438 431.632812 296.445312 435.082031 301.519531 438 C 315.816406 446.21875 330.351562 454.035156 344.78125 462.027344 C 346.339844 462.890625 347.835938 463.867188 349.5 464.878906 C 377.6875 426.96875 405.761719 389.203125 434.136719 351.039062 C 432.628906 350.945312 431.675781 350.839844 430.722656 350.839844 C 420.316406 350.828125 409.902344 350.585938 399.511719 350.960938 C 395.4375 351.109375 393.546875 349.359375 392.035156 345.886719 L 444.234375 345.886719 C 395.179688 412 346.371094 477.789062 297.421875 543.761719 C 248.511719 477.847656 199.734375 412.105469 150.660156 345.960938 "/><path class="dk" d="M 353.828125 313.429688 C 350.886719 316.734375 348.132812 319.898438 345.28125 322.976562 C 344.230469 324.109375 344.171875 325.011719 344.917969 326.382812 C 351.597656 338.6875 358.195312 351.035156 364.808594 363.375 C 365.261719 364.21875 365.644531 365.101562 365.644531 366.199219 C 362.800781 361.828125 359.972656 357.449219 357.113281 353.089844 C 344.503906 333.851562 331.8125 314.667969 319.296875 295.371094 C 312.667969 285.152344 306.332031 274.746094 299.867188 264.417969 C 299.089844 263.171875 298.351562 261.898438 297.257812 260.078125 C 296.1875 262.578125 295.34375 264.472656 294.5625 266.386719 C 289.417969 278.972656 284.355469 291.589844 279.089844 304.121094 C 278.148438 306.363281 278.414062 307.925781 279.660156 309.875 C 286.886719 321.15625 293.992188 332.515625 301.132812 343.851562 C 301.335938 344.175781 301.472656 344.546875 301.117188 345.367188 C 289.78125 333.425781 278.441406 321.488281 266.8125 309.234375 C 253.039062 330.238281 239.371094 351.078125 225.703125 371.917969 C 225.550781 371.835938 225.398438 371.753906 225.246094 371.671875 C 233.667969 356.066406 242.089844 340.460938 250.707031 324.492188 C 247.609375 320.960938 244.332031 317.230469 240.921875 313.34375 C 224.648438 333.726562 208.527344 353.914062 192.410156 374.101562 C 206.933594 350.15625 223.328125 327.5625 240.503906 305.089844 C 244.917969 310.121094 249.175781 314.976562 253.605469 320.03125 C 268.160156 296.871094 282.59375 273.90625 297.40625 250.335938 C 312.191406 273.863281 326.589844 296.785156 341.179688 319.996094 C 345.488281 315.089844 349.738281 310.246094 354.261719 305.09375 C 371.058594 327.101562 387.300781 349.199219 401.414062 372.859375 C 385.640625 353.15625 369.863281 333.457031 353.828125 313.429688 "/><path class="dk" d="M 322.320312 504.1875 L 311.710938 494.785156 L 313.855469 492.386719 L 324.566406 501.46875 Z M 322.320312 504.1875 "/><path class="dk" d="M 301.386719 485.101562 L 291.339844 475.125 L 293.179688 473.289062 L 303.382812 482.984375 Z M 301.386719 485.101562 "/><path class="dk" d="M 281.636719 464.808594 L 272.40625 454.058594 L 273.929688 452.796875 L 283.320312 463.253906 Z M 281.636719 464.808594 "/><path class="dk" d="M 263.898438 442.703125 C 261.238281 438.78125 258.761719 434.71875 256.75 430.398438 L 257.976562 429.816406 C 260.035156 433.988281 262.558594 437.9375 265.269531 441.75 Z M 263.898438 442.703125 "/><path class="dk" d="M 257.6875 416.238281 C 259.882812 411.925781 263.316406 408.453125 267.046875 405.554688 L 267.503906 406.136719 C 263.890625 409.066406 260.628906 412.542969 258.628906 416.703125 Z M 257.6875 416.238281 "/><path class="dk" d="M 279.171875 398.257812 C 283.425781 396.214844 287.816406 394.488281 292.269531 392.964844 L 292.308594 393.074219 C 287.894531 394.699219 283.546875 396.519531 279.359375 398.640625 Z M 279.171875 398.257812 "/><g class="sym-arrow"><path class="dk" d="M 296.90625 185.464844 L 296.917969 225.6875 L 275.289062 236.199219 Z M 296.90625 185.464844 "/><path class="dk" d="M 296.917969 185.464844 L 296.90625 225.6875 L 318.535156 236.199219 Z M 296.917969 185.464844 "/><path class="au" d="M 296.917969 191.914062 L 312.917969 229.5 L 296.917969 221.175781 Z M 296.917969 191.914062 "/></g></svg>';
  document.querySelectorAll('.brand-logo').forEach(function (img) {
    var w = document.createElement('span'); w.className = 'brand-svg'; w.innerHTML = SYMBOL; img.replaceWith(w);
  });
})();
