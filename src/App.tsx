import {
  Atom,
  Check,
  CircleDot,
  Eraser,
  Landmark,
  Lasso,
  MousePointer2,
  Pencil,
  Play,
  Radio,
  RotateCcw,
  Sparkles,
  Undo2,
  X,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import type {
  Activity,
  BoardState,
  Point,
  SceneId,
  Stroke,
  ToolInvoker,
  ToolMode,
  ToolResult,
} from './types'
import { registerTraceTools, TRACE_TOOLS } from './webmcp'
import { HistoryScene, HISTORY_OBJECTS } from './HistoryScene'

const EMPTY_BOARD: BoardState = {
  scene: 'incline',
  selectedIds: [],
  highlightedIds: [],
  showForces: false,
  solved: false,
  frictionEnabled: true,
  motionRevision: 0,
  historyChainExpanded: false,
  historySourcesCompared: false,
  historyCounterfactualEventId: null,
  annotations: [],
  strokes: [],
}

function loadBoard(): BoardState {
  try {
    const saved = window.localStorage.getItem('trace-board-v1')
    return saved ? { ...EMPTY_BOARD, ...JSON.parse(saved) } : EMPTY_BOARD
  } catch {
    return EMPTY_BOARD
  }
}

const PHYSICS_OBJECTS = [
  { id: 'block-1', name: '10 kg block', center: { x: 450, y: 327 } },
  { id: 'ramp-1', name: '30° incline', center: { x: 585, y: 430 } },
  { id: 'friction-1', name: 'friction vector', center: { x: 500, y: 301 } },
]

function objectsForState(state: BoardState) {
  if (state.scene === 'incline') {
    return PHYSICS_OBJECTS.filter(
      (object) => object.id !== 'friction-1' || state.showForces,
    )
  }

  return HISTORY_OBJECTS.filter((object) => {
    if (object.id === 'link-simple') return !state.historyChainExpanded
    if (object.id.startsWith('source-')) return state.historySourcesCompared
    if (object.id === 'event-assassination' || object.id === 'event-war') return true
    return state.historyChainExpanded
  })
}

const TOOLS: Array<{
  id: ToolMode
  label: string
  hint: string
  icon: typeof Pencil
}> = [
  { id: 'select', label: 'Select', hint: 'V', icon: MousePointer2 },
  { id: 'draw', label: 'Ink', hint: 'D', icon: Pencil },
  { id: 'lasso', label: 'Circle', hint: 'L', icon: Lasso },
  { id: 'crossout', label: 'Cross out', hint: 'X', icon: X },
  { id: 'erase', label: 'Erase ink', hint: 'E', icon: Eraser },
]

const initialActivity: Activity[] = [
  {
    id: 'ready',
    actor: 'system',
    label: 'Shared surface ready',
    detail: `${TRACE_TOOLS.length} semantic tools exposed`,
    time: 'now',
  },
]

function pathFromPoints(points: Point[]) {
  if (!points.length) return ''
  return `M ${points.map((point) => `${point.x} ${point.y}`).join(' L ')}`
}

function pointInPolygon(point: Point, polygon: Point[]) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y
    const intersects =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi || 0.00001) + xi
    if (intersects) inside = !inside
  }
  return inside
}

function response(text: string): ToolResult {
  return { message: text }
}

function timestamp() {
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date())
}

