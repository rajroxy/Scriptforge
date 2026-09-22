// Verifies music/video playback against a media element that behaves like a real
// browser: if the element carries a `crossorigin` attribute it demands CORS
// headers and refuses to load a plain URL (that was the bug).
const fs = require("fs"), vm = require("vm");

function makeEl(tag) {
  const el = {
    tag, children: [], listeners: {}, dataset: {}, attrs: {}, hidden: false,
    style: { setProperty() {}, cssText: "" },
    classList: { _s: new Set(), add(c){this._s.add(c)}, remove(c){this._s.delete(c)},
      toggle(c,f){ f === undefined ? (this._s.has(c) ? this._s.delete(c) : this._s.add(c)) : (f ? this._s.add(c) : this._s.delete(c)); },
      contains(c){ return this._s.has(c); } },
    set innerHTML(v){ this._html = v; }, get innerHTML(){ return this._html || ""; },
    set textContent(v){ this._txt = v; }, get textContent(){ return this._txt || ""; },
    addEventListener(t, f){ (this.listeners[t] = this.listeners[t] || []).push(f); },
    removeEventListener(){},
    dispatch(t, ev){ (this.listeners[t] || []).forEach(f => f(ev || {})); },
    appendChild(c){ this.children.push(c); return c; },
    insertBefore(c){ this.children.push(c); return c; },
    removeChild(c){ return c; }, remove(){},
    querySelector(){ return null; }, querySelectorAll(){ return []; },
    closest(){ return null; }, contains(){ return false; },
    setAttribute(k, v){ this.attrs[k] = String(v); },
    getAttribute(k){ return this.attrs[k] ?? null; },
    removeAttribute(k){ delete this.attrs[k]; },
    focus(){}, click(){}, select(){},
    paused: true, currentTime: 0, duration: NaN, _src: "",
    set src(v){ this._src = v; }, get src(){ return this._src; },
    get currentSrc(){ return this._src; },
    play(){
      // Real browsers refuse a non-CORS URL when crossOrigin is requested
      if (this.attrs.crossorigin !== undefined) {
        this.paused = true;
        return Promise.reject(Object.assign(new Error("no CORS headers"), { name: "NotSupportedError" }));
      }
      // Simulates a dead URL / unsupported codec
      if (this._src && this._src.indexOf("broken") >= 0) {
        this.paused = true;
        return Promise.reject(Object.assign(new Error("no supported source"), { name: "NotSupportedError" }));
      }
      this.paused = false;
      global.__played = (global.__played || 0) + 1;
      return Promise.resolve();
    },
    pause(){ this.paused = true; },
    load(){},
  };
  return el;
}

const byId = {}, winListeners = {}, docListeners = [];
let rs = "loading";
const documentStub = {
  get readyState(){ return rs; },
  addEventListener(t, f){ docListeners.push([t, f]); },
  removeEventListener(){},
  getElementById(id){ if(!byId[id]) byId[id] = makeEl("div#" + id); return byId[id]; },
  createElement(t){ return makeEl(t); },
  querySelector(){ return null; },
  querySelectorAll(){ return []; },
  body: makeEl("body"), documentElement: makeEl("html"), activeElement: null,
};
const storage = {};
const windowStub = {
  document: documentStub,
  addEventListener(t, f){ (winListeners[t] = winListeners[t] || []).push(f); },
  removeEventListener(){},
  matchMedia(){ return { addEventListener(){}, matches: false }; },
  localStorage: { getItem: k => storage[k] ?? null, setItem: (k,v) => { storage[k] = String(v); }, removeItem: k => { delete storage[k]; } },
  location: { href: "", pathname: "/", search: "", reload(){} },
  navigator: { userAgent: "test" },
  requestAnimationFrame(){ return 0; }, cancelAnimationFrame(){},
  electronPath: null,
  MutationObserver: function(){ return { observe(){}, disconnect(){} }; },
};
windowStub.window = windowStub; windowStub.self = windowStub;

