# 機不可失：行動電話發展史

線上互動博物館，從 1942 年的背負式無線電，到 2024 年的 AI 手機。純前端的靜態網站，沒有建置步驟。

- **平面時間軸**：依年代翻閱展品卡片
- **3D 展廳**：旋轉、拆解每一支手機
- **15 個沉浸場景**：站進當時的街頭、教室、辦公室，拖曳轉視角、看發光圈的解說
- **參觀護照、推薦路線、心理測驗、人物頁**
- **資料核對表**（`facts.html`）：每個說法的出處、哪些各來源不一、哪些還沒查證

線上版以 Claude Artifact 發布，這個 repo 是它的完整原始碼。repo 的內容可能比線上版新，發布到 Artifact 之前，以 repo 為準。

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

1. **展品**：在 `js/data.js` 的 `phones` 加一筆（`id`、`era`、`year`、`shape`、`feature`、`look`），**依年份排序**插入，展廳、橫幅與前後導覽都照陣列順序走。`shape` 決定 3D 展廳的模型，沒有合適造型時，在 `js/phones3d.js` 新增一個 builder 並登錄到 `BUILDERS`、`TIER`。
2. **場景檔**：新增 `js/scenes/<名稱>.js`，匯出 `build({ scene, phone })`，回傳：
   - `beats`：每一段演出 `{ duration, update(t, T) }`，只依時間 `t` 算出所有人的狀態，所以可以跳到任何時間點
   - `view`、`focus`、`hotspots`、`ambient`、`finish`，需要手機螢幕特寫時再加 `insets`
3. **劇情**：在 `data.js` 的 `scenes` 以展品 `id` 為 key，填 `module`（場景檔名）、`title`（`年份・地點`）、`beats`（字幕與焦點）、`hotspots`（解說文字）、`outro`。
4. 視需要加入 `routes` 的路線，並在 `facts.js` 補上這個場景用到的說法與出處。

首頁的場景入口、參觀護照都是從 `scenes` 自動產生，不用另外改。

## 內容注意事項

- 場景是「情境重現」：時間、地點、人物身分依史料，街上的人與情節是虛構的，頁面上有標示。
- 沒有照片的展品（SCR-300、Orbitel 901、IBM Simon）都已在展品頁註明：SCR-300 與 Simon 在展廳有專用的示意造型（`js/phones3d.js` 的 `radio`、`simon`），Orbitel 901 仍是通用造型。
- 新增或修改說法時，請同步更新 `js/facts.js`，狀態分 `ok`（已核對）、`diff`（來源不一）、`todo`（待查證）。

## 已知待辦

- **Nokia-Mobira Senator 與 Samsung SC-1000 的照片來源與授權不明**：維基共享資源找不到這兩個型號可用的照片。SC-1000 那張還是同時期的 SH-100S，不是它本身。要公開或交報告前，需要換成有授權的圖，或自行取得
- 第一代 iPhone 與 Galaxy Note 現在是維基共享資源的向量／示意圖，不是實物照片
- 手機照片放在展品頁的 4:5 相框裡，高瘦的圖看起來會被裁掉下半部（整站的手機圖都這樣，包含沒動過的 iPhone 12）：`css/style.css` 的 `.photo.real img { padding: 8px }` 搭配 `object-fit: contain`，尚未實際量測與修正

- Orbitel 901 的 3D 模型仍是通用造型：查不到可靠的外型描述，它其實是約 2 公斤的「可攜式」電話
- 沒有在實機（手機）上量測過載入與播放的流暢度；目前的量測都來自無頭瀏覽器的軟體渲染
- 1973 街景的車已改成車頭車尾較長的車身與黃色計程車，但仍是簡化的方盒造型，不是特定車款

## 效能備註

- 沉浸體驗開啟時，`RoomEnvironment` 模組在場景建立之前就開始下載（`js/immersive.js`），和場景建立並行。
  在沙盒的無頭瀏覽器裡，這讓街景場景的載入從 12 至 18 秒降到約 2 至 3 秒；真實網路上這個小檔案本來就快，預期收益小得多。
- 量測時要避免背景行程搶 CPU：同一份程式在機器忙碌時可以慢一倍以上，單次數字不可靠，請交替重複量測。
