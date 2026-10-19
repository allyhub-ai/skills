# AllyHub project

This folder is an AllyHub project: what is made here for the person, and everything that shapes how it is made, kept together for whoever works here next. The allyhub skill says how AllyHub works and where each file goes; if you do not have it, ask the person, then install it with `npx skills add allyhub-ai/skills --skill allyhub -g`.

- Before you start, read `.agents/memory/MEMORY.md`: what this project has learned, an index of a line per memory, each memory a file beside it. Keep there what is true of the project (its product, its brand, decisions, what works and what does not); what you know about the person you work with stays in your own memory.
- Add what you did today to `.agents/memory/notes/<date>.md`, a line each with the time; never rewrite earlier lines.
- `.agents/skills/` holds the skills this project works with. When none fits what is asked, `allyhub find "<the task>"` finds a skill or a tool, and `allyhub skill add <name>` adds a skill to the project.

## This project

AllyHub's public skills and their gallery at allyhub.com/skills.

- `skills/<name>/`: the skills it publishes, each an Agent Skill (`skills/README.md` is their convention). `skills/allyhub` comes from AllyHub's own repository at each release: do not edit it here.
- `content/skills/<name>/doc.mdx`: each skill's page in the gallery, for the people and agents choosing a skill: what it is, when to use it (and another skill instead), what you get, what it takes, how it works, questions. It describes the skill and never repeats its SKILL.md, which says how to do the work. Every claim on it is one the skill's SKILL.md supports. `describes` names the skill version the page was written for: when the skill changes, read the page again and bump it.
- `apps/skills/`: the gallery, a static site built from the skill index and those pages (its README says how).
- Nothing is pushed or published without the person's yes.
