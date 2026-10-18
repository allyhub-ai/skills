---
name: launch-shorts
description: Make a short vertical video (15–30 seconds, 9:16) for each release of a product with AllyHub, sized for where it is posted (TikTok, Reels, YouTube Shorts, LinkedIn, X), and keep the release history so each launch starts from the look and the openings that worked. Use when someone wants a launch video, a release teaser, a changelog video or a social short about a new feature.
license: MIT
compatibility: Needs the AllyHub CLI (npx -y allyhub, Node.js 22.19 or newer) and the allyhub skill (npx skills add allyhub-ai/skills --skill allyhub -g).
metadata:
  version: "7"
---

# Launch shorts

## Before you start

This skill makes its work in an AllyHub project: the allyhub skill says how AllyHub works, where each file goes and how the project remembers. Read it first. If you do not have it, ask the person, then install it with `npx skills add allyhub-ai/skills --skill allyhub -g`.

If the folder is not an AllyHub project yet (it has no `allyhub.project.json`), start one there with `allyhub new <the folder> --skill launch-shorts`, which also adds this skill to it; in a project that does not have this skill, `allyhub skill add launch-shorts` adds it.

## What it is for

A short vertical video for each release of one product: what is new, why it matters, where to get it. Releases come one after another, so each round makes one short from what the earlier ones left: the look, the openings that worked, what was already said.

## What it keeps

- `content/releases/`: the release history, a sheet with a row per release: its `date`, what `launch`ed, where it was `posted`, the `short` (its entry file), its `views` and `how it did`. Read it before every round; add the release's row when its short is made, and fill in the views and how it did when the person tells you.
- `content/launches/<date>-<name>/`: a folder per launch, holding side by side `plan/doc.mdx` (the short as proposed, and the release notes it was made from) and `short/`, the short itself with its script. Keep the plan out of `short/`: a folder with a video in it holds nothing else that is shown.
- `allyhub.config.ts`: the look (colours, fonts), once the person has agreed on it.

What this skill starts its files from (the columns of its sheets, a doc's headings) is in its `assets/content/`: copy into the project's `content/` what the project does not have yet.

## How it starts

You need what is launching and where it will be posted. In AllyHub Studio the person's first message is often this skill's prompt with its blanks filled in; ask in one message for what they have not said.

- What is launching: read the notes, changelog or page you are given whole before you write anything. If the product itself is reachable, look at the new feature there and capture it (`allyhub capture`), as a customer would see it.
- Where it will be posted decides the formats and their profiles (`tiktok`, `reels`, `shorts`, `linkedin`…: size, safe zone, length limit, loudness). If the person does not say, make 9:16 for TikTok, Reels and Shorts. The `linkedin` profile is square, 1080×1080; LinkedIn also plays vertical video, so a 9:16 short for LinkedIn is a format of its own, 1080×1920, kept clear of the same margins.
- Write the short you propose as its plan, in whatever shape suits it, say it in a few lines in the conversation, and make it once they agree. Once the first one is made, settle the look with the person and keep it.

## Making a short

- Unless the person says otherwise: 15–30 seconds, 9:16.
- What is heard is yours to choose, as what is seen is: AllyHub's built-in sound effects cost nothing; a generated voice or music comes from a cloud tool, which uses credits.
