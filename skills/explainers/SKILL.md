---
name: explainers
description: Make explainer videos with AllyHub — how a product, a feature or an idea works, in about a minute, in motion graphics, as a series that keeps the same terms and the same look from one explainer to the next. Use when someone wants an explainer, an animated overview, or a video that teaches how something works.
license: MIT
compatibility: Needs the AllyHub CLI (npx -y allyhub, Node.js 22.19 or newer) and the allyhub skill (npx skills add allyhub-ai/skills --skill allyhub -g).
metadata:
  version: "6"
---

# Explainers

## Before you start

This skill makes its work in an AllyHub project: the allyhub skill says how AllyHub works, where each file goes and how the project remembers. Read it first. If you do not have it, ask the person, then install it with `npx skills add allyhub-ai/skills --skill allyhub -g`.

If the folder is not an AllyHub project yet (it has no `allyhub.project.json`), start one there with `allyhub new <the folder> --skill explainers`, which also adds this skill to it; in a project that does not have this skill, `allyhub skill add explainers` adds it.

## What it is for

Explainers: how a product, a feature or an idea works, in about a minute, with motion graphics. The first round makes one; later rounds explain the next thing in the same words and the same look, so the explainers read as a series.

## What it keeps

- `content/glossary/doc.mdx`: the terms these explainers use, each with the plain words it is explained in. Read it before every round, add a term when one comes up, and use the same words each time.
- `components/`: the graphics an explainer is built from (a diagram, a chart, a labelled shape), written once and reused.
- `allyhub.config.ts`: the look (colours, fonts), once the person has agreed on it.
- `content/explainers/<name>/`: a folder per explainer, holding two things side by side: `plan/doc.mdx`, the explainer as proposed, and `video/`, the explainer itself with its script. Keep the plan out of `video/`: a folder with a video in it holds nothing else that is shown.

What this skill starts its files from (the columns of its sheets, a doc's headings) is in its `assets/content/`: copy into the project's `content/` what the project does not have yet.

## How it starts

You need what to explain, who it is for, and whether they want narration. In AllyHub Studio the person's first message is often this skill's prompt with its blanks filled in; ask in one message for what they have not said.

- What to explain, and for whom, sets the level: a newcomer, a customer, an engineer. If it is unclear, ask one question, not several. If they do not say, aim it at a newcomer, without narration.
- If there is a source (a page, a doc, a diagram), read it before you write anything. Never guess how something works: ask.
- Write the explainer you propose as its plan, in whatever shape suits it, say it in a few lines in the conversation, and make it once they agree.

## Making an explainer

- Unless the person says otherwise: 16:9, about 60 seconds; 9:16 or 1:1 when they ask.
- What is heard is yours to choose, as what is seen is. AllyHub's AI models make a voice and music that code alone does not match, with the account's credits (`allyhub find` names the one for each); its built-in sound effects are free.
