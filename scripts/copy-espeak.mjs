import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(
  root,
  "node_modules",
  "@echogarden",
  "espeak-ng-emscripten",
);
const target = join(root, "public", "espeak");

await mkdir(target, { recursive: true });
await Promise.all(
  ["espeak-ng.js", "espeak-ng.data"].map((name) =>
    copyFile(join(source, name), join(target, name)),
  ),
);
