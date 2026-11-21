# 機不可失：行動電話發展史

線上互動博物館，從 1940 年代的無線對講機，到 2020 年代的 AI 手機。包含年代時間軸、3D 展廳、沉浸式場景、心理測驗與人物介紹。

- 網站：<https://darkking566.github.io/the-agony-and-pain-of-my-assignment-for-museum-thing/>
- 純靜態網站，沒有建置步驟，沒有後端；部署在 GitHub Pages。

## 頁面

| 頁面 | 內容 |
| --- | --- |
| `index.html` | 首頁：沉浸場景入口、年代導覽 |
| `exhibit.html` | 展覽：平面時間軸與 3D 展廳 |
| `phone.html?id=…` | 單一展品介紹 |
| `quiz.html` | 心理測驗 |
| `people.html` | 關鍵人物 |
| `issues.html` | 議題、資料來源與圖片授權 |
| `facts.html` | 資料核對表（已核對／說法不一／待查證） |
| `404.html` | 找不到頁面 |

## 在本機執行

3D 使用 ES module，不能直接用 `file://` 開啟，請起一個本機伺服器：

```bash
python3 -m http.server 8000
```

然後開 <http://localhost:8000>。

## 檔案結構

```
css/        樣式（style.css 主樣式、3d.css 3D 介面、transitions.css 轉場）
js/data.js  展覽內容：年代、展品、人物、資料來源（改文字、加手機都改這裡）
js/facts.js 資料核對表內容
js/hall3d.js, phones3d.js   3D 展廳與手機模型
js/immersive.js, scene-kit.js, scenes/   沉浸式場景
images/     展品與人物照片、分享縮圖
vendor/three/   three.js 0.160.0（本地副本，離線也能用 3D）
qrcode/     網站 QR code
```

## 常見修改

- **新增或修改展品：** 編輯 `js/data.js` 的 `phones`。照片放進 `images/`，並填 `img`；若不是自己拍攝或公有領域，一定要填 `credit`（格式：`作者／授權／來源網址`），它會自動出現在展品頁與「議題與來源」。
- **沒有 `img` 的展品** 會自動顯示產生的佔位圖。
- **補查證資料：** 編輯 `js/facts.js`，把 `status` 改成 `ok` 並填上 `src`。

## 資料與授權

- 展品數據與出處見網站的「資料核對表」，部分項目仍標示為待查證或各來源說法不一。
- 照片多取自維基共享資源，作者與授權逐張列在「議題與來源」頁。Nokia-Mobira Senator 與 Samsung SC-1000 目前找不到可用照片，暫以佔位圖顯示。
- three.js 依 MIT 授權，授權文件在 `vendor/three/LICENSE`。
