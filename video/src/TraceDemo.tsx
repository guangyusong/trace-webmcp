import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const ink = '#111111';
const paper = '#ffffff';
const blue = '#2855b6';
const brown = '#985438';

const ease = Easing.bezier(0.16, 1, 0.3, 1);
const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

const narration = [
  {from: 36, duration: 98, file: 'vo2-01.mp3', caption: 'Circle it. The canvas becomes the prompt.', tone: blue},
  {from: 132, duration: 98, file: 'vo2-02.mp3', caption: 'TRACE gives the agent the object — not a screenshot.', tone: brown},
  {from: 240, duration: 124, file: 'vo2-03.mp3', caption: 'It draws the forces, solves the motion, and moves the block.', tone: brown},
  {from: 390, duration: 118, file: 'vo2-04.mp3', caption: 'Cross out friction. Every dependent answer updates.', tone: blue},
  {from: 510, duration: 86, file: 'vo2-05.mp3', caption: 'Same gesture. Messier problem.', tone: blue},
  {from: 615, duration: 184, file: 'vo2-06.mp3', caption: 'One arrow cannot explain a world war. TRACE restores the decisions and sources.', tone: brown},
  {from: 870, duration: 170, file: 'vo2-07.mp3', caption: 'Remove one decision. The path bends instead of pretending history was fixed.', tone: blue},
  {from: 1080, duration: 230, file: 'vo2-08.mp3', caption: 'Fourteen native WebMCP tools. Called live. Human and agent on one surface.', tone: brown},
  {from: 1360, duration: 78, file: 'vo2-09.mp3', caption: 'The canvas is the prompt.', tone: blue},
];

const soundCues = [
  {from: 42, file: 'sfx-ink.mp3', volume: 0.38},
  {from: 120, file: 'sfx2-zoom.mp3', volume: 0.42},
  {from: 240, file: 'sfx-tool.mp3', volume: 0.32},
  {from: 392, file: 'sfx-crossout.mp3', volume: 0.38},
  {from: 450, file: 'sfx-number.mp3', volume: 0.35},
  {from: 492, file: 'sfx2-branch.mp3', volume: 0.48},
  {from: 692, file: 'sfx2-zoom.mp3', volume: 0.36},
  {from: 872, file: 'sfx-crossout.mp3', volume: 0.36},
  {from: 930, file: 'sfx2-branch.mp3', volume: 0.4},
  {from: 1052, file: 'sfx2-zoom.mp3', volume: 0.4},
  {from: 1230, file: 'sfx-tool.mp3', volume: 0.34},
];

const Caption: React.FC<{text: string; duration: number; tone: string; index: number}> = ({text, duration, tone, index}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, durationInFrames: 12, config: {damping: 18, stiffness: 180, mass: 0.55}});
  const exit = interpolate(frame, [duration - 8, duration - 2], [1, 0], clamp);
  const underline = interpolate(frame, [2, Math.min(duration - 12, 24)], [0, 1], {...clamp, easing: ease});
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'flex-start', padding: '0 0 42px 52px', pointerEvents: 'none'}}>
      <div style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '58px minmax(0, 1fr)',
        maxWidth: 1340,
        color: ink,
        background: 'rgba(255,255,255,0.97)',
        border: `2px solid ${ink}`,
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: 36,
        fontWeight: 800,
        letterSpacing: '-0.025em',
        lineHeight: 1.12,
        opacity: enter * exit,
        transform: `translateY(${(1 - enter) * 20}px)`,
      }}>
        <span style={{display: 'grid', placeItems: 'center', minHeight: 70, color: paper, background: tone, borderRight: `2px solid ${ink}`, fontSize: 18}}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <span style={{padding: '15px 21px 17px'}}>{text}</span>
        <span style={{position: 'absolute', left: 58, right: 0, bottom: 0, height: 5, background: tone, transformOrigin: 'left center', transform: `scaleX(${underline})`}} />
      </div>
    </AbsoluteFill>
  );
};

const ShotTag: React.FC<{number: string; label: string; tone?: string}> = ({number, label, tone = blue}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, durationInFrames: 14, config: {damping: 18, stiffness: 170}});
  return (
    <div style={{position: 'absolute', left: 48, top: 44, display: 'flex', alignItems: 'center', gap: 12, padding: '9px 13px', color: ink, background: paper, border: `2px solid ${ink}`, fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 17, fontWeight: 900, letterSpacing: '.12em', opacity: enter, transform: `translateX(${(1 - enter) * -18}px)`}}>
      <span style={{color: tone}}>{number}</span>
      <span>{label}</span>
    </div>
  );
};

