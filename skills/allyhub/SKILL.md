---
name: allyhub
description: Make videos and decks as TypeScript, docs as MDX and sheets as CSV, with AllyHub, then check, preview and render them on this computer (MP4, captions, cover, PNG, PDF, PPTX). Write pieces with definePiece and their text in messages files; the person watches them take shape on the preview page (allyhub dev), circles what to change, and exports when they are happy. Use when the user mentions AllyHub, the allyhub command, definePiece, allyhub dev, "look at my feedback", or wants a video, a deck, slides or a carousel made.
---

# AllyHub

AllyHub runs, checks, previews and renders videos and decks that you write as code. How a piece looks, moves and sounds is up to you: anything a browser can draw as a function of time works. AllyHub gives you the contract below, measurements, the preview with the person's feedback, and the render.

## Run it

- `allyhub` means AllyHub Studio's command, `~/.allyhub/bin/allyhub`, where it exists: run it by its full path with the home folder written out (`/Users/<you>/.allyhub/bin/allyhub`), never with `~` or `$HOME`, which Codex's permission rule does not match. Without it, `allyhub` on PATH, else `npx -y allyhub`. **`allyhub help` lists every command by area (content, AI models, research, setup); `allyhub help <command>` is the full reference for one**, every option with its default. Run commands yourself, with the workspace as the working folder.
- **Before you write a tool of your own, ask `allyhub find "<what you need done>"`**: it ranks AllyHub's own commands (free, on this computer) with the cloud's AI models and research tools (priced), whatever words you use.
- **The workspace** is a plain folder, not a Node project: `allyhub/` in the folder you started in, or the current folder if it has `allyhub.config.ts` or `content/`. Create it if it is missing, with a `.gitignore` that has the line `.local/`. If it has an `AGENTS.md`, read it first and follow it.
- MP4s need ffmpeg: if `allyhub doctor` says it is missing, give the person the install command and wait. When this skill and `allyhub` disagree, `allyhub doctor` says whether they are the same version and `allyhub skill install` updates the skill.
- In a sandbox that blocks the network, a local server or Chrome (Codex), run `allyhub` outside it: start each command with the command itself, as above (`/Users/<you>/.allyhub/bin/allyhub check`), nothing chained before or after, so the permission rule matches.

## The contract

What the build, the checks and the render depend on. Everything else is your choice.

- **What a file is decides its folder**: made for the person → `content/`; a file reused as it is → `assets/` (`media/`, `fonts/`, `data/`, `text/`); code reused → `components/`; learned and worth keeping → `agent/memory.md`; a day's work → `agent/daily-notes/<date>.md`; anything that can be thrown away → `.local/work/`. Only `content/`, `assets/` and `components/` are built. `.local/` is this computer's own (`out/` renders, `cache/` what the tools rebuild): nothing a piece needs lives only there.
- **An item is a folder under `content/` named by its entry file**: `video.ts` (a video), `slides.ts` (a deck), `doc.mdx` (a doc: prose for the person, [docs.md](references/docs.md)), `sheet.csv` with `sheet.yaml` (a sheet: rows, [sheets.md](references/sheets.md)). Folders above it only group. What only that item uses goes in its folder. The person edits docs and sheets too, saved a moment after they type: read the file again before you change it.
- **A piece** default-exports `definePiece({ … })` from `@allyhub/sdk`; its top level must load in Node (touch `window` and `document` only inside an output's function or a layer's `mount`/`render`).
- **A frame depends only on its time.** Set every moving property in `render(t)` from `t`. The clock, timers and `Math.random` are virtual (seeded per frame) and the network is blocked; CSS animations run on real time, so never let them drive the picture. The check fails a video whose frames differ when drawn out of order.
- **An item's words are its script**: `script.<lang>.yaml` beside the entry, a `title` and a row per part (`id`, `say`, `screen`), read with `s("<id>.<part>.say")`. An anchor `@{name}` in a `say` is a place code can time to (`"@name"`); `<12|twelve>` is shown one way and said another. Each language is a combo of the piece; every combo renders in each of its `formats`, so lay out by `ctx.dims`.
- **A video is parts; a part is speech and layers**, drawn back to front in the order listed, footage and graphics alike, each placed with `at`/`until` (seconds, word references or anchors). Parts join with cuts unless a part asks for a `transition`. Nothing makes a sound unless a part or the video places it.
- **The render is offline**: fonts, images, footage, music and data are files in the workspace, imported with paths relative to the importing file.
- **Components are the workspace's own code.** `allyhub add <name>` copies a starter (a few mechanisms: a demo on a screen, a code panel, callouts, a chart, captions); its props are documented in its source. Anything that is only a look you write yourself with `custom()`.
- **A real web product**: write a Playwright script and run it with `allyhub run` ([web-products.md](references/web-products.md)).

## The loop

1. **When a person is watching, open the preview first** (`allyhub dev`, or `allyhub launch-config` for Claude Code's desktop app), with a first small piece, so they watch it take shape.
2. Write the piece; `allyhub check` until it has no must-fix problems.
3. **Look at it by code, never by rendering**: `frames`, `still`, `frames --cuts`, `inspect` (measured facts, for you to judge), `audio`, `timeline`. They draw and mix exactly as the export will; a render adds nothing to see. `console.log` in piece code is printed after these commands' output.
4. Take the person's notes with `allyhub feedback` (or the `feedback` tool of `allyhub mcp`): read its screenshot first, change what it asks, say what you did.
5. **The person exports**, from the preview page. Render yourself only when they ask for the files.

## Ask first

- Never post, send or publish what you made unless asked. Never invent data or a quote (a figure the product does not show, a testimonial). Claims drawn from real data, inferred and generalised, are yours to write boldly: the person checks them and owns what they publish. Ask before uploading the person's own footage anywhere (`allyhub reference --understand` uploads to Gemini).

## When something fails

A failed command prints `error.code`, `message` and `hint`: do what the hint says. A check problem names its rule (`AK-…`) and where. Exit codes: 1 the check did not pass, 2 wrong usage, 3 conflict, 4 not signed in or out of credits, 5 a tool or service failed (retry), 6 not found.

## The reference: the piece API, by topic

- [core.md](references/core.md): every piece. `definePiece`, formats, `video`, `paged`, parts and transitions, layers, `custom`, the DOM and animation helpers, the look, fonts, scripts and strings, imports, `ctx`.
- [speech.md](references/speech.md): `take` (a recording and its cut list) and `say`, word references, anchors, captions.
- [sound.md](references/sound.md): music, sound effects, the mix.
- [footage.md](references/footage.md): video layers, reframing, the background behind a speaker, synced recordings, faces and mattes.
- [batches.md](references/batches.md): slots, candidates and combos, for a batch of ads.
- [web-products.md](references/web-products.md): Playwright and `allyhub/browser`.
- [docs.md](references/docs.md) and [sheets.md](references/sheets.md): a doc's file, a sheet's files.
- [defaults.md](references/defaults.md): the piece API's defaults and the option that changes each.
