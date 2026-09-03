import type { BoardState, ToolInvoker, ToolMode } from './types'

export const HISTORY_OBJECTS = [
  { id: 'event-assassination', name: 'Sarajevo assassination', center: { x: 150, y: 286 } },
  { id: 'event-ultimatum', name: 'Austrian ultimatum', center: { x: 370, y: 286 } },
  { id: 'event-mobilization', name: 'Russian mobilization', center: { x: 590, y: 286 } },
  { id: 'event-declarations', name: 'German declarations', center: { x: 810, y: 286 } },
  { id: 'event-war', name: 'General European war', center: { x: 1030, y: 286 } },
  { id: 'link-simple', name: 'assassination-caused-war link', center: { x: 590, y: 286 } },
  { id: 'source-blank-cheque', name: 'German blank cheque', center: { x: 340, y: 535 } },
  { id: 'source-willy-nicky', name: 'Willy–Nicky telegrams', center: { x: 790, y: 535 } },
]

type EventMarkProps = {
  id: string
  x: number
  date: string
  lines: string[]
  selected: boolean
  rejected?: boolean
  contingent?: boolean
  onSelect: (id: string) => void
}

function EventMark({
  id,
  x,
  date,
  lines,
  selected,
  rejected = false,
  contingent = false,
  onSelect,
}: EventMarkProps) {
  return (
    <g
      className={`history-event ${selected ? 'selected' : ''} ${rejected ? 'rejected' : ''} ${contingent ? 'contingent' : ''}`}
      transform={`translate(${x} 286)`}
      onPointerDown={(event) => {
        event.stopPropagation()
        onSelect(id)
      }}
    >
      <circle r="12" className="event-ring" />
      <circle r="3.5" className="event-core" />
      <path d="M 0 -12 L 0 -55" className="event-tick" />
      <text x="0" y="-70" textAnchor="middle" className="event-date">{date}</text>
      <text x="0" y="39" textAnchor="middle" className="event-title">
        {lines.map((line, index) => (
          <tspan key={line} x="0" dy={index === 0 ? 0 : 19}>{line}</tspan>
        ))}
      </text>
      {rejected && <path d="M -62 -24 L 63 28 M -58 28 L 61 -25" className="event-cross" />}
    </g>
  )
}

type Props = {
  board: BoardState
  mode: ToolMode
  invokeTool: ToolInvoker
  onSelect: (id: string) => void
}

