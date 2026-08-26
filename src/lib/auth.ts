import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { refreshGoogleAccessToken } from "./google-oauth";

// Refresh a bit early so an in-flight request doesn't race the expiry.
const REFRESH_LEEWAY_SECONDS = 60;

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/documents",
            "https://www.googleapis.com/auth/drive",
          ].join(" "),
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        delete token.error;
        return token;
      }

      const expiresAt = token.expiresAt;
      const nowSeconds = Math.floor(Date.now() / 1000);
      if (
        token.accessToken &&
        typeof expiresAt === "number" &&
        nowSeconds < expiresAt - REFRESH_LEEWAY_SECONDS
      ) {
        return token;
      }

      if (!token.refreshToken) {
        token.error = "RefreshAccessTokenError";
        delete token.accessToken;
        return token;
      }

      try {
        const refreshed = await refreshGoogleAccessToken(
          token.refreshToken as string
        );
        token.accessToken = refreshed.accessToken;
        token.expiresAt = refreshed.expiresAt;
        if (refreshed.refreshToken) {
          token.refreshToken = refreshed.refreshToken;
        }
        delete token.error;
      } catch (error) {
        console.error("Failed to refresh Google access token", error);
        token.error = "RefreshAccessTokenError";
        delete token.accessToken;
      }

      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.refreshToken = token.refreshToken as string | undefined;
      session.error = token.error as string | undefined;
      return session;
    },
  },
});
