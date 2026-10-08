import { createApiClient } from "@acme/api";

/**
 * The loader runs on the server, so the base URL has to be absolute: a
 * relative path cannot be fetched there. Vite substitutes the value at build
 * time.
 *
 * Build time, not request time. The value is compiled into the client bundle as
 * well, so a client-side navigation to a route using this client calls the
 * origin that was set when the app was built. Typed in src/env.d.ts.
 */
export const baseUrl = import.meta.env.VITE_TANSTACK_BASE_URL;

export const apiUrl = new URL("/api", baseUrl);

export const apiClient = createApiClient(apiUrl.toString());
