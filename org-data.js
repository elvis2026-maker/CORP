// ============================================================
// org-data.js — 艾維斯萬能事務所 組織登記表（ORG_REGISTRY）
// ------------------------------------------------------------
// 這份資料是「狀態燈號」「部門即時看板」「組織架構」三個畫面共用的
// 單一資料來源。每個部門只存一筆資料，app.js 會依這份資料 render
// 出三處畫面；要調整任何部門/角色的顯示內容，改這份資料就好，
// 不需要再去 index.html 或 app.js 裡找對應的 HTML 片段。
//
// 陣列順序＝部門編號（num）由小到大，同時也是狀態燈號／部門看板／
// 組織架構三處畫面共用的顯示順序（V12 起三處順序完全一致；V11 時
// 狀態燈號曾用獨立的 lightsOrder 欄位排出跟另外兩處不同的順序，
// 是沿用 V10 既有畫面的既有狀態，V12 已拿掉這個欄位，統一改成
// 都照這份陣列的順序顯示）。
//
// 欄位說明：
//   id          — 部門的唯一識別碼，同時是 board-card 的錨點 id（例如 #bc-gm）
//   num         — 組織架構顯示用的部門編號（01-10），三處畫面共用同一個顯示順序
//   avaClass    — 頭像色系的 CSS class（對應 styles.css 的 .ava-xxx 漸層）
//   glyph       — 頭像裡顯示的單一文字（例如「總」「工」）
//   name        — 部門看板使用的名稱
//   lightsName  — 狀態燈號使用的名稱（多數與 name 相同，僅會議室顯示較短的「會議室」）
//   nameOrg     — 組織架構使用的完整部門名稱（例如「Agent 會議室」）
//   nameEn      — 部門英文名稱
//   nick        — 部門層級的暱稱標籤（例如「· 小總」），用於組織架構標題列與部門看板
//   desc        — 組織架構展開後的部門簡介
//   lights      — { dot, state }：狀態燈號要顯示的顏色與文字
//   board       — { avaState, statusDot, statusLabel, task, progress, metaLeft, metaRight, log }
//                 部門即時看板卡片需要的所有內容，log 是該部門內部的討論紀錄
//   roles       — [{ name, nick, nameEn, fn }]：組織架構展開後的角色清單
//
// 招聘／組織變動的目標流程（詳見 README）：總經理提案 → 董事長於待審批
// 核准 → 正式寫入這份資料 → 三處畫面自動更新，不必再改程式碼。
// ============================================================

