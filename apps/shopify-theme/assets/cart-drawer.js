/**
 * Cart drawer, driven by Shopify's Ajax Cart API (/cart.js, /cart/change.js,
 * /cart/update.js). Ports the layout and copy of the original
 * apps/web/src/components/cart/cart-drawer.tsx (React + Framer Motion) using
 * plain DOM + CSS transitions, since Shopify themes don't ship a framework.
 */
(function () {
  const FREE_SHIPPING_THRESHOLD = Number(
    document.querySelector('[data-free-shipping-threshold]')?.dataset.freeShippingThreshold || 99900
  );

  const overlay = document.querySelector('[data-cart-overlay]');
  const drawer = document.querySelector('[data-cart-drawer]');
  const body = document.querySelector('[data-cart-body]');
  const countLabel = document.querySelector('[data-cart-count-label]');
  const headerCount = document.querySelector('[data-cart-count]');

  if (!drawer) return;

  function money(cents) {
    return '₹' + (cents / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }

  function open() {
    document.body.classList.add('cart-open');
    refresh();
  }
  function close() {
    document.body.classList.remove('cart-open');
  }

  document.querySelectorAll('[data-cart-open]').forEach((el) => el.addEventListener('click', open));
  document.querySelectorAll('[data-cart-close]').forEach((el) => el.addEventListener('click', close));
  overlay?.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  async function fetchCart() {
    const res = await fetch('/cart.js');
    return res.json();
  }

  function render(cart) {
    if (headerCount) {
      headerCount.textContent = cart.item_count;
      headerCount.hidden = cart.item_count === 0;
    }
    countLabel.textContent = cart.item_count > 0 ? `(${cart.item_count})` : '';

    if (cart.item_count === 0) {
      body.innerHTML = `
        <div class="cart-drawer__empty">
          <div>
            <p>Bag's empty.</p>
            <p style="margin-top:.5rem;font-size:.875rem;color:var(--color-paper-dim)">The streets are waiting.</p>
            <button class="btn-primary" style="margin-top:1.5rem;font-size:1.125rem;padding:.75rem 1.5rem;" data-cart-close>Keep Shopping</button>
          </div>
        </div>`;
      body.querySelector('[data-cart-close]')?.addEventListener('click', close);
      return;
    }

    const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - cart.total_price);
    const shipBlock =
      remaining > 0
        ? `<div class="cart-drawer__ship">
             <p style="font-size:.75rem;margin:0;">Add <strong>${money(remaining)}</strong> more for <span style="color:var(--color-volt);font-weight:600;">FREE shipping</span></p>
             <div class="cart-drawer__ship-bar"><div class="cart-drawer__ship-fill" style="width:${Math.min(100, ((FREE_SHIPPING_THRESHOLD - remaining) / FREE_SHIPPING_THRESHOLD) * 100)}%"></div></div>
           </div>`
        : `<p class="cart-drawer__ship" style="color:var(--color-volt);font-weight:600;font-size:.75rem;">✓ You've unlocked FREE shipping</p>`;

    const lines = cart.items
      .map(
        (item) => `
      <div class="cart-line" data-line-key="${item.key}">
        <a href="${item.url}" class="cart-line__img"><img src="${item.image}" alt="${item.product_title}" loading="lazy"></a>
        <div class="cart-line__body">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:.5rem;">
            <div style="min-width:0;">
              <p class="cart-line__title">${item.product_title}</p>
              <p class="cart-line__variant">${item.variant_title || ''}</p>
            </div>
            <button aria-label="Remove ${item.product_title}" data-cart-remove data-key="${item.key}" style="color:var(--color-paper-dim);padding:.25rem;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>
            </button>
          </div>
          <div style="margin-top:auto;display:flex;align-items:center;justify-content:space-between;">
            <div class="cart-line__stepper">
              <button data-cart-qty data-key="${item.key}" data-delta="-1" aria-label="Decrease quantity">−</button>
              <span>${item.quantity}</span>
              <button data-cart-qty data-key="${item.key}" data-delta="1" aria-label="Increase quantity">+</button>
            </div>
            <p style="font-size:.875rem;margin:0;"><strong>${money(item.final_line_price)}</strong></p>
          </div>
        </div>
      </div>`
      )
      .join('');

    body.innerHTML = `
      ${shipBlock}
      <div class="cart-drawer__items">
        ${lines}
        <div class="cart-drawer__coupon">
          <input type="text" placeholder="Coupon code" data-coupon-input style="text-transform:uppercase;">
          <button data-coupon-apply>Apply</button>
        </div>
      </div>
      <div class="cart-drawer__summary">
        <dl>
          <div class="row"><dt>Subtotal</dt><dd>${money(cart.items_subtotal_price)}</dd></div>
          <div class="row total"><dt>Total</dt><dd>${money(cart.total_price)}</dd></div>
        </dl>
        <a class="cart-drawer__checkout" href="/checkout">Checkout</a>
      </div>`;

    body.querySelectorAll('[data-cart-remove]').forEach((btn) =>
      btn.addEventListener('click', () => changeLine(btn.dataset.key, 0))
    );
    body.querySelectorAll('[data-cart-qty]').forEach((btn) =>
      btn.addEventListener('click', () => {
        const line = cart.items.find((i) => i.key === btn.dataset.key);
        const next = Math.max(0, (line?.quantity || 0) + Number(btn.dataset.delta));
        changeLine(btn.dataset.key, next);
      })
    );
    body.querySelector('[data-coupon-apply]')?.addEventListener('click', () => {
      const code = body.querySelector('[data-coupon-input]').value.trim();
      if (!code) return;
      // Shopify discount codes apply at checkout, not via the cart API — send
      // the code through as a checkout attribute so it's ready at checkout.
      fetch('/cart/update.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attributes: { discount_code: code } }),
      }).then(() => {
        window.location.href = `/checkout?discount=${encodeURIComponent(code)}`;
      });
    });
  }

  async function changeLine(key, quantity) {
    const res = await fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: key, quantity }),
    });
    const cart = await res.json();
    render(cart);
  }

  async function refresh() {
    const cart = await fetchCart();
    render(cart);
  }

  // Keep the header badge accurate after any /cart/add.js elsewhere on the page.
  document.addEventListener('cart:refresh', refresh);
  refresh();
})();
