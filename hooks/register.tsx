import { atom, read, update } from "claude-code";
import type { EngineInterface, Register } from "claude-code";

import type { AllyhubItem, AllyhubStatus } from "../types";

// AllyHub in Claude Code: a pane with the workspace's project card (each
// video and deck, whether the check passed, exports and their files), kept
// up to date while the preview runs, with buttons that open the editor
// (`allyhub dev`) in the app's browser pane. The pane opens when the agent
// starts working with AllyHub, and when a turn ends the editor is put back
// in front if it was closed.
//
// The preview is found through `.claude/launch.json` (the entries
// `allyhub launch-config` writes) or the usual workspace folders, and read
// from its `.allyhub/dev.json`: its port and the agent's token, which
// GET /agent/status takes.

const PANE = "allyhub";
const TITLE = "AllyHub";
const POLL_MS = 3000;
const status = atom({ plugin: "allyhub", key: "status" } as const, null);

type Engine = EngineInterface;

/** "allyhub", "allyhub@1.2.3", or a path to the CLI's script. */
const ALLYHUB = /(^|[/\\])allyhub(@[\w.-]+)?(\.js)?$/;

interface LaunchEntry {
  name?: unknown;
  runtimeExecutable?: unknown;
  runtimeArgs?: unknown;
}

const join = (dir: string, path: string) =>
  path.startsWith("/") ? path : `${dir.replace(/\/$/, "")}/${path}`;

/** Where a preview may run: launch entries first, then the usual folders. */
async function workspaces(
  $: Engine,
): Promise<{ dir: string; launch?: string }[]> {
  let root: string;
  try {
    root = await $.session.root();
  } catch {
    return [];
  }
  const out: { dir: string; launch?: string }[] = [];
  try {
    const json = JSON.parse(
      await $.fs.read(join(root, ".claude/launch.json")),
    ) as { configurations?: LaunchEntry[] };
    for (const c of json.configurations ?? []) {
      const args = Array.isArray(c.runtimeArgs)
        ? c.runtimeArgs.filter((a): a is string => typeof a === "string")
        : [];
      const all = [
        typeof c.runtimeExecutable === "string" ? c.runtimeExecutable : "",
        ...args,
      ];
      const at = args.indexOf("dev");
      if (at < 0 || !all.some((a) => ALLYHUB.test(a))) continue;
      const next = args[at + 1];
      const folder = next === undefined || next.startsWith("-") ? "." : next;
      out.push({
        dir: join(root, folder),
        ...(typeof c.name === "string" ? { launch: c.name } : {}),
      });
    }
  } catch {
    // No launch file, or not JSON: the usual folders below.
  }
  for (const dir of [join(root, "allyhub"), root]) {
    if (!out.some((o) => o.dir === dir)) out.push({ dir });
  }
  return out;
}

/** Reads the running preview's status into the pane's state. */
async function refresh($: Engine): Promise<AllyhubStatus | null> {
  for (const w of await workspaces($)) {
    let dev: { port?: number; agentToken?: string };
    try {
      dev = JSON.parse(await $.fs.read(join(w.dir, ".allyhub/dev.json"))) as {
        port?: number;
        agentToken?: string;
      };
    } catch {
      continue;
    }
    if (typeof dev.port !== "number" || typeof dev.agentToken !== "string") {
      continue;
    }
    try {
      const res = await $.http.fetch(
        `http://127.0.0.1:${String(dev.port)}/agent/status`,
        { headers: { "x-allyhub-agent": dev.agentToken } },
      );
      if (!res.ok) continue;
      const found = {
        ...(JSON.parse(res.text) as Omit<AllyhubStatus, "workspace">),
        workspace: w.dir,
        ...(w.launch ? { launch: w.launch } : {}),
      } satisfies AllyhubStatus;
      await update($, status, () => found);
      return found;
    } catch {
      // Not answering (stopped): try the next one.
    }
  }
  await update($, status, (prev) => (prev ? { ...prev, offline: true } : prev));
  return null;
}

/** Opens a page of the editor in the app's browser pane. */
async function openEditor($: Engine, url: string, why: string): Promise<void> {
  try {
    await $.tool.call({
      tool: "mcp__Claude_Browser__navigate",
      url,
      consent: why,
    });
  } catch {
    // No browser pane here (a terminal): the pane's link opens it instead.
    $.ui.toast(`AllyHub editor: ${url}`);
  }
}

/** Whether the app's browser pane is open (unknown: true, so nothing moves). */
async function browserOpen($: Engine): Promise<boolean> {
  try {
    const { text } = await $.tool.call({
      tool: "mcp__Claude_Browser__tabs_context",
    });
    return !/"browserOpen"\s*:\s*false/.test(text ?? "");
  } catch {
    return true;
  }
}

const exportLine = (s: AllyhubStatus, item: AllyhubItem): string | undefined => {
  const job = s.exports.find(
    (j) => j.piece === item.piece && j.output === item.output,
  );
  if (!job) return undefined;
  if (job.state === "running" || job.state === "queued") {
    return `Exporting ${String(Math.round(job.progress * 100))}%`;
  }
  if (job.state === "done") return "Exported";
  if (job.state === "failed") return `Export failed: ${job.error?.message ?? ""}`;
  return undefined;
};

