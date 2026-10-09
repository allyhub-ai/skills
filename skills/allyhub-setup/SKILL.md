---
name: allyhub-setup
description: Set up AllyHub after it is installed in ChatGPT. Check that this computer can make videos, choose the defaults for new videos, offer to sign in, then open AllyHub. Use when the person chooses Set up for AllyHub or asks to set AllyHub up.
---

# Set up AllyHub

Get this computer ready to make videos and choose a few defaults. Keep it short: one question at a time, and the person can skip any of them.

1. **The command.** If the `allyhub_settings_read` tool is missing or says AllyHub is not installed, the AllyHub command is not on this computer. Tell the person to run `npm install -g allyhub` (it needs Node.js 22.12 or later), then restart ChatGPT, and stop here.
2. **This computer.** Run `allyhub doctor`. Headless Chrome downloads itself the first time it is needed. If it says ffmpeg is missing, give the person the install command for their system (on a Mac with Homebrew, `brew install ffmpeg`) and wait; do not install system software yourself.
3. **Defaults.** Call `allyhub_settings_read` with `{}`, then ask, using what the person has already said:
   - "Which language should new videos be in?" Map it to `language`: `"en"`, `"zh-cn"`, or `"auto"` for the language they write to ChatGPT in.
   - "Should AllyHub offer a natural voiceover for videos that usually have one? It is a paid extra, priced before it is made." Map it to `voiceover`.
   - "Should AllyHub ask before every paid step, or only above a number of credits?" Map it to `askAbove` (0 asks every time).

   Call `allyhub_settings_update` with a `set` holding only what they changed, for example `{"set":{"language":"zh-cn"}}`. If nothing changed, skip it. Say what was saved from the values the tool returns; if it fails, say so.
4. **Account.** Making, previewing and rendering videos is free and needs no account. Paid extras (voiceover, generated images and footage, music, web data) need one. Offer to sign in; on a yes, run `allyhub login`, show the address it prints, and wait. Never ask for or type a password or key.
5. **Open AllyHub.** Call `allyhub_home` with `{}` and invite the person to pick what to make. If they installed AllyHub during another task, go back to that task in this conversation.
