# Hearthfall book artwork

The colony is presented as a fictional antique expedition chronicle. Operations retains the dark green palette. CSS creates the leather cover, page edges, gutter shadow, parchment, stamped day mark, and page-turn animation; reduced-motion preferences disable the animation.

## Opening frontispiece

Asset: `app/frontend/public/woodcuts/frontispiece.png`.

Generated with the built-in image generation tool on 2026-10-06, inspected, and copied into the repository. This print belongs to the opening day only. It is not a substitute for fresh turn illustrations.

Final prompt:

> Use case: illustration-story. Asset type: opening frontispiece for Hearthfall, an interactive antique history book. Create one landscape 3:2 woodcut print depicting a small fictional early colonial frontier settlement in a pine valley. Foreground: Mara Venn, a practical woman survey captain in a plain wool coat, seated by a rough timber table keeping a ledger with a quill, her gaze toward the outpost. Behind her wooden cottages, palisade, well and thin cookfire smoke, a frosty northern ridge. Quiet, resolute mood. Authentic hand-carved seventeenth-century woodcut aesthetic, strong irregular ink strokes, dense cross-hatching, worn press marks, dark umber ink on warm ivory paper, delicate engraved rectangular border. Art is flat printed illustration, not a photograph of a book. No lettering, no numbers, no captions, no modern objects, no fantasy creatures. Keep the scene legible at 500px wide.

## Fresh turn plates

The exact runtime prompt template and four event scenes live in `app/backend/illustrations.py`, function `image_prompt`. The server reconstructs the day from the allowed choices and adds its weather and consequential narrator. Each edition/day receives a unique job hash and seed. The image is an interpretation of the narrative, not evidence of additional simulated events.

No browser-supplied prose is sent to the image model. The illustrated events are daily watch/rations, returning foragers, reduced rations, or shared recovery, with the day's weather. Output is a landscape 3:2 PNG. The client preserves the image's composition and supplies a text caption and accessible description.
