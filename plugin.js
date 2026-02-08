(function () {
  'use strict';

  // ── Register side panel button ────────────────────────────────────
  if (typeof PluginAPI !== 'undefined') {
    PluginAPI.registerSidePanelButton({
      label: 'Super Pilot',
      icon: 'smart_toy',
      onClick: () => {}
    });
  }
})();
