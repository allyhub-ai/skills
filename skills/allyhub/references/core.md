# Core: how a piece is written

The package is `@allyhub/sdk`: how a piece is written, how it gets its text, speech and media, and how components are written. The CLI brings it; a workspace installs nothing.

Values shown here are worked examples, not mandates. Every default AllyHub applies has an option; [defaults.md](defaults.md) lists them.

## Entry points

| Import path            | Contents                                                                                                                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@allyhub/sdk`         | `definePiece`, `video`, `paged`, `part`, `take`, `say`, `footage`, `defineComponent`, `custom`, `defineConfig`, prop types, animation tools (easing, noise, SVG paths, `fitLines`) |
| `@allyhub/sdk/dom`     | Layout and DOM helpers for writing components: `layout`, `contentBox`, `textBlock`, `fitTo`, `fitLines`, `textLines`, `h`, `css`, `tag`, `one`, `all`                             |
| `@allyhub/sdk/client`  | Types only: the types of media and data imports, for a `tsconfig.json` you add                                                                                                    |

Import files inside the workspace with relative paths. URLs and files outside the workspace cannot be imported (AK-B005); an npm package can when a `package.json` in the workspace declares it and it is installed.

## A workspace

```
AGENTS.md                           this project's standing instructions, when it has them
allyhub.config.ts                   defaults (languages, formats) and the look
.gitignore                          has the line .local/

content/launch/film/video.ts        a video: its entry file default-exports definePiece(...)
content/launch/film/script.en.yaml  its script, one file per language
content/launch/film/vo/en.mp3       a recorded take, in the item that uses it
content/launch/film/vo/en.words.json  its word times, same name as the take
content/launch/deck/slides.ts       a deck
content/launch/plan/doc.mdx         a doc
content/launch/prices.csv           a loose file, beside the items
content/ads/spring/pool/hooks/shock-1.mp4           a generated clip
content/ads/spring/pool/hooks/shock-1.mp4.gen.json  its record; it moves with the file

assets/media/logo.svg               pictures, video, sound used by more than one item
assets/media/gen/say/<hash>.mp3     speech made for say(), with its .words.json and .gen.json
assets/fonts/space-grotesk/         a font
assets/data/completion.csv          data, read in at build time
assets/text/en.json                 text several items share, one file per language

components/title-card.ts            the workspace's own components

agent/memory.md, agent/daily-notes/ the agent's own; never built
.local/                             this computer only: work/, out/, cache/, trash/
```

**An item is a folder under `content/` whose entry file is named for its kind**: `video.ts` for a video, `slides.ts` for a deck (`.js`, `.tsx` and the like work too), `doc.mdx` for a doc, `sheet.csv` for a sheet. A video's or a deck's entry file is the piece: it default-exports `definePiece(...)`, and its outputs are of that kind (`video(...)` in `video.ts`, `paged(...)` in `slides.ts`).

- Everything in an item's folder is the item's own. What several items share goes in `components/`, `assets/media/`, `assets/data/`.
- Folders above an item only group items. An item cannot hold another item.
- A file under `content/` in no item's folder is a loose file: it is not checked, and no piece is found in it.
- Every entry file under `content/` is found. A piece that is not an item's entry file is AK-M002. An entry file that is not a piece, a second entry file in one folder, an item inside an item and an output of the other kind are AK-M003.
- Only `content/`, `assets/` and `components/` are built, checked and watched; never `agent/`, `.local/` or `apps/`. Whatever a piece imports must not live in `.local/`.

The `vite.config.ts` in the workspace root is read: its `plugins`, `resolve`, `css`, `define`, `json`, `assetsInclude` and `oxc` take effect, after AllyHub's plugins; AllyHub decides the other settings (output, server, env files, the `public` folder).

## `definePiece`

```ts
import { definePiece, footage, part, say, take, video } from "@allyhub/sdk";

// content/launch/film/video.ts
import { endCard } from "../../../components/end-card.js";
import { titleCard } from "../../../components/title-card.js";
import logo from "../../../assets/media/logo.svg";

export default definePiece({
  id: "launch-film",
  formats: ["16x9", "9x16"],
  matrix: { dims: { lang: ["en", "zh-cn"] } },
  meta: { release: "2026-10-launch" },
  outputs: {
    film: video(({ s, combo }) => [
      part({
        key: "hook",
        speech: take(`./vo/${combo["lang"] ?? "en"}.mp3`).saying(s("launch-film.hook.say")),
        layers: [titleCard({ line1: s("launch-film.hook.line1"), l2At: "@line2" })],
      }),
      part({
        key: "demo",
        speech: take("./raw/host.mp4").range("Stop scrolling", "for free"),
        layers: [footage(), footage("./broll/inbox.mp4", { at: "inbox", dur: 1.5, box: [0.55, 0.1, 0.4, 0.4] })],
      }),
      part({
        key: "cta",
        speech: say(s("launch-film.cta.say"), { voice: "rachel" }),
        tail: 2,
        layers: [endCard({ lines: s.list("launch-film.cta.lines"), logo })],
      }),
    ]),
  },
});
```

| Field     | Required | Description                                                                                                                                             |
| --------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`      | No       | A stable identity: lowercase letters, digits, `.`, `_`, `-`; `/` makes levels. When omitted, the item's folder under `content/` is used (`launch/film`) |
| `title`   | No       | The name people see: one string, or one per language. When omitted, `<id>.title` from messages is used, then the file name                              |
| `formats` | No       | What every output is rendered as, see below. Default: `defaults.formats` in `allyhub.config.ts`, then `["16x9"]`                                        |
| `matrix`  | No       | `{ dims, slots, structures, pick, seed, differ, rules, combos }`: dimensions, crossed in full, and slots of candidates; see below and [batches.md](batches.md) |
| `meta`    | No       | Any key-value pairs, plain data. The platform only uses it to filter and group                                                                          |
| `outputs` | Yes      | The outputs: the key is the output name (starts with a letter), the value is `video(...)` or `paged(...)`                                               |

**Requirements on how it is written**:

- The module is an item's entry file: `content/<name>/video.ts` or `content/<name>/slides.ts` (AK-M002, AK-M003).
- The default export is `definePiece({ … })` directly, or `const piece = definePiece({ … }); export default piece` in the same file. Factory functions and re-exports are not followed (AK-M001).
- `definePiece` is imported from `@allyhub/sdk`.
- **The module's top level must load in Node**: the build reads `id`, `formats`, `matrix`, `meta` and which outputs exist in Node, without drawing anything. Code that touches `window` or `document` goes inside an output's function or a component's `mount` (AK-R001). The top level cannot use the network (AK-B003) and cannot run forever (AK-B004).
- `id`, `title`, `formats`, `matrix` and `meta` cannot contain functions (AK-M001). Two pieces cannot have the same `id` (AK-B001).

### Formats `formats`

A format is what an output is rendered as: a preset, a **platform profile**, or `WIDTHxHEIGHT` in pixels with even sides from 64 to 8192, such as `1280x720` (no covered areas). `a4` (1240×1754) and `letter` (1275×1650) are for paged outputs only. A wrong value reports AK-G001. A format is not a dimension: **every combo renders in each of its output's formats**. Lay out by `ctx.dims` (width, height, `orient`, `safe`), never by the format's name.

| Preset | Pixels    | Covered areas                  |
| ------ | --------- | ------------------------------ |
| `16x9` | 1920×1080 | yes (the default format)       |
| `9x16` | 1080×1920 | yes: feed buttons and captions |
| `1x1`  | 1080×1080 | yes                            |
| `4x5`  | 1080×1350 | yes                            |

A platform profile is a frame with what the platform asks of it: the area its interface covers, the longest video it takes, the loudness the sound is mastered to when the output does not set `master`, and its mp4 encode (`ctx.dims.profile`):

| Profile     | Frame     | Covered edges (top, bottom, left, right) | Longest | mp4 encode (crf, most video bitrate) |
| ----------- | --------- | ---------------------------------------- | ------- | ------------------------------------ |
| `tiktok`    | 1080×1920 | 240, 660, 120, 180                       | 10 min  | 20, 6000 kbit/s                      |
| `reels`     | 1080×1920 | 269, 672, 65, 65                         | 3 min   | 20, 6000 kbit/s                      |
| `shorts`    | 1080×1920 | 288, 672, 48, 192                        | 3 min   | 20, 8000 kbit/s                      |
| `meta-feed` | 1080×1350 | 60, 120, 40, 40                          | 241 min | 20, 6000 kbit/s                      |
| `amazon`    | 1920×1080 | 60, 90, 80, 80                           | 45 s    | 20, 8000 kbit/s                      |
| `linkedin`  | 1080×1080 | 50, 90, 40, 40                           | 30 min  | 20, 6000 kbit/s                      |

