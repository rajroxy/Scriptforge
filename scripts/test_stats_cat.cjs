const fs = require("fs"), vm = require("vm");
const src = fs.readFileSync("pages.js", "utf8");

// ── Minimal stub DOM ──
function el(tag) {
  return {
    tag, children: [], listeners: {}, dataset: {}, style: {},
    classList: {
      _s: new Set(),
      add(c) { this._s.add(c); },
      remove(c) { this._s.delete(c); },
      toggle(c, f) { f === undefined ? (this._s.has(c) ? this._s.delete(c) : this._s.add(c)) : (f ? this._s.add(c) : this._s.delete(c)); },
      contains(c) { return this._s.has(c); },
    },
    set innerHTML(v) { this._html = v; },
    get innerHTML() { return this._html || ""; },
    addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); },
    dispatch(t, ev) { (this.listeners[t] || []).forEach(f => f(ev || {})); },
    querySelector() { return null; },
    querySelectorAll() { return []; },
  };
}

// Build one category card mirroring the new template
function catBox() {
  const box = el("div");
  const list = el("div");
  const items = [];
  ["none", "fiction", "nonfiction"].forEach(v => {
    const item = el("button");
    item.className = "stats-cat-item";
    item.dataset.value = v;
    // closest() used by the delegated click handler
    item.closest = (sel) => sel === ".stats-cat-item" ? item : null;
    items.push(item);
    list.children.push(item);
  });
  box.children.push(list);
  box._items = items;
  return box;
}

const novelBox = catBox();
const screenBox = catBox();

const ctx = {
  window: {}, document: {}, console,
  S: { config: {} },
  __saved: 0, __reRendered: 0,
  save() { this.__saved++; },
  renderStatsBody() { this.__reRendered++; },
  toast() {},
  novelBox, screenBox,
};
vm.createContext(ctx);

// Extract the paintCat/bindCat block from the real file
const m = src.match(/function paintCat\(box, current\)\{[\s\S]*?bindCat\(screenBox, novelBox,\s*'statsScreenplay',\s*'statsNovel'\);/);
if (!m) { console.error("FAIL: wiring block not found in pages.js"); process.exit(1); }
vm.runInContext(m[0], ctx);

const S = ctx.S;

// Run the scenario inside the vm (paintCat/bindCat live on the context)
vm.runInContext(`
  const paintStates = (b, key) => b._items.forEach(it => it.classList.toggle("active", it.dataset.value === (S.config[key] || "none")));
  const repaint = () => { paintStates(novelBox, "statsNovel"); paintStates(screenBox, "statsScreenplay"); };
  const activeVal = (b) => { const a = b._items.find(i => i.classList.contains("active")); return a ? a.dataset.value : null; };

  // 1. Initial paint: none selected
  repaint();
  console.log("initial: novel =", activeVal(novelBox), "| screenplay =", activeVal(screenBox));

  // 2. Click Fiction in Novel
  S.config.statsNovel = "fiction"; S.config.statsScreenplay = "none";
  paintCat(novelBox, "fiction"); paintCat(screenBox, "none");
  repaint();
  console.log("after novel→fiction: novel =", activeVal(novelBox), "| screenplay =", activeVal(screenBox),
    "| handler fired:", (novelBox.listeners.click || []).length === 1, "| saved:", __saved > 0, "| re-renders:", __reRendered);

  // 3. Click Non-fiction in Screenplay — Novel must reset to none
  S.config.statsScreenplay = "nonfiction"; S.config.statsNovel = "none";
  paintCat(screenBox, "nonfiction"); paintCat(novelBox, "none");
  repaint();
  console.log("after screenplay→nonfiction: novel =", activeVal(novelBox), "| screenplay =", activeVal(screenBox),
    "| saved:", __saved > 0, "| re-renders:", __reRendered);

  // 4. Click None — clears
  S.config.statsNovel = "none"; paintCat(novelBox, "none");
  repaint();
  console.log("after novel→none: novel =", activeVal(novelBox), "| screenplay =", activeVal(screenBox));

  window.__pass = activeVal(novelBox) === "none" && activeVal(screenBox) === "none"
    && __saved >= 3 && __reRendered >= 3
    && (novelBox.listeners.click || []).length === 1
    && (screenBox.listeners.click || []).length === 1;
`, ctx);

console.log(ctx.__pass ? "ALL PASS" : "FAIL");
process.exit(ctx.__pass ? 0 : 1);
