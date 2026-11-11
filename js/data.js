// 展覽內容資料：2D 時間軸與 3D 展廳共用這一份。
// 要改文字、加手機、換照片，改這個檔案就好。
// 照片：把圖片放進 images/ 資料夾，檔名對應每支手機的 img 欄位。
// shape：3D 展廳用來決定模型外型，可用 brick / car / flip / clam / candybar / slider / touch / phablet / modern

window.MUSEUM = {
  eras: [
    {
      id: '1940s',
      label: '1940年代',
      network: '無線電對講機',
      summary: '行動通訊的起點。二戰期間，美軍使用的無線對講機讓人第一次可以「邊移動邊通話」。',
      events: [
        { year: '1940年代', text: '美軍製造無線對講機，開啟行動通訊之路' }
      ]
    },
    {
      id: '1970s',
      label: '1970年代',
      network: '實驗階段',
      summary: '第一支手持式行動電話誕生，但還沒有正式上市販售。',
      events: [
        { year: '1973', text: 'Motorola 研發出第一支手持行動電話 DynaTAC，馬丁·庫珀用它打出史上第一通手機電話' }
      ]
    },
    {
      id: '1980s',
      label: '1980年代',
      network: '1G 類比式行動電話系統',
      summary: '手機開始商用化，但體積重量龐大、價格昂貴，只有經濟條件好的人買得起，因此被稱為「大哥大」。',
      events: [
        { year: '1980年代', text: '1G 類比式行動電話系統上路' },
        { year: '1989', text: '手機尺寸縮小，出現 MicroTAC 翻蓋手機' }
      ]
    },
    {
      id: '1990s',
      label: '1990年代',
      network: '2G（GSM）數位通訊',
      summary: '進入數位通訊時代，手機更小型化，除了通話還能傳簡訊，甚至出現第一支智慧型手機。',
      events: [
        { year: '1990年代', text: '2G（GSM）推出：通話、數位通訊、SMS 簡訊、手機更小型化' },
        { year: '1992', text: '第一則簡訊（SMS）發送，手機從「只能打電話」開始變成可以傳遞文字的溝通工具' },
        { year: '1994', text: '第一支智慧型手機 IBM Simon：沒有實體按鍵，用手指或觸控筆操作觸控螢幕' },
        { year: '1997', text: 'Nokia 6110 內建貪吃蛇遊戲，手機開始有娛樂功能' },
        { year: '1999–2000', text: '彩色螢幕、照相手機出現' }
      ]
    },
    {
      id: '2000s',
      label: '2000年代',
      network: '3G',
      summary: '3G 帶來行動上網、視訊通話與多媒體服務；iPhone 與 App Store 改變了手機的樣貌。',
      events: [
        { year: '2000年代', text: '3G 推出：行動上網、視訊通話、多媒體服務' },
        { year: '2007', text: '第一台 iPhone 出現：拿掉觸控筆，用手指點擊、滑動螢幕控制' },
        { year: '2008', text: 'iPhone 推出 App Store：應用程式的下載與安裝都能在一台手機完成' }
      ]
    },
    {
      id: '2010s',
      label: '2010年代',
      network: '4G',
      summary: '快速的數據傳輸讓高速行動網路、影音串流、直播成為日常。',
      events: [
        { year: '2010年代', text: '4G 推出：高速行動網路、影音串流、直播' }
      ]
    },
    {
      id: '2020s',
      label: '2020年代',
      network: '5G、生成式 AI',
      summary: '網路更快、更省電；手機與 AI 結合，除了通訊與娛樂，也成為學習、工作、支付的重要工具。',
      events: [
        { year: '2020年代', text: '5G 與生成式 AI：手機成為學習、工作、支付的重要工具' }
      ]
    }
  ],

  phones: [
    {
      id: 'dynatac-proto', era: '1970s', year: 1973, name: 'Motorola DynaTAC 原型機',
      img: 'images/dynatac-proto.jpg', shape: 'brick', color: '#cfc6b4',
      feature: '最早的手機，手持式手機誕生，但尚未於市場推出',
      look: '體積大、外形四方、配有長的天線、需要較長時間充電，綽號「黑金剛」'
    },
    {
      id: 'senator', era: '1980s', year: 1982, name: 'Nokia-Mobira Senator',
      img: 'images/senator.jpg', shape: 'car', color: '#3b3f45',
      feature: 'Nokia 推出的第一部手機', exhibit: true,
      look: '體積龐大、限制多，定位為車載行動電話，無法隨身攜帶'
    },
    {
      id: 'dynatac-8000x', era: '1980s', year: 1983, name: 'Motorola DynaTAC 8000X',
      img: 'images/dynatac-8000x.jpg', shape: 'brick', color: '#e3ddd0',
      feature: '首款商用手機',
      look: '體積大又重，當時只有經濟條件好的人才買得起，又被稱為「大哥大」'
    },
    {
      id: 'sc-1000', era: '1980s', year: 1988, name: 'Samsung SC-1000',
      img: 'images/sc-1000.jpg', shape: 'car', color: '#2b2b2b',
      feature: '三星推出的第一部手機',
      look: '專為車內使用設計的行動電話'
    },
    {
      id: 'microtac', era: '1980s', year: 1989, name: 'Motorola MicroTAC',
      img: 'images/microtac.jpg', shape: 'flip', color: '#2a2c30',
      feature: '第一支半掀蓋式行動電話', exhibit: true,
      look: '體積縮小，話筒蓋做在按鍵上方的摺疊設計，讓麥克風更靠近嘴巴'
    },
    {
      id: 'startac', era: '1990s', year: 1996, name: 'Motorola StarTAC',
      img: 'images/startac.jpg', shape: 'clam', color: '#1f2226',
      feature: '第一支貝殼式摺疊手機，可以放進口袋', exhibit: true,
      look: '重量輕，機身頂部有一根可自由拉出的伸縮天線，有來電震動功能'
    },
    {
      id: 'siemens-s10', era: '1990s', year: 1998, name: 'Siemens S10',
      img: 'images/siemens-s10.jpg', shape: 'candybar', color: '#4a5560', screen: 'color',
      feature: '第一款彩色螢幕手機，為日後的彩色手機發展奠定基礎',
      look: '螢幕只能顯示紅、綠、藍、白四種顏色'
    },
    {
      id: 'nokia-3210', era: '1990s', year: 1999, name: 'Nokia 3210',
      img: 'images/nokia-3210.jpg', shape: 'candybar', color: '#2f5aa8',
      feature: '最早普及的內藏天線手機之一',
      look: '能自由更換多種顏色機殼，內建經典的貪吃蛇遊戲'
    },
    {
      id: 'nokia-3310', era: '2000s', year: 2000, name: 'Nokia 3310',
      img: 'images/nokia-3310.jpg', shape: 'candybar', color: '#2c3e63', exhibit: true,
      feature: '直立式手機，以極佳的耐摔程度與超長續航力聞名',
      look: '超強續航、內建貪吃蛇遊戲，內部結構紮實，防摔耐撞'
    },
    {
      id: 'j-sh04', era: '2000s', year: 2000, name: 'Sharp J-SH04',
      img: 'images/j-sh04.jpg', shape: 'candybar', color: '#b8bcc2', screen: 'color', camera: true,
      feature: '最早量產的照相手機之一',
      look: '最早商業化、內建相機的照相手機之一'
    },
    {
      id: 'iphone', era: '2000s', year: 2007, name: 'iPhone（第一代）',
      img: 'images/iphone.jpg', shape: 'touch', color: '#c9cbce', exhibit: true,
      feature: '全觸控螢幕、社群媒體時代的起點，改變了現代智慧型手機的面貌',
      look: '正面只有一顆實體 Home 鍵；第一部把音樂播放器、行動電話與瀏覽器（Safari）集於一身的手機'
    },
    {
      id: 'htc-dream', era: '2000s', year: 2008, name: 'HTC Dream',
      img: 'images/htc-dream.jpg', shape: 'slider', color: '#2a2a2a',
      feature: '第一款 Android（安卓）手機',
      look: '側滑蓋設計，螢幕下方有實體按鍵與方便操作的軌跡球'
    },
    {
      id: 'iphone4', era: '2010s', year: 2010, name: 'iPhone 4',
      img: 'images/iphone4.jpg', shape: 'touch', color: '#111111', flat: true,
      feature: '第一款有前置鏡頭的 iPhone',
      look: '推出蘋果的標誌性應用 FaceTime 視訊通話、三明治玻璃設計'
    },
    {
      id: 'galaxy-note', era: '2010s', year: 2011, name: 'Samsung Galaxy Note',
      img: 'images/galaxy-note.jpg', shape: 'phablet', color: '#1d1f24', exhibit: true,
      feature: '開創了智慧型手機的大螢幕與手寫筆風潮',
      look: '配備 S Pen 電磁式觸控筆，可以直接在超大螢幕上書寫與繪畫'
    },
    {
      id: 'iphone5s', era: '2010s', year: 2013, name: 'iPhone 5s',
      img: 'images/iphone5s.jpg', shape: 'touch', color: '#d8c3a5', flat: true,
      feature: '首創實體 Home 鍵結合 Touch ID 指紋辨識',
      look: '主畫面按鈕內建指紋辨識感測器，可用於解鎖手機及確認購買'
    },
    {
      id: 'iphone12', era: '2020s', year: 2020, name: 'iPhone 12',
      img: 'images/iphone12.jpg', shape: 'modern', color: '#2d4a6e',
      feature: '第一款支援 5G 的 iPhone',
      look: '支援 5G 行動網路，下載與串流速度更快'
    },
    {
      id: 'galaxy-s24', era: '2020s', year: 2024, name: 'Samsung Galaxy S24',
      img: 'images/galaxy-s24.jpg', shape: 'modern', color: '#6b5b8a', triple: true,
      feature: '主打 Galaxy AI 的手機，代表 AI 開始融入行動裝置',
      look: '在螢幕上任意圈選文字或圖片，就能直接搜尋或翻譯'
    }
  ],

  people: [
    { name: '馬丁·庫珀', en: 'Martin Cooper', era: '1970s', text: '用手持行動電話打出史上第一通手機電話，被稱為「手機之父」' },
    { name: '法蘭克·卡諾瓦', en: 'Frank Canova', era: '1990s', text: '智慧型手機的創始者，設計了第一部智慧型手機 IBM Simon' },
    { name: '愛德華·強森', en: 'E.A. Johnson', era: '1990s', text: '研發觸控螢幕技術，為日後的智慧型手機奠定基礎' },
    { name: '史蒂夫·賈伯斯', en: 'Steve Jobs', era: '2000s', text: '發表第一代 iPhone，定義了現代智慧型手機的樣貌，並透過 App Store 改變全球的軟體生態' },
    { name: '安迪·魯賓', en: 'Andy Rubin', era: '2000s', text: '開發 Android 作業系統，讓 HTC、三星等品牌能快速推出智慧型手機，被稱為「Android 之父」' }
  ],

  issues: [
    { title: '滑世代', url: 'https://eliteracy.edu.tw/Article.aspx?id=2986',
      text: '手輕輕一滑，就能讓自己與世界連接。習慣隨手一滑生活型態的行動載具使用者，被稱為「滑世代」。' },
    { title: 'Z世代／數位原住民', url: 'https://www.goh.org.tw/perspectives/gen-z/',
      text: '出生於 1997 至 2012 年、從小與網路、手機和社群媒體共生的世代。對他們來說，「網路即生活，社群即人際」。' },
    { title: '媒介即人的延伸', url: 'https://scitechvista.nat.gov.tw/Article/c000003/detail?ID=52da7694-a096-4d6a-9783-8dc695f28904',
      text: '麥克魯漢提出：手機延伸了人的感官與溝通能力，創造出「非在場的臨場感」。' },
    { title: '無所不在的學習', url: 'https://scitechvista.nat.gov.tw/Article/C000003/detail?ID=d7fa55e6-e9a0-4373-905b-48c360411c8c',
      text: '行動裝置讓學生可以隨時隨地獲取知識，教師的角色也從講述者轉變為引導者。' },
    { title: '手機的誘惑進化', url: 'https://www.npf.org.tw/2/23166',
      text: '行動支付、隨時聯絡等多功能服務讓人難以脫離手機，功能越來越多，也使人容易產生依賴。' }
  ],

  // 心理測驗：每個選項 A/B/C/D 對應一種結果，選最多的那一種就是結果（平手時取前面的）。
  quiz: {
    questions: [
      { q: '你想買新手機，你會先看什麼？', options: ['價格', '外型', '功能', '品牌'] },
      { q: '若手機只能留下一個功能，你會選什麼？', options: ['遊戲／影音', '社群媒體', '拍照 App', '行動支付'] },
      { q: '你最常使用手機的什麼功能？', options: ['遊戲／影音', '社群媒體', '拍照 App', '行動支付'] },
      { q: '朋友傳訊息給你，你會？', options: ['馬上回覆', '已讀不回', '不讀不回', '回他「我在忙，等等再回」'] }
    ],
    results: [
      { key: 'A', title: '經典耐用型', phone: 'nokia-3310',
        text: '你重視實用和 CP 值，不追流行但很可靠，就像打不壞、電池用不完的 Nokia 3310。' },
      { key: 'B', title: '潮流社交型', phone: 'iphone',
        text: '你在意外型、喜歡分享生活，社群就是你的主場，就像開啟觸控與社群時代的第一代 iPhone。' },
      { key: 'C', title: '功能探索型', phone: 'galaxy-note',
        text: '你喜歡把手機的功能玩到極致，拍照、畫畫、筆記樣樣來，就像開創大螢幕與手寫筆風潮的 Galaxy Note。' },
      { key: 'D', title: '效率生活型', phone: 'galaxy-s24',
        text: '你講求效率，支付、查資料都在手機上一次完成，就像把 AI 帶進日常的 Galaxy S24。' }
    ]
  },

  // 沉浸體驗：key 是手機的 id。劇情分成「演出」(play) 和「自由參觀」(explore) 兩種段落。
  // play：captions 是字幕（at = 第幾秒出現），focus 是鏡頭要提示觀眾看的地方。
  // explore：使用者自由轉動視角，看向發光的地方就會出現 hotspots 裡的解說。
  // 動作本身寫在 js/scenes/<module>.js，這裡只放文字，改字幕或解說不用動程式。
  scenes: {
    'dynatac-8000x': {
      module: 'dynatac',
      title: '1984・街頭的「大哥大」',
      intro: '你正站在 1984 年美國某座城市的人行道上。第一支商用手機 Motorola DynaTAC 8000X 剛上市不久，看看街上的人怎麼看待它。',
      note: '情境重現：依據史料推想當時的典型情況，人物與情節為虛構。',
      beats: [
        { type: 'play', scene: 'street',
          captions: [
            { at: 0, text: '1984 年，美國某座城市的街頭。' },
            { at: 4.5, text: '那時候人在外面想打電話，多半要找公共電話、投硬幣。' }
          ],
          focus: [{ at: 0, target: 'street' }, { at: 4, target: 'payphone' }] },
        { type: 'play', scene: 'arrive',
          captions: [
            { at: 0, text: '一位穿西裝的上班族走了過來，手上拿著一個像磚頭的東西。' },
            { at: 7.6, text: '他把它舉到耳邊——開始講電話。' }
          ],
          focus: [{ at: 0, target: 'exec' }] },
        { type: 'play', scene: 'stare',
          captions: [
            { at: 0, text: '路人紛紛停下腳步。' },
            { at: 4, text: '沒有電線、站在路邊就能講電話，對當時的人來說簡直像科幻電影。' }
          ],
          focus: [{ at: 0, target: 'crowd' }, { at: 4, target: 'exec' }] },
        { type: 'explore', hotspots: ['phone', 'payphone', 'car', 'crowd'],
          prompt: '自由參觀：轉動視角，看向發光的圓點' },
        { type: 'play', scene: 'dead',
          captions: [
            { at: 0, text: '講沒多久，電話突然沒聲音了。' },
            { at: 4.5, text: '電池用完了。這支手機充飽電，大約只能講 30 分鐘。' }
          ],
          focus: [{ at: 0, target: 'exec' }] },
        { type: 'play', scene: 'payphone',
          captions: [
            { at: 0, text: '他只好走向公共電話。' },
            { at: 6, text: '在那個年代，「把電話帶在身上」還是少數人才有的奢侈。' }
          ],
          focus: [{ at: 0, target: 'exec' }] },
        { type: 'explore', hotspots: ['mast', 'exec', 'news'],
          prompt: '自由參觀：抬頭、轉身看看，還有幾個地方可以看' }
      ],
      hotspots: {
        phone: { title: 'Motorola DynaTAC 8000X',
          text: '第一支商用手持行動電話，1983 年獲准上市。售價約 3,995 美元，重約 790 公克，可以存 30 組號碼。充飽電大約能講 30 分鐘，充電卻要 10 個小時左右。' },
        payphone: { title: '公共電話',
          text: '手機普及以前，在外面打電話要靠公共電話：找到電話亭、投硬幣，講完再把話筒掛回去。很多人身上帶零錢，就是為了打電話。' },
        car: { title: '車用電話的天線',
          text: '手持手機出現以前，「行動電話」大多裝在汽車裡，靠汽車的電瓶供電。後車窗上那根捲捲的天線，就是這台車裝了電話的標誌。' },
        crowd: { title: '路人的反應',
          text: '當時手機昂貴又少見，在街上拿著它講電話，很容易成為大家注目的焦點。對很多人來說，這是第一次看到「沒有電線的電話」。' },
        mast: { title: '基地台',
          text: '手機要靠附近的基地台收發訊號。1983 年 10 月，美國第一個商用蜂巢式行動網路在芝加哥開通。這一代（1G）用類比訊號，只能講電話，而且容易被人用無線電掃描器偷聽。' },
        exec: { title: '身分的象徵',
          text: '因為價格高昂，DynaTAC 很快成了成功商人的象徵。1987 年的電影《華爾街》裡，主角在海灘上拿著它講電話，成為那個年代的經典畫面。' },
        news: { title: '第一通手機電話',
          text: '1973 年 4 月 3 日，Motorola 工程師馬丁·庫珀在紐約街頭用 DynaTAC 原型機，打給競爭對手貝爾實驗室，這被視為史上第一通手持行動電話。從原型機到正式上市，花了整整 10 年。' }
      }
    }
  },

  sources: [
    { name: 'Mobile Phone Museum', url: 'https://www.mobilephonemuseum.com/' },
    { name: 'mowned', url: 'https://mowned.com/' },
    { name: 'Pinterest — cell phone museum', url: 'https://www.pinterest.com/ideas/cell-phone-museum/900083597621/' },
    { name: '國立科學工藝博物館 — 電信@臺灣', url: 'https://www.nstm.gov.tw/Exhibition.aspx?KeyID=422a9a67-5ad4-460b-9e01-7633be54ebcf' },
    { name: '國立科學工藝博物館虛擬展 — 電信數位博物館', url: 'https://telecom.nstm.gov.tw/' }
  ]
};
