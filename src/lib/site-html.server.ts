import { randomBytes, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import indexHtml from "../../site/pages/index.html?raw";
import aboutHtml from "../../site/pages/about.html?raw";
import servicesHtml from "../../site/pages/services.html?raw";
import contactHtml from "../../site/pages/contact.html?raw";
import resultsHtml from "../../site/pages/results.html?raw";
import bookHtml from "../../site/pages/book.html?raw";
import areasHtml from "../../site/pages/areas.html?raw";
import overridesRaw from "../content/overrides.json?raw";

const EDIT_KEY = "BlueStar1485";
const PREVIEW_ORIGIN = "https://bluestar-janitorial-v4-preview.vercel.app";
const STORE_PATH = join(process.cwd(), "src/content/overrides.json");
const UPLOAD_DIR = join(process.cwd(), "public/uploads");

const PAGES = {
  index: indexHtml,
  about: aboutHtml,
  services: servicesHtml,
  contact: contactHtml,
  results: resultsHtml,
  book: bookHtml,
  areas: areasHtml,
} as const;

export type SitePage = keyof typeof PAGES;

type TextEdit = { type: "text"; from: string; to: string };
type AttrEdit = { type: "attr"; attr: "href" | "src"; from: string; to: string };
type Edit = TextEdit | AttrEdit;

type Store = { edits: Edit[] };

const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"]);

function keyOk(key: string): boolean {
  const a = Buffer.from(key);
  const b = Buffer.from(EDIT_KEY);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

const AMP = "&" + "amp;";
const LT = "&" + "lt;";
const GT = "&" + "gt;";
const NBSP = "&" + "nbsp;";
const APOS = "&" + "#39;";
const QUOT = "&" + "quot;";

function escapeHtml(value: string): string {
  return value.replaceAll("&", AMP).replaceAll("<", LT).replaceAll(">", GT);
}

function parseStore(raw: string): Store {
  try {
    const data = JSON.parse(raw) as Store;
    if (!data || !Array.isArray(data.edits)) return { edits: [] };
    return { edits: data.edits.filter(isEdit) };
  } catch {
    return { edits: [] };
  }
}

function isEdit(value: unknown): value is Edit {
  if (!value || typeof value !== "object") return false;
  const edit = value as Edit;
  if (edit.type === "text") {
    return typeof edit.from === "string" && typeof edit.to === "string";
  }
  if (edit.type === "attr") {
    return (
      (edit.attr === "href" || edit.attr === "src") &&
      typeof edit.from === "string" &&
      typeof edit.to === "string"
    );
  }
  return false;
}

async function readStore(): Promise<Store> {
  try {
    return parseStore(await readFile(STORE_PATH, "utf8"));
  } catch {
    return parseStore(overridesRaw);
  }
}

async function writeStore(store: Store): Promise<void> {
  await mkdir(join(process.cwd(), "src/content"), { recursive: true });
  const tmp = `${STORE_PATH}.tmp`;
  await writeFile(tmp, JSON.stringify(store, null, 2));
  await rename(tmp, STORE_PATH);
}

function textNeedles(from: string): string[] {
  const escaped = escapeHtml(from);
  return [
    ...new Set([
      escaped,
      escaped.replaceAll("\u00a0", NBSP),
      escaped.replaceAll("'", APOS),
      escaped.replaceAll('"', QUOT),
      from,
    ]),
  ];
}

function applyText(html: string, from: string, to: string): { html: string; applied: boolean } {
  if (!from || from === to) return { html, applied: true };
  const next = escapeHtml(to);
  for (const needle of textNeedles(from)) {
    const token = `>${needle}<`;
    if (!html.includes(token)) continue;
    return { html: html.split(token).join(`>${next}<`), applied: true };
  }
  return { html, applied: false };
}

function applyAttr(html: string, attr: "href" | "src", from: string, to: string): { html: string; applied: boolean } {
  if (!from || from === to) return { html, applied: true };
  const safeTo = to.replace(/"/g, "%22");
  if (attr === "src") {
    const path = from.split("?")[0] ?? from;
    if (path.length > 8 && html.includes(path)) {
      return { html: html.split(path).join(safeTo), applied: true };
    }
  }
  const variants = [...new Set([from, from.replaceAll("&", AMP)])];
  for (const variant of variants) {
    const token = `${attr}="${variant}"`;
    if (!html.includes(token)) continue;
    return { html: html.split(token).join(`${attr}="${safeTo}"`), applied: true };
  }
  return { html, applied: false };
}

function applyEdits(html: string, edits: Edit[]): { html: string; missed: string[] } {
  const parts = html.split(/(<script\b[\s\S]*?<\/script>)/gi);
  let chunks = parts;
  const missed: string[] = [];
  for (const edit of edits) {
    let applied = false;
    chunks = chunks.map((part) => {
      if (/^<script\b/i.test(part)) return part;
      const result =
        edit.type === "text"
          ? applyText(part, edit.from, edit.to)
          : applyAttr(part, edit.attr, edit.from, edit.to);
      if (result.html !== part) applied = true;
      return result.html;
    });
    if (!applied) missed.push(edit.from);
  }
  return { html: chunks.join(""), missed };
}

function injectEditor(html: string, page: SitePage): string {
  const tags = [
    `<link rel="stylesheet" href="/bluestar-header.css" />`,
    `<script src="/bluestar-header.js" defer></script>`,
  ];
  if (page === "index") {
    tags.push(`<link rel="stylesheet" href="/review-rail.css" />`);
    tags.push(`<script src="/review-rail.js" defer></script>`);
  }
  if (page === "results") {
    tags.push(`<link rel="stylesheet" href="/results-gallery.css" />`);
    tags.push(`<script src="/results-gallery.js" defer></script>`);
  }
  const block = tags.join("");
  if (html.includes("</body>")) return html.replace("</body>", `${block}</body>`);
  return html + block;
}

export async function renderSitePage(page: SitePage, request: Request): Promise<Response> {
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;
  let html = PAGES[page].replaceAll(PREVIEW_ORIGIN, origin);
  const store = await readStore();
  html = applyEdits(html, store.edits).html;
  html = injectEditor(html, page);
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function mergeEdit(store: Store, edit: Edit) {
  if (edit.type === "text") {
    const from = edit.from.slice(0, 500);
    const to = edit.to.slice(0, 800);
    if (!from.trim() || from === to) return;
    const chain = store.edits.find((item) => item.type === "text" && item.to === from);
    if (chain && chain.type === "text") {
      chain.to = to;
      if (chain.from === chain.to) store.edits = store.edits.filter((item) => item !== chain);
      return;
    }
    const same = store.edits.find((item) => item.type === "text" && item.from === from);
    if (same && same.type === "text") {
      same.to = to;
      return;
    }
    store.edits.push({ type: "text", from, to });
    return;
  }
  const from = edit.from.slice(0, 1000);
  const to = edit.to.slice(0, 1000);
  if (!from || from === to) return;
  if (edit.attr === "href" && !/^(https?:|tel:|mailto:|\.?\/|#)/i.test(to)) return;
  if (edit.attr === "src" && !/^(\/|https:)/i.test(to)) return;
  const same = store.edits.find(
    (item) => item.type === "attr" && item.attr === edit.attr && item.from === from,
  );
  if (same && same.type === "attr") {
    same.to = to;
    return;
  }
  store.edits.push({ type: "attr", attr: edit.attr, from, to });
}

async function saveUploads(file: File): Promise<string> {
  const ext = extname(file.name || "").toLowerCase();
  if (!IMAGE_EXT.has(ext)) throw new Error("Use a PNG, JPG, WEBP, GIF, or SVG.");
  if (file.size > 8_000_000) throw new Error("Image must be under 8MB.");
  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${Date.now().toString(36)}-${randomBytes(4).toString("hex")}${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(join(UPLOAD_DIR, name), bytes);
  return `/uploads/${name}`;
}

export async function handleSiteEditRequest(request: Request): Promise<Response> {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const key = String(form.get("key") ?? "");
      if (!keyOk(key)) return Response.json({ error: "Wrong edit code." }, { status: 401 });
      const file = form.get("file");
      if (!(file instanceof File)) return Response.json({ error: "No image." }, { status: 400 });
      const url = await saveUploads(file);
      return Response.json({ url });
    }

    const body = (await request.json()) as { key?: string; edits?: unknown[] };
    if (!keyOk(String(body.key ?? ""))) {
      return Response.json({ error: "Wrong edit code." }, { status: 401 });
    }
    const incoming = Array.isArray(body.edits) ? body.edits.filter(isEdit).slice(0, 200) : [];
    const store = await readStore();
    for (const edit of incoming) mergeEdit(store, edit);
    store.edits = store.edits.slice(-400);
    await writeStore(store);
    const missed = new Set(incoming.map((edit) => edit.from));
    for (const page of Object.values(PAGES)) {
      for (const item of applyEdits(page, incoming).missed) missed.add(item);
      for (const edit of incoming) {
        const result = applyEdits(page, [edit]);
        if (result.missed.length === 0) missed.delete(edit.from);
      }
    }
    return Response.json({ ok: true, saved: store.edits.length, missed: [...missed].slice(0, 12) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save.";
    const readOnly = /EROFS|EPERM|EACCES|read-only/i.test(message);
    return Response.json(
      {
        error: readOnly
          ? "This published copy can't store edits. Change the text here in the preview, then ask me to update the live site."
          : message,
      },
      { status: readOnly ? 503 : 500 },
    );
  }
}
