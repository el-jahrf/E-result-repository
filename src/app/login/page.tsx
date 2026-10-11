"use client";

import Image from "next/image";
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
    <main className="min-h-screen bg-school text-school">
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* SCHOOL BRANDING PANEL */}
        <section className="relative flex w-full flex-col overflow-hidden bg-primary lg:min-h-screen lg:w-[52%] lg:shrink-0">
          {/* Decorative shapes */}
          <div className="pointer-events-none absolute -right-32 -top-32 h-72 w-72 rounded-full bg-secondary/40 sm:h-96 sm:w-96" />

          <div className="pointer-events-none absolute -bottom-32 -left-32 h-64 w-64 rounded-full border-[40px] border-accent/10 sm:-bottom-40 sm:-left-40 sm:h-[30rem] sm:w-[30rem] sm:border-[60px]" />

          <div className="relative z-10 flex h-full flex-col p-5 sm:p-8 lg:min-h-screen lg:p-12 xl:p-16">
            {/* School logo and name */}
            <div className="flex items-center gap-3 sm:gap-5">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-accent/70 bg-school p-0.5 shadow-xl sm:h-20 sm:w-20 sm:rounded-2xl">
                <Image
                  src="/school-logo.png"
                  alt="Rising Foundation Academy logo"
                  width={80}
                  height={80}
                  className="h-full w-full rounded-lg object-cover sm:rounded-xl"
                  priority
                />
              </div>

              <div className="min-w-0 pt-1">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-accent sm:text-xs sm:tracking-[0.28em]">
                  Welcome to
                </p>

                <h1 className="mt-1 text-lg font-black uppercase leading-tight tracking-tight text-white sm:mt-2 sm:text-2xl xl:text-3xl">
                  Rising Foundation Academy
                </h1>

                <p className="mt-1 text-[10px] font-medium tracking-[0.08em] text-accent sm:mt-2 sm:text-sm sm:tracking-[0.12em]">
                  ACADEMY FOR EXCELLENCE
                </p>
              </div>
            </div>

            {/* School introduction */}
            <div className="my-6 max-w-2xl sm:my-8 lg:my-auto lg:py-16">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-white/5 px-3 py-1.5 sm:mb-6 sm:px-4 sm:py-2">
                <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />

                <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-accent sm:text-xs sm:tracking-[0.18em]">
                  School Management System
                </span>
              </div>

              <h2 className="text-2xl font-black leading-tight tracking-tight text-white sm:text-4xl sm:leading-[1.08] lg:text-4xl xl:text-6xl">
                Empowering
                <span className="block text-accent">
                  excellence in education.
                </span>
              </h2>

              <p className="mt-3 max-w-xl text-xs leading-5 text-accent sm:mt-7 sm:text-base sm:leading-7 xl:text-lg">
                Access your academic dashboard to manage students, teachers,
                classes, subjects, results, academic performance, and school
                activities from one secure platform.
              </p>

              {/* Feature cards: hidden on very small screens to keep
                  the school branding panel compact. */}
              <div className="mt-6 hidden max-w-xl grid-cols-3 gap-3 sm:mt-10 sm:grid">
                {[
                  ["01", "Manage", "Students & classes"],
                  ["02", "Record", "Academic results"],
                  ["03", "Publish", "Approved results"],
                ].map(([number, title, description]) => (
                  <div
                    key={number}
                    className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur-sm sm:p-4"
                  >
                    <div className="text-sm font-black text-accent">
                      {number}
                    </div>

                    <div className="mt-2 text-xs font-bold text-white sm:mt-3 sm:text-sm">
                      {title}
                    </div>

                    <div className="mt-1 text-[10px] leading-4 text-accent sm:text-xs sm:leading-5">
                      {description}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* School address and copyright */}
            <div className="border-t border-white/10 pt-4 sm:pt-6">
              <p className="max-w-xl text-[10px] leading-4 text-accent sm:text-xs sm:leading-5">
                <span className="font-semibold text-accent">
                  School Address:
                </span>{" "}
                Adjacent to Smart Capital Street, Along Yaro College Road,
                Angwan Gwari, Suleja, Niger State.
              </p>

              <p className="mt-2 text-[10px] text-accent sm:mt-3 sm:text-xs">
                © {new Date().getFullYear()} Rising Foundation Academy. All
                rights reserved.
              </p>
            </div>
          </div>
        </section>

        {/* LOGIN FORM PANEL */}
        <section className="flex w-full flex-1 items-center justify-center px-4 py-8 sm:px-8 sm:py-10 lg:w-[48%] lg:px-10 xl:px-12">
          <div className="w-full max-w-md">
            {/* Login heading */}
            <div className="mb-7 sm:mb-9">
              <div className="mb-4 inline-flex items-center rounded-full bg-accent/30 px-3 py-1.5 sm:mb-5">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">
                  Secure Portal
                </span>
              </div>

              <h2 className="text-3xl font-black tracking-tight text-primary sm:text-4xl">
                Welcome back
              </h2>

              <p className="mt-3 text-sm leading-6 text-muted">
                Sign in to your Rising Foundation Academy account to continue
                to your dashboard.
              </p>
            </div>

            {/* Login card */}
            <div className="school-card rounded-2xl p-5 shadow-[0_20px_60px_rgba(74,44,32,0.10)] sm:rounded-3xl sm:p-8">
              <form action={formAction} className="space-y-5">
                {state.error && (
                  <div
                    role="alert"
                    className="rounded-2xl border border-danger bg-danger px-4 py-3.5 text-sm leading-5 text-white"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                        !
                      </span>

                      <span>{state.error}</span>
                    </div>
                  </div>
                )}

                {/* Login ID */}
                <div>
                  <label
                    htmlFor="login"
                    className="mb-2.5 block text-sm font-semibold text-primary"
                  >
                    Login ID
                  </label>

                  <input
                    id="login"
                    name="login"
                    type="text"
                    placeholder="Email or admission number"
                    required
                    autoComplete="username"
                    className="school-input bg-school px-4 py-3.5 text-sm placeholder:text-muted focus:bg-surface"
                  />

                  <p className="mt-2 text-[11px] leading-5 text-muted">
                    Students use their admission number. Staff use their email
                    address.
                  </p>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2.5 block text-sm font-semibold text-primary"
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
                    className="school-input bg-school px-4 py-3.5 text-sm placeholder:text-muted focus:bg-surface"
                  />

                  <p className="mt-2 text-[11px] leading-5 text-muted">
                    Student default password is their last name.
                  </p>
                </div>

                {/* Sign-in button */}
                <button
                  type="submit"
                  disabled={pending}
                  className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-primary px-5 py-4 text-sm font-bold text-white shadow-lg shadow-primary/15 transition hover:bg-secondary hover:shadow-xl hover:shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span>
                    {pending ? "Signing in..." : "Sign in to portal"}
                  </span>

                  {!pending && (
                    <span className="transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  )}
                </button>
              </form>

              {/* Security information */}
              <div className="mt-7 border-t border-school pt-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/30 text-secondary">
                    <span className="text-sm">✓</span>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-primary">
                      Secure school access
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-muted">
                      Your account provides access only to the school functions
                      assigned to your role.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center sm:mt-7">
              <p className="text-xs text-muted">
                Rising Foundation Academy
              </p>

              <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-secondary">
                Academy for Excellence
              </p>

              <Link
                href="/"
                className="mt-4 inline-block text-xs font-semibold text-secondary transition hover:text-primary"
              >
                ← Back to home
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}