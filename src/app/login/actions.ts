"use server";

import { signIn } from "@/lib/auth";

export type LoginState = {
  error?: string;
  success?: boolean;
};

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const login = formData.get("login");
  const password = formData.get("password");

  if (
    typeof login !== "string" ||
    typeof password !== "string" ||
    !login.trim() ||
    !password
  ) {
    return {
      error: "Login ID and password are required.",
    };
  }

  try {
    await signIn("credentials", {
      login: login.trim(),
      password,
      redirectTo: "/",
    });

    return {
      success: true,
    };
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof error.digest === "string" &&
      error.digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    console.error("LOGIN ERROR:", error);

    return {
      error: "Invalid login ID or password.",
    };
  }
}