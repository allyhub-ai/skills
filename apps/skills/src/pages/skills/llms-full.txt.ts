import type { APIRoute } from "astro";
import { llmsText, skillMarkdown, skills } from "../../lib/skills";

export const GET: APIRoute = () =>
  new Response([llmsText(), ...skills().map(skillMarkdown)].join("\n---\n\n"));
