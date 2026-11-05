Para que todo el equipo configure la máquina virtual con Windows 11 de forma homogénea una vez tengáis los permisos de administrador, seguid esta guía paso a paso con los comandos y verificaciones exactas. 🛠️

---

### 1. Limpieza previa e instalación de NVM for Windows 🧹

Si alguna máquina tiene ya Node.js instalado de forma nativa (mediante `.msi`), debe desinstalarse primero desde **Configuración > Aplicaciones > Aplicaciones instaladas** para evitar colisiones en la variable `PATH`.

1. Abrid **PowerShell** como Administrador.
2. Descargad e instalad **nvm-windows** (podéis usar `winget` directamente):

```powershell
winget install CoreyButler.NVMforWindows --accept-package-agreements --accept-source-agreements

```

3. Cerrad la terminal y abrid una **nueva sesión de PowerShell como Administrador** para recargar el entorno.
4. _Verificación:_ Ejecutad `nvm version`. Debe devolver la versión instalada (ej. `1.1.12` o superior).

---

### 2. Configurar Node.js para la migración de Angular 21 a Angular 22 ⚡

Angular 21 requiere soporte mínimo de Node.js `^18.19.0` o `^20.9.0` (y soporte para `^22.0.0`). Angular 22 eleva la base y hace de **Node.js 22 LTS (Active LTS / Jod)** el entorno estándar de compatibilidad cruzada para ambos frameworks.

1. Instalad Node.js 22 LTS a través de NVM:

```powershell
nvm install 22
nvm use 22

```

2. _Verificación:_

```powershell
node -v
npm -v

```

Debe devolver `v22.x.x` y la versión correspondiente de npm (`10.x.x` o superior).

---

### 3. Instalación de OpenCode 💻

OpenCode se distribuye como binario y herramienta CLI/TUI para terminales Windows.

1. Instalad OpenCode mediante `winget` o mediante su instalador oficial en PowerShell:

```powershell
winget install OpenCode.OpenCode

```

_(Si vuestra directiva corporativa bloquea winget para este paquete, instaladlo vía script oficial en PowerShell:)_

```powershell
iwr -useb https://opencode.ai/install.ps1 | iex

```

2. _Verificación:_ Ejecutad `opencode --version` para comprobar que el comando responde correctamente en el `PATH`.

---

### 4. Configuración de Plugins / Herramientas (Repowise y RTK) 🧩

Tanto **Repowise** (servidor MCP de análisis semántico/contexto de repositorios) como **RTK** (Runtime Toolkit / agent tools de `rtk-ai`) se integran en el ecosistema de agentes mediante configuración MCP o extensiones de OpenCode.

#### A. Repowise

Instalad o configurad el paquete globalmente para que el agente local tenga acceso a los índices del workspace:

```powershell
npm install -g repowise

```

_Verificación:_ Ejecutad `repowise --version` en la terminal.

#### B. RTK (rtk-ai/rtk)

Clonad o instalad el kit de herramientas de `rtk-ai`:

```powershell
# Si se distribuye vía npm/npx:
npm install -g @rtk-ai/rtk

```

_(Si vuestro flujo requiere compilar directamente desde el repositorio oficial de GitHub):_

```powershell
git clone https://github.com/rtk-ai/rtk.git C:\tools\rtk
cd C:\tools\rtk
npm install
npm run build
npm link

```

#### C. Registro en la configuración de OpenCode (`opencode.json` / MCP config)

Para que todos los compañeros tengan las mismas herramientas registradas en OpenCode, añadid las definiciones a vuestro archivo de configuración de agentes (normalmente en `%USERPROFILE%\.opencode\config.json` o en la raíz del monorepo):

```json
{
  "mcpServers": {
    "repowise": {
      "command": "npx",
      "args": ["-y", "repowise", "serve"]
    },
    "rtk": {
      "command": "npx",
      "args": ["-y", "@rtk-ai/rtk", "start"]
    }
  }
}
```

_Verificación final:_ Abrid OpenCode (`opencode`) dentro de un proyecto y comprobad que la lista de herramientas/servidores MCP muestra `repowise` y `rtk` con estado conectado (icono verde). 🚀
