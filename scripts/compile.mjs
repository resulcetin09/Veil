import { execFileSync } from "node:child_process";
import { mkdir, cp } from "node:fs/promises";
import path from "node:path";

const executable =
  process.env.COMPACTC ?? path.resolve(".tools/compact-0.31.1/compactc");
const checkOnly = process.argv.includes("--skip-zk");
await mkdir("contracts/managed", { recursive: true });
execFileSync(
  executable,
  [
    ...(checkOnly ? ["--skip-zk"] : []),
    "contracts/veil.compact",
    "contracts/managed/veil",
  ],
  { stdio: "inherit" },
);
if (!checkOnly) {
  await mkdir("public/contract/veil", { recursive: true });
  for (const folder of ["keys", "zkir"])
    await cp(
      `contracts/managed/veil/${folder}`,
      `public/contract/veil/${folder}`,
      { recursive: true },
    );
}
console.log(
  checkOnly
    ? "Contract compiled (proof keys skipped)."
    : "Contract and proving assets ready.",
);
