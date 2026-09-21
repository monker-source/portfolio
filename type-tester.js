(function (global) {
  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  /**
   * Mount a live type tester into `root`.
   * root[data-font]   — CSS font-family name (required)
   * root[data-sample] — initial text
   * root[data-size]   — desktop default px (default 256); scaled down on narrow viewports
   * root[data-size-mobile] — mobile default px at ~390px wide (default 76)
   * root[data-min]    — min px (default 24)
   * root[data-max]    — max px (default 400)
   * root[data-lead]   — initial unitless line-height (default 1.2)
   * root[data-lead-min] — min line-height (default 0.6)
   * root[data-lead-max] — max line-height (default 2)
   */
  function initialSize(root, min, max) {
    const desktop = Number(root.getAttribute("data-size")) || 256;
    const mobile = Number(root.getAttribute("data-size-mobile")) || 76;
    const w = window.innerWidth || 1200;
    const t = clamp((w - 390) / (1100 - 390), 0, 1);
    return clamp(Math.round(mobile + (desktop - mobile) * t), min, max);
  }

  function mount(root) {
    if (!root || root.getAttribute("data-ready") === "1") return;

    const font = root.getAttribute("data-font");
    if (!font) return;

    const min = Number(root.getAttribute("data-min")) || 24;
    const max = Number(root.getAttribute("data-max")) || 400;
    let size = initialSize(root, min, max);

    const leadMin = Number(root.getAttribute("data-lead-min")) || 0.6;
    const leadMax = Number(root.getAttribute("data-lead-max")) || 2;
    let lead = Number(root.getAttribute("data-lead")) || 1.2;
    lead = clamp(lead, leadMin, leadMax);

    const sample =
      root.getAttribute("data-sample") || "Type something";

    const shell = document.createElement("div");
    shell.className = "type-tester";

    const controls = document.createElement("div");
    controls.className = "type-tester-controls";

    function makeId(suffix) {
      return root.id
        ? root.id + "-" + suffix
        : "type-tester-" + suffix + "-" + Math.random().toString(36).slice(2, 8);
    }

    function makeRangeControl(opts) {
      const wrap = document.createElement("div");
      wrap.className = "type-tester-control";

      const label = document.createElement("label");
      label.className = "type-tester-control-label";
      label.htmlFor = opts.id;

      const valueEl = document.createElement("span");
      valueEl.className = "type-tester-control-value";
      valueEl.textContent = opts.format(opts.value);

      label.appendChild(document.createTextNode(opts.name + " "));
      label.appendChild(valueEl);

      const range = document.createElement("input");
      range.type = "range";
      range.className = "type-tester-range";
      range.id = opts.id;
      range.min = String(opts.min);
      range.max = String(opts.max);
      range.step = String(opts.step);
      range.value = String(opts.value);
      range.setAttribute("aria-label", opts.name);

      wrap.appendChild(label);
      wrap.appendChild(range);

      return { wrap: wrap, range: range, valueEl: valueEl };
    }

    const sizeCtrl = makeRangeControl({
      id: makeId("size"),
      name: "Size",
      min: min,
      max: max,
      step: 1,
      value: size,
      format: function (v) {
        return v + "px";
      },
    });

    const leadCtrl = makeRangeControl({
      id: makeId("lead"),
      name: "Leading",
      min: leadMin,
      max: leadMax,
      step: 0.01,
      value: lead,
      format: function (v) {
        return Number(v).toFixed(2);
      },
    });

    controls.appendChild(sizeCtrl.wrap);
    controls.appendChild(leadCtrl.wrap);

    const field = document.createElement("textarea");
    field.className = "type-tester-field";
    field.spellcheck = false;
    field.autocomplete = "off";
    field.autocapitalize = "off";
    field.value = sample;
    field.setAttribute("aria-label", "Type tester");
    field.style.fontFamily = font + ", sans-serif";
    field.style.fontSize = size + "px";
    field.style.lineHeight = String(lead);

    function fitHeight() {
      field.style.height = "auto";
      const pad = size * 0.55;
      field.style.height =
        Math.max(field.scrollHeight, size * lead + pad * 2) + "px";
    }

    sizeCtrl.range.addEventListener("input", function () {
      size = Number(sizeCtrl.range.value);
      sizeCtrl.valueEl.textContent = size + "px";
      field.style.fontSize = size + "px";
      fitHeight();
    });

    leadCtrl.range.addEventListener("input", function () {
      lead = Number(leadCtrl.range.value);
      leadCtrl.valueEl.textContent = lead.toFixed(2);
      field.style.lineHeight = String(lead);
      fitHeight();
    });

    field.addEventListener("input", fitHeight);

    shell.appendChild(field);
    shell.appendChild(controls);
    root.appendChild(shell);
    root.setAttribute("data-ready", "1");
    fitHeight();
  }

  function mountAll(selector) {
    const nodes = document.querySelectorAll(selector || "[data-type-tester]");
    for (let i = 0; i < nodes.length; i++) mount(nodes[i]);
  }

  global.TypeTester = { mount: mount, mountAll: mountAll };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      mountAll();
    });
  } else {
    mountAll();
  }
})(window);
