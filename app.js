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
            <div class="bc-meta"><span>${b.metaLeft}</span><span>${b.metaRight}</span></div>
            <p class="bc-source ${b.isReal ? 'is-real' : ''}">${b.isReal ? '✓ 真實任務紀錄' : '示範內容'}</p>
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

// 先 render 三處畫面，後面的互動邏輯（手風琴、燈號跳轉…）才有元素可以綁定
renderLights(ORG_REGISTRY);
renderBoard(ORG_REGISTRY);
renderOrg(ORG_REGISTRY);

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
accordion(document.querySelectorAll('details.board-card[data-group="board"]'));

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
    return { text: fallbackPool[Math.floor(Math.random() * fallbackPool.length)], risk: null, subtask: null, skipped: [] };
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
      skipped,
    };
  } catch (err) {
    console.error('呼叫總經理 API 失敗：', err);
    return { text: `（目前連不上總經理的 AI 服務，先用內部判斷回覆您）${fallbackPool[0]}`, risk: null, subtask: null, skipped: [] };
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
      const st = result.subtask;
      const dept = ORG_REGISTRY.find(r => r.id === st.deptId);
      const avaClass = dept ? dept.avaClass : 'ava-gm';
      const glyph = dept ? dept.glyph : '？';
      log.insertAdjacentHTML('beforeend', `
        <div class="subtask-card">
          <div class="subtask-top">
            <span class="ava ${avaClass} ava-sm" aria-hidden="true"><span class="ava-glyph">${glyph}</span></span>
            <div class="subtask-who">
              <p class="subtask-role">${(st.roleName || '').replace(/</g,'&lt;')}<span class="subtask-nick">${(st.roleNick || '').replace(/</g,'&lt;')}</span></p>
              <p class="subtask-dept">${(st.deptName || '').replace(/</g,'&lt;')} · 總經理委派子任務</p>
            </div>
          </div>
          <p class="subtask-task">任務：${(st.task || '').replace(/</g,'&lt;')}</p>
          <p class="subtask-result">${(st.result || '').replace(/</g,'&lt;')}</p>
        </div>`);
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
// 邏輯：頁面載入時讀取 /department-tasks（總經理委派子任務、角色實際產出
// 結果後，Worker 會把每一筆都存進 Cloudflare KV，見 cloudflare-worker.js
// 的 recordDepartmentTask）。哪個部門已經有真實任務記錄，就把該部門看板的
// 「目前任務」跟「討論紀錄」換成真實資料、標示「✓ 真實任務紀錄」；還沒有
// 真實記錄的部門，維持顯示原本的示範內容，並老實標示「示範內容」，
// 不會讓您分不清哪些是真的、哪些還是展示用途。
function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return '剛剛更新';
  if (min < 60) return `${min} 分鐘前更新`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小時前更新`;
  return `${Math.floor(hr / 24)} 天前更新`;
}

async function loadRealDepartmentTasks() {
  const base = apiBase();
  if (!base) return; // 還沒設定 Worker 網址，看板維持示範內容，不用特別提示（跟對話框邏輯一致）
  try {
    const res = await fetch(`${base}/department-tasks`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !Array.isArray(data.records) || data.records.length === 0) return;

    // 依 deptId 分組；Worker 回傳時已經是新到舊排序，分組後順序不變
    const byDept = {};
    for (const rec of data.records) {
      if (!rec || !rec.deptId) continue;
      (byDept[rec.deptId] = byDept[rec.deptId] || []).push(rec);
    }

    let changed = false;
    ORG_REGISTRY.forEach(dept => {
      const tasks = byDept[dept.id];
      if (!tasks || tasks.length === 0) return; // 這個部門還沒有真實任務記錄，維持示範內容
      changed = true;
      const latest = tasks[0];
      dept.board.isReal = true;
      dept.board.task = `${latest.roleNick || latest.roleName || ''}：${latest.task || ''}`.slice(0, 120);
      dept.board.progress = 100;
      dept.board.statusDot = 's-working';
      dept.board.statusLabel = '已完成任務';
      dept.board.metaLeft = '最新任務已完成';
      dept.board.metaRight = timeAgo(latest.completedAt);
      dept.board.log = tasks.slice(0, 6).map(t => ({
        who: `${t.roleName || ''}${t.roleNick || ''}`,
        txt: t.result || '（沒有留下結果內容）',
        time: timeAgo(t.completedAt),
      }));
    });

    if (changed) {
      renderBoard(ORG_REGISTRY);
      accordion(document.querySelectorAll('details.board-card[data-group="board"]'));
    }
  } catch (err) {
    console.error('讀取部門真實任務記錄失敗，看板繼續顯示示範內容：', err);
  }
}
loadRealDepartmentTasks();

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
