/* =========================================================
   ACE Spaces — interactions.js
   Animation + working buttons for the pixel-exact desktop
   sections (whose cards/buttons are part of the background
   image) and for the mobile layout.

   How it works: on each desktop stage (1920px wide) we add
   two layers, positioned in the same 1920px coordinates:
     .fx-under  → just above the background image, below the text
                  (glows, shines, sliding pill, light lines)
     .fx-over   → on top of everything (clickable arrow buttons)
   Hover is detected per stage with a hit-test, so text sitting
   on top of a card never blocks the card's hover effect.
   ========================================================= */
(function () {
  'use strict';

  /* ---------- SITE CONFIG ---------- */
  var CONFIG = {
    whatsapp: '919876543210',          // country code + number, no "+"
    phone: '+91 98765 43210',
    mapsMohali: 'https://www.google.com/maps/search/?api=1&query=ACE+Spaces+IT+City+Mohali',
    mapsZirakpur: 'https://www.google.com/maps/search/?api=1&query=ACE+Spaces+PR-7+Zirakpur',
    instagram: 'https://www.instagram.com/acespaces.in/',
    linkedin: '',                       // add your LinkedIn page URL
    facebook: ''                        // add your Facebook page URL
  };

  var doc = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';
  var ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var ARROW_UR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';
  var CHEV = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';

  var billing = 'Monthly';

  /* =========================================================
     Helpers
     ========================================================= */
  function stageOf(id) { return doc.querySelector('#' + id + ' .exact-stage > div'); }

  function makeLayer(stage, cls) {
    var l = doc.createElement('div');
    l.className = 'fx-layer ' + cls;
    if (cls === 'fx-under') {
      var bg = stage.querySelector('.exact-bg');
      bg.after(l);
    } else {
      stage.appendChild(l);
    }
    return l;
  }

  // r = [x, y, w, h, radius]
  function box(layer, r, cls, html, tag) {
    var el = doc.createElement(tag || 'div');
    el.className = cls;
    el.style.cssText = 'left:' + r[0] + 'px;top:' + r[1] + 'px;width:' + r[2] + 'px;height:' + r[3] + 'px;border-radius:' + (r[4] || 0) + 'px';
    if (html) el.innerHTML = html;
    layer.appendChild(el);
    return el;
  }

  // circle centred at (cx, cy) with diameter d
  function circle(layer, cx, cy, d, cls, html, tag) {
    return box(layer, [cx - d / 2, cy - d / 2, d, d, d / 2], cls, html, tag);
  }

  function inPoly(x, y, pts) {
    var inside = false;
    for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      var xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  }

  /* Hover hit-testing for one stage.
     zones: [{ r:[x,y,w,h] | poly:[[x,y]..], els:[elements to mark hot], action: fn, onHot: fn(bool) }] */
  function hotZones(stage, zones) {
    var W = 1920;
    function toStage(e) {
      var b = stage.getBoundingClientRect();
      var k = b.width / W;
      return { x: (e.clientX - b.left) / k, y: (e.clientY - b.top) / k };
    }
    function hit(z, p) {
      if (z.poly) return inPoly(p.x, p.y, z.poly);
      return p.x >= z.r[0] && p.x <= z.r[0] + z.r[2] && p.y >= z.r[1] && p.y <= z.r[1] + z.r[3];
    }
    var current = [];
    function setHot(list, p) {
      zones.forEach(function (z) {
        var on = list.indexOf(z) > -1;
        z.els.forEach(function (el) {
          el.classList.toggle('is-hot', on);
          if (on && p) {
            var ox = z.r ? z.r[0] : z.box[0], oy = z.r ? z.r[1] : z.box[1];
            el.style.setProperty('--mx', (p.x - ox) + 'px');
            el.style.setProperty('--my', (p.y - oy) + 'px');
          }
        });
        if (z.onHot && (current.indexOf(z) > -1) !== on) z.onHot(on);
      });
      current = list;
      stage.style.cursor = list.some(function (z) { return z.action; }) ? 'pointer' : '';
    }
    stage.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var p = toStage(e);
      setHot(zones.filter(function (z) { return hit(z, p); }), p);
    });
    stage.addEventListener('pointerleave', function () { setHot([]); });
    stage.addEventListener('click', function (e) {
      if (e.target.closest('a, button')) return;        // real links handle themselves
      var p = toStage(e);
      var z = zones.filter(function (z) { return z.action && hit(z, p); })[0];
      if (z) z.action();
    });
  }

  function svgEl(name, attrs, parent) {
    var el = doc.createElementNS(NS, name);
    Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(el);
    return el;
  }

  function scrollToEl(el) {
    var header = doc.getElementById('siteHeader');
    var top = el.getBoundingClientRect().top + window.pageYOffset - (header ? header.offsetHeight : 0) - 10;
    window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
  }

  /* =========================================================
     Booking / quote modal  (sends the enquiry to WhatsApp)
     ========================================================= */
  var modal = doc.createElement('div');
  modal.className = 'bk-modal';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML =
    '<div class="bk-backdrop" data-close></div>' +
    '<div class="bk-box" role="dialog" aria-modal="true" aria-labelledby="bkTitle">' +
      '<button type="button" class="bk-x" data-close aria-label="Close"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>' +
      '<p class="bk-eyebrow" id="bkEyebrow">Book a Visit</p>' +
      '<h3 class="bk-title" id="bkTitle">Schedule your <em>free tour</em></h3>' +
      '<p class="bk-chip" id="bkChip" hidden></p>' +
      '<form class="bk-form" id="bkForm" novalidate>' +
        '<div class="bk-row">' +
          '<label>Name<input name="name" autocomplete="name" required></label>' +
          '<label>Phone<input name="phone" type="tel" autocomplete="tel" placeholder="+91 98xxx xxxxx" required></label>' +
        '</div>' +
        '<label><span class="bk-l">Email <i>(optional)</i></span><input name="email" type="email" autocomplete="email"></label>' +
        '<div class="bk-row">' +
          '<label>Location<select name="location"><option>Mohali (IT City)</option><option>Zirakpur (PR-7)</option><option>Either</option></select></label>' +
          '<label>Plan<select name="plan" id="bkPlan"><option>Day Pass</option><option>Dedicated Desk</option><option>Private Cabin</option><option>Meeting Room</option><option>Custom Plan</option><option>Not sure yet</option></select></label>' +
        '</div>' +
        '<label><span class="bk-l">Message <i>(optional)</i></span><textarea name="message" rows="3"></textarea></label>' +
        '<p class="bk-err" id="bkErr" role="alert"></p>' +
        '<button type="submit" class="bk-submit">Send on WhatsApp <span class="bk-dot">' + ARROW + '</span></button>' +
        '<p class="bk-note">We reply within working hours. Or call <a href="tel:' + CONFIG.phone.replace(/\s/g, '') + '">' + CONFIG.phone + '</a></p>' +
      '</form>' +
    '</div>';
  doc.body.appendChild(modal);

  var toast = doc.createElement('div');
  toast.className = 'bk-toast';
  toast.setAttribute('role', 'status');
  doc.body.appendChild(toast);
  var toastT;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toast.classList.remove('is-on'); }, 2600);
  }

  var lastFocus = null, mode = 'visit';
  function openModal(kind, plan) {
    mode = kind;
    lastFocus = doc.activeElement;
    var chip = doc.getElementById('bkChip');
    if (kind === 'quote') {
      doc.getElementById('bkEyebrow').textContent = 'Request a Quote';
      doc.getElementById('bkTitle').innerHTML = (!plan || plan === 'Not sure yet') ? 'Get a <em>quote</em>' : (plan === 'Custom Plan' ? 'Custom plan' : plan) + ' <em>quote</em>';
      chip.hidden = false;
      chip.textContent = 'Billing: ' + billing;
    } else {
      doc.getElementById('bkEyebrow').textContent = 'Book a Visit';
      doc.getElementById('bkTitle').innerHTML = 'Schedule your <em>free tour</em>';
      chip.hidden = true;
    }
    doc.getElementById('bkPlan').value = plan || 'Not sure yet';
    doc.getElementById('bkErr').textContent = '';
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    doc.documentElement.style.overflow = 'hidden';
    setTimeout(function () { modal.querySelector('input').focus(); }, 80);
  }
  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    doc.documentElement.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  modal.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', closeModal); });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal(); });

  doc.getElementById('bkForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target, err = doc.getElementById('bkErr');
    if (!f.name.value.trim()) { err.textContent = 'Please enter your name.'; f.name.focus(); return; }
    if (f.phone.value.replace(/\D/g, '').length < 10) { err.textContent = 'Please enter a valid 10-digit phone number.'; f.phone.focus(); return; }
    err.textContent = '';
    var lines = [
      mode === 'quote' ? 'Hi ACE Spaces! I would like a quote.' : 'Hi ACE Spaces! I would like to book a visit.',
      'Name: ' + f.name.value.trim(),
      'Phone: ' + f.phone.value.trim(),
      f.email.value.trim() ? 'Email: ' + f.email.value.trim() : '',
      'Location: ' + f.location.value,
      'Plan: ' + f.plan.value + (mode === 'quote' ? ' (' + billing + ')' : ''),
      f.message.value.trim() ? 'Message: ' + f.message.value.trim() : ''
    ].filter(Boolean).join('\n');
    window.open('https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(lines), '_blank', 'noopener');
    closeModal();
    f.reset();
    showToast('Opening WhatsApp with your details…');
  });

  // make any element open the modal
  function bindModal(el, kind, plan) {
    if (!el) return;
    el.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); openModal(kind, plan); });
  }

  /* =========================================================
     Billing toggle — shared by the desktop stage and mobile
     ========================================================= */
  var toggleHandlers = [];
  function setBilling(name, fromUser) {
    billing = name;
    toggleHandlers.forEach(function (fn) { fn(name); });
    if (fromUser) showToast(name + ' billing selected — request a quote for exact pricing.');
  }
  // mobile toggle (main.js already styles it; we just share the state)
  doc.querySelectorAll('.plan-toggle button').forEach(function (b) {
    b.addEventListener('click', function () { setBilling(b.textContent.trim(), true); });
  });
  toggleHandlers.push(function (name) {
    doc.querySelectorAll('.plan-toggle button').forEach(function (b) {
      var on = b.textContent.trim() === name;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
  });

  // a plan card in the pricing section, flashed when someone arrives from a Space card
  var planFlash = {};   // name -> [elements]
  function goToPlan(name) {
    var target = doc.querySelector('#pricing .exact');
    if (!target || !target.offsetParent) target = doc.getElementById('pricing');
    scrollToEl(target);
    var els = planFlash[name] || [];
    setTimeout(function () {
      els.forEach(function (el) {
        el.classList.remove('is-flash'); void el.offsetWidth; el.classList.add('is-flash');
      });
    }, reduce ? 0 : 650);
  }

  /* =========================================================
     1. WHY ACE — hub diagram
     ========================================================= */
  (function () {
    var stage = stageOf('why');
    if (!stage) return;
    var under = makeLayer(stage, 'fx-under');

    var cards = [
      { r: [888, 98, 206, 96, 20],  dot: [1094, 152], path: 'M1094 152 C1124 152 1132 182 1143 205' },
      { r: [846, 230, 215, 98, 20], dot: [1060, 281], path: 'M1060 281 L1106 281' },
      { r: [864, 366, 230, 99, 20], dot: [1094, 416], path: 'M1094 416 C1124 416 1132 384 1143 360' },
      { r: [1310, 98, 224, 96, 20], dot: [1308, 152], path: 'M1308 152 C1280 152 1275 182 1270 205' },
      { r: [1342, 230, 216, 98, 20], dot: [1342, 281], path: 'M1342 281 L1306 281' },
      { r: [1310, 366, 244, 99, 20], dot: [1308, 416], path: 'M1308 416 C1280 416 1275 384 1270 360' }
    ];

    // SVG layer for lines, pulses and the centre rings
    var svg = svgEl('svg', { class: 'fx-hub', viewBox: '0 0 1920 702', width: '1920', height: '702', 'aria-hidden': 'true' }, under);
    var cx = 1206, cy = 282;
    svgEl('circle', { class: 'hub-ripple', cx: cx, cy: cy, r: 100 }, svg);
    svgEl('circle', { class: 'hub-ripple hub-ripple-2', cx: cx, cy: cy, r: 100 }, svg);
    var g1 = svgEl('g', { class: 'hub-spin' }, svg);
    svgEl('circle', { class: 'hub-dash', cx: cx, cy: cy, r: 124 }, g1);
    var g2 = svgEl('g', { class: 'hub-spin hub-spin-rev' }, svg);
    svgEl('circle', { class: 'hub-arc', cx: cx, cy: cy, r: 104 }, g2);

    // card glows (below the text)
    var glows = cards.map(function (c) { return box(under, c.r, 'fx-glow fx-glow-light'); });

    // icons in the stage, in the same order as the cards
    var icons = Array.prototype.filter.call(stage.querySelectorAll(':scope > svg'), function (s) {
      var t = parseFloat(s.style.top), l = parseFloat(s.style.left);
      return t > 100 && t < 420 && l > 850 && l < 1420;
    });
    icons.forEach(function (ic) { ic.classList.add('fx-icon'); });

    var zones = cards.map(function (c, i) {
      var p = svgEl('path', { class: 'hub-line', d: c.path, pathLength: '100' }, svg);
      var spark = svgEl('circle', { class: 'hub-spark', r: '3.6' }, svg);
      var m = svgEl('animateMotion', { dur: (2.2 + (i % 3) * 0.35) + 's', repeatCount: 'indefinite', begin: (i * 0.4) + 's', path: c.path }, spark);
      if (reduce) m.setAttribute('repeatCount', '0');
      svgEl('circle', { class: 'hub-pulse', cx: c.dot[0], cy: c.dot[1], r: '5', style: 'animation-delay:' + (i * 0.3) + 's' }, svg);
      return {
        r: c.r, els: [glows[i], p],
        onHot: function (on) { if (icons[i]) icons[i].classList.toggle('is-pop', on); svg.classList.toggle('is-focus', on); }
      };
    });
    // the centre disc reacts too
    var core = circle(under, cx, cy, 186, 'fx-core');
    zones.push({ r: [cx - 93, cy - 93, 186, 186], els: [core] });
    hotZones(stage, zones);

    // the centre logo breathes
    Array.prototype.forEach.call(stage.querySelectorAll('img[src*="mark.png"]'), function (img) { img.classList.add('fx-breathe'); });
  })();

  /* =========================================================
     2. OUR SPACES — 4 cards + working arrow buttons
     ========================================================= */
  (function () {
    var stage = stageOf('spaces');
    if (!stage) return;
    var under = makeLayer(stage, 'fx-under');
    var over = makeLayer(stage, 'fx-over');
    var cards = [
      { r: [318, 262, 334, 354, 26], arrow: [593, 575], plan: 'Private Cabin', label: 'Private Cabins' },
      { r: [655, 262, 310, 354, 26], arrow: [917, 575], plan: 'Dedicated Desk', label: 'Dedicated Desks' },
      { r: [978, 262, 302, 354, 26], arrow: [1233, 575], plan: 'Meeting Room', label: 'Meeting Rooms' },
      { r: [1294, 262, 312, 354, 26], arrow: [1562, 575], plan: 'Day Pass', label: 'Collaborative Zones' }
    ];
    var zones = cards.map(function (c) {
      var g = box(under, c.r, 'fx-glow fx-glow-gold', '<i class="fx-shine"></i>');
      var a = circle(over, c.arrow[0], c.arrow[1], 44, 'fx-arrow fx-arrow-gold', ARROW, 'a');
      a.href = '#pricing';
      a.setAttribute('aria-label', c.label + ' — see plans');
      a.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); goToPlan(c.plan); });
      return { r: c.r, els: [g, a], action: function () { goToPlan(c.plan); } };
    });
    hotZones(stage, zones);
  })();

  /* =========================================================
     3. OUR LOCATIONS — slanted cards, Explore buttons, tour bar
     ========================================================= */
  (function () {
    var stage = stageOf('locations');
    if (!stage) return;
    var under = makeLayer(stage, 'fx-under');
    var over = makeLayer(stage, 'fx-over');

    var polys = [
      { poly: [[345, 336], [960, 336], [895, 610], [281, 610]], box: [281, 336, 679, 274] },
      { poly: [[982, 352], [1528, 352], [1584, 598], [926, 598]], box: [926, 352, 658, 246] }
    ];
    var locGlows = polys.map(function (p) {
      var el = box(under, [p.box[0], p.box[1], p.box[2], p.box[3], 0], 'fx-poly', '<i class="fx-shine"></i>');
      el.style.clipPath = 'polygon(' + p.poly.map(function (pt) { return (pt[0] - p.box[0]) + 'px ' + (pt[1] - p.box[1]) + 'px'; }).join(',') + ')';
      return el;
    });

    // Explore buttons -> Google Maps, with a real hover state
    var explore = Array.prototype.filter.call(stage.querySelectorAll(':scope > a'), function (a) { return /Explore/.test(a.textContent); });
    explore.forEach(function (a, i) {
      a.href = i === 0 ? CONFIG.mapsMohali : CONFIG.mapsZirakpur;
      a.target = '_blank'; a.rel = 'noopener';
      a.classList.add('fx-explore');
      a.insertAdjacentHTML('beforeend', '<span class="fx-explore-ic">' + ARROW_UR + '</span>');
    });

    // Book a Space Tour bar
    var bar = Array.prototype.filter.call(stage.querySelectorAll(':scope > a'), function (a) { return /Book a Space Tour/.test(a.textContent); })[0];
    var sheen = box(under, [316, 733, 1214, 62, 14], 'fx-bar', '<i class="fx-bar-sweep"></i>');
    var arr = circle(over, 1482, 765, 42, 'fx-arrow fx-arrow-white', ARROW);
    bindModal(bar, 'visit');
    if (bar) bar.classList.add('fx-bar-link');

    hotZones(stage, [
      { poly: polys[0].poly, box: polys[0].box, els: [locGlows[0]] },
      { poly: polys[1].poly, box: polys[1].box, els: [locGlows[1]] },
      { r: [316, 733, 1214, 62], els: [sheen, arr] }
    ]);
  })();

  /* =========================================================
     4. AMENITIES — photo cards + "Explore Our Amenities" bar
     ========================================================= */
  (function () {
    var stage = stageOf('amenities');
    if (!stage) return;
    var under = makeLayer(stage, 'fx-under');
    var over = makeLayer(stage, 'fx-over');
    var cards = [
      { r: [675, 360, 311, 293, 22], arrow: [948, 612], go: function () { goToPlan('Meeting Room'); }, label: 'Meeting Rooms' },
      { r: [1005, 360, 312, 293, 22], arrow: [1276, 612], go: function () { openModal('visit'); }, label: 'Café Lounge — book a visit' },
      { r: [1332, 360, 324, 293, 22], arrow: [1614, 612], go: function () { goToPlan('Dedicated Desk'); }, label: 'Coworking Desks' }
    ];
    var zones = cards.map(function (c) {
      var g = box(under, c.r, 'fx-glow fx-glow-red', '<i class="fx-shine"></i>');
      var a = circle(over, c.arrow[0], c.arrow[1], 42, 'fx-arrow fx-arrow-red', ARROW, 'a');
      a.href = '#pricing';
      a.setAttribute('aria-label', c.label);
      a.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); c.go(); });
      return { r: c.r, els: [g, a], action: c.go };
    });

    var bar = Array.prototype.filter.call(stage.querySelectorAll(':scope > a'), function (a) { return /Explore Our Amenities/.test(a.textContent); })[0];
    var sheen = box(under, [280, 796, 1386, 77, 38], 'fx-bar fx-bar-glow', '<i class="fx-bar-sweep"></i>');
    var arr = circle(over, 1609, 834, 54, 'fx-arrow fx-arrow-white fx-arrow-lg', ARROW);
    bindModal(bar, 'visit');
    if (bar) bar.classList.add('fx-bar-link');
    zones.push({ r: [280, 796, 1386, 77], els: [sheen, arr] });
    hotZones(stage, zones);
  })();

  /* =========================================================
     5. PRICING — animated billing toggle, plan cards, quote buttons
     ========================================================= */
  (function () {
    var stage = stageOf('pricing');
    if (!stage) return;
    var under = makeLayer(stage, 'fx-under');
    var over = makeLayer(stage, 'fx-over');

    /* --- toggle: redraw the three pills so the red one can slide --- */
    var pills = [
      { name: 'Monthly', r: [1183, 268, 147, 44] },
      { name: 'Quarterly', r: [1340, 268, 148, 44] },
      { name: 'Yearly', r: [1498, 268, 134, 44] }
    ];
    box(under, [1176, 262, 462, 56, 28], 'fx-toggle-track');
    pills.forEach(function (p) { box(under, p.r.concat(22), 'fx-toggle-pill'); });
    var thumb = box(under, pills[0].r.concat(22), 'fx-toggle-thumb', '<i class="fx-shine"></i>');
    var tbtns = Array.prototype.filter.call(stage.querySelectorAll(':scope > button'), function (b) {
      return /Monthly|Quarterly|Yearly/.test(b.textContent);
    });
    function paintToggle(name) {
      var p = pills.filter(function (x) { return x.name === name; })[0] || pills[0];
      thumb.style.left = p.r[0] + 'px';
      thumb.style.width = p.r[2] + 'px';
      thumb.classList.remove('is-pop'); void thumb.offsetWidth; thumb.classList.add('is-pop');
      tbtns.forEach(function (b) {
        var on = b.textContent.trim() === name;
        b.setAttribute('aria-pressed', String(on));
        b.classList.add('fx-tbtn');
        b.style.color = on ? '#fff' : '#14161d';
        var s = b.querySelector('svg'); if (s) s.setAttribute('stroke', on ? '#fff' : '#14161d');
      });
    }
    tbtns.forEach(function (b) {
      b.addEventListener('click', function () { setBilling(b.textContent.trim(), true); });
    });
    toggleHandlers.push(paintToggle);
    toggleHandlers.push(function () {
      planGlows.forEach(function (g, i) {
        g.classList.remove('is-sweep'); void g.offsetWidth;
        g.style.animationDelay = (i * 0.08) + 's';
        g.classList.add('is-sweep');
      });
    });

    /* --- plan cards --- */
    var plans = [
      { name: 'Day Pass', r: [292, 370, 334, 393, 24], btn: [315, 702, 292, 43], arrow: [583, 724] },
      { name: 'Dedicated Desk', r: [648, 370, 321, 393, 26], btn: [670, 702, 276, 43], arrow: null, hot: true },
      { name: 'Private Cabin', r: [987, 370, 319, 393, 24], btn: [1010, 702, 281, 43], arrow: [1266, 724] },
      { name: 'Meeting Room', r: [1327, 370, 314, 393, 24], btn: [1350, 702, 282, 43], arrow: [1613, 724] }
    ];
    var quoteLinks = Array.prototype.filter.call(stage.querySelectorAll(':scope > a'), function (a) { return /Request .* Quote/.test(a.textContent) && !/Custom/.test(a.textContent); });
    var planGlows = [];
    var zones = [];
    plans.forEach(function (p, i) {
      var g = box(under, p.r, 'fx-glow ' + (p.hot ? 'fx-glow-popular' : 'fx-glow-light'), '<i class="fx-shine"></i>');
      planGlows.push(g);
      planFlash[p.name] = [g];
      var fill = box(under, p.btn.concat(22), 'fx-qfill' + (p.hot ? ' fx-qfill-white' : ''));
      var els = [g, fill];
      if (p.arrow) els.push(circle(over, p.arrow[0], p.arrow[1], 34, 'fx-arrow fx-arrow-solid', ARROW));
      var a = quoteLinks[i];
      if (a) {
        if (p.arrow) {                              // widen to cover the arrow, keep the text where it was
          var oldW = parseFloat(a.style.width) || p.btn[2];
          a.style.boxSizing = 'border-box';
          a.style.width = p.btn[2] + 'px';
          a.style.paddingRight = Math.max(0, p.btn[2] - oldW) + 'px';
        }
        a.classList.add('fx-qlink');
        bindModal(a, 'quote', p.name);
      }
      zones.push({ r: p.btn, els: [fill].concat(els.slice(2)) });
      zones.push({ r: p.r, els: [g] });
    });
    // the "Most Popular" badge shine
    box(under, [800, 355, 152, 40, 14], 'fx-badge', '<i class="fx-shine"></i>');

    /* --- custom plan strip --- */
    box(under, [280, 798, 560, 82, 22], 'fx-bar fx-bar-custom', '<i class="fx-bar-sweep"></i>');
    var custom = Array.prototype.filter.call(stage.querySelectorAll(':scope > a'), function (a) { return /Custom Quote/.test(a.textContent); })[0];
    var navyGlow = box(under, [1348, 816, 289, 50, 25], 'fx-navy');
    if (custom) { custom.classList.add('fx-custom'); bindModal(custom, 'quote', 'Custom Plan'); }
    zones.push({ r: [1348, 816, 289, 50], els: [navyGlow] });

    hotZones(stage, zones);
    paintToggle(billing);
  })();

  /* =========================================================
     6. BOOK A VISIT card
     ========================================================= */
  (function () {
    var stage = stageOf('faq');
    if (!stage) return;
    var under = makeLayer(stage, 'fx-under');
    var over = makeLayer(stage, 'fx-over');
    var card = box(under, [1018, 235, 588, 520, 32], 'fx-glow fx-glow-visit');
    circle(under, 1068, 475, 92, 'fx-ring');                        // calendar tile pulse
    var btnGlow = box(under, [1102, 667, 383, 61, 31], 'fx-cta');
    var arr = circle(over, 1445, 698, 46, 'fx-arrow fx-arrow-solid fx-arrow-md', ARROW);
    var link = Array.prototype.filter.call(stage.querySelectorAll(':scope > a'), function (a) { return /Schedule a Visit/.test(a.textContent); })[0];
    if (link) { link.classList.add('fx-visit-link'); bindModal(link, 'visit'); }
    hotZones(stage, [
      { r: [1018, 235, 588, 520], els: [card] },
      { r: [1102, 667, 383, 61], els: [btnGlow, arr] }
    ]);
  })();


  /* =========================================================
     7. FOOTER — CTA card, quick links, workspace options, social
     ========================================================= */
  (function () {
    var stage = doc.querySelector('#contact .exact-stage > div');
    if (!stage) return;
    var under = makeLayer(stage, 'fx-under');
    var over = makeLayer(stage, 'fx-over');
    var links = Array.prototype.slice.call(stage.querySelectorAll(':scope > a'));
    function link(re) { return links.filter(function (a) { return re.test(a.textContent.trim()); })[0]; }
    var zones = [];

    // CTA card: travelling red light around the border
    box(under, [272, 80, 1376, 308, 44], 'fx-cardline');
    // shine on "ideal workspace?"
    var h2 = stage.querySelector(':scope > h2 span');
    if (h2) h2.classList.add('fx-textshine');

    // Book a Tour (red pill)
    var tour = box(under, [360, 303, 227, 54, 27], 'fx-bar fx-bar-glow fx-pill', '<i class="fx-bar-sweep"></i>');
    var tourArr = circle(over, 554, 330, 34, 'fx-arrow fx-arrow-white fx-arrow-sm', ARROW);
    var tourA = link(/^Book a Tour$/);
    if (tourA) { tourA.classList.add('fx-plain'); bindModal(tourA, 'visit'); }
    zones.push({ r: [360, 303, 227, 54], els: [tour, tourArr] });

    // Request a Quote (gold outline pill) -> fills gold on hover
    var quote = box(under, [613, 303, 237, 54, 27], 'fx-goldfill', '<span class="fx-goldfill-ic">' + ARROW + '</span>');
    var quoteA = link(/^Request a Quote$/);
    if (quoteA) { quoteA.classList.add('fx-plain', 'fx-quote-a'); bindModal(quoteA, 'quote', 'Not sure yet'); }
    zones.push({ r: [613, 303, 237, 54], els: [quote].concat(quoteA ? [quoteA] : []) });

    // Quick Links: row highlight, extra chevron slides in, text nudges
    var qTops = [492, 522, 552, 583, 613, 644, 674, 704];
    qTops.forEach(function (t) {
      var a = links.filter(function (x) { return parseFloat(x.style.left) === 660 && parseFloat(x.style.top) === t; })[0];
      var chev = box(over, [646, t + 4, 16, 16, 0], 'fx-chev', CHEV);
      var row = box(under, [618, t - 3, 150, 30, 8], 'fx-row');
      if (a) a.classList.add('fx-slide');
      zones.push({ r: [618, t - 3, 160, 30], els: [chev, row].concat(a ? [a] : []) });
    });

    // Workspace Options: tile glow + action
    var opts = [
      { t: 496, y: 510, plan: 'Day Pass' }, { t: 546, y: 560, plan: 'Dedicated Desk' },
      { t: 596, y: 610, plan: 'Private Cabin' }, { t: 646, y: 660, plan: 'Meeting Room' },
      { t: 696, y: 710, plan: null }
    ];
    opts.forEach(function (o) {
      var tile = box(under, [832, o.y - 21, 51, 42, 11], 'fx-tile', '<i class="fx-shine"></i>');
      var row = box(under, [826, o.y - 25, 200, 50, 12], 'fx-row');
      var a = links.filter(function (x) { return parseFloat(x.style.left) === 901 && parseFloat(x.style.top) === o.t; })[0];
      if (a) {
        a.classList.add('fx-slide');
        if (o.plan) a.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); goToPlan(o.plan); });
        else bindModal(a, 'visit');
      }
      zones.push({ r: [826, o.y - 25, 210, 50], els: [tile, row].concat(a ? [a] : []),
        action: o.plan ? function () { goToPlan(o.plan); } : function () { openModal('visit'); } });
    });

    // Contact rows: icon ring pulse on hover
    [507, 558, 605, 655, 703].forEach(function (y) {
      var ring = circle(under, 1135, y, 40, 'fx-iconring');
      zones.push({ r: [1112, y - 22, 240, 44], els: [ring] });
    });

    // Social tiles + real links
    var social = [
      { y: 500, name: 'Instagram', url: CONFIG.instagram },
      { y: 540, name: 'LinkedIn', url: CONFIG.linkedin },
      { y: 580, name: 'Facebook', url: CONFIG.facebook },
      { y: 622, name: 'WhatsApp', url: 'https://wa.me/' + CONFIG.whatsapp }
    ];
    social.forEach(function (sx) {
      var tile = box(under, [1424, sx.y - 18, 47, 36, 9], 'fx-tile fx-tile-sm', '<i class="fx-shine"></i>');
      var a = links.filter(function (x) { return x.textContent.trim() === sx.name; })[0];
      if (a) {
        a.classList.add('fx-slide');
        if (sx.url) { a.href = sx.url; a.target = '_blank'; a.rel = 'noopener'; }
        else a.addEventListener('click', function (e) { e.preventDefault(); showToast(sx.name + ' page coming soon.'); });
      }
      zones.push({ r: [1420, sx.y - 20, 170, 40], els: [tile].concat(a ? [a] : []),
        action: function () { if (sx.url) window.open(sx.url, '_blank', 'noopener'); else showToast(sx.name + ' page coming soon.'); } });
    });

    // Schedule a Visit (glowing outlined button)
    var sched = box(under, [1407, 663, 261, 66, 15], 'fx-sched', '<i class="fx-bar-sweep"></i>');
    var schedArr = circle(over, 1639, 696, 34, 'fx-arrow fx-arrow-white fx-arrow-sm', ARROW);
    var schedA = link(/^Schedule a Visit$/);
    if (schedA) { schedA.classList.add('fx-plain'); bindModal(schedA, 'visit'); }
    zones.push({ r: [1407, 663, 261, 66], els: [sched, schedArr] });

    hotZones(stage, zones);
  })();

  /* =========================================================
     Other desktop CTAs that should book a visit
     ========================================================= */
  (function () {
    var whyBtn = Array.prototype.filter.call(doc.querySelectorAll('#why .exact-stage a'), function (a) { return /Choose Your Space/.test(a.textContent); })[0];
    if (whyBtn) whyBtn.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); scrollToEl(doc.querySelector('#pricing .exact') || doc.getElementById('pricing')); });
  })();

  /* =========================================================
     MOBILE / TABLET (fluid layout)
     ========================================================= */
  doc.querySelectorAll('.fluid .plan-card').forEach(function (card) {
    var name = (card.querySelector('h3') || {}).textContent || 'Not sure yet';
    bindModal(card.querySelector('.plan-btn'), 'quote', name.trim());
    planFlash[name.trim()] = (planFlash[name.trim()] || []).concat(card);
  });
  bindModal(doc.querySelector('.fluid .custom-plan .btn'), 'quote', 'Custom Plan');
  doc.querySelectorAll('.fluid .cta-bar, .fluid .visit-btn').forEach(function (el) { bindModal(el, 'visit'); });
  doc.querySelectorAll('.fluid .space-card').forEach(function (card) {
    var map = { 'Private Cabins': 'Private Cabin', 'Dedicated Desks': 'Dedicated Desk', 'Meeting Rooms': 'Meeting Room', 'Collaborative Zones': 'Day Pass' };
    var name = map[(card.querySelector('h3') || {}).textContent];
    var link = card.querySelector('.circle-link');
    if (link && name) link.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); goToPlan(name); });
  });
  doc.querySelectorAll('.fluid .loc-card').forEach(function (card, i) {
    var a = card.querySelector('.btn');
    if (a) { a.href = i === 0 ? CONFIG.mapsMohali : CONFIG.mapsZirakpur; a.target = '_blank'; a.rel = 'noopener'; }
  });
  // mobile footer
  doc.querySelectorAll('#contact .fluid a').forEach(function (a) {
    var t = a.textContent.trim();
    if (/^Book a Tour|^Schedule a Visit|^Book a Visit/.test(t)) bindModal(a, 'visit');
    else if (/^Request a Quote/.test(t)) bindModal(a, 'quote', 'Not sure yet');
    else if (/^(Day Pass|Dedicated Desk|Private Cabin|Meeting Room)$/.test(t)) a.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); goToPlan(t); });
    else if (t === 'Instagram') { a.href = CONFIG.instagram; a.target = '_blank'; a.rel = 'noopener'; }
    else if (t === 'WhatsApp') { a.href = 'https://wa.me/' + CONFIG.whatsapp; a.target = '_blank'; a.rel = 'noopener'; }
  });
  // touch devices: tap-glow on cards
  doc.querySelectorAll('.fluid .space-card, .fluid .plan-card, .fluid .amen-card, .fluid .hub-card, .fluid .loc-card').forEach(function (c) {
    c.classList.add('fx-tap');
  });
})();
