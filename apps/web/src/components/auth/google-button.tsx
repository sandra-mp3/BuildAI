"use client";

export function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.05H2.18a11 11 0 0 0 0 9.9z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.05l3.66 2.85C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  );
}

/** Turns a thrown GOOGLE_AUTH_NOT_CONFIGURED into a clear, honest message. */
export function googleErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message === "GOOGLE_AUTH_NOT_CONFIGURED") {
    return "Google sign-in isn't connected yet — this project has no Firebase credentials configured. Try Demo Mode, or continue with email instead.";
  }
  return "Google sign-in failed. Try again.";
}

export function GoogleButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="forge-focus-ring mt-6 flex w-full items-center justify-center gap-2 rounded-md border border-border-strong bg-bg-elevated py-2 text-sm font-medium transition-colors hover:bg-bg-inset disabled:opacity-50"
    >
      <GoogleIcon />
      Continue with Google
    </button>
  );
}
