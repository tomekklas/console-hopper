// Build the Chrome Web Store submission package.
//
// Assembles a minified copy of the extension under dist/ and zips it into
// console-hopper.zip at the repo root. Source stays editable at the repo root
// (load it unpacked for development); dist/ is the production build.
//
// Replaces the old build.sh: keeps its manifest JSON sanity check and the
// file-list + size echo so a broken exclude can't silently leak files.
//
// Usage: npm run build

import { execFileSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

// Browsers that ship Manifest V3; keeps esbuild from down-levelling modern JS.
const TARGET = ["chrome110"];

// Scripts esbuild minifies. (Stage 4 of ROADMAP.md will switch content.js to a
// bundled entry once it imports ES modules; until then this is minify-only.)
const SCRIPTS = ["content.js", "background.js", "console-decorator.js"];

// Static files copied verbatim into the package.
const STATIC = ["manifest.json", "icons", "lib"];

function readManifest() {
  const text = readFileSync(join(root, "manifest.json"), "utf8");
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("error: manifest.json is not valid JSON —", err.message);
    process.exit(1);
  }
}

async function main() {
  const manifest = readManifest();
  const out = `${manifest.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}.zip`;
  const outZip = join(root, out);

  console.log(`building ${manifest.name} v${manifest.version} → ${out}`);

  rmSync(dist, { recursive: true, force: true });
  mkdirSync(dist, { recursive: true });

  for (const file of SCRIPTS) {
    const result = await esbuild.transform(readFileSync(join(root, file)), {
      minify: true,
      target: TARGET,
      legalComments: "none",
      loader: "js",
      // Verbose logs go through debug() -> console.log (gated on DEBUG, false in
      // shipped source). Marking console.log pure lets the minifier drop those
      // dead calls entirely; console.warn / console.error are left intact so
      // genuine failures still surface in a user's console.
      pure: ["console.log"],
    });
    writeFileSync(join(dist, file), result.code);
  }

  for (const entry of STATIC) {
    cpSync(join(root, entry), join(dist, entry), { recursive: true });
  }

  // Fresh zip so a rebuild never inherits deleted files. Zip from inside dist/
  // so package paths stay top-level (content.js, lib/…, icons/…).
  rmSync(outZip, { force: true });
  execFileSync("zip", ["-rqX", outZip, "."], { cwd: dist });

  console.log("\n=== contents ===");
  console.log(execFileSync("unzip", ["-l", outZip], { encoding: "utf8" }));
  console.log("=== size ===");
  console.log(execFileSync("ls", ["-lh", outZip], { encoding: "utf8" }).trim());
  console.log("\nready to upload at https://chrome.google.com/webstore/devconsole");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
