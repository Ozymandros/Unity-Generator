export const FINALIZE_STATUS = {
  PENDING: "pending",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  NOT_FOUND: "not_found",
} as const;

export type FinalizeStatus = typeof FINALIZE_STATUS[keyof typeof FINALIZE_STATUS];

export const UI_TONE = {
  OK: "ok",
  ERROR: "error",
} as const;

export type UiTone = typeof UI_TONE[keyof typeof UI_TONE];
