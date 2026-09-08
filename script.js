(function () {
  "use strict";

  document.getElementById("year").textContent = new Date().getFullYear();

  var canvas = document.getElementById("stars");
  var ctx = canvas.getContext("2d");
  var stars = [];
  var mouse = { x: 0, y: 0 };
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initStars();
  }

  function initStars() {
    stars = [];
    var count = Math.min(220, Math.floor(canvas.width * canvas.height / 7000));
    for (var i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.4 + 0.2,
        s: Math.random() * 0.35 + 0.05,
        tw: Math.random() * Math.PI * 2
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var px = (mouse.x / canvas.width - 0.5) * -6;
    var py = (mouse.y / canvas.height - 0.5) * -6;
    for (var i = 0; i < stars.length; i++) {
      var st = stars[i];
      st.y -= st.s;
      if (st.y < -2) {
        st.y = canvas.height + 2;
        st.x = Math.random() * canvas.width;
      }
      var alpha = 0.5 + 0.5 * Math.sin(Date.now() * 0.002 + st.tw);
      ctx.beginPath();
      ctx.arc(st.x + px, st.y + py, st.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(220,232,255," + (0.35 * alpha).toFixed(3) + ")";
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("mousemove", function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  if (!reduced) draw();

  var CURSOR = document.createElement("span");
  CURSOR.className = "cursor";
  document.getElementById("console").appendChild(CURSOR);

  var lines = [
    "> INIT BRAIN ...",
    "> LOAD autopilot ...",
    "> ia_automatizacion.exe ... OK",
    "> READY — el futuro se ejecuta solo."
  ];

  var l = 0;
  var c = 0;
  var deleting = false;
  var consoleEl = document.getElementById("console");
  var full;
  var speed = 40;

  function tick() {
    full = lines[l];
    var visible = full.slice(0, c);
    consoleEl.innerHTML = "";
    consoleEl.appendChild(document.createTextNode(visible));
    consoleEl.appendChild(CURSOR);
    if (!deleting) {
      c++;
      if (c > full.length) {
        deleting = true;
        setTimeout(tick, 1400);
        return;
      }
      speed = 40;
    } else {
      c--;
      if (c < 0) {
        deleting = false;
        l++;
        speed = 500;
        if (l >= lines.length) return;
      } else {
        speed = 16;
      }
    }
    setTimeout(tick, speed);
  }
  if (!reduced) setTimeout(tick, 900);

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  document.querySelectorAll("[data-reveal]").forEach(function (el) {
    observer.observe(el);
  });
})();