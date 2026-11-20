// 換頁轉場。放在 <head>，讓它在頁面畫出來之前就能先蓋住畫面。
//   離場：藍色或黑色光圈從點擊的位置擴張到蓋滿整個畫面，並顯示下一頁的名字。
//   進場：幕簾向上升起，開場區塊的內容依序浮現。
//   展品卡片：照片從首頁的位置飛到展品頁的位置。
// 瀏覽器原生的跨頁轉場在 iframe 裡不一定能用，所以這裡自己演。
(function () {
  'use strict';
  var doc = document.documentElement;
  var RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var KEY = 'mx-transition';
  var BLUE = '#0071e3', BLACK = '#000000';
  var EASE_OUT = 'cubic-bezier(.2,.8,.2,1)';
  var EASE_IO = 'cubic-bezier(.76,0,.24,1)';
  var leaving = false;

  /* ---------- 換頁時要帶給下一頁的資料 ---------- */
  function put(o) {
    o.t = Date.now();
    var s = JSON.stringify(o);
    try { sessionStorage.setItem(KEY, s); } catch (e) {
      try { window.name = 'mx:' + s; } catch (_) { /* 帶不過去就算了，下一頁只是不演進場 */ }
    }
  }
  function take() {
    var s = null;
    try { s = sessionStorage.getItem(KEY); sessionStorage.removeItem(KEY); } catch (e) { /* 沒有 sessionStorage */ }
    if (!s) {
      try { if (window.name.indexOf('mx:') === 0) { s = window.name.slice(3); window.name = ''; } } catch (e) { /* 略過 */ }
    }
    if (!s) return null;
    try {
      var o = JSON.parse(s);
      return (o && Date.now() - o.t < 8000) ? o : null;
    } catch (e) { return null; }
  }

  /* ---------- 進場的前置：一載入就先蓋住畫面 ---------- */
  var incoming = take();
  if (RM) incoming = null;
  var inColor = BLACK;
  doc.classList.add('mx-enter');
  if (incoming) {
    inColor = incoming.c === BLUE ? BLUE : BLACK;
    doc.style.setProperty('--mx-c', inColor);
    doc.style.setProperty('--mx-d', incoming.m === 'fly' ? '260ms' : '400ms');
    doc.classList.add('mx-cover', 'mx-hold');
    if (incoming.m === 'fly') doc.classList.add('mx-fly');
    // 萬一後面的程式出錯，也不會一直蓋著
    setTimeout(function () { doc.classList.remove('mx-cover', 'mx-hold'); }, 4500);
  }

  /* ---------- 小工具 ---------- */
  function curtain(info, color) {
    var d = document.createElement('div');
    d.className = 'mx-curtain';
    d.setAttribute('aria-hidden', 'true');
    d.style.background = color;
    d.setAttribute('data-tone', color === BLUE ? 'blue' : 'dark');
    if (info) {
      var l = document.createElement('div'); l.className = 'mx-label';
      var e = document.createElement('span'); e.className = 'mx-eyebrow'; e.textContent = info.eyebrow || '';
      var t = document.createElement('strong'); t.className = 'mx-title'; t.textContent = info.title || '';
      l.appendChild(e); l.appendChild(t); d.appendChild(l);
    }
    return d;
  }
  function px(n) { return n + 'px'; }
  function okNum(n) { return typeof n === 'number' && isFinite(n); }
  // 字體樣式表是「不擋繪製」的載入方式（media=print 載完再切成 all），
  // 所以要先等樣式表本身載完，document.fonts 才知道有哪些字體要載。
  function sheetReady() {
    return new Promise(function (res) {
      var l = document.querySelector('link[href*="fonts.googleapis.com"]');
      if (!l || l.media === 'all' || l.sheet && l.media !== 'print') return res();
      l.addEventListener('load', function () { res(); });
      l.addEventListener('error', function () { res(); });
    });
  }
  // 標題用的明體載好了才 resolve（載不到就由呼叫端的上限時間放行）
  function serifReady(text) {
    return sheetReady().then(function () {
      return (document.fonts && document.fonts.load)
        ? document.fonts.load('700 40px "Noto Serif TC"', text || '').catch(function () {}) : null;
    });
  }
  function fontsReady(text) {
    var cap = new Promise(function (r) { setTimeout(r, 1000); });
    var all = sheetReady().then(function () {
      return Promise.all([serifReady(text), document.fonts && document.fonts.ready]);
    });
    return Promise.race([all, cap]);
  }

  // 依網址決定幕簾上要寫什麼，文字和下一頁開場區塊的標題對得上
  function describe(u) {
    var seg = u.pathname.split('/').pop() || '';
    var name = /\.html$/.test(seg) ? seg.replace(/\.html$/, '') : 'index';
    var hash = ''; try { hash = decodeURIComponent((u.hash || '').slice(1)); } catch (e) { /* 略過 */ }
    var M = window.MUSEUM;
    var phone = function (id) { return M && M.phones && M.phones.filter(function (p) { return p.id === id; })[0]; };
    var PAGE = {
      index: ['線上互動博物館', '機不可失'], exhibit: ['主展區', '行動電話時間軸'],
      quiz: ['入場前', '你是哪一種手機？'], people: ['幕後推手', '重要人物'],
      issues: ['延伸思考', '手機與我們的生活'], phone: ['展品介紹', '展品介紹']
    };
    var r = PAGE[name] || ['機不可失', '機不可失'], m, p;
    if (name === 'phone' && (p = phone(hash))) r = [p.year + ' 年', p.name];
    if (name === 'exhibit' && M) {
      if ((m = hash.match(/^era-(.+)$/))) {
        var era = M.eras.filter(function (e) { return e.id === m[1]; })[0];
        if (era) r = ['行動電話時間軸', era.label];
      } else if ((m = hash.match(/^(phone|hall)-(.+)$/)) && (p = phone(m[2]))) {
        r = [m[1] === 'hall' ? '3D 展廳' : '行動電話時間軸', p.name];
      } else if ((m = hash.match(/^scene-(.+)$/)) && M.scenes && M.scenes[m[1]]) {
        r = ['沉浸體驗', M.scenes[m[1]].title];
      }
    }
    return { eyebrow: r[0], title: r[1] };
  }

  /* ---------- 離場 ---------- */
  function leaveIris(a, o, info, color, nav) {
    var x = innerWidth / 2, y = innerHeight / 2;
    var isBtn = !!(a && a.classList && a.classList.contains('btn'));
    if (a && a.getBoundingClientRect) {
      var r = a.getBoundingClientRect();
      x = r.left + r.width / 2; y = r.top + r.height / 2;
    }
    var ev = o.event;
    if (ev && !isBtn && (ev.clientX || ev.clientY)) { x = ev.clientX; y = ev.clientY; }
    var R = Math.ceil(Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))) + 4;
    var from = 'circle(0px at ' + px(x) + ' ' + px(y) + ')';
    var to = 'circle(' + px(R) + ' at ' + px(x) + ' ' + px(y) + ')';
    var c = curtain(info, color);
    c.style.clipPath = from;
    document.body.appendChild(c);
    var label = c.querySelector('.mx-label');
    label.style.opacity = '0';
    label.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }],
      { duration: 340, delay: 300, easing: EASE_OUT, fill: 'forwards' });
    var an = c.animate([{ clipPath: from }, { clipPath: to }],
      { duration: 660, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
    an.onfinish = nav;
  }

  function makePhoto(f) {
    var d = document.createElement('div');
    d.className = 'photo' + (f.real ? ' real' : '');
    var im = document.createElement('img');
    im.alt = ''; im.src = f.src;
    d.appendChild(im);
    d.style.cssText = 'position:fixed;margin:0;z-index:2147483001;pointer-events:none;box-shadow:0 30px 80px rgba(0,0,0,.55);' +
      'left:' + px(f.x) + ';top:' + px(f.y) + ';width:' + px(f.w) + ';height:' + px(f.h) + ';' +
      'border-radius:' + f.rad + ';background-color:' + f.bg + ';transform:scale(1.06);transform-origin:50% 50%';
    return d;
  }

  function leaveFly(photo, nav, fadeIn) {
    var r = photo.getBoundingClientRect(), cs = getComputedStyle(photo), im = photo.querySelector('img');
    var f = {
      src: im ? (im.currentSrc || im.src) : '', real: photo.classList.contains('real'),
      x: r.left, y: r.top, w: r.width, h: r.height, bg: cs.backgroundColor, rad: cs.borderTopLeftRadius
    };
    put({ c: BLACK, m: 'fly', fly: f });
    var c = curtain(null, BLACK);
    c.style.opacity = '0';
    document.body.appendChild(c);
    var clone = makePhoto(f);
    clone.style.transform = 'scale(1)';
    clone.style.boxShadow = 'none';
    document.body.appendChild(clone);
    if (fadeIn) clone.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, fill: 'backwards' });
    c.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 440, easing: 'ease-in', fill: 'forwards' });
    var an = clone.animate([
      { transform: 'scale(1)', boxShadow: '0 0 0 rgba(0,0,0,0)' },
      { transform: 'scale(1.06)', boxShadow: '0 30px 80px rgba(0,0,0,.55)' }
    ], { duration: 440, easing: EASE_OUT, fill: 'forwards' });
    an.onfinish = nav;
  }

  function go(href, o) {
    o = o || {};
    var u;
    try { u = new URL(href, location.href); } catch (e) { location.href = href; return; }
    if (RM || leaving || !document.body || !document.body.animate) { location.href = href; return; }
    leaving = true;
    var a = o.from, cl = a && a.classList;
    var done = false;
    function nav() { if (done) return; done = true; location.href = href; }
    setTimeout(nav, 1500);
    var photo = null, fadeIn = false;
    if (cl && (cl.contains('pick') || cl.contains('strip-item'))) photo = a.querySelector('.photo');
    else if (cl && cl.contains('back-link')) {
      var card = a.closest('.flip');
      photo = card && card.querySelector('.flip-front .photo');
      fadeIn = true;
    }
    if (photo) { leaveFly(photo, nav, fadeIn); return; }
    var color = cl && cl.contains('primary') ? BLUE : BLACK;
    var info = describe(u);
    put({ c: color, m: 'iris', eyebrow: info.eyebrow, title: info.title });
    leaveIris(a, o, info, color, nav);
  }
  // 頁內的幕簾：不換頁，只蓋住畫面一下再收起來。
  //   MX.veil(元素, { color, eyebrow, title })      光圈從元素中心擴張
  //   MX.veil(null, { color, instant: true })        直接蓋住（用在離開場景之後）
  // 回傳 { covered: 已蓋滿的 Promise, reveal(): 收起來, cancel(): 立刻拿掉 }
  function veil(from, o) {
    o = o || {};
    var none = { covered: Promise.resolve(), reveal: function () {}, cancel: function () {} };
    if (RM || !document.body || !document.body.animate) return none;
    var color = o.color || BLACK;
    var c = curtain(o.title && !o.instant ? { eyebrow: o.eyebrow, title: o.title } : null, color);
    var label = c.querySelector('.mx-label');
    var covered, gone = false;
    if (o.instant) {
      document.body.appendChild(c);
      covered = Promise.resolve();
    } else {
      var x = innerWidth / 2, y = innerHeight / 2;
      if (from && from.getBoundingClientRect) {
        var r = from.getBoundingClientRect();
        x = r.left + r.width / 2; y = r.top + r.height / 2;
      }
      var R = Math.ceil(Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))) + 4;
      var f = 'circle(0px at ' + px(x) + ' ' + px(y) + ')';
      c.style.clipPath = f;
      document.body.appendChild(c);
      if (label) {
        label.style.opacity = '0';
        label.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }],
          { duration: 340, delay: 280, easing: EASE_OUT, fill: 'forwards' });
      }
      covered = new Promise(function (res) {
        c.animate([{ clipPath: f }, { clipPath: 'circle(' + px(R) + ' at ' + px(x) + ' ' + px(y) + ')' }],
          { duration: 620, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' }).onfinish = res;
      });
    }
    setTimeout(function () { c.remove(); }, 20000);   // 沒人收的話，自己收
    return {
      covered: covered,
      reveal: function () {
        covered.then(function () {
          if (gone) return;
          gone = true;
          if (label) label.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-16px)' }],
            { duration: 320, delay: 220, easing: 'ease-in', fill: 'forwards' });
          c.animate([{ opacity: 1 }, { opacity: 0 }],
            { duration: 520, delay: label ? 480 : 60, easing: 'ease-out', fill: 'forwards' }).onfinish = function () { c.remove(); };
        });
      },
      cancel: function () { gone = true; c.remove(); }
    };
  }
  window.MX = { go: go, veil: veil };

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target && e.target.closest && e.target.closest('a[href]');
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    var raw = a.getAttribute('href') || '';
    if (/^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(raw)) return;   // 外部連結、mailto、同頁錨點都不演
    var u; try { u = new URL(a.href, location.href); } catch (_) { return; }
    if (u.pathname === location.pathname && u.search === location.search) return; // 同一頁只換 # 的不演
    e.preventDefault();
    go(raw, { from: a, event: e });
  });

  // 按上一頁回來時，頁面可能是從快取直接還原，要把離場的幕簾收掉
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    leaving = false;
    var list = document.querySelectorAll('.mx-curtain');
    for (var i = 0; i < list.length; i++) list[i].remove();
    doc.classList.remove('mx-cover', 'mx-hold');
  });

  /* ---------- 進場 ---------- */
  function finishEnter() {
    doc.classList.remove('mx-cover', 'mx-hold', 'mx-fly');
    doc.style.setProperty('--mx-d', '0ms');   // 之後頁內換內容（例如展品頁互相切換）不用再等
  }

  function enterIris() {
    var c = curtain({ eyebrow: incoming.eyebrow, title: incoming.title }, inColor);
    document.body.appendChild(c);
    doc.classList.remove('mx-cover');          // 真正的幕簾已經就位，換掉暫時的那層
    fontsReady().then(function () {
      var label = c.querySelector('.mx-label');
      label.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-20px)' }],
        { duration: 380, delay: 240, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' });
      doc.classList.remove('mx-hold');         // 開場區塊的內容從這一刻開始浮現
      var an = c.animate([{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(0 0 100% 0)' }],
        { duration: 860, delay: 300, easing: EASE_IO, fill: 'forwards' });
      an.onfinish = function () { c.remove(); finishEnter(); };
    });
  }

  function enterFly() {
    var f = incoming.fly;
    var c = curtain(null, BLACK);
    document.body.appendChild(c);
    doc.classList.remove('mx-cover');
    var valid = f && typeof f.src === 'string' && /^(data:image\/|https?:\/\/|images\/|\.\/|\/)/.test(f.src) &&
      okNum(f.x) && okNum(f.y) && okNum(f.w) && okNum(f.h) && typeof f.rad === 'string' && typeof f.bg === 'string';
    fontsReady().then(function () {
      var target = document.querySelector('.phone-hero .photo');
      if (!valid || !target) {
        doc.classList.remove('mx-hold');
        c.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, easing: 'ease-out', fill: 'forwards' }).onfinish = function () { c.remove(); finishEnter(); };
        return;
      }
      var tr = target.getBoundingClientRect(), tcs = getComputedStyle(target);
      target.style.visibility = 'hidden';
      var clone = makePhoto(f);
      document.body.appendChild(clone);
      doc.classList.remove('mx-hold');
      c.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 700, delay: 80, easing: 'ease-out', fill: 'forwards' });
      var an = clone.animate([
        { left: px(f.x), top: px(f.y), width: px(f.w), height: px(f.h), transform: 'scale(1.06)', borderRadius: f.rad, backgroundColor: f.bg, boxShadow: '0 30px 80px rgba(0,0,0,.55)' },
        { left: px(tr.left), top: px(tr.top), width: px(tr.width), height: px(tr.height), transform: 'scale(1)', borderRadius: tcs.borderTopLeftRadius, backgroundColor: tcs.backgroundColor, boxShadow: '0 0 0 rgba(0,0,0,0)' }
      ], { duration: 950, easing: 'cubic-bezier(.65,0,.2,1)', fill: 'forwards' });
      an.onfinish = function () {
        target.style.visibility = '';
        clone.remove(); c.remove(); finishEnter();
      };
    });
  }

  /* ---------- 首頁：數字往上跳 ---------- */
  function countUp() {
    var els = ['stat-years', 'stat-eras', 'stat-phones', 'stat-people']
      .map(function (id) { return document.getElementById(id); }).filter(Boolean);
    if (!els.length || RM || !('IntersectionObserver' in window)) return;
    var box = els[0].closest('.stats') || els[0];
    // 一進來就看得到的數字不重來，只有要往下捲才看得到的才演
    if (box.getBoundingClientRect().top < innerHeight * 0.85) return;
    var vals = els.map(function (e) { return parseInt(e.textContent, 10) || 0; });
    els.forEach(function (e) { e.textContent = '0'; });
    var io = new IntersectionObserver(function (entries) {
      if (!entries.some(function (x) { return x.isIntersecting; })) return;
      io.disconnect();
      var t0 = performance.now();
      (function tick(now) {
        var k = Math.min(1, (now - t0) / 1300), v = 1 - Math.pow(1 - k, 3);
        els.forEach(function (e, i) { e.textContent = Math.round(vals[i] * v); });
        if (k < 1) requestAnimationFrame(tick);
      })(t0);
    }, { threshold: 0.5 });
    io.observe(box);
  }

  /* ---------- 往下捲時，各區塊依序浮現 ----------
     從 30% 透明度開始，沒浮現也看得到內容；一進來就在畫面裡的不演。 */
  function reveal() {
    if (RM || !('IntersectionObserver' in window)) return;
    if (document.getElementById('panel-2d') || document.getElementById('quiz-card')) return;   // 展覽頁、測驗頁自己有動畫
    var GRIDS = '.pick-grid, .door-grid, .era-tiles, .people-grid, .people-list, .issue-grid, .stats';
    var items = [];
    [].forEach.call(document.querySelectorAll('.band > .wrap'), function (w) {
      if (w.parentElement.matches('.hero, .page-head, .phone-hero')) return;
      [].forEach.call(w.children, function (ch) {
        if (ch.matches(GRIDS)) [].forEach.call(ch.children, function (c, i) { items.push([c, i]); });
        else items.push([ch, 0]);
      });
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        io.unobserve(el);
        el.style.setProperty('--rd', (el.__rd || 0) * 70 + 'ms');
        el.classList.remove('mx-pre');
        el.classList.add('mx-in');
        el.addEventListener('animationend', function (ev) {
          if (ev.target === el) el.classList.remove('mx-in');
        });
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (it) {
      var el = it[0];
      if (el.getBoundingClientRect().top < innerHeight * 0.92) return;
      el.__rd = it[1] % 4;
      el.classList.add('mx-pre');
      io.observe(el);
    });
  }

  function ready() {
    if (incoming) { if (incoming.m === 'fly') enterFly(); else enterIris(); }
    countUp();
    reveal();
    loadPolish();
  }

  // 質感與動畫的第二批（js/polish.js），所有頁面都用得到，放在頁面畫好之後再載入
  function loadPolish() {
    if (document.querySelector('script[data-mx-polish]')) return;
    var s = document.createElement('script');
    s.src = 'js/polish.js';
    s.setAttribute('data-mx-polish', '');
    document.body.appendChild(s);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
})();
