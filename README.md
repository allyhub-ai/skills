# AllyHub

Make videos and decks as TypeScript, docs as MDX and sheets as CSV with your coding agent. Preview, check and export on your computer. No account is needed for local work.

## Install

```sh
npx skills add allyhub-ai/skills --skill allyhub -g -a claude-code codex
```

That is the allyhub skill, for every folder. Then ask your agent to use AllyHub. The skill uses the CLI:

```sh
npx allyhub help
```

Needs Node.js 22.19 or newer. The CLI downloads headless Chrome when first needed. MP4 rendering also needs ffmpeg. Cloud generation and research are optional and use credits on your [AllyHub](https://allyhub.com) account.

This skill accompanies AllyHub 0.1.0-alpha.8.

## Skills for a project

The other skills in `skills/` each add one kind of work to a project: Product demos, Explainers, Launch shorts, Candidate users. They are installed in the project they are used in, never for every folder, so everyone who works on it has the same ones. In the project's folder:

```sh
npx -y allyhub skill add product-demos
```

or with the skills CLI, from AllyHub's index:

```sh
npx skills add https://allyhub.com --skill product-demos
```

They are listed at [allyhub.com/skills](https://allyhub.com/skills). Their index follows the Agent Skills discovery standard, at `https://allyhub.com/.well-known/agent-skills/index.json`; this repository's CI builds it from `skills/`, and the gallery (`apps/skills`) from it and each skill's page in `content/skills/`, on every change. `skills/README.md` is how a skill here is written, and `AGENTS.md` how this repository, an AllyHub project of its own, is worked in.

## Codex

Ask Codex: "Read github.com/allyhub-ai/skills to install AllyHub for Codex".

For the agent: do these steps in order, tell the person in a line what each one changed, and stop at the first that fails, with its error.

1. Run `node --version`. If Node is missing or older than 22.19, ask the person to install the LTS from https://nodejs.org, and stop.
2. Run `npx -y allyhub skill install --agent codex --global` outside the sandbox (it needs the network). It downloads AllyHub, which takes a minute the first time and prints nothing meanwhile, puts the skill in `~/.agents/skills/allyhub`, and adds a rule in `~/.codex/rules/` that lets `allyhub` and `npx -y allyhub` run outside the sandbox: they start a local preview server and headless Chrome.
3. Run `npx -y allyhub doctor`. If it says ffmpeg is missing, give the person the install command it prints: the preview works without it, an MP4 export does not.
4. Tell the person AllyHub is ready, for example: `$allyhub make a 30-second demo of https://your-product.com`. If they already asked for something, read `~/.agents/skills/allyhub/SKILL.md` and do it.

## License

The skill is MIT licensed. The CLI and its packages are proprietary and carry their own licenses. AllyHub and its logos are trademarks of AllyHub, Inc.
