// 展覽內容資料：2D 時間軸與 3D 展廳共用這一份。
// 要改文字、加手機、換照片，改這個檔案就好。
// 照片：目前先用自動產生的佔位圖。有照片時，把圖片放進 images/ 資料夾，並把該手機的 img 改成 'images/檔名.jpg' 即可。
// shape：3D 展廳用來決定模型外型，可用 brick / car / flip / clam / candybar / slider / touch / phablet / modern / radio（背負式電台）/ simon（IBM Simon）

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
        { year: '1989', text: '手機尺寸縮小，出現 MicroTAC「半掀蓋」手機：鍵盤上的蓋子裡有麥克風' }
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
        { year: '1995', text: 'Nokia 6000 系列自此年起推出，1997 年的 6110 是代表機型：矩形外形，可貼合手掌、錢包或口袋' },
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
      id: 'scr-300', era: '1940s', year: 1942, name: 'SCR-300 背負式無線對講機',
      shape: 'radio', color: '#4a5a3a', exhibit: true, imgNote: '此展品目前沒有照片。3D 模型是依背負式電台的外型示意，細節已簡化。',
      feature: '美軍二戰期間使用的無線對講機，士兵不必拉電線，就能在移動中通話',
      look: '大型機器，背在背上，拉出一根長天線，搭配一支手持話筒'
    },
    {
      id: 'dynatac-proto', era: '1970s', year: 1973, name: 'Motorola DynaTAC 原型機',
      img: 'images/dynatac-8000x.jpg', credit: 'Redrum0486／CC BY-SA 3.0／https://commons.wikimedia.org/wiki/File:DynaTAC8000X.jpg', imgNote: '照片為 1983 年量產機 DynaTAC 8000X。1973 年原型機沒有可公開使用的照片，外型與此相近。', shape: 'brick', color: '#cfc6b4',
      feature: '最早的手機，手持式手機誕生，但尚未於市場推出',
      look: '體積大、外形四方、配有長的天線、需要較長時間充電，綽號「黑金剛」'
    },
    {
      id: 'senator', era: '1980s', year: 1982, name: 'Nokia-Mobira Senator',
      img: 'images/senator.png', shape: 'car', color: '#3b3f45',
      feature: 'Nokia 推出的第一部車載電話', exhibit: true,
      look: '體積龐大、限制多，定位為車載行動電話，無法隨身攜帶'
    },
    {
      id: 'dynatac-8000x', era: '1980s', year: 1983, name: 'Motorola DynaTAC 8000X',
      img: 'images/dynatac-8000x.jpg', credit: 'Redrum0486／CC BY-SA 3.0／https://commons.wikimedia.org/wiki/File:DynaTAC8000X.jpg', shape: 'brick', color: '#e3ddd0',
      feature: '首款商用手機',
      look: '體積大又重，當時只有經濟條件好的人才買得起，又被稱為「大哥大」'
    },
    {
      id: 'sc-1000', era: '1980s', year: 1988, name: 'Samsung SC-1000',
      img: 'images/sc-1000.png', imgNote: '照片為同時期的三星 SH-100S 手持機，外型與此展品相近。', shape: 'brick', color: '#2b2b2b',
      feature: '三星早期的車用行動電話',
      look: '專為車內使用設計的行動電話'
    },
    {
      id: 'microtac', era: '1980s', year: 1989, name: 'Motorola MicroTAC',
      img: 'images/microtac.png', shape: 'flip', color: '#2a2c30',
      feature: '第一支半掀蓋式行動電話', exhibit: true,
      look: '體積縮小，話筒蓋做在按鍵上方的摺疊設計，讓麥克風更靠近嘴巴'
    },
    {
      id: 'orbitel-901', era: '1990s', year: 1992, name: 'Orbitel 901（第一則簡訊的接收機）',
      shape: 'brick', color: '#3a3f45', exhibit: true, imgNote: '此展品目前沒有照片。3D 展廳的模型只是通用的「早期大型手機」造型，不是它的實物外型。',
      feature: '據記載，全世界第一則簡訊（1992 年 12 月）收到的就是這一類手機',
      look: '屬於「可攜式」電話，不是能放進口袋的手持機：整機據報導約 2.1 公斤，光是電池單元就約 9×19×29 公分'
    },
    {
      id: 'ibm-simon', era: '1990s', year: 1994, name: 'IBM Simon Personal Communicator',
      shape: 'simon', color: '#2a2d33', exhibit: true, imgNote: '此展品目前沒有照片。3D 模型依「厚重的長條機身、直立的觸控螢幕、附觸控筆」示意，細節已簡化。',
      feature: '一般認為是最早的智慧型手機之一，用觸控筆點選觸控螢幕',
      look: '外型厚重，正面是觸控螢幕，附有一支觸控筆，沒有實體鍵盤'
    },
    {
      id: 'startac', era: '1990s', year: 1996, name: 'Motorola StarTAC',
      img: 'images/startac.png', shape: 'clam', color: '#1f2226',
      feature: '最早普及的貝殼式摺疊手機，可以放進口袋', exhibit: true,
      look: '重量輕，機身頂部有一根可自由拉出的伸縮天線，有來電震動功能'
    },
    {
      id: 'siemens-s10', era: '1990s', year: 1997, name: 'Siemens S10',
      img: 'images/siemens-s10.jpg', credit: 'Blahblahleaf1／CC0／https://commons.wikimedia.org/wiki/File:Telekom_Serbia_Siemens_S10.jpg', shape: 'candybar', color: '#4a5560', screen: 'color',
      feature: '第一款彩色螢幕手機，為日後的彩色手機發展奠定基礎',
      look: '螢幕只能顯示紅、綠、藍、白四種顏色'
    },
    {
      id: 'nokia-3210', era: '1990s', year: 1999, name: 'Nokia 3210',
      img: 'images/nokia-3210.jpg', credit: '作者見來源頁／CC BY-SA 3.0／https://commons.wikimedia.org/wiki/File:Nokia_3210.jpg', shape: 'candybar', color: '#2f5aa8',
      feature: '最早普及的內藏天線手機之一',
      look: '能自由更換多種顏色機殼，內建經典的貪吃蛇遊戲'
    },
    {
      id: 'nokia-3310', era: '2000s', year: 2000, name: 'Nokia 3310',
      img: 'images/nokia-3310.png', shape: 'candybar', color: '#2c3e63', exhibit: true,
      feature: '直立式手機，以極佳的耐摔程度與超長續航力聞名',
      look: '超強續航、內建貪吃蛇遊戲，內部結構紮實，以耐用聞名'
    },
    {
      id: 'j-sh04', era: '2000s', year: 2000, name: 'Sharp J-SH04',
      img: 'images/j-sh04.jpg', credit: 'Morio／CC BY-SA 3.0／https://commons.wikimedia.org/wiki/File:Sharp_J-SH04_CP%2B_2011.jpg', shape: 'candybar', color: '#b8bcc2', screen: 'color', camera: true,
      feature: '最早量產的照相手機之一',
      look: '最早商業化、內建相機的照相手機之一'
    },
    {
      id: 'iphone', era: '2000s', year: 2007, name: 'iPhone（第一代）',
      img: 'images/iphone.png', shape: 'touch', color: '#c9cbce', exhibit: true,
      feature: '全觸控螢幕、社群媒體時代的起點，改變了現代智慧型手機的面貌',
      look: '正面只有一顆實體 Home 鍵；第一部把音樂播放器、行動電話與瀏覽器（Safari）集於一身的手機'
    },
    {
      id: 'htc-dream', era: '2000s', year: 2008, name: 'HTC Dream',
      img: 'images/htc-dream.jpg', credit: 'Sumwiki／CC BY 3.0／https://commons.wikimedia.org/wiki/File:HTC_Dream_(front_view).jpg', shape: 'slider', color: '#2a2a2a',
      feature: '第一款 Android（安卓）手機',
      look: '側滑蓋設計，螢幕下方有實體按鍵與方便操作的軌跡球'
    },
    {
      id: 'iphone4', era: '2010s', year: 2010, name: 'iPhone 4',
      img: 'images/iphone4.jpg', credit: 'K2025／CC0／https://commons.wikimedia.org/wiki/File:IPhone_4_-_front.jpg', shape: 'touch', color: '#111111', flat: true,
      feature: '第一款有前置鏡頭的 iPhone',
      look: '推出蘋果的標誌性應用 FaceTime 視訊通話、三明治玻璃設計'
    },
    {
      id: 'galaxy-note', era: '2010s', year: 2011, name: 'Samsung Galaxy Note',
      img: 'images/galaxy-note.png', shape: 'phablet', color: '#1d1f24', exhibit: true,
      feature: '開創了智慧型手機的大螢幕與手寫筆風潮',
      look: '配備 S Pen 電磁式觸控筆，可以直接在超大螢幕上書寫與繪畫'
    },
    {
      id: 'iphone5s', era: '2010s', year: 2013, name: 'iPhone 5s',
      img: 'images/iphone5s.png', credit: 'Zach Vega／CC BY-SA 3.0／https://commons.wikimedia.org/wiki/File:IPhone_5s_Black.png', shape: 'touch', color: '#d8c3a5', flat: true,
      feature: '首創實體 Home 鍵結合 Touch ID 指紋辨識',
      look: '主畫面按鈕內建指紋辨識感測器，可用於解鎖手機及確認購買'
    },
    {
      id: 'iphone12', era: '2020s', year: 2020, name: 'iPhone 12',
      img: 'images/iphone12.png', credit: 'TheGoldenBox／CC BY-SA 4.0／https://commons.wikimedia.org/wiki/File:IPhone_12_Blue.svg', shape: 'modern', color: '#2d4a6e',
      feature: '第一款支援 5G 的 iPhone',
      look: '支援 5G 行動網路，下載與串流速度更快'
    },
    {
      id: 'galaxy-s24', era: '2020s', year: 2024, name: 'Samsung Galaxy S24',
      img: 'images/galaxy-s24.webp', credit: 'C.Stadler/Bwag／CC BY-SA 4.0／https://commons.wikimedia.org/wiki/File:Samsung_Galaxy_S24,_Sperrbildschirm.JPG', shape: 'modern', color: '#6b5b8a', triple: true,
      feature: '主打 Galaxy AI 的手機，代表 AI 開始融入行動裝置',
      look: '在螢幕上任意圈選文字或圖片，就能直接搜尋或翻譯（Circle to Search，由 Google 與三星合作）'
    }
  ],

  people: [
    {"name": "馬丁·庫珀", "en": "Martin Cooper", "when": "1970 年代", "phones": ["dynatac-proto", "dynatac-8000x"], "text": "用手持行動電話打出史上第一通公開的手機電話，被稱為「手機之父」", "img": "images/person-cooper.jpg", "credit": "GS200／CC BY-SA 3.0／https://commons.wikimedia.org/wiki/File:Martin_Cooper,_Two_Antennas,_October_2010.jpg", "story": "1973 年，庫珀在 Motorola 主管通訊系統部門，競爭對手是貝爾實驗室（AT&T）。4 月 3 日，他拿著 DynaTAC 原型機站在紐約曼哈頓的人行道上，打電話給貝爾實驗室的 Joel Engel，成了公開示範的第一通手持行動電話。原型機重約 1.1 公斤，通話只能講大約 30 分鐘，充電卻要 10 小時。從這通電話到 DynaTAC 8000X 真正上市，還要再等十年。", "facts": [["生年", "1928 年 12 月 26 日，美國芝加哥"], ["1973 年", "任職 Motorola，主管通訊系統部門"], ["第一通電話", "1973 年 4 月 3 日，紐約曼哈頓第六大道人行道"], ["原型機", "重約 1.1 公斤；通話約 30 分鐘，充電約 10 小時"], ["之後", "1986 年與妻子 Arlene Harris 共同創辦 Dyna LLC；2013 年獲馬可尼獎"]], "see": [["看 1973 年的第一通手機電話", "exhibit.html#scene-dynatac-proto"], ["看 DynaTAC 8000X 場景", "exhibit.html#scene-dynatac-8000x"]], "src": [["Wikipedia：Martin Cooper", "https://en.wikipedia.org/wiki/Martin_Cooper_(inventor)"], ["Fox News：第一通手機電話", "https://www.foxnews.com/tech/the-first-mobile-phone-call-was-placed-40-years-ago-today"]]},
    {"name": "法蘭克·卡諾瓦", "en": "Frank Canova", "when": "1990 年代", "phones": ["ibm-simon"], "text": "智慧型手機的創始者，設計了第一部智慧型手機 IBM Simon", "img": "images/person-canova.jpg", "credit": "Frank Canova（Seaware）／CC BY-SA 4.0／https://commons.wikimedia.org/wiki/File:Frank_J_Canova.jpg", "story": "1992 年 11 月，IBM 工程師卡諾瓦帶著代號「Angler」的原型機到拉斯維加斯的 COMDEX 展出，想把電話、記事本、傳真這些功能放進同一台能用手指點螢幕的裝置裡。這個想法兩年後成為 1994 年 8 月開賣的 IBM Simon。專利在 1995 年核發，申請的優先日是 1992 年 11 月 13 日。有書籍稱他是「智慧型手機的發明者」，不過「智慧型手機」這個詞是後來才有的。", "facts": [["生年", "1956 年 12 月 23 日，美國德拉瓦州威爾明頓"], ["原型機", "1992 年 11 月 COMDEX 展出，代號 Angler"], ["上市", "1994 年 8 月，IBM Simon，透過 BellSouth 銷售"], ["專利", "US 5537608，1995 年核發"], ["之後", "1997 年 1 月加入 Palm，領導 PalmPilot 的工程團隊"]], "see": [["看 IBM Simon 場景", "exhibit.html#scene-ibm-simon"], ["看 1990 年代時間軸", "exhibit.html#era-1990s"]], "src": [["Wikipedia：Frank J. Canova", "https://en.wikipedia.org/wiki/Frank_J._Canova"], ["電腦歷史博物館：IBM Simon", "https://www.computerhistory.org/revolution/mobile-computing/18/341/1733"]]},
    {"name": "艾瑞克·強森", "en": "Eric A. Johnson", "when": "1960 年代", "phones": [], "text": "1960 年代在英國皇家雷達研究所發表用手指直接觸控螢幕的研究，是觸控螢幕技術的早期先驅", "img": "", "credit": "", "story": "1960 年代，英國皇家雷達研究所（Royal Radar Establishment，位於 Malvern）的工程師強森，在研究怎麼讓人更直接地操作電腦，據說最初是為了空中交通管制員。1965 年，他在期刊《Electronics Letters》發表短文，描述用手指直接碰螢幕來輸入的電容式觸控顯示；1967 年又在《Ergonomics》用照片與圖解做了更完整的說明。這比第一代 iPhone 早了四十多年。", "facts": [["全名", "Eric A. Johnson（中文沒有統一的譯名）"], ["單位", "Royal Radar Establishment，英國 Malvern"], ["1965 年", "《Electronics Letters》第 1 卷第 8 期，〈Touch Display – A novel input/output device for computers〉"], ["1967 年", "《Ergonomics》第 10 卷第 2 期，〈Touch Displays: A Programmed Man-Machine Interface〉"], ["生卒年", "找不到可靠資料，所以沒有寫"]], "see": [["看 iPhone 場景的觸控解說", "exhibit.html#scene-iphone"]], "src": [["Wikipedia：Touchscreen", "https://en.wikipedia.org/wiki/Touchscreen"], ["Embedded Computing：觸控螢幕的發明", "https://embeddedcomputing.com/home-page/the-royal-air-force-and-the-invention-of-the-modern-touch-screen"]]},
    {"name": "史蒂夫·賈伯斯", "en": "Steve Jobs", "when": "2000 年代", "phones": ["iphone", "iphone4"], "text": "發表第一代 iPhone，定義了現代智慧型手機的樣貌，並透過 App Store 改變全球的軟體生態", "img": "images/person-jobs.jpg", "credit": "Matthew Yohe／CC BY-SA 3.0／https://commons.wikimedia.org/wiki/File:Steve_Jobs_Headshot_2010_(cropped_6).jpg", "story": "2007 年 1 月 9 日，賈伯斯在舊金山的 Macworld 大會上介紹 iPhone。他先說要發表三樣東西：寬螢幕的觸控 iPod、革命性的手機、突破性的網路通訊裝置，然後揭曉這其實是同一台機器。iPhone 在 6 月 29 日開賣；一年後的 2008 年 7 月 App Store 上線，手機才開始能自己安裝各種應用程式。賈伯斯在 2011 年 10 月 5 日去世，享年 56 歲。", "facts": [["生卒", "1955 年 2 月 24 日，舊金山—2011 年 10 月 5 日，帕羅奧圖"], ["Apple", "1976 年與 Wozniak 共同創辦；1997 年回任 CEO；2011 年辭任"], ["iPhone", "2007 年 1 月 9 日發表，6 月 29 日開賣"], ["App Store", "2008 年 7 月上線"]], "see": [["看 iPhone 咖啡館場景", "exhibit.html#scene-iphone"]], "src": [["Wikipedia：Steve Jobs", "https://en.wikipedia.org/wiki/Steve_Jobs"], ["AppleInsider：iPhone 發表", "https://appleinsider.com/articles/19/01/09/when-apple-introduced-the-iphone-on-jan-9-2007-it-was-the-ultimate-computer-for-the-rest-of-us"]]},
    {"name": "安迪·魯賓", "en": "Andy Rubin", "when": "2000 年代", "phones": ["htc-dream", "galaxy-note"], "text": "開發 Android 作業系統，讓 HTC、三星等品牌能快速推出智慧型手機，被稱為「Android 之父」", "img": "images/person-rubin.jpg", "credit": "Yoichiro Akiyama／CC BY-SA 2.0／https://commons.wikimedia.org/wiki/File:2008_Google_Developer_Day_in_Japan_-_Andy_Rubin_(cropped).jpg", "story": "2003 年 10 月，魯賓與 Rich Miner、Nick Sears、Chris White 在加州 Palo Alto 創辦 Android Inc.。2005 年 8 月，Google 收購了這家公司，魯賓繼續帶團隊做以 Linux 為基礎的行動平台。2007 年 11 月 5 日，Google 公布 Open Handset Alliance 與 Android 平台；2008 年 10 月，HTC Dream（在美國名為 T-Mobile G1）成為第一款上市的 Android 手機。魯賓在 2014 年 10 月離開 Google。", "facts": [["生年", "1963 年 3 月 13 日"], ["創辦", "2003 年 10 月，Android Inc.，加州 Palo Alto"], ["被收購", "2005 年 8 月，Google"], ["Android 公布", "2007 年 11 月 5 日，同時成立 Open Handset Alliance"], ["第一支手機", "2008 年 10 月，HTC Dream（T-Mobile G1）"], ["之後", "2014 年 10 月 31 日離開 Google；2015 年共同創辦 Essential，2020 年停止營運"]], "see": [["看 HTC Dream", "phone.html#htc-dream"]], "src": [["Wikipedia：Andy Rubin", "https://en.wikipedia.org/wiki/Andy_Rubin"], ["Wikipedia：HTC Dream", "https://en.wikipedia.org/wiki/HTC_Dream"], ["TechRadar：Android 的歷史", "https://www.techradar.com/news/phone-and-communications/mobile-phones/a-complete-history-of-android-470327"]]}
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
    'scr-300': {
      module: 'walkie1940',
      title: '1942・野外訓練場的無線電',
      intro: '1940 年代的野外訓練場。一位通信兵背著無線電，準備跟遠處的指揮官通話。',
      note: '情境重現：依據史料推想當時的典型情況，人物與情節為虛構。',
      outro: { title: '從背上到口袋裡', text: '背在背上的無線電，是行動通訊的第一步。之後的每一代機器，都在讓通話變得更輕、更近。' },
      beats: [
        { type: 'play', scene: 'walk',
          captions: [
            { at: 0, text: '1940 年代，美軍的野外訓練場。' },
            { at: 3.2, text: '一位通信兵背著一台大型無線電，身上拉出一根長長的天線。' },
            { at: 6.2, text: '機器很重，但不用拉電線，人就能一邊走一邊聯絡。' }
          ],
          focus: [{ at: 0, target: 'walk' }, { at: 4, target: 'op' }] },
        { type: 'play', scene: 'call',
          captions: [
            { at: 0, text: '他停下來，把掛在胸前的話筒貼到耳邊。' },
            { at: 3.4, text: '按住通話鍵，對著話筒說話。' },
            { at: 6.6, text: '對面的人還在遠處的營區，但聲音已經傳過去了。' }
          ],
          focus: [{ at: 0, target: 'radio' }, { at: 5, target: 'op' }] },
        { type: 'explore', hotspots: ['radio', 'antenna'],
          prompt: '自由參觀：看看背上的機器，還有那根長天線' },
        { type: 'play', scene: 'reply',
          captions: [
            { at: 0, text: '遠處的指揮官拿起自己的話筒。' },
            { at: 3.2, text: '放開通話鍵，等待回覆。' },
            { at: 6.2, text: '「收到，完畢。」這種一問一答的通話方式，就是後來許多對講機的原型。' }
          ],
          focus: [{ at: 0, target: 'cmd' }, { at: 4, target: 'op' }] },
        { type: 'explore', hotspots: ['handset', 'cmd'],
          prompt: '自由參觀：看看話筒，還有遠處的指揮官' }
      ],
      hotspots: {
        radio: { title: '背負式無線電',
          text: '這台機器背在背上，靠電池供電。它讓士兵不必拉電線，就能在野外聯絡，是「行動通訊」最早的樣子之一。' },
        antenna: { title: '長天線',
          text: '天線從背包頂端拉出，負責收發無線電波。天線的高度會影響收發的效果，所以通信兵會盡量把它拉高。' },
        handset: { title: '話筒',
          text: '話筒用一條線接到背上的機器。按住通話鍵才會發射聲音，放開就變成接收。「按住說話、放開聽」的方式，後來也用在許多對講機上。' },
        cmd: { title: '遠處的指揮官',
          text: '對講機讓兩個人即使不在同一個地方，也能互相通話。人不必待在固定的電話機旁，這正是行動通訊的雛形。' }
      }
    },
    'iphone12': {
      module: 'iphone12-2020',
      title: '2020・居家的一通視訊',
      intro: '2020 年秋天的傍晚，一位年輕人在家裡。桌上的 iPhone 12 吸在 MagSafe 充電座上，媽媽打來視訊。',
      note: '情境重現：依據史料推想當時的典型情況。手機的發表時間與功能依 Apple 新聞稿，人物與通話內容為虛構。',
      outro: { title: '一支手機，兩個新習慣', text: '5G 讓影音通話與下載更順，MagSafe 讓充電和配件不用再對準。這一代 iPhone 把這兩件事放進了日常。' },
      beats: [
        { type: 'play', scene: 'evening',
          captions: [
            { at: 0, text: '2020 年秋天，傍晚的公寓。那一年，很多人待在家裡，用視訊跟家人見面。' },
            { at: 3.6, text: '門邊的掛勾上掛著口罩和鑰匙。年輕人走進來，走向高腳桌。' },
            { at: 6.4, text: '桌上，一支 iPhone 12 平放在一個圓形的充電座上。' }
          ],
          focus: [{ at: 0, target: 'room' }, { at: 6, target: 'puck' }] },
        { type: 'play', scene: 'pickup',
          captions: [
            { at: 0, text: '手機亮了起來：媽媽打來視訊。' },
            { at: 3.4, text: '他伸手，把手機從充電座上拿起來。' },
            { at: 5.4, text: '手機背面有一圈磁鐵，吸得住，卻不費力就能拿開。' },
            { at: 7.4, text: '他按下接聽。' }
          ],
          focus: [{ at: 0, target: 'puck' }, { at: 5, target: 'phone' }] },
        { type: 'play', scene: 'call',
          captions: [
            { at: 0, text: '螢幕上出現媽媽的臉。' },
            { at: 3.2, text: 'iPhone 12 系列全部支援 5G，影音通話的畫面更順。' },
            { at: 6.2, text: '他把手機舉高，讓媽媽看看這個房間。' }
          ],
          focus: [{ at: 0, target: 'phone' }, { at: 5, target: 'phone' }] },
        { type: 'explore', hotspots: ['phone', 'network'],
          prompt: '自由參觀：看看這支手機，還有螢幕上的 5G' },
        { type: 'play', scene: 'end',
          captions: [
            { at: 0, text: '通話結束。' },
            { at: 2.0, text: '他把手機放回充電座。' },
            { at: 3.4, text: '磁鐵一吸，手機自己對準位置，開始充電。' },
            { at: 6.0, text: '不用插線，也不用對準。' }
          ],
          focus: [{ at: 0, target: 'phone' }, { at: 3, target: 'puck' }] },
        { type: 'explore', hotspots: ['magsafe', 'screen'],
          prompt: '自由參觀：看看充電座，還有手機的螢幕' }
      ],
      hotspots: {
        phone: { title: 'iPhone 12',
          text: '2020 年 10 月 13 日發表，是第一款支援 5G 的 iPhone，使用 A14 仿生晶片，螢幕是 6.1 吋的 Super Retina XDR。' },
        network: { title: '5G',
          text: 'iPhone 12 系列的四款機型全部支援 5G。5G 的網路更快，影音通話與下載會更順；實際的速度要看電信業者和所在地的網路。' },
        magsafe: { title: 'MagSafe',
          text: '背面有一圈磁鐵，充電器和配件會自己吸到正確的位置。MagSafe 充電最高約 15 瓦（iPhone 12 mini 為 12 瓦）；真正負責充電的仍是無線充電線圈，磁鐵只是幫忙對位。' },
        screen: { title: 'Ceramic Shield 與 Super Retina XDR',
          text: '正面是 Apple 這一代新推出的 Ceramic Shield 面板，下面是 6.1 吋的 Super Retina XDR 螢幕。' }
      }
    },
    'iphone4': {
      module: 'iphone4-2010',
      title: '2010・客廳裡的視訊電話',
      intro: '2010 年夏天，晚上的客廳。一位年輕人拿著剛買的 iPhone 4，要跟遠方的家人視訊。',
      note: '情境重現：依據史料推想當時的典型情況。手機與 FaceTime 的推出時間依史料，人物與通話內容為虛構。',
      outro: { title: '看得見的通話', text: 'iPhone 4 讓視訊通話變得很日常。從這時候開始，「看見對方」成了手機的一項基本功能。' },
      beats: [
        { type: 'play', scene: 'arrive',
          captions: [
            { at: 0, text: '2010 年夏天，晚上的客廳。' },
            { at: 3.4, text: '一位年輕人從走廊走進來，手上拿著剛買的 iPhone 4。' },
            { at: 6.6, text: '它的邊框是一圈金屬，背面是玻璃，手感很薄。' }
          ],
          focus: [{ at: 0, target: 'arrive' }, { at: 4, target: 'phone' }] },
        { type: 'play', scene: 'call',
          captions: [
            { at: 0, text: '他把手機舉到胸前，打開 FaceTime。' },
            { at: 3.8, text: '螢幕上出現遠方家人的臉。' },
            { at: 6.8, text: 'FaceTime 是 iPhone 4 推出時主打的功能之一，視訊通話從此變得簡單。' }
          ],
          focus: [{ at: 0, target: 'phone' }, { at: 5, target: 'user' }] },
        { type: 'explore', hotspots: ['retina', 'camera'],
          prompt: '自由參觀：看看螢幕的清晰度，還有上方的前置鏡頭' },
        { type: 'play', scene: 'talk',
          captions: [
            { at: 0, text: '他把手機舉高，讓家人看見這個房間。' },
            { at: 3.2, text: '螢幕的解析度很高，文字與照片都清楚得多。' },
            { at: 6.2, text: '對方也能看見他，兩個遠方的人，像是坐在同一個房間裡。' }
          ],
          focus: [{ at: 0, target: 'user' }, { at: 4, target: 'phone' }] },
        { type: 'explore', hotspots: ['glass', 'window'],
          prompt: '自由參觀：看看玻璃背面，還有窗外的夜晚' }
      ],
      hotspots: {
        retina: { title: 'Retina 高解析度螢幕',
          text: 'iPhone 4 的螢幕像素很密，文字與圖片在近距離看起來幾乎沒有顆粒感，這是當時主打的賣點之一。' },
        camera: { title: '前置鏡頭',
          text: '螢幕上方的前置鏡頭，讓手機可以拍攝自己，也讓視訊通話變成日常。' },
        glass: { title: '玻璃與金屬機身',
          text: '背面是玻璃，邊框是金屬，機身很薄。這種材質搭配，讓它看起來比以前的手機更精緻。' },
        window: { title: '窗外的夜晚',
          text: '那時候，人們開始用手機跟遠方的人「面對面」說話。手機不只能聽見聲音，也能看見對方。' }
      }
    },
    'microtac': {
      module: 'micro1989',
      title: '1989・街角的半掀蓋手機',
      intro: '1989 年的城市街角。一位女士手上握著一支很小的手機，來電時，她把鍵盤上的蓋子翻開接聽。',
      note: '情境重現：依據史料推想當時的典型情況。手機的推出時間依史料，人物與情節為虛構。',
      outro: { title: '會翻開的蓋子', text: '蓋子保護了按鍵，也讓話筒靠近嘴巴，手機因此變得更小。幾年後，完整的貝殼式手機 StarTAC 把這個想法又往前推了一步。' },
      beats: [
        { type: 'play', scene: 'walk',
          captions: [
            { at: 0, text: '1989 年，城市的街角。' },
            { at: 3.2, text: '一位女士走在人行道上，手裡握著一支收起來的手機。' },
            { at: 6.4, text: '那是 Motorola MicroTAC，鍵盤上有一片可以翻開的蓋子，常被稱為最早的「半掀蓋」手機。' }
          ],
          focus: [{ at: 0, target: 'walk' }, { at: 4, target: 'lady' }] },
        { type: 'play', scene: 'flip',
          captions: [
            { at: 0, text: '來電了。她把手機舉到胸前，用拇指把鍵盤上的蓋子往上翻。' },
            { at: 3.8, text: '蓋子翻開，露出按鍵，機身上的小螢幕顯示著通話中。她把話筒貼到耳邊。' },
            { at: 6.8, text: '蓋子保護了按鍵，也讓手機比 DynaTAC 小了許多，可以放進口袋。' }
          ],
          focus: [{ at: 0, target: 'micro' }, { at: 5, target: 'lady' }] },
        { type: 'explore', hotspots: ['micro', 'hinge'],
          prompt: '自由參觀：看看翻開的機身，還有蓋子的鉸鏈' },
        { type: 'play', scene: 'hang',
          captions: [
            { at: 0, text: '通話結束，她把手機放下來。' },
            { at: 3.0, text: '喀一聲，蓋子被闔上，蓋住了按鍵。' },
            { at: 5.6, text: '手機收進口袋，街上的人仍然各自走著。' }
          ],
          focus: [{ at: 0, target: 'micro' }, { at: 4, target: 'lady' }] },
        { type: 'explore', hotspots: ['antenna', 'street'],
          prompt: '自由參觀：看看頂端的天線，還有街角的停車' }
      ],
      hotspots: {
        micro: { title: 'Motorola MicroTAC',
          text: '1989 年推出，比 DynaTAC 小了許多，可以放進口袋。它是當時很有代表性的手機，也是「半掀蓋」設計的早期例子。' },
        hinge: { title: '蓋子的鉸鏈',
          text: '鉸鏈讓蓋子能像書一樣翻開、闔上。蓋子裡有麥克風，翻開後話筒更靠近嘴巴；合上時蓋住按鍵，不容易誤按。螢幕在機身上、不在蓋子裡，所以只算「半」掀蓋，StarTAC 才是完整的貝殼式。' },
        antenna: { title: '伸縮天線',
          text: '機身頂端的天線可以拉出來，幫助收訊。收起來的時候，手機就更容易放進口袋。' },
        street: { title: '街角的停車',
          text: '八〇年代的街上，停著的多半是這樣方正的轎車。當時手機還很少，在路上講電話會引起注目。' }
      }
    },
    'htc-dream': {
      module: 'g1-2008',
      title: '2008・公園長椅上的 Android',
      intro: '2008 年秋天，城市公園的傍晚。一位年輕人拿出一支有滑蓋鍵盤的手機，要在上面下載一個小程式。',
      note: '情境重現：依據史料推想當時的典型情況。手機與 Android Market 的推出時間依史料，人物與情節為虛構。',
      outro: { title: '能裝程式的手機', text: '從這支能自己裝上新程式的手機開始，手機慢慢變成你每天都會打開的東西。' },
      beats: [
        { type: 'play', scene: 'walk',
          captions: [
            { at: 0, text: '2008 年秋天，城市公園裡的傍晚。' },
            { at: 3.2, text: '一位年輕人走到長椅旁，拿出一支有滑蓋鍵盤的手機。' },
            { at: 6.4, text: '那是 HTC Dream（G1），第一支搭載 Android 系統的手機。' }
          ],
          focus: [{ at: 0, target: 'walk' }, { at: 4, target: 'user' }] },
        { type: 'play', scene: 'slide',
          captions: [
            { at: 0, text: '他把螢幕往上一推，底下的實體鍵盤就露出來了。' },
            { at: 3.2, text: '打開 Android Market，找到想要的小程式。' },
            { at: 6.2, text: '按下下載，進度條慢慢跑了起來。' }
          ],
          focus: [{ at: 0, target: 'slider' }, { at: 4, target: 'user' }] },
        { type: 'explore', hotspots: ['slider', 'trackball'],
          prompt: '自由參觀：看看滑蓋與底下的軌跡球' },
        { type: 'play', scene: 'done',
          captions: [
            { at: 0, text: '進度條跑完，程式的圖示出現在桌面上。' },
            { at: 3.4, text: '他點開它，螢幕亮了起來。' },
            { at: 6.4, text: '那時候，「裝上一個新程式」第一次走進一般人的口袋。' }
          ],
          focus: [{ at: 0, target: 'app' }, { at: 5, target: 'app' }] },
        { type: 'explore', hotspots: ['app', 'park'],
          prompt: '自由參觀：看看桌面上的程式，還有這座公園的傍晚' }
      ],
      hotspots: {
        slider: { title: '滑蓋式鍵盤',
          text: '螢幕往上滑開，露出一整排 QWERTY 實體鍵盤。當時很多智慧型手機都靠實體鍵盤打字，觸控螢幕還沒有普及。' },
        trackball: { title: '軌跡球',
          text: '螢幕下方的小球可以滾動，用來移動游標、選取畫面上的項目。在觸控普及以前，這是常見的操作方式。' },
        app: { title: 'Android Market',
          text: '2008 年，Android Market 隨著這款手機推出，讓人可以在手機上下載應用程式。這是 App 生態系的早期樣子。' },
        park: { title: '城市的傍晚',
          text: '在這之前，手機的功能大多由製造商決定。這支手機讓使用者可以自己裝上新程式，手機開始變成可以「長出新功能」的工具。' }
      }
    },
    'dynatac-proto': {
      module: 'proto1973',
      title: '1973・紐約街頭的第一通手機電話',
      intro: '1973 年 4 月的紐約街頭。Motorola 工程師馬丁·庫珀拿著一支沉甸甸的原型機，準備打一通電話。',
      note: '情境重現：依據史料推想當時的典型情況。通話的時間、對象與原型機的樣子依史料，街上的人與情節為虛構。',
      outro: { title: '從原型機到口袋裡', text: '1973 年的這通電話，花了十年才在 1983 年變成可以買的 DynaTAC 8000X。' },
      beats: [
        { type: 'play', scene: 'walk',
          captions: [
            { at: 0, text: '1973 年 4 月 3 日，紐約曼哈頓的街頭。' },
            { at: 3.6, text: '馬丁·庫珀拿著一個沉甸甸的黑色方塊，那是 Motorola 的 DynaTAC 原型機。' },
            { at: 6.6, text: '它重一公斤多，比一本厚書還大，天線還得伸出來。' }
          ],
          focus: [{ at: 0, target: 'street' }, { at: 4, target: 'phone' }] },
        { type: 'play', scene: 'dial',
          captions: [
            { at: 0, text: '他停下腳步，把原型機舉到胸前，按下號碼。' },
            { at: 3.8, text: '他要打的對象，是貝爾實驗室研究蜂巢式網路的工程師喬·恩格爾。' },
            { at: 6.6, text: '他把它貼到耳邊。' }
          ],
          focus: [{ at: 0, target: 'cooper' }, { at: 5, target: 'cooper' }] },
        { type: 'play', scene: 'talk',
          captions: [
            { at: 0, text: '電話接通了。' },
            { at: 2.6, text: '他在街頭開口說話，不用電線，也不用找公共電話亭。' },
            { at: 6.6, text: '路過的人紛紛停下，看著這個站在路邊講電話的人。' }
          ],
          focus: [{ at: 0, target: 'cooper' }, { at: 6, target: 'crowd' }] },
        { type: 'explore', hotspots: ['proto', 'antenna'],
          prompt: '自由參觀：轉動視角，看看這支原型機' },
        { type: 'play', scene: 'hang',
          captions: [
            { at: 0, text: '通話結束。他把手機放下來，掂了掂它的重量。' },
            { at: 3.6, text: '這是第一次，手機真的被人拿到街上，帶著走。' },
            { at: 6.4, text: '但它還不能賣。從這一刻到 1983 年正式上市，還要整整十年。' }
          ],
          focus: [{ at: 0, target: 'cooper' }, { at: 4, target: 'phone' }] },
        { type: 'explore', hotspots: ['crowd', 'cooper'],
          prompt: '自由參觀：看看街上的人，還有這個站在路邊的人' }
      ],
      hotspots: {
        proto: { title: 'Motorola DynaTAC 原型機',
          text: '這支 1973 年的原型機重一公斤多，比 1983 年上市的 DynaTAC 8000X（約 790 公克）還要重、還要大。它是實驗機，電池撐不久，充電也很慢，還不是能買的商品。' },
        antenna: { title: '伸出來的天線',
          text: '手持機頂端的天線，負責和基地台收發訊號。這根天線又長又直，是早期手持機的典型特徵。' },
        crowd: { title: '路過的人',
          text: '在街上拿著一支黑色方塊講電話，很容易引起注目。對當時的人來說，「不用電線的電話」還像是科幻電影裡的東西。' },
        cooper: { title: '馬丁·庫珀',
          text: '1973 年 4 月 3 日，他在紐約街頭用這支原型機，打給貝爾實驗室的喬·恩格爾，被視為第一通公開的手持行動電話通話。當時他任職於 Motorola。' }
      }
    },
    'orbitel-901': {
      module: 'sms1992',
      title: '1992・第一則簡訊',
      intro: '1992 年 12 月，英國一間辦公室裡，工程師用電腦寫下一句聖誕祝福，要送到另一支手機上。',
      note: '情境重現：依據史料推想當時的典型情況。簡訊的時間與內容依史料，辦公室與派對的情節為虛構；電話的外型與擺放位置只是示意。',
      outro: { title: '一句 Merry Christmas', text: '這則短短的簡訊，是文字溝通在手機上的第一步。之後，傳訊息慢慢成為手機上最常用的功能之一。' },
      beats: [
        { type: 'play', scene: 'desk',
          captions: [
            { at: 0, text: '1992 年 12 月，英國的一間辦公室。' },
            { at: 3.6, text: '一位工程師站在電腦前，正在打字。' },
            { at: 6.6, text: '他要寫的，只是一句很短的聖誕祝福。' }
          ],
          focus: [{ at: 0, target: 'pc' }, { at: 5, target: 'neil' }] },
        { type: 'play', scene: 'send',
          captions: [
            { at: 0, text: '這句話要送給一位電信公司的主管。' },
            { at: 3.4, text: '他按下送出。' },
            { at: 5.2, text: '訊息不走信件，而是走電信網路，直接送到對方的手機上。' }
          ],
          focus: [{ at: 0, target: 'pc' }] },
        { type: 'explore', hotspots: ['pc', 'party'],
          prompt: '自由參觀：看看電腦螢幕，還有另一頭的派對' },
        { type: 'play', scene: 'party',
          captions: [
            { at: 0, text: '另一頭的聖誕派對上，主管身旁的電話響了一下。' },
            { at: 3.8, text: '他走過去，彎下腰，螢幕上只有一行字。' },
            { at: 6.6, text: 'Merry Christmas。' }
          ],
          focus: [{ at: 0, target: 'boss' }, { at: 4, target: 'phone' }] },
        { type: 'explore', hotspots: ['phone', 'sms'],
          prompt: '自由參觀：看看這台電話，還有螢幕上的那行字' }
      ],
      hotspots: {
        pc: { title: '1992 年的電腦',
          text: '那時候的電腦多半是桌上型，螢幕又大又重。這句話是在電腦上打好的，再透過一套軟體送進電信網路。' },
        party: { title: '聖誕派對',
          text: '據記載，這則訊息送到的是電信公司的一位主管，時間正好在 1992 年的聖誕節前後。收到的人正在派對上，電話突然響了一下。' },
        phone: { title: 'Orbitel 901（可攜式電話）',
          text: '據記載，第一則簡訊收到的就是 Orbitel 901。它是「可攜式」電話：主機加電池很重，整機據報導約 2.1 公斤，不是能放進口袋的手持機。畫面裡的外型只是示意。' },
        sms: { title: '一行字，一則簡訊',
          text: '簡訊（SMS）每則最多 160 個字元，短短的 "Merry Christmas" 剛好放得下。當時大多數人還是用通話來溝通，文字訊息是一項新功能。' }
      }
    },
    'ibm-simon': {
      module: 'simon1994',
      title: '1994・機場候機室的觸控筆',
      intro: '1994 年，一位出差的商人在機場候機室裡，用一台能觸控、能寫郵件的機器處理工作。',
      note: '情境重現：依據史料推想當時的典型情況，人物與情節為虛構。',
      outro: { title: '從觸控筆到手指', text: '螢幕慢慢成為手機的主角，觸控筆也逐漸被手指取代。' },
      beats: [
        { type: 'play', scene: 'lobby',
          captions: [
            { at: 0, text: '1994 年，某個機場的候機室。' },
            { at: 3.2, text: '一位出差的商人走過來，手上拿著一台厚重的機器。' },
            { at: 6.2, text: '它的外型像一本厚厚的筆記本，正面是一塊觸控螢幕。' }
          ],
          focus: [{ at: 0, target: 'lobby' }, { at: 4, target: 'man' }] },
        { type: 'play', scene: 'touch',
          captions: [
            { at: 0, text: '他停下來，從機器旁抽出一支細細的觸控筆。' },
            { at: 3.0, text: '點一下螢幕，就能打開行事曆。' },
            { at: 6.2, text: '行事曆、通訊錄、待辦事項，都放在同一台機器裡。' }
          ],
          focus: [{ at: 0, target: 'simon' }, { at: 4, target: 'simon' }] },
        { type: 'explore', hotspots: ['simon', 'stylus'],
          prompt: '自由參觀：看看這台機器的外型，還有那支觸控筆' },
        { type: 'play', scene: 'send',
          captions: [
            { at: 0, text: '他在螢幕上寫了一封短短的電子郵件。' },
            { at: 3.6, text: '按下傳送。' },
            { at: 5.6, text: '它還能收發傳真，很多人把它視為最早的智慧型手機之一。' }
          ],
          focus: [{ at: 0, target: 'screen' }] },
        { type: 'explore', hotspots: ['screen', 'battery'],
          prompt: '自由參觀：看看螢幕，還有這台機器的續航' }
      ],
      hotspots: {
        simon: { title: 'IBM Simon Personal Communicator',
          text: '1994 年上市，把電話、行事曆、通訊錄、電子郵件和傳真放在同一台機器裡。一般認為它是最早的智慧型手機之一。' },
        stylus: { title: '觸控筆',
          text: '這台機器沒有實體鍵盤，螢幕上的按鈕要靠觸控筆點選。用筆操作的方式，之後大多被手指取代。' },
        screen: { title: '觸控螢幕',
          text: '螢幕不大，但可以直接點選。行事曆、通訊錄、郵件，全都用觸碰來操作，這在當時是很新的做法。' },
        battery: { title: '充電與續航',
          text: '電池續航很有限，充一次電能用的時間不長。這是當時手機的共同限制，也是後來手機持續改進的方向。' }
      }
    },
    'senator': {
      module: 'senator',
      title: '1982・街邊的車載電話',
      intro: '你站在 1982 年的街邊。一輛車停了下來，車上裝著 Nokia 的第一部車載電話，看看那時候的人怎麼用它。',
      note: '情境重現：依據史料推想當時的典型情況，人物與情節為虛構。',
      outro: { title: '回到現在', text: '1982 年的電話只能待在車上。一年後，Motorola DynaTAC 8000X 讓手機第一次真正離開了車子。' },
      beats: [
        { type: 'play', scene: 'park',
          captions: [
            { at: 0, text: '1982 年，一輛車緩緩駛進路邊。' },
            { at: 4, text: '車子後窗上，立著一根捲捲的天線。' },
            { at: 7.4, text: '駕駛打開車門，走了下來。' }
          ],
          focus: [{ at: 0, target: 'street' }, { at: 4.4, target: 'car' }] },
        { type: 'play', scene: 'trunk',
          captions: [
            { at: 0, text: '他走到車子後面。' },
            { at: 4.2, text: '打開後車廂。' },
            { at: 7, text: '裡面放著一個大黑箱，那是電話的主機。' },
            { at: 9.6, text: '主機大到，只能放在後車廂。' }
          ],
          focus: [{ at: 0, target: 'car' }, { at: 4.4, target: 'trunk' }] },
        { type: 'explore', hotspots: ['unit', 'antenna', 'senator'],
          prompt: '自由參觀：轉動視角，看向發光的圓點' },
        { type: 'play', scene: 'handset',
          captions: [
            { at: 0, text: '他走回駕駛座旁。' },
            { at: 3.6, text: '從車裡拿起話筒，貼到耳邊。' },
            { at: 7.6, text: '路人好奇地停下腳步，看他在路邊講電話。' }
          ],
          focus: [{ at: 0, target: 'door' }, { at: 4, target: 'a' }, { at: 7.6, target: 'car' }] },
        { type: 'play', scene: 'range',
          captions: [
            { at: 0, text: '他想邊走邊講電話……' },
            { at: 5.2, text: '電話線只有這麼長，一下就被拉住了。' },
            { at: 8.2, text: '他只好走回車邊。' }
          ],
          focus: [{ at: 0, target: 'a' }, { at: 5, target: 'door' }] },
        { type: 'play', scene: 'leave',
          captions: [
            { at: 0, text: '講完電話，他把話筒掛回去。' },
            { at: 4.2, text: '關上後車廂。' },
            { at: 7.4, text: '回到車上，發動引擎。' },
            { at: 11.4, text: '車子開走了。話筒、主機和天線，全都跟著車子離開。' },
            { at: 14, text: '那時候的電話離不開車子。' }
          ],
          focus: [{ at: 0, target: 'door' }, { at: 4.2, target: 'trunk' }, { at: 11, target: 'car' }] },
        { type: 'explore', hotspots: ['handset', 'cord', 'network'],
          prompt: '自由參觀：看看還有哪些地方可以聊' }
      ],
      hotspots: {
        senator: { title: 'Nokia-Mobira Senator',
          text: '1982 年推出，是 Nokia 的第一部車載電話。體積龐大、限制多，定位為車載行動電話，無法隨身攜帶。' },
        unit: { title: '後車廂裡的主機',
          text: '電話的主機又大又重，所以放在後車廂，靠車子的電瓶供電。這就是它被定位成「車載」電話的原因。' },
        antenna: { title: '車用電話的天線',
          text: '車身上的天線負責收發訊號。後車窗上這種捲捲的天線，是當時車用電話的標誌。' },
        handset: { title: '話筒',
          text: '話筒放在駕駛座旁，用一條電話線接到後車廂的主機，樣子很像家裡的市話。' },
        cord: { title: '電話線的長度',
          text: '電話線的長度有限，走遠就拉不到了。所以車載電話只能在車子附近使用，沒辦法真的「隨身」。' },
        network: { title: '1G 類比式行動電話',
          text: '1980 年代的行動電話是 1G 類比式系統。北歐的瑞典和挪威在 1981 年開通了 NMT 行動電話網路（丹麥與芬蘭隔年跟進），是最早的一批商用蜂巢式網路之一。' }
      }
    },
    'startac': {
      module: 'startac',
      title: '1996・辦公大樓裡的口袋手機',
      intro: '你站在 1996 年的一棟辦公大樓大廳。一位上班族腰間的手機突然震動，看看這支能放進口袋的手機，跟以前的手機差在哪裡。',
      note: '情境重現：依據史料推想當時的典型情況，人物與情節為虛構。',
      outro: { title: '回到現在', text: '從磚頭一樣的大哥大，到闔起來能放進口袋的 StarTAC，手機終於開始真正「隨身」。接下來，它還會長出彩色螢幕和相機。' },
      beats: [
        { type: 'play', scene: 'lobby',
          captions: [
            { at: 0, text: '1996 年，一棟辦公大樓的大廳。' },
            { at: 4.5, text: '一位上班族匆匆走進來，腰間掛著一個小小的東西。' },
            { at: 8.4, text: '大廳另一頭，同事正在等電梯。' }
          ],
          focus: [{ at: 0, target: 'lobby' }, { at: 5, target: 'group' }] },
        { type: 'play', scene: 'buzz',
          captions: [
            { at: 0, text: '他停下腳步。' },
            { at: 1.2, text: '腰間突然震了一下。' },
            { at: 4.2, text: '這是來電震動，開會的時候也不會吵到別人。' },
            { at: 7.4, text: '他把手機從腰間拿起來，翻開上蓋。' }
          ],
          focus: [{ at: 0, target: 'group' }, { at: 4.4, target: 'phone' }] },
        { type: 'play', scene: 'talk',
          captions: [
            { at: 0, text: '他把手機貼到耳邊。' },
            { at: 3.5, text: '手機又輕又小，邊走邊講電話一點也不吃力。' },
            { at: 8, text: '同事好奇地看著他手裡的東西。' }
          ],
          focus: [{ at: 0, target: 'phone' }, { at: 8, target: 'group' }] },
        { type: 'explore', hotspots: ['startac', 'vibe', 'board'],
          prompt: '自由參觀：轉動視角，看向發光的圓點' },
        { type: 'play', scene: 'compare',
          captions: [
            { at: 0, text: '講完電話，他把手機放下來。' },
            { at: 3.4, text: '他把上蓋闔上。' },
            { at: 5.4, text: '同事也拿出自己的手機。一支像磚頭，一支能握在掌心。' },
            { at: 9.6, text: '兩個人看著彼此的手機，忍不住笑了。' }
          ],
          focus: [{ at: 0, target: 'phone' }, { at: 5.4, target: 'brick' }] },
        { type: 'play', scene: 'pocket',
          captions: [
            { at: 0, text: '他把手機收進襯衫口袋，一點也不顯眼。' },
            { at: 4.2, text: '同事也想把自己的手機塞進口袋……' },
            { at: 7.6, text: '結果露出了一大截。' }
          ],
          focus: [{ at: 0, target: 'phone' }, { at: 4.4, target: 'brick' }] },
        { type: 'explore', hotspots: ['pocket', 'weight', 'oldbrick'],
          prompt: '自由參觀：看看還有哪些地方可以聊' }
      ],
      hotspots: {
        startac: { title: 'Motorola StarTAC',
          text: '1996 年推出，是最早普及的貝殼式（翻蓋）摺疊手機。闔起來後只有手掌大小，機身頂部有一根可以拉出來的伸縮天線。' },
        vibe: { title: '來電震動',
          text: 'StarTAC 有來電震動功能，電話一來機身就會震動提醒。這讓人在會議或安靜的地方，不用靠鈴聲也能知道有電話。' },
        board: { title: '1990 年代的通訊',
          text: '1990 年代手機進入 2G（GSM）數位通訊時代，除了通話，還能傳簡訊，機身也越做越小。' },
        pocket: { title: '放得進口袋',
          text: 'StarTAC 闔起來可以放進襯衫或外套口袋。更早的手機多半得提在手上、掛在腰間，或裝在車子裡，所以能放進口袋，是很大的改變。' },
        weight: { title: '有多輕？',
          text: 'StarTAC 約 88 至 94 公克（依型號而異），1983 年的 DynaTAC 8000X 約 790 公克，輕了非常多。' },
        oldbrick: { title: '同事的老手機',
          text: '這是更早期的磚頭型手機。那時的手機又大又重，帶著走不太方便，所以很多人只在車上或辦公室用。' }
      }
    },
    'galaxy-note': {
      module: 'note',
      title: '2011・圖書館裡的手寫筆記',
      intro: '你站在 2011 年的大學圖書館。同學剛買了一支特別大的新手機，看看他怎麼用它做筆記。',
      note: '情境重現：依據史料推想當時的典型情況，人物與情節為虛構。',
      outro: { title: '回到現在', text: '從 2007 年只靠手指的小螢幕，到 2011 年的大螢幕加手寫筆，手機一步步變成可以讀書、做筆記、畫圖的工具。' },
      beats: [
        { type: 'play', scene: 'library',
          captions: [
            { at: 0, text: '2011 年，大學圖書館的書架旁。' },
            { at: 4.5, text: '兩個同學站著聊天，討論等一下要交的報告。' },
            { at: 8, text: '其中一個人把手伸進口袋。' }
          ],
          focus: [{ at: 0, target: 'library' }, { at: 5, target: 'group' }] },
        { type: 'play', scene: 'pull',
          captions: [
            { at: 0, text: '他拿出一支特別大的手機。' },
            { at: 3.4, text: '螢幕有 5.3 吋，比當時一般的手機大了一圈。' },
            { at: 6.6, text: '朋友瞪大眼睛：「這麼大？」' }
          ],
          focus: [{ at: 0, target: 'phone' }, { at: 3, target: 'group' }] },
        { type: 'explore', hotspots: ['note', 'oldphone', 'sign'],
          prompt: '自由參觀：轉動視角，看向發光的圓點' },
        { type: 'play', scene: 'write',
          captions: [
            { at: 0, text: '他從機身裡抽出一支筆。' },
            { at: 3.2, text: '直接在螢幕上寫字，不用鍵盤，也不用手指。' },
            { at: 8, text: '寫起來就像在紙上做筆記。' }
          ],
          focus: [{ at: 0, target: 'phone' }, { at: 8, target: 'group' }] },
        { type: 'play', scene: 'draw',
          captions: [
            { at: 0, text: '他又在螢幕上畫了一張草圖，想把想法講給朋友聽。' },
            { at: 5.2, text: '朋友湊過來看，忍不住點頭。' },
            { at: 9, text: '用手寫比打字快，畫圖更是方便。' }
          ],
          focus: [{ at: 0, target: 'phone' }, { at: 5, target: 'group' }] },
        { type: 'play', scene: 'size',
          captions: [
            { at: 0, text: '朋友也拿出自己的手機，兩支並排一比。' },
            { at: 3.6, text: '螢幕差了一大圈，也難怪有人說它介於手機和平板之間。' },
            { at: 7.2, text: '他想把手機收回口袋……' },
            { at: 9.2, text: '結果口袋塞不下，露出了一大截。' }
          ],
          focus: [{ at: 0, target: 'small' }, { at: 4, target: 'phone' }, { at: 7.4, target: 'group' }] },
        { type: 'explore', hotspots: ['spen', 'screen', 'phablet'],
          prompt: '自由參觀：看看還有哪些地方可以聊' }
      ],
      hotspots: {
        note: { title: 'Samsung Galaxy Note',
          text: '2011 年推出，螢幕約 5.3 吋，比當時一般手機大了一圈。它開創了智慧型手機的大螢幕與手寫筆風潮。' },
        oldphone: { title: '朋友的手機',
          text: '2011 年大多數智慧型手機的螢幕只有 3 到 4 吋上下，單手就能握住。第一次看到 5 吋以上的手機，很多人都覺得「太大了」。' },
        sign: { title: '2010 年代：4G',
          text: '2010 年代 4G 推出，快速的數據傳輸讓高速行動網路、影音串流、直播成為日常。螢幕越大，看影片和讀文件就越舒服。' },
        spen: { title: 'S Pen 手寫筆',
          text: 'S Pen 是電磁式觸控筆，可以直接在超大螢幕上書寫與繪畫。從 2007 年「拿掉觸控筆、用手指操作」，到這裡又把筆請回來，這次是為了寫字和畫圖。' },
        screen: { title: '5.3 吋大螢幕',
          text: '螢幕大小約 5.3 吋，解析度 1280×800。大螢幕讓看影片、讀文件、寫字都更舒服。' },
        phablet: { title: '平板手機',
          text: '這種介於手機（phone）和平板（tablet）之間的大螢幕手機，後來被稱為「平板手機」（phablet）。Galaxy Note 就是這個風潮的開創者。' }
      }
    },
    'galaxy-s24': {
      module: 's24',
      title: '2024・異國小巷裡的 AI 手機',
      intro: '你在夜晚的異國小巷裡。旅人剛到這座城市，招牌上的字一個也看不懂。看看 2024 年的手機怎麼幫他。',
      note: '情境重現：依據史料推想當時的典型情況，人物與情節為虛構。',
      outro: { title: '回到現在', text: '從只能打電話的大哥大，到能看懂、聽懂、幫你翻譯的手機，手機不只是工具，也開始像一位隨身的助手。' },
      beats: [
        { type: 'play', scene: 'street',
          captions: [
            { at: 0, text: '2024 年，夜晚的異國小巷。' },
            { at: 4.5, text: '旅人第一次來到這座城市，抬頭看著滿街的招牌。' },
            { at: 8.2, text: '上面的字，他一個也看不懂。' }
          ],
          focus: [{ at: 0, target: 'street' }, { at: 5, target: 'sign' }] },
        { type: 'play', scene: 'lost',
          captions: [
            { at: 0, text: '他停下腳步，皺起眉頭。' },
            { at: 3.2, text: '那是一間小吃攤，看起來香氣四溢，但不知道賣什麼。' },
            { at: 5.4, text: '他拿出手機。' }
          ],
          focus: [{ at: 0, target: 'sign' }, { at: 5, target: 'phone' }] },
        { type: 'play', scene: 'circle',
          captions: [
            { at: 0, text: '他在螢幕上，用手指把招牌圈起來。' },
            { at: 4, text: '手機認出了招牌上的字。' },
            { at: 6.2, text: '一轉眼，翻譯就出現了：這是一間拉麵店，而且正在營業。' }
          ],
          focus: [{ at: 0, target: 'phone' }, { at: 3.6, target: 'sign' }] },
        { type: 'explore', hotspots: ['s24', 'sign', 'ai'],
          prompt: '自由參觀：轉動視角，看向發光的圓點' },
        { type: 'play', scene: 'order',
          captions: [
            { at: 0, text: '他走向攤位。' },
            { at: 2.8, text: '老闆用日文笑著打招呼。' },
            { at: 4.4, text: '他把手機拿到兩人之間，開啟口譯功能，螢幕上立刻出現中文。' },
            { at: 7.6, text: '他說「我要一碗拉麵」，手機同時把這句話翻成日文，老闆點點頭。' }
          ],
          focus: [{ at: 0, target: 'stall' }, { at: 4.4, target: 'phone' }, { at: 7.6, target: 'stall' }] },
        { type: 'play', scene: 'bye',
          captions: [
            { at: 0, text: '吃完拉麵，他起身向老闆道謝。' },
            { at: 3.4, text: '老闆揮揮手，笑著回應。' },
            { at: 6.8, text: '不會日文，也能在陌生的巷子裡自在地點餐、聊天。' }
          ],
          focus: [{ at: 0, target: 'stall' }, { at: 6, target: 'phone' }] },
        { type: 'explore', hotspots: ['interp', 'network', 'noren'],
          prompt: '自由參觀：看看還有哪些地方可以聊' }
      ],
      hotspots: {
        s24: { title: 'Samsung Galaxy S24',
          text: '2024 年 1 月推出，主打 Galaxy AI。AI 不只是一個 App，而是融入手機本身的功能。' },
        sign: { title: '圈選即搜尋',
          text: '在螢幕上任意圈選文字或圖片，就能直接搜尋或翻譯，不用先截圖、再打開別的 App。這是 Google 與三星合作的功能，Galaxy S24 系列是第一批搭載的手機，2024 年 1 月推出。' },
        ai: { title: 'AI 融入手機',
          text: 'Galaxy S24 是主打 Galaxy AI 的手機，代表 AI 開始融入行動裝置。手機不只是接收指令，也開始幫你理解眼前的文字和聲音。' },
        interp: { title: '即時口譯',
          text: '兩個人說不同的語言時，手機可以邊聽邊翻譯，讓雙方都看到自己的語言。這類即時翻譯，是 Galaxy AI 的功能之一。' },
        network: { title: '2020 年代：5G 與生成式 AI',
          text: '網路更快、更省電；手機與 AI 結合，除了通訊與娛樂，也成為學習、工作、支付的重要工具。' },
        noren: { title: '看不懂的文字',
          text: '在國外，招牌、菜單、路標常常是看不懂的文字。以前得靠字典或翻譯 App，現在手機在螢幕上就能直接翻。' }
      }
    },
    'iphone': {
      module: 'iphone',
      title: '2007・咖啡館裡的新手機',
      intro: '你站在 2007 年夏天，美國某座城市的一間咖啡館。朋友剛買了一支新手機，看看那時候的人怎麼看待它。',
      note: '情境重現：依據史料推想當時的典型情況，人物與情節為虛構。',
      outro: { title: '回到現在', text: '那時候的手機要按按鍵，這支手機只靠手指。十多年後，用手指滑一滑，已經是每個人每天的習慣。' },
      beats: [
        { type: 'play', scene: 'cafe',
          captions: [
            { at: 0, text: '2007 年夏天，美國街角的咖啡館。' },
            { at: 4.5, text: '兩個朋友站在高腳桌旁聊天，其中一個剛買了新手機。' }
          ],
          focus: [{ at: 0, target: 'cafe' }, { at: 4, target: 'group' }] },
        { type: 'play', scene: 'swipe',
          captions: [
            { at: 0, text: '他從口袋裡拿出一支沒有按鍵的手機。' },
            { at: 4, text: '只有一塊螢幕。他用手指一滑，就解鎖了。' },
            { at: 8.4, text: '朋友湊過來，眼睛瞪得大大的。' }
          ],
          focus: [{ at: 0, target: 'iphone' }, { at: 4, target: 'group' }] },
        { type: 'explore', hotspots: ['iphone', 'oldphone', 'board'],
          prompt: '自由參觀：轉動視角，看向發光的圓點' },
        { type: 'play', scene: 'pinch',
          captions: [
            { at: 0, text: '他打開一張照片。' },
            { at: 3.6, text: '兩根手指一拉，照片就放大了。' },
            { at: 7.4, text: '朋友忍不住伸手，想自己試試看。' }
          ],
          focus: [{ at: 0, target: 'iphone' }, { at: 7, target: 'group' }] },
        { type: 'play', scene: 'compare',
          captions: [
            { at: 0, text: '朋友也拿出了自己的手機。' },
            { at: 4.4, text: '一支要按按鍵，一支只靠手指。' },
            { at: 7.4, text: '那個夏天，很多人第一次看到這樣的手機。' }
          ],
          focus: [{ at: 0, target: 'flip' }, { at: 4, target: 'iphone' }] },
        { type: 'explore', hotspots: ['touch', 'net', 'appstore'],
          prompt: '自由參觀：看看還有哪些地方可以聊' }
      ],
      hotspots: {
        iphone: { title: '第一代 iPhone',
          text: '2007 年 6 月在美國開賣，螢幕 3.5 吋，正面只有一顆實體按鍵，沒有實體鍵盤。當時 4GB 版本的售價是 499 美元。它把音樂播放器、手機和上網裝置放在同一台機器裡。' },
        oldphone: { title: '朋友的摺疊手機',
          text: '2007 年很多人用的是摺疊或直立式手機，撥號和打字都靠實體按鍵。大家習慣的是「按一下按鍵」，而不是用手指在螢幕上滑。' },
        board: { title: '2007 年的世界',
          text: '2007 年的手機主要用來通話和傳簡訊。手機能上網，但很少人把它當成主要的上網工具，直到觸控智慧型手機普及，情況才慢慢改變。' },
        touch: { title: '用手指直接操作',
          text: '第一代 iPhone 拿掉了觸控筆，直接用手指點、滑螢幕。兩根手指拉開就能放大照片和網頁，這就是「多點觸控」。' },
        net: { title: '只有 2G 網路',
          text: '第一代 iPhone 只支援 2G 的 EDGE 網路，上網速度不快。支援 3G 的 iPhone 3G，要等到隔年的 2008 年才推出。' },
        appstore: { title: '一年後的 App Store',
          text: '第一代 iPhone 剛上市時，還不能自己安裝其他人寫的應用程式。2008 年 App Store 開張後，手機才開始能下載各種 App。' }
      }
    },
    'nokia-3310': {
      module: 'nokia3310',
      title: '2000・下課十分鐘的教室',
      intro: '你站在 2000 年的一間教室裡，下課鐘剛響。同學圍著一支 Nokia 3310，看看那時候的人怎麼用手機。',
      note: '情境重現：依據史料推想當時的典型情況，人物與情節為虛構。',
      outro: { title: '回到現在', text: '那時候的手機，主要用來通話、傳簡訊和玩貪吃蛇。七年後，觸控螢幕會把這一切都改變。' },
      beats: [
        { type: 'play', scene: 'room',
          captions: [
            { at: 0, text: '2000 年，下課鐘剛響的教室。' },
            { at: 4.5, text: '那時候，手機已經是同學之間最熱門的話題。' }
          ],
          focus: [{ at: 0, target: 'room' }, { at: 4, target: 'group' }] },
        { type: 'play', scene: 'snake',
          captions: [
            { at: 0, text: '有人拿出了 Nokia 3310。' },
            { at: 4, text: '同學圍過來看他玩貪吃蛇。小小的單色螢幕，就是當時最受歡迎的手機遊戲。' }
          ],
          focus: [{ at: 0, target: 'phone' }, { at: 4, target: 'group' }] },
        { type: 'explore', hotspots: ['phone', 'cover', 'board'],
          prompt: '自由參觀：轉動視角，看向發光的圓點' },
        { type: 'play', scene: 'sms',
          captions: [
            { at: 0, text: '他低下頭，開始回簡訊。' },
            { at: 3.5, text: '沒有觸控螢幕，要用數字鍵一個字一個字按。' },
            { at: 6.6, text: '同學看了一眼內容，忍不住笑了出來。' }
          ],
          focus: [{ at: 0, target: 'phone' }] },
        { type: 'play', scene: 'drop',
          captions: [
            { at: 0, text: '他把手機舉起來，想給大家看個東西。' },
            { at: 2.7, text: '手滑了！手機直接掉到地上。' },
            { at: 6.6, text: '他蹲下去撿，大家都屏住呼吸。' },
            { at: 10.2, text: '螢幕還亮著，一點事也沒有。' }
          ],
          focus: [{ at: 0, target: 'phone' }, { at: 2.7, target: 'floor' }, { at: 9, target: 'phone' }] },
        { type: 'explore', hotspots: ['sms', 'tough', 'friends'],
          prompt: '自由參觀：看看還有哪些地方可以聊' }
      ],
      hotspots: {
        phone: { title: 'Nokia 3310',
          text: '2000 年推出，螢幕是 84×48 像素的單色液晶，內建貪吃蛇。Nokia 官方標示的待機時間最長約 260 小時，所以很多人一週才充一次電。據說全球賣出約 1.26 億支，是史上最暢銷的手機之一。' },
        cover: { title: '可更換的外殼',
          text: '3310 的前後殼可以自己換，同學之間常常互相比較誰的顏色比較特別。那時候的手機不只是工具，也是表達個性的配件。' },
        board: { title: '2000 年的世界',
          text: '2000 年的手機主要靠 2G 網路通話和傳簡訊，還不能好好上網看影片。之後 3G、4G 陸續出現，手機才慢慢變成現在的樣子。' },
        sms: { title: '簡訊的限制',
          text: '一則簡訊用英文最多 160 個字元，用中文寫的話，一則大約只有 70 個字。字數有限，大家都學會用最短的話把意思說完。' },
        tough: { title: '耐摔的 3310',
          text: '3310 以耐用聞名，內部結構紮實，所以後來常有人說它是「摔不壞的 Nokia」。這是民間說法，不是正式測試結果。' },
        friends: { title: '一起看手機',
          text: '那個年代手機很少人手一支，拿到新手機常常是同學圍著看。手機也是下課時間的社交話題。' }
      }
    },
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
    { name: '國立科學工藝博物館虛擬展 — 電信數位博物館', url: 'https://telecom.nstm.gov.tw/' },
    { name: 'Wikipedia — SCR-300', url: 'https://en.wikipedia.org/wiki/SCR-300' },
    { name: 'Wikipedia — Neil Papworth（第一則簡訊）', url: 'https://en.wikipedia.org/wiki/Neil_Papworth' },
    { name: 'Wikipedia — IBM Simon', url: 'https://en.wikipedia.org/wiki/IBM_Simon' },
    { name: 'Computer History Museum — IBM/BellSouth Simon', url: 'https://www.computerhistory.org/revolution/artifact/1733' },
    { name: 'Wikipedia — MicroTAC', url: 'https://en.wikipedia.org/wiki/MicroTAC' },
    { name: 'Wikipedia — HTC Dream', url: 'https://en.wikipedia.org/wiki/HTC_Dream' },
    { name: 'Android Developers Blog — Android Market now available for users', url: 'https://android-developers.googleblog.com/2008/10/android-market-now-available-for-users.html' },
    { name: 'Apple 新聞稿 — Apple Presents iPhone 4（2010）', url: 'https://www.apple.com/newsroom/2010/06/07Apple-Presents-iPhone-4/' },
    { name: 'Apple 新聞稿 — Apple announces iPhone 12 and iPhone 12 mini（2020）', url: 'https://www.apple.com/newsroom/2020/10/apple-announces-iphone-12-and-iphone-12-mini-a-new-era-for-iphone-with-5g' },
    { name: 'Apple — iPhone 12 技術規格', url: 'https://www.apple.com/eg/iphone-12/specs/' }
  ]
};

