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

const ink = '#171815';
const ivory = '#f1ead9';
const amber = '#e8a83b';
const teal = '#4a9b8b';

const narration = [
  {from: 120, file: 'vo-01.mp3', caption: 'What if the canvas was the prompt?'},
  {from: 300, file: 'vo-02.mp3', caption: 'Circle the block. The gesture becomes exact context.'},
  {from: 540, file: 'vo-03.mp3', caption: 'The agent reads the live page — not pixels.'},
  {from: 810, file: 'vo-04.mp3', caption: 'It solves. It moves.'},
  {from: 1020, file: 'vo-05.mp3', caption: 'One human mark changes every dependent answer.'},
  {from: 1440, file: 'vo-06.mp3', caption: 'Same gesture. Harder question.'},
  {from: 1650, file: 'vo-07.mp3', caption: 'One arrow cannot explain a world war.'},
  {from: 1950, file: 'vo-08.mp3', caption: 'Missing decisions and conflicting sources appear in place.'},
  {from: 2280, file: 'vo-09.mp3', caption: 'The path bends. War remains possible — not fixed.'},
  {from: 2640, file: 'vo-10.mp3', caption: null},
  {from: 2910, file: 'vo-11.mp3', caption: null},
  {from: 3090, file: 'vo-12.mp3', caption: null},
];

const soundCues = [
  {from: 285, file: 'sfx-ink.mp3', volume: 0.34},
  {from: 555, file: 'sfx-tool.mp3', volume: 0.25},
  {from: 1010, file: 'sfx-crossout.mp3', volume: 0.3},
  {from: 1190, file: 'sfx-number.mp3', volume: 0.27},
  {from: 1430, file: 'sfx-page.mp3', volume: 0.28},
  {from: 2630, file: 'sfx-tool.mp3', volume: 0.25},
  {from: 3080, file: 'sfx-ink.mp3', volume: 0.22},
];

const Caption: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 18, mass: 0.7}});
  const opacity = interpolate(frame, [0, 5, 118, 132], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 62, pointerEvents: 'none'}}>
      <div style={{
        maxWidth: 1500,
        borderRadius: 999,
        background: 'rgba(23,24,21,0.9)',
        color: ivory,
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        fontSize: 38,
        fontWeight: 700,
        letterSpacing: '-0.02em',
        lineHeight: 1.15,
        padding: '18px 34px 20px',
        opacity,
        transform: `translateY(${(1 - enter) * 24}px) scale(${0.97 + enter * 0.03})`,
        boxShadow: '0 18px 60px rgba(0,0,0,0.28)',
        textAlign: 'center',
      }}>{text}</div>
    </AbsoluteFill>
  );
};

const BrandMark: React.FC<{size?: number}> = ({size = 96}) => (
  <div style={{
    width: size,
    height: size,
    borderRadius: '50%',
    background: amber,
    display: 'grid',
    placeItems: 'center',
    boxShadow: '0 14px 50px rgba(232,168,59,0.25)',
  }}>
    <div style={{width: size * 0.42, height: size * 0.42, border: `${Math.max(3, size * 0.055)}px solid ${ink}`, borderRadius: '50%'}} />
  </div>
);

