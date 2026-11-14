// ============================================================
// Trailcross Overland — site interactions
// ============================================================

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Scroll reveal + counters (held until the intro finishes) ---------- */
  var motionStarted = false;
  function startMotion() {
    if (motionStarted) return;
    motionStarted = true;

    var revealEls = document.querySelectorAll('.reveal, .reveal-stagger');

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      // Fallback: no IntersectionObserver support — just show everything
      revealEls.forEach(function (el) { el.classList.add('in'); });
    }

    // Safety net: if anything is still hidden 2.5s after load (e.g. this
    // script failed to load correctly, or an element sits off-screen and
    // is never scrolled to), force it visible so the page is never blank.
    setTimeout(function () {
      document.querySelectorAll('.reveal:not(.in), .reveal-stagger:not(.in)')
        .forEach(function (el) { el.classList.add('in'); });
    }, 2500);


    var counters = document.querySelectorAll('.count[data-count]');

    function animateCounter(el) {
      var target = parseInt(el.getAttribute('data-count'), 10) || 0;
      var suffix = el.getAttribute('data-suffix') || '';
      var duration = 1400;
      var startTime = null;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        var current = Math.floor(eased * target);
        el.textContent = current.toLocaleString() + suffix;
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = target.toLocaleString() + suffix;
        }
      }
      requestAnimationFrame(step);
    }

    if (counters.length && 'IntersectionObserver' in window) {
      var counterIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterIo.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });

      counters.forEach(function (el) { counterIo.observe(el); });
    } else {
      counters.forEach(function (el) { animateCounter(el); });
    }
  }

  /* ---------- Mobile nav toggle ---------- */
  var navToggle = document.querySelector('.nav-toggle');
  var navLinks = document.querySelector('.nav-links');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var isOpen = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Logo intro (home page only, once per visit) ---------- */
  var intro = document.getElementById('intro');
  var root = document.documentElement;
  var introOn = intro && !root.classList.contains('no-intro');

  function runIntro() {
    try { sessionStorage.setItem('tcIntroSeen', '1'); } catch (e) {}
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var done = false;
    // logo triangle in the artwork's own coordinates (from the vector file)
    var TRI = [[151, 346], [444, 346], [297.5, 544]];

    function finish() {
      intro.remove();
      root.classList.remove('intro-lock');
      var e = document.querySelector('.portal-edge'); if (e) e.remove();
    }

    function openPortal() {
      var svg = intro.querySelector('.intro-logo-svg'), r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal, k = r.width / vb.width;
      var T = TRI.map(function (p) { return [r.left + (p[0] - vb.x) * k, r.top + (p[1] - vb.y) * k]; });
      var cx = (T[0][0] + T[1][0] + T[2][0]) / 3, cy = (T[0][1] + T[1][1] + T[2][1]) / 3;
      var vw = innerWidth, vh = innerHeight, w0 = T[1][0] - T[0][0], h0 = T[2][1] - T[0][1];
      var M = 1.6 * (vw / w0 + vh / h0) + 2;
      var ns = 'http://www.w3.org/2000/svg', es = document.createElementNS(ns, 'svg'), poly = document.createElementNS(ns, 'polygon');
      es.setAttribute('class', 'portal-edge'); es.setAttribute('width', vw); es.setAttribute('height', vh);
      es.appendChild(poly); document.body.appendChild(es);
      intro.style.pointerEvents = 'none';
      var t0 = performance.now(), dur = 1500;
      (function frame(now) {
        var t = Math.min((now - t0) / dur, 1), m = 1 + (M - 1) * Math.pow(t, 3.2);
        var P = T.map(function (p) { return [cx + (p[0] - cx) * m, cy + (p[1] - cy) * m]; });
        var hole = P.map(function (p) { return p[0] + 'px ' + p[1] + 'px'; });
        var clip = 'polygon(evenodd, 0 0, ' + vw + 'px 0, ' + vw + 'px ' + vh + 'px, 0 ' + vh + 'px, 0 0, ' + hole[0] + ', ' + hole[1] + ', ' + hole[2] + ', ' + hole[0] + ', 0 0)';
        intro.style.clipPath = clip; intro.style.webkitClipPath = clip;
        poly.setAttribute('points', P.map(function (p) { return p[0] + ',' + p[1]; }).join(' '));
        if (t < 1) requestAnimationFrame(frame); else finish();
      })(t0);
    }

    function enter() {
      if (done) return;
      done = true;
      intro.classList.add('leaving');
      setTimeout(startMotion, reduce ? 200 : 900);
      if (reduce) { intro.style.transition = 'opacity .4s'; intro.style.opacity = 0; setTimeout(finish, 450); }
      else openPortal();
    }

    intro.addEventListener('click', enter);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' || e.key === 'Enter') enter(); });
    setTimeout(enter, reduce ? 1500 : 8400);   // auto-enter
  }

  if (introOn) {
    runIntro();
  } else {
    if (intro) intro.remove();
    root.classList.remove('intro-lock');
    startMotion();
  }

});
