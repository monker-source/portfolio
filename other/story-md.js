(function (global) {
  function applyInline(el, text) {
    const parts = text.split(/(\*[^*]+\*)/g);
    parts.forEach(function (part) {
      if (!part) return;
      if (part.charAt(0) === "*" && part.charAt(part.length - 1) === "*" && part.length > 2) {
        const em = document.createElement("em");
        em.textContent = part.slice(1, -1);
        el.appendChild(em);
      } else {
        el.appendChild(document.createTextNode(part));
      }
    });
  }

  function resolveSrc(src, assetBase) {
    if (!src || /^(https?:|data:|\/)/.test(src)) return src;
    return (assetBase || "") + src;
  }

  function appendImages(fig, sources, alt, assetBase) {
    sources.forEach(function (src, i) {
      const image = document.createElement("img");
      image.src = resolveSrc(src, assetBase);
      image.alt = i === 0 ? alt : "";
      fig.appendChild(image);
    });
    if (alt) {
      const cap = document.createElement("figcaption");
      cap.textContent = alt;
      fig.appendChild(cap);
    }
  }

  function renderMarkdown(md, mount, assetBase) {
    const blocks = md.trim().split(/\n\s*\n/);
    blocks.forEach(function (block) {
      const text = block.trim();
      if (!text) return;

      const chain = text.match(
        /^!\[([^\]]*)\]\(([^)]+)\)((?:\s*\+\s*\(([^)]+)\))+)\s*$/
      );
      if (chain) {
        const sources = [chain[2]];
        const extra = chain[3].match(/\(([^)]+)\)/g) || [];
        extra.forEach(function (chunk) {
          sources.push(chunk.slice(1, -1));
        });
        const fig = document.createElement("figure");
        fig.className =
          sources.length === 2
            ? "story-figure story-figure--pair"
            : "story-figure story-figure--grid";
        appendImages(fig, sources, chain[1], assetBase);
        mount.appendChild(fig);
        return;
      }

      const wide = text.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*\+\s*$/);
      if (wide) {
        const fig = document.createElement("figure");
        fig.className = "story-figure story-figure--wide";
        appendImages(fig, [wide[2]], wide[1], assetBase);
        mount.appendChild(fig);
        return;
      }

      const compactPair = text.match(
        /^!\[([^\]]*)\]\(([^)\s+]+)\+([^)\s+]+)\)\s*$/
      );
      if (compactPair) {
        const fig = document.createElement("figure");
        fig.className = "story-figure story-figure--pair";
        appendImages(
          fig,
          [compactPair[2], compactPair[3]],
          compactPair[1],
          assetBase
        );
        mount.appendChild(fig);
        return;
      }

      const img = text.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/);
      if (img) {
        const fig = document.createElement("figure");
        fig.className = "story-figure";
        appendImages(fig, [img[2]], img[1], assetBase);
        mount.appendChild(fig);
        return;
      }

      const p = document.createElement("p");
      applyInline(p, text.replace(/\s*\n\s*/g, " "));
      mount.appendChild(p);
    });

    if (mount.firstChild && !document.querySelector(".story-head")) {
      const kicker = document.createElement("p");
      kicker.className = "story-kicker";
      kicker.textContent = "How it was done";
      mount.insertBefore(kicker, mount.firstChild);
    }
  }

  function loadStory(mount, url, assetBase) {
    if (!mount) return;
    fetch(url || "story.md")
      .then(function (res) {
        if (!res.ok) throw new Error(res.status);
        return res.text();
      })
      .then(function (md) {
        renderMarkdown(md, mount, assetBase);
      })
      .catch(function () {
        const p = document.createElement("p");
        p.textContent = "Story could not be loaded.";
        mount.appendChild(p);
      });
  }

  global.StoryMd = { render: renderMarkdown, load: loadStory };
})(window);
