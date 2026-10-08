// AllyHub plugin launcher for ChatGPT Desktop. The desktop app starts this
// file from the installed plugin folder (see chatgpt.mcp.json). It finds the
// AllyHub CLI installed on this computer and hands the MCP connection to
// `allyhub mcp --app`. When the CLI is missing or too old, it serves a small
// stand-in instead, so the AllyHub sidebar still opens and says how to
// install it.
//
// No dependencies; Node 18 or newer. stdout is the MCP protocol: nothing else
// may print there.

import { execFile, spawn } from "node:child_process";
import { existsSync, readdirSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { delimiter, join } from "node:path";

const home = homedir();

function run(file, args, timeout = 8000) {
  return new Promise((resolve) => {
    execFile(file, args, { timeout }, (error, stdout) => {
      resolve(error ? null : String(stdout));
    });
  });
}

/** Places an `allyhub` command may be, best first. */
function candidates() {
  const fromEnv = process.env.ALLYHUB_CLI ? [process.env.ALLYHUB_CLI] : [];
  const fromPath = (process.env.PATH ?? "")
    .split(delimiter)
    .filter(Boolean)
    .map((d) => join(d, "allyhub"));
  const fixed = [
    "/opt/homebrew/bin/allyhub",
    "/usr/local/bin/allyhub",
    join(home, ".npm-global/bin/allyhub"),
    join(home, ".volta/bin/allyhub"),
    join(home, ".local/bin/allyhub"),
  ];
  const nvm = join(home, ".nvm/versions/node");
  const fromNvm = existsSync(nvm)
    ? readdirSync(nvm)
        .sort()
        .reverse()
        .map((v) => join(nvm, v, "bin/allyhub"))
    : [];
  return [...new Set([...fromEnv, ...fromPath, ...fixed, ...fromNvm])];
}

/** How to run a found command: a Node script runs with this Node. */
function command(path) {
  const real = realpathSync(path);
  return real.endsWith(".js") || real.endsWith(".mjs")
    ? [process.execPath, [real]]
    : [real, []];
}

async function findCli() {
  let found = candidates().filter((p) => existsSync(p));
  if (found.length === 0) {
    // What the person's login shell would find (version managers, custom PATH).
    const out = await run("/bin/zsh", ["-lc", "command -v allyhub"]);
    const p = out?.trim();
    if (p && existsSync(p)) found = [p];
  }
  for (const p of found) {
    const [file, pre] = command(p);
    const help = await run(file, [...pre, "help", "mcp"]);
    if (help?.includes("--app")) return { file, pre, path: p };
  }
  return found.length > 0 ? { tooOld: found[0] } : null;
}

const cli = await findCli();
if (cli?.file) {
  const child = spawn(cli.file, [...cli.pre, "mcp", "--app"], { stdio: "inherit" });
  for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child.kill(sig));
  child.on("exit", (code, signal) => process.exit(signal ? 1 : (code ?? 0)));
} else {
  serveStandIn(cli?.tooOld ?? null);
}

// --- Stand-in: the sidebar opens and explains how to install AllyHub. ---

function serveStandIn(tooOld) {
  const why = tooOld
    ? `The AllyHub command at ${tooOld} is too old for ChatGPT Desktop.`
    : "The AllyHub command is not installed on this computer.";
  const html = `<!doctype html><meta charset="utf-8"><title>AllyHub</title>
<style>body{margin:0;padding:24px;font:14px/1.6 -apple-system,"PingFang SC",system-ui,sans-serif;background:#fff;color:#111}
:root.dark body{background:#1e1e1e;color:#eee}code{background:rgba(127,127,127,.15);padding:2px 6px;border-radius:4px}h1{font-size:20px}</style>
<h1>AllyHub</h1><p>${why}</p><p>Install or update it, then restart ChatGPT:</p><p><code>npm install -g allyhub</code></p>
<p>AllyHub needs Node.js 22.12 or newer.</p>
<script>window.parent.postMessage({jsonrpc:"2.0",id:1,method:"ui/initialize",params:{appInfo:{name:"AllyHub",version:"0"},appCapabilities:{},protocolVersion:"2026-01-26"}},"*");
addEventListener("message",e=>{const m=e.data;if(m&&m.id===1){if(m.result&&m.result.hostContext&&m.result.hostContext.theme==="dark")document.documentElement.classList.add("dark");parent.postMessage({jsonrpc:"2.0",method:"ui/notifications/initialized",params:{}},"*")}});</script>`;
  const uri = "ui://allyhub/install.html";
  const meta = (type) => ({ ui: { resourceUri: uri }, "openai/ui": { entrypoints: [{ type }] } });
  const empty = { type: "object", properties: {} };
  const tools = [
    { name: "allyhub_home", title: "AllyHub", description: "Open the AllyHub home.", inputSchema: empty, _meta: meta("global") },
    { name: "allyhub_preview", title: "AllyHub preview", description: "Open the AllyHub panel beside this conversation.", inputSchema: empty, _meta: meta("thread") },
  ];
  const answer = (msg) => {
    switch (msg.method) {
      case "initialize":
        return {
          protocolVersion: msg.params?.protocolVersion ?? "2025-06-18",
          capabilities: { tools: {}, resources: {} },
          serverInfo: { name: "allyhub", title: "AllyHub", version: "0" },
          instructions: why,
        };
      case "ping":
        return {};
      case "tools/list":
        return { tools };
      case "tools/call":
        return { content: [{ type: "text", text: `${why} Install it with: npm install -g allyhub` }], isError: true };
      case "resources/list":
        return { resources: [{ uri, name: "allyhub-install", mimeType: "text/html;profile=mcp-app" }] };
      case "resources/templates/list":
        return { resourceTemplates: [] };
      case "resources/read":
        return { contents: [{ uri, mimeType: "text/html;profile=mcp-app", text: html }] };
      default:
        return undefined;
    }
  };
  let buffer = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => {
    buffer += chunk;
    let nl;
    while ((nl = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line) continue;
      let msg;
      try {
        msg = JSON.parse(line);
      } catch {
        continue;
      }
      if (msg.id === undefined || !msg.method) continue;
      const result = answer(msg);
      process.stdout.write(
        JSON.stringify(
          result === undefined
            ? { jsonrpc: "2.0", id: msg.id, error: { code: -32601, message: `Method not found: ${msg.method}` } }
            : { jsonrpc: "2.0", id: msg.id, result },
        ) + "\n",
      );
    }
  });
  process.stdin.on("end", () => process.exit(0));
}
