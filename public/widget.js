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
      ".brainai-stage{display:flex;flex-direction:column;align-items:flex-end;gap:10px}",
      ".brainai-bubble{position:relative;max-width:260px;border:2px solid #e5e7eb;background:#fff;color:#111827;border-radius:40px 40px 4px 40px;padding:12px 20px;font:700 14px/1.35 inherit;box-shadow:0 12px 35px rgba(0,0,0,.15);text-align:center;transition:all 0.3s ease;}",
      ".brainai-chat-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}",
      ".brainai-chat-chip{border:1px solid #d1d5db;background:#fff;color:#111827;border-radius:999px;padding:8px 12px;font:600 13px/1 inherit;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.05);transition:all 0.2s}",
      ".brainai-chat-chip:hover{background:#f9fafb;border-color:#9ca3af}",
      ".brainai-robot{position:relative;width:122px;height:122px;border:0;background:transparent;cursor:pointer;padding:0;filter:drop-shadow(0 18px 34px rgba(17,24,39,.24));animation:brainai-wave 2.4s ease-in-out infinite}",
      ".brainai-robot spline-viewer{width:122px;height:122px;display:block}",
      ".brainai-fallback{display:none;width:90px;height:90px;border-radius:24px;object-fit:cover;background:" + primaryColor + ";color:#fff;align-items:center;justify-content:center;font:900 28px/1 inherit}",
      ".brainai-robot.no-3d .brainai-fallback{display:flex}",
      ".brainai-bot-face{display:none}",
      "@keyframes brainai-wave{0%,100%{transform:translateY(0) rotate(0)}40%{transform:translateY(-5px) rotate(-2deg)}65%{transform:translateY(-2px) rotate(2deg)}}",
      ".brainai-bubble.intro{background:linear-gradient(135deg,#ff6b6b,#845ef7,#3b82f6);background-size:200% 200%;animation:brainai-gradient-shift 3s ease infinite,brainai-pop 0.6s cubic-bezier(.175,.885,.32,1.275) forwards;color:#fff;border:none;font-size:16px;font-weight:800;padding:16px 24px;box-shadow:0 14px 40px rgba(132,94,247,.4);text-align:center;line-height:1.4;}",
      "@keyframes brainai-gradient-shift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}",
      "@keyframes brainai-pop{0%{transform:scale(0.5) translateY(20px);opacity:0}100%{transform:scale(1) translateY(0);opacity:1}}",
      ".brainai-panel{display:none;width:min(390px,calc(100vw - 32px));height:min(590px,calc(100vh - 112px));background:#fff;border:1px solid #e5e7eb;border-radius:18px;box-shadow:0 24px 80px rgba(17,24,39,.24);overflow:hidden}",
      ".brainai-panel.open{display:flex;flex-direction:column}",
      ".brainai-header{background:" + primaryColor + ";color:#fff;padding:15px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px}",
      ".brainai-title{min-width:0;font-size:15px;font-weight:800;line-height:1.2}",
      ".brainai-subtitle{margin-top:2px;font-size:11px;opacity:.82}",
      ".brainai-close{border:0;background:rgba(255,255,255,.18);color:#fff;width:32px;height:32px;border-radius:999px;cursor:pointer;font-size:20px;line-height:1}",
      ".brainai-messages{flex:1;overflow:auto;padding:15px;background:#f9fafb;display:flex;flex-direction:column;gap:10px}",
      ".brainai-message{max-width:84%;padding:10px 12px;border-radius:14px;font-size:14px;line-height:1.42;white-space:pre-wrap;word-break:break-word}",
      ".brainai-assistant{align-self:flex-start;background:#fff;color:#111827;border:1px solid #e5e7eb}",
      ".brainai-user{align-self:flex-end;background:" + primaryColor + ";color:#fff}",
      ".brainai-lead{margin:2px 0 4px;border:1px solid #dbeafe;background:#eff6ff;border-radius:14px;padding:12px}",
      ".brainai-lead p{margin:0 0 10px;font:800 13px/1.3 inherit;color:#1f2937}",
      ".brainai-lead input{width:100%;border:1px solid #cbd5e1;border-radius:10px;padding:9px 10px;margin-top:8px;font:13px inherit;outline:none}",
      ".brainai-lead button{width:100%;border:0;border-radius:10px;background:" + primaryColor + ";color:#fff;margin-top:10px;padding:10px;font:800 13px inherit;cursor:pointer}",
      ".brainai-form{display:flex;gap:8px;padding:12px;border-top:1px solid #e5e7eb;background:#fff}",
      ".brainai-input{flex:1;min-width:0;border:1px solid #d1d5db;border-radius:999px;padding:10px 12px;font:14px inherit;outline:none}",
      ".brainai-input:focus{border-color:" + primaryColor + ";box-shadow:0 0 0 3px rgba(59,130,246,.14)}",
      ".brainai-send{border:0;border-radius:999px;background:" + primaryColor + ";color:#fff;padding:0 16px;font:800 14px inherit;cursor:pointer}",
      ".brainai-send:disabled{opacity:.55;cursor:not-allowed}",
      ".brainai-mic{width:36px;height:36px;flex-shrink:0;border:1px solid #d1d5db;border-radius:50%;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;padding:0}",
      ".brainai-mic.active{background:#fee2e2;border-color:#fca5a5}",
      ".brainai-mic svg{width:16px;height:16px;stroke:currentColor}",
      ".brainai-watermark{border-top:1px solid #eef2f7;background:#fff;padding:7px 12px;text-align:center;font:700 11px/1 inherit;color:#6b7280}",
      ".brainai-watermark a{color:#111827;text-decoration:none}",
      "@media(max-width:520px){.brainai-panel{width:calc(100vw - 24px);height:calc(100vh - 96px)}.brainai-bubble{max-width:220px}.brainai-robot{width:92px;height:92px}.brainai-robot spline-viewer{display:none}.brainai-fallback,.brainai-bot-face{display:flex}}",
      "</style>",
      "<div class='brainai-stage'>",
      "<div class='brainai-panel' role='dialog' aria-label='B9 Automation chat'>",
      "<div class='brainai-header'><div class='brainai-title-wrap'><div class='brainai-title'></div><div class='brainai-subtitle'>Website Chat</div></div><button class='brainai-close' aria-label='Close chat'>&times;</button></div>",
      "<div class='brainai-messages'></div>",
      "<form class='brainai-form'><button type='button' class='brainai-mic' title='Speak'><svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='2'><path stroke-linecap='round' stroke-linejoin='round' d='M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-7V5a3 3 0 016 0v6'/></svg></button><input class='brainai-input' placeholder='Type your message...' autocomplete='off' /><button class='brainai-send' type='submit'>Send</button></form>",
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
      bubble.textContent = "Chat with us";
      if (introTimeout) clearTimeout(introTimeout);
    }

    title.textContent = config.title || DEFAULT_CONFIG.title;
    if (doIntro) {
      var isBottom = config.position.indexOf("top") === -1;
      var isRight = config.position.indexOf("left") === -1;
      var translateX = isRight ? "calc(-50vw + 80px)" : "calc(50vw - 80px)";
      var translateY = isBottom ? "calc(-50vh + 80px)" : "calc(50vh - 80px)";
      root.style.transform = "translate(" + translateX + ", " + translateY + ") scale(2.2)";
      bubble.classList.add("intro");
      bubble.innerHTML = "👋 Hi! How can I help you today?";
      introTimeout = setTimeout(endIntro, 3500);
    } else {
      bubble.textContent = "Chat with us";
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
      var item = document.createElement("div");
      item.className = "brainai-message brainai-" + role;
      item.textContent = text;
      messages.appendChild(item);
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
        }
        messages.dataset.welcomed = "1";
      }
      setTimeout(function () { input.focus(); }, 0);
    }

    function closePanel() {
      panel.classList.remove("open");
      launch.style.display = "block";
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
      var loading = addMessage("assistant", "Thinking...");

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
          loading.textContent = data.response || "No response received.";
          if (data.lead_captured) pendingLead = null;
          if (data.should_capture_lead || (!leadShown && messageCount >= (config.lead_capture_after_messages || 3))) {
            showLeadForm();
          }
        })
        .catch(function (error) {
          loading.textContent = error.message || "Could not connect to B9 Automation.";
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
          if (t) { input.value = (input.value ? input.value + " " : "") + t; input.focus(); }
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
