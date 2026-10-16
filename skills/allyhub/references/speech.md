# Speech, word references, anchors and captions

## Speech `take` and `say`

Every part's speech has words: they time the part, place its layers, duck the music and make the captions.

- **`take(file)`**: a recording, audio or video (an import, or a path relative to the piece), with its words in the `.words.json` beside it (`allyhub transcribe <file>` writes it). Without words the check reports AK-T001. On its own it is the whole take, from its first word to its last. Narrow it with:
  - **`.range(from, to?)`**: from the first words `from` to the end of the first `to` after them (phrases of several words; case and punctuation ignored); without `to`, to the end. A phrase the take does not say reports AK-T003 with the nearest matches.
  - **`.saying(text)`**: the stretch that says this line, usually `s(key)`, found by its words, tolerating what recognition got wrong (the line wins: its spelling is the caption, and word references are found in it). When several parts take the same file, each searches after the previous part's stretch, so one recorded narration serves several parts; a line not said after it is searched for in the whole take. A line it cannot find reports AK-T003.
  - On a take with `.edits()`, both look only at the words the edits keep: a phrase or line said only in removed words, or a line that says words the edits remove inside it, reports AK-T006. A take a cloud tool generated has the text it was made from in its record (`gen.input.text`): a part's line that is not in that text (case, spacing and punctuation ignored, a `<shown|said>` piece compared as said) reports AK-T007, since the sound still says the old words.
  - **`.edits(path)`**: a cut list, a JSON file relative to the piece (`./edits/host.json`) that may not exist yet. You write it, and the preview's Transcript sheet writes it as the person strikes words and sounds. The take's words move onto the edited clock (word references, captions and timing follow it), and its footage and sound follow the same kept stretches:
    ```json
    {
      "remove": [{ "from": 167, "to": 189, "text": "Now second, figure out…" }],
      "sounds": [{ "from": 61.17, "to": 61.4 }],
      "inWord": [{ "from": 12.31, "to": 12.62 }],
      "maxPause": 0.35,
      "pad": { "before": 0.12, "after": 0.08 }
    }
    ```
    It removes exactly what it lists, nothing else.
    - `remove`: word indices into the take's words file (inclusive) with their text. When the words file is made again, a range is found again by its text; one the take no longer says reports AK-T005.
    - `sounds`: stretches of the file (seconds) between words where no word was recognised. A stretch is cut only between two kept words, never into a word.
    - `inWord`: stretches of the file cut even inside a kept word (a sound with no silence around it is inside its neighbour's time). Cut as listed, each end moved only to the quietest 10 ms within 40 ms, with 10 ms fades; the word stays, shorter, and one that reaches the first or last word of a part's stretch moves that end of the stretch. The Transcript sheet neither shows nor changes them.
    - `maxPause`: every pause between kept words longer than it, in seconds, is shortened to it.
    - `pad`: the silence a cut keeps beside the words: `before` the cut, after the last kept word (default 0.12 s), and `after` it, before the next kept word (default 0.08 s), each 0 to 2 s; never past half the silence (`maxPause` caps it at half the pause).
    - Every cut lands at the quietest 10 ms within 40 ms, on the film's frame grid, with 10 ms fades.

    `allyhub transcript <take>` prints the take's words with their indices, the sounds between them and the words that last long (`allyhub help transcript`); `allyhub edits <take>` shows what an edits file keeps and removes (`allyhub help edits`).
  - **`.roomTone(false | { from?, to?, match?, gainDb?, limitDb?, fade? })`**: a part's lead and tail play the take's own room (its silence around the words), and where that runs out its room tone: by default the quietest steady stretch the build measured; `{ from, to }` (seconds of the file) loops the stretch you pick; `false` leaves digital silence.
    - **Its level is matched**: a fill plays at the level of the take's own room beside the join it meets. The gain is that room's floor minus the fill's, each the mean power of the quietest quarter of the 10 ms frames within 0.3 s of the join, at most `limitDb` dB either way (default 6). `match: false` plays it as recorded; `gainDb` (−60 to 24) sets its gain yourself.
    - **It cross-fades with the take** over `fade` seconds (default 0.04, equal-power, inside the take's own room and never into a word); one loop of the stretch into the next and the fills of two parts in a row cross-fade the same way. `fade: 0` butts it against the take with the mix's 10 ms fades.
    - Where the take keeps under 0.1 s of its own room at a join, there is no floor to measure and the fill plays as recorded.
  - **`.denoise(db?)`**: reduces the noise in its sound by `db` (default 12) with ffmpeg's FFT denoiser, in the render and in the preview (which plays the take as recorded until the denoised sound is made).
- **`say(text, { voice?, tool?, params? })`**: text to speech, made by `allyhub voice generate` into `assets/media/gen/say/<hash>.<ext>` with its words and its record. The hash covers the text read aloud, the voice, the tool and the params, so a changed line needs a new file. `params` is extra input for the voice tool (plain JSON, not `text` or `voiceId`; `allyhub models describe <tool>` lists what it takes), checked by the server against the tool's schema. A `say` without its file reports AK-T002; until then the part lasts about as long as the line would take. The tool defaults to `tts-elevenlabs-multilingual-v2`, billed by character.
- **A narration made in one request is a take.** A voice model called with `allyhub models call <tool> --name content/launch/film/vo/en.mp3` writes the sound, its record and, when the tool returns word times, `vo/en.words.json`; each part then takes its line with `take("./vo/en.mp3").saying(s(key))`. `say` is a request per part instead. A voice tool's voice differs from one request to the next (pitch, brightness, pace) and holds within one.

## Word references

A word reference names a moment in a part by what is said there. Write it as a layer's `at` and `until`, a part's `still`, a sound's `at` and any component prop declared `time()`; the component receives seconds from the part's start.

| Form              | Meaning                                                 |
| ----------------- | ------------------------------------------------------- |
| `"只问"`          | The start of the first time "只问" is said in this part |
| `"deposit@2"`     | The second time in this part                            |
| `"deposit-0.35"`  | 0.35 s earlier                                          |
| `"deposit@2+0.1"` | The second time, 0.1 s later                            |
| `1.8` (a number)  | Seconds from the part's start                           |

Matching ignores case and punctuation; a reference can be a phrase of several words; Chinese and Japanese match character by character, consecutively. References resolve against the part's own words, after timing; with `say` or `saying` they are found in the line first, so a misheard word still lands where it is said. A reference the part does not say, or one in a part without speech, reports AK-T004.

### Anchors

An anchor is a name written in the line itself, in each language's script, and the code refers to the name: it survives rewording and differs in no language.

```yaml
# script.en.yaml
- id: how
  say: "@{step1}Paste your form link. We @{step2}match the answers you @{have}already have@{/have}."
# script.zh-cn.yaml
- id: how
  say: "@{step1}粘贴表单链接，我们@{step2}匹配你@{have}已有的答案@{/have}。"
```

```ts
part({
  key: "how",
  speech: say(s("launch-film.how.say")), // or take(…).saying(s(…))
  sounds: [{ at: "@step1", sound: "tick" }],
  layers: [statement({ at: "@have", until: "@/have", text: s("launch-film.how.title") })],
});
```

| In the script      | In the code                   | Meaning                                                                             |
| ------------------ | ----------------------------- | ----------------------------------------------------------------------------------- |
| `@{name}`          | `"@name"`                     | A point: the start of the word after it (after the last word, where that word ends) |
| `@{name}…@{/name}` | `"@name"` and `"@/name"`      | A stretch: the start of its first word, and the end of its last                     |
|                    | `"@name+0.2"`, `"@/name-0.1"` | Shifted by seconds                                                                  |

- An anchor reference works wherever a word reference does. It is looked up in the line the part says, so the part's speech must come from that script text: `say(s("<id>.<part>.say"))` or `take(…).saying(s("<id>.<part>.say"))`. A name the line does not have, the end of a point, or a line's anchor in a part without speech reports AK-T004; give every language's line the same names.
- **A part's own anchors** are seconds it gives itself, so a part needs no speech to have them: `part({ key: "demo", dur: 18, anchors: { press: 7.1, map: [9.6, 13.4] } })`. A number is a point, `[from, to]` a stretch, both from the part's start; `"@press"`, `"@map"`, `"@/map"` and `"@press+0.2"` then work as above, never outside the part. A name is the line's or the part's own, not both (AK-T004; the part's own is used).
- A name has letters, digits, `_` and `-`, and is there once in a line; stretches may overlap. A name written twice, an end without a start, a stretch with no words in it and an anchor in a plural are AK-M007.
- An anchor lands by the line's letters matched to the words of its sound, as a word reference does. Before a `say` has its file, it is placed in proportion along the line.
- An anchor goes before a `<shown|said>` piece, not inside it.
- The person can drag an anchor along the preview's timeline: the script's line is written at once, the same words with the anchor elsewhere. Their edits to a line move each anchor with the words it is on; an anchor whose words were cut stays at the place they were. An edit the person sends shows each line as written, anchors included. A `<shown|said>` piece the person typed over (`<14|twelve>`) needs its said side written again; one they deleted is gone from both sides. Read the script again before you change a line.

## Captions

Burned-in captions are a graphic layer you put in each part you want captioned, last in its layers: a starter component (`captionWord`, `captionLine`, `captionSubtitle`), your own component, or `custom()`. In any layer, `ctx.captions({ maxChars?, maxWords?, keep? })` gives the cues heard over the part: from each part's speech (a cut take's words left, the script's spelling when there is one), broken at sentence and clause ends, then by length and word count, never inside a phrase listed in `keep` (`keep: ["work harder"]`, matched as said; the cue around it may run over `maxChars` or `maxWords`, and a kept phrase starts a cue of its own when the one before has no room for it), never across two parts, following each other without a gap; in a J or L cut the words heard under a neighbour's picture are there too. Nothing places, stresses or decorates them for you:

- **Where they go** is the layer's own code: `captionTop` and `freeAreas` measure a place (see [DOM helpers](core.md#dom-helpers-allyhubsdkdom)), or read `ctx.face`, `ctx.faces`, `ctx.texts` and `ctx.covered` yourself. Behind the speaker is `z: "behind-person"`.
- **Which words to stress and which emoji to add** are the words you pass:

```ts
const stressed = emphasized(cue.words, ["free", "two minutes"]); // per word, true/false
const emoji = wordEmoji(cue.words, { free: "🎁" }); // per word, "" or an emoji
cue.words.forEach((w, i) => {
  line.append(h("span", { color: stressed[i] ? "var(--ak-color-accent)" : "inherit" }, [w.w]));
  if (emoji[i]) line.append(emojiEl(emoji[i], { marginLeft: "0.15em" }));
});
```

Subtitle files (`srt`, `vtt`) and the player's CC come from each voiced part's words: the line it says (`saying`, `say`) when it has one, else the take's own words. Their cue lengths are `allyhub render` options (`allyhub help render`).
