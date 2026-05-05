/* Notion Pulse v2 — screen navigation */
(() => {
  const screens = document.querySelectorAll('.screen');
  const dockButtons = document.querySelectorAll('.screens-dock button');

  function show(name) {
    screens.forEach((s) => { s.hidden = s.dataset.screen !== name; });
    dockButtons.forEach((b) => { b.classList.toggle('active', b.dataset.go === name); });
    window.scrollTo(0, 0);
  }

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-go]');
    if (!t) return;
    const target = t.dataset.go;
    if (target) show(target);
  });

  // Splash auto-advances
  setTimeout(() => {
    const active = document.querySelector('.screen:not([hidden])');
    if (active && active.dataset.screen === 'splash') show('ob1');
  }, 1400);

  // Inbox tap → detail
  document.querySelectorAll('.inbox li[data-task]').forEach((li) => {
    li.addEventListener('click', () => {
      document.getElementById('detailTitle').textContent = li.dataset.task;
      show('detail');
    });
  });

  // Priority pills
  document.querySelectorAll('.priority__pill').forEach((p) => {
    p.addEventListener('click', () => {
      document.querySelectorAll('.priority__pill').forEach((q) =>
        q.classList.remove('priority__pill--active'));
      p.classList.add('priority__pill--active');
    });
  });
})();
