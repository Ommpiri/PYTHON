import { Auth } from "@auth/core";
import { authConfig } from "@/server/auth";

const handlers = {
  GET: (req: Request) => Auth(req, authConfig),
  POST: (req: Request) => Auth(req, authConfig),
};

export const { GET, POST } = handlers;
