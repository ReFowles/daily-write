import { describe, expect, it, vi } from "vitest";
import { refreshGoogleAccessToken } from "./google-oauth";

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
}

describe("refreshGoogleAccessToken", () => {
  it("exchanges the refresh token for a new access token", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        access_token: "new-access",
        expires_in: 3600,
      })
    );

    const result = await refreshGoogleAccessToken("refresh-1", {
      clientId: "client-id",
      clientSecret: "client-secret",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      now: () => 1_700_000_000_000,
    });

    expect(result).toEqual({
      accessToken: "new-access",
      expiresAt: 1_700_000_000 + 3600,
      refreshToken: undefined,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://oauth2.googleapis.com/token");
    const body = init.body as URLSearchParams;
    expect(body.get("grant_type")).toBe("refresh_token");
    expect(body.get("refresh_token")).toBe("refresh-1");
    expect(body.get("client_id")).toBe("client-id");
    expect(body.get("client_secret")).toBe("client-secret");
  });

  it("returns a rotated refresh token when Google supplies one", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        access_token: "new-access",
        expires_in: 1800,
        refresh_token: "rotated-refresh",
      })
    );

    const result = await refreshGoogleAccessToken("refresh-1", {
      clientId: "client-id",
      clientSecret: "client-secret",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      now: () => 2_000_000_000_000,
    });

    expect(result.refreshToken).toBe("rotated-refresh");
    expect(result.expiresAt).toBe(2_000_000_000 + 1800);
  });

  it("throws when Google returns an error payload", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(
        { error: "invalid_grant", error_description: "Token revoked" },
        { status: 400 }
      )
    );

    await expect(
      refreshGoogleAccessToken("bad-refresh", {
        clientId: "client-id",
        clientSecret: "client-secret",
        fetchImpl: fetchImpl as unknown as typeof fetch,
      })
    ).rejects.toThrow(/Token revoked/);
  });

  it("throws when client credentials are missing", async () => {
    await expect(
      refreshGoogleAccessToken("refresh-1", {
        clientId: undefined,
        clientSecret: undefined,
        fetchImpl: vi.fn() as unknown as typeof fetch,
      })
    ).rejects.toThrow(/Missing Google OAuth client credentials/);
  });
});
