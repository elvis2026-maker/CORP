// ============================================================
// cloudflare-worker.js — 董事長指揮中心・總經理 AI 代理
// ------------------------------------------------------------
// 這支檔案不是放在您的網站資料夾裡，而是貼到 Cloudflare 的
// Worker 編輯器裡單獨部署。它的工作只有一件事：安全地保管
// Gemini API 金鑰，接住前端送來的訊息，轉發給 Gemini，
// 再把回覆送回前端——金鑰永遠不會出現在瀏覽器看得到的地方。
//
// 部署步驟請看 README.md「V13 設定方法」那一節，這裡只放程式碼。
// ============================================================

// 這裡用「gemini-1.5-flash」，是 2026 年中目前穩定、且在免費方案
// 內可用的模型。如果之後 Google 又調整了免費方案名單，去
// Google AI Studio（https://aistudio.google.com）的價格頁確認
// 目前免費的模型名稱，改這一行就好。
const GEMINI_MODEL = 'gemini-1.5-flash';

// 總經理的人設。可以直接改這段文字調整語氣或補充公司資訊，
// 不需要動下面的程式邏輯。
const SYSTEM_PROMPT = `你是「艾維斯萬能事務所」的總經理，暱稱「小總」。
這是一間由 AI 代理組成的公司，董事長是劉珍維，你直接向董事長彙報。
公司有十大部門：總經理室、Agent 會議室、工程部、產品開發部、設計部、
會計部、成長行銷部、業務部、策略發展部、品質保證部，每個部門有多位
角色（例如除錯工程師「小蟲」、風控官「小控」），你可以在回覆中點名
提到你「已交辦給哪個部門/ 哪位角色處理」。

回覆原則：
- 語氣簡潔、專業、像真的總經理在回報，不要浮誇或過度熱情
- 每次回覆盡量在 3 句話以內，除非董事長要求詳細說明
- 遇到金額、對外發送（合約/Email/發文）、正式上線這類重大決策，
  要標示風險等級（低/中/高風險）並說明理由，並提醒會送到「待審批」
  讓董事長核准，不要自己說已經執行
- 如果董事長附上截圖或圖片，針對圖片內容具體回應，不要打高空
- 你目前還沒有真的連上其他部門的系統，如果董事長問到你无法得知的
  具體數據（例如真實營收數字），要老實說目前還沒接上真實資料來源，
  而不是編造數字`;

export default {
  async fetch(request, env) {
    // ---- CORS：只允許您自己網站的網域呼叫這支 Worker ----
    // 部署後請把 ALLOWED_ORIGIN 換成您實際的網站網址（例如
    // GitHub Pages 網址），可以先留 "*" 測試，正式使用後建議收窄。
    const ALLOWED_ORIGIN = env.ALLOWED_ORIGIN || '*';
    const corsHeaders = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY 尚未設定，請見 README 設定 Worker 密鑰的步驟' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: '請求格式錯誤' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { message, history, images } = body;
    if (!message && (!images || images.length === 0)) {
      return new Response(JSON.stringify({ error: '訊息內容是空的' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ---- 組成 Gemini 的 contents（過去對話 + 這次的訊息與圖片）----
    const contents = [];
    if (Array.isArray(history)) {
      for (const turn of history.slice(-12)) {
        // turn: { role: 'user' | 'model', text: '...' }
        if (!turn || !turn.text) continue;
        contents.push({
          role: turn.role === 'model' ? 'model' : 'user',
          parts: [{ text: turn.text }],
        });
      }
    }

    const currentParts = [];
    if (message) currentParts.push({ text: message });
    if (Array.isArray(images)) {
      for (const img of images.slice(0, 4)) {
        // img: { mimeType: 'image/png', data: '<base64 without data: prefix>' }
        if (!img || !img.data) continue;
        currentParts.push({ inline_data: { mime_type: img.mimeType || 'image/png', data: img.data } });
      }
    }
    contents.push({ role: 'user', parts: currentParts });

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

    let geminiRes;
    try {
      geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 400,
          },
        }),
      });
    } catch (err) {
      console.error('[elvis-gm-api] 呼叫 Gemini 時發生連線例外：', String(err));
      return new Response(JSON.stringify({ error: '連不上 Gemini，請稍後再試', detail: String(err) }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      // 直接印出 Gemini 真正回傳的狀態碼與內容，方便從 Cloudflare Logs 一眼看出原因
      // （常見：400 請求格式或模型名稱錯誤、403 金鑰無效或權限不足、404 模型不存在、
      // 429 額度用完）
      console.error(`[elvis-gm-api] Gemini 回傳 ${geminiRes.status}：${errText}`);
      return new Response(JSON.stringify({ error: 'Gemini 回傳錯誤', status: geminiRes.status, detail: errText }), {
        status: geminiRes.status, // 直接透傳 Gemini 的實際狀態碼，不再統一蓋成 502
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await geminiRes.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim() ||
      '（總經理暫時沒有想法，請換個方式再問一次）';

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  },
};
