# Ambrosia Desktop App

Powered by Electron

---

### 🏗️ Arquitectura General
---
##### La aplicación Electron funciona como un paquete all-in-one que gestiona tres servicios:
---
1. Phoenixd - Daemon de Bitcoin/Lightning
2. Backend - Servidor Kotlin/Ktor (JAR)
3. Next.js - Frontend web (servidor embebido)

---

## Servicios y Utilidades
---


```bash
Servicios
├── ServiceManager
├── PhoenixdService
├── BackendService
└── NextJsService

Utilidades:
├── ConfigurationBootstrap (Generación de configs)
├── PortAllocator (Asignación de puertos)
├── HealthCheck (Verificación de servicios)
└── ResourcePaths (Rutas multiplataforma)
```

--

### `ServiceManager`
---
#### Responsabilidades:
- Orquestación completa del ciclo de vida:
- startAll() → Inicia los 3 servicios en secuencia
- stopAll() → Detiene todo limpiamente
- restartService(name) → Reinicia un servicio específico

---

### `ServiceManager`
---
Flujo detallado
```javascript
async startAll() {
    // 1. ASIGNACIÓN DE PUERTOS
    this.ports = await allocatePorts();
    // Dev:  phoenixd:9740, backend:9154, nextjs:3000
    // Prod: phoenixd:9740-9800, backend:9154-9200, nextjs:3000-3100

    // 2. GENERACIÓN/LECTURA DE CONFIGURACIONES
    this.configs = await ensureConfigurations(this.ports);
    // Crea: ~/.Ambrosia-POS/ambrosia.conf
    //       ~/.phoenix/phoenix.conf

    // 3. DETECCIÓN DE MODO
    if (this.devMode) {
        // MODO DESARROLLO: Solo Next.js
        // Asume que phoenixd y backend corren externamente
        await this.nextjsService.start(this.ports.nextjs);
        return url;
    }

    // 4. MODO PRODUCCIÓN: Secuencia completa

    // Paso 1: Phoenixd (base de la pirámide)
    await this.phoenixdService.start(
        this.ports.phoenixd,
        phoenixConfig
    );
    this.emit('service:started', { service: 'phoenixd', port: ... });

    // Paso 2: Backend (depende de phoenixd)
    await this.backendService.start(
        this.ports.backend,
        {
            phoenixdPort: this.ports.phoenixd,
            phoenixPassword: phoenixConfig['http-password'],
            webhookSecret: phoenixConfig['webhook-secret']
        }
    );
    this.emit('service:started', { service: 'backend', port: ... });

    // Paso 3: Next.js (depende de backend API)
    await this.nextjsService.start(this.ports.nextjs);
    this.emit('service:started', { service: 'nextjs', port: ... });

    this.emit('all:started');
    return url; // <http://localhost:3000> (o puerto dinámico)
}

```

---

### `ServiceManager`
---
Manejo de Errores

```javascript
try {
	// Intenta iniciar todo
} catch (error) {
	this.emit('service:error', { error });
	await this.stopAll(); // ⚠️ ROLLBACK completo
	throw error; // Propaga al main.js para mostrar diálogo
}
```

---

### `ServiceManager`
---
Sistema de Eventos (EventEmitter) ↓

```jsx
// El ServiceManager emite eventos que main.js escucha:
serviceManager.on('service:started', ({ service, port }) => {
    console.log(`${service} started on port ${port}`);
});

serviceManager.on('service:error', ({ service, error }) => {
    // Mostrar error al usuario
});

serviceManager.on('all:started', () => {
    // Todos los servicios están listos
});
```

--

### `PhoenixdService` Lightning Node
---
Anatomía del Servicio

```javascript
class PhoenixdService {
	constructor() {
		this.process = null;      // Proceso hijo de phoenixd
		this.status = 'stopped';  // Estado: stopped | starting | running | error
		this.port = null;         // Puerto asignado
		this.logStream = null;    // Stream de logs
	}
}
```

---

### `PhoenixdService` Lightning Node
---
Proceso de Inicio

