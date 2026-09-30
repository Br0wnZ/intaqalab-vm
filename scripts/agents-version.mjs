#!/usr/bin/env node
/**
 * INTAQALAB Agents & Skills Versioning CLI
 * Manages SemVer versioning, manifest verification, checksum validation, and synchronization.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const AGENTS_DIR = path.join(ROOT_DIR, '.agents');
const AGENTS_SKILLS_DIR = path.join(AGENTS_DIR, 'skills');
const CLAUDE_SKILLS_DIR = path.join(ROOT_DIR, '.claude', 'skills');
const VERSIONS_FILE = path.join(AGENTS_DIR, 'versions.json');
const CHANGELOG_FILE = path.join(AGENTS_DIR, 'CHANGELOG.md');
const AGENTS_MD_FILE = path.join(ROOT_DIR, 'AGENTS.md');

const AGENTS_VERSION_TAG_REGEX = /<!--\s*AGENTS_VERSION:\s*([^\s|]+)\s*\|\s*UPDATED:\s*([^\s>]+)\s*-->/;
const SEMVER_REGEX = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/;

function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}

function normalizeContent(str) {
  return str.replace(/\r\n/g, '\n');
}

function computeFileHash(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = normalizeContent(fs.readFileSync(filePath, 'utf-8'));
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
}

function computeDirHash(dirPath) {
  if (!fs.existsSync(dirPath)) return null;
  const files = [];

  function walk(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === '.DS_Store' || entry.name.endsWith('~')) continue;
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        const rel = path.relative(dirPath, fullPath);
        files.push(rel);
      }
    }
  }

  walk(dirPath);
  files.sort();

  const hasher = crypto.createHash('sha256');
  for (const rel of files) {
    const full = path.join(dirPath, rel);
    const content = normalizeContent(fs.readFileSync(full, 'utf-8'));
    hasher.update(`${rel}:${crypto.createHash('sha256').update(content).digest('hex')};`);
  }
  return hasher.digest('hex').slice(0, 16);
}

function parseFrontmatter(fileContent) {
  const match = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n[\s\S]*)?$/);
  if (!match) {
    return { frontmatter: null, body: fileContent, rawFm: '' };
  }
  const rawFm = match[1];
  const body = match[2] || '';
  const lines = rawFm.split(/\r?\n/);
  const data = {};

  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0 && !line.startsWith(' ') && !line.startsWith('\t')) {
      const key = line.slice(0, colonIdx).trim();
      let val = line.slice(colonIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      data[key] = val;
    }
  }

  return { frontmatter: data, body, rawFm };
}

function serializeFrontmatter(frontmatter, body) {
  const lines = ['---'];
  const orderedKeys = ['name', 'version', 'last-updated', 'description', 'argument-hint', 'user-invocable', 'mode'];
  const used = new Set();

  for (const key of orderedKeys) {
    if (key in frontmatter) {
      const val = frontmatter[key];
      if (typeof val === 'string' && (val.includes(':') || val.includes('\n') || val.includes('"') || val.includes("'"))) {
        lines.push(`${key}: ${JSON.stringify(val)}`);
      } else {
        lines.push(`${key}: ${val}`);
      }
      used.add(key);
    }
  }

  for (const [key, val] of Object.entries(frontmatter)) {
    if (!used.has(key)) {
      if (typeof val === 'string' && (val.includes(':') || val.includes('\n') || val.includes('"') || val.includes("'"))) {
        lines.push(`${key}: ${JSON.stringify(val)}`);
      } else {
        lines.push(`${key}: ${val}`);
      }
    }
  }

  lines.push('---');
  const cleanBody = body.startsWith('\n') ? body : '\n' + body;
  return lines.join('\n') + cleanBody;
}

function bumpSemVer(version, type = 'patch') {
  const clean = version.trim();
  const match = clean.match(/^(\d+)\.(\d+)\.(\d+)(?:-.*)?$/);
  if (!match) throw new Error(`SemVer no válido: "${clean}"`);

  let major = parseInt(match[1], 10);
  let minor = parseInt(match[2], 10);
  let patch = parseInt(match[3], 10);

  if (type === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (type === 'minor') {
    minor += 1;
    patch = 0;
  } else {
    patch += 1;
  }

  return `${major}.${minor}.${patch}`;
}

function readVersionsManifest() {
  if (!fs.existsSync(VERSIONS_FILE)) {
    return {
      system: { name: 'intaqalab-agents-ecosystem', version: '1.0.0', lastUpdated: getTodayISO() },
      core: {},
      skills: {},
    };
  }
  try {
    return JSON.parse(fs.readFileSync(VERSIONS_FILE, 'utf-8'));
  } catch (err) {
    console.error(`❌ Error parseando ${VERSIONS_FILE}:`, err.message);
    process.exit(1);
  }
}

function writeVersionsManifest(manifest) {
  fs.writeFileSync(VERSIONS_FILE, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
}

function getSkillList() {
  if (!fs.existsSync(AGENTS_SKILLS_DIR)) return [];
  return fs
    .readdirSync(AGENTS_SKILLS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

function readAgentsMdMetadata() {
  if (!fs.existsSync(AGENTS_MD_FILE)) return { version: '1.0.0', lastUpdated: getTodayISO() };
  const content = fs.readFileSync(AGENTS_MD_FILE, 'utf-8');
  const match = content.match(AGENTS_VERSION_TAG_REGEX);
  if (match) {
    return { version: match[1], lastUpdated: match[2], hasTag: true };
  }
  return { version: '1.0.0', lastUpdated: getTodayISO(), hasTag: false };
}

function updateAgentsMdMetadata(newVersion, date = getTodayISO()) {
  let content = fs.readFileSync(AGENTS_MD_FILE, 'utf-8');
  const tag = `<!-- AGENTS_VERSION: ${newVersion} | UPDATED: ${date} -->`;
  if (AGENTS_VERSION_TAG_REGEX.test(content)) {
    content = content.replace(AGENTS_VERSION_TAG_REGEX, tag);
  } else {
    // Insert after nx configuration block or at the very top
    const nxEndMatch = content.indexOf('<!-- nx configuration end-->');
    if (nxEndMatch !== -1) {
      const insertIdx = nxEndMatch + '<!-- nx configuration end-->'.length;
      content = content.slice(0, insertIdx) + '\n\n' + tag + content.slice(insertIdx);
    } else {
      content = tag + '\n\n' + content;
    }
  }
  fs.writeFileSync(AGENTS_MD_FILE, content, 'utf-8');
}

function appendChangelog(target, version, message) {
  if (!fs.existsSync(CHANGELOG_FILE)) {
    fs.writeFileSync(
      CHANGELOG_FILE,
      `# Changelog\n\nTodos los cambios notables en \`AGENTS.md\` y en los skills de INTAQALAB están documentados en este fichero.\nEl formato sigue [Keep a Changelog](https://keepachangelog.com/) y [Semantic Versioning](https://semver.org/).\n\n`,
      'utf-8'
    );
  }
  const date = getTodayISO();
  const entry = `\n## [${target} - ${version}] - ${date}\n\n- ${message}\n`;
  const existing = fs.readFileSync(CHANGELOG_FILE, 'utf-8');
  fs.writeFileSync(CHANGELOG_FILE, existing + entry, 'utf-8');
}

// ----------------------------------------------------
// COMMANDS
// ----------------------------------------------------

export function initCommand() {
  console.log('🚀 Inicializando sistema de versionado de agentes y skills...\n');

  if (!fs.existsSync(AGENTS_DIR)) fs.mkdirSync(AGENTS_DIR, { recursive: true });

  const manifest = readVersionsManifest();
  const today = getTodayISO();

  // 1. Core AGENTS.md
  const agentsMeta = readAgentsMdMetadata();
  const initialAgentsVersion = agentsMeta.version || '1.0.0';
  updateAgentsMdMetadata(initialAgentsVersion, today);
  const agentsChecksum = computeFileHash(AGENTS_MD_FILE);

  manifest.core['AGENTS.md'] = {
    version: initialAgentsVersion,
    lastUpdated: today,
    checksum: agentsChecksum,
    description: 'System configuration, AI rules, and architecture standards',
  };

  // 2. Skills
  const skills = getSkillList();
  for (const skillName of skills) {
    const skillDir = path.join(AGENTS_SKILLS_DIR, skillName);
    const skillFile = path.join(skillDir, 'SKILL.md');
    if (!fs.existsSync(skillFile)) continue;

    const raw = fs.readFileSync(skillFile, 'utf-8');
    const { frontmatter, body } = parseFrontmatter(raw);
    const fm = frontmatter || {};

    fm.name = fm.name || skillName;
    fm.version = fm.version || '1.0.0';
    fm['last-updated'] = fm['last-updated'] || today;
    if (!fm.description) fm.description = `${skillName} specialist for INTAQALAB`;

    const updatedContent = serializeFrontmatter(fm, body);
    fs.writeFileSync(skillFile, updatedContent, 'utf-8');

    const dirChecksum = computeDirHash(skillDir);
    manifest.skills[skillName] = {
      version: fm.version,
      lastUpdated: fm['last-updated'],
      checksum: dirChecksum,
      path: `.agents/skills/${skillName}/SKILL.md`,
      description: fm.description,
    };
  }

  writeVersionsManifest(manifest);

  if (!fs.existsSync(CHANGELOG_FILE)) {
    fs.writeFileSync(
      CHANGELOG_FILE,
      `# Changelog\n\nTodos los cambios notables en \`AGENTS.md\` y en los skills de INTAQALAB están documentados en este fichero.\nEl formato sigue [Keep a Changelog](https://keepachangelog.com/) y [Semantic Versioning](https://semver.org/).\n\n## [1.0.0] - ${today}\n### Versión inicial consolidada\n- Versión base 1.0.0 para \`AGENTS.md\` y los 24 skills locales del repositorio.\n- Sincronización canónica entre \`.agents/skills/\` y \`.claude/skills/\`.\n`,
      'utf-8'
    );
  }

  syncCommand();
  console.log(`✅ Inicialización completada. Manifiesto guardado en .agents/versions.json`);
}

export function syncCommand() {
  console.log('🔄 Sincronizando .agents/skills/ -> .claude/skills/ ...');
  if (!fs.existsSync(AGENTS_SKILLS_DIR)) {
    console.error('❌ Directorio .agents/skills/ no existe.');
    process.exit(1);
  }
  if (!fs.existsSync(CLAUDE_SKILLS_DIR)) {
    fs.mkdirSync(CLAUDE_SKILLS_DIR, { recursive: true });
  }

  // Recursive copy
  fs.cpSync(AGENTS_SKILLS_DIR, CLAUDE_SKILLS_DIR, {
    recursive: true,
    force: true,
    filter: (source) => !source.includes('.DS_Store'),
  });

  // Clean obsolete files in .claude/skills that don't exist in .agents/skills
  function cleanObsolete(sourceDir, targetDir) {
    const entries = fs.readdirSync(targetDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === '.DS_Store') continue;
      const targetPath = path.join(targetDir, entry.name);
      const sourcePath = path.join(sourceDir, entry.name);
      if (!fs.existsSync(sourcePath)) {
        if (entry.isDirectory()) {
          fs.rmSync(targetPath, { recursive: true, force: true });
        } else {
          fs.rmSync(targetPath, { force: true });
        }
      } else if (entry.isDirectory()) {
        cleanObsolete(sourcePath, targetPath);
      }
    }
  }

  cleanObsolete(AGENTS_SKILLS_DIR, CLAUDE_SKILLS_DIR);
  console.log('✅ Sincronización completada con éxito.');
}

export function statusCommand() {
  const manifest = readVersionsManifest();
  const skills = getSkillList();

  console.log('\n📊 ESTADO DEL SISTEMA DE AGENTES Y SKILLS\n' + '='.repeat(68));

  // AGENTS.md
  const agentsMeta = readAgentsMdMetadata();
  const agentsChecksum = computeFileHash(AGENTS_MD_FILE);
  const manifestAgents = manifest.core?.['AGENTS.md'] || {};
  let agentsStatus = '✅ SYNCED';
  if (agentsMeta.version !== manifestAgents.version) {
    agentsStatus = `⚠️ DESYNC (${agentsMeta.version} vs ${manifestAgents.version})`;
  } else if (agentsChecksum !== manifestAgents.checksum) {
    agentsStatus = '📝 MODIFIED (sin bump)';
  }

  console.log(`Core File   : AGENTS.md`);
  console.log(`Versión     : v${agentsMeta.version}`);
  console.log(`Fecha       : ${agentsMeta.lastUpdated}`);
  console.log(`Estado      : ${agentsStatus}`);
  console.log('-'.repeat(68));

  console.log(
    `${'Skill'.padEnd(28)} | ${'Versión'.padEnd(8)} | ${'Fecha'.padEnd(10)} | ${'Estado'}`
  );
  console.log('-'.repeat(68));

  let modifiedCount = 0;
  let desyncCount = 0;

  for (const skillName of skills) {
    const skillDir = path.join(AGENTS_SKILLS_DIR, skillName);
    const skillFile = path.join(skillDir, 'SKILL.md');
    if (!fs.existsSync(skillFile)) {
      console.log(`${skillName.padEnd(28)} | MISSING SKILL.MD`);
      continue;
    }

    const { frontmatter } = parseFrontmatter(fs.readFileSync(skillFile, 'utf-8'));
    const manifestSkill = manifest.skills?.[skillName] || {};
    const currentChecksum = computeDirHash(skillDir);

    const version = frontmatter?.version || 'N/A';
    const lastUpdated = frontmatter?.['last-updated'] || 'N/A';

    let status = '✅ OK';
    if (!frontmatter?.version) {
      status = '❌ SIN VERSIÓN';
      desyncCount++;
    } else if (frontmatter.version !== manifestSkill.version) {
      status = `⚠️ DESYNC (${version} vs ${manifestSkill.version})`;
      desyncCount++;
    } else if (currentChecksum !== manifestSkill.checksum) {
      status = '📝 MODIFIED';
      modifiedCount++;
    }

    console.log(
      `${skillName.padEnd(28)} | ${version.padEnd(8)} | ${lastUpdated.padEnd(10)} | ${status}`
    );
  }

  console.log('='.repeat(68));
  console.log(`Total Skills: ${skills.length} | Modificados: ${modifiedCount} | Desincronizados: ${desyncCount}\n`);
}

export function checkCommand(options = {}) {
  const strictChecksum = options.strictChecksum !== false;
  const manifest = readVersionsManifest();
  const skills = getSkillList();
  const errors = [];
  const warnings = [];
  const failOnChecksum = Boolean(options.failOnChecksum);

  // Check AGENTS.md
  const agentsMeta = readAgentsMdMetadata();
  const manifestAgents = manifest.core?.['AGENTS.md'];

  if (!agentsMeta.hasTag) {
    errors.push(`AGENTS.md no tiene etiqueta <!-- AGENTS_VERSION: X.Y.Z | UPDATED: YYYY-MM-DD -->`);
  }
  if (!manifestAgents) {
    errors.push(`AGENTS.md no está registrado en ${VERSIONS_FILE}`);
  } else if (agentsMeta.version !== manifestAgents.version) {
    errors.push(`Versión en AGENTS.md (${agentsMeta.version}) difiere del manifiesto (${manifestAgents.version})`);
  } else if (strictChecksum && computeFileHash(AGENTS_MD_FILE) !== manifestAgents.checksum) {
    const msg = `AGENTS.md ha sido modificado sin incrementar su versión (checksum mismatch).`;
    if (failOnChecksum) errors.push(msg);
    else warnings.push(msg);
  }

  // Check skills
  for (const skillName of skills) {
    const skillDir = path.join(AGENTS_SKILLS_DIR, skillName);
    const skillFile = path.join(skillDir, 'SKILL.md');

    if (!fs.existsSync(skillFile)) {
      errors.push(`Skill "${skillName}" no tiene archivo SKILL.md`);
      continue;
    }

    const { frontmatter } = parseFrontmatter(fs.readFileSync(skillFile, 'utf-8'));
    if (!frontmatter) {
      errors.push(`Skill "${skillName}" no tiene frontmatter YAML válido`);
      continue;
    }

    if (!frontmatter.name) {
      errors.push(`Skill "${skillName}" falta campo 'name' en frontmatter`);
    }
    if (!frontmatter.version) {
      errors.push(`Skill "${skillName}" falta campo 'version' en frontmatter`);
    } else if (!SEMVER_REGEX.test(frontmatter.version)) {
      errors.push(`Skill "${skillName}" versión "${frontmatter.version}" no es SemVer válida`);
    }
    if (!frontmatter.description) {
      errors.push(`Skill "${skillName}" falta campo 'description' en frontmatter`);
    }

    const manifestSkill = manifest.skills?.[skillName];
    if (!manifestSkill) {
      errors.push(`Skill "${skillName}" no está registrado en ${VERSIONS_FILE}`);
    } else if (frontmatter.version !== manifestSkill.version) {
      errors.push(
        `Skill "${skillName}" versión en archivo (${frontmatter.version}) difiere del manifiesto (${manifestSkill.version})`
      );
    } else if (strictChecksum && computeDirHash(skillDir) !== manifestSkill.checksum) {
      const msg = `Skill "${skillName}" tiene cambios locales no versionados (checksum mismatch).`;
      if (failOnChecksum) errors.push(msg);
      else warnings.push(msg);
    }
  }

  if (warnings.length > 0) {
    console.warn('\n⚠️  ADVERTENCIAS:');
    for (const w of warnings) console.warn(`  - ${w}`);
  }

  if (errors.length > 0) {
    console.error('\n❌ ERRORES DE VALIDACIÓN:');
    for (const e of errors) console.error(`  - ${e}`);
    console.error('\nEjecuta "npm run agents:bump" o "npm run agents:init" para resolver.');
    process.exit(1);
  }

  console.log('\n✅ Validación superada: Todos los ficheros AGENTS.md y skills cumplen con el estándar SemVer.');
}

export function bumpCommand(target, bumpType = 'patch', message = '') {
  if (!target) {
    console.error('❌ Debes especificar un target: <skill-name> | agents | all');
    process.exit(1);
  }

  const validBumpTypes = ['patch', 'minor', 'major'];
  if (!validBumpTypes.includes(bumpType)) {
    console.error(`❌ Tipo de bump no válido: "${bumpType}". Usa: patch | minor | major`);
    process.exit(1);
  }

  const manifest = readVersionsManifest();
  const today = getTodayISO();

  if (target === 'agents') {
    const currentMeta = readAgentsMdMetadata();
    const newVersion = bumpSemVer(currentMeta.version, bumpType);
    updateAgentsMdMetadata(newVersion, today);
    const newHash = computeFileHash(AGENTS_MD_FILE);

    manifest.core['AGENTS.md'] = {
      version: newVersion,
      lastUpdated: today,
      checksum: newHash,
      description: manifest.core?.['AGENTS.md']?.description || 'System configuration, AI rules, and architecture standards',
    };

    writeVersionsManifest(manifest);
    if (message) appendChangelog('AGENTS.md', newVersion, message);
    syncCommand();

    console.log(`\n🎉 AGENTS.md actualizado a v${newVersion} (${bumpType})`);
    return;
  }

  if (target === 'all') {
    const skills = getSkillList();
    for (const skillName of skills) {
      bumpCommand(skillName, bumpType, message);
    }
    bumpCommand('agents', bumpType, message);
    return;
  }

  // Single skill bump
  const skillDir = path.join(AGENTS_SKILLS_DIR, target);
  const skillFile = path.join(skillDir, 'SKILL.md');

  if (!fs.existsSync(skillFile)) {
    console.error(`❌ Skill "${target}" no encontrado en ${AGENTS_SKILLS_DIR}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(skillFile, 'utf-8');
  const { frontmatter, body } = parseFrontmatter(raw);
  const fm = frontmatter || {};

  const currentVersion = fm.version || manifest.skills?.[target]?.version || '1.0.0';
  const newVersion = bumpSemVer(currentVersion, bumpType);

  fm.version = newVersion;
  fm['last-updated'] = today;
  fm.name = fm.name || target;
  if (!fm.description) fm.description = `${target} specialist for INTAQALAB`;

  fs.writeFileSync(skillFile, serializeFrontmatter(fm, body), 'utf-8');
  const newChecksum = computeDirHash(skillDir);

  manifest.skills[target] = {
    version: newVersion,
    lastUpdated: today,
    checksum: newChecksum,
    path: `.agents/skills/${target}/SKILL.md`,
    description: fm.description,
  };

  writeVersionsManifest(manifest);
  if (message) appendChangelog(target, newVersion, message);
  syncCommand();

  console.log(`\n🎉 Skill "${target}" actualizado a v${newVersion} (${bumpType})`);
}

// ----------------------------------------------------
// CLI DISPATCHER
// ----------------------------------------------------

const args = process.argv.slice(2);
const command = args[0] || 'status';

function parseOption(flag) {
  const idx = args.indexOf(flag);
  if (idx !== -1 && args[idx + 1] && !args[idx + 1].startsWith('-')) {
    return args[idx + 1];
  }
  return null;
}

switch (command) {
  case 'init':
    initCommand();
    break;
  case 'sync':
    syncCommand();
    break;
  case 'status':
    statusCommand();
    break;
  case 'check':
  case 'audit':
  case 'verify':
    checkCommand({
      strictChecksum: !args.includes('--no-checksum'),
      failOnChecksum: args.includes('--strict'),
    });
    break;
  case 'bump': {
    const target = args[1];
    const bumpType = args[2] && !args[2].startsWith('-') ? args[2] : 'patch';
    const msg = parseOption('--msg') || parseOption('-m') || `Update ${target}`;
    bumpCommand(target, bumpType, msg);
    break;
  }
  default:
    console.log(`
Uso: node scripts/agents-version.mjs <comando> [opciones]

Comandos:
  status                   Muestra el estado de versiones y sincronización
  check [--no-checksum]    Verifica la validez SemVer, frontmatter y correspondencia con manifest
  bump <target> [type]     Incrementa versión (type: patch|minor|major, default: patch)
                           --msg "descripción del cambio" para añadir al CHANGELOG
                           target: <nombre-skill> | agents | all
  sync                     Sincroniza .agents/skills/ hacia .claude/skills/
  init                     Inicializa versiones en frontmatters, genera manifest y CHANGELOG
    `);
    break;
}
