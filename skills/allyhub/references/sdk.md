# SDK reference

The package is `@allyhub/sdk`: how a piece is written, how it gets its text and media, and how components are written. The CLI brings it; a workspace installs nothing.

## Entry points

| Import path                | Contents                                                                                                                                        |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `@allyhub/sdk`            | `definePiece`, `video`, `paged`, `defineComponent`, `custom`, `defineConfig`, prop types, animation tools |
| `@allyhub/sdk/dom`        | Layout and DOM helpers for writing components: `layout`, `contentBox`, `textBlock`, `eyebrow`, `fitTo`, `rise`, `pop`, `h`, `css`, `tag`, `one`, `all` |
| `@allyhub/sdk/client`     | Types only: the types of media and data imports, for a `tsconfig.json` you add                                                           |

Import files inside the workspace with relative paths. URLs and files outside the workspace cannot be imported (AK-B005); an npm package can when a `package.json` in the workspace declares it and it is installed.

## A workspace

```
allyhub.config.ts               defaults (languages, sizes) and the look
messages/en.json                strings for videos and slides, one file per language
messages/zh-cn.json
app/videos/launch.ts            a piece: default-exports definePiece(...)
app/videos/vo/en.mp3            voiceover
app/videos/vo/en.words.json     word-level timings of the voiceover, same name as the audio
app/decks/pitch.ts              a deck
app/components/title-card.ts    a starter component, copied in with allyhub add: the workspace's own code
app/components/stat-badge.ts    a component of your own
media/logo.svg
data/completion.csv             data, read in at build time
```

File and folder names are up to you. `allyhub check`, `allyhub dev` and `allyhub render` find every module that default-exports `definePiece(...)`.

The `vite.config.ts` in the workspace root is read: its `plugins`, `resolve`, `css`, `define`, `json`, `assetsInclude` and `oxc` take effect, after AllyHub's plugins; AllyHub decides the other settings (output, server, env files, the `public` folder).

## `definePiece`

```ts
import { definePiece, video } from "@allyhub/sdk";

import { endCard } from "../components/end-card.js"; // allyhub add endCard
import { titleCard } from "../components/title-card.js"; // allyhub add titleCard
import logo from "../media/logo.svg";
import voiceEn from "./vo/en.wav";

export default definePiece({
  id: "launch-film",
  variants: { lang: ["en", "zh-cn"], size: ["16x9", "9x16"] },
  meta: { release: "2026-10-launch" },
  outputs: {
    film: video(
      ({ s, voice }) => [
        titleCard({
          key: "hook",
          line1: s("launch-film.hook.line1"),
          l2At: voice.at(s("launch-film.hook.cue.l2")),
        }),
        endCard({ key: "cta", lines: s.list("launch-film.cta.lines"), logo }),
      ],
      {
        voice: { en: voiceEn, "zh-cn": { file: "./vo/zh-cn.wav", lead: 0.3 } },
      },
    ),
  },
});
```

