/* =========================================================
   ACE Spaces — main.js
   Header state · mobile menu · smooth scroll · active link
   Scroll reveal · counters · plan toggle · testimonial slider
   FAQ accordion · back-to-top
   ========================================================= */
(function () {
  'use strict';

  var doc = document;
  var header = doc.getElementById('siteHeader');
  var nav = doc.getElementById('mainNav');
  var toggle = doc.getElementById('navToggle');
  var toTop = doc.getElementById('toTop');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Year ---------- */
  doc.querySelectorAll('.js-year').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Exact desktop stage scale ----------
     Stage is 1920px wide; content column is 1366px. Scale so the
     content column fits the viewport with 24px side margins. */
  function setScale() {
    var w = doc.documentElement.clientWidth;
    var s = Math.min(1, (w - 48) / 1366);
    doc.documentElement.style.setProperty('--s', s.toFixed(4));
  }
  setScale();
  window.addEventListener('resize', setScale);

  /* ---------- Header + back-to-top on scroll ---------- */
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    header.classList.toggle('is-scrolled', y > 20);
    toTop.classList.toggle('is-visible', y > 700);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    toggle.querySelector('use').setAttribute('href', open ? '#i-close' : '#i-menu');
  }
  toggle.addEventListener('click', function () {
    setMenu(!nav.classList.contains('is-open'));
  });
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });

  /* ---------- Smooth scroll for in-page links ---------- */
  doc.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;
    var id = link.getAttribute('href');
    if (id === '#' ) { e.preventDefault(); return; }
    var target = doc.querySelector(id);
    if (!target) return;
    // a target inside a hidden layout (desktop vs mobile) -> use its section
    if (!target.offsetParent && target !== doc.body) target = target.closest('section, footer') || target;
    e.preventDefault();
    setMenu(false);
    var top = target.getBoundingClientRect().top + window.pageYOffset - header.offsetHeight;
    if (id === '#home') top = 0;
    if (window.aceScrollTo) window.aceScrollTo(top);
    else window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
    history.replaceState(null, '', id);
  });

  /* ---------- Active nav link ---------- */
  var navLinks = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]:not(.btn)'));
  var sectionMap = { home: '#home', why: '#why', spaces: '#spaces', locations: '#locations', contact: '#contact' };
  if ('IntersectionObserver' in window) {
    var activeObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var href = sectionMap[entry.target.id];
        if (!href) return;
        navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === href); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(sectionMap).forEach(function (id) {
      var el = doc.getElementById(id);
      if (el) activeObs.observe(el);
    });
  }

  /* ---------- Scroll reveal ---------- */
  var reveals = doc.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealObs = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { revealObs.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Counters ---------- */
  function animateCounter(el) {
    var target = parseInt(el.getAttribute('data-target'), 10) || 0;
    if (reduceMotion) { el.textContent = target; return; }
    var start = null, duration = 1600;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = doc.querySelectorAll('.counter');
  if ('IntersectionObserver' in window && !reduceMotion) {
    counters.forEach(function (c) { c.textContent = '0'; });
    var countObs = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { animateCounter(entry.target); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { countObs.observe(c); });
  } else {
    counters.forEach(function (c) { c.textContent = c.getAttribute('data-target'); });
  }

  /* ---------- Plan toggle ---------- */
  var planButtons = doc.querySelectorAll('.plan-toggle button');
  planButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      planButtons.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
    });
  });

  /* ---------- Testimonial slider ---------- */
  var track = doc.getElementById('sliderTrack');
  var dotsWrap = doc.getElementById('sliderDots');
  if (track) {
    var cards = Array.prototype.slice.call(track.querySelectorAll('.t-card'));
    var current = cards.findIndex(function (c) { return c.classList.contains('is-featured'); });
    if (current < 0) current = 0;
    var isCarousel = function () { return window.matchMedia('(max-width: 1024px)').matches; };

    var dots = cards.map(function (card, i) {
      var d = doc.createElement('button');
      d.type = 'button';
      d.setAttribute('role', 'tab');
      d.setAttribute('aria-label', 'Show testimonial ' + (i + 1));
      d.addEventListener('click', function () { go(i, true); });
      dotsWrap.appendChild(d);
      return d;
    });

    function render(scroll) {
      cards.forEach(function (c, i) { c.classList.toggle('is-featured', i === current); });
      dots.forEach(function (d, i) { d.setAttribute('aria-selected', String(i === current)); });
      if (scroll && isCarousel()) {
        var card = cards[current];
        track.scrollTo({ left: card.offsetLeft - (track.clientWidth - card.clientWidth) / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    }
    function go(i, scroll) {
      current = (i + cards.length) % cards.length;
      render(scroll);
    }

    doc.querySelector('.slider-prev').addEventListener('click', function () { go(current - 1, true); stopAuto(); });
    doc.querySelector('.slider-next').addEventListener('click', function () { go(current + 1, true); stopAuto(); });

    // keep dots in sync when the user swipes on mobile
    var swipeTimer;
    track.addEventListener('scroll', function () {
      if (!isCarousel()) return;
      clearTimeout(swipeTimer);
      swipeTimer = setTimeout(function () {
        var mid = track.scrollLeft + track.clientWidth / 2;
        var best = 0, bestDist = Infinity;
        cards.forEach(function (c, i) {
          var dist = Math.abs(c.offsetLeft + c.clientWidth / 2 - mid);
          if (dist < bestDist) { bestDist = dist; best = i; }
        });
        if (best !== current) { current = best; render(false); }
      }, 90);
    }, { passive: true });

    // gentle autoplay, paused on hover / focus / after manual use
    var auto = null;
    function startAuto() { if (!reduceMotion && !auto) auto = setInterval(function () { go(current + 1, true); }, 6000); }
    function stopAuto() { clearInterval(auto); auto = null; }
    var slider = doc.getElementById('testimonials');
    slider.addEventListener('mouseenter', stopAuto);
    slider.addEventListener('focusin', stopAuto);
    slider.addEventListener('touchstart', stopAuto, { passive: true });

    render(false);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) startAuto(); else stopAuto(); });
      }, { threshold: 0.4 }).observe(slider);
    }
  }

  /* ---------- FAQ accordion (smooth height via CSS grid rows) ---------- */
  function setPanel(item, open) {
    var btn = item.querySelector('.acc-btn');
    var panel = item.querySelector('.acc-panel');
    item.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    panel.setAttribute('aria-hidden', String(!open));
    if ('inert' in panel) panel.inert = !open;
  }
  doc.querySelectorAll('.accordion').forEach(function (acc) {
    var items = acc.querySelectorAll('.acc-item');
    items.forEach(function (item) {
      setPanel(item, item.classList.contains('is-open'));
      item.querySelector('.acc-btn').addEventListener('click', function () {
        var willOpen = !item.classList.contains('is-open');
        items.forEach(function (other) { if (other !== item) setPanel(other, false); });
        setPanel(item, willOpen);
      });
    });
  });

  /* ---------- Section-by-section scrolling (desktop) ----------
     One wheel / PageUp / PageDown / arrow step moves a whole section.
     A section taller than the screen is shown in two steps (top, then
     bottom) so nothing is ever skipped. Phones keep normal scrolling. */
  (function () {
    var mq = window.matchMedia('(min-width: 1100px)');
    var sections = Array.prototype.slice.call(doc.querySelectorAll('main > section, body > footer'));
    var animating = false, lastEnd = 0, lastWheel = 0;
    var GAP = 2;
    var MIN_REST = 160; // a hidden remainder smaller than this (mostly section padding) is not worth its own step

    function headerH() { return header.offsetHeight; }
    function topOf(el) { return el.getBoundingClientRect().top + window.pageYOffset; }
    function maxScroll() { return doc.documentElement.scrollHeight - window.innerHeight; }

    function easeInOut(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function animateTo(y) {
      y = Math.max(0, Math.min(maxScroll(), Math.round(y)));
      var from = window.pageYOffset, dist = y - from;
      if (Math.abs(dist) < 2) return false;
      var dur = Math.min(1000, 550 + Math.abs(dist) * 0.25), start = null;
      animating = true;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        window.scrollTo({ top: from + dist * easeInOut(p), behavior: 'instant' });
        if (p < 1) requestAnimationFrame(step);
        else { animating = false; lastEnd = performance.now(); }
      }
      requestAnimationFrame(step);
      return true;
    }

    // where should a step in direction dir (1 = down, -1 = up) land?
    function targetFor(dir) {
      var y = window.pageYOffset, view = window.innerHeight, hh = headerH();
      var viewTop = y + hh, viewBottom = y + view;
      // section whose area contains the top edge of the visible area
      var idx = 0;
      sections.forEach(function (s, i) { if (topOf(s) <= viewTop + GAP) idx = i; });
      var cur = sections[idx];
      var cTop = topOf(cur) - hh, cBottom = topOf(cur) + cur.offsetHeight;
      if (dir > 0) {
        if (cBottom > viewBottom + MIN_REST) {
          // rest of a tall section first
          return Math.min(cBottom - view, topOf(sections[Math.min(idx + 1, sections.length - 1)]) - hh);
        }
        return idx < sections.length - 1 ? topOf(sections[idx + 1]) - hh : maxScroll();
      }
      if (y > cTop + GAP) return cTop;                     // back to the top of this section
      if (idx === 0) return 0;
      var prev = sections[idx - 1];
      var pTop = topOf(prev) - hh, pBottom = topOf(prev) + prev.offsetHeight;
      return (pBottom - (pTop + view) > MIN_REST) ? pBottom - view : pTop; // much taller previous section: show its end first
    }

    function modalOpen() { return !!doc.querySelector('.bk-modal.is-open'); }
    function enabled() { return mq.matches && !reduceMotion && !nav.classList.contains('is-open') && !modalOpen(); }
    // let other scripts (menu links) use the same smooth motion
    window.aceScrollTo = function (y) { if (enabled()) return animateTo(y); window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' }); return true; };

    window.addEventListener('wheel', function (e) {
      if (!enabled() || e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      e.preventDefault();
      var now = performance.now();
      var quiet = now - lastWheel; lastWheel = now;
      // ignore the tail of a trackpad / momentum gesture
      if (animating || now - lastEnd < 450 || (quiet < 60 && now - lastEnd < 900) || Math.abs(e.deltaY) < 3) return;
      animateTo(targetFor(e.deltaY > 0 ? 1 : -1));
    }, { passive: false });

    doc.addEventListener('keydown', function (e) {
      if (!enabled() || e.altKey || e.ctrlKey || e.metaKey) return;
      var t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      var dir = 0;
      if (e.key === 'PageDown' || e.key === 'ArrowDown' || (e.key === ' ' && !e.shiftKey && t.tagName !== 'BUTTON' && t.tagName !== 'A')) dir = 1;
      if (e.key === 'PageUp' || e.key === 'ArrowUp' || (e.key === ' ' && e.shiftKey)) dir = -1;
      if (e.key === 'Home') { e.preventDefault(); if (!animating) animateTo(0); return; }
      if (e.key === 'End') { e.preventDefault(); if (!animating) animateTo(maxScroll()); return; }
      if (!dir) return;
      e.preventDefault();
      if (!animating) animateTo(targetFor(dir));
    });
  })();

  /* ---------- Desktop testimonial slider (3 slots, centre = featured) ---------- */
  var xs = doc.getElementById('xSlider');
  if (xs) {
    var xCards = Array.prototype.slice.call(xs.querySelectorAll('.xs-card'));
    var xDotsWrap = xs.querySelector('.xs-dots');
    var busy = false;
    var featured = function () { return xCards.findIndex(function (c) { return c.dataset.pos === '1'; }); };

    var xDots = xCards.map(function (c, i) {
      var d = doc.createElement('button');
      d.type = 'button';
      d.setAttribute('role', 'tab');
      d.setAttribute('aria-label', 'Show testimonial ' + (i + 1));
      d.addEventListener('click', function () { showCard(i); xStop(); });
      xDotsWrap.appendChild(d);
      return d;
    });
    function syncDots() {
      var f = featured();
      xDots.forEach(function (d, i) { d.setAttribute('aria-selected', String(i === f)); });
      xCards.forEach(function (c, i) { c.setAttribute('aria-hidden', String(i !== f)); });
    }
    // put card k in the centre slot; cards crossing from one side to the other fade instead of sliding over
    function showCard(k) {
      if (busy || k === featured()) return;
      busy = true;
      var next = xCards.map(function (c, i) { return String((i - k + 1 + 3) % 3); });
      var jumpers = [];
      xCards.forEach(function (c, i) {
        if (Math.abs(Number(c.dataset.pos) - Number(next[i])) === 2) { jumpers.push(i); c.classList.add('is-jump'); }
        else c.dataset.pos = next[i];
      });
      setTimeout(function () {
        jumpers.forEach(function (i) {
          var c = xCards[i];
          c.classList.add('no-anim');
          c.dataset.pos = next[i];
          void c.offsetWidth;
          c.classList.remove('no-anim', 'is-jump');
        });
        syncDots();
      }, reduceMotion ? 0 : 380);
      setTimeout(function () { busy = false; }, reduceMotion ? 0 : 820);
      syncDots();
    }
    xs.querySelector('.xs-next').addEventListener('click', function () { showCard((featured() + 1) % 3); xStop(); });
    xs.querySelector('.xs-prev').addEventListener('click', function () { showCard((featured() + 2) % 3); xStop(); });
    syncDots();

    var xAuto = null;
    function xStart() { if (!reduceMotion && !xAuto) xAuto = setInterval(function () { showCard((featured() + 1) % 3); }, 5500); }
    function xStop() { clearInterval(xAuto); xAuto = null; }
    xs.addEventListener('mouseenter', xStop);
    xs.addEventListener('mouseleave', xStart);
    xs.addEventListener('focusin', xStop);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) xStart(); else xStop(); });
      }, { threshold: 0.4 }).observe(xs);
    }
  }
})();
