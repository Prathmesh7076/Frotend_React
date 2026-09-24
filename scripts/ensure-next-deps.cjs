// Post-install bootstrap: fixes missing Next.js scoped packages
// Run with:  node scripts/ensure-next-deps.cjs  (auto-runs via npm postinstall)
const { execSync, existsSync } = require("node:fs");
const { join } = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = join(__dirname, "..");
const NM = join(ROOT, "node_modules");

function isInstalled(name, relEntry) {
  const entryPath = relEntry
    ? join(NM, name, relEntry)
    : join(NM, name, "package.json");
  return existsSync(entryPath);
}

function installMissing(specs) {
  const missing = specs.filter(({ name, entry }) => !isInstalled(name, entry));
  if (missing.length === 0) {
    console.log("[ensure-next-deps] All Next.js scoped packages are present.");
    return 0;
  }
  const pkgs = missing.map(({ name, version }) => `${name}@${version}`).join(" ");
  console.log(
    "[ensure-next-deps] Installing missing Next.js packages:",
    pkgs
  );
  const cmd =
    process.platform === "win32"
      ? `npm install --no-save --no-audit --no-fund ${pkgs}`
      : `npm install --no-save --no-audit --no-fund ${pkgs}`;
  const res = spawnSync(cmd, {
    cwd: ROOT,
    shell: true,
    stdio: "inherit",
  });
  return res.status || 0;
}

const NEXT_VERSION = require(join(ROOT, "package.json")).dependencies.next;

const specs = [
  { name: "@next/env", version: NEXT_VERSION, entry: "dist/index.js" },
  { name: "@next/swc-win32-x64-msvc", version: NEXT_VERSION, entry: "next-swc.win32-x64-msvc.node" },
  { name: "@next/swc-darwin-x64", version: NEXT_VERSION, entry: "next-swc.darwin-x64.node" },
  { name: "@next/swc-darwin-arm64", version: NEXT_VERSION, entry: "next-swc.darwin-arm64.node" },
  { name: "@next/swc-linux-x64-gnu", version: NEXT_VERSION, entry: "next-swc.linux-x64-gnu.node" },
];

process.exitCode = installMissing(specs);
