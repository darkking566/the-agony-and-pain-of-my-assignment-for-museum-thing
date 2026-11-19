# 機不可失：行動電話發展史

線上互動博物館，從 1942 年的背負式無線電，到 2024 年的 AI 手機。純前端的靜態網站，沒有建置步驟。

- **平面時間軸**：依年代翻閱展品卡片
- **3D 展廳**：旋轉、拆解每一支手機
- **14 個沉浸場景**：站進當時的街頭、教室、辦公室，拖曳轉視角、看發光圈的解說
- **參觀護照、推薦路線、心理測驗、人物頁**
- **資料核對表**（`facts.html`）：每個說法的出處、哪些各來源不一、哪些還沒查證

線上版以 Claude Artifact 發布，這個 repo 是它的完整原始碼（與線上版逐檔相同）。

## 在本機執行

```bash
python3 -m http.server 8000
```

然後開啟 <http://localhost:8000/>。需要網路：three.js 從 jsDelivr 載入（見 `exhibit.html` 的 import map），字型來自 Google Fonts。

## 目錄

```
index.html  exhibit.html  phone.html  quiz.html  people.html  issues.html  facts.html
css/            樣式（3d.css 是展廳與沉浸體驗，style.css 是主體，transitions.css 是動畫）
images/         展品與人物照片（授權列在 issues.html）
js/
  data.js       所有內容：展品、年代、場景劇情與解說、路線、人物、來源
  facts.js      資料核對表
  hall3d.js, phones3d.js   3D 展廳與手機模型
  immersive.js  沉浸體驗播放器（相機、發光點、字幕、螢幕特寫）
  scene-kit.js  場景共用工具：人物（含手臂 IK）、建築、汽車、文字貼圖
  scenes/       每個沉浸場景一個檔案，props.js 與 kit2.js 是共用的佈景與手機零件
```

## 新增一個沉浸場景

1. **展品**：在 `js/data.js` 的 `phones` 加一筆（`id`、`era`、`year`、`shape`、`feature`、`look`），**依年份排序**插入，展廳、橫幅與前後導覽都照陣列順序走。
2. **場景檔**：新增 `js/scenes/<名稱>.js`，匯出 `build({ scene, phone })`，回傳：
   - `beats`：每一段演出 `{ duration, update(t, T) }`，只依時間 `t` 算出所有人的狀態，所以可以跳到任何時間點
   - `view`、`focus`、`hotspots`、`ambient`、`finish`，需要手機螢幕特寫時再加 `insets`
3. **劇情**：在 `data.js` 的 `scenes` 以展品 `id` 為 key，填 `module`（場景檔名）、`title`（`年份・地點`）、`beats`（字幕與焦點）、`hotspots`（解說文字）、`outro`。
4. 視需要加入 `routes` 的路線，並在 `facts.js` 補上這個場景用到的說法與出處。

首頁的場景入口、參觀護照都是從 `scenes` 自動產生，不用另外改。

## 內容注意事項

- 場景是「情境重現」：時間、地點、人物身分依史料，街上的人與情節是虛構的，頁面上有標示。
- 沒有照片的展品（SCR-300、Orbitel 901、IBM Simon）在展廳用的是依外型示意的通用模型，並已在展品頁註明。
- 新增或修改說法時，請同步更新 `js/facts.js`，狀態分 `ok`（已核對）、`diff`（來源不一）、`todo`（待查證）。

## 已知待辦

- 3D 展廳的 SCR-300、Simon、Orbitel 模型是通用造型，不是實物外型
- 1973 年街景使用八〇年代風格的轎車
- 街景類場景（1973、1982、1984）載入較慢，尚未在實機上量測
- 時間軸事件仍寫「MicroTAC 翻蓋手機」，與場景使用的「半掀蓋」用詞略有不同
