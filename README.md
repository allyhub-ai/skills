# AllyHub

Make videos and decks as TypeScript, docs as MDX and sheets as CSV with your coding agent. Preview, check and export on your computer. No account is needed for local work.

## Install

```sh
npx skills add allyhub-ai/skills -g
```

Then ask your agent to use AllyHub. The skill uses the CLI:

```sh
npx allyhub help
```

Needs Node.js 22.19 or newer. The CLI downloads headless Chrome when first needed. MP4 rendering also needs ffmpeg. Cloud generation and research are optional and use credits on your [AllyHub](https://allyhub.com) account.

This skill accompanies AllyHub 0.1.0-alpha.6.

## Codex

Ask Codex: "Read github.com/allyhub-ai/skills to install AllyHub for Codex".

For the agent: do these steps in order, tell the person in a line what each one changed, and stop at the first that fails, with its error.

1. Run `node --version`. If Node is missing or older than 22.19, ask the person to install the LTS from https://nodejs.org, and stop.
2. Run `npx -y allyhub skill install --agent codex --global` outside the sandbox (it needs the network). It downloads AllyHub, which takes a minute the first time and prints nothing meanwhile, puts the skill in `~/.agents/skills/allyhub`, and adds a rule in `~/.codex/rules/` that lets `allyhub` and `npx -y allyhub` run outside the sandbox: they start a local preview server and headless Chrome.
3. Run `npx -y allyhub doctor`. If it says ffmpeg is missing, give the person the install command it prints: the preview works without it, an MP4 export does not.
4. Tell the person AllyHub is ready, for example: `$allyhub make a 30-second demo of https://your-product.com`. If they already asked for something, read `~/.agents/skills/allyhub/SKILL.md` and do it.

## License

The skill is MIT licensed. The CLI and its packages are proprietary and carry their own licenses. AllyHub and its logos are trademarks of AllyHub, Inc.
