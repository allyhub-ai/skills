# Web products: Playwright and `allyhub/browser`

To see or operate a real web product, write a Playwright script and run it with `allyhub run <script.mjs>`: it runs on AllyHub's own Node, with AllyHub's headless Chrome, where nothing else is installed (AllyHub Studio included). A script may import two modules by name:

- **`playwright-core`** (also as `playwright`): Playwright, as you know it.
- **`allyhub/browser`**: `chromium` (Playwright's, launching AllyHub's Chrome: `await chromium.launch()`), `session()`, `glide()` and `message()`.

In AllyHub Studio the person watches the pages your script's browser shows (and `allyhub capture`'s) while it runs. Say what you are doing or looking for there with `allyhub run <script.mjs> --message "Checking how Linear prices seats"` (`allyhub capture --message` likewise), and change it as the script moves on with `message("Reading the pricing table")`; it is shown above the page.

## Studio's browser: signed in where the person is

In AllyHub Studio, `chromium.launch()` (from `allyhub/browser` or `playwright-core`), `launchPersistentContext()` and `allyhub capture` do not start a browser: they connect to Studio's own browser, the one the person sees in Studio and can click and type in. It has one profile for every project on this computer, so your script is signed in wherever the person is: open only what the task needs, and never change an account, its settings or its data unless the person asked for that. Launch options do not apply there.

- Each project has tabs of its own: a script sees, opens and closes only the tabs of the project folder it runs in, so agents at work in other projects at the same time never touch its pages, nor it theirs. Run scripts from inside the project's folder.
- `browser.contexts()[0]` holds the project's tabs already open, the person's included: the page you left on show last time is there.
- A new context or page (`browser.newPage()`, `browser.newContext()`) is a new tab in the same profile, signed in too. When the context or the browser closes, its tabs close, except the one on show, which stays for the person and for your next script.
- `context.clearCookies()` is refused: it would sign the person out of every site. `context.addCookies()` works and lasts.
- A recording (`session()`) is drawn in AllyHub's headless Chrome as before, at its own scale and undisturbed; in Studio its contexts start with the cookies of Studio's browser, so it is signed in too (a site that keeps its sign-in elsewhere than in cookies is not).

**When the person must act** (sign in, enter a 2FA code, pass a check only a person should, set something up), leave the page on show in Studio's browser (a page your script opened and left open is), then run `allyhub handoff "Sign in to Linear with your work account"` and end your turn. Studio shows your words over the page and keeps this project's scripts out of its browser while the person works there (a script that tries is refused with `browser_busy`; other projects' scripts go on). Their answer comes as your next message: "Done in the browser: …", or that they did not do it. Then run your script again; the sign-in stays for every later script. Never ask for a password in the conversation.

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