// 推薦參觀路線：steps 是沉浸場景的展品 id，依序參觀。
window.MUSEUM.routes = [
  { id: 'quick', title: '快速參觀', desc: '想先挑重點看？四個年代各一站，從車載電話一路走到 AI 手機。',
    steps: ['senator', 'nokia-3310', 'iphone', 'galaxy-s24'] },
  { id: 'street', title: '街頭篇', desc: '站在路邊看手機怎麼走出車子、走進口袋，再走到異國的巷子裡。',
    steps: ['senator', 'dynatac-8000x', 'galaxy-s24'] },
  { id: 'daily', title: '日常生活篇', desc: '辦公大樓、教室、咖啡館、圖書館，看手機怎麼融進每天的生活。',
    steps: ['startac', 'nokia-3310', 'iphone', 'galaxy-note'] },
  { id: 'origin', title: '起點篇', desc: '從背在背上的無線電，到第一通手持電話，再到能放進口袋的手機，看行動通訊怎麼起步。',
    steps: ['scr-300', 'dynatac-proto', 'dynatac-8000x', 'microtac'] },
  { id: 'smart', title: '智慧型手機誕生篇', desc: '簡訊、觸控、App、視訊、5G：看手機怎麼一步步長出智慧型手機的樣子。',
    steps: ['orbitel-901', 'ibm-simon', 'iphone', 'htc-dream', 'iphone4', 'iphone12'] }
];