type CameraClipProps = {
  startFrom: number;
  duration: number;
  scaleFrom: number;
  scaleTo: number;
  focusFrom: [number, number];
  focusTo: [number, number];
  playbackRate?: number;
  tag: string;
  number: string;
  tone?: string;
};

const CameraClip: React.FC<CameraClipProps> = ({
  startFrom,
  duration,
  scaleFrom,
  scaleTo,
  focusFrom,
  focusTo,
  playbackRate = 1,
  tag,
  number,
  tone = blue,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const settle = spring({frame, fps, durationInFrames: 18, config: {damping: 19, stiffness: 155, mass: 0.65}});
  const travel = interpolate(frame, [Math.round(duration * 0.42), Math.round(duration * 0.82)], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const scale = interpolate(settle, [0, 1], [scaleFrom, scaleTo]) + interpolate(travel, [0, 1], [0, 0.06]);
  const focusX = interpolate(settle, [0, 1], [focusFrom[0], focusTo[0]]) + interpolate(travel, [0, 1], [0, (focusTo[0] - focusFrom[0]) * 0.08]);
  const focusY = interpolate(settle, [0, 1], [focusFrom[1], focusTo[1]]) + interpolate(travel, [0, 1], [0, (focusTo[1] - focusFrom[1]) * 0.08]);
  const x = 960 - focusX * scale;
  const y = 540 - focusY * scale;
  const fade = interpolate(frame, [0, 4, duration - 5, duration], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: paper, opacity: fade}}>
      <OffthreadVideo
        src={staticFile('trace-app-broll-v2.mp4')}
        muted
        startFrom={startFrom}
        playbackRate={playbackRate}
        style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, objectFit: 'cover', transformOrigin: '0 0', transform: `translate(${x}px, ${y}px) scale(${scale})`}}
      />
      <ShotTag number={number} label={tag} tone={tone} />
    </AbsoluteFill>
  );
};

const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, durationInFrames: 18, config: {damping: 18, stiffness: 160}});
  const draw = interpolate(frame, [6, 45], [560, 0], clamp);
  const nodes = [16, 24, 32].map((from) => spring({frame: frame - from, fps, durationInFrames: 12, config: {damping: 15, stiffness: 190}}));
  const exit = interpolate(frame, [46, 59], [1, 0], clamp);
  return (
    <AbsoluteFill style={{background: paper, color: ink, fontFamily: 'Arial, Helvetica, sans-serif', opacity: exit}}>
      <div style={{position: 'absolute', left: 105, top: 86, fontSize: 21, fontWeight: 900, letterSpacing: '.18em'}}>TRACE / WEBMCP</div>
      <div style={{position: 'absolute', left: 104, top: 290, fontSize: 118, fontWeight: 900, lineHeight: .86, letterSpacing: '-.075em', opacity: enter, transform: `translateY(${(1 - enter) * 28}px)`}}>
        THE CANVAS<br />IS THE PROMPT.
      </div>
      <svg width="700" height="520" viewBox="0 0 700 520" style={{position: 'absolute', right: 76, top: 250}}>
        <path d="M70 160 C195 90 300 125 385 235 S535 350 625 265" fill="none" stroke={ink} strokeWidth="8" strokeLinecap="round" strokeDasharray="560" strokeDashoffset={draw} />
        <path d="M603 238 L636 264 L596 282" fill="none" stroke={ink} strokeWidth="8" strokeLinecap="round" opacity={nodes[2]} />
        {[{x:82,y:154},{x:250,y:139},{x:390,y:238}].map((point, index) => (
          <circle key={point.x} cx={point.x} cy={point.y} r="29" fill={blue} stroke={ink} strokeWidth="7" style={{transformBox: 'fill-box', transformOrigin: 'center', transform: `scale(${nodes[index]})`}} />
        ))}
        <rect x="584" y="232" width="72" height="72" fill={brown} stroke={ink} strokeWidth="7" style={{transformBox: 'fill-box', transformOrigin: 'center', transform: `scale(${nodes[2]})`}} />
      </svg>
      <div style={{position: 'absolute', left: 110, bottom: 82, display: 'flex', alignItems: 'center', gap: 28, fontSize: 18, fontWeight: 900, letterSpacing: '.08em'}}>
        <span style={{display: 'flex', alignItems: 'center', gap: 10}}><i style={{width: 48, height: 7, background: blue}} /> HUMAN MARK</span>
        <span style={{display: 'flex', alignItems: 'center', gap: 10}}><i style={{width: 48, height: 7, background: brown}} /> AGENT RESULT</span>
      </div>
    </AbsoluteFill>
  );
};