const ORG_REGISTRY = [
  {
    "id": "bc-gm",
    "num": "01",
    "avaClass": "ava-gm",
    "glyph": "總",
    "name": "總經理室",
    "lightsName": "總經理室",
    "nameOrg": "總經理室",
    "nameEn": "Governance",
    "nick": "· 小總",
    "desc": "公司的管理層。負責調度部門、標示風險、跨部門協調，是董事長與十個部門之間唯一的窗口——各部門的討論與提案先彙整到這裡，每日 08:30 向董事長晨報，需要裁示的事項才會送進「待您核准」。",
    "lights": {
      "dot": "s-working",
      "state": "調度中"
    },
    "board": {
      "avaState": "is-active",
      "statusDot": "s-working",
      "statusLabel": "調度中",
      "task": "正在彙整<b>網站改版案</b>各部門回覆，準備跟董事長彙報決策建議。",
      "progress": 70,
      "metaLeft": "進度 70%",
      "metaRight": "2 分鐘前更新",
      "log": [
        {
          "who": "總經理",
          "txt": "請業務部先估工時，設計部、工程部同步評估可行性。",
          "time": "14:02"
        },
        {
          "who": "風控官",
          "txt": "新客戶付款紀錄未知，標示中風險，建議先收 30% 訂金。",
          "time": "14:06"
        },
        {
          "who": "部門主管",
          "txt": "工程部與設計部意見一致，MVP 可於 10 個工作天完成。",
          "time": "14:19"
        }
      ]
    },
    "roles": [
      {
        "name": "總經理",
        "nick": "· 小總",
        "nameEn": "General Manager",
        "fn": "調度各部門成員，向董事長彙報並詢問重要決策內容。"
      },
      {
        "name": "風控官",
        "nick": "· 小控",
        "nameEn": "Risk Controller",
        "fn": "為執行中的任務標示低、中、高風險，並說明理由。"
      },
      {
        "name": "部門主管",
        "nick": "· 小督",
        "nameEn": "Department Supervisor",
        "fn": "處理單一或跨部門的問題協調，彙報給總經理。"
      }
    ]
  },
  {
    "id": "bc-meeting",
    "num": "02",
    "avaClass": "ava-meeting",
    "glyph": "議",
    "name": "Agent 會議室",
    "lightsName": "會議室",
    "nameOrg": "Agent 會議室",
    "nameEn": "Meeting Room",
    "nick": "· 小議",
    "desc": "每日 08:00 召集十大部門開晨會；平時當任務需要多部門協作時，也負責把討論收斂成結論，並在意見不一時主持投票。",
    "lights": {
      "dot": "s-meeting",
      "state": "會議中"
    },
    "board": {
      "avaState": "is-meeting",
      "statusDot": "s-meeting",
      "statusLabel": "會議中",
      "task": "產品開發部與設計部針對<b>新版首頁配色</b>意見分歧，投票協調員已開票。",
      "progress": 45,
      "metaLeft": "進度 45%",
      "metaRight": "5 分鐘前更新",
      "log": [
        {
          "who": "會議主持",
          "txt": "已統整兩派方案重點，供投票參考。",
          "time": "13:40"
        },
        {
          "who": "投票協調員",
          "txt": "深色系 2 票、淺色系 2 票，需董事長裁示。",
          "time": "13:55"
        },
        {
          "who": "討論總結秘書",
          "txt": "會議結論將於裁示後同步彙報進度。",
          "time": "13:57"
        }
      ]
    },
    "roles": [
      {
        "name": "會議主持",
        "nick": "· 小議",
        "nameEn": "Meeting Host",
        "fn": "每日 08:00 主持十大部門晨會，統整與會部門的內容，交給總經理彙整成晨報向董事長報告。"
      },
      {
        "name": "討論總結秘書",
        "nick": "· 小結",
        "nameEn": "Discussion Summarizer",
        "fn": "會議結束前跟所有與會者確認結論與進度，同步彙報給董事長。"
      },
      {
        "name": "投票協調員",
        "nick": "· 小票",
        "nameEn": "Voting Coordinator",
        "fn": "當決策出現分歧，主持投票環節並統計結果。"
      },
      {
        "name": "知識庫管理員",
        "nick": "· 小庫",
        "nameEn": "Knowledge Base Manager",
        "fn": "將過去成功案例與溝通紀錄整理成結構化資料，讓全公司持續學習進化。"
      }
    ]
  },
  {
    "id": "bc-eng",
    "num": "03",
    "avaClass": "ava-eng",
    "glyph": "工",
    "name": "工程部",
    "lightsName": "工程部",
    "nameOrg": "工程部",
    "nameEn": "Engineering",
    "nick": "· 小工",
    "desc": "維護網站與產品程式，負責優化、新增功能、對接除錯，並持續評估導入最新的 AI 模型。",
    "lights": {
      "dot": "s-working",
      "state": "排查中"
    },
    "board": {
      "avaState": "is-active",
      "statusDot": "s-working",
      "statusLabel": "執行中",
      "task": "除錯工程師正在排查董事長回報的 <b>Error 500</b> 客戶截圖問題。",
      "progress": 60,
      "metaLeft": "進度 60%",
      "metaRight": "剛剛更新",
      "log": [
        {
          "who": "資安工程師",
          "txt": "已鎖定問題發生在客戶後台的圖片上傳模組。",
          "time": "14:10"
        },
        {
          "who": "除錯工程師",
          "txt": "重現錯誤中，預估 30 分鐘內修復並回報。",
          "time": "14:15"
        }
      ]
    },
    "roles": [
      {
        "name": "資安工程師",
        "nick": "· 小工",
        "nameEn": "Security Engineer",
        "fn": "維護網站與日後開發產品的程式，並負責優化與新增內容。"
      },
      {
        "name": "除錯工程師",
        "nick": "· 小蟲",
        "nameEn": "Debug Engineer",
        "fn": "對接資安工程師完成的內容，專責測試與除錯。"
      },
      {
        "name": "模型調優工程師",
        "nick": "· 小調",
        "nameEn": "Model Optimization Engineer",
        "fn": "評估並整合最新的 AI 模型，導入既有工具庫提升效能。"
      }
    ]
  },
  {
    "id": "bc-product",
    "num": "04",
    "avaClass": "ava-product",
    "glyph": "品",
    "name": "產品開發部",
    "lightsName": "產品開發部",
    "nameOrg": "產品開發部",
    "nameEn": "Product",
    "nick": "· 小品",
    "desc": "自由度最高的部門，專責發想新點子。三位代理人分別從穩健、差異化、快速驗證三種角度提案。",
    "lights": {
      "dot": "s-working",
      "state": "發想中"
    },
    "board": {
      "avaState": "is-active",
      "statusDot": "s-working",
      "statusLabel": "發想中",
      "task": "三位產品代理人正在針對<b>會員訂閱制</b>提出穩健、差異化、快建 MVP 三版提案。",
      "progress": 35,
      "metaLeft": "進度 35%",
      "metaRight": "8 分鐘前更新",
      "log": [
        {
          "who": "代理人 A",
          "txt": "建議先從現有客戶做付費問卷驗證需求。",
          "time": "13:48"
        },
        {
          "who": "代理人 C",
          "txt": "兩週內可做出可點擊的訂閱流程原型。",
          "time": "13:59"
        }
      ]
    },
    "roles": [
      {
        "name": "產品代理人 A・穩健策略",
        "nick": "· 小穩",
        "nameEn": "Stable",
        "fn": "提出風險可控、循序漸進的方案。"
      },
      {
        "name": "產品代理人 B・差異化策略",
        "nick": "· 小異",
        "nameEn": "Differentiation",
        "fn": "從市場空隙發想，找出跟競品不同的切角。"
      },
      {
        "name": "產品代理人 C・快建 MVP",
        "nick": "· 小快",
        "nameEn": "Fast MVP",
        "fn": "用最小成本先做出可驗證的版本。"
      },
      {
        "name": "UX 產品規劃師",
        "nick": "· 小劃",
        "nameEn": "UX Product Planner",
        "fn": "負責需求分析、功能拆解、Roadmap 規劃與 MVP 定義，串接三位代理人的提案。"
      }
    ]
  },
  {
    "id": "bc-design",
    "num": "05",
    "avaClass": "ava-design",
    "glyph": "設",
    "name": "設計部",
    "lightsName": "設計部",
    "nameOrg": "設計部",
    "nameEn": "Design",
    "nick": "· 小設",
    "desc": "視覺與配色分工，可以附上參考圖讓設計師理解你期待的風格。",
    "lights": {
      "dot": "s-meeting",
      "state": "會議中"
    },
    "board": {
      "avaState": "is-meeting",
      "statusDot": "s-meeting",
      "statusLabel": "會議中",
      "task": "視覺設計師與配色設計師依董事長附上的參考圖，調整<b>首頁版面配置</b>。",
      "progress": 50,
      "metaLeft": "進度 50%",
      "metaRight": "6 分鐘前更新",
      "log": [
        {
          "who": "視覺設計師",
          "txt": "已依參考圖抓出版面比例，出兩版排版供選。",
          "time": "13:50"
        },
        {
          "who": "配色設計師",
          "txt": "建議主色調維持品牌紫，強化對比避免過暗。",
          "time": "14:01"
        }
      ]
    },
    "roles": [
      {
        "name": "視覺設計師",
        "nick": "· 小設",
        "nameEn": "Visual Designer",
        "fn": "依文字描述或參考圖，產出版面配置與視覺設計。"
      },
      {
        "name": "配色設計師",
        "nick": "· 小色",
        "nameEn": "Color Designer",
        "fn": "專責配色方案，讓視覺設計的效果加倍。"
      },
      {
        "name": "UI 設計師",
        "nick": "· 小介",
        "nameEn": "UI Designer",
        "fn": "負責介面元件、互動細節與前端可實作的視覺規格。"
      }
    ]
  },
  {
    "id": "bc-accounting",
    "num": "06",
    "avaClass": "ava-acct",
    "glyph": "計",
    "name": "會計部",
    "lightsName": "會計部",
    "nameOrg": "會計部",
    "nameEn": "Accounting",
    "nick": "· 小計",
    "desc": "統計所有 AI 工具的花費與營收，讓每一分成本跟盈虧都看得見。",
    "lights": {
      "dot": "s-idle",
      "state": "待命"
    },
    "board": {
      "avaState": "",
      "statusDot": "s-idle",
      "statusLabel": "待命",
      "task": "月度財報員已完成本週彙報，等候新案子的成本項目建立。",
      "progress": 100,
      "metaLeft": "本週彙報已完成",
      "metaRight": "1 小時前更新",
      "log": [
        {
          "who": "API 成本會計",
          "txt": "本週各模型 API 支出彙整完畢，已同步月度財報員。",
          "time": "10:20"
        },
        {
          "who": "月度財報員",
          "txt": "本週收支平衡，已產出週報供董事長查閱。",
          "time": "10:32"
        }
      ]
    },
    "roles": [
      {
        "name": "API 成本會計",
        "nick": "· 小算",
        "nameEn": "API Cost Accountant",
        "fn": "統計各 AI 模型 API 呼叫產生的所有費用。"
      },
      {
        "name": "訂閱成本會計",
        "nick": "· 小訂",
        "nameEn": "Subscription Cost Accountant",
        "fn": "統計訂閱各項 AI 工具產生的固定支出。"
      },
      {
        "name": "月度財報員",
        "nick": "· 小計",
        "nameEn": "Monthly Financial Reporter",
        "fn": "每月結算營收扣除成本後的盈虧，每週回報即時收支數據。"
      }
    ]
  },
  {
    "id": "bc-growth",
    "num": "07",
    "avaClass": "ava-growth",
    "glyph": "銷",
    "name": "成長行銷部",
    "lightsName": "成長行銷部",
    "nameOrg": "成長行銷部",
    "nameEn": "Growth Marketing",
    "nick": "· 小銷",
    "desc": "社群推廣與 SEO 分析合併為一個部門，從發文、成效分析到搜尋動態與市場機會，一站彙整成長策略。",
    "lights": {
      "dot": "s-working",
      "state": "發文中"
    },
    "board": {
      "avaState": "is-active",
      "statusDot": "s-working",
      "statusLabel": "發文中",
      "task": "文案代理人今日第 2 則貼文已發布，SEO 分析師同步彙整本週關鍵字變化。",
      "progress": 80,
      "metaLeft": "進度 80%",
      "metaRight": "20 分鐘前更新",
      "log": [
        {
          "who": "文案代理人",
          "txt": "依排程發布主題貼文，明日主題調整為案例分享。",
          "time": "13:30"
        },
        {
          "who": "流量分析師",
          "txt": "互動率較上週提升 12%，建議加碼影片形式。",
          "time": "13:58"
        },
        {
          "who": "市場機會分析師",
          "txt": "發現「AI 工作團隊」搜尋量上升，建議產品部評估。",
          "time": "13:10"
        },
        {
          "who": "SEO 分析師",
          "txt": "網站載入速度已優化，等除錯工程師驗證。",
          "time": "13:44"
        }
      ]
    },
    "roles": [
      {
        "name": "文案代理人",
        "nick": "· 小文",
        "nameEn": "Copywriting Agent",
        "fn": "串接社群平台自動發文，可調整頻率與主題。"
      },
      {
        "name": "流量分析師",
        "nick": "· 小流",
        "nameEn": "Traffic Analyst",
        "fn": "分析發文後的即時數據與主題週期，建議調整方向以提升成效。"
      },
      {
        "name": "SEO 分析師",
        "nick": "· 小析",
        "nameEn": "SEO Analyst",
        "fn": "抓取並檢視自家與競品網站的關鍵字排名、結構與速度，提出優化建議。"
      },
      {
        "name": "市場機會分析師",
        "nick": "· 小機",
        "nameEn": "Market Opportunity Analyst",
        "fn": "找出尚未被滿足的搜尋需求，回報產品開發部評估。"
      }
    ]
  },
  {
    "id": "bc-sales",
    "num": "08",
    "avaClass": "ava-sales",
    "glyph": "業",
    "name": "業務部",
    "lightsName": "業務部",
    "nameOrg": "業務部",
    "nameEn": "Sales &amp; Legal",
    "nick": "· 小業",
    "desc": "從報價、開發到交付追蹤，管理接案的完整生命週期，並納入合約與法遵審核。",
    "lights": {
      "dot": "s-working",
      "state": "估價中"
    },
    "board": {
      "avaState": "is-active",
      "statusDot": "s-working",
      "statusLabel": "估價中",
      "task": "業務策略師正在為<b>網站改版案</b>準備報價單，客戶開發同步追蹤另兩位潛在客戶。",
      "progress": 65,
      "metaLeft": "進度 65%",
      "metaRight": "3 分鐘前更新",
      "log": [
        {
          "who": "業務策略師",
          "txt": "依工程部估算工時完成報價草案，待風控官覆核。",
          "time": "14:12"
        },
        {
          "who": "客戶關係管理",
          "txt": "提醒有 1 位既有客戶合約將於下月到期。",
          "time": "14:20"
        }
      ]
    },
    "roles": [
      {
        "name": "業務策略師",
        "nick": "· 小業",
        "nameEn": "Sales Strategist",
        "fn": "針對客戶擬定報價與提案策略。"
      },
      {
        "name": "客戶開發",
        "nick": "· 小客",
        "nameEn": "Customer Development",
        "fn": "整理潛在客戶名單，追蹤開發進度。"
      },
      {
        "name": "訂單管理",
        "nick": "· 小單",
        "nameEn": "Order Manager",
        "fn": "追蹤簽約後的交付時程與里程碑。"
      },
      {
        "name": "客戶關係管理",
        "nick": "· 小關",
        "nameEn": "CRM",
        "fn": "維護既有客戶關係，提醒續約時機。"
      },
      {
        "name": "營收分析師",
        "nick": "· 小收",
        "nameEn": "Revenue Analyst",
        "fn": "對接會計部，分析案源結構與獲利佔比。"
      },
      {
        "name": "合規審核員",
        "nick": "· 小規",
        "nameEn": "Compliance Reviewer",
        "fn": "審核對外輸出內容的著作權與數據隱私合法性，並確認服務協議條件。"
      },
      {
        "name": "契約管理員",
        "nick": "· 小約",
        "nameEn": "Contract Manager",
        "fn": "自動生成服務條款與各類專案合約，確保事務所權益。"
      },
      {
        "name": "CRM 管理員",
        "nick": "· 小系",
        "nameEn": "CRM Administrator",
        "fn": "維護客戶關係管理系統的資料完整與流程設定，確保各部門資訊同步。"
      },
      {
        "name": "售後客服",
        "nick": "· 小服",
        "nameEn": "Customer Support",
        "fn": "處理交付後的客戶問題與需求，回報常見問題給品質保證部。"
      }
    ]
  },
  {
    "id": "bc-strategy",
    "num": "09",
    "avaClass": "ava-strategy",
    "glyph": "策",
    "name": "策略發展部",
    "lightsName": "策略發展部",
    "nameOrg": "策略發展部",
    "nameEn": "Strategy &amp; Development",
    "nick": "· 小策",
    "desc": "由原投資部整併升級，統整市場研究、AI 趨勢、競品分析、商業模式、產品策略、投資分析與合作評估，為董事長提供全方位的策略判斷。",
    "lights": {
      "dot": "s-off",
      "state": "離線"
    },
    "board": {
      "avaState": "",
      "statusDot": "s-off",
      "statusLabel": "離線",
      "task": "今日尚未啟動，等候董事長下達任務指令。",
      "progress": 0,
      "metaLeft": "尚未啟動",
      "metaRight": "昨日 18:40 最後更新",
      "log": [
        {
          "who": "產品策略顧問",
          "txt": "昨日彙總報告已送出，今日暫無新任務。",
          "time": "昨日 18:40"
        }
      ]
    },
    "roles": [
      {
        "name": "市場研究員",
        "nick": "· 小研",
        "nameEn": "Market Researcher",
        "fn": "研究產業與市場動態，並持續追蹤 AI 趨勢對事務所業務的影響。"
      },
      {
        "name": "競品分析師",
        "nick": "· 小競",
        "nameEn": "Competitor Analyst",
        "fn": "拆解競品的商業模式與定位，找出可借鏡與差異化之處。"
      },
      {
        "name": "產品策略顧問",
        "nick": "· 小略",
        "nameEn": "Product Strategist",
        "fn": "結合市場與競品洞察，提出產品發展方向與定位建議。"
      },
      {
        "name": "投資分析師",
        "nick": "· 小投",
        "nameEn": "Investment Analyst",
        "fn": "評估投資標的與部位風險，形成量化的投資判斷依據。"
      },
      {
        "name": "合作評估專員",
        "nick": "· 小合",
        "nameEn": "Partnership Evaluator",
        "fn": "評估異業合作與策略夥伴機會，彙整綜合建議提報總經理。"
      }
    ]
  },
  {
    "id": "bc-qa",
    "num": "10",
    "avaClass": "ava-qa",
    "glyph": "質",
    "name": "品質保證部",
    "lightsName": "品質保證部",
    "nameOrg": "品質保證部",
    "nameEn": "Quality Assurance",
    "nick": "· 小質",
    "desc": "新設部門。在成果交付前做最終把關，並把客戶回饋轉化為各部門可執行的優化指標。",
    "lights": {
      "dot": "s-working",
      "state": "審核中"
    },
    "board": {
      "avaState": "is-active",
      "statusDot": "s-working",
      "statusLabel": "審核中",
      "task": "首席驗證官正在覆核<b>網站改版案</b>的產出內容，使用者體驗監控員彙整近期客戶回饋。",
      "progress": 40,
      "metaLeft": "進度 40%",
      "metaRight": "10 分鐘前更新",
      "log": [
        {
          "who": "首席驗證官",
          "txt": "初步檢查工程部產出，發現一處文案需與客戶需求核對。",
          "time": "14:05"
        },
        {
          "who": "使用者體驗監控員",
          "txt": "已將上月客戶回饋整理成三項可執行優化建議。",
          "time": "14:30"
        }
      ]
    },
    "roles": [
      {
        "name": "首席驗證官",
        "nick": "· 小質",
        "nameEn": "Chief Verification Officer",
        "fn": "在成果產出前做最終檢查，確保內容、程式碼或設計符合需求與標準，避免 AI 幻覺或不合規內容。"
      },
      {
        "name": "使用者體驗監控員",
        "nick": "· 小驗",
        "nameEn": "UX Monitor",
        "fn": "持續追蹤客戶回饋，將質性評價轉化為各部門可執行的優化指標。"
      },
      {
        "name": "AI 幻覺檢查員",
        "nick": "· 小核",
        "nameEn": "AI Hallucination Checker",
        "fn": "逐項核對各部門產出內容的事實依據，攔截 AI 幻覺與捏造資訊。"
      }
    ]
  }
];
