// 首頁：數字、年代入口、展品橫幅、沉浸體驗場景
(function () {
  const M = window.MUSEUM;
  document.getElementById('stat-eras').textContent = M.eras.length;
  document.getElementById('stat-phones').textContent = M.phones.length;
  document.getElementById('stat-people').textContent = M.people.length;
  document.getElementById('stat-years').textContent = M.phones[M.phones.length - 1].year - M.phones[0].year;

  document.getElementById('era-tiles').innerHTML = M.eras.map((e) => {
    const n = M.phones.filter((p) => p.era === e.id).length;
    return `<a class="era-tile" href="exhibit.html#era-${esc(e.id)}">
      <span class="y">${esc(e.label)}</span>
      <span class="n">${esc(e.network)}</span>
      <span class="c">${n ? n + ' 件展品' : '歷史背景'} ›</span></a>`;
  }).join('');

  // 開場下方的展品橫幅：十幾支手機由舊到新慢慢流過，滑鼠移上去會停住，點下去照片會飛到展品頁
  const hero = document.querySelector('.hero');
  if (hero) {
    const item = (p, dup) => `<a class="strip-item${dup ? ' strip-dup' : ''}" href="phone.html#${esc(p.id)}"${dup ? ' tabindex="-1" aria-hidden="true"' : ''}>
      ${photo(p)}<span class="y">${p.year}</span><span class="n">${esc(p.name)}</span></a>`;
    hero.insertAdjacentHTML('beforeend', `<div class="hero-strip" role="region" aria-label="全部展品，由舊到新">
      <div class="hero-track">${M.phones.map((p) => item(p, false)).join('')}${M.phones.map((p) => item(p, true)).join('')}</div></div>`);
    hero.classList.add('has-strip');
  }

  const scenes = Object.keys(M.scenes).map((id) => ({ p: phoneById(id), s: M.scenes[id] })).sort((a, b) => a.p.year - b.p.year);
  document.getElementById('scene-grid').innerHTML = scenes.map(({ p, s }) => `
    <a class="door" href="exhibit.html#scene-${esc(p.id)}">
      <span class="eyebrow" style="margin:0">${esc(s.title.split('・')[0])} 年</span>
      <h3>${esc(s.title.split('・').pop())}</h3>
      <p>${esc(s.intro)}</p>
      <span class="go">進入體驗 ›</span>
    </a>`).join('');
  document.getElementById('scene-count').textContent = scenes.length;

  /* ---------- 參觀護照與推薦路線 ---------- */
  const P = window.PASSPORT;
  const has = (id) => !!(P && P.has(id));
  const place = (id) => M.scenes[id].title.split('・').pop();
  const yr = (id) => M.scenes[id].title.split('・')[0];
  function renderPassport() {
    const n = scenes.filter(({ p }) => has(p.id)).length;
    document.getElementById('passport').innerHTML = `
      <div class="pp-head"><h3>參觀護照</h3>
        <span class="pp-count" aria-live="polite">已蓋 ${n}／${scenes.length} 章</span></div>
      <p class="pp-sub">${n === scenes.length ? '所有場景都走完了！你已經看完手機從 1942 到 2024 的故事。' : '把場景看到結尾，就會蓋一個章。紀錄只存在你這台裝置的瀏覽器裡。'}</p>
      <div class="stamps">${scenes.map(({ p }) => `
        <a class="stamp${has(p.id) ? ' got' : ''}" href="exhibit.html#scene-${esc(p.id)}" aria-label="${esc(yr(p.id))}年 ${esc(place(p.id))}，${has(p.id) ? '已蓋章' : '還沒蓋章'}">
          <span class="seal">${has(p.id) ? '✓' : '?'}</span><b>${esc(yr(p.id))}</b><span class="pl">${esc(place(p.id))}</span></a>`).join('')}</div>
      ${n ? '<button class="pp-reset" type="button">清除紀錄</button>' : ''}`;
    const r = document.querySelector('.pp-reset');
    if (r) r.onclick = () => { if (confirm('要清除所有蓋章紀錄嗎？')) { P.reset(); renderAll(); } };
  }
  function renderRoutes() {
    document.getElementById('routes').innerHTML = `
      <div class="pp-head" style="margin-top:56px"><h3>推薦路線</h3></div>
      <p class="pp-sub">不知道從哪開始？挑一條，跟著順序走。</p>
      <div class="routes">${(M.routes || []).map((r) => {
        const steps = r.steps.filter((id) => M.scenes[id]);
        const done = steps.filter(has).length;
        const next = steps.find((id) => !has(id)) || steps[0];
        const label = done === 0 ? '從第一站開始' : done === steps.length ? '再走一次' : '接著走下一站';
        return `<article class="route">
          <h4>${esc(r.title)}</h4><p>${esc(r.desc)}</p>
          <ol class="route-steps">${steps.map((id) => `<li class="${has(id) ? 'done' : ''}"><a href="exhibit.html#scene-${esc(id)}">${has(id) ? '✓ ' : ''}${esc(yr(id))}・${esc(place(id))}</a></li>`).join('')}</ol>
          <div class="route-foot"><span>${done}／${steps.length} 站</span>
          <a class="btn small${done < steps.length ? ' primary' : ''}" href="exhibit.html#scene-${esc(next)}">${label} ›</a></div></article>`;
      }).join('')}</div>`;
  }
  function renderAll() {
    renderPassport(); renderRoutes();
    document.querySelectorAll('#scene-grid .door').forEach((a, i) => {
      const id = scenes[i].p.id;
      a.classList.toggle('stamped', has(id));
      const g = a.querySelector('.go');
      if (g) g.textContent = has(id) ? '已蓋章・再看一次 ›' : '進入體驗 ›';
    });
  }
  renderAll();
  window.addEventListener('pageshow', renderAll);   // 從場景回來（含上一頁）時更新蓋章
})();