export function HistoryScene({ board, mode, invokeTool, onSelect }: Props) {
  const canSelect = mode === 'select'
  const select = (id: string) => {
    if (canSelect) onSelect(id)
  }
  const selected = (id: string) => board.selectedIds.includes(id)
  const counterfactual = board.historyCounterfactualEventId === 'event-mobilization'

  return (
    <g className="history-scene scene-enter">
      <defs>
        <marker id="history-human-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" className="human-arrow-head" />
        </marker>
      </defs>

      <g className="history-heading">
        <text x="78" y="106" className="eyebrow-svg">EUROPE / JULY 1914</text>
        <text x="78" y="158" className="prompt-svg">How did one shot become a world war?</text>
        <text x="80" y="190" className="history-subtitle">A causal model · simplified for teaching</text>
      </g>

      {!board.historyChainExpanded ? (
        <g className="simple-history">
          <path d="M 150 286 L 1030 286" className="timeline-rule" />
          <EventMark
            id="event-assassination"
            x={150}
            date="28 JUN"
            lines={['Archduke', 'assassinated']}
            selected={selected('event-assassination')}
            onSelect={select}
          />
          <EventMark
            id="event-war"
            x={1030}
            date="4 AUG"
            lines={['Europe', 'at war']}
            selected={selected('event-war')}
            onSelect={select}
          />
          <g
            className={`simple-cause-object ${selected('link-simple') ? 'selected' : ''}`}
            onPointerDown={(event) => {
              event.stopPropagation()
              select('link-simple')
            }}
          >
            <path d="M 184 267 C 410 225, 750 225, 995 267" className="simple-cause" markerEnd="url(#agent-arrow)" />
            <text x="590" y="233" textAnchor="middle" className="handwritten simple-question">one event caused everything?</text>
          </g>

          {selected('link-simple') && (
            <g className="history-context" transform="translate(480 345)">
              <path d="M 100 0 C 95 -22, 82 -34, 65 -45" className="context-tail" />
              <g
                className="context-action"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => void invokeTool('expand_causal_chain', {
                  fromEventId: 'event-assassination',
                  toEventId: 'event-war',
                })}
              >
                <rect x="0" y="0" width="220" height="40" rx="20" />
                <text x="110" y="26">too simple — what’s missing?</text>
              </g>
            </g>
          )}

          {!selected('link-simple') && (
            <g className="history-start-hint" transform="translate(487 430)">
              <path d="M 0 0 C 45 -12, 150 -12, 210 0" />
              <text x="105" y="33" textAnchor="middle">circle the causal arrow</text>
              <text x="105" y="56" textAnchor="middle">then ask if history was really this simple</text>
            </g>
          )}
        </g>
      ) : (
        <g className="expanded-history">
          <g className="causal-background">
            <text x="130" y="247">nationalism</text>
            <text x="395" y="247">alliance commitments</text>
            <text x="680" y="247">military timetables</text>
            <text x="925" y="247">leaders’ choices</text>
            <path d="M 150 252 C 250 215, 390 218, 570 270" />
            <path d="M 425 252 C 520 215, 675 220, 800 270" />
            <path d="M 710 252 C 785 220, 900 224, 1010 270" />
          </g>

          <path d="M 150 286 L 1030 286" className="timeline-rule expanded" />
          <g className="causal-links">
            <path d="M 163 286 L 356 286" markerEnd="url(#agent-arrow)" />
            <path d="M 383 286 L 576 286" markerEnd="url(#agent-arrow)" />
            <path className={counterfactual ? 'weakened' : ''} d="M 603 286 L 796 286" markerEnd="url(#agent-arrow)" />
            <path className={counterfactual ? 'weakened' : ''} d="M 823 286 L 1016 286" markerEnd="url(#agent-arrow)" />
          </g>

          <EventMark
            id="event-assassination"
            x={150}
            date="28 JUN"
            lines={['Sarajevo', 'assassination']}
            selected={selected('event-assassination')}
            onSelect={select}
          />
          <EventMark
            id="event-ultimatum"
            x={370}
            date="23 JUL"
            lines={['Austrian', 'ultimatum']}
            selected={selected('event-ultimatum') || board.highlightedIds.includes('event-ultimatum')}
            onSelect={select}
          />
          <EventMark
            id="event-mobilization"
            x={590}
            date="30 JUL"
            lines={['Russian general', 'mobilization']}
            selected={selected('event-mobilization') || board.highlightedIds.includes('event-mobilization')}
            rejected={counterfactual}
            onSelect={select}
          />
          <EventMark
            id="event-declarations"
            x={810}
            date="1–3 AUG"
            lines={['German', 'declarations']}
            selected={selected('event-declarations') || board.highlightedIds.includes('event-declarations')}
            contingent={counterfactual}
            onSelect={select}
          />
          <EventMark
            id="event-war"
            x={1030}
            date="4 AUG"
            lines={['General', 'European war']}
            selected={selected('event-war')}
            contingent={counterfactual}
            onSelect={select}
          />

          <g className={`history-thesis ${counterfactual ? 'revised' : ''}`} transform="translate(805 86)">
            <text x="0" y="0" className="eyebrow-svg agent-eyebrow">WORKING INTERPRETATION</text>
            <text x="0" y="34" className="handwritten thesis-main">
              {counterfactual ? 'the path bends' : 'not one cause'}
            </text>
            <text x="0" y="61" className="thesis-detail">
              {counterfactual ? 'war remains possible, not fixed' : 'pressure + commitments + choices'}
            </text>
          </g>

          {counterfactual && (
            <g className="counterfactual-branch">
              <path d="M 590 310 C 625 395, 710 410, 786 402" markerEnd="url(#history-human-arrow)" />
              <circle cx="810" cy="402" r="7" />
              <text x="829" y="399" className="handwritten branch-title">negotiation window</text>
              <text x="829" y="419" className="branch-detail">a reopened path, not a prediction</text>
            </g>
          )}

          {!counterfactual && (
            <g className="counterfactual-prompt" transform="translate(445 398)">
              <path d="M 115 0 C 125 -23, 135 -44, 145 -74" className="context-tail" />
              <text x="105" y="35" className="handwritten">cross out a decision to ask “what if?”</text>
            </g>
          )}

          {board.historySourcesCompared && (
            <g className="source-comparison">
              <path d="M 80 480 L 1120 480" className="source-rule" />
              <g transform="translate(105 510)" className="source-fragment source-one">
                <text x="0" y="0" className="event-date">6 JUL · GERMAN ASSURANCE</text>
                <text x="0" y="34" className="source-title">“Blank cheque”</text>
                <text x="0" y="62" className="source-body">Commitment gave Vienna room to escalate.</text>
                <text x="0" y="92" className="handwritten source-note">supports: alliance pressure</text>
              </g>
              <path d="M 590 505 L 590 640" className="source-divider" />
              <g transform="translate(640 510)" className="source-fragment source-two">
                <text x="0" y="0" className="event-date">29 JUL · WILLY–NICKY TELEGRAMS</text>
                <text x="0" y="34" className="source-title">Private appeals</text>
                <text x="0" y="62" className="source-body">The rulers still searched for an exit.</text>
                <text x="0" y="92" className="handwritten source-note">complicates: inevitability</text>
              </g>
            </g>
          )}
        </g>
      )}
    </g>
  )
}
