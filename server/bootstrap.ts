import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createApp } from "./app.ts";
import { createDb } from "./db.ts";
import { createS2, s2ResetQuiet } from "./s2.ts";

export function sqlitePath() {
  if (process.env.VERCEL) return "/tmp/ara.db";
  return resolve(process.env.SQLITE_PATH ?? "server/data/app.db");
}

export function bootstrapApp() {
  const path = sqlitePath();
  mkdirSync(dirname(path), { recursive: true });
  const db = createDb(path, { wal: !process.env.VERCEL });
  s2ResetQuiet();
  return createApp(db, createS2());
}
