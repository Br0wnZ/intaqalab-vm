/**
 * main.ts
 * Servidor Express con prefijo /api. Compatible con Nx + assets estáticos.
 */
import cors from 'cors';
import express from 'express';
import * as path from 'path';

import { delayResponse } from './middlewares/delay.middleware';
import apiRoutes from './routes';
import { dateStr } from './utils';

const DELAY_RESPONSE_MS = 250;

const app = express();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const logger = (req: any, res: any, next: any) => {
  console.log(`${dateStr()} ${req.method} ${req.url}`);
  next();
};
app.use(logger);
app.use(cors());
app.use(express.json());
app.use(delayResponse(DELAY_RESPONSE_MS));

app.use('/api/assets', express.static(path.join(__dirname, 'assets')));

// Rewriter de URLs versionadas → rutas internas del mock server
// Elimina el segmento de versión de la API (ej. fire-trials-api/1.0.0 → fire-trials)
// sin afectar ningún servicio Angular ni entorno remoto.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use((req: any, _res: any, next: any) => {
  const originalUrl = req.url;
  // /api/centers/X/fire-trials-api/1.0.0/Y/... → /api/centers/X/Y/...
  req.url = req.url.replace(/^(\/api\/centers\/[^/]+\/)fire-trials-api\/[^/]+\/(.*)/, '$1$2');
  // /api/fire-trials-api/1.0.0/Y/... → /api/Y/... (endpoints sin center)
  req.url = req.url.replace(/^(\/api\/)fire-trials-api\/[^/]+\/(.*)/, '$1$2');
  // /api/centers/X/fire-trials-documents-api/1.0.0/Y/... → /api/centers/X/documents/Y/...
  req.url = req.url.replace(/^(\/api\/centers\/[^/]+\/)fire-trials-documents-api\/[^/]+\/(.*)/, '$1documents/$2');
  // /api/fire-trials-documents-api/1.0.0/Y/... → /api/Y/... (endpoints sin center, ej: document-types)
  req.url = req.url.replace(/^(\/api\/)fire-trials-documents-api\/[^/]+\/(.*)/, '$1$2');
  // /api/centers/X/planning-api/1.0.0/fire-trials/Y/... → /api/centers/X/fire-trials/Y/...
  // /api/centers/X/planning-api/1.0.0/specimens/... → /api/centers/X/specimens/...
  req.url = req.url.replace(/^(\/api\/centers\/[^/]+\/)planning-api\/[^/]+\/(.*)/, '$1$2');
  if (originalUrl !== req.url) {
    console.log(`  🔄 [Rewriter] ${originalUrl} → ${req.url}`);
  }
  next();
});

app.use('/api', apiRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor Express escuchando en http://localhost:${port}`);
});
