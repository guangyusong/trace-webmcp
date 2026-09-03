# TRACE — ChatGPT Site tools acceptance test

Run this test in the latest ChatGPT desktop app. Use GPT-5.6 Sol or GPT-5.6
Terra; GPT-5.6 Luna does not currently expose Site tools. Confirm **Enable site
tools** is on under **Settings → Browser → Permissions**.

Public app: <https://trace-webmcp.callboard.workers.dev/>

## 1. Discovery

1. Open the public app in ChatGPT's built-in browser, not an iframe or an
   ordinary external-browser tab.
2. Select **Site tools** in the address bar.
3. Open **Available site tools**.
4. Confirm that exactly 14 TRACE tools are visible:

```text
set_scene
get_board_state
get_selection
select_objects
draw_force_vectors
solve_motion
simulate_motion
set_assumption
add_annotation
highlight_objects
expand_causal_chain
compare_sources
run_counterfactual
undo_last_change
```

Pass: the app rail says **WebMCP connected**, and the address-bar menu lists
the tools above.

## 2. Physics collaboration

1. Press **Reset** and open **Incline**.
2. Use **Circle** to circle the block.
3. Send this exact prompt:

> Inspect the board and my current selection. Draw every force acting on the
> selected object, solve its motion directly on the board, and animate the
> result. Preserve my ink and keep every change visible and reversible.

Expected semantic journey:

```text
get_selection → get_board_state → draw_force_vectors → solve_motion
→ simulate_motion
```

Pass: brown force vectors appear, the derivation ends at `4.06 m/s²`, and the
block moves down the incline.

4. Use **Cross out** to strike through the brown friction arrow.
5. Send:

> I rejected one assumption on the board. Inspect the live state and explain
> what changed without restoring it.

Pass: `get_board_state` reports friction disabled; the vector fades, the
friction term is rejected, and the result is `4.91 m/s²`.

## 3. Historical reasoning

1. Press **Reset**, open **July 1914**, and circle the direct causal arrow.
2. Send:

> Inspect the causal link I circled. If it is too simple, add the missing dated
> decisions and compare the two sources that complicate the idea that war was
> inevitable. Put the reasoning on the timeline, not in chat.

Expected semantic journey:

```text
get_selection → get_board_state → expand_causal_chain → compare_sources
```

Pass: five dated event marks, four interacting pressures, and two source
fragments are visible on the shared page.

3. Cross out Russian general mobilization.
4. Send:

> Treat my cross-out as a counterfactual. Inspect the board, redraw which paths
> remain plausible, and clearly separate evidence from speculation.

Pass: the path after mobilization weakens, **negotiation window** appears, and
the interpretation says **the path bends** / **war remains possible, not
fixed**.

## 4. Evidence to capture

- Screenshot **Available site tools** with all 14 tools discoverable.
- Screenshot or short recording of **Recently used → Sources** after each
  scene.
- Capture the app rail showing human `Y` and agent `A` receipts.
- Record the exact model and ChatGPT desktop-app version used.
- Confirm there are no failed or cancelled calls in Recently used.

Do not mark the in-app-browser checklist complete from ordinary Chrome testing
or from the local `window.traceWebMCP` fallback.
