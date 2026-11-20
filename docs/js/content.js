// 人物、議題、資料來源（各頁只會有其中幾個容器）
(function () {
  const M = window.MUSEUM;
  const eraLabel = (id) => (M.eras.find((e) => e.id === id) || {}).label || '';
  const set = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };

  const grid = document.getElementById('people-grid');
  if (grid) grid.className = 'people-list';
  const initials = (en) => en.split(/\s+/).filter((w) => /^[A-Z]/.test(w)).map((w) => w[0]).join('').slice(0, 3);
  set('people-grid', M.people.map((p) => `
    <article class="person" data-era="${esc(p.era || '')}">
      <div class="p-photo">${p.img
        ? `<img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy">`
        : `<div class="p-initials" role="img" aria-label="${esc(p.name)}（沒有可自由使用的照片）"><b>${esc(initials(p.en))}</b><span>沒有可自由使用的照片</span></div>`}</div>
      <div class="p-body">
        <p class="era">${esc(p.when || eraLabel(p.era))}</p>
        <h3>${esc(p.name)}</h3>
        <div class="en">${esc(p.en)}</div>
        <p class="p-lead">${esc(p.text)}</p>
        <p class="p-story">${esc(p.story)}</p>
        <dl class="p-facts">${p.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
        <div class="rel">${[
          ...(p.phones || []).filter((id) => phoneById(id)).map((id) => `<a href="phone.html#${esc(id)}">${esc(phoneById(id).name)}</a>`),
          ...(p.see || []).map(([t, h]) => `<a href="${esc(h)}">${esc(t)}</a>`)
        ].join('')}</div>
        <p class="p-src">出處：${p.src.map(([t, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a>`).join('、')}</p>
      </div>
    </article>`).join(''));

  set('issue-grid', M.issues.map((s) => `
    <article class="card">
      <h3>${esc(s.title)}</h3>
      <p>${esc(s.text)}</p>
      <a class="more" href="${esc(s.url)}" target="_blank" rel="noopener">閱讀原文 ›</a>
    </article>`).join(''));

  set('source-list', M.sources.map((s) =>
    `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a></li>`).join(''));

  set('credit-list', [...M.phones, ...M.people].filter((p) => p.credit).map((p) => {
    const [by, lic, url] = p.credit.split('／');
    return `<li><b>${esc(p.name)}</b>：${esc(by)}，${esc(lic)}，<a href="${esc(url)}" target="_blank" rel="noopener">來源頁 ›</a></li>`;
  }).join(''));
})();
