import "@tanstack/react-start/server-only";

import { env } from "cloudflare:workers";

import { createRpcServer } from "@acme/api/server";

export const rpcServer = createRpcServer({ Env: { DB: env.DB } });
