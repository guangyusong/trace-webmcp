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
const paper = '#fafaf7';
const blue = '#2855b6';
const brown = '#985438';

const narration = [
  {from: 90, file: 'vo-01.mp3', caption: 'What if the canvas was the prompt?'},
  {from: 240, file: 'vo-02.mp3', caption: 'Circle the block. The gesture becomes exact context.'},
  {from: 420, file: 'vo-03.mp3', caption: 'The agent reads the live page — not pixels.'},
  {from: 630, file: 'vo-04.mp3', caption: 'It solves. It moves.'},
  {from: 810, file: 'vo-05.mp3', caption: 'One human mark changes every dependent answer.'},
  {from: 1170, file: 'vo-06.mp3', caption: 'Same gesture. Harder question.'},
  {from: 1320, file: 'vo-07.mp3', caption: 'One arrow cannot explain a world war.'},
  {from: 1590, file: 'vo-08.mp3', caption: 'Missing decisions and conflicting sources appear in place.'},
  {from: 1860, file: 'vo-09.mp3', caption: 'The path bends. War remains possible — not fixed.'},
  {from: 2160, file: 'vo-10.mp3', caption: null},
  {from: 2400, file: 'vo-11.mp3', caption: null},
  {from: 2580, file: 'vo-12.mp3', caption: null},
];

const soundCues = [
  {from: 225, file: 'sfx-ink.mp3', volume: 0.34},
  {from: 435, file: 'sfx-tool.mp3', volume: 0.25},
  {from: 800, file: 'sfx-crossout.mp3', volume: 0.3},
  {from: 980, file: 'sfx-number.mp3', volume: 0.27},
  {from: 1160, file: 'sfx-page.mp3', volume: 0.28},
  {from: 2150, file: 'sfx-tool.mp3', volume: 0.25},
  {from: 2570, file: 'sfx-ink.mp3', volume: 0.22},
];

const Caption: React.FC<{text: string; index: number}> = ({text, index}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 18, mass: 0.7}});
  const opacity = interpolate(frame, [0, 5, 118, 132], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'flex-start', padding: '0 0 52px 54px', pointerEvents: 'none'}}>
      <div style={{
        maxWidth: 1320,
        background: paper,
        color: ink,
        border: `3px solid ${ink}`,
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: 36,
        fontWeight: 800,
        letterSpacing: '-0.025em',
        lineHeight: 1.12,
        padding: '15px 22px 17px 70px',
        opacity,
        transform: `translateY(${(1 - enter) * 18}px)`,
        position: 'relative',
      }}>
        <span style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 52,
          display: 'grid',
          placeItems: 'center',
          background: index % 3 === 2 ? brown : blue,
          color: paper,
          borderRight: `3px solid ${ink}`,
          fontSize: 20,
          letterSpacing: 0,
        }}>{String(index + 1).padStart(2, '0')}</span>
        {text}
      </div>
    </AbsoluteFill>
  );
};

const BrandMark: React.FC<{size?: number}> = ({size = 96}) => (
  <div style={{
    width: size,
    height: size,
    background: paper,
    border: `${Math.max(3, size * 0.055)}px solid ${ink}`,
    display: 'grid',
    placeItems: 'center',
  }}>
    <div style={{width: size * 0.36, height: size * 0.36, background: blue, borderRadius: '50%'}} />
  </div>
);

const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = spring({frame, fps, config: {damping: 16, stiffness: 90}});
  const fade = interpolate(frame, [62, 89], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: paper, color: ink, opacity: fade, fontFamily: 'Arial, Helvetica, sans-serif'}}>
      <div style={{position: 'absolute', left: 110, top: 88, fontSize: 26, fontWeight: 900, letterSpacing: '.18em'}}>TRACE / 01</div>
      <div style={{position: 'absolute', left: 108, top: 230, fontSize: 112, fontWeight: 900, lineHeight: .88, letterSpacing: '-.07em', transform: `translateY(${(1 - reveal) * 22}px)`, opacity: reveal}}>
        THE CANVAS<br />IS THE PROMPT.
      </div>
      <svg width="620" height="500" viewBox="0 0 620 500" style={{position: 'absolute', right: 96, top: 286}}>
        <path d="M55 125 C170 80 245 110 330 205 S470 330 555 275" fill="none" stroke={ink} strokeWidth="8" />
        <path d="M534 247 L564 273 L526 287" fill="none" stroke={ink} strokeWidth="8" />
        {[{x:70,y:120},{x:210,y:118},{x:335,y:210}].map((point, i) => (
          <circle key={i} cx={point.x} cy={point.y} r="28" fill={blue} stroke={ink} strokeWidth="7" />
        ))}
        <rect x="508" y="242" width="68" height="68" fill={brown} stroke={ink} strokeWidth="7" />
      </svg>
      <div style={{position: 'absolute', left: 114, bottom: 80, display: 'flex', gap: 14, alignItems: 'center', fontSize: 24, fontWeight: 800}}>
        <span style={{width: 52, height: 8, background: blue}} /> HUMAN MARK
        <span style={{width: 52, height: 8, background: brown, marginLeft: 22}} /> AGENT RESULT
      </div>
    </AbsoluteFill>
  );
};

