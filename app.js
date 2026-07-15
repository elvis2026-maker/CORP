// ============================================================
// app.js — 艾維斯萬能事務所 董事長指揮中心 互動邏輯
// ------------------------------------------------------------
// 這支檔案負責「畫面邏輯」：怎麼把 org-data.js 的 ORG_REGISTRY
// 資料渲染成畫面、怎麼回應點擊／送出等互動。部門與角色的實際
// 內容一律改 org-data.js，不要改這裡的字串。
// 載入順序要求：index.html 需先載入 org-data.js，再載入這支檔案，
// 這支檔案才能拿到 ORG_REGISTRY。
// ============================================================

// ---------------- V11：ORG_REGISTRY 正式接入渲染 ----------------
// 狀態燈號、部門即時看板、組織架構，三處畫面現在都是從同一份
// ORG_REGISTRY 資料 render 出來，不再各自寫死 HTML。
// 修改任何部門/角色的顯示內容，改 org-data.js 就會三處同時生效。

function renderLights(registry) {
  const container = document.getElementById('lightsGrid');
  if (!container) return;
  container.innerHTML = registry.map(r => `
    <a class="light-chip" href="#${r.id}" data-dept-target="${r.id}"><span class="ava ${r.avaClass} ava-sm" aria-hidden="true"><span class="ava-glyph">${r.glyph}</span><span class="ava-dot ${r.lights.dot}"></span></span><span class="light-info"><span class="light-name">${r.lightsName}</span><span class="light-state">${r.lights.state}</span></span></a>`).join('');
}

function renderBoard(registry) {
  const container = document.getElementById('boardGrid');
  if (!container) return;
  container.innerHTML = registry.map(r => {
    const b = r.board;
    const avaStateClass = b.avaState ? ' ' + b.avaState : '';
    const statusKey = b.statusDot.replace('s-', '');
    const logHtml = b.log.map(item => `
            <div class="bc-log-item"><span class="who">${item.who}</span><span class="txt">${item.txt}</span><span class="t">${item.time}</span></div>`).join('');
    const demoTag = b.isDemo ? '<i class="bc-demo-tag">示範內容</i>' : '';
    return `
        <details class="board-card" data-group="board" id="${r.id}" data-status="${statusKey}">
          <summary>
            <div class="bc-top">
              <span class="ava ${r.avaClass}${avaStateClass}" aria-hidden="true"><span class="ava-glyph">${r.glyph}</span></span>
              <span class="bc-name">${r.name}<span class="bc-nick">${r.nick}</span></span>
              <span class="bc-status"><span class="stat-dot ${b.statusDot}"></span>${b.statusLabel}</span>
              <svg class="bc-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>
            </div>
            <p class="bc-task">${b.task}</p>
            <div class="bc-bar"><div class="bc-bar-fill" style="width:${b.progress}%"></div></div>
            <div class="bc-meta"><span>${b.metaLeft}</span><span>${b.metaRight}${demoTag}</span></div>
          </summary>
          <div class="bc-log">${logHtml}
          </div>
        </details>`;
  }).join('\n');
}

function renderOrg(registry) {
  const container = document.getElementById('orgGrid');
  if (!container) return;
  const sorted = registry.slice().sort((a, b) => a.num.localeCompare(b.num));
  container.innerHTML = sorted.map(r => {
    const rolesHtml = r.roles.map(role => `
            <div class="role"><span class="role-mark"></span><div><span class="role-name">${role.name}<span class="role-nick">${role.nick}</span><span class="role-name-en">${role.nameEn}</span></span><p class="role-fn">${role.fn}</p></div></div>`).join('');
    return `
        <details class="dept" id="org-${r.id}">
          <summary>
            <span class="ava ${r.avaClass}" aria-hidden="true"><span class="ava-glyph">${r.glyph}</span></span>
            <span class="dept-head">
              <span class="dept-top"><span class="dept-num">${r.num}</span><span class="dept-name">${r.nameOrg}</span><span class="dept-nick-org">${r.nick}</span><span class="dept-name-en">${r.nameEn}</span></span>
              <span class="dept-desc">${r.desc}</span>
            </span>
            <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>
          </summary>
          <div class="roles">${rolesHtml}
          </div>
        </details>`;
  }).join('\n');
}

// ---------------- V24：交付中心改由 DELIVERY_REGISTRY 渲染 ----------------
// 跟部門看板不一樣：Demo 網址／下載檔案背後一定要有真實存在的網頁或檔案，
// AI 沒辦法無中生有變出真的網址，所以這裡沒有自動串接後端資料庫，而是把
// 資料結構準備好——demoUrl／downloadUrl 有填真的網址就是真的可點連結，
// 留空字串就誠實顯示「尚未部署」的鎖定按鈕，不會再出現看起來能點、
// 點下去卻沒反應的假連結（V23 以前 href="#" + onclick="return false;"
// 的做法）。詳見 delivery-data.js 開頭的說明。
//
// V31：交付中心串接 Cloudflare R2 後，畫面上會同時出現兩種卡片——董事長
// 透過上傳表單真的送進 R2 的「真實交付項目」，跟 delivery-data.js 裡固定的
// 「示範內容」。跟 V23 部門看板的「示範內容」小標籤是同一個精神：真實項目
// 不會有這個標籤，示範內容的卡片右下角會誠實標出來，不讓董事長誤以為那些
// 也是真的已經完成的案子。
function renderDelivery(items, orgRegistry) {
  const container = document.getElementById('deliveryGrid');
  if (!container) return;
  container.innerHTML = items.map(d => {
    const contributorDepts = (d.contributors || [])
      .map(id => orgRegistry.find(r => r.id === id))
      .filter(Boolean);
    const thumbClass = contributorDepts[0] ? contributorDepts[0].avaClass : 'ava-gm';
    const avatarsHtml = contributorDepts.slice(0, 2).map(dept =>
      `<span class="ava ${dept.avaClass}" aria-hidden="true"><span class="ava-glyph">${dept.glyph}</span></span>`
    ).join('');
    const demoBtn = d.demoUrl
      ? `<a class="btn-preview" href="${d.demoUrl}" target="_blank" rel="noopener noreferrer">看 Demo</a>`
      : `<button type="button" class="btn-preview is-disabled" disabled title="這個項目還沒有可預覽的 Demo 網址，等實際完成後可以在下方表單上傳，或手動把網址填進 delivery-data.js">看 Demo</button>`;
    const downloadBtn = d.downloadUrl
      ? `<a class="btn-download" href="${d.downloadUrl}" download target="_blank" rel="noopener noreferrer">下載檔案包</a>`
      : `<button type="button" class="btn-download is-disabled" disabled title="這個項目還沒有可下載的檔案，等實際完成後可以在下方表單上傳，或手動把連結填進 delivery-data.js">下載檔案包</button>`;
    const demoTag = d.isDemoItem ? '<i class="bc-demo-tag delivery-demo-tag">示範內容</i>' : '';
    return `
        <div class="delivery-card">
          <div class="delivery-thumb ${thumbClass}">${avatarsHtml}</div>
          <div class="delivery-body">
            <p class="delivery-name">${d.title}</p>
            <p class="delivery-desc">${d.desc}</p>
            <div class="delivery-meta-row">
              <span class="delivery-badge ${d.badge}">${d.badgeLabel}</span>
              <span class="delivery-version">${d.version || ''}</span>
              <span class="delivery-time">${d.time || ''}${demoTag}</span>
            </div>
            <div class="delivery-actions">${demoBtn}${downloadBtn}</div>
          </div>
        </div>`;
  }).join('\n');
}

// 先 render 三處畫面，後面的互動邏輯（手風琴、燈號跳轉…）才有元素可以綁定
// V23：org-data.js 裡的 board 內容一律先當成「示範內容」標記起來，
// 頁面載入後 loadBoardState() 會用真正的後端資料覆蓋掉有真實紀錄的部門。
// V31：delivery-data.js 裡的固定內容同樣先標記成「示範內容」，
// 頁面載入後 loadDeliveryState() 會把 Cloudflare R2 裡真實上傳過的項目
// 一併插進來顯示，兩種卡片會用小標籤明顯區分開來。
ORG_REGISTRY.forEach(r => { r.board.isDemo = true; });
DELIVERY_REGISTRY.forEach(d => { d.isDemoItem = true; });
renderLights(ORG_REGISTRY);
renderBoard(ORG_REGISTRY);
renderOrg(ORG_REGISTRY);
renderDelivery(DELIVERY_REGISTRY, ORG_REGISTRY);

