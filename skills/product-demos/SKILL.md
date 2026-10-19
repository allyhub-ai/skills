---
name: product-demos
description: Make demo films of a web product with AllyHub, as a video agency would for a client — a brand book, a product brief, the competitors, a direction for the brand's films, then a first 20–30 second demo made from the real product, its kit, and a plan for what is next. Use when someone wants a product demo video, a walkthrough or a tour of their app, SaaS or website.
license: MIT
compatibility: Needs the AllyHub CLI (npx -y allyhub, Node.js 22.19 or newer) and the allyhub skill (npx skills add allyhub-ai/skills --skill allyhub -g).
metadata:
  version: "29"
---

# Product demos

## Before you start

This skill makes its work in an AllyHub project: the allyhub skill says how AllyHub works, where each file goes and how the project remembers. Read it first. If you do not have it, ask the person, then install it with `npx skills add allyhub-ai/skills --skill allyhub -g`.

If the folder is not an AllyHub project yet (it has no `allyhub.project.json`), start one there with `allyhub new <the folder> --skill product-demos`, which also adds this skill to it; in a project that does not have this skill, `allyhub skill add product-demos` adds it.

## What it is for

You are the person's video agency for one product. They give you the product and a line about who it's for; you hand back what a top agency would. The project lasts: every later job starts from what this one gathered and built, so it is faster and better than the first. Stop to ask only for what is truly theirs (a login or a test account, a brief too vague to act on, a choice that cannot be undone); decide everything else.

In a project that already has a brand book, a product brief and the competitors (another skill may have made them), start from those and keep them current; do not make them again.

## What is at stake

When this is the project's first film, this round is the pitch, and a chance that will not come again. The client is choosing an agency on what you hand back today: work that is merely good loses the account. Make the best you can make, a masterpiece: a film that surprises them, that they want to show their whole team, and that only their product could have made, in their own brand. The real product's screens fill the frame, and the camera takes the viewer to what matters. Give it everything within the hour, and do not stop at the first version that works.

## What you hand back

- The brand book (`content/brand/doc.mdx`), with the brand's colours and fonts set in `look` in `allyhub.config.ts`.
- The product brief (`content/product/doc.mdx`) and the competitors (`content/competitors/sheet.csv`).
- The direction (`content/strategy/doc.mdx`): the style of this brand's films, argued so the client can say yes to it.
- The script (`content/demos/<name>/plan/doc.mdx`), written before the film: a table, a row per moment, with at least its time, what is seen, the words on screen and what the moment does in the story. Read top to bottom, it is a story the viewer wants to see to the end.
- The first film (`content/demos/<name>/video/`), made from the script. Unless the brief says otherwise: 16:9, in English, 20 to 30 seconds. Before you hand it off, look at it as the client will, on a phone, and make it better until it is the film you would pitch with.
- The brand's kit, in `components/` and `assets/`: what the next film is made from (the product's interface as code, the brand's elements, its music and its sounds, with the scripts that make them).
- What's next (`content/next/sheet.csv`): the next pieces, each with what it reuses from the kit. Then ask what to make next.

How it looks, moves, cuts and sounds is yours to decide.

## Facts

- Use the real product before anything else: see it, operate it and capture it with Playwright (a script run with `allyhub run`). Its real screens and real numbers are what the film shows. List the claims you inferred in the hand-off: the person checks them and owns what they publish.
- What people enjoy in product films now, as CapCut's and 剪映's templates show: the real product with a hand-drawn layer over it, circles, arrows and underlines drawn on as you watch, notes in a handwritten hand, doodles and stickers, so a demo feels made by a person and fun to watch. In the brand's colours; a handwriting font is one `allyhub font add` away.
- Product films are mostly watched on a phone, often with the sound off. `allyhub check` gives the smallest text's size on a phone, `allyhub inspect` every text's.
- Text and shapes moving slower than about a pixel a frame shimmer (Chrome puts text on whole pixels): a camera drifting slowly over the interface shivers, one that moves and then holds does not.
- Look at the film as the viewer gets it, by code: `allyhub frames`, `frames --cuts`, `inspect` and `audio`. Never render to look at your work; the MP4 is what the person exports.
- The first job has about an hour. Run `date` as you go; when a step runs long, take the simpler road and note the rest in what's next.
- `allyhub help` lists the commands and `allyhub help <command>` how one is used; the allyhub skill has the piece API.
- In Codex, a long command (`allyhub check`, `allyhub run`, `frames --cuts`, `audio`) returns after its `yield_time_ms` and keeps running; give it a `yield_time_ms` of 30000 instead of polling every second.
- Hide what is private in what you show: a live session's link or QR code, a person's name or data, a key.
- AllyHub's AI models provide voice, music, images and footage (`allyhub find` names the tools); the allyhub skill covers sign-in and credits.
