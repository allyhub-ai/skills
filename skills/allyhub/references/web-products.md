# Web products: Playwright and `allyhub/browser`

To see or operate a real web product, write a Playwright script and run it with `allyhub run <script.mjs>`: it runs on AllyHub's own Node, with AllyHub's headless Chrome, where nothing else is installed (AllyHub Studio included). A script may import two modules by name:

- **`playwright-core`** (also as `playwright`): Playwright, as you know it.
- **`allyhub/browser`**: `chromium` (Playwright's, launching AllyHub's Chrome: `await chromium.launch()`), `session()`, `glide()` and `message()`.

In AllyHub Studio the person watches the pages your script's browser shows (and `allyhub capture`'s) while it runs. Say what you are doing or looking for there with `allyhub run <script.mjs> --message "Checking how Linear prices seats"` (`allyhub capture --message` likewise), and change it as the script moves on with `message("Reading the pricing table")`; it is shown above the page.

**`session(options)`** records what a film needs from a session, whatever code drives it: several people, each a browser context of its own, on one clock; each person's screen as a constant-rate video; and a timeline of what happened on it, logged from the page's own input events.

```js
import { session, glide } from "allyhub/browser";

const s = await session({ people: ["host", "guest"], video: true, out: "assets/media/captures/share-2026-10-15" });
try {
  const host = s.page("host"), guest = s.page("guest");      // Playwright pages
  await host.goto("https://app.example.com");
  await glide(host, "text=Share", { ms: 500 });               // the pointer travels, as a hand does
  await host.click("text=Share");
  await guest.goto(await host.inputValue("input.share-link"));
  s.mark("joined");                                           // a named moment on the clock
} finally {
  await s.close();                                            // writes <who>.mp4 and <who>.timeline.json
}
```

Options: `people` (names, or `{ name, context }` with anything Playwright's `newContext` takes: `locale`, `colorScheme`, `storageState`…; default one, `main`), `viewport` (1440 × 900 CSS pixels), `scale` (2 image pixels per CSS pixel), `video` (`true`, or `{ fps, crf, frames, quality }`: 30, 16, `png`, 90), `out` (`.local/work/record`), `launch` (what `chromium.launch` takes). `s.page(who)` and `s.context(who)` are Playwright's; `s.mark(name)` and `s.now()` are seconds on the clock; `close()` returns where the files are. Playwright's own clicks jump the pointer: `glide(page, target, { ms })` moves it there over `ms` (default 600) first, so the timeline's path and the film's cursor travel.

`<who>.timeline.json` counts seconds from the session's start, one clock for every person and their videos, so two people's videos line up as they are. Boxes and points are image pixels (CSS × scale), `[x, y, width, height]` from the viewport's top left, the video's own pixels.

| Field | What it is |
| --- | --- |
| `steps[]` | What happened, in order: `click` (`press`, its moment; `target.box`, the interactive element pressed, and `target.point`), `drag` (`from`, `to`), `type` (`keys`, as typed, `[Enter]` for a named key), `scroll`, `goto` (`url`); each with `start` and `end` |
| `pointer[]` | The pointer's path, `{ t, x, y, down }`, at every move the page saw |
| `keys[]`, `marks` | Every key with its time; the marks |
| `video`, `duration` | The video (`file`, beside the timeline; `width`, `height`, `fps`, `duration`, `captured`: the frames Chrome sent); the session's length |
| `console` | Console errors and warnings, uncaught errors and failed requests, each with its time |

The video is H.264 at the viewport × scale, constant frame rate, as long as the session: each frame shows the last frame Chrome drew at or before it. It has no cursor: draw one on top from `pointer`. It is footage: place it with `footage(file, { at, from, dur, crop })` and the timeline's seconds. Only the top frame's events are logged (an iframe's are its own), and the video follows each person's first page.

`allyhub capture <url> --out <name.png>` takes a screenshot with each named element's box beside it, `<name>.elements.json`, which `screenDemo` reads (`allyhub help capture`).

`allyhub compare-image <reference.png> <candidate.png>` measures how a picture, or a moment of a piece, differs from a reference (`allyhub help compare-image`).
