import { Plugin } from '@opencode-ai/plugin';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const verifyScript = resolve(__dirname, '../../tools/verify/verify.mjs');
const repoRoot = resolve(__dirname, '../..');
const isWin = process.platform === 'win32';

let isBusy = false;

function runVerify() {
  console.log('[verify-on-idle] Petición finalizada — ejecutando verificación...');

  const nodeBin = isWin ? 'node.exe' : 'node';
  const result = spawnSync(nodeBin, [verifyScript], {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: false,
  });

  if (result.status !== 0) {
    console.error(`[verify-on-idle] Verificación falló (exit ${result.status ?? 'unknown'})`);
  } else {
    console.log('[verify-on-idle] Verificación exitosa ✓');
  }
}

export const VerifyOnIdle: Plugin = async () => {
  return {
    event: async ({ event }) => {
      const type = event.type;
      const statusType = (event as any).properties?.status?.type;

      if (type === 'session.status' && statusType === 'busy') {
        isBusy = true;
      } else if (type === 'message.updated' || type === 'message.part.updated') {
        isBusy = true;
      } else if ((type === 'session.idle' || statusType === 'idle') && isBusy) {
        isBusy = false;
        runVerify();
      }
    },
  };
};

export default VerifyOnIdle;
