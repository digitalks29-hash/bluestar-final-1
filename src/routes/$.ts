import { createFileRoute } from "@tanstack/react-router";

const PAGES: Record<string, "about" | "services" | "contact" | "results" | "book" | "areas"> = {
  about: "about",
  "about/index.html": "about",
  services: "services",
  "services/index.html": "services",
  contact: "contact",
  "contact/index.html": "contact",
  results: "results",
  "results/index.html": "results",
  book: "book",
  "book/index.html": "book",
  areas: "areas",
  "areas/index.html": "areas",
};

export const Route = createFileRoute("/$")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const key = (params._splat ?? "").replace(/^\/+|\/+$/g, "");
        const page = PAGES[key];
        if (!page) return new Response("Not found", { status: 404 });
        const { renderSitePage } = await import("@/lib/site-html.server");
        return renderSitePage(page, request);
      },
    },
  },
});
