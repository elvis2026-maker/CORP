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

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function getGmReply(text, mediaType, imageFiles) {
  const endpoint = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.GM_API_ENDPOINT) ? APP_CONFIG.GM_API_ENDPOINT.trim() : '';
  const fallbackPool = mediaType ? (acksMedia[mediaType] || acks) : acks;

  if (!endpoint) {
    // 還沒設定 Worker 網址：沿用展示用的固定回覆，網站仍然完整可用（示範回覆不附風險標示）
    return { text: fallbackPool[Math.floor(Math.random() * fallbackPool.length)], risk: null };
  }

  try {
    const images = [];
    for (const file of imageFiles) {
      images.push({ mimeType: file.type || 'image/png', data: await fileToBase64(file) });
    }
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history: chatHistory, images }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return {
      text: data.reply || '（總經理這次沒有回覆內容，麻煩再問一次）',
      risk: (data.risk && data.risk.level && data.risk.reason) ? data.risk : null,
    };
  } catch (err) {
    console.error('呼叫總經理 API 失敗：', err);
    return { text: `（目前連不上總經理的 AI 服務，先用內部判斷回覆您）${fallbackPool[0]}`, risk: null };
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

  const imageFiles = pendingFilesSnapshot.filter(f => kindOf(f) === 'image');
  getGmReply(text, mediaType, imageFiles).then(result => {
    const typingRow = document.getElementById('typingRow');
    if (typingRow) typingRow.remove();
    const riskBadge = result.risk
      ? `<span class="risk risk-${result.risk.level}" title="${result.risk.reason.replace(/"/g,'&quot;')}">${RISK_LABEL[result.risk.level] || '風險'}</span> `
      : '';
    log.insertAdjacentHTML('beforeend', `
      <div class="msg msg-gm">
        <span class="ava ava-gm ava-sm" aria-hidden="true"><span class="ava-glyph">總</span></span>
        <div class="msg-body">
          <span class="msg-role">總經理 · 小總</span>
          <p>${riskBadge}<span class="gm-reply-text"></span></p>
          ${result.risk ? `<p class="gm-risk-reason">風控官（小控）：${result.risk.reason.replace(/</g,'&lt;')}</p>` : ''}
        </div>
      </div>`);
    log.lastElementChild.querySelector('.gm-reply-text').textContent = result.text;
    log.scrollTop = log.scrollHeight;
    chatHistory.push({ role: 'user', text: text || '（附加了圖片／檔案，無文字）' });
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

document.querySelectorAll('.approval-actions button').forEach(btn => {
  btn.addEventListener('click', () => {
    const card = document.getElementById(btn.dataset.target);
    if (!card || card.classList.contains('is-resolved')) return;
    const act = btn.dataset.act;
    const note = card.querySelector('.approval-resolved-note');
    card.classList.add('is-resolved');
    card.querySelectorAll('.approval-actions button').forEach(b => b.disabled = true);
    if (act === 'approve') {
      note.textContent = '✓ 董事長已核准，總經理將繼續往下執行';
      note.className = 'approval-resolved-note show ok';
      if (btn.dataset.target === 'ap-hire') {
        hireIntoOrg('bc-eng', {
          name: 'DevOps 工程師',
          nick: '· 小維',
          nameEn: 'DevOps Engineer',
          fn: '負責部署流程與系統維運，監控服務穩定性，是董事長核准後新增的試營運角色，一個月後由總經理回報成效。'
        });
        note.textContent = '✓ 董事長已核准，「DevOps 工程師（小維）」已加入工程部組織架構';
      }
    } else if (act === 'reject') {
      note.textContent = '✕ 已退回，總經理會請部門重新提案';
      note.className = 'approval-resolved-note show no';
    } else {
      note.textContent = '… 已請總經理補充更多資訊，稍後回到這裡';
      note.className = 'approval-resolved-note show';
      note.style.color = 'var(--ink-faint)';
    }
    pendingCount = Math.max(0, pendingCount - 1);
    refreshPendingCount();
  });
});