const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = spring({frame, fps, config: {damping: 16, stiffness: 90}});
  const fade = interpolate(frame, [88, 118], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: ink, color: ivory, justifyContent: 'center', alignItems: 'center', opacity: fade}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 34, transform: `scale(${0.86 + reveal * 0.14})`, opacity: reveal}}>
        <BrandMark size={112} />
        <div>
          <div style={{fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', fontSize: 92, fontWeight: 800, letterSpacing: '0.18em'}}>TRACE</div>
          <div style={{fontFamily: 'Georgia, serif', fontSize: 34, color: '#b8b3a8', fontStyle: 'italic'}}>the canvas is the prompt</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const CameraBroll: React.FC = () => {
  const frame = useCurrentFrame();
  const local = frame - 120;
  const zoom = interpolate(
    local,
    [0, 220, 430, 690, 920, 1160, 1420, 1650, 1910, 2190, 2490],
    [1.02, 1.11, 1.08, 1.15, 1.1, 1.02, 1.07, 1.12, 1.08, 1.13, 1.04],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)},
  );
  const x = interpolate(
    local,
    [0, 430, 920, 1420, 1910, 2490],
    [0, -52, 56, 0, -24, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)},
  );
  const y = interpolate(
    local,
    [0, 920, 1420, 1910, 2490],
    [0, -12, 0, -18, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)},
  );
  return (
    <AbsoluteFill style={{background: ink, overflow: 'hidden'}}>
      <OffthreadVideo
        src={staticFile('trace-app-broll.mp4')}
        muted
        playbackRate={1.27}
        style={{width: '100%', height: '100%', objectFit: 'cover', transform: `translate(${x}px, ${y}px) scale(${zoom})`}}
      />
      <div style={{position: 'absolute', inset: 0, boxShadow: 'inset 0 0 110px rgba(0,0,0,0.22)', pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};

const NativeProof: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 20, mass: 0.8}});
  return (
    <AbsoluteFill style={{background: ink, color: ivory, overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(circle at 78% 42%, rgba(232,168,59,.15), transparent 38%)'}} />
      <div style={{position: 'absolute', left: 120, top: 170, width: 760, opacity: enter, transform: `translateX(${(1 - enter) * -38}px)`}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 18, color: teal, fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase'}}>
          <span style={{width: 12, height: 12, borderRadius: '50%', background: teal, boxShadow: `0 0 20px ${teal}`}} />
          Native proof
        </div>
        <div style={{fontFamily: 'Inter, sans-serif', fontSize: 86, fontWeight: 800, lineHeight: .98, letterSpacing: '-.055em', marginTop: 28}}>
          14 site tools.<br />
          <span style={{color: amber}}>One live page.</span>
        </div>
        <div style={{fontFamily: 'Georgia, serif', fontSize: 34, color: '#b8b3a8', lineHeight: 1.35, marginTop: 30, maxWidth: 650}}>
          Discovered and called through WebMCP inside ChatGPT’s built-in browser.
        </div>
      </div>
      <div style={{
        position: 'absolute',
        right: 130,
        top: 52,
        width: 560,
        height: 976,
        borderRadius: 34,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,.15)',
        boxShadow: '0 34px 110px rgba(0,0,0,.55)',
        background: '#fff',
        transform: `translateX(${(1 - enter) * 80}px) rotate(${(1 - enter) * 2}deg)`,
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
    <AbsoluteFill style={{background: ivory, color: ink, justifyContent: 'center', alignItems: 'center'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 36, transform: `scale(${0.9 + enter * 0.1})`, opacity: enter}}>
        <BrandMark size={104} />
        <div>
          <div style={{fontFamily: 'Inter, sans-serif', fontSize: 74, fontWeight: 850, letterSpacing: '-.045em'}}>The canvas is the prompt.</div>
          <div style={{fontFamily: 'Inter, sans-serif', fontSize: 27, color: '#6d6a62', marginTop: 16}}>trace-webmcp.callboard.workers.dev</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const TraceDemo: React.FC = () => (
  <AbsoluteFill style={{background: ink}}>
    <Audio src={staticFile('audio/sfx-bed.mp3')} loop volume={0.18} />
    <Sequence from={0} durationInFrames={120}><Intro /></Sequence>
    <Sequence from={120} durationInFrames={2520}><CameraBroll /></Sequence>
    <Sequence from={2640} durationInFrames={390}><NativeProof /></Sequence>
    <Sequence from={3030} durationInFrames={210}><Outro /></Sequence>

    {narration.map(({from, file, caption}) => (
      <React.Fragment key={file}>
        <Sequence from={from}>
          <Audio src={staticFile(`audio/${file}`)} volume={1.4} />
        </Sequence>
        {caption ? (
          <Sequence from={from} durationInFrames={150}>
            <Caption text={caption} />
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
