export const DEMO_EMAIL = "demo@gymtracker.local";
export const DEMO_PASSWORD = "gymtracker";
export const DEMO_USERNAME = "demo";
export const DEMO_NAME = "Demo Lifter";

export const DEMO_ACCOUNT_LOCKED_MESSAGE =
  "The demo account can't change its email or password, or be deleted. Create your own account to try that.";

export function isDemoAccountEmail(email: string | null | undefined) {
  return email?.toLowerCase() === DEMO_EMAIL;
}
