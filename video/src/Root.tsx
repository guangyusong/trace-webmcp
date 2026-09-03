import React from 'react';
import {Composition} from 'remotion';
import {TraceDemo} from './TraceDemo';

export const Root: React.FC = () => (
  <Composition
    id="TraceDemo"
    component={TraceDemo}
    durationInFrames={2760}
    fps={30}
    width={1920}
    height={1080}
  />
);
