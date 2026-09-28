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
      <div className="flex min-h-screen">
        <section className="relative hidden overflow-hidden bg-primary lg:flex lg:w-[52%] lg:flex-col lg:justify-between">
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-secondary/40" />
          <div className="absolute -bottom-40 -left-40 h-[30rem] w-[30rem] rounded-full border-[60px] border-accent/10" />

          <div className="relative z-10 flex h-full flex-col p-12 xl:p-16">
            <div className="flex items-start gap-5">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-secondary/60 shadow-xl">
                <Image
                  src="/school-logo.png"
                  alt="Rising Foundation Academy logo"
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                  priority
                />
              </div>

              <div className="pt-1">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-accent">
                  Welcome to
                </p>

                <h1 className="mt-2 max-w-md text-2xl font-black uppercase leading-tight tracking-tight text-white xl:text-3xl">
                  Rising Foundation Academy
                </h1>

                <p className="mt-2 text-sm font-medium tracking-[0.12em] text-accent">
                  ACADEMY FOR EXCELLENCE
                </p>
              </div>
            </div>

            <div className="my-auto max-w-2xl py-16">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-white/5 px-4 py-2">
                <span className="h-2 w-2 rounded-full bg-accent" />

                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                  School Management System
                </span>
              </div>

              <h2 className="text-4xl font-black leading-[1.08] tracking-tight text-white xl:text-6xl">
                Empowering
                <span className="block text-accent">
                  excellence in education.
                </span>
              </h2>

              <p className="mt-7 max-w-xl text-base leading-7 text-accent xl:text-lg">
                Access your academic dashboard to manage students, teachers,
                classes, subjects, results, academic performance, and school
                activities from one secure platform.
              </p>

              <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
                {[
                  ["01", "Manage", "Students & classes"],
                  ["02", "Record", "Academic results"],
                  ["03", "Publish", "Approved results"],
                ].map(([number, title, description]) => (
                  <div
                    key={number}
                    className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm"
                  >
                    <div className="text-sm font-black text-accent">
                      {number}
                    </div>

                    <div className="mt-3 text-sm font-bold text-white">
                      {title}
                    </div>

                    <div className="mt-1 text-xs leading-5 text-accent">
                      {description}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 pt-6">
              <p className="max-w-xl text-xs leading-5 text-accent">
                <span className="font-semibold text-accent">
                  School Address:
                </span>{" "}
                Adjacent to Smart Capital Street, Along Yaro College Road,
                Angwan Gwari, Suleja, Niger State.
              </p>

              <p className="mt-3 text-xs text-accent">
                © {new Date().getFullYear()} Rising Foundation Academy. All
                rights reserved.
              </p>
            </div>
          </div>
        </section>

        <section className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-10 flex items-center gap-4 lg:hidden">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-secondary/60 shadow-lg">
                <Image
                  src="/school-logo.png"
                  alt="Rising Foundation Academy logo"
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                  priority
                />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
                  Rising Foundation Academy
                </p>

                <p className="mt-1 text-xs font-medium tracking-[0.12em] text-secondary">
                  ACADEMY FOR EXCELLENCE
                </p>
              </div>
            </div>

            <div className="mb-9">
              <div className="mb-5 inline-flex items-center rounded-full bg-accent/30 px-3 py-1.5">
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

            <div className="school-card rounded-3xl p-6 shadow-[0_20px_60px_rgba(74,44,32,0.10)] sm:p-8">
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

            <div className="mt-7 text-center">
              <p className="text-xs text-muted">
                Rising Foundation Academy
              </p>

              <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-accent">
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