# SDK reference

The package is `@allyhub/sdk`: how a piece is written, how it gets its text, speech and media, and how components are written. The CLI brings it; a workspace installs nothing.

The values in this reference and in the skill (sizes, timings, levels, words to stress, where a caption goes) are worked examples, not mandates: how a piece looks and sounds is yours to decide. Every default AllyHub applies has an option; [Defaults](#defaults) lists them all.

## Entry points

| Import path                | Contents                                                                                                                                        |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `@allyhub/sdk`            | `definePiece`, `video`, `paged`, `part`, `take`, `say`, `footage`, `defineComponent`, `custom`, `defineConfig`, prop types, animation tools |
| `@allyhub/sdk/dom`        | Layout and DOM helpers for writing components: `layout`, `contentBox`, `textBlock`, `eyebrow`, `fitTo`, `rise`, `pop`, `h`, `css`, `tag`, `one`, `all` |
| `@allyhub/sdk/client`     | Types only: the types of media and data imports, for a `tsconfig.json` you add                                                           |

Import files inside the workspace with relative paths. URLs and files outside the workspace cannot be imported (AK-B005); an npm package can when a `package.json` in the workspace declares it and it is installed.

## A workspace

```
allyhub.config.ts               defaults (languages, formats) and the look
messages/en.json                strings for videos and slides, one file per language
messages/zh-cn.json
app/videos/launch.ts            a piece: default-exports definePiece(...)
app/videos/vo/en.mp3            a recorded take (audio or video)
app/videos/vo/en.words.json     its word times, same name as the take
app/decks/pitch.ts              a deck
app/components/title-card.ts    a starter component, copied in with allyhub add: the workspace's own code
app/components/stat-badge.ts    a component of your own
media/logo.svg
media/gen/say/<hash>.mp3        speech made by allyhub voice generate, with its .words.json
data/completion.csv             data, read in at build time
```

File and folder names are up to you. `allyhub check`, `allyhub dev` and `allyhub render` find every module that default-exports `definePiece(...)`.

The `vite.config.ts` in the workspace root is read: its `plugins`, `resolve`, `css`, `define`, `json`, `assetsInclude` and `oxc` take effect, after AllyHub's plugins; AllyHub decides the other settings (output, server, env files, the `public` folder).

## `definePiece`

```ts
import { definePiece, footage, part, say, take, video } from "@allyhub/sdk";

import { endCard } from "../components/end-card.js"; // allyhub add endCard
import { titleCard } from "../components/title-card.js"; // allyhub add titleCard
import logo from "../media/logo.svg";

export default definePiece({
  id: "launch-film",
  formats: ["16x9", "9x16"],
  matrix: { dims: { lang: ["en", "zh-cn"] } },
  meta: { release: "2026-10-launch" },
  outputs: {
    film: video(({ s, combo }) => [
      part({
        key: "hook",
        // The stretch of this language's recording that says the line.
        speech: take(`./vo/${combo["lang"] ?? "en"}.mp3`).saying(s("launch-film.hook.vo")),
        layers: [
          titleCard({
            line1: s("launch-film.hook.line1"),
            line2: s("launch-film.hook.line2"),
            l2At: s("launch-film.hook.cue.l2"), // a word reference
          }),
        ],
      }),
      part({
        key: "demo",
        speech: take("./raw/host.mp4").range("Stop scrolling", "for free"),
        layers: [
          footage(), // the take's own picture, in sync with its speech
          footage("./broll/inbox.mp4", { at: "inbox", dur: 1.5, box: [0.55, 0.1, 0.4, 0.4] }),
        ],
      }),
      part({
        key: "cta",
        speech: say(s("launch-film.cta.vo"), { voice: "rachel" }),
        tail: 2,
        layers: [endCard({ lines: s.list("launch-film.cta.lines"), logo })],
      }),
    ]),
  },
});
```

| Field      | Required | Description                                                                                                                                              |
| ---------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`       | No       | A stable identity: lowercase letters, digits, `.`, `_`, `-`; `/` makes levels. When omitted, the file's path in the workspace (without the extension) is used |
| `title`    | No       | The name people see: one string, or one per language. When omitted, `<id>.title` from messages is used, then the file name                               |
| `formats`  | No       | What every output is rendered as, see below. Default: `defaults.formats` in `allyhub.config.ts`, then `["16x9"]`                                         |
| `matrix`   | No       | `{ dims, slots, structures, pick, seed, differ, rules }`: dimensions, crossed in full, and slots of candidates, sampled by rules; see below               |
| `meta`     | No       | Any key-value pairs, plain data. The platform only uses it to filter and group                                                                           |
| `outputs`  | Yes      | The outputs: the key is the output name (starts with a letter), the value is `video(...)` and so on                                                      |

**Requirements on how it is written** (when one is not met, the check reports an error and says how to fix it):

- The default export is `definePiece({ … })` directly, or `const piece = definePiece({ … }); export default piece` in the same file. AllyHub does not guess at factory functions or re-exports (AK-M001).
- `definePiece` is imported from `@allyhub/sdk`.
- **The module's top level must load in Node**: the build reads `id`, `formats`, `matrix`, `meta` and which outputs exist in Node, without drawing anything. Code that touches `window` or `document` goes inside an output's function or a component's `mount` (AK-R001 gives the fix). The top level cannot use the network (AK-B003) and cannot run forever (AK-B004).
- `id`, `title`, `formats`, `matrix` and `meta` cannot contain functions (AK-M001). Two pieces cannot have the same `id` (AK-B001).

### Formats `formats`

A format is what an output is rendered as: a preset `16x9`, `9x16`, `1x1`, `4x5` (AllyHub knows each preset's pixels and the areas platforms cover), a **platform profile**, or `WIDTHxHEIGHT` in pixels with even sides from 64 to 8192, such as `1280x720` (no covered areas). `a4` and `letter` are for paged outputs only. A wrong value reports AK-G001. A format is not a dimension: **every combo renders in each of its output's formats**. Lay out by `ctx.dims`, not by the format's name.

A platform profile is a frame with what the platform asks of it: the area its interface covers (from its own ad guidance), the longest video it takes, the loudness the sound is mastered to when the output does not set `master`, and its file (`ctx.dims.profile`):

| Profile     | Frame     | Covered edges (top, bottom, left, right) | Longest | mp4 encode (crf, most video bitrate) |
| ----------- | --------- | ---------------------------------------- | ------- | ------------------------------------ |
| `tiktok`    | 1080×1920 | 240, 660, 120, 180                       | 10 min  | 20, 6000 kbit/s                      |
| `reels`     | 1080×1920 | 269, 672, 65, 65                         | 3 min   | 20, 6000 kbit/s                      |
| `shorts`    | 1080×1920 | 288, 672, 48, 192                        | 3 min   | 20, 8000 kbit/s                      |
| `meta-feed` | 1080×1350 | 60, 120, 40, 40                          | 241 min | 20, 6000 kbit/s                      |
| `amazon`    | 1920×1080 | 60, 90, 80, 80                           | 45 s    | 20, 8000 kbit/s                      |
| `linkedin`  | 1080×1080 | 50, 90, 40, 40                           | 30 min  | 20, 6000 kbit/s                      |

The mp4 encode is AllyHub's choice for an upload, well under each platform's file limits: the platform encodes what it receives again, so more bits make a bigger file, not a better video. `allyhub render --crf` and `--max-bitrate` (0: no cap) change it.

A video longer than its profile takes reports AK-F001 (an output's own `maxDuration` at or under it reports AK-X006 instead); text in a profile's covered area is a `text-covered` fact (`allyhub inspect`), as for the presets.

An entry of `formats` (or a paged output's `format`) can change a format's numbers: `{ format: "tiktok", safe: { bottom: 520 }, maxDuration: 60, loudness: -16 }`. `safe` (`{ top?, bottom?, left?, right? }`, whole pixels, any format) changes `ctx.dims.safe` and the `text-covered` fact; `maxDuration` (seconds, the AK-F001 limit) and `loudness` (LUFS, the master's default) are for platform profiles. The name stays the format's own (combos, file names, `--format`), so a format is listed once. `defaults.formats` in `allyhub.config.ts` takes names only.

### The matrix `matrix`

`matrix.dims` are the dimensions and their values, crossed in full: a **combo** is one value per dimension. You decide the dimensions; the framework knows one:

| Dimension | How the framework uses it                                                                                                                                           |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lang`    | Selects `messages/<lang>.json`. The first one is the default language; missing keys fall back to it. When `lang` is omitted, it is every language under `messages/` |

For other dimensions (opening, audience, …) the code reads `ctx.combo` and decides how to use them. The same value cannot be written twice, and `size`, `format`, `piece`, `output` and `token` are not dimension names (AK-M001: the frame is `formats`, and the preview's address uses the others).

The **combo key** is the dimensions (and slots) sorted by name, each written as `name=value`, joined with commas: `lang=zh-cn,opening=b` (`default` when there are none). On the command line, `--combo lang=zh-cn` selects the combos with that value (repeatable; each one a filter), `--combo c03` the combo with that id, and `--format 9x16` the formats (repeatable, or joined with commas).

### Slots: mix-and-match batches

An ad is a structure of **slots** (hook → demo → call to action), each with **candidates**. The matrix chooses which combinations to make, rather than all of them:

```ts
matrix: {
  dims: { lang: ["en"] },
  slots: {
    hook: [{ name: "price", tags: ["price"] }, "reaction", "question"],
    demo: { pool: "./pool/demos" }, // one candidate per media file, named by its stem
    cta: ["trial", { name: "sale", tags: ["discount"] }],
  },
  structures: { classic: ["hook", "demo", "cta"], short: ["hook", "cta"] }, // optional
  pick: 6,
  seed: 1,
  differ: { slots: 2, first: ["hook"] }, // optional
  rules: [{ if: { hook: "#price" }, require: { cta: "#discount" } }],
},
```

| Field        | Description                                                                                                                                                                                                                                    |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `slots`      | Slot → its candidates: names, `{ name, tags }`, or `{ pool: "./folder", tags? }` (one candidate per video, audio or image file in the folder; a file's `<stem>.meta.json` may add `{ "tags": [...] }`)                                       |
| `structures` | Name → its slots in order. Without it, one structure of every slot in declared order. With it, `combo.structure` names the structure                                                                                                           |
| `pick`       | How many slot combinations to make; default every one the rules allow                                                                                                                                                                         |
| `seed`       | Decides between equally good choices; the same definition always chooses the same combos                                                                                                                                                       |
| `differ`     | `slots`: any two chosen combos differ in at least this many slots (a different structure counts as one); `first`: their openings differ (the first n slots, or these slots)                                                                   |
| `rules`      | `{ if?, require?, exclude? }` over slots, dimensions and `structure`; a value is a name, `#tag`, or a list of either. When every `if` holds, every `require` must hold and no `exclude` may. A slot missing from a combo's structure never matches |
| `combos`     | The combos to make, chosen by you: `[{ hook: "price", demo: "inbox", cta: "sale" }, { structure: "short", hook: "question", cta: "trial" }]`, one candidate per slot of the combo's structure (and `structure` when the piece declares structures). Each is checked against the slots (AK-X001), the `rules` (AK-X002) and `differ` (AK-X004; the same combo twice too). Nothing is sampled: `pick` and `seed` cannot go with it. Ids follow the order given |

You may pick the combos yourself with `combos`; without it, the matrix samples `pick` of them (a tool: it says why it chose each, and `allyhub mix --json` says `choice: "sampling"` or `"combos"`). The sampling covers every candidate at least once when it can, then spreads use evenly, prefers pairings not made yet and combos far from the ones chosen. Each chosen combination has an id, `c01`, `c02`… (`c01-zh-cn` when the dimensions have several values), crossed in full with the dimensions. `allyhub mix` prints the slots, the rules, the chosen combos with why each was chosen, and the render cost; `allyhub batch manifest` writes a CSV row per ad (id, key, structure, picks, length, file, `<piece>_<combo id>_<format>` name, AI flags).

The output's function reads `ctx.combo.<slot>` (the candidate's name) and returns that combo's parts; `ctx.pool("demo")` is the file a pool slot picked, for `footage()`. A part whose `key` is a slot's name fills that slot (or say `slot: "hook"`).

**Each part renders once.** A render keeps every part's encoded segment, named by what draws it, and reuses it in every combo that has the same part; the sound is mixed for each whole combo. So a part must draw only from its own props, time and words: a layer that reads another slot's pick from its `ctx.combo` is a must-fix (AK-X005); choose in the output's function and pass the result as a prop. Parts join with hard cuts. `custom()` layers are reused only within the same combo; components are reused across combos. The check loads only the combos that between them hold every candidate, and checks every combo as a whole from its parts: `video(…, { maxDuration })` (AK-X006), and measures as facts the speech's loudness either side of each join and the music's length against the combo's.

Rules of the matrix: AK-X001 a slot, structure, rule, pool or combo that names nothing, or a combo that lacks a slot of its structure; AK-X002 the rules leave no combination, or rule out a combo `combos` names; AK-X004 two chosen combos are the same, or more alike than `differ` allows.

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

`build` receives `ctx` and returns a list of **parts**, each made by `part()` (see Parts). Its `key` is unique within this output (AK-K001) and stable across combos and formats.

| Option   | Description                                                                                                                                                                                                |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `music`  | The music: audio (an import or a path), or `{ file?, from?, loop?, snap?, bpm? }`; `file` can be one per language (`{ en: a, "zh-cn": b }`, a language without one has no music). It plays once from `from` (seconds into the file, default 0); `loop: true` repeats it with a 0.25 s crossfade. `snap: true` ends parts without speech on its beat: `bpm` when given, else the tempo the build measured from the file (`allyhub timeline` prints it with its confidence); when no tempo is known nothing is snapped and a `fallback` fact says so |
| `mix`    | The mix's levels and ducking, see [Sound](#sound-music-effects-and-the-mix)                                                                                                                                 |
| `look`   | The look name, `clean` by default; when the workspace has no such look, `clean` is used                                                                                                                         |
| `defaults` | `{ part: { dur?, lead?, tail? } }`: this output's part defaults, over the project's (`defineConfig({ defaults: { part } })`) and the built-in 4, 0.2 and 0.3 s |
| `covers` | `(ctx) => part[]`: parts without speech drawn at their still for the cover, optional                                                                                                                  |
| `fps`         | Frames per second: a whole number from 1 to 120, or an NTSC rate (`23.976`, `29.97`, `47.952`, `59.94`, `119.88`, or written `"30000/1001"`…), which renders at the exact n × 1000/1001; default 30 |
| `transparent` | `true`: the stage has no background. `mov`, `webm` and `png` renders keep the alpha; `mp4` and `gif` show black where nothing is drawn |
| `master`      | What the sound is mastered to: a loudness in LUFS (−70 to 0), or `{ lufs?, truePeak?, lra? }`; default the platform profile's loudness, else −14 LUFS, a −3 dBTP true-peak ceiling and an 11 LU range target. `false` (or `lufs: false`) keeps the mix's level and only limits its peaks |
| `maxDuration` | The longest a combo may last, in seconds: a longer one is a must-fix (AK-X006) |
| `motionBlur`  | `{ samples, shutter? }`: each frame blends `samples` (2–16) moments of the graphic layers across `shutter` (0–1, default 0.5) of the frame's time. Footage is not blurred again: a video carries its own motion blur. Drawing the graphics takes `samples` times as long |
| `post`        | `{ filter?, lut? }`: an ffmpeg filter chain over the frames (`"eq=contrast=1.05,noise=alls=6:allf=t"`; one chain, no files, no changes to timing or frame size), then a `.cube` LUT relative to the piece |


Speech makes the video as long as it needs: music shorter than the video leaves the end without music unless it loops (the `music-length` fact gives both lengths); give each language music of its own length, or `loop` it.

### Sound: music, effects and the mix

Nothing makes a sound unless you put it there: each part's speech, the music, footage with `audio: true`, and the sound effects a part places.

**Sound effects** are placed per part: `part({ sounds: [{ at, sound, gainDb?, what? }] })`.

```ts
part({
  key: "how",
  speech: take("./vo/en.mp3").saying(s("film.how.vo")),
  sounds: [
    { at: "paste", sound: "tick", what: "step 1" }, // a word reference
    { at: 2.4, sound: "./sfx/ding.wav", gainDb: -3 }, // seconds, a file
    { at: "free-0.05", sound: chime }, // an import
  ],
  layers: [/* … */],
});
```

`at` is a word reference or seconds from the part's start; `sound` is a name of the look's sounds, one of the built-in synthesized `whoosh`, `tick` and `pop` (their transient lands on `at`), or an audio file, an import or a path relative to the piece (it starts at `at`). `look.sfx` in `allyhub.config.ts` names files as the look's sounds: `look: { sfx: { whoosh: "media/sfx/whoosh.wav", ding: "media/sfx/ding.mp3" } }` (paths from the workspace's root; a name there replaces the built-in one). A file is levelled by its loudness to the mix's sound-effect level, then by its `gainDb`. A name that is neither a sound nor a file is AK-A001; a file without sound AK-A003. `allyhub timeline` lists them; `allyhub audio` measures where they land against the onsets.

**The mix.** Each stem is levelled by its measured loudness to a target, and the music dips under speech. Levels follow the moment: while speech plays, music sits at `music` and footage at `footageUnderSpeech`; where nobody speaks they play at `musicAlone` and `footage`. Under the words, the music goes `duck.db` further down, over `attack` before a word and `release` after one, and stays down through pauses shorter than `hold`, so a narration has one steady bed. `video(…, { mix })` changes any of it:

```ts
video(build, {
  music: { file: "./music/bed.mp3", loop: true },
  mix: { music: -24, duck: { db: -6, hold: 1 }, musicFade: { out: 3 } },
  master: { lufs: -16, truePeak: -1.5 },
});
```

| `mix` field | Default | What it is |
| --- | --- | --- |
| `speech` | −16 LUFS | Each part's speech (a take's room tone with it) |
| `music` | −20 LUFS | The music while speech plays |
| `musicAlone` | −16 LUFS | The music where nobody speaks |
| `sfx` | −22 LUFS | Sound-effect files; the built-in sounds move by the same amount from −22 |
| `footage` | −16 LUFS | Footage's own sound (`audio: true`) where nobody speaks |
| `footageUnderSpeech` | −22 LUFS | Footage's own sound while speech plays |
| `duck` | `{ db: −8, attack: 0.3, release: 1, hold: 2 }` | How far (dB) and how fast (seconds) the music dips under words |
| `musicFade` | `{ in: 0.3, out: 1.5 }` | The music's fades at the start and end, seconds (the fade out at most a quarter of the video) |

