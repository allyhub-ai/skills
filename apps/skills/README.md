# The skill gallery

allyhub.com/skills: a page per skill for the people and agents choosing one, built as static HTML with Astro from two things in this project:

- the skill index, `public/well-known/agent-skills/` (`npm run index`: the local index builder validates skill metadata and cards in `../../skills` and writes the Agent Skills discovery index and an archive per skill), which gives each skill's name, promise, prompt, cover and version;
- each skill's page doc, `../../content/skills/<name>/doc.mdx`, read by its headings: the title and the paragraph under it (the definition), `When to use it` (its list, then `Use another skill for:` and theirs), `What you get`, `What it takes`, `How it works`, `Questions` (a `###` per question). `content/gallery/doc.mdx` is the gallery's own: its title, definition and questions.

A skill without a page doc is left out of the gallery. A page whose `describes` names another version than the skill's is built, with a warning.

What agents and crawlers get besides each page: its words as Markdown (`/skills/<name>.md`), `/skills/llms.txt` and `/skills/llms-full.txt`, `/skills/sitemap.xml`, and schema.org data in each page (the skill, its questions, the breadcrumb). It is served by a Cloudflare Worker (`worker/index.ts`, `wrangler.jsonc`) whose static assets are the built site, on allyhub.com's `/skills/*` and `/.well-known/agent-skills/*` routes; the rest of allyhub.com never reaches it. The Worker serves the index from the build's `well-known/` at `/.well-known/agent-skills/`, answers a page with its Markdown copy when the request prefers `text/markdown`, and names that copy in a `Link` header on every page. Links within the site are paths under `/skills/`, and styles are inline, so nothing is needed from elsewhere on allyhub.com.

```bash
npm ci
npm run index
npm test        # index archives, metadata and gallery cards
npm run dev     # the pages alone, as you edit
npm run build && npm run serve   # the built site through the Worker, as allyhub.com serves it
npm run deploy  # by hand; CI deploys main (.github/workflows/gallery.yml)
```
