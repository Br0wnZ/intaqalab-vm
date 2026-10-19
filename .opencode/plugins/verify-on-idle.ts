import type { Plugin } from '@opencode-ai/plugin';
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const verifyScript = resolve(__dirname, '../../tools/verify/verify.mjs');
const repoRoot = resolve(__dirname, '../..');
const nodeBin = process.platform === 'win32' ? 'node.exe' : 'node';

export const VerifyOnIdle: Plugin = async ({ client }) => {
  let active = false;
  let running = false;

  const log = async (level: 'info' | 'error', message: string) => {
    try {
      await client.app.log({ body: { service: 'verify-on-idle', level, message } });
    } catch {
      // logging must never break the session
    }
  };

  const runVerify = () => {
    if (running) return;
    running = true;
    void log('info', 'Session idle — running verification');
    const child = spawn(nodeBin, [verifyScript], { cwd: repoRoot, stdio: 'inherit' });
    child.on('exit', (code) => {
      running = false;
      if (code !== 0) void log('error', `Verification failed (exit ${code ?? 'unknown'})`);
    });
  };

  const onIdle = () => {
    if (!active) return;
    active = false;
    runVerify();
  };

  return {
    event: async ({ event }) => {
      switch (event.type) {
        case 'message.updated':
        case 'message.part.updated':
          active = true;
          break;
        case 'session.status':
          if (event.properties.status.type === 'idle') onIdle();
          else active = true;
          break;
        case 'session.idle':
          onIdle();
          break;
        default:
          break;
      }
    },
  };
};
