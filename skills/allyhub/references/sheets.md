# Sheets: `content/<name>/sheet.csv`

A sheet is rows a person reads, sorts, filters and edits as a grid: leads, research findings, a content calendar, numbers a video charts. It is not a piece: no `definePiece`, no outputs. Its folder holds:

```
content/research/leads/
  sheet.csv        the rows: a header row, then one row per record
  sheet.yaml       optional: what the columns are
```

- **`sheet.csv` is plain CSV** (RFC 4180: fields quoted only when they hold a comma, a quote or a line break; `""` for a quote). Every value is text; its column's type says how it is read. A row may have fewer fields than the header (the rest are empty), never more. A blank line is a row of empty cells.
- **`sheet.yaml`**, every field optional:

  ```yaml
  title: Launch leads          # its name in the project; else the folder's
  key: id                      # the column whose value names each row: whole and unique
  primary: company             # the column a row is called by: its page's title
  columns:
    arr: { type: number, format: { style: currency, currency: USD, decimals: 0 }, width: 120 }
    stage:
      type: select
      options:
        - { name: Lead, color: gray }
        - { name: Won, color: green }
    tags: { type: multi-select, options: [inbound, partner], separator: ";" }
    signed: { type: date, format: short }
    notes: { type: text, wrap: true }
    logo: { type: file, height: 48 }
  ```

  A column not named there is text; `stage: select` is shorthand for `{ type: select }`. Without `primary`, a row is called by the first text column that is not the key.

  | Type | A value is written | Options |
  | ---- | ------------------ | ------- |
  | `text` | as it is | `wrap` |
  | `number` | `1234.5`: digits, a point for decimals, no thousands separator | `format`: `plain`, `percent` (0.12 shows 12%), `currency`, or `{ style, currency, decimals, thousands }` |
  | `select` | one option's name | `options`: names, or `{ name, color }` with a doc's colours |
  | `multi-select` | names joined by the separator: `a;b` | `options`, `separator` (default `;`) |
  | `date` | `2026-10-14`, or `2026-10-14T09:30` (read as UTC unless it has a zone) | `format`: `short`, `long`, `iso`, or `{ style, time: false }` |
  | `checkbox` | `true` or `false` | |
  | `url`, `email`, `phone` | as it is; shown as a link | |
  | `file` | a path in the project, from the sheet's folder or from the project's root; several joined by the separator: `files/a.png;files/b.pdf` | `separator` (default `;`), `height`: a picture's height in px in the grid (rows grow to hold it; default fits a row) |

  A `file` column is an attachment column: a picture (png, jpg, gif, webp, avif, svg) shows as itself, any other file by its name, and a person opens either to look at it whole. A file the person drops, pastes or chooses into a cell is kept in the sheet's own folder, under `files/`, and the cell names it from there (`files/logo.png`).

  Every column also takes `width` (px) and `wrap` (true or false): how it shows in the grid. An empty cell is allowed in every type. Sorting is by type (numbers as numbers, an option by its place among the options), empty cells last.
- **Rows are named as a spreadsheet names them** where the person points at cells: `B4` or `B4:C9`, columns by their place in `sheet.csv`, rows counted from 1 under the header (row 1 is the file's second line).
- **The person's edits** rewrite only the rows they changed; every other row of `sheet.csv` keeps its bytes, and an edit to `sheet.yaml` changes only that field's text. You and the person can be in the sheet at once: what you write shows in their grid without a reload, each changed cell marked with your name for them to keep or undo, and their unsaved edits are merged onto yours cell by cell (by `key` when the sheet has one, which is why a key helps). Write each file whole as it is now with your change in it.
- **What the person does by hand** is a spreadsheet's basics: cells, rows and columns, renaming a column, a column's format from a short list (text, number, currency, percent, date, checkbox, a dropdown list, which is `select` with the column's values as options, an attachment, which is `file`), adding files to an attachment cell, sorting, filtering, hiding and freezing, find and replace. How they sort, filter, hide or freeze stays on their computer and is in no file. Everything else is asked of you, in the files: option colours, a number's decimals or currency, the key and primary columns, values a formula would work out. A sheet is one grid: no saved views, layouts, groups or footers.
- **A question about cells** reaches you with the sheet's file, the range, what the cells say and the rows' keys.
- `allyhub sheet profile <its place>` measures every column of a sheet too long to read whole; `allyhub sheet import <file>` makes a sheet of a CSV, a TSV or an Excel workbook (`allyhub help sheet profile`, `allyhub help sheet import`).
- **Check** (AK-M009, each with its file and line): rows that are not CSV, a header with an empty or repeated name, a row with more fields than the header, a value its column's type cannot read (a few per column, then a count), a file a `file` cell names that is not in the project, a key that is empty or repeated, a spec that names a column the sheet does not have or does not match the format, and a sheet inside another item's folder.
- `allyhub render` writes a sheet as an Excel workbook, or a CSV, a Markdown table or JSON (`allyhub help render`).
- **Data for a video**: a piece reads a sheet like any data file, `ctx.data("../research/leads/sheet.csv")` (a path relative to the piece's file): one object per row, a column of numbers as numbers.