// 十大部門整體收合／展開——平常收起來，董事長要用才展開
const orgGrid = document.getElementById('orgGrid');
const orgToggle = document.getElementById('orgToggle');
const orgToggleText = document.getElementById('orgToggleText');
orgToggle.addEventListener('click', () => {
  const willExpand = orgGrid.hidden;
  orgGrid.hidden = !willExpand;
  orgToggle.setAttribute('aria-expanded', String(willExpand));
  orgToggleText.textContent = willExpand ? '收合十大部門編制' : '展開十大部門編制';
  if (willExpand) {
    orgGrid.classList.add('in-view');
    orgToggle.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

// accordion helper: only one open at a time within a given node list
function accordion(nodeList) {
  nodeList.forEach(d => {
    d.addEventListener('toggle', () => {
      if (d.open) nodeList.forEach(o => { if (o !== d) o.open = false; });
    });
  });
}
function bindDeptAccordion() {
  accordion(document.querySelectorAll('details.dept'));
}
bindDeptAccordion();
function bindBoardAccordion() {
  accordion(document.querySelectorAll('details.board-card[data-group="board"]'));
}
bindBoardAccordion();

// status chips: jump straight to the matching department card, open it, and flash-highlight it
document.querySelectorAll('[data-dept-target]').forEach(a => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('data-dept-target');
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    document.querySelectorAll('details.board-card[data-group="board"]').forEach(o => { if (o !== target) o.open = false; });
    target.open = true;
    target.scrollIntoView({behavior:'smooth', block:'center'});
    target.classList.add('bc-flash');
    setTimeout(() => target.classList.remove('bc-flash'), 1600);
  });
});

// ---------------- V13：接上 Gemini API（透過您自己部署的 Cloudflare Worker）----------------
// 這裡的邏輯是：如果 config.js 裡的 APP_CONFIG.GM_API_ENDPOINT 有填 Worker 網址，
// 就真的呼叫 Gemini；沒填的話，自動退回原本前端展示用的固定回覆，網站永遠不會壞掉。
// 對話記憶只存在瀏覽器分頁的這次工作階段（chatHistory 陣列），重新整理頁面會清空——
// 要讓總經理記得「昨天講過的事」，需要後端資料庫，這是下一步的待辦事項。
let chatHistory = [];

// V20：待審批的核准／退回／加問動作跟總經理對話共用同一支 Worker，只是換一個路徑
// （/approval-action、/approval-history）。這個小工具統一算出「Worker 網址去掉結尾斜線」，
// 給對話與待審批兩處共用，避免各自算一次時漏掉或多算斜線。
function apiBase() {
  const raw = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.GM_API_ENDPOINT) ? APP_CONFIG.GM_API_ENDPOINT.trim() : '';
  return raw.replace(/\/+$/, '');
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// ---------------- V18：圖片／影片／一般檔案都實際送進 Gemini 解析 ----------------
// V13 只有圖片會轉成 base64 送出，影片與一般檔案這一版之前只是前端預覽、不會被
// AI 讀到。這一版把三種附件都轉成 base64 送給 Worker，由 Worker 判斷 Gemini
// 支不支援這個檔案格式（圖片／影片／音訊／PDF／純文字與程式碼都支援，Gemini 會
// 真的讀取內容）；不支援的二進位格式（例如 zip、docx、xlsx）Worker 不會硬塞給
// Gemini（塞了也讀不懂、容易產生幻覺內容），而是讓總經理老實回覆「有這個檔案，
// 但目前看不懂內容」，不會假裝已經讀過。
//
// 瀏覽器原生的 file.type 常常抓不到（尤其 .py／.md／.yml 這類程式碼與文字檔，
// 很多瀏覽器完全不會給 type），先用副檔名對照表補齊，Worker 那邊才有正確的
// mimeType 可以判斷要不要送進 Gemini。
const EXT_MIME_MAP = {
  // 圖片
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
  webp: 'image/webp', heic: 'image/heic', heif: 'image/heif',
  // 影片
  mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm', avi: 'video/x-msvideo',
  wmv: 'video/x-ms-wmv', flv: 'video/x-flv', mpeg: 'video/mpeg', mpg: 'video/mpeg', '3gp': 'video/3gpp',
  // 音訊
  mp3: 'audio/mpeg', wav: 'audio/wav', aac: 'audio/aac', ogg: 'audio/ogg', flac: 'audio/flac',
  m4a: 'audio/mp4', aiff: 'audio/aiff',
  // 文件／純文字／程式碼（Gemini 可直接讀懂內容的格式）
  pdf: 'application/pdf', txt: 'text/plain', md: 'text/markdown', csv: 'text/csv',
  json: 'application/json', xml: 'text/xml', html: 'text/html', htm: 'text/html', css: 'text/css',
  js: 'text/javascript', mjs: 'text/javascript', ts: 'text/plain', jsx: 'text/plain', tsx: 'text/plain',
  py: 'text/x-python', java: 'text/x-java-source', c: 'text/plain', cpp: 'text/plain', h: 'text/plain',
  go: 'text/plain', rs: 'text/plain', rb: 'text/plain', php: 'text/plain', sh: 'text/plain',
  yml: 'text/plain', yaml: 'text/plain', sql: 'text/plain', log: 'text/plain', rtf: 'application/rtf',
};
function resolveMimeType(file) {
  if (file.type) return file.type;
  const ext = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';
  return EXT_MIME_MAP[ext] || 'application/octet-stream';
}

// 單一檔案與單次送出的附件總大小上限（以原始檔案大小計算）。Gemini 的 inline
// data 整體請求大約 20MB 上限，base64 編碼後體積會膨脹約 1.37 倍，這裡抓得比較
// 保守。超過上限的附件仍會留在對話畫面上給您看，只是不會送進 AI 解析，會在總
// 經理回覆下方誠實跟您說一聲，不會悄悄漏掉。
const MAX_ATTACH_BYTES = 10 * 1024 * 1024;       // 單一檔案 10MB
const MAX_ATTACH_TOTAL_BYTES = 14 * 1024 * 1024; // 單次送出全部附件合計 14MB

async function getGmReply(text, mediaType, files) {
  const endpoint = apiBase();
  const fallbackPool = mediaType ? (acksMedia[mediaType] || acks) : acks;

  if (!endpoint) {
    // 還沒設定 Worker 網址：沿用展示用的固定回覆，網站仍然完整可用（示範回覆不附風險標示與子任務）
    return { text: fallbackPool[Math.floor(Math.random() * fallbackPool.length)], risk: null, subtask: null, task: null, skipped: [] };
  }

  try {
    const attachments = [];
    const skipped = [];
    let totalBytes = 0;
    for (const file of files) {
      if (file.size > MAX_ATTACH_BYTES || totalBytes + file.size > MAX_ATTACH_TOTAL_BYTES) {
        skipped.push(file.name);
        continue;
      }
      totalBytes += file.size;
      attachments.push({
        mimeType: resolveMimeType(file),
        name: file.name,
        data: await fileToBase64(file),
      });
    }
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history: chatHistory, attachments }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return {
      text: data.reply || '（總經理這次沒有回覆內容，麻煩再問一次）',
      risk: (data.risk && data.risk.level && data.risk.reason) ? data.risk : null,
      subtask: (data.subtask && data.subtask.deptId) ? data.subtask : null,
      task: (data.task && data.task.id) ? data.task : null,
      skipped,
    };
  } catch (err) {
    console.error('呼叫總經理 API 失敗：', err);
    // V33：成本停損擋下的請求要讓董事長看得到真正的原因，不能被下面的示範
    // 回覆蓋過去（那樣會誤導董事長以為總經理正常回覆了）。
    const msg = (err && err.message) || '';
    if (msg.includes('停損')) {
      return { text: `⚠️ ${msg}`, risk: null, subtask: null, task: null, skipped: [] };
    }
    return { text: `（目前連不上總經理的 AI 服務，先用內部判斷回覆您）${fallbackPool[0]}`, risk: null, subtask: null, task: null, skipped: [] };
  }
}

const RISK_LABEL = { low: '低風險', mid: '中風險', high: '高風險' };

