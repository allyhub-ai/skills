// The AllyHub plugin's state contract: what its pane draws from.

/** One video or deck of the workspace, as `allyhub dev` reports it. */
export type AllyhubItem = {
  piece: string;
  output: string;
  kind: "video" | "paged";
  title: string;
  variants: string[];
  /** The editor page for this item. */
  url: string;
  errors: number;
  warnings: number;
};

export type AllyhubExport = {
  id: string;
  piece: string;
  output: string;
  variants: string[];
  formats: string[];
  state: "queued" | "running" | "done" | "failed" | "cancelled";
  progress: number;
  files?: string[];
  error?: { code: string; message: string };
};

/** The running preview of a workspace (GET /agent/status of allyhub dev). */
export type AllyhubStatus = {
  /** The editor's address. */
  url: string;
  dir: string;
  rev: number;
  reading: boolean;
  items: AllyhubItem[];
  check: {
    status: "running" | "done" | "failed" | "off";
    rev: number;
    errors: number;
    warnings: number;
  };
  problems: number;
  exports: AllyhubExport[];
  focus?: { rev: number; piece: string; output?: string; part?: string; file: string };
  /** The workspace folder it was found in. */
  workspace: string;
  /** The .claude/launch.json entry that starts it, when there is one. */
  launch?: string;
  /** The preview stopped answering since. */
  offline?: boolean;
};

declare module "claude-code" {
  interface PluginState {
    allyhub: {
      status: AllyhubStatus | null;
    };
  }
}
