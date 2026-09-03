# TRACE

TRACE is a working WebMCP prototype for the OpenAI WebMCP Challenge: a shared reasoning surface where a person communicates with ink, selection, and spatial gestures while an agent reads and changes the same semantic model.

The prototype now contains two polished loops built on one gesture language.

Physics:

1. A person circles a block on a physics diagram.
2. The circle becomes a structured `block-1` selection that an agent can inspect.
3. The agent draws forces and solves the motion in place through WebMCP tools.
4. The person crosses out the friction vector.
5. The shared assumption changes and the dependent answer visibly recomputes from `4.06` to `4.91 m/s²`.

History:

1. A person circles the oversimplified `assassination → war` link.
2. The agent expands it into dated decisions and interacting pressures.
3. It compares sources that support different interpretations.
4. The person crosses out Russian mobilization.
5. The causal path weakens and a qualified counterfactual branch appears.

There is no parallel chat artifact. Human ink and agent actions touch the same board. Use the **Incline / July 1914** switcher to move between scenes.

The historical scene is intentionally simplified and its counterfactual is
explicitly non-predictive. The dates, source choices, and interpretation
guardrails are documented in [HISTORY_NOTES.md](HISTORY_NOTES.md).

## Run it

```bash
npm install
npm run dev
```

Open the printed local URL. Choose a scene and press **Rehearse agent**. The board stops when it needs a human judgment: strike through the friction arrow in physics or Russian mobilization in history.

On a phone, the canvas is horizontally scrollable so its semantic marks remain
legible; use **Select** when you want to swipe-pan, then switch back to **Circle**
or **Cross out** to draw.

Production check:

```bash
npm run build
npm start
```

`npm start` listens on all interfaces at port `4180`, including this machine's
Tailscale interface. This machine also proxies it through Tailscale Serve, so
the recommended secure URL from another device on the same tailnet is:

```text
https://c3d-standard-16-8core-64ram.taila8a1a.ts.net:8452
```

To recreate or remove that HTTPS proxy:

```bash
tailscale serve --bg --https=8452 4180
tailscale serve --https=8452 off
```

## WebMCP integration

TRACE registers fourteen imperative tools on the current WebMCP draft API, `document.modelContext.registerTool()`. It falls back to the older `navigator.modelContext` host for compatibility.

| Tool | Purpose |
| --- | --- |
| `set_scene` | Open a learning scene through the agent interface |
| `get_board_state` | Read objects, values, assumptions, selection, and visible agent work |
| `get_selection` | Read what the person clicked or circled |
| `select_objects` | Focus shared semantic objects visibly |
| `draw_force_vectors` | Draw labeled vectors in place |
| `solve_motion` | Calculate from live board state and show the derivation |
| `simulate_motion` | Turn the solved physics model into visible movement |
| `set_assumption` | Change an assumption and propagate dependent work |
| `add_annotation` | Explain beside the object, not in a chat sidebar |
| `highlight_objects` | Share attention with the person |
| `expand_causal_chain` | Replace a simplistic link with missing historical decisions |
| `compare_sources` | Contextualize sources with competing implications |
| `run_counterfactual` | Remove a decision and redraw the remaining causal paths |
| `undo_last_change` | Reverse the latest mutation |

In browsers without native WebMCP, the exact same tools are available to the local test bridge:

```js
window.traceWebMCP.listTools()
await window.traceWebMCP.callTool('get_board_state')
await window.traceWebMCP.callTool('draw_force_vectors', {
  bodyId: 'block-1',
  includeFriction: true,
})
await window.traceWebMCP.callTool('solve_motion', { bodyId: 'block-1' })
await window.traceWebMCP.callTool('set_assumption', {
  assumption: 'friction',
  enabled: false,
})
```

That bridge is intentionally thin: it invokes the same handlers that are registered with WebMCP, so local rehearsal tests the actual product operations rather than a parallel demo implementation.

## Suggested agent prompt

> Inspect the board and my current selection. Draw every force acting on the selected object, then solve its motion directly on the board. Preserve my own ink and keep each change visible and reversible.

After crossing out the friction arrow:

> I rejected one assumption on the board. Inspect the current state and update everything that depends on it.

History:

> Inspect the causal link I circled. If it is too simple, add the missing dated decisions and compare sources that complicate the idea that war was inevitable. Put the reasoning on the timeline, not in chat.

After crossing out mobilization:

> Treat my cross-out as a counterfactual. Redraw which paths remain possible and clearly separate evidence from speculation.

## Architecture

```text
human gesture ─┐
               ├─> semantic BoardState ─> SVG surface
WebMCP tool  ──┘          │
                          ├─> activity/receipts
                          └─> history/undo
```

- React owns one semantic `BoardState`.
- SVG renders both human and agent marks with different authorship cues.
- Gesture recognition turns a closed lasso into stable semantic object IDs.
- Every tool mutates the same state through one reversible operation path.
- The activity rail makes agency, provenance, and consequences visible.

## Why this is WebMCP-native

The difficult part is not calculating incline physics. The value is continuity: the person points and rejects assumptions in the way that is natural for them; the agent reads exact semantic state and performs precise multi-object updates; both see and manipulate one live artifact. No screenshot guessing and no backend workflow that bypasses the interface.

## Where it goes next

The next executable worlds are a pendulum whose geometry, equation, and motion
stay synchronized; a reaction bench where removing a catalyst changes rate but
not equilibrium; and a living cell where knocking out ATP visibly stalls every
dependent process. [WORLDS.md](WORLDS.md) specifies the magic beat and WebMCP
tool surface for each, plus ecosystems, geometry, music, debugging, negotiation,
and evidence-aware idea maps.

## License

MIT © 2026 Guangyu Song. See [LICENSE](LICENSE).