function App() {
  const [board, setBoard] = useState<BoardState>(loadBoard)
  const [history, setHistory] = useState<BoardState[]>([])
  const [activity, setActivity] = useState<Activity[]>(initialActivity)
  const [mode, setMode] = useState<ToolMode>('lasso')
  const [draftStroke, setDraftStroke] = useState<Point[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [bridge, setBridge] = useState<'native' | 'legacy' | 'local'>('local')
  const [demoRunning, setDemoRunning] = useState(false)
  const [notice, setNotice] = useState(() =>
    board.scene === 'july1914'
      ? board.historyCounterfactualEventId
        ? 'Counterfactual restored from local save'
        : board.historyChainExpanded
          ? 'Cross out a decision to ask “what if?”'
          : 'Circle the causal arrow'
      : board.solved
        ? 'Board restored from local save'
        : board.selectedIds.length
          ? 'Selection restored from local save'
          : 'Circle the block to begin',
  )
  const svgRef = useRef<SVGSVGElement>(null)
  const canvasStageRef = useRef<HTMLElement>(null)
  const boardRef = useRef(board)
  const historyRef = useRef<BoardState[]>([])
  const demoTimers = useRef<number[]>([])

  useEffect(() => {
    boardRef.current = board
    window.localStorage.setItem('trace-board-v1', JSON.stringify(board))
  }, [board])

  const addActivity = useCallback(
    (actor: Activity['actor'], label: string, detail?: string) => {
      setActivity((current) => [
        {
          id: `${Date.now()}-${Math.random()}`,
          actor,
          label,
          detail,
          time: timestamp(),
        },
        ...current,
      ])
    },
    [],
  )

  const mutate = useCallback(
    (
      actor: Activity['actor'],
      label: string,
      update: (current: BoardState) => BoardState,
      detail?: string,
      track = true,
    ) => {
      const current = boardRef.current
      if (track) {
        const nextHistory = [...historyRef.current.slice(-14), current]
        historyRef.current = nextHistory
        setHistory(nextHistory)
      }
      const next = update(current)
      boardRef.current = next
      setBoard(next)
      addActivity(actor, label, detail)
      return next
    },
    [addActivity],
  )

  const undo = useCallback((actor: 'human' | 'agent' = 'human') => {
    const items = historyRef.current
    const previous = items.at(-1)
    if (!previous) return
    const nextHistory = items.slice(0, -1)
    historyRef.current = nextHistory
    setHistory(nextHistory)
    boardRef.current = previous
    setBoard(previous)
    addActivity(actor, 'Undid the last board change')
  }, [addActivity])

  const invokeTool = useCallback<ToolInvoker>(
    async (name, args = {}) => {
      const current = boardRef.current

      if (name === 'set_scene') {
        const scene = args.scene === 'july1914' ? 'july1914' : 'incline'
        mutate(
          'agent',
          scene === 'july1914' ? 'Opened the July 1914 model' : 'Opened the incline model',
          (state) => ({
            ...state,
            scene,
            selectedIds: [],
            highlightedIds: [],
            strokes: [],
          }),
          'one gesture language · a different subject',
        )
        setMode('lasso')
        setNotice(scene === 'july1914' ? 'Circle the causal arrow' : 'Circle the block to begin')
        return response(`Opened the ${scene} scene on the shared board.`)
      }

      if (name === 'get_board_state') {
        if (current.scene === 'july1914') {
          return {
            scene: 'july-1914-causal-model',
            objects: objectsForState(current).map(({ id, name: objectName }) => ({
              id,
              name: objectName,
            })),
            selectedIds: current.selectedIds,
            causalModel: {
              expanded: current.historyChainExpanded,
              events: current.historyChainExpanded
                ? ['event-assassination', 'event-ultimatum', 'event-mobilization', 'event-declarations', 'event-war']
                : ['event-assassination', 'event-war'],
              interactingPressures: current.historyChainExpanded
                ? ['nationalism', 'alliance commitments', 'military timetables', 'leaders choices']
                : [],
            },
            sourcesCompared: current.historySourcesCompared,
            counterfactualRemovedEvent: current.historyCounterfactualEventId,
            interpretation: current.historyCounterfactualEventId
              ? 'The direct path bends; war remains possible but is not fixed.'
              : current.historyChainExpanded
                ? 'Pressure, commitments, and contingent choices interacted.'
                : 'The current direct causal link is oversimplified.',
          }
        }

        return {
          scene: 'inclined-plane',
          objects: objectsForState(current).map(({ id, name: objectName }) => ({
            id,
            name: objectName,
          })),
          values: { massKg: 10, angleDegrees: 30, frictionCoefficient: 0.1 },
          assumptions: { friction: current.frictionEnabled },
          selectedIds: current.selectedIds,
          agentWork: {
            forcesVisible: current.showForces,
            solutionVisible: current.solved,
          },
        }
      }

      if (name === 'get_selection') {
        return {
          selectedIds: current.selectedIds,
          message: current.selectedIds.length
            ? `Selected objects: ${current.selectedIds.join(', ')}`
            : 'No semantic objects are selected.',
        }
      }

      if (name === 'select_objects') {
        const requestedIds = Array.isArray(args.ids)
          ? args.ids.filter((id): id is string => typeof id === 'string')
          : []
        const visibleIds = new Set(objectsForState(current).map(({ id }) => id))
        const ids = requestedIds.filter((id) => visibleIds.has(id))
        mutate(
          'agent',
          `Focused ${ids.length} object${ids.length === 1 ? '' : 's'}`,
          (state) => ({ ...state, selectedIds: ids, highlightedIds: ids }),
          ids.join(', '),
        )
        setNotice('The agent shares your focus')
        return response(`Selected ${ids.join(', ') || 'nothing'} on the visible board.`)
      }

      if (name === 'draw_force_vectors') {
        const includeFriction =
          typeof args.includeFriction === 'boolean'
            ? args.includeFriction
            : current.frictionEnabled
        mutate(
          'agent',
          'Drew three force vectors',
          (state) => ({
            ...state,
            showForces: true,
            frictionEnabled: includeFriction,
            selectedIds: ['block-1'],
            highlightedIds: [],
          }),
          includeFriction ? 'gravity · normal · friction' : 'gravity · normal',
        )
        setNotice('Agent ink landed beside your own')
        return response(
          `Force vectors were drawn directly on block-1${includeFriction ? ', including friction' : ''}.`,
        )
      }

      if (name === 'solve_motion') {
        mutate(
          'agent',
          'Solved the motion in place',
          (state) => ({ ...state, showForces: true, solved: true }),
          current.frictionEnabled ? 'a = 4.06 m/s²' : 'a = 4.91 m/s²',
        )
        setNotice('Cross out an assumption; the answer will follow')
        return response(
          current.frictionEnabled
            ? 'Using μ = 0.10, the acceleration is 4.06 m/s² down the incline.'
            : 'With friction rejected, the acceleration is 4.91 m/s² down the incline.',
        )
      }

      if (name === 'simulate_motion') {
        mutate(
          'agent',
          'Animated the solved motion',
          (state) => ({
            ...state,
            showForces: true,
            solved: true,
            motionRevision: state.motionRevision + 1,
          }),
          current.frictionEnabled ? 'sliding at 4.06 m/s²' : 'sliding at 4.91 m/s²',
        )
        setNotice('The equation became motion')
        return response(
          `Animated block-1 accelerating down the incline at ${current.frictionEnabled ? '4.06' : '4.91'} m/s².`,
        )
      }

      if (name === 'set_assumption') {
        const enabled = Boolean(args.enabled)
        mutate(
          'agent',
          enabled ? 'Restored the friction assumption' : 'Rejected the friction assumption',
          (state) => ({
            ...state,
            frictionEnabled: enabled,
            showForces: true,
            solved: state.solved,
          }),
          enabled ? 'μ = 0.10' : 'downstream work recomputed',
        )
        setNotice(enabled ? 'Friction restored' : 'One human mark changed the model')
        return response(
          enabled
            ? 'Friction is enabled; dependent work now uses μ = 0.10.'
            : 'Friction is disabled; the vector and all dependent calculations were updated.',
        )
      }

      if (name === 'add_annotation') {
        const text = String(args.text ?? '').slice(0, 120)
        const targetId = String(args.targetId ?? 'block-1')
        const visibleIds = new Set(objectsForState(current).map(({ id }) => id))
        if (!text || !visibleIds.has(targetId)) {
          return response('Annotation rejected: provide visible targetId and non-empty text.')
        }
        mutate('agent', 'Added an in-place explanation', (state) => ({
          ...state,
          annotations: [
            ...state.annotations,
            { id: `${Date.now()}`, targetId, text },
          ],
        }))
        return response(`Wrote “${text}” beside ${targetId}.`)
      }

      if (name === 'highlight_objects') {
        const requestedIds = Array.isArray(args.ids)
          ? args.ids.filter((id): id is string => typeof id === 'string')
          : []
        const visibleIds = new Set(objectsForState(current).map(({ id }) => id))
        const ids = requestedIds.filter((id) => visibleIds.has(id))
        mutate(
          'agent',
          'Highlighted relevant objects',
          (state) => ({ ...state, highlightedIds: ids }),
          ids.join(', '),
        )
        return response(`Highlighted ${ids.join(', ')}.`)
      }

      if (name === 'expand_causal_chain') {
        mutate(
          'agent',
          'Expanded the missing causal chain',
          (state) => ({
            ...state,
            scene: 'july1914',
            historyChainExpanded: true,
            selectedIds: [],
            highlightedIds: ['event-ultimatum', 'event-mobilization', 'event-declarations'],
          }),
          '3 decisions · 4 interacting pressures',
        )
        setNotice('A straight arrow became a field of choices')
        return response(
          'Expanded the direct assassination-to-war link with the Austrian ultimatum, Russian mobilization, German declarations, and interacting structural pressures.',
        )
      }

      if (name === 'compare_sources') {
        mutate(
          'agent',
          'Compared two primary-source perspectives',
          (state) => ({ ...state, scene: 'july1914', historySourcesCompared: true }),
          'commitment to escalate · private search for an exit',
        )
        setNotice('The sources disagree with inevitability')
        return response(
          'Placed the German “blank cheque” and the Willy–Nicky telegrams in context. One supports alliance escalation; the other complicates claims of inevitability.',
        )
      }

      if (name === 'run_counterfactual') {
        mutate(
          'agent',
          'Redrew a counterfactual path',
          (state) => ({
            ...state,
            scene: 'july1914',
            historyChainExpanded: true,
            historyCounterfactualEventId: 'event-mobilization',
            selectedIds: ['event-mobilization'],
          }),
          'mobilization removed · negotiation window reopened',
        )
        setNotice('The model bends without pretending to predict')
        return response(
          'Removed Russian general mobilization as a counterfactual. The immediate declaration path weakens and a negotiation window reopens, while other paths to war remain possible.',
        )
      }

      if (name === 'undo_last_change') {
        undo('agent')
        return response('Undid the most recent board change.')
      }

      return response(`Unknown TRACE tool: ${name}`)
    },
    [mutate, undo],
  )

  useEffect(() => {
    const registration = registerTraceTools(invokeTool)
    setBridge(registration.native ? 'native' : registration.legacy ? 'legacy' : 'local')
    return registration.unregister
  }, [invokeTool])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) {
        if (event.key.toLowerCase() === 'z') {
          event.preventDefault()
          undo('human')
        }
        return
      }
      const keyMap: Record<string, ToolMode> = {
        v: 'select',
        d: 'draw',
        l: 'lasso',
        x: 'crossout',
        e: 'erase',
      }
      const next = keyMap[event.key.toLowerCase()]
      if (next) setMode(next)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo])

  const reset = useCallback((scene: SceneId = boardRef.current.scene) => {
    demoTimers.current.forEach(window.clearTimeout)
    demoTimers.current = []
    const freshBoard = { ...EMPTY_BOARD, scene }
    boardRef.current = freshBoard
    historyRef.current = []
    setBoard(freshBoard)
    setHistory([])
    setActivity(initialActivity)
    setDemoRunning(false)
    setMode('lasso')
    setNotice(scene === 'july1914' ? 'Circle the causal arrow' : 'Circle the block to begin')
  }, [])

  const switchScene = useCallback((scene: SceneId) => {
    if (scene === boardRef.current.scene) return
    demoTimers.current.forEach(window.clearTimeout)
    demoTimers.current = []
    mutate(
      'human',
      scene === 'july1914' ? 'Opened the July 1914 model' : 'Opened the incline model',
      (state) => ({
        ...state,
        scene,
        selectedIds: [],
        highlightedIds: [],
        strokes: [],
      }),
      'same gestures · new subject',
    )
    setDemoRunning(false)
    setMode('lasso')
    setNotice(scene === 'july1914' ? 'Circle the causal arrow' : 'Circle the block to begin')
  }, [mutate])

  const startDemo = useCallback(() => {
    const scene = boardRef.current.scene
    reset(scene)
    setDemoRunning(true)
    setNotice('Agent is reading the same board you see')
    const schedule = (callback: () => void, delay: number) => {
      demoTimers.current.push(window.setTimeout(callback, delay))
    }

    if (scene === 'july1914') {
      schedule(() => void invokeTool('select_objects', { ids: ['link-simple'] }), 350)
      schedule(
        () => void invokeTool('expand_causal_chain', {
          fromEventId: 'event-assassination',
          toEventId: 'event-war',
        }),
        1150,
      )
      schedule(
        () => void invokeTool('compare_sources', {
          sourceIds: ['source-blank-cheque', 'source-willy-nicky'],
        }),
        2550,
      )
      schedule(() => {
        setDemoRunning(false)
        setMode('crossout')
        setNotice('Your turn — cross out Russian mobilization')
      }, 3900)
      return
    }

    schedule(() => void invokeTool('select_objects', { ids: ['block-1'] }), 350)
    schedule(
      () =>
        void invokeTool('draw_force_vectors', {
          bodyId: 'block-1',
          includeFriction: true,
        }),
      1200,
    )
    schedule(() => void invokeTool('solve_motion', { bodyId: 'block-1' }), 2450)
    schedule(() => void invokeTool('simulate_motion', { bodyId: 'block-1' }), 3550)
    schedule(() => {
      setDemoRunning(false)
      setMode('crossout')
      setNotice('Your turn — strike through the brown friction arrow')
    }, 5050)
  }, [invokeTool, reset])

  useEffect(
    () => () => demoTimers.current.forEach(window.clearTimeout),
    [],
  )

  useEffect(() => {
    const stage = canvasStageRef.current
    if (!stage || !window.matchMedia('(max-width: 760px)').matches) return
    const frame = window.requestAnimationFrame(() => {
      stage.scrollLeft = board.scene === 'july1914' ? 40 : 35
    })
    return () => window.cancelAnimationFrame(frame)
  }, [board.scene])

  const clientPoint = useCallback((event: ReactPointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const point = svg.createSVGPoint()
    point.x = event.clientX
    point.y = event.clientY
    const matrix = svg.getScreenCTM()?.inverse()
    if (!matrix) return { x: 0, y: 0 }
    const transformed = point.matrixTransform(matrix)
    return { x: transformed.x, y: transformed.y }
  }, [])

  const onPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (mode === 'select') return
    event.currentTarget.setPointerCapture(event.pointerId)
    setDraftStroke([clientPoint(event)])
    setIsDrawing(true)
  }

  const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!isDrawing) return
    setDraftStroke((points) => [...points, clientPoint(event)])
  }

  const finishStroke = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    const points = draftStroke
    setDraftStroke([])
    if (points.length < 3) return

    if (mode === 'lasso') {
      const visibleObjects = objectsForState(boardRef.current)
      const selected = visibleObjects
        .filter((object) => pointInPolygon(object.center, points))
        .map((object) => object.id)
      if (!selected.length) {
        setNotice(
          boardRef.current.scene === 'july1914'
            ? 'Circle an event or causal link to give the agent context'
            : 'Circle a diagram object to give the agent context',
        )
        return
      }
      mutate(
        'human',
        `Circled ${selected.length === 1 ? visibleObjects.find((item) => item.id === selected[0])?.name : `${selected.length} objects`}`,
        (state) => ({
          ...state,
          selectedIds: selected,
          highlightedIds: [],
          strokes: [
            ...state.strokes,
            { id: `${Date.now()}`, points, kind: 'lasso' },
          ],
        }),
        'gesture became structured context',
      )
      setNotice('Selection is now agent-readable')
      return
    }

    if (mode === 'crossout') {
      const current = boardRef.current
      const crossesFriction = points.some(
        (point) => point.x > 420 && point.x < 560 && point.y > 250 && point.y < 350,
      )
      const crossesMobilization = points.some(
        (point) => point.x > 525 && point.x < 655 && point.y > 220 && point.y < 355,
      )
      const stroke: Stroke = {
        id: `${Date.now()}`,
        points,
        kind: 'crossout',
      }
      if (current.scene === 'july1914' && crossesMobilization && current.historyChainExpanded) {
        mutate(
          'human',
          'Crossed out Russian mobilization',
          (state) => ({
            ...state,
            historyCounterfactualEventId: 'event-mobilization',
            selectedIds: ['event-mobilization'],
            strokes: [...state.strokes, stroke],
          }),
          'a decision became a counterfactual',
        )
        setNotice('The historical model changed under the agent')
        demoTimers.current.push(
          window.setTimeout(() => {
            addActivity('agent', 'Redrew the remaining paths', 'war possible · no longer fixed')
            setNotice('One cross-out reopened history')
          }, 520),
        )
      } else if (current.scene === 'incline' && crossesFriction && current.showForces) {
        mutate(
          'human',
          'Crossed out the friction assumption',
          (state) => ({
            ...state,
            frictionEnabled: false,
            strokes: [...state.strokes, stroke],
          }),
          'μ no longer applies',
        )
        setNotice('The shared model changed under the agent')
        demoTimers.current.push(
          window.setTimeout(() => {
            addActivity('agent', 'Recomputed dependent work', '4.06 → 4.91 m/s²')
            setNotice('One mark. Every dependency updated.')
          }, 520),
        )
      } else {
        mutate('human', 'Added a rejection mark', (state) => ({
          ...state,
          strokes: [...state.strokes, stroke],
        }))
      }
      return
    }

    if (mode === 'erase') {
      mutate('human', 'Erased personal ink', (state) => ({ ...state, strokes: [] }))
      return
    }

    if (mode === 'draw') {
      mutate('human', 'Added freehand ink', (state) => ({
        ...state,
        strokes: [
          ...state.strokes,
          { id: `${Date.now()}`, points, kind: 'ink' },
        ],
      }))
    }
  }

  const selectObject = (id: string) => {
    if (mode !== 'select') return
    mutate('human', `Selected ${objectsForState(boardRef.current).find((item) => item.id === id)?.name}`, (state) => ({
      ...state,
      selectedIds: [id],
      highlightedIds: [],
    }))
    setNotice('Selection is now agent-readable')
  }

  const answer = board.frictionEnabled ? '4.06' : '4.91'
  const selectedBlock = board.selectedIds.includes('block-1')
  const blockHighlighted = board.highlightedIds.includes('block-1')
  const hasStarted = board.showForces || board.solved || board.selectedIds.length > 0

  const bridgeLabel = useMemo(() => {
    if (bridge === 'native') return 'WebMCP connected'
    if (bridge === 'legacy') return 'WebMCP legacy host'
    return 'Local tool bridge'
  }, [bridge])

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup" aria-label="TRACE">
          <span className="brand-mark"><CircleDot size={18} strokeWidth={2.4} /></span>
          <span className="brand-name">TRACE</span>
          <span className="brand-tag">shared reasoning surface</span>
        </div>
        <div className="scene-switcher" role="tablist" aria-label="Learning scenes">
          <button
            type="button"
            role="tab"
            aria-selected={board.scene === 'incline'}
            className={board.scene === 'incline' ? 'active' : ''}
            onClick={() => switchScene('incline')}
          >
            <Atom size={13} /> Incline
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={board.scene === 'july1914'}
            className={board.scene === 'july1914' ? 'active' : ''}
            onClick={() => switchScene('july1914')}
          >
            <Landmark size={13} /> July 1914
          </button>
          <span className="saved-state"><Check size={13} /> local save</span>
        </div>
        <div className="header-actions">
          <button className="quiet-button" type="button" onClick={() => reset()}>
            <RotateCcw size={15} /> Reset
          </button>
          <button
            className="demo-button"
            type="button"
            onClick={startDemo}
            disabled={demoRunning}
          >
            {demoRunning ? <Sparkles size={15} /> : <Play size={15} fill="currentColor" />}
            {demoRunning ? 'Agent working…' : 'Rehearse agent'}
          </button>
        </div>
      </header>

      <section className="workspace">
        <nav className="tool-rail" aria-label="Canvas tools">
          {TOOLS.map((tool) => {
            const Icon = tool.icon
            return (
              <button
                key={tool.id}
                className={`tool-button ${mode === tool.id ? 'active' : ''}`}
                type="button"
                aria-label={tool.label}
                aria-pressed={mode === tool.id}
                data-tooltip={`${tool.label} · ${tool.hint}`}
                onClick={() => setMode(tool.id)}
              >
                <Icon size={19} strokeWidth={1.8} />
              </button>
            )
          })}
          <span className="tool-divider" />
          <button
            className="tool-button"
            type="button"
            aria-label="Undo"
            data-tooltip="Undo · ⌘Z"
            onClick={() => undo('human')}
            disabled={!history.length}
          >
            <Undo2 size={19} strokeWidth={1.8} />
          </button>
        </nav>

        <section
          ref={canvasStageRef}
          className={`canvas-stage mode-${mode}`}
          aria-label="Shared reasoning board"
        >
          <div className="paper-meta">
            <span>LIVE BOARD / 01</span>
            <span className="mode-label">{mode === 'lasso' ? 'circle to give context' : mode}</span>
          </div>
          <svg
            ref={svgRef}
            className="reasoning-canvas"
            viewBox="0 0 1200 720"
            role="img"
            aria-label={
              board.scene === 'incline'
                ? 'An interactive inclined-plane physics problem'
                : 'An interactive causal timeline of July 1914'
            }
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={finishStroke}
            onPointerCancel={finishStroke}
          >
            <defs>
              <filter id="paper-noise" x="0" y="0" width="100%" height="100%">
                <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="8" result="noise" />
                <feColorMatrix in="noise" type="saturate" values="0" result="mono" />
                <feComponentTransfer in="mono" result="softNoise">
                  <feFuncA type="table" tableValues="0 0.035" />
                </feComponentTransfer>
                <feBlend in="SourceGraphic" in2="softNoise" mode="multiply" />
              </filter>
              <marker id="agent-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" className="arrow-head" />
              </marker>
            </defs>

            <rect width="1200" height="720" className="paper-fill" />
            {board.scene === 'incline' && (
            <g className="physics-scene scene-enter">
            <g className="problem-copy">
              <text x="92" y="108" className="eyebrow-svg">A block on an incline</text>
              <text x="92" y="160" className="prompt-svg">What happens next?</text>
              <text x="95" y="203" className="handwritten given-line">m = 10 kg</text>
              <text x="95" y="238" className="handwritten given-line">θ = 30°</text>
              <text x="95" y="273" className={`handwritten given-line ${!board.frictionEnabled ? 'struck-value' : ''}`}>μ = 0.10</text>
              {!board.frictionEnabled && <path d="M 90 263 L 215 280" className="human-strike visible" />}
            </g>

            <g
              className={`ramp-object ${board.selectedIds.includes('ramp-1') ? 'selected' : ''}`}
              onPointerDown={(event) => {
                event.stopPropagation()
                selectObject('ramp-1')
              }}
            >
              <path d="M 176 474 L 610 241 L 610 474 Z" className="ramp-fill" />
              <path d="M 176 474 L 610 241" className="graphite-line ramp-line" />
              <path d="M 176 474 L 610 474" className="graphite-line floor-line" />
              <path d="M 236 472 A 60 60 0 0 1 229 443" className="angle-arc" />
              <text x="245" y="458" className="handwritten angle-label">30°</text>
            </g>

            <g
              className={`block-object ${selectedBlock ? 'selected' : ''} ${blockHighlighted ? 'highlighted' : ''}`}
              transform="translate(450 327) rotate(-28)"
              onPointerDown={(event) => {
                event.stopPropagation()
                selectObject('block-1')
              }}
            >
              <rect x="-50" y="-35" width="100" height="70" rx="5" className="block-fill" />
              <path d="M -36 -17 L 32 -17 M -35 1 L 18 1 M -36 18 L 36 18" className="block-hatch" />
            </g>

            {board.motionRevision > 0 && (
              <g key={board.motionRevision} className="motion-demonstration">
                <path d="M 438 346 C 395 370, 340 398, 268 436" className="motion-trail" />
                <g className="moving-block" transform="translate(450 327)" opacity="0">
                  <animateTransform
                    attributeName="transform"
                    type="translate"
                    from="450 327"
                    to="268 425"
                    dur="3s"
                    fill="freeze"
                  />
                  <animate
                    attributeName="opacity"
                    values="0;0.88;0.76;0.22"
                    keyTimes="0;0.12;0.78;1"
                    dur="3s"
                    fill="freeze"
                  />
                  <g transform="rotate(-28)">
                    <rect x="-38" y="-26" width="76" height="52" rx="4" />
                    <path d="M -27 -10 L 24 -10 M -27 4 L 14 4 M -26 16 L 27 16" />
                  </g>
                </g>
                <text x="272" y="405" className="handwritten motion-label">a = {answer} m/s²</text>
              </g>
            )}

            {selectedBlock && !board.showForces && (
              <g className="context-actions" transform="translate(380 218)">
                <path d="M 8 46 C 0 20, 18 0, 48 0 L 222 0 C 252 0, 263 20, 252 46" className="context-tail" />
                <g
                  className="context-action"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => void invokeTool('draw_force_vectors', { bodyId: 'block-1', includeFriction: true })}
                >
                  <rect x="15" y="8" width="105" height="36" rx="18" />
                  <text x="68" y="31">forces?</text>
                </g>
                <g
                  className="context-action secondary"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => void invokeTool('solve_motion', { bodyId: 'block-1' })}
                >
                  <rect x="128" y="8" width="112" height="36" rx="18" />
                  <text x="184" y="31">solve it</text>
                </g>
              </g>
            )}

            {board.showForces && (
              <g className="agent-ink force-layer">
                <g className="force-vector force-gravity">
                  <path d="M 450 327 L 450 447" markerEnd="url(#agent-arrow)" />
                  <text x="461" y="432" className="handwritten agent-label">mg</text>
                </g>
                <g className="force-vector force-normal">
                  <path d="M 450 327 L 389 218" markerEnd="url(#agent-arrow)" />
                  <text x="365" y="217" className="handwritten agent-label">N</text>
                </g>
                <g
                  className={`force-vector force-friction ${!board.frictionEnabled ? 'rejected' : ''}`}
                  onPointerDown={(event) => {
                    event.stopPropagation()
                    selectObject('friction-1')
                  }}
                >
                  <path d="M 450 327 L 540 279" markerEnd="url(#agent-arrow)" />
                  <text x="523" y="268" className="handwritten agent-label">f</text>
                </g>
                <text x="354" y="490" className="handwritten agent-note">three forces share this point</text>
                <path d="M 423 476 C 450 455, 470 442, 481 414" className="note-leader" />
              </g>
            )}

            {board.solved && (
              <g className="solution-layer" transform="translate(730 185)">
                <text x="0" y="0" className="eyebrow-svg agent-eyebrow">ALONG THE SLOPE</text>
                <text x="0" y="55" className="handwritten formula-line">F∥ = mg sin θ</text>
                <text
                  x="220"
                  y="55"
                  className={`handwritten formula-line friction-term ${!board.frictionEnabled ? 'term-rejected' : ''}`}
                >
                  − μmg cos θ
                </text>
                <path d="M 0 76 C 105 69, 245 78, 390 72" className="agent-rule" />
                <text x="0" y="120" className="handwritten formula-small">
                  {board.frictionEnabled
                    ? 'a = g(sin 30° − 0.10 cos 30°)'
                    : 'a = g sin 30°'}
                </text>
                <g key={answer} className="answer-pop">
                  <text x="0" y="202" className="answer-number">{answer}</text>
                  <text x="166" y="198" className="answer-unit">m/s²</text>
                  <text x="3" y="235" className="handwritten answer-direction">down the incline</text>
                </g>
                {!board.frictionEnabled && (
                  <g className="revision-note">
                    <path d="M 290 126 C 335 152, 360 170, 360 205" className="note-leader" />
                    <text x="245" y="118" className="handwritten agent-note">recomputed</text>
                  </g>
                )}
              </g>
            )}

            {board.annotations.map((annotation, index) => (
              <text
                key={annotation.id}
                x={700}
                y={520 + index * 34}
                className="handwritten custom-annotation"
              >
                {annotation.text}
              </text>
            ))}
            </g>
            )}

            {board.scene === 'july1914' && (
              <HistoryScene
                board={board}
                mode={mode}
                invokeTool={invokeTool}
                onSelect={selectObject}
              />
            )}

            {board.strokes.map((stroke) => (
              <path
                key={stroke.id}
                d={pathFromPoints(stroke.points)}
                className={
                  stroke.kind === 'crossout'
                    ? 'human-strike visible'
                    : stroke.kind === 'lasso'
                      ? 'lasso-stroke persisted'
                      : 'human-ink'
                }
              />
            ))}
            {draftStroke.length > 0 && (
              <path
                d={pathFromPoints(draftStroke)}
                className={
                  mode === 'lasso'
                    ? 'lasso-stroke'
                    : mode === 'crossout'
                      ? 'human-strike visible'
                      : 'human-ink'
                }
              />
            )}

            {board.scene === 'incline' && !hasStarted && (
              <g className="start-hint" transform="translate(477 615)">
                <path d="M 3 3 C 45 -10, 150 -9, 237 1" />
                <text x="120" y="35" textAnchor="middle">circle the block</text>
                <text x="120" y="60" textAnchor="middle">the canvas becomes the prompt</text>
              </g>
            )}
          </svg>
          <div className={`activity-pop activity-${activity[0]?.actor ?? 'system'}`} aria-live="polite">
            <span className={`actor-mark ${activity[0]?.actor ?? 'system'}`}>
              {activity[0]?.actor === 'agent' ? 'A' : activity[0]?.actor === 'human' ? 'Y' : '·'}
            </span>
            <span>
              <strong>{activity[0]?.label ?? 'Shared surface ready'}</strong>
              {activity[0]?.detail && <small>{activity[0].detail}</small>}
            </span>
          </div>
          <div className="webmcp-badge" aria-label={`${bridgeLabel}, ${TRACE_TOOLS.length} tools`}>
            <span className={`connection-dot ${bridge}`} />
            <strong>WebMCP</strong>
            <span>{TRACE_TOOLS.length} tools</span>
          </div>
          <div className="canvas-status" aria-live="polite">
            <Sparkles size={14} />
            <span>{notice}</span>
          </div>
        </section>

        <aside className="activity-rail">
          <div className="connection-row">
            <span className={`connection-dot ${bridge}`} />
            <div>
              <strong>{bridgeLabel}</strong>
              <span>{TRACE_TOOLS.length} tools on this page</span>
            </div>
            <Radio size={16} />
          </div>

          <div className="activity-heading">
            <span>Activity</span>
            <span>shared & reversible</span>
          </div>

          <div className="activity-list" aria-live="polite">
            {activity.map((item) => (
              <article className="activity-item" key={item.id}>
                <span className={`actor-mark ${item.actor}`}>
                  {item.actor === 'agent' ? 'A' : item.actor === 'human' ? 'Y' : '·'}
                </span>
                <div className="activity-copy">
                  <strong>{item.label}</strong>
                  {item.detail && <span>{item.detail}</span>}
                </div>
                <time>{item.time}</time>
              </article>
            ))}
          </div>

          <details className="tool-surface">
            <summary>
              <span>Tool surface</span>
              <span>{TRACE_TOOLS.length}</span>
            </summary>
            <div className="tool-list">
              {TRACE_TOOLS.map((tool) => (
                <div key={tool.name}>
                  <code>{tool.name}</code>
                  <span>{tool.description}</span>
                </div>
              ))}
            </div>
          </details>

          <div className="rail-footer">
            <Sparkles size={15} />
            <span>Human ink and agent tools operate on one semantic model.</span>
          </div>
        </aside>
      </section>
    </main>
  )
}

export default App
