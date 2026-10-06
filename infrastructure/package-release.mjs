import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { fileURLToPath } from "node:url";
const root = new URL("../", import.meta.url);
const source = new URL("app/frontend/dist/", root);
if (!existsSync(new URL("index.html", source)))
  throw new Error("Build the frontend first.");
const html = readFileSync(new URL("index.html", source), "utf8");
if (!html.includes('src="/assets/'))
  throw new Error(
    "AWS release needs a root-path build. Unset SITE_BASE and rebuild.",
  );
const release = new URL(
  `.artifacts/release-${new Date().toISOString().replace(/[:.]/g, "-")}/`,
  root,
);
mkdirSync(release, { recursive: true });
cpSync(source, new URL("dist/", release), { recursive: true });
writeFileSync(
  new URL("dist/runtime-config.json", release),
  '{"apiBaseUrl":"/api"}\n',
);
cpSync(
  new URL("infrastructure/template.json", root),
  new URL("template.json", release),
);
cpSync(
  new URL("infrastructure/deploy.sh", root),
  new URL("deploy.sh", release),
);
console.log(fileURLToPath(release));
