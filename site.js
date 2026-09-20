(function () {
  const SITE = {
    city: "Madison",
    timeZone: "America/Chicago",
    nav: [
      { label: "SASHA", href: "main.html", brand: true },
      { label: "Index", href: "index.html" },
      { label: "Articles", href: "#" },
      { label: "About", href: "about.html" },
    ],
    footer: {
      id: "contact",
      headline: "Contacts",
      links: [
        { label: "you@email.com", href: "mailto:you@email.com" },
      ],
    },
  };

  function currentFile() {
    const parts = location.pathname.split("/");
    return parts[parts.length - 1] || "index.html";
  }

  function isActive(item, current) {
    if (!item.href || item.href === "#") return false;
    const file = item.href.split("/").pop().split("?")[0];
    return file === current;
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
      a.href = item.href;
      a.textContent = item.label;
      if (item.brand) a.classList.add("brand");
      if (isActive(item, current)) a.classList.add("is-active");
      nav.appendChild(a);
    });

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
    document.body.prepend(buildHeader());

    if (document.body.getAttribute("data-footer") !== "false") {
      insertBeforeScripts(buildFooter());
    }

    startClocks();
  }

  window.SITE = SITE;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
