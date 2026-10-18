# The skill gallery

allyhub.com/skills: a page per skill for the people and agents choosing one, built as static HTML with Astro from two things in this project:

- the skill index, `public/well-known/agent-skills/` (`npm run index`: `allyhub skill index` checks every skill in `../../skills` and writes the Agent Skills discovery index and an archive per skill), which gives each skill's name, promise, prompt, cover and version;
- each skill's page doc, `../../content/skills/<name>/doc.mdx`, read by its headings: the title and the paragraph under it (the definition), `When to use it` (its list, then `Use another skill for:` and theirs), `What you get`, `What it takes`, `How it works`, `Questions` (a `###` per question). `content/gallery/doc.mdx` is the gallery's own: its title, definition and questions.

A skill without a page doc is left out of the gallery. A page whose `describes` names another version than the skill's is built, with a warning.

What agents and crawlers get besides each page: its words as Markdown (`/skills/<name>.md`), `/skills/llms.txt` and `/skills/llms-full.txt`, `/skills/sitemap.xml`, and schema.org data in each page (the skill, its questions, the breadcrumb). Links within the site are paths under `/skills/`, and styles are inline, because allyhub.com forwards only `/skills/` and `/.well-known/agent-skills/` here.

```bash
npm ci
npm run index
npm run dev     # or: npm run build, then npm run preview
```