```jsx
async start(port, config) {
	// 1. VALIDACIÓN
	if (this.process) {
	    throw new Error('Phoenixd already running');
    }
    // 2. PREPARACIÓN
    const phoenixdPath = getPhoenixdPath();
    // Dev:  'phoenixd' (del PATH)
    // Prod: '/path/to/resources/phoenixd/macos-arm64/phoenixd'

    const dataDir = getPhoenixDataDirectory();
    // → ~/.phoenix/

    const logFile = path.join(logsDir, `phoenixd-${date}.log`);
    this.logStream = fs.createWriteStream(logFile, { flags: 'a' });

    // 3. ARGUMENTOS CLI
    const args = [
        '--agree-to-terms-of-service',
        `--http-bind-ip=127.0.0.1`,
        `--http-bind-port=${port}`,
        `--http-password=${config['http-password']}`,
        `--http-password-limited-access=${config['http-password-limited-access']}`,
        `--webhook=${config['webhook']}`,
        // webhook = <http://127.0.0.1:9154/webhook/phoenixd>
        `--webhook-secret=${config['webhook-secret']}`,
        `--auto-liquidity=off`,
    ];

    // 4. SPAWN PROCESO
    this.process = spawn(phoenixdPath, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
    });

    // 5. CAPTURA DE LOGS
    this.process.stdout.on('data', (data) => {
        console.log(`[Phoenixd] ${data.toString().trim()}`);
        this.logStream.write(`[${timestamp}] ${data}`);
    });

    this.process.stderr.on('data', (data) => {
        console.error(`[Phoenixd ERROR] ${data.toString().trim()}`);
        this.logStream.write(`[${timestamp}] ERROR: ${data}`);
    });

    // 6. MANEJO DE EVENTOS
    this.process.on('error', (error) => {
        this.status = 'error';
        this.cleanup();
    });

    this.process.on('close', (code) => {
        this.status = 'stopped';
        this.cleanup();
    });

    // 7. HEALTH CHECK ⏳
    await checkPhoenixd(port);
    // Hace peticiones HTTP a <http://localhost:9740/getinfo>
    // Acepta 401 (significa que está corriendo, solo necesita auth)
    // Espera hasta 60 segundos con reintentos cada 1s

    this.status = 'running';
    return { port };
}
```

---

### `PhoenixdService` Lightning Node
---
Proceso de Detención ↓

```jsx
async stop() {
    if (!this.process) return;

    return new Promise((resolve) => {
        const pid = this.process.pid;

        // 1. Intento graceful con SIGTERM
        treeKill(pid, 'SIGTERM', (err) => {
            if (err) {
            // 2. Fallback a SIGKILL si falla
            treeKill(pid, 'SIGKILL', () => {
                this.cleanup();
                resolve();
            });
            } else {
                this.cleanup();
                resolve();
            }
        });

        // 3. Timeout de seguridad (5 segundos)
        setTimeout(() => {
            if (this.process) {
                treeKill(pid, 'SIGKILL', () => {
                    this.cleanup();
                    resolve();
                });
            }
        }, 5000);
    });
}
```

--

### `BackendService` API Server
---
Proceso de Inicio

```jsx
async start(port, config) {
    // 1. OBTENER RUTAS
    const javaPath = getJavaPath();
    // Dev:  'java' (del PATH)
    // Prod: '/path/to/resources/jre/macos-arm64/bin/java'
    const jarPath = getBackendJarPath();
    // Dev:  '../../server/app/build/libs/ambrosia-0.3.0-alpha.jar'
    // Prod: '/path/to/resources/backend/ambrosia.jar'

    // 2. CONSTRUIR COMANDO
    const args = [
        '-jar',
        jarPath,
        `--http-bind-ip=127.0.0.1`,
        `--http-bind-port=${port}`,
        `--phoenixd-url=http://localhost:${config.phoenixdPort}`,
        `--phoenixd-password=${config.phoenixPassword}`,
        `--phoenixd-webhook-secret=${config.webhookSecret}`,
    ];

    // Comando real ejecutado:
    // java -jar ambrosia.jar --http-bind-ip=127.0.0.1 --http-bind-port=9154 ...

    // 3. SPAWN
    this.process = spawn(javaPath, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
    });

    // 4. LOGGING (igual que phoenixd)
    this.process.stdout.on('data', (data) => { ... });
    this.process.stderr.on('data', (data) => { ... });

    // 5. HEALTH CHECK
    await checkBackend(port);
    // Hace peticiones a <http://localhost:9154/api/health>
    // Espera respuesta 200 con { "status": "healthy", "timestamp": "..." }
    // Hasta 60 intentos con 1s de intervalo

    this.status = 'running';
    return { port };
}
```

---

### `BackendService` API Server
---
Diferencia Clave con Phoenixd ↓

BackendService usa el endpoint `/api/health` agregado específicamente para Electron:

```kotlin
// server/app/src/main/kotlin/pos/ambrosia/api/Health.kt
fun Route.healthRoutes() {
	route("/health") {
		get {
			call.respond(
				HttpStatusCode.OK, mapOf(
				"status" to "healthy",
				"timestamp" to System.currentTimeMillis().toString()
				)
			)
		}
	}
}
```
Este endpoint NO requiere autenticación, lo que facilita el health check.

--

### `NextJsService` Frontend
---
Modo Desarrollo vs Producción

```javascript
async start(port) {
    const isDev = isDevelopment();
    let command, args, cwd;
    if (isDev) {
        // DESARROLLO: npm run dev
        command = 'npm';
        args = ['run', 'dev', '--', '-p', port.toString()];
        cwd = '../client';
        // Ejecuta: npm run dev -- -p 3000
    } else {
        // PRODUCCIÓN: node standalone
        command = getNodePath();
        // → '/path/to/resources/node/macos-arm64/bin/node'

        args = [path.join(clientPath, 'server.js')];
        cwd = '/path/to/resources/client';
        // Ejecuta: node server.js

        // server.js es el standalone build de Next.js
        // Generado con: npm run build (output: 'standalone')
    }

    // Verificación de que server.js existe
    if (!fs.existsSync(serverJsPath)) {
     throw new Error(`server.js not found at: ${serverJsPath}`);
    }

    // Spawn con variable de entorno PORT
    const env = { ...process.env, PORT: port.toString() };

    this.process = spawn(command, args, {
        cwd,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
        env,
    });

    // Health Check
    await checkNextJs(port);
    // Hace peticiones a <http://localhost:3000/>
    // Acepta cualquier respuesta 2xx o 3xx

    this.status = 'running';
    return { port, url: `http://localhost:${port}` };
}

