# Docs: `content/<name>/doc.mdx`

A doc is what a person reads and edits as a page: a plan, a brief, a report. It is not a piece: no `definePiece`, no outputs, formats, languages or combos, and nothing of it is drawn frame by frame. The file is the doc.

```mdx
# Launch plan

What we ship, and when. **Forms that fill themselves in** is the one sentence.

- [x] Record the narration
- [ ] Pick the music

| Week | What ships |
| ---- | ---------- |
| 1    | The film   |

<Block align="center" color="blue">

A centred line, in blue.

</Block>

![The logo](../../assets/media/logo.svg)
```

- **Prose is Markdown** as MDX reads it: headings, paragraphs, `**bold**`, `*italic*`, `~~struck~~`, `` `code` ``, links, bullet, numbered and task lists (nested by indenting), quotes, fenced code, tables, pictures, `---`. A picture's path is relative to the doc's folder and must be in the project.
- **It is MDX, so `{` and `<` are code.** Write `\{` and `\<` for the characters. A lone `{…}` in a line, and a tag inside a line that is not one of those below, are AK-M008.
- **What Markdown cannot say is a tag**:

  | Written | Means |
  | ------- | ----- |
  | `<u>…</u>` | Underlined |
  | `<span color="red" bg="yellow">…</span>` | Coloured text, a colour behind it (`gray`, `brown`, `red`, `orange`, `yellow`, `green`, `blue`, `purple`, `pink`, or a CSS colour) |
  | `<strong>` `<em>` `<del>` `<code>` | The same as `**`, `*`, `~~` and a backtick. Use them where Markdown's own marks do not read back: `**“引号”**` between Chinese characters is not bold, `<strong>“引号”</strong>` is |
  | `<br />` in a line | A line break. On a line of its own: an empty paragraph |
  | `<Block align="center" color="blue" bg="yellow">` | One block's look: `align` is `center`, `right` or `justify`. Inside it, on lines of their own with an empty line around each: the block, then any blocks under it |
  | `<Block toggle>` | Its first block (a heading or a line) folds the blocks after it |
  | `<Callout icon="⚠️" bg="yellow">` | A line set apart in a box, with a sign before it (💡 without `icon`). Inside it, on lines of their own: the line, then any blocks under it |
  | `<img src="./a.png" alt="…" width="320" align="center" />` | A picture a person sized or placed. Without those, write `![…](./a.png)` |
  | `<Table widths="120,,200" head="none">` around a Markdown table | Its columns' widths in px (empty: its own), and its head when that is not the first row: `none`, `column` or `both` |

- **The title is the first-level heading the file opens with** (`# Launch plan`). It is the doc's name in the project's lists. A doc that opens with anything else has no title.
- **A link to another item is a path to its file** from the doc's folder: `[the film](../film/video.ts)`, `[the notes](../notes/doc.mdx)`. The person opens it with a click.
- **Any other tag on lines of its own is kept as written** (`<Chart kind="bar" />`), with the `import` lines above it. It is not drawn: the person sees a named card. To show a moment of a video, write a still of it (`allyhub still`) into the doc's folder and show the picture.
- **The person's edits rewrite only the blocks they changed.** The rest of the file keeps its bytes: how you wrapped a paragraph, which marker a list uses.
- **You and the person can be in the doc at once.** What you write to the file shows on their page without a reload, each place marked with your name and what was there before, for them to keep or undo. What they typed meanwhile is kept. Write the whole file as it is now with your change in it; do not write over it from an older copy.
- **Comments**: what the person says about a doc reaches you as a note with the doc's file, the words it is about (or the line of the file, for a block or an empty line they ask you to write at) and, when the doc keeps its threads, a thread id. The threads are in `comments.json` beside the doc: `{ "threads": [{ "id": "c1", "quote": "…", "text": "…", "at": "…", "replies": [{ "by": "person" | "agent", "text": "…", "at": "…" }], "resolved": false }] }`. After you changed the doc, answer in the thread: add `{ "by": "agent", "text": "…", "at": "<ISO time>" }` to that thread's `replies`, set its `resolved` to true when what it asks is done, and leave the rest of the file as it is.
- **Check**: a doc that is not MDX, a tag or `{…}` a doc does not draw, a picture that is not in the project and a doc inside another item's folder are AK-M008.
- `allyhub render` prints a doc to `.local/out/<its place>/doc.pdf`, or a picture of the whole page (`allyhub help render`).
