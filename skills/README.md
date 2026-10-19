# AllyHub's skills

Each folder here is an [Agent Skill](https://agentskills.io/specification): a `SKILL.md` with its front matter, and the files it reads. Every one is bundled with the CLI and published with it.

- `allyhub` is AllyHub itself: how to run it, the project and its skills, the contract, the piece API. It is the one skill installed for every folder (`npx skills add allyhub-ai/skills --skill allyhub -g`, `allyhub skill install --global`, or AllyHub Studio), and its description covers every kind of work, so an agent reads it whatever is asked.
- The others are **work skills**: each says how to make one kind of work in an AllyHub project (a demo film, an explainer, a round of research). A work skill is the project's: it is installed into the project as the skills CLI installs one with project scope, in `.agents/skills/<name>` with a link in `.claude/skills/<name>` (`allyhub skill add <name>`, `allyhub new <folder> --skill <name>`, Studio's gallery), never for every folder. The agent loads it the standard way; nothing of it is copied anywhere else in the project.

Adding a work skill is adding a folder. Nothing in Studio or the CLI changes. One is added only once it has been tried end to end with real agents on a real product; what we aim for when they are tried and improved is in `docs/project-skills/`.

## A work skill

```
<name>/                 lowercase words joined by -, the name in its front matter
  SKILL.md              the standard's front matter, then the instructions
  references/           what the body links to, read on demand
  scripts/              what the body runs
  assets/               what it starts files from (assets/content/: the columns of its sheets, a doc's headings), copied by the agent where the project lacks them
  agents/               what hosts show of the skill:
    openai.yaml           Codex's card (interface: display_name, short_description, default_prompt), which Studio shows too
    allyhub.yaml          Studio's card: what Codex's has not
    allyhub/cover.svg     its picture
    allyhub/<locale>.yaml the card's words in another language
```

Nothing else may be at its top level. `allyhub skill check <folder>` checks all of this; `apps/cli/test/skills.test.ts` runs it on every skill here.

## SKILL.md

The front matter is the standard's, and nothing else (another host's own fields break where they are not known):

```yaml
---
name: product-demos
description: What it makes, and when to use it (at most 1024 characters).
license: MIT
compatibility: Needs the AllyHub CLI (npx -y allyhub, Node.js 22.19 or newer) and the allyhub skill (npx skills add allyhub-ai/skills --skill allyhub -g).
metadata:
  version: "27"
---
```

`metadata.version` is a whole number, raised when the skill changes.

The body is for the agent, in English:

- `## Before you start`: it makes its work in an AllyHub project and **the allyhub skill** says how AllyHub works (the check asks for those words), how to get that skill when the agent lacks it, and that a folder that is not a project yet is started with `allyhub new <the folder> --skill <name>`, a project without the skill given it with `allyhub skill add <name>`.
- `## What it is for`: what it makes, in a few lines.
- `## How it starts`: what the agent needs from the person. In Studio the person's first message is often the card's prompt with its blanks filled in; the agent asks in one message for what they have not said.
- Anything the work needs that the allyhub skill does not say: which kinds of AllyHub tools to look for (by kind, such as "the Meta and TikTok ad libraries"; find the exact tool with `allyhub find`), what the result looks like and where it goes (a doc, its tables, the data kept as CSV), what needs the person's yes. What the project already has (its brief, its brand, its kit, made by another skill or an earlier round) is read and built on, never made again.

Short and concrete, at most 500 lines (the standard's limit; move detail to `references/`). It says what a kind of work hands back and where, the person's limits (time, money, what needs their yes) and facts the agent cannot work out. No craft: no named techniques, timings, storyboard formats or review checklists, which a strong model then follows instead of judging. No styles and no kit of components: the agent researches the client's brand and builds the brand's own kit in the project.

## Studio's card

A skill with `agents/allyhub.yaml` is offered in Studio's gallery and on Home; one without is a skill Studio does not offer (`allyhub` itself). The card's words are Codex's, in `agents/openai.yaml`:

```yaml
interface:
  display_name: Product demos
  short_description: Your product, shown by using it
  default_prompt: "Use the product-demos skill: make a demo of [your product’s URL] for [who it’s for]."
```

- `display_name`: its name on the card, at most 24 characters, sentence case.
- `short_description`: one line on the card, at most 56 characters, no full stop.
- `default_prompt`: what the composer starts with, at most 600 characters: one or two sentences in the person's voice that name the skill ("Use the <name> skill: …", which every agent finds it by), with what they must say in square brackets, `[your product’s URL]`. Home draws each as a field and Tab moves between them. Optional.

`agents/allyhub.yaml` says only what Codex's card has no field for:

```yaml
category: video
order: 1
```

- `category`: `video`, `writing` or `research`.
- `order`: where it stands in its category, from 1.

No other field is read: a card with one is not right, and Studio leaves the skill out and says why.

### cover.svg

A flat picture of what the skill makes, in AllyHub's look (`packages/ui/IDENTITY.md`). It is Home's card for the skill, so it shows the work itself, not a symbol for it: the product's screen with a cursor and a caption for a demo, a slide with its diagram for an explainer, a vertical short for a launch. Lines stand for words.

- `viewBox="0 0 320 180"`, no `width` or `height`.
- Flat shapes only: no text, no gradients, no filters, no images, no scripts, no external references. At most 4 KB.
- Colours, fixed: paper `#F7F7F6`, sheet `#FFFFFF`, stone `#EFEFED`, rule `#DFDFDC`, lead `#605F5A`, ink `#1B1B19`, and the category's own colour: video `#4C7198`, writing `#3F8468`, research `#84608F` (lighter with `opacity`). A cover sits on its category's tint, so the ground is the category colour at low opacity over paper.
- The covers of a category are one family: the same ground, the same weight of line, a different subject.

### Other languages

The card's words are written in English. What a person reads of them can be written again for each language Studio is in (`@allyhub/i18n`'s `LOCALES`: `zh-cn`, `ja`, `fr`…), in `allyhub/<locale>.yaml`: any of `display_name`, `short_description` and `default_prompt`, with the same limits; no other field. A field it leaves out is the English one. A prompt in another language names the skill in that language's words ("使用 product-demos 技能：…").

Studio shows the gallery and Home in the language it is shown in. `SKILL.md` is for the agent and stays English: the agent is told which language the person reads, and writes to them in it. A file for a language Studio is not in is left out and said so; the skill is still offered.
