import type { APIRoute } from "astro";
import { skillMarkdown, skills, type Skill } from "../../lib/skills";

export function getStaticPaths() {
  return skills().map((skill) => ({ params: { name: skill.name }, props: { skill } }));
}
export const GET: APIRoute = ({ props }) =>
  new Response(skillMarkdown((props as { skill: Skill }).skill), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
