// "Fly to cart" animation. Browser-only: call it from a click handler.
// A small brand-colored circle lifts off the Add button, arcs to the header cart icon,
// then the CART_LANDED event tells the cart icon to bounce (see components/CartFeedback.tsx).

export const CART_LANDED = 'cart:landed';

const FLY_MS = 750;

// The header has two cart links (mobile and desktop); only one is visible at a time.
function visibleCartTarget(): HTMLElement | null {
  const all = document.querySelectorAll<HTMLElement>('[data-cart-target]');
  for (const el of Array.from(all)) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
}

export function flyToCart(from: HTMLElement): void {
  const land = () => window.dispatchEvent(new Event(CART_LANDED));
  const target = visibleCartTarget();
  // Not gated on prefers-reduced-motion on purpose: it is a short (under 1 s) one-off cue,
  // and many phones have "remove animations" / battery saver on by default.
  if (!target || typeof Element.prototype.animate !== 'function') {
    land();
    return;
  }

  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const x0 = a.left + a.width / 2;
  const y0 = a.top + a.height / 2;
  const dx = b.left + b.width / 2 - x0;
  const dy = b.top + b.height / 2 - y0;

  const size = 44;
  const dot = document.createElement('div');
  dot.setAttribute('aria-hidden', 'true');
  dot.style.cssText = [
    'position:fixed',
    `left:${x0 - size / 2}px`,
    `top:${y0 - size / 2}px`,
    `width:${size}px`,
    `height:${size}px`,
    'border-radius:9999px',
    'display:grid',
    'place-items:center',
    'color:#fff',
    'background:rgb(var(--c-brand))',
    'box-shadow:0 6px 18px rgba(36,26,71,.35)',
    'z-index:60',
    'pointer-events:none',
  ].join(';');
  dot.innerHTML =
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2"/></svg>';
  document.body.appendChild(dot);

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    dot.remove();
    land();
  };

  const anim = dot.animate(
    [
      { transform: 'translate(0px, 0px) scale(0.6)', opacity: 0.9, offset: 0 },
      { transform: `translate(${dx * 0.3}px, ${dy * 0.3 - 80}px) scale(1.15)`, opacity: 1, offset: 0.35 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.35)`, opacity: 0.9, offset: 1 },
    ],
    { duration: FLY_MS, easing: 'cubic-bezier(0.45, 0.05, 0.55, 0.95)', fill: 'forwards' },
  );
  anim.onfinish = finish;
  anim.oncancel = finish;
  window.setTimeout(finish, FLY_MS + 400); // safety net, e.g. tab hidden mid-animation
}
