import Google from "@auth/core/providers/google";
import Nodemailer from "@auth/core/providers/nodemailer";
import PostgresAdapter from "@auth/pg-adapter";
import { pool } from "./db";

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Nodemailer({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  ],
  adapter: PostgresAdapter(pool),
  secret: process.env.AUTH_SECRET,
  trustHost: true,
};
