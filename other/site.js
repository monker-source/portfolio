(function () {
  const SITE = {
    city: "Madison",
    timeZone: "America/Chicago",
    nav: [
      { label: "SASHA", href: "home.html", brand: true },
      { label: "Works", href: "home.html#index" },
      { label: "Fun", href: "fun-stuff/" },
    ],
    footer: {
      id: "contact",
      links: [
        { label: "sasha.sm-v@ya.ru", href: "mailto:sasha.sm-v@ya.ru" },
      ],
    },
  };

  const THEME_KEY = "site-theme";
  const THEMES = [
    { id: "paper", label: "Paper" },
    { id: "black", label: "Black" },
    { id: "colour", label: "Colour" },
    { id: "live", label: "Live" },
  ];

  function pathFromTo(fromDir, toDir) {
    const from = fromDir.replace(/\/$/, "").split("/");
    const to = toDir.replace(/\/$/, "").split("/");
    let i = 0;
    while (i < from.length && i < to.length && from[i] === to[i]) i++;
    return "../".repeat(from.length - i) + to.slice(i).map(function (part) {
      return part + "/";
    }).join("");
  }

  function assetBase() {
    const scripts = document.querySelectorAll("script[src]");
    for (let i = 0; i < scripts.length; i++) {
      const abs = scripts[i].src || "";
      if (!/\/other\/site\.js(\?|$)/.test(abs)) continue;
      const siteRoot = abs.replace(/other\/site\.js(\?.*)?$/, "");
      const pageDir = location.href.split("#")[0].split("?")[0].replace(/[^/]*$/, "");
      return pathFromTo(pageDir, siteRoot);
    }
    return "";
  }

  function siteHref(href) {
    if (!href || href === "#" || /^(https?:|mailto:|\/|#)/.test(href)) {
      return href;
    }
    return assetBase() + href;
  }

  function pageFolder() {
    const ups = (assetBase().match(/\.\.\//g) || []).length;
    const parts = location.pathname.split("/").filter(Boolean);
    if (parts.length && /\.[a-z0-9]+$/i.test(parts[parts.length - 1])) {
      parts.pop();
    }
    if (!ups) return "";
    return parts.slice(parts.length - ups).join("/");
  }

  function navFolder(href) {
    const path = href.split("#")[0].split("?")[0].replace(/\/$/, "");
    if (!path || path === "index.html" || path === "home.html") return "";
    return path.replace(/\/index\.html$/, "");
  }

  function isActive(item) {
    if (item.brand || !item.href || item.href === "#") return false;
    return navFolder(item.href) === pageFolder();
  }

  function findTheme(id) {
    if (id === "blue") id = "colour";
    for (let i = 0; i < THEMES.length; i++) {
      if (THEMES[i].id === id) return THEMES[i];
    }
    return THEMES[0];
  }

  let liveListening = false;
  let liveFrame = 0;
  let liveHue = 180;
  let liveLastX = null;
  let liveLastY = null;
  const LIVE_HUE_PER_PX = 0.02;

  function wrapHue(n) {
    return ((n % 360) + 360) % 360;
  }

  function hsl(h, s, l, alpha) {
    const hue = Math.round(wrapHue(h));
    if (alpha == null) return "hsl(" + hue + " " + s + "% " + l + "%)";
    return "hsl(" + hue + " " + s + "% " + l + "% / " + alpha + ")";
  }

  function relLum(h, s, l) {
    const hue = wrapHue(h);
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = function (n) {
      const k = (n + hue / 30) % 12;
      return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    };
    const rgb = [f(0), f(8), f(4)].map(function (v) {
      return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  }

  function contrastRatio(a, b) {
    const hi = Math.max(a, b);
    const lo = Math.min(a, b);
    return (hi + 0.05) / (lo + 0.05);
  }

  function liveTone(hue, bgLum) {
    const darkC = contrastRatio(relLum(hue, 100, 6), bgLum);
    const lightC = contrastRatio(relLum(hue, 100, 97), bgLum);
    const light = lightC > darkC;
    const l = light ? 97 : 6;
    let s = 100;
    let c = contrastRatio(relLum(hue, s, l), bgLum);
    while (s > 0 && c < 7) {
      s -= 2;
      c = contrastRatio(relLum(hue, s, l), bgLum);
    }
    return { s: s, l: l, c: c, light: light };
  }

  function softenLiveTone(hue, bgLum, tone) {
    const step = tone.light ? -3 : 3;
    const s = Math.min(tone.s, 70);
    let l = tone.l;
    for (let i = 0; i < 10; i++) {
      const next = l + step;
      if (next < 6 || next > 97) break;
      if (contrastRatio(relLum(hue, s, next), bgLum) < 7) break;
      l = next;
    }
    return { s: s, l: l };
  }

  function livePalette() {
    const inkHue = liveHue + 180;
    let fallback = null;
    for (let d = 0; d <= 36; d += 2) {
      const levels = d === 0 ? [42] : [42 - d, 42 + d];
      for (let i = 0; i < levels.length; i++) {
        const bgL = levels[i];
        if (bgL < 10 || bgL > 62) continue;
        const bgLum = relLum(liveHue, 100, bgL);
        const ink = liveTone(inkHue, bgLum);
        const muted = softenLiveTone(inkHue, bgLum, ink);
        const mutedC = contrastRatio(relLum(inkHue, muted.s, muted.l), bgLum);
        const option = { bgL: bgL, ink: ink, muted: muted, mutedC: mutedC };
        if (!fallback || mutedC > fallback.mutedC) fallback = option;
        if (ink.c >= 7 && mutedC >= 7) return option;
      }
    }
    return fallback;
  }

  function paintLive() {
    const root = document.documentElement;
    const palette = livePalette();
    const inkHue = liveHue + 180;
    root.style.setProperty("--color-bg", hsl(liveHue, 100, palette.bgL));
    root.style.setProperty("--color-ink", hsl(inkHue, palette.ink.s, palette.ink.l));
    root.style.setProperty("--color-muted", hsl(inkHue, palette.muted.s, palette.muted.l));
    root.style.setProperty("--color-rule", hsl(inkHue, palette.ink.s, palette.ink.l, 0.35));
  }

  function onLivePointer(event) {
    if (liveLastX != null) {
      const dx = event.clientX - liveLastX;
      const dy = event.clientY - liveLastY;
      liveHue += Math.hypot(dx, dy) * LIVE_HUE_PER_PX;
    }
    liveLastX = event.clientX;
    liveLastY = event.clientY;
    if (liveFrame) return;
    liveFrame = requestAnimationFrame(function () {
      liveFrame = 0;
      paintLive();
    });
  }

  function setLiveTracking(on) {
    if (on) {
      if (!liveListening) {
        window.addEventListener("pointermove", onLivePointer);
        liveListening = true;
      }
      paintLive();
      return;
    }
    if (liveFrame) {
      cancelAnimationFrame(liveFrame);
      liveFrame = 0;
    }
    if (liveListening) {
      window.removeEventListener("pointermove", onLivePointer);
      liveListening = false;
    }
    liveLastX = null;
    liveLastY = null;
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    [
      "--color-bg",
      "--color-ink",
      "--color-muted",
      "--color-rule",
      "--bg",
      "--ink",
      "--muted",
    ].forEach(function (key) {
      root.style.removeProperty(key);
    });

    root.setAttribute("data-theme", theme.id);
    setLiveTracking(theme.id === "live");
    try {
      localStorage.setItem(THEME_KEY, theme.id);
    } catch (_) {}
    document.dispatchEvent(
      new CustomEvent("site-theme", { detail: theme })
    );
  }

  function injectThemeStyles() {
    if (document.getElementById("site-theme-styles")) return;
    const style = document.createElement("style");
    style.id = "site-theme-styles";
    style.textContent = [
      "body > .site-header, .site-header{",
      "position:fixed!important;top:0;left:0;right:0;z-index:40;",
      "background:transparent!important;background-color:transparent!important;",
      "}",
      ".site-nav,.contact-top{",
      "display:grid;",
      "grid-template-columns:var(--cols) var(--end-col, auto);",
      "gap:var(--col-gap);",
      "}",
      ".site-nav{position:relative;align-items:baseline}",
      ".site-nav > a.is-inverted .nav-label{opacity:0}",
      ".nav-contrast{",
      "position:fixed;z-index:50;margin:0;pointer-events:none;",
      "mix-blend-mode:difference;opacity:0;",
      "color:#fff;white-space:nowrap;",
      "user-select:none;-webkit-user-select:none;",
      "}",
      ".nav-end{position:relative;grid-column:-1;justify-self:end;align-self:center;width:max-content}",
      ".theme-swatches{",
      "display:flex;align-items:center;justify-self:end;align-self:center;",
      "gap:var(--gap-stack);margin:0;padding:0;list-style:none;",
      "mix-blend-mode:normal;isolation:isolate;position:relative;z-index:1;",
      "}",
      ".theme-swatch{",
      "width:10px;height:10px;margin:5px;padding:0;border-radius:100%;",
      "border:1px solid #111111;background:var(--swatch);",
      "cursor:pointer;appearance:none;-webkit-appearance:none;",
      "mix-blend-mode:normal;",
      "}",
      ".theme-swatch[aria-pressed='true']{outline:1px solid #111111;outline-offset:2px}",
      ".contact-links{grid-column:3;justify-self:start;text-align:left}",
      ".contact-clock{grid-column:5;justify-self:end}",
      "img.ink-svg{",
      "background:var(--ink)!important;",
      "-webkit-mask:var(--ink-svg) center/contain no-repeat;",
      "mask:var(--ink-svg) center/contain no-repeat;",
      "mask-mode:alpha;",
      "}",
      "@media (max-width:800px){",
      ".site-nav{grid-template-columns:max-content max-content max-content minmax(0,1fr);align-items:center}",
      ".site-nav > a{grid-column:auto;grid-row:1;white-space:nowrap}",
      ".site-nav > .nav-end{grid-column:-1;grid-row:1;justify-self:end;align-self:center}",
      ".contact-top{grid-template-columns:minmax(0,1fr) auto;align-items:baseline}",
      ".contact-links{grid-column:1 / -1;grid-row:1;justify-self:start}",
      ".contact-headline{grid-column:1;grid-row:2;justify-self:start;min-width:0}",
      ".contact-clock{grid-column:2;grid-row:2;justify-self:end}",
      ".contact-spacer{display:none}",
      "}",
    ].join("");
    document.head.appendChild(style);
  }

  function buildThemeSwatches() {
    const end = document.createElement("div");
    end.className = "nav-end";

    const wrap = document.createElement("div");
    wrap.className = "theme-swatches";
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", "Site colour");

    const saved = (function () {
      try {
        return localStorage.getItem(THEME_KEY);
      } catch (_) {
        return null;
      }
    })();
    const active = findTheme(saved);

    THEMES.forEach(function (theme) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "theme-swatch";
      btn.setAttribute("data-theme", theme.id);
      btn.setAttribute("aria-label", theme.label);
      btn.setAttribute("aria-pressed", theme.id === active.id ? "true" : "false");
      btn.addEventListener("click", function () {
        applyTheme(theme);
        wrap.querySelectorAll(".theme-swatch").forEach(function (el) {
          el.setAttribute(
            "aria-pressed",
            el === btn ? "true" : "false"
          );
        });
      });
      wrap.appendChild(btn);
    });

    end.appendChild(wrap);
    return end;
  }

  function buildHeader() {
    const header = document.createElement("header");
    header.className = "site-header";

    const nav = document.createElement("nav");
    nav.className = "site-nav";
    nav.setAttribute("aria-label", "Primary");

    SITE.nav.forEach(function (item) {
      const a = document.createElement("a");
      a.href = siteHref(item.href);
      a.setAttribute("aria-label", item.label);
      if (item.brand) a.classList.add("brand");
      if (isActive(item)) a.classList.add("is-active");

      const label = document.createElement("span");
      label.className = "nav-label";
      label.textContent = item.label;
      a.appendChild(label);
      nav.appendChild(a);
    });

    nav.appendChild(buildThemeSwatches());
    header.appendChild(nav);
    return header;
  }

  function lastUpdateLabel() {
    const parsed = new Date(document.lastModified);
    const when = isNaN(parsed.getTime()) ? new Date() : parsed;
    const day = when.getDate();
    const month = when.toLocaleString("en-US", { month: "long" });
    return "Last update: " + day + " of " + month + ", " + when.getFullYear();
  }

  function buildFooter() {
    const footer = document.createElement("footer");
    footer.className = "contact";
    footer.id = SITE.footer.id;

    const top = document.createElement("div");
    top.className = "contact-top";

    const headline = document.createElement("p");
    headline.className = "contact-headline";
    headline.textContent = lastUpdateLabel();

    const spacer = document.createElement("div");
    spacer.className = "contact-spacer";
    spacer.setAttribute("aria-hidden", "true");

    const links = document.createElement("div");
    links.className = "contact-links";
    SITE.footer.links.forEach(function (item) {
      const a = document.createElement("a");
      a.href = item.href;
      a.textContent = item.label;
      links.appendChild(a);
    });

    const clock = document.createElement("div");
    clock.className = "contact-clock";
    clock.id = "clock-foot";
    clock.textContent = SITE.city + ", —:— —";

    top.append(headline, spacer, links, clock);
    footer.appendChild(top);
    return footer;
  }

  function startClocks() {
    const clock = document.getElementById("clock-foot");
    if (!clock) return;

    function tick() {
      const time = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: SITE.timeZone,
      });
      clock.textContent = SITE.city + ", " + time;
    }

    tick();
    setInterval(tick, 30000);
  }

  function insertBeforeScripts(node) {
    const scripts = document.body.querySelectorAll(":scope > script");
    if (scripts.length) {
      document.body.insertBefore(node, scripts[0]);
    } else {
      document.body.appendChild(node);
    }
  }

  function setupNavReveal() {
    if (!document.body.hasAttribute("data-nav-reveal")) return;
    const header = document.querySelector(".site-header");
    if (!header) return;

    const threshold = 72;
    function update() {
      const show = window.scrollY > threshold;
      header.classList.toggle("is-visible", show);
      header.setAttribute("aria-hidden", show ? "false" : "true");
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  function isProjectPage() {
    return /\/projects\//.test(location.pathname);
  }

  function svgImgSrc(img) {
    const src = img.getAttribute("src") || img.currentSrc || "";
    const path = src.split("?")[0].split("#")[0];
    return /\.svg$/i.test(path) ? src : "";
  }

  function shouldKeepSvgColor(img) {
    return img.hasAttribute("data-keep-color") || !!img.closest("[data-keep-color]");
  }

  function paintInkSvg(img) {
    if (img.dataset.inkSvg === "1" || shouldKeepSvgColor(img)) return;
    const original = svgImgSrc(img);
    if (!original) return;
    const heroOnProject = isProjectPage() && img.closest(".hero");
    const themeBack = img.classList.contains("project-back");
    if (!heroOnProject && !themeBack) return;

    function apply(url, w, h) {
      img.dataset.inkSvg = "1";
      img.classList.add("ink-svg");
      img.style.setProperty("--ink-svg", "url(" + JSON.stringify(url) + ")");
      if (w && h) {
        img.setAttribute("width", String(w));
        img.setAttribute("height", String(h));
      }
      img.src =
        "data:image/svg+xml," +
        encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="' +
            (w || 1) +
            '" height="' +
            (h || 1) +
            '"></svg>'
        );
    }

    if (img.complete && img.naturalWidth) {
      apply(img.currentSrc || original, img.naturalWidth, img.naturalHeight);
      return;
    }

    img.addEventListener(
      "load",
      function () {
        if (img.dataset.inkSvg === "1" || shouldKeepSvgColor(img)) return;
        apply(
          img.currentSrc || original,
          img.naturalWidth,
          img.naturalHeight
        );
      },
      { once: true }
    );
  }

  function paintProjectSvgs(root) {
    if (!root) return;
    const scope = root.querySelectorAll ? root : document;
    if (scope.tagName === "IMG") {
      paintInkSvg(scope);
      return;
    }
    scope.querySelectorAll("img").forEach(paintInkSvg);
  }

  function observeProjectSvgs() {
    if (!document.body) return;
    paintProjectSvgs(document);
    const mo = new MutationObserver(function (records) {
      records.forEach(function (rec) {
        if (rec.type === "attributes" && rec.target && rec.target.tagName === "IMG") {
          paintInkSvg(rec.target);
          return;
        }
        rec.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          paintProjectSvgs(node);
        });
      });
    });
    mo.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src"],
    });
  }

  function readRgb(color) {
    const match = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)/.exec(
      color || ""
    );
    if (!match) return null;
    return {
      r: Math.round(Number(match[1])),
      g: Math.round(Number(match[2])),
      b: Math.round(Number(match[3])),
      a: match[4] == null ? 1 : Number(match[4]),
    };
  }

  function pageColor() {
    const body = readRgb(getComputedStyle(document.body).backgroundColor);
    if (body && body.a > 0) return body;
    return readRgb(getComputedStyle(document.documentElement).backgroundColor);
  }

  function sameRgb(a, b) {
    return Math.abs(a.r - b.r) < 2 && Math.abs(a.g - b.g) < 2 && Math.abs(a.b - b.b) < 2;
  }

  function behindIsContent(x, y, page) {
    const stack = document.elementsFromPoint(x, y);
    for (let i = 0; i < stack.length; i++) {
      const el = stack[i];
      if (
        el.classList &&
        el.classList.contains("nav-contrast")
      ) {
        continue;
      }
      if (el.closest && el.closest(".site-header")) continue;
      const tag = el.tagName;
      if (
        tag === "IMG" ||
        tag === "VIDEO" ||
        tag === "CANVAS" ||
        tag === "SVG" ||
        tag === "PICTURE"
      ) {
        return true;
      }
      const style = getComputedStyle(el);
      if (style.backgroundImage && style.backgroundImage !== "none") return true;
      const bg = readRgb(style.backgroundColor);
      if (!bg || bg.a < 0.05) continue;
      if (bg.a < 0.98) return true;
      return !sameRgb(bg, page);
    }
    return false;
  }

  function coversContent(rect, page) {
    if (!rect.width || !rect.height) return false;
    const insetX = Math.min(2, rect.width / 3);
    const xs = [rect.left + insetX, rect.left + rect.width / 2, rect.right - insetX];
    const ys = [rect.top + 1, rect.top + rect.height / 2, rect.bottom - 1];
    for (let yi = 0; yi < ys.length; yi++) {
      for (let xi = 0; xi < xs.length; xi++) {
        if (behindIsContent(xs[xi], ys[yi], page)) return true;
      }
    }
    return false;
  }

  let contrastFrame = 0;
  let contrastTrack = 0;
  let contrasting = false;

  function textOrigin(el) {
    const range = document.createRange();
    range.selectNodeContents(el);
    if (!range.getClientRects().length) return null;
    const rect = range.getBoundingClientRect();
    return { x: rect.left, y: rect.top };
  }

  function contrastNode(owner, className) {
    if (owner._contrast && owner._contrast.isConnected) return owner._contrast;
    const ghost = document.createElement("span");
    ghost.className = className;
    ghost.setAttribute("aria-hidden", "true");
    document.body.appendChild(ghost);
    owner._contrast = ghost;
    return ghost;
  }

  function menuOpacity() {
    const header = document.querySelector(".site-header");
    if (!header) return 1;
    const value = parseFloat(getComputedStyle(header).opacity);
    return isNaN(value) ? 1 : value;
  }

  function headerSettled() {
    const header = document.querySelector(".site-header");
    if (!header || !document.body.hasAttribute("data-nav-reveal")) return true;
    const style = getComputedStyle(header);
    const opacity = parseFloat(style.opacity);
    if (!header.classList.contains("is-visible")) return opacity === 0;
    return opacity === 1 && style.transform === "none";
  }

  function updateMenuContrast() {
    if (contrasting) return;
    contrasting = true;
    applyMenuContrast();
    contrasting = false;
  }

  function applyMenuContrast() {
    const page = pageColor();
    if (!page) return;
    const shown = menuOpacity();

    document.querySelectorAll(".site-nav > a").forEach(function (link) {
      const label = link.querySelector(".nav-label");
      if (!label) return;
      const rect = label.getBoundingClientRect();
      const on = coversContent(rect, page);
      link.classList.toggle("is-inverted", on);
      const ghost = contrastNode(link, "nav-contrast");
      const style = getComputedStyle(label);
      if (ghost.textContent !== label.textContent) ghost.textContent = label.textContent;
      ghost.style.font = style.font;
      ghost.style.letterSpacing = style.letterSpacing;
      ghost.style.lineHeight = style.lineHeight;
      if (on && shown > 0) {
        ghost.style.display = "block";
        ghost.style.opacity = String(shown);
        ghost.style.left = rect.left + "px";
        ghost.style.top = rect.top + "px";
        const from = textOrigin(label);
        const to = textOrigin(ghost);
        if (from && to) {
          ghost.style.left = rect.left + (from.x - to.x) + "px";
          ghost.style.top = rect.top + (from.y - to.y) + "px";
        }
      } else {
        ghost.style.display = "none";
        ghost.style.opacity = "0";
      }
    });

  }

  function trackMenuContrast() {
    if (contrastTrack) return;
    function tick() {
      updateMenuContrast();
      if (headerSettled()) {
        contrastTrack = 0;
        return;
      }
      contrastTrack = requestAnimationFrame(tick);
    }
    contrastTrack = requestAnimationFrame(tick);
  }

  function scheduleMenuContrast() {
    updateMenuContrast();
    if (contrastFrame) return;
    contrastFrame = requestAnimationFrame(function () {
      contrastFrame = 0;
      updateMenuContrast();
      if (!headerSettled()) trackMenuContrast();
    });
  }

  function watchMenuContrast() {
    scheduleMenuContrast();
    window.addEventListener("scroll", scheduleMenuContrast, { passive: true });
    window.addEventListener("resize", scheduleMenuContrast);
    window.addEventListener("load", scheduleMenuContrast);
    document.addEventListener("site-theme", scheduleMenuContrast);
    if (window.ResizeObserver) {
      const observer = new ResizeObserver(scheduleMenuContrast);
      observer.observe(document.body);
    }
    const changes = new MutationObserver(function (records) {
      for (let i = 0; i < records.length; i++) {
        const target = records[i].target;
        if (
          target.classList &&
          target.classList.contains("nav-contrast")
        ) {
          continue;
        }
        scheduleMenuContrast();
        return;
      }
    });
    changes.observe(document.body, { childList: true, subtree: true });
  }

  function syncEndColumn() {
    const swatches = document.querySelector(".theme-swatches");
    const clock = document.querySelector(".contact-clock");
    const sw = swatches ? swatches.offsetWidth : 0;
    const cw = clock ? clock.offsetWidth : 0;
    const width = Math.ceil(Math.max(sw, cw));
    if (!width) return;
    document.documentElement.style.setProperty("--end-col", width + "px");
  }

  function mount() {
    injectThemeStyles();
    document.body.prepend(buildHeader());

    if (document.body.getAttribute("data-footer") !== "false") {
      insertBeforeScripts(buildFooter());
    }

    startClocks();
    setupNavReveal();
    observeProjectSvgs();
    syncEndColumn();
    watchMenuContrast();
    window.addEventListener("resize", syncEndColumn);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(syncEndColumn);
    }
  }

  const PROJECTS_URL = assetBase() + "projects/projects.json";

  window.SITE = SITE;
  window.SITE_THEMES = THEMES;
  window.applySiteTheme = applyTheme;
  window.PROJECTS_URL = PROJECTS_URL;
  window.PROJECTS = [];

  window.loadProjects = function () {
    return fetch(PROJECTS_URL)
      .then(function (res) {
        if (!res.ok) throw new Error("Could not load projects");
        return res.json();
      })
      .then(function (data) {
        const list = Array.isArray(data) ? data : [];
        window.PROJECTS = list;
        return list;
      });
  };

  (function restoreTheme() {
    let id = null;
    try {
      id = localStorage.getItem(THEME_KEY);
    } catch (_) {}
    applyTheme(findTheme(id));
  })();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
