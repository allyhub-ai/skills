# Defaults

Every value the piece API, the mix and the render use when a piece gives none, and the option that changes it. A starter component's own values are in its file. A command's defaults are in `allyhub help <command>`.

**Timing**

| Default | Value | Option |
| --- | --- | --- |
| Length of a part without speech | 4 s | `part({ dur })`, `video(…, { defaults: { part: { dur } } })`, `defineConfig({ defaults: { part: { dur } } })` |
| Before the first word, after the last | 0.2 s, 0.3 s | `part({ lead, tail })`, `defaults.part` (output or project) |
| A part's still | 0.4 s before its end | `part({ still })` |
| Ending silent parts on the beat | off | `music: { snap: true }` (tempo: `bpm`, else measured) |
| How parts join | a cut | `part({ transition })` |
| A transition's length | 0.4 s | `transition: { dur }` |
| Where its window lies | half before the join, half after | `transition: { split }` (0 to 1: the share before) |
| Its easing | `linear` (fade, dip, custom), `in-out` (slide, push, wipe, zoom) | `transition: { ease }` |
| A slide's, push's or wipe's direction | `left` | `transition: { direction }` |
| A dip's colour | the look's background | `transition: { color }` |
| A zoom's scales | the part before grows to 1.2; this part settles from the same | `transition: { scale, from }` |
| Frames per second | 30 | `video(…, { fps })` |

**Cuts** (edits files and takes)

| Default | Value | Option |
| --- | --- | --- |
| Silence kept before and after a cut | 0.12 s, 0.08 s | edits file `pad: { before, after }` |
| Longest pause kept | none (pauses kept) | edits file `maxPause` |
| A take's noise reduction | none; 12 dB when asked | `take(…).denoise(db)` |
| Room tone in leads and tails | the quietest steady stretch measured | `take(…).roomTone(false \| { from, to })` |
| Room tone's level at a join | matched to the floor of the take's own room beside it (up to 0.3 s of it, at least 0.1 s), at most 6 dB either way | `take(…).roomTone({ match, gainDb, limitDb })` |
| Room tone's cross-fade with the take | 0.04 s, equal-power | `take(…).roomTone({ fade })` |
| A stretch cut inside a word | none | edits file `inWord: [{ from, to }]` |
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

**Captions**

| Default | Value | Option |
| --- | --- | --- |
| Burned-in captions | none | a caption layer in the parts you choose |
| Cues for a layer | 32 characters (16 in Chinese, Japanese, Korean), any number of words, any break between words | `ctx.captions({ maxChars, maxWords, keep })` |
| Where a caption goes, which words it stresses | nowhere, none: your layer's code | `captionTop`, `freeAreas`, `emphasized` are tools you may call |

**Footage**

| Default | Value | Option |
| --- | --- | --- |
| The face followed | the track's default speaker (the largest face, kept through a bigger one passing by) | `footage({ speaker })` |
| A face reframe's face height | 0.4 of the crop | `reframe: { face: true, faceY }` |
| A punch-in | 1.12×, 0.2 s in, 0.25 s out, `in-out`, about the face (else 0.5, 0.42) | `punchIn: [{ at, until, scale, in, out, ease, center }]` |
| A pullback | 1.12×, 0.6 s, `out`, about the face | `pullback: { scale, dur, ease, center }` |
| Fit, box, speed, gain | cover, the full frame, 1, 0 dB | `fit`, `box`, `speed`, `gainDb` |
| The person's edge over a treated background | feather 2 px, shrink 4 px, at 1080p (× the format's short side / 1080) | `background: { feather, shrink }` |
| A matte's firm levels | under 0.25 background, over 0.75 the person | none: `feather` and `shrink` shape the edge |

**Layout**

| Default | Value | Option |
| --- | --- | --- |
| The content box's least margin | 120 × k landscape, 84 × k portrait and square (k = short side / 1080) | `layout(ctx, { margin })` |
| Its gap below the covered top, above the covered bottom | 30 × k, 20 × k | `layout(ctx, { topGap, bottomGap })` |
| How close `fitLines` gets to the largest size | 0.5 px (`FIT_LINES_PRECISION`) | `fitLines(…, { precision })` |
| How `marked()` draws a mark | `strong` weight 700; `em` the accent colour; `strike` a line through; `code` the mono font at 0.9 em | `marked(line, { strong: { … }, em: { … } })` |

**Formats**

| Default | Value | Option |
| --- | --- | --- |
| A piece's formats | `defaults.formats`, else `16x9` | `definePiece({ formats })` |
| A profile's covered edges, length limit, loudness | the profile's table in [core.md](core.md#formats-formats) | `formats: [{ format, safe, maxDuration, loudness }]` |

**Voice and speech**

| Default | Value | Option |
| --- | --- | --- |
| The voice tool | `tts-elevenlabs-multilingual-v2` | `say(text, { tool })` |
| The tool's other input | none | `say(text, { params })` |

**Web products** (`allyhub/browser`'s `session()`)

| Default | Value | Option |
| --- | --- | --- |
| Viewport, scale | 1440 × 900 CSS pixels, 2 image pixels per CSS pixel | `session({ viewport, scale })` |
| Video | off; when on 30 fps, crf 16, PNG frames from Chrome (JPEG at quality 90) | `video: { fps, crf, frames, quality }` |
| Where it writes | `.local/work/record` | `out` |
| The pointer's travel (`glide`) | 600 ms | `glide(page, target, { ms })` |
| A press and release further apart than this is a drag; keys this close are one typing step | 6 CSS pixels; 1 s | `SESSION_DEFAULTS` in `allyhub/browser` |
