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
        { label: "you@email.com", href: "mailto:you@email.com" },
      ],
    },
  };

  const THEME_KEY = "site-theme";
  const THEMES = [
    {
      id: "paper",
      label: "Paper",
      bg: "#f2f2f0",
      swatch: "#ffffff",
      ink: "#111111",
      muted: "#7a7a7a",
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
    root.style.setProperty("--bg", theme.bg);
    root.style.setProperty("--ink", theme.ink);
    root.style.setProperty("--muted", theme.muted);
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
      ".site-header{position:sticky;top:0;z-index:40}",
      ".site-nav{",
      "position:relative;display:grid;",
      "grid-template-columns:1.4fr 1fr 1fr 1.2fr auto;",
      "gap:28px;align-items:baseline;",
      "}",
      ".theme-swatches{",
      "display:flex;align-items:center;justify-self:end;align-self:center;",
      "gap:2px;margin:0;padding:0;list-style:none;",
      "mix-blend-mode:normal;isolation:isolate;position:relative;z-index:1;",
      "}",
      ".theme-swatch{",
      "width:10px;height:10px;margin:5px;padding:0;border-radius:100%;",
      "border:1px solid var(--ink);background:var(--swatch);",
      "cursor:pointer;appearance:none;-webkit-appearance:none;",
      "mix-blend-mode:normal;",
      "}",
      ".theme-swatch[aria-pressed='true']{outline:1px solid var(--ink);outline-offset:2px}",
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

  function mount() {
    injectThemeStyles();
    document.body.prepend(buildHeader());

    if (document.body.getAttribute("data-footer") !== "false") {
      insertBeforeScripts(buildFooter());
    }

    startClocks();
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
