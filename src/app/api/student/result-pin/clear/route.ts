import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "STUDENT") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        { status: 401 },
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Result PIN access cleared.",
    });

    /*
     * Delete the browser's Result PIN access cookie.
     *
     * The path must match the path used when the cookie was created.
     */
    response.cookies.set({
      name: "result_pin_access",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/student/results",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Clear Result PIN error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to clear Result PIN access.",
      },
      { status: 500 },
    );
  }
}