`allyhub render --crf` and `--max-bitrate` override the encode. A video longer than its profile takes reports AK-F001 (an output's own `maxDuration` at or under it reports AK-X006 instead). Text in a covered area is a `text-covered` fact.

An entry of `formats` (or a paged output's `format`) can change a format's numbers: `{ format: "tiktok", safe: { bottom: 520 }, maxDuration: 60, loudness: -16 }`. `safe` (`{ top?, bottom?, left?, right? }`, whole pixels, any format) changes `ctx.dims.safe` and the `text-covered` fact; `maxDuration` (seconds, the AK-F001 limit) and `loudness` (LUFS, the master's default) are for platform profiles only. The name stays the format's own (combos, file names), so a format is listed once. `defaults.formats` in `allyhub.config.ts` takes names only.

### The matrix `matrix`

`matrix.dims` are the dimensions and their values, crossed in full: a **combo** is one value per dimension. You decide the dimensions; the framework knows one:

| Dimension | How the framework uses it                                                                                                                                                  |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lang`    | Selects each item's `script.<lang>.yaml` and `assets/text/<lang>.json`. The first one is the default language; missing keys fall back to it. When `lang` is omitted, it is every language the item's scripts and `assets/text/` have |

For other dimensions the code reads `ctx.combo`. The same value cannot be written twice, and `size`, `format`, `piece`, `output` and `token` are not dimension names (AK-M001). Slots are in [batches.md](batches.md).

The **combo key** is the dimensions (and slots) sorted by name, each written as `name=value`, joined with commas: `lang=zh-cn,opening=b` (`default` when there are none).

The order of languages: `defaults.languages` in `allyhub.config.ts` comes first; when it is not set, `en` comes first and the rest follow alphabetically.

```ts
// allyhub.config.ts (optional)
import { defineConfig } from "@allyhub/sdk";

export default defineConfig({
  defaults: {
    languages: ["en", "zh-cn"],
    formats: ["16x9"],
    part: { lead: 0.15, tail: 0.4 }, // over dur 4, lead 0.2, tail 0.3
  },
});
```

## `video(build, options?)`

`build` receives `ctx` and returns a list of **parts**, each made by `part()`. Its `key` is unique within this output (AK-K001) and stable across combos and formats.

| Option        | Description                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `music`       | Audio (an import or a path), or `{ file?, from?, loop?, snap?, bpm? }`; `file` can be one per language (`{ en: a, "zh-cn": b }`; a language without one has no music). It plays once from `from` (seconds into the file, default 0); `loop: true` repeats it with a 0.25 s crossfade. `snap: true` ends parts without speech on its beat: `bpm` when given, else the tempo the build measured from the file; when no tempo is known nothing is snapped and a `fallback` fact says so. Music shorter than the video leaves the end silent unless it loops |
| `mix`         | The mix's levels and ducking, see [sound.md](sound.md)                                                                                                                                                                                                                                                                                                                                                                          |
| `look`        | The look name, `clean` by default; when the workspace has no such look, `clean` is used                                                                                                                                                                                                                                                                                                                                         |
| `defaults`    | `{ part: { dur?, lead?, tail? } }`: this output's part defaults, over the project's (`defineConfig({ defaults: { part } })`) and the built-in 4, 0.2 and 0.3 s                                                                                                                                                                                                                                                                  |
| `covers`      | `(ctx) => part[]`: parts without speech drawn at their still for the cover, optional                                                                                                                                                                                                                                                                                                                                           |
| `fps`         | Frames per second: a whole number from 1 to 120, or an NTSC rate (`23.976`, `29.97`, `47.952`, `59.94`, `119.88`, or written `"30000/1001"`…), which renders at the exact n × 1000/1001; default 30                                                                                                                                                                                                                            |
| `transparent` | `true`: the stage has no background. `mov`, `webm` and `png` renders keep the alpha; `mp4` and `gif` show black where nothing is drawn                                                                                                                                                                                                                                                                                          |
| `master`      | What the sound is mastered to: a loudness in LUFS (−70 to 0), or `{ lufs?, truePeak?, lra? }`; default the platform profile's loudness, else −14 LUFS, a −3 dBTP true-peak ceiling and an 11 LU range target. `false` (or `lufs: false`) keeps the mix's level and only limits its peaks                                                                                                                                       |
| `maxDuration` | The longest a combo may last, in seconds: a longer one is a must-fix (AK-X006)                                                                                                                                                                                                                                                                                                                                                  |
| `motionBlur`  | `{ samples, shutter? }`: each frame blends `samples` (2–16) moments of the graphic layers across `shutter` (0–1, default 0.5) of the frame's time. Footage is not blurred again. Drawing the graphics takes `samples` times as long                                                                                                                                                                                             |
| `post`        | `{ filter?, lut? }`: an ffmpeg filter chain over the frames (`"eq=contrast=1.05,noise=alls=6:allf=t"`; one chain, no files, no changes to timing or frame size), then a `.cube` LUT relative to the piece                                                                                                                                                                                                                      |

In a render, ffmpeg draws the look's background and every footage layer straight from its file, the browser draws only the graphic layers, and the two are stacked in the order the part lists its layers. Each part is drawn and encoded on its own and reused in every combo that has the same part (see [batches.md](batches.md)).

## `paged(build, options?)`

A list of pages of one format, each a still frame: a single image, a carousel, slides, a PDF document. `build` receives `ctx` and returns a list of **pages**, made with `part()` (their speech is ignored); each `key` is unique within this output. Each page is drawn at its still time (default: 0.4 s before the end of its `dur`; `still: 0` is second 0).

```ts
paged(({ s }) => [
  part({ key: "cover", layers: [titleCard({ … })] }),
  part({ key: "how", dur: 5, layers: [bulletList({ … })] }),
], { format: "16x9", notes: true });
```

| Option   | Description                                                                                                                                                                                                                                |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `format` | The pages' format, the same for every page: a preset, `a4`, `letter`, or `WIDTHxHEIGHT` (each side 64–8192). When set, this output renders in that format only; when omitted, in each of the piece's formats. A wrong value reports AK-G001 |
| `notes`  | `true`: each page's speaker notes are `<prefix>.<page>.notes` in messages, written into the notes of a PPTX; a page without notes gets empty notes                                                                                       |
| `look`   | The look name, `clean` by default                                                                                                                                                                                                          |
| `prefix` | The prefix of the speaker notes' keys, by default the piece's `id` with `/` replaced by `.`                                                                                                                                               |

- Pages have no sound: no speech, music or sound effects.
- Each page's still gets the frame checks (overflow, covered areas, missing glyphs) and the font check; the shuffled-order comparison (AK-D002) is not run. `a4`, `letter` and custom formats have no covered areas.
- A paged output renders as PNG, PDF or PPTX (`allyhub help render`).

## `ctx`

| Name                        | Description                                                                                                            |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `ctx.combo`                 | The current combo: one value per dimension, and per slot of its structure, for example `{ lang: "en", hook: "price" }` |
| `ctx.pool(slot)`            | The file a pool slot picked in this combo, as a path `footage()` and `ctx.asset()` take                                |
| `ctx.s(key, hint?)`         | One string in the current language                                                                                     |
| `ctx.s.list(prefix, hint?)` | Numbered keys: `prefix.0`, `prefix.1`, … in order; deeper keys form objects, for example `plans.0.name`                |
| `ctx.s.with(key, inputs)`   | A string with its `{name}` variables filled in; plurals and selects pick the sentence that matches `inputs`            |
| `ctx.asset(path)`           | Media at a dynamic path, relative to this file (use import for fixed media)                                            |
| `ctx.data(path)`            | A data file (CSV, YAML, JSON) at a dynamic path, relative to this file (use import for fixed data)                     |
| `ctx.look`                  | The style tokens                                                                                                       |

## Strings

All the text people see is data, read with `s(key)`. An item's own words are in its **script**; what several items share is in `assets/text/<locale>.json`.

### An item's script

`script.<locale>.yaml` in the item's folder, one file per language.

```yaml
# content/launch/film/script.zh-cn.yaml
title: Tidyform 发布
text:
  url: tidyform.example
parts:
  - id: hook
    say: Tidyform 让表单自己填好，你@{line2}只需要问不知道的事。
    screen:
      line1: 表单自己填好。
  - id: how
    screen:
      items:
        - 粘贴表单链接
        - 匹配你已有的答案
  - id: quote
    say: Northwind 把注册表单从 <12|十二> 项减到了 <3|三> 项。
```

- **It becomes messages under the piece's prefix** (its `id`, with `/` as `.`):
  - `title` is `<id>.title`, the piece's title.
  - A part's `say` is `<id>.<part>.say`: give it to `say(s(…))` or `take(…).saying(s(…))`.
  - Each name under `screen` is `<id>.<part>.<name>`. Names nest (`label: { before: … }` is `<id>.<part>.label.before`), and a list is numbered (`items` above is `launch-film.how.items.0`, `.1`).
  - Each name under `text` is `<id>.<name>`: the item's words that belong to no part.
- **A part's `id` is the part's `key`** in the piece. A row for a part the video does not have yet is allowed.
- **A part's `say` may hold anchors**, named places in the line that code times things by (see [Anchors](speech.md#anchors)): `@{name}` before a word, `@{name}…@{/name}` around a stretch of words. The message is the line without them, so the voice, the captions and a recording's search never see one. A line that starts with an anchor needs quotes in YAML (`say: "@{step1}Paste your form link."`).
- **A piece of a `say` shown one way and said another is `<shown|said>`**: `from <12|twelve> fields`, `<AI|A I>`, `<东京|とうきょう>`. The line as shown is what `s()` returns and what captions show; the line as said is what `say` reads aloud and what `saying` looks for in a recording. Either side may be empty: `<™|>` is shown and not said, `<|[laughs]>` said and not shown. Captions keep each word's own time: only the piece that differs is timed in proportion. Spaces at the edges of a side do not count. A part's `say` is always one line: a `say` written as `{ display, speak }` is AK-M007.
- **A row has `id`, `say` and `screen`, and nothing else** (another key is AK-M007).
- **A text is a string, `{ display, speak }`, or a plural or selection** written as `{ declarations, selectors, match }` (the inlang message below, without its array). A line that is only a number or `yes`/`true` needs quotes.
- A file that is not YAML or not a script, a key a script makes twice, and a key a messages file or another script already has are AK-M007.
- The person edits a script's words on the preview page; only that text's bytes change in the file, and a line's anchors stay with the words they are on. Read the file again before you change it.
- A `script.<locale>.yaml` in a folder with no entry file yet is read and waits for its item.

### Shared text: `assets/text/<locale>.json`

Flat keys, each value one sentence, for what several items use. The format matches inlang (Paraglide).

```json
{
  "brand.tagline": "表单自己填好。",
  "brand.legal": { "display": "© 2026 Tidyform", "speak": "Tidyform" },
  "pricing.greeting": "你好，{name}",
  "pricing.count": [
    {
      "declarations": ["input count", "local n = count: plural"],
      "selectors": ["n"],
      "match": { "n=0": "还没有套餐", "n=one": "{count} 个套餐", "n=other": "{count} 个套餐" }
    }
  ]
}
```

### Reading text

- **Keys are prefixed by piece**: `<piece id>.<part>.<name>`. A script makes its keys that way; a shared key is whatever you name it.
- **Lists use numbered keys**. `s.list("launch-film.how.items")` returns them in order and stops at the first missing number.
- `{ "display", "speak" }`: `s()` returns `display`; speech uses `speak` (the text `say` reads aloud, the line `saying` looks for, the word references found in it), and captions show `display`.
- `{name}` is a variable; fill it with `s.with(key, { name: … })`.
- **Plurals and selects** follow inlang's syntax: an array with exactly one item, where `declarations` declares the inputs (`input count`) and the plurals (`local n = count: plural`; ordinals add `type=ordinal`), `selectors` says what to pick by, and the keys of `match` are `selector=value`, several selectors separated by commas and `*` matching any value. `s.with("pricing.count", { count: 3 })` picks by the current language's `Intl.PluralRules`: an exact number (`n=0`) before a category (`one`, `few`, `other`), a category before `*`. With no input, the `other` sentence is used. Other functions (`number`, `datetime`) are not supported (AK-M006).
- **Keys are typed.** The check and the preview write `.local/cache/types/messages.d.ts` from the default language's scripts and messages: the keys of `s()` and `s.list()` autocomplete and a wrong key is a `tsc` error; `s.with()`'s inputs and `s.list()`'s items are typed. With a `tsconfig.json` (optional), add `".local/cache/types"` to its `include` (`**/*.ts` does not enter folders that start with a dot). A key built from data is written ``s(`x.label.${key}` as MessageKey)``; the check still reports a key that does not exist (AK-S001).
- When the current language does not have the key, the default language's value is returned (AK-S002, a missing translation); when the default language does not have it either, an empty string is returned (AK-S001).
- `hint` is `{ max?, note? }`: a length hint for whoever writes the strings; it changes nothing and is not checked.
- Text written in code is not reported, but the person cannot edit or translate it. `splitText(text, "words" | "chars" | separator)` splits a sentence for animation.
- **Marks in a line.** A stressed stretch can be written in the line: `"One follow-up later: **3 are gone.**"`, with `**strong**`, `*em*`, `~~struck~~`, `` `code` ``. `s()` returns the line as written; code that draws it asks for the marks: `readMarks(s(key))` gives `{ text, marks }` (the characters without the delimiters, and `{ at, end, kind }` for each stretch), `markRuns(text, marks)` the runs in order (`{ text, kinds }`), `withoutMarks(line)` the characters alone, and `marked(line, styles?)` from `@allyhub/sdk/dom` an element with each marked run in a span. A line no code reads the marks of shows its asterisks. A delimiter counts only as a pair, opening before a character that is not a space and closing after one, so `2 * 3 * 4` and a lone `*` stay as they are (`5*3 and 4*2` does pair); `_` marks nothing; a backslash writes the character (`\*`); nothing inside code is a mark. A `say` line is read aloud as written.

## Import media and data

```ts
import plans from "../../assets/data/plans.csv"; // → [{ name: "Team", price: 12 }, …]
import take from "./vo/en.mp3"; // → { path, sha256, kind: "audio", duration, words, url }
import shot from "../../assets/media/signup.png"; // → { path, sha256, kind: "image", width, height, elements?, url }
import demo from "../../assets/media/demo.mp4"; // → { path, sha256, kind: "video", width, height, duration, audio, words?, url }
```

- Paths are relative to the importing file and cannot leave the workspace.
- Images, audio, video and fonts become a media value: `path`, `sha256`, `kind` (`image`, `audio`, `video`, `font`), `width`, `height` (images and video), `duration` (audio and video), `audio` (video: whether it has sound), `url`. `url` is valid only at runtime; do not concatenate or rewrite it. Draw a picture from its `url` (`img.src = shot.url`); a media value turned into a string is its `url` too, but a copy of it (`{ ...shot }`) is a plain object. An `<img>` or CSS background image on the stage that does not load is must-fix (AK-A005).
- **A take**: an audio or video file with a `.words.json` of the same name beside it (`[{ "w", "start", "end", "confidence"? }]`, seconds; `confidence` 0 to 1) carries `words`. `allyhub transcribe <file>` writes one. A take also carries what the build measured of its sound: `speechDb`, the median level of its words in dBFS, and `sounds`, the stretches heard between words (`{ start, end, peak, mean, voiced, after }`: seconds of the file, peak and mean level in dB against the speech, the share of voiced frames 0 to 1, the index of the word before).
- An image with an `.elements.json` of the same name beside it (element name → `[x, y, w, h]`) carries `elements`: a screenshot with its named elements (`allyhub capture` writes one).
- A media file with a record beside it, `<file>.gen.json`, carries `gen`: `{ record, ai, tool?, vendor?, model?, at?, credits?, input?, output?, sha256?, matches? }`.
- CSV becomes an array of objects, with the header row as keys; a column that is all numbers becomes numbers. YAML becomes JSON; JSON imports as usual.
- `ctx.asset(path)` for a dynamic path; when it is not found, AK-A001.
- `ctx.data(path)` for data at a dynamic path: it returns the parsed content (`unknown`; add the type yourself) and goes into the digest. Not found is AK-A001; not parsed, AK-R001. `package.json`, `tsconfig*.json`, lock files, `assets/text/`, `*.words.json`, `*.elements.json`, `*.gen.json` and folders that start with a dot are not data.
- Types: with a `tsconfig.json`, add `"@allyhub/sdk/client"` to `compilerOptions.types`.

### Generated media and its record

Every file a cloud tool call downloads gets a record beside it, `<file>.gen.json`:

```json
{
  "schema": 1,
  "ai": true,
  "tool": "tts-elevenlabs-multilingual-v2",
  "vendor": "elevenlabs",
  "input": { "text": "Stop scrolling.", "voiceId": "…" },
  "inputHash": "…",
  "output": { "durationSeconds": 1.4, "words": { "omitted": "large", "sha256": "…", "bytes": 2310 } },
  "credits": 0.4,
  "at": "2026-10-09T10:00:00.000Z",
  "sha256": "…",
  "bytes": 23110
}
```

- `vendor` is the catalog's category unless it names a vendor; `model` is there when the catalog, the output or the input names one. `input` is what was sent, secrets redacted, inline base64 of 1024 characters or more replaced by its hash and size, a URL `allyhub upload` gave replaced by the file it stands for (`{ uploaded, sha256, bytes }`) and any other signed URL kept without its signature; `inputHash` is the sha256 of the tool's name and the whole input, with those files in place of their URLs. `output` is what the tool returned, a value whose JSON is over 2000 characters replaced by its hash and size (`omitted: "large"`). `sha256` and `bytes` are the file's.
- **The record belongs to its file: move or rename them together.** A record whose `sha256` is not the file's is the `gen-mismatch` fact and `gen.matches: false`, never an error; one that cannot be read is the same fact (`why: "unreadable"`) and the file has no `gen`.
- `ai` is true for everything a tool call downloads. Set it to `false` where the tool fetched rather than generated the file (a stock clip). For media generated outside AllyHub, write the record yourself: `{ "schema": 1, "ai": true, "tool": "…" }` is enough.
- `allyhub models call <tool> --name <path>` writes the file and its record at that path (`allyhub help models call`).
- A tool's input that takes a file takes it as a URL the provider fetches. A file on this computer gets one with `allyhub upload <file> [more…]`: kept in the account's Files, never public, its URL working for a few hours; a URL that is already public goes in as it is.

## Parts `part`

```ts
part({
  key: "hook",
  speech: take("./vo/en.mp3").saying(s("launch-film.hook.say")),
  lead: 0.2,
  tail: 0.3,
  layers: [footage("../../assets/media/office.mp4"), titleCard({ at: "forms", line1: s("launch-film.hook.line1") })],
});
part({ key: "pricing", dur: 3, layers: [priceCard({ … })] });
```

| Option       | Description                                                                                                                                                                                                                                                                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `key`        | Required, unique within the output                                                                                                                                                                                                                                                                                                               |
| `speech`     | What the part says: `take(file)` or `say(text)` (see [speech.md](speech.md)). Without it the part is silent                                                                                                                                                                                                                                     |
| `dur`        | Seconds, for a part without speech; default 4 (or `defaults.part`). Ignored when the part has speech                                                                                                                                                                                                                                            |
| `lead`       | Seconds before the first word; default 0.2 (or `defaults.part`)                                                                                                                                                                                                                                                                                 |
| `tail`       | Seconds after the last word; default 0.3 (or `defaults.part`)                                                                                                                                                                                                                                                                                   |
| `sounds`     | Sound effects: `[{ at, sound, gainDb?, what? }]`, see [sound.md](sound.md)                                                                                                                                                                                                                                                                      |
| `anchors`    | Named moments in seconds from the part's start: `{ press: 7.1, map: [9.6, 13.4] }`, a point or a stretch, referred to as `"@press"`, `"@map"`, `"@/map"`; see [Anchors](speech.md#anchors)                                                                                                                                                     |
| `layers`     | What it shows, back to front: `footage()`, components, `custom()`                                                                                                                                                                                                                                                                               |
| `still`      | The still moment (cover, sheet, a page): a word reference, seconds from the part's start, or `(dur) => seconds`; default 0.4 s before the part ends                                                                                                                                                                                             |
| `slot`       | The slot this part fills (default: its key, when that is a slot's name)                                                                                                                                                                                                                                                                         |
| `tags`       | Labels, plain strings                                                                                                                                                                                                                                                                                                                            |
| `transition` | How the part comes in from the part before: a type's name or `{ type, dur?, ease?, split?, … }`, see [Transitions](#transitions-between-parts). Without it, a cut                                                                                                                                                                              |
| `overlap`    | `{ before?, after? }`, seconds: J and L cuts. `before` seconds of the part's speech play under the previous part's picture, `after` seconds under the next one's; the part's picture is that much shorter at that end (at most its lead or tail and half its speech). `ctx.captions()` gives the words heard under a neighbour's picture there |

### Transitions between parts

Parts join with cuts. A part comes in with a transition only when it says so:

```ts
part({ key: "demo", transition: "fade", layers: [ … ] });
part({ key: "cta", transition: { type: "push", direction: "up", dur: 0.5 }, layers: [ … ] });
```

| Type     | What happens to the two pictures                                                                    | Its own options                                                                                                                                                                         |
| -------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fade`   | A crossfade                                                                                         |                                                                                                                                                                                         |
| `dip`    | The part before fades to a colour, this part fades in from it                                       | `color`: any CSS colour (`"#000"`, `"var(--ak-color-accent)"`); default the look's background                                                                                           |
| `slide`  | This part travels in over the part before, which stays                                              | `direction`: `left` (default), `right`, `up`, `down`: the way it travels                                                                                                                |
| `push`   | This part pushes the part before out, both travelling                                               | `direction`                                                                                                                                                                             |
| `wipe`   | An edge travels across and uncovers this part; neither picture moves                                | `direction`                                                                                                                                                                             |
| `zoom`   | The part before grows to `scale` while this part fades in over it, settling from `from` to its size | `scale` (over 1, up to 4; default 1.2), `from` (0.1 to 4; default the same as `scale`; under 1 it grows in instead, the part before showing round it)                                  |
| `custom` | The channels given directly                                                                         | `out`, `in`: `{ x, y, scale, opacity, clip: { left, right, top, bottom } }` for the part before and this part; `color: { value?, opacity }` for a colour between them                  |

Every type takes `dur` (seconds, over 0 and up to 10; default 0.4), `ease` (`linear`, `in`, `out`, `in-out`; default `linear` for fade, dip and custom, `in-out` for slide, push, wipe and zoom) and `split` (0 to 1, default 0.5). A value that is not one of these throws when the part is made.

- **Timing.** Parts keep their lengths and places; the video is no shorter. The window lies across the join: `split` of it before this part's start, the rest after, on the frame grid. `split: 1` puts all of it before the join, `split: 0` all after. A window takes at most half of either part.
- **Outside a part's own time.** Graphics hold: the part before shows its last frame, this part its first. Footage runs on in its file (a cut take before its first stretch, as far as the file goes); where the file has no more, a frame holds.
- **The whole picture transitions**: each part's footage and graphics together, over the look's background, this part's over the part before. In a `transparent` video, a fade or a zoom is a true dissolve (the two pictures added, weighted).
- **Progress.** A window of N frames shows N steps evenly spaced: the frame before it is the part before alone, the frame after it this part alone.
- **Sound is not changed**: place a sound on the join with `sounds: [{ at: 0, sound: "whoosh" }]` if you want one. J and L cuts (`overlap`) work with a transition.
- **Custom.** Each channel is a number (it holds), `[from, to]`, or keys `[{ p, v }]` over the progress `p` (0 to 1, in order; linear between keys, after `ease`). `x` and `y` move the picture by a share of the frame's width and height (−4 to 4; `x: [1, 0]` comes from the right); `scale` is about the frame's centre (0.01 to 8); `opacity` 0 to 1; `clip` cuts a share off an edge (0 to 1). Channels not given rest (0, or 1 for scale and opacity). Example: `{ type: "custom", dur: 0.6, ease: "out", out: { x: [0, -0.3], opacity: [1, 0] }, in: { x: [1, 0] } }`.
- The first part's transition is ignored, and so is a page's. A part's default `still` stays clear of its windows.

## Durations

- A part with speech lasts `lead` + its speech (first word to last word, after edits) + `tail`, less its `overlap`; its speech starts `lead` after the part (earlier in a J cut).
- A part without speech lasts its `dur`; with `music.snap`, it ends on the music's beat (`60 / bpm`, from the file's first beat, shifted by `music.from`).
- Parts follow each other on the frame grid. Durations are computed at build and at playback and never written back to the source: replace a take (or its words) and the parts are laid out again.

## Layers

A part's layers are drawn back to front in the order they are listed, footage and graphics alike, each over the whole frame unless it says otherwise. Graphics listed after the footage are over it (`[footage(), captions()]`), a graphic layer listed before a footage layer is under it (`[card(), footage(demo, { box, radius: 24 }), badge()]`), and one between two footage layers is between them. A graphic layer under footage that fills the frame is hidden (the `graphics-under-footage` fact). Every layer takes `at` and `until` (word references or seconds from the part's start) or `dur` (seconds from `at`); by default it lasts the whole part. Footage layers are in [footage.md](footage.md).

### Graphics: components and `custom`

A component makes a graphic layer from its props and the layer options: `titleCard({ at: "only", line1: s("…") })`. `z: "behind-person"` draws it right over the part's own footage (the `footage()` without a file) wherever it is listed, and under that take's speaker, cut out with its person matte (see [the media index](footage.md#the-media-index)); until the take has a matte it is drawn over the speaker.

```ts
custom({
  at: "growth",
  mount(el, ctx) {
    /* build the DOM once */
  },
  render(el, t, ctx) {
    /* t is the seconds within the part; change the frame by t only */
  },
});
```

`mount` and `render` get the same `ctx` as a component's:

| Name                  | Description                                                                                                                                                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ctx.look`            | The style tokens (also CSS variables `--ak-color-*`, `--ak-font-*`)                                                                                                                                                               |
| `ctx.format`          | The format being drawn: `"16x9"`, `"1280x720"`; a paged output's may be `"a4"`                                                                                                                                                    |
| `ctx.dims`            | `{ width, height, orient, safe, profile? }`: pixels, `"landscape"`/`"portrait"`/`"square"`, the covered edges `{ top, bottom, left, right }` in pixels (all 0 for custom formats)                                                |
| `ctx.combo`           | The combo: the dimensions and this part's own slot; reading another slot's pick is AK-X005                                                                                                                                       |
| `ctx.dur`             | The part's length in seconds, once timed                                                                                                                                                                                          |
| `ctx.layer`           | `{ start, end }`: this layer's window, seconds from the part's start                                                                                                                                                              |
| `ctx.words()`         | The part's words on its own clock (`[{ w, start, end }]`)                                                                                                                                                                         |
| `ctx.at(ref)`         | Seconds from the part's start of a word reference or an anchor (`"@name"`)                                                                                                                                                        |
| `ctx.captions(opts?)` | The caption cues shown over this part, on its clock: `[{ start, end, text, words: [{ w, start, end }] }]`, spelled as the script; `opts` `{ maxChars?, maxWords?, keep? }` (see [Captions](speech.md#captions))                |
| `ctx.face(t, id?)`    | Where a face is at part time `t`, `[x, y, w, h]` in the frame's pixels, from the face track of the topmost footage showing then that has one: face `id`, by default that footage's speaker; `undefined` when none shows         |
| `ctx.faces(t)`        | Every face at part time `t`: `[{ id, box }]`, from the same footage; empty without one                                                                                                                                            |
| `ctx.texts(t)`        | The text of the part's layers listed before this one at part time `t`: `[{ layer, text, box: [x, y, w, h] }]`, a box per line or paragraph. It draws those layers to measure them: call it in `mount`                            |
| `ctx.covered`         | The format's covered areas as strips of the frame, `[x, y, w, h]` each (none for a custom format)                                                                                                                                 |
| `ctx.content`         | The content box, `[x, y, w, h]` in the frame's pixels (see [The content box](#the-content-box)). TikTok: `[180, 270, 720, 970]`                                                                                                   |
| `ctx.asset(path)`     | Media at a path relative to the piece                                                                                                                                                                                             |

`render(t)` receives the part's time, and the layer is only drawn between its `at` and `until`: an entrance counts from `ctx.layer.start` (`const lt = t - ctx.layer.start`).

Build in `mount`, keep the elements, and set every moving property in `render`:

```ts
import { custom, ease, part, tween } from "@allyhub/sdk";
import { h, layout, one, tag } from "@allyhub/sdk/dom";

part({
  key: "year",
  dur: 3,
  layers: [
    custom({
      mount(el, ctx) {
        const L = layout(ctx); // L.k: type scale; L.top/bottom/left/right: the content box
        const year = tag(h("div", { fontSize: 380 * L.k, fontWeight: 900 }, [s("story.year.value")]), "year");
        el.append(h("div", { position: "absolute", inset: 0, display: "grid", placeItems: "center" }, [year]));
      },
      render(el, t) {
        const year = one(el, "year");
        if (!year) return;
        year.style.transform = `scale(${2.6 - 1.6 * tween(t, { start: 0, dur: 0.4, ease: ease.outExpo })})`;
      },
    }),
  ],
});
```

## Components `defineComponent`

```ts
import { defineComponent, text, time, type Time } from "@allyhub/sdk";

export const statBadge = defineComponent<{ value: string; label: string; settleAt?: Time }>({
  name: "stat-badge",
  label: { en: "Stat badge", "zh-cn": "数字徽章" },
  summary: { en: "One number in a badge, with a line under it." },
  props: {
    value: text({ max: 6 }),
    label: text({ max: { "16x9": 40, "9x16": 24 } }),
    settleAt: time({ optional: true }), // a word reference or seconds given; seconds received
  },
  examples: { pilots: { value: "3", label: "pilot teams live" } },
  mount(el, p, ctx) {
    /* layout: you can measure text */
  },
  render(el, t, p, ctx) {
    /* set every animated property each time, decided by t only */
  },
});
```

| Field      | Description                                                                |
| ---------- | -------------------------------------------------------------------------- |
| `name`     | The component name, unique within the workspace                            |
| `label`    | The name people see: a string, or one per language                         |
| `summary`  | What it is for, in one sentence                                            |
| `props`    | The semantic types of the props, plain data, see below                     |
| `examples` | Named example props; the platform renders preview images from the examples |
| `hidden`   | Hides a deprecated component without deleting it                          |
| `defaults` | Default prop values                                                        |

A component's function takes its props and the layer options in one object, so `at`, `until`, `dur` and `z` cannot be prop names (`LAYER_OPTIONS`; `defineComponent` throws). Its length and still belong to the part.

**Semantic prop types** (exported by `@allyhub/sdk`; all plain data):

| Function                             | What it is                                                                                                                       | Constraints                                                  |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `text(o?)`                           | Text on screen                                                                                                                   | `max` (one number, or per preset format), `min`, `multiline` |
| `time(o?)`                           | A moment: a word reference or seconds where the layer is made, seconds from the part's start in the component; type it `Time` |                                                              |
| `asset(o?)`                          | Media (an import or `ctx.asset`)                                                                                                 | `kind`: `image`, `audio`, `video`, `font`                    |
| `color(o?)`                          | A style token, for example `var(--ak-color-accent)`                                                                              |                                                              |
| `number(o?)`, `boolean(o?)`          | A number, a switch                                                                                                               | `min`, `max`, `step`                                         |
| `list(of, o?)`, `object(fields, o?)` | A list, an object                                                                                                                | `min`, `max`                                                 |

Each can carry `label`, `examples` and `optional`. Only props declared `time()` (also inside `list()` and `object()`) take word references.

A component must draw the same frame at the same moment: `render(t)` sets every animated property each time and does not depend on the previous frame (AK-D002). `mount(el, props, ctx)` is called once at `ready()`; **by then the look's fonts have loaded**, so it may measure text. `ctx` is the one in the table under Layers.

A browser silently drops a style value it does not accept (`fontWeight: "900px"`, `width: "760"`): while checking, every inline style assignment is watched (a property, `setProperty`, `cssText`, `h` and `css`), and such a value is must-fix (AK-R004).

### DOM helpers (`@allyhub/sdk/dom`)

| Helper                                                                    | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `h(tag, style?, children?, cls?)`                                         | Creates an element with styles and children (strings become text nodes)                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `css(el, style)`                                                          | Sets styles on an HTML or SVG element: camelCase or `--custom` names; a number gets `px`, except `opacity`, `zIndex`, `fontWeight`, `lineHeight`, `flex`, `flexGrow`, `flexShrink`                                                                                                                                                                                                                                                                                                                                          |
| `layout(ctx, opts?)`                                                      | `{ W, H, k, orient, pad, top, bottom, left, right }`: the type scale `k` and the content box's edges in pixels (`right` and `bottom` are x and y, not widths); `opts` `{ margin, topGap, bottomGap }` (see [The content box](#the-content-box))                                                                                                                                                                                                                                                                            |
| `text(v)`, `list(v)`                                                      | A prop as a string (a number or boolean as text; anything else `""`), and as a list of strings (one value becomes a list of one)                                                                                                                                                                                                                                                                                                                                                                                            |
| `textBlock(value, { size, weight?, color?, font?, lineHeight?, align? })` | A `div` of text that wraps by width, keeps words together (Chinese broken only between words) and balances its lines; defaults weight 700, `var(--ak-color-fg)`, `var(--ak-font-display)`, line height 1.15, left                                                                                                                                                                                                                                                                                                         |
| `marked(line, styles?)`                                                   | A `span` with a line's marks drawn: a plain run as text, a marked run as a `span` with `data-mark` (its kinds: `"strong"`, `"strong em"`…). `line` is a string or a text already read (`{ text, marks }`). Each kind's style is `styles[kind]`, else `MARK_STYLES[kind]`: `strong` weight 700, `em` `var(--ak-color-accent)`, `strike` a line through, `code` `var(--ak-font-mono)` at 0.9 em. Chinese gets the same word breaks as `textBlock`                                                                         |
| `wordBreaks(value)`                                                       | Chinese text with zero-width spaces between its words (the browser's own word segmenter), so `word-break: keep-all` breaks lines only between words; other text unchanged                                                                                                                                                                                                                                                                                                                                                  |
| `contentBox(L, style?)`                                                   | An absolutely placed flex column over `layout()`'s content box, centred vertically; `style` overrides                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `tag(el, name)`, `one(el, name)`, `all(el, name)`                         | Names an element in `mount`, finds it again in `render`                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `fitTo(el, { min, max, maxHeight })`                                      | Largest font size that fits                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `fitLines(el, { lines, min, max, width?, height?, precision? })`          | `{ size, fits, lines }`: the largest font size in [min, max] at which el's text takes at most `lines` lines, no word sticks out of the width and, given `height`, it is no taller, measured in the page; the size is set on el (and `width` as its width), `lines` is the text of each line, and `fits` is false (size `min`) when even `min` does not fit. `precision` default 0.5 px. `fitLines(text, { …, width, style })` measures a text drawn with `style` in a hidden element instead                            |
| `textLines(el)`                                                           | The text of each line of el as the browser broke it, top to bottom (spaces collapsed, `wordBreaks`' zero-width spaces left out)                                                                                                                                                                                                                                                                                                                                                                                             |
| `captionTop(ctx, L, cue, w, h, opts?)`                                    | The top of a block w × h, centred across the frame, for one cue: the first spot of `prefer` (`"bottom"`, `"middle"`, `"top"` or a y in pixels; default bottom, top, middle) clear of other layers' text (`ctx.texts`) and the faces over the cue, else just above or below that text, else the least text covered, then the least face. `opts`: `prefer`, `faces` and `texts` (false: do not look), `faceGap` (24 × the type scale), `textGap` (48 ×), `step` (seconds between moments looked at, 0.1). Call it in `mount` |
| `freeAreas(ctx, t, opts?)`                                                | The empty bands of the frame at part time `t`, `[x, y, w, h]`, tallest first: rows of `within` (default the content box) where no face, other layer's text or covered area is. `opts`: `within`, `faces`, `texts`, `covered` (false: ignore), `margin` (24 × the type scale), `minHeight`. Call it in `mount`                                                                                                                                                                                                          |
| `lightDark(el)`                                                           | `{ light, dark }`: the look's background and text colours sorted by brightness                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `emphasized(words, list)`, `wordEmoji(words, map)`                        | Per word of a cue: whether the words you list name it, and the emoji your map gives it (`""` for none). Matched as said: case, accents and punctuation ignored, whole words (`"free"` is not `"freedom"`); a phrase marks each of its words (its emoji goes to its last word); Chinese may match inside a word                                                                                                                                                                                                             |
| `emojiEl(value, style?)`                                                  | A span for an emoji in `var(--ak-font-emoji)`, upright at weight 400, without the outline or capitals of its line                                                                                                                                                                                                                                                                                                                                                                                                            |

### The content box

`layout(ctx)` and `ctx.content` compute it the same way from the frame (`W` × `H`) and its covered edges (`ctx.dims.safe`), in pixels:

```
k      = min(W, H) / 1080                    the type scale: 1 in every preset and platform profile
margin = 120 × k (landscape), 84 × k (portrait, square)
pad    = max(margin, safe.left, safe.right)  the sides are the same width
top    = max(pad, safe.top + 30 × k)
bottom = H − max(pad, safe.bottom + 20 × k)
left   = pad,  right = W − pad
```

| Format               | Covered (top, bottom, left, right) | `pad` | `top`, `bottom`, `left`, `right` | `ctx.content`           |
| -------------------- | ---------------------------------- | ----- | -------------------------------- | ----------------------- |
| `9x16` (1080×1920)   | 150, 400, 40, 140                  | 140   | 180, 1500, 140, 940              | `[140, 180, 800, 1320]` |
| `tiktok` (1080×1920) | 240, 660, 120, 180                 | 180   | 270, 1240, 180, 900              | `[180, 270, 720, 970]`  |
| `16x9` (1920×1080)   | 60, 90, 80, 80                     | 120   | 120, 960, 120, 1800              | `[120, 120, 1680, 840]` |

`layout(ctx, { margin, topGap, bottomGap })` changes the margin and the gaps by the covered top and bottom edges, in pixels; the box still clears the covered edges.

## Starter components

The SDK has no components of its own. `allyhub add <name>` copies a starter component's source into the workspace (`components/`), where it is the workspace's own code; a copy you changed is not replaced unless you ask (`allyhub help add`). **Each documents its props in its own source.** A copy imports only `@allyhub/sdk` and `@allyhub/sdk/dom`; import it with a relative path (`import { screenDemo } from "../../components/screen-demo.js"`). A piece that imports `@allyhub/sdk/components` is AK-B006.

| Component                             | Purpose                                                                                       |
| ------------------------------------- | --------------------------------------------------------------------------------------------- |
| `screenDemo`, `uiDemo`                | A demo played on a screenshot (with its `.elements.json`), or on an interface drawn in code |
| `codePanel`                           | Code, data or a terminal in a panel, typed or revealed by lines                               |
| `callout`                             | Marks places (a box or another layer's element), labels them, draws lines between them        |
| `chart`                               | One number story: bars, horizontal bars, a line or a ring                                     |
| `captionWord`, `captionLine`, `captionSubtitle` | Captions from `ctx.captions()`: a word at a time, a highlighted line, a quiet subtitle |

Video is not a component: it is a `footage()` layer.

## Look `look`

```ts
(look.color.bg, look.color.fg, look.color.accent, look.color.muted, look.color.surface);
(look.font.display, look.font.body, look.font.mono, look.font.emoji);
look.motion.beat; // seconds
look.sfx; // the look's sounds: name → audio file (the built-in whoosh, tick and pop are always there)
```

The same tokens are CSS custom properties: `--ak-color-bg`, `--ak-font-display` and so on.

`look` in `allyhub.config.ts` is laid over the clean look, for every video and deck:

```ts
export default defineConfig({
  look: {
    color: { accent: "#0f766e", bg: "#fbf8f3", fg: "#16211f", muted: "#5b6b67", surface: "#eef4f1" },
    font: { display: '"Space Grotesk", "Inter Variable", sans-serif' },
    sfx: { ding: "assets/media/sfx/ding.wav" }, // part({ sounds: [{ at, sound: "ding" }] })
  },
});
```

Write only what you change; the rest comes from the clean look.

### Fonts

The stage renders offline, so it draws only fonts that are files: its own and the workspace's.

| Family (CSS name)    | Covers                                 | Weights and styles               |
| -------------------- | -------------------------------------- | -------------------------------- |
| `"Inter Variable"`   | Latin, Greek, Cyrillic                 | 100–900 (variable), upright only |
| `"Noto Sans SC"`     | Chinese                                | 400 and 700                      |
| `"Noto Color Emoji"` | Colour emoji (the look's `font.emoji`) | 400                              |

- The look's `display` and `body` fonts are `"Inter Variable", "Noto Sans SC", sans-serif` until the look names others. Its `mono` is the computer's own monospace font (`ui-monospace, "SF Mono", Menlo, monospace`), which differs between computers: bring a mono font for code or terminal text.
- Emoji inside other text fall to the computer's own emoji font, which differs between computers: put them in an element with `fontFamily: "var(--ak-font-emoji)"` at weight 400 (`emojiEl`).
- **Any other font** is a `.woff2` in `assets/fonts/<id>/` with a `.css` file of `@font-face` rules beside it; name its family in `look.font` or any `font-family`. `allyhub font add "<family>"` adds an open-licence font this way.

  ```css
  /* assets/fonts/space-grotesk/space-grotesk.css */
  @font-face {
    font-family: "Space Grotesk";
    src: url("./latin-wght-normal.woff2") format("woff2");
    font-weight: 300 700;
    font-style: normal;
  }
  ```

- **Every `.css` file under `assets/fonts/` is loaded by every video and deck**; no piece imports it. Keep only `@font-face` rules in those files. Before the layers mount, the stage loads the faces of the families the look and the stylesheets name that have a character of the piece's text; after mount, whatever the text on the stage asks for; then it draws. A font never used is never fetched; of a font sliced by `unicode-range`, only the slices the text has. `fonts: { exclude: ["<id>"] }` in `allyhub.config.ts` leaves a font (a folder or a `.css` file under `assets/fonts/`) out of every stage; a piece can still import it.
- A weight or style outside what the loaded faces cover is faked by the browser, and a family that is not loaded falls back to another font: both are AK-L006. A character no loaded font has is a must-fix problem (missing glyphs).

## Animation helpers

All are pure functions of time:

| Function                                                                                                                | Description                                                                                                                                                                                                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tween(t, { from, to, start, dur, ease })`                                                                              | The interpolated value at time t                                                                                                                                                                                                                                                                                                                                                    |
| `progress(t, start, dur)`, `lerp(a, b, x)`, `clamp(x, lo?, hi?)`                                                        | 0→1 over a span, interpolation, clamping                                                                                                                                                                                                                                                                                                                                            |
| `ease.linear`, `ease.in`, `ease.out`, `ease.inOut`, `ease.outExpo`, `ease.outBack`, `ease.spring(damping?, frequency?)` | Easing curves, each 0→1 over 0→1: `in`, `out` and `inOut` are cubic, `outExpo` ends more slowly, `outBack` passes 1 by about 10 % and comes back, `ease.spring()` swings around 1 as it settles (`damping` 7, `frequency` 3.2 by default). Any other curve is a function `(x) => number`                                                                                        |
| `stagger(i, gap)`                                                                                                       | The delay of the i-th element                                                                                                                                                                                                                                                                                                                                                       |
| `rand(seed)`                                                                                                            | A deterministic random number generator                                                                                                                                                                                                                                                                                                                                             |
| `noise2D(seed, x, y)`, `noise3D(seed, x, y, z)`, `noise4D(seed, x, y, z, w)`                                            | Simplex noise: a smooth value in [-1, 1] that changes over about one unit of each coordinate, the same for the same seed and coordinates (0 at whole-number corners). With two axes on a circle, `noise4D(seed, x, y, cos(a), sin(a))` loops when `a` turns once                                                                                                                 |
| `pathLength(d)`, `pointAtLength(d, length)`, `tangentAtLength(d, length)`                                               | An SVG path's length in its own units, the point `{ x, y }` at a length along it and the unit vector it runs in there; a length is clamped to the path. Measured without the browser, as Chrome measures it (arcs as quarter-turn cubics)                                                                                                                                         |
| `drawOn(d, progress)`                                                                                                   | `{ strokeDasharray, strokeDashoffset }` that show the first `progress` (0–1) of the path's stroke                                                                                                                                                                                                                                                                                  |
| `trimPath(d, from, to)`                                                                                                 | The stretch of the path between two fractions of its length (0–1), as a path (lines and cubics; Z where a subpath is kept whole); `""` when `to` is not after `from`                                                                                                                                                                                                               |
| `interpolatePath(a, b, x)`, `normalizePath(d)`                                                                          | The path `x` of the way from `a` to `b` (beyond 0–1 for an easing that overshoots): both must have the same commands once written absolute (`normalizePath(d)`: H and V as L, S as C, T as Q), and arcs the same flags, or it throws naming the first that differs                                                                                                              |
| `fitText(el, { min, max })`                                                                                             | Scales text to fit inside its container                                                                                                                                                                                                                                                                                                                                             |
| `fitLines(el \| text, { lines, min, max, … })`                                                                          | The largest font size at which a text takes at most n lines of a box (see DOM helpers)                                                                                                                                                                                                                                                                                              |
| `splitText(text, "words" \| "chars" \| separator)`                                                                      | Splits by word, by character or by a separator                                                                                                                                                                                                                                                                                                                                      |
| `countText(value, x, from?)`                                                                                            | A number counting to `value`, as text: `"38%"`, `"$1,200.5M"` or `"12,400"` with its number `x` (0→1) of the way from `from` (default 0), keeping what is around it, its decimal places and its thousands separators; `value` itself at 1 and when it has no number. Use `font-variant-numeric: tabular-nums` so the digits do not shift                                        |

**Slow moves shimmer.** Chrome draws a line of text on whole pixels up and down (across, on quarter pixels) and a box's edges close to whole pixels, whatever its transform. Text or a box moving slower than about a pixel a frame (30 px a second at 30 fps; a camera zooming a few per cent a second) steps a pixel every few frames instead of gliding, and things beside each other step on different frames, so text and the shapes round it shiver. A picture (`<img>`, footage) moves smoothly at any speed. `allyhub frames --from <s> --to <s> --clip <file>.mp4` shows a stretch frame by frame.

## `console.log`

Piece code may print with `console.log`, `info`, `warn`, `error` and `debug`: at its file's top level, in the output's function, in `mount` and in `render`. The commands that load a piece (check, inspect, render, still, sheet, frames, timeline) print each message after their own output, with the piece, output, combo, format, part, layer and phase (`module`, `build`, `mount`, `render t=…`, `cover`, `other`) it was printed at. Printing changes no frame.

## Determinism

The same files, the same combo and format and the same moment always give the same frame. The runtime takes over `Date`, `performance.now`, `Math.random`, `crypto.getRandomValues`, `requestAnimationFrame` and timers; the clock is the part's own time, and the random seed is "piece id + output name + the dimensions with the format + part key + frame number in the part", so a part draws the same in every combo that has it, and a piece keeps its frames when its file moves only if it has an `id`. The shuffled-order comparison (AK-D002) catches frames that come out different. CSS animations and transitions run on real time: do not drive the frame with them.
