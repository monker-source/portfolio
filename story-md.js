(function (global) {
  function renderMarkdown(md, mount) {
    const blocks = md.trim().split(/\n\s*\n/);
    blocks.forEach(function (block) {
      const text = block.trim();
      if (!text) return;

      const pair = text.match(
        /^!\[([^\]]*)\]\(([^)]+)\)\s*\+\s*\(([^)]+)\)\s*$/
      );
      if (pair) {
        const fig = document.createElement("figure");
        fig.className = "story-figure story-figure--pair";
        [pair[2], pair[3]].forEach(function (src, i) {
          const image = document.createElement("img");
          image.src = src;
          image.alt = i === 0 ? pair[1] : "";
          fig.appendChild(image);
        });
        if (pair[1]) {
          const cap = document.createElement("figcaption");
          cap.textContent = pair[1];
          fig.appendChild(cap);
        }
        mount.appendChild(fig);
        return;
      }

      const wide = text.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*\+\s*$/);
      if (wide) {
        const fig = document.createElement("figure");
        fig.className = "story-figure story-figure--wide";
        const image = document.createElement("img");
        image.src = wide[2];
        image.alt = wide[1];
        fig.appendChild(image);
        if (wide[1]) {
          const cap = document.createElement("figcaption");
          cap.textContent = wide[1];
          fig.appendChild(cap);
        }
        mount.appendChild(fig);
        return;
      }

      const img = text.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/);
      if (img) {
        const fig = document.createElement("figure");
        fig.className = "story-figure";
        const image = document.createElement("img");
        image.src = img[2];
        image.alt = img[1];
        fig.appendChild(image);
        if (img[1]) {
          const cap = document.createElement("figcaption");
          cap.textContent = img[1];
          fig.appendChild(cap);
        }
        mount.appendChild(fig);
        return;
      }

      const p = document.createElement("p");
      p.textContent = text.replace(/\s*\n\s*/g, " ");
      mount.appendChild(p);
    });
  }

  function loadStory(mount, url) {
    if (!mount) return;
    fetch(url || "story.md")
      .then(function (res) {
        if (!res.ok) throw new Error(res.status);
        return res.text();
      })
      .then(function (md) {
        renderMarkdown(md, mount);
      })
      .catch(function () {
        const p = document.createElement("p");
        p.textContent = "Story could not be loaded.";
        mount.appendChild(p);
      });
  }

  global.StoryMd = { render: renderMarkdown, load: loadStory };
})(window);
