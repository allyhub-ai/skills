import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  access,
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  utimes,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test, type TestContext } from "node:test";
import { extract, list } from "tar";
import { buildIndex } from "./index.ts";

async function fixture(
  t: TestContext,
): Promise<{ root: string; skills: string; output: string }> {
  const root = await mkdtemp(join(tmpdir(), "allyhub-gallery-index-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const skills = join(root, "skills");
  await mkdir(join(skills, "sample"), { recursive: true });
  await writeFile(
    join(skills, "sample/SKILL.md"),
    "---\nname: sample\ndescription: A sample skill\nmetadata:\n  version: '2'\n---\n\n# Sample\n",
  );
  return { root, skills, output: join(root, "output") };
}

test("archives keep root files and bytes, with stable digests across timestamps and modes", async (t) => {
  const { root, skills, output } = await fixture(t);
  await mkdir(join(skills, "sample/assets/data"), { recursive: true });
  const data = Buffer.from([0, 1, 2, 255]);
  const path = join(skills, "sample/assets/data/sample.bin");
  await writeFile(path, data);
  await writeFile(join(skills, "sample/.private"), "not included");
  const first = await buildIndex(skills, output);
  const entry = first.skills[0];
  assert.ok(entry);
  const bytes = await readFile(join(output, entry.url));
  assert.equal(
    entry.digest,
    `sha256:${createHash("sha256").update(bytes).digest("hex")}`,
  );
  const files: string[] = [];
  await list({
    file: join(output, entry.url),
    onReadEntry(file) {
      assert.equal(file.type, "File");
      files.push(file.path);
    },
  });
  assert.deepEqual(files, ["SKILL.md", "assets/data/sample.bin"]);
  const unpacked = join(root, "unpacked");
  await mkdir(unpacked);
  await extract({ file: join(output, entry.url), cwd: unpacked });
  assert.deepEqual(
    await readFile(join(unpacked, "assets/data/sample.bin")),
    data,
  );
  await utimes(path, new Date(1000), new Date(2000));
  await chmod(path, 0o755);
  const second = await buildIndex(skills, output);
  assert.deepEqual(second, first);
  assert.deepEqual(await readFile(join(output, entry.url)), bytes);
});

test("Studio cards include prompts, versions, covers and translated words", async (t) => {
  const { skills, output } = await fixture(t);
  await mkdir(join(skills, "sample/agents/allyhub"), { recursive: true });
  await writeFile(
    join(skills, "sample/agents/allyhub.yaml"),
    "category: video\norder: 1\n",
  );
  await writeFile(
    join(skills, "sample/agents/openai.yaml"),
    "interface:\n  display_name: Sample\n  short_description: A sample\n  default_prompt: Use the sample skill\n",
  );
  const cover =
    '<svg viewBox="0 0 320 180"><rect width="320" height="180" /></svg>';
  await writeFile(join(skills, "sample/agents/allyhub/cover.svg"), cover);
  await writeFile(
    join(skills, "sample/agents/allyhub/es.yaml"),
    "display_name: Ejemplo\nshort_description: Un ejemplo\n",
  );
  const index = await buildIndex(skills, output);
  assert.deepEqual(index.skills[0]?.allyhub, {
    category: "video",
    order: 1,
    title: "Sample",
    summary: "A sample",
    starter: "Use the sample skill",
    cover,
    version: 2,
    locales: { es: { title: "Ejemplo", summary: "Un ejemplo" } },
  });
});

test("invalid skill metadata fails before any output is published", async (t) => {
  const { skills, output } = await fixture(t);
  await writeFile(
    join(skills, "sample/SKILL.md"),
    "---\nname: different\ndescription: Wrong folder\nmetadata:\n  version: '1'\n---\n",
  );
  await assert.rejects(buildIndex(skills, output), /name must match/u);
  await assert.rejects(access(output), { code: "ENOENT" });
});

test("archives reject filesystem links and paths that would require extended headers", async (t) => {
  const { root, skills, output } = await fixture(t);
  await writeFile(join(root, "outside"), "outside");
  const link = join(skills, "sample/assets");
  await symlink(join(root, "outside"), link);
  await assert.rejects(buildIndex(skills, output), /plain files/u);
  await rm(link);
  const directory = join(skills, "sample/assets", "a".repeat(180));
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, "b".repeat(100)), "long path");
  await assert.rejects(buildIndex(skills, output), /ustar archive/u);
  await assert.rejects(access(output), { code: "ENOENT" });
});
