/**
 * WATERMARK.TSX
 * -------------
 * A tiny, permanent credit line that appears in the corner of every screen
 * in BuildAI. I added this because this whole project — the idea, the
 * design decisions, the code — is my work, and I want that to be obvious
 * no matter which page someone happens to be looking at, without getting
 * in the way of actually using the app.
 *
 * A few small technical choices worth explaining:
 *  - `fixed` positioning means it stays in the same spot on the screen even
 *    if the page content scrolls underneath it.
 *  - `pointer-events-none` means it's purely visual — someone can click
 *    straight through it, so it never accidentally blocks a real button.
 *  - `select-none` stops it from being highlighted if someone drags their
 *    mouse across the screen to select text.
 *  - It's placed once here, in the root layout, rather than copy-pasted
 *    onto every individual page — that way it's guaranteed to show up
 *    everywhere, and if I ever want to change how it looks, there's only
 *    one place to edit.
 */
export function Watermark() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed bottom-1.5 left-1.5 z-[70] select-none text-[10px] tracking-wide text-fg-subtle/60"
    >
      Sandra Valerie
    </div>
  );
}
