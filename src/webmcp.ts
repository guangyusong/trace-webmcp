import type { ToolDefinition, ToolInvoker } from './types'

export const TRACE_TOOLS: ToolDefinition[] = [
  {
    name: 'set_scene',
    title: 'Open learning scene',
    description:
      'Open a TRACE learning scene while keeping the same shared gesture and tool language.',
    inputSchema: {
      type: 'object',
      properties: {
        scene: { type: 'string', enum: ['incline', 'july1914'] },
      },
      required: ['scene'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_board_state',
    title: 'Inspect board state',
    description:
      'Inspect the semantic objects, values, assumptions, selection, evidence state, and visible agent work on the current TRACE board.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'get_selection',
    title: 'Read human selection',
    description:
      'Return the object IDs the person most recently clicked or circled on the shared board.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'select_objects',
    title: 'Focus board objects',
    description:
      'Select and focus semantic board objects so the person can see exactly what the agent is operating on.',
    inputSchema: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Semantic object IDs to select.',
        },
      },
      required: ['ids'],
      additionalProperties: false,
    },
  },
  {
    name: 'draw_force_vectors',
    title: 'Draw force vectors',
    description:
      'Draw and label the force vectors acting on a selected body directly on the diagram. Use after inspecting the board and selection.',
    inputSchema: {
      type: 'object',
      properties: {
        bodyId: { type: 'string', enum: ['block-1'] },
        includeFriction: {
          type: 'boolean',
          description: 'Whether the friction assumption should be represented.',
        },
      },
      required: ['bodyId'],
      additionalProperties: false,
    },
  },
  {
    name: 'solve_motion',
    title: 'Solve motion',
    description:
      'Calculate the motion for the selected diagram from its live values and assumptions, then write the derivation in place.',
    inputSchema: {
      type: 'object',
      properties: { bodyId: { type: 'string', enum: ['block-1'] } },
      required: ['bodyId'],
      additionalProperties: false,
    },
  },
  {
    name: 'simulate_motion',
    title: 'Animate motion',
    description:
      'Animate the solved physical system on the shared board so the person can connect the diagram and equations to motion.',
    inputSchema: {
      type: 'object',
      properties: { bodyId: { type: 'string', enum: ['block-1'] } },
      required: ['bodyId'],
      additionalProperties: false,
    },
  },
  {
    name: 'set_assumption',
    title: 'Change an assumption',
    description:
      'Enable or reject a named assumption and immediately update every dependent vector and calculation on the shared board.',
    inputSchema: {
      type: 'object',
      properties: {
        assumption: { type: 'string', enum: ['friction'] },
        enabled: { type: 'boolean' },
        reason: { type: 'string', maxLength: 160 },
      },
      required: ['assumption', 'enabled'],
      additionalProperties: false,
    },
  },
  {
    name: 'add_annotation',
    title: 'Annotate an object',
    description:
      'Write a short explanation beside a semantic board object instead of replying in a separate chat pane.',
    inputSchema: {
      type: 'object',
      properties: {
        targetId: {
          type: 'string',
          description: 'ID of a semantic object currently visible on the board.',
        },
        text: { type: 'string', maxLength: 120 },
      },
      required: ['targetId', 'text'],
      additionalProperties: false,
    },
  },
  {
    name: 'highlight_objects',
    title: 'Highlight board objects',
    description:
      'Temporarily highlight the board objects relevant to an explanation or detected mistake.',
    inputSchema: {
      type: 'object',
      properties: {
        ids: { type: 'array', items: { type: 'string' } },
      },
      required: ['ids'],
      additionalProperties: false,
    },
  },
  {
    name: 'expand_causal_chain',
    title: 'Expand causal chain',
    description:
      'Replace an oversimplified historical causal link with the missing dated decisions and relationships, drawn directly on the timeline.',
    inputSchema: {
      type: 'object',
      properties: {
        fromEventId: { type: 'string', enum: ['event-assassination'] },
        toEventId: { type: 'string', enum: ['event-war'] },
      },
      required: ['fromEventId', 'toEventId'],
      additionalProperties: false,
    },
  },
  {
    name: 'compare_sources',
    title: 'Compare historical sources',
    description:
      'Place two historical sources in context and annotate how their perspectives support different interpretations.',
    inputSchema: {
      type: 'object',
      properties: {
        sourceIds: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['source-blank-cheque', 'source-willy-nicky'],
          },
          minItems: 2,
          maxItems: 2,
        },
      },
      required: ['sourceIds'],
      additionalProperties: false,
    },
  },
  {
    name: 'run_counterfactual',
    title: 'Run historical counterfactual',
    description:
      'Remove one historical decision as a counterfactual and redraw which downstream paths remain plausible without claiming certainty.',
    inputSchema: {
      type: 'object',
      properties: {
        removeEventId: { type: 'string', enum: ['event-mobilization'] },
      },
      required: ['removeEventId'],
      additionalProperties: false,
    },
  },
  {
    name: 'undo_last_change',
    title: 'Undo last change',
    description:
      'Undo the most recent agent-authored board mutation while preserving the person’s own ink.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
]

type ModelContext = {
  registerTool: (
    tool: ToolDefinition & {
      execute: (args: Record<string, unknown>) => Promise<unknown>
    },
    options?: { signal?: AbortSignal },
  ) => Promise<void> | void
}

declare global {
  interface Window {
    traceWebMCP?: {
      listTools: () => ToolDefinition[]
      callTool: ToolInvoker
    }
  }
}

export function registerTraceTools(invoke: ToolInvoker) {
  const controller = new AbortController()
  const documentContext = (document as Document & { modelContext?: ModelContext })
    .modelContext
  const legacyContext = (
    navigator as Navigator & { modelContext?: ModelContext }
  ).modelContext
  const context = documentContext ?? legacyContext

  window.traceWebMCP = {
    listTools: () => TRACE_TOOLS,
    callTool: invoke,
  }

  if (context?.registerTool) {
    TRACE_TOOLS.forEach((definition) => {
      const registration = context.registerTool(
        {
          ...definition,
          execute: (args) => invoke(definition.name, args),
        },
        { signal: controller.signal },
      )
      registration?.catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        console.warn(`Could not register WebMCP tool ${definition.name}`, error)
      })
    })
  }

  return {
    native: Boolean(documentContext),
    legacy: !documentContext && Boolean(legacyContext),
    unregister: () => {
      controller.abort()
      delete window.traceWebMCP
    },
  }
}
