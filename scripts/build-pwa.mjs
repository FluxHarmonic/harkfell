// Web tooling only: stamp the worker with every runtime asset in the build.
import fs from "node:fs";
import path from "node:path";

const [out, version] = process.argv.slice(2);
if (!out || !version) throw new Error("usage: build-pwa.mjs OUTPUT BUILD-STAMP");
function files(dir) {
  return fs.readdirSync(path.join(out, dir), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => entry.isDirectory() ? files(`${dir}/${entry.name}`) : [`${dir}/${entry.name}`]);
}
fs.copyFileSync("web/pwa.js", path.join(out, "pwa.js"));
const shell = ["./", "harkfell.wasm", "sigil-wasm-bridges.js", "sigil-wasm-bridges.json", "pwa.js", ...files("assets")];
fs.writeFileSync(path.join(out, "sw.js"), fs.readFileSync("web/sw.js", "utf8")
  .replace("__VERSION__", version).replace("__SHELL__", JSON.stringify(shell, null, 2)));
console.log(`  PWA ${version}: ${shell.length} precached files`);
