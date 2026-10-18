import { createServerFn } from "@tanstack/react-start";

import { rpcServer } from "~/rpc/server";

export const serverTimeFn = createServerFn({ method: "GET" }).handler(() =>
  rpcServer.time(),
);
