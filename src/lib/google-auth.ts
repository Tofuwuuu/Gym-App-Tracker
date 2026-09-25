export function getGoogleAuthCredentials(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.AUTH_GOOGLE_ID?.trim() || process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret =
    process.env.AUTH_GOOGLE_SECRET?.trim() || process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}
