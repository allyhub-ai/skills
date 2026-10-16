# Sound: music, effects and the mix

The music itself is `video(…, { music })` and the master `video(…, { master })`: see [core.md](core.md#videobuild-options).

Nothing makes a sound unless you put it there: each part's speech, the music, footage with `audio: true`, and the sound effects a part places.

**Sound effects** are placed per part: `part({ sounds: [{ at, sound, gainDb?, what? }] })`.

```ts
part({
  key: "how",
  speech: take("./vo/en.mp3").saying(s("film.how.say")),
  sounds: [
    { at: "paste", sound: "tick", what: "step 1" }, // a word reference
    { at: 2.4, sound: "./sfx/ding.wav", gainDb: -3 }, // seconds, a file
    { at: "free-0.05", sound: chime }, // an import
  ],
  layers: [/* … */],
});
```

- `at` is a word reference, an anchor or seconds from the part's start.
- `sound` is a name of the look's sounds, one of the built-in synthesized `whoosh`, `tick` and `pop` (their transient lands on `at`), or an audio file, an import or a path relative to the piece (it starts at `at`).
- `look.sfx` in `allyhub.config.ts` names files as the look's sounds: `look: { sfx: { whoosh: "assets/media/sfx/whoosh.wav", ding: "assets/media/sfx/ding.mp3" } }` (paths from the workspace's root; a name there replaces the built-in one).
- A file is levelled by its loudness to the mix's sound-effect level, then by its `gainDb`.
- A name that is neither a sound nor a file is AK-A001; a file without sound AK-A003.

**Music can be code**: any audio file is music, so a script the workspace keeps (run with `allyhub run`) may synthesise a WAV into the item's folder. Its tempo is measured like any music's, so `music.snap` works on it.

**The mix.** Each stem is levelled by its measured loudness to a target, and the music dips under speech. While speech plays, music sits at `music` and footage at `footageUnderSpeech`; where nobody speaks they play at `musicAlone` and `footage`. Under the words, the music goes `duck.db` further down, over `attack` before a word and `release` after one, and stays down through pauses shorter than `hold`. `video(…, { mix })` changes any of it:

```ts
video(build, {
  music: { file: "./music/bed.mp3", loop: true },
  mix: { music: -24, duck: { db: -6, hold: 1 }, musicFade: { out: 3 } },
  master: { lufs: -16, truePeak: -1.5 },
});
```

| `mix` field          | Default                                        | What it is                                                                                    |
| -------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `speech`             | −16 LUFS                                       | Each part's speech (a take's room tone with it)                                               |
| `music`              | −20 LUFS                                       | The music while speech plays                                                                  |
| `musicAlone`         | −16 LUFS                                       | The music where nobody speaks                                                                 |
| `sfx`                | −22 LUFS                                       | Sound-effect files; the built-in sounds move by the same amount from −22                      |
| `footage`            | −16 LUFS                                       | Footage's own sound (`audio: true`) where nobody speaks                                       |
| `footageUnderSpeech` | −22 LUFS                                       | Footage's own sound while speech plays                                                        |
| `duck`               | `{ db: −8, attack: 0.3, release: 1, hold: 2 }` | How far (dB) and how fast (seconds) the music dips under words                                |
| `musicFade`          | `{ in: 0.3, out: 1.5 }`                        | The music's fades at the start and end, seconds (the fade out at most a quarter of the video) |

`allyhub audio` measures the piece's own mix as the render makes it, without rendering (`allyhub help audio`).
