(function (global) {
  var CREDITS = [
    ["year", "Year"],
    ["client", "Client"],
    ["art-direction", "Art\u2011direction"],
    ["deliverables", "Deliverables"],
  ];

  function applyInline(el, text) {
    var parts = text.split(/(\*[^*]+\*)/g);
    parts.forEach(function (part) {
      if (!part) return;
      if (part.charAt(0) === "*" && part.charAt(part.length - 1) === "*" && part.length > 2) {
        var em = document.createElement("em");
        em.textContent = part.slice(1, -1);
        el.appendChild(em);
      } else {
        el.appendChild(document.createTextNode(part));
      }
    });
  }

  function parse(md) {
    var text = String(md || "").replace(/^\uFEFF/, "");
    var meta = {};
    var body = text;
    if (text.slice(0, 3) === "---") {
      var end = text.indexOf("\n---", 3);
      if (end !== -1) {
        text.slice(3, end).split("\n").forEach(function (line) {
          var trimmed = line.trim();
          if (!trimmed || trimmed.charAt(0) === "#") return;
          var split = trimmed.indexOf(":");
          if (split === -1) return;
          var key = trimmed.slice(0, split).trim();
          var value = trimmed.slice(split + 1).trim();
          if (key) meta[key] = value;
        });
        body = text.slice(end + 4);
      }
    }
    var paragraphs = body
      .trim()
      .split(/\n\s*\n/)
      .map(function (block) {
        return block.trim().replace(/\s*\n\s*/g, " ");
      })
      .filter(Boolean);
    return { meta: meta, paragraphs: paragraphs };
  }

  function projectFile(project) {
    if (project.href) return project.href.replace(/\/?$/, "/") + "Project.md";
    if (project.slug) return "projects/" + project.slug + "/Project.md";
    return "";
  }

  function apply(project, doc) {
    var meta = doc.meta || {};
    if (meta.title) project.title = meta.title;
    if (meta.kind) project.kind = meta.kind;
    if (meta.year) project.year = meta.year;
    if (meta.description) project.description = meta.description;
    if (meta.info) {
      project.info = meta.info.split(",").map(function (item) {
        return item.trim();
      }).filter(Boolean);
    }
    return project;
  }

  function hydrate(projects) {
    return Promise.all(projects.map(function (project) {
      var url = projectFile(project);
      if (!url) return Promise.resolve(project);
      return fetch(url)
        .then(function (res) {
          if (!res.ok) return project;
          return res.text().then(function (text) {
            return apply(project, parse(text));
          });
        })
        .catch(function () {
          return project;
        });
    }));
  }

  function fill(intro, doc) {
    var meta = doc.meta || {};
    var title = meta.title || "";

    if (title) {
      var h1 = intro.querySelector("h1");
      if (h1) h1.textContent = title;
      document.title = "SASHA \u2014 " + title;
      var hero = document.querySelector(".hero");
      if (hero) {
        hero.setAttribute("aria-label", title);
        var image = hero.querySelector("img");
        if (image) image.alt = title;
        var frame = hero.querySelector("iframe");
        if (frame) frame.title = title;
      }
    }

    var list = intro.querySelector(".intro-meta");
    if (list) {
      list.textContent = "";
      CREDITS.forEach(function (pair) {
        var value = meta[pair[0]];
        if (!value) return;
        var li = document.createElement("li");
        var label = document.createElement("span");
        label.className = "label";
        label.textContent = pair[1];
        var span = document.createElement("span");
        span.textContent = value;
        li.appendChild(label);
        li.appendChild(span);
        list.appendChild(li);
      });
    }

    var kind = intro.querySelector(".project-kind");
    if (kind && meta.kind) kind.textContent = meta.kind;

    var button = intro.querySelector(".btn-accent");
    if (button) {
      if (meta.link) button.href = meta.link;
      if (meta["link-label"]) button.textContent = meta["link-label"];
    }
    if (meta.link) {
      document.querySelectorAll("[data-project-link]").forEach(function (anchor) {
        anchor.href = meta.link;
      });
    }

    var copy = intro.querySelector(".intro-copy");
    if (!copy) return;
    copy.textContent = "";
    var paragraphs = doc.paragraphs.slice();
    if (!paragraphs.length && meta.description) paragraphs = [meta.description];
    paragraphs.forEach(function (text) {
      var p = document.createElement("p");
      applyInline(p, text);
      copy.appendChild(p);
    });
  }

  function mount(intro, url) {
    if (!intro) return Promise.resolve();
    return fetch(url || "Project.md")
      .then(function (res) {
        if (!res.ok) throw new Error(res.status);
        return res.text();
      })
      .then(function (md) {
        fill(intro, parse(md));
      })
      .catch(function () {
        var copy = intro.querySelector(".intro-copy");
        if (!copy || copy.textContent) return;
        var p = document.createElement("p");
        p.textContent = "Project text could not be loaded.";
        copy.appendChild(p);
      });
  }

  global.ProjectMd = {
    parse: parse,
    apply: apply,
    hydrate: hydrate,
    fill: fill,
    mount: mount,
  };
})(window);
