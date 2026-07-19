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

// V42：部門即時狀態從一整個大區塊（含大標題＋雙欄卡片）縮小成快速燈號列——
// 原本的版面沒什麼互動功能（只是狀態顯示），卻佔了不少版面，董事長回報這個
// 位置更適合擺去下指令跟任務中心之間，尺寸看齊最上方的快速跳轉列。
// 名稱改用 lightsShort 兩字縮寫，完整名稱與目前狀態放在 title 屬性（滑鼠停留
// 或手機長按都看得到），點下去一樣連到 #board 對應部門的卡片。
function renderLights(registry) {
  const container = document.getElementById('lightsGrid');
  if (!container) return;
  container.innerHTML = registry.map(r => `
    <a class="light-pill" href="#${r.id}" data-dept-target="${r.id}" title="${escapeBoardText(r.lightsName)}｜${escapeBoardText(r.lights.state)}"><span class="stat-dot ${r.lights.dot}"></span><span class="light-pill-label">${escapeBoardText(r.lightsShort || r.lightsName)}</span></a>`).join('');
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
// V51：AI Agent 透過 Project Workspace 產出的檔案，改成「一個專案一張卡片」——
// 原本 V48 是把每個專案裡的每個檔案拆開，攤平混進跟董事長自己上傳項目同一份
// 清單（renderDelivery），一個有 3 個檔案的專案看起來就像 3 筆互不相干的
// 交付項目，讓人搞不清楚這些檔案其實是同一個任務、同一個專案產出的。這裡
// 改成專案本身是一張卡片，裡面才是這個專案目前有的檔案清單，符合「Project
// Workspace」原本的精神：一個容器，裝著這次任務交付的所有檔案。
function formatFileSize(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
function workspaceFileIcon(contentType) {
  const ct = String(contentType || '');
  if (ct.startsWith('image/')) return '🖼️';
  if (ct === 'application/pdf') return '📕';
  if (ct === 'application/zip') return '🗜️';
  if (ct.startsWith('text/html')) return '🌐';
  return '📄';
}
// V53：董事長回報交付中心的「AI Agent 專案工作區」越拉越長——這裡改成預設只顯示
// 最新的 5 個專案，其餘收在「顯示更多」按鈕後面（跟稽核日誌 V47 起「展開全部」
// 的收合模式是同一套使用者體驗，這個專案裡收合列表一律用同一種互動方式，不要
// 每個地方各自發明一套）。workspaceProjectsExpanded 是模組層級變數，記住「這次
// 頁面停留期間」有沒有展開過，重新整理頁面會回到預設收合狀態。
let workspaceProjectsExpanded = false;
const WORKSPACE_PROJECTS_COLLAPSED_COUNT = 5;
function renderWorkspaceProjects(projects, orgRegistry, base) {
  const container = document.getElementById('workspaceProjects');
  if (!container) return;
  if (!projects.length) {
    container.innerHTML = '';
    return;
  }
  const sorted = [...projects].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : (a.updatedAt > b.updatedAt ? -1 : 0)));
  const visible = workspaceProjectsExpanded ? sorted : sorted.slice(0, WORKSPACE_PROJECTS_COLLAPSED_COUNT);
  const cardsHtml = visible.map(p => {
    const dept = orgRegistry.find(r => r.id === (p.createdBy && p.createdBy.deptId));
    const contributorHtml = dept
      ? `<span class="ava ${dept.avaClass} dlist-dept-ava" aria-hidden="true" title="${escapeBoardText(dept.name)}"><span class="ava-glyph">${dept.glyph}</span></span>`
      : '';
    const files = Array.isArray(p.files) ? p.files : [];
    const filesHtml = files.length
      ? files.map(f => {
          const fileUrl = `${base}/workspace-file?projectId=${encodeURIComponent(p.id)}&filename=${encodeURIComponent(f.filename)}`;
          return `
            <a class="workspace-file-row" href="${fileUrl}" target="_blank" rel="noopener noreferrer" download="${escapeBoardText(f.filename)}">
              <span class="workspace-file-icon" aria-hidden="true">${workspaceFileIcon(f.contentType)}</span>
              <span class="workspace-file-name">${escapeBoardText(f.filename)}</span>
              <span class="workspace-file-size">${formatFileSize(f.size)}</span>
            </a>`;
        }).join('')
      : `<p class="workspace-project-empty">這個專案還沒有存進任何檔案，可能是 AI Agent 只建立了專案但還沒真的存檔——沒用的話可以按右上角刪除。</p>`;
    return `
      <div class="workspace-project-card">
        <div class="workspace-project-head">
          <span class="workspace-project-icon" aria-hidden="true">🗂️</span>
          <div class="workspace-project-main">
            <p class="workspace-project-title">${escapeBoardText(p.title)} <i class="bc-demo-tag delivery-workspace-tag">🤖 AI Agent 產出</i></p>
            <p class="workspace-project-desc">${escapeBoardText(p.description || '')}</p>
          </div>
          <div class="workspace-project-meta">
            ${contributorHtml}
            <span>${files.length} 個檔案</span>
            <span>${p.updatedAt ? formatDeliveryTime(p.updatedAt) : ''}</span>
            <button type="button" class="workspace-project-delete" data-project-delete="${p.id}" title="刪除這個專案（連同底下所有檔案）">🗑</button>
          </div>
        </div>
        <div class="workspace-project-files">${filesHtml}</div>
      </div>`;
  }).join('\n');
  const toggleHtml = sorted.length > WORKSPACE_PROJECTS_COLLAPSED_COUNT
    ? `<button type="button" class="workspace-projects-toggle" id="workspaceProjectsToggle">${workspaceProjectsExpanded ? '收合，只顯示最新 5 個' : `顯示更多（還有 ${sorted.length - WORKSPACE_PROJECTS_COLLAPSED_COUNT} 個專案）`}</button>`
    : '';
  container.innerHTML = cardsHtml + toggleHtml;
}
document.addEventListener('click', async (e) => {
  const toggleBtn = e.target.closest('#workspaceProjectsToggle');
  if (toggleBtn) {
    workspaceProjectsExpanded = !workspaceProjectsExpanded;
    loadDeliveryState(); // 重新整理才能重新套用收合／展開狀態，跟稽核日誌的作法一致
    return;
  }
  const deleteBtn = e.target.closest('[data-project-delete]');
  if (deleteBtn) {
    const projectId = deleteBtn.getAttribute('data-project-delete');
    const card = deleteBtn.closest('.workspace-project-card');
    const titleEl = card?.querySelector('.workspace-project-title');
    const titleText = titleEl ? titleEl.textContent.replace('🤖 AI Agent 產出', '').trim() : projectId;
    if (!confirm(`確定要刪除專案「${titleText}」嗎？這個專案底下所有已經存的檔案也會一併從 R2 刪除，無法復原。`)) return;
    const base = apiBase();
    if (!base) return;
    deleteBtn.disabled = true;
    deleteBtn.textContent = '…';
    try {
      const res = await fetch(`${base}/project-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminHeaders() },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      await loadDeliveryState();
    } catch (err) {
      alert(`刪除失敗：${err.message || err}`);
      deleteBtn.disabled = false;
      deleteBtn.textContent = '🗑';
    }
  }
});

function renderDelivery(items, orgRegistry) {
  const container = document.getElementById('deliveryGrid');
  if (!container) return;
  container.innerHTML = items.map(d => {
    const contributorDepts = (d.contributors || [])
      .map(id => orgRegistry.find(r => r.id === id))
      .filter(Boolean);
    const dotClass = contributorDepts[0] ? contributorDepts[0].avaClass : 'ava-gm';
    const deptTagsHtml = contributorDepts.slice(0, 3).map(dept =>
      `<span class="ava ${dept.avaClass} dlist-dept-ava" aria-hidden="true" title="${dept.name}"><span class="ava-glyph">${dept.glyph}</span></span>`
    ).join('');
    // V37：圖示只用來快速分辨「這一列有沒有 Demo／下載」，不是裝飾用的大色塊——
    // 有 Demo 用 🔗（不管是外部網址還是上傳的檔案），只有下載包用 📦，兩者都沒有用 📄
    const rowIcon = d.demoUrl ? '🔗' : (d.downloadUrl ? '📦' : '📄');
    const demoBtn = d.demoUrl
      ? `<a class="dlist-btn dlist-btn-primary" href="${d.demoUrl}" target="_blank" rel="noopener noreferrer">看 Demo</a>`
      : `<button type="button" class="dlist-btn dlist-btn-primary is-disabled" disabled title="這個項目還沒有可預覽的 Demo，等實際完成後可以在下方表單填網址或上傳檔案">看 Demo</button>`;
    const downloadBtn = d.downloadUrl
      ? `<a class="dlist-btn" href="${d.downloadUrl}" download target="_blank" rel="noopener noreferrer">下載</a>`
      : `<button type="button" class="dlist-btn is-disabled" disabled title="這個項目還沒有可下載的檔案，等實際完成後可以在下方表單填網址或上傳檔案">下載</button>`;
    const demoTag = d.isDemoItem ? '<i class="bc-demo-tag delivery-demo-tag">示範內容</i>' : '';
    const workspaceTag = d.isWorkspaceItem ? '<i class="bc-demo-tag delivery-workspace-tag">🤖 AI Agent 產出</i>' : '';
    // V41：董事長要求「自己上傳的要能編輯或刪除」——示範內容（isDemoItem）本來
    // 就不在後端 KV 裡，沒有 id 可以編輯／刪除，只有真實項目（dv-real- 開頭）
    // 才顯示這兩顆按鈕。V48：Project Workspace 的項目（AI Agent 透過工具產出的
    // 檔案）也還沒有編輯／刪除的後端支援，一併排除，避免顯示按鈕點下去卻沒作用。
    const editActionsHtml = (!d.isDemoItem && !d.isWorkspaceItem)
      ? `<button type="button" class="dlist-btn dlist-btn-edit" data-delivery-edit="${d.id}">編輯</button>
         <button type="button" class="dlist-btn dlist-btn-delete" data-delivery-delete="${d.id}">刪除</button>`
      : '';
    return `
        <div class="dlist-row">
          <span class="dlist-icon ${dotClass}" aria-hidden="true">${rowIcon}</span>
          <div class="dlist-main">
            <p class="dlist-title">${d.title}${demoTag}${workspaceTag}</p>
            <p class="dlist-desc">${d.desc || ''}</p>
          </div>
          <div class="dlist-meta">
            <span class="delivery-badge ${d.badge}">${d.badgeLabel}</span>
            ${deptTagsHtml}
            <span class="dlist-time">${d.time || ''}</span>
          </div>
          <div class="dlist-actions">${demoBtn}${downloadBtn}${editActionsHtml}</div>
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

// V46：董事長回報「待審批歷史／部門看板／任務中心」這幾處狀態文字寫死
// 「Cloudflare KV」，V43 起如果有綁 AI_COMPANY 這個 Durable Object，其實是
// 透過 DO 在跑，畫面卻沒有跟著更新，沒辦法一眼看出現在到底是哪一種模式。
// 這裡改成實際問後端的新端點 /runtime-status，用共用的 promise 快取結果——
// 4 個地方各自呼叫時只會真的打一次網路請求，不會重複問 4 次。
// 沒有設定 Worker 網址、端點還沒部署（例如舊版 Worker 還沒更新）、或請求
// 失敗，都不會讓畫面壞掉，只是退回一個中性、不做具體宣稱的說法。
let _runtimeInfoPromise = null;
async function ensureRuntimeInfo() {
  if (_runtimeInfoPromise) return _runtimeInfoPromise;
  _runtimeInfoPromise = (async () => {
    const fallback = { runtime: 'unknown', runtimeLabel: '後端資料庫' };
    const base = apiBase();
    if (!base) return fallback;
    try {
      const res = await fetch(`${base}/runtime-status`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) return fallback;
      return {
        runtime: data.runtime || 'unknown',
        runtimeLabel: data.runtimeLabel || fallback.runtimeLabel,
      };
    } catch (err) {
      console.error('讀取 Runtime 狀態失敗，狀態文字先用通用說法顯示：', err);
      return fallback;
    }
  })();
  return _runtimeInfoPromise;
}

// V38：所有「寫入」動作（核准／退回、任務推進、成本上限、上傳交付檔案、
// 新任角色）都要帶上這個標頭。如果 config.js 的 ADMIN_KEY 是空字串，就不會
// 帶任何標頭——這時候 Worker 那邊如果有設定 ADMIN_KEY，會回 401，畫面上會用
// 清楚的中文訊息提醒您去 config.js 補上；Worker 沒設定 ADMIN_KEY 的話則維持
// V37 以前「不驗證」的行為，方便還在測試階段的人。
function adminHeaders() {
  const key = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.ADMIN_KEY) ? APP_CONFIG.ADMIN_KEY.trim() : '';
  return key ? { 'X-Elvis-Admin-Key': key } : {};
}

// 寫入類的 fetch 都可以共用這個小工具：401 時給出好懂的錯誤訊息，而不是
// 讓呼叫端自己各寫一次同樣的判斷。
function friendlyAuthError(res, data) {
  if (res.status === 401) {
    return (data && data.error) || '身分驗證失敗，請確認 config.js 的 ADMIN_KEY 是否正確';
  }
  return (data && data.error) || `HTTP ${res.status}`;
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
      // V48：這個角色這次可能透過 Project Workspace 工具真的存了檔案，重新讀一次
      // 交付中心，讓新產出的檔案不用等重新整理頁面就看得到
      loadDeliveryState();
    }
    // V32：GM 判斷這件事需要建立正式任務時（跟上面的子任務互斥，後端只會回傳其中一種），
    // 插入一張輕量的「已建立正式任務」提示卡片，完整的步驟清單與進度顯示在下方
    // 「任務中心」，這裡呼叫 loadTaskState() 讓那個區塊馬上顯示這筆新任務，不用等
    // 重新整理頁面。
    if (result.task) {
      log.insertAdjacentHTML('beforeend', buildTaskCreatedNoticeHtml(result.task));
      loadTaskState();
      loadApprovalList(); // 建立當下如果第一步就需要裁示，這裡會馬上出現在待您核准
      loadBoardState(); // 自動執行的步驟如果已經完成，部門看板也要跟著更新
    }

    log.scrollTop = log.scrollHeight;
    chatHistory.push({ role: 'user', text: text || '（附加了圖片／影片／檔案，無文字）' });
    chatHistory.push({ role: 'model', text: result.text });
  });
});