## `paged(build, options?)`

A list of pages of one format, each one a still frame: a single image, a carousel, slides, a PDF document. `build` receives `ctx` and returns a list of **pages**, made with `part()` like the parts of a video (their speech is ignored); each `key` is unique within this output. Each page is drawn at its still time (default: 0.4 s before the end of its `dur`; `still: 0` is second 0).

```ts
paged(({ s }) => [
  part({ key: "cover", layers: [titleCard({ … })] }),
  part({ key: "how", dur: 5, layers: [bulletList({ … })] }),
], { format: "16x9", notes: true });
paged(({ s }) => [part({ key: "summary", still: 0, layers: [custom({ mount, render: () => {} })] })], {
  format: "a4",
});
```

| Option   | Description                                                                                                                                                                                                                                                                                                                                                               |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `format` | The pages' format, the same for every page: `16x9`, `9x16`, `1x1`, `4x5`, the document formats `a4` (1240×1754, 150 dpi) and `letter` (1275×1650), or `WIDTHxHEIGHT` in pixels (each side 64–8192, for example `1200x630`). When it is set, this output renders in that format only; when omitted, in each of the piece's formats, like a video. A wrong value reports AK-G001 |
| `notes`  | `true`: each page's speaker notes are `<prefix>.<page>.notes` in messages, and are written into the notes when exporting PPTX; a page without notes gets empty notes                                                                                                                                                                                                      |
| `look`   | The look name, `clean` by default                                                                                                                                                                                                                                                                                                                                         |
| `prefix` | The prefix of the speaker notes' keys, by default the piece's `id` with `/` replaced by `.`. A page is named in the preview by the first text on it                                                                                                                                                                                                                       |

