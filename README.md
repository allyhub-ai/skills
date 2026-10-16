# AllyHub skills

Product demo videos from a few sentences, made by your coding agent.

Runs on your machine. No account needed.

This repository holds the AllyHub skill. It teaches your agent to use the AllyHub CLI (`npx allyhub`), which previews, checks and renders videos and decks on your computer. It works in Claude Code, Codex and other agents that read skills.

## Install

```bash
npx skills add allyhub-ai/skills
```

Then ask your agent. In Claude Code:

```text
/allyhub make a 45-second demo of https://your-product.com
/allyhub cut my recording ~/Videos/take.mov into a 45-second TikTok with captions
/allyhub make 6 ad variants from these hooks and demos
```

In Codex:

```text
$allyhub make a 45-second demo of https://your-product.com
```

In another agent, ask for the skill by name: "Use the allyhub skill to make a 45-second demo of https://your-product.com".

Your agent opens a live preview in your browser (in Claude Code's desktop app, in the pane beside the chat). Circle anything you want changed and say how, then export when you are happy.

## What you need

Node.js 22.12 or newer. The CLI downloads headless Chrome the first time it needs it; rendering MP4s also needs ffmpeg, and your agent tells you how to get it if it is missing. Working with recordings uses local models, downloaded the first time they are needed and run on your computer: speech recognition (about 700 MB) and face tracking and person mattes (about 270 MB).

Making, previewing and rendering are free and need no account. Voiceover, generated images and footage, and research use credits on your allyhub.com account.

## License

The skill files in this repository are under the [MIT License](LICENSE). The AllyHub CLI they use is proprietary and has its own license. "AllyHub" and its logos are trademarks of AllyHub, Inc.; the MIT License does not grant the right to use them.
