// "Fold and fly to cart" animation. Browser-only: call it from a click handler.
// 1. The product's garment drawing (shirt, pants, dress, coat... see lib/garments.ts) pops up above the button.
// 2. It folds in half sideways, then in half upward, into a small cloth bundle.
// 3. The bundle arcs to the header cart icon; then the CART_LANDED event tells the icon to bounce
//    (see components/CartFeedback.tsx).
// Deliberately not gated on prefers-reduced-motion: it is a short one-off cue and many phones
// have "remove animations" / battery saver on by default.

import { GARMENT_VIEW, garmentColors, garmentMarkup } from '@/lib/garments';

export const CART_LANDED = 'cart:landed';

export type FlyArt = { category: string; seed: string };

// Product tile size in px (same 3:4 ratio as the garment drawing) and its halves
const W = 84;
const H = 112;
const HW = W / 2;
const HH = H / 2;

const POP_MS = 180;
const FOLD1_MS = 400; // right half folds over the left half
const FOLD2_MS = 360; // bottom half folds up over the top half
const FLY_MS = 680;
const EASE_FOLD = 'cubic-bezier(0.45, 0, 0.25, 1)';
const EASE_FLY = 'cubic-bezier(0.45, 0.05, 0.55, 0.95)';
const NO_BACK = 'backface-visibility:hidden;-webkit-backface-visibility:hidden';
const KEEP_3D = 'transform-style:preserve-3d;-webkit-transform-style:preserve-3d';

// The header has two cart links (mobile and desktop); only one is visible at a time.
function visibleCartTarget(): HTMLElement | null {
  const all = document.querySelectorAll<HTMLElement>('[data-cart-target]');
  for (const el of Array.from(all)) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
}

function box(css: string, parent: HTMLElement): HTMLElement {
  const el = document.createElement('div');
  el.style.cssText = 'position:absolute;' + css;
  parent.appendChild(el);
  return el;
}

// One quarter of the garment drawing (qx/qy = top-left corner in drawing units)
function quarter(art: FlyArt, qx: number, qy: number): string {
  return (
    `<svg width="${HW}" height="${HH}" viewBox="${qx} ${qy} ${GARMENT_VIEW.w / 2} ${GARMENT_VIEW.h / 2}" style="display:block" aria-hidden="true">` +
    garmentMarkup(art.category, art.seed) +
    '</svg>'
  );
}

function run(el: Element, keyframes: Keyframe[], ms: number, easing: string = EASE_FOLD): Promise<unknown> {
  return el.animate(keyframes, { duration: ms, easing, fill: 'forwards' }).finished;
}