// ---------------- 招聘提案核准後，即時把新角色加入組織架構 ----------------
// V38 之前：這裡只更新瀏覽器記憶體中的 ORG_REGISTRY 並重新渲染畫面，重新整理
// 頁面就會還原成 org-data.js 原本的內容。V38 補上了後端持久化（見下方
// persistHire／loadOrgHires），這個函式本身維持只管「畫面」，多了
// opts.skipFlash：從後端還原資料時不需要再跑一次捲動／高亮動畫。
function hireIntoOrg(deptId, role, opts) {
  opts = opts || {};
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

  if (opts.skipFlash) return;

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

// V38：核准當下把新角色真的寫回後端（沿用同一個 APPROVALS_KV），這是先前
// 版本一直留著的缺口——「畫面上看起來變了，重新整理就恢復原狀」。
async function persistHire(deptId, role) {
  const base = apiBase();
  if (!base) return { ok: false, reason: 'no-endpoint' };
  try {
    const res = await fetch(`${base}/org-hire`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...adminHeaders() },
      body: JSON.stringify({ deptId, roleName: role.name, roleNick: role.nick, roleNameEn: role.nameEn, roleFn: role.fn }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) return { ok: false, reason: 'failed', error: friendlyAuthError(res, data) };
    return { ok: true };
  } catch (err) {
    console.error('寫入新任角色失敗：', err);
    return { ok: false, reason: 'failed', error: String(err) };
  }
}

// 頁面載入時，把後端真的保存過的新角色（上一次核准留下的）補進 ORG_REGISTRY
// 並重新渲染，讓招聘案核准的結果重新整理頁面後依然看得到。
async function loadOrgHires() {
  const base = apiBase();
  if (!base) return;
  try {
    const res = await fetch(`${base}/org-state`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.hires || data.hires.length === 0) return;
    data.hires.forEach(h => {
      hireIntoOrg(h.deptId, { name: h.roleName, nick: h.roleNick, nameEn: h.roleNameEn, fn: h.roleFn }, { skipFlash: true });
    });
  } catch (err) {
    console.error('讀取新任角色清單失敗：', err);
  }
}
loadOrgHires();


const pendingCountEl = document.getElementById('pendingCount');
const pendingCountNavEl = document.getElementById('pendingCountNav');
const approvalEmpty = document.getElementById('approvalEmpty');

// V20：待審批核准／退回／加問動作串接後端共用的常數，先宣告在這裡，因為下面
// updatePendingCountFromDom() 在頁面載入當下就會呼叫一次、需要用到
// approvalHistoryRecordsCache（V41 新增的淡化預覽功能）。
const ACTION_LABEL = { approve: '✓ 核准', reject: '✕ 退回', ask: '… 加問' };
// V21：歷史批示紀錄平時只顯示最近幾筆，避免清單越拉越長把公文夾撐得很高；
// 累積比較多筆之後，點「展開全部」才會看到完整清單（後端最多回傳最新 100 筆，
// 展開後的清單本身也有捲動高度上限，不會無止盡撐開整個頁面，見 styles.css
// 的 .approval-history-list.is-expanded）。
const APPROVAL_HISTORY_COLLAPSE_COUNT = 3; // V41：董事長要求改成只顯示 3 則，其餘收合（原本是 8）
let approvalHistoryExpanded = false;
let approvalHistoryRecordsCache = [];

// V41：董事長要求「待審批是空的時候不要顯示假資料」——3 張示範卡片現在永久
// hidden（見 index.html），待辦數字改成只算真實項目（#approvalDynamicList 裡
// 的卡片），不用再分「有沒有真實項目」兩種算法。沒有真實待審批項目時，改顯示
// 最近 3 筆歷史批示紀錄的淡化預覽（見 renderApprovalRecentFaded），讓董事長
// 一眼看到「最近核准過什麼」而不是一張假的示範卡片。
function updatePendingCountFromDom() {
  const count = document.querySelectorAll('#approvalDynamicList .approval-card').length;
  if (pendingCountEl) pendingCountEl.textContent = count;
  if (pendingCountNavEl) pendingCountNavEl.textContent = count;
  if (approvalEmpty) approvalEmpty.classList.toggle('show', count === 0);
  renderApprovalRecentFaded(count === 0);
  return count;
}
function formatFadedApprovalTime(iso) {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString('zh-TW', { hour12: false }); } catch { return ''; }
}
// 用「最近核准的內容（刷淡）」取代原本示範卡片的角色——只是唯讀的參考，沒有
// 核准／退回按鈕，資料來源是 approvalHistoryRecordsCache（loadApprovalHistory()
// 讀回來的真實紀錄），不是另外打一次 API。
function renderApprovalRecentFaded(shouldShow) {
  const container = document.getElementById('approvalRecentFaded');
  if (!container) return;
  if (!shouldShow || !approvalHistoryRecordsCache.length) {
    container.innerHTML = '';
    container.classList.remove('show');
    return;
  }
  container.classList.add('show');
  const recent = approvalHistoryRecordsCache.slice(0, 3);
  container.innerHTML = `<p class="approval-recent-faded-title">最近核准紀錄（僅供參考，非待處理項目）</p>` + recent.map(r => {
    const label = ACTION_LABEL[r.action] || r.action;
    const cls = r.action === 'approve' ? 'act-approve' : (r.action === 'reject' ? 'act-reject' : 'act-ask');
    return `
      <div class="approval-recent-faded-item ${cls}">
        <span class="approval-recent-faded-badge">${label}</span>
        <span class="approval-recent-faded-case">${escapeBoardText(r.caseTitle || '')}</span>
        <span class="approval-recent-faded-time">${formatFadedApprovalTime(r.decidedAt)}</span>
      </div>`;
  }).join('');
}
updatePendingCountFromDom(); // 頁面載入時就同步一次（這時候 approvalHistoryRecordsCache 還是空陣列，等 loadApprovalHistory() 讀回真實資料後會再呼叫一次更新）