```

---

### `NextJsService` Frontend
---
Standalone Build ↓

Next.js genera una carpeta .next/standalone/ que contiene:

```bash
.next/standalone/
├── server.js          ← Servidor Node.js autosuficiente
├── node_modules/      ← Solo dependencias necesarias
└── .next/             ← Build optimizado
```

Ventajas:

- No requiere next CLI
- Solo necesita Node.js runtime
- Mucho más ligero (solo deps necesarias)
- Perfecto para empaquetado

--

## `ConfigurationBootstrap`
---
Flujo de Configuración

```jsx
async ensureConfigurations(ports) {
    // 1. CREAR DIRECTORIOS
    ensureDirectoryExists('~/.Ambrosia-POS');
    ensureDirectoryExists('~/.phoenix');
    ensureDirectoryExists('~/.Ambrosia-POS/logs');

    // 2. LEER CONFIGS EXISTENTES (si existen)
    let ambrosiaConfig = readConfig('~/.Ambrosia-POS/ambrosia.conf');
    let phoenixConfig = readConfig('~/.phoenix/phoenix.conf');

    // 3. GENERAR AMBROSIA CONFIG (si no existe)
    if (!ambrosiaConfig || Object.keys(ambrosiaConfig).length === 0) {
        const secret = generateSecret();
        // → "acid alone bamboo brush clerk cloud crypto delta eagle..."
        // (12 palabras del EFF wordlist) CON BIP39

        const secretHash = hashSecret(secret);
        // → SHA256 del secret

        ambrosiaConfig = {
            'http-bind-ip': '127.0.0.1',
            'http-bind-port': ports.backend.toString(),
            'secret': secret,
            'secret-hash': secretHash,
            'phoenixd-url': `http://localhost:${ports.phoenixd}`,
        };

        writeConfig(ambrosiaConfigPath, ambrosiaConfig);
    }

    // 4. GENERAR PHOENIX CONFIG (si no existe)
    if (!phoenixConfig || Object.keys(phoenixConfig).length === 0) {
        const httpPassword = generateRandomHex(32);
        // → '5f4dcc3b5aa765d61d8327deb882cf99...' (64 caracteres hex)

        const httpPasswordLimited = generateRandomHex(32);
        const webhookSecret = generateRandomHex(32);

        phoenixConfig = {
            'http-password': httpPassword,
            'http-password-limited-access': httpPasswordLimited,
            'webhook-secret': webhookSecret,
            'webhook': `http://127.0.0.1:${ports.backend}/webhook/phoenixd`,
            'auto-liquidity': 'off',
            'max-mining-fee-sat-vb': '5000',
        };

        writeConfig(phoenixConfigPath, phoenixConfig);
    }

    // 5. ACTUALIZAR PUERTOS DINÁMICOS
    // En caso de que los puertos hayan cambiado
    ambrosiaConfig['http-bind-port'] = ports.backend.toString();
    ambrosiaConfig['phoenixd-url'] = `http://localhost:${ports.phoenixd}`;
    phoenixConfig['webhook'] = `http://127.0.0.1:${ports.backend}/webhook/phoenixd`;

    return {
        ambrosia: ambrosiaConfig,
        phoenix: phoenixConfig,
    };
}
```

---

## HealthCheck 
---
Cada servicio tiene su propia función de health check:

```javascript
// Phoenixd
async function checkPhoenixd(port, maxAttempts = 60, intervalMs = 1000) {
    const url = http://localhost:${port}/getinfo;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const response = await new Promise((resolve, reject) => {
            const req = http.get(url, (res) => {
                // ⚠️ IMPORTANTE: Phoenixd requiere auth
                // 401 significa que está corriendo (solo falta auth)
                if (res.statusCode === 401 ||
                    (res.statusCode >= 200 && res.statusCode < 300)) {
                    resolve(true);
                } else {
                    reject(new Error(`Unexpected status: ${res.statusCode}`));
                }
            });

                req.on('error', reject);
                req.setTimeout(5000, () => {
                    req.destroy();
                    reject(new Error('Request timeout'));
                });
            });

            return response;
        } catch (error) {
            if (attempt === maxAttempts) {
                throw new Error(`Timed out waiting for: ${url}`);
            }

            // Log cada 10 intentos
            if (attempt % 10 === 0) {
                console.log(`Still waiting... (${attempt}/${maxAttempts})`);
            }

            await new Promise(resolve => setTimeout(resolve, intervalMs));
        }
    }
}