// front-end only demo of the command loop — no API wired up yet
const form = document.getElementById('consoleForm');
const input = document.getElementById('consoleInput');
const log = document.getElementById('consoleLog');
const attachBtn = document.getElementById('attachBtn');
const attachMenu = document.getElementById('attachMenu');
const attachImageInput = document.getElementById('attachImageInput');
const attachFileInput = document.getElementById('attachFileInput');
const attachPreview = document.getElementById('attachPreview');
const MAX_FILES = 6;
const acks = [
  '收到，我先請風控官（小控）評估風險，稍後跟您彙報結果。',
  '已交辦相關部門處理，討論完成後我會統整重點給您。',
  '了解，這件事我請部門主管（小督）先確認可行性，今天內回覆您。'
];
const acksMedia = {
  image: [
    '收到截圖，已轉交除錯工程師（小蟲）比對，風控官（小控）評估後同步回報。',
    '這張畫面已交給設計部（小設）與工程部（小工）確認，稍後給您結論。'
  ],
  video: [
    '收到錄影了，已請除錯工程師（小蟲）重現問題，預估今天內回覆進度。',
    '影片已交給部門主管（小督）拆解客戶操作步驟，釐清問題點後彙報。'
  ],
  file: [
    '檔案收到了，已轉交工程部（小工）確認內容與相容性，稍後回報結果。',
    '這份檔案我請除錯工程師（小蟲）先跑一次測試，有結果馬上跟您說。'
  ],
  mixed: [
    '幾份附件都收到了，已請對應部門分頭確認，整理好會一次跟您彙報。',
    '收到了，這幾份我請小工跟小蟲先分類看過，稍後統一回覆您。'
  ]
};
let pendingFiles = [];

function fmtSize(bytes){
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
  return (bytes/1024/1024).toFixed(1) + ' MB';
}
function fileIconSvg(){
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>';
}
function kindOf(file){
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  return 'file';
}

// ---- 附加選單開關（圖片・影片 / 檔案，不含拍照）----
function closeAttachMenu(){
  attachMenu.hidden = true;
  attachBtn.classList.remove('is-open');
  attachBtn.setAttribute('aria-expanded', 'false');
}
attachBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = !attachMenu.hidden;
  if (isOpen) { closeAttachMenu(); return; }
  attachMenu.hidden = false;
  attachBtn.classList.add('is-open');
  attachBtn.setAttribute('aria-expanded', 'true');
});
document.addEventListener('click', (e) => {
  if (!attachMenu.hidden && !attachMenu.contains(e.target) && e.target !== attachBtn) closeAttachMenu();
});
attachMenu.querySelectorAll('button[data-pick]').forEach(btn => {
  btn.addEventListener('click', () => {
    closeAttachMenu();
    if (btn.dataset.pick === 'image') attachImageInput.click();
    else attachFileInput.click();
  });
});

// ---- 選檔後加入待送出清單（可多檔累加）----
function renderAttachPreview(){
  if (pendingFiles.length === 0) {
    attachPreview.hidden = true;
    attachPreview.innerHTML = '';
    return;
  }
  attachPreview.hidden = false;
  attachPreview.innerHTML = pendingFiles.map((file, i) => {
    const kind = kindOf(file);
    const url = URL.createObjectURL(file);
    let inner;
    if (kind === 'video') inner = `<video src="${url}" muted></video><span>影片</span>`;
    else if (kind === 'image') inner = `<img src="${url}" alt="附件預覽"><span>圖片</span>`;
    else inner = `<span class="file-chip-icon">${fileIconSvg()}</span><span>${file.name.length>12 ? file.name.slice(0,11)+'…' : file.name}</span>`;
    return `<div class="chip">${inner}<button type="button" data-remove="${i}" aria-label="移除附件">✕</button></div>`;
  }).join('') + (pendingFiles.length > 1 ? `<span class="attach-preview-count">共 ${pendingFiles.length} 份附件，將一起送出</span>` : '');
  attachPreview.querySelectorAll('button[data-remove]').forEach(b => {
    b.addEventListener('click', () => {
      pendingFiles.splice(Number(b.dataset.remove), 1);
      renderAttachPreview();
    });
  });
}

function addFiles(fileList){
  const room = MAX_FILES - pendingFiles.length;
  if (room <= 0) return;
  pendingFiles = pendingFiles.concat(Array.from(fileList).slice(0, room));
  renderAttachPreview();
}
attachImageInput.addEventListener('change', () => { addFiles(attachImageInput.files); attachImageInput.value = ''; });
attachFileInput.addEventListener('change', () => { addFiles(attachFileInput.files); attachFileInput.value = ''; });

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text && pendingFiles.length === 0) return;

  const kinds = new Set();
  const mediaBlocks = pendingFiles.map(file => {
    const kind = kindOf(file);
    kinds.add(kind);
    const url = URL.createObjectURL(file);
    if (kind === 'video') return `<video class="msg-media" src="${url}" controls></video>`;
    if (kind === 'image') return `<img class="msg-media" src="${url}" alt="董事長附加圖片">`;
    return `
      <div class="file-chip">
        <span class="file-chip-icon">${fileIconSvg()}</span>
        <span class="file-chip-info">
          <span class="file-chip-name">${file.name.replace(/</g,'&lt;')}</span>
          <span class="file-chip-size">${fmtSize(file.size)}</span>
        </span>
      </div>`;
  });
  const mediaType = kinds.size === 0 ? null : (kinds.size > 1 ? 'mixed' : Array.from(kinds)[0]);
  const pendingFilesSnapshot = pendingFiles.slice();

  log.insertAdjacentHTML('beforeend', `
    <div class="msg msg-user">
      <span class="ava ava-chairman ava-sm" aria-hidden="true"><span class="ava-glyph">劉</span></span>
      <div class="msg-body">
        <span class="msg-role">董事長</span>
        <div class="msg-media-wrap">
          ${text ? `<p>${text.replace(/</g,'&lt;')}</p>` : ''}
          ${mediaBlocks.join('')}
        </div>
      </div>
    </div>`);

  input.value = '';
  pendingFiles = [];
  renderAttachPreview();
  log.scrollTop = log.scrollHeight;

  // typing indicator — 小總正在輸入，讓對話更有「真人」感（真的接上 API 後，
  // 這個動畫會一直顯示到 Gemini 真正回覆為止，時間長短取決於網路與模型速度）
  log.insertAdjacentHTML('beforeend', `
    <div class="msg msg-gm" id="typingRow">
      <span class="ava ava-gm ava-sm is-active" aria-hidden="true"><span class="ava-glyph">總</span></span>
      <div class="msg-body">
        <span class="msg-role">總經理 · 小總</span>
        <div class="typing-bubble"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>
      </div>
    </div>`);
  log.scrollTop = log.scrollHeight;

  getGmReply(text, mediaType, pendingFilesSnapshot).then(result => {
    const typingRow = document.getElementById('typingRow');
    if (typingRow) typingRow.remove();
    const riskBadge = result.risk
      ? `<span class="risk risk-${result.risk.level}" title="${result.risk.reason.replace(/"/g,'&quot;')}">${RISK_LABEL[result.risk.level] || '風險'}</span> `
      : '';
    const skippedNote = (result.skipped && result.skipped.length)
      ? `<p class="gm-attach-note">附註：其中 ${result.skipped.length} 份附件超過單檔 10MB 或總量 14MB 上限，這次沒有送進 AI 解析，僅保留在對話畫面中：${result.skipped.map(n => n.replace(/</g,'&lt;')).join('、')}</p>`
      : '';
    log.insertAdjacentHTML('beforeend', `
      <div class="msg msg-gm">
        <span class="ava ava-gm ava-sm" aria-hidden="true"><span class="ava-glyph">總</span></span>
        <div class="msg-body">
          <span class="msg-role">總經理 · 小總</span>
          <p>${riskBadge}<span class="gm-reply-text"></span></p>
          ${result.risk ? `<p class="gm-risk-reason">風控官（小控）：${result.risk.reason.replace(/</g,'&lt;')}</p>` : ''}
          ${skippedNote}
        </div>
      </div>`);
    log.lastElementChild.querySelector('.gm-reply-text').textContent = result.text;

    // V22：GM 委派子任務給某個部門角色時，額外插入一張「部門執行結果」卡片，
    // 讓董事長看得到「誰做了什麼、結果是什麼」，不只是總經理一句話帶過。
    if (result.subtask) {
      log.insertAdjacentHTML('beforeend', buildSubtaskCardHtml(result.subtask));
      // V23：Worker 那邊已經把這筆任務寫進部門看板的後端資料了，這裡重新讀一次
      // /board-state，讓「部門即時看板」馬上顯示剛剛發生的真實任務，不用等重新整理頁面
      loadBoardState();
    }
    // V32：GM 判斷這件事需要建立正式任務時（跟上面的子任務互斥，後端只會回傳其中一種），
    // 插入一張輕量的「已建立正式任務」提示卡片，完整的步驟清單與進度顯示在下方
    // 「任務中心」，這裡呼叫 loadTaskState() 讓那個區塊馬上顯示這筆新任務，不用等
    // 重新整理頁面。
    if (result.task) {
      log.insertAdjacentHTML('beforeend', buildTaskCreatedNoticeHtml(result.task));
      loadTaskState();
    }

    log.scrollTop = log.scrollHeight;
    chatHistory.push({ role: 'user', text: text || '（附加了圖片／影片／檔案，無文字）' });
    chatHistory.push({ role: 'model', text: result.text });
  });
});

