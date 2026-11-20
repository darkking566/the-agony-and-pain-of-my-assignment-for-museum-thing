// 質感與動畫第二批：捲動進度、光暈視差、橫幅傾斜、卡片光斑、蓋章、時間軸。
// 由 transitions.js 在頁面載入後補進來。所有動作都有降級：沒有游標、偏好減少動態時不演。
(function () {
  'use strict';
  var RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var FINE = !!(window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches);
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  function raf(fn) {
    var busy = false, args;
    return function () {
      args = arguments;
      if (busy) return;
      busy = true;
      requestAnimationFrame(function () { busy = false; fn.apply(null, args); });
    };
  }

  /* ---------- 導覽列的捲動進度 ---------- */
  (function () {
    var nav = $('.nav');
    if (!nav) return;
    var bar = document.createElement('i');
    bar.className = 'nav-progress';
    bar.setAttribute('aria-hidden', 'true');
    nav.appendChild(bar);
    var de = document.documentElement;
    var update = raf(function () {
      var max = de.scrollHeight - innerHeight;
      var k = max > 0 ? Math.min(1, Math.max(0, (window.pageYOffset || de.scrollTop) / max)) : 0;
      bar.style.transform = 'scaleX(' + k.toFixed(4) + ')';
    });
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    update();
  })();

  /* ---------- 卡片：光斑跟著游標 ---------- */
  if (FINE) {
    var GLOW = '.door, .era-tile, .pick, .route, .flip-front, .card';
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch' || !e.target.closest) return;
      var t = e.target.closest(GLOW);
      if (!t) return;
      var r = t.getBoundingClientRect();
      t.style.setProperty('--gx', (e.clientX - r.left).toFixed(0) + 'px');
      t.style.setProperty('--gy', (e.clientY - r.top).toFixed(0) + 'px');
    }, { passive: true });
  }

  /* ---------- 開場：光暈視差 + 橫幅照片傾斜 ---------- */
  if (FINE && !RM) {
    $$('.hero, .page-head.dark').forEach(function (h) {
      var move = raf(function (e) {
        var r = h.getBoundingClientRect();
        h.style.setProperty('--px', (((e.clientX - r.left) / r.width - .5) * 2).toFixed(3));
        h.style.setProperty('--py', (((e.clientY - r.top) / r.height - .5) * 2).toFixed(3));
      });
      h.addEventListener('pointermove', move, { passive: true });
      h.addEventListener('pointerleave', function () { h.style.setProperty('--px', 0); h.style.setProperty('--py', 0); });
    });
    var strip = $('.hero-strip');
    if (strip) {
      var last = null;
      var reset = function () {
        if (!last) return;
        last.classList.remove('tilting');
        last.style.removeProperty('--rx'); last.style.removeProperty('--ry');
        last = null;
      };
      strip.addEventListener('pointermove', function (e) {
        var it = e.target.closest && e.target.closest('.strip-item');
        var ph = it && it.querySelector('.photo');
        if (ph !== last) reset();
        if (!ph) return;
        var r = ph.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        ph.classList.add('tilting');
        ph.style.setProperty('--ry', (x * 16).toFixed(1) + 'deg');
        ph.style.setProperty('--rx', (-y * 16).toFixed(1) + 'deg');
        last = ph;
      }, { passive: true });
      strip.addEventListener('pointerleave', reset);
    }
  }

  /* ---------- 參觀護照：蓋章 + 全部集滿的彩紙 ---------- */
  var SEEN_KEY = 'mx-stamp-seen-v1';
  var memSeen = {};
  function readSeen() {
    try { var o = JSON.parse(localStorage.getItem(SEEN_KEY) || '{}') || {}; for (var k in memSeen) o[k] = 1; return o; }
    catch (e) { return memSeen; }
  }
  function markSeen(id) {
    memSeen[id] = 1;
    try { var o = JSON.parse(localStorage.getItem(SEEN_KEY) || '{}') || {}; o[id] = 1; localStorage.setItem(SEEN_KEY, JSON.stringify(o)); } catch (e) { /* 存不了就只在這一頁有效 */ }
  }

  function confetti(x, y) {
    if (RM) return;
    var c = document.createElement('canvas');
    c.className = 'mx-confetti';
    c.setAttribute('aria-hidden', 'true');
    var dpr = Math.min(2, window.devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    c.width = W * dpr; c.height = H * dpr;
    document.body.appendChild(c);
    var g = c.getContext('2d');
    if (!g) { c.remove(); return; }
    g.scale(dpr, dpr);
    var colors = ['#2997ff', '#64d2ff', '#ffffff', '#ffd60a', '#0071e3'];
    var ps = [];
    for (var i = 0; i < 96; i++) {
      var a = -Math.PI / 2 + (Math.random() - .5) * Math.PI * 1.15, v = 6 + Math.random() * 9;
      ps.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, w: 5 + Math.random() * 6, h: 3 + Math.random() * 4,
        r: Math.random() * 6.28, vr: (Math.random() - .5) * .4, col: colors[i % colors.length], life: 0, max: 100 + Math.random() * 60 });
    }
    (function tick() {
      g.clearRect(0, 0, W, H);
      var alive = 0;
      ps.forEach(function (p) {
        if (p.life > p.max) return;
        alive++; p.life++;
        p.vx *= .985; p.vy = p.vy * .985 + .3; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        g.save(); g.globalAlpha = Math.max(0, 1 - p.life / p.max);
        g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.col; g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); g.restore();
      });
      if (alive) requestAnimationFrame(tick); else c.remove();
    })();
  }

  function playStamp(el, seen) {
    var seal = $('.seal', el);
    el.classList.add('stamp-new');
    if (seal) seal.classList.add('seal-new');
    setTimeout(function () { el.classList.remove('stamp-new'); if (seal) seal.classList.remove('seal-new'); }, 1500);
    var host = $('#passport'), all = $$('.stamp', host);
    if (all.length && all.every(function (s) { return s.classList.contains('got'); }) && !readSeen().__all) {
      markSeen('__all');
      setTimeout(function () {
        var r = (seal || el).getBoundingClientRect();
        confetti(r.left + r.width / 2, r.top + r.height / 2);
      }, 650);
    }
  }

  var stampIO = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      stampIO.unobserve(en.target);
      var id = en.target.__mxId;
      if (!id) return;
      markSeen(id);
      if (RM) return;
      playStamp(en.target);
    });
  }, { threshold: 0.7 }) : null;

  function syncStamps() {
    var host = $('#passport');
    if (!host) return;
    var seen = readSeen();
    $$('.stamp.got', host).forEach(function (el) {
      var m = (el.getAttribute('href') || '').match(/scene-(.+)$/);
      if (!m || seen[m[1]] || el.__mxWatching) return;
      el.__mxId = m[1]; el.__mxWatching = true;
      if (stampIO) stampIO.observe(el); else markSeen(m[1]);
    });
  }
  (function () {
    var host = $('#passport');
    if (!host) return;
    syncStamps();
    new MutationObserver(syncStamps).observe(host, { childList: true });
  })();

  /* ---------- 展覽頁：年代列下的時間軸 ---------- */
  (function () {
    var rail = $('#era-rail');
    if (!rail) return;
    var track = document.createElement('div');
    track.className = 'era-track';
    track.setAttribute('aria-hidden', 'true');
    track.innerHTML = '<i class="base"></i><i class="fill"></i>';
    rail.appendChild(track);
    var base = $('.base', track), fill = $('.fill', track), ticks = [];
    function layout() {
      var dots = $$('.era-dot', rail);
      if (dots.length < 2) return;
      while (ticks.length < dots.length) {
        var t = document.createElement('b'); t.className = 'tick'; track.appendChild(t); ticks.push(t);
      }
      var sel = 0, cx = [];
      dots.forEach(function (d, i) {
        if (d.getAttribute('aria-selected') === 'true') sel = i;
        cx.push(d.offsetLeft + d.offsetWidth / 2);
      });
      base.style.left = cx[0] + 'px';
      base.style.width = (cx[cx.length - 1] - cx[0]) + 'px';
      fill.style.left = cx[0] + 'px';
      fill.style.width = (cx[sel] - cx[0]) + 'px';
      ticks.forEach(function (t, i) {
        t.style.left = cx[i] + 'px';
        t.classList.toggle('on', i <= sel);
        t.classList.toggle('cur', i === sel);
      });
    }
    new MutationObserver(raf(layout)).observe(rail, { attributes: true, attributeFilter: ['aria-selected'], subtree: true });
    addEventListener('resize', raf(layout));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    layout();
  })();
  /* ---------- 年代色 ---------- */
  var ERA = { '1940s': '#7c5e3c', '1970s': '#b0562a', '1980s': '#b8324a', '1990s': '#197a62', '2000s': '#1976b8', '2010s': '#4f56c4', '2020s': '#00788f' };
  $$('.person[data-era]').forEach(function (a) {
    var c = ERA[a.getAttribute('data-era')];
    if (c) a.style.setProperty('--era', c);
  });
  (function () {
    var root = $('#phone-root'), M = window.MUSEUM;
    if (!root || !M) return;
    function paint() {
      var id = ''; try { id = decodeURIComponent(location.hash.slice(1)); } catch (e) { /* 略過 */ }
      var p = M.phones.filter(function (x) { return x.id === id; })[0];
      var c = p && ERA[p.era];
      if (c) root.style.setProperty('--era', c); else root.style.removeProperty('--era');
    }
    addEventListener('hashchange', paint);
    paint();
  })();
  $$('.era-tile').forEach(function (a) {
    var m = (a.getAttribute('href') || '').match(/era-(.+)$/);
    if (m && ERA[m[1]]) a.style.setProperty('--era', ERA[m[1]]);
  });
  (function () {
    var rail = $('#era-rail'), box = $('#panel-2d'), M = window.MUSEUM;
    if (!rail || !box || !M) return;
    function paint() {
      var dots = $$('.era-dot', rail), ticks = $$('.tick', rail), sel = 0;
      dots.forEach(function (d, i) { if (d.getAttribute('aria-selected') === 'true') sel = i; });
      var cur = ERA[(M.eras[sel] || {}).id] || '';
      if (cur) box.style.setProperty('--era', cur);
      ticks.forEach(function (t, i) { var c = ERA[(M.eras[i] || {}).id]; if (c) t.style.setProperty('--era', c); });
      var f = $('.fill', rail);
      if (f) {
        f.style.setProperty('--from', ERA[(M.eras[0] || {}).id] || '');
        f.style.setProperty('--to', cur);
      }
    }
    new MutationObserver(raf(paint)).observe(rail, { attributes: true, attributeFilter: ['aria-selected'], subtree: true, childList: true });
    paint();
  })();

  /* ---------- 圖片：載入時先模糊，載好再淡入 ---------- */
  (function () {
    function watch(root) {
      $$('.photo img', root).forEach(function (im) {
        if (im.__mxW || im.complete) return;
        im.__mxW = true;
        im.classList.add('ld');
        var done = function () { im.classList.remove('ld'); };
        im.addEventListener('load', done, { once: true });
        im.addEventListener('error', done, { once: true });
        setTimeout(done, 6000);
      });
    }
    watch(document);
    new MutationObserver(raf(function () { watch(document); })).observe(document.body, { childList: true, subtree: true });
  })();
})();
