/* =====================================================
   Banco Inter — interactivity
   1) Sticky-scroll iPhone (stops at the hand)
   2) Meu Porquinho calculator (slider + period tabs)
   3) Card category tabs
   ===================================================== */

(() => {
  // ================================
  // 1) STICKY iPHONE — manual sticky
  // It scrolls with the page until the hand is reached, then stops.
  // The technique:
  //  - the wrapper spans from "iPhone start" to bottom of solucoes section
  //  - inside, the iPhone is position:sticky with top:90px while in view
  //  - when the hand intersects, we change to absolute at the rest position
  // ================================

  const phoneWrap = document.querySelector('.solucoes__phone-wrap');
  const phoneSticky = document.getElementById('phoneSticky');
  const hand = document.querySelector('.solucoes__hand');
  const solucoes = document.getElementById('solucoes');

  if (phoneWrap && phoneSticky && hand && solucoes) {
    const update = () => {
      const wrapRect = phoneWrap.getBoundingClientRect();
      const handRect = hand.getBoundingClientRect();
      const phoneHeight = phoneSticky.offsetHeight;
      const stickyTop = 90; // matches CSS top

      // Where would the phone bottom be if sticky at stickyTop?
      const phoneBottomIfSticky = stickyTop + phoneHeight;
      // Hand top in viewport
      const handTop = handRect.top;

      // If phone bottom would overlap the hand top, freeze the phone
      if (handTop < phoneBottomIfSticky) {
        // Pin phone so its bottom touches the hand top
        const offsetWithinWrap = (handTop - wrapRect.top) - phoneHeight;
        phoneSticky.style.position = 'absolute';
        phoneSticky.style.top = `${Math.max(0, offsetWithinWrap)}px`;
      } else {
        phoneSticky.style.position = 'sticky';
        phoneSticky.style.top = `${stickyTop}px`;
      }
    };

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => { update(); ticking = false; });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  // ================================
  // 2) MEU PORQUINHO CALCULATOR
  // ================================
  const slider = document.getElementById('calcSlider');
  const fillEl = document.getElementById('calcSliderFill');
  const thumbEl = document.getElementById('calcSliderThumb');
  const amountEl = document.getElementById('calcAmount');
  const totalEl = document.getElementById('calcTotal');
  const investedEl = document.getElementById('calcInvested');
  const returnEl = document.getElementById('calcReturn');
  const periodBtns = document.querySelectorAll('.calc__period-btn');

  const fmt = (n) =>
    'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const state = {
    monthly: 200,
    months: 12,
    rate: 0.01, // 1% per month, per disclaimer
  };

  // Compound interest: monthly contribution at rate r over n months.
  // FV = P * ((1+r)^n - 1) / r
  const calculate = () => {
    const { monthly, months, rate } = state;
    const invested = monthly * months;
    const fv = monthly * (Math.pow(1 + rate, months) - 1) / rate;
    const ret = fv - invested;

    if (totalEl) totalEl.textContent = fmt(fv);
    if (investedEl) investedEl.textContent = fmt(invested);
    if (returnEl) returnEl.textContent = fmt(ret);
    if (amountEl) amountEl.textContent = fmt(monthly);
  };

  const updateSliderUI = () => {
    if (!slider) return;
    const min = +slider.min, max = +slider.max, val = +slider.value;
    const pct = ((val - min) / (max - min)) * 100;
    if (fillEl) fillEl.style.width = `${pct}%`;
    if (thumbEl) thumbEl.style.left = `${pct}%`;
  };

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

  // initial calc
  calculate();

  // ================================
  // 3) CARD CATEGORY TABS (visual only)
  // ================================
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
})();
