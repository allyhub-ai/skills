# A project: how it starts, its skills, and how it remembers

A project is a folder the person comes back to for the next piece of work. Keep what you make, and what you learn, where the next round will find it; earlier work is a reference for new work, not something to tidy away. Where each file goes is in [core.md](core.md#a-workspace); before you write one, ask which it is:

- What you write for the person to read (a plan, a brief, a summary of what you did) is a doc: they read and edit it as a page.
- What you gather as rows (leads, findings, a calendar, numbers) is a sheet: they sort, filter and edit it as a grid.
- A file the person asked for that is none of these (a PDF, a picture) may lie loose in `content/`, beside the items.
- Save an asset you will use again (a logo, music, a picture) to `assets/media/` the first time you make or download it, under a name that says what it is.

## How it starts

`allyhub new <folder>` starts one: the folders, `.agents/memory/MEMORY.md`, `allyhub.config.ts`, a `.gitignore` with `.local/`, `allyhub.project.json` (which project this is), and `AGENTS.md` with `CLAUDE.md` (which brings it in for Claude Code). With `--skill <name or folder>` it also adds a skill (`allyhub new . --skill product-demos`).

## Its skills

Everything that shapes how the work is made lives in the project, so whoever works on it next, with the same agent, starts from the same place. The skills it works with are in `.agents/skills/`, a folder each, where Codex and most agents read skills; `.claude/skills/` links to them for Claude Code. Only this skill, allyhub, is installed for every folder.

- A skill there says how to make one kind of work (a demo film, an explainer, a round of research): use it when that is what is asked.
- When none fits, `allyhub find "<the task>"` names the skills AllyHub has and its tools for the job; `allyhub skill add <name>` adds a skill to the project (`allyhub skill list` lists what it has).
- Leave an installed skill as it is: a newer version replaces it whole. What the project teaches you goes in its `AGENTS.md` and its memory; a way of working the project repeats can become a skill of its own, which you write in `.agents/skills/<name>/` as a standard Agent Skill.

## AGENTS.md

The project's standing instructions: read it before you work and follow it. It is the project's own from the moment it starts. When the person tells you something that should hold from now on, tell them you will keep it there, and write it once they agree, under a heading of its own such as `## About this project`: who it is for, the brand (its name, its voice, its colours, what it never says), where what you make will be seen, the decisions that stand. Keep it short.

## The memory

The project remembers in `.agents/memory/`, for any agent that works there. Write there what is true of the project; what you know about the person you work with stays in your own memory, which is yours and not the project's.

- `MEMORY.md` is the index of what holds from now on, a line per memory: `- [Captions](captions.md) — sentence case, never all caps`. Read it before you start; it must stay short, so a line is a pointer, never the memory itself.
- Each memory is a file beside it, one fact or decision each, with a short front matter and the fact under it, then why it holds:

  ```markdown
  ---
  name: captions
  description: Captions are in sentence case, never all caps
  type: feedback
  ---

  Captions are in sentence case, never all caps. The person turned down all caps twice: it reads as shouting.
  ```

  `type` is `project` (a fact about the product, the brand, the audience or a decision), `feedback` (what the person likes and has turned down) or `reference` (where something is). Before you write one, look for the file that already says it and change that; remove a memory that no longer holds.
- `notes/<date>.md` is the log of each day there is work, one file a day, named for this computer's date (`date '+%Y-%m-%d'`, never another time zone): what you were asked, what you tried, made and decided, what went wrong and why. Start each line with the time (`date '+%H:%M'`). Add to the end of the day's file and do not rewrite earlier lines. Before you start, read the last day's notes; search the others when you need them rather than reading them all.

  `14:05 The person turned down the blue end card: they want the brand's ink colour.`

- When something in a day's notes will hold beyond that day, make it a memory too. When a memory should hold as a rule, tell the person and move it into `AGENTS.md` once they agree.

## Working files

`.local/work/` is yours, for what may be thrown away: experiments, downloaded references, review sheets, drafts, files a script writes on the way. When a task ends, clear out of it what you no longer need. Whatever the project needs must not live only there.
