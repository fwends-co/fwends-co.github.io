// fwends.co — progressive enhancement only. Every page reads and navigates without this file.
(function () {
  "use strict";

  var doc = document.documentElement;
  doc.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // ── Mobile nav ──────────────────────────────────────────────────────────
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");

  if (toggle && nav) {
    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      nav.classList.toggle("is-open", open);
    };

    toggle.addEventListener("click", function () {
      nav.classList.add("is-ready");
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });

    window.matchMedia("(min-width: 821px)").addEventListener("change", function (e) {
      if (e.matches) setOpen(false);
    });
  }

  // ── Reveal on scroll ────────────────────────────────────────────────────
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion.matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  // ── Hero stage: two dots meet, a memory block forms ─────────────────────
  var canvas = document.getElementById("stage-canvas");
  if (canvas && canvas.getContext) runStage(canvas);

  function runStage(canvas) {
    var ctx = canvas.getContext("2d");
    var statusEl = document.getElementById("stage-status");

    var NIGHTGRASS = "#091d13";
    var GREEN = [17, 255, 17];
    var SNOW = "#f7f7f7";
    var STEP_MS = 120;

    var dpr = 1, w = 0, h = 0, pitch = 22, cols = 0, rows = 0, ox = 0, oy = 0;
    var glow = new Float32Array(0);
    var scene = null;
    var raf = 0, running = false, visible = true;

    function rand(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }

    function setStatus(text) {
      if (statusEl && statusEl.textContent !== text) statusEl.textContent = text;
    }

    function measure() {
      var rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pitch = w < 560 ? 18 : 22;
      cols = Math.floor(w / pitch);
      rows = Math.floor(h / pitch);
      ox = (w - (cols - 1) * pitch) / 2;
      oy = (h - (rows - 1) * pitch) / 2 - pitch * 0.6;
      glow = new Float32Array(cols * rows);
    }

    function newScene() {
      // Meet somewhere in the middle band, clear of the HUD at the bottom.
      var usableRows = Math.max(6, rows - 4);
      var meet = { c: rand(Math.floor(cols * 0.38), Math.ceil(cols * 0.62)), r: rand(4, Math.max(4, usableRows - 2)) };
      var a = { c: rand(1, Math.max(1, Math.floor(cols * 0.18))), r: rand(1, usableRows - 1) };
      var b = { c: rand(Math.ceil(cols * 0.82), cols - 2), r: rand(1, usableRows - 1) };
      return {
        phase: "walk",
        t0: performance.now(),
        lastStep: 0,
        meet: meet,
        agents: [
          { c: a.c, r: a.r, tc: meet.c - 1, tr: meet.r },
          { c: b.c, r: b.r, tc: meet.c + 1, tr: meet.r }
        ],
        block: [],
        blockShown: 0
      };
    }

    function buildBlock(s) {
      // A 3×3 memory block above the meeting point, filled in a spiral-ish order.
      var cells = [];
      var top = s.meet.r - 4;
      if (top < 0) top = s.meet.r + 2;
      var order = [[1, 1], [0, 0], [1, 0], [2, 0], [2, 1], [2, 2], [1, 2], [0, 2], [0, 1]];
      order.forEach(function (o) { cells.push({ c: s.meet.c - 1 + o[0], r: top + o[1] }); });
      return cells;
    }

    function stepAgent(ag) {
      var dc = ag.tc - ag.c, dr = ag.tr - ag.r;
      if (!dc && !dr) return false;
      var horiz = Math.random() < Math.abs(dc) / (Math.abs(dc) + Math.abs(dr));
      if (horiz) ag.c += Math.sign(dc); else ag.r += Math.sign(dr);
      glow[ag.r * cols + ag.c] = Math.max(glow[ag.r * cols + ag.c], 0.55);
      return true;
    }

    function update(now) {
      var s = scene;
      var elapsed = now - s.t0;

      for (var i = 0; i < glow.length; i++) if (glow[i] > 0) glow[i] = Math.max(0, glow[i] - 0.006);

      if (s.phase === "walk") {
        setStatus("two fwends, heading to the same place");
        if (now - s.lastStep > STEP_MS) {
          s.lastStep = now;
          var movedA = stepAgent(s.agents[0]);
          var movedB = stepAgent(s.agents[1]);
          if (!movedA && !movedB) { s.phase = "link"; s.t0 = now; }
        }
      } else if (s.phase === "link") {
        setStatus("linked · in person");
        var radius = elapsed / 38;
        for (var r = 0; r < rows; r++) {
          for (var c = 0; c < cols; c++) {
            var d = Math.hypot(c - s.meet.c, r - s.meet.r);
            var band = Math.abs(d - radius);
            if (band < 1.2) {
              var k = r * cols + c;
              glow[k] = Math.max(glow[k], 0.5 * (1 - band / 1.2) * Math.max(0, 1 - radius / 40));
            }
          }
        }
        if (elapsed > 900) { s.phase = "block"; s.t0 = now; s.block = buildBlock(s); }
      } else if (s.phase === "block") {
        setStatus("memory block · kept by both");
        s.blockShown = Math.min(s.block.length, Math.floor(elapsed / 90) + 1);
        if (elapsed > s.block.length * 90 + 1500) { s.phase = "collect"; s.t0 = now; }
      } else if (s.phase === "collect") {
        setStatus("+1 collectible each");
        if (elapsed > 1700) { s.phase = "fade"; s.t0 = now; }
      } else if (s.phase === "fade") {
        if (elapsed > 600) { scene = newScene(); glow.fill(0); }
      }
    }

    function sceneAlpha() {
      if (scene.phase !== "fade") return 1;
      return Math.max(0, 1 - (performance.now() - scene.t0) / 600);
    }

    function draw() {
      var s = scene;
      var alpha = sceneAlpha();
      ctx.fillStyle = NIGHTGRASS;
      ctx.fillRect(0, 0, w, h);

      // The field
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var g = glow[r * cols + c] * alpha;
          var x = ox + c * pitch, y = oy + r * pitch;
          if (g > 0.02) {
            ctx.fillStyle = "rgba(" + GREEN[0] + "," + GREEN[1] + "," + GREEN[2] + "," + (0.12 + g).toFixed(3) + ")";
            ctx.beginPath(); ctx.arc(x, y, 2 + g * 2, 0, Math.PI * 2); ctx.fill();
          } else {
            ctx.fillStyle = "rgba(255,255,255,0.09)";
            ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill();
          }
        }
      }

      // The memory block
      if (s.blockShown) {
        var size = pitch - 5;
        var pulse = s.phase === "collect" ? 0.5 + 0.5 * Math.sin((performance.now() - s.t0) / 140) : 0;
        for (var i = 0; i < s.blockShown; i++) {
          var cell = s.block[i];
          var bx = ox + cell.c * pitch - size / 2, by = oy + cell.r * pitch - size / 2;
          ctx.globalAlpha = alpha;
          ctx.fillStyle = SNOW;
          roundRect(bx, by, size, size, 4);
          ctx.fill();
          if (i === 0) {
            ctx.fillStyle = "rgba(17,255,17," + (0.75 + 0.25 * pulse).toFixed(3) + ")";
            roundRect(bx + 4, by + 4, size - 8, size - 8, 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        }
        // A thin tether from the block down to the two of them
        var first = s.block[0];
        ctx.strokeStyle = "rgba(17,255,17," + (0.35 * alpha).toFixed(3) + ")";
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        var below = first.r < s.meet.r;
        ctx.moveTo(ox + s.meet.c * pitch, oy + (first.r + (below ? 1.6 : -1.6)) * pitch);
        ctx.lineTo(ox + s.meet.c * pitch, oy + (s.meet.r + (below ? -0.6 : 0.6)) * pitch);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // The two of them
      s.agents.forEach(function (ag) {
        var x = ox + ag.c * pitch, y = oy + ag.r * pitch;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = "rgba(17,255,17,0.18)";
        ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgb(17,255,17)";
        ctx.beginPath(); ctx.arc(x, y, 5.5, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      });
    }

    function roundRect(x, y, wd, ht, rad) {
      ctx.beginPath();
      ctx.moveTo(x + rad, y);
      ctx.arcTo(x + wd, y, x + wd, y + ht, rad);
      ctx.arcTo(x + wd, y + ht, x, y + ht, rad);
      ctx.arcTo(x, y + ht, x, y, rad);
      ctx.arcTo(x, y, x + wd, y, rad);
      ctx.closePath();
    }

    function frame(now) {
      raf = 0;
      if (!running) return;
      update(now);
      draw();
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (running || reduceMotion.matches || !visible || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    // With reduced motion, show the moment that matters and hold it.
    function drawStill() {
      scene = newScene();
      scene.agents.forEach(function (ag) { ag.c = ag.tc; ag.r = ag.tr; });
      scene.phase = "block";
      scene.block = buildBlock(scene);
      scene.blockShown = scene.block.length;
      draw();
      setStatus("linked · memory block kept by both");
    }

    function reset() {
      measure();
      if (reduceMotion.matches) { drawStill(); return; }
      scene = newScene();
      draw();
    }

    reset();
    start();

    var resizeTimer = 0;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        var rect = canvas.getBoundingClientRect();
        if (Math.round(rect.width) !== w || Math.round(rect.height) !== h) reset();
      }, 150);
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start(); else stop();
      }).observe(canvas);
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else start();
    });

    reduceMotion.addEventListener("change", function () {
      stop();
      reset();
      start();
    });
  }
})();
