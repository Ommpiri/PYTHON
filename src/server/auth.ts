import Google from "@auth/core/providers/google";
import Nodemailer from "@auth/core/providers/nodemailer";
import PostgresAdapter from "@auth/pg-adapter";
import { pool } from "./db";

const providers: any[] = [];

if (process.env.AUTH_GOOGLE_ID) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  );
}

if (process.env.EMAIL_SERVER) {
  providers.push(
    Nodemailer({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    })
  );
}

export const authConfig = {
  providers,
  adapter: PostgresAdapter(pool),
  secret: process.env.AUTH_SECRET || "default_secret_for_development",
  trustHost: true,
  basePath: "/api/auth",
};
