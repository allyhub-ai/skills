# AllyHub skills

Product demo videos from a few sentences, made by your coding agent.

This repository holds the AllyHub skill and the Claude Code and Codex plugins that install it. The skill teaches your agent to use the AllyHub CLI (`npx allyhub`), which previews, checks and renders videos and decks on your computer.

```bash
npx skills add allyhub-ai/skills
```

Then ask your agent. In Claude Code:

```text
/allyhub make a 45-second demo of https://your-product.com
```

In Codex:

```text
@allyhub make a 45-second demo of https://your-product.com
```

(In the Codex CLI with the skill installed through `npx skills add`, mention it as `$allyhub`.)

## Other ways to install

As a plugin in Claude Code:

```bash
claude plugin marketplace add allyhub-ai/skills
claude plugin install allyhub@allyhub
```

Codex users can also install it from the `.codex-plugin` package in this repository. The CLI can also write the skill where your agent looks: `npx allyhub skill install`.

## What you need

Node.js 22.19 or newer. The CLI downloads headless Chrome the first time it needs it; rendering MP4s also needs ffmpeg, and your agent tells you how to get it if it is missing.

## License

The skill and plugin files in this repository are under the [MIT License](LICENSE). The AllyHub CLI they use is proprietary and has its own license. "AllyHub" and its logos are trademarks of AllyHub, Inc.; the MIT License does not grant the right to use them.
