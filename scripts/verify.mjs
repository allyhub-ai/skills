// npm accepts uploads before its publish-time scan makes them installable.
// Verify the public versions and hashes instead of treating upload as release.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { setTimeout } from "node:timers/promises";

const dir = resolve(process.argv[2]);
const tag = process.argv[3] ?? "latest";
const timeout = Number(process.argv[4] ?? 1_200_000);
assert.ok(
  Number.isFinite(timeout) && timeout > 0,
  "Timeout must be positive milliseconds",
);
const release = JSON.parse(await readFile(join(dir, "release.json"), "utf8"));
const deadline = Date.now() + timeout;
let pending = release.packages;
while (pending.length > 0) {
  const results = await Promise.all(
    pending.map(async (p) => {
      assert.ok(p.name === "allyhub" || /^@allyhub\/[\w-]+$/.test(p.name));
      const response = await fetch(
        `https://registry.npmjs.org/${encodeURIComponent(p.name)}?write=true`,
        {
          headers: { accept: "application/json" },
          signal: AbortSignal.timeout(30_000),
        },
      );
      if (
        response.status === 404 ||
        response.status === 429 ||
        response.status >= 500
      )
        return p;
      assert.ok(response.ok, `${p.name}: HTTP ${response.status}`);
      const metadata = await response.json();
      const version = metadata.versions?.[release.version];
      if (!version) return p;
      const expected = `sha512-${Buffer.from(p.sha512, "hex").toString("base64")}`;
      assert.equal(
        version.dist?.integrity,
        expected,
        `${p.name}: published archive differs`,
      );
      assert.equal(
        metadata["dist-tags"]?.[tag],
        release.version,
        `${p.name}: ${tag} does not point to this release`,
      );
      const archive = await fetch(
        version.dist.tarball.replace(/^http:/, "https:"),
        {
          method: "HEAD",
          signal: AbortSignal.timeout(30_000),
        },
      );
      if (
        archive.status === 404 ||
        archive.status === 429 ||
        archive.status >= 500
      )
        return p;
      assert.ok(archive.ok, `${p.name}: archive HTTP ${archive.status}`);
      console.log(
        `${p.name}@${release.version}: public hash and ${tag} verified`,
      );
      return undefined;
    }),
  );
  pending = results.filter((p) => p !== undefined);
  if (pending.length === 0) break;
  assert.ok(
    Date.now() < deadline,
    `Still unavailable after ${timeout} ms: ${pending.map((p) => p.name).join(", ")}. Check npm's scan or review status before retrying publication.`,
  );
  console.log(
    `Awaiting npm availability: ${pending.map((p) => p.name).join(", ")}`,
  );
  await setTimeout(Math.min(30_000, Math.max(1, deadline - Date.now())));
}
console.log(`Release ${release.version} is public with tag ${tag}.`);
