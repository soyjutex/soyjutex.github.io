(function () {
  "use strict";

  var $ = function (sel, root) {
    return (root || document).querySelector(sel);
  };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  /* ---------- Year ---------- */
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Boot ---------- */
  var boot = $("#boot");
  function endBoot() {
    if (boot) {
      boot.classList.add("done");
      document.body.classList.remove("no-scroll");
      setTimeout(function () { if (boot) boot.remove(); }, 900);
    }
  }
  document.body.classList.add("no-scroll");
  setTimeout(endBoot, reduced ? 400 : 2400);

  /* ---------- Main FX canvas ---------- */
  var canvas = $("#fx");
  var ctx = canvas.getContext("2d");
  var stars = [];
  var meteors = [];
  var sparks = [];
  var trail = [];
  var mouse = { x: -100, y: -100, active: false };
  var dpr = Math.min(2, window.devicePixelRatio || 1);

  function fxResize() {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initStars();
  }

  function initStars() {
    stars = [];
    var count = Math.min(240, Math.floor(window.innerWidth * window.innerHeight / 6500));
    for (var i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.4 + 0.2,
        s: Math.random() * 0.35 + 0.04,
        tw: Math.random() * Math.PI * 2
      });
    }
  }

  function spawnMeteor() {
    if (reduced) return;
    meteors.push({
      x: Math.random() * window.innerWidth * 0.8 + window.innerWidth * 0.1,
      y: Math.random() * window.innerHeight * 0.3,
      vx: -(Math.random() * 3 + 2),
      vy: Math.random() * 2.2 + 1.6,
      life: 1,
      len: 60 + Math.random() * 40
    });
  }

  function burst(x, y, n, color) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2;
      var sp = Math.random() * 4 + 1.5;
      sparks.push({
        x: x, y: y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 1,
        decay: 0.012 + Math.random() * 0.02,
        color: color || "rgba(200,220,255,"
      });
    }
  }

  function drawFx() {
    var W = window.innerWidth, H = window.innerHeight;
    ctx.clearRect(0, 0, W, H);

    for (var i = 0; i < stars.length; i++) {
      var st = stars[i];
      st.y -= st.s;
      if (st.y < -2) { st.y = H + 2; st.x = Math.random() * W; }
      var tw = 0.45 + 0.55 * Math.sin(Date.now() * 0.002 + st.tw);
      if (finePointer && mouse.active) {
        var dx = st.x - mouse.x, dy = st.y - mouse.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < 200 * 200) {
          var d = Math.sqrt(d2) || 1;
          st.x += dx / d * 1.6;
          st.y += dy / d * 1.6;
        }
      }
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(214,228,255," + (0.5 * tw).toFixed(3) + ")";
      ctx.fill();
    }

    if (!reduced) {
      for (var m = meteors.length - 1; m >= 0; m--) {
        var me = meteors[m];
        me.x += me.vx;
        me.y += me.vy;
        me.life -= 0.014;
        if (me.life <= 0 || me.y > H || me.x < -me.len) {
          meteors.splice(m, 1);
          continue;
        }
        var grad = ctx.createLinearGradient(me.x, me.y, me.x + me.vx * me.len, me.y + me.vy * me.len);
        grad.addColorStop(0, "rgba(255,255,255," + (0.9 * me.life).toFixed(3) + ")");
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(me.x, me.y);
        ctx.lineTo(me.x + me.vx * me.len, me.y + me.vy * me.len);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(me.x, me.y, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255," + me.life.toFixed(3) + ")";
        ctx.fill();
      }

      for (var t = trail.length - 1; t >= 0; t--) {
        trail[t].life -= 0.03;
        if (trail[t].life <= 0) { trail.splice(t, 1); continue; }
        var te = trail[t];
        ctx.beginPath();
        ctx.arc(te.x, te.y, te.r * te.life, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(150,200,255," + (te.life * 0.35).toFixed(3) + ")";
        ctx.fill();
      }

      for (var s = sparks.length - 1; s >= 0; s--) {
        var sp = sparks[s];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vy += 0.04;
        sp.vx *= 0.985;
        sp.life -= sp.decay;
        if (sp.life <= 0) { sparks.splice(s, 1); continue; }
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 1.7, 0, Math.PI * 2);
        ctx.fillStyle = sp.color + (sp.life * 0.8).toFixed(3) + ")";
        ctx.fill();
      }
    }

    requestAnimationFrame(drawFx);
  }

  fxResize();
  window.addEventListener("resize", fxResize);
  setInterval(spawnMeteor, 4200);
  drawFx();

  window.addEventListener("mousemove", function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
    if (finePointer && !reduced) {
      trail.push({ x: e.clientX, y: e.clientY, r: 4 + Math.random() * 5, life: 1 });
      if (trail.length > 42) trail.shift();
    }
  });

  window.addEventListener("click", function (e) {
    burst(e.clientX, e.clientY, 26, "rgba(170,205,255,");
  });

  /* ---------- Custom cursor ---------- */
  var dot = $(".cursor-dot");
  var ring = $(".cursor-ring");
  var rx = -100, ry = -100;
  if (dot && ring && finePointer) {
    document.body.classList.add("cursor-on");
    window.addEventListener("mousemove", function (e) {
      dot.style.left = e.clientX - 3 + "px";
      dot.style.top = e.clientY - 3 + "px";
      rx = rx + (e.clientX - rx) * 0.18;
      ry = ry + (e.clientY - ry) * 0.18;
      ring.style.left = rx - 17 + "px";
      ring.style.top = ry - 17 + "px";
    });
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest("a, button, .card, input, .tilt")) {
        document.body.classList.add("cursor-hover");
      }
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest("a, button, .card, input, .tilt")) {
        document.body.classList.remove("cursor-hover");
      }
    });
    setInterval(function () {
      ring.style.left = rx - 17 + "px";
      ring.style.top = ry - 17 + "px";
    }, 16);
  }

  /* ---------- Magnetic ---------- */
  if (finePointer) {
    $$(".magnetic").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.25;
        var y = (e.clientY - r.top - r.height / 2) * 0.25;
        el.style.transform = "translate(" + x + "px," + y + "px)";
      });
      el.addEventListener("mouseleave", function () {
        el.style.transform = "";
      });
    });
  }

  /* ---------- Tilt cards ---------- */
  if (finePointer) {
    $$(".tilt").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = "perspective(700px) rotateX(" + (-py * 6) + "deg) rotateY(" + (px * 6) + "deg) translateY(-4px)";
      });
      card.addEventListener("mouseleave", function () {
        card.style.transform = "";
      });
    });
  }

  /* ---------- Scramble hover ---------- */
  $$(".scramble").forEach(function (el) {
    if (reduced) return;
    var original = el.textContent;
    var glyphs = "!<>-_\\/[]{}—=+*^?#01ABJX";
    el.addEventListener("mouseenter", function () {
      var h = el.offsetHeight + "px";
      el.style.height = h;
      el.style.overflow = "hidden";
      var frame = 0;
      var timer = setInterval(function () {
        var out = "";
        for (var i = 0; i < original.length; i++) {
          if (i < frame) out += original[i];
          else out += glyphs[Math.floor(Math.random() * glyphs.length)];
        }
        el.textContent = out;
        frame += 2;
        if (frame > original.length + 12) {
          clearInterval(timer);
          el.textContent = original;
          el.style.height = "";
          el.style.overflow = "";
        }
      }, 16);
    });
  });

  /* ---------- Reveal on scroll ---------- */
  var revealObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

  $$("[data-reveal]").forEach(function (el) {
    revealObs.observe(el);
  });

  /* ---------- Progress + toTop ---------- */
  var prog = $("#progress");
  var toTop = $("#toTop");
  function onScroll() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var p = max > 0 ? (h.scrollTop / max) * 100 : 0;
    if (prog) prog.style.width = p + "%";
    if (toTop) toTop.classList.toggle("show", h.scrollTop > 600);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* ---------- Active nav ---------- */
  var navLinks = $$(".menu a[data-nav]");
  var sections = [];
  navLinks.forEach(function (link) {
    var sec = document.getElementById(link.getAttribute("href").slice(1));
    if (sec) sections.push(sec);
  });
  var navObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      navLinks.forEach(function (l) {
        l.classList.toggle(
          "active",
          l.getAttribute("href") === "#" + entry.target.id
        );
      });
    });
  }, { rootMargin: "-40% 0px -50% 0px" });
  sections.forEach(function (s) { navObs.observe(s); });

  /* ---------- Burger ---------- */
  var burger = $("#burger");
  var menu = $("#menu");
  if (burger && menu) {
    burger.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      burger.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", String(open));
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        menu.classList.remove("open");
        burger.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Hero console typing ---------- */
  var consoleEl = $("#console");
  var cur = document.createElement("span");
  cur.className = "cursor";
  if (consoleEl) {
    consoleEl.appendChild(cur);
    var lines = [
      "> INIT núcleo ......... OK",
      "> LOAD autopilot ...... OK",
      "> ia_automatizacion.exe OK",
      "> READY — el futuro se ejecuta solo."
    ];
    var li = 0, ci = 0;
    function type() {
      if (reduced) {
        consoleEl.innerHTML = "";
        consoleEl.appendChild(document.createTextNode(lines.join("\n")));
        consoleEl.appendChild(cur);
        return;
      }
      var full = lines[li];
      var visible = full.slice(0, ci);
      consoleEl.innerHTML = "";
      consoleEl.appendChild(document.createTextNode(visible));
      consoleEl.appendChild(cur);
      ci++;
      if (ci > full.length) {
        li++;
        ci = 0;
        if (li >= lines.length) return;
        setTimeout(type, 240);
        return;
      }
      setTimeout(type, 34);
    }
    setTimeout(type, reduced ? 100 : 2600);
  } else if (cur) cur.remove();

  /* ---------- Counters ---------- */
  var statSection = $("#stats");
  var counters = $$("[data-count]");
  if (statSection && counters.length) {
    var done = false;
    var cObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !done) {
          done = true;
          counters.forEach(function (el) {
            var target = parseInt(el.getAttribute("data-count"), 10);
            var start = performance.now();
            var dur = 1400;
            function step(now) {
              var p = Math.min(1, (now - start) / dur);
              p = 1 - Math.pow(1 - p, 3);
              el.textContent = Math.round(target * p);
              if (p < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
          });
        }
      });
    }, { threshold: 0.4 });
    cObs.observe(statSection);
  }

  /* ---------- Mission timer ---------- */
  var timerEl = $("#timer");
  var start = Date.now();
  function tick() {
    if (!timerEl) return;
    var sec = Math.floor((Date.now() - start) / 1000);
    var h = String(Math.floor(sec / 3600)).padStart(2, "0");
    var m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
    var s = String(sec % 60).padStart(2, "0");
    timerEl.textContent = h + ":" + m + ":" + s;
  }
  setInterval(tick, 1000);
  tick();

  /* ---------- Agent network ---------- */
  var netCanvas = $("#agents");
  if (netCanvas) {
    var nctx = netCanvas.getContext("2d");
    var netRunning = false;

    var DEPTS = [
      { key: "VENTAS", name: "Ventas", code: "NOVA", color: "#fbbf24", role: "cualifica · cotiza · cierra la venta" },
      { key: "MARKETING", name: "Marketing", code: "PULSAR", color: "#f472b6", role: "campanas · contenido · alcance" },
      { key: "FINANZAS", name: "Finanzas", code: "LEDGER", color: "#4ade80", role: "cashflow · cobros · control financiero" },
      { key: "LEGAL", name: "Legal", code: "CLAUSE", color: "#a78bfa", role: "contratos · cumplimiento · riesgo" },
      { key: "RRHH", name: "RRHH", code: "HUMAN", color: "#fca5a5", role: "talento · onboarding · cultura" },
      { key: "SOPORTE", name: "Soporte", code: "SAFE", color: "#38bdf8", role: "atencion real al cliente, 24/7" },
      { key: "OPERACIONES", name: "Operaciones", code: "SYNC", color: "#2dd4bf", role: "logistica · supply chain · ejecucion" },
      { key: "DATOS", name: "Datos", code: "ORACLE", color: "#60a5fa", role: "BI · metricas · prediccion" },
      { key: "TECNOLOGIA", name: "Tecnologia", code: "CORE", color: "#94a3b8", role: "integraciones · seguridad · deploy" }
    ];

    var MSGS = [
      ["VENTAS", "FINANZAS", "contrato 332 firmado · emitir cobro"],
      ["VENTAS", "MARKETING", "lead caliente · prioridad alta"],
      ["MARKETING", "DATOS", "audiencia segmentada · pedir modelo"],
      ["FINANZAS", "VENTAS", "credito aprobado · segui el cierre"],
      ["FINANZAS", "OPERACIONES", "pago recibido · libera el envio"],
      ["OPERACIONES", "SOPORTE", "envio en transito · tracking 882"],
      ["SOPORTE", "VENTAS", "upsell detectado · cliente N°98"],
      ["DATOS", "MARKETING", "prediccion demanda Q4 · entregada"],
      ["DATOS", "OPERACIONES", "stock critico · SKU-14"],
      ["LEGAL", "FINANZAS", "terminos verificados · sin riesgo"],
      ["RRHH", "TECNOLOGIA", "onboarding listo · dar accesos"],
      ["TECNOLOGIA", "OPERACIONES", "deploy OK · sistemas en verde"],
      ["OPERACIONES", "FINANZAS", "costo logistica · informado"],
      ["SOPORTE", "OPERACIONES", "reclamo N°41 · necesito tracking"],
      ["TECNOLOGIA", "DATOS", "cluster estable · heartbeat ok"]
    ];

    var nodes = [], edges = [], nodeByKey = {};
    var packets = [], ripples = [];
    var hoverNode = -1, focusNode = -1;
    var netW = 0, netH = 0, msgSent = 0;

    function nodeIndex(key) { return nodeByKey[key]; }
    function activeIdx(idx) { return hoverNode === idx || focusNode === idx; }

    function link(a, b) { edges.push([nodeIndex(a), nodeIndex(b)]); }

    function netLayout() {
      nodes = [];
      nodeByKey = {};
      var cx = netW / 2, cy = netH / 2;
      var r = Math.min(netW, netH) * 0.36;
      nodes.push({ key: "CORE", name: "JUTEX", code: "ORG", color: "#eaf2ff", role: "coordinacion central · todas las areas en sincronia", core: true, x: cx, y: cy });
      nodeByKey.CORE = 0;
      DEPTS.forEach(function (d, i) {
        var ang = i / DEPTS.length * Math.PI * 2 - Math.PI / 2;
        nodes.push({ key: d.key, name: d.name, code: d.code, color: d.color, role: d.role, core: false, x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r });
        nodeByKey[d.key] = i + 1;
      });
      edges = [];
      for (var i = 1; i < nodes.length; i++) edges.push([0, i]);
      link("VENTAS", "FINANZAS");
      link("VENTAS", "MARKETING");
      link("MARKETING", "DATOS");
      link("SOPORTE", "VENTAS");
      link("FINANZAS", "OPERACIONES");
      link("OPERACIONES", "SOPORTE");
      link("OPERACIONES", "DATOS");
      link("OPERACIONES", "TECNOLOGIA");
      link("LEGAL", "FINANZAS");
      link("RRHH", "TECNOLOGIA");
      link("TECNOLOGIA", "DATOS");
    }

    function netResize() {
      var re = netCanvas.getBoundingClientRect();
      netW = Math.max(200, re.width);
      netH = Math.max(240, re.height);
      netCanvas.width = netW * dpr;
      netCanvas.height = netH * dpr;
      nctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      netLayout();
    }

    function netHud() {
      var el = $("#netHud");
      if (!el) return;
      var idx = hoverNode >= 0 ? hoverNode : (focusNode >= 0 ? focusNode : 0);
      var nd = nodes[idx] || nodes[0];
      var name = el.children[0], role = el.children[1];
      if (!name || !role) return;
      if (idx === 0) {
        name.textContent = "JUTEX Core";
        role.textContent = "coordinacion central · todas las areas en sincronia";
      } else {
        name.textContent = nd.name.toUpperCase() + " · " + nd.code;
        role.textContent = nd.role;
      }
    }

    function addLog(afrom, ato, text, color) {
      var log = $("#netLog");
      if (!log) return;
      var d = new Date();
      var time = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0") + ":" + String(d.getSeconds()).padStart(2, "0");
      var div = document.createElement("div");
      div.className = "lmsg";
      div.style.setProperty("--mcolor", color);
      var s = document.createElement("span");
      s.className = "lfrom";
      s.textContent = afrom + " → " + ato;
      div.appendChild(s);
      div.appendChild(document.createTextNode("  " + time + "  " + text));
      log.insertBefore(div, log.firstChild);
      while (log.children.length > 7) log.removeChild(log.lastChild);
    }

    function spawnPacket() {
      if (!netRunning || reduced || !nodes.length) return;
      var msg = MSGS[Math.floor(Math.random() * MSGS.length)];
      var a = nodeIndex(msg[0]), b = nodeIndex(msg[1]);
      if (typeof a !== "number" || typeof b !== "number") return;
      packets.push({ a: a, b: b, text: msg[2], p: 0, speed: 0.0045 + Math.random() * 0.002, color: nodes[a].color });
      msgSent++;
      var ce = $("#cntMsgs"); if (ce) ce.textContent = msgSent;
      addLog(msg[0], msg[1], msg[2], nodes[a].color);
      if (packets.length > 11) packets.shift();
    }

    function hexA(hex, a) {
      var h = hex.replace("#", "");
      var r = parseInt(h.substring(0, 2), 16), g = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16);
      return "rgba(" + r + "," + g + "," + b + "," + a + ")";
    }

    function roundRect(x, y, w, h, rr) {
      nctx.beginPath();
      nctx.moveTo(x + rr, y);
      nctx.arcTo(x + w, y, x + w, y + h, rr);
      nctx.arcTo(x + w, y + h, x, y + h, rr);
      nctx.arcTo(x, y + h, x, y, rr);
      nctx.arcTo(x, y, x + w, y, rr);
      nctx.closePath();
    }

    function pillText(x, y, text, color) {
      nctx.font = "9px Consolas, monospace";
      var w = nctx.measureText(text).width + 12;
      var h = 15;
      var rx = x - w / 2, ry = y - h / 2;
      rx = Math.max(4, Math.min(netW - w - 4, rx));
      nctx.fillStyle = "rgba(4,7,12,0.78)";
      roundRect(rx, ry, w, h, 7);
      nctx.fill();
      nctx.strokeStyle = hexA(color, 0.5);
      nctx.lineWidth = 1;
      roundRect(rx, ry, w, h, 7);
      nctx.stroke();
      nctx.fillStyle = "#dce7ff";
      nctx.textAlign = "center";
      nctx.textBaseline = "middle";
      nctx.fillText(text, rx + w / 2, y + 0.5);
      nctx.textBaseline = "alphabetic";
    }

    function clampLabel(x, text, size, font) {
      nctx.font = size + "px " + font;
      var w = nctx.measureText(text).width;
      var w2 = w / 2;
      return Math.min(netW - w2 - 6, Math.max(w2 + 6, x));
    }

    function netFrame() {
      if (!netRunning) return;
      var t = Date.now() / 1000;
      nctx.clearRect(0, 0, netW, netH);

      var cx = netW / 2, cy = netH / 2;
      var ringR = Math.min(netW, netH) * 0.36;
      var rr;
      nctx.save();
      nctx.strokeStyle = "rgba(255,255,255,0.05)";
      nctx.lineWidth = 1;
      nctx.setLineDash([2, 6]);
      for (rr = 1; rr <= 2; rr++) {
        nctx.beginPath();
        nctx.arc(cx, cy, ringR * rr / 2, 0, Math.PI * 2);
        nctx.stroke();
      }
      nctx.setLineDash([]);
      nctx.beginPath();
      nctx.arc(cx, cy, ringR, 0, Math.PI * 2);
      nctx.strokeStyle = "rgba(120,170,255,0.18)";
      nctx.stroke();
      nctx.restore();

      nctx.save();
      nctx.strokeStyle = "rgba(255,255,255,0.04)";
      nctx.lineWidth = 1;
      for (var k = 1; k < nodes.length; k++) {
        nctx.beginPath();
        nctx.moveTo(cx, cy);
        nctx.lineTo(nodes[k].x, nodes[k].y);
        nctx.stroke();
      }
      nctx.restore();

      var i, j;
      for (i = 0; i < edges.length; i++) {
        var ea = nodes[edges[i][0]], eb = nodes[edges[i][1]];
        var on = activeIdx(edges[i][0]) || activeIdx(edges[i][1]);
        var grad = nctx.createLinearGradient(ea.x, ea.y, eb.x, eb.y);
        grad.addColorStop(0, "rgba(120,170,255," + (on ? 0.6 : 0.13) + ")");
        grad.addColorStop(1, "rgba(80,220,190," + (on ? 0.6 : 0.13) + ")");
        nctx.strokeStyle = grad;
        nctx.lineWidth = on ? 1.8 : 1;
        nctx.beginPath();
        nctx.moveTo(ea.x, ea.y);
        nctx.lineTo(eb.x, eb.y);
        nctx.stroke();
      }

      if (!reduced) {
        for (i = packets.length - 1; i >= 0; i--) {
          var pk = packets[i];
          pk.p += pk.speed;
          if (pk.p >= 1) {
            ripples.push({ x: nodes[pk.b].x, y: nodes[pk.b].y, life: 1 });
            packets.splice(i, 1);
            continue;
          }
          var ax = nodes[pk.a].x, ay = nodes[pk.a].y;
          var bx = nodes[pk.b].x, by = nodes[pk.b].y;
          var dxn = bx - ax, dyn = by - ay;
          var len = Math.sqrt(dxn * dxn + dyn * dyn) || 1;
          var px = ax + dxn * pk.p, py = ay + dyn * pk.p;
          var nx = -dyn / len, ny = dxn / len;
          nctx.beginPath();
          nctx.arc(px, py, 2.6, 0, Math.PI * 2);
          nctx.fillStyle = pk.color;
          nctx.fill();
          var disp = pk.text.length > 26 ? pk.text.slice(0, 26) + "…" : pk.text;
          pillText(px + nx * 14, py + ny * 14, disp, pk.color);
        }

        for (i = ripples.length - 1; i >= 0; i--) {
          var rp = ripples[i];
          rp.life -= 0.035;
          if (rp.life <= 0) { ripples.splice(i, 1); continue; }
          nctx.beginPath();
          nctx.arc(rp.x, rp.y, (1 - rp.life) * 22 + 4, 0, Math.PI * 2);
          nctx.strokeStyle = "rgba(160,210,255," + (rp.life * 0.5).toFixed(3) + ")";
          nctx.lineWidth = 1.4;
          nctx.stroke();
        }
      }

      for (i = 0; i < nodes.length; i++) {
        var nd = nodes[i];
        var hl = activeIdx(i);
        var breath = 1 + Math.sin(t * 1.4 + i) * 0.06;
        var r = (nd.core ? 12 : 8) * breath;
        var gcol = nd.color || "#7fb2ff";
        var cg = nctx.createRadialGradient(nd.x, nd.y, 0, nd.x, nd.y, r * 3.6);
        cg.addColorStop(0, hexA(gcol, hl ? 0.5 : 0.22));
        cg.addColorStop(1, hexA(gcol, 0));
        nctx.fillStyle = cg;
        nctx.beginPath();
        nctx.arc(nd.x, nd.y, r * 3.6, 0, Math.PI * 2);
        nctx.fill();
        nctx.beginPath();
        nctx.arc(nd.x, nd.y, r, 0, Math.PI * 2);
        nctx.fillStyle = nd.core ? "#eaf2ff" : gcol;
        nctx.fill();
        if (nd.core) {
          nctx.beginPath();
          nctx.arc(nd.x, nd.y, r + 5, 0, Math.PI * 2);
          nctx.strokeStyle = "rgba(255,255,255," + (0.35 + 0.2 * Math.sin(t * 2)) + ")";
          nctx.lineWidth = 1;
          nctx.stroke();
        }
        if (hl && !nd.core) {
          nctx.beginPath();
          nctx.arc(nd.x, nd.y, r + 7, 0, Math.PI * 2);
          nctx.strokeStyle = hexA(gcol, 0.9);
          nctx.lineWidth = 1;
          nctx.stroke();
        }
        var label = nd.name.toUpperCase();
        var lx = clampLabel(nd.x, label, nd.core ? 11 : 10, "Consolas, monospace");
        nctx.fillStyle = hl ? "#fff" : "rgba(226,236,255,0.78)";
        nctx.textAlign = "center";
        nctx.fillText(label, lx, nd.y + r + 15);
      }

      requestAnimationFrame(netFrame);
    }

    function nearestNode(mx, my, maxD) {
      var best = -1, bd = maxD;
      for (var i = 0; i < nodes.length; i++) {
        var dx = nodes[i].x - mx, dy = nodes[i].y - my;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < bd) { bd = d; best = i; }
      }
      return best;
    }

    netResize();
    window.addEventListener("resize", netResize);
    setInterval(spawnPacket, 520);

    var cntA = $("#cntAgents"); if (cntA) cntA.textContent = DEPTS.length;
    var cntM = $("#cntMsgs"); if (cntM) cntM.textContent = msgSent;

    var legend = $("#deptLegend");
    if (legend) {
      DEPTS.forEach(function (d) {
        var chip = document.createElement("button");
        chip.className = "dept-chip";
        chip.style.setProperty("--c", d.color);
        var dot = document.createElement("span");
        dot.className = "d-dot";
        var nm = document.createElement("span");
        nm.className = "d-name";
        nm.textContent = d.name;
        var cd = document.createElement("span");
        cd.className = "d-code";
        cd.textContent = d.code;
        chip.appendChild(dot); chip.appendChild(nm); chip.appendChild(cd);
        chip.addEventListener("click", function () {
          var idx = nodeByKey[d.key];
          if (typeof idx === "number") {
            focusNode = idx;
            hoverNode = -1;
            netHud();
            setTimeout(function () { if (focusNode === nodeByKey[d.key]) focusNode = -1; }, 4000);
          }
        });
        legend.appendChild(chip);
      });
    }

    netCanvas.addEventListener("mousemove", function (e) {
      var re = netCanvas.getBoundingClientRect();
      hoverNode = nearestNode(e.clientX - re.left, e.clientY - re.top, 28);
      netHud();
    });
    netCanvas.addEventListener("mouseleave", function () {
      hoverNode = -1;
      netHud();
    });
    netCanvas.addEventListener("click", function (e) {
      var re = netCanvas.getBoundingClientRect();
      var idx = nearestNode(e.clientX - re.left, e.clientY - re.top, 42);
      focusNode = idx >= 0 ? idx : -1;
      hoverNode = -1;
      netHud();
      if (focusNode >= 0) {
        setTimeout(function () { focusNode = -1; netHud(); }, 4000);
      }
    });

    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          netRunning = true;
          netFrame();
        } else {
          netRunning = false;
        }
      });
    }, { threshold: 0.1 }).observe(netCanvas);
  }

  /* ---------- Toasts ---------- */
  var toastWrap = $("#toasts");
  function toast(msg) {
    if (!toastWrap) return;
    var t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    toastWrap.appendChild(t);
    setTimeout(function () {
      t.classList.add("hide");
      setTimeout(function () { t.remove(); }, 350);
    }, 2400);
  }

  /* ---------- Copy buttons ---------- */
  $$(".copy").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy");
      function ok() {
        toast("Copiado: " + text);
      }
      function fail() {
        try {
          var ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
          ok();
        } catch (e) {
          toast("No se pudo copiar");
        }
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(ok).catch(fail);
      } else {
        fail();
      }
    });
  });

  /* ---------- Interactive terminal ---------- */
  var termBody = $("#termBody");
  var termForm = $("#termForm");
  var termCmd = $("#termCmd");

  function termLine(text, cls) {
    var d = document.createElement("div");
    d.className = "ln" + (cls ? " " + cls : "");
    d.textContent = text;
    if (termBody) {
      termBody.appendChild(d);
      termBody.scrollTop = termBody.scrollHeight;
    }
    return d;
  }

  function uptime() {
    var sec = Math.floor((Date.now() - start) / 1000);
    return String(Math.floor(sec / 3600)) + "h " + String(Math.floor((sec % 3600) / 60)) + "m " + String(sec % 60) + "s";
  }

  var commands = {
    help: function () {
      termLine("comandos disponibles:", "warn");
      termLine("  mission         alternativa oficial", "");
      termLine("  pilares         los 3 pilares", "");
      termLine("  status          lectura en vivo del sistema", "");
      termLine("  tools           stack de construccion", "");
      termLine("  github          abrir repositorio", "");
      termLine("  contact         dejar mensaje", "");
      termLine("  clear           limpiar pantalla", "");
      termLine("  [jutex]         ...probalo", "dim");
    },
    mission: function () {
      termLine("> construimos automatizacion impulsada por IA.", "ok");
      termLine("> el futuro no se espera. se ejecuta.", "ok");
    },
    pilares: function () {
      termLine("01 automatizacion — lo que se ejecuta solo, se ejecuta solo", "");
      termLine("02 inteligencia  — modelos que entienden y aprenden", "");
      termLine("03 escala        — crecer sin apretar ningun boton", "");
    },
    status: function () {
      termLine("SISTEMA JUTEX", "ok");
      termLine("  nucleo ............ estable", "ok");
      termLine("  automatizacion .... 100%", "ok");
      termLine("  uptime ............ " + uptime(), "");
      termLine("  estrellas ......... " + stars.length + " renderizadas", "");
    },
    tools: function () {
      termLine("html5 · css3 · es2020 · canvas", "");
      termLine("intersectionobserver · webmanifest · github pages · 0 frameworks", "");
      termLine("vanilla supremacy", "dim");
    },
    github: function () {
      window.open("https://github.com/soyjutex", "_blank", "noopener");
      termLine("abriendo https://github.com/soyjutex ...", "ok");
      toast("Abriendo GitHub");
    },
    contact: function () {
      termLine("escribi a soyjutex@users.noreply.github.com", "");
      termLine("o mejor: abri la terminal y segui jugando.", "dim");
    },
    clear: function () {
      if (termBody) termBody.innerHTML = "";
    },
    whoami: function () {
      termLine("soyjutex — humano al mando. jutex — marca. ingeniero — el agente.", "");
    },
    jutex: function () {
      termLine("es pos...", "dim");
      termLine("SECRETO DESTRABADO: eres epico. ٩(◕‿◕)۶", "ok");
      burst(window.innerWidth / 2, window.innerHeight / 2, 60, "rgba(255,214,120,");
      toast("Secret unlocked");
    }
  };

  if (termForm && termBody) {
    termLine("Bienvenido a JUTEX_OS. Consola interactiva.", "dim");
    termLine("Escribi 'help' y presiona Enter.", "dim");
    termLine(""); 

    termForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var cmd = (termCmd.value || "").trim().toLowerCase();
      termLine("> " + cmd, "dim");
      var fn = commands[cmd];
      if (fn) {
        fn();
      } else if (cmd) {
        termLine("comando no reconocido: '" + cmd + "'. Escribi 'help'.", "err");
      }
      termCmd.value = "";
      if (termBody) termBody.scrollTop = termBody.scrollHeight;
    });
  }

  /* ---------- Type-the-word easter egg ---------- */
  var typed = "";
  window.addEventListener("keydown", function (e) {
    if (!e.key || e.key.length > 1) return;
    typed = (typed + e.key.toLowerCase()).slice(-6);
    if (typed.endsWith("jutex")) {
      burst(window.innerWidth / 2, window.innerHeight * 0.4, 70, "rgba(130,230,255,");
      toast("⌁ JUTEX reconocido");
      typed = "";
    }
  });
})();