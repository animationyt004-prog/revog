/**
 * Site chrome behavior: sticky header shadow on scroll, mobile drawer toggle,
 * promo ticker rotation. Ports the small bits of client state from
 * navbar.tsx and promo-ticker.tsx that don't need a framework.
 */
(function () {
  const header = document.querySelector('[data-site-header]');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  const menuToggle = document.querySelector('[data-menu-toggle]');
  const drawer = document.querySelector('[data-mobile-drawer]');
  if (menuToggle && drawer) {
    menuToggle.addEventListener('click', () => {
      const open = drawer.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.querySelector('[data-icon-menu]').style.display = open ? 'none' : '';
      menuToggle.querySelector('[data-icon-close]').style.display = open ? '' : 'none';
    });
  }

  const ticker = document.querySelector('[data-promo-ticker]');
  if (ticker) {
    const DISMISS_KEY = 'hyra:promo-dismissed';
    const HOLD_MS = Number(ticker.dataset.holdMs || 4000);
    const messages = Array.from(ticker.querySelectorAll('.promo-ticker__msg'));
    let index = 0;
    let paused = false;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    try {
      if (sessionStorage.getItem(DISMISS_KEY) === '1') ticker.style.display = 'none';
    } catch (e) {
      /* private-mode storage access can throw; showing the bar is harmless */
    }

    ticker.addEventListener('mouseenter', () => (paused = true));
    ticker.addEventListener('mouseleave', () => (paused = false));

    if (!reduced && messages.length > 1) {
      setInterval(() => {
        if (paused) return;
        messages[index].classList.remove('is-active');
        index = (index + 1) % messages.length;
        messages[index].classList.add('is-active');
      }, HOLD_MS);
    }

    ticker.querySelector('[data-promo-dismiss]')?.addEventListener('click', () => {
      ticker.style.display = 'none';
      try {
        sessionStorage.setItem(DISMISS_KEY, '1');
      } catch (e) {
        /* closing for this render is enough */
      }
    });
  }
})();
