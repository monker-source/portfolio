(function (global) {
  var IMAGE_RE = /\.(jpe?g|png|webp|gif|avif)$/i;

  function normalizeList(data, folder) {
    var base = folder.replace(/\/?$/, "/");
    var list = Array.isArray(data) ? data : data && data.images;
    if (!list || !list.length) return [];
    return list
      .map(function (item) {
        if (typeof item === "string") {
          return {
            src:
              IMAGE_RE.test(item) && item.indexOf("/") === -1
                ? base + item
                : item,
            alt: "",
          };
        }
        return {
          src: item.src.indexOf("/") === -1 ? base + item.src : item.src,
          alt: item.alt || "",
        };
      })
      .filter(function (item) {
        return item.src;
      });
  }

  function createSlide(item, eager) {
    var slide = document.createElement("figure");
    slide.className = "slideshow-slide";

    var img = document.createElement("img");
    img.alt = item.alt || "";
    img.decoding = "async";
    img.loading = eager ? "eager" : "lazy";
    img.draggable = false;
    img.src = item.src;
    slide.appendChild(img);
    return slide;
  }

  function enableEndlessDrag(scroller, track, setWidth) {
    var active = false;
    var startX = 0;
    var startScroll = 0;
    var moved = false;
    var lastX = 0;
    var lastT = 0;
    var velocity = 0;
    var raf = 0;
    var looping = false;

    function stopMomentum() {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    }

    function normalize() {
      if (looping || setWidth <= 0) return;
      var max = scroller.scrollWidth - scroller.clientWidth;
      if (max <= 0) return;

      if (scroller.scrollLeft <= setWidth * 0.15) {
        looping = true;
        scroller.scrollLeft += setWidth;
        looping = false;
      } else if (scroller.scrollLeft >= setWidth * 1.85) {
        looping = true;
        scroller.scrollLeft -= setWidth;
        looping = false;
      }
    }

    function momentum() {
      raf = 0;
      if (Math.abs(velocity) < 0.08) {
        velocity = 0;
        normalize();
        return;
      }
      scroller.scrollLeft -= velocity;
      normalize();
      velocity *= 0.95;
      raf = requestAnimationFrame(momentum);
    }

    scroller.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "touch") return;
      stopMomentum();
      active = true;
      moved = false;
      velocity = 0;
      startX = lastX = e.clientX;
      lastT = performance.now();
      startScroll = scroller.scrollLeft;
      scroller.classList.add("is-dragging");
      scroller.setPointerCapture(e.pointerId);
    });

    scroller.addEventListener("pointermove", function (e) {
      if (!active) return;
      var now = performance.now();
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 2) moved = true;
      scroller.scrollLeft = startScroll - dx;
      normalize();

      var dt = now - lastT;
      if (dt > 0) {
        velocity = ((e.clientX - lastX) / dt) * 16;
      }
      lastX = e.clientX;
      lastT = now;
    });

    function endDrag(e) {
      if (!active) return;
      active = false;
      scroller.classList.remove("is-dragging");
      try {
        scroller.releasePointerCapture(e.pointerId);
      } catch (_) {}
      if (moved && Math.abs(velocity) > 0.4) {
        raf = requestAnimationFrame(momentum);
      } else {
        normalize();
      }
    }

    scroller.addEventListener("pointerup", endDrag);
    scroller.addEventListener("pointercancel", endDrag);
    scroller.addEventListener(
      "wheel",
      function () {
        stopMomentum();
        requestAnimationFrame(normalize);
      },
      { passive: true }
    );
    scroller.addEventListener(
      "scroll",
      function () {
        if (!active && !raf) normalize();
      },
      { passive: true }
    );

    scroller.addEventListener(
      "click",
      function (e) {
        if (moved) {
          e.preventDefault();
          e.stopPropagation();
          moved = false;
        }
      },
      true
    );

    // Start in the middle copy so both directions feel endless.
    requestAnimationFrame(function () {
      scroller.scrollLeft = setWidth;
    });
  }

  function mount(root, images) {
    if (!root || root.getAttribute("data-ready") === "1") return;
    if (!images.length) {
      root.hidden = true;
      return;
    }

    root.hidden = false;
    root.classList.add("slideshow");
    root.setAttribute("data-ready", "1");

    var size = Number(root.getAttribute("data-slide-size")) || 720;
    root.style.setProperty("--slideshow-slide-w", size + "px");

    var scroller = document.createElement("div");
    scroller.className = "slideshow-scroller";
    scroller.setAttribute("tabindex", "0");
    scroller.setAttribute("role", "region");
    scroller.setAttribute(
      "aria-label",
      root.getAttribute("aria-label") || "Slideshow"
    );

    var track = document.createElement("div");
    track.className = "slideshow-track";

    // Triple the set so drag can loop in either direction.
    for (var copy = 0; copy < 3; copy++) {
      var set = document.createElement("div");
      set.className = "slideshow-set";
      images.forEach(function (item, i) {
        set.appendChild(createSlide(item, copy === 1 && i < 3));
      });
      track.appendChild(set);
    }

    scroller.appendChild(track);
    root.appendChild(scroller);

    requestAnimationFrame(function () {
      var sets = track.querySelectorAll(".slideshow-set");
      var setWidth = sets[0] ? sets[0].offsetWidth : 0;
      // include the gap after each set (flex gap on track)
      if (sets[1]) {
        setWidth = sets[1].offsetLeft - sets[0].offsetLeft;
      }
      enableEndlessDrag(scroller, track, setWidth);
    });
  }

  function load(root) {
    if (!root || root.getAttribute("data-ready") === "1") return;

    var folder = root.getAttribute("data-folder") || "slideshow/";
    var manifest =
      root.getAttribute("data-manifest") ||
      folder.replace(/\/?$/, "/") + "slides.json";

    fetch(manifest)
      .then(function (res) {
        if (!res.ok) throw new Error(res.status);
        return res.json();
      })
      .then(function (data) {
        mount(root, normalizeList(data, folder));
      })
      .catch(function () {
        root.hidden = true;
      });
  }

  function loadAll(selector) {
    var nodes = document.querySelectorAll(selector || "[data-slideshow]");
    for (var i = 0; i < nodes.length; i++) load(nodes[i]);
  }

  global.Slideshow = { load: load, loadAll: loadAll, mount: mount };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      loadAll();
    });
  } else {
    loadAll();
  }
})(window);
