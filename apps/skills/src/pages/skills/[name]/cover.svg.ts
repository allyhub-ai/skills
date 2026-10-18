import type { APIRoute } from "astro";
import { skills, type Skill } from "../../../lib/skills";

export function getStaticPaths() {
  return skills().map((skill) => ({ params: { name: skill.name }, props: { skill } }));
}
export const GET: APIRoute = ({ props }) =>
  new Response((props as { skill: Skill }).skill.card.cover, { headers: { "Content-Type": "image/svg+xml" } });