const ctx = vm.createContext(windowStub);
ctx.console = console;
ctx.setTimeout = () => 0; ctx.clearTimeout = () => {}; ctx.setInterval = () => 0; ctx.clearInterval = () => {};
ctx.URL = { createObjectURL(){ return "blob:https://localhost:3000/abc"; } };
ctx.FileReader = function(){};
ctx.Audio = function(){ return makeEl("audio"); };
ctx.Blob = function(){}; ctx.CustomEvent = function(){};
ctx.MutationObserver = windowStub.MutationObserver; ctx.Promise = Promise;
// Clock we can advance, so the anti-double-press guard (60ms) doesn't fire
let clockOffset = 0;
class FakeDate extends Date { static now(){ return Date.now() + clockOffset; } }
ctx.Date = FakeDate;

for (const f of ["state.js", "panels.js", "app.js"]) vm.runInContext(fs.readFileSync(f, "utf8"), ctx, { filename: f });
rs = "interactive"; docListeners.filter(l => l[0] === "DOMContentLoaded").forEach(l => l[1]());
rs = "complete"; (winListeners["load"] || []).forEach(l => { if (typeof l === "function") l(); });
docListeners.filter(l => l[0] === "load").forEach(l => { if (typeof l[1] === "function") l[1](); });

const failures = [];
const ok = (label, cond) => { console.log((cond ? "  PASS  " : "  FAIL  ") + label); if (!cond) failures.push(label); };

// Instrument toasts
let toasts = [];
ctx.toast = (m, t) => toasts.push({ m, t });

const Music = ctx.Music;
ok("musicInit attaches audio listeners", !!Music.audio && Object.keys(Music.audio.listeners).length > 0);
ok("audio error listener attached", !!(Music.audio.listeners.error || []).length);

// Seed a restored playlist (previous session): URL track, nothing loaded yet
Music.playlist.length = 0;
Music.playlist.push({ name: "soothing-cinematic-soundtrack", url: "https://cdn.example.com/soothing-cinematic-soundtrack.mp3", source: "url" });
Music.currentIndex = 0;

// Click PLAY when no source is loaded (the reload case)
const btn = makeEl("button"); btn.dataset.act = "mp-toggle";
btn.closest = sel => sel.indexOf("mp-toggle") >= 0 ? btn : null;
docListeners.filter(l => l[0] === "mousedown").forEach(l => {
  try { l[1]({ target: btn, button: 0, preventDefault(){}, stopPropagation(){} }); } catch(e){ console.log("  threw:", e.message); }
});
ok("restored playlist: play loads a source", !!Music.audio.currentSrc);
ok("restored playlist: audio actually plays", Music.audio.paused === false && (global.__played || 0) >= 1);
ok("no forced crossorigin on the audio element", Music.audio.attrs.crossorigin === undefined);

// Pause (advance the clock past the 60ms duplicate-press guard)
toasts = [];
clockOffset += 500;
docListeners.filter(l => l[0] === "mousedown").forEach(l => {
  try { l[1]({ target: btn, button: 0, preventDefault(){}, stopPropagation(){} }); } catch(e){}
});
ok("second click pauses", Music.audio.paused === true);

// Video: no forced CORS, plays
vm.runInContext("videoPlayDirect('https://cdn.example.com/movie.mp4')", ctx);
const stage = byId["videoStage"];
const vids = stage ? stage.children.filter(c => c.tag === "video") : [];
ok("video element created", vids.length === 1);
ok("video has no forced crossorigin", vids.length === 1 && vids[0].attrs.crossorigin === undefined);
ok("video starts playing", vids.length === 1 && vids[0].paused === false);

// A genuinely failing source must report, not play silence
(async () => {
  toasts = [];
  Music.playlist.length = 0;
  Music.playlist.push({ name: "broken-track", url: "https://cdn.example.com/broken.mp3", source: "url" });
  clockOffset += 500;
  vm.runInContext("musicPlay(0)", ctx);
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  ok("failed source reports an error toast", toasts.length > 0 && toasts[toasts.length - 1].t === "err");
  ok("failed source clears the play icon",
     ctx.document.getElementById("mpPlayIcon").className.indexOf("play-fill") >= 0);

  console.log(failures.length ? "\nFAILURES: " + failures.join(" | ") : "\nALL PASS");
  process.exit(failures.length ? 1 : 0);
})();
