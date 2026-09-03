export type Point = { x: number; y: number }

export type ToolMode = 'select' | 'draw' | 'lasso' | 'crossout' | 'erase'

export type SceneId = 'incline' | 'july1914'

export type Actor = 'human' | 'agent' | 'system'

export type Activity = {
  id: string
  actor: Actor
  label: string
  detail?: string
  time: string
}

export type Annotation = {
  id: string
  targetId: string
  text: string
}

export type Stroke = {
  id: string
  points: Point[]
  kind: 'ink' | 'crossout' | 'lasso'
}

export type BoardState = {
  scene: SceneId
  selectedIds: string[]
  highlightedIds: string[]
  showForces: boolean
  solved: boolean
  frictionEnabled: boolean
  motionRevision: number
  historyChainExpanded: boolean
  historySourcesCompared: boolean
  historyCounterfactualEventId: string | null
  annotations: Annotation[]
  strokes: Stroke[]
}

export type ToolResult = Record<string, unknown>

export type ToolDefinition = {
  name: string
  title?: string
  description: string
  inputSchema: Record<string, unknown>
  annotations?: {
    readOnlyHint?: boolean
    untrustedContentHint?: boolean
  }
}

export type ToolInvoker = (
  name: string,
  args?: Record<string, unknown>,
) => Promise<ToolResult>
