# TRACE demo video

This folder produces the 92-second challenge cut at 1920x1080 with Remotion.
It combines the real app B-roll, a native WebMCP capture from ChatGPT's built-in
browser, short ElevenLabs voice beats, burned-in captions, and original sound
effects. A quiet original editorial pulse supports the intentional gaps without
turning the piece into a continuous monologue.

```bash
cd video
npm install
npm run audio
npm run typecheck
npm run render
npm run still
```

Final outputs are written to `video/output/`. The edit intentionally uses no
stock footage, simulated tool UI, or third-party trademarks.