| Field      | Required | Description                                                                                                                                              |
| ---------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`       | No       | A stable identity: lowercase letters, digits, `.`, `_`, `-`; `/` makes levels. When omitted, the file's path in the workspace (without the extension) is used |
| `title`    | No       | The name people see: one string, or one per language. When omitted, `<id>.title` from messages is used, then the file name                               |
| `variants` | No       | The dimensions of the variants and their values, see below                                                                                               |
| `meta`     | No       | Any key-value pairs, plain data. The platform only uses it to filter and group                                                                           |
| `outputs`  | Yes      | The outputs: the key is the output name (starts with a letter), the value is `video(...)` and so on                                                      |

**Requirements on how it is written** (when one is not met, the check reports an error and says how to fix it):

- The default export is `definePiece({ … })` directly, or `const piece = definePiece({ … }); export default piece` in the same file. AllyHub does not guess at factory functions or re-exports (AK-M001).
- `definePiece` is imported from `@allyhub/sdk`.
- **The module's top level must load in Node**: the build reads `id`, `variants`, `meta` and which outputs exist in Node, without drawing anything. Code that touches `window` or `document` goes inside an output's function or a component's `mount` (AK-R001 gives the fix). The top level cannot use the network (AK-B003) and cannot run forever (AK-B004).
- `id`, `title`, `variants` and `meta` cannot contain functions (AK-M001). Two pieces cannot have the same `id` (AK-B001).

### Variants `variants`

You decide the dimensions and their values. The framework knows only two dimensions:

| Dimension | How the framework uses it                                                                                                                                                                         |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lang`    | Selects `messages/<lang>.json`. The first one is the default language; missing keys fall back to it. When `lang` is omitted, it is every language under `messages/`                               |
| `size`    | The frame size: a preset `16x9`, `9x16`, `1x1`, `4x5` (AllyHub knows each size's pixels and the areas platforms cover), or `WIDTHxHEIGHT` in pixels with even sides from 64 to 8192, such as `1280x720` (no covered areas). When `size` is omitted, the default from `allyhub.config.ts` is used, then `16x9` only |

For other dimensions (opening, audience, …) the code reads `ctx.variant` and decides how to use them. The same value cannot be written twice (AK-M001).

The **variant key** of a variant is the dimensions sorted by name, each written as `dimension=value`, joined with commas: `lang=zh-cn,size=9x16`. On the command line, `--variant lang=zh-cn,size=9x16` selects a variant.

The order of languages: `defaults.languages` in `allyhub.config.ts` comes first; when it is not set, `en` comes first and the rest follow alphabetically.

```ts
// allyhub.config.ts (optional)
import { defineConfig } from "@allyhub/sdk";

export default defineConfig({
  defaults: { languages: ["en", "zh-cn"], sizes: ["16x9"] },
});
```

## `video(build, options?)`

`build` receives `ctx` and returns a list of **parts**. Each part is made by a component or by `custom()`. Its `key` is unique within this output (AK-K001) and stable across variants.

| Option   | Description                                                                                                                                                                                                |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `voice`  | The voiceover per language: an imported audio file, a path relative to this file, or `{ file, offset?, lead?, tail?, musicDb? }`. The word-level timings are the `.words.json` of the same name next to it |
| `music`  | The music: audio (an import or a path), or `{ file?, bpm?, followVoice? }`. Without a voiceover, part lengths snap to the beat of `bpm`                                                                    |
| `sfx`    | Whether the components' sound-effect cues make sound, `true` by default                                                                                                                                    |
| `look`   | The look name, `clean` by default; when the workspace has no such look, `clean` is used                                                                                                                         |
| `prefix` | The messages key prefix of this output: each part's voiceover script is `<prefix>.<part>.vo`, and its chapter title is `<prefix>.<part>.title`. The default is the piece's `id` with `/` replaced by `.`   |
| `covers` | `(ctx) => part[]`: the parts used for the cover, optional                                                                                                                                                  |
| `fps`         | Frames per second: a whole number from 1 to 120, or an NTSC rate (`23.976`, `29.97`, `47.952`, `59.94`, `119.88`, or written `"30000/1001"`…), which renders at the exact n × 1000/1001; default 30 |
| `transparent` | `true`: the stage has no background. `mov`, `webm` and `png` renders keep the alpha; `mp4` and `gif` show black where nothing is drawn |
| `master`      | The loudness the sound is mastered to, in LUFS (−70 to 0); default −14. `false` keeps the mix's level and only limits its peaks |
| `motionBlur`  | `{ samples, shutter? }`: each frame blends `samples` (2–16) moments across `shutter` (0–1, default 0.5) of the frame's time. Renders take `samples` times as long |
| `post`        | `{ filter?, lut? }`: an ffmpeg filter chain over the frames (`"eq=contrast=1.05,noise=alls=6:allf=t"`; one chain, no files, no changes to timing or size), then a `.cube` LUT relative to the piece |

The voiceover defaults: `offset` 0.5 s (the silence before the first word), `lead` 0.35 s (how much earlier a part starts than its first word), `tail` 2.5 s (how long the last part holds after the last word), `musicDb` −8 (how much the music is lowered while someone speaks).

## `paged(build, options?)`

A list of fixed-size pages, each one a still frame: a single image, a carousel, slides, a PDF document. `build` receives `ctx` and returns a list of **pages**. Like the parts of a video, a page is made by a component or by `custom()`, and its `key` is unique within this output. Each page is drawn at its still time (for a component the default is the moment its entrance animation ends; `custom({ still: 0 })` is second 0).

```ts
paged(({ s }) => [titleCard({ key: "cover", … }), bulletList({ key: "how", … })], {
  size: "16x9",
  notes: true,
});
paged(({ s }) => [custom({ key: "summary", mount, render: () => {}, still: 0 })], {
  size: "a4",
});
```

| Option   | Description                                                                                                                                                                                                                                                                                                                                                               |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `size`   | The page size, the same for every page: `16x9`, `9x16`, `1x1`, `4x5`, the document sizes `a4` (1240×1754, 150 dpi) and `letter` (1275×1650), or `WIDTHxHEIGHT` in pixels (each side 64–8192, for example `1200x630`). When it is set, this output has no `size` dimension; when omitted, it is drawn at the variant's `size`, like a video. A wrong value reports AK-G001 |
| `notes`  | `true`: each page's speaker notes are `<prefix>.<page>.notes` in messages, and are written into the notes when exporting PPTX; a page without notes gets empty notes                                                                                                                                                                                                      |
| `look`   | The look name, `clean` by default                                                                                                                                                                                                                                                                                                                                         |
| `prefix` | The messages key prefix, by default the piece's `id` with `/` replaced by `.`. A page's title is `<prefix>.<page>.title`; without it, the first text on the page is used                                                                                                                                                                                                  |

- Pages have no sound: `<page>.vo` is not read, and there is no voiceover, music or sound effects.
- Checks: each page's still gets the frame checks (overflow, occluded areas, missing glyphs) and the font check; the shuffled-order comparison (AK-D002) is not run. `a4`, `letter` and custom sizes have no occluded areas.
- Export: `allyhub render --format png,pdf,pptx` (without `--format` it makes a PDF); see `allyhub help render`.

## Rendering

`allyhub render` makes, for a video:

| Format  | What it is                                                                 |
| ------- | -------------------------------------------------------------------------- |
| `mp4`   | H.264 (default) or H.265 (`--codec h265`), AAC sound                       |
| `mov`   | ProRes: 4444 with alpha when `transparent`, else 422 HQ; 24-bit PCM sound  |
| `webm`  | VP9 (with alpha when `transparent`), Opus sound                            |
| `gif`   | No sound                                                                   |
| `png`   | A file per frame (`<output>.<variant>.00001.png`…), and the sound as a WAV |
| `srt`, `vtt`, `cover` | Captions (with a voiceover) and the cover image              |

- `--crf <0–63>` sets the quality (lower is better; default 18 for H.264, 20 for H.265, 30 for VP9), `--chroma 444` keeps sharp colored edges, `--bits 10` keeps smooth gradients; `--workers <n>` sets how many pages draw frames at once.
- `--gpu` (or `ALLYHUB_GPU=1`) draws on the GPU: WebGL, Three.js and shaders run on the graphics card instead of in software. `allyhub check --gpu` checks the same way; a frame must still be the same at the same moment (AK-D002).
- Motion blur, `post` and transparency show in the render, in `allyhub still` and `allyhub sheet` (`--raw` draws the frame as the page does), and in `allyhub dev` with **Final look** while paused. The check looks at the page as drawn.
- `allyhub doctor` lists the formats this computer's ffmpeg can make.

## Sizes, languages and fonts

| Size   | Pixels    | Covered areas                       |
| ------ | --------- | ----------------------------------- |
| `16x9` | 1920×1080 | yes (the default size)              |
| `9x16` | 1080×1920 | yes: feed buttons and captions      |
| `1x1`  | 1080×1080 | yes                                 |
| `4x5`  | 1080×1350 | yes                                 |
| `WxH`  | any       | none; even sides from 64 to 8192    |

- Text in a preset's covered areas is reported (AK-L005). Lay out by `ctx.dims` (width, height, `orient`, `safe`), never by the size's name, so custom sizes work too. `ctx.dims.safe` is `{ top, bottom, left, right }` in pixels (all 0 for custom sizes); `layout(ctx)` turns it into a content box.
- Languages are the files in `messages/`; the first (or `defaults.languages`) is the default, and a missing key falls back to it with a warning (AK-S002).

### Fonts

The stage renders offline, so it draws only fonts that are files: its own and the workspace's.

| Family (CSS name)  | Covers                     | Weights and styles               |
| ------------------ | -------------------------- | -------------------------------- |
| `"Inter Variable"` | Latin, Greek, Cyrillic     | 100–900 (variable), upright only |
| `"Noto Sans SC"`   | Chinese                    | 400 and 700                      |

- The look's `display` and `body` fonts are both `"Inter Variable", "Noto Sans SC", sans-serif`. Its `mono` is the computer's own monospace font (`ui-monospace, "SF Mono", Menlo, monospace`): it differs between computers, so bring a mono font when the piece shows code or terminal text.
- **Any other font** (a brand font, a display face, a script the stage lacks): `allyhub font add "<family>"` downloads an open-licence font into `media/fonts/<id>/` with its licence and a stylesheet, and prints the import line and the `look.font` value. By hand: put the `.woff2` in the workspace, declare it in a `.css` file the piece imports, and use the family name:

  ```css
  /* media/fonts/space-grotesk/space-grotesk.css */
  @font-face {
    font-family: "Space Grotesk";
    src: url("./latin-wght-normal.woff2") format("woff2");
    font-weight: 300 700;
    font-style: normal;
  }
  ```

  ```ts
  import "../../media/fonts/space-grotesk/space-grotesk.css"; // in the piece
  // allyhub.config.ts: look: { font: { display: '"Space Grotesk", "Inter Variable", sans-serif' } }
  ```

- A weight or style outside what the loaded faces cover is faked by the browser (smeared bold, slanted italic), and a family that is not loaded falls back to another font; the check reports both (AK-L006). A character no loaded font has is a must-fix problem (missing glyphs).

## `ctx`

| Name                        | Description                                                                                                 |
| --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `ctx.variant`               | The coordinates of the current variant, for example `{ lang: "zh-cn", size: "9x16" }`                       |
| `ctx.s(key, hint?)`         | One string in the current language                                                                          |
| `ctx.s.list(prefix, hint?)` | Numbered keys: `prefix.0`, `prefix.1`, … in order; deeper keys form objects, for example `plans.0.name`     |
| `ctx.s.with(key, inputs)`   | A string with its `{name}` variables filled in; plurals and selects pick the sentence that matches `inputs` |
| `ctx.asset(path)`           | Media at a dynamic path, relative to this file (use import for fixed media)                                 |
| `ctx.data(path)`            | A data file (CSV, YAML, JSON) at a dynamic path, relative to this file (use import for fixed data)          |
| `ctx.voice.at(ref)`         | The moment a word is spoken within this part, see "Voiceover cues"                                          |
| `ctx.voice.has`             | Whether the current language has a voiceover                                                                |
| `ctx.look`                  | The style tokens                                                                                            |

## Strings

All the text people see is in `messages/<locale>.json`: flat keys, each value one sentence. The format matches inlang (Paraglide).

```json
{
  "launch-film.hook.line1": "表单自己填好。",
  "launch-film.hook.vo": "Tidyform 让表单自己填好，你只需要问不知道的事。",
  "launch-film.how.items.0": "粘贴表单链接",
  "launch-film.how.items.1": "匹配你已有的答案",
  "launch-film.quote.vo": {
    "display": "Northwind 把注册表单从 12 项减到了 3 项。",
    "speak": "Northwind 把注册表单从十二项减到了三项。"
  },
  "pricing.greeting": "你好，{name}",
  "pricing.count": [
    {
      "declarations": ["input count", "local n = count: plural"],
      "selectors": ["n"],
      "match": {
        "n=0": "还没有套餐",
        "n=one": "{count} 个套餐",
        "n=other": "{count} 个套餐"
      }
    }
  ]
}
```

- **Keys are prefixed by piece**: `<piece id>.<part>.<name>`. A part's voiceover script is `<prefix>.<part>.vo`, its chapter title is `<prefix>.<part>.title`, and the piece's title is `<id>.title`.
- **Lists use numbered keys**. `s.list("launch-film.how.items")` returns them in order and stops at the first missing number.
- When the displayed and spoken text differ, write `{ "display", "speak" }`: `s()` returns `display`; voiceover timing and captions use `speak`.
- `{name}` is a variable; fill it with `s.with(key, { name: … })`.
- **Plurals and selects** follow inlang's syntax: an array with exactly one item, where `declarations` declares the inputs (`input count`) and the plurals (`local n = count: plural`; ordinals add `type=ordinal`), `selectors` says what to pick by, and the keys of `match` are `selector=value`, with several selectors separated by commas and `*` matching any value. `s.with("pricing.count", { count: 3 })` picks by the current language's `Intl.PluralRules`: an exact number (`n=0`) comes before a category (`one`, `few`, `other`), and a category comes before `*`. With no input, the `other` sentence is used. Other functions (`number`, `datetime`) are not supported yet; the check reports AK-M006.
- **Keys are typed.** `allyhub check` and `allyhub dev` generate `.allyhub/types/messages.d.ts` from the default language's file: the keys of `s()` and `s.list()` autocomplete, and a wrong key is a `tsc` error; the inputs of `s.with()` are typed by the variables and plurals, and each item of `s.list()` is typed by the structure of the keys. With a `tsconfig.json` (optional), add `".allyhub/types"` to its `include` (`**/*.ts` does not enter folders that start with a dot), and do not put `.allyhub` in `exclude`. `tsc` cannot check a key built from data; write it as ``s(`x.label.${key}` as MessageKey)``, and the check still reports a key that does not exist (AK-S001).
- When the current language does not have the key, the default language's value is returned and a "missing translation" is recorded (AK-S002); when the default language does not have it either, an empty string is returned and an error is recorded (AK-S001).
- `hint` is `{ max?, note? }`: it does not affect the return value and is not checked; it is a length hint for the people and agents who write the strings.
- Text lives with the piece: the text of videos and slides goes in messages, so it can be translated and edited in the "All text" table of `allyhub dev`. The check does not report text written in code; it just cannot be edited there, and an agent has to change it. To split a sentence into words or characters for animation, use `splitText(text, "words" | "chars" | separator)`.

## Import media and data

```ts
import plans from "./data/plans.csv"; // → [{ name: "Team", price: 12 }, …]
import voiceEn from "./vo/en.wav"; // → { path, sha256, kind: "audio", duration, words, url }
import shot from "./media/signup.png"; // → { path, sha256, kind: "image", width, height, elements?, url }
import demo from "./media/demo.mp4"; // → { path, sha256, kind: "video", width, height, duration, audio, url }
```

- Paths are relative to the importing file and cannot leave the workspace.
- Images, audio, video and fonts become a media value: `path` (the path in the workspace), `sha256`, `kind` (`image`, `audio`, `video`, `font`), `width`, `height` (images and video), `duration` (audio and video), `audio` (video: whether it has sound), `url`. `url` is valid only at runtime; do not concatenate or rewrite it.
- When an audio file has a `.words.json` of the same name next to it (`[{ "w", "start", "end" }]`), the value carries `words`: that makes it a voiceover. When an image has an `.elements.json` of the same name next to it (element name → `[x, y, w, h]`), the value carries `elements`: a web page screenshot, used by `siteStep`.
- CSV becomes an array of objects, with the header row as keys; a column that is all numbers becomes numbers. YAML becomes JSON; JSON imports as usual.
- For a dynamic path (a different image per variant) use `ctx.asset("./media/" + name + ".png")`; when it is not found, AK-A001 is recorded.
- For data at a dynamic path use `ctx.data("./data/" + region + ".csv")`: it returns the parsed content (`unknown`; add the type yourself), is recorded as a read, and goes into the digest. When it is not found, AK-A001 is recorded; when it cannot be parsed, AK-R001. `package.json`, `tsconfig*.json`, lock files, `messages/`, `*.words.json`, `*.elements.json` and folders that start with a dot do not count as data.
- Types: when the workspace has a `tsconfig.json` (only for an editor's type checking; AllyHub does not need it), add `"@allyhub/sdk/client"` to `compilerOptions.types`.

## Voiceover cues `voice.at(ref)`

Returns the time in seconds of a voiceover word within **this part** (relative to the start of the part), so an animation can land on the moment the word is spoken. Pass it straight to a component prop; the runtime replaces it with seconds once the parts are timed.

| Form              | Meaning                                                              |
| ----------------- | -------------------------------------------------------------------- |
| `"只问"`          | The start of the first occurrence of "只问" in this part's voiceover |
| `"deposit@2"`     | The second occurrence in this part                                   |
| `"deposit-0.35"`  | 0.35 s earlier                                                       |
| `"deposit@2+0.1"` | The second occurrence, 0.1 s later                                   |
| `1.8` (a number)  | Returned as is                                                       |

Matching ignores case and punctuation; a cue can be a phrase of several words; Chinese and Japanese match character by character, consecutively. Put cue words in messages under `<prefix>.<part>.cue.<name>`, one per language.

When the current language has no voiceover, a number is returned as is; text is estimated from its position in the voiceover script, in proportion to the part's duration.

## Durations

**Languages with a voiceover**:

1. Each part's `<prefix>.<part>.vo` (the spoken form) is used to find, in order, the first word of each part in the voiceover's word-level timings (small differences between the transcript and the script are tolerated; the script wins, and missing words are interpolated).
2. Each part starts at "its first voiceover word − `lead`" and ends when the next part starts.
3. A part with `silent: true` has no voiceover. It uses its `dur` and is inserted between the parts before and after it; the voiceover pauses there.
4. The last part lasts `tail` seconds after the last word.
5. Every part except `silent` parts needs a voiceover script; when one is missing, this language is timed by the durations in code. A whole sentence that cannot be matched to the voiceover reports AK-V002; a voiceover with no `.words.json` next to it reports AK-V005.

**Languages without a voiceover**: each part uses the `dur` in code (the component's default duration when omitted), then rounds to the beat of the music (`60 / bpm`).

Durations are computed at build and at playback, and are never written back to the source files. When you replace a voiceover (overwrite `vo/en.wav` and `vo/en.words.json`), the part lengths and the cues inside the parts are laid out again automatically.

## Part options

Besides its own props, every component accepts these part options:

| Option   | Description                                                                                                                                          |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `key`    | Required, unique within the output                                                                                                                   |
| `dur`    | The duration without a voiceover (seconds); when omitted, the component's default duration is used                                                   |
| `still`  | The still time (seconds, relative to the start of the part); when omitted, the component's default is used, usually 0.4 s before the end of the part |
| `silent` | This part has no voiceover                                                                                                                           |

**Part options and component props are in the same object, so there can only be these four part options** (`PART_OPTIONS`). A component's prop types, defaults and examples cannot use these four names; `defineComponent` reports an error as soon as it finds one. Before adding a part option, check every starter component (`packages/components` in the AllyHub repository) and every component in the workspace.

A part's chapter title comes from `<prefix>.<part>.title` in messages; without it, the first sentence on screen at the part's still is used. Many components have their own `title` prop; that is the title on screen and has nothing to do with the chapter title.

## Custom parts `custom`

```ts
custom({
  key: "growth",
  dur: 5,
  still: 4,
  title: "Growth",
  cues: [{ at: 1.2, sound: "tick", what: "the number lands" }],
  mount(el, ctx) {
    /* build the DOM once; ctx has look, size, dims, variant, asset */
  },
  render(el, t, ctx) {
    /* t is the seconds within this part; change the frame by t only */
  },
});
```

`mount` and `render` get the same `ctx` as a component's (without props):

| Name               | Description                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| `ctx.look`         | The style tokens (also CSS variables `--ak-color-*`, `--ak-font-*`)                               |
| `ctx.size`         | The size being drawn: `"16x9"`, `"1280x720"`; a paged output's may be `"a4"`                      |
| `ctx.dims`         | `{ width, height, orient, safe }`: pixels, `"landscape"`/`"portrait"`/`"square"`, the covered edges `{ top, bottom, left, right }` in pixels |
| `ctx.variant`      | The variant's coordinates                                                                         |
| `ctx.dur`          | The part's length in seconds, once timed                                                          |
| `ctx.clips`        | The boxes of the part's `clips`, in order                                                         |
| `ctx.asset(path)`  | Media at a path relative to the piece                                                             |
| `ctx.voiceAt(ref)` | Seconds from the part's start when a voiceover word is said                                       |

`title` is the part's chapter title (the label of the part in the preview's timeline and the chapters); without it, `<prefix>.<part>.title` from messages, then the first sentence on screen at the still, is used.

The DOM helpers work in `custom()` as in a component. Build in `mount`, keep the elements, and set every moving property in `render`:

```ts
import { custom, ease, tween } from "@allyhub/sdk";
import { h, layout, one, tag } from "@allyhub/sdk/dom";

custom({
  key: "year",
  dur: 3,
  still: 2.5,
  mount(el, ctx) {
    const L = layout(ctx); // L.k: type scale (1 at a 1080 px short side); L.top/bottom/left/right: the content box
    const year = tag(
      h("div", { fontSize: 380 * L.k, fontWeight: 900, letterSpacing: "-0.04em" }, [s("story.year.value")]),
      "year",
    );
    el.append(h("div", { position: "absolute", inset: 0, display: "grid", placeItems: "center" }, [year]));
  },
  render(el, t) {
    const year = one(el, "year");
    if (!year) return;
    const p = tween(t, { start: 0, dur: 0.4, ease: ease.outExpo });
    year.style.transform = `scale(${2.6 - 1.6 * p})`;
    year.style.opacity = String(Math.min(1, t / 0.08));
  },
});
```

(`s` is the build function's `ctx.s`, read when the parts are made.)

## Video clips

An mp4 (or webm, mov) in the workspace plays inside a part: a screen recording, generated footage, film. The preview plays it in step with the rest; the export puts the exact frame of the clip in every frame of the video (its frames are extracted once with ffmpeg and kept in `.allyhub/cache/frames`), and mixes the clip's own sound in.

The simplest way is the `clip` component, a part that fills the frame:

```ts
import demo from "./media/demo.mp4";

clip({ key: "signup", video: demo, from: 2, caption: s("launch.signup.caption") });
```

| Prop      | Meaning                                                                                      |
| --------- | -------------------------------------------------------------------------------------------- |
| `video`   | The video: an import, or a path relative to the piece                                        |
| `from`    | Seconds into the video to start from; default 0                                              |
| `audio`   | Mix the clip's own sound in (when it has any); default `true`                                |
| `fit`     | `cover` fills the frame and crops (default); `contain` shows all of it                       |
| `caption` | A line of text over the bottom                                                               |

Without a voiceover the part lasts as long as the clip (from `from` to its end); give `dur` to cut it shorter. When the part is longer than the clip, the last frame holds. With a voiceover, the clip sits lower in the mix than the voice.

To place a clip inside your own layout (a device frame, half the screen), declare it with `clips` in `custom()` or `defineComponent`, and put its box where you want it in `mount`. `ctx.clips[i]` is the box of the `i`th clip; the runtime fills it with the clip's picture at every moment, so `render(t)` never touches it:

```ts
custom({
  key: "split",
  dur: 6,
  clips: [{ file: demo, at: 0.5, from: 3, dur: 5, audio: false }],
  mount(el, ctx) {
    const box = ctx.clips[0];
    if (box) Object.assign(box.style, { inset: "auto", left: "50%", top: "10%", width: "45%", height: "80%", borderRadius: "24px" });
  },
  render() {},
});
```

A clip is `{ file, at?, from?, dur?, audio? }`: `at` is seconds into the part where it starts, `from` seconds into the video, `dur` how long it shows (default: until the part ends). Set `--ak-clip-fit: contain` on the box to show the whole picture. A clip that is not a video reports AK-A003.

## Components `defineComponent`

```ts
import { defineComponent, number, text, tween } from "@allyhub/sdk";

export const statBadge = defineComponent<{
  value: string;
  label: string;
  at?: number;
}>({
  name: "stat-badge",
  label: { en: "Stat badge", "zh-cn": "数字徽章" },
  summary: { en: "One number in a badge, with a line under it." },
  props: {
    value: text({ max: 6 }),
    label: text({ max: { "16x9": 40, "9x16": 24 } }),
    at: number({ min: 0, optional: true }),
  },
  examples: { pilots: { value: "3", label: "pilot teams live" } },
  defaults: { dur: 4, still: (dur) => dur - 0.5, props: { at: 0.6 } },
  mount(el, p, ctx) {
    /* layout: you can measure text */
  },
  render(el, t, p, ctx) {
    /* set every animated property each time, decided by t only */
  },
  cues: (p) => [{ at: p.at ?? 0.6, sound: "pop" }],
});
```

| Field      | Description                                                                               |
| ---------- | ----------------------------------------------------------------------------------------- |
| `name`     | The component name, unique within the workspace                                                |
| `label`    | The name people see: a string, or one per language                                        |
| `summary`  | What it is for, in one sentence                                                           |
| `props`    | The semantic types of the props, plain data, see below                                    |
| `examples` | Named example props; the platform renders preview images from the examples                |
| `hidden`   | Hides a deprecated component without deleting it                                          |
| `defaults` | `dur`, `still` (seconds, or a function of the part length), `props` (default prop values) |

**Semantic prop types** (exported by `@allyhub/sdk`; all plain data):

| Function                             | What it is                                          | Constraints                                         |
| ------------------------------------ | --------------------------------------------------- | --------------------------------------------------- |
| `text(o?)`                           | Text on screen                                      | `max` (one number, or per size), `min`, `multiline` |
| `time(o?)`                           | Seconds within the part                             |                                                     |
| `asset(o?)`                          | Media (an import or `ctx.asset`)                    | `kind`: `image`, `audio`, `video`, `font`           |
| `color(o?)`                          | A style token, for example `var(--ak-color-accent)` |                                                     |
| `number(o?)`, `boolean(o?)`          | A number, a switch                                  | `min`, `max`, `step`                                |
| `list(of, o?)`, `object(fields, o?)` | A list, an object                                   | `min`, `max`                                        |

Each one can carry `label`, `examples` and `optional`.

A component must:

1. Draw the same frame at the same moment: `render(t)` sets every animated property each time and does not depend on the previous frame (AK-D002).
2. Declare its still time (`still`).

The rest is up to you. The starter components also use only style tokens (`var(--ak-color-*)`, `var(--ak-font-*)`), so a look restyles them; set text with `textContent`; and lay out by `ctx.dims` (`dims.safe` is the covered area, AK-L005), so they fit every size.

`mount(el, props, ctx)` is called once at `ready()`. **By then the look's fonts have loaded** (including the Chinese font subsets the text uses), so it is safe to measure text for layout (`fitText`). `ctx` has `look`, `size`, `dims` (width, height, orientation, `safe`), `variant`, `dur` (the length of this part), `clips` (the boxes of the part's video clips), `asset(path)` and `voiceAt(ref)`.

### DOM helpers (`@allyhub/sdk/dom`)

| Helper                            | What it does                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------------ |
| `h(tag, style?, children?, cls?)` | Creates an element with styles and children (strings become text nodes)                          |
| `css(el, style)`                  | Sets styles: camelCase or `--custom` names; a number gets `px`, except `opacity`, `zIndex`, `fontWeight`, `lineHeight`, `flex`, `flexGrow`, `flexShrink` |
| `layout(ctx)`                     | `{ W, H, k, orient, pad, top, bottom, left, right }`: the type scale and the content box, clear of the covered areas |
| `tag(el, name)`, `one(el, name)`, `all(el, name)` | Names an element in `mount`, finds it again in `render`                          |
| `fitTo(el, { min, max, maxHeight })` | Largest font size that fits                                                                   |
| `rise(el, t, at, { d, dy })`, `pop(el, t, at)` | Common entrances, as functions of `t`                                              |

Use `h`/`css` instead of assigning to `el.style` yourself: a browser silently drops a value it does not accept (`fontWeight: "900px"`), and the look you wrote does not apply. The check reports such a value as must-fix (AK-R004).

## Starter components (`allyhub add`)

The SDK has no components of its own. AllyHub keeps a set of starter components, and `allyhub add` copies their source into the workspace, where they are the workspace's own code like any component you write:

```bash
allyhub add                          # list them
allyhub add titleCard siteStep       # copy them into app/components/
allyhub add siteStep --to components # another folder
allyhub add siteStep --force         # put the starter version back over your changes
```

- A copy imports only `@allyhub/sdk` and `@allyhub/sdk/dom`, so it stands alone. Import it with a relative path: `import { siteStep } from "../components/site-step.js"`.
- Change a copy freely: colors, layout, timing, sounds, new props. Nothing upstream overwrites it; `allyhub add` refuses to replace a copy that has changes unless you pass `--force`.
- When none fits, write your own with `defineComponent` or `custom` (above), starting from a copy if one is close.
- A piece that still imports `@allyhub/sdk/components` gets AK-B006: copy the components it uses with `allyhub add` and import them from there.

| Component      | Purpose                    | Main props                                                                                                                                                  |
| -------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `titleCard`    | Title card                 | `eyebrow`, `line1`, `line2`, `l2At`                                                                                                                         |
| `clip`         | A video clip               | `video` (an mp4 import), `from`, `audio`, `fit`, `caption` (see Video clips)                                                                               |
| `statement`    | One sentence               | `text`, `emphasis`                                                                                                                                          |
| `bulletList`   | Bullet list                | `title`, `items`, `itemAt[]`                                                                                                                                |
| `compareCards` | Comparison cards           | `left`, `right` (each with `title` and `items`)                                                                                                             |
| `bigNumber`    | Highlighted number         | `value`, `label`, `countFrom`                                                                                                                               |
| `chart`        | Chart                      | `kind` (`bar`, `line`), `data` (`[{ label, value }]`), `highlight`, `title`                                                                                 |
| `timeline`     | Timeline                   | `events[]` (`{ date, title }`), `title`                                                                                                                     |
| `quoteCard`    | Customer testimonial       | `quote`, `name`, `role`, `avatar`                                                                                                                           |
| `priceCard`    | Pricing                    | `plans[]` (`{ name, price, period?, features?, highlight? }`), `title`                                                                                      |
| `siteStep`     | One step of a website demo | `page` (a web page screenshot with `.elements.json`), `title`, `focus`, `typeInto`, `typed`, `clickOn`, `checksAt`; the times `zoomAt`, `typeAt`, `clickAt` |
| `endCard`      | Closing call to action     | `lines`, `cta`, `url`, `logo`                                                                                                                               |

## Look `look`

```ts
(look.color.bg,
  look.color.fg,
  look.color.accent,
  look.color.muted,
  look.color.surface);
(look.font.display, look.font.body, look.font.mono);
look.motion.beat; // seconds
look.sfx; // the available sound-effect names: whoosh, tick, pop
look.music.bpm;
```

The same tokens are also available as CSS custom properties: `--ak-color-bg`, `--ak-font-display` and so on.

**The brand's look**: `look` in `allyhub.config.ts` is laid over the clean look. Every video and slide deck uses it, and components do not need to change:

```ts
export default defineConfig({
  look: {
    color: {
      accent: "#0f766e",
      bg: "#fbf8f3",
      fg: "#16211f",
      muted: "#5b6b67",
      surface: "#eef4f1",
    },
    font: { display: '"Inter Variable", "Noto Sans SC", sans-serif' },
  },
});
```

Write only what you want to change; the rest comes from the clean look. Fonts must be ones the stage has (Inter, Noto Sans SC), or be loaded from the workspace with `@font-face`. When `look` changes, every video and slide deck is checked again.

## Animation helpers

All are pure functions of time:

| Function                                             | Description                                    |
| ---------------------------------------------------- | ---------------------------------------------- |
| `tween(t, { from, to, start, dur, ease })`           | The interpolated value at time t               |
| `progress(t, start, dur)`, `lerp(a, b, x)`, `clamp(x, lo?, hi?)` | 0→1 over a span, interpolation, clamping |
| `ease.inOut`, `ease.out`, `ease.spring(…)` and so on | Easing curves                                  |
| `stagger(i, gap)`                                    | The delay of the i-th element                  |
| `rand(seed)`                                         | A deterministic random number generator        |
| `fitText(el, { min, max })`                          | Scales text to fit inside its container        |
| `splitText(text, "words" \| "chars" \| separator)`   | Splits by word, by character or by a separator |

## Determinism

The same files, the same variant and the same moment always give the same frame. The runtime takes over `Date`, `performance.now`, `Math.random`, `crypto.getRandomValues`, `requestAnimationFrame` and timers; the random seed is "piece id + output name + variant key + frame number". So write an `id` before you move a file, and the frames do not change. So using these APIs in code is not reported; the shuffled-order comparison (AK-D002) catches frames that come out different. CSS animations and transitions run on real time, and their position in each frame is unpredictable when rendering; do not drive the frame with them.
