# TRACE demo video

This folder produces the 50-second challenge cut at 1920x1080 with Remotion.
It combines the real app B-roll, a native WebMCP capture from ChatGPT's built-in
browser, short ElevenLabs voice beats, burned-in captions, and original sound
effects. A crisp marker-and-desk rhythm supports nine short voice beats while
motivated camera pushes keep each action legible.

```bash
cd video
npm install
npm run audio
npm run capture
npm run typecheck
npm run render
npm run still
```

Final outputs are written to `video/output/`. The capture script records the
real local React/SVG surface at 1920x1080. The edit intentionally uses no stock
footage, simulated tool UI, or third-party trademarks.