const CameraBroll: React.FC = () => {
  const frame = useCurrentFrame();
  const local = frame - 90;
  const zoom = interpolate(
    local,
    [0, 360, 760, 1120, 1500, 1800, 2070],
    [1.01, 1.06, 1.035, 1.075, 1.035, 1.065, 1.02],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)},
  );
  const x = interpolate(
    local,
    [0, 520, 1030, 1540, 2070],
    [0, -26, 30, -18, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)},
  );
  const y = interpolate(
    local,
    [0, 520, 1030, 1540, 2070],
    [0, -8, 0, -10, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)},
  );
  return (
    <AbsoluteFill style={{background: ink, overflow: 'hidden'}}>
      <OffthreadVideo
        src={staticFile('trace-app-broll.mp4')}
        muted
        playbackRate={1.55}
        style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(.68) contrast(1.04)', transform: `translate(${x}px, ${y}px) scale(${zoom})`}}
      />
    </AbsoluteFill>
  );
};

const NativeProof: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 20, mass: 0.8}});
  return (
    <AbsoluteFill style={{background: paper, color: ink, overflow: 'hidden', fontFamily: 'Arial, Helvetica, sans-serif'}}>
      <div style={{position: 'absolute', left: 96, top: 84, width: 800, opacity: enter, transform: `translateX(${(1 - enter) * -28}px)`}}>
        <div style={{fontSize: 24, fontWeight: 900, letterSpacing: '.15em', textTransform: 'uppercase'}}>REAL WEBMCP / 02</div>
        <div style={{fontSize: 104, fontWeight: 900, lineHeight: .88, letterSpacing: '-.07em', marginTop: 76}}>
          14 TOOLS.<br />
          <span style={{color: blue}}>CALLED LIVE.</span>
        </div>
        <div style={{fontSize: 31, fontWeight: 700, lineHeight: 1.25, marginTop: 50, maxWidth: 650}}>
          The page tells ChatGPT what the marks mean.<br />No pixel guessing. No fake clicks.
        </div>
        <div style={{width: 290, height: 12, background: brown, marginTop: 54}} />
      </div>
      <div style={{
        position: 'absolute',
        right: 102,
        top: 36,
        width: 560,
        height: 1008,
        overflow: 'hidden',
        border: `4px solid ${ink}`,
        background: '#fff',
        transform: `translateX(${(1 - enter) * 60}px)`,
      }}>
        <OffthreadVideo
          src={staticFile('native-site-tools-panel.mp4')}
          muted
          startFrom={360}
          playbackRate={1.35}
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
        />
      </div>
    </AbsoluteFill>
  );
};

const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 18}});
  return (
    <AbsoluteFill style={{background: ink, color: paper, justifyContent: 'center', alignItems: 'center'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 34, transform: `translateY(${(1 - enter) * 18}px)`, opacity: enter}}>
        <BrandMark size={92} />
        <div>
          <div style={{fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 78, fontWeight: 900, letterSpacing: '-.06em'}}>THE CANVAS IS THE PROMPT.</div>
          <div style={{fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 25, color: paper, marginTop: 20}}>trace-webmcp.callboard.workers.dev</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const TraceDemo: React.FC = () => (
  <AbsoluteFill style={{background: ink}}>
    <Audio src={staticFile('audio/sfx-bed.mp3')} loop volume={0.18} />
    <Sequence from={0} durationInFrames={90}><Intro /></Sequence>
    <Sequence from={90} durationInFrames={2070}><CameraBroll /></Sequence>
    <Sequence from={2160} durationInFrames={360}><NativeProof /></Sequence>
    <Sequence from={2520} durationInFrames={240}><Outro /></Sequence>

    {narration.map(({from, file, caption}, index) => (
      <React.Fragment key={file}>
        <Sequence from={from}>
          <Audio src={staticFile(`audio/${file}`)} volume={1.4} />
        </Sequence>
        {caption ? (
          <Sequence from={from} durationInFrames={150}>
            <Caption text={caption} index={index} />
          </Sequence>
        ) : null}
      </React.Fragment>
    ))}

    {soundCues.map(({from, file, volume}, index) => (
      <Sequence key={`${file}-${index}`} from={from} durationInFrames={60}>
        <Audio src={staticFile(`audio/${file}`)} volume={volume} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
