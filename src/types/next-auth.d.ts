import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: string;
    teacherId?: string;
  }

  interface Session {
    user: {
      id: string;
      role: string;
      teacherId?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    teacherId?: string;
  }
}