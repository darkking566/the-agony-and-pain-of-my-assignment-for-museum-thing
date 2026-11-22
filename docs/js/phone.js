// 單一展品頁：網址 phone.html#iphone
(function () {
  const M = window.MUSEUM;
  const root = document.getElementById('phone-root');
  const list = M.phones;

  function render() {
    const id = decodeURIComponent(location.hash.slice(1));
    const i = list.findIndex((p) => p.id === id);
    if (i < 0) {
      document.title = '找不到展品｜機不可失';
      root.innerHTML = `<section class="band"><div class="wrap" style="padding-block:96px">
        <h1 class="h-section">找不到這件展品</h1>
        <p class="sub">網址裡的展品不存在。回到展覽，從時間軸挑一支手機。</p>
        <a class="btn primary" href="exhibit.html">回到展覽</a></div></section>`;
      return;
    }
    const p = list[i], e = eraOf(p);
    const prev = list[i - 1], next = list[i + 1];
    document.title = `${p.name}｜機不可失`;
    const [by, lic, url] = (p.credit || '').split('／');
    const col = (q, dir) => q
      ? `<a class="cmp-head" href="phone.html#${esc(q.id)}"><span class="dir">${dir}</span>${esc(q.name)}</a>`
      : `<span class="cmp-head none"><span class="dir">${dir}</span>沒有了</span>`;
    const cell = (q, f) => q ? esc(f(q)) : '—';
    const gap = (q) => q ? (q.year === p.year ? '同一年' : (q.year < p.year ? '早 ' : '晚 ') + Math.abs(q.year - p.year) + ' 年') : '—';

    const stepLink = (q, dir, arrow) => q
      ? `<a href="phone.html#${esc(q.id)}" aria-label="${dir}：${esc(q.name)}">${dir === '上一件' ? '‹ ' : ''}${esc(q.name)}${dir === '下一件' ? ' ›' : ''}</a>`
      : `<span class="off">${dir === '上一件' ? '‹ 已是第一件' : '已是最後一件 ›'}</span>`;
    const people = (M.people || []).filter((q) => (q.phones || []).includes(p.id));
    const scene = M.scenes[p.id];

    root.innerHTML = `
      <div class="dark phone-stepbar"><div class="wrap"><nav class="phone-step" aria-label="展品前後導覽">
        ${stepLink(prev, '上一件')}<span class="pos">${i + 1} / ${list.length}</span>${stepLink(next, '下一件')}
      </nav></div></div>
      <section class="band phone-hero dark"><div class="wrap">
        ${photo(p)}
        <div>
          <p class="eyebrow">${esc(e.label)}・${esc(e.network)}</p>
          ${p.exhibit ? '<span class="pill-note">核心展品</span>' : ''}
          <h1>${esc(p.name)}</h1>
          <p class="yr">${p.year} 年</p>
          <p class="lead">${esc(p.feature)}</p>
          <div class="actions">
            ${scene ? `<a class="btn primary" href="exhibit.html#scene-${esc(p.id)}">▶ 進入沉浸體驗</a>` : ''}
            <a class="btn${scene ? '' : ' primary'}" href="exhibit.html#hall-${esc(p.id)}">到 3D 展廳看它</a>
            <a class="btn" href="exhibit.html#phone-${esc(p.id)}">回到時間軸</a>
          </div>
        </div>
      </div></section>

      <section class="band"><div class="wrap">
        <div class="two-col">
          <div><h2>外表與功能</h2><p>${esc(p.look)}</p></div>
          <div><h2>基本資料</h2>
            <dl class="facts">
              <div><dt>年份</dt><dd>${p.year}</dd></div>
              <div><dt>年代</dt><dd>${esc(e.label)}</dd></div>
              <div><dt>通訊世代</dt><dd>${esc(e.network)}</dd></div>
              <div><dt>展覽順序</dt><dd>第 ${i + 1} 件，共 ${list.length} 件</dd></div>
              <div><dt>展品類型</dt><dd>${p.exhibit ? '核心展品' : '一般展品'}</dd></div>
            </dl>
          </div>
        </div>
        ${people.length ? `<h2 style="margin-top:48px">相關人物</h2>
          <ul class="rel-list">${people.map((q) => `<li><small>${esc(q.en)}</small><b>${esc(q.name)}</b><p>${esc(q.text)}</p></li>`).join('')}</ul>
          <p style="margin-top:14px"><a class="link-more" href="people.html">看全部人物</a></p>` : ''}
        ${p.imgNote ? `<p class="fine">${esc(p.imgNote)}</p>` : ''}
        ${p.credit ? `<p class="fine">圖片：${esc(by)}，${esc(lic)}，<a href="${esc(url)}" target="_blank" rel="noopener">來源頁</a></p>` : ''}
      </div></section>

      <section class="band alt era-ctx"><div class="wrap">
        <p class="eyebrow">當時的世界</p>
        <h2>${esc(e.label)}</h2>
        <p class="net">${esc(e.network)}</p>
        <p>${esc(e.summary)}</p>
        <a class="link-more" href="exhibit.html#era-${esc(e.id)}">看這個年代的其他展品</a>
      </div></section>

      <section class="band neighbors"><div class="wrap">
        <p class="eyebrow">前後比較</p>
        <h2>跟上一支、下一支比比看</h2>
        <div class="cmp-wrap"><table class="cmp-table">
          <thead><tr><th></th><th>${col(prev, '上一件')}</th><th class="now"><span class="dir">這一件</span>${esc(p.name)}</th><th>${col(next, '下一件')}</th></tr></thead>
          <tbody>
            <tr><th>年份</th><td>${cell(prev, (q) => q.year)}</td><td class="now">${p.year}</td><td>${cell(next, (q) => q.year)}</td></tr>
            <tr><th>與這件相差</th><td>${gap(prev)}</td><td class="now">—</td><td>${gap(next)}</td></tr>
            <tr><th>年代</th><td>${cell(prev, (q) => eraOf(q).label)}</td><td class="now">${esc(e.label)}</td><td>${cell(next, (q) => eraOf(q).label)}</td></tr>
            <tr><th>通訊世代</th><td>${cell(prev, (q) => eraOf(q).network)}</td><td class="now">${esc(e.network)}</td><td>${cell(next, (q) => eraOf(q).network)}</td></tr>
            <tr><th>特色</th><td>${cell(prev, (q) => q.feature)}</td><td class="now">${esc(p.feature)}</td><td>${cell(next, (q) => q.feature)}</td></tr>
          </tbody></table></div>
      </div></section>`;
    root.querySelectorAll('.cmp-table tbody tr').forEach((tr) => {
      tr.querySelectorAll('td').forEach((td, k) => { td.dataset.c = ['上一件', '這一件', '下一件'][k] || ''; });
    });
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', render);
  render();
})();
