// Publish the inspected tarballs attached to this repository's release.
// There are no workspace dependencies or private source files here.
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";

const dir = resolve(process.argv[2]);
const tag = process.argv[3] ?? "latest";
assert.ok(
  ["latest", "alpha", "next"].includes(tag),
  "Tag must be latest, alpha or next",
);
const release = JSON.parse(await readFile(join(dir, "release.json"), "utf8"));
assert.match(release.version, /^\d+\.\d+\.\d+(?:-[\w.-]+)?$/);
const names = new Set();
const packed = new Map();
// Validate everything before the first upload.
for (const p of release.packages) {
  assert.equal(basename(p.file), p.file);
  assert.match(p.file, /^[\w.-]+\.tgz$/);
  assert.ok(!names.has(p.name), `Duplicate package ${p.name}`);
  names.add(p.name);
  assert.ok(p.name === "allyhub" || /^@allyhub\/[\w-]+$/.test(p.name));
  const path = join(dir, p.file);
  assert.equal(
    createHash("sha512")
      .update(await readFile(path))
      .digest("hex"),
    p.sha512,
    p.file,
  );
  const manifest = JSON.parse(
    execFileSync("tar", ["-xOzf", path, "package/package.json"], {
      encoding: "utf8",
    }),
  );
  assert.equal(manifest.name, p.name);
  assert.equal(manifest.version, release.version);
  assert.equal(p.version, release.version);
  packed.set(p.name, manifest);
}
assert.equal(release.packages.at(-1)?.name, "allyhub", "Publish the CLI last");
const ready = new Set();
for (const p of release.packages) {
  const manifest = packed.get(p.name);
  for (const [name, range] of Object.entries({
    ...manifest.dependencies,
    ...manifest.optionalDependencies,
  })) {
    if (names.has(name)) {
      assert.equal(range, release.version);
      assert.ok(
        ready.has(name),
        `${p.name}: dependency ${name} must be published first`,
      );
    }
  }
  ready.add(p.name);
}
for (const p of release.packages) {
  // Use the install metadata. npm's full metadata can keep a cached 404
  // after a new package is already available to installers.
  const response = await fetch(
    `https://registry.npmjs.org/${encodeURIComponent(p.name)}`,
    {
      headers: { accept: "application/vnd.npm.install-v1+json" },
      signal: AbortSignal.timeout(30_000),
    },
  );
  assert.ok(
    response.ok || response.status === 404,
    `Cannot check ${p.name}: HTTP ${response.status}`,
  );
  const metadata = response.ok ? await response.json() : undefined;
  const existing = metadata?.versions?.[p.version];
  if (existing) {
    const expected = `sha512-${Buffer.from(p.sha512, "hex").toString("base64")}`;
    assert.equal(
      existing.dist?.integrity,
      expected,
      `${p.name}: npm already has different bytes for this version`,
    );
    console.log(
      `${p.name}@${p.version} is already published with the same hash; skipping`,
    );
    continue;
  }
  console.log(`Publishing ${p.name}@${p.version} (${tag})`);
  const result = spawnSync(
    "npm",
    [
      "publish",
      join(dir, p.file),
      "--access",
      "public",
      "--tag",
      tag,
      "--provenance=false",
    ],
    { stdio: "inherit" },
  );
  if (result.error) throw result.error;
  assert.equal(
    result.status,
    0,
    `Publishing ${p.name} failed; do not promote the release`,
  );
}
