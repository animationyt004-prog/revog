/**
 * Quick-add from the product card grid: reveal the size picker on hover
 * (desktop) or tap (mobile-safe via a toggle button), then POST to Shopify's
 * /cart/add.js and open the cart drawer. Ports the two-step interaction from
 * apps/web/src/components/product/product-card.tsx.
 */
(function () {
  document.addEventListener('click', (e) => {
    const toggle = e.target.closest('[data-quickadd-toggle]');
    if (toggle) {
      const sizes = toggle.closest('.product-card__quickadd').querySelector('[data-quickadd-sizes]');
      sizes.hidden = false;
      toggle.hidden = true;
      return;
    }

    const addBtn = e.target.closest('[data-add-to-cart]');
    if (addBtn) {
      e.preventDefault();
      if (addBtn.disabled) return;
      const variantId = addBtn.dataset.variantId;
      const original = addBtn.textContent;
      addBtn.textContent = '…';
      addBtn.disabled = true;
      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: variantId, quantity: 1 }),
      })
        .then((res) => {
          if (!res.ok) throw new Error('add failed');
          document.dispatchEvent(new CustomEvent('cart:refresh'));
          document.dispatchEvent(new CustomEvent('cart:open'));
        })
        .catch(() => undefined)
        .finally(() => {
          addBtn.textContent = original;
          addBtn.disabled = false;
        });
    }
  });

  document.addEventListener('cart:open', () => document.body.classList.add('cart-open'));
})();
