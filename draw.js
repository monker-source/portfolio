(() => {
  if (window.__SITE_DRAW__) return;
  window.__SITE_DRAW__ = true;

  const CFG = {
    LINE_WIDTH: 4,
    LINE_COLOR: "#111111",
    BTN_COLOR: "#111111",
    MOBILE_MAX: 768,
    HIDE_ON_MOBILE: true,
  };

  if (CFG.HIDE_ON_MOBILE && window.matchMedia(`(max-width:${CFG.MOBILE_MAX}px)`).matches) {
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.id = "site-draw-canvas";
  Object.assign(canvas.style, {
    position: "fixed",
    left: "0",
    top: "0",
    width: "100vw",
    height: "100vh",
    display: "block",
    zIndex: "2147483646",
    pointerEvents: "none",
    touchAction: "none",
    background: "transparent",
  });
  document.body.appendChild(canvas);

  const toggle = document.createElement("button");
  toggle.id = "site-draw-toggle";
  toggle.type = "button";
  toggle.setAttribute("aria-label", "Draw on page");
  toggle.setAttribute("aria-pressed", "false");
  toggle.textContent = "✎";
  Object.assign(toggle.style, {
    position: "fixed",
    right: "1.5rem",
    bottom: "1.5rem",
    width: "3.5rem",
    height: "3.5rem",
    border: "0",
    padding: "0",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.75rem",
    lineHeight: "1",
    cursor: "pointer",
    zIndex: "2147483647",
    pointerEvents: "auto",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "transparent",
    transformOrigin: "center",
    transform: "translateZ(0) rotate(180deg)",
    transition: "transform .5s ease, opacity .2s ease",
    opacity: "0.9",
    userSelect: "none",
    color: CFG.BTN_COLOR,
  });
  document.body.appendChild(toggle);

  const ctx = canvas.getContext("2d", { alpha: true });
  const dpr = () => Math.max(1, window.devicePixelRatio || 1);
  const getScrollY = () =>
    window.pageYOffset ?? document.documentElement.scrollTop ?? document.body.scrollTop ?? 0;
  const getScrollX = () =>
    window.pageXOffset ?? document.documentElement.scrollLeft ?? document.body.scrollLeft ?? 0;

  let active = false;
  let drawing = false;
  let currentStroke = null;
  let activePointerId = null;
  const strokes = [];
  const redoStrokes = [];

  function clearAll() {
    strokes.length = 0;
    redoStrokes.length = 0;
    currentStroke = null;
    drawing = false;
    activePointerId = null;
    redraw();
  }

  function setActive(on) {
    active = !!on;
    toggle.setAttribute("aria-pressed", active ? "true" : "false");
    if (active) {
      canvas.style.pointerEvents = "auto";
      toggle.style.transform = "translateZ(0) rotate(0deg)";
      toggle.style.opacity = "1";
      document.body.style.cursor = "crosshair";
    } else {
      canvas.style.pointerEvents = "none";
      toggle.style.transform = "translateZ(0) rotate(180deg)";
      toggle.style.opacity = "0.9";
      document.body.style.cursor = "";
      clearAll();
    }
  }

  function resizeCanvas() {
    const ratio = dpr();
    const w = Math.round(window.innerWidth * ratio);
    const h = Math.round(window.innerHeight * ratio);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = CFG.LINE_COLOR;
    ctx.lineWidth = CFG.LINE_WIDTH;
    redraw();
  }

  function pagePointFromEvent(e) {
    const v = window.visualViewport;
    const scrollX = getScrollX();
    const scrollY = getScrollY();
    const pageX =
      typeof e.pageX === "number"
        ? e.pageX
        : e.clientX + (v ? v.offsetLeft : 0) + scrollX;
    const pageY =
      typeof e.pageY === "number"
        ? e.pageY
        : e.clientY + (v ? v.offsetTop : 0) + scrollY;
    return { x: pageX, y: pageY };
  }

  function drawStroke(stroke, sx, sy) {
    if (!stroke || stroke.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(stroke[0].x - sx, stroke[0].y - sy);
    for (let i = 1; i < stroke.length; i++) {
      ctx.lineTo(stroke[i].x - sx, stroke[i].y - sy);
    }
    ctx.stroke();
  }

  function redraw() {
    const sx = getScrollX();
    const sy = getScrollY();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < strokes.length; i++) drawStroke(strokes[i], sx, sy);
    if (currentStroke) drawStroke(currentStroke, sx, sy);
  }

  function pushPoint(p) {
    const last = currentStroke[currentStroke.length - 1];
    const dx = p.x - last.x;
    const dy = p.y - last.y;
    if (dx * dx + dy * dy < 0.5) return false;
    currentStroke.push(p);
    return true;
  }

  function endStroke() {
    if (drawing && currentStroke && currentStroke.length > 1) {
      strokes.push(currentStroke);
    }
    drawing = false;
    currentStroke = null;
    activePointerId = null;
    redraw();
  }

  function onPointerDown(e) {
    if (!active) return;
    if (activePointerId !== null) return;
    if (e.button != null && e.button !== 0) return;

    activePointerId = e.pointerId;
    drawing = true;
    currentStroke = [];
    redoStrokes.length = 0;

    const evs = typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : null;
    const first = evs && evs.length ? evs[0] : e;
    currentStroke.push(pagePointFromEvent(first));

    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (_) {}

    e.preventDefault();
    redraw();
  }

  function onPointerMove(e) {
    if (!active || !drawing || !currentStroke) return;
    if (e.pointerId !== activePointerId) return;

    let changed = false;
    const evs = typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : null;
    if (evs && evs.length) {
      for (let i = 0; i < evs.length; i++) {
        if (pushPoint(pagePointFromEvent(evs[i]))) changed = true;
      }
    } else if (pushPoint(pagePointFromEvent(e))) {
      changed = true;
    }

    if (!changed) return;
    e.preventDefault();
    redraw();
  }

  function onPointerUp(e) {
    if (!active) return;
    if (e.pointerId !== activePointerId) return;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch (_) {}
    e.preventDefault();
    endStroke();
  }

  function onPointerCancel(e) {
    if (!active) return;
    if (e.pointerId !== activePointerId) return;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch (_) {}
    endStroke();
  }

  function undo() {
    if (!active) return;
    if (drawing) endStroke();
    if (!strokes.length) return;
    redoStrokes.push(strokes.pop());
    redraw();
  }

  function redo() {
    if (!active) return;
    if (!redoStrokes.length) return;
    strokes.push(redoStrokes.pop());
    redraw();
  }

  function isTypingTarget(el) {
    if (!el) return false;
    const tag = el.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
  }

  toggle.addEventListener("click", (e) => {
    e.preventDefault();
    setActive(!active);
  });

  canvas.addEventListener("pointerdown", onPointerDown, { passive: false });
  canvas.addEventListener("pointermove", onPointerMove, { passive: false });
  canvas.addEventListener("pointerup", onPointerUp, { passive: false });
  canvas.addEventListener("pointercancel", onPointerCancel, { passive: false });

  window.addEventListener("resize", resizeCanvas);
  window.addEventListener(
    "keydown",
    (e) => {
      if (!active) return;
      if (isTypingTarget(e.target)) return;
      const key = (e.key || "").toLowerCase();
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        redo();
      }
    },
    { passive: false }
  );

  let lastSx = -1;
  let lastSy = -1;
  const rafSync = () => {
    const sx = getScrollX();
    const sy = getScrollY();
    if (sx !== lastSx || sy !== lastSy) {
      lastSx = sx;
      lastSy = sy;
      redraw();
    }
    requestAnimationFrame(rafSync);
  };
  requestAnimationFrame(rafSync);

  resizeCanvas();
  setActive(false);
})();
