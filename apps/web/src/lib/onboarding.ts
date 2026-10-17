import { api } from "./api";

// Renames the user's default workspace and marks them onboarded (name/avatar go through authClient.updateUser).
export const completeOnboarding = (workspaceName: string) =>
  api<{ workspace: { id: string; name: string } }>("/api/v1/onboarding/complete", {
    method: "POST",
    body: { workspaceName: workspaceName.trim().slice(0, 80) },
  });
