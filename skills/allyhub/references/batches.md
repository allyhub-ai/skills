# Slots: mix-and-match batches

The matrix's dimensions and combo keys are in [core.md](core.md#the-matrix-matrix).

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

Without `combos`, the matrix samples `pick` of them and records why it chose each: it covers every candidate at least once when it can, then spreads use evenly, prefers pairings not made yet and combos far from the ones chosen. Each chosen combination has an id, `c01`, `c02`… (`c01-zh-cn` when the dimensions have several values), crossed in full with the dimensions. `allyhub combos` prints the slots, the chosen combos and the render cost; `allyhub combos manifest` writes a CSV row per ad (`allyhub help combos`).

The output's function reads `ctx.combo.<slot>` (the candidate's name) and returns that combo's parts; `ctx.pool("demo")` is the file a pool slot picked, for `footage()`. A part whose `key` is a slot's name fills that slot (or say `slot: "hook"`).

**Each part renders once.** A render keeps every part's encoded segment, named by what draws it, and reuses it in every combo that has the same part; the sound is mixed for each whole combo. So a part must draw only from its own props, time and words: a layer that reads another slot's pick from its `ctx.combo` is a must-fix (AK-X005); choose in the output's function and pass the result as a prop. A [transition](core.md#transitions-between-parts) declared on a slot's part applies in every combo that has it, and its window is rendered once per pair of parts. `custom()` layers are reused only within the same combo; components are reused across combos. The check loads only the combos that between them hold every candidate, and checks every combo as a whole from its parts against `video(…, { maxDuration })` (AK-X006).

Rules of the matrix: AK-X001 a slot, structure, rule, pool or combo that names nothing, or a combo that lacks a slot of its structure; AK-X002 the rules leave no combination, or rule out a combo `combos` names; AK-X004 two chosen combos are the same, or more alike than `differ` allows.