/** A preview answered at the last poll (this load of the module). */
let online = false;

/** Refreshes; the first time a preview answers, the pane opens. */
async function poll($: Engine): Promise<void> {
  const s = await refresh($);
  const was = online;
  online = s !== null;
  if (online && !was) void $.ui.open({ id: PANE, title: TITLE });
}

export const register: Register = (on) => {

  on("session.start", async ($, e, next) => {
    await $.command.register({
      name: "allyhub",
      description: "Show the AllyHub project: videos, checks and exports",
    });
    $.clock.every(POLL_MS, () => {
      void poll($);
    });
    void poll($);
    return next(e);
  });

  on("command.run", { command: "allyhub" }, async ($) => {
    await $.ui.open({ id: PANE, title: TITLE });
    const s = await refresh($);
    return {
      text: s
        ? `AllyHub: ${String(s.items.length)} item(s) at ${s.url}`
        : "AllyHub: no preview is running for this project yet.",
    };
  });

  // The agent starts working with AllyHub, or starts its preview: the card.
  on("tool.call", async ($, e, next) => {
    const ran = await next(e);
    const tool = String(e.tool);
    const command =
      "command" in e && typeof e.command === "string" ? e.command : "";
    if (
      (tool === "Bash" && /\ballyhub\b/.test(command)) ||
      tool === "mcp__Claude_Browser__preview_start"
    ) {
      void poll($);
    }
    return ran;
  }).catch(($, e, next) => next(e));

  // The turn ended: up to date, and the editor in front if it was closed.
  on("turn.complete", async ($, e, next) => {
    const done = await next(e);
    if (e.reason !== "answer") return done;
    const s = await refresh($);
    if (s && !s.offline) {
      void $.ui.open({ id: PANE, title: TITLE });
      if (!(await browserOpen($))) {
        void openEditor($, s.url, "AllyHub reopened its editor as the turn ended");
      }
    }
    return done;
  });

  on("ui.render", { component: "Pane", requestId: PANE }, async ($, e) => {
    const { Box, Text, Button, Link } = $.ui.resolve(e);
    const s = await read($, status);
    if (!s) {
      return (
        <Box flexDirection="column">
          <Text bold>AllyHub</Text>
          <Text dimColor>
            No preview is running yet. When Claude makes a video or a deck
            with AllyHub, its project shows up here.
          </Text>
        </Box>
      );
    }
    const folder = s.workspace.split("/").filter(Boolean).at(-1) ?? s.workspace;
    const checking = s.check.status === "running" || s.check.rev !== s.rev;
    const lastChange =
      s.focus && s.focus.rev === s.rev
        ? `${s.focus.piece}${s.focus.part ? ` · ${s.focus.part}` : ""}`
        : undefined;
    return (
      <Box flexDirection="column">
        <Text bold>{folder}</Text>
        <Text dimColor>
          {s.offline
            ? "The preview stopped. Ask Claude to start it again."
            : `${String(s.items.length)} item(s) · ${
                checking
                  ? "checking…"
                  : s.check.errors
                    ? `${String(s.check.errors)} to fix`
                    : "checked"
              }`}
        </Text>
        {lastChange ? <Text dimColor>Last change: {lastChange}</Text> : null}
        <Text> </Text>
        {s.items.map((item) => {
          const line = exportLine(s, item);
          const job = s.exports.find(
            (j) =>
              j.piece === item.piece &&
              j.output === item.output &&
              j.state === "done",
          );
          return (
            <Box key={`${item.piece}:${item.output}`} flexDirection="column">
              <Text bold>{item.title}</Text>
              <Text dimColor>
                {item.kind === "video" ? "Video" : "Slides"} ·{" "}
                {String(item.variants.length)} version(s)
              </Text>
              {item.errors ? (
                <Text color="error">{String(item.errors)} must-fix problem(s)</Text>
              ) : null}
              {line ? <Text>{line}</Text> : null}
              {(job?.files ?? []).map((f) => (
                <Link key={f} href={`file://${f}`} label={f.split("/").at(-1) ?? f} />
              ))}
              {s.offline ? null : (
                <Button
                  key={`open:${item.piece}:${item.output}`}
                  onPress={() => {
                    void openEditor(
                      $,
                      item.url,
                      `The user pressed "Open" on ${item.title} in the AllyHub pane`,
                    );
                  }}
                >
                  Open
                </Button>
              )}
              <Text> </Text>
            </Box>
          );
        })}
        {s.offline ? null : (
          <Box flexDirection="column">
            <Button
              key="open-editor"
              variant="primary"
              onPress={() => {
                void openEditor(
                  $,
                  s.url,
                  'The user pressed "Open the editor" in the AllyHub pane',
                );
              }}
            >
              Open the editor
            </Button>
            <Link href={s.url} label={s.url} />
          </Box>
        )}
      </Box>
    );
  });
};
