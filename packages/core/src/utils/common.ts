export const appName = "Cloudflare Monorepo";

export function createTitle(page: string): string {
  return `${page} - ${appName}`;
}

/**
 * "3 minutes ago". Buckets are deliberately coarse: the output is rendered on
 * the server and again on hydration, and a fine-grained relative time can land
 * on either side of a boundary and disagree. Pass `now` to test it.
 */
export function timeAgo(date: Date, now: Date = new Date()): string {
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];

  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) {
      return formatter.format(-Math.round(seconds / size), unit);
    }
  }
  return formatter.format(-seconds, "second");
}

/**
 * The full date, for a `title` attribute beside a relative one. Pinned to UTC so
 * it reads the same on the server and in the browser.
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}
