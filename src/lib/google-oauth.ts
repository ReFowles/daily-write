export interface RefreshedGoogleTokens {
  accessToken: string;
  // Unix seconds (matches NextAuth's `account.expires_at` convention).
  expiresAt: number;
  // Google usually keeps the same refresh token, but may rotate it.
  refreshToken?: string;
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
}

/**
 * Exchanges a Google refresh token for a fresh access token.
 * Throws on any non-2xx response so callers can flag re-auth.
 */
export async function refreshGoogleAccessToken(
  refreshToken: string,
  {
    clientId = process.env.GOOGLE_CLIENT_ID,
    clientSecret = process.env.GOOGLE_CLIENT_SECRET,
    fetchImpl = fetch,
    now = Date.now,
  }: {
    clientId?: string;
    clientSecret?: string;
    fetchImpl?: typeof fetch;
    now?: () => number;
  } = {}
): Promise<RefreshedGoogleTokens> {
  if (!clientId || !clientSecret) {
    throw new Error("Missing Google OAuth client credentials");
  }

  const response = await fetchImpl("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    cache: "no-store",
  });

  const data = (await response.json()) as GoogleTokenResponse;

  if (!response.ok || !data.access_token) {
    throw new Error(
      data.error_description || data.error || "Failed to refresh Google access token"
    );
  }

  return {
    accessToken: data.access_token,
    expiresAt: Math.floor(now() / 1000) + data.expires_in,
    refreshToken: data.refresh_token,
  };
}
