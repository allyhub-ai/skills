# Footage: video layers and the media index

A talking head is speech too: a take, its cut list (`.edits()`), its room tone and the captions are in [speech.md](speech.md). How layers stack, footage and graphics alike, is in [core.md](core.md#layers).

## Footage `footage`

```ts
footage(); // the part's take (a video), in sync with its speech
footage("./broll/inbox.mp4", { at: "inbox", dur: 1.5 });
footage(demo, { from: 3, box: [0.5, 0.1, 0.45, 0.8], fit: "contain", audio: true, gainDb: -6 });
footage(screen, { crop: [0, 0, 0.5, 1], speed: 2 }); // the left half of the picture, twice as fast
```

| Option                        | Description                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `from`                        | Seconds into the file at the layer's start; default 0; a negative `from` is taken as 0. The take's own footage follows its speech instead                                                                                                                                                                                                                                                                                                           |
| `speed`                       | Playback speed, over 0 and up to 16; default 1. Its sound (with `audio`) follows, pitch too. The take's own footage always plays at 1                                                                                                                                                                                                                                                                                                              |
| `box`                         | `"full"` (default), or `[x, y, width, height]` as fractions of the frame, inside it (x + width and y + height at most 1)                                                                                                                                                                                                                                                                                                                            |
| `crop`                        | `[x, y, width, height]` as fractions of the source picture: only that part is shown, fitted to the box                                                                                                                                                                                                                                                                                                                                             |
| `fit`                         | `cover` fills the box and crops (default); `contain` shows all of it                                                                                                                                                                                                                                                                                                                                                                               |
| `audio`                       | Mix the file's own sound in (when it has any); default `false`. The take's own footage sounds as the part's speech                                                                                                                                                                                                                                                                                                                                 |
| `gainDb`                      | The sound's gain in dB; default 0                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `box` keyframes               | `[{ t, box, ease? }]`: `t` a word reference or seconds, `box` a rectangle or `"full"`, `ease` `linear` (default), `in`, `out`, `in-out` into that key. The first key places the picture; it moves and scales with the box. Every key lies inside the frame (`footage()` throws for one that reaches past it). Not with `reframe` or `punchIn`                                                                                                     |
| `reframe`                     | `"face"`, `{ face: true, faceY? }`, `"center"` or `{ x, y }` (fractions of the source): crops the source to the box's shape around the speaker's face (a smoothed path from the face track; the face's centre sits at `faceY` of the crop's height, default 0.4), its centre or that point. A face reframe needs the face track; until it is made, or where no face is seen, it is centred on `{ x: 0.5, y: 0.4 }`                               |
| `speaker`                     | The face the layer follows: an id of the face track (`ctx.faces(t)` lists them); default the track's default speaker (the largest face, kept through a bigger face passing by). It drives a face reframe, the punch-in and pullback centres and `ctx.face` for the layer; an id the track lacks is a `fallback` fact (centred)                                                                                                                     |
| `punchIn`                     | Words to zoom in on: `["insane", "free@1.15"]` (a decimal after `@` is the scale, default 1.12; `"free@2"` is still the second "free") or `{ at, until?, scale?, in?, out?, ease?, center? }`. Eased in over `in` seconds (0.2; up to 30) centred on the word's start, held for the word (or until `until`), eased out over `out` (0.25; up to 30), with `ease` (`"in-out"`); about `center` (`{ x, y }`, fractions of the box), by default the speaker's face, else `{ x: 0.5, y: 0.42 }` |
| `sharpen`                     | 0–1: sharpens the picture after it is scaled, for footage drawn larger than its pixels (the `footage-scale` fact). Renders and stills only: the live preview plays it unsharpened                                                                                                                                                                                                                                                                  |
| `pullback`                    | `true` or `{ scale?, dur?, ease?, center? }`: the layer opens zoomed in (1.12× by default, up to 3) and eases back (`ease`, default `"out"`) to the whole picture over `dur` seconds (0.6); about `center`, by default the speaker's face. A punch-in that starts sooner cuts it short. Not with box keyframes                                                                                                                                    |
| `background`                  | `{ blur?, dim?, desaturate?, color?, image?, feather?, shrink? }`: treats the picture behind the person apart from the person (below)                                                                                                                                                                                                                                                                                                              |
| `box`, `crop` per frame shape | `{ landscape?, portrait?, square?, default? }` in place of the value: each output takes the one for its orientation (`ctx.dims.orient`), else `default`, else none (`box` the full frame, no `crop`). Each entry may be a rectangle, `"full"` or keyframes                                                                                                                                                                                        |
| `radius`                      | Rounds the box's corners: px at 1080p (scaled by the format's shorter side, and with a keyframed box), at most half the box's shorter side. Outside the corners what is under the layer shows. Not with `shape: "circle"`                                                                                                                                                                                                                          |
| `shape`                       | `"rect"` (default) or `"circle"`: the picture shows only in the ellipse inscribed in the box (a circle when the box is square in pixels); the rest of the box shows what is under it. Graphic layers listed after it draw over it                                                                                                                                                                                                                  |

