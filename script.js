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
    var agentData = [
      { name: "JUTEX", role: "nucleo de coordinacion", core: true },
      { name: "Cerebro", role: "investigacion y sintesis", core: false },
      { name: "Fnanzas", role: "finanzas y metricas", core: false },
      { name: "Hermes", role: "mensajeria y coordinacion", core: false },
      { name: "Ingeniero", role: "automatizacion y control", core: false },
      { name: "WebSoyjuli", role: "desarrollo web", core: false },
      { name: "Jefe", role: "orquestacion de agentes", core: false },
      { name: "Noticias", role: "radar de noticias", core: false },
      { name: "IngenieroGoose", role: "ingenieria y sistemas", core: false },
      { name: "IngenieroZeroClaw", role: "operaciones", core: false }
    ];
    var nodes = [], edges = [];
    var netW = 0, netH = 0, hoverNode = -1;

    function netLayout() {
      nodes = [];
      var cx = netW / 2, cy = netH / 2;
      var rx = Math.min(netW, netH) * 0.36;
      var ry = Math.min(netW, netH) * 0.3;
      agentData.forEach(function (a) {
        if (a.core) {
          nodes.push({ x: cx, y: cy, a: a });
        } else {
          var ang = (nodes.length - 1) / (agentData.length - 1) * Math.PI * 2 - Math.PI / 2;
          nodes.push({
            x: cx + Math.cos(ang) * rx,
            y: cy + Math.sin(ang) * ry,
            a: a
          });
        }
      });
      edges = [];
      for (var i = 1; i < nodes.length; i++) edges.push([0, i]);
      edges.push([4, 5], [2, 6], [1, 2], [3, 6], [7, 1], [4, 9], [8, 5]);
    }

    function netResize() {
      var r = netCanvas.getBoundingClientRect();
      netW = Math.max(200, r.width);
      netH = Math.max(240, r.height);
      netCanvas.width = netW * dpr;
      netCanvas.height = netH * dpr;
      nctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      netLayout();
    }

    function netHud() {
      var el = $("#netHud");
      if (!el) return;
      var nd = hoverNode >= 0 ? nodes[hoverNode] : agentData[0];
      var name = el.children[0], role = el.children[1];
      if (name) name.textContent = nd.name;
      if (role) role.textContent = hoverNode >= 0 ? "/ " + nd.a.role : "/ nucleo central";
    }

    function netFrame() {
      if (!netRunning) return;
      var t = Date.now() / 1000;
      nctx.clearRect(0, 0, netW, netH);
      var i, p;

      for (i = 0; i < edges.length; i++) {
        var a = nodes[edges[i][0]], b = nodes[edges[i][1]];
        var on = hoverNode === edges[i][0] || hoverNode === edges[i][1];
        var grad = nctx.createLinearGradient(a.x, a.y, b.x, b.y);
        grad.addColorStop(0, "rgba(120,170,255," + (on ? 0.55 : 0.14) + ")");
        grad.addColorStop(1, "rgba(80,220,190," + (on ? 0.55 : 0.14) + ")");
        nctx.strokeStyle = grad;
        nctx.lineWidth = on ? 1.6 : 1;
        nctx.beginPath();
        nctx.moveTo(a.x, a.y);
        nctx.lineTo(b.x, b.y);
        nctx.stroke();
        if (!reduced) {
          for (p = 0; p < 2; p++) {
            var ph = (t * 0.4 + p / 2 + i * 0.11) % 1;
            nctx.beginPath();
            nctx.arc(a.x + (b.x - a.x) * ph, a.y + (b.y - a.y) * ph, 2, 0, Math.PI * 2);
            nctx.fillStyle = on ? "#eaf4ff" : "rgba(200,225,255,0.7)";
            nctx.fill();
          }
        }
      }

      for (i = 0; i < nodes.length; i++) {
        var nd = nodes[i];
        var hl = hoverNode === i;
        var breath = 1 + Math.sin(t * 1.4 + i) * 0.06;
        var r = (nd.a.core ? 11 : 7) * breath;
        var glow = nctx.createRadialGradient(nd.x, nd.y, 0, nd.x, nd.y, r * 3.4);
        glow.addColorStop(0, "rgba(140,190,255," + (hl ? 0.4 : 0.18) + ")");
        glow.addColorStop(1, "rgba(140,190,255,0)");
        nctx.fillStyle = glow;
        nctx.beginPath();
        nctx.arc(nd.x, nd.y, r * 3.4, 0, Math.PI * 2);
        nctx.fill();
        nctx.beginPath();
        nctx.arc(nd.x, nd.y, r, 0, Math.PI * 2);
        nctx.fillStyle = nd.a.core ? "#eaf2ff" : (hl ? "#d7e6ff" : "#7fb2ff");
        nctx.fill();
        if (nd.a.core) {
          nctx.beginPath();
          nctx.arc(nd.x, nd.y, r + 5, 0, Math.PI * 2);
          nctx.strokeStyle = "rgba(255,255,255," + (0.4 + 0.2 * Math.sin(t * 2)) + ")";
          nctx.lineWidth = 1;
          nctx.stroke();
        }
        nctx.font = (hl ? "700 " : "500 ") + (nd.a.core ? 12 : 10) + "px Consolas, monospace";
        nctx.textAlign = "center";
        nctx.fillStyle = hl ? "#fff" : "rgba(226,236,255,0.75)";
        nctx.fillText(nd.a.name, nd.x, nd.y + r + 15);
      }

      requestAnimationFrame(netFrame);
    }

    netResize();
    window.addEventListener("resize", netResize);
    netCanvas.addEventListener("mousemove", function (e) {
      var r = netCanvas.getBoundingClientRect();
      var mx = e.clientX - r.left, my = e.clientY - r.top;
      var best = -1, bd = 26;
      for (var i = 0; i < nodes.length; i++) {
        var dx = nodes[i].x - mx, dy = nodes[i].y - my;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < bd) { bd = d; best = i; }
      }
      hoverNode = best;
      netHud();
    });
    netCanvas.addEventListener("mouseleave", function () {
      hoverNode = -1;
      netHud();
    });
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          netRunning = true;
          if (!reduced) netFrame();
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