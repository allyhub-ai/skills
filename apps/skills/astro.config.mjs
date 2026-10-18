// The gallery is served at allyhub.com/skills/: every page is under
// src/pages/skills/, and the skill index under public/well-known/, which
// allyhub.com serves as /.well-known/agent-skills/.
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://allyhub.com",
  trailingSlash: "always",
  // Styles inline: allyhub.com forwards only /skills/ here, and a crawler
  // gets the whole page in one request.
  build: { format: "directory", inlineStylesheets: "always" },
});
