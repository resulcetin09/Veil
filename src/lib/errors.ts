export class UserError extends Error {}

// Never surface raw SDK/prover exceptions: they may include witness material.
export function safeError(error: unknown): string {
  if (error instanceof UserError) return error.message;
  const message = error instanceof Error ? error.message : "";
  if (/reject|denied|cancel/i.test(message))
    return "The request was declined in your wallet. Nothing was confirmed. Try again when you’re ready.";
  if (/already redeemed/i.test(message))
    return "This invitation has already been used. Each invitation grants access once.";
  if (/not registered|not on the allowlist/i.test(message))
    return "This invitation is not on the event’s allowlist. Contact the organizer.";
  if (/Registration must close/i.test(message))
    return "The organizer is still preparing the guest list. Try again after registration closes.";
  if (/Organizer authorization/i.test(message))
    return "This recovery file cannot manage this event. Import the matching organizer file.";
  if (/fetch|network|ECONN|timeout|timed out/i.test(message))
    return "A network or proof service did not respond. Check your wallet and local proof server. If you approved a transaction, check its status before retrying.";
  return "The operation could not be completed. Check your wallet, Preview network and local proof server. No success has been confirmed.";
}

export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new UserError(message)), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}
