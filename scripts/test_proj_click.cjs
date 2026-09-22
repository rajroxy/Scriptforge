// Clicking a recent-project row selects it for the stats panel; double-clicking
// opens the project in the editor (the old Open Project button is gone).
const fs = require("fs"), vm = require("vm");

function makeEl(tag) {
  return {
    tag, children: [], dataset: {}, style: { cssText: "" }, className: "", hidden: false,
    classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    set innerHTML(v){ this._html = v; if(v === "") this.children.length = 0; this._txt = String(v == null ? "" : v).replace(/<[^>]*>/g, ""); },
    get innerHTML(){ return this._html || ""; },
    set innerText(v){ this._txt = v; }, get innerText(){ return this._txt || ""; },
    set textContent(v){ this._txt = v; }, get textContent(){ return this._txt || ""; },
    appendChild(c){ this.children.push(c); return c; },
    querySelector(){ return null; }, querySelectorAll(){ return []; },
    addEventListener(){}, setAttribute(){}, getAttribute(){ return null; },
    remove(){}, focus(){}, blur(){}, click(){},
  };
}

const byId = {};
const docEvents = {};
const documentStub = {
  readyState: "complete",
  addEventListener(type, fn){ (docEvents[type] = docEvents[type] || []).push(fn); },
  removeEventListener(){},
  getElementById(id){ if(!byId[id]) byId[id] = makeEl("div#" + id); return byId[id]; },
  createElement(t){ return makeEl(t); },
  querySelector(){ return null; }, querySelectorAll(){ return []; },
  body: makeEl("body"), documentElement: makeEl("html"),
};
const storage = {};
const windowStub = {
  document: documentStub, addEventListener(){}, removeEventListener(){},
  matchMedia(){ return { addEventListener(){}, matches: false }; },
  localStorage: { getItem: k => storage[k] ?? null, setItem: (k,v) => { storage[k] = String(v); }, removeItem: k => { delete storage[k]; } },
  location: { href: "", pathname: "/", search: "", reload(){} },
  navigator: { userAgent: "test" },
  requestAnimationFrame(){ return 0; }, cancelAnimationFrame(){},
  MutationObserver: function(){ return { observe(){}, disconnect(){} }; },
};
windowStub.window = windowStub; windowStub.self = windowStub;

const ctx = vm.createContext(windowStub);
ctx.console = { log(){}, warn(){}, error(){} };
ctx.setTimeout = () => 0; ctx.clearTimeout = () => {};
ctx.setInterval = () => 0; ctx.clearInterval = () => {};
ctx.URL = { createObjectURL(){ return "blob:x"; }, revokeObjectURL(){} };
ctx.MutationObserver = windowStub.MutationObserver; ctx.Date = Date; ctx.Promise = Promise;
ctx.FileReader = function(){}; ctx.Blob = function(){}; ctx.CustomEvent = function(){};
ctx.Audio = function(){ return { addEventListener(){}, play(){ return Promise.resolve(); }, pause(){}, load(){} }; };
ctx.AudioContext = function(){ return { createMediaElementSource(){ return { connect(){} }; }, destination:{}, state:"running", resume(){ return Promise.resolve(); }, createAnalyser(){ return { connect(){}, frequencyBinCount: 8, getByteFrequencyData(){} }; } }; };

for (const f of ["state.js", "pages.js", "app.js"]) vm.runInContext(fs.readFileSync(f, "utf8"), ctx, { filename: f });

// Spy on navigation + capture what the click handlers do
let navigatedTo = null;
vm.runInContext(`
  goPage = function(id){ __nav = id; };
  S.mode = 'novel';
  MODES.forEach(function(m){ if(!S.modes[m.id]) S.modes[m.id] = freshModeData(); });
  const mode = currentMode();
  const d = D();
  const cat = mode.categories[0].id;
  d.projects = [{ id: 'p1', name: 'Memoir', category: cat, mode: 'novel', created: Date.now(),
                  chapters: [{ id: 'c1', title: 'Chapter 1', content: 'x', children: [] }] }];
  d.currentCategory = cat;
`, ctx);
Object.defineProperty(ctx, "__nav", { get(){ return navigatedTo; }, set(v){ navigatedTo = v; } });

