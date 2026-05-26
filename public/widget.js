(function () {
  if ((window.B9Automation && window.B9Automation.__ready) || (window.BrainAI && window.BrainAI.__ready)) return;

  var DEFAULT_CONFIG = {
    title: "AI Chat",
    businessName: "our business",
    welcome_message: "Welcome to {businessName}. How can I help you?",
    primary_color: "#3b82f6",
    theme_color: "#3b82f6",
    position: "bottom-right",
    enable_3d_robot: true,
    spline_scene_url: "https://prod.spline.design/jxk-XEJksbP0STuI/scene.splinecode",
    fallback_image_url: "",
    suggested_buttons: ["Pricing", "Services", "Book Demo", "Talk to Team"],
    lead_capture_after_messages: 3,
    watermark_enabled: true,
    white_label: false
  };

  function createVisitorId() {
    var key = "brainai_visitor_id";
    var existing = localStorage.getItem(key);
    if (existing) return existing;
    var id = "visitor_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(key, id);
    return id;
  }

  function positionStyles(position) {
    var vertical = position && position.indexOf("top") === 0 ? "top: 20px;" : "bottom: 20px;";
    var horizontal = position && position.indexOf("left") > -1 ? "left: 20px;" : "right: 20px;";
    return vertical + horizontal;
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (char) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char];
    });
  }

  function loadSplineScript() {
    if (window.customElements && window.customElements.get("spline-viewer")) return;
    if (document.getElementById("brainai-spline-viewer-script")) return;
    var script = document.createElement("script");
    script.id = "brainai-spline-viewer-script";
    script.type = "module";
    script.src = "https://unpkg.com/@splinetool/viewer@1.12.92/build/spline-viewer.js";
    document.head.appendChild(script);
  }

  function hideSplineLogo(viewer) {
    if (!viewer) return;
    var interval = setInterval(function() {
      var root = viewer.shadowRoot;
      if (root) {
        var style = document.createElement("style");
        style.textContent = "#logo, a, [data-spline-logo], .spline-logo, .logo, .spline-hint, .hint, [part='logo'], [part='button'], [part='hint'], button, .button { display: none !important; opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; }";
        root.appendChild(style);
        clearInterval(interval);
      }
    }, 250);
    setTimeout(function() {
      clearInterval(interval);
    }, 5000);
  }

  function init(options) {
    options = options || {};
    if (!options.assistantId || !options.apiUrl) {
      console.error("B9 Automation widget requires assistantId and apiUrl");
      return;
    }

    var config = Object.assign({}, DEFAULT_CONFIG, options.config || {});
    config.businessName = options.businessName || config.businessName || DEFAULT_CONFIG.businessName;
    config.spline_scene_url = options.splineSceneUrl || config.spline_scene_url;
    var primaryColor = config.theme_color || config.primary_color || DEFAULT_CONFIG.primary_color;
    var welcome = (config.welcome_message || DEFAULT_CONFIG.welcome_message).replace("{businessName}", config.businessName);
    var suggestions = Array.isArray(config.suggested_buttons) && config.suggested_buttons.length ? config.suggested_buttons : DEFAULT_CONFIG.suggested_buttons;

    var existing = document.getElementById("brainai-widget-root");
    if (existing) existing.remove();

    var root = document.createElement("div");
    root.id = "brainai-widget-root";
    root.style.cssText = "position: fixed; z-index: 2147483647; " + positionStyles(config.position);
    document.body.appendChild(root);

    var shadow = root.attachShadow({ mode: "open" });
    var wrapper = document.createElement("div");
    var mobileFallback = config.fallback_image_url
      ? "<img class='brainai-fallback' alt='' src='" + escapeHtml(config.fallback_image_url) + "' />"
      : "<div class='brainai-fallback brainai-bot-face'>AI</div>";

    wrapper.innerHTML = [
      "<style>",
      ":host{all:initial;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827}",
      "*{box-sizing:border-box;letter-spacing:0}",
      /* Stage & bubble */
      ".brainai-stage{display:flex;flex-direction:column;align-items:flex-end;gap:8px}",
      ".brainai-launch{display:flex;flex-direction:column;align-items:center}",
      ".brainai-bubble{position:relative;max-width:240px;background:#fff;color:#111827;border-radius:18px;padding:12px 18px;font:700 14px/1.4 inherit;box-shadow:0 12px 40px rgba(0,0,0,.18);text-align:center;transition:all 0.3s ease;border:1.5px solid rgba(255,255,255,.9);backdrop-filter:blur(8px);}",
      ".brainai-bubble::after{content:'';position:absolute;bottom:-9px;left:50%;transform:translateX(-50%);border-left:9px solid transparent;border-right:9px solid transparent;border-top:9px solid #fff;}",
      ".brainai-bubble.intro{background:linear-gradient(135deg,#ff6b6b,#845ef7,#3b82f6);background-size:200% 200%;animation:brainai-gradient-shift 3s ease infinite,brainai-pop 0.5s cubic-bezier(.175,.885,.32,1.275) forwards;color:#fff;border:none;font-size:15px;font-weight:800;padding:14px 22px;box-shadow:0 16px 48px rgba(132,94,247,.45);line-height:1.4;}",
      ".brainai-bubble.intro::after{border-top-color:transparent;}",
      /* Robot */
      ".brainai-robot{position:relative;width:122px;height:122px;border:0;background:transparent;cursor:pointer;padding:0;filter:drop-shadow(0 18px 34px rgba(17,24,39,.24));animation:brainai-wave 2.4s ease-in-out infinite}",
      ".brainai-robot spline-viewer{width:122px;height:122px;display:block}",
      ".brainai-fallback{display:none;width:90px;height:90px;border-radius:24px;object-fit:cover;background:" + primaryColor + ";color:#fff;align-items:center;justify-content:center;font:900 28px/1 inherit}",
      ".brainai-robot.no-3d .brainai-fallback{display:flex}",
      ".brainai-bot-face{display:none}",
      /* Animations */
      "@keyframes brainai-wave{0%,100%{transform:translateY(0) rotate(0)}40%{transform:translateY(-5px) rotate(-2deg)}65%{transform:translateY(-2px) rotate(2deg)}}",
      "@keyframes brainai-gradient-shift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}",
      "@keyframes brainai-pop{0%{transform:scale(0.5) translateY(20px);opacity:0}100%{transform:scale(1) translateY(0);opacity:1}}",
      "@keyframes brainai-slide-in{0%{opacity:0;transform:translateY(12px) scale(0.96)}100%{opacity:1;transform:translateY(0) scale(1)}}",
      "@keyframes brainai-panel-in{0%{opacity:0;transform:translateY(24px) scale(0.95)}100%{opacity:1;transform:translateY(0) scale(1)}}",
      "@keyframes brainai-dot{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-6px);opacity:1}}",
      /* Panel */
      ".brainai-panel{display:none;width:min(380px,calc(100vw - 32px));height:min(580px,calc(100vh - 112px));background:#fff;border-radius:20px;box-shadow:0 32px 80px rgba(17,24,39,.22),0 0 0 1px rgba(0,0,0,.06);overflow:hidden;transform-origin:bottom right}",
      ".brainai-panel.open{display:flex;flex-direction:column;animation:brainai-panel-in 0.35s cubic-bezier(.175,.885,.32,1.1) forwards}",
      /* Header */
      ".brainai-header{background:linear-gradient(135deg," + primaryColor + " 0%," + primaryColor + "dd 100%);color:#fff;padding:16px 16px;display:flex;align-items:center;gap:12px;position:relative;overflow:hidden}",
      ".brainai-header::before{content:'';position:absolute;top:-40px;right:-40px;width:120px;height:120px;background:rgba(255,255,255,.08);border-radius:50%}",
      ".brainai-header::after{content:'';position:absolute;top:10px;right:60px;width:60px;height:60px;background:rgba(255,255,255,.06);border-radius:50%}",
      ".brainai-avatar{width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:18px;position:relative;z-index:1}",
      ".brainai-online-dot{position:absolute;bottom:1px;right:1px;width:10px;height:10px;background:#22c55e;border-radius:50%;border:2px solid " + primaryColor + ";animation:brainai-pulse-dot 2s ease-in-out infinite}",
      "@keyframes brainai-pulse-dot{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.4)}50%{box-shadow:0 0 0 4px rgba(34,197,94,0)}}",
      ".brainai-title-wrap{flex:1;min-width:0;position:relative;z-index:1}",
      ".brainai-title{font-size:15px;font-weight:800;line-height:1.2}",
      ".brainai-subtitle{margin-top:2px;font-size:11px;opacity:.8;display:flex;align-items:center;gap:4px}",
      ".brainai-subtitle::before{content:'';width:6px;height:6px;background:#22c55e;border-radius:50%;display:inline-block}",
      ".brainai-close{border:0;background:rgba(255,255,255,.15);color:#fff;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:18px;line-height:1;display:flex;align-items:center;justify-content:center;position:relative;z-index:1;transition:background .2s;flex-shrink:0}",
      ".brainai-close:hover{background:rgba(255,255,255,.28)}",
      /* Messages */
      ".brainai-messages{flex:1;overflow-y:auto;padding:16px 14px;background:linear-gradient(180deg,#f8fafc 0%,#f1f5f9 100%);display:flex;flex-direction:column;gap:8px;scroll-behavior:smooth}",
      ".brainai-messages::-webkit-scrollbar{width:4px}",
      ".brainai-messages::-webkit-scrollbar-track{background:transparent}",
      ".brainai-messages::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:99px}",
      ".brainai-msg-row{display:flex;align-items:flex-end;gap:7px;animation:brainai-slide-in 0.3s ease forwards}",
      ".brainai-msg-row.user{flex-direction:row-reverse}",
      ".brainai-msg-avatar{width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg," + primaryColor + "cc," + primaryColor + ");display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;box-shadow:0 2px 8px rgba(0,0,0,.15)}",
      ".brainai-message{max-width:78%;padding:10px 14px;border-radius:18px;font-size:13.5px;line-height:1.5;white-space:pre-wrap;word-break:break-word}",
      ".brainai-assistant{background:#fff;color:#1e293b;border-bottom-left-radius:4px;box-shadow:0 2px 12px rgba(0,0,0,.07);border:1px solid rgba(0,0,0,.05)}",
      ".brainai-user{background:linear-gradient(135deg," + primaryColor + "," + primaryColor + "cc);color:#fff;border-bottom-right-radius:4px;box-shadow:0 4px 14px rgba(59,130,246,.3)}",
      /* Typing indicator */
      ".brainai-typing{display:flex;gap:5px;align-items:center;padding:10px 14px;background:#fff;border-radius:18px;border-bottom-left-radius:4px;box-shadow:0 2px 12px rgba(0,0,0,.07);border:1px solid rgba(0,0,0,.05);width:fit-content}",
      ".brainai-typing span{width:7px;height:7px;background:#94a3b8;border-radius:50%;display:inline-block;animation:brainai-dot 1.2s ease-in-out infinite}",
      ".brainai-typing span:nth-child(2){animation-delay:.2s}",
      ".brainai-typing span:nth-child(3){animation-delay:.4s}",
      /* Chips */
      ".brainai-chat-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:2px;padding-left:33px}",
      ".brainai-chat-chip{border:1.5px solid " + primaryColor + "55;background:rgba(255,255,255,.9);color:" + primaryColor + ";border-radius:999px;padding:7px 13px;font:600 12px/1 inherit;cursor:pointer;transition:all 0.2s;backdrop-filter:blur(4px)}",
      ".brainai-chat-chip:hover{background:" + primaryColor + ";color:#fff;border-color:" + primaryColor + ";transform:translateY(-1px);box-shadow:0 4px 14px " + primaryColor + "44}",
      /* Lead form */
      ".brainai-lead{margin:2px 0 4px;border:1.5px solid #bfdbfe;background:linear-gradient(135deg,#eff6ff,#dbeafe22);border-radius:16px;padding:14px}",
      ".brainai-lead p{margin:0 0 10px;font:700 13px/1.3 inherit;color:#1e40af}",
      ".brainai-lead input{width:100%;border:1.5px solid #bfdbfe;border-radius:10px;padding:9px 11px;margin-top:7px;font:13px inherit;outline:none;transition:border-color .2s}",
      ".brainai-lead input:focus{border-color:" + primaryColor + ";box-shadow:0 0 0 3px " + primaryColor + "22}",
      ".brainai-lead button{width:100%;border:0;border-radius:10px;background:linear-gradient(135deg," + primaryColor + "," + primaryColor + "cc);color:#fff;margin-top:10px;padding:10px;font:800 13px inherit;cursor:pointer;transition:opacity .2s}",
      ".brainai-lead button:hover{opacity:.9}",
      /* Input area */
      ".brainai-form{display:flex;align-items:center;gap:8px;padding:12px 14px;border-top:1px solid #e2e8f0;background:#fff}",
      ".brainai-input{flex:1;min-width:0;border:1.5px solid #e2e8f0;border-radius:999px;padding:10px 14px;font:14px inherit;outline:none;background:#f8fafc;transition:all .2s;color:#1e293b}",
      ".brainai-input:focus{border-color:" + primaryColor + ";background:#fff;box-shadow:0 0 0 3px " + primaryColor + "18}",
      ".brainai-input::placeholder{color:#94a3b8}",
      ".brainai-send{border:0;border-radius:50%;background:linear-gradient(135deg," + primaryColor + "," + primaryColor + "cc);color:#fff;width:38px;height:38px;flex-shrink:0;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;box-shadow:0 4px 12px " + primaryColor + "55}",
      ".brainai-send:hover{transform:scale(1.08);box-shadow:0 6px 18px " + primaryColor + "66}",
      ".brainai-send:disabled{opacity:.45;cursor:not-allowed;transform:none;box-shadow:none}",
      ".brainai-send svg{width:16px;height:16px;fill:#fff}",
      ".brainai-mic{width:36px;height:36px;flex-shrink:0;border:1.5px solid #e2e8f0;border-radius:50%;background:#f8fafc;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;padding:0}",
      ".brainai-mic:hover{border-color:#94a3b8;background:#f1f5f9}",
      ".brainai-mic.active{background:#ef4444;border-color:#ef4444;animation:brainai-pulse-mic 1s ease-in-out infinite}",
      ".brainai-mic.active svg{stroke:#fff}",
      "@keyframes brainai-pulse-mic{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.4)}50%{box-shadow:0 0 0 8px rgba(239,68,68,0)}}",
      ".brainai-mic svg{width:16px;height:16px;stroke:#64748b}",
      /* Watermark */
      ".brainai-watermark{border-top:1px solid #f1f5f9;background:#fff;padding:7px 12px;text-align:center;font:600 10.5px/1 inherit;color:#94a3b8;letter-spacing:.01em}",
      ".brainai-watermark a{color:#64748b;text-decoration:none;font-weight:700}",
      ".brainai-watermark a:hover{color:" + primaryColor + "}",
      /* Mobile */
      "@media(max-width:520px){.brainai-panel{width:calc(100vw - 24px);height:calc(100vh - 96px);border-radius:16px}.brainai-bubble{max-width:220px}.brainai-robot{width:92px;height:92px}.brainai-robot spline-viewer{display:none}.brainai-fallback,.brainai-bot-face{display:flex}}",
      "</style>",
      "<div class='brainai-stage'>",
      "<div class='brainai-panel' role='dialog' aria-label='B9 Automation chat'>",
      "<div class='brainai-header'><div class='brainai-avatar' style='position:relative'>🤖<span class='brainai-online-dot'></span></div><div class='brainai-title-wrap'><div class='brainai-title'></div><div class='brainai-subtitle'>Online now</div></div><button class='brainai-close' aria-label='Close chat'><svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none' viewBox='0 0 24 24' stroke='currentColor' stroke-width='2.5'><path stroke-linecap='round' stroke-linejoin='round' d='M6 18L18 6M6 6l12 12'/></svg></button></div>",
      "<div class='brainai-messages'></div>",
      "<form class='brainai-form'><button type='button' class='brainai-mic' title='Speak'><svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='2'><path stroke-linecap='round' stroke-linejoin='round' d='M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-7V5a3 3 0 016 0v6'/></svg></button><input class='brainai-input' placeholder='Ask me anything...' autocomplete='off' /><button class='brainai-send' type='submit'><svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M2.01 21L23 12 2.01 3 2 10l15 2-15 2z'/></svg></button></form>",
      config.watermark_enabled && !config.white_label ? "<div class='brainai-watermark'>Powered by <a href='https://b9automation.com' target='_blank' rel='noopener'>B9 Automation</a></div>" : "",
      "</div>",
      "<div class='brainai-launch'>",
      "<div class='brainai-bubble'></div>",
      "<button class='brainai-robot' type='button' aria-label='Open chat'></button>",
      "</div>",
      "</div>"
    ].join("");

    shadow.appendChild(wrapper);

    var panel = shadow.querySelector(".brainai-panel");
    var launch = shadow.querySelector(".brainai-launch");
    var robot = shadow.querySelector(".brainai-robot");
    var close = shadow.querySelector(".brainai-close");
    var title = shadow.querySelector(".brainai-title");
    var bubble = shadow.querySelector(".brainai-bubble");
    var messages = shadow.querySelector(".brainai-messages");
    var form = shadow.querySelector(".brainai-form");
    var input = shadow.querySelector(".brainai-input");
    var send = shadow.querySelector(".brainai-send");
    var mic = shadow.querySelector(".brainai-mic");
    var sessionId = null;
    var messageCount = 0;
    var leadShown = false;
    var pendingLead = null;
    var visitorId = createVisitorId();
    var lastUserMessage = "";

    var isMobile = window.matchMedia("(max-width: 520px)").matches;
    var doIntro = config.enable_3d_robot && !isMobile;
    var introTimeout = null;

    root.style.transition = "transform 1.2s cubic-bezier(0.25, 1, 0.5, 1)";

    function endIntro() {
      if (!doIntro) return;
      doIntro = false;
      root.style.transform = "scale(1)";
      bubble.classList.remove("intro");
      bubble.textContent = welcome;
      if (introTimeout) clearTimeout(introTimeout);
    }

    title.textContent = config.title || DEFAULT_CONFIG.title;
    if (doIntro) {
      root.style.transform = "scale(1.3)";
      bubble.classList.add("intro");
      bubble.textContent = welcome;
      introTimeout = setTimeout(endIntro, 3500);
    } else {
      bubble.textContent = welcome;
      root.style.transform = "scale(1)";
    }

    robot.innerHTML = config.enable_3d_robot
      ? "<spline-viewer loading='lazy' url='" + escapeHtml(config.spline_scene_url) + "'></spline-viewer>" + mobileFallback
      : mobileFallback;
    if (!config.enable_3d_robot) robot.classList.add("no-3d");

    if (config.enable_3d_robot && window.matchMedia("(min-width: 521px)").matches) {
      if ("requestIdleCallback" in window) window.requestIdleCallback(loadSplineScript);
      else setTimeout(loadSplineScript, 400);
    }
    
    if (config.enable_3d_robot) {
      hideSplineLogo(robot.querySelector("spline-viewer"));
    }

    function addMessage(role, text) {
      var row = document.createElement("div");
      row.className = "brainai-msg-row " + role;
      var item = document.createElement("div");
      item.className = "brainai-message brainai-" + role;
      if (role === "assistant") {
        var av = document.createElement("div");
        av.className = "brainai-msg-avatar";
        av.textContent = "🤖";
        row.appendChild(av);
        if (text === "Thinking...") {
          item.innerHTML = "<div class='brainai-typing'><span></span><span></span><span></span></div>";
          item.style.padding = "0";
          item.style.background = "none";
          item.style.border = "none";
          item.style.boxShadow = "none";
        } else {
          item.textContent = text;
        }
      } else {
        item.textContent = text;
      }
      row.appendChild(item);
      messages.appendChild(row);
      messages.scrollTop = messages.scrollHeight;
      return item;
    }

    function openPanel() {
      endIntro();
      panel.classList.add("open");
      launch.style.display = "none";
      if (!messages.dataset.welcomed) {
        addMessage("assistant", welcome);
        if (suggestions && suggestions.length > 0) {
          var chipsWrap = document.createElement("div");
          chipsWrap.className = "brainai-chat-chips";
          suggestions.forEach(function (label) {
            var c = document.createElement("button");
            c.type = "button";
            c.className = "brainai-chat-chip";
            c.textContent = label;
            c.addEventListener("click", function () {
              chipsWrap.style.display = "none";
              sendMessage(label);
            });
            chipsWrap.appendChild(c);
          });
          messages.appendChild(chipsWrap);
          messages.scrollTop = messages.scrollHeight;
        }
        messages.dataset.welcomed = "1";
      }
      setTimeout(function () { input.focus(); }, 0);
    }

    function closePanel() {
      panel.classList.remove("open");
      launch.style.display = "flex";
    }

    function showLeadForm() {
      if (leadShown) return;
      leadShown = true;
      var box = document.createElement("form");
      box.className = "brainai-lead";
      box.innerHTML = [
        "<p>Share your details so our team can follow up.</p>",
        "<input name='name' placeholder='Name' required />",
        "<input name='phone' placeholder='Mobile / WhatsApp' required />",
        "<input name='email' placeholder='Email optional' />",
        "<button type='submit'>Continue Chat</button>"
      ].join("");
      box.addEventListener("submit", function (event) {
        event.preventDefault();
        pendingLead = {
          name: box.elements.name.value.trim(),
          phone: box.elements.phone.value.trim(),
          email: box.elements.email.value.trim()
        };
        captureLead(pendingLead);
        box.remove();
        addMessage("assistant", "Thanks. You can continue the chat.");
      });
      messages.appendChild(box);
      messages.scrollTop = messages.scrollHeight;
    }

    function captureLead(lead) {
      if (!lead || (!lead.phone && !lead.email)) return;
      fetch(options.apiUrl.replace(/\/$/, "") + "/api/widget/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          widgetId: options.widgetId || options.assistantId,
          assistantId: options.assistantId,
          conversationId: sessionId,
          visitorId: visitorId,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          message: lastUserMessage
        })
      }).catch(function () {
        // Chat flow continues; backend also receives lead payload with the next message.
      });
    }

    function sendMessage(text) {
      var message = (text || input.value || "").trim();
      if (!message) return;

      input.value = "";
      send.disabled = true;
      messageCount += 1;
      lastUserMessage = message;
      addMessage("user", message);
      var loadingItem = addMessage("assistant", "Thinking...");
      var loading = loadingItem;

      fetch(options.apiUrl.replace(/\/$/, "") + "/api/widgets/" + options.assistantId + "/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-BrainAI-Visitor-Id": visitorId
        },
        body: JSON.stringify({
          message: message,
          session_id: sessionId,
          lead: pendingLead
        })
      })
        .then(function (response) {
          return response.json().then(function (data) {
            if (!response.ok) throw new Error(data.detail || data.message || "Widget request failed");
            return data;
          });
        })
        .then(function (data) {
          sessionId = data.session_id || sessionId;
          loading.style.padding = "";
          loading.style.background = "";
          loading.style.border = "";
          loading.style.boxShadow = "";
          loading.textContent = data.response || "No response received.";
          if (data.lead_captured) pendingLead = null;
          if (data.should_capture_lead || (!leadShown && messageCount >= (config.lead_capture_after_messages || 3))) {
            showLeadForm();
          }
        })
        .catch(function (error) {
          loading.style.padding = "";
          loading.style.background = "";
          loading.style.border = "";
          loading.style.boxShadow = "";
          loading.textContent = error.message || "Could not connect. Please try again.";
        })
        .finally(function () {
          send.disabled = false;
          input.focus();
        });
    }

    robot.addEventListener("click", openPanel);
    close.addEventListener("click", closePanel);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      sendMessage();
    });

    // Microphone / voice input
    var SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      mic.style.display = "none";
    } else {
      var activeRecognition = null;
      mic.addEventListener("click", function () {
        if (activeRecognition) {
          activeRecognition.stop();
          activeRecognition = null;
          mic.classList.remove("active");
          return;
        }
        var r = new SpeechRec();
        r.lang = navigator.language || "hi-IN";
        r.interimResults = false;
        r.continuous = false;
        r.onresult = function (e) {
          var t = e.results && e.results[0] && e.results[0][0] && e.results[0][0].transcript;
          if (t) {
            input.value = t.trim();
            mic.classList.remove("active");
            activeRecognition = null;
            sendMessage();
          }
        };
        r.onerror = function () { mic.classList.remove("active"); activeRecognition = null; };
        r.onend = function () { mic.classList.remove("active"); activeRecognition = null; };
        activeRecognition = r;
        mic.classList.add("active");
        r.start();
      });
    }
  }

  var api = { __ready: true, init: init };
  window.B9Automation = api;
  window.BrainAI = api;
})();
