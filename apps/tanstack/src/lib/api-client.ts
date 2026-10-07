import { createApiClient } from "@acme/api";

/**
 * The loader runs on the server, so the base URL has to be absolute: a
 * relative path cannot be fetched there. Vite substitutes the value at build
 * time, and `envPrefix` in vite.config.ts is what lets a non VITE_ var through.
 */
export const baseUrl = import.meta.env.TANSTACK_BASE_URL;

export const apiUrl = new URL("/api", baseUrl);

export const apiClient = createApiClient(apiUrl.toString());
