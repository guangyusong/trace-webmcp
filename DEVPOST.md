# TRACE — Devpost submission copy

## Project name

TRACE

## Tagline

The canvas is the prompt: a living reasoning surface shared by people and AI
agents.

## Links

- Live app: <https://trace-webmcp.callboard.workers.dev/>
- Source: <https://github.com/guangyusong/trace-webmcp>
- Demo video: `ADD_PUBLIC_YOUTUBE_URL`

## Inspiration

Visual thinking loses something when it has to be translated into a chat box.
People point, circle, cross out, group, and rearrange ideas naturally. Agents
are better at calculation, retrieval, propagation, and consistency checking.
TRACE began with a question: what if both could touch the same artifact, with
each doing the part they are best at?

The interaction borrows the immediacy of handwritten math and the feeling of a
page that writes back, then extends it beyond arithmetic. A mark on the page is
not merely a picture. It becomes semantic context an agent can inspect and act
upon.

## What it does

TRACE is a shared reasoning canvas with one compact gesture language:

- Circle means **this matters**.
- Cross out means **reject this assumption or decision**.
- Agent ink appears exactly where the reasoning belongs.
- Every operation has visible authorship and can be undone.

In the physics world, a learner circles a block on an incline. The agent reads
that exact selection, draws the force vectors, derives the acceleration, and
animates the block. The learner then crosses out friction. The semantic model
changes under the agent, so the friction vector fades and every dependent
expression recomputes from `4.06` to `4.91 m/s²`.

In the history world, a learner circles an intentionally oversimplified
`assassination → world war` arrow. The agent expands it into dated July 1914
decisions and interacting pressures, then places two source perspectives below
the model. Crossing out Russian mobilization weakens only its dependent paths
and opens a qualified negotiation window. TRACE explicitly labels this as a
possibility, not a prediction.

## Why WebMCP

Without WebMCP, an agent would have to infer meaning from pixels or bypass the
surface through a disconnected backend. TRACE instead exposes narrow semantic
operations from the live top-level page. Human gestures and agent tools update
the same React state, render into the same SVG, create the same activity
receipts, and share the same undo history.

The agent can discover 14 tools for reading selection and board state, drawing
forces, solving and simulating motion, changing assumptions, annotating and
highlighting objects, expanding causal models, comparing sources, running a
qualified counterfactual, changing scenes, and undoing work.

This makes WebMCP part of the product interaction rather than a hidden
automation layer. The important loop is human judgment → agent transformation
→ visible human intervention → agent continuation.

## How we built it

TRACE is a static React and TypeScript application rendered with SVG. A single
semantic `BoardState` is the source of truth. Closed freehand lassos are
resolved against stable object IDs using point-in-polygon hit testing. Both
direct manipulation and WebMCP handlers enter one reversible mutation path,
which updates the canvas, local persistence, and authorship receipts.

The page imperatively registers its tools through
`document.modelContext.registerTool()`. Tool definitions have narrow JSON
Schemas, human-readable titles, read-only annotations where appropriate, and
structured JSON results. A thin local bridge invokes the exact same handlers
for deterministic browser testing when native WebMCP is unavailable.

The production build is hosted as a static-assets Cloudflare Worker with no
backend, bindings, secrets, user accounts, or analytics integration.

## Challenges we ran into

The main challenge was preserving continuity between human ink and agent work.
A decorative drawing layer would have produced a convincing animation but not
a genuine shared model. We therefore made selection, assumptions, sources,
causal links, and agent output explicit semantic state.

Historical counterfactuals introduced a second challenge: the interface had to
show dependency changes without manufacturing certainty. The revised branch
is deliberately phrased as a reopened path, while other pressures and routes
to war remain visible.

We also designed native WebMCP registration, a compatibility fallback, and a
local deterministic rehearsal around the same handlers so the visible demo
does not diverge from the actual agent operations.

## Accomplishments

- One gesture language works across quantitative and interpretive domains.
- Fourteen narrow WebMCP tools manipulate visible shared state.
- Human rejection propagates through dependent calculations and causal links.
- Agent and human authorship remain visible in a common activity history.
- The entire experience is static, responsive, persistent, and reversible.
- The production URL and both complete interaction loops have been verified.

## What we learned

The strongest agent interfaces do not ask people to become prompt engineers.
They let people express judgment in the medium where the problem already
lives, then give the agent precise operations over that medium. Spatial
continuity is not polish; it is part of trust because the person can see what
changed, where it changed, and who changed it.

## What's next

The next TRACE world is a pendulum laboratory where dragging the length keeps
geometry, equations, and animated motion synchronized. A reaction bench follows:
removing a catalyst changes collision rate and activation energy without
changing equilibrium. A living-cell world will let learners knock out ATP or
restore a checkpoint and watch dependent processes stall or recover.

The long-term idea is not a collection of unrelated simulations. It is a
general semantic surface where circles establish context, arrows create
relationships, cross-outs reject premises, and agents answer where the thought
happened.

## Built with

WebMCP, React, TypeScript, SVG, Vite, Cloudflare Workers, Codex
