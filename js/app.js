(function () {
  const M = window.MUSEUM;
  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const phoneById = (id) => M.phones.find((p) => p.id === id);

  /* ---------- 心理測驗 ---------- */
  const quizCard = $('#quiz-card');
  let answers = [];

  function renderQuiz() {
    const qs = M.quiz.questions;
    if (answers.length === qs.length) return renderResult();
    const i = answers.length;
    const q = qs[i];
    quizCard.innerHTML = `
      <div class="quiz-progress">${qs.map((_, k) => `<span class="${k <= i ? 'done' : ''}"></span>`).join('')}</div>
      <p class="eyebrow">第 ${i + 1} 題／共 ${qs.length} 題</p>
      <p class="quiz-q">${esc(q.q)}</p>
      <div class="quiz-options">
        ${q.options.map((o, k) => `<button class="quiz-option" data-k="${k}"><b>${'ABCD'[k]}</b>${esc(o)}</button>`).join('')}
      </div>`;
    quizCard.querySelectorAll('.quiz-option').forEach((b) =>
      b.addEventListener('click', () => { answers.push(+b.dataset.k); renderQuiz(); }));
  }

  function renderResult() {
    const counts = [0, 0, 0, 0];
    answers.forEach((a) => counts[a]++);
    const best = counts.indexOf(Math.max(...counts));
    const r = M.quiz.results[best];
    const p = phoneById(r.phone);
    quizCard.innerHTML = `
      <div class="quiz-result">
        <p class="eyebrow">你的測驗結果</p>
        <h3>${esc(r.title)}</h3>
        <p class="phone-tag">代表手機：${esc(p.name)}（${p.year}）</p>
        <p>${esc(r.text)}</p>
        <div class="actions">
          <button class="btn primary small" id="go-2d">在時間軸找到它</button>
          <button class="btn small" id="go-3d">到 3D 展廳看它</button>
          <button class="btn small" id="retry">重新測驗</button>
        </div>
      </div>`;
    $('#go-2d').onclick = () => showPhone2D(p.id);
    $('#go-3d').onclick = () => showPhone3D(p.id);
    $('#retry').onclick = () => { answers = []; renderQuiz(); };
  }

  /* ---------- 2D 時間軸 ---------- */
  const rail = $('#era-rail');
  const panel = $('#era-panel');
  let currentEra = 0;

  rail.innerHTML = M.eras.map((e, i) =>
    `<button class="era-dot" role="tab" data-i="${i}" aria-selected="${i === 0}">${esc(e.label)}</button>`).join('');
  rail.querySelectorAll('.era-dot').forEach((b) => b.addEventListener('click', () => selectEra(+b.dataset.i)));

  const phoneSvg = `<svg viewBox="0 0 56 96" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><rect x="6" y="4" width="44" height="88" rx="8"/><rect x="12" y="14" width="32" height="56" rx="2"/><circle cx="28" cy="81" r="4"/></svg>`;

  function phoneCard(p) {
    return `
      <button class="flip" data-id="${p.id}" aria-label="${esc(p.name)}，點擊翻面看介紹">
        <div class="flip-inner">
          <div class="flip-face flip-front">
            <div class="photo">
              <img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy"
                   onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'placeholder',innerHTML:window.__phoneSvg+'放入照片：<br>${esc(p.img)}'}))">
            </div>
            <div class="year">${p.year}</div>
            <div class="name">${esc(p.name)}</div>
            <div class="tap">點一下翻面 ↻</div>
          </div>
          <div class="flip-face flip-back">
            <h4>${esc(p.name)}</h4>
            <div class="label">歷史特色</div>
            <p>${esc(p.feature)}</p>
            <div class="label">外表與功能</div>
            <p>${esc(p.look)}</p>
          </div>
        </div>
      </button>`;
  }
  window.__phoneSvg = phoneSvg;

  // 只做水平捲動，避免整頁跳動
  function centerIn(container, el) {
    container.scrollTo({ left: el.offsetLeft - (container.clientWidth - el.offsetWidth) / 2, behavior: 'smooth' });
  }

  function selectEra(i, highlightId) {
    currentEra = i;
    const e = M.eras[i];
    rail.querySelectorAll('.era-dot').forEach((b, k) => b.setAttribute('aria-selected', k === i));
    centerIn(rail, rail.children[i]);
    const phones = M.phones.filter((p) => p.era === e.id);
    panel.innerHTML = `
      <div class="era-intro">
        <div>
          <h3>${esc(e.label)}</h3>
          <span class="network">${esc(e.network)}</span>
          <p>${esc(e.summary)}</p>
        </div>
        <ul class="events">${e.events.map((ev) => `<li><b>${esc(ev.year)}</b>${esc(ev.text)}</li>`).join('')}</ul>
      </div>
      <div class="phone-row">${phones.map(phoneCard).join('')}</div>
      <div class="era-nav">
        <button class="btn small" id="era-prev" ${i === 0 ? 'disabled hidden' : ''}>← ${i > 0 ? esc(M.eras[i - 1].label) : ''}</button>
        <button class="btn small" id="era-next" ${i === M.eras.length - 1 ? 'disabled hidden' : ''}>${i < M.eras.length - 1 ? esc(M.eras[i + 1].label) : ''} →</button>
      </div>`;
    panel.style.animation = 'none'; void panel.offsetWidth; panel.style.animation = '';
    panel.querySelectorAll('.flip').forEach((f) => f.addEventListener('click', () => f.classList.toggle('flipped')));
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

  function showPhone2D(id) {
    setMode('2d');
    const p = phoneById(id);
    selectEra(M.eras.findIndex((e) => e.id === p.era), id);
    $('#exhibit').scrollIntoView({ behavior: 'smooth' });
  }

  /* ---------- 2D / 3D 切換 ---------- */
  const tab2d = $('#tab-2d'), tab3d = $('#tab-3d');
  const panel2d = $('#panel-2d'), panel3d = $('#panel-3d');
  let hall = null, hallLoading = null, pendingPhone = null;

  function setMode(mode) {
    const is3d = mode === '3d';
    tab2d.setAttribute('aria-selected', !is3d);
    tab3d.setAttribute('aria-selected', is3d);
    panel2d.hidden = is3d;
    panel3d.hidden = !is3d;
    if (is3d) loadHall(); else if (hall) hall.pause();
  }
  tab2d.onclick = () => setMode('2d');
  tab3d.onclick = () => setMode('3d');

  function renderHallInfo(p) {
    $('#hall-info').innerHTML = `
      <div class="year">${p.year}・${esc(M.eras.find((e) => e.id === p.era).label)}</div>
      <h3>${esc(p.name)}</h3>
      <p>${esc(p.feature)}</p>
      <p>${esc(p.look)}</p>
      <button class="btn small" id="hall-to-2d">在時間軸中查看 →</button>`;
    $('#hall-to-2d').onclick = () => showPhone2D(p.id);
  }

  function loadHall() {
    if (hall) { hall.resume(); return Promise.resolve(hall); }
    if (hallLoading) return hallLoading;
    hallLoading = import('./hall3d.js')
      .then((mod) => document.fonts.ready.then(() => mod))
      .then((mod) => {
        hall = mod.initHall($('#hall-canvas'), M.phones, { onSelect: renderHallInfo });
        $('#hall-loading').remove();
        $('#hall-prev').onclick = () => hall.step(-1);
        $('#hall-next').onclick = () => hall.step(1);
        if (pendingPhone) { hall.goTo(pendingPhone); pendingPhone = null; }
        return hall;
      })
      .catch((err) => {
        console.error(err);
        $('#hall-loading').innerHTML = '3D 展廳載入失敗。<br>請用網頁伺服器開啟（見 README），或改用平面時間軸。';
        hallLoading = null;
      });
    return hallLoading;
  }

  function showPhone3D(id) {
    $('#exhibit').scrollIntoView({ behavior: 'smooth' });
    if (hall) hall.goTo(id); else pendingPhone = id;
    setMode('3d');
  }

  /* ---------- 人物、議題、來源 ---------- */
  $('#people-grid').innerHTML = M.people.map((p) => `
    <article class="card">
      <h3>${esc(p.name)}</h3>
      <div class="en">${esc(p.en)}</div>
      <p>${esc(p.text)}</p>
    </article>`).join('');

  $('#issue-grid').innerHTML = M.issues.map((s, i) => `
    <article class="card">
      <div class="num">0${i + 1}</div>
      <h3>${esc(s.title)}</h3>
      <p>${esc(s.text)}</p>
      <a href="${esc(s.url)}" target="_blank" rel="noopener">閱讀原文 ↗</a>
    </article>`).join('');

  $('#source-list').innerHTML = M.sources.map((s) =>
    `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a></li>`).join('');

  renderQuiz();
  selectEra(0);
})();
