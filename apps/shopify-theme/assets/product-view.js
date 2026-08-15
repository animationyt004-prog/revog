/**
 * Product detail page interactions: option pickers resolve a variant, gallery
 * swaps to the chosen colour, thumbnail + lightbox, size guide modal, sticky
 * buy bar. Ports the state machine from
 * apps/web/src/components/product/product-view.tsx.
 *
 * Products differ in option layout — some carry Colour + Size, the free-size
 * sarees carry Colour alone — so selection is driven by the option positions
 * emitted in [data-variant-data] rather than assuming option1/option2.
 */
(function () {
  const root = document.querySelector('[data-product-view]');
  if (!root) return;

  const dataEl = root.querySelector('[data-variant-data]');
  if (!dataEl) return;
  const { colorPosition, sizePosition, variants } = JSON.parse(dataEl.textContent);

  const priceEl = root.querySelector('[data-price]');
  const compareEl = root.querySelector('[data-compare-price]');
  const discountEl = root.querySelector('[data-discount-pct]');
  const selectedColorEl = root.querySelector('[data-selected-color]');
  const swatches = Array.from(root.querySelectorAll('[data-color-swatch]'));
  const sizeButtons = Array.from(root.querySelectorAll('[data-size-btn]'));
  const addBtn = root.querySelector('[data-add-to-cart-main]');
  const buyBtn = document.querySelector('[data-buy-now]');
  const lowStockEl = root.querySelector('[data-lowstock]');
  const cartError = root.querySelector('[data-cart-error]');
  const stickyPrice = document.querySelector('[data-sticky-price]');
  const mainImage = root.querySelector('[data-main-image]');

  const idleLabel = addBtn.textContent.trim();
  let activeColor = swatches.find((s) => s.classList.contains('is-active'))?.dataset.color || null;
  let activeSize = null;
  let activeVariantId = null;

  function money(cents) {
    return '₹' + (Math.round(cents) / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }

  function optionAt(variant, position) {
    return position ? variant.options[position - 1] : null;
  }

  function findVariant() {
    return variants.find((v) => {
      if (colorPosition && activeColor && optionAt(v, colorPosition) !== activeColor) return false;
      if (sizePosition && activeSize && optionAt(v, sizePosition) !== activeSize) return false;
      if (colorPosition && !activeColor) return false;
      if (sizePosition && !activeSize) return false;
      return true;
    });
  }

  function setBuyState(ready) {
    [addBtn, buyBtn].forEach((btn) => {
      if (!btn) return;
      btn.disabled = !ready;
      btn.classList.toggle('is-ready', ready);
      btn.textContent = ready ? (btn === buyBtn ? 'Buy It Now' : 'Add To Cart') : idleLabel;
    });
  }

  function refresh() {
    const variant = findVariant();
    activeVariantId = variant && variant.available ? variant.id : null;

    if (variant) {
      priceEl.textContent = money(variant.price);
      if (stickyPrice) stickyPrice.textContent = money(variant.price);
      const compare = variant.compareAtPrice;
      if (compareEl) {
        const show = compare > variant.price;
        compareEl.hidden = !show;
        if (show) compareEl.textContent = money(compare);
      }
      if (discountEl) {
        const show = compare > variant.price;
        discountEl.hidden = !show;
        if (show) discountEl.textContent = `(${Math.round(((compare - variant.price) / compare) * 100)}% OFF)`;
      }
      if (lowStockEl) {
        const low = variant.available && variant.inventory > 0 && variant.inventory <= 5;
        lowStockEl.hidden = !low;
        if (low) lowStockEl.textContent = `Hurry — only ${variant.inventory} left`;
      }
      if (variant.image && mainImage) mainImage.src = variant.image;
    }

    // Grey out sizes that have no stock in the chosen colour.
    sizeButtons.forEach((btn) => {
      const match = variants.find(
        (v) =>
          optionAt(v, sizePosition) === btn.dataset.size &&
          (!colorPosition || !activeColor || optionAt(v, colorPosition) === activeColor),
      );
      btn.disabled = !match || !match.available;
    });

    setBuyState(Boolean(activeVariantId));
  }

  swatches.forEach((swatch) => {
    swatch.addEventListener('click', () => {
      swatches.forEach((s) => s.classList.remove('is-active'));
      swatch.classList.add('is-active');
      activeColor = swatch.dataset.color;
      if (selectedColorEl) selectedColorEl.textContent = activeColor;

      // Prefer gallery images tagged with this colour, falling back to all.
      const thumbs = Array.from(document.querySelectorAll('[data-thumb]'));
      const matching = thumbs.filter((t) =>
        (t.querySelector('img')?.alt || '').toLowerCase().includes(activeColor.toLowerCase()),
      );
      if (matching.length) matching[0].click();

      refresh();
    });
  });

  sizeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      sizeButtons.forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      activeSize = btn.dataset.size;
      refresh();
    });
  });

  refresh();

  function addToCart(redirectToCheckout) {
    if (!activeVariantId) return;
    cartError.hidden = true;
    fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: activeVariantId, quantity: 1 }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Could not add to cart.');
        document.dispatchEvent(new CustomEvent('cart:refresh'));
        if (redirectToCheckout) {
          window.location.href = '/checkout';
        } else {
          document.dispatchEvent(new CustomEvent('cart:open'));
        }
      })
      .catch((e) => {
        cartError.textContent = e.message || 'Could not add to cart.';
        cartError.hidden = false;
      });
  }

  addBtn.addEventListener('click', () => addToCart(false));
  buyBtn?.addEventListener('click', () => addToCart(true));

  // Thumbnails + main image swap
  document.querySelectorAll('[data-thumb]').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      document.querySelectorAll('[data-thumb]').forEach((t) => t.classList.remove('is-active'));
      thumb.classList.add('is-active');
      if (mainImage) mainImage.src = thumb.dataset.image;
    });
  });

  // Lightbox
  const lightbox = document.querySelector('[data-lightbox]');
  const lightboxImg = document.querySelector('[data-lightbox-image]');
  root.querySelector('[data-lightbox-open]')?.addEventListener('click', () => {
    if (!mainImage) return;
    lightboxImg.src = mainImage.src;
    lightboxImg.alt = mainImage.alt;
    lightbox.classList.add('is-open');
  });
  document.querySelector('[data-lightbox-close]')?.addEventListener('click', () => lightbox.classList.remove('is-open'));
  lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox) lightbox.classList.remove('is-open');
  });

  // Size guide modal
  const guideModal = document.querySelector('[data-size-guide-modal]');
  root.querySelectorAll('[data-size-guide-open]').forEach((btn) => btn.addEventListener('click', () => guideModal.classList.add('is-open')));
  document.querySelector('[data-size-guide-close]')?.addEventListener('click', () => guideModal.classList.remove('is-open'));
  guideModal?.addEventListener('click', (e) => {
    if (e.target === guideModal) guideModal.classList.remove('is-open');
  });

  // Sticky buy bar: shown once the real Add to Cart button scrolls out of view.
  const stickyBar = document.querySelector('[data-sticky-buy]');
  if (stickyBar && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      ([entry]) => stickyBar.classList.toggle('is-visible', !entry.isIntersecting),
      { rootMargin: '-80px 0px 0px 0px' }
    );
    io.observe(addBtn);
  }

  // Related products rail — fetched via Shopify's native recommendations API.
  const recRoot = document.querySelector('[data-recommendations]');
  if (recRoot && window.__PRODUCT_ID__) {
    const url = `${recRoot.dataset.recommendationsUrl || '/recommendations/products'}?product_id=${window.__PRODUCT_ID__}&limit=8&intent=related&section_id=product-recommendations`;
    fetch(url)
      .then((res) => res.text())
      .then((html) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const populated = doc.querySelector('[data-recommendations]');
        if (populated) recRoot.innerHTML = populated.innerHTML;
      })
      .catch(() => undefined);
  }
})();
