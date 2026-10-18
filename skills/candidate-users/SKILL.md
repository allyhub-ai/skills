---
name: candidate-users
description: Find people who show in public that they have the problem a product solves (they ask how to do it, complain about what they use now, describe a workaround, or hire for it) with AllyHub's research tools, each with the post that shows it and why they fit, ranked by who to talk to first, and keep the search going round after round. Use when someone wants early users, beta testers, leads, prospects, people to interview, or their target users found on Reddit, LinkedIn, X, TikTok, forums or elsewhere.
license: MIT
compatibility: Needs the AllyHub CLI (npx -y allyhub, Node.js 22.19 or newer) and the allyhub skill (npx skills add allyhub-ai/skills --skill allyhub -g).
metadata:
  version: "2"
---

# Candidate users

## Before you start

This skill makes its work in an AllyHub project: the allyhub skill says how AllyHub works, where each file goes and how the project remembers. Read it first. If you do not have it, ask the person, then install it with `npx skills add allyhub-ai/skills --skill allyhub -g`.

If the folder is not an AllyHub project yet (it has no `allyhub.project.json`), start one there with `allyhub new <the folder> --skill candidate-users`, which also adds this skill to it; in a project that does not have this skill, `allyhub skill add candidate-users` adds it.

## What it is for

You run the person's research team for a product. You find people who show in public that they have the problem it solves: they ask how to do it, complain about what they use now, describe a workaround, or hire for it. The person decides who to contact; you never contact anyone. The project runs in rounds, each starting from what the last one found, so it keeps getting better at finding these people.

## What it keeps

- `content/product/doc.mdx`: the product brief, what it is and who it is for. `content/competitors/sheet.csv`: what people use instead today. Any later job in this project reads them.
- `content/candidate-users/profile/doc.mdx`: who we look for, the signals that give them away, where they talk, and who is not a fit. Read it before every round and keep it current.
- `content/candidate-users/candidates/`: one row per person or company, the list the person works from. `status` and `notes` are the person's: never write in them.
- `content/candidate-users/signals/`: one row per post that shows the problem, in the author's own words, dated.
- `content/candidate-users/searches/`: one row per search: where, what was asked, why, when it last ran, what it found and kept, and whether it is still worth running.
- `content/candidate-users/rounds/<date>/doc.mdx`: each round's report: who to contact first and why, what each source found, what people said in their own words, and what the next round will try.
- `assets/data/candidate-users/<date>/`: the raw results of each round, kept as they came.

What this skill starts its files from (the columns of its sheets, a doc's headings) is in its `assets/content/`: copy into the project's `content/` what the project does not have yet.

## How it starts

You need the product; who it is for and where they talk help. In AllyHub Studio the person's first message is often this skill's prompt with its blanks filled in; ask in one message for what they have not said. Ask only for the product if it is missing; work out the rest from the product itself and say what you assumed in the report.

## A round

Read what is already here, plan the searches, search, add the new people and signals (update the ones already found), then write the round's report. The first round aims at about 50 people, ranked, within the hour.

## Facts

- Search where these people talk, the places the person names first. For each search, choose the tool that does it best.
- AllyHub's research tools search X, Reddit, LinkedIn, Facebook, Instagram, TikTok, YouTube, app and product reviews, job posts and many others, and return what a web search cannot: the newest posts, sorted and filtered by date, with their authors, profiles and engagement. Most calls cost a fraction of a credit. Find the right one for each search with `allyhub find`, and use them wherever they reach.
- For a place no tool reaches (a forum, a community, a blog), read its public pages through a public API or `allyhub run`, at a polite pace. A page that needs a sign-in or blocks you is noted in `searches`, never worked around.
- Public information only, as it was posted: no guessed emails, nothing private.
- A row's key is `platform:handle` (`reddit:jdoe`), the same in every round.
- Dates are written in full (`2026-10-17`), as the source gives them.
- `allyhub sheet profile` measures a sheet too long to read whole.
- The first round has an hour. Run `date` as you go.
