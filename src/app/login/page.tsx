"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "./actions";

const initialState = {
  error: "",
};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <main className="min-h-screen bg-[#f7f8fa]">
      <div className="flex min-h-screen">
        <section className="hidden w-1/2 bg-gray-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.2em] text-gray-400">
              E-RESULT
            </p>

            <h1 className="mt-8 max-w-lg text-5xl font-bold leading-tight tracking-tight">
              School results, managed simply.
            </h1>

            <p className="mt-6 max-w-md text-lg leading-8 text-gray-400">
              A centralized platform for managing students, teachers, classes,
              subjects, results, approvals, and academic performance.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              ["01", "Enter results"],
              ["02", "Review & approve"],
              ["03", "Publish results"],
            ].map(([number, label]) => (
              <div
                key={number}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <p className="text-2xl font-bold">{number}</p>
                <p className="mt-2 text-sm text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <div className="mb-10">
              <p className="text-sm font-bold tracking-[0.2em] text-gray-950">
                E-RESULT
              </p>

              <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-950">
                Welcome back
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Sign in to access your school management dashboard.
              </p>
            </div>

            <form action={formAction} className="space-y-5">
              {state.error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {state.error}
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@school.edu"
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-gray-950 focus:ring-2 focus:ring-gray-950/10"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Password
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-gray-950 focus:ring-2 focus:ring-gray-950/10"
                />
              </div>

              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-xl bg-gray-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="mt-8 border-t border-gray-200 pt-6 text-center">
              <p className="text-xs leading-5 text-gray-400">
                E-result school management platform
              </p>

              <Link
                href="/"
                className="mt-3 inline-block text-xs font-semibold text-gray-600 hover:text-gray-950"
              >
                Back to home
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}