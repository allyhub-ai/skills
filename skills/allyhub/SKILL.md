---
name: allyhub
description: Make videos and decks as TypeScript with AllyHub, then check, preview and render them on this computer (MP4, captions, cover, PNG, PDF, PPTX). Write pieces with definePiece and their text in messages files; the person watches them take shape on the preview page (allyhub dev), circles what to change, and exports when they are happy. Use when the user mentions AllyHub, the allyhub command, definePiece, allyhub dev, "look at my feedback", or wants a video, a deck, slides or a carousel made.
---

# AllyHub

AllyHub runs, checks, previews and renders videos and decks that you write as code. How a piece looks, moves and sounds is up to you: anything a browser can draw as a function of time works. AllyHub gives you the contract below, the checks, the preview with the person's feedback, and the render.

## Run it

- `allyhub` means `npx -y allyhub` (the first run downloads it). Run commands yourself, with the workspace as the working folder. `allyhub help` and `allyhub help <command>` are the reference for every command.
- **The workspace** is a plain folder, not a Node project: `allyhub/` in the folder you started in, or the current folder if it has `allyhub.config.ts` or `app/videos/`. Create it if it is missing; nothing is installed into it. If it has an `AGENTS.md`, follow it.
- Headless Chrome downloads itself the first time a command needs it. MP4s also need ffmpeg: if `allyhub doctor` says it is missing, give the person the install command for their system and wait; do not install system software yourself.
- In a sandbox that blocks the network, a local server or Chrome (Codex), run `allyhub` outside it: ask for that permission, or run `allyhub skill install --agent codex --global` once to write the rule. Start commands bare (`allyhub check`), with nothing in front, so the rule matches.
- Deliverables come out of `allyhub render` (the preview page's Export runs it too), so the checks apply. When AllyHub lacks something, build it inside the workspace (a component, `custom()`, a script that makes media files) rather than around it.

## The contract

These are what the build, the checks and the render depend on. Everything else is your choice.

- A piece is a module that default-exports `definePiece({ … })` from `@allyhub/sdk`. Its top level must load in Node: touch `window` and `document` only inside an output's function or a component's `mount`/`render`.
- **A frame depends only on its time.** Set every moving property in `render(t)` from `t`. The runtime virtualizes the clock, timers and `Math.random` (seeded per frame) and blocks the network; CSS animations and transitions run on real time, so do not let them drive the picture. `allyhub check` draws sampled frames out of order and fails a video whose frames differ (AK-D002).
- Put the text people see in `messages/<lang>.json` and read it with `s("<id>.<part>.<name>")`: that is what the person can edit on the preview page, and what makes a language a variant. Text written in code still renders, but cannot be edited there. A voiceover script is `<id>.<part>.vo`; it needs an audio file with a `.words.json` beside it, and `voice.at(…)` syncs to its words.
- Import media, data and other files with paths relative to the importing file, inside the workspace. npm packages need a `package.json` in the workspace that declares them, and an install.
- **The render is offline**: fonts, images, footage, music and data must be files in the workspace. Bring in what the piece needs before you build (search, download, generate), each source in its own folder under `media/`, and import it.
- The type is a design choice: the stage has Inter and Noto Sans SC, and any other font works once it is in the workspace (`allyhub font add "<family>"`, or your own `@font-face`; see Fonts in the reference).
- Sound comes from four places: the stock effects (`look.sfx`), audio you write yourself with a script, the person's own files, and the paid cloud tools (see Ask first). Pick what fits the piece; set `bpm` on music you import so cuts land on its beat.
- Components are the workspace's own code. `allyhub add <name>` copies a starter one (`titleCard`, `siteStep`, `endCard`…) into `app/components/`; change it or write your own.
- The API is in [references/sdk.md](references/sdk.md).

## The loop

0. **Open the preview first**, before you research or write the piece, so the person watches it take shape: create the workspace, write a first small piece (a title card with the subject's name is enough), then start the preview and leave it running. The page shows "waiting" until a piece loads, keeps the last picture while a file is mid-edit, follows the part you change, and shows every piece of the workspace as a card.
   - In Claude Code's desktop app: `allyhub launch-config <workspace>` (run in the folder the session started in) writes `.claude/launch.json`; then call `preview_start` with the name it prints. The preview opens in the browser pane beside the chat, and the app runs and stops it.
   - In ChatGPT with the AllyHub app: call `allyhub_show_project` with the workspace folder; the AllyHub panel is the preview.
   - Elsewhere: run `allyhub dev --no-open` in the background and open its address in your browser pane, or give it to the person.
1. Write or change the piece, then `allyhub check` until it has no must-fix problems (fix the suggestions you can).
2. Look: `allyhub still --part <key> --out <png>` and `allyhub sheet --out <png>` draw frames for you; `allyhub timeline` prints the parts, text and sound cues. A still is a part at rest; most visual bugs are in motion, so also look at hits, cuts and transitions (`allyhub frames --at 3.1,7.05,19.8 --out <png>`), and after rendering at the file itself (`--from-render`, where motion blur and the post filter show). `allyhub audio` measures the sound you cannot hear: loudness, peaks, silences, and whether the cuts land on hits.
3. Let the person look: the preview from step 0 is already showing your latest. They edit text there and circle what should change. In ChatGPT, the person's circled feedback comes as their message with the circled frame attached.
4. Take what they send with `allyhub feedback --wait 600` in the background (in the foreground, `--wait 90`, under your command time limit), or the `feedback` tool of `allyhub mcp`. Feedback names the piece, output, part, time and variant, and a screenshot in `.allyhub/agent/` with the circle drawn on it: read the screenshot first. Change what it asks, say in one sentence what you did, and wait again. A request to fix the check's problems: fix them and check again. An export: see step 5.
5. **The person exports, not you.** When the piece is ready, say so and that they can export from the preview page (Export, top right): it runs the check and `allyhub render` and shows the progress. Its files come to you through `allyhub feedback` / the `feedback` tool: give the person each file (send it into the conversation when your host can) with its full path, and do not render again. Render yourself with `allyhub render` only when the person asks you for the files, or when there is no preview page they can use (a terminal without a browser, a phone): the files go to `.allyhub/renders/<piece>/` (`--name <base>` gives them a name to share).

## Ask first

- **Paid tools can lift the result a lot.** A real voiceover, generated images or footage, and composed music often make the difference between a good piece and a great one. Unless the person has already said no to paid tools, tell them which ones would improve this piece, what each would add, and the total estimate price for the video (`allyhub tools search <words>`, then `allyhub tools price <name> --input '{…}'` for each). Then let them choose. They cost the person's credits: get their yes before each paid plan.
- **Finding a tool**: `allyhub tools search` matches the words of tool names and descriptions literally, so give several at once (`allyhub tools search voice speech tts narration`). When it misses, list a group (`allyhub tools list --group media`), or run `allyhub tools catalog` and search the file it prints (one tool per line) with your own tools.
- **Sign-in**: when `allyhub tools` says the computer is not signed in, offer to sign in; on a yes, run `allyhub login`, show the address it prints, and wait. Never ask for or type a password or key. `allyhub login` and `allyhub doctor` name the AllyHub it talks to; `ALLYHUB_API_URL` and `ALLYHUB_WEB_URL` point it at another one (a test or local server).
- **Sharing is the person's to do**: never post, send or publish what you made unless they ask.
- **Facts**: never make up a number, a quote or a claim about a product. Use what the person or a source gives you, and ask when it is missing.

## When something fails

A failed command prints `error.code`, `message` and `hint` (`--json` for a structured result): do what the hint says. A check problem names its rule (`AK-…`), piece, output, variant, part and file position. Exit codes: 1 the check did not pass, 2 wrong usage, 3 conflict, 4 not signed in or out of credits, 5 a tool or service failed (retry), 6 not found.
