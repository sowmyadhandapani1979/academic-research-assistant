import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createApp } from "./app.ts";
import { createDb } from "./db.ts";
import { createS2, s2ResetQuiet } from "./s2.ts";

function loadDotEnv(file: string) {
  const path = resolve(file);
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadDotEnv(".env");
loadDotEnv(".env.local");

const port = Number(process.env.API_PORT ?? 3001);
const sqlitePath = resolve(
  process.env.SQLITE_PATH ?? "server/data/app.db",
);
mkdirSync(dirname(sqlitePath), { recursive: true });

const db = createDb(sqlitePath);
s2ResetQuiet();
const app = createApp(db, createS2());

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
  console.log(
    `Semantic Scholar API key: ${process.env.S2_API_KEY?.trim() ? "loaded" : "missing"}`,
  );
});
