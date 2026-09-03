import {spawn, execFileSync} from 'node:child_process';
import {mkdtemp, mkdir, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {setTimeout as wait} from 'node:timers/promises';

const FPS = 30;
const DURATION_SECONDS = 16;
const URL = process.env.TRACE_CAPTURE_URL ?? 'http://127.0.0.1:4199/';
const OUTPUT = path.resolve('assets/trace-app-broll-v2.mp4');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const scratch = await mkdtemp(path.join(tmpdir(), 'trace-broll-'));
const framesDir = path.join(scratch, 'frames');
const profileDir = path.join(scratch, 'profile');
await mkdir(framesDir);
await mkdir(profileDir);

const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--no-first-run',
  '--no-default-browser-check',
  '--force-device-scale-factor=1',
  '--window-size=1920,1080',
  '--remote-debugging-port=9333',
  `--user-data-dir=${profileDir}`,
  'about:blank',
], {stdio: 'ignore'});

const poll = async (url, options) => {
  let lastError;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response.json();
    } catch (error) {
      lastError = error;
    }
    await wait(100);
  }
  throw lastError ?? new Error(`Timed out waiting for ${url}`);
};

let socket;
try {
  await poll('http://127.0.0.1:9333/json/version');
  const target = await poll(
    `http://127.0.0.1:9333/json/new?${encodeURIComponent(URL)}`,
    {method: 'PUT'},
  );
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, {once: true});
    socket.addEventListener('error', reject, {once: true});
  });

  let commandId = 0;
  const pending = new Map();
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (!message.id) return;
    const handler = pending.get(message.id);
    if (!handler) return;
    pending.delete(message.id);
    if (message.error) handler.reject(new Error(message.error.message));
    else handler.resolve(message.result);
  });

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++commandId;
    pending.set(id, {resolve, reject});
    socket.send(JSON.stringify({id, method, params}));
  });

  const evaluate = (expression) => send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send('Page.navigate', {url: URL});
  await wait(800);
  await evaluate("localStorage.removeItem('trace-board-v1'); location.reload()");
  await wait(900);

  const actions = new Map([
    [15, ".demo-button?.click()"],
    [180, "window.traceWebMCP.callTool('set_assumption', {assumption:'friction', enabled:false, reason:'human crossed it out'})"],
    [240, "[...document.querySelectorAll('.scene-switcher button')].find((button) => button.textContent.includes('July'))?.click()"],
    [270, ".demo-button?.click()"],
    [400, "window.traceWebMCP.callTool('run_counterfactual', {removeEventId:'event-mobilization'})"],
  ]);

  const startedAt = performance.now();
  const frameCount = FPS * DURATION_SECONDS;
  for (let frame = 0; frame < frameCount; frame += 1) {
    const action = actions.get(frame);
    if (action) {
      const expression = action.startsWith('.')
        ? `document.querySelector('${action.slice(0, action.indexOf('?'))}')${action.slice(action.indexOf('?'))}`
        : action;
      await evaluate(expression);
    }

    const screenshot = await send('Page.captureScreenshot', {
      format: 'jpeg',
      quality: 92,
      captureBeyondViewport: false,
      fromSurface: true,
    });
    const filename = `frame-${String(frame + 1).padStart(6, '0')}.jpg`;
    await writeFile(path.join(framesDir, filename), Buffer.from(screenshot.data, 'base64'));

    const dueAt = startedAt + ((frame + 1) * 1000) / FPS;
    const delay = dueAt - performance.now();
    if (delay > 0) await wait(delay);
  }

  execFileSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-framerate', String(FPS),
    '-i', path.join(framesDir, 'frame-%06d.jpg'),
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '16',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-y', OUTPUT,
  ], {stdio: 'inherit'});

  console.log(OUTPUT);
} finally {
  socket?.close();
  const exited = new Promise((resolve) => chrome.once('exit', resolve));
  chrome.kill('SIGTERM');
  await Promise.race([exited, wait(1500)]);
  await rm(scratch, {recursive: true, force: true, maxRetries: 5, retryDelay: 150});
}
