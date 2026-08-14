/**
 * Hero carousel: auto-advance every 5s, paused on hover/focus, skipped for
 * prefers-reduced-motion. Ports the state machine from
 * apps/web/src/components/home/hero.tsx (React) to plain DOM.
 */
(function () {
  const ADVANCE_MS = 5000;
  const root = document.querySelector('[data-hero]');
  if (!root) return;

  const slides = Array.from(root.querySelectorAll('.hero__slide'));
  const copies = Array.from(root.querySelectorAll('[data-hero-copy]'));
  const dots = Array.from(root.querySelectorAll('[data-hero-dot]'));
  const count = slides.length;
  if (count < 2) return;

  let index = 0;
  let paused = false;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function go(next) {
    index = ((next % count) + count) % count;
    slides.forEach((s, i) => s.classList.toggle('is-active', i === index));
    copies.forEach((c, i) => (c.hidden = i !== index));
    dots.forEach((d, i) => d.classList.toggle('is-active', i === index));
  }

  root.querySelector('[data-hero-prev]')?.addEventListener('click', () => go(index - 1));
  root.querySelector('[data-hero-next]')?.addEventListener('click', () => go(index + 1));
  dots.forEach((d, i) => d.addEventListener('click', () => go(i)));

  root.addEventListener('mouseenter', () => (paused = true));
  root.addEventListener('mouseleave', () => (paused = false));
  root.addEventListener('focusin', () => (paused = true));
  root.addEventListener('focusout', () => (paused = false));

  if (!reduced) {
    setInterval(() => {
      if (!paused) go(index + 1);
    }, ADVANCE_MS);
  }
})();
