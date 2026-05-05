/* ==================================================
   Notion Pulse v3 — interactivity
   1) Screen navigation (data-go)
   2) Draggable bottom-sheet — peek / half / full snaps
   3) Slide-to-invest gesture
   ================================================== */
(() => {
  const screens = document.querySelectorAll('.screen');
  const dockButtons = document.querySelectorAll('.screens-dock button');

  function show(name) {
    screens.forEach((s) => { s.hidden = s.dataset.screen !== name; });
    dockButtons.forEach((b) => { b.classList.toggle('active', b.dataset.go === name); });
    window.scrollTo(0, 0);
    // reset slide-to-invest if leaving detail
    if (name !== 'detail') resetSlide();
  }

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-go]');
    if (!t) return;
    const target = t.dataset.go;
    if (target) show(target);
  });

  // ============================
  // Draggable bottom sheet
  // ============================
  const sheet  = document.getElementById('sheet');
  const handle = document.getElementById('sheetHandle');

  if (sheet && handle) {
    // Snap targets are the CSS top values for each state. We compute current
    // top from getBoundingClientRect and translate during the drag, then
    // commit the closest snap on release.
    function getSnaps() {
      const h = sheet.parentElement.offsetHeight; // .screen height
      // CSS uses: peek = 100vh - 110, half = 56vh, full = 60
      return {
        peek: h - 110,
        half: Math.round(h * 0.56),
        full: 60,
      };
    }

    let startY = 0;
    let startTop = 0;
    let pointerId = null;
    let dragging = false;

    function topPx() {
      const cs = getComputedStyle(sheet);
      return parseFloat(cs.top);
    }

    handle.addEventListener('pointerdown', (e) => {
      pointerId = e.pointerId;
      handle.setPointerCapture(pointerId);
      startY = e.clientY;
      startTop = topPx();
      dragging = true;
      sheet.classList.add('sheet--dragging');
    });

    handle.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dy = e.clientY - startY;
      const snaps = getSnaps();
      const next = Math.max(snaps.full - 20, Math.min(snaps.peek + 20, startTop + dy));
      sheet.style.top = next + 'px';
    });

    function release(e) {
      if (!dragging) return;
      dragging = false;
      sheet.classList.remove('sheet--dragging');
      handle.releasePointerCapture(pointerId);
      const cur = topPx();
      const snaps = getSnaps();
      // Find nearest snap
      let best = 'half', bestDist = Infinity;
      Object.entries(snaps).forEach(([k, v]) => {
        const d = Math.abs(cur - v);
        if (d < bestDist) { bestDist = d; best = k; }
      });
      // velocity-aware nudge: if dragging fast, prefer next/prev snap
      // (kept simple here — just use nearest)
      sheet.style.top = ''; // clear inline so [data-state] CSS takes over
      sheet.dataset.state = best;
    }
    handle.addEventListener('pointerup', release);
    handle.addEventListener('pointercancel', release);

    // Tap on handle (no drag) toggles peek <-> half
    let tapStartY = null;
    handle.addEventListener('pointerdown', (e) => { tapStartY = e.clientY; });
    handle.addEventListener('pointerup', (e) => {
      if (tapStartY != null && Math.abs(e.clientY - tapStartY) < 6) {
        const cur = sheet.dataset.state || 'half';
        sheet.dataset.state = cur === 'peek' ? 'half' : (cur === 'half' ? 'full' : 'peek');
      }
      tapStartY = null;
    });
  }

  // ============================
  // Slide-to-invest
  // ============================
  const slideTrack = document.getElementById('slideTrack');
  const slideThumb = document.getElementById('slideThumb');
  let slideTimer = null;

  function resetSlide() {
    if (!slideTrack || !slideThumb) return;
    slideThumb.style.left = '4px';
    slideTrack.style.setProperty('--progress', '0px');
    if (slideTimer) { clearTimeout(slideTimer); slideTimer = null; }
  }

  if (slideTrack && slideThumb) {
    let startX = 0;
    let startLeft = 4;
    let pid = null;
    let drag = false;

    slideThumb.addEventListener('pointerdown', (e) => {
      pid = e.pointerId;
      slideThumb.setPointerCapture(pid);
      startX = e.clientX;
      startLeft = parseFloat(slideThumb.style.left || '4');
      drag = true;
    });
    slideThumb.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const trackW = slideTrack.offsetWidth;
      const thumbW = slideThumb.offsetWidth;
      const max = trackW - thumbW - 4;
      const next = Math.max(4, Math.min(max, startLeft + (e.clientX - startX)));
      slideThumb.style.left = next + 'px';
      slideTrack.style.setProperty('--progress', (next + thumbW / 2) + 'px');
    });
    slideThumb.addEventListener('pointerup', () => {
      if (!drag) return;
      drag = false;
      slideThumb.releasePointerCapture(pid);
      const trackW = slideTrack.offsetWidth;
      const thumbW = slideThumb.offsetWidth;
      const left = parseFloat(slideThumb.style.left || '4');
      const max = trackW - thumbW - 4;
      if (left >= max - 4) {
        // success
        slideTrack.style.background = '#16a34a';
        slideTrack.querySelector('.slide-label, .slide-cta .slide-label');
        const label = document.querySelector('.slide-label');
        if (label) label.textContent = 'Invested ✓';
        slideTimer = setTimeout(() => {
          resetSlide();
          slideTrack.style.background = '';
          if (label) label.textContent = 'Slide to Invest';
        }, 2000);
      } else {
        // bounce back
        slideThumb.classList.add('slide-thumb--released');
        setTimeout(() => {
          slideThumb.style.left = '4px';
          slideThumb.classList.remove('slide-thumb--released');
          slideTrack.style.setProperty('--progress', '0px');
        }, 50);
      }
    });
  }
})();
