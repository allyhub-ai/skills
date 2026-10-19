// What the gallery is made of: the skill index (the Agent Skills discovery
// standard, built by `scripts/index.ts` into public/.well-known/) and a
// page doc per skill in the project's content/skills/<name>/doc.mdx, read
// by its headings. Everything here runs at build time.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { marked } from "marked";

export const ORIGIN = "https://allyhub.com";
export const BASE = `${ORIGIN}/skills`;
export const GITHUB = "https://github.com/allyhub-ai/skills";
export const INDEX_URL = `${ORIGIN}/.well-known/agent-skills/index.json`;
export const AGENTS = ["Claude Code", "Codex", "AllyHub Studio"];
export const CATEGORIES: Record<string, string> = {
  video: "Video",
  writing: "Writing",
  research: "Research",
};

const APP = process.cwd();
const PROJECT = resolve(APP, "../..");
const INDEX = join(APP, "public/.well-known/agent-skills/index.json");

interface Card {
  category: string;
  order: number;
  title: string;
  summary: string;
  starter?: string;
  cover: string;
  version: number;
}
interface Entry {
  name: string;
  description: string;
  url: string;
  digest: string;
  allyhub?: Card;
}

export interface Question {
  question: string;
  answer: string;
}

/** A page doc: its title, the paragraph under it, and its sections by heading. */
export interface PageDoc {
  title: string;
  definition: string;
  sections: Record<string, string>;
  questions: Question[];
  describes?: number;
}

export interface Skill {
  name: string;
  card: Card;
  page: PageDoc;
  updated: string;
  prompt: string;
  install: string;
  url: string;
  /** The page's path, for links within the site. */
  path: string;
}

export function readDoc(path: string): PageDoc {
  const source = readFileSync(path, "utf8");
  const describes = /export const describes = \{[^}]*version:\s*(\d+)/u.exec(source);
  const doc = source.replace(/^export .*\n+/gmu, "");
  const head = /^# (.+)\n+([\s\S]*)$/u.exec(doc);
  if (!head) throw new Error(`${path} does not start with its title`);
  const [definition = "", ...parts] = (head[2] ?? "").split(/^## /mu);
  const sections: Record<string, string> = {};
  for (const part of parts) {
    const [heading = "", ...body] = part.split("\n");
    sections[heading.trim()] = body.join("\n").trim();
  }
  const questions = (sections["Questions"] ?? "")
    .split(/^### /mu)
    .filter((q) => q.trim())
    .map((q) => {
      const [question = "", ...answer] = q.split("\n");
      return { question: question.trim(), answer: answer.join("\n").trim() };
    });
  return {
    title: head[1] ?? "",
    definition: definition.trim(),
    sections,
    questions,
    describes: describes ? Number(describes[1]) : undefined,
  };
}

/** The last commit that touched any of these paths, as a date. */
function updatedOf(paths: string[]): string {
  try {
    return execFileSync("git", ["-C", PROJECT, "log", "-1", "--format=%cs", "--", ...paths], {
      encoding: "utf8",
    }).trim();
  } catch {
    return "";
  }
}

let cached: Skill[] | undefined;

/** Every skill with Studio's card and a page doc, in the gallery's order. */
export function skills(): Skill[] {
  if (cached) return cached;
  const index = JSON.parse(readFileSync(INDEX, "utf8")) as { skills: Entry[] };
  const found: Skill[] = [];
  for (const entry of index.skills) {
    const card = entry.allyhub;
    if (!card || entry.name === "allyhub") continue;
    const docPath = join(PROJECT, "content/skills", entry.name, "doc.mdx");
    let page: PageDoc;
    try {
      page = readDoc(docPath);
    } catch (error) {
      console.warn(`${entry.name}: no page (${String(error)}); left out of the gallery`);
      continue;
    }
    if (page.describes !== undefined && page.describes !== card.version)
      console.warn(
        `${entry.name}: its page describes version ${page.describes}; the skill is at ${card.version}`,
      );
    const starter = card.starter ?? `Use the ${entry.name} skill.`;
    found.push({
      name: entry.name,
      card,
      page,
      updated: updatedOf([`skills/${entry.name}`, `content/skills/${entry.name}`]),
      // The skill's address in the prompt lets an agent without it find it.
      prompt: starter.replace(
        `Use the ${entry.name} skill`,
        `Use the ${entry.name} skill (allyhub.com/skills/${entry.name})`,
      ),
      install: `npx skills add https://allyhub.com --skill ${entry.name}`,
      url: `${BASE}/${entry.name}/`,
      path: `/skills/${entry.name}/`,
    });
  }
  const order = Object.keys(CATEGORIES);
  cached = found.sort(
    (a, b) =>
      order.indexOf(a.card.category) - order.indexOf(b.card.category) ||
      a.card.order - b.card.order,
  );
  return cached;
}

export const gallery = (): PageDoc => readDoc(join(PROJECT, "content/gallery/doc.mdx"));

/** Links within the site, as a page doc writes them, made whole for Markdown readers. */
export const whole = (markdown: string): string =>
  markdown.replaceAll("](/skills/", `](${BASE}/`);

export const html = (markdown: string): string => marked.parse(markdown, { async: false });
export const inline = (markdown: string): string => marked.parseInline(markdown, { async: false });
export const plain = (markdown: string): string => inline(markdown).replace(/<[^>]+>/gu, "");

/** A skill's page as Markdown: the same words, for agents. */
export function skillMarkdown(skill: Skill): string {
  const { page, card } = skill;
  const parts = Object.entries(page.sections)
    .map(([heading, body]) => `## ${heading}\n\n${whole(body)}`)
    .join("\n\n");
  return `# ${page.title}

> ${card.summary}.

${page.definition}

## Start

Ask your agent, filling in the brackets:

\`\`\`text
${skill.prompt}
\`\`\`

Or add it to a project's folder: \`${skill.install}\`. In AllyHub Studio: New project, ${CATEGORIES[card.category] ?? card.category}, ${page.title}.

${parts}

---

Version ${card.version}${skill.updated ? `, updated ${skill.updated}` : ""} · MIT · [Source](${GITHUB}/tree/main/skills/${skill.name}) · [All skills](${BASE}/llms.txt)
`;
}

/** The gallery as llms.txt: what it is, how to start, a link per skill. */
export function llmsText(): string {
  const doc = gallery();
  const groups = Object.entries(CATEGORIES)
    .map(([category, heading]) => {
      const own = skills().filter((s) => s.card.category === category);
      return own.length
        ? `## ${heading}\n\n${own.map((s) => `- [${s.page.title}](${BASE}/${s.name}.md): ${s.page.definition}`).join("\n")}`
        : "";
    })
    .filter(Boolean)
    .join("\n\n");
  return `# ${doc.title}

> ${doc.definition}

Each skill's page says what it is, when to use it, what you get and what it takes. Add one to a project's folder with \`npx skills add https://allyhub.com --skill <name>\`. The machine-readable list is the Agent Skills discovery index: ${INDEX_URL}

${groups}

## Optional

- [Every skill page in one file](${BASE}/llms-full.txt)
- [Source on GitHub](${GITHUB})
`;
}
