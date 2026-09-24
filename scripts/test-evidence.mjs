import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";

const result = spawnSync(
  "npm",
  ["test", "--", "--reporter=verbose", "--no-color"],
  { encoding: "utf8", env: { ...process.env, NO_COLOR: "1" } },
);
const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.replace(
  /\x1b\[[0-9;]*m/g,
  "",
);
process.stdout.write(output);
if (result.status !== 0) process.exit(result.status ?? 1);
const escape = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>Veil — test evidence</title><style>body{margin:0;padding:50px;background:#111214;color:#eeeae3;font:16px system-ui}h1{font-weight:500;font-size:34px}p{color:#c7baf5}pre{background:#1b1c21;padding:28px;border-radius:16px;white-space:pre-wrap;overflow-wrap:anywhere;font:13px/1.8 ui-monospace,monospace}small{color:#aaa}</style><h1>Contract &amp; application tests</h1><p>Veil · Actual local Vitest output</p><small>Captured ${escape(new Date().toISOString())}. Runtime tests, not network proof verification.</small><pre>${escape(output)}</pre></html>`;
await mkdir("docs/evidence", { recursive: true });
await mkdir("dist/evidence", { recursive: true });
await writeFile("docs/evidence/test-output.txt", output);
await writeFile("docs/evidence/test-output.html", html);
await writeFile("dist/evidence/test-output.html", html);
