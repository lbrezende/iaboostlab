/* =====================================================
   Banco Inter — interactivity
   1) Sticky-scroll iPhone — pure-CSS sticky inside a JS-measured track,
      so the phone unsticks exactly when its center is at the hand's palm.
   2) Subtle parallax on the hand: drifts up + slightly leftward, as if
      reaching for the sticky phone.
   3) Meu Porquinho calculator (slider + period tabs).
   4) Card category tabs.
   ===================================================== */

(() => {

  // ===============================
  // 1) STICKY iPHONE + 2) HAND PARALLAX
  // ===============================
  const solucoes  = document.getElementById('solucoes');
  const innerEl   = solucoes && solucoes.querySelector('.solucoes__inner');
  const phoneWrap = document.querySelector('.solucoes__phone-wrap');
  const phoneEl   = document.getElementById('phoneSticky');
  const handEl    = document.querySelector('.solucoes__hand');

  // Calibrated against assets/hand.png (768x1024). The palm — i.e. the spot
  // where the sticky phone visually rests — sits roughly here:
  const PALM_X_PCT = 0.36;
  const PALM_Y_PCT = 0.30;
  const PHONE_HALF_HEIGHT = 270; // half the iPhone visual height (540 / 2)

  // Subtle parallax magnitudes — small enough to keep the phone aligned
  // with the palm even after the hand drifts.
  const PARALLAX_MAX_X = -10;  // px (leftward)
  const PARALLAX_MAX_Y = -20;  // px (upward)

  function layoutPhoneTrack() {
    if (!phoneWrap || !handEl || !innerEl) return;

    const handWidth  = handEl.offsetWidth;
    const handHeight = handEl.offsetHeight;
    if (!handWidth || !handHeight) return; // image not loaded yet

    // Hand position is relative to .solucoes__inner (inner is the offsetParent
    // because .solucoes__inner has position: relative).
    const handLeft = handEl.offsetLeft;
    const handTop  = handEl.offsetTop;

    const palmX = handLeft + handWidth  * PALM_X_PCT;
    const palmY = handTop  + handHeight * PALM_Y_PCT;

    // Make sure inner is tall enough that the phone-track can extend
    // PHONE_HALF_HEIGHT past the palm. Without this, the track is clamped
    // to inner.height and the phone unsticks too early.
    const requiredInnerHeight = palmY + PHONE_HALF_HEIGHT + 60;
    innerEl.style.minHeight = requiredInnerHeight + 'px';
    const innerHeight = innerEl.offsetHeight;

    // Center the phone horizontally on palm-x.
    const phoneWidth = phoneWrap.offsetWidth;
    phoneWrap.style.left = (palmX - phoneWidth / 2) + 'px';
    phoneWrap.style.transform = 'none'; // override the CSS translateX(-50%)

    // Track bottom: extends PHONE_HALF_HEIGHT below the palm so that, when
    // sticky reaches its container bottom, the phone center lands on palm.
    const trackBottomY = palmY + PHONE_HALF_HEIGHT;
    phoneWrap.style.bottom = Math.max(0, innerHeight - trackBottomY) + 'px';
  }

  function updateHandParallax() {
    if (!handEl || !solucoes) return;
    const rect = solucoes.getBoundingClientRect();
    const winH = window.innerHeight;
    const denom = rect.height - winH;
    if (denom <= 0) return;
    let progress = -rect.top / denom;
    progress = Math.max(0, Math.min(1, progress));
    // Hand only enters the viewport in the lower half, so weight progress
    // toward the back end of the section.
    const handProgress = Math.max(0, (progress - 0.35) / 0.65);
    const tx = handProgress * PARALLAX_MAX_X;
    const ty = handProgress * PARALLAX_MAX_Y;
    handEl.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px)`;
  }

  let ticking = false;
  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateHandParallax();
        ticking = false;
      });
      ticking = true;
    }
  }

  function initSolucoes() {
    layoutPhoneTrack();
    updateHandParallax();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
      layoutPhoneTrack();
      updateHandParallax();
    });
  }

  // The hand image dimensions drive the math, so wait for it to load.
  if (handEl) {
    if (handEl.complete && handEl.naturalWidth > 0) {
      initSolucoes();
    } else {
      handEl.addEventListener('load', initSolucoes, { once: true });
    }
  } else {
    initSolucoes();
  }

  // ===============================
  // 3) MEU PORQUINHO CALCULATOR
  // ===============================
  const slider     = document.getElementById('calcSlider');
  const fillEl     = document.getElementById('calcSliderFill');
  const thumbEl    = document.getElementById('calcSliderThumb');
  const amountEl   = document.getElementById('calcAmount');
  const totalEl    = document.getElementById('calcTotal');
  const investedEl = document.getElementById('calcInvested');
  const returnEl   = document.getElementById('calcReturn');
  const periodBtns = document.querySelectorAll('.calc__period-btn');

  const fmt = (n) => 'R$ ' + n.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const state = { monthly: 200, months: 12, rate: 0.01 };

  // Compound interest: monthly contribution at rate r over n months.
  // FV = P * ((1+r)^n - 1) / r
  function calculate() {
    const { monthly, months, rate } = state;
    const invested = monthly * months;
    const fv = monthly * (Math.pow(1 + rate, months) - 1) / rate;
    const ret = fv - invested;
    if (totalEl)    totalEl.textContent    = fmt(fv);
    if (investedEl) investedEl.textContent = fmt(invested);
    if (returnEl)   returnEl.textContent   = fmt(ret);
    if (amountEl)   amountEl.textContent   = fmt(monthly);
  }

  function updateSliderUI() {
    if (!slider) return;
    const min = +slider.min, max = +slider.max, val = +slider.value;
    const pct = ((val - min) / (max - min)) * 100;
    if (fillEl)  fillEl.style.width  = `${pct}%`;
    if (thumbEl) thumbEl.style.left  = `${pct}%`;
  }

  if (slider) {
    slider.addEventListener('input', () => {
      state.monthly = +slider.value;
      updateSliderUI();
      calculate();
    });
    updateSliderUI();
  }

  periodBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      periodBtns.forEach((b) => b.classList.remove('calc__period-btn--active'));
      btn.classList.add('calc__period-btn--active');
      state.months = +btn.dataset.months;
      calculate();
    });
  });
  calculate();

  // ===============================
  // 4) CARD CATEGORY TABS (visual)
  // ===============================
  const cardTabs = document.querySelectorAll('.cartoes__tabs .tag');
  cardTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      cardTabs.forEach((t) => {
        t.classList.remove('tag--active');
        const dot = t.querySelector('.dot-mini');
        if (dot) dot.remove();
      });
      tab.classList.add('tag--active');
      const dot = document.createElement('span');
      dot.className = 'dot-mini';
      tab.prepend(dot);
    });
  });

  // ===============================
  // 5) MOBILE NAV (hamburger)
  // ===============================
  const hamburger = document.getElementById('navHamburger');
  const drawer    = document.getElementById('navDrawer');
  if (hamburger && drawer) {
    hamburger.addEventListener('click', () => {
      const open = drawer.classList.toggle('nav__drawer--open');
      hamburger.setAttribute('aria-expanded', String(open));
      hamburger.classList.toggle('nav__hamburger--open', open);
      drawer.setAttribute('aria-hidden', String(!open));
    });
  }
})();
