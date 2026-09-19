import type { IncomingMessage, ServerResponse } from "node:http";
import { bootstrapApp } from "../server/bootstrap.ts";

const app = bootstrapApp();

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return app(req, res);
}
