Para que cualquier usuario de la máquina virtual pueda instalar y alternar versiones de Node.js sin privilegios de administrador en el futuro, es necesario configurar **NVM for Windows** en una ruta de usuario (`%LOCALAPPDATA%`) y habilitar el permiso de enlaces simbólicos mediante el Modo Desarrollador de Windows 11. ⚙️

Sigue estos pasos detallados mientras dispongas de los permisos de administrador en la sesión actual.

---

### Paso 1: Habilitar la creación de Symlinks sin elevación UAC 🔓

Por defecto, Windows 11 bloquea la creación de enlaces simbólicos (`mklink`) a usuarios estándar, lo que provoca el error `Access is denied` al ejecutar `nvm use`.

1. Abre **PowerShell como Administrador** (clic derecho en el botón de inicio > _Terminal (Administrador)_ o _PowerShell (Administrador)_).
2. Ejecuta el comando para activar el Modo Desarrollador a nivel de sistema:

```powershell
reg add "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock" /t REG_DWORD /f /v "AllowDevelopmentWithoutDevLicense" /d 1

```

3. _Verificación:_ El comando debe devolver `La operación se completó correctamente` o `The operation completed successfully`.

---

### Paso 2: Descargar e instalar NVM for Windows en rutas de usuario 📂

Para evitar que los archivos y las versiones de Node.js se guarden en `C:\Program Files` (donde un usuario normal no puede escribir), se deben definir rutas bajo el perfil del usuario local.

1. Descarga el instalador oficial de `nvm-setup.exe` desde su repositorio o usando PowerShell:

```powershell
Invoke-WebRequest -Uri "https://github.com/coreybutler/nvm-windows/releases/latest/download/nvm-setup.exe" -OutFile "$env:TEMP\nvm-setup.exe"

```

2. Ejecuta el asistente de instalación:

```powershell
Start-Process "$env:TEMP\nvm-setup.exe"

```

3. Durante el asistente de instalación, configura las rutas exactas:

- **Destination Location (dónde se instala NVM):**
  Cambia la ruta por defecto a:
  `C:\Users\<TU_USUARIO>\AppData\Local\nvm` (o escribe directamente la ruta de la carpeta de usuario).
- **Node.js Symlink (dónde se crea el enlace simbólico):**
  Cambia la ruta por defecto a:
  `C:\Users\<TU_USUARIO>\AppData\Local\nodejs`

4. Finaliza el instalador.

---

### Paso 3: Ajustar las variables de entorno de Usuario 🌐

Para garantizar que el sistema no requiera permisos de máquina (`SYSTEM`) al cambiar de versión, verifica que las variables de entorno apunten a nivel de **Usuario** (`User Environment Variables`):

1. En la misma ventana de PowerShell, ejecuta:

```powershell
[Environment]::SetEnvironmentVariable("NVM_HOME", "$env:LOCALAPPDATA\nvm", "User")
[Environment]::SetEnvironmentVariable("NVM_SYMLINK", "$env:LOCALAPPDATA\nodejs", "User")

```

2. Asegúrate de que `$env:LOCALAPPDATA\nvm` y `$env:LOCALAPPDATA\nodejs` estén en el `Path` del usuario:

```powershell
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$env:LOCALAPPDATA\nvm*") {
    [Environment]::SetEnvironmentVariable("Path", "$userPath;$env:LOCALAPPDATA\nvm;$env:LOCALAPPDATA\nodejs", "User")
}

```

3. _Verificación:_ Cierra y vuelve a abrir PowerShell. Ejecuta `nvm root`. La salida debe mostrar:

```text
Current Root: C:\Users\<TU_USUARIO>\AppData\Local\nvm

```

---

### Paso 4: Prueba de funcionamiento sin privilegios de Administrador 🧪

Comprueba que la configuración permite gestionar versiones de Node.js como un usuario normal.

1. Abre una ventana normal de **PowerShell o CMD (SIN ejecutar como Administrador)**.
2. Instala la versión requerida de Node.js (por ejemplo, Node.js 22 LTS):

```powershell
nvm install 22

```

3. Activa la versión instalada:

```powershell
nvm use 22

```

4. _Verificación final:_ Ejecuta `node -v` y `npm -v`. El sistema debe responder con las versiones instaladas (`v22.x.x`) sin haber solicitado ninguna confirmación de UAC ni haber arrojado errores de permisos denegados. ✨