**The background behind the speaker.** `background` treats the picture behind the person apart from the person, through the file's person matte (any footage file, the part's take or another):

```ts
footage({ background: { blur: 24 } }); // the room out of focus
footage({ background: { dim: 0.4, desaturate: 1 } }); // darker and gray, the speaker in colour
footage({ background: { color: "var(--ak-color-bg)" } }); // a flat colour instead
footage({ background: { image: "../../assets/media/studio.jpg", blur: 6 } }); // an image instead
footage({ background: { color: "transparent" } }); // the person alone
```

| `background` | Description                                                                                                                                                                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `blur`       | The Gaussian's standard deviation, as CSS `blur()`, in px at 1080p (0–200). Only the background is blurred: the person's colours do not spread into it                                                                                                                  |
| `dim`        | 0 (as it is) to 1 (black)                                                                                                                                                                                                                                                 |
| `desaturate` | 0 (as it is) to 1 (gray)                                                                                                                                                                                                                                                  |
| `color`      | A flat colour instead: any CSS colour, a look's variable too. `"transparent"` draws the person alone, over what is under the layer (in a `transparent` video, nothing: mov, webm and PNG keep the alpha). Not with `blur`, `dim`, `desaturate` or `image`                 |
| `image`      | An image instead (PNG, JPEG or WebP; a path or an imported file), filling what shows of the picture (cover); `blur`, `dim` and `desaturate` then treat the image. It stays still under a punch-in or a reframe                                                           |
| `feather`    | The softness of the person's edge, px at 1080p; default 2 (0–40)                                                                                                                                                                                                         |
| `shrink`     | How far the person's edge is pulled in, px at 1080p; default 4 (−40 to 40; negative lets it out). A shrink over 1.5 times the feather softens the edge further                                                                                                          |

- Lengths are px at 1080p: they scale with the format's shorter side.
- It works with `box`, `shape`, `crop`, `reframe`, `punchIn`, `pullback`, `speed`, a cut take and box keyframes. The order is: the treated background, graphics drawn `z: "behind-person"`, the person, the graphics in front.
- The matte is a segmentation, not a keyed edge: about 480 px on its long side, made on 10–20 frames a second and filled in between. It is made firm first (under a quarter is background, over three quarters the person), then the edge is softened by `feather` and moved by `shrink`. Its errors show as they are: a rim of the old background round loose hair (up to about 15 px at 1080p), a hand moving fast, a thing held in the hand.
- Until the file has a matte the footage shows as it is, reported as a `fallback` fact (`for: "background"`).
- The preview approximates it (the blur is of the whole picture, so a faint glow of the person's colours shows round them; a blur fades at the frame's border; the edge is coarser); stills and the render draw it exactly.
- It costs render time on the parts that use it: on a 1080 × 1920 talking head, about a sixth more for the person alone, a quarter for a colour, a third for a dim, a desaturation or an image, up to nearly twice as long for a blur.

The render draws the exact frame of the video for every frame, straight from the file. When the layer is longer than the video, the last frame holds; before a take's file starts (speech in the lead), its first frame holds. Videos with alpha (ProRes 4444, VP9 with alpha) show what is under their transparent pixels. A file that is not a video reports AK-A003; `footage()` in a part without a take of a video reports AK-A001 or AK-A003.

## Two recordings of one moment

A separate microphone and a camera start at different moments and run on different clocks. `allyhub sync <reference> <other>` measures the offset between them from their sound (other = reference + offset), with the clocks' drift (`allyhub help sync`). Writing it into the piece is yours: the microphone is the part's speech and the camera is its picture.

```ts
const OFFSET = 1.500004; // allyhub sync mic.wav cam.mp4
part({
  key: "intro",
  speech: take("../../assets/media/mic.wav").range("So here is", "every time"),
  // from = the take's moment at the layer's start + the offset
  layers: [footage("../../assets/media/cam.mp4", { from: 12.84 + OFFSET })],
});
```

- When the camera started later than the layer's moment, start the layer that much later (`at`) with `from: 0`. When the camera file's sound starts later on its own clock, its picture is at `pictureOffset` (which `allyhub sync` reports), not the offset.
- **Drift**: take the offset at the part's moment, `drift.at0 + drift.slope × t`, and play the camera at `speed: 1 + drift.slope`.
- **A cut take** (`.edits()`): only a take's own footage follows its cuts. Make the two recordings one file first (the microphone's sound on the camera's picture, moved by the offset), transcribe it and take that.

## The media index

A face track and a person matte are what AllyHub learns from a video once, on this computer, and keeps in the project's media index (`.local/cache/index/<sha256 of the file>/`). An output reads the face track for a face reframe, for the `text-speaker` fact and for `ctx.face(t)` and `ctx.faces(t)`; it reads the person matte for layers drawn `z: "behind-person"` and for a footage layer's `background`. When one is missing, the check, the render and the preview make it first (the first time downloads the runtime and models into `~/.allyhub/`). Without it the reframe is centred, layers behind the person draw in front and a footage layer's background is left as it is, each reported as a `fallback` fact. `allyhub index <video>` makes them by hand (`allyhub help index`).
