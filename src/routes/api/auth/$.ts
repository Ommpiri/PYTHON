import { createAPIFileRoute } from "@tanstack/react-start/api";
import { Auth } from "@auth/core";
import { authConfig } from "../../../server/auth";

export const APIRoute = createAPIFileRoute("/api/auth/$")({
  GET: async ({ request }) => {
    return Auth(request, authConfig);
  },
  POST: async ({ request }) => {
    return Auth(request, authConfig);
  },
});