export function flyToCart(from: HTMLElement, art: FlyArt = { category: '', seed: 'cart' }): void {
  const land = () => window.dispatchEvent(new Event(CART_LANDED));
  const target = visibleCartTarget();
  if (!target || typeof Element.prototype.animate !== 'function') {
    land();
    return;
  }

  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  // Start centered just above the button (or on it, when there is no room above), kept inside the screen
  const cx = Math.round(Math.min(Math.max(a.left + a.width / 2, HW + 8), window.innerWidth - HW - 8));
  const above = a.top - HH - 8;
  const cy = Math.round(above >= HH + 8 ? above : a.top + a.height / 2);
  const dx = b.left + b.width / 2 - cx;
  const dy = b.top + b.height / 2 - cy;

  const fg = garmentColors(art.seed).fg;
  const cloth = `background:linear-gradient(135deg,rgba(255,255,255,.3),rgba(255,255,255,0) 60%),${fg}`;
  const clothDark = `background:linear-gradient(135deg,rgba(0,0,0,0),rgba(0,0,0,.22)),${fg}`;

  const wrap = document.createElement('div');
  wrap.setAttribute('aria-hidden', 'true');
  wrap.dir = 'ltr';
  wrap.style.cssText = `position:fixed;left:${cx - HW}px;top:${cy - HH}px;width:${W}px;height:${H}px;z-index:60;pointer-events:none;opacity:0`;
  const scene = box('left:0;top:0;width:100%;height:100%;perspective:500px;-webkit-perspective:500px', wrap);

  // Stage 1: the picture, in four quarters. The right quarters swing over the left ones.
  const half = `width:${HW}px;height:${HH}px`;
  const tl = box(`left:0;top:0;${half}`, scene);
  tl.innerHTML = quarter(art, 0, 0);
  const bl = box(`left:0;top:${HH}px;${half}`, scene);
  bl.innerHTML = quarter(art, 0, GARMENT_VIEW.h / 2);
  const flips: HTMLElement[] = [];
  [0, 1].forEach((row) => {
    const flip = box(`left:${HW}px;top:${row * HH}px;${half};transform-origin:left center;${KEEP_3D}`, scene);
    const front = box(`left:0;top:0;width:100%;height:100%;${NO_BACK}`, flip);
    front.innerHTML = quarter(art, GARMENT_VIEW.w / 2, row * (GARMENT_VIEW.h / 2));
    box(`left:0;top:0;width:100%;height:100%;transform:rotateY(180deg);${NO_BACK};${cloth}`, flip);
    flips.push(flip);
  });

  // Stage 2: plain cloth (what stage 1 looks like once folded). The bottom half folds up over the top half.
  const top = box(`left:0;top:0;${half};visibility:hidden;${cloth};box-shadow:0 6px 16px rgba(36,26,71,.3)`, scene);
  const fold = box(`left:0;top:${HH}px;${half};visibility:hidden;transform-origin:center top;${KEEP_3D}`, scene);
  box(`left:0;top:0;width:100%;height:100%;${NO_BACK};${cloth}`, fold);
  box(`left:0;top:0;width:100%;height:100%;transform:rotateX(180deg);${NO_BACK};${clothDark}`, fold);

  // Soft shadow under the flat picture
  tl.style.boxShadow = bl.style.boxShadow = '0 6px 16px rgba(36,26,71,.3)';

  document.body.appendChild(wrap);

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    wrap.remove();
    land();
  };
  window.setTimeout(finish, POP_MS + FOLD1_MS + FOLD2_MS + FLY_MS + 800); // safety net, e.g. tab hidden mid-animation

  (async () => {
    try {
      await run(wrap, [{ opacity: 0, transform: 'scale(0.6)' }, { opacity: 1, transform: 'scale(1)' }], POP_MS, 'ease-out');

      // Fold 1: right half over the left half, and slide the bundle back to the middle
      await Promise.all([
        ...flips.map((f) => run(f, [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(-180deg)' }], FOLD1_MS)),
        run(scene, [{ transform: 'translateX(0px)' }, { transform: `translateX(${W / 4}px)` }], FOLD1_MS),
      ]);
      [tl, bl, ...flips].forEach((el) => (el.style.visibility = 'hidden'));
      top.style.visibility = fold.style.visibility = 'visible';

      // Fold 2: bottom half up over the top half
      await Promise.all([
        run(fold, [{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(180deg)' }], FOLD2_MS),
        run(
          scene,
          [{ transform: `translate(${W / 4}px, 0px)` }, { transform: `translate(${W / 4}px, ${H / 4}px)` }],
          FOLD2_MS,
        ),
      ]);

      // Fly the bundle to the cart icon
      await run(
        wrap,
        [
          { transform: 'translate(0px, 0px) scale(1)', opacity: 1, offset: 0 },
          { transform: `translate(${dx * 0.3}px, ${dy * 0.3 - 70}px) scale(0.85)`, opacity: 1, offset: 0.4 },
          { transform: `translate(${dx}px, ${dy}px) scale(0.3)`, opacity: 0.9, offset: 1 },
        ],
        FLY_MS,
        EASE_FLY,
      );
    } catch {
      // animation cancelled or unsupported: just land
    } finally {
      finish();
    }
  })();
}
