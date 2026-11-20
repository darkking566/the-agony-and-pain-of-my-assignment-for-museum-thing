// 心理測驗頁
(function () {
  const M = window.MUSEUM;
  const card = document.getElementById('quiz-card');
  let answers = [];

  function renderQuiz() {
    const qs = M.quiz.questions;
    if (answers.length === qs.length) return renderResult();
    const i = answers.length;
    const q = qs[i];
    card.innerHTML = `
      <div class="quiz-progress">${qs.map((_, k) => `<span class="${k <= i ? 'done' : ''}${k === i ? ' now' : ''}"></span>`).join('')}</div>
      <p class="eyebrow">第 ${i + 1} 題／共 ${qs.length} 題</p>
      <p class="quiz-q">${esc(q.q)}</p>
      <div class="quiz-options">
        ${q.options.map((o, k) => `<button class="quiz-option" data-k="${k}"><b>${'ABCD'[k]}</b>${esc(o)}</button>`).join('')}
      </div>`;
    // 點選後先讓選中的選項亮一下、其他淡掉，再換下一題
    const RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const opts = card.querySelector('.quiz-options');
    let locked = false;
    card.querySelectorAll('.quiz-option').forEach((b) =>
      b.addEventListener('click', () => {
        if (locked) return;
        locked = true;
        b.classList.add('picked');
        opts.classList.add('locked');
        setTimeout(() => { answers.push(+b.dataset.k); renderQuiz(); }, RM ? 0 : 300);
      }));
  }

  function renderResult() {
    const counts = [0, 0, 0, 0];
    answers.forEach((a) => counts[a]++);
    // 平手時，取「最後一次選到」的那個類型，不再固定偏向 A
    const top = Math.max(...counts);
    let win = counts.indexOf(top);
    for (let k = answers.length - 1; k >= 0; k--) if (counts[answers[k]] === top) { win = answers[k]; break; }
    const r = M.quiz.results[win];
    const p = phoneById(r.phone);
    const tied = counts.filter((c) => c === top).length > 1;
    const bars = M.quiz.results.map((x, k) => `<div class="${k === win ? 'me' : ''}"><span>${esc(x.title)}</span><i style="--w:${Math.round(counts[k] / answers.length * 100)}%"></i><span>${counts[k]}/${answers.length}</span></div>`).join('');
    card.innerHTML = `
      <div class="quiz-result">
        <p class="eyebrow">你的測驗結果</p>
        <h3>${esc(r.title)}</h3>
        <p class="phone-tag">代表手機：${esc(p.name)}（${p.year}）</p>
        ${photo(p)}
        <p>${esc(r.text)}</p>
        <div class="quiz-bars" aria-label="各類型得分">${bars}</div>
        ${tied ? '<p class="quiz-note">有兩種以上類型同分，以你最後一題的傾向為準。</p>' : ''}
        <div class="actions">
          <button class="btn primary small" id="share">分享我的結果</button>
          <a class="btn primary small" href="exhibit.html#phone-${esc(p.id)}">在時間軸找到它</a>
          <a class="btn small" href="phone.html#${esc(p.id)}">看詳細介紹</a>
          <a class="btn small" href="exhibit.html#hall-${esc(p.id)}">到 3D 展廳看它</a>
          <button class="btn small" id="retry">重新測驗</button>
        </div>
      </div>`;
    document.getElementById('share').onclick = async (e) => {
      const text = `我是「${r.title}」，最像 ${p.name}！來測測你是哪一種手機：${location.href.split('#')[0]}`;
      const b = e.currentTarget;
      try {
        if (navigator.share) await navigator.share({ text });
        else { await navigator.clipboard.writeText(text); b.textContent = '已複製，貼給朋友吧'; }
      } catch (err) { if (err && err.name !== 'AbortError') { b.textContent = '請手動複製網址分享'; } }
    };
    document.getElementById('retry').onclick = () => { answers = []; renderQuiz(); };
  }
  renderQuiz();
})();
