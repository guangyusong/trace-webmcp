#!/usr/bin/env node

import {mkdir, readFile, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const videoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(videoRoot, 'public', 'audio');
const voiceId = 'FGY2WhTYpPnrIDTdsKH5'; // Laura: bright, warm, social-media delivery.

const narration = [
  ['vo2-01', '[confidently] Circle it. The canvas becomes the prompt.'],
  ['vo2-02', 'TRACE gives the agent the object, not a screenshot.'],
  ['vo2-03', '[quickly] It draws the forces, solves the motion, and moves the block.'],
  ['vo2-04', 'Cross out friction. Every dependent answer updates.'],
  ['vo2-05', '[curious] Same gesture. Messier problem.'],
  ['vo2-06', 'One arrow cannot explain a world war. TRACE restores the decisions and the sources.'],
  ['vo2-07', 'Remove one decision. The path bends instead of pretending history was fixed.'],
  ['vo2-08', '[confidently] Fourteen native WebMCP tools. Called live. Human and agent, working on one surface.'],
  ['vo2-09', '[whispers] The canvas is the prompt.'],
];

const effects = [
  ['sfx2-zoom', 'A fast clean camera push whoosh ending in a dry marker tap, modern and precise, no voice', 0.8],
  ['sfx2-branch', 'Three quick hand-drawn line strokes branching across a whiteboard, tactile dry marker, no voice', 1.0],
  ['sfx2-bed', 'A seamless crisp 112 BPM rhythm made from dry marker taps, wooden desk knocks, finger snaps and a restrained sub pulse, energetic educational short-form video, no melody, no voice', 20, true],
];

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function apiKey() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY.trim();
  if (process.env.XI_API_KEY) return process.env.XI_API_KEY.trim();
  return (await readFile('/Users/song/.elevenlabs/api_key', 'utf8')).trim();
}

async function requestAudio(url, body, key) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'xi-api-key': key},
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${(await response.text()).slice(0, 500)}`);
  }
  return {
    bytes: Buffer.from(await response.arrayBuffer()),
    cost: response.headers.get('character-cost') ?? 'unknown',
  };
}

async function main() {
  const force = process.argv.includes('--force');
  const key = await apiKey();
  await mkdir(outputDir, {recursive: true});
  const costs = [];

  for (const [id, text] of narration) {
    const target = path.join(outputDir, `${id}.mp3`);
    if (!force && await exists(target)) continue;
    const audio = await requestAudio(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        text,
        model_id: 'eleven_v3',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.78,
          style: 0.28,
          use_speaker_boost: true
        }
      },
      key,
    );
    await writeFile(target, audio.bytes);
    costs.push({id, type: 'voice', characterCost: audio.cost});
    console.log(`generated ${id} (${audio.cost} characters billed)`);
  }

  for (const [id, text, durationSeconds, loop = false] of effects) {
    const target = path.join(outputDir, `${id}.mp3`);
    if (!force && await exists(target)) continue;
    const audio = await requestAudio(
      'https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128',
      {
        text,
        duration_seconds: durationSeconds,
        loop,
        prompt_influence: 0.42,
        model_id: 'eleven_text_to_sound_v2'
      },
      key,
    );
    await writeFile(target, audio.bytes);
    costs.push({id, type: 'sfx', characterCost: audio.cost});
    console.log(`generated ${id} (${audio.cost} characters billed)`);
  }

  await writeFile(path.join(outputDir, 'generation-costs.json'), `${JSON.stringify(costs, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
