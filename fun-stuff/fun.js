(function (global) {
  var FOLDER = "./";
  var SKIP_RE = /\.(js|json|html|css|md|txt|map)$/i;
  var IMAGE_RE = /\.(jpe?g|png|webp|gif|avif|svg)$/i;
  var PDF_RE = /\.pdf$/i;
  var VIDEO_RE = /\.(mp4|webm|mov)$/i;
  var PREVIEW_RE = /^(.+)-preview\.(jpe?g|png|webp|gif|avif|svg)$/i;
  var LIST_ID = "fun-stuff-list";

  function stem(name) {
    return name.replace(/\.[^.]+$/, "");
  }

  function titleFromName(name) {
    return stem(name)
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b([a-z])/g, function (_, c) {
        return c.toUpperCase();
      });
  }

  function decodeName(href) {
    try {
      return decodeURIComponent(href);
    } catch (_) {
      return href;
    }
  }

  function fileName(value) {
    if (!value) return "";
    if (typeof value === "string") return decodeName(value.split("/").pop());
    if (value.name) return decodeName(String(value.name).split("/").pop());
    if (value.file) return decodeName(String(value.file).split("/").pop());
    return "";
  }

  function parseListing(html) {
    var doc = new DOMParser().parseFromString(html, "text/html");
    if (doc.getElementById(LIST_ID) || doc.querySelector(".site-nav")) {
      return [];
    }
    var names = [];
    var links = doc.querySelectorAll("a[href]");
    for (var i = 0; i < links.length; i++) {
      var href = (links[i].getAttribute("href") || "").split("?")[0];
      if (!href || href === "/" || href === "../" || href.slice(-1) === "/") {
        continue;
      }
      if (href.indexOf("://") !== -1) continue;
      var name = decodeName(href.split("/").pop());
      if (!name || name.charAt(0) === ".") continue;
      if (SKIP_RE.test(name)) continue;
      names.push(name);
    }
    return names;
  }

  function unique(names) {
    var seen = {};
    var out = [];
    names.forEach(function (name) {
      if (!name || seen[name]) return;
      seen[name] = true;
      out.push(name);
    });
    return out;
  }

  function buildItems(names) {
    var set = {};
    names.forEach(function (name) {
      set[name] = true;
    });

    var usedPreview = {};
    var items = [];

    names.forEach(function (name) {
      if (PREVIEW_RE.test(name)) return;
      if (!IMAGE_RE.test(name) && !PDF_RE.test(name) && !VIDEO_RE.test(name)) {
        return;
      }

      var item = {
        title: titleFromName(name),
        file: FOLDER + name,
        preview: null,
      };

      if (IMAGE_RE.test(name)) {
        item.preview = item.file;
      } else {
        var base = stem(name);
        var previews = [
          base + "-preview.png",
          base + "-preview.jpg",
          base + "-preview.jpeg",
          base + "-preview.webp",
          base + "-preview.gif",
          base + "-preview.svg",
        ];
        for (var i = 0; i < previews.length; i++) {
          if (set[previews[i]]) {
            item.preview = FOLDER + previews[i];
            usedPreview[previews[i]] = true;
            break;
          }
        }
      }

      items.push(item);
    });

    names.forEach(function (name) {
      if (!PREVIEW_RE.test(name) || usedPreview[name]) return;
      items.push({
        title: titleFromName(name.replace(/-preview$/i, "")),
        file: FOLDER + name,
        preview: FOLDER + name,
      });
    });

    return items;
  }

  function readJson(res) {
    return res.text().then(function (text) {
      var data = JSON.parse(text);
      if (Array.isArray(data)) {
        return data.map(fileName).filter(Boolean);
      }
      if (data && Array.isArray(data.files)) {
        return data.files.map(fileName).filter(Boolean);
      }
      return [];
    });
  }

  function loadNames() {
    var bust = "?t=" + Date.now();
    var fromJson = fetch(FOLDER + "files.json" + bust)
      .then(function (res) {
        if (!res.ok) throw new Error(res.status);
        return readJson(res);
      })
      .catch(function () {
        return [];
      });

    var fromDir = fetch(FOLDER)
      .then(function (res) {
        if (!res.ok) throw new Error(res.status);
        var type = (res.headers.get("content-type") || "").toLowerCase();
        if (type.indexOf("json") !== -1) return readJson(res);
        return res.text().then(parseListing);
      })
      .catch(function () {
        return [];
      });

    return Promise.all([fromJson, fromDir]).then(function (pair) {
      if (pair[1].length) return pair[1];
      return pair[0];
    });
  }

  function render(list, items) {
    list.innerHTML = "";
    items.forEach(function (item, index) {
      var el = document.createElement("article");
      el.className = "project";
      el.dataset.place = String(index % 4);

      var media = document.createElement("a");
      media.className = "project-media";
      media.href = item.file;
      media.rel = "noopener";
      if (PDF_RE.test(item.file) || VIDEO_RE.test(item.file)) {
        media.target = "_blank";
      }

      if (item.preview) {
        var img = document.createElement("img");
        img.src = item.preview;
        img.alt = item.title;
        img.loading = "lazy";
        media.appendChild(img);
      } else {
        var fallback = document.createElement("p");
        fallback.className = "project-fallback";
        fallback.textContent = item.title;
        media.appendChild(fallback);
      }

      el.appendChild(media);
      list.appendChild(el);
    });
  }

  function load() {
    var list = document.getElementById(LIST_ID);
    if (!list) return Promise.resolve([]);

    return loadNames()
      .then(function (names) {
        var items = buildItems(unique(names));
        global.FUN_STUFF = items;
        render(list, items);
        return items;
      })
      .catch(function () {
        global.FUN_STUFF = [];
        return [];
      });
  }

  global.loadFunStuff = load;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }
})(window);