const failures = [];
const check = (label, cond) => { console.log((cond ? "  PASS  " : "  FAIL  ") + label); if (!cond) failures.push(label); };

function clickOnRow(detail) {
  const row = makeEl("div");
  row.dataset.projToggle = "p1";
  row.closest = function (sel) { return sel === "[data-proj-toggle]" ? this : null; };
  const ev = { preventDefault(){}, stopPropagation(){}, detail, target: row };
  for (const fn of (docEvents.click || [])) fn(ev);
}

// Click on one of the row's action buttons (they sit outside the toggle div)
function clickButton(attr, value) {
  const btn = makeEl("button");
  btn.dataset[attr.replace(/^data-/, "").replace(/-([a-z])/g, (m, c) => c.toUpperCase())] = value;
  btn.closest = function (sel) { return sel === "[" + attr + "]" ? this : null; };
  const ev = { preventDefault(){}, stopPropagation(){}, detail: 1, target: btn };
  for (const fn of (docEvents.click || [])) fn(ev);
}

function clickCategory(catId) {
  const tile = makeEl("div");
  tile.dataset.catPick = catId;
  tile.closest = function (sel) { return sel === "[data-cat-pick]" ? this : null; };
  const ev = { preventDefault(){}, stopPropagation(){}, detail: 1, target: tile };
  for (const fn of (docEvents.click || [])) fn(ev);
}

// single click → selects for the stats panel, no navigation
clickOnRow(1);
check("single click selects the project for the stats panel", vm.runInContext("getStatsProject() === 'p1'", ctx));
check("the selection is not written into saved state", vm.runInContext("D()._statsProject === undefined", ctx));
check("single click does not open the editor", navigatedTo === null);
check("stats panel shows the selection (1 section / 1 word)", /cat-stat-val">1</.test(byId["catStats"].innerHTML));

// double click → opens the project
navigatedTo = null;
clickOnRow(2);
check("double click opens the project (navigates to write)", navigatedTo === "write");
check("opened project becomes the working set", vm.runInContext("D().currentProject === 'p1'", ctx));

// rename button
vm.runInContext("setStatsProject('p1')", ctx);
ctx.prompt = () => "Renamed book";
clickButton("data-proj-rename", "p1");
check("rename button renames the project", vm.runInContext("D().projects[0].name === 'Renamed book'", ctx));
check("rename button does not change the stats selection", vm.runInContext("getStatsProject() === 'p1'", ctx));
check("stats card still shows the project's numbers after rename", /cat-stat-val">1</.test(byId["catStats"].innerHTML));

// delete button
ctx.confirm = () => true;
clickButton("data-proj-del", "p1");
check("delete button removes the project", vm.runInContext("D().projects.length === 0", ctx));
check("stats card empties when its project is deleted", vm.runInContext("getStatsProject() === null", ctx) && byId["catStats"].innerHTML.includes("cat-stats-empty"));

// clicking a category clears the stats card
vm.runInContext(`
  D().projects = [{ id: 'p9', name: 'Kept', category: D().currentCategory, mode: 'novel', created: Date.now(),
                    chapters: [{ id: 'c9', title: 'One', content: 'hi', children: [] }] }];
  setStatsProject('p9'); renderProjectStatsPanel();
`, ctx);
check("card shows the selected project again", /cat-stat-val">1</.test(byId["catStats"].innerHTML) && !byId["catStats"].innerHTML.includes("cat-stats-empty"));
clickCategory(vm.runInContext("D().currentCategory", ctx));
check("clicking the category clears the selection", vm.runInContext("getStatsProject() === null", ctx));
check("clicking the category hides the stats", !byId["catStats"].innerHTML.includes("Kept") && byId["catStats"].innerHTML.includes("cat-stats-empty"));

// the removal really happened
const html = fs.readFileSync("pages.js", "utf8");
check("no Open Project button rendered any more", !html.includes('data-proj-open='));
check("no Show in folder button rendered any more", !html.includes('data-proj-showfolder='));
check("rename + delete are rendered in the row", html.includes('data-proj-rename=') && html.includes('data-proj-del='));
check("no leftover expand panel", !html.includes('class="proj-expand"'));

console.log(failures.length ? "\nFAILURES: " + failures.join(" | ") : "\nALL PASS");
process.exit(failures.length ? 1 : 0);
