/* ═══════════════════════════════════════════════════════════
   Window controls (desktop app)

   The window keeps its native frame, so these buttons are optional —
   but if a build ever adds its own, they are wired here. Everything
   goes through the preload bridge: the renderer never touches Node.
   ═══════════════════════════════════════════════════════════ */
(function(){
  const api = window.electronAPI;
  if(!api) return;                              /* the browser: nothing to do */

  const on = function(id, fn){
    const el = document.getElementById(id);
    if(!el || typeof fn !== 'function') return;
    el.addEventListener('click', function(e){ e.preventDefault(); fn(); });
  };

  on('minimize-btn', function(){ if(api.minimize) api.minimize(); });
  on('maximize-btn', function(){ if(api.maximize) api.maximize(); });
  on('close-btn',    function(){ if(api.close)    api.close();    });
})();