- Pages have no sound: no speech, music or sound effects.
- Checks: each page's still gets the frame checks (overflow, occluded areas, missing glyphs) and the font check; the shuffled-order comparison (AK-D002) is not run. `a4`, `letter` and custom formats have no occluded areas.
- Export: `allyhub render --type png,pdf,pptx` (without `--type` it makes a PDF); see `allyhub help render`.

## Rendering

`allyhub render --type …` makes, for a video:

| Type    | What it is                                                                 |
| ------- | -------------------------------------------------------------------------- |
| `mp4`   | H.264 (default) or H.265 (`--codec h265`), AAC sound                       |
| `mov`   | ProRes: 4444 with alpha when `transparent`, else 422 HQ; 24-bit PCM sound  |
| `webm`  | VP9 (with alpha when `transparent`), Opus sound                            |
| `gif`   | No sound                                                                   |
| `png`   | A file per frame (`<output>.<combo key>.<format>.00001.png`…), and the sound as a WAV |
| `srt`, `vtt`, `cover` | Captions (when parts speak) and the cover image              |

- A render draws in two planes: ffmpeg draws the look's background and every footage layer straight from its file (placed, cropped, timed and sped as the layer says), and the browser draws only the graphic layers, over it. Each part is drawn and encoded on its own and the parts are joined; moments where no graphic layer shows, and parts without any, cost no browser time, so footage-heavy videos render fastest.
- `--crf <0–63>` sets the quality (lower is better; default 18 for H.264, 20 for H.265, 30 for VP9; 20 in a platform profile's format), `--max-bitrate <kbit/s>` caps an mp4's video bitrate (a platform profile's format has its own cap, see Formats; 0 for none), `--chroma 444` keeps sharp colored edges, `--bits 10` keeps smooth gradients; `--audio-bitrate <kbit/s>` sets the sound's bitrate (AAC in mp4, default 192; Opus in webm, default 160; mov keeps PCM); `--workers <n>` sets how many pages draw the graphic layers at once.
- `--gpu` (or `ALLYHUB_GPU=1`) draws on the GPU: WebGL, Three.js and shaders run on the graphics card instead of in software. `allyhub check --gpu` checks the same way; a frame must still be the same at the same moment (AK-D002).
- `allyhub still`, `allyhub sheet`, `allyhub frames` and **Final look** in `allyhub dev` (while paused) draw a moment the way the render does: footage and graphics together, with motion blur, `post` and transparency (`--raw` leaves out motion blur, `post` and the LUT). The check looks at the graphic layers as the page draws them, over the background.
- `allyhub frames --at s,s --overlay` (with `--from-render` too) draws the measurements over each frame: every face box of the footage showing, with its id (solid: the face the layer follows), the person matte's outline, the format's covered areas and the text boxes of the layers at that moment, labelled with their layer, and a legend under the grid; what the media index lacks is named instead of drawn. `--json` has every box per tile (`overlay`). A view: it places nothing.
- Captions (`srt`, `vtt`) come from each voiced part's words: the text is the line it says (`saying`, `say`) when it has one, else the take's own words. A cue is one line of at most 42 characters (`--caption-max-chars`; 16 in Chinese, Japanese and Korean, `--caption-max-chars-cjk`), lasting 0.8 to 6 s (`--caption-min`, `--caption-max`) and ending 2 frames before the next (`--caption-gap-frames`).
- Files go to `.allyhub/renders/<piece>/<output>.<combo key>.<format>.<ext>` (`<output>.<combo id>.<format>.<ext>` when the piece has slots, `<output>.<format>.<ext>` when it has no dimensions).
- Rendered parts are kept in `.allyhub/cache/parts/` (the least recently used go past 4 GB, `ALLYHUB_PART_CACHE_MB`): a part that did not change, in this combo or another, is not drawn or encoded again.
- `allyhub doctor` lists the file types this computer's ffmpeg can make.

## Formats, languages and fonts

| Format | Pixels    | Covered areas                       |
| ------ | --------- | ----------------------------------- |
| `16x9` | 1920×1080 | yes (the default format)            |
| `9x16` | 1080×1920 | yes: feed buttons and captions      |
| `1x1`  | 1080×1080 | yes                                 |
| `4x5`  | 1080×1350 | yes                                 |
| `WxH`  | any       | none; even sides from 64 to 8192    |

- Text in a preset's covered areas is measured as a `text-covered` fact. Lay out by `ctx.dims` (width, height, `orient`, `safe`), never by the format's name, so custom formats work too. `ctx.dims.safe` is `{ top, bottom, left, right }` in pixels (all 0 for custom formats); `layout(ctx)` turns it into a content box.
- Languages are the files in `messages/`; the first (or `defaults.languages`) is the default, and a missing key falls back to it with a warning (AK-S002).

### Fonts

The stage renders offline, so it draws only fonts that are files: its own and the workspace's.

| Family (CSS name)  | Covers                     | Weights and styles               |
| ------------------ | -------------------------- | -------------------------------- |
| `"Inter Variable"` | Latin, Greek, Cyrillic     | 100–900 (variable), upright only |
| `"Noto Sans SC"`   | Chinese                    | 400 and 700                      |
| `"Noto Color Emoji"` | Colour emoji (the look's `font.emoji`) | 400                   |

- The look's `display` and `body` fonts are both `"Inter Variable", "Noto Sans SC", sans-serif`.
- Emoji a component draws on purpose (`captionWord`'s `emoji`, `emojiEl`) use `var(--ak-font-emoji)`, Noto Color Emoji: the same picture on every computer. Emoji inside other text fall to the computer's own emoji font, which differs between computers (and a Linux machine may have none): put them in an element with `fontFamily: "var(--ak-font-emoji)"` at weight 400. Its `mono` is the computer's own monospace font (`ui-monospace, "SF Mono", Menlo, monospace`): it differs between computers, so bring a mono font when the piece shows code or terminal text.
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
| `ctx.combo`                 | The current combo: one value per dimension, and per slot of its structure, for example `{ lang: "en", hook: "price" }` |
| `ctx.pool(slot)`            | The file a pool slot picked in this combo, as a path `footage()` and `ctx.asset()` take                     |
| `ctx.s(key, hint?)`         | One string in the current language                                                                          |
| `ctx.s.list(prefix, hint?)` | Numbered keys: `prefix.0`, `prefix.1`, … in order; deeper keys form objects, for example `plans.0.name`     |
| `ctx.s.with(key, inputs)`   | A string with its `{name}` variables filled in; plurals and selects pick the sentence that matches `inputs` |
| `ctx.asset(path)`           | Media at a dynamic path, relative to this file (use import for fixed media)                                 |
| `ctx.data(path)`            | A data file (CSV, YAML, JSON) at a dynamic path, relative to this file (use import for fixed data)          |
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

- **Keys are prefixed by piece**: `<piece id>.<part>.<name>` (the preview groups the text by the part its key names). The piece's title is `<id>.title`. What a part says is text like any other: name its key as you like (`launch-film.hook.vo`) and give it to `say(s(…))` or `take(…).saying(s(…))`.
- **Lists use numbered keys**. `s.list("launch-film.how.items")` returns them in order and stops at the first missing number.
- When the displayed and spoken text differ, write `{ "display", "speak" }`: `s()` returns `display`; speech uses `speak` (the text `say` reads aloud, the line `saying` looks for, the word references found in it), and captions show `display`.
- `{name}` is a variable; fill it with `s.with(key, { name: … })`.
- **Plurals and selects** follow inlang's syntax: an array with exactly one item, where `declarations` declares the inputs (`input count`) and the plurals (`local n = count: plural`; ordinals add `type=ordinal`), `selectors` says what to pick by, and the keys of `match` are `selector=value`, with several selectors separated by commas and `*` matching any value. `s.with("pricing.count", { count: 3 })` picks by the current language's `Intl.PluralRules`: an exact number (`n=0`) comes before a category (`one`, `few`, `other`), and a category comes before `*`. With no input, the `other` sentence is used. Other functions (`number`, `datetime`) are not supported yet; the check reports AK-M006.
- **Keys are typed.** `allyhub check` and `allyhub dev` generate `.allyhub/types/messages.d.ts` from the default language's file: the keys of `s()` and `s.list()` autocomplete, and a wrong key is a `tsc` error; the inputs of `s.with()` are typed by the variables and plurals, and each item of `s.list()` is typed by the structure of the keys. With a `tsconfig.json` (optional), add `".allyhub/types"` to its `include` (`**/*.ts` does not enter folders that start with a dot), and do not put `.allyhub` in `exclude`. `tsc` cannot check a key built from data; write it as ``s(`x.label.${key}` as MessageKey)``, and the check still reports a key that does not exist (AK-S001).
- When the current language does not have the key, the default language's value is returned and a "missing translation" is recorded (AK-S002); when the default language does not have it either, an empty string is returned and an error is recorded (AK-S001).
- `hint` is `{ max?, note? }`: it does not affect the return value and is not checked; it is a length hint for the people and agents who write the strings.
- Text lives with the piece: the text of videos and slides goes in messages, so it can be translated and edited in the "All text" table of `allyhub dev` (what a part says included: the table edits the message its speech came from). The check does not report text written in code; it just cannot be edited there, and an agent has to change it. To split a sentence into words or characters for animation, use `splitText(text, "words" | "chars" | separator)`.

## Import media and data

```ts
import plans from "./data/plans.csv"; // → [{ name: "Team", price: 12 }, …]
import take from "./vo/en.mp3"; // → { path, sha256, kind: "audio", duration, words, url }
import shot from "./media/signup.png"; // → { path, sha256, kind: "image", width, height, elements?, url }
import demo from "./media/demo.mp4"; // → { path, sha256, kind: "video", width, height, duration, audio, words?, url }
```

- Paths are relative to the importing file and cannot leave the workspace.
- Images, audio, video and fonts become a media value: `path` (the path in the workspace), `sha256`, `kind` (`image`, `audio`, `video`, `font`), `width`, `height` (images and video), `duration` (audio and video), `audio` (video: whether it has sound), `url`. `url` is valid only at runtime; do not concatenate or rewrite it.
- When an audio or video file has a `.words.json` of the same name next to it (`[{ "w", "start", "end" }]`, seconds; `allyhub transcribe <file>` writes it for a recording, on this computer, with each word's `confidence`, 0 to 1: the lowest probability Parakeet gave any of its letter tokens), the value carries `words`: that makes it a take. A take also carries what the build measured of its sound (kept in the media index): `speechDb`, the median level of its words in dBFS, and `sounds`, the stretches heard between words (`{ start, end, peak, mean, voiced, after }`: seconds of the file, peak and mean level in dB against the speech, the share of voiced frames from 0 to 1, the index of the word before). When an image has an `.elements.json` of the same name next to it (element name → `[x, y, w, h]`), the value carries `elements`: a web page screenshot, used by `siteStep`.
- CSV becomes an array of objects, with the header row as keys; a column that is all numbers becomes numbers. YAML becomes JSON; JSON imports as usual.
- For a dynamic path (a different image per combo) use `ctx.asset("./media/" + name + ".png")`; when it is not found, AK-A001 is recorded.
- For data at a dynamic path use `ctx.data("./data/" + region + ".csv")`: it returns the parsed content (`unknown`; add the type yourself), is recorded as a read, and goes into the digest. When it is not found, AK-A001 is recorded; when it cannot be parsed, AK-R001. `package.json`, `tsconfig*.json`, lock files, `messages/`, `*.words.json`, `*.elements.json` and folders that start with a dot do not count as data.
- Types: when the workspace has a `tsconfig.json` (only for an editor's type checking; AllyHub does not need it), add `"@allyhub/sdk/client"` to `compilerOptions.types`.

## Parts `part`

```ts
part({
  key: "hook",
  speech: take("./vo/en.mp3").saying(s("launch-film.hook.vo")),
  lead: 0.2,
  tail: 0.3,
  layers: [footage("./media/office.mp4"), titleCard({ at: "forms", line1: s("launch-film.hook.line1") })],
});
part({ key: "pricing", dur: 3, layers: [priceCard({ … })] });
```

| Option   | Description                                                                                                                                                 |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `key`    | Required, unique within the output                                                                                                                          |
| `speech` | What the part says: `take(file)` or `say(text)`. Without it the part is silent                                                                              |
| `dur`    | Seconds, for a part without speech; default 4 (or `defaults.part`). Ignored when the part has speech                                                       |
| `lead`   | Seconds before the first word; default 0.2 (or `defaults.part`)                                                                                            |
| `tail`   | Seconds after the last word; default 0.3 (or `defaults.part`; give the last part more, so its picture stays after the last word)                          |
| `sounds` | Sound effects: `[{ at, sound, gainDb?, what? }]`, see [Sound](#sound-music-effects-and-the-mix)                                                            |
| `layers` | What it shows, back to front: `footage()`, components, `custom()`                                                                                          |
| `still`  | The still moment (cover, sheet, a page): a word reference, seconds from the part's start, or `(dur) => seconds`; default 0.4 s before the part ends          |
| `slot`   | The slot this part fills (default: its key, when that is a slot's name)                                                                                     |
| `tags`   | Labels, plain strings                                                                                                                                       |
| `overlap` | `{ before?, after? }`, seconds: J and L cuts. `before` seconds of the part's speech play under the previous part's picture, `after` seconds under the next one's; the part's picture is that much shorter at that end (at most its lead or tail and half its speech). `ctx.captions()` gives the words heard under a neighbour's picture there, so a part shared by several combos (slots) is drawn once per neighbour |

A part is named in the preview's timeline by the first text it shows at its still.

## Speech `take` and `say`

Every part's speech has words: that is what times the part, places its layers, ducks the music and makes the captions.

- **`take(file)`**: a recording, audio or video (an import, or a path relative to the piece), with its words in the `.words.json` beside it. Without words the check reports AK-T001: run `allyhub transcribe <file>`. On its own it is the whole take, from its first word to its last. Narrow it with:
  - **`.range(from, to?)`**: from the first words `from` to the end of the first `to` after them (phrases of several words; case and punctuation ignored); without `to`, to the end. A phrase the take does not say reports AK-T003 with the nearest matches.
  - **`.saying(text)`**: the stretch that says this line, usually `s(key)`: it is found by its words, tolerating what recognition got wrong (the line wins: its spelling is the caption, and word references are found in it). When several parts take the same file, each searches after the previous part's stretch, so one recorded narration serves several parts, each with its own line in messages; a line not said after it (parts in another order than the take) is searched for in the whole take. A line it cannot find reports AK-T003. How much of the line was found is data: `allyhub timeline` prints it when it is under 100 %, and `--json` has every part's `speech.match` (`score`, the share of the line's letters found, 0 to 1; `from`, the word the search started at).
  - On a take with `.edits()`, both look only at the words the edits keep, as the cut plays: a phrase or line said only in removed words (a retake you cut), or a line that says words the edits remove inside it, reports AK-T006 with the removed words. `allyhub timeline` prints under each part what it says (the line) and what it plays (`heard:`, the take's kept words, with their indices).
  - **`.edits(path)`**: a cut list, a JSON file relative to the piece (`./edits/host.json`) that may not exist yet: you write it (plan it with `allyhub transcript` and check it with `allyhub edits`, see below), and the preview's **Transcript** sheet writes it as the person strikes words and sounds. The take's words move onto the edited clock (word references, captions and timing follow it), and its footage and sound follow the same kept stretches:
    ```json
    {
      "remove": [{ "from": 167, "to": 189, "text": "Now second, figure out…" }],
      "sounds": [{ "from": 61.17, "to": 61.4 }],
      "maxPause": 0.35,
      "pad": { "before": 0.12, "after": 0.08 }
    }
    ```
    It removes exactly what it lists, nothing else: which words are fillers, retakes or false starts is yours to decide. `remove` lists word indices into the take's words file (inclusive) with their text: when the words file is made again, a range is found again by its text; one the take no longer says reports AK-T005. `sounds` lists stretches of the file (seconds) heard between words where no word was recognised (an "um" the recognizer left out, a hum before a restart): `allyhub transcript` shows them; a stretch is cut only between two kept words, and never into a word. `maxPause` shortens every pause between kept words longer than it, in seconds. `pad` is how much silence a cut keeps beside the words: `before` the cut, after the last kept word (default 0.12 s), and `after` it, before the next kept word (default 0.08 s), each 0 to 2 s; never past half the silence, so never into a neighbouring word (`maxPause` caps it at half the pause). The rest is mechanics: the cut lands at the quietest 10 ms within 40 ms, on the film's frame grid, with 10 ms fades. `allyhub edits` prints the padding it used.
  - **`.roomTone(false | { from, to })`**: a part's lead and tail play the take's own room (its silence around the words), and where that runs out its room tone: by default the quietest steady stretch the build measured; `{ from, to }` (seconds of the file) loops the stretch you pick, `false` leaves digital silence.
  - **`.denoise(db?)`**: reduces the noise in its sound by `db` (default 12) with ffmpeg's FFT denoiser, in the render and in the preview (which makes the denoised sound once, into `.allyhub/cache/denoise/`, and plays the take as recorded until it is made).
- **`say(text, { voice?, tool?, params? })`**: text to speech. `allyhub voice generate` makes the file, `media/gen/say/<hash>.<ext>` with its words; the hash covers the text read aloud, the voice, the tool and the params, so a changed line needs a new file. `params` is extra input for the voice tool (plain JSON; see `allyhub tools describe <tool>` for what it takes; not `text` or `voiceId`): it is sent with the text and voice, and the server checks it against the tool's schema. A `say` without its file reports AK-T002; until then the part lasts about as long as the line would take. The tool defaults to `tts-elevenlabs-multilingual-v2`; `allyhub voice generate --quote` prices the missing files first (it is billed by character, so tell the person the price before you run it).

## Word references

A word reference names a moment in a part by what is said there. Write it as a layer's `at` and `until`, a part's `still`, and any component prop declared `time()`; the component receives seconds from the part's start.

| Form              | Meaning                                                              |
| ----------------- | -------------------------------------------------------------------- |
| `"只问"`          | The start of the first time "只问" is said in this part              |
| `"deposit@2"`     | The second time in this part                                         |
| `"deposit-0.35"`  | 0.35 s earlier                                                       |
| `"deposit@2+0.1"` | The second time, 0.1 s later                                         |
| `1.8` (a number)  | Seconds from the part's start                                        |

Matching ignores case and punctuation; a reference can be a phrase of several words; Chinese and Japanese match character by character, consecutively. References resolve against the part's own words, after timing; with `say` or `saying` they are found in the line first, so a misheard word still lands where it is said. A reference the part does not say, or one in a part without speech, reports AK-T004. Words that differ by language belong in messages (`<prefix>.<part>.cue.<name>`), one per language: `l2At: s("launch-film.hook.cue.l2")`.

## Durations

- A part with speech lasts `lead` + its speech (first word to last word, after edits) + `tail`, less its `overlap`; its speech starts `lead` after the part (earlier in a J cut).
- A part without speech lasts its `dur`; with `music.snap`, it ends on the music's beat (`60 / bpm`, from the file's first beat, shifted by `music.from`).
- Parts follow each other on the frame grid. Durations are computed at build and at playback and are never written back to the source files: replace a take (or its words) and the parts and the moments inside them are laid out again.

## Layers

A part's layers are drawn back to front, each over the whole frame unless it says otherwise: footage layers in their order, then graphic layers in theirs, always over all footage (a graphic layer listed before a footage layer still draws over it). Every layer takes `at` and `until` (word references or seconds from the part's start) or `dur` (seconds from `at`); by default it lasts the whole part.

### Footage `footage`

```ts
footage(); // the part's take (a video), in sync with its speech
footage("./broll/inbox.mp4", { at: "inbox", dur: 1.5 });
footage(demo, { from: 3, box: [0.5, 0.1, 0.45, 0.8], fit: "contain", audio: true, gainDb: -6 });
footage(screen, { crop: [0, 0, 0.5, 1], speed: 2 }); // the left half of the picture, twice as fast
```

| Option   | Description                                                                                                       |
| -------- | ----------------------------------------------------------------------------------------------------------------- |
| `from`   | Seconds into the file at the layer's start; default 0. The take's own footage follows its speech instead          |
| `speed`  | Playback speed, over 0 and up to 16: `2` plays twice as fast, `0.5` half as fast; default 1. Its sound (with `audio`) follows, pitch too. The take's own footage always plays at 1, in sync with its speech |
| `box`    | `"full"` (default), or `[x, y, width, height]` as fractions of the frame, inside it (x + width and y + height at most 1) |
| `crop`   | `[x, y, width, height]` as fractions of the source picture: only that part is shown, fitted to the box            |
| `fit`    | `cover` fills the box and crops (default); `contain` shows all of it                                              |
| `audio`  | Mix the file's own sound in (when it has any); default `false`. The take's own footage sounds as the part's speech |
| `gainDb` | The sound's gain in dB; default 0                                                                                 |
| `box` keyframes | `[{ t, box, ease? }]`: `t` a word reference or seconds, `box` a rectangle or `"full"`, `ease` `linear` (default), `in`, `out`, `in-out` into that key. The first key places the picture; it moves and scales with the box (keep the boxes' shape). Every key lies inside the frame (`footage()` throws for one that reaches past it: a box is where the picture shows, so a push-in is a `punchIn` or `pullback`, not a box larger than the frame). Not with `reframe` or `punchIn` |
| `reframe` | `"face"`, `{ face: true, faceY? }`, `"center"` or `{ x, y }` (fractions of the source): crops the source to the box's shape around the speaker's face (a smoothed path from the face track; the face's centre sits at `faceY` of the crop's height, default 0.4), its centre or that point, so a 16:9 take fills a 9:16 frame. A face reframe needs the face track (see the media index below); until it is made, or where no face is seen, it is centred on `{ x: 0.5, y: 0.4 }` |
| `speaker` | The face the layer follows: an id of the face track (`ctx.faces(t)` and `allyhub index` list them); default the track's default speaker (the largest face, kept through a bigger face passing by). It drives a face reframe, the punch-in and pullback centres and `ctx.face` for the layer; an id the track lacks is a `fallback` fact (centred) |
| `punchIn` | Words to zoom in on: `["insane", "free@1.15"]` (a decimal after `@` is the scale, default 1.12; `"free@2"` is still the second "free") or `{ at, until?, scale?, in?, out?, ease?, center? }`. Eased in over `in` seconds (0.2; up to 30) centred on the word's start, held for the word (or until `until`), eased out over `out` (0.25; up to 30), with `ease` (`"in-out"`): a slow push is `{ at: 4, in: 8, until: 8, scale: 1.07, ease: "linear" }`; about `center` (`{ x, y }`, fractions of the box), by default the speaker's face, else `{ x: 0.5, y: 0.42 }` |
| `sharpen` | 0–1: sharpens the picture after it is scaled (0.3 is gentle), for footage drawn larger than its pixels (`allyhub inspect` gives the scale). Renders, stills and the preview's Final look only: the live preview plays it unsharpened |
| `pullback` | `true` or `{ scale?, dur?, ease?, center? }`: the layer opens zoomed in (1.12× by default, up to 3) and eases back (`ease`, default `"out"`) to the whole picture over `dur` seconds (0.6); about `center`, by default the speaker's face. On each part's take, one locked-off camera feels cut between shots. A punch-in that starts sooner cuts it short. Not with box keyframes |
| `shape`  | `"rect"` (default) or `"circle"`: the picture shows only in the ellipse inscribed in the box (a circle when the box is square in pixels; keyframed boxes move it), the rest of the box shows what is under it. Graphic layers draw over all footage, so leave the circle's area free of them: `footage({ box: [0.58, 0.68, 0.36, 0.2025], shape: "circle", reframe: "face" })` at 9:16 |

The preview plays footage in step with the rest, placed by the same numbers the render uses; the render draws the exact frame of the video for every frame, straight from the file with ffmpeg (nothing is extracted or cached). When the layer is longer than the video, the last frame holds; before a take's file starts (speech in the lead), its first frame holds. Videos with alpha (ProRes 4444, VP9 with alpha) show what is under their transparent pixels. A file that is not a video reports AK-A003; `footage()` in a part without a take of a video reports AK-A001 or AK-A003.

### Graphics: components and `custom`

A component makes a graphic layer from its props and the layer options: `titleCard({ at: "only", line1: s("…") })`. `z: "behind-person"` draws it behind the speaker: over the footage, under the part's own take cut out with its person matte (see the media index below). The preview, `allyhub still` and the render draw it so; until the take has a matte they draw it over the speaker, and the preview says so.

```ts
custom({
  at: "growth",
  mount(el, ctx) {
    /* build the DOM once; ctx has look, format, dims, content, combo, dur, layer, words, at, asset */
  },
  render(el, t, ctx) {
    /* t is the seconds within the part; change the frame by t only */
  },
});
```

`mount` and `render` get the same `ctx` as a component's:

| Name               | Description                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| `ctx.look`         | The style tokens (also CSS variables `--ak-color-*`, `--ak-font-*`)                               |
| `ctx.format`       | The format being drawn: `"16x9"`, `"1280x720"`; a paged output's may be `"a4"`                    |
| `ctx.dims`         | `{ width, height, orient, safe }`: pixels, `"landscape"`/`"portrait"`/`"square"`, the covered edges `{ top, bottom, left, right }` in pixels |
| `ctx.combo`        | The combo: the dimensions and this part's own slot; reading another slot's pick is AK-X005         |
| `ctx.dur`          | The part's length in seconds, once timed                                                          |
| `ctx.layer`        | `{ start, end }`: this layer's window, seconds from the part's start                              |
| `ctx.words()`      | The part's words on its own clock (`[{ w, start, end }]`), for captions and karaoke-style layers  |
| `ctx.at(ref)`      | Seconds from the part's start of a word reference                                                 |
| `ctx.captions(opts?)` | The caption cues shown over this part, on its clock: `[{ start, end, text, words: [{ w, start, end }] }]`, spelled as the script; `opts` `{ maxChars?, maxWords?, keep? }` cut them (see Captions) |
| `ctx.face(t, id?)` | Where a face is at part time `t`, `[x, y, w, h]` in the frame's pixels, from the face track of the topmost footage showing then that has one: face `id`, by default that footage's speaker; `undefined` when none shows |
| `ctx.faces(t)`     | Every face at part time `t`: `[{ id, box }]`, from the same footage; empty without one |
| `ctx.texts(t)`     | The text of the part's layers listed before this one at part time `t`: `[{ layer, text, box: [x, y, w, h] }]`, a box per line or paragraph as the layer draws it then. It draws those layers to measure them: call it in `mount`, and list a layer after the ones it should see |
| `ctx.covered`      | The format's covered areas as strips of the frame, `[x, y, w, h]` each (none for a custom format) |
| `ctx.content`      | The content box, `[x, y, w, h]` in the frame's pixels: clear of the covered areas with a gap, at least a margin from every side; the box `layout(ctx)` gives as `left`, `top`, `right`, `bottom` (see The content box). TikTok: `[180, 270, 720, 970]` |
| `ctx.asset(path)`  | Media at a path relative to the piece                                                             |

`render(t)` receives the part's time, and the layer is only drawn between its `at` and `until`: an entrance written for a layer that starts later counts from `ctx.layer.start` (`const lt = t - ctx.layer.start`). Cue times are seconds from the part's start.

The DOM helpers work in `custom()` as in a component. Build in `mount`, keep the elements, and set every moving property in `render`:

```ts
import { custom, ease, part, tween } from "@allyhub/sdk";
import { h, layout, one, tag } from "@allyhub/sdk/dom";

part({
  key: "year",
  dur: 3,
  still: 2.5,
  layers: [
    custom({
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
    }),
  ],
});
```

(`s` is the build function's `ctx.s`, read when the parts are made.)

### The media index

A face track and a person matte are what AllyHub learns from a video once, on this computer, and keeps in the project's media index (`.allyhub/cache/index/<sha256 of the file>/`). An output reads the face track of a take under a face reframe, under its own graphics (the `text-speaker` fact) and for `ctx.face(t)` and `ctx.faces(t)`; it reads the person matte for layers drawn `z: "behind-person"`. When one is missing, `allyhub check`, `allyhub render` and `allyhub dev` make it before going on (no cost; the first time downloads the runtime and models, about 290 MB, into `~/.allyhub/`), with progress on stderr or on the preview page, which reloads when it is done. `--no-index` (or `ALLYHUB_NO_INDEX=1`) skips that: the reframe is centred and layers behind the person draw in front, reported as a `fallback` fact. `allyhub index <video> [--faces] [--matte]` makes them by hand.

`allyhub index`, `transcribe`, `transcript` and `edits` keep what they measure of a file in the media index of the workspace it belongs to: the nearest folder above the file with `allyhub.config.ts`, `messages/`, `app/videos/` or `app/decks/`; else the current folder's; else, by a `.allyhub/` folder alone, the current folder's, then the file's; else the current folder. They print which (`workspace` in `--json`), warn on stderr when it is not the current folder's workspace or none was found, and `--dir <workspace>` names it.

## Captions

Burned-in captions are a graphic layer you put in each part you want captioned, last in its layers: a starter style (`allyhub add captionWord`, `captionLine`, `captionSubtitle`), your own component, or `custom()`. In any layer, `ctx.captions({ maxChars?, maxWords?, keep? })` gives the cues heard over the part: from each part's speech (a cut take's words left, the script's spelling when there is one), broken at sentence and clause ends, then by length and word count, never inside a phrase listed in `keep` (`keep: ["work harder"]`, matched as said; the cue around it may run over `maxChars` or `maxWords`, and a kept phrase starts a cue of its own when the one before has no room for it), never across two parts, following each other without a gap; in a J or L cut the words heard under a neighbour's picture are there too. Nothing places, stresses or decorates them for you:

- **Where they go** is the layer's own code. To measure a place, call in `mount` `captionTop(ctx, L, cue, w, h, opts?)` (a spot in `prefer` order, clear of other layers' text and the faces over the cue) or `freeAreas(ctx, t, opts?)` (the empty bands of the frame at `t`), or read `ctx.face`, `ctx.faces`, `ctx.texts` and `ctx.covered` yourself. Behind the speaker is `z: "behind-person"`.
- **Which words to stress and which emoji to add** are the words you pass. In plain code, as the starter styles show:

```ts
const stressed = emphasized(cue.words, ["free", "two minutes"]); // per word, true/false
const emoji = wordEmoji(cue.words, { free: "🎁" }); // per word, "" or an emoji
cue.words.forEach((w, i) => {
  line.append(h("span", { color: stressed[i] ? "var(--ak-color-accent)" : "inherit" }, [w.w]));
  if (emoji[i]) line.append(emojiEl(emoji[i], { marginLeft: "0.15em" }));
});
```

Text over the speaker's face box or person matte is a `text-speaker` fact. `srt` and `vtt` exports and the player's CC read the same words (their cue lengths are render options, see Rendering).

## Checks and facts: `allyhub check`, `allyhub inspect`

`allyhub check` reports problems only for what is wrong whatever the taste (a missing file, a duplicate key, an exception, an invalid format, non-determinism, a hard platform limit, a declared limit such as `maxDuration` or `differ`); must-fix problems stop a render. What needs judging it measures instead: **facts**, which never block anything. `check` prints how many there are; `check --json` has them as `facts`.

`allyhub inspect [folder] [--piece --output --combo --format] [--kind k,k] [--part key] [--from s] [--to s]` prints the facts (it runs the check, which reloads only what changed): each finding once per version with its time range and its largest value; `--json` gives every fact as `{ kind, piece, output, combo, format, part, t, data }` (film seconds; boxes `[x, y, w, h]` in the frame's pixels; shares 0–1). `--at s,s` measures one output now at those moments (from `--part`'s start when given; the first combo and format unless chosen), and `--texts` also lists every block of text at every moment. Text is measured at each part's still, the middle of every layer and caption cue, and every second where footage with a face track or matte shows (at most 24 moments a part). The kinds:

| Kind | `data` |
| --- | --- |
| `text-speaker` | `text` (layer, `z`, text, box); `face`: `box`, `area`, `ofText`, `ofFace`; `person`: `ofText` (share of the text's box over the person matte), `file` |
| `text-covered` | `text`; `frame`; `covered` (the format's covered edges); `profile`; `edges`: `{ side, px }` pixels in from each covered edge's line. A page viewport's own text is left out |
| `text-overlap` | `a`, `b` (blocks of two layers); `area`; `share` of the smaller box |
| `footage-scale` | `file`, `source`, `shown` (crop or reframe window), `max` and `min`: `{ scale, t, from }`, output pixels per source pixel at its largest and smallest over the layer's window (`2` draws each source pixel 2 × 2), the first moment of each, and what makes it up then (the fit, `zoom` for a punch-in or pullback, `box key`); measured at the window's first and last frames and at every zoom and box key. The fact's `t` is the largest's |
| `free-bands` | One per part whose footage has a face track or person matte. `frame`; `covered` (the format's covered edges); `content`: `{ x: [x0, x1], y: [y0, y1] }`, the frame inside them (no margin, unlike `ctx.content`); `profile`; `moments` (the part's measured moments); `face` (the speaker's face box: `files`, `speaker`, `seen` (moments it was seen in the content box's columns), `rows` (`[y0, y1]` it covered at any moment, joined), `bands`) and `person` (the person matte, opaque past half: the same, without `speaker`), each `{ missing: "face-track" \| "person-matte", files }` when the media index lacks it; `bands`: free of everything measured. A band is `{ y: [y0, y1], x: [x0, x1], height }` in pixels, across the content box; every band is listed, none too small. Raw rows, no placement: where text goes is yours |
| `flat-frames` | `start`, `end`, `frames` (runs of nearly flat frames near cuts and cues, in a colour unlike the picture around them), `luma`, `shade`, `longer`, `options`: the thresholds used (`maxStd` 3, the luma spread of a flat frame out of 255; `minFrames` 4; `sameLuma` 10, how close to the picture around it a run may be and still count as that picture's background); looked for on each output's first version |
| `music-length` | `file`, `music` (seconds the video can play: the file from `from` on), `from`, `loop`, `video`, `without` (seconds at the end without music; 0 when it loops), `estimated` |
| `join-loudness` | `before`, `after` (part keys), `beforeLufs`, `afterLufs` (levelled as the mix levels them), `difference` in LU; pieces with slots. Not measured: `missing` (`ffmpeg`, `file`, `silent`, `failed`) and `why` in place of the numbers |
| `matrix-coverage` | `choice` (`sampling` or `combos`), `pick`, `possible` (absent when not counted), `chosen`, `candidates`: `{ slot, candidate, combos }` (ids of the chosen combos using it); one per piece with slots |
| `fallback` | `file`, `missing` (`face-track`; `face`, with its id in `face`; `person-matte`; `own-footage`; `tempo`), `for` (`reframe`, `speaker`, `behind-person`, `snap`), `fallback` (`centred`, `in-front`, `not-snapped`) |

The preview page's Measurements button draws the text facts over the picture at the moment on show.

## Components `defineComponent`

```ts
import { defineComponent, text, time, tween, type Time } from "@allyhub/sdk";

export const statBadge = defineComponent<{
  value: string;
  label: string;
  /** When the badge settles: a word reference or seconds, given; seconds, received. */
  settleAt?: Time;
}>({
  name: "stat-badge",
  label: { en: "Stat badge", "zh-cn": "数字徽章" },
  summary: { en: "One number in a badge, with a line under it." },
  props: {
    value: text({ max: 6 }),
    label: text({ max: { "16x9": 40, "9x16": 24 } }),
    settleAt: time({ optional: true }),
  },
  examples: { pilots: { value: "3", label: "pilot teams live" } },
  mount(el, p, ctx) {
    /* layout: you can measure text */
  },
  render(el, t, p, ctx) {
    /* set every animated property each time, decided by t only */
    const settle = (p.settleAt ?? ctx.layer.start + 0.6) - ctx.layer.start;
    const lt = t - ctx.layer.start;
  },
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
| `defaults` | Default prop values                                                                       |

A component's function takes its props and the layer options in one object, so `at`, `until`, `dur` and `z` cannot be prop names (`LAYER_OPTIONS`; `defineComponent` reports an error as soon as it finds one). Its length and still belong to the part.

**Semantic prop types** (exported by `@allyhub/sdk`; all plain data):

| Function                             | What it is                                          | Constraints                                         |
| ------------------------------------ | --------------------------------------------------- | --------------------------------------------------- |
| `text(o?)`                           | Text on screen                                      | `max` (one number, or per preset format), `min`, `multiline` |
| `time(o?)`                           | A moment: a word reference or seconds where the layer is made, seconds from the part's start in the component; type the prop `Time` | |
| `asset(o?)`                          | Media (an import or `ctx.asset`)                    | `kind`: `image`, `audio`, `video`, `font`           |
| `color(o?)`                          | A style token, for example `var(--ak-color-accent)` |                                                     |
| `number(o?)`, `boolean(o?)`          | A number, a switch                                  | `min`, `max`, `step`                                |
| `list(of, o?)`, `object(fields, o?)` | A list, an object                                   | `min`, `max`                                        |

Each one can carry `label`, `examples` and `optional`. Only props declared `time()` (also inside `list()` and `object()`) take word references.

A component must draw the same frame at the same moment: `render(t)` sets every animated property each time and does not depend on the previous frame (AK-D002). The rest is up to you. The starter components also use only style tokens (`var(--ak-color-*)`, `var(--ak-font-*)`), so a look restyles them; set text with `textContent`; and lay out by `ctx.dims` (`dims.safe` is the covered area), so they fit every format.

`mount(el, props, ctx)` is called once at `ready()`. **By then the look's fonts have loaded** (including the Chinese font subsets the text uses), so it is safe to measure text for layout (`fitText`). `ctx` is the one in the table under Layers.

### DOM helpers (`@allyhub/sdk/dom`)

| Helper                            | What it does                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------------ |
| `h(tag, style?, children?, cls?)` | Creates an element with styles and children (strings become text nodes)                          |
| `css(el, style)`                  | Sets styles: camelCase or `--custom` names; a number gets `px`, except `opacity`, `zIndex`, `fontWeight`, `lineHeight`, `flex`, `flexGrow`, `flexShrink` |
| `layout(ctx, opts?)`              | `{ W, H, k, orient, pad, top, bottom, left, right }`: the type scale `k` and the content box's edges in pixels (`right` and `bottom` are x and y, not widths); `opts` `{ margin, topGap, bottomGap }` changes its defaults (see The content box) |
| `text(v)`, `list(v)`              | A prop as a string (a number or boolean as text; anything else `""`), and as a list of strings (one value becomes a list of one) |
| `textBlock(value, { size, weight?, color?, font?, lineHeight?, align? })` | A `div` of text that wraps by width, keeps words together (Chinese broken only between words) and balances its lines; defaults weight 700, `var(--ak-color-fg)`, `var(--ak-font-display)`, line height 1.15, left |
| `eyebrow(value, size)`            | A small uppercase label in `var(--ak-color-accent)` and `var(--ak-font-body)` |
| `wordBreaks(value)`               | Chinese text with zero-width spaces between its words (the browser's own word segmenter), so `word-break: keep-all` breaks lines only between words; other text unchanged |
| `contentBox(L, style?)`           | An absolutely placed flex column over `layout()`'s content box, centred vertically; `style` overrides |
| `tag(el, name)`, `one(el, name)`, `all(el, name)` | Names an element in `mount`, finds it again in `render`                          |
| `fitTo(el, { min, max, maxHeight })` | Largest font size that fits                                                                   |
| `rise(el, t, at, { d, dy })`, `pop(el, t, at)` | Common entrances, as functions of `t`                                              |
| `captionTop(ctx, L, cue, w, h, opts?)` | A tool: the top of a block w × h, centred across the frame, for one cue: the first spot of `prefer` (`"bottom"`, `"middle"`, `"top"` or a y in pixels; default bottom, top, middle) clear of other layers' text (`ctx.texts`) and the faces over the cue, else just above or below that text, else the least text covered, then the least face. `opts`: `prefer`, `faces` and `texts` (false: do not look), `faceGap` (24 × the type scale), `textGap` (48 ×), `step` (seconds between the moments looked at, 0.1). Call it in `mount` |
| `freeAreas(ctx, t, opts?)` | A tool: the empty bands of the frame at part time `t`, `[x, y, w, h]`, tallest first: rows of `within` (default the content box) where no face, other layer's text or covered area is. `opts`: `within`, `faces`, `texts`, `covered` (false: ignore), `margin` (24 × the type scale), `minHeight`. Call it in `mount` |
| `lightDark(el)`                   | `{ light, dark }`: the look's background and text colours sorted by brightness, for text that reads over any footage |
| `emphasized(words, list)`, `wordEmoji(words, map)` | Per word of a cue: whether the words you list name it, and the emoji your map gives it (`""` for none). Matched as said: case, accents and punctuation ignored, whole words (`"free"` is not `"freedom"`); a phrase marks each of its words (its emoji goes to its last word); Chinese may match inside a word |
| `emojiEl(value, style?)`          | A span for an emoji in `var(--ak-font-emoji)`, upright at weight 400, without the outline or capitals of its line |

**The content box.** `layout(ctx)` and `ctx.content` compute it the same way from the frame (`W` × `H`, `ctx.dims`) and its covered edges (`ctx.dims.safe`), all in pixels:

```
k      = min(W, H) / 1080                    the type scale: 1 in every preset and platform profile
margin = 120 × k (landscape), 84 × k (portrait, square)
pad    = max(margin, safe.left, safe.right)  the sides are the same width, so centred text stays centred
top    = max(pad, safe.top + 30 × k)
bottom = H − max(pad, safe.bottom + 20 × k)
left   = pad,  right = W − pad
```

| Format | Covered (top, bottom, left, right) | `pad` | `top`, `bottom`, `left`, `right` | `ctx.content` |
| --- | --- | --- | --- | --- |
| `9x16` (1080×1920) | 150, 400, 40, 140 | 140 | 180, 1500, 140, 940 | `[140, 180, 800, 1320]` |
| `tiktok` (1080×1920) | 240, 660, 120, 180 | 180 | 270, 1240, 180, 900 | `[180, 270, 720, 970]` |
| `16x9` (1920×1080) | 60, 90, 80, 80 | 120 | 120, 960, 120, 1800 | `[120, 120, 1680, 840]` |

`layout(ctx, { margin, topGap, bottomGap })` changes the margin (default 120 × k or 84 × k) and the gaps by the covered top and bottom edges (30 × k, 20 × k), in pixels; the box still clears the covered edges. For a box that hugs each covered edge (TikTok's left is 120, its right 180), compute it from `ctx.dims.safe` yourself; `freeAreas` takes any rectangle as `within`.

Use `h`/`css` instead of assigning to `el.style` yourself: a browser silently drops a value it does not accept (`fontWeight: "900px"`), and the look you wrote does not apply. The check reports such a value as must-fix (AK-R004).
Set styles however you like: `h`/`css` (numbers become pixels), or `el.style` directly, as `render` usually does for what moves. A browser silently drops a value it does not accept (`fontWeight: "900px"`, `width: "760"`), and the look you wrote does not apply: while checking, every inline style assignment is watched (a property, `setProperty`, `cssText`, `h` and `css`), and such a value is must-fix (AK-R004).

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
- When none fits, write your own with `defineComponent` or `custom` (above), starting from a copy if one is close. Video is not a component: it is a `footage()` layer.
- A piece that still imports `@allyhub/sdk/components` gets AK-B006: copy the components it uses with `allyhub add` and import them from there.

| Component      | Purpose                    | Main props                                                                                                                                                  |
| -------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `titleCard`    | Title card                 | `eyebrow`, `line1`, `line2`, `l2At` (a word reference)                                                                                                      |
| `statement`    | One sentence               | `text`, `emphasis`                                                                                                                                          |
| `bulletList`   | Bullet list                | `title`, `items`, `itemAt[]` (word references)                                                                                                              |
| `compareCards` | Comparison cards           | `left`, `right` (each with `title` and `items`), `better` (`"left"` or `"right"`: drawn in the accent colour; default neither)                            |
| `bigNumber`    | Highlighted number         | `value`, `label`, `countFrom`                                                                                                                               |
| `chart`        | Chart                      | `kind` (`bar`, `line`), `data` (`[{ label, value }]`), `highlight`, `title`                                                                                 |
| `timeline`     | Timeline                   | `events[]` (`{ date, title }`), `title`                                                                                                                     |
| `quoteCard`    | Customer testimonial       | `quote`, `name`, `role`, `avatar`                                                                                                                           |
| `priceCard`    | Pricing                    | `plans[]` (`{ name, price, period?, features?, highlight? }`), `title`                                                                                      |
| `siteStep`     | One step of a website demo | `page` (a web page screenshot with `.elements.json`), `title`, `focus`, `typeInto`, `typed`, `clickOn`, `checksAt`; the times `zoomAt`, `typeAt`, `clickAt` |
| `endCard`      | Closing call to action     | `lines`, `cta`, `url`, `logo`                                                                                                                               |
| `lowerThird`   | Who is speaking            | `name`, `role`, `y` (where its foot sits in the content box, 0–1; default at its foot)                                                                     |
| `captionWord`  | Captions: one word at a time | `stress` (words bigger, in the accent colour), `emoji` (`{ word: "🎁" }`, above the word), `y` (0–1 in the content box, default 0.8)                     |
| `captionLine`  | Captions: a highlighted line | `stress` (words in the accent colour), `y` (default 0.82); an accent box slides to the word being said                                                  |
| `captionSubtitle` | Captions: a quiet subtitle | `y` (where its bottom sits, default 1)                                                                                                                  |

## Look `look`

```ts
(look.color.bg,
  look.color.fg,
  look.color.accent,
  look.color.muted,
  look.color.surface);
(look.font.display, look.font.body, look.font.mono, look.font.emoji);
look.motion.beat; // seconds
look.sfx; // the look's sounds: name → audio file (the built-in whoosh, tick and pop are always there)
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
    sfx: { ding: "media/sfx/ding.wav" }, // part({ sounds: [{ at, sound: "ding" }] })
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

## Seeing values: `console.log`

Piece code may print with `console.log`, `info`, `warn`, `error` and `debug`: at its file's top level, in the output's function, in `mount` and in `render`. `allyhub check`, `inspect` (also `--at`), `render`, `still`, `sheet`, `frames` and `timeline` print each message after their own output, with where it was printed:

```
log [leo · short · lang=en · tiktok · intro · custom (layers[1]) · mount] 180 [374,511,491,685] [180,270,720,970]
log [leo · short · lang=en · tiktok · intro · custom (layers[1]) · render t=0.00–3.40] (×102) tag
```

piece, output, combo, format, part, layer (its component and its place in the part's `layers`) and phase: `module`, `build`, `mount`, `render t=…` (the part's time, as `render(t)` gets it), `cover`, `other` (a callback run later). The same text at the same place prints once, with how many calls printed it (×n) and the range of `t` it was printed at. Which moments are drawn is the command's: the check runs `mount` once and `render` at the moments it samples (each part's still, the middles of layers and caption cues, every second over footage with a face track, some twice and out of order); `inspect --at` the moments you name (and each part's still); a render every frame. At most 200 different messages are kept per output × combo × format, and a last line says how many calls were left out: `--console <n>` keeps n, `--console all` every one. `--json` has them as `console: [{ level, text, piece, output, combo, format, phase, part, layer, index, t, until, count }]`, with `consoleDropped` and `consoleLimit` when calls were left out. Objects print as JSON (a DOM element as `<div.class>`), `%s`, `%d`, `%f` and `%o` fill in as in the browser, and a text over 4000 characters is cut, saying how much. Printing changes no frame. A check that reuses an output's results prints what it printed when it was checked.

## Determinism

The same files, the same combo and format and the same moment always give the same frame. The runtime takes over `Date`, `performance.now`, `Math.random`, `crypto.getRandomValues`, `requestAnimationFrame` and timers; the clock is the part's own time, and the random seed is "piece id + output name + the dimensions with the format + part key + frame number in the part", so a part draws the same in every combo that has it. So write an `id` before you move a file, and the frames do not change. So using these APIs in code is not reported; the shuffled-order comparison (AK-D002) catches frames that come out different. CSS animations and transitions run on real time, and their position in each frame is unpredictable when rendering; do not drive the frame with them.

## References: `allyhub reference` and `allyhub compare`

`allyhub reference <file or URL> [--out reference/<id>]` analyses a reference video on this computer (a URL is downloaded with yt-dlp, installed on first use) and writes into `reference/<id>/`: `video.mp4`, `video.words.json` (its words, the format a take reads), `sheet-01.png`… and `reference.json`. Speech is heard with Parakeet (`--lang`), text on screen read with OCR (Tesseract, about 20 MB on first use; `--no-ocr` skips it; a word counts from confidence `--ocr-confidence` 60, a word of three characters or fewer from `--ocr-short` 80), cuts found by frame difference (`--threshold` 0.3 for a cut; `--min-shot` 0.25 s between cuts, `--weak-floor` 0.12 and `--prominence` 1.8 for weak candidates). `--all` keeps everything those thresholds leave out: every candidate peak with its score, and the low-confidence words, marked. Every analysis is cached by the file's content hash in `.allyhub/cache/index/` (`--fresh` redoes them). `--understand` also sends the video and the local measurements to Gemini (`GEMINI_API_KEY`; the newest Gemini model the key can use, or `--model`): its sections are moved to the nearest local cut or pause, and the word times stay local.

`reference.json` (times in seconds):

| Field                                                     | What it is                                                                                                                                                                      |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `schema`, `id`, `source`                                  | `1`, the folder's name, and `{ file, url?, title?, sha256 }`                                                                                                                    |
| `duration`, `width`, `height`, `fps`                      | The video                                                                                                                                                                       |
| `words`, `wordCount`, `asr`                               | The words file beside it, how many words, the recognition model                                                                                                                 |
| `shots`                                                   | `{ threshold, minShot, weakFloor, prominence, cuts: [{ t, score }], weak: [{ t, score }], candidates? }`: the parameters used; cuts are candidates at or above the threshold; weak ones (a cut inside one half of a split screen, an animation) are for you to judge; with `--all`, every peak `{ t, score, source, around, passes }` |
| `ocr`                                                     | When OCR ran: `{ engine, confidence: { word, short }, low? }` (`low`, with `--all`: the words under the confidence, `{ t, text, conf, box }`) |
| `pacing`                                                  | `cutsPerMinute`, `meanShot`, `medianShot`, `wordsPerMinute`, `speakingRate`, `timeToFirstWord`, `timeToFirstCut`, `textShare`, `speechShare`, `tempo: { bpm, confidence }`, `onsetsPerMinute` |
| `captions`                                                | `present`, `wordsAtOnce`, `uppercase` (share), `position` (`top` … `bottom`, `varies`), `y`, `followsSpeech` (share of caption words said within a second), `observations`, `source` |
| `persistentText`                                          | Watermarks and handles, left out of the sections                                                                                                                                |
| `sections[]`                                              | `index`, `start`, `end`, `dur`, `role` (`hook`, `problem`, `demo`, `proof`, `offer`, `cta`, `other`), `roleConfidence`, `roleSource` (`local`, `gemini`, `agent`), `said`, `words`, `wordsPerMinute`, `onScreen`, `captions`, `shots`, `cutsPerMinute`, `textSeconds`, `visual` (`talking_head`, `screen_recording`, `b_roll`, `product`, `text_card`, `mixed`, `unknown`), `visualSource`, `notes` |
| `understanding`                                           | With `--understand`: `{ provider, model, summary, layout, hook }`                                                                                                               |
| `sheets`                                                  | The contact sheets beside it                                                                                                                                                    |

Edit it where the sheets show a guess is wrong (set `roleSource: "agent"`); `allyhub compare` reads it back. `--structure` prints a suggested structure (one slot per section, named by role: `hook`, `demo`, `demo-2`, `cta`, with durations) and the matching `part({ key, dur, layers: [] })` list.

`allyhub compare <reference> [folder] --piece <id> [--output] [--combo] [--format]` compares the output's render in `.allyhub/renders/` (rendered first when there is none, or with `--render`; `--file` names another video). It measures the render the same way (the words come from its takes), takes its parts as its sections, and aligns them with the reference's in order by dynamic time warping over durations and roles: a part whose key or tags name a role (`hook-b`, `tags: ["cta"]`) matches a section of that role more readily, and one section may match several parts or the other way round. It measures the render with the reference's shot and OCR parameters, and reports first the raw differences (render − reference): per section `diff: { seconds, share, cutsPerMinute, wordsPerMinute, textSeconds }`, and for the whole video `overall.diff` (duration, pace, time to first word, text share); then, labelled as such, a summary at a tolerance: `summary: { tolerance, sections, sectionsWithin, shareWithin, meanDurationDiff }` (sections within ±10 % by default, `--tolerance 0.15`). The side-by-side sheet (`--out`, default `.allyhub/compare/…png`) puts each reference section over the parts matched to it.

## Defaults

Every value AllyHub uses when you give none, and where you change it. They are starting points, not recommendations. Values inside starter components are not listed: the components are your code.

**Timing**

| Default | Value | Option |
| --- | --- | --- |
| Length of a part without speech | 4 s | `part({ dur })`, `video(…, { defaults: { part: { dur } } })`, `defineConfig({ defaults: { part: { dur } } })` |
| Before the first word, after the last | 0.2 s, 0.3 s | `part({ lead, tail })`, `defaults.part` (output or project) |
| A part's still | 0.4 s before its end | `part({ still })` |
| Ending silent parts on the beat | off | `music: { snap: true }` (tempo: `bpm`, else measured) |
| Frames per second | 30 | `video(…, { fps })` |

**Cuts** (edits files and the transcript tools)

| Default | Value | Option |
| --- | --- | --- |
| Silence kept before and after a cut | 0.12 s, 0.08 s | edits file `pad: { before, after }` |
| Longest pause kept | none (pauses kept) | edits file `maxPause` |
| A take's noise reduction | none; 12 dB when asked | `take(…).denoise(db)` |
| Room tone in leads and tails | the quietest steady stretch measured | `take(…).roomTone(false \| { from, to })` |
| A sound between words is listed when | within 22 dB of the speech, 8 dB over the floor, at least 0.1 s; voiced from 0.6 | `allyhub transcript --sound-within --sound-floor --sound-min --sound-voiced`; `--all` lists every stretch |
| A word counts as scripted, a line as said | 50 % and 40 % of its letters matched | `allyhub transcript --script … --match --line-match`; `--all` lists every line |
| Transcript lines | a new line at the first sentence end after 12 words | `allyhub transcript --line-words` |
| Words listed as unsure | none listed | `allyhub transcript --confidence <0-1>` (1 lists every word that has one) |
| Silence at a join (`allyhub edits`) | 10 ms frames under the take's speech/silence level (30 % of the way from its noise floor to its speech level) | `allyhub edits --quiet=<dBFS>` (`--quiet=-45`) |
| Level step across a join | the mean level of each word's 0.2 s next to the cut | `allyhub edits --near <seconds>` |
| Hearing a stretch again | three hearings, with 1, 2 and 3 s of the file on each side | `allyhub transcribe <take> --from --to --pad <s,…>` |
| Snapping a cut to the quietest 10 ms within 40 ms, to the frame grid, 10 ms fades | always | mechanics, not options |

**Sound and the mix**

| Default | Value | Option |
| --- | --- | --- |
| Sound effects | none | `part({ sounds })` |
| The look's sounds | the built-in whoosh, tick, pop | `look.sfx` |
| Music | plays once from 0 s | `music: { from, loop }` |
| Stem loudness | speech −16, music −20 under speech and −16 alone, effects −22, footage −16 alone and −22 under speech (LUFS) | `video(…, { mix })` |
| The music's dip under words | −8 dB, 0.3 s down, 1 s up, held through pauses under 2 s | `mix.duck: { db, attack, release, hold }` |
| The music's fades | 0.3 s in, 1.5 s out (at most a quarter of the video) | `mix.musicFade: { in, out }` |
| Master | the platform profile's loudness, else −14 LUFS; true peak −3 dBTP; range 11 LU | `video(…, { master })` |
| Audio bitrate | AAC 192, Opus 160 kbit/s | `allyhub render --audio-bitrate` |

**Captions**

| Default | Value | Option |
| --- | --- | --- |
| Burned-in captions | none | a caption layer in the parts you choose |
| Cues for a layer | 32 characters (16 in Chinese, Japanese, Korean), any number of words, any break between words | `ctx.captions({ maxChars, maxWords, keep })` |
| Subtitle files (srt, vtt) | 42 characters (16 CJK), 0.8 to 6 s, 2 frames apart | `allyhub render --caption-max-chars --caption-max-chars-cjk --caption-min --caption-max --caption-gap-frames` |
| Where a caption goes, which words it stresses | nowhere, none: your layer's code | `captionTop`, `freeAreas`, `emphasized` are tools you may call |

**Footage**

| Default | Value | Option |
| --- | --- | --- |
| The face followed | the track's default speaker (the largest face, kept through a bigger one passing by) | `footage({ speaker })` |
| A face reframe's face height | 0.4 of the crop | `reframe: { face: true, faceY }` |
| A punch-in | 1.12×, 0.2 s in, 0.25 s out, `in-out`, about the face (else 0.5, 0.42) | `punchIn: [{ at, until, scale, in, out, ease, center }]` |
| A pullback | 1.12×, 0.6 s, `out`, about the face | `pullback: { scale, dur, ease, center }` |
| Fit, box, speed, gain | cover, the full frame, 1, 0 dB | `fit`, `box`, `speed`, `gainDb` |

**Layout**

| Default | Value | Option |
| --- | --- | --- |
| The content box's least margin | 120 × k landscape, 84 × k portrait and square (k = short side / 1080) | `layout(ctx, { margin })` |
| Its gap below the covered top, above the covered bottom | 30 × k, 20 × k | `layout(ctx, { topGap, bottomGap })` |
| Console messages kept per output × combo × format | 200 different ones | `--console <n>`, `--console all` |

**Formats**

| Default | Value | Option |
| --- | --- | --- |
| A piece's formats | `defaults.formats`, else `16x9` | `definePiece({ formats })` |
| A profile's covered edges, length limit, loudness | the profile's table above | `formats: [{ format, safe, maxDuration, loudness }]` |
| A profile's mp4 encode | crf 20 and a most video bitrate, the profile's table above (other formats: crf 18, no cap) | `allyhub render --crf --max-bitrate` |

**Voice and speech**

| Default | Value | Option |
| --- | --- | --- |
| The voice tool | `tts-elevenlabs-multilingual-v2` | `say(text, { tool })` |
| The tool's other input | none | `say(text, { params })` |

**Measurements**

| Default | Value | Option |
| --- | --- | --- |
| Flat frames | a luma spread of 3 or less, runs of 4 frames, 10 luma levels from the picture around | reported in each `flat-frames` fact's `options` |
| Reference cuts | 0.3 for a cut; 0.25 s apart; weak from 0.12 at 1.8 × prominence | `allyhub reference --threshold --min-shot --weak-floor --prominence --all` |
| Reference OCR | confidence 60, 80 for words of three characters or fewer | `allyhub reference --ocr-confidence --ocr-short --all` |
| Compare's summary | sections within ±10 % | `allyhub compare --tolerance` |
| Moments the check measures | each part's still, layer and cue middles, every second over footage with a face track or matte; at most 24 a part | `allyhub inspect --at` measures the moments you name |
