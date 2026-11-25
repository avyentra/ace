/* =========================================================
   ACE Spaces — "wow" motion layer
   ========================================================= */
(() => {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  const body = document.body;

  /* ---------- 1. Split hero heading into letters ---------- */
  $$('.split').forEach(el => {
    const delay = parseFloat(el.dataset.delay || 0);
    const target = el.querySelector('em') || el;
    const text = target.textContent;
    target.setAttribute('aria-label', text);
    target.innerHTML = [...text].map((c, i) =>
      c === ' ' ? '<span class="sp"> </span>'
        : `<span class="ch" aria-hidden="true" style="--ci:${i};--d:${delay}s">${c}</span>`).join('');
  });
  // after gold letters land, merge back to one word so a shine can sweep across it
  const gold = $('.gold-text');
  if (gold) {
    const goldText = gold.getAttribute('aria-label');
    const merge = () => { gold.textContent = goldText; gold.classList.add('is-shine'); };
    const last = gold.querySelector('.ch:last-child');
    if (last && !reduce) last.addEventListener('animationend', merge, { once: true });
    else merge();
  }

  /* ---------- 2. Preloader ---------- */
  const pre = $('#preloader');
  const bar = $('#plBar');
  let pct = 0, loaded = false, started = performance.now();
  const finish = () => {
    if (!pre || pre.classList.contains('is-out')) return;
    bar && (bar.style.width = '100%');
    setTimeout(() => {
      pre.classList.add('is-out');
      setTimeout(() => body.classList.remove('is-loading'), 450);
      setTimeout(() => pre.classList.add('is-gone'), 1500);
    }, 250);
  };
  if (reduce || !pre) { body.classList.remove('is-loading'); pre && pre.classList.add('is-gone'); }
  else {
    const tick = () => {
      if (pre.classList.contains('is-out')) return;
      const t = performance.now() - started;
      pct = Math.min(loaded ? pct + 6 : pct + Math.random() * 3, loaded ? 100 : 88);
      bar.style.width = pct + '%';
      if (loaded && t > 1500 && pct >= 100) finish();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    window.addEventListener('load', () => { loaded = true; });
    setTimeout(() => { loaded = true; }, 2600);   // slow network: don't wait forever
    setTimeout(finish, 4000);                      // hard fail-safe
  }

  /* ---------- 3. Split section headings into words ---------- */
  const splitWords = (root) => {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const parts = n.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach(p => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const wi = document.createElement('span'); wi.className = 'wi';
            wi.style.setProperty('--wi', i++); wi.textContent = p;
            w.appendChild(wi); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !['svg', 'BR'].includes(n.nodeName) && n.nodeName.toLowerCase() !== 'svg') {
          walk(n);
        }
      });
    };
    walk(root);
    root.classList.add('wsplit');
  };
  if (!reduce) {
    $$('.h2, .fcta__h, .cta__title').forEach(splitWords);
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-split-in'); io.unobserve(e.target); }
    }), { threshold: 0.3 });
    $$('.wsplit').forEach(h => io.observe(h));
  }

  /* ---------- 4. Image wipe reveals ---------- */
  if (!reduce) {
    const imgs = [
      ...$$('.scard__img, .acard__img, .plan__img, .visit__img, .locs__lobby'),
      ...$$('.comm__photo, .fcta__photo, .amen__photo').map(el => (el.classList.add('imgrev--x'), el))
    ];
    // Watch each photo's parent (a clipped element reports 0 visible area)
    const map = new Map();
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      (map.get(e.target) || []).forEach(el => el.classList.add('is-shown', 'is-in'));
      io.unobserve(e.target);
    }), { threshold: 0.12 });
    imgs.forEach(el => {
      el.classList.add('imgrev');
      const sibs = [...el.closest('section, footer').querySelectorAll('.imgrev')];
      el.style.transitionDelay = `${(sibs.indexOf(el) % 4) * 0.12}s`;
      const host = el.parentElement;
      if (!map.has(host)) { map.set(host, []); io.observe(host); }
      map.get(host).push(el);
    });
  }

  /* ---------- 5. Scroll progress ---------- */
  const prog = $('#progress');
  const onScroll = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    prog.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- 6. Flowing light along gold waves ---------- */
  $$('.hero__wave path, .gold-wave path').forEach(p => {
    const c = p.cloneNode(); c.setAttribute('class', 'flow'); p.after(c);
  });

  /* ---------- 7. Hub: travelling light dots ---------- */
  const hubSvg = $('.hub__lines');
  if (hubSvg && !reduce) {
    const NS = 'http://www.w3.org/2000/svg';
    $$('path', hubSvg).forEach((p, k) => {
      p.id = p.id || `hubp${k}`;
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('r', '3.5'); c.setAttribute('class', 'dot');
      const m = document.createElementNS(NS, 'animateMotion');
      m.setAttribute('dur', `${2.4 + (k % 3) * .4}s`);
      m.setAttribute('repeatCount', 'indefinite');
      m.setAttribute('begin', `${k * .35}s`);
      m.setAttribute('keyPoints', '1;0'); m.setAttribute('keyTimes', '0;1'); m.setAttribute('calcMode', 'linear');
      const mp = document.createElementNS(NS, 'mpath');
      mp.setAttribute('href', `#${p.id}`);
      m.appendChild(mp); c.appendChild(m); hubSvg.appendChild(c);
    });
  }

  /* ---------- 8. Spotlight + shine on cards ---------- */
  if (finePointer && !reduce) {
    const dark = '.scard, .acard, .tcard, .lcard, .plan--hot, .hero__card, .fcta';
    const light = '.plan:not(.plan--hot), .hub__n, .acc__item, .bar-light li';
    $$(`${dark}, ${light}`).forEach(card => {
      const s = document.createElement('span');
      s.className = 'spot' + (card.matches(light) ? ' spot--light' : '');
      card.classList.add('has-spot');
      if (getComputedStyle(card).position === 'static') card.style.position = 'relative';
      card.appendChild(s);
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        s.style.setProperty('--mx', `${e.clientX - r.left}px`);
        s.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  }

  /* ---------- 9. Custom cursor ---------- */
  const cur = $('#cursor');
  if (finePointer && !reduce && cur) {
    body.classList.add('has-cursor');
    const dot = $('.cursor__dot', cur), ring = $('.cursor__ring', cur);
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
    addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; cur.classList.remove('is-hidden'); }, { passive: true });
    document.addEventListener('pointerleave', () => cur.classList.add('is-hidden'));
    addEventListener('pointerdown', () => cur.classList.add('is-down'));
    addEventListener('pointerup', () => cur.classList.remove('is-down'));
    const loop = () => {
      rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
      dot.style.transform = `translate(${x}px,${y}px)`;
      ring.style.transform = `translate(${rx}px,${ry}px)`;
      requestAnimationFrame(loop);
    };
    loop();
    document.addEventListener('pointerover', e => {
      cur.classList.toggle('is-hover', !!e.target.closest('a, button, .tilt, .tcard, .acc__q, select, label'));
    });
  }

  /* ---------- 10. Magnetic buttons ---------- */
  if (finePointer && !reduce) {
    $$('.btn, .redbar__go, .circ, .nav__call, .testi__nav, .visit__btn, .fvisit, .btn__dot').forEach(el => {
      el.classList.add('mag');
      const strength = el.matches('.btn__dot, .circ, .redbar__go') ? 0.4 : 0.22;
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        el.style.translate = `${dx * strength}px ${dy * strength}px`;
      });
      el.addEventListener('pointerleave', () => { el.style.translate = ''; });
    });
  }

  /* ---------- 11. Click ripple ---------- */
  $$('.btn, .plan__btn, .visit__btn, .tab, .fvisit').forEach(el => {
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.style.overflow = 'hidden';
    el.addEventListener('pointerdown', e => {
      const r = el.getBoundingClientRect(), d = Math.max(r.width, r.height);
      const s = document.createElement('span');
      s.className = 'ripple';
      s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
      el.appendChild(s);
      setTimeout(() => s.remove(), 700);
    });
  });

  /* ---------- 12. Hero: gold dust, spotlight, mouse parallax ---------- */
  const hero = $('.hero');
  const canvas = $('#dust');
  if (hero && canvas && !reduce) {
    const ctx = canvas.getContext('2d');
    let W, H, dpr, parts = [], visible = true;
    const size = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(90, W / 16));
      parts = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.8 + .4, vy: -(Math.random() * .35 + .08), vx: (Math.random() - .5) * .15,
        a: Math.random() * .6 + .2, tw: Math.random() * Math.PI * 2, hue: Math.random() < .2 ? 355 : 40
      }));
    };
    let mx = -999, my = -999;
    const draw = () => {
      if (visible) {
        ctx.clearRect(0, 0, W, H);
        parts.forEach(p => {
          p.tw += .03; p.x += p.vx; p.y += p.vy;
          const dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
          if (d2 < 14000) { p.x += dx * .012; p.y += dy * .012; }     // drift away from cursor
          if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
          if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10;
          const a = p.a * (.6 + .4 * Math.sin(p.tw));
          ctx.beginPath();
          ctx.fillStyle = p.hue === 40 ? `rgba(255,205,120,${a})` : `rgba(255,80,90,${a})`;
          ctx.shadowColor = p.hue === 40 ? 'rgba(255,190,90,.9)' : 'rgba(227,25,43,.9)';
          ctx.shadowBlur = 8;
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        });
      }
      requestAnimationFrame(draw);
    };
    size(); draw();
    addEventListener('resize', size);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);

    if (finePointer) {
      const bg = $('.hero__bg'), card = $('.hero__card');
      hero.addEventListener('pointermove', e => {
        const r = hero.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        mx = e.clientX - r.left; my = e.clientY - r.top;
        hero.style.setProperty('--hx', `${mx}px`); hero.style.setProperty('--hy', `${my}px`);
        bg.style.translate = `${px * -24}px ${py * -16 + scrollY * 0.25}px`;
        card.style.transform = `perspective(1200px) rotateY(${px * 5}deg) rotateX(${-py * 4}deg)`;
      });
      hero.addEventListener('pointerleave', () => { mx = my = -999; bg.style.translate = `0 ${scrollY * 0.25}px`; card.style.transform = ''; });
    }
  }

  /* ---------- 13. Testimonial swap animation ---------- */
  const track = $('#tTrack');
  if (track && !reduce) {
    let lastFeat = $('.tcard.is-feat', track);
    new MutationObserver(() => {
      const c = $('.tcard.is-feat', track) || $('.tcard.is-show', track);
      if (!c || c === lastFeat) return;
      lastFeat = c;
      c.classList.add('swap');
      setTimeout(() => c.classList.remove('swap'), 650);
    }).observe(track, { subtree: true, attributes: true, attributeFilter: ['class'] });
  }
})();