// ---------------- V20：待審批核准／退回／加問動作串接後端（Cloudflare KV）----------------
// 跟總經理對話共用同一支 Worker，多開兩個路徑：
//   POST {WORKER}/approval-action  → 寫入一筆批示紀錄（核准／退回／加問）
//   GET  {WORKER}/approval-history → 讀出所有歷史批示紀錄，畫面重新整理後仍看得到
// 如果 config.js 沒填 Worker 網址，或這次呼叫失敗（例如 Worker 還沒綁 KV），
// 畫面上的核准／退回互動仍然完整可用，只是會誠實註明「這筆決定沒有成功存進後端」，
// 不會讓您誤以為已經永久保存。

async function submitApprovalDecision(cardId, caseTitle, action, resultNote) {
  const base = apiBase();
  if (!base) {
    return { ok: false, reason: 'no-endpoint' };
  }
  try {
    const res = await fetch(`${base}/approval-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...adminHeaders() },
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

// ---------------- V34：真正資料驅動的待審批清單 ----------------
// 跟固定的 3 張示範卡片不同，這裡的項目是總經理執行正式任務時，遇到需要董事長
// 裁示的步驟才會真的產生（見 cloudflare-worker.js 的 runTaskStepsFrom／
// createApprovalItem）。一旦有任何一筆真實項目，畫面會把 3 張示範卡片藏起來，
// 只顯示真實的——這是回應「待你核准只要有真實資料進來就把假資料隱藏」的具體做法。
function formatApprovalTime(iso) {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString('zh-TW', { hour12: false }); } catch { return ''; }
}
function buildApprovalItemCardHtml(item) {
  const askHistoryHtml = (item.askNotes && item.askNotes.length)
    ? `<p class="approval-ask-history">您先前問過：${item.askNotes.map(a => escapeBoardText(a.note || '')).join('；')}</p>`
    : '';
  return `
        <div class="approval-card" data-dynamic="true" data-risk="mid" id="${item.id}">
          <div class="approval-top">
            <span class="ava ava-gm ava-sm" aria-hidden="true"><span class="ava-glyph">總</span></span>
            <div>
              <p class="approval-case">${escapeBoardText(item.caseTitle)}</p>
              <p class="approval-tag is-task-linked">來自任務中心・${escapeBoardText(item.taskId)}　·　${formatApprovalTime(item.createdAt)}</p>
            </div>
            <span class="risk risk-mid" style="margin-left:auto;">需要裁示</span>
          </div>
          <p class="approval-summary">${escapeBoardText(item.summary)}</p>
          <div class="approval-who">
            <span class="ava ava-gm ava-sm" aria-hidden="true"><span class="ava-glyph">總</span></span>
            <span>${escapeBoardText(item.reason)}</span>
          </div>
          ${askHistoryHtml}
          <div class="approval-actions">
            <button type="button" class="btn-approve" data-act="approve" data-target="${item.id}">核准，繼續執行</button>
            <button type="button" class="btn-ask" data-act="ask" data-target="${item.id}">再問清楚一點</button>
            <button type="button" class="btn-reject" data-act="reject" data-target="${item.id}">退回，跳過這步</button>
          </div>
          <p class="approval-resolved-note"></p>
        </div>`;
}
async function submitApprovalItemDecision(id, action, note) {
  const base = apiBase();
  if (!base) return { ok: false, reason: 'no-endpoint' };
  try {
    const res = await fetch(`${base}/approval-decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...adminHeaders() },
      body: JSON.stringify({ id, action, note: note || '' }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return { ok: true, item: data.item, task: data.task };
  } catch (err) {
    console.error('待審批項目決定寫入後端失敗：', err);
    return { ok: false, reason: 'request-failed', detail: String(err) };
  }
}
async function loadApprovalList() {
  const status = document.getElementById('approvalSyncStatus');
  const dynamicList = document.getElementById('approvalDynamicList');
  const base = apiBase();
  if (!base || !dynamicList) return;
  try {
    const res = await fetch(`${base}/approval-list`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    const items = Array.isArray(data.items) ? data.items : [];
    dynamicList.innerHTML = items.map(buildApprovalItemCardHtml).join('\n');
    // V41：3 張示範卡片現在永久 hidden（見 index.html），不需要再依真實項目
    // 數量切換顯示／隱藏；沒有真實項目時，updatePendingCountFromDom() 會顯示
    // #approvalEmpty 提示 + 最近核准紀錄的淡化預覽（見 renderApprovalRecentFaded）。
    if (status) {
      status.textContent = items.length > 0
        ? `已連上任務系統的真實待審批項目（${items.length} 筆）。`
        : (data.error || '目前沒有真實待審批項目。');
      status.classList.toggle('is-error', !!data.error && items.length === 0);
    }
    updatePendingCountFromDom();
  } catch (err) {
    console.error('讀取待審批清單失敗：', err);
  }
}

async function renderApprovalHistory(records) {
  approvalHistoryRecordsCache = records;
  // V41：歷史紀錄一有新資料就重新算一次「要不要顯示最近核准的淡化預覽」——
  // 這裡不知道目前待審批數字是多少，直接重用 updatePendingCountFromDom() 現成
  // 的判斷邏輯（它會自己讀 DOM 上真實項目的數量），不用另外維護一份判斷條件。
  updatePendingCountFromDom();
  const list = document.getElementById('approvalHistoryList');
  const status = document.getElementById('approvalHistoryStatus');
  const toggleBtn = document.getElementById('approvalHistoryToggle');
  if (!list || !status) return;
  // V46：這則說明文字原本是 index.html 裡寫死「Cloudflare KV」的靜態文字，
  // V43 起如果有綁 DO 就不準確了，不管目前有沒有歷史紀錄都要更新，所以放在
  // 兩個提前返回的分支之前，跟下面狀態文字共用同一次查詢結果。
  const runtimeInfo = await ensureRuntimeInfo();
  const kvNote = document.getElementById('approvalHistoryKvNote');
  if (kvNote) kvNote.textContent = `核准／退回／加問動作會存進後端（${runtimeInfo.runtimeLabel}），重新整理頁面也不會消失`;
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
  const cappedNote = records.length >= 100 ? `（僅顯示最新 100 筆，更早的紀錄仍完整保存在${runtimeInfo.runtimeLabel}，只是這裡不列出）` : '';
  status.textContent = `共 ${records.length} 筆紀錄${cappedNote}（後端保存於${runtimeInfo.runtimeLabel}）`;
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
  updatePendingCountFromDom();
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

// ============================================================================
// V47：治理稽核紀錄 Audit Log（唯讀，前端不能寫入）——建立可追蹤、可審批的
// 治理機制。跟上面的「歷史批示紀錄」不一樣的地方：批示紀錄只記錄核准／退回／
// 加問這一件事，Audit Log 涵蓋範圍更廣，把系統裡所有「有治理意義」的動作
// 統一收在一個地方：核准/退回/加問、任務建立/推進/取消/編輯工作流程、新任
// 角色、成本停損上限調整、交付項目上傳/編輯/刪除——各自的原始資料完全沒有
// 被取代，這是「多寫一份」統一格式的摘要，方便一次查閱。渲染邏輯（收合到 3
// 則、展開按鈕、快取重繪）直接沿用歷史批示紀錄的既有做法，保持一致的操作體驗。
// ============================================================================
const AUDIT_LOG_COLLAPSE_COUNT = 3;
let auditLogExpanded = false;
let auditLogRecordsCache = [];
const AUDIT_ACTION_LABEL = {
  'approval.approve': '✓ 核准', 'approval.reject': '✕ 退回', 'approval.ask': '… 加問',
  'task.create': '📋 建立任務', 'task.advance': '⏭ 推進步驟', 'task.cancel': '✕ 取消任務',
  'task.edit_steps': '✎ 編輯工作流程',
  'org.hire': '🧑‍💼 新任角色', 'cost.set_limit': '💰 調整停損上限',
  'delivery.upload': '📦 上傳交付項目', 'delivery.edit': '✎ 編輯交付項目', 'delivery.delete': '🗑 刪除交付項目',
};

function renderAuditLog(records) {
  const list = document.getElementById('auditLogList');
  const status = document.getElementById('auditLogStatus');
  const toggleBtn = document.getElementById('auditLogToggle');
  if (!list || !status) return;
  if (!records.length) {
    list.innerHTML = '';
    list.classList.remove('is-expanded');
    status.textContent = '目前還沒有稽核紀錄，系統裡發生的治理動作會顯示在這裡。';
    status.classList.remove('is-error');
    if (toggleBtn) toggleBtn.hidden = true;
    return;
  }
  const visible = auditLogExpanded ? records : records.slice(0, AUDIT_LOG_COLLAPSE_COUNT);
  list.innerHTML = visible.map(r => {
    const label = AUDIT_ACTION_LABEL[r.action] || r.action;
    const when = r.at ? new Date(r.at).toLocaleString('zh-TW', { hour12: false }) : '';
    return `
      <div class="audit-log-item">
        <span class="audit-badge">${label}</span>
        <div class="audit-body">
          <p class="audit-target">${(r.targetLabel || r.targetId || '（未命名對象）').replace(/</g, '&lt;')}</p>
          <p class="audit-meta">${r.actor || ''} · ${when}${r.detail ? ' · ' + r.detail.replace(/</g, '&lt;') : ''}</p>
        </div>
      </div>`;
  }).join('');
  list.classList.toggle('is-expanded', auditLogExpanded);
  const cappedNote = records.length >= 300 ? '（僅顯示最新 300 筆，更早的紀錄仍完整保存在後端，只是這裡不列出）' : '';
  status.textContent = `共 ${records.length} 筆稽核紀錄${cappedNote}`;
  status.classList.remove('is-error');
  if (toggleBtn) {
    if (records.length > AUDIT_LOG_COLLAPSE_COUNT) {
      toggleBtn.hidden = false;
      toggleBtn.textContent = auditLogExpanded ? '只看最近幾筆 ▲' : `展開全部 ${records.length} 筆 ▼`;
    } else {
      toggleBtn.hidden = true;
    }
  }
}
document.getElementById('auditLogToggle')?.addEventListener('click', () => {
  auditLogExpanded = !auditLogExpanded;
  renderAuditLog(auditLogRecordsCache);
});

async function loadAuditLog() {
  const status = document.getElementById('auditLogStatus');
  const base = apiBase();
  if (!base) {
    if (status) {
      status.textContent = '尚未設定 Worker 網址，稽核紀錄無法讀取。';
      status.classList.add('is-error');
    }
    return;
  }
  try {
    const res = await fetch(`${base}/audit-log`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    if (data.error && (!data.records || !data.records.length)) {
      if (status) { status.textContent = data.error; status.classList.add('is-error'); }
      return;
    }
    auditLogRecordsCache = Array.isArray(data.records) ? data.records : [];
    renderAuditLog(auditLogRecordsCache);
  } catch (err) {
    console.error('讀取稽核紀錄失敗：', err);
    if (status) {
      status.textContent = '目前連不上稽核紀錄服務，稍後重新整理頁面再試一次。';
      status.classList.add('is-error');
    }
  }
}
loadAuditLog();

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
          <p class="task-created-title">已建立正式任務 ${escapeBoardText(task.id)}：${escapeBoardText(task.title)}</p>
          <p class="task-created-sub">總經理會自動一路往下執行，需要您裁示的步驟會出現在上方「待您核准」；完整進度請見「任務中心」。<a href="#tasks">前往查看 →</a></p>
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
    // V34：部門看板同步完成後，ORG_REGISTRY 的 board.statusDot／statusLabel
    // 是最新的了，重新渲染一次任務中心，讓每個步驟旁邊的部門狀態跟著更新——
    // 不然任務卡片會一直顯示頁面剛載入那一刻的舊狀態。
    if (typeof loadTaskState === 'function') loadTaskState();
    if (status) {
      const runtimeInfo = await ensureRuntimeInfo();
      status.textContent = realCount > 0
        ? `已連上部門任務資料庫（${runtimeInfo.runtimeLabel}）：${realCount} 個部門有真實任務紀錄，其餘部門顯示 org-data.js 的示範內容。`
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
// V41：編輯表單需要「這筆真實項目原本的完整資料」（標題、說明、參與部門、
// 網址、是否已驗收…）才能預填，但 renderDelivery() 用的是簡化過的顯示用物件
// （demoUrl 可能是組出來的 R2 代理網址）。這裡另外存一份「後端原始回傳資料」
// 的對照表，用 id 查，點擊編輯時就不用再多打一次 API。
let deliveryRealRecordsCache = {};
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
    renderWorkspaceProjects([], ORG_REGISTRY, base);
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
      renderWorkspaceProjects([], ORG_REGISTRY, base);
      setDeliveryUploadEnabled(false, 'APPROVALS_KV 尚未綁定完成');
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
      // V37：優先用直接填的外部網址；沒有填網址、但有上傳檔案的話，才組出
      // /delivery-file 代理網址去 R2 撈檔案內容
      demoUrl: it.demoUrl || (it.hasDemo ? `${base}/delivery-file?id=${encodeURIComponent(it.id)}&kind=demo` : ''),
      downloadUrl: it.downloadUrl || (it.hasDownload ? `${base}/delivery-file?id=${encodeURIComponent(it.id)}&kind=download` : ''),
      isDemoItem: false,
    }));

    // V48：Project Workspace——AI Agent 透過 create_project／save_file 等工具真的
    // 產出的檔案，也要在交付中心顯示與提供下載，這是這一版的核心要求：「交付中心
    // 直接依 Workspace 顯示與下載」。
    // V51：修正——原本這裡把每個專案的每個檔案攤平成獨立一列跟 delivery-item
    // 混在一起顯示，導致一個專案的好幾個檔案看起來像互不相干的產出。現在改成
    // 呼叫 renderWorkspaceProjects() 用「一個專案一張卡片」的方式獨立顯示，
    // 不再混進 combinedRealItems 這份給 renderDelivery() 用的清單。
    let workspaceProjects = [];
    try {
      const wsRes = await fetch(`${base}/workspace-list`);
      const wsData = await wsRes.json().catch(() => ({}));
      workspaceProjects = Array.isArray(wsData.projects) ? wsData.projects : [];
    } catch (err) {
      console.error('讀取專案工作區清單失敗（不影響董事長自己上傳的交付項目照常顯示）：', err);
    }
    renderWorkspaceProjects(workspaceProjects, ORG_REGISTRY, base);
    const workspaceFileCount = workspaceProjects.reduce((sum, p) => sum + (Array.isArray(p.files) ? p.files.length : 0), 0);

    const combinedRealItems = realItems;
    // V41：存一份原始資料（含 hasDemo／hasDownload／真正的 demoUrl 欄位，不是
    // 組出來的代理網址），編輯表單需要分清楚「這個欄位原本是網址還是上傳的檔案」
    deliveryRealRecordsCache = {};
    (data.items || []).forEach(it => { deliveryRealRecordsCache[it.id] = it; });
    // V34：只要有任何一筆真實交付項目，就把 delivery-data.js 的示範卡片整個
    // 藏起來，不再兩者並列——呼應「所有寫死假資料的部分，只要有真實資料就隱藏」。
    // V48：這裡的「真實項目」現在包含兩種來源——董事長自己上傳的，跟 AI Agent
    // 透過 Project Workspace 工具真的產出的，只要任一種有資料就不顯示示範內容。
    const hasAnyRealContent = combinedRealItems.length > 0 || workspaceProjects.length > 0;
    renderDelivery(hasAnyRealContent ? combinedRealItems : demoItems, ORG_REGISTRY);
    if (status) {
      status.textContent = hasAnyRealContent
        ? `已連上真實交付檔案儲存（Cloudflare R2）：${realItems.length} 筆董事長上傳項目、${workspaceProjects.length} 個 AI Agent 專案工作區（共 ${workspaceFileCount} 個檔案），delivery-data.js 的示範內容已隱藏。`
        : '已連上真實交付檔案儲存（Cloudflare R2），目前還沒有任何真實項目，以下先顯示示範內容，可以用下方表單上傳第一筆，或請總經理委派任務讓 AI Agent 產出檔案。';
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
    renderWorkspaceProjects([], ORG_REGISTRY, base);
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
      ? '填網址或選擇檔案都可以（Demo、下載各自獨立選擇），送出後直接出現在上方清單，不用重新整理頁面；只填網址的話不需要 R2，上傳檔案才需要。'
      : `目前無法新增交付項目（${reason || '後端尚未就緒'}），請見 README「V20 設定方法」確認 KV 是否綁定。`;
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
// V41：新增／編輯共用同一個表單——editingDeliveryId 是 null 代表現在是「新增」模式，
// 有值代表正在編輯這一筆真實項目的 id。點擊某筆項目的「編輯」按鈕時，把這個表單
// 打開並用 deliveryRealRecordsCache 裡的原始資料預填進去；送出時依這個狀態決定
// 呼叫 /delivery-upload 還是 /delivery-edit。
let editingDeliveryId = null;

function enterDeliveryEditMode(id) {
  const record = deliveryRealRecordsCache[id];
  if (!record) return;
  editingDeliveryId = id;
  const panel = document.getElementById('deliveryUploadPanel');
  const summary = document.getElementById('deliveryUploadSummary');
  const banner = document.getElementById('deliveryEditBanner');
  const titleSpan = document.getElementById('deliveryEditingTitle');
  const submitBtn = document.getElementById('deliveryUploadSubmitBtn');
  if (panel) panel.open = true;
  if (summary) summary.textContent = '編輯交付項目';
  if (banner) banner.hidden = false;
  if (titleSpan) titleSpan.textContent = record.title;
  if (submitBtn) submitBtn.textContent = '儲存變更';

  document.getElementById('deliveryTitleInput').value = record.title || '';
  document.getElementById('deliveryDescInput').value = record.desc || '';
  document.getElementById('deliveryDemoUrlInput').value = record.demoUrl || '';
  document.getElementById('deliveryDownloadUrlInput').value = record.downloadUrl || '';
  document.getElementById('deliveryVerifiedInput').checked = record.badge === 'verified';
  document.getElementById('deliveryDemoFileInput').value = '';
  document.getElementById('deliveryDownloadFileInput').value = '';
  deliveryUploadForm.querySelectorAll('input[name="deliveryContributor"]').forEach(el => {
    el.checked = (record.contributors || []).includes(el.value);
  });
  panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function exitDeliveryEditMode() {
  editingDeliveryId = null;
  const summary = document.getElementById('deliveryUploadSummary');
  const banner = document.getElementById('deliveryEditBanner');
  const submitBtn = document.getElementById('deliveryUploadSubmitBtn');
  if (summary) summary.textContent = '＋ 新增真實交付項目';
  if (banner) banner.hidden = true;
  if (submitBtn) submitBtn.textContent = '新增交付項目';
  deliveryUploadForm.reset();
}

document.getElementById('deliveryEditCancelBtn')?.addEventListener('click', exitDeliveryEditMode);

document.getElementById('deliveryGrid')?.addEventListener('click', async (e) => {
  const editBtn = e.target.closest('[data-delivery-edit]');
  const deleteBtn = e.target.closest('[data-delivery-delete]');
  if (editBtn) {
    enterDeliveryEditMode(editBtn.dataset.deliveryEdit);
    return;
  }
  if (deleteBtn) {
    const id = deleteBtn.dataset.deliveryDelete;
    const record = deliveryRealRecordsCache[id];
    const title = record ? record.title : '這筆交付項目';
    if (!confirm(`確定要刪除「${title}」嗎？這個動作無法復原，已上傳的檔案也會一併從儲存空間刪除。`)) return;
    deleteBtn.disabled = true;
    deleteBtn.textContent = '刪除中…';
    const base = apiBase();
    try {
      const res = await fetch(`${base}/delivery-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminHeaders() },
        body: JSON.stringify({ id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);
      if (editingDeliveryId === id) exitDeliveryEditMode(); // 剛好在編輯這筆時被刪掉，退回新增模式
      await loadDeliveryState();
    } catch (err) {
      console.error('刪除交付項目失敗：', err);
      alert(`刪除失敗：${err.message || err}`);
      deleteBtn.disabled = false;
      deleteBtn.textContent = '刪除';
    }
  }
});

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
    const demoUrlEl = document.getElementById('deliveryDemoUrlInput');
    const downloadUrlEl = document.getElementById('deliveryDownloadUrlInput');
    const contributorEls = deliveryUploadForm.querySelectorAll('input[name="deliveryContributor"]:checked');
    const contributors = Array.from(contributorEls).map(el => el.value);

    if (!titleEl.value.trim()) {
      if (statusEl) { statusEl.textContent = '請填寫交付項目標題。'; statusEl.classList.add('is-error'); }
      return;
    }
    const demoFile = demoFileEl.files[0] || null;
    const downloadFile = downloadFileEl.files[0] || null;
    const demoUrl = demoUrlEl.value.trim();
    const downloadUrl = downloadUrlEl.value.trim();
    // V41：編輯模式時，「這次沒填網址、也沒選新檔案」代表沿用原本的內容，不能
    // 當成「兩者都沒有」擋下來；新增模式才需要強制至少擇一
    if (!editingDeliveryId && !demoFile && !downloadFile && !demoUrl && !downloadUrl) {
      if (statusEl) { statusEl.textContent = 'Demo（網址或檔案）跟下載檔案包（網址或檔案），至少要填一個。'; statusEl.classList.add('is-error'); }
      return;
    }

    const submitBtn = deliveryUploadForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    if (statusEl) { statusEl.textContent = '處理中，上傳檔案較大時可能需要幾秒鐘…'; statusEl.classList.remove('is-error'); }

    try {
      const payload = {
        title: titleEl.value.trim(),
        desc: descEl.value.trim(),
        contributors,
        verified: !!(verifiedEl && verifiedEl.checked),
        demoUrl: demoUrl || null,
        downloadUrl: downloadUrl || null,
        demoFile: demoFile ? { name: demoFile.name, mimeType: demoFile.type || 'text/html', data: await fileToBase64(demoFile) } : null,
        downloadFile: downloadFile ? { name: downloadFile.name, mimeType: downloadFile.type || 'application/octet-stream', data: await fileToBase64(downloadFile) } : null,
      };
      const isEditing = !!editingDeliveryId;
      if (isEditing) payload.id = editingDeliveryId;
      const res = await fetch(`${base}/${isEditing ? 'delivery-edit' : 'delivery-upload'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminHeaders() },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      if (isEditing) {
        exitDeliveryEditMode();
        if (statusEl) { statusEl.textContent = '✓ 已儲存變更。'; statusEl.classList.remove('is-error'); }
      } else {
        deliveryUploadForm.reset();
        if (statusEl) { statusEl.textContent = '✓ 已新增，出現在上方交付中心清單裡了。'; statusEl.classList.remove('is-error'); }
      }
      await loadDeliveryState();
    } catch (err) {
      console.error(`交付項目${editingDeliveryId ? '編輯' : '新增'}失敗：`, err);
      if (statusEl) { statusEl.textContent = `${editingDeliveryId ? '編輯' : '新增'}失敗：${err.message || err}`; statusEl.classList.add('is-error'); }
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
// Cloudflare KV。這裡負責把 Task Center 的畫面渲染出來。
// V34：總經理現在會自動一路往下執行任務步驟，不再需要董事長每一步都手動推進——
// 「推進下一步」只保留給「某步執行失敗」時的手動重試；真正需要董事長裁示的步驟，
// 會變成「等您裁示」狀態，卡片會提示去上面的「待您核准」處理，不是按這裡的按鈕。
const TASK_STATUS_META = {
  planning: { dot: 's-meeting', label: '規劃中' },
  in_progress: { dot: 's-working', label: '執行中' },
  awaiting_approval: { dot: 's-await', label: '等您裁示' },
  done: { dot: 's-idle', label: '已完成' },
  blocked: { dot: 's-blocked', label: '已卡關' },
  cancelled: { dot: 's-off', label: '已取消' },
};
function formatTaskTime(iso) {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString('zh-TW', { hour12: false }); } catch { return ''; }
}
// V34：讀 ORG_REGISTRY 目前的部門狀態（由 loadBoardState() 隨時同步），讓任務
// 步驟旁邊看得到「這個部門現在的上班狀況」，不會顯示跟部門看板對不上的舊資料——
// 這是修正「進到任務清單後，各部門上班狀況都不會同步更新」的畫面呈現這一半，
// 後端那一半是任務步驟執行時也會寫進部門看板（見 cloudflare-worker.js persistBoardTask）。
function getDeptLiveStatus(deptId) {
  const dept = ORG_REGISTRY.find(r => r.id === deptId);
  if (!dept || !dept.board) return null;
  return { dot: dept.board.statusDot || 's-idle', label: dept.board.statusLabel || '' };
}
function buildTaskStepHtml(step) {
  const icon = step.status === 'done' ? '✓' : (step.status === 'rejected' ? '✕' : '');
  const liveStatus = getDeptLiveStatus(step.deptId);
  const liveStatusHtml = liveStatus
    ? `<span class="tc-step-dept-status"><span class="stat-dot ${liveStatus.dot}"></span>${escapeBoardText(liveStatus.label)}</span>`
    : '';
  let noteHtml = '';
  if (step.status === 'awaiting_approval') {
    noteHtml = `<p class="tc-step-note">⏸ 正在等董事長於「待您核准」裁示${step.approvalReason ? '：' + escapeBoardText(step.approvalReason) : ''}</p>`;
  } else if (step.status === 'rejected') {
    noteHtml = `<p class="tc-step-note is-rejected">✕ 董事長已退回這一步，任務繼續往下一步進行</p>`;
  } else if (step.approvedButFailed) {
    noteHtml = `<p class="tc-step-note is-rejected">董事長已核准，但這次執行失敗，可按下方「推進下一步」重試</p>`;
  }
  return `
      <div class="tc-step tc-step-${step.status}">
        <span class="tc-step-icon" aria-hidden="true">${icon}</span>
        <div class="tc-step-body">
          <p class="tc-step-title">${escapeBoardText(step.deptName)}・${escapeBoardText(step.roleNick)} ${escapeBoardText(step.roleName)}${liveStatusHtml}</p>
          <p class="tc-step-desc">${escapeBoardText(step.description)}</p>
          ${noteHtml}
          ${step.result ? `<p class="tc-step-result">${escapeBoardText(step.result)}</p>` : ''}
        </div>
      </div>`;
}
// ============================================================================
// V47：可手動編輯任務步驟 Workflow Editor——支援人工調整 AI 工作流程
// ----------------------------------------------------------------------------
// 已完成／已退回的步驟（鎖住的前綴）唯讀顯示，不能碰；還沒真的執行過的步驟
// （pending 或正卡在等董事長裁示的 awaiting_approval）才能編輯——新增、刪除、
// 修改內容都算。存檔會整包送去 /task-edit-steps，後端會拼回「鎖住的前綴＋
// 新的可編輯範圍」並直接自動繼續執行，細節見 cloudflare-worker.js 的說明。
const DEPT_OPTIONS_HTML = ORG_REGISTRY.map(r => `<option value="${r.id}">${escapeBoardText(r.nameOrg || r.name)}</option>`).join('');

function buildWorkflowEditorRowHtml(step) {
  const roleName = step?.roleName || '';
  const roleNick = step?.roleNick || '';
  const desc = step?.description || '';
  const needsApproval = !!step?.needsApproval;
  const approvalReason = step?.approvalReason || '';
  return `
    <div class="wf-row">
      <select class="wf-dept">${DEPT_OPTIONS_HTML}</select>
      <input class="wf-role-name" type="text" placeholder="角色全名（例如 業務策略師）" maxlength="40" value="${roleName.replace(/"/g, '&quot;')}">
      <input class="wf-role-nick" type="text" placeholder="暱稱（例如 小業）" maxlength="20" value="${roleNick.replace(/"/g, '&quot;')}">
      <textarea class="wf-desc" placeholder="這個步驟具體要做什麼" maxlength="300" rows="2">${desc.replace(/</g, '&lt;')}</textarea>
      <label class="wf-approval-toggle"><input type="checkbox" class="wf-needs-approval" ${needsApproval ? 'checked' : ''}> 需要董事長核准才能執行</label>
      <input class="wf-approval-reason" type="text" placeholder="為什麼需要核准（選填）" maxlength="200" value="${approvalReason.replace(/"/g, '&quot;')}" ${needsApproval ? '' : 'hidden'}>
      <button type="button" class="wf-remove-row" data-wf-remove-step title="移除這個步驟">✕ 移除</button>
    </div>`;
}

function buildWorkflowEditorHtml(task) {
  let lockedCount = 0;
  while (lockedCount < task.steps.length
    && (task.steps[lockedCount].status === 'done' || task.steps[lockedCount].status === 'rejected')) {
    lockedCount++;
  }
  const lockedSteps = task.steps.slice(0, lockedCount);
  const editableSteps = task.steps.slice(lockedCount);
  const lockedHtml = lockedSteps.length
    ? `<div class="wf-locked-group">
         <p class="wf-locked-title">🔒 已完成／已退回的步驟（唯讀，不能編輯）</p>
         ${lockedSteps.map(s => `<div class="wf-locked-step">${escapeBoardText(s.deptName)}・${escapeBoardText(s.roleNick)}　${escapeBoardText(s.description)}</div>`).join('')}
       </div>`
    : '';
  return `
    <div class="wf-editor-inner">
      ${lockedHtml}
      <p class="wf-editable-title">✎ 還沒執行的步驟（可以新增、刪除、修改）</p>
      <div class="wf-rows" data-wf-rows>
        ${editableSteps.length ? editableSteps.map(buildWorkflowEditorRowHtml).join('') : buildWorkflowEditorRowHtml(null)}
      </div>
      <button type="button" class="wf-add-row" data-wf-add-step>＋ 新增步驟</button>
      <div class="wf-editor-actions">
        <button type="button" class="wf-save" data-wf-save="${task.id}" data-wf-locked-count="${lockedCount}">儲存並繼續執行</button>
        <button type="button" class="wf-cancel" data-wf-cancel="${task.id}">取消編輯</button>
        <span class="wf-editor-status" data-wf-status-for="${task.id}"></span>
      </div>
    </div>`;
}

// 存好的 <select> 目前值沒辦法用字串模板直接設定「選中哪一個」，
// 這裡渲染完 DOM 之後，逐列把 select.value 設回這個步驟原本的部門
function applyWorkflowEditorSelectValues(container, editableSteps) {
  const rows = container.querySelectorAll('[data-wf-rows] .wf-row');
  rows.forEach((row, i) => {
    const dept = editableSteps[i]?.deptId;
    if (dept) {
      const select = row.querySelector('.wf-dept');
      if (select) select.value = dept;
    }
  });
}

function buildTaskCardHtml(task) {
  const meta = TASK_STATUS_META[task.status] || { dot: 's-idle', label: task.status };
  const doneCount = task.steps.filter(s => s.status === 'done').length;
  const total = task.steps.length || 1;
  const pct = Math.round((doneCount / total) * 100);
  const isTerminal = task.status === 'done' || task.status === 'cancelled';
  const isAwaitingApproval = task.status === 'awaiting_approval';
  const hasRetriableStep = task.steps.some(s => s.status === 'pending');
  const canAdvance = !isTerminal && !isAwaitingApproval && hasRetriableStep;
  const estimatedText = task.estimatedDays ? `預估 ${task.estimatedDays} 天` : '';
  const advanceHint = isAwaitingApproval
    ? `<span class="tc-action-hint">請到上方「待您核准」裁示 →</span>`
    : '';
  // V49：董事長回報「任務一直卡在規劃中、按推進下一步也沒反應」——查證後是背景
  // 執行真的失敗了，但失敗原因以前只寫進 Cloudflare Logs，畫面上完全看不到，
  // 感覺起來就像按了沒反應。這裡把 task.lastError（後端這次新增的欄位，見
  // cloudflare-worker.js runTaskStepsFrom 的 V49 說明）顯示出來，失敗原因會
  // 直接寫在任務卡片上，不會再悄悄消失。步驟真的成功一次之後，lastError 會被
  // 後端清空，這個提示框也會跟著自動消失。
  const lastErrorHtml = (task.lastError && !isTerminal)
    ? `<p class="tc-last-error">⚠ 上一次執行失敗（${escapeBoardText(task.lastError.deptName || '')}）：${escapeBoardText(task.lastError.message)}——可能是 API 金鑰未設定／額度用完，或暫時性錯誤，可以按「推進下一步」重試，仍反覆失敗請查 Cloudflare Worker 的 Real-time Logs 確認真正原因</p>`
    : '';
  return `
      <details class="task-card" data-task-id="${task.id}" data-status="${task.status}">
        <summary>
          <div class="tc-top">
            <span class="tc-id">${escapeBoardText(task.id)}</span>
            <span class="tc-name">${escapeBoardText(task.title)}</span>
            <span class="tc-status"><span class="stat-dot ${meta.dot}"></span>${meta.label}</span>
            <svg class="tc-chevron" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <p class="tc-desc">${escapeBoardText(task.description)}</p>
          <div class="tc-bar-row">
            <div class="tc-bar"><div class="tc-bar-fill" style="width:${pct}%"></div></div>
            <span class="tc-pct">${pct}%</span>
          </div>
          <div class="tc-meta"><span>${doneCount}/${total} 步驟完成</span><span>${estimatedText}${estimatedText ? ' · ' : ''}建立於 ${formatTaskTime(task.createdAt)}</span></div>
        </summary>
        ${lastErrorHtml}
        <div class="tc-steps">${task.steps.map(buildTaskStepHtml).join('')}</div>
        <div class="tc-workflow-editor" id="wf-editor-${task.id}" hidden></div>
        <div class="tc-actions">
          <button type="button" class="tc-advance" data-task-advance="${task.id}" ${canAdvance ? '' : 'disabled'}>推進下一步</button>
          <button type="button" class="tc-edit-workflow" data-task-edit="${task.id}" ${isTerminal ? 'disabled' : ''}>✎ 編輯工作流程</button>
          <button type="button" class="tc-cancel" data-task-cancel="${task.id}" ${isTerminal ? 'disabled' : ''}>取消任務</button>
          ${advanceHint}
          <span class="tc-action-status" data-task-status-for="${task.id}"></span>
        </div>
      </details>`;
}
// V35：見下方 renderTasks() 尾端與 pollTaskStateIfActive() 的說明。
let taskPollingShouldRun = false;
// V42：已完成／已取消的任務不再無限往下堆全尺寸卡片——參考待審批區塊
// 「最近 3 筆歷史批示淡化預覽」的做法，預設只顯示最近 3 筆的精簡摘要（淡化
// 呈現，不能展開看步驟細節，純粹是「這件事辦完了」的紀錄），超過的部分收在
// 「展開全部」後面、限制最大高度、內部捲動，不會讓任務中心越長越長。
function buildTaskFadedItemHtml(task) {
  const meta = TASK_STATUS_META[task.status] || { dot: 's-idle', label: task.status };
  const doneCount = task.steps.filter(s => s.status === 'done').length;
  const total = task.steps.length || 1;
  return `
      <div class="task-done-item" data-status="${task.status}">
        <span class="stat-dot ${meta.dot}"></span>
        <span class="task-done-id">${escapeBoardText(task.id)}</span>
        <span class="task-done-item-title">${escapeBoardText(task.title)}</span>
        <span class="task-done-meta">${doneCount}/${total}・${meta.label}・${formatTaskTime(task.updatedAt || task.createdAt)}</span>
      </div>`;
}
const TASK_DONE_COLLAPSE_COUNT = 3;
let taskDoneExpanded = false;
let lastLoadedTasks = []; // V42：展開/收合「已完成任務」時直接用這份重新渲染，不用重打一次後端

function renderTasks(tasks) {
  lastLoadedTasks = tasks;
  const grid = document.getElementById('taskGrid');
  const empty = document.getElementById('taskEmpty');
  const summaryBar = document.getElementById('taskSummaryBar');
  const doneSection = document.getElementById('taskDoneSection');
  const doneList = document.getElementById('taskDoneList');
  const doneToggle = document.getElementById('taskDoneToggle');
  const doneTitle = document.getElementById('taskDoneTitle');
  if (!grid) return;
  if (!tasks.length) {
    grid.innerHTML = '';
    if (empty) empty.hidden = false;
    if (summaryBar) summaryBar.hidden = true;
    if (doneSection) doneSection.hidden = true;
    return;
  }
  if (empty) empty.hidden = true;

  // V42：進行中／等裁示／規劃中／卡關的任務照舊用完整卡片顯示；已完成／已取消
  // 的任務移到下面的淡化摘要區，不再無限往下堆——這是董事長回報「任務中心越來
  // 越長」查到的根本原因（V32 建立這個畫面時完全沒有處理任務完成後的顯示方式，
  // 完成的任務會永遠留在畫面上，跟活躍任務長得一模一樣、佔一樣大的版面）。
  const activeTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled');
  const terminalTasks = tasks.filter(t => t.status === 'done' || t.status === 'cancelled')
    .slice()
    .sort((a, b) => ((a.updatedAt || a.createdAt) < (b.updatedAt || b.createdAt) ? 1 : -1));

  grid.innerHTML = activeTasks.length
    ? activeTasks.map(buildTaskCardHtml).join('\n')
    : '<p class="task-all-done-note">目前沒有進行中的任務，已完成／已取消的任務收在下方。</p>';

  if (doneSection) {
    if (!terminalTasks.length) {
      doneSection.hidden = true;
    } else {
      doneSection.hidden = false;
      const visible = taskDoneExpanded ? terminalTasks : terminalTasks.slice(0, TASK_DONE_COLLAPSE_COUNT);
      doneList.innerHTML = visible.map(buildTaskFadedItemHtml).join('');
      doneList.classList.toggle('is-expanded', taskDoneExpanded);
      if (doneTitle) doneTitle.textContent = `已完成／已取消任務（共 ${terminalTasks.length} 筆）`;
      if (doneToggle) {
        if (terminalTasks.length > TASK_DONE_COLLAPSE_COUNT) {
          doneToggle.hidden = false;
          doneToggle.textContent = taskDoneExpanded ? '收合 ▲' : `展開全部 ▼（還有 ${terminalTasks.length - TASK_DONE_COLLAPSE_COUNT} 筆）`;
        } else {
          doneToggle.hidden = true;
        }
      }
    }
  }

  // V34：任務中心移到跟總經理下指令下方後，這裡加一行彙總數字，
  // 不用展開每張卡片也能一眼看到「現在還有幾件在動、平均做到幾%了」
  if (summaryBar) {
    const awaitingCount = tasks.filter(t => t.status === 'awaiting_approval').length;
    const avgPct = tasks.length
      ? Math.round(tasks.reduce((sum, t) => {
          const total = t.steps.length || 1;
          const done = t.steps.filter(s => s.status === 'done').length;
          return sum + (done / total) * 100;
        }, 0) / tasks.length)
      : 0;
    summaryBar.hidden = false;
    summaryBar.innerHTML = `<span>共 <b>${tasks.length}</b> 件任務</span><span>進行中 <b>${activeTasks.length}</b> 件</span>${awaitingCount ? `<span>等您裁示 <b>${awaitingCount}</b> 件</span>` : ''}<span>平均完成度 <b>${avgPct}%</b></span>`;
  }
  // V35：任務改成在後端背景執行（見 cloudflare-worker.js 的 V35 說明）之後，
  // 光靠「建立/推進當下呼叫一次 loadTaskState()」不夠——後續步驟是背景慢慢
  // 做完的，需要有東西定期重新讀一次才看得到進度真的往前走。這裡只記錄「現在
  // 是否有任務正在 planning／in_progress」，實際輪詢邏輯在下面 pollTaskStateIfActive()。
  taskPollingShouldRun = tasks.some(t => t.status === 'planning' || t.status === 'in_progress');
}
const taskDoneToggleEl = document.getElementById('taskDoneToggle');
if (taskDoneToggleEl) {
  taskDoneToggleEl.addEventListener('click', () => {
    taskDoneExpanded = !taskDoneExpanded;
    renderTasks(lastLoadedTasks);
  });
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
      const runtimeInfo = await ensureRuntimeInfo();
      status.textContent = tasks.length
        ? `已連上任務資料庫（${runtimeInfo.runtimeLabel}）：共 ${tasks.length} 筆正式任務，跨天、跨部門的進度都會保留。`
        : `已連上任務資料庫（${runtimeInfo.runtimeLabel}），目前還沒有任何正式任務。`;
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
    // 需要核准的核取方塊被點擊時，順便切換旁邊「為什麼需要核准」欄位的顯示——
    // 不需要核准的步驟沒必要填這個理由，隱藏起來畫面更乾淨
    if (e.target.classList && e.target.classList.contains('wf-needs-approval')) {
      const reasonInput = e.target.closest('.wf-row')?.querySelector('.wf-approval-reason');
      if (reasonInput) reasonInput.hidden = !e.target.checked;
      return;
    }

    // ---- V47：工作流程編輯器 ----
    const editBtn = e.target.closest('[data-task-edit]');
    if (editBtn) {
      e.preventDefault();
      const taskId = editBtn.dataset.taskEdit;
      const editorEl = document.getElementById(`wf-editor-${taskId}`);
      if (!editorEl) return;
      const task = lastLoadedTasks.find(t => t.id === taskId);
      if (!task) return;
      const isOpen = !editorEl.hidden;
      if (isOpen) {
        editorEl.hidden = true;
        editorEl.innerHTML = '';
        editBtn.textContent = '✎ 編輯工作流程';
      } else {
        editorEl.innerHTML = buildWorkflowEditorHtml(task);
        let lockedCount = 0;
        while (lockedCount < task.steps.length
          && (task.steps[lockedCount].status === 'done' || task.steps[lockedCount].status === 'rejected')) {
          lockedCount++;
        }
        applyWorkflowEditorSelectValues(editorEl, task.steps.slice(lockedCount));
        editorEl.hidden = false;
        editBtn.textContent = '收合編輯畫面';
      }
      return;
    }

    const addRowBtn = e.target.closest('[data-wf-add-step]');
    if (addRowBtn) {
      e.preventDefault();
      const rowsEl = addRowBtn.closest('.wf-editor-inner')?.querySelector('[data-wf-rows]');
      if (rowsEl) rowsEl.insertAdjacentHTML('beforeend', buildWorkflowEditorRowHtml(null));
      return;
    }

    const removeRowBtn = e.target.closest('[data-wf-remove-step]');
    if (removeRowBtn) {
      e.preventDefault();
      const rowsEl = removeRowBtn.closest('[data-wf-rows]');
      const row = removeRowBtn.closest('.wf-row');
      if (rowsEl && row) {
        // 至少留一列，全部移除的話任務會變成沒有任何可編輯步驟——留一列空白讓
        // 使用者自己填，比讓編輯畫面整個變空白、不知道怎麼繼續填更清楚
        if (rowsEl.querySelectorAll('.wf-row').length > 1) row.remove();
        else row.replaceWith(document.createRange().createContextualFragment(buildWorkflowEditorRowHtml(null)));
      }
      return;
    }

    const cancelEditBtn = e.target.closest('[data-wf-cancel]');
    if (cancelEditBtn) {
      e.preventDefault();
      const taskId = cancelEditBtn.dataset.wfCancel;
      const editorEl = document.getElementById(`wf-editor-${taskId}`);
      const editBtnEl = taskGridEl.querySelector(`[data-task-edit="${taskId}"]`);
      if (editorEl) { editorEl.hidden = true; editorEl.innerHTML = ''; }
      if (editBtnEl) editBtnEl.textContent = '✎ 編輯工作流程';
      return;
    }

    const saveBtn = e.target.closest('[data-wf-save]');
    if (saveBtn) {
      e.preventDefault();
      const taskId = saveBtn.dataset.wfSave;
      const editorEl = document.getElementById(`wf-editor-${taskId}`);
      const statusEl = editorEl?.querySelector(`[data-wf-status-for="${taskId}"]`);
      if (!editorEl) return;
      const rows = [...editorEl.querySelectorAll('[data-wf-rows] .wf-row')];
      const steps = rows.map(row => ({
        deptId: row.querySelector('.wf-dept')?.value || '',
        roleName: row.querySelector('.wf-role-name')?.value.trim() || '',
        roleNick: row.querySelector('.wf-role-nick')?.value.trim() || '',
        description: row.querySelector('.wf-desc')?.value.trim() || '',
        needsApproval: row.querySelector('.wf-needs-approval')?.checked || false,
        approvalReason: row.querySelector('.wf-approval-reason')?.value.trim() || '',
      })).filter(s => s.deptId && s.description);
      if (!steps.length) {
        if (statusEl) { statusEl.textContent = '至少要保留一個步驟（部門與內容都要填）'; statusEl.classList.add('is-error'); }
        return;
      }
      const base = apiBase();
      if (!base) return;
      saveBtn.disabled = true;
      if (statusEl) { statusEl.textContent = '儲存中，可能需要幾秒鐘…'; statusEl.classList.remove('is-error'); }
      try {
        const res = await fetch(`${base}/task-edit-steps`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...adminHeaders() },
          body: JSON.stringify({ taskId, steps }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
        editorEl.hidden = true;
        editorEl.innerHTML = '';
        await loadTaskState(); // 重新整個讀一次，畫面會換成後端拼回來的最終版本（鎖住的前綴＋新的可編輯範圍）
        loadApprovalList(); // 編輯可能讓某個待審批項目被標記成 superseded，或立刻產生新的裁示關卡
        loadBoardState();
        loadAuditLog(); // V47：編輯工作流程本身就是需要被稽核的治理動作
      } catch (err) {
        console.error('儲存工作流程失敗：', err);
        if (statusEl) { statusEl.textContent = `儲存失敗：${err.message || err}`; statusEl.classList.add('is-error'); }
        saveBtn.disabled = false;
      }
      return;
    }

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
        headers: { 'Content-Type': 'application/json', ...adminHeaders() },
        body: JSON.stringify({ taskId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      await loadTaskState(); // 直接整個重新讀一次任務清單，確保畫面跟後端完全一致
      loadApprovalList(); // 取消任務可能連帶關閉一張待審批項目，這裡一併刷新
      loadBoardState(); // 推進下一步如果成功執行了步驟，部門看板也要跟著更新
      loadDeliveryState(); // V48：AI Agent 這一步可能存了新檔案，重新整理交付中心
      loadAuditLog(); // V47：推進/取消都是治理事件，稽核紀錄也要跟著更新
      // V35：後端現在把接下來的步驟丟到背景執行（data.started 為 true），這裡
      // 剛讀回來的狀態可能還沒反映最新進度，上面已經開始的輪詢（每 6 秒）會
      // 自動接手更新。loadTaskState() 剛剛整個重畫過任務卡片，原本抓到的
      // statusEl 已經是被換掉的舊節點，要重新查一次才抓得到畫面上真正顯示的那個。
      if (data.started) {
        const freshStatusEl = taskGridEl.querySelector(`[data-task-status-for="${taskId}"]`);
        if (freshStatusEl) freshStatusEl.textContent = '已在背景繼續執行，過幾秒會自動更新進度…';
      }
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

// V35：任務建立／推進後，實際自動執行是在後端背景跑的（見 cloudflare-worker.js
// 的 continueTaskInBackground／ctx.waitUntil 說明），前端如果只在「按下當下」讀一次
// 狀態，會看到還沒開始跑的舊資料，之後就算後端早就做完了，畫面也不會自己更新。
// 這裡用一個很輕量的輪詢：每 6 秒檢查一次，只有「目前確實有任務在 planning／
// in_progress」時才會真的重新呼叫 /task-list（不會平白無故一直打 API），
// 任務都做完、卡在等董事長裁示、或取消之後，輪詢會自動停止打擾。
//
// V41：董事長回報「進到任務後有看到要核准的地方，但『待我核准』、『各部門上班
// 狀況』沒有即時更新」——查證後確認：這兩塊原本完全沒有被排進任何輪詢，只有
// 頁面第一次載入、或使用者自己觸發某個按鈕（核准／推進下一步…）時才會重新讀取。
// 但背景自動執行（V35）產生新的待審批項目、或完成某個步驟更新部門看板，都是
// 在背景默默發生的，不屬於任何一種前端使用者互動，兩邊都撈不到最新狀態。
// 修法：背景執行還在跑（taskPollingShouldRun 為 true）的同一個輪詢時機，
// 一併重新讀取待審批清單跟部門看板——這兩支都只是輕量的 KV 讀取（不會呼叫
// Gemini，不會增加 API 成本），任務都做完或卡在等裁示之後，輪詢自然一起停止。
setInterval(() => {
  if (taskPollingShouldRun) {
    loadTaskState();
    loadApprovalList();
    loadBoardState();
    loadDeliveryState(); // V48：AI Agent 這一步可能存了新檔案，重新整理交付中心
  }
}, 6000);

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
// V44 更新：對話附件（圖片／影片／檔案）現在會真的持久化保存（DO SQLite
// 或 KV 索引存中繼資料＋Cloudflare R2 存檔案本體），這裡也一併還原附件
// 縮圖／檔案卡片，不再只有文字對話——原本這段註解說的「不會還原附件」
// 已經是 V44 之前的舊限制，見上方 README「V44」版次紀錄。
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
// V44：對話附件現在真的持久化了（DO SQLite/KV 存中繼資料＋R2 存檔案本體，
// 見 cloudflare-worker.js persistChatAttachments），重新整理頁面後可以正確
// 還原之前附過的圖片／影片縮圖與檔案卡片，不再只剩文字——這是 V25 以來
// 一直存在、README 寫得很清楚的已知限制，這一版補上。
function buildAttachmentMediaHtml(att) {
  const base = apiBase();
  if (!base || !att || !att.id) return '';
  const url = `${base}/chat-attachment-file?id=${encodeURIComponent(att.id)}`;
  const mime = att.mimeType || '';
  if (mime.startsWith('image/')) return `<img class="msg-media" src="${url}" alt="董事長附加圖片：${escapeBoardText(att.name || '')}">`;
  if (mime.startsWith('video/')) return `<video class="msg-media" src="${url}" controls></video>`;
  return `
    <div class="file-chip">
      <span class="file-chip-icon">${fileIconSvg()}</span>
      <span class="file-chip-info">
        <span class="file-chip-name">${escapeBoardText(att.name || '未命名檔案')}</span>
        <span class="file-chip-size">${fmtSize(att.sizeBytes || 0)}</span>
      </span>
    </div>`;
}
function buildUserHistoryMessageHtml(text, attachments) {
  const mediaHtml = (attachments || []).map(buildAttachmentMediaHtml).join('');
  return `
      <div class="msg msg-user">
        <span class="ava ava-chairman ava-sm" aria-hidden="true"><span class="ava-glyph">劉</span></span>
        <div class="msg-body">
          <span class="msg-role">董事長</span>
          <div class="msg-media-wrap">
            ${text ? `<p>${escapeBoardText(text)}</p>` : ''}
            ${mediaHtml}
          </div>
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
      m.role === 'model' ? buildGmHistoryMessageHtml(m.text, m.risk, m.subtask, m.task) : buildUserHistoryMessageHtml(m.text, m.attachments)
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

// V34：改成事件代理（綁在 #approvalList 這個共同的父層容器上），而不是替
// 每一顆按鈕個別綁定——因為真實的待審批卡片是 loadApprovalList() 動態插入
// 畫面的，如果還是用「頁面載入當下 querySelectorAll 一次」的寫法，動態卡片
// 上的按鈕永遠不會被綁定，點了完全沒反應。這裡同時涵蓋 3 張示範卡片跟
// 真實卡片兩種情況，用卡片是否有 data-dynamic="true" 決定要呼叫哪一支後端路徑。
const approvalListEl = document.getElementById('approvalList');
if (approvalListEl) {
  approvalListEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('.approval-actions button');
    if (!btn) return;
    const card = document.getElementById(btn.dataset.target);
    if (!card || card.classList.contains('is-resolved')) return;
    const act = btn.dataset.act;
    const note = card.querySelector('.approval-resolved-note');
    const caseTitle = card.querySelector('.approval-case')?.textContent?.trim() || card.id;
    const isDynamic = card.dataset.dynamic === 'true';

    if (isDynamic) {
      // ---- 真實項目：呼叫 /approval-decide，核准／退回會讓後端接著自動把
      // 任務往下推進，「加問」則會保留這張項目繼續待在清單裡，不會消失 ----
      btn.closest('.approval-actions').querySelectorAll('button').forEach(b => b.disabled = true);
      let noteText = act === 'ask' ? '正在送出您的提問…' : '處理中，可能需要幾秒鐘…';
      if (note) { note.className = 'approval-resolved-note show'; note.style.color = 'var(--ink-faint)'; note.textContent = noteText; }
      let askNote = '';
      if (act === 'ask') {
        askNote = window.prompt('想請總經理補充什麼資訊？（會記錄進歷史紀錄，這個項目會繼續留著等您決定）', '') || '';
      }
      const outcome = await submitApprovalItemDecision(card.id, act, askNote);
      if (outcome.ok) {
        if (act === 'ask') {
          // 加問不會終結這張項目，重新整個清單一次，讓「您先前問過」的內容顯示出來
          await loadApprovalList();
        } else {
          card.classList.add('is-resolved');
          if (note) {
            const cls = act === 'approve' ? 'ok' : 'no';
            note.className = `approval-resolved-note show ${cls}`;
            const prefix = act === 'approve' ? '✓ ' : '✕ ';
            note.textContent = `${prefix}已${act === 'approve' ? '核准' : '退回'}，總經理會接著自動處理後續步驟（已存入後端歷史紀錄）`;
          }
          await loadApprovalList(); // 這張項目已經 resolved，重新讀一次會讓它從清單消失
        }
        loadTaskState(); // 核准／退回可能讓任務往下推進了，重新整理任務中心
        loadBoardState(); // 核准的步驟如果真的執行了，部門看板也要跟著更新
        loadDeliveryState(); // V48：AI Agent 這一步可能存了新檔案，重新整理交付中心
        loadApprovalHistory();
        loadAuditLog(); // V47：核准/退回/加問是核心治理事件，稽核紀錄要跟著更新
      } else if (note) {
        note.className = 'approval-resolved-note show';
        note.style.color = 'var(--risk-high)';
        note.textContent = outcome.reason === 'no-endpoint'
          ? '尚未設定後端 Worker 網址，無法處理這筆項目'
          : '處理失敗，請稍後再試一次';
        btn.closest('.approval-actions').querySelectorAll('button').forEach(b => b.disabled = false);
      }
      return;
    }

    // ---- 示範卡片：維持原本 V20 以來的行為，寫入 /approval-action ----
    // 先鎖住卡片、按鈕，避免使用者連點造成重複送出
    card.classList.add('is-resolved');
    card.querySelectorAll('.approval-actions button').forEach(b => b.disabled = true);

    let resultText = '';
    let hireRole = null;
    if (act === 'approve') {
      resultText = '董事長已核准，總經理將繼續往下執行';
      note.className = 'approval-resolved-note show ok';
      if (btn.dataset.target === 'ap-hire') {
        hireRole = {
          name: 'DevOps 工程師',
          nick: '· 小維',
          nameEn: 'DevOps Engineer',
          fn: '負責部署流程與系統維運，監控服務穩定性，是董事長核准後新增的試營運角色，一個月後由總經理回報成效。'
        };
        hireIntoOrg('bc-eng', hireRole);
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

    // V38：招聘案核准後，另外把新角色真的寫回後端，讓組織架構的異動也能撐過
    // 重新整理頁面，不只是待審批歷史紀錄而已。
    if (hireRole) {
      const hireOutcome = await persistHire('bc-eng', hireRole);
      if (hireOutcome.ok) {
        note.textContent += '・新角色已永久保存';
      } else if (hireOutcome.reason === 'no-endpoint') {
        note.textContent += '・新角色僅顯示在畫面上（尚未設定後端 Worker 網址）';
      } else {
        note.textContent += `・新角色保存失敗（${hireOutcome.error || '請稍後再試'}）`;
      }
    }

    updatePendingCountFromDom();
  });
}
loadApprovalList();

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
        headers: { 'Content-Type': 'application/json', ...adminHeaders() },
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
