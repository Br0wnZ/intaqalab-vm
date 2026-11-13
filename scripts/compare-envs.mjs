#!/usr/bin/env node
/**
 * Herramienta de Trazabilidad de Entornos y Componentes (DES, PRE, PRO).
 * 100% independiente de GitLab.
 *
 * Funcionalidades:
 *   1. npm run env:report                         Estado general de DES, PRE y PRO + componentes afectados
 *   2. npm run env:diff -- pre pro                Diferencias funcionales legibles en español (PRE vs PRO)
 *   3. npm run env:check -- <componente>          Comprueba en qué entornos está desplegado un componente
 *                                                 (ej. saber si está en DES y PRE pero no en PROD)
 *
 * Variables de entorno opcionales:
 *   ENV_URL_DES, ENV_URL_PRE, ENV_URL_PRO
 */
import { execSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

// Aceptar certificados TLS internos/autofirmados de INTA sin error
process.env.NODE_TLS_REJECT_UNAUTHORIZED ??= '0';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const DEFAULT_ENV_URLS = {
  des: process.env.ENV_URL_DES || 'https://intaqalab.des.inta.es',
  pre: process.env.ENV_URL_PRE || 'https://intaqalab.pre.inta.es',
  pro: process.env.ENV_URL_PRO || 'https://intaqalab.inta.es',
  prod: process.env.ENV_URL_PRO || 'https://intaqalab.inta.es',
};

// Diccionario funcional de nombres en español para componentes conocidos
const KNOWN_WIDGETS = {
  'acoustic-level-introduction': 'Nivel Acústico',
  'armament-introduction': 'Introducción de Armamento',
  'datos-blanco-bola': 'Datos de Blanco Bola',
  'execution-prep-jlt-widget': 'Preparación de Ensayo JLT',
  'execution-prep-tech-widget': 'Preparación de Ensayo Técnica',
  'grubbs-criterion': 'Criterio de Grubbs',
  'informacion-tarado': 'Información de Tarado',
  'ipg-pressure-measurements': 'Medidas de Presión IPG',
  'jlt-mao': 'JLT MAO',
  'jlt-shot-data': 'Datos de Disparo JLT',
  'manometer-introduction': 'Introducción de Manómetros',
  'mao-topography': 'Topografía MAO',
  'munition-introduction': 'Introducción de Munición',
  'overpressure-chart': 'Gráfica de Sobrepresión',
  'overpressure-info': 'Información de Sobrepresión',
  'pass-coords': 'Coordenadas de Paso',
  'piezo-pressure-introduction': 'Presión Piezoeléctrica',
  'radar-metcmq': 'Radar METCMQ',
  'radar-trayectography-orientation': 'Orientación de Radar Trayectografía',
  seguimiento: 'Seguimiento de Ensayo',
  seguridad: 'Seguridad de Ensayo',
  'stanag-criterios': 'Criterios STANAG',
  'tarado-presion-chart': 'Gráfica de Tarado de Presión',
  'tarado-velocidad-chart': 'Gráfica de Tarado de Velocidad',
  'target-data': 'Datos de Blanco',
  'topography-introduction': 'Introducción de Topografía',
  'trayectografia-introduction': 'Introducción de Trayectografía',
  'uniformidad-chart': 'Gráfica de Uniformidad',
  'velocity-introduction': 'Introducción de Velocidades',
  'video-camera-orientation': 'Orientación de Cámaras de Vídeo',
  'video-data-introduction': 'Introducción de Datos de Vídeo',
  vigilancia: 'Vigilancia',
};

const KNOWN_DIALOGS = {
  'confirm-delete-configuration-dialog': 'Confirmación de Borrado de Configuración',
  'confirm-delete-serie-dialog': 'Confirmación de Borrado de Serie',
  'confirm-delete-shot-dialog': 'Confirmación de Borrado de Disparo',
  'specimens-managment-dialog': 'Gestión de Muestras / Especímenes',
  'equipment-selector-dialog': 'Selector de Equipamiento',
  'default-upsert-dialog': 'Alta / Edición de Datos Maestros',
};

const KNOWN_PLANNING_COMPONENTS = {
  'planning-general-data-form': 'Formulario de Datos Generales',
  'series-and-shots': 'Gestión de Series y Disparos',
  'shooting-conditions': 'Condiciones de Disparo',
  measures: 'Medidas Planificadas',
  armament: 'Armamento Planificado',
  munitions: 'Municiones Planificadas',
  'rating-criteria': 'Criterios de Valoración',
  'planning-scheduled-dates': 'Fechas Programadas',
  shell: 'Estructura Shell de Planificación',
};

const SPANISH_TERM_MAP = {
  armament: 'Armamento',
  munition: 'Munición',
  munitions: 'Municiones',
  velocity: 'Velocidad',
  velocities: 'Velocidades',
  pressure: 'Presión',
  pressures: 'Presiones',
  measure: 'Medida',
  measures: 'Medidas',
  confirm: 'Confirmación',
  delete: 'Borrado',
  dialog: 'Diálogo',
  config: 'Configuración',
  configuration: 'Configuración',
  serie: 'Serie',
  series: 'Series',
  shot: 'Disparo',
  shots: 'Disparos',
  specimen: 'Espécimen',
  specimens: 'Especímenes',
  catalog: 'Catálogo',
  catalogs: 'Catálogos',
  condition: 'Condición',
  conditions: 'Condiciones',
  target: 'Blanco',
  data: 'Datos',
  dates: 'Fechas',
  form: 'Formulario',
  general: 'Generales',
  rating: 'Valoración',
  criteria: 'Criterios',
  criterios: 'Criterios',
  preparation: 'Preparación',
  selection: 'Selección',
  selector: 'Selector',
  warehouse: 'Almacén',
  execution: 'Ejecución',
  planning: 'Planificación',
  store: 'Gestor de Estado',
  state: 'Estado',
  service: 'Servicio',
  component: 'Componente',
};

const TYPE_LABELS = {
  feat: '🚀 Nuevas Funcionalidades (feat)',
  fix: '🐛 Correcciones de Errores (fix)',
  perf: '⚡ Rendimiento (perf)',
  refactor: '🔧 Refactorizaciones (refactor)',
  revert: '⏪ Reverts (revert)',
  build: '📦 Build / Dependencias (build)',
  ci: '👷 CI/CD (ci)',
  docs: '📚 Documentación (docs)',
  test: '🧪 Tests (test)',
  style: '🎨 Estilo / Formato (style)',
  chore: '🧹 Mantenimiento (chore)',
  ai: '🤖 Agentes / IA (ai)',
  other: '📌 Otros cambios',
};

const TYPE_ORDER = [
  'feat',
  'fix',
  'perf',
  'revert',
  'refactor',
  'build',
  'ci',
  'docs',
  'test',
  'style',
  'chore',
  'ai',
  'other',
];

function git(cmd) {
  try {
    return execSync(`git ${cmd}`, {
      cwd: ROOT_DIR,
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf-8',
    }).trim();
  } catch {
    return null;
  }
}

function commitExistsLocally(ref) {
  if (!ref) return false;
  return git(`cat-file -t ${ref}`) === 'commit';
}

function formatKebabToSpanish(kebab) {
  const parts = kebab.split(/[-_.]+/).filter(Boolean);
  return parts
    .map((p) => {
      const lower = p.toLowerCase();
      if (SPANISH_TERM_MAP[lower]) return SPANISH_TERM_MAP[lower];
      return p.charAt(0).toUpperCase() + p.slice(1);
    })
    .join(' ');
}

/**
 * Consulta version.json de un entorno o resuelve referencia git local.
 */
async function fetchEnvVersion(envOrUrl, overrideRef = null) {
  if (overrideRef) {
    const resolvedSha = git(`rev-parse ${overrideRef}`);
    if (resolvedSha) {
      return {
        name: envOrUrl.toUpperCase(),
        source: 'local-override',
        reachable: true,
        versionInfo: {
          environment: envOrUrl,
          commit: {
            sha: resolvedSha,
            shortSha: resolvedSha.slice(0, 8),
            branch: overrideRef,
            subject: git(`log -1 --format=%s ${resolvedSha}`),
            committedAt: git(`log -1 --format=%cI ${resolvedSha}`),
            author: git(`log -1 --format=%an ${resolvedSha}`),
          },
          build: { builtAt: null, imageTag: null },
        },
      };
    }
  }

  const key = envOrUrl.toLowerCase();
  const baseUrl = DEFAULT_ENV_URLS[key] || (envOrUrl.startsWith('http') ? envOrUrl : null);

  if (!baseUrl) {
    const resolvedSha = git(`rev-parse ${envOrUrl}`);
    if (resolvedSha) {
      return {
        name: envOrUrl,
        source: 'local-git',
        reachable: true,
        versionInfo: {
          environment: envOrUrl,
          commit: {
            sha: resolvedSha,
            shortSha: resolvedSha.slice(0, 8),
            branch: envOrUrl,
            subject: git(`log -1 --format=%s ${resolvedSha}`),
            committedAt: git(`log -1 --format=%cI ${resolvedSha}`),
            author: git(`log -1 --format=%an ${resolvedSha}`),
          },
          build: { builtAt: null, imageTag: null },
        },
      };
    }
    return {
      name: envOrUrl,
      source: 'unknown',
      reachable: false,
      error: `'${envOrUrl}' no es un entorno conocido (des|pre|pro), URL ni referencia Git válida.`,
    };
  }

  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const url = normalizedBase.endsWith('.json') ? normalizedBase : `${normalizedBase}/assets/version.json`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const response = await fetch(`${url}?t=${Date.now()}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      // Fallback a rama local estándar si la red remota falla (ej. sin VPN)
      const fallbackBranch = key === 'pro' || key === 'prod' ? 'master' : key === 'pre' ? 'preprod' : 'develop';
      const fallbackSha = git(`rev-parse ${fallbackBranch}`) || git(`rev-parse origin/${fallbackBranch}`);
      if (fallbackSha) {
        return {
          name: key.toUpperCase(),
          url,
          reachable: true,
          source: 'local-fallback',
          versionInfo: {
            environment: key,
            commit: {
              sha: fallbackSha,
              shortSha: fallbackSha.slice(0, 8),
              branch: fallbackBranch,
              subject: git(`log -1 --format=%s ${fallbackSha}`),
              committedAt: git(`log -1 --format=%cI ${fallbackSha}`),
              author: git(`log -1 --format=%an ${fallbackSha}`),
            },
            build: { builtAt: null, imageTag: 'local-fallback' },
          },
        };
      }

      return {
        name: key.toUpperCase(),
        url,
        reachable: false,
        error: `HTTP ${response.status} ${response.statusText}`,
      };
    }

    const versionInfo = await response.json();
    return {
      name: key.toUpperCase(),
      url,
      reachable: true,
      source: 'remote-http',
      versionInfo,
    };
  } catch (err) {
    // Si no hay conexión (ej. sin VPN activa), intentar fallback a ramas git locales
    const fallbackBranch = key === 'pro' || key === 'prod' ? 'master' : key === 'pre' ? 'preprod' : 'develop';
    const fallbackSha = git(`rev-parse ${fallbackBranch}`) || git(`rev-parse origin/${fallbackBranch}`);
    if (fallbackSha) {
      return {
        name: key.toUpperCase(),
        url,
        reachable: true,
        source: 'local-fallback',
        versionInfo: {
          environment: key,
          commit: {
            sha: fallbackSha,
            shortSha: fallbackSha.slice(0, 8),
            branch: fallbackBranch,
            subject: git(`log -1 --format=%s ${fallbackSha}`),
            committedAt: git(`log -1 --format=%cI ${fallbackSha}`),
            author: git(`log -1 --format=%an ${fallbackSha}`),
          },
          build: { builtAt: null, imageTag: 'local-fallback' },
        },
      };
    }

    const message = err instanceof Error ? err.message : String(err);
    return {
      name: key.toUpperCase(),
      url,
      reachable: false,
      error: message,
    };
  }
}

/**
 * Detecta componentes, pantallas, widgets y diálogos afectados entre dos commits
 * y traduce sus nombres a español funcional.
 */
function detectChangedComponents(fromRef, toRef) {
  const rawDiff = git(`diff --name-status ${fromRef}..${toRef}`);
  if (!rawDiff) return [];

  const lines = rawDiff.split('\n').filter(Boolean);
  const map = new Map();

  for (const line of lines) {
    const parts = line.split('\t');
    const status = parts[0] ? parts[0].charAt(0).toUpperCase() : 'M';
    const filePath = parts[1] || '';
    if (!filePath) continue;

    // 1. Widgets de Ejecución
    const widgetMatch = filePath.match(/execution\/widgets\/([^/]+)/);
    if (widgetMatch && widgetMatch[1] !== 'utils') {
      const slug = widgetMatch[1];
      const friendlyName = KNOWN_WIDGETS[slug] || formatKebabToSpanish(slug);
      const key = `widget:${slug}`;
      const existing = map.get(key);
      const combinedStatus = existing?.status === 'A' || status === 'A' ? 'A' : status;
      map.set(key, {
        category: 'widget',
        categoryLabel: '🖥️ Widgets de Ejecución',
        slug,
        title: `Widget ${friendlyName}`,
        technicalName: slug,
        status: combinedStatus,
        files: [...(existing?.files || []), filePath],
      });
      continue;
    }

    // 2. Diálogos Modales
    const dialogMatch = filePath.match(/([^/]+-dialog)(?:\/|\.ts|\.html)/);
    if (dialogMatch) {
      const slug = dialogMatch[1];
      const friendlyName = KNOWN_DIALOGS[slug] || formatKebabToSpanish(slug);
      const key = `dialog:${slug}`;
      const existing = map.get(key);
      const combinedStatus = existing?.status === 'A' || status === 'A' ? 'A' : status;
      map.set(key, {
        category: 'dialog',
        categoryLabel: '💬 Diálogos Modales',
        slug,
        title: `Diálogo de ${friendlyName}`,
        technicalName: slug,
        status: combinedStatus,
        files: [...(existing?.files || []), filePath],
      });
      continue;
    }

    // 3. Componentes de Planificación
    const planningMatch = filePath.match(/domain\/trial\/planning\/src\/lib\/components\/([^/]+)/);
    if (planningMatch) {
      const slug = planningMatch[1];
      const friendlyName = KNOWN_PLANNING_COMPONENTS[slug] || formatKebabToSpanish(slug);
      const key = `planning:${slug}`;
      const existing = map.get(key);
      const combinedStatus = existing?.status === 'A' || status === 'A' ? 'A' : status;
      map.set(key, {
        category: 'screen',
        categoryLabel: '📄 Pantallas de Planificación',
        slug,
        title: `Pantalla ${friendlyName}`,
        technicalName: slug,
        status: combinedStatus,
        files: [...(existing?.files || []), filePath],
      });
      continue;
    }

    // 4. Componentes UI Compartidos (libs/shared/ui)
    const uiMatch = filePath.match(/shared\/ui\/src\/lib\/([^/]+)/);
    if (uiMatch) {
      const slug = uiMatch[1];
      const friendlyName = formatKebabToSpanish(slug);
      const key = `ui:${slug}`;
      const existing = map.get(key);
      const combinedStatus = existing?.status === 'A' || status === 'A' ? 'A' : status;
      map.set(key, {
        category: 'ui',
        categoryLabel: '🎨 Componentes UI Compartidos',
        slug,
        title: `Componente UI ${friendlyName}`,
        technicalName: slug,
        status: combinedStatus,
        files: [...(existing?.files || []), filePath],
      });
      continue;
    }

    // 5. Servicios de Datos y Negocio
    const serviceMatch = filePath.match(/([^/]+)\.service\.ts$/);
    if (serviceMatch) {
      const slug = serviceMatch[1];
      const friendlyName = formatKebabToSpanish(slug);
      const key = `service:${slug}`;
      const existing = map.get(key);
      const combinedStatus = existing?.status === 'A' || status === 'A' ? 'A' : status;
      map.set(key, {
        category: 'service',
        categoryLabel: '🔌 Servicios y Lógica de Datos',
        slug,
        title: `Servicio ${friendlyName}`,
        technicalName: `${slug}.service.ts`,
        status: combinedStatus,
        files: [...(existing?.files || []), filePath],
      });
      continue;
    }

    // 6. Textos y Traducciones (i18n)
    if (filePath.includes('public/i18n/')) {
      const key = 'i18n';
      const existing = map.get(key);
      map.set(key, {
        category: 'i18n',
        categoryLabel: '🌐 Idiomas y Traducciones',
        slug: 'i18n',
        title: 'Textos y Traducciones de la Aplicación (es, en, de)',
        technicalName: 'apps/intaqalab/public/i18n',
        status: 'M',
        files: [...(existing?.files || []), filePath],
      });
      continue;
    }

    // 7. Módulos de Dominio Generales
    const domainMatch = filePath.match(/libs\/domain\/([^/]+)/);
    if (domainMatch && !filePath.includes('/execution/widgets/') && !filePath.includes('/components/')) {
      const domainSlug = domainMatch[1];
      const domainLabels = {
        'master-data': 'Módulo de Datos Maestros',
        'warehouse-management': 'Módulo de Gestión de Almacén',
        'calendar-trials': 'Módulo de Calendario de Ensayos',
        admin: 'Módulo de Administración',
        'event-log': 'Módulo de Registro de Eventos (Event Log)',
      };
      if (domainLabels[domainSlug]) {
        const key = `domain:${domainSlug}`;
        const existing = map.get(key);
        map.set(key, {
          category: 'module',
          categoryLabel: '📦 Módulos Funcionales',
          slug: domainSlug,
          title: domainLabels[domainSlug],
          technicalName: domainSlug,
          status: 'M',
          files: [...(existing?.files || []), filePath],
        });
      }
    }
  }

  return [...map.values()];
}

function parseCommitLine(line) {
  const [sha, shortSha, date, author, ...subjectParts] = line.split('|');
  const subject = subjectParts.join('|').trim();

  const match = /^([a-z]+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/i.exec(subject);
  const type = match ? match[1].toLowerCase() : 'other';
  const scope = match && match[2] ? match[2].toLowerCase() : null;
  const breaking = Boolean(match && match[3]);
  const description = match ? match[4] : subject;

  const tickets = [...subject.matchAll(/(?:#|!|[A-Z]{2,10}-)\d+/g)].map((m) => m[0]);

  return {
    sha,
    shortSha,
    date: date ? date.slice(0, 10) : '',
    author,
    subject,
    type: TYPE_LABELS[type] ? type : 'other',
    scope,
    breaking,
    description,
    tickets,
  };
}

function getCommitsBetween(fromRef, toRef) {
  if (!commitExistsLocally(fromRef) || !commitExistsLocally(toRef)) {
    return {
      error: `Alguno de los commits (${fromRef.slice(0, 8)} o ${toRef.slice(0, 8)}) no está en tu Git local. Ejecuta 'git fetch --all'.`,
      commits: [],
      behindCount: 0,
      components: [],
    };
  }

  const rawLog = git(`log ${fromRef}..${toRef} --format="%H|%h|%cI|%an|%s"`);
  const commits = rawLog
    ? rawLog
        .split('\n')
        .filter(Boolean)
        .map(parseCommitLine)
    : [];

  const reverseCountRaw = git(`rev-list --count ${toRef}..${fromRef}`);
  const behindCount = reverseCountRaw ? Number.parseInt(reverseCountRaw, 10) : 0;

  const components = detectChangedComponents(fromRef, toRef);

  return { error: null, commits, behindCount, components };
}

function formatDiffReport(sourceEnv, targetEnv, diffResult) {
  const fromSha = targetEnv.versionInfo.commit.shortSha;
  const toSha = sourceEnv.versionInfo.commit.shortSha;
  const lines = [];

  lines.push(`## 🔄 Comparativa: ${sourceEnv.name} (${toSha}) vs ${targetEnv.name} (${fromSha})`);
  lines.push(`> Qué hay en **${sourceEnv.name}** pendiente de llegar a **${targetEnv.name}** (\`${fromSha}..${toSha}\`)\n`);

  if (diffResult.error) {
    lines.push(`⚠️ **Error:** ${diffResult.error}\n`);
    return lines.join('\n');
  }

  if (fromSha === toSha || (diffResult.commits.length === 0 && diffResult.components.length === 0)) {
    lines.push(`✅ **${sourceEnv.name}** y **${targetEnv.name}** tienen exactamente los mismos cambios (0 commits pendientes).`);
    if (diffResult.behindCount > 0) {
      lines.push(
        `⚠️ Atención: **${targetEnv.name}** tiene **${diffResult.behindCount}** commit(s) que NO están en **${sourceEnv.name}** (posible hotfix o ramas divergentes).`,
      );
    }
    lines.push('');
    return lines.join('\n');
  }

  // ========================================================
  // SECCIÓN 1: RESUMEN FUNCIONAL DE COMPONENTES EN ESPAÑOL
  // ========================================================
  lines.push('### 📦 Resumen Funcional de Componentes y Vistas Afectadas (en español)\n');

  if (diffResult.components.length === 0) {
    lines.push('_No se detectaron cambios en componentes UI directos (cambios en configuración, infra o tests)._\n');
  } else {
    // Agrupar por categoría
    const categoriesMap = new Map();
    for (const comp of diffResult.components) {
      const list = categoriesMap.get(comp.categoryLabel) || [];
      list.push(comp);
      categoriesMap.set(comp.categoryLabel, list);
    }

    for (const [catLabel, comps] of categoriesMap.entries()) {
      lines.push(`#### ${catLabel} (${comps.length})`);
      for (const comp of comps) {
        const badge =
          comp.status === 'A'
            ? '🟢 **[NUEVO]**'
            : comp.status === 'D'
              ? '🔴 **[ELIMINADO]**'
              : '🟡 **[MODIFICADO]**';
        lines.push(`- ${badge} **${comp.title}** (\`${comp.technicalName}\`)`);
      }
      lines.push('');
    }
  }

  // ========================================================
  // SECCIÓN 2: DETALLE DE COMMITS POR TIPO CONVENTIONAL
  // ========================================================
  const grouped = new Map();
  const scopesCount = new Map();
  const allTickets = new Set();

  for (const c of diffResult.commits) {
    const list = grouped.get(c.type) || [];
    list.push(c);
    grouped.set(c.type, list);

    if (c.scope) {
      scopesCount.set(c.scope, (scopesCount.get(c.scope) || 0) + 1);
    }
    for (const t of c.tickets) {
      allTickets.add(t);
    }
  }

  const scopesSummary =
    scopesCount.size > 0
      ? [...scopesCount.entries()].map(([s, n]) => `${s} (${n})`).join(', ')
      : 'general';
  lines.push('### 📝 Detalle de Commits y Tareas');
  lines.push(`- **Total commits pendientes:** ${diffResult.commits.length}`);
  lines.push(`- **Módulos afectados (scopes):** ${scopesSummary}`);
  if (allTickets.size > 0) {
    lines.push(`- **Tickets / MRs detectados:** ${[...allTickets].join(', ')}`);
  }
  if (diffResult.behindCount > 0) {
    lines.push(
      `- ⚠️ **Divergencia:** ${targetEnv.name} contiene ${diffResult.behindCount} commit(s) que no están en ${sourceEnv.name}.`,
    );
  }
  lines.push('');

  for (const type of TYPE_ORDER) {
    const items = grouped.get(type);
    if (!items || items.length === 0) continue;

    lines.push(`##### ${TYPE_LABELS[type]} (${items.length})`);
    for (const item of items) {
      const scopeBadge = item.scope ? `**[${item.scope}]** ` : '';
      const breakingBadge = item.breaking ? '💥 **BREAKING** ' : '';
      lines.push(
        `- \`${item.shortSha}\` ${breakingBadge}${scopeBadge}${item.description} _(${item.author}, ${item.date})_`,
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}

function printEnvStatusTable(envResults) {
  console.log('\n# 🌍 Estado de Entornos (version.json)\n');
  console.log('| Entorno | Conexión | Commit SHA | Rama / Ref | Image Tag | Fecha Build | Mensaje del Commit |');
  console.log('|---|---|---|---|---|---|---|');

  for (const env of envResults) {
    if (!env.reachable) {
      console.log(`| **${env.name}** | 🔴 No accesible | - | - | - | - | _${env.error}_ (\`${env.url || ''}\`) |`);
      continue;
    }
    const { commit, build } = env.versionInfo;
    const shortSha = commit?.shortSha || 'unknown';
    const branch = commit?.branch || '-';
    const imageTag = build?.imageTag || '-';
    const builtAt = build?.builtAt ? build.builtAt.replace('T', ' ').slice(0, 19) + 'Z' : '-';
    const subject = (commit?.subject || '-').slice(0, 50);
    const sourceIcon = env.source === 'remote-http' ? '🟢 Online' : '🟡 Local Git';
    console.log(
      `| **${env.name}** | ${sourceIcon} | \`${shortSha}\` | \`${branch}\` | \`${imageTag}\` | ${builtAt} | ${subject} |`,
    );
  }
  console.log('');
}

/**
 * Comprueba en qué entornos (DES, PRE, PRO) está presente o actualizado un componente.
 * Responde exactamente a la pregunta:
 * "¿Está el componente A desplegado en DES, PRE pero no en PROD?"
 */
async function checkComponentAcrossEnvs(searchTerm, refOverrides = {}) {
  console.log(`\n🔍 Buscando componente o elemento: "${searchTerm}"...\n`);

  const [des, pre, pro] = await Promise.all([
    fetchEnvVersion('des', refOverrides.des),
    fetchEnvVersion('pre', refOverrides.pre),
    fetchEnvVersion('pro', refOverrides.pro),
  ]);

  const envs = [
    { key: 'des', name: 'DES', res: des },
    { key: 'pre', name: 'PRE', res: pre },
    { key: 'pro', name: 'PROD', res: pro },
  ];

  const unreachable = envs.filter((e) => !e.res.reachable);
  if (unreachable.length > 0) {
    console.log(`⚠️ Atención: No se pudo consultar version.json de ${unreachable.map((e) => e.name).join(', ')}.`);
    console.log(`   (Posible causa: VPN de INTA no conectada o entorno no desplegado aún).`);
    console.log(`   💡 Consejo: Puedes comparar con ramas o commits locales usando flags:`);
    console.log(`      npm run env:check -- "${searchTerm}" --des=HEAD --pre=HEAD~3 --pro=HEAD~6\n`);
  }

  // Buscar archivos en el árbol git que coincidan con el término
  const cleanTerm = searchTerm.toLowerCase().trim();
  const allGitFiles = git('ls-tree -r --name-only HEAD') || '';
  const matchingFiles = allGitFiles
    .split('\n')
    .filter((f) => f.toLowerCase().includes(cleanTerm))
    .filter((f) => !f.endsWith('.spec.ts') && !f.endsWith('.md') && !f.endsWith('.scss'))
    .filter((f) => !f.startsWith('mocks/') && !f.startsWith('.agents/') && !f.startsWith('.claude/'));

  if (matchingFiles.length === 0) {
    console.log(`❌ No se encontró ningún archivo ni componente en el repositorio que contenga "${searchTerm}".`);
    console.log('   Sugerencias de búsqueda: "armament", "munition", "dialog", "radar", "measures", etc.');
    return;
  }

  // Agrupar archivos por componente principal
  const componentGroups = new Map();
  for (const file of matchingFiles) {
    let groupKey = file;
    let groupTitle = path.basename(file);

    const widgetMatch = file.match(/execution\/widgets\/([^/]+)/);
    if (widgetMatch) {
      const slug = widgetMatch[1];
      groupKey = `widget:${slug}`;
      groupTitle = `Widget ${KNOWN_WIDGETS[slug] || formatKebabToSpanish(slug)} (\`${slug}\`)`;
    } else {
      const dialogMatch = file.match(/([^/]+-dialog)/);
      if (dialogMatch) {
        const slug = dialogMatch[1];
        groupKey = `dialog:${slug}`;
        groupTitle = `Diálogo de ${KNOWN_DIALOGS[slug] || formatKebabToSpanish(slug)} (\`${slug}\`)`;
      } else {
        const planningMatch = file.match(/domain\/trial\/planning\/src\/lib\/components\/([^/]+)/);
        if (planningMatch) {
          const slug = planningMatch[1];
          groupKey = `planning:${slug}`;
          groupTitle = `Pantalla ${KNOWN_PLANNING_COMPONENTS[slug] || formatKebabToSpanish(slug)} (\`${slug}\`)`;
        }
      }
    }

    const current = componentGroups.get(groupKey) || { title: groupTitle, mainFile: file, allFiles: [] };
    current.allFiles.push(file);
    componentGroups.set(groupKey, current);
  }

  for (const [_, comp] of componentGroups.entries()) {
    console.log(`========================================================================`);
    console.log(`📦 Componente: ${comp.title}`);
    console.log(`   Ruta principal: \`${comp.mainFile}\``);
    console.log(`========================================================================\n`);

    console.log('| Entorno | ¿Existe físicamente? | Estado de la versión | Último commit en ese entorno |');
    console.log('|---|---|---|---|');

    const envStatuses = {};

    for (const env of envs) {
      const sha = env.res.versionInfo?.commit?.sha;
      if (!sha || !commitExistsLocally(sha)) {
        console.log(`| **${env.name}** | ❓ Desconectado | _No accesible_ | - |`);
        continue;
      }

      // 1. ¿Existe el archivo en el commit de ese entorno? (usando ls-tree limpio)
      const lsOutput = git(`ls-tree ${sha} ${comp.mainFile}`);
      const exists = Boolean(lsOutput && lsOutput.trim());

      // 2. Último commit en el historial de ese entorno que tocó este archivo
      const lastCommitOnEnv = git(`log ${sha} -1 --format="%h|%cI|%s" -- ${comp.mainFile}`);
      const [lastSha, lastDate, lastSubject] = lastCommitOnEnv ? lastCommitOnEnv.split('|') : ['-', '-', '-'];
      const dateStr = lastDate && lastDate !== '-' ? ` (${lastDate.slice(0, 10)})` : '';

      envStatuses[env.key] = {
        exists,
        lastSha,
        lastDate,
        lastSubject,
        envSha: sha,
      };

      if (!exists) {
        console.log(`| **${env.name}** | ❌ **NO existe** | No desplegado en este entorno | - |`);
      } else {
        console.log(`| **${env.name}** | ✅ **SÍ existe** | Desplegado | \`${lastSha}\`${dateStr}: _${(lastSubject || '').slice(0, 40)}_ |`);
      }
    }

    console.log('');

    // DIAGNÓSTICO EN ESPAÑOL CLARO
    const desSt = envStatuses['des'];
    const preSt = envStatuses['pre'];
    const proSt = envStatuses['pro'];

    console.log('📋 **Diagnóstico de despliegue:**');

    if (desSt?.exists && preSt?.exists && proSt && !proSt.exists) {
      console.log(`👉 **${comp.title}** está desplegado en **DES** y en **PRE**, pero **NO está en PRODUCCIÓN (PROD)**.`);
    } else if (desSt?.exists && preSt && !preSt.exists && proSt && !proSt.exists) {
      console.log(`👉 **${comp.title}** está únicamente en **DES** (todavía no ha pasado ni a PRE ni a PROD).`);
    } else if (desSt?.exists && preSt?.exists && proSt?.exists) {
      // Comprobar si hay diferencias de código entre PRE y PROD
      const diffPrePro = git(`diff --name-only ${proSt.envSha}..${preSt.envSha} -- ${comp.mainFile}`);
      if (diffPrePro) {
        console.log(`👉 **${comp.title}** existe en los 3 entornos, pero en **PROD está desactualizado** (le faltan mejoras que ya están en PRE/DES).`);
      } else {
        console.log(`👉 **${comp.title}** está desplegado y **al día en todos los entornos** (DES, PRE y PROD).`);
      }
    } else {
      console.log(`👉 Revisa la tabla superior para ver la disponibilidad exacta en cada entorno.`);
    }

    // Si hay commits pendientes entre PRE y PROD para este componente, mostrarlos
    if (preSt?.envSha && proSt?.envSha && preSt.exists && proSt.exists) {
      const pendingCommits = git(`log ${proSt.envSha}..${preSt.envSha} --oneline -- ${comp.mainFile}`);
      if (pendingCommits) {
        console.log(`\n   Cambios pendientes de llegar a PROD para este componente:`);
        for (const line of pendingCommits.split('\n').filter(Boolean)) {
          console.log(`   - ${line}`);
        }
      }
    }

    console.log('\n');
  }
}

async function main() {
  const allArgs = process.argv.slice(2);
  const flags = new Set(allArgs.filter((arg) => arg.startsWith('--')));
  const nonFlagArgs = allArgs.filter((arg) => !arg.startsWith('--'));

  if (flags.has('--help') || flags.has('-h')) {
    console.log(`Uso:
  npm run env:report                      Consulta DES, PRE y PRO y muestra diferencias legibles en español
  npm run env:diff -- <origen> <destino>  Compara qué hay en <origen> que no está en <destino>
  npm run env:check -- <componente>       Comprueba en qué entornos está desplegado un componente
                                          (ej. saber si está en DES y PRE pero no en PROD)

Ejemplos:
  npm run env:check -- armament           Comprueba dónde está desplegado el Widget de Armamento
  npm run env:check -- "confirm-delete"   Comprueba dónde está el Diálogo de Confirmación de Borrado
  npm run env:diff -- pre pro             Qué componentes hay en PRE pendientes de subir a PROD
  npm run env:diff -- des pre             Qué componentes hay en DES pendientes de pasar a PRE`);
    return;
  }

  // Extraer posibles overrides de ramas/commits locales (ej. --des=HEAD --pre=HEAD~3 --pro=HEAD~6)
  const refOverrides = {};
  for (const arg of allArgs) {
    if (arg.startsWith('--des=')) refOverrides.des = arg.split('=')[1];
    if (arg.startsWith('--pre=')) refOverrides.pre = arg.split('=')[1];
    if (arg.startsWith('--pro=') || arg.startsWith('--prod=')) refOverrides.pro = arg.split('=')[1];
  }

  // Modo comprobación de componente específico: `npm run env:check -- <componente>`
  if (flags.has('--check') || (nonFlagArgs.length === 1 && !['des', 'pre', 'pro', 'prod'].includes(nonFlagArgs[0].toLowerCase()))) {
    const term = nonFlagArgs.find((a) => !a.startsWith('--')) || (allArgs.find((a) => !a.startsWith('--')) || '');
    if (!term) {
      console.error('❌ Debes especificar el nombre o término del componente a buscar. Ej: npm run env:check -- armament');
      process.exit(1);
    }
    await checkComponentAcrossEnvs(term, refOverrides);
    return;
  }

  // Modo comparación directa entre 2 referencias/entornos: `node scripts/compare-envs.mjs <origen> <destino>`
  if (nonFlagArgs.length === 2) {
    const [sourceArg, targetArg] = nonFlagArgs;
    const [sourceEnv, targetEnv] = await Promise.all([
      fetchEnvVersion(sourceArg),
      fetchEnvVersion(targetArg),
    ]);

    if (sourceEnv.source !== 'local-git' || targetEnv.source !== 'local-git') {
      printEnvStatusTable([sourceEnv, targetEnv]);
    }

    if (!sourceEnv.reachable || !targetEnv.reachable) {
      console.error(
        '❌ No se pudo obtener version.json de alguno de los entornos. ' +
          'Si estás fuera de la VPN o quieres comparar ramas/commits locales, pásalos como argumentos (ej. `npm run env:diff -- develop master`).',
      );
      process.exit(1);
    }

    const diff = getCommitsBetween(
      targetEnv.versionInfo.commit.sha,
      sourceEnv.versionInfo.commit.sha,
    );
    console.log(formatDiffReport(sourceEnv, targetEnv, diff));
    return;
  }

  // Modo general: consultar DES, PRE y PRO
  const [des, pre, pro] = await Promise.all([
    fetchEnvVersion('des'),
    fetchEnvVersion('pre'),
    fetchEnvVersion('pro'),
  ]);

  printEnvStatusTable([des, pre, pro]);

  if (pre.reachable && pro.reachable) {
    const diffPrePro = getCommitsBetween(pro.versionInfo.commit.sha, pre.versionInfo.commit.sha);
    console.log(formatDiffReport(pre, pro, diffPrePro));
  }

  if (des.reachable && pre.reachable) {
    const diffDesPre = getCommitsBetween(pre.versionInfo.commit.sha, des.versionInfo.commit.sha);
    console.log(formatDiffReport(des, pre, diffDesPre));
  }
}

main();
