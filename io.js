/* ═══════════════════════════════════════════════════════════
   ScriptForge — Import / Export
   ═══════════════════════════════════════════════════════════ */

const IO = {};

// ═══ Export current project as JSON ═══
IO.exportProject = async function(){
  const d = D();
  const proj = (d.projects || []).find(p => p.id === d.currentProject);
  if(!proj){
    toast('No project open', 'warn');
    return;
  }

  const payload = {
    app: 'ScriptForge',
    version: 1,
    exportedAt: new Date().toISOString(),
    mode: S.mode,
    category: proj.category,
    project: {
      id: proj.id,
      name: proj.name,
      created: proj.created,
      chapters: proj.chapters || [],
      notes: proj.notes || [],
      beats: proj.beats || [],
      cast: proj.cast || [],
      references: proj.references || [],
      timeline: proj.timeline || [],
      kanban: proj.kanban || null
    }
  };

  const filename = (proj.name || 'project').replace(/[^a-z0-9\-_ ]/gi, '_') + '.json';
  const json = JSON.stringify(payload, null, 2);

  /* the file keeps its home, so the next export rewrites it instead of
     arriving beside it as “name (1).json” */
  const res = await FS.saveFile(filename, json, 'application/json', { path: proj.savedPath || null });
  if(res.ok){
    if(res.method !== 'download' && res.path) proj.savedPath = res.path;
    save();
    if(res.download){
      toast('Downloaded ' + filename + ' — the browser names a download, so it cannot be overwritten here', 'warn');
    }else{
      toast((res.replaced ? 'Updated ' : 'Saved ') + (res.path || filename));
    }
    const infoEl = document.getElementById('projectSavedPath');
    if(infoEl) infoEl.textContent = proj.savedPath || '';
  } else if(res.error && res.error !== 'cancelled'){
    toast('Export failed: ' + res.error, 'err');
  }
};

// ═══ Import a project from a JSON file ═══
IO.importProject = async function(){
  const file = await FS.openFile('.json');
  if(!file) return;

  let parsed;
  try{
    parsed = JSON.parse(file.content);
  }catch(e){
    toast('Invalid JSON file', 'err');
    return;
  }

  // Validate — look for project object
  const src = parsed.project || parsed;
  if(!src || typeof src !== 'object'){
    toast('File does not contain a project', 'err');
    return;
  }

  // Import into the current mode
  const d = D();
  const newId = uid();
  const catId = src.category || d.currentCategory || currentMode()?.categories?.[0]?.id;

  const newProj = {
    id: newId,
    name: (src.name || file.name.replace(/\.[^.]+$/, '')) + ' (imported)',
    category: catId,
    mode: S.mode,
    created: src.created || Date.now(),
    chapters: src.chapters || [{id: uid(), title:'Section 1', content:'', children:[], collapsed:false}],
    notes: src.notes || [],
    beats: src.beats || [],
    cast: src.cast || [],
    references: src.references || [],
    timeline: src.timeline || [],
    kanban: src.kanban || null
  };

  if(!Array.isArray(d.projects)) d.projects = [];
  d.projects.push(newProj);
  useProjectData(newProj);           // the import gets its own Views · Reference · Workflow
  d.currentCategory = catId;
  d.currentChapter = newProj.chapters[0]?.id || null;
  save();

  toast('Imported: ' + newProj.name);

  // Refresh UI
  if(typeof renderProjectsForCategory === 'function') renderProjectsForCategory(catId);
  if(typeof goPage === 'function') goPage('inspire');   // land on the Idea view
};

window.IO = IO;

console.log('%c ✓ io.js loaded', 'color:#10b981;font-weight:600;');
