export type ActionResult =
  | { success: true }
  | { success: false; error: string };

export function actionError(error: string): ActionResult {
  return { success: false, error };
}

export function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}
