(function () {
  const SITE = {
    city: "Madison",
    timeZone: "America/Chicago",
    nav: [
      { label: "SASHA", href: "main.html", brand: true },
      { label: "Works", href: "main.html#index" },
      { label: "Notes", href: "#" },
      { label: "Fun", href: "fun-stuff.html" },
    ],
    footer: {
      id: "contact",
      headline: "Contacts",
      links: [
        { label: "sasha.sm-v@ya.ru", href: "mailto:sasha.sm-v@ya.ru" },
      ],
    },
  };

  const THEME_KEY = "site-theme";
  const THEMES = [
    {
      // Default: no inline colours — tokens.css owns the palette
      id: "paper",
      label: "Paper",
      fromTokens: true,
      swatch: "#ffffff",
    },
    {
      id: "black",
      label: "Black",
      bg: "#191919",
      ink: "#fafafa",
      muted: "#8a8a8a",
    },
    {
      id: "blue",
      label: "Blue",
      bg: "#0000ff",
      ink: "#ffff00",
      muted: "#a0a0ff",
    },
  ];

  function assetBase() {
    const scripts = document.querySelectorAll("script[src]");
    for (let i = 0; i < scripts.length; i++) {
      const src = scripts[i].getAttribute("src") || "";
      if (/site\.js(\?|$)/.test(src)) {
        return src.replace(/site\.js(\?.*)?$/, "");
      }
    }
    return "";
  }

  function siteHref(href) {
    if (!href || href === "#" || /^(https?:|mailto:|\/|#)/.test(href)) {
      return href;
    }
    return assetBase() + href;
  }

  function currentFile() {
    const parts = location.pathname.split("/");
    return parts[parts.length - 1] || "index.html";
  }

  function isActive(item, current) {
    if (item.brand || !item.href || item.href === "#") return false;
    const file = item.href.split("/").pop().split("?")[0].split("#")[0];
    return file === current;
  }

  function findTheme(id) {
    for (let i = 0; i < THEMES.length; i++) {
      if (THEMES[i].id === id) return THEMES[i];
    }
    return THEMES[0];
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    const keys = [
      "--color-bg",
      "--color-ink",
      "--color-muted",
      "--bg",
      "--ink",
      "--muted",
    ];

    if (theme.fromTokens) {
      // Clear inline overrides so tokens.css (and page :root) win
      keys.forEach(function (key) {
        root.style.removeProperty(key);
      });
    } else {
      root.style.setProperty("--color-bg", theme.bg);
      root.style.setProperty("--color-ink", theme.ink);
      root.style.setProperty("--color-muted", theme.muted);
      root.style.setProperty("--bg", theme.bg);
      root.style.setProperty("--ink", theme.ink);
      root.style.setProperty("--muted", theme.muted);
    }

    root.setAttribute("data-theme", theme.id);
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
      ".site-nav{",
      "position:relative;display:grid;",
      "grid-template-columns:var(--cols) auto;",
      "gap:var(--col-gap);align-items:baseline;",
      "}",
      ".theme-swatches{",
      "display:flex;align-items:center;justify-self:end;align-self:center;",
      "gap:var(--gap-stack);margin:0;padding:0;list-style:none;",
      "mix-blend-mode:normal;isolation:isolate;position:relative;z-index:1;",
      "}",
      ".theme-swatch{",
      "width:10px;height:10px;margin:5px;padding:0;border-radius:100%;",
      "border:1px solid var(--ink);background:var(--swatch);",
      "cursor:pointer;appearance:none;-webkit-appearance:none;",
      "mix-blend-mode:normal;",
      "}",
      ".theme-swatch[aria-pressed='true']{outline:1px solid var(--ink);outline-offset:2px}",
      "img.ink-svg{",
      "background:var(--ink)!important;",
      "-webkit-mask:var(--ink-svg) center/contain no-repeat;",
      "mask:var(--ink-svg) center/contain no-repeat;",
      "mask-mode:alpha;",
      "}",
      "@media (max-width:800px){",
      ".theme-swatches{justify-self:end}",
      "}",
    ].join("");
    document.head.appendChild(style);
  }

  function buildThemeSwatches() {
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
      btn.style.setProperty("--swatch", theme.swatch || theme.bg);
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

    return wrap;
  }

  function buildHeader() {
    const current = currentFile();
    const header = document.createElement("header");
    header.className = "site-header";

    const nav = document.createElement("nav");
    nav.className = "site-nav";
    nav.setAttribute("aria-label", "Primary");

    SITE.nav.forEach(function (item) {
      const a = document.createElement("a");
      a.href = siteHref(item.href);
      a.textContent = item.label;
      if (item.brand) a.classList.add("brand");
      if (isActive(item, current)) a.classList.add("is-active");
      nav.appendChild(a);
    });

    nav.appendChild(buildThemeSwatches());
    header.appendChild(nav);
    return header;
  }

  function buildFooter() {
    const footer = document.createElement("footer");
    footer.className = "contact";
    footer.id = SITE.footer.id;

    const top = document.createElement("div");
    top.className = "contact-top";

    const headline = document.createElement("h2");
    headline.className = "contact-headline";
    headline.textContent = SITE.footer.headline;

    const spacer = document.createElement("div");

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
    if (!img.closest(".hero")) return;

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
    if (!isProjectPage() || !root) return;
    const scope = root.querySelectorAll ? root : document;
    if (scope.tagName === "IMG") {
      paintInkSvg(scope);
      return;
    }
    scope.querySelectorAll("img").forEach(paintInkSvg);
  }

  function observeProjectSvgs() {
    if (!isProjectPage() || !document.body) return;
    paintProjectSvgs(document);
    const mo = new MutationObserver(function (records) {
      records.forEach(function (rec) {
        rec.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          paintProjectSvgs(node);
        });
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });
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
  }

  const PROJECTS_URL = "projects.json";

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
