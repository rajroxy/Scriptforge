// The recent-project stats now live in the empty area beside the category
// cards (#catStats) and show the project clicked in the list below.
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
  };
}

const byId = {};
const documentStub = {
  readyState: "complete",
  addEventListener(){}, removeEventListener(){},
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
ctx.console = console;
ctx.setTimeout = () => 0; ctx.clearTimeout = () => {};
ctx.setInterval = () => 0; ctx.clearInterval = () => {};
ctx.URL = { createObjectURL(){ return "blob:x"; } };
ctx.MutationObserver = windowStub.MutationObserver; ctx.Date = Date; ctx.Promise = Promise;
ctx.FileReader = function(){}; ctx.Blob = function(){}; ctx.CustomEvent = function(){};

for (const f of ["state.js", "pages.js"]) vm.runInContext(fs.readFileSync(f, "utf8"), ctx, { filename: f });

vm.runInContext(`
  MODES.forEach(function(m){ if(!S.modes[m.id]) S.modes[m.id] = freshModeData(); });
  S.mode = 'novel';
  const mode = currentMode();
  const d = D();
  const cat = (mode.categories[0] && mode.categories[0].id) || "fiction";
  d.projects = [
    { id: "p1", name: "Non fiction memoir", category: cat,
      created: Date.now(), chapters: [
        { id: "c1", title: "One", content: "hello world", children: [] },
        { id: "c2", title: "Two", content: "another line here", children: [] }
      ] },
    { id: "p2", name: "Second book", category: cat, created: Date.now(), chapters: [] }
  ];
  d.currentCategory = cat;
`, ctx);

vm.runInContext("renderPagesOverlay()", ctx);

const failures = [];
const check = (label, cond) => { console.log((cond ? "  PASS  " : "  FAIL  ") + label); if (!cond) failures.push(label); };

const overlayHtml = byId["pagesOverlay"].innerHTML;
check("stats panel exists beside the category tiles", overlayHtml.includes('class="cat-stats" id="catStats"'));
check("tiles and panel share the .cat-row wrapper", overlayHtml.indexOf('class="cat-row"') < overlayHtml.indexOf('id="categoriesGrid"') && overlayHtml.indexOf('id="categoriesGrid"') < overlayHtml.indexOf('id="catStats"'));
check("tile columns are a definite count (so the panel gets the rest)",
  (byId["categoriesGrid"].style.gridTemplateColumns || "").includes("repeat("));

// Category tiles: one Vercel-style "New project" button, no icon-only buttons
const tiles = byId["categoriesGrid"].children;
check("a tile was rendered per category", tiles.length === 2);
const tile = tiles[0].innerHTML;
check("tile has the New project button", tile.includes('class="cat-new-btn"') && tile.includes("New project"));
check("button still creates in that category", tile.includes('data-cat-new="fiction"'));
check("plus / open-folder icon buttons removed", !tile.includes("cat-icon-btn") && !tile.includes("data-cat-open") && !tile.includes("cat-actions"));

// empty state before any click
const emptyHtml = byId["catStats"].innerHTML;
check("panel shows an empty-state hint before a click", emptyHtml.includes("cat-stats-empty") && /click a project/i.test(emptyHtml));
// simulate clicking the second project's row (the real handler path)
vm.runInContext(`
  setStatsProject("p2");
  renderProjectStatsPanel();
`, ctx);
check("panel now shows the clicked project's numbers", /cat-stat-val">0</.test(byId["catStats"].innerHTML) && !byId["catStats"].innerHTML.includes("Second book"));

vm.runInContext(`
  setStatsProject("p1");
  renderProjectStatsPanel();
`, ctx);
const panel = byId["catStats"].innerHTML;
check("panel shows sections count (2)", /cat-stat-val">2</.test(panel));
check("panel shows word count (5)", /cat-stat-val">5</.test(panel));
check("panel shows a created date", panel.includes("cat-stat-val-sm") && /20\d\d/.test(panel));
check("created sits in the top block", panel.indexOf("cat-stats-top") < panel.indexOf("Created") && panel.indexOf("Created") < panel.indexOf("cat-stats-bottom"));
check("card shows the Project stats label again", panel.includes("cat-stats-head") && /project stats/i.test(panel));
check("empty state shows the label too", /project stats/i.test(emptyHtml));
check("project name removed from the card", !panel.includes("cat-stats-name") && !panel.includes("Non fiction memoir"));
check("created is right-aligned", panel.includes("cat-stat-created cat-stat-right"));
check("words + sections share the bottom block", panel.indexOf("cat-stats-bottom") < panel.indexOf("Words") && panel.indexOf("Words") < panel.indexOf("Sections"));

// the row itself must no longer carry stats
vm.runInContext("setStatsProject('p1'); renderProjectsForCategory(D().currentCategory)", ctx);
const row = byId["projList"].children[0].innerHTML;
check("row has no stats block any more", !row.includes("proj-stats") && !row.includes("proj-stat"));
check("row has rename + delete buttons", row.includes("data-proj-rename=\"p1\"") && row.includes("data-proj-del=\"p1\""));
check("rename/delete are quiet ghost buttons", row.includes("class=\"proj-actions\"") && /proj-btn( danger)?"/.test(row));
check("delete uses the playlist's thin × (not a trash icon)", row.includes("<svg") && row.includes('d="M2 2L8 8M8 2L2 8"') && !row.includes("bi-trash"));
check("rename uses the playlist's small pencil", row.includes("bi-pencil"));

check("buttons sit outside the clickable project row", row.indexOf("proj-item\"") < row.indexOf("proj-actions"));
check("no expand panel at all", !row.includes("proj-expand"));
check("Open project / Show in folder still gone", !row.includes("data-proj-open") && !row.includes("data-proj-showfolder"));
check("row still selectable + opens on double-click", row.includes("data-proj-toggle") && row.includes("Double-click to open"));
check("selected project row is highlighted", row.includes("proj-row active"));

// A saved selection from an earlier session must NOT resurrect the card
vm.runInContext(`
  D()._statsProject = 'p1';        // stale field left in saved state
  setStatsProject(null);           // fresh page load
  renderPagesOverlay();
`, ctx);
const fresh = byId["catStats"].innerHTML;
check("stale saved selection does not show stats", !fresh.includes("Non fiction memoir") && fresh.includes("cat-stats-empty"));
check("selecting keeps the choice out of saved state", vm.runInContext("delete D()._statsProject; setStatsProject('p2'); D()._statsProject === undefined", ctx));

// The overlay itself is sized to the content, so there is no dead space to the
// right of the stats column: 2 tiles (164 each) + gap + stats (240) + padding.
const layout = fs.readFileSync("layout.css", "utf8");
const overlayW = Number((layout.match(/\.pages-overlay\{[\s\S]*?width:(\d+)px/) || [])[1]);
const statsW = Number((fs.readFileSync("pages.css", "utf8").match(/\.cat-stats\{[\s\S]*?width:(\d+)px/) || [])[1]);
const needed = 2 * 164 + 8 + statsW + 40 + 2;
check("overlay width fits tiles + stats (no empty space right of the stats)",
  overlayW > 0 && overlayW >= needed && overlayW <= needed + 20);

// Button styling lives in layout.css with the tile
check("New project button is a filled, full-width tile action",
  /\.cat-new-btn\{[^}]*margin-top:auto/.test(layout) && /\.cat-new-btn\{[^}]*width:100%/.test(layout) && /\.cat-new-btn\{[^}]*background:var\(--accent\)/.test(layout));
check("old icon-button CSS removed", !/\.cat-icon-btn\{/.test(layout) && !/\.cat-actions\{/.test(layout));

// CSS
const css = fs.readFileSync("pages.css", "utf8");
check("panel CSS: capped width so it is not stretched", /\.cat-stats\{[^}]*flex:0 1 270px/.test(css) && /\.cat-stats\{[^}]*max-width:100%/.test(css));
check("row never wraps, so the card stays right of the last tile", /\.cat-row\{[^}]*flex-wrap:nowrap/.test(css));
check("card shrinks instead of dropping below the tiles", /\.cat-stats\{[^}]*min-width:180px/.test(css));
// the card's own left edge is the vertical divider after the last tile
check("panel CSS: boxed card beside the tiles", /\.cat-stats\{[^}]*border:1px solid var\(--line\)/.test(css) && /\.cat-stats\{[^}]*border-radius:var\(--r-md\)/.test(css));
check("card has no horizontal divider", !/\.cat-stats-name\{/.test(css));
check("ghost buttons match the playlist rows (22px, borderless, fade in on hover)",
  /\.proj-btn\{[^}]*width:22px/.test(css) && /\.proj-btn\{[^}]*border:none/.test(css) && /\.proj-btn\{[^}]*opacity:0/.test(css) && /\.proj-row:hover \.proj-btn[^{]*\{[^}]*opacity:1/.test(css));
check("no legacy per-item card box in layout.css", !/\.proj-item\{[^}]*border:1px solid/.test(layout));
check("panel CSS: fits the tile height", /\.cat-row\{[^}]*align-items:stretch/.test(css));
check("dead expand CSS removed", !/\.proj-expand\{/.test(css) && !/\.proj-action\{/.test(css) && !/\.proj-open-btn\{/.test(css));
check("panel CSS: created top-right, numbers bottom row", /\.cat-stats-top\{[^}]*justify-content:space-between/.test(css) && /\.cat-stats-bottom\{[^}]*justify-content:space-between/.test(css) && /\.cat-stat-created\{[^}]*max-width/.test(css));
check("card label CSS is back", /\.cat-stats-head\{/.test(css));
check("name row CSS removed", !/\.cat-stats-name\{/.test(css));
check("old row stats CSS removed", !/\.proj-stats\{/.test(css));

console.log(failures.length ? "\nFAILURES: " + failures.join(" | ") : "\nALL PASS");
process.exit(failures.length ? 1 : 0);
