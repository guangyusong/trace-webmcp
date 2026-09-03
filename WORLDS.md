# TRACE worlds

TRACE should grow by adding **semantic worlds**, not unrelated mini-apps. Every world keeps the same compact language:

```text
circle = this matters
box = treat these together
arrow = relate these
cross-out = reject or remove
underline = demand evidence
? = explain the uncertainty here
```

## The next three

### Pendulum laboratory

Draw or drag a pendulum, circle its length, and ask `period?`. The agent measures the live geometry, adds the governing relationship, and animates the predicted swing. Shorten the string by dragging the bob upward and both the equation and motion update. Cross out `small-angle approximation` and the agent replaces the simple model with a nonlinear one.

**Magic beat:** sketch a second pendulum, draw `=` between them, and the agent adjusts one length until their periods synchronize.

Potential tools: `measure_system`, `set_parameter`, `derive_period`, `start_simulation`, `compare_systems`, `set_approximation`.

### Reaction bench

Place molecular species on the paper and draw an arrow between reactants and products. The agent balances atoms by changing coefficients in place, then animates collisions and product formation. Circle a bond and write `why breaks?`; an energy profile grows beside that bond. Cross out a catalyst and the energy barrier rises while equilibrium stays fixed.

**Magic beat:** the human removes the catalyst with one stroke; the particles visibly slow, the activation-energy diagram changes, but the final equilibrium annotation does not—teaching a subtle distinction without a lecture.

Potential tools: `count_atoms`, `balance_reaction`, `draw_energy_profile`, `set_catalyst`, `simulate_collisions`, `explain_bond`.

### Living cell

Start with a sparse cell diagram. Circle the nucleus and ask `what depends on this?`; the agent draws information flow from DNA to RNA to protein. Move a growth-factor token to the membrane and the pathway lights up, transcription begins, and the cell grows. Cross out ATP and every energy-dependent process visibly stalls.

**Magic beat:** circle an overactive pathway and write `cancer?`; the agent identifies the failed checkpoints spatially, then lets the learner restore one checkpoint and watch downstream growth normalize.

Potential tools: `trace_pathway`, `set_signal`, `advance_time`, `knock_out_component`, `restore_checkpoint`, `compare_cell_states`.

## Other strong worlds

### Ecosystem in a page margin

Draw arrows between wolves, deer, and grass. The agent turns them into a live food web. Cross out wolves and the deer population surges before vegetation collapses. Circle the oscillation and ask `why delayed?`.

### Geometry that argues back

Sketch a proof, circle a step, and ask `necessary?`. The agent constructs a counterexample beside it. Drag one vertex and all invariant claims remain while accidental properties fade.

### Constitutional convention

Place competing rights and institutions around a proposed law. Draw `conflict` arrows. The agent surfaces precedent and tradeoffs; crossing out an enforcement power propagates practical consequences without pretending there is one correct political answer.

### Music as visible causality

Draw a melodic contour and circle a tense interval. The agent harmonizes around it, then animates voice-leading. Move one note and every dependent chord updates audibly and visually.

### Debugging state machines

Sketch states and transitions. Circle a path and ask `can this deadlock?`. The agent adds the missing edge case, animates the failing trace, and lets the programmer cross out an invalid assumption to rerun the path.

### Negotiation table

Arrange price, exclusivity, timing, and risk as objects. Circle a non-negotiable term. The agent generates packages around that constraint; cross out exclusivity and the Pareto frontier redraws instead of producing another prose proposal.

### Family tree of ideas

Put inventions, people, and movements on a timeline. Draw a disputed influence arrow. The agent adds evidence and counterevidence on opposite sides; changing one source’s reliability weakens only the claims that depend on it.

## Product rule

A scene belongs in TRACE only if it contains a moment where:

1. a human gesture communicates judgment more cheaply than a prompt;
2. the agent performs several precise semantic operations better than a person would;
3. the result changes the shared artifact in place;
4. the person can interrupt physically; and
5. the agent can continue from the changed state without starting over.

That is the through-line. The subject can change; the interaction philosophy cannot.
