# TRACE — challenge handoff

Live demo: **[trace-webmcp.callboard.workers.dev](https://trace-webmcp.callboard.workers.dev/)**

Source: **[github.com/guangyusong/trace-webmcp](https://github.com/guangyusong/trace-webmcp)**

## One-line pitch

TRACE is a living reasoning surface where a person communicates with circles, cross-outs, and spatial edits while an agent understands and updates the same semantic artifact through WebMCP.

## Submission description

Most AI interfaces make people translate visual thought into chat prompts, then return an answer somewhere else. TRACE keeps the thought and the answer on one surface. A learner circles a block in a physics sketch; that gesture becomes structured context. An agent draws forces, derives its acceleration, and animates the motion in place. If the learner crosses out friction, every dependent vector and calculation updates.

The same gestures work in history. Circle an oversimplified `assassination → world war` link and the agent expands the missing July 1914 decisions and compares sources that complicate inevitability. Cross out mobilization and the causal model bends into a qualified counterfactual. The subject changes; the shared language does not.

WebMCP is essential because the agent does not guess at pixels or bypass the interface through a backend API. The page exposes exact operations over the current board—selection, forces, assumptions, annotations, highlights, calculation, and undo—while the person remains in visual control. The GUI and the agent tool surface are two interfaces to one live model.

## Three-minute demo

### 0:00–0:20 — the premise

Open on the untouched inclined-plane problem.

> “Chat is the wrong shape for visual thinking. TRACE gives a person and an agent one shared surface.”

Circle the block with the lasso. Point out the inline human receipt and call `get_selection` through the agent.

### 0:20–0:55 — physics becomes alive

Prompt the agent:

> “Inspect what I circled. Draw every force acting on it, then solve its motion directly on the board.”

The agent calls:

1. `get_selection`
2. `get_board_state`
3. `draw_force_vectors`
4. `solve_motion`
5. `simulate_motion`

Pause on the drawn vectors, the in-place `4.06 m/s²` result, and the block moving along the same ramp. Show the activity receipts.

### 0:55–1:15 — human interrupts physically

Select the cross-out tool and strike through the friction arrow.

> “I did not write another prompt. I changed the model itself.”

The friction vector fades, the coefficient is rejected, the formula loses its friction term, and the answer changes to `4.91 m/s²`.

Ask the agent:

> “What changed?”

It can call `get_board_state` and see the exact live assumption rather than inferring it from a screenshot.

### 1:15–1:30 — one language, another subject

Switch to **July 1914**. The untouched page shows one seductive arrow from an assassination to general war.

> “A straight arrow is easy to draw—and usually a terrible account of history.”

Circle the arrow.

### 1:30–2:10 — the agent expands meaning

Ask:

> “What is missing, and what evidence complicates the idea that war was inevitable?”

The agent calls `expand_causal_chain` and `compare_sources`. Dated decisions draw themselves between the endpoints; structural pressures appear behind them; two primary-source perspectives enter below the model.

### 2:10–2:35 — history becomes counterfactual

Cross out Russian general mobilization.

The downstream arrows weaken, a negotiation window branches off, and the interpretation changes from **not one cause** to **the path bends** with an explicit uncertainty label.

> “The agent does not claim to know an alternate past. It redraws what remains plausible.”

### 2:35–2:50 — control and trust

Call `undo_last_change`. Show Russian mobilization and the original causal path
return. Expand **Tool surface** and briefly show that actions are bounded and
semantic. Point to authorship in the inline receipt: brown `A` for agent, blue
`Y` for the person.

### 2:50–3:00 — why it generalizes

> “The physics problem is one legible demonstration of a more general primitive: direct manipulation for intelligence. Circle means ‘this.’ Cross-out means ‘not this.’ An arrow means ‘relate these.’ WebMCP turns those cheap human gestures into precise agent context, and lets the agent answer where the thought happened.”

End on:

> “The canvas is the prompt.”

## Acceptance checklist

- [x] Gesture selection resolves to stable semantic IDs.
- [x] Fourteen WebMCP tools register on `document.modelContext`.
- [x] The local bridge invokes the exact same handlers for browser testing.
- [x] Agent operations mutate visible shared state and return structured JSON.
- [x] Human cross-out changes a semantic assumption.
- [x] Dependent calculation updates correctly (`4.06 → 4.91 m/s²`).
- [x] Physics motion animates from the calculated state.
- [x] History expands a simplistic causal link into dated decisions.
- [x] Source comparison and qualified counterfactuals render in place.
- [x] Changes have visible actor receipts and undo.
- [x] Board state persists locally.
- [x] Keyboard and reduced-motion fallbacks are present.
- [x] Deploy the static `dist/` build to a public HTTPS URL.
- [x] Verify both live interaction loops on the production URL.
- [ ] Test that URL in ChatGPT’s in-app browser.
- [ ] Record and attach the final demo video.

## Technical notes

- Current API: `document.modelContext.registerTool()`.
- Compatibility fallback: `navigator.modelContext` for older experimental hosts.
- Stack: React, TypeScript, SVG, Vite; no backend or API key required.
- The force calculation is `a = g(sin θ − μ cos θ)` with `θ = 30°`, `μ = 0.10`, and `g = 9.81 m/s²`.