const ArrowBridge: React.FC = () => {
  const frame = useCurrentFrame();
  const draw = interpolate(frame, [0, 48], [1440, 0], {...clamp, easing: Easing.out(Easing.cubic)});
  const wordEnter = interpolate(frame, [10, 26], [0, 1], {...clamp, easing: ease});
  const exit = interpolate(frame, [58, 74], [1, 0], clamp);
  return (
    <AbsoluteFill style={{background: paper, color: ink, opacity: exit, fontFamily: 'Arial, Helvetica, sans-serif'}}>
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
        <circle cx="230" cy="540" r="34" fill={blue} stroke={ink} strokeWidth="7" />
        <path d="M272 540 C610 390 1190 690 1650 540" fill="none" stroke={brown} strokeWidth="12" strokeLinecap="round" strokeDasharray="1440" strokeDashoffset={draw} />
        <path d="M1605 500 L1665 540 L1605 584" fill="none" stroke={ink} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" opacity={wordEnter} />
      </svg>
      <div style={{position: 'absolute', left: 410, top: 390, fontSize: 106, fontWeight: 900, letterSpacing: '-.06em', lineHeight: .9, opacity: wordEnter, transform: `translateY(${(1 - wordEnter) * 25}px)`}}>
        SAME GESTURE.<br /><span style={{color: blue}}>MESSIER PROBLEM.</span>
      </div>
    </AbsoluteFill>
  );
};

