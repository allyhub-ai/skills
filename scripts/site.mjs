// AllyHub's skill gallery, drawn from its skill index alone: a page for
// every skill whose entry carries Studio's card, and one listing them, as
// static HTML. The index and the archives are built first by
// `allyhub skill index skills --out <site>/well-known/agent-skills`; this
// writes <site>/skills/. allyhub.com serves the site's well-known/ at
// /.well-known/ and skills/ at /skills/. Node's own modules only.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const site = resolve(process.argv[2] ?? "site");
const repo = process.env.GITHUB_REPOSITORY ?? "allyhub-ai/skills";
const index = JSON.parse(
  await readFile(join(site, "well-known/agent-skills/index.json"), "utf8"),
);

const escape = (text) =>
  String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const CATEGORIES = { video: "Video", writing: "Writing", research: "Research" };

/** A cover as a picture: its own SVG, which runs nothing (allyhub skill check). */
const cover = (skill) =>
  `<img src="/skills/${escape(skill.name)}/cover.svg" alt="" width="320" height="180">`;

const page = (title, description, body) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title>
<meta name="description" content="${escape(description)}">
<style>
:root{--paper:#F7F7F6;--sheet:#FFFFFF;--rule:#DFDFDC;--lead:#605F5A;--ink:#1B1B19;color-scheme:light dark}
@media (prefers-color-scheme:dark){:root{--paper:#1B1B19;--sheet:#242422;--rule:#3A3A37;--lead:#A8A7A1;--ink:#F2F2F0}}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:1040px;margin:0 auto;padding:48px 24px 80px}
h1,h2{font-family:Georgia,"Times New Roman",serif;font-weight:600;line-height:1.2}
h1{font-size:2.25rem;margin:0 0 8px}
h2{font-size:1.125rem;margin:32px 0 12px}
a{color:inherit}
p.lead{color:var(--lead);margin:0 0 32px;max-width:60ch}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:24px}
.card{display:block;text-decoration:none}
.card img,.cover img{display:block;width:100%;height:auto;aspect-ratio:16/9;border:1px solid var(--rule);border-radius:6px;background:var(--sheet)}
.card strong{display:block;margin-top:10px;font-family:Georgia,serif}
.card span{display:block;color:var(--lead);font-size:.875rem}
.cover{max-width:480px;margin:24px 0}
pre{margin:0 0 12px;padding:12px 14px;background:var(--sheet);border:1px solid var(--rule);border-radius:6px;overflow-x:auto;font:14px/1.5 ui-monospace,Menlo,monospace}
small{color:var(--lead)}
nav{font-size:.875rem;margin-bottom:24px}
</style>
</head>
<body><main>${body}</main></body>
</html>
`;

const skills = index.skills
  .filter((skill) => skill.allyhub && skill.name !== "allyhub")
  .sort(
    (a, b) =>
      Object.keys(CATEGORIES).indexOf(a.allyhub.category) -
        Object.keys(CATEGORIES).indexOf(b.allyhub.category) ||
      a.allyhub.order - b.allyhub.order ||
      a.name.localeCompare(b.name),
  );

await mkdir(join(site, "skills"), { recursive: true });
const sections = Object.entries(CATEGORIES)
  .map(([category, heading]) => {
    const own = skills.filter((skill) => skill.allyhub.category === category);
    if (own.length === 0) return "";
    return `<h2>${heading}</h2><div class="grid">${own
      .map(
        (skill) =>
          `<a class="card" href="/skills/${escape(skill.name)}/">${cover(skill)}<strong>${escape(skill.allyhub.title)}</strong><span>${escape(skill.allyhub.summary)}</span></a>`,
      )
      .join("")}</div>`;
  })
  .join("");
await writeFile(
  join(site, "skills/index.html"),
  page(
    "AllyHub skills",
    "Agent Skills for Codex, Claude Code and AllyHub Studio: each adds one kind of work to a project.",
    `<h1>AllyHub skills</h1><p class="lead">Each one adds a kind of work to a project, for Codex, Claude Code or AllyHub Studio. The skills are open source (MIT); the AllyHub CLI they run on is free to use on your computer.</p>${sections}`,
  ),
);

for (const skill of skills) {
  const dir = join(site, "skills", skill.name);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "cover.svg"), skill.allyhub.cover);
  await writeFile(
    join(dir, "index.html"),
    page(
      `${skill.allyhub.title} · AllyHub skills`,
      skill.description,
      `<nav><a href="/skills/">AllyHub skills</a></nav>
<h1>${escape(skill.allyhub.title)}</h1>
<p class="lead">${escape(skill.description)}</p>
<div class="cover">${cover(skill)}</div>
<h2>Add it to a project</h2>
<p>In the project's folder, with the allyhub skill it works with:</p>
<pre>npx -y allyhub skill add ${escape(skill.name)}</pre>
<p>Or with the skills CLI, then the allyhub skill for every folder:</p>
<pre>npx skills add https://allyhub.com --skill ${escape(skill.name)}
npx skills add https://allyhub.com --skill allyhub -g</pre>
<p>Then ask your agent:</p>
<pre>${escape(skill.allyhub.starter ?? `Use the ${skill.name} skill.`)}</pre>
<p><small>Version ${escape(skill.allyhub.version)} · <a href="https://github.com/${escape(repo)}/tree/main/skills/${escape(skill.name)}">Source</a> · MIT</small></p>`,
    ),
  );
}
console.log(`Wrote the gallery of ${String(skills.length)} skills to ${join(site, "skills")}`);