// ---------------- 招聘提案核准後，即時把新角色加入組織架構 ----------------
// 示範「總經理提案 → 董事長核准 → 系統自動生效」這條路徑在前端怎麼運作：
// 這裡只更新瀏覽器記憶體中的 ORG_REGISTRY 並重新渲染畫面，重新整理頁面
// 就會還原成 org-data.js 原本的內容——要讓新角色「永久」生效，仍需要
// 後端把這筆資料實際寫回 org-data.js（或資料庫），這部分還沒有後端可以做，
// 詳見 README 待辦清單。
function hireIntoOrg(deptId, role) {
  const dept = ORG_REGISTRY.find(r => r.id === deptId);
  if (!dept) return;
  dept.roles.push(role);
  renderOrg(ORG_REGISTRY);
  bindDeptAccordion();

  if (orgGrid.hidden) {
    orgGrid.hidden = false;
    orgToggle.setAttribute('aria-expanded', 'true');
    orgToggleText.textContent = '收合十大部門編制';
    orgGrid.classList.add('in-view');
  }

  const target = document.getElementById('org-' + deptId);
  if (!target) return;
  document.querySelectorAll('details.dept').forEach(o => { if (o !== target) o.open = false; });
  target.open = true;
  setTimeout(() => {
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.classList.add('bc-flash');
    setTimeout(() => target.classList.remove('bc-flash'), 1600);
  }, 350);
}


const pendingCountEl = document.getElementById('pendingCount');
const pendingCountNavEl = document.getElementById('pendingCountNav');
const approvalEmpty = document.getElementById('approvalEmpty');
let pendingCount = document.querySelectorAll('.approval-card').length;

function refreshPendingCount(){
  if (pendingCountEl) pendingCountEl.textContent = pendingCount;
  if (pendingCountNavEl) pendingCountNavEl.textContent = pendingCount;
  if (pendingCount === 0 && approvalEmpty) approvalEmpty.classList.add('show');
}
refreshPendingCount(); // 頁面載入時就同步一次，數字永遠等於實際卡片數，不用手動維護

// ---------------- V20：待審批核准／退回／加問動作串接後端（Cloudflare KV）----------------
// 跟總經理對話共用同一支 Worker，多開兩個路徑：
//   POST {WORKER}/approval-action  → 寫入一筆批示紀錄（核准／退回／加問）
//   GET  {WORKER}/approval-history → 讀出所有歷史批示紀錄，畫面重新整理後仍看得到
// 如果 config.js 沒填 Worker 網址，或這次呼叫失敗（例如 Worker 還沒綁 KV），
// 畫面上的核准／退回互動仍然完整可用，只是會誠實註明「這筆決定沒有成功存進後端」，
// 不會讓您誤以為已經永久保存。
const ACTION_LABEL = { approve: '✓ 核准', reject: '✕ 退回', ask: '… 加問' };

// V21：歷史批示紀錄平時只顯示最近幾筆，避免清單越拉越長把公文夾撐得很高；
// 累積比較多筆之後，點「展開全部」才會看到完整清單（後端最多回傳最新 100 筆，
// 展開後的清單本身也有捲動高度上限，不會無止盡撐開整個頁面，見 styles.css
// 的 .approval-history-list.is-expanded）。
const APPROVAL_HISTORY_COLLAPSE_COUNT = 8;
let approvalHistoryExpanded = false;
let approvalHistoryRecordsCache = [];

