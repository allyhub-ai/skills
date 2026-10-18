// The gallery's own sitemap, under /skills/ where allyhub.com serves it
// (allyhub.com's robots.txt names it).
import type { APIRoute } from "astro";
import { BASE, skills } from "../../lib/skills";

export const GET: APIRoute = () => {
  const all = skills();
  const latest = all.map((s) => s.updated).filter(Boolean).sort().at(-1);
  const url = (loc: string, lastmod?: string) =>
    `<url><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`;
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[
      url(`${BASE}/`, latest),
      ...all.map((s) => url(s.url, s.updated)),
    ].join("\n")}\n</urlset>\n`,
    { headers: { "Content-Type": "application/xml" } },
  );
};