const NativeProof: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, durationInFrames: 20, config: {damping: 18, stiffness: 150}});
  const count = Math.round(interpolate(frame, [0, 34], [0, 14], clamp));
  const tools = ['get_selection', 'draw_force_vectors', 'solve_motion', 'set_assumption', 'expand_causal_chain', 'run_counterfactual'];
  const active = Math.min(tools.length - 1, Math.floor(Math.max(0, frame - 38) / 24));
  return (
    <AbsoluteFill style={{background: paper, color: ink, overflow: 'hidden', fontFamily: 'Arial, Helvetica, sans-serif'}}>
      <div style={{position: 'absolute', left: 92, top: 74, width: 850, opacity: enter, transform: `translateX(${(1 - enter) * -30}px)`}}>
        <div style={{fontSize: 21, fontWeight: 900, letterSpacing: '.17em'}}>NATIVE WEBMCP / 03</div>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 24, marginTop: 64}}>
          <span style={{fontSize: 252, fontWeight: 900, lineHeight: .75, letterSpacing: '-.09em', color: blue, fontVariantNumeric: 'tabular-nums'}}>{count}</span>
          <span style={{fontSize: 74, fontWeight: 900, lineHeight: .85, letterSpacing: '-.055em'}}>TOOLS<br />CALLED LIVE.</span>
        </div>
        <div style={{marginTop: 64, borderTop: `4px solid ${ink}`, width: 720}}>
          {tools.map((tool, index) => {
            const visible = frame >= 34 + index * 18;
            const selected = index === active;
            return (
              <div key={tool} style={{display: 'grid', gridTemplateColumns: '36px 1fr', gap: 12, alignItems: 'center', height: 50, borderBottom: '1px solid rgba(17,17,17,.2)', opacity: visible ? selected ? 1 : .45 : 0, transform: `translateX(${visible ? 0 : -16}px)`}}>
                <span style={{width: 16, height: 16, background: selected ? brown : 'transparent', border: `2px solid ${selected ? brown : ink}`}} />
                <code style={{fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 20, fontWeight: selected ? 800 : 600}}>{tool}</code>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{position: 'absolute', right: 82, top: 58, width: 660, height: 964, overflow: 'hidden', border: `4px solid ${ink}`, background: paper, opacity: enter, transform: `translateX(${(1 - enter) * 70}px)`}}>
        <OffthreadVideo src={staticFile('native-site-tools-panel.mp4')} muted startFrom={360} playbackRate={1.3} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </div>
    </AbsoluteFill>
  );
};

const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, durationInFrames: 20, config: {damping: 17, stiffness: 155}});
  const ring = interpolate(frame, [12, 58], [0, 1], {...clamp, easing: ease});
  return (
    <AbsoluteFill style={{background: paper, color: ink, justifyContent: 'center', alignItems: 'center', fontFamily: 'Arial, Helvetica, sans-serif'}}>
      <svg width="180" height="180" viewBox="0 0 180 180" style={{position: 'absolute', left: 178, top: 445}}>
        <circle cx="90" cy="90" r="61" fill="none" stroke={ink} strokeWidth="8" strokeDasharray="390" strokeDashoffset={390 * (1 - ring)} />
        <circle cx="90" cy="90" r="24" fill={blue} style={{transformBox: 'fill-box', transformOrigin: 'center', transform: `scale(${enter})`}} />
      </svg>
      <div style={{position: 'absolute', left: 410, top: 402, opacity: enter, transform: `translateY(${(1 - enter) * 24}px)`}}>
        <div style={{fontSize: 104, fontWeight: 900, letterSpacing: '-.07em'}}>THE CANVAS IS THE PROMPT.</div>
        <div style={{display: 'flex', alignItems: 'center', gap: 18, marginTop: 34, fontSize: 25, fontWeight: 700}}>
          <span style={{width: 64, height: 8, background: brown}} /> trace-webmcp.callboard.workers.dev
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const TraceDemo: React.FC = () => (
  <AbsoluteFill style={{background: paper}}>
    <Audio src={staticFile('audio/sfx2-bed.mp3')} loop volume={0.23} />

    <Sequence from={0} durationInFrames={60}><Intro /></Sequence>
    <Sequence from={48} durationInFrames={162}>
      <CameraClip startFrom={0} duration={162} scaleFrom={1} scaleTo={1.48} focusFrom={[960, 540]} focusTo={[800, 500]} playbackRate={0.9} number="01" tag="HUMAN POINTS" />
    </Sequence>
    <Sequence from={210} durationInFrames={180}>
      <CameraClip startFrom={60} duration={180} scaleFrom={1.2} scaleTo={1.55} focusFrom={[810, 510]} focusTo={[1170, 430]} playbackRate={0.67} number="02" tag="AGENT WORKS" tone={brown} />
    </Sequence>
    <Sequence from={390} durationInFrames={90}>
      <CameraClip startFrom={180} duration={90} scaleFrom={1.35} scaleTo={1.78} focusFrom={[1120, 450]} focusTo={[1160, 455]} playbackRate={0.67} number="03" tag="MODEL UPDATES" />
    </Sequence>
    <Sequence from={480} durationInFrames={75}><ArrowBridge /></Sequence>
    <Sequence from={555} durationInFrames={135}>
      <CameraClip startFrom={240} duration={135} scaleFrom={1} scaleTo={1.35} focusFrom={[960, 520]} focusTo={[980, 455]} playbackRate={0.67} number="04" tag="QUESTION THE ARROW" />
    </Sequence>
    <Sequence from={690} durationInFrames={180}>
      <CameraClip startFrom={300} duration={180} scaleFrom={1.18} scaleTo={1.48} focusFrom={[960, 430]} focusTo={[960, 610]} playbackRate={0.55} number="05" tag="RESTORE THE MISSING STEPS" tone={brown} />
    </Sequence>
    <Sequence from={870} durationInFrames={180}>
      <CameraClip startFrom={390} duration={180} scaleFrom={1.25} scaleTo={1.6} focusFrom={[960, 510]} focusTo={[1040, 520]} playbackRate={0.5} number="06" tag="HISTORY BENDS" />
    </Sequence>
    <Sequence from={1050} durationInFrames={270}><NativeProof /></Sequence>
    <Sequence from={1320} durationInFrames={180}><Outro /></Sequence>

    {narration.map(({from, duration, file, caption, tone}, index) => (
      <React.Fragment key={file}>
        <Sequence from={from} durationInFrames={duration}>
          <Audio src={staticFile(`audio/${file}`)} volume={1.35} />
        </Sequence>
        <Sequence from={from} durationInFrames={duration}>
          <Caption text={caption} duration={duration} tone={tone} index={index} />
        </Sequence>
      </React.Fragment>
    ))}

    {soundCues.map(({from, file, volume}, index) => (
      <Sequence key={`${file}-${index}`} from={from} durationInFrames={60}>
        <Audio src={staticFile(`audio/${file}`)} volume={volume} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
