import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/site-edits")({
  server: {
    handlers: {
      POST: async () => {
        return new Response("Editing is turned off.", { status: 403 });
      },
    },
  },
});
