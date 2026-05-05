/* Notion Pulse v1 — screen navigation */
(() => {
  const screens = document.querySelectorAll('.screen');
  const dockButtons = document.querySelectorAll('.screens-dock button');

  function show(name) {
    screens.forEach((s) => {
      s.hidden = s.dataset.screen !== name;
    });
    dockButtons.forEach((b) => {
      b.classList.toggle('active', b.dataset.go === name);
    });
    window.scrollTo(0, 0);
  }

  // Bind any [data-go="screen"] click → switch screen
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-go]');
    if (!t) return;
    const target = t.dataset.go;
    if (target) show(target);
  });

  // Splash auto-advances to onboarding 1 after 1500ms
  setTimeout(() => {
    const active = document.querySelector('.screen:not([hidden])');
    if (active && active.dataset.screen === 'splash') show('ob1');
  }, 1500);

  // Pre-fill task title in detail when clicking a task on home
  document.addEventListener('click', (e) => {
    const task = e.target.closest('.task[data-task]');
    if (!task) return;
    const title = document.getElementById('detailTitle');
    if (title) title.textContent = task.dataset.task;
    show('detail');
  });

  // Priority pill toggle
  document.querySelectorAll('.priority__pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.priority__pill').forEach((p) =>
        p.classList.remove('priority__pill--active'));
      pill.classList.add('priority__pill--active');
    });
  });

  // Today date
  const today = document.getElementById('todayDate');
  if (today) {
    const d = new Date();
    today.textContent = d.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    });
  }
})();
