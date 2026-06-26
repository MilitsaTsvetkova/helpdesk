import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET environment variable is required");
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true, disableSignUp: true },
  trustedOrigins: process.env.CORS_ORIGINS?.split(",") ?? [
    "http://localhost:5173",
    "http://localhost:3000",
  ],
  user: {
    additionalFields: {
      role: { type: "string", required: true, input: false },
      deletedAt: { type: "date", required: false, input: false },
    },
  },
});
