import type { z } from "zod";

export const ERROR_STATUS = {
  VALIDATION: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL: 500,
  UNAVAILABLE: 503,
} as const;

export type ErrorCode = keyof typeof ERROR_STATUS;

export type Issue = z.core.$ZodIssue;

export type ApiErrorBody = {
  error: {
    code: ErrorCode;
    message: string;
    issues?: Issue[];
    requestId?: string;
  };
};

export class AppError extends Error {
  readonly isAppError = true as const;
  readonly code: ErrorCode;
  readonly issues?: Issue[];
  readonly expose: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    opts: { issues?: Issue[]; cause?: unknown; expose?: boolean } = {},
  ) {
    super(message, { cause: opts.cause });

    this.name = "AppError";
    this.code = code;
    this.issues = opts.issues;
    this.expose = opts.expose ?? ERROR_STATUS[code] < 500;
  }

  get status() {
    return ERROR_STATUS[this.code];
  }

  toBody(requestId?: string): ApiErrorBody {
    return {
      error: {
        code: this.code,
        message: this.expose ? this.message : "Something went wrong",
        issues: this.issues,
        requestId,
      },
    };
  }
}

export function isAppError(e: unknown): e is AppError {
  return (
    typeof e === "object" &&
    e !== null &&
    (e as { isAppError?: boolean }).isAppError === true
  );
}
