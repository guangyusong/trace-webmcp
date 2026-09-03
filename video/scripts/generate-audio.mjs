#!/usr/bin/env node

import {mkdir, readFile, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const videoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(videoRoot, 'public', 'audio');
const voiceId = 'FGY2WhTYpPnrIDTdsKH5'; // Laura: bright, warm, social-media delivery.

const narration = [
  ['vo-01', '[curious] What if the canvas was the prompt?'],
  ['vo-02', '[confidently] Circle the block. That gesture becomes exact context.'],
  ['vo-03', 'Now the agent reads the live page, not pixels, and draws every force where the question lives.'],
  ['vo-04', '[playfully] It solves. It moves.'],
  ['vo-05', 'Then one human mark rejects friction. Every dependent answer changes. Four point zero six becomes four point nine one.'],
  ['vo-06', '[curious] Same gesture. Harder question.'],
  ['vo-07', 'One arrow says an assassination caused a world war. That is too simple.'],
  ['vo-08', 'TRACE expands the missing decisions and brings two sources into the same surface.'],
  ['vo-09', 'Cross out mobilization. The path bends. War remains possible, not fixed.'],
  ['vo-10', '[confidently] Fourteen Site tools. Discovered by the page. Called live inside ChatGPT.'],
  ['vo-11', 'One artifact. Two interfaces. Visible authorship. Reversible actions.'],
  ['vo-12', '[whispers] The canvas is the prompt.'],
];

const effects = [
  ['sfx-ink', 'A single elegant graphite pencil circle drawn quickly on textured paper, close and dry, no voice', 0.8],
  ['sfx-tool', 'A precise warm interface confirmation tick with a tiny glassy sparkle, minimal, no voice', 0.6],
  ['sfx-crossout', 'Two brisk graphite pencil cross-out strokes on paper, close, tactile, no voice', 0.8],
  ['sfx-number', 'A compact kinetic number-change tick rising one step, warm and intelligent, no voice', 0.6],
  ['sfx-page', 'A restrained paper page turn blended with a soft cinematic whoosh, no voice', 1.1],
  ['sfx-bed', 'A seamless minimal editorial pulse: warm muted percussion, soft paper texture, restrained momentum, intelligent and modern, no melody, no voice', 18, true],
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