async function submitApprovalDecision(cardId, caseTitle, action, resultNote) {
  const base = apiBase();
  if (!base) {
    return { ok: false, reason: 'no-endpoint' };
  }
  try {
    const res = await fetch(`${base}/approval-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: cardId, caseTitle, action, note: resultNote || '' }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return { ok: true, record: data.record };
  } catch (err) {
    console.error('待審批核准/退回動作寫入後端失敗：', err);
    return { ok: false, reason: 'request-failed', detail: String(err) };
  }
}

function renderApprovalHistory(records) {
  approvalHistoryRecordsCache = records;
  const list = document.getElementById('approvalHistoryList');
  const status = document.getElementById('approvalHistoryStatus');
  const toggleBtn = document.getElementById('approvalHistoryToggle');
  if (!list || !status) return;
  if (!records.length) {
    list.innerHTML = '';
    list.classList.remove('is-expanded');
    status.textContent = '目前還沒有歷史批示紀錄，您核准／退回過的事項會顯示在這裡。';
    status.classList.remove('is-error');
    if (toggleBtn) toggleBtn.hidden = true;
    return;
  }
  const visible = approvalHistoryExpanded ? records : records.slice(0, APPROVAL_HISTORY_COLLAPSE_COUNT);
  list.innerHTML = visible.map(r => {
    const label = ACTION_LABEL[r.action] || r.action;
    const cls = r.action === 'approve' ? 'act-approve' : (r.action === 'reject' ? 'act-reject' : 'act-ask');
    const when = r.decidedAt ? new Date(r.decidedAt).toLocaleString('zh-TW', { hour12: false }) : '';
    return `
      <div class="approval-history-item ${cls}">
        <span class="hist-badge">${label}</span>
        <div class="hist-body">
          <p class="hist-case">${(r.caseTitle || '（未命名事項）').replace(/</g, '&lt;')}</p>
          <p class="hist-meta">${when}${r.note ? ' · ' + r.note.replace(/</g, '&lt;') : ''}</p>
        </div>
      </div>`;
  }).join('');
  list.classList.toggle('is-expanded', approvalHistoryExpanded);
  const cappedNote = records.length >= 100 ? '（僅顯示最新 100 筆，更早的紀錄仍完整保存在 Cloudflare KV，只是這裡不列出）' : '';
  status.textContent = `共 ${records.length} 筆紀錄${cappedNote}（後端保存於 Cloudflare KV）`;
  status.classList.remove('is-error');
  if (toggleBtn) {
    if (records.length > APPROVAL_HISTORY_COLLAPSE_COUNT) {
      toggleBtn.hidden = false;
      toggleBtn.textContent = approvalHistoryExpanded ? '只看最近幾筆 ▲' : `展開全部 ${records.length} 筆 ▼`;
    } else {
      toggleBtn.hidden = true;
    }
  }
}

document.getElementById('approvalHistoryToggle')?.addEventListener('click', () => {
  approvalHistoryExpanded = !approvalHistoryExpanded;
  renderApprovalHistory(approvalHistoryRecordsCache);
});

// V21：修正「核准／退回後重新整理頁面，卡片又變回待核准」的問題。
// 原因：待審批卡片本身是 index.html 裡固定的示範內容，每次重新整理頁面都會
// 回到最初「待核准」的樣子；V20 只把決定寫進了 KV、也把歷史紀錄讀了回來，
// 但沒有拿讀回來的歷史紀錄去比對、更新卡片本身的狀態，所以卡片畫面沒有跟著
// 「復原」，數字（待審批 3）也一直沒扣掉已經處理過的。這裡在讀到歷史紀錄後，
// 用卡片 id 對照，把已經有決定紀錄的卡片直接標記成已處理（鎖住按鈕、顯示
// 當初的決定內容），行為等同您剛剛才按過一次。
// 老實說清楚這裡的範圍：卡片內容本身仍是固定示範資料（跟部門看板、交付中心
// 一樣還沒接上真實任務資料庫），這裡修的只是「已經有決定紀錄的卡片，重新整理
// 後畫面要跟後端資料一致」，不是把整個待審批清單改成動態產生。
function applyHistoryToCards(records) {
  const latestByCard = {};
  for (const r of records) {
    if (r && r.id && !(r.id in latestByCard)) latestByCard[r.id] = r; // records 已由新到舊排序，第一筆就是最新的
  }
  Object.values(latestByCard).forEach(r => {
    const card = document.getElementById(r.id);
    if (!card || !card.classList.contains('approval-card') || card.classList.contains('is-resolved')) return;
    card.classList.add('is-resolved');
    card.querySelectorAll('.approval-actions button').forEach(b => b.disabled = true);
    const note = card.querySelector('.approval-resolved-note');
    if (note) {
      const okCls = r.action === 'approve' ? 'ok' : (r.action === 'reject' ? 'no' : '');
      note.className = 'approval-resolved-note show' + (okCls ? ' ' + okCls : '');
      if (!okCls) note.style.color = 'var(--ink-faint)';
      const prefix = r.action === 'approve' ? '✓ ' : r.action === 'reject' ? '✕ ' : '… ';
      const when = r.decidedAt ? new Date(r.decidedAt).toLocaleString('zh-TW', { hour12: false }) : '';
      note.textContent = `${prefix}${r.note || ACTION_LABEL[r.action] || r.action}（已存入後端歷史紀錄・${when}）`;
    }
  });
  // 卡片狀態可能被上面改動，重新算一次「待您核准」的實際數字，不能再假設每張卡片都還沒處理
  pendingCount = document.querySelectorAll('.approval-card:not(.is-resolved)').length;
  refreshPendingCount();
}

async function loadApprovalHistory() {
  const status = document.getElementById('approvalHistoryStatus');
  const base = apiBase();
  if (!base) {
    if (status) {
      status.textContent = '尚未設定 Worker 網址（config.js 的 GM_API_ENDPOINT 是空的），歷史批示紀錄無法讀取，目前的核准／退回只會顯示在畫面上，不會保存。';
      status.classList.add('is-error');
    }
    return;
  }
  try {
    const res = await fetch(`${base}/approval-history`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    if (data.error && (!data.records || !data.records.length)) {
      // Worker 有回應，但 APPROVALS_KV 還沒綁定
      if (status) {
        status.textContent = `${data.error}（見 README「V20 設定方法」綁定 KV 的步驟）`;
        status.classList.add('is-error');
      }
      return;
    }
    const records = Array.isArray(data.records) ? data.records : [];
    renderApprovalHistory(records);
    applyHistoryToCards(records);
  } catch (err) {
    console.error('讀取歷史批示紀錄失敗：', err);
    if (status) {
      status.textContent = '目前連不上歷史批示紀錄服務，稍後重新整理頁面再試一次。';
      status.classList.add('is-error');
    }
  }
}
loadApprovalHistory();

// ---------------- V23：部門即時看板改為串接真實任務資料庫 ----------------
// org-data.js 裡的 board 內容原本是固定寫死的示範資料（task／log／progress
// 永遠一樣）。這裡改成頁面載入時去讀 Worker 的 /board-state：如果某個部門已經
// 有真實任務紀錄（總經理委派子任務、角色真的產出過執行結果，見
// cloudflare-worker.js 的 persistBoardTask），就用真實資料覆蓋掉那個部門原本
// 顯示的示範內容；還沒有真實紀錄的部門，繼續顯示 org-data.js 的示範內容，並在
// 卡片右下角標一個「示範內容」小標籤，不讓董事長誤以為那些都是真的發生過的事。
//
// 老實說清楚這裡的範圍：目前唯一會寫入真實任務資料的來源，是總經理在對話裡
// 委派子任務、且子任務真的執行成功這條路徑（V22 功能）；看板本身沒有另外一個
// 「手動新增任務」的介面，也還沒有「進行中、尚未完成」這種中間狀態——子任務是
// 一次 Gemini 呼叫就同步做完的，所以任務一出現在看板上就已經是「完成」的狀態。
function formatBoardTime(iso) {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString('zh-TW', { hour12: false }); } catch { return ''; }
}
function escapeBoardText(s) {
  return String(s == null ? '' : s).replace(/</g, '&lt;');
}

// V28：把「部門執行結果」卡片的 HTML 組裝抽成共用函式——原本即時顯示（送出指令
// 當下）跟歷史還原（重新整理頁面後）各寫一份幾乎一樣的樣板，兩份內容遲早會兜不
// 起來；現在兩處都呼叫這一個函式，只維護一份標記邏輯。
function buildSubtaskCardHtml(st) {
  const dept = ORG_REGISTRY.find(r => r.id === st.deptId);
  const avaClass = dept ? dept.avaClass : 'ava-gm';
  const glyph = dept ? dept.glyph : '？';
  return `
      <div class="subtask-card">
        <div class="subtask-top">
          <span class="ava ${avaClass} ava-sm" aria-hidden="true"><span class="ava-glyph">${glyph}</span></span>
          <div class="subtask-who">
            <p class="subtask-role">${escapeBoardText(st.roleName)}<span class="subtask-nick">${escapeBoardText(st.roleNick)}</span></p>
            <p class="subtask-dept">${escapeBoardText(st.deptName)} · 總經理委派子任務</p>
          </div>
        </div>
        <p class="subtask-task">任務：${escapeBoardText(st.task)}</p>
        <p class="subtask-result">${escapeBoardText(st.result)}</p>
      </div>`;
}

// V32：董事長交辦的事升級成正式任務時，對話框裡只顯示一張輕量的提示卡片
// （不重複列出完整步驟——那些顯示在下方「任務中心」），提醒董事長這件事已經
// 變成一個會被永久追蹤、可能需要好幾天跟好幾個部門一起完成的正式專案。
function buildTaskCreatedNoticeHtml(task) {
  return `
      <div class="task-created-notice">
        <span class="task-created-icon" aria-hidden="true">🗒️</span>
        <div>
          <p class="task-created-title">已建立正式任務：${escapeBoardText(task.title)}</p>
          <p class="task-created-sub">預估需要跨部門／跨天完成，完整進度與步驟請見下方「任務中心」，第一步已經自動開始處理。<a href="#tasks">前往查看 →</a></p>
        </div>
      </div>`;
}
async function loadBoardState() {
  const status = document.getElementById('boardSyncStatus');
  const base = apiBase();
  if (!base) {
    if (status) {
      status.textContent = '尚未設定 Worker 網址，以下都是 org-data.js 裡的示範內容，還沒有真實任務資料。';
      status.classList.add('is-error');
    }
    return;
  }
  try {
    const res = await fetch(`${base}/board-state`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    if (data.error) {
      if (status) {
        status.textContent = data.error;
        status.classList.add('is-error');
      }
      return;
    }
    const tasks = data.tasks || {};
    const logs = data.logs || {};
    let realCount = 0;
    ORG_REGISTRY.forEach(r => {
      const t = tasks[r.id];
      if (!t) return; // 這個部門還沒有真實任務紀錄，維持 org-data.js 的示範內容
      realCount++;
      r.board.isDemo = false;
      r.board.task = escapeBoardText(t.task);
      r.board.progress = Number.isFinite(t.progress) ? Math.max(0, Math.min(100, t.progress)) : r.board.progress;
      r.board.statusLabel = t.statusLabel || r.board.statusLabel;
      r.board.statusDot = t.statusDot || r.board.statusDot;
      r.board.avaState = t.statusDot === 's-working' ? 'is-active' : (t.statusDot === 's-meeting' ? 'is-meeting' : '');
      r.board.metaLeft = `進度 ${r.board.progress}%`;
      r.board.metaRight = t.updatedAt ? `${formatBoardTime(t.updatedAt)} 更新` : '剛剛更新';
      const realLogs = (logs[r.id] || []).map(item => ({
        who: escapeBoardText(item.who),
        txt: escapeBoardText(item.txt),
        time: formatBoardTime(item.time),
      }));
      if (realLogs.length) r.board.log = realLogs;
    });
    renderBoard(ORG_REGISTRY);
    bindBoardAccordion();
    if (status) {
      status.textContent = realCount > 0
        ? `已連上部門任務資料庫（Cloudflare KV）：${realCount} 個部門有真實任務紀錄，其餘部門顯示 org-data.js 的示範內容。`
        : '已連上部門任務資料庫，目前還沒有任何部門產生過真實任務紀錄（總經理委派過至少一次子任務後就會出現），以下先顯示示範內容。';
      status.classList.remove('is-error');
    }
  } catch (err) {
    console.error('讀取部門看板資料失敗：', err);
    if (status) {
      status.textContent = '目前連不上部門任務資料庫，看板暫時顯示示範內容，稍後重新整理頁面再試一次。';
      status.classList.add('is-error');
    }
  }
}
loadBoardState();

// ---------------- V31：交付中心串接真實檔案儲存服務（Cloudflare R2） ----------------
// V24 當時把資料結構準備好（DELIVERY_REGISTRY），但老實說清楚「沒有導入額外的
// 第三方儲存／部署服務，日後有真實案子完成時，需要手動把真實網址填進
// delivery-data.js，不是自動產生的」。這一版把這個缺口補上：
// - 頁面載入時呼叫 GET /delivery-list，把 Cloudflare R2 裡真的上傳過的交付項目
//   讀出來，跟 delivery-data.js 的示範內容合併顯示（真實項目排在前面）
// - 下方新增一個上傳表單，董事長真的完成一個案子時，直接在這裡選檔案上傳，
//   不用再手動編輯 delivery-data.js 或跑一趟 Cloudflare 後台
// 跟 V23 部門看板同樣的精神：真實項目跟示範內容會用小標籤明顯區分，不會讓
// 董事長分不清楚哪些是真的已經完成的案子。
function formatDeliveryTime(iso) {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString('zh-TW', { hour12: false }); } catch { return ''; }
}
async function loadDeliveryState() {
  const status = document.getElementById('deliverySyncStatus');
  const base = apiBase();
  const demoItems = DELIVERY_REGISTRY.map(d => ({ ...d, isDemoItem: true }));
  if (!base) {
    if (status) {
      status.textContent = '尚未設定 Worker 網址，以下都是 delivery-data.js 裡的示範內容，還沒有真實交付項目，上傳表單暫時停用。';
      status.classList.add('is-error');
    }
    renderDelivery(demoItems, ORG_REGISTRY);
    setDeliveryUploadEnabled(false, '尚未設定 Worker 網址');
    return;
  }
  try {
    const res = await fetch(`${base}/delivery-list`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    if (data.error) {
      if (status) {
        status.textContent = data.error;
        status.classList.add('is-error');
      }
      renderDelivery(demoItems, ORG_REGISTRY);
      setDeliveryUploadEnabled(false, 'R2／KV 尚未綁定完成');
      return;
    }
    const realItems = (data.items || []).map(it => ({
      id: it.id,
      title: it.title,
      desc: it.desc,
      contributors: it.contributors || [],
      badge: it.badge,
      badgeLabel: it.badgeLabel,
      version: '',
      time: it.uploadedAt ? formatDeliveryTime(it.uploadedAt) : '',
      demoUrl: it.hasDemo ? `${base}/delivery-file?id=${encodeURIComponent(it.id)}&kind=demo` : '',
      downloadUrl: it.hasDownload ? `${base}/delivery-file?id=${encodeURIComponent(it.id)}&kind=download` : '',
      isDemoItem: false,
    }));
    renderDelivery([...realItems, ...demoItems], ORG_REGISTRY);
    if (status) {
      status.textContent = realItems.length > 0
        ? `已連上真實交付檔案儲存（Cloudflare R2）：${realItems.length} 筆真實交付項目，其餘為 delivery-data.js 的示範內容。`
        : '已連上真實交付檔案儲存（Cloudflare R2），目前還沒有任何真實上傳過的項目，以下先顯示示範內容，可以用下方表單上傳第一筆。';
      status.classList.remove('is-error');
    }
    setDeliveryUploadEnabled(true);
  } catch (err) {
    console.error('讀取交付項目清單失敗：', err);
    if (status) {
      status.textContent = '目前連不上交付檔案儲存服務，暫時顯示示範內容，稍後重新整理頁面再試一次。';
      status.classList.add('is-error');
    }
    renderDelivery(demoItems, ORG_REGISTRY);
    setDeliveryUploadEnabled(false, '連不上後端服務');
  }
}

function setDeliveryUploadEnabled(enabled, reason) {
  const form = document.getElementById('deliveryUploadForm');
  if (!form) return;
  form.querySelectorAll('input, textarea, button').forEach(el => { el.disabled = !enabled; });
  const hint = document.getElementById('deliveryUploadHint');
  if (hint) {
    hint.textContent = enabled
      ? '選擇檔案後按下方按鈕上傳，完成後會直接出現在上方交付中心清單，不用重新整理頁面。'
      : `目前無法上傳（${reason || '後端尚未就緒'}），請見 README「V31 設定方法」完成 R2 設定。`;
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

const deliveryUploadForm = document.getElementById('deliveryUploadForm');
if (deliveryUploadForm) {
  deliveryUploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const base = apiBase();
    const statusEl = document.getElementById('deliveryUploadStatus');
    const titleEl = document.getElementById('deliveryTitleInput');
    const descEl = document.getElementById('deliveryDescInput');
    const verifiedEl = document.getElementById('deliveryVerifiedInput');
    const demoFileEl = document.getElementById('deliveryDemoFileInput');
    const downloadFileEl = document.getElementById('deliveryDownloadFileInput');
    const contributorEls = deliveryUploadForm.querySelectorAll('input[name="deliveryContributor"]:checked');
    const contributors = Array.from(contributorEls).map(el => el.value);

    if (!titleEl.value.trim()) {
      if (statusEl) { statusEl.textContent = '請填寫交付項目標題。'; statusEl.classList.add('is-error'); }
      return;
    }
    const demoFile = demoFileEl.files[0] || null;
    const downloadFile = downloadFileEl.files[0] || null;
    if (!demoFile && !downloadFile) {
      if (statusEl) { statusEl.textContent = 'Demo 檔案跟下載檔案包，至少要選一個。'; statusEl.classList.add('is-error'); }
      return;
    }

    const submitBtn = deliveryUploadForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    if (statusEl) { statusEl.textContent = '上傳中，檔案較大時可能需要幾秒鐘…'; statusEl.classList.remove('is-error'); }

    try {
      const payload = {
        title: titleEl.value.trim(),
        desc: descEl.value.trim(),
        contributors,
        verified: !!(verifiedEl && verifiedEl.checked),
        demoFile: demoFile ? { name: demoFile.name, mimeType: demoFile.type || 'text/html', data: await fileToBase64(demoFile) } : null,
        downloadFile: downloadFile ? { name: downloadFile.name, mimeType: downloadFile.type || 'application/octet-stream', data: await fileToBase64(downloadFile) } : null,
      };
      const res = await fetch(`${base}/delivery-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      deliveryUploadForm.reset();
      if (statusEl) { statusEl.textContent = '✓ 上傳成功，已經出現在上方交付中心清單裡。'; statusEl.classList.remove('is-error'); }
      await loadDeliveryState();
    } catch (err) {
      console.error('交付項目上傳失敗：', err);
      if (statusEl) { statusEl.textContent = `上傳失敗：${err.message || err}`; statusEl.classList.add('is-error'); }
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}
// 部門複選勾選框從 ORG_REGISTRY 動態產生，部門異動時（新增/調整）不需要另外改這裡
const deliveryContributorList = document.getElementById('deliveryContributorList');
if (deliveryContributorList) {
  deliveryContributorList.innerHTML = ORG_REGISTRY.map(r =>
    `<label class="delivery-contrib-chip"><input type="checkbox" name="deliveryContributor" value="${r.id}"> ${r.nameOrg}${r.nick}</label>`
  ).join('');
}
loadDeliveryState();

// ---------------- V32：AI 任務管理系統（Task Center） ---------------- 
// 董事長交辦「幫我做／建立／規劃／設計／開發」這類、預估需要跨部門或跨天完成
// 的事情時，總經理會建立一個正式 Task（跟 V22 的一次性子任務不同），永久存進
// Cloudflare KV。這裡負責把 Task Center 的畫面渲染出來，並讓董事長可以按
// 「推進下一步」繼續執行、或「取消任務」放棄一個還沒做完的任務。
const TASK_STATUS_META = {
  planning: { dot: 's-meeting', label: '規劃中' },
  in_progress: { dot: 's-working', label: '執行中' },
  done: { dot: 's-idle', label: '已完成' },
  cancelled: { dot: 's-off', label: '已取消' },
};
function formatTaskTime(iso) {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString('zh-TW', { hour12: false }); } catch { return ''; }
}
function buildTaskStepHtml(step) {
  const icon = step.status === 'done' ? '✓' : '';
  return `
      <div class="tc-step tc-step-${step.status}">
        <span class="tc-step-icon" aria-hidden="true">${icon}</span>
        <div class="tc-step-body">
          <p class="tc-step-title">${escapeBoardText(step.deptName)}・${escapeBoardText(step.roleNick)} ${escapeBoardText(step.roleName)}</p>
          <p class="tc-step-desc">${escapeBoardText(step.description)}</p>
          ${step.result ? `<p class="tc-step-result">${escapeBoardText(step.result)}</p>` : ''}
        </div>
      </div>`;
}
function buildTaskCardHtml(task) {
  const meta = TASK_STATUS_META[task.status] || { dot: 's-idle', label: task.status };
  const doneCount = task.steps.filter(s => s.status === 'done').length;
  const total = task.steps.length || 1;
  const pct = Math.round((doneCount / total) * 100);
  const isFinished = task.status === 'done' || task.status === 'cancelled';
  const estimatedText = task.estimatedDays ? `預估 ${task.estimatedDays} 天` : '';
  return `
      <details class="task-card" data-task-id="${task.id}">
        <summary>
          <div class="tc-top">
            <span class="tc-name">${escapeBoardText(task.title)}</span>
            <span class="tc-status"><span class="stat-dot ${meta.dot}"></span>${meta.label}</span>
            <svg class="tc-chevron" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <p class="tc-desc">${escapeBoardText(task.description)}</p>
          <div class="tc-bar"><div class="tc-bar-fill" style="width:${pct}%"></div></div>
          <div class="tc-meta"><span>${doneCount}/${total} 步驟完成</span><span>${estimatedText}${estimatedText ? ' · ' : ''}建立於 ${formatTaskTime(task.createdAt)}</span></div>
        </summary>
        <div class="tc-steps">${task.steps.map(buildTaskStepHtml).join('')}</div>
        <div class="tc-actions">
          <button type="button" class="tc-advance" data-task-advance="${task.id}" ${isFinished ? 'disabled' : ''}>推進下一步</button>
          <button type="button" class="tc-cancel" data-task-cancel="${task.id}" ${isFinished ? 'disabled' : ''}>取消任務</button>
          <span class="tc-action-status" data-task-status-for="${task.id}"></span>
        </div>
      </details>`;
}
function renderTasks(tasks) {
  const grid = document.getElementById('taskGrid');
  const empty = document.getElementById('taskEmpty');
  if (!grid) return;
  if (!tasks.length) {
    grid.innerHTML = '';
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;
  grid.innerHTML = tasks.map(buildTaskCardHtml).join('\n');
}
async function loadTaskState() {
  const status = document.getElementById('taskSyncStatus');
  const base = apiBase();
  if (!base) {
    if (status) {
      status.textContent = '尚未設定 Worker 網址，任務中心暫時無法使用。';
      status.classList.add('is-error');
    }
    renderTasks([]);
    return;
  }
  try {
    const res = await fetch(`${base}/task-list`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    if (data.error && (!data.tasks || !data.tasks.length)) {
      if (status) {
        status.textContent = data.error;
        status.classList.add('is-error');
      }
      renderTasks([]);
      return;
    }
    const tasks = Array.isArray(data.tasks) ? data.tasks : [];
    renderTasks(tasks);
    if (status) {
      status.textContent = tasks.length
        ? `已連上任務資料庫（Cloudflare KV）：共 ${tasks.length} 筆正式任務，跨天、跨部門的進度都會保留。`
        : '已連上任務資料庫（Cloudflare KV），目前還沒有任何正式任務。';
      status.classList.remove('is-error');
    }
  } catch (err) {
    console.error('讀取任務清單失敗：', err);
    if (status) {
      status.textContent = '目前連不上任務資料庫，稍後重新整理頁面再試一次。';
      status.classList.add('is-error');
    }
  }
}

// 事件委派：「推進下一步」「取消任務」按鈕都是動態產生的，用一個綁在容器上的
// listener 處理，不用每次重新渲染後再重新綁定一次。
const taskGridEl = document.getElementById('taskGrid');
if (taskGridEl) {
  taskGridEl.addEventListener('click', async (e) => {
    const advanceBtn = e.target.closest('[data-task-advance]');
    const cancelBtn = e.target.closest('[data-task-cancel]');
    const btn = advanceBtn || cancelBtn;
    if (!btn) return;
    e.preventDefault(); // details/summary 點擊不會誤觸開合（按鈕本身不在 summary 裡，但保險起見擋掉冒泡的預設行為）
    const taskId = advanceBtn ? advanceBtn.dataset.taskAdvance : cancelBtn.dataset.taskCancel;
    const statusEl = taskGridEl.querySelector(`[data-task-status-for="${taskId}"]`);
    const base = apiBase();
    if (!base) return;
    const endpoint = advanceBtn ? 'task-advance' : 'task-cancel';
    const busyText = advanceBtn ? '執行中，可能需要幾秒鐘…' : '取消中…';
    if (statusEl) { statusEl.textContent = busyText; statusEl.classList.remove('is-error'); }
    btn.disabled = true;
    try {
      const res = await fetch(`${base}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      await loadTaskState(); // 直接整個重新讀一次任務清單，確保畫面跟後端完全一致
    } catch (err) {
      console.error(`任務${advanceBtn ? '推進' : '取消'}失敗：`, err);
      if (statusEl) {
        statusEl.textContent = `${advanceBtn ? '推進失敗' : '取消失敗'}：${err.message || err}`;
        statusEl.classList.add('is-error');
      }
      btn.disabled = false;
    }
  });
}
loadTaskState();

// ---------------- V25：讀取真實對話紀錄，取代重新整理後又變回展示訊息的問題 ----------------
// 沒設定 Worker，或 Worker 還沒綁 KV、或這是第一次使用、還沒有任何真實對話——
// 這幾種情況都直接維持 index.html 裡原本寫死的展示對話（晨報卡片＋兩輪示範對話），
// 不強行清空畫面。只有「Worker 真的回傳了至少一則歷史訊息」時，才會清掉展示對話，
// 換成真正發生過的內容——這樣不管有沒有設定後端，董事長看到的畫面都是完整的，
// 不會出現「空白對話框」這種更奇怪的狀態。
//
// V28：「部門執行結果」卡片原本不在還原範圍內——董事長回報「小快的報告卡片，
// 重新整理頁面後就消失了」，查證後確認這是 V25 就存在、沒寫進待辦清單的缺口
// （見 cloudflare-worker.js persistChatTurn 的說明），這一版把它補上。
//
// 範圍老實說清楚：這裡只還原「文字對話」與風險標示、以及委派子任務的執行結果卡片，
// 不會還原之前對話裡附過的圖片／影片縮圖——附件的實際檔案內容從來沒有被送到任何
// 後端保存過，這是仍然存在的已知限制，不是這次沒做好。
function buildGmHistoryMessageHtml(text, risk, subtask, taskRef) {
  const riskBadge = risk
    ? `<span class="risk risk-${risk.level}" title="${String(risk.reason || '').replace(/"/g,'&quot;')}">${RISK_LABEL[risk.level] || '風險'}</span> `
    : '';
  const subtaskHtml = subtask ? buildSubtaskCardHtml(subtask) : '';
  // V32：對話紀錄裡存的只是任務的輕量參照（id／標題），這裡用同一個
  // buildTaskCreatedNoticeHtml() 樣板重建提示卡片，完整步驟內容由任務中心自己
  // 讀 /task-list 顯示，不需要對話紀錄裡也存一份完整資料。
  const taskHtml = taskRef ? buildTaskCreatedNoticeHtml(taskRef) : '';
  return `
      <div class="msg msg-gm">
        <span class="ava ava-gm ava-sm" aria-hidden="true"><span class="ava-glyph">總</span></span>
        <div class="msg-body">
          <span class="msg-role">總經理 · 小總</span>
          <p>${riskBadge}${escapeBoardText(text)}</p>
          ${risk ? `<p class="gm-risk-reason">風控官（小控）：${escapeBoardText(risk.reason)}</p>` : ''}
        </div>
      </div>${subtaskHtml}${taskHtml}`;
}
function buildUserHistoryMessageHtml(text) {
  return `
      <div class="msg msg-user">
        <span class="ava ava-chairman ava-sm" aria-hidden="true"><span class="ava-glyph">劉</span></span>
        <div class="msg-body">
          <span class="msg-role">董事長</span>
          <p>${escapeBoardText(text)}</p>
        </div>
      </div>`;
}
async function loadChatHistory() {
  const base = apiBase();
  if (!base) return; // 沒設定 Worker：維持展示對話
  try {
    const res = await fetch(`${base}/chat-history`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error || !Array.isArray(data.messages) || data.messages.length === 0) return; // 沒有真實紀錄：維持展示對話
    document.querySelectorAll('#consoleLog .msg, #consoleLog .subtask-card, #consoleLog .task-created-notice').forEach(el => el.remove()); // 晨報卡片（.briefing-card）保留，只清掉對話訊息與委派結果／任務提示卡片
    const html = data.messages.map(m => (
      m.role === 'model' ? buildGmHistoryMessageHtml(m.text, m.risk, m.subtask, m.task) : buildUserHistoryMessageHtml(m.text)
    )).join('');
    log.insertAdjacentHTML('beforeend', html);
    log.scrollTop = log.scrollHeight;
    // 同步進記憶體的 chatHistory，總經理接下來的回覆才會記得這些真實對話內容
    chatHistory = data.messages.map(m => ({ role: m.role, text: m.text }));
  } catch (err) {
    console.error('讀取對話紀錄失敗，維持展示對話：', err);
  }
}
loadChatHistory();

document.querySelectorAll('.approval-actions button').forEach(btn => {
  btn.addEventListener('click', async () => {
    const card = document.getElementById(btn.dataset.target);
    if (!card || card.classList.contains('is-resolved')) return;
    const act = btn.dataset.act;
    const note = card.querySelector('.approval-resolved-note');
    const caseTitle = card.querySelector('.approval-case')?.textContent?.trim() || card.id;

    // 先鎖住卡片、按鈕，避免使用者連點造成重複送出
    card.classList.add('is-resolved');
    card.querySelectorAll('.approval-actions button').forEach(b => b.disabled = true);

    let resultText = '';
    if (act === 'approve') {
      resultText = '董事長已核准，總經理將繼續往下執行';
      note.className = 'approval-resolved-note show ok';
      if (btn.dataset.target === 'ap-hire') {
        hireIntoOrg('bc-eng', {
          name: 'DevOps 工程師',
          nick: '· 小維',
          nameEn: 'DevOps Engineer',
          fn: '負責部署流程與系統維運，監控服務穩定性，是董事長核准後新增的試營運角色，一個月後由總經理回報成效。'
        });
        resultText = '董事長已核准，「DevOps 工程師（小維）」已加入工程部組織架構';
      }
    } else if (act === 'reject') {
      resultText = '已退回，總經理會請部門重新提案';
      note.className = 'approval-resolved-note show no';
    } else {
      resultText = '已請總經理補充更多資訊，稍後回到這裡';
      note.className = 'approval-resolved-note show';
      note.style.color = 'var(--ink-faint)';
    }
    note.textContent = (act === 'approve' ? '✓ ' : act === 'reject' ? '✕ ' : '… ') + resultText + '（寫入後端中…）';

    const outcome = await submitApprovalDecision(card.id, caseTitle, act, resultText);
    const prefix = act === 'approve' ? '✓ ' : act === 'reject' ? '✕ ' : '… ';
    if (outcome.ok) {
      note.textContent = prefix + resultText + '（已存入後端歷史紀錄）';
      loadApprovalHistory(); // 重新拉一次，馬上看到剛剛這筆
    } else if (outcome.reason === 'no-endpoint') {
      note.textContent = prefix + resultText + '（尚未設定後端 Worker 網址，這筆決定只顯示在畫面上，不會保存）';
    } else {
      note.textContent = prefix + resultText + '（寫入後端失敗，這筆決定暫時只顯示在畫面上，請稍後重新整理頁面再試一次）';
    }

    pendingCount = Math.max(0, pendingCount - 1);
    refreshPendingCount();
  });
});

// ---------------- V33：成本中心（月度財報員／API 成本會計＋單日／單月自動停損） ----------------
// 讀取 Worker 累加的實際 token 用量與估算費用，畫面上顯示今日／本月兩張卡片，
// 進度條會隨累積金額變色（超過上限變紅），並提供調整停損上限的表單。
function fmtCostUSD(n) {
  return `US$${Number(n || 0).toFixed(4)}`;
}
function fmtCostTokens(n) {
  if (!Number.isFinite(n)) return '0';
  if (n < 1000) return `${n}`;
  if (n < 1000000) return `${(n / 1000).toFixed(1)}K`;
  return `${(n / 1000000).toFixed(2)}M`;
}

async function loadCostState() {
  const status = document.getElementById('costSyncStatus');
  const base = apiBase();
  if (!base) {
    if (status) { status.textContent = '尚未設定 Worker 網址（config.js 的 GM_API_ENDPOINT 是空的），無法讀取真實成本資料。'; status.classList.add('is-error'); }
    return;
  }
  try {
    const res = await fetch(`${base}/cost-state`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

    const todayCard = document.getElementById('costCardToday');
    const monthCard = document.getElementById('costCardMonth');

    if (data.today) {
      document.getElementById('costTodayAmount').textContent = fmtCostUSD(data.today.costUSD);
      document.getElementById('costTodaySub').textContent = `${data.today.callCount || 0} 次呼叫・輸入 ${fmtCostTokens(data.today.inputTokens)} ／輸出 ${fmtCostTokens(data.today.outputTokens)} tokens`;
    }
    if (data.month) {
      document.getElementById('costMonthAmount').textContent = fmtCostUSD(data.month.costUSD);
      document.getElementById('costMonthSub').textContent = `${data.month.callCount || 0} 次呼叫・輸入 ${fmtCostTokens(data.month.inputTokens)} ／輸出 ${fmtCostTokens(data.month.outputTokens)} tokens`;
    }
    if (data.limits) {
      document.getElementById('costTodayLimitLabel').textContent = `上限 US$${data.limits.dailyLimitUSD.toFixed(2)}`;
      document.getElementById('costMonthLimitLabel').textContent = `上限 US$${data.limits.monthlyLimitUSD.toFixed(2)}`;
      const dailyInput = document.getElementById('costDailyInput');
      const monthlyInput = document.getElementById('costMonthlyInput');
      if (dailyInput && !dailyInput.matches(':focus')) dailyInput.value = data.limits.dailyLimitUSD;
      if (monthlyInput && !monthlyInput.matches(':focus')) monthlyInput.value = data.limits.monthlyLimitUSD;

      const todayPct = Math.min(100, (data.today.costUSD / data.limits.dailyLimitUSD) * 100);
      const monthPct = Math.min(100, (data.month.costUSD / data.limits.monthlyLimitUSD) * 100);
      document.getElementById('costTodayBar').style.width = `${todayPct}%`;
      document.getElementById('costMonthBar').style.width = `${monthPct}%`;
    }
    if (todayCard) todayCard.classList.toggle('is-stopped', !!data.dailyStopped);
    if (monthCard) monthCard.classList.toggle('is-stopped', !!data.monthlyStopped);

    if (status) {
      if (data.dailyStopped) {
        status.textContent = '⚠️ 已達單日停損上限，總經理目前暫停呼叫 AI，明天（UTC 零時）會自動恢復。';
        status.classList.add('is-error');
      } else if (data.monthlyStopped) {
        status.textContent = '⚠️ 已達單月停損上限，總經理目前暫停呼叫 AI，下個月會自動恢復。';
        status.classList.add('is-error');
      } else if (data.error) {
        status.textContent = data.error;
        status.classList.add('is-error');
      } else {
        status.textContent = '已連上成本紀錄服務，以下是實際累積的估算費用（依 Gemini 回傳的 token 數換算）。';
        status.classList.remove('is-error');
      }
    }
  } catch (err) {
    console.error('讀取成本中心資料失敗：', err);
    if (status) { status.textContent = '目前讀不到成本資料，稍後重新整理頁面再試一次。'; status.classList.add('is-error'); }
  }
}
loadCostState();

const costLimitForm = document.getElementById('costLimitForm');
if (costLimitForm) {
  costLimitForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const base = apiBase();
    const msg = document.getElementById('costAdminMsg');
    if (!base) { msg.textContent = '尚未設定 Worker 網址，無法儲存。'; msg.className = 'cost-admin-msg is-error'; return; }
    const dailyLimitUSD = parseFloat(document.getElementById('costDailyInput').value);
    const monthlyLimitUSD = parseFloat(document.getElementById('costMonthlyInput').value);
    const btn = costLimitForm.querySelector('button');
    btn.disabled = true;
    msg.textContent = '儲存中…'; msg.className = 'cost-admin-msg';
    try {
      const res = await fetch(`${base}/cost-set-limit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dailyLimitUSD, monthlyLimitUSD }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      msg.textContent = '✓ 停損上限已更新。';
      msg.className = 'cost-admin-msg is-ok';
      loadCostState();
    } catch (err) {
      msg.textContent = `儲存失敗：${err.message}`;
      msg.className = 'cost-admin-msg is-error';
    } finally {
      btn.disabled = false;
    }
  });
}
