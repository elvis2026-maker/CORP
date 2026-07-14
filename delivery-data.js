// ============================================================
// delivery-data.js — 交付中心（DELIVERY_REGISTRY）
// ------------------------------------------------------------
// V24 新增。跟 org-data.js 的 ORG_REGISTRY 是同一種精神：交付中心的
// 卡片內容改成從這份資料 render，不再寫死在 index.html 裡。
//
// 這份資料**跟部門看板／待審批不一樣的地方**：部門看板的真實資料是
// 「總經理委派子任務、AI 產出文字結果」自動寫進 Cloudflare KV 的；
// 但一個 Demo 網址或一份可下載的檔案包，背後一定要有真實存在的網頁
// 或檔案，AI 沒辦法無中生有變出一個真的網址或真的檔案——所以這裡沒有
// 「自動串接後端資料庫」這件事，而是把資料結構準備好，**等您真的完成
// 一個案子、有真實的網址或檔案時，直接回來改這份資料就好**，不必再
// 找我改 HTML／CSS。
//
// 欄位說明：
//   id           — 卡片唯一識別碼
//   title        — 交付項目名稱
//   desc         — 一句話說明，可以提到是哪些部門/角色產出的
//   contributors — 參與的部門 id 陣列（對照 org-data.js 的 ORG_REGISTRY，
//                  用來顯示縮圖頭像與背景色，最多顯示前 2 個）
//   badge        — "verified"（✓ 已驗收，品質保證部小質確認過）或
//                  "pending"（待複核）
//   badgeLabel   — 徽章顯示文字
//   version      — 版本號或週期標籤，純顯示用
//   time         — 更新時間，純顯示用文字
//   demoUrl      — 真實可預覽的網址。**留空字串 "" 代表這個項目還沒有
//                  Demo 可看**，畫面會誠實顯示「尚未部署」，按鈕會是
//                  灰色不可點擊，不會出現假連結
//   downloadUrl  — 真實可下載的檔案網址（可以是同一個網站底下的相對路徑，
//                  也可以是您自己上傳到 Google Drive／Cloudflare R2 等
//                  服務後貼過來的網址）。**留空字串 "" 代表還沒有檔案
//                  可下載**，處理方式跟 demoUrl 一樣
//
// 下面第一筆「網站改版案・首頁 MVP」示範了 demoUrl／downloadUrl 都有
// 填值的樣子——連到的 ./demo/、./downloads/ 是這次一起交付、跟
// index.html 放在同一層資料夾的真實檔案，不是假連結，只是內容本身
// 是示範用的說明頁面，不是真的網站改版案成品（等真的案子做完，把這
// 兩個欄位換成真正的網址即可，./demo/、./downloads/ 這兩個資料夾
// 屆時也可以刪掉不用）。其餘三筆維持空字串，示範「還沒有真實連結」
// 時畫面該長什麼樣子。
// ============================================================

const DELIVERY_REGISTRY = [
  {
    id: 'dv-website-mvp',
    title: '網站改版案 · 首頁 MVP',
    desc: '工程部（小工）＋設計部（小設）產出，首頁與報價頁已可互動瀏覽。',
    contributors: ['bc-eng', 'bc-design'],
    badge: 'verified',
    badgeLabel: '✓ 小質已驗收',
    version: 'v1.2',
    time: '2 小時前',
    demoUrl: './demo/website-revamp-mvp.html',
    downloadUrl: './downloads/website-revamp-mvp.zip',
  },
  {
    id: 'dv-logo-v2',
    title: '品牌 LOGO 提案 v2',
    desc: '配色設計師（小色）依董事長裁示的深色系方向重新出稿，共 3 款。',
    contributors: ['bc-design'],
    badge: 'pending',
    badgeLabel: '待小質複核',
    version: 'v2.0',
    time: '昨日 18:20',
    demoUrl: '',
    downloadUrl: '',
  },
  {
    id: 'dv-subscription-prototype',
    title: '會員訂閱制・可點擊原型',
    desc: '產品代理人 C（小快）用最小成本做出的可驗證流程原型。',
    contributors: ['bc-product'],
    badge: 'verified',
    badgeLabel: '✓ 小質已驗收',
    version: 'v0.9',
    time: '3 天前',
    demoUrl: '',
    downloadUrl: '',
  },
  {
    id: 'dv-growth-weekly',
    title: '本週成長行銷週報',
    desc: '流量分析師（小流）＋ SEO 分析師（小析）彙整的完整週報 PDF。',
    contributors: ['bc-growth'],
    badge: 'verified',
    badgeLabel: '✓ 小質已驗收',
    version: 'Week 28',
    time: '今日 09:10',
    demoUrl: '',
    downloadUrl: '',
  },
];
