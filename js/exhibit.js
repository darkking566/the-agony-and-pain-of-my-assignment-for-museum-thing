// 展覽頁：平面時間軸、3D 展廳、沉浸體驗。
(function () {
  const M = window.MUSEUM;
  const $ = (sel) => document.querySelector(sel);

  /* ---------- 2D 時間軸 ---------- */
  const rail = $('#era-rail');
  const panel = $('#era-panel');
  let currentEra = Math.max(0, M.eras.findIndex((e) => M.phones.some((p) => p.era === e.id)));  // 預設停在第一個有展品的年代
  let coreOnly = false;
  let query = '';

  rail.innerHTML = M.eras.map((e, i) =>
    `<button class="era-dot" role="tab" data-i="${i}" aria-selected="${i === 0}">${esc(e.label)}</button>`).join('');
  rail.querySelectorAll('.era-dot').forEach((b) => b.addEventListener('click', () => selectEra(+b.dataset.i)));
  // 分頁列方向鍵：← → 換年代，Home / End 跳頭尾
  function tabKeys(list, pick) {
    list.addEventListener('keydown', (e) => {
      const tabs = [...list.querySelectorAll('[role="tab"]')];
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      let n = -1;
      if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') n = 0;
      else if (e.key === 'End') n = tabs.length - 1;
      if (n < 0) return;
      e.preventDefault(); tabs[n].focus(); pick(n);
    });
  }
  tabKeys(rail, (n) => selectEra(n));
  // 藍色的選取塊在年代之間滑過去，不是瞬間換色
  rail.insertAdjacentHTML('beforeend', '<span class="era-ind" aria-hidden="true"></span>');
  const ind = rail.querySelector('.era-ind');
  function moveInd(i) {
    const b = rail.querySelectorAll('.era-dot')[i];
    if (!b || !b.offsetWidth) return;
    ind.style.width = b.offsetWidth + 'px';
    ind.style.height = b.offsetHeight + 'px';
    ind.style.transform = `translate(${b.offsetLeft}px, ${b.offsetTop}px)`;
    ind.classList.add('on');
  }
  window.addEventListener('resize', () => moveInd(currentEra));
  if (document.fonts) document.fonts.ready.then(() => moveInd(currentEra));

  // 卡片本身是容器，翻面和「看詳細介紹」各自是真正的按鈕、連結；看不到的那一面用 inert 擋住，鍵盤不會跳進去。
  function phoneCard(p) {
    return `
      <div class="flip" role="group" data-id="${p.id}" aria-label="${esc(p.name)}">
        <div class="flip-inner">
          <div class="flip-face flip-front">
            ${p.exhibit ? '<span class="badge">核心展品</span>' : ''}
            ${photo(p)}
            <div class="year">${p.year}</div>
            <div class="name">${esc(p.name)}</div>
            <button class="tap" type="button" aria-label="翻面看「${esc(p.name)}」的介紹">點一下翻面 ↻</button>
          </div>
          <div class="flip-face flip-back" inert>
            <h4>${esc(p.name)}</h4>
            <div class="label">歷史特色</div>
            <p>${esc(p.feature)}</p>
            <div class="label">外表與功能</div>
            <p>${esc(p.look)}</p>
            ${p.imgNote ? `<p class="img-note">${esc(p.imgNote)}</p>` : ''}
            <div class="back-actions">
              <a class="back-link" href="phone.html#${esc(p.id)}">看詳細介紹 ›</a>
              <button class="back-flip" type="button">翻回正面</button>
            </div>
          </div>
        </div>
      </div>`;
  }

  function bindCards(root) {
    root.querySelectorAll('.flip').forEach((f) => {
      const front = f.querySelector('.flip-front'), back = f.querySelector('.flip-back');
      f.addEventListener('click', (e) => {
        if (e.target.closest('a')) return;          // 連結自己處理（換頁轉場）
        const viaButton = !!e.target.closest('button');
        const on = f.classList.toggle('flipped');
        front.inert = on;
        back.inert = !on;
        if (viaButton) (on ? back.querySelector('.back-flip') : front.querySelector('.tap')).focus({ preventScroll: true });
      });
    });
  }

  // 只做水平捲動，避免整頁跳動
  function centerIn(container, el) {
    container.scrollTo({ left: el.offsetLeft - (container.clientWidth - el.offsetWidth) / 2, behavior: 'smooth' });
  }

  function selectEra(i, highlightId) {
    const dir = Math.sign(i - currentEra);   // 往後翻 +1、往前翻 -1、同一個年代 0
    currentEra = i;
    const e = M.eras[i];
    rail.querySelectorAll('.era-dot').forEach((b, k) => { b.setAttribute('aria-selected', k === i); b.tabIndex = k === i ? 0 : -1; });
    moveInd(i);
    centerIn(rail, rail.children[i]);
    const inEra = M.phones.filter((p) => p.era === e.id);
    const phones = coreOnly ? inEra.filter((p) => p.exhibit) : inEra;
    panel.innerHTML = `
      <div class="era-intro">
        <div>
          <h3>${esc(e.label)}</h3>
          <span class="network">${esc(e.network)}</span>
          <p>${esc(e.summary)}</p>
        </div>
        <ul class="events">${e.events.map((ev) => `<li><b>${esc(ev.year)}</b>${esc(ev.text)}</li>`).join('')}</ul>
      </div>
      ${phones.length ? `<div class="phone-row">${phones.map(phoneCard).join('')}</div>` : `<p class="no-phones">${inEra.length ? '這個年代沒有核心展品，關掉篩選就能看到其他手機。' : '這個年代還沒有可展示的手機，以歷史背景為主。往後翻到下一個年代，就能看到展品。'}</p>`}
      ${phones.some((p) => M.scenes[p.id]) ? `<div class="era-scenes">${phones.filter((p) => M.scenes[p.id]).map((p) =>
        `<button class="btn small" data-scene="${p.id}">▶ 沉浸體驗：${esc(M.scenes[p.id].title)}${window.PASSPORT && PASSPORT.has(p.id) ? ' <span class="ok">✓</span>' : ''}</button>`).join('')}<p class="scene-hint">全螢幕 3D・拖曳轉視角、點發光圈看解說、按 Esc 離開</p></div>` : ''}
      <div class="era-nav">
        <button class="btn small" id="era-prev" ${i === 0 ? 'disabled hidden' : ''}>← ${i > 0 ? esc(M.eras[i - 1].label) : ''}</button>
        <button class="btn small" id="era-next" ${i === M.eras.length - 1 ? 'disabled hidden' : ''}>${i < M.eras.length - 1 ? esc(M.eras[i + 1].label) : ''} →</button>
      </div>`;
    panel.style.setProperty('--dir', dir);
    panel.style.animation = 'none'; void panel.offsetWidth; panel.style.animation = '';
    bindCards(panel);
    panel.querySelectorAll('[data-scene]').forEach((b) => b.addEventListener('click', () => enterScene(phoneById(b.dataset.scene), b)));
    $('#era-prev').onclick = () => selectEra(i - 1);
    $('#era-next').onclick = () => selectEra(i + 1);
    if (highlightId) {
      const card = panel.querySelector(`.flip[data-id="${highlightId}"]`);
      if (card) {
        card.classList.add('highlight');
        centerIn(card.parentElement, card);
      }
    }
  }

  // 在時間軸上左右滑動也能換年代（呼應「滑世代」）
  let touchX = null;
  panel.addEventListener('touchstart', (e) => {
    touchX = e.target.closest('.phone-row') ? null : e.touches[0].clientX;
  }, { passive: true });
  panel.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 60) selectEra(Math.max(0, Math.min(M.eras.length - 1, currentEra + (dx < 0 ? 1 : -1))));
    touchX = null;
  });

  /* ---------- 搜尋與核心展品篩選 ---------- */
  const searchBox = $('#search');
  const coreBox = $('#core-only');
  const results = $('#search-results');
  const hay = (p) => [p.name, p.year, p.feature, p.look, eraOf(p).label, eraOf(p).network].join(' ').toLowerCase();

  function applyFilters() {
    const searching = query.trim() !== '';
    rail.hidden = searching;
    panel.hidden = searching;
    results.hidden = !searching;
    if (!searching) { results.innerHTML = ''; selectEra(currentEra); return; }
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    const found = M.phones.filter((p) => (!coreOnly || p.exhibit) && tokens.every((t) => hay(p).includes(t)));
    results.innerHTML = `<p class="result-count" aria-live="polite">找到 ${found.length} 件展品${coreOnly ? '（只看核心展品）' : ''}</p>` +
      (found.length ? `<div class="phone-grid">${found.map(phoneCard).join('')}</div>`
        : '<p class="no-phones">沒有符合的手機。試試手機名稱、年份（例如 1996）或「摺疊」「觸控」這類關鍵字。</p>');
    bindCards(results);
  }
  searchBox.addEventListener('input', () => { query = searchBox.value; applyFilters(); });
  coreBox.addEventListener('change', () => { coreOnly = coreBox.checked; applyFilters(); });

  function showPhone2D(id) {
    setMode('2d');
    const p = phoneById(id);
    if (query || coreOnly) { query = ''; coreOnly = false; searchBox.value = ''; coreBox.checked = false; applyFilters(); }
    selectEra(M.eras.findIndex((e) => e.id === p.era), id);
    $('#exhibit-top').scrollIntoView({ behavior: 'smooth' });
  }

  /* ---------- 2D / 3D 切換 ---------- */
  const tab2d = $('#tab-2d'), tab3d = $('#tab-3d');
  const panel2d = $('#panel-2d'), panel3d = $('#panel-3d');
  let hall = null, hallLoading = null, pendingPhone = null;

  function setMode(mode) {
    const is3d = mode === '3d';
    tab2d.setAttribute('aria-selected', !is3d);
    tab3d.setAttribute('aria-selected', is3d);
    tab2d.tabIndex = is3d ? -1 : 0; tab3d.tabIndex = is3d ? 0 : -1;
    panel2d.hidden = is3d;
    panel3d.hidden = !is3d;
    const flt = $('.filters'); if (flt) flt.hidden = is3d; // 搜尋與篩選只對平面時間軸有用
    if (is3d) loadHall(); else if (hall) hall.pause();
  }
  tab2d.onclick = () => setMode('2d');
  tab3d.onclick = () => setMode('3d');
  tabKeys(tab2d.parentElement, (n) => setMode(n ? '3d' : '2d'));
  tab2d.tabIndex = 0; tab3d.tabIndex = -1;

  // 展廳下方的年份導覽：每支手機一個刻度，依年代分組
  const strip = $('#hall-strip');
  strip.innerHTML = M.eras.map((e) => {
    const list = M.phones.map((p, i) => [p, i]).filter(([p]) => p.era === e.id);
    if (!list.length) return '';
    return `<div class="hs-era"><span class="hs-label">${esc(e.label)}</span><div class="hs-ticks">${list.map(([p, i]) =>
      `<button type="button" class="hs-tick" data-i="${i}" aria-label="${esc(p.name)}，${p.year} 年"><i></i><b>${p.year}</b></button>`).join('')}</div></div>`;
  }).join('');
  strip.addEventListener('click', (ev) => {
    const b = ev.target.closest('.hs-tick');
    if (b && hall) hall.goTo(+b.dataset.i);
  });
  function markStrip(i) {
    strip.querySelectorAll('.hs-tick').forEach((b) => {
      const on = +b.dataset.i === i;
      b.classList.toggle('on', on);
      if (on) { b.setAttribute('aria-current', 'true'); strip.scrollTo({ left: b.offsetLeft - (strip.clientWidth - b.offsetWidth) / 2, behavior: 'smooth' }); }
      else b.removeAttribute('aria-current');
    });
  }

  function renderHallInfo(p) {
    const idx = M.phones.indexOf(p);
    $('#hall-count').innerHTML = `<b>${String(idx + 1).padStart(2, '0')}</b> / ${String(M.phones.length).padStart(2, '0')}`;
    $('#hall-prev').disabled = idx <= 0;
    $('#hall-next').disabled = idx >= M.phones.length - 1;
    markStrip(idx);
    $('#hall-info').innerHTML = `
      <div class="year">${p.year}・${esc(eraOf(p).label)}</div>
      <h3>${esc(p.name)}</h3>
      <p class="hi-lead">${esc(p.feature)}</p>
      <div class="hi-more"><p>${esc(p.look)}</p>${p.imgNote ? `<p>${esc(p.imgNote)}</p>` : ''}</div>
      <button class="hi-toggle" id="hall-more" type="button" aria-expanded="false">更多說明 ▾</button>
      <div class="hi-actions">
      <button class="btn small" id="hall-to-2d">在時間軸中查看 →</button>
      <a class="btn small" href="phone.html#${esc(p.id)}">詳細介紹 →</a>
      ${M.scenes[p.id] ? '<button class="btn small hall-enter" id="hall-enter">▶ 進入沉浸體驗</button>' : ''}
      </div>`;
    const info = $('#hall-info');
    info.classList.remove('open');
    $('#hall-more').onclick = () => {
      const on = info.classList.toggle('open');
      $('#hall-more').setAttribute('aria-expanded', on);
      $('#hall-more').textContent = on ? '收合 ▴' : '更多說明 ▾';
    };
    $('#hall-to-2d').onclick = () => showPhone2D(p.id);
    if (M.scenes[p.id]) $('#hall-enter').onclick = () => enterScene(p, $('#hall-enter'));
  }

  function loadHall() {
    if (hall) { hall.resume(); return Promise.resolve(hall); }
    if (hallLoading) return hallLoading;
    hallLoading = import('./hall3d.js')
      .then((mod) => document.fonts.ready.then(() => mod))
      .then((mod) => {
        hall = mod.initHall($('#hall-canvas'), M.phones, {
          onSelect: renderHallInfo,
          eras: M.eras,
          hasScene: (p) => !!M.scenes[p.id],
          onEnter: (p) => enterScene(p, $('#hall-enter'))
        });
        const loading = $('#hall-loading');
        if (loading) loading.remove();
        $('#hall-prev').onclick = () => hall.step(-1);
        $('#hall-next').onclick = () => hall.step(1);
        if (pendingPhone) { hall.goTo(pendingPhone, true); pendingPhone = null; }
        return hall;
      })
      .catch((err) => {
        console.error(err);
        $('#hall-loading').innerHTML = '3D 展廳載入失敗。<br>請改用平面時間軸。';
        hallLoading = null;
      });
    return hallLoading;
  }

  /* ---------- 沉浸體驗 ---------- */
  let inScene = false;
  function enterScene(p, returnFocus) {
    if (inScene) return;
    inScene = true;
    if (hall) hall.pause();
    // 光圈從按鈕擴張，蓋住畫面，等場景準備好再收起來（從網址直接進場景時沒有按鈕，直接蓋住）
    const veil = window.MX && MX.veil
      ? MX.veil(returnFocus, { color: '#060a14', eyebrow: '沉浸體驗', title: M.scenes[p.id].title, instant: !returnFocus }) : null;
    import('./immersive.js')
      .then((mod) => document.fonts.ready.then(() => mod))
      .then((mod) => window.__imm = mod.openExperience({
        script: M.scenes[p.id], phone: p,
        onComplete: () => {
          if (window.PASSPORT && PASSPORT.stamp(p.id)) {
            const b = document.querySelector(`[data-scene="${p.id}"]`);
            if (b && !b.querySelector('.ok')) b.insertAdjacentHTML('beforeend', ' <span class="ok">✓</span>');
          }
        },
        onExit: () => {
          inScene = false;
          if (hall && !panel3d.hidden) hall.resume();
          if (returnFocus && document.body.contains(returnFocus)) returnFocus.focus();
          if (window.MX && MX.veil) MX.veil(null, { color: '#060a14', instant: true }).reveal();   // 離開時畫面緩緩淡回展廳
        }
      }))
      .then(() => { if (veil) veil.reveal(); })
      .catch((err) => {
        console.error(err);
        if (veil) veil.cancel();
        inScene = false;
        if (hall && !panel3d.hidden) hall.resume();
        toast('沉浸體驗載入失敗，請稍後再試。');
      });
  }
  function toast(msg) {
    const d = document.createElement('div');
    d.className = 'imm-toast show';
    d.style.cssText = 'position:fixed;z-index:1001;background:#1d1d1f;color:#fff';
    d.textContent = msg;
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 4000);
  }

  function showPhone3D(id) {
    if (hall) hall.goTo(id); else pendingPhone = id;
    setMode('3d');
  }

  /* ---------- 網址 #era-1980s、#phone-iphone、#hall-iphone ---------- */
  function route() {
    const h = decodeURIComponent(location.hash.slice(1));
    let m;
    if ((m = h.match(/^era-(.+)$/)) && M.eras.some((e) => e.id === m[1])) {
      setMode('2d'); selectEra(M.eras.findIndex((e) => e.id === m[1]));
    } else if ((m = h.match(/^phone-(.+)$/)) && phoneById(m[1])) {
      showPhone2D(m[1]);
    } else if ((m = h.match(/^scene-(.+)$/)) && M.scenes[m[1]] && phoneById(m[1])) {
      const sp = phoneById(m[1]);
      setMode('2d'); selectEra(M.eras.findIndex((e) => e.id === sp.era), sp.id);
      enterScene(sp, null);
    } else if ((m = h.match(/^hall(?:-(.+))?$/))) {
      if (m[1] && phoneById(m[1])) showPhone3D(m[1]); else setMode('3d');
    }
  }
  window.addEventListener('hashchange', route);

  selectEra(currentEra);
  route();
})();
