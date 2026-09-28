import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        login: {
          label: "Login ID",
          type: "text",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        if (!credentials?.login || !credentials?.password) {
          return null;
        }

        const login = String(credentials.login).trim();
        const password = String(credentials.password);

        let user;

        // Student login:
        // Login ID = Admission Number
        // Password = Last Name
        if (!login.includes("@")) {
          const student = await prisma.student.findUnique({
            where: {
              admissionNo: login,
            },
            include: {
              user: {
                include: {
                  teacher: true,
                },
              },
            },
          });

          if (!student?.user || !student.user.isActive || !student.isActive) {
            return null;
          }

          user = student.user;
        } else {
          // Admin / Principal / Teacher login:
          // Login ID = Email
          user = await prisma.user.findUnique({
            where: {
              email: login.toLowerCase(),
            },
            include: {
              teacher: true,
            },
          });

          if (!user || !user.isActive) {
            return null;
          }
        }

        const passwordValid = await bcrypt.compare(
          password,
          user.passwordHash,
        );

        if (!passwordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.email,
          role: user.role,
          teacherId: user.teacher?.id,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;

        if ("teacherId" in user && user.teacherId) {
          token.teacherId = user.teacherId;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role as string;
        session.user.teacherId = token.teacherId as string | undefined;
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
});