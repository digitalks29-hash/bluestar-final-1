import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { renderSitePage } = await import("@/lib/site-html.server");
        return renderSitePage("index", request);
      },
    },
  },
});