// Backend
async function checkBackend(port, maxAttempts = 60, intervalMs = 1000) {
    const url = http://localhost:${port}/api/health;
    // Similar a phoenixd pero:
    // - Solo acepta 200-299 (no acepta 401)
    // - Endpoint específico de health
}

// Nextjs
async function checkNextJs(port, maxAttempts = 60, intervalMs = 1000) {
    const url = http://localhost:${port}/;
    // Similar pero:
    // - Acepta 200-399 (incluye redirects)
    // - Endpoint raíz /
}

```

---

## `PortAllocator` Asignación Dinámica 
---
Estrategia de Puertos

```jsx
const DEFAULT_PORTS = {
    phoenixd: 9740,  // Puerto estándar de phoenixd
    backend: 9154,   // Puerto estándar de Ambrosia
    nextjs: 3000,    // Puerto estándar de Next.js
};

async function allocatePorts() {
    if (isDevelopment()) {
        // DESARROLLO: Puertos fijos para facilitar debugging
        return DEFAULT_PORTS;
    }
    // PRODUCCIÓN: Puertos dinámicos para evitar conflictos
    try {
        const [phoenixdPort] = await findFreePort(9740, 9800);
        // Busca puerto libre entre 9740-9800

        const [backendPort] = await findFreePort(9154, 9200);
        const [nextjsPort] = await findFreePort(3000, 3100);

    return {
        phoenixd: phoenixdPort,
        backend: backendPort,
        nextjs: nextjsPort,
    };
    } catch (error) {
        // Fallback a puertos default si falla
        console.log('Falling back to default ports');
        return DEFAULT_PORTS;
    }
}
```

---

## ResourcePaths - Rutas Multiplataforma

```javascript
function getPlatform() {
    const platform = process.platform; // 'darwin', 'win32', 'linux'
    const arch = process.arch;         // 'arm64', 'x64'
    if (platform === 'darwin') {
        return arch === 'arm64' ? 'macos-arm64' : 'macos-x64';
    } else if (platform === 'win32') {
        return 'win-x64';
    } else if (platform === 'linux') {
        return 'linux-x64';
    }

    throw new Error(`Unsupported platform: ${platform}`);
}
```

---

## Flujo Completo

```jsx
┌─────────────────────────────────────────────────┐
│ Electron Main Process (main.js)                 │
│                                                 │
│  1. app.whenReady()                             │
│  2. serviceManager = new ServiceManager()       │
│  3. url = await serviceManager.startAll()       │
│     │                                           │
│     └──> ServiceManager.startAll()              │
│           ├─ allocatePorts()                    │
│           │   └─ Dev: 9740,9154,3000            │
│           │   └─ Prod: findFreePort()           │
│           │                                     │
│           ├─ ensureConfigurations(ports)        │
│           │   ├─ Create ~/.Ambrosia-POS/        │
│           │   ├─ Generate ambrosia.conf         │
│           │   └─ Generate phoenix.conf          │
│           │                                     │
│           ├─ [DEV MODE ONLY]                    │
│           │   └─ nextjsService.start(3000)      │
│           │       └─ npm run dev -- -p 3000     │
│           │                                     │
│           └─ [PRODUCTION MODE]                  │
│               │                                 │
│               ├─ phoenixdService.start(9740)    │
│               │   ├─ spawn phoenixd binary      │
│               │   ├─ checkPhoenixd()            │
│               │   └─ ✓ Running                  │
│               │                                 │
│               ├─ backendService.start(9154)     │
│               │   ├─ spawn java -jar ...        │
│               │   ├─ checkBackend()             │
│               │   │   └─ GET /api/health        │
│               │   └─ ✓ Running                  │
│               │                                 │
│               └─ nextjsService.start(3000)      │
│                   ├─ spawn node server.js       │
│                   ├─ checkNextJs()              │
│                   │   └─ GET /                  │
│                   └─ ✓ Running                  │
│                                                 │
│  4. createWindow(url)                           │
│     └─ BrowserWindow loads http://localhost:3000│
└─────────────────────────────────────────────────┘
```
