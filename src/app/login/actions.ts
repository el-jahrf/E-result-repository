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
  const email = formData.get("email");
  const password = formData.get("password");

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email ||
    !password
  ) {
    return {
      error: "Email and password are required.",
    };
  }

  try {
    await signIn("credentials", {
      email,
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
      error: "Invalid email or password.",
    };
  }
}