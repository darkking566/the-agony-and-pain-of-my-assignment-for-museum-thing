// 各頁共用：選單、頁尾、佔位圖、小工具。
(function () {
  const M = window.MUSEUM;
  const PAGES = [
    { href: 'index.html', label: '首頁', key: 'home' },
    { href: 'exhibit.html', label: '展覽', key: 'exhibit' },
    { href: 'quiz.html', label: '心理測驗', key: 'quiz' },
    { href: 'people.html', label: '人物', key: 'people' },
    { href: 'issues.html', label: '議題與來源', key: 'issues' }
  ];
  const here = document.body.dataset.page || (document.getElementById('home-root') ? 'home' : '');

  window.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  window.phoneById = (id) => M.phones.find((p) => p.id === id);
  window.eraOf = (p) => M.eras.find((e) => e.id === p.era);

  // 還沒有照片時，用手機的外型和顏色畫一張佔位圖。
  const SHAPES = {
    brick:    { w: 84,  h: 214, rx: 10, scr: [14, 40, 56, 22], keys: 4, antenna: true },
    car:      { w: 150, h: 86,  rx: 8,  scr: [14, 14, 48, 22], keys: 3, handset: true },
    flip:     { w: 80,  h: 200, rx: 12, scr: [12, 62, 56, 28], keys: 4, hinge: 56 },
    clam:     { w: 84,  h: 190, rx: 20, scr: [14, 78, 56, 24], keys: 3, hinge: 76 },
    candybar: { w: 90,  h: 190, rx: 20, scr: [13, 26, 64, 52], keys: 3 },
    slider:   { w: 98,  h: 170, rx: 16, scr: [12, 14, 74, 74], keys: 2, slide: true },
    touch:    { w: 104, h: 204, rx: 22, scr: [8, 36, 88, 132], home: true },
    phablet:  { w: 116, h: 216, rx: 18, scr: [8, 26, 100, 152], home: true },
    radio:    { w: 150, h: 170, rx: 10, scr: [18, 22, 44, 44], antenna: true },
    simon:    { w: 78,  h: 230, rx: 8,  scr: [10, 34, 58, 106] },
    modern:   { w: 100, h: 212, rx: 26, scr: [6, 6, 88, 200], cam: true }
  };
  window.placeholder = function (p) {
    const s = SHAPES[p.shape] || SHAPES.candybar;
    const W = 320, H = 400, x0 = (W - s.w) / 2, y0 = (H - s.h) / 2 - 12;
    const c = p.color || '#6e6e73';
    let g = '';
    if (s.antenna) g += `<rect x="${x0 + 10}" y="${y0 - 34}" width="8" height="40" rx="4" fill="${c}"/>`;
    g += `<rect x="${x0}" y="${y0}" width="${s.w}" height="${s.h}" rx="${s.rx}" fill="${c}" stroke="rgba(134,134,139,.55)" stroke-width="1.5"/>`;
    const [sx, sy, sw, sh] = s.scr;
    const screen = p.screen === 'color' ? '#7fb0d8' : (s.home || s.cam ? '#0b0b0d' : '#b7c5a3');
    g += `<rect x="${x0 + sx}" y="${y0 + sy}" width="${sw}" height="${sh}" rx="${s.cam ? 20 : 4}" fill="${screen}" opacity="${s.cam || s.home ? 1 : .9}"/>`;
    if (s.home) g += `<circle cx="${x0 + s.w / 2}" cy="${y0 + s.h - 18}" r="7" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2"/>`;
    if (s.cam) {
      const n = p.triple ? 3 : 2;
      for (let i = 0; i < n; i++) g += `<circle cx="${x0 + 22 + (i % 2) * 18}" cy="${y0 + 22 + Math.floor(i / 2) * 18 + (n === 3 && i === 2 ? 0 : 0)}" r="7" fill="#1c1c1e" stroke="rgba(255,255,255,.3)"/>`;
    }
    if (s.keys) {
      const top = y0 + (s.scr[1] + s.scr[3] + 14), cols = 3;
      for (let r = 0; r < s.keys; r++) for (let k = 0; k < cols; k++)
        g += `<rect x="${x0 + 14 + k * ((s.w - 28) / cols)}" y="${top + r * 16}" width="${(s.w - 28) / cols - 6}" height="9" rx="4" fill="rgba(255,255,255,.28)"/>`;
    }
    if (s.hinge) g += `<line x1="${x0 + 3}" x2="${x0 + s.w - 3}" y1="${y0 + s.hinge}" y2="${y0 + s.hinge}" stroke="rgba(0,0,0,.45)" stroke-width="2"/>`;
    if (s.slide) g += `<line x1="${x0 + 3}" x2="${x0 + s.w - 3}" y1="${y0 + 108}" y2="${y0 + 108}" stroke="rgba(0,0,0,.45)" stroke-width="2"/>`;
    if (s.handset) g += `<path d="M${x0 + 90} ${y0 + 20} h46 a6 6 0 0 1 6 6 v10 a6 6 0 0 1 -6 6 h-46 z" fill="rgba(255,255,255,.18)"/>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">${g}` +
      `<text x="${W / 2}" y="${H - 22}" text-anchor="middle" font-family="-apple-system,'PingFang TC','Noto Sans TC',sans-serif" font-size="14" fill="#86868b">示意圖・${p.year}</text></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  };
  window.photo = (p) => `<div class="photo${p.img ? ' real' : ''}"><img src="${esc(p.img || placeholder(p))}" alt="${esc(p.name)}" loading="lazy" onerror="this.onerror=null;this.src=placeholder(phoneById('${p.id}'))"></div>`;

  const navHost = document.getElementById('site-nav');
  if (navHost) navHost.innerHTML = `
    <header class="nav"><div class="nav-in">
      <a class="brand" href="index.html">機不可失</a>
      <nav class="nav-links" aria-label="主選單">
        ${PAGES.map((p) => `<a href="${p.href}"${p.key === here ? ' aria-current="page"' : ''}>${p.label}</a>`).join('')}
      </nav>
    </div></header>`;

  // 窄螢幕上連結排不下時：目前這頁自動捲到中間，右邊還有東西時用漸層提示
  const links = navHost && navHost.querySelector('.nav-links');
  if (links) {
    const cur = links.querySelector('[aria-current="page"]');
    if (cur) links.scrollLeft = cur.offsetLeft - (links.clientWidth - cur.offsetWidth) / 2;
    const hint = () => links.classList.toggle('has-more', links.scrollWidth - links.clientWidth - links.scrollLeft > 4);
    links.addEventListener('scroll', hint, { passive: true });
    window.addEventListener('resize', hint);
    hint();
  }

  const footHost = document.getElementById('site-footer');
  if (footHost) footHost.innerHTML = `
    <footer class="footer"><div class="wrap">
      <p class="foot-mark" aria-hidden="true">機不可失</p>
      <p>博物館就像是每件展品的漫長「自我介紹」。</p>
      <p>部分展品圖片仍為佔位圖，圖片授權見「議題與來源」頁。情境重現的人物與情節為依史料推想的虛構內容。</p>
      <nav aria-label="頁尾">${PAGES.map((p) => `<a href="${p.href}">${p.label}</a>`).join('')}</nav>
    </div></footer>`;
})();
