import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { create, Header } from "tar";
import { parse } from "yaml";
import { z } from "zod";

const schema = "https://schemas.agentskills.io/discovery/0.2.0/schema.json";
const folders = new Set([
  "SKILL.md",
  "agents",
  "references",
  "scripts",
  "assets",
]);
const metadata = z
  .object({
    name: z
      .string()
      .max(64)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u),
    description: z.string().min(1).max(1024),
    license: z.string().optional(),
    compatibility: z.string().max(500).optional(),
    "allowed-tools": z.string().optional(),
    metadata: z
      .object({ version: z.string().regex(/^[1-9][0-9]*$/u) })
      .passthrough(),
  })
  .strict();
const words = z
  .object({
    display_name: z.string().min(1).max(24),
    short_description: z.string().min(1).max(56),
    default_prompt: z.string().min(1).max(600).optional(),
  })
  .strict();
const translatedWords = words.partial();
const studio = z
  .object({
    category: z.enum(["video", "writing", "research"]),
    order: z.number().int().positive(),
  })
  .strict();
type CardWords = z.infer<typeof translatedWords>;
interface Card {
  category: z.infer<typeof studio>["category"];
  order: number;
  title: string;
  summary: string;
  starter?: string;
  cover: string;
  version: number;
  locales: Record<
    string,
    { title?: string; summary?: string; starter?: string }
  >;
}
interface Entry {
  name: string;
  type: "archive";
  description: string;
  url: string;
  digest: string;
  allyhub?: Card;
}

async function yaml(path: string): Promise<unknown> {
  return parse(await readFile(path, "utf8")) as unknown;
}

const cardWords = (
  value: CardWords,
): { title?: string; summary?: string; starter?: string } => ({
  ...(value.display_name === undefined ? {} : { title: value.display_name }),
  ...(value.short_description === undefined
    ? {}
    : { summary: value.short_description }),
  ...(value.default_prompt === undefined
    ? {}
    : { starter: value.default_prompt }),
});

async function card(
  dir: string,
  files: string[],
  version: number,
): Promise<Card | undefined> {
  if (!files.includes("agents/allyhub.yaml")) return undefined;
  const own = studio.parse(await yaml(join(dir, "agents/allyhub.yaml")));
  const { interface: text } = z
    .object({ interface: words })
    .parse(await yaml(join(dir, "agents/openai.yaml")));
  const cover = await readFile(join(dir, "agents/allyhub/cover.svg"), "utf8");
  if (
    Buffer.byteLength(cover) > 4096 ||
    !/<svg\b[^>]*\bviewBox=["']0 0 320 180["']/u.test(cover)
  )
    throw new Error(
      `${dir}: the card needs a cover.svg with viewBox="0 0 320 180", at most 4 KB`,
    );
  if (
    /<(?:script|image|text|foreignObject|filter|linearGradient|radialGradient)\b|\bon[a-z]+\s*=|(?:href|url\()\s*["']?https?:/iu.test(
      cover,
    )
  )
    throw new Error(`${dir}: the cover must contain only local flat shapes`);
  const locales: Card["locales"] = {};
  for (const file of files) {
    const match = /^agents\/allyhub\/([a-z]{2,3}(?:-[a-z]{2,4})?)\.yaml$/u.exec(
      file,
    );
    if (match?.[1])
      locales[match[1]] = cardWords(
        translatedWords.parse(await yaml(join(dir, file))),
      );
  }
  return {
    ...own,
    title: text.display_name,
    summary: text.short_description,
    ...(text.default_prompt === undefined
      ? {}
      : { starter: text.default_prompt }),
    cover,
    version,
    locales,
  };
}

/** Sorted plain files only: archives never include hidden files or filesystem links. */
async function filesIn(dir: string, prefix = ""): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(join(dir, prefix), {
    withFileTypes: true,
  })) {
    if (entry.name.startsWith(".")) continue;
    const file = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...(await filesIn(dir, file)));
    else if (entry.isFile()) files.push(file);
    else
      throw new Error(
        `${dir}/${file}: skills can contain only plain files and folders`,
      );
  }
  return files.sort();
}

/** Portable ustar archives are also readable by AllyHub's discovery client. */
async function archive(dir: string, files: string[]): Promise<Buffer> {
  let size = 1024;
  for (const file of files) {
    const bytes = (await readFile(join(dir, file))).length;
    if (
      new Header({
        path: file,
        size: bytes,
        type: "File",
        mode: 0o644,
      }).encode()
    )
      throw new Error(
        `${dir}/${file}: the path or file is too large for a ustar archive`,
      );
    size += 512 + Math.ceil(bytes / 512) * 512;
  }
  if (size > 50 * 1024 * 1024)
    throw new Error(
      `${dir}: the skill exceeds the discovery client's 50 MB archive limit`,
    );
  const chunks: Buffer[] = [];
  const stream = create(
    {
      cwd: dir,
      portable: true,
      noMtime: true,
      noPax: true,
      strict: true,
      gzip: { level: 9 },
      noDirRecurse: true,
      onWriteEntry(entry) {
        if (entry.type !== "File" || !entry.stat)
          throw new Error(`${dir}/${entry.path}: not a plain file`);
        entry.stat.mode = 0o100644;
      },
    },
    files,
  );
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

/** Build from repository sources, without requiring an unreleased AllyHub CLI. */
export async function buildIndex(
  folder: string,
  output: string,
): Promise<{ $schema: string; skills: Entry[] }> {
  const entries: Entry[] = [];
  const archives = new Map<string, Buffer>();
  const directories = (await readdir(folder, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort();
  for (const name of directories) {
    const dir = join(folder, name);
    const files = await filesIn(dir);
    if (!files.includes("SKILL.md")) continue;
    for (const file of files) {
      if (!folders.has(file.split("/")[0] ?? ""))
        throw new Error(`${dir}/${file}: unsupported skill entry`);
    }
    const source = await readFile(join(dir, "SKILL.md"), "utf8");
    const front = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(source);
    if (!front) throw new Error(`${dir}/SKILL.md: missing YAML front matter`);
    const meta = metadata.parse(parse(front[1] ?? "") as unknown);
    if (meta.name !== basename(dir))
      throw new Error(`${dir}: the skill name must match its folder`);
    if (source.slice(front[0].length).split("\n").length > 500)
      throw new Error(
        `${dir}/SKILL.md: move detail beyond 500 lines into references`,
      );
    const bytes = await archive(dir, files);
    const url = `${name}.tar.gz`;
    const own = await card(dir, files, Number(meta.metadata.version));
    entries.push({
      name,
      type: "archive",
      description: meta.description,
      url,
      digest: `sha256:${createHash("sha256").update(bytes).digest("hex")}`,
      ...(own ? { allyhub: own } : {}),
    });
    archives.set(url, bytes);
  }
  const index = { $schema: schema, skills: entries };
  await mkdir(output, { recursive: true });
  for (const [name, bytes] of archives)
    await writeFile(join(output, name), bytes);
  await writeFile(
    join(output, "index.json"),
    `${JSON.stringify(index, null, 2)}\n`,
  );
  return index;
}

if (import.meta.main) {
  const app = fileURLToPath(new URL("..", import.meta.url));
  const index = await buildIndex(
    resolve(app, "../../skills"),
    join(app, "public/well-known/agent-skills"),
  );
  console.log(`Indexed ${index.skills.length} skills.`);
}
