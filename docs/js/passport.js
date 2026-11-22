// 參觀護照：記錄看完哪些沉浸場景（只存在這個瀏覽器的 localStorage，不會上傳）。
// 讀寫都包 try/catch：無痕視窗或封鎖網站資料時，退回只在這一頁有效的暫存。
window.PASSPORT = (function () {
  const KEY = 'mx-passport-v1';
  let mem = {};
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return mem; } };
  const write = (o) => { mem = o; try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { /* 存不了就算了 */ } };
  return {
    has: (id) => !!read()[id],
    stamp(id) { const o = read(); if (o[id]) return false; o[id] = Date.now(); write(o); return true; },
    count() { const s = (window.MUSEUM && window.MUSEUM.scenes) || {}; return Object.keys(read()).filter((id) => s[id]).length; },
    reset() { write({}); }
  };
})();
