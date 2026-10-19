// allyhub.com/skills/ and /.well-known/agent-skills/, from the built site.
// - The skill index lives at well-known/ in the build and is served at
//   /.well-known/agent-skills/, where the Agent Skills discovery standard puts it.
// - A page is answered with its Markdown copy when the request prefers
//   Markdown (Accept: text/markdown); HTML pages name that copy in a Link header.

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

const INDEX = "/.well-known/agent-skills/";
/** The gallery's pages: /skills/ and /skills/<name>/. */
const PAGE = /^\/skills\/(?:([a-z0-9]+(?:-[a-z0-9]+)*)\/)?$/u;

/** How much a request's Accept header wants a media type (0 when not at all). */
function weight(accept: string, type: string): number {
  let best = 0;
  for (const part of accept.split(",")) {
    const [range = "", ...params] = part.trim().toLowerCase().split(";");
    const q = Number(params.map((p) => p.trim()).find((p) => p.startsWith("q="))?.slice(2) ?? 1);
    const [major] = type.split("/");
    if (range === type || range === `${major}/*`) best = Math.max(best, Number.isFinite(q) ? q : 0);
  }
  return best;
}

const prefersMarkdown = (request: Request): boolean => {
  const accept = request.headers.get("accept") ?? "";
  const markdown = weight(accept, "text/markdown");
  return markdown > 0 && markdown >= weight(accept, "text/html");
};

/** The same request for another path in the assets. */
const at = (request: Request, path: string): Request => {
  const url = new URL(request.url);
  url.pathname = path;
  return new Request(url, request);
};

const withHeaders = (response: Response, headers: Record<string, string>): Response => {
  const out = new Response(response.body, response);
  for (const [name, value] of Object.entries(headers)) out.headers.set(name, value);
  return out;
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname.startsWith(INDEX))
      return env.ASSETS.fetch(at(request, `/well-known/agent-skills/${pathname.slice(INDEX.length)}`));
    if (pathname === "/skills") return Response.redirect(new URL("/skills/", request.url).toString(), 301);

    const page = PAGE.exec(pathname);
    if (!page) {
      const response = await env.ASSETS.fetch(request);
      return pathname.endsWith(".md")
        ? withHeaders(response, { "Content-Type": "text/markdown; charset=utf-8" })
        : response;
    }
    const markdown = page[1] ? `/skills/${page[1]}.md` : "/skills/llms.txt";
    if (prefersMarkdown(request)) {
      const response = await env.ASSETS.fetch(at(request, markdown));
      if (response.ok)
        return withHeaders(response, { "Content-Type": "text/markdown; charset=utf-8", Vary: "Accept" });
    }
    const response = await env.ASSETS.fetch(request);
    if (!response.ok) return response;
    return withHeaders(response, {
      Vary: "Accept",
      Link: `<${markdown}>; rel="alternate"; type="text/markdown"`,
    });
  },
};
