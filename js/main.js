/* =========================================================
   ACE Spaces — interactions & animations
   ========================================================= */
(() => {
  'use strict';

  /* ---------- SITE CONFIG: edit these ---------- */
  const CONFIG = {
    whatsapp: '919876543210',          // WhatsApp number, country code + number, no "+"
    phone: '+91 98765 43210',
    email: 'hello@acespaces.in',
    tourVideo: ''                        // e.g. 'https://www.youtube.com/embed/VIDEO_ID'
  };

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- year ---------- */
  const yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- WhatsApp links ---------- */
  $$('.js-wa').forEach(a => { a.href = `https://wa.me/${CONFIG.whatsapp}`; });

  /* ---------- hero: mark load done (draws swoosh) ---------- */
  window.addEventListener('load', () => document.body.classList.add('ld-done'));
  setTimeout(() => document.body.classList.add('ld-done'), 900);

  /* ---------- nav: scroll state, active link, burger ---------- */
  const nav = $('#nav');
  const qbar = $('.qbar');
  const burger = $('#burger');
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 30);
    if (qbar) qbar.classList.toggle('is-on', y > 500);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', open);
  });
  $$('#drawer a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false');
  }));

  const links = $$('.nav__links a');
  const sections = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => spy.observe(s));

  /* ---------- scroll reveal (staggered per parent) ---------- */
  const revealIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      revealIO.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.rv').forEach(el => {
    const sibs = [...el.parentElement.children].filter(c => c.classList.contains('rv'));
    el.style.setProperty('--rd', `${Math.min(sibs.indexOf(el), 6) * 0.08}s`);
    revealIO.observe(el);
  });
  // panels/hub that animate lines when visible
  const lineIO = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); lineIO.unobserve(e.target); } });
  }, { threshold: 0.3 });
  $$('.hub, .panel-gold').forEach(el => lineIO.observe(el));

  /* ---------- counters ---------- */
  const countIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, to = +el.dataset.to, dur = 1600, t0 = performance.now();
      if (reduce) { el.textContent = to; return; }
      const tick = now => {
        const p = Math.min((now - t0) / dur, 1);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      countIO.unobserve(el);
    });
  }, { threshold: 0.6 });
  $$('.count').forEach(el => countIO.observe(el));

  /* ---------- 3D tilt on cards (desktop pointer only) ---------- */
  if (!reduce && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    $$('.tilt').forEach(card => {
      const skew = card.classList.contains('lcard') ? ' skewX(-4deg)' : '';
      card.addEventListener('pointermove', ev => {
        const r = card.getBoundingClientRect();
        const x = (ev.clientX - r.left) / r.width - 0.5;
        const y = (ev.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-6px)${skew}`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });

    // gentle parallax for hero background
    const heroBg = $('.hero__bg');
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y < 900 && heroBg) heroBg.style.translate = `0 ${y * 0.25}px`;
    }, { passive: true });
  }

  /* ---------- plan tabs ---------- */
  let billing = 'Monthly';
  $$('.tab').forEach(tab => tab.addEventListener('click', () => {
    $$('.tab').forEach(t => { t.classList.toggle('is-on', t === tab); t.setAttribute('aria-selected', t === tab); });
    billing = tab.dataset.plan;
    $$('.plan').forEach((p, i) => {
      p.animate([{ transform: 'translateY(10px)', opacity: .6 }, { transform: '', opacity: 1 }],
        { duration: 450, delay: i * 60, easing: 'cubic-bezier(.2,.7,.2,1)' });
    });
    toast(`${billing} billing selected — request a quote for exact pricing.`);
  }));

  /* ---------- testimonials carousel ---------- */
  const cards = $$('.tcard');
  const dots = $$('#tDots button');
  let cur = 1, timer;
  const mobile = () => window.matchMedia('(max-width:960px)').matches;
  const show = i => {
    cur = (i + cards.length) % cards.length;
    if (mobile()) {
      cards.forEach((c, k) => c.classList.toggle('is-show', k === cur));
    } else {
      // rotate order so the current one sits in the middle as featured
      const order = [(cur + cards.length - 1) % cards.length, cur, (cur + 1) % cards.length];
      order.forEach((k, pos) => { cards[k].style.order = pos; });
      cards.forEach((c, k) => c.classList.toggle('is-feat', k === cur));
      const badge = $('.tcard__badge');
      if (badge) cards[cur].prepend(badge);
      cards.forEach(c => {
        const img = $('.tcard__av', c);
        img.classList.toggle('tcard__av--tall', c.classList.contains('is-feat') && c.dataset.i === '1');
      });
    }
    dots.forEach((d, k) => d.classList.toggle('is-on', k === cur));
  };
  const auto = () => { clearInterval(timer); if (!reduce) timer = setInterval(() => show(cur + 1), 5500); };
  $('#tPrev').addEventListener('click', () => { show(cur - 1); auto(); });
  $('#tNext').addEventListener('click', () => { show(cur + 1); auto(); });
  dots.forEach((d, k) => d.addEventListener('click', () => { show(k); auto(); }));
  cards.forEach((c, k) => c.addEventListener('click', () => { if (k !== cur) { show(k); auto(); } }));
  const testi = $('.testi');
  testi.addEventListener('mouseenter', () => clearInterval(timer));
  testi.addEventListener('mouseleave', auto);
  // swipe
  let sx = null;
  testi.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  testi.addEventListener('touchend', e => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 40) { show(cur + (dx < 0 ? 1 : -1)); auto(); }
    sx = null;
  });
  window.addEventListener('resize', () => show(cur));
  show(1); auto();

  /* ---------- FAQ accordion ---------- */
  $$('.acc__item').forEach(item => {
    $('.acc__q', item).addEventListener('click', () => {
      const open = !item.classList.contains('is-open');
      $$('.acc__item').forEach(i => { i.classList.remove('is-open'); $('.acc__q', i).setAttribute('aria-expanded', 'false'); });
      if (open) { item.classList.add('is-open'); $('.acc__q', item).setAttribute('aria-expanded', 'true'); }
    });
  });

  /* ---------- modals ---------- */
  const modal = $('#modal'), vmodal = $('#vmodal');
  let lastFocus = null;
  const openModal = (m) => {
    lastFocus = document.activeElement;
    m.classList.add('is-open'); m.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => { const f = $('input, button.modal__x', m); f && f.focus(); }, 60);
  };
  const closeModal = (m) => {
    m.classList.remove('is-open'); m.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (m === vmodal) { const f = $('iframe', m); f && f.remove(); }
    lastFocus && lastFocus.focus();
  };
  [modal, vmodal].forEach(m => $$('[data-close]', m).forEach(b => b.addEventListener('click', () => closeModal(m))));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') [modal, vmodal].forEach(m => m.classList.contains('is-open') && closeModal(m));
  });

  const setModal = (eyebrow, title, plan) => {
    $('#mEyebrow').textContent = eyebrow;
    $('#mTitle').innerHTML = title;
    if (plan) $('#mPlan').value = plan;
  };
  $$('.js-open-visit').forEach(b => b.addEventListener('click', e => {
    e.preventDefault();
    setModal('Book a Visit', 'Schedule your <em class="red">free tour</em>', 'General');
    openModal(modal);
  }));
  $$('.js-quote').forEach(b => b.addEventListener('click', e => {
    e.preventDefault();
    const p = b.dataset.planName || 'General';
    setModal('Request a Quote', `${p === 'General' ? 'Get a' : p} <em class="red">quote</em>`, p);
    openModal(modal);
  }));

  $('#watchTour').addEventListener('click', () => {
    if (CONFIG.tourVideo) {
      const ph = $('.video-ph', vmodal);
      ph.innerHTML = `<iframe src="${CONFIG.tourVideo}?autoplay=1" allow="autoplay; fullscreen" allowfullscreen title="ACE Spaces tour"></iframe>`;
    }
    openModal(vmodal);
  });

  /* ---------- lead form → WhatsApp ---------- */
  const form = $('#leadForm');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    const err = $('#fErr');
    $$('input', form).forEach(i => i.classList.remove('is-bad'));
    if (!d.name.trim()) { err.textContent = 'Please enter your name.'; form.name.classList.add('is-bad'); form.name.focus(); return; }
    if (d.phone.replace(/\D/g, '').length < 10) { err.textContent = 'Please enter a valid 10-digit phone number.'; form.phone.classList.add('is-bad'); form.phone.focus(); return; }
    err.textContent = '';
    const msg = [
      `Hi ACE Spaces! I'd like to ${$('#mEyebrow').textContent.toLowerCase()}.`,
      `Name: ${d.name}`, `Phone: ${d.phone}`, d.email && `Email: ${d.email}`,
      `Location: ${d.location}`, `Plan: ${d.plan} (${billing})`, d.message && `Message: ${d.message}`
    ].filter(Boolean).join('\n');
    window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    closeModal(modal);
    form.reset();
    toast('Opening WhatsApp with your details…');
  });

  /* ---------- toast ---------- */
  const t = $('#toast'); let tt;
  function toast(text) {
    t.textContent = text; t.classList.add('is-on');
    clearTimeout(tt); tt = setTimeout(() => t.classList.remove('is-on'), 2800);
  }
})();
