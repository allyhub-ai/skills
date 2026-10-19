import type { APIRoute } from "astro";
import { llmsText } from "../../lib/skills";

export const GET: APIRoute = () => new Response(llmsText());
