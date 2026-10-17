import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  // Mirrors `user.additionalFields` in apps/api/src/api/auth/index.ts
  plugins: [inferAdditionalFields({ user: { isOnboarded: { type: "boolean", input: false } } })],
});
