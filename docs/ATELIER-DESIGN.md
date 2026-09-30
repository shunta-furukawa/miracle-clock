# Antique Air Post — 0.9.0

The 0.8 puzzle mechanics remain intact. This pass addresses the eight visual issues identified on 2026-10-01: toy-like dial, emoji, inconsistent materials, scattered layout, intrusive lessons, typography, generic animation and repetitive chapter selection.

- Shared chronometer in story/endless: generated brass and enamel housing; accurate code-drawn numerals, ticks and hands. Restrained hour tint; hand badges appear with assistance. Hour labels still disappear at chapter-final challenges.
- Depot layout: customer, order and helper copy form one reception column; the dial occupies the other. Portrait stacks customer/order/dial/help. All safe-area insets retained.
- 36 parcel illustrations and 36 gift illustrations. `artwork.js` resolves story identity, not the ambiguous parcel emoji. Legacy gift identifiers remain unchanged, preserving collections.
- One quiet paper texture across envelopes, labels, diaries, dialogue and results. Serif headlines; restrained sans-serif body text; subtle borders and no raised toy buttons.
- Short task guidance remains visible; detailed learning assistance stays behind the hint action. Story titles now name the parcel rather than the curriculum.
- Character arrival settles into place; no default hopping, shaking or typing wobble. Desert expressions remain; yawning sprites are no longer used to represent incorrect answers.
- Chapter postcards use the existing destination paintings, keeping six stage buttons in a row. Progress remains available without repeated reputation dots.

## Generated assets
Built-in image generation was used (no CLI/API fallback). Final WebP assets are in `src/assets/atelier/`.

1. `chronometer.webp`: reference `src/assets/magic-clock.webp`; front-facing antique airmail chronometer, muted teal enamel and aged brass, blank ivory face, transparent outside, no digits/ticks/hands. Numerals and mechanics are added in code.
2. `gifts.webp`: transparent 6×6 atlas; mature hand-painted antique keepsakes, exact row order matching the gift names in `postStories`, no text or cell frames. Ivory, muted teal, brass and natural pigments.
3. `parcels.webp`: gift atlas used as style reference; transparent 6×6 parcel-content atlas, exact order matching parcel names in `postStories`, no text or cell frames.
4. `paper.webp`: edge-to-edge quiet ivory cotton stationery texture, subtle fibers, low contrast, no objects/borders/folds/stains/text.

The original generated PNGs are retained in the session's `generated_images` directory. Production assets use WebP and are automatically included in the PWA precache by the existing build.

## Verification
72 existing unit tests and production build pass locally. Browser test installation in this workspace failed while downloading Chromium; the existing GitHub Actions Chromium/WebKit, audio and offline tests are the release gate. Check the PR and CI results for the final result. Visual review must cover phone portrait/landscape and tablet layout before production merge.
