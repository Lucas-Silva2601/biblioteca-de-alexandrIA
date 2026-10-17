#!/usr/bin/env node
/**
 * Sobe a aplicação (Next.js com API integrada), aguarda ficar pronta
 * e abre o navegador automaticamente.
 *
 * Uso:  npm run dev   (ou node scripts/start.js)
 *
 * O PID é gravado em .pids/app.pid para que `npm run stop` consiga
 * encerrar o processo com segurança.
 */
const { spawn, spawnSync } = require('node:child_process')
const fs = require('node:fs')
const http = require('node:http')
const net = require('node:net')
const path = require('node:path')

const ROOT = path.resolve(__dirname, '..')
const PID_DIR = path.join(ROOT, '.pids')
const APP_DIR = ROOT
const APP_PORT = process.env.PORT || '3000'
const APP_URL = process.env.APP_URL || `http://localhost:${APP_PORT}`
const READY_TIMEOUT_MS = Number(process.env.READY_TIMEOUT_MS || 120000)
const OPEN_BROWSER = process.env.OPEN_BROWSER !== 'false'

const IS_WIN = process.platform === 'win32'
const PID_FILE = path.join(PID_DIR, 'app.pid')

let appChild = null
let shuttingDown = false

/* ---------------------------------------------------------------- helpers */

function log(message) {
  console.log(`[app] ${message}`)
}

function readPid(pidFile) {
  try {
    const pid = Number(fs.readFileSync(pidFile, 'utf8').trim())
    return Number.isInteger(pid) && pid > 0 ? pid : null
  } catch {
    return null
  }
}

function isAlive(pid) {
  if (!pid) return false
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

function killTree(pid) {
  if (IS_WIN) {
    spawnSync('taskkill', ['/pid', String(pid), '/T', '/F'], { stdio: 'ignore' })
    return
  }
  try {
    process.kill(-pid, 'SIGTERM')
  } catch {
    /* já morreu */
  }
  try {
    process.kill(pid, 'SIGTERM')
  } catch {
    /* já morreu */
  }
}

function pipeOutput(name, stream) {
  stream.setEncoding('utf8')
  let buffer = ''
  stream.on('data', (chunk) => {
    buffer += chunk
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (line.trim()) console.log(`[${name}] ${line}`)
    }
  })
  stream.on('end', () => {
    if (buffer.trim()) console.log(`[${name}] ${buffer}`)
  })
}

/** Verifica se uma porta está livre antes de subir o app. */
function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.once('error', () => resolve(false))
    server.once('listening', () => server.close(() => resolve(true)))
    server.listen(Number(port))
  })
}

/**
 * Resolve como invocar o npm.
 * Quando rodamos via `npm run`, o npm_execpath aponta para o npm-cli.js,
 * o que permite chamar o Node diretamente (sem shell, sem warnings).
 */
function resolveNpm(script) {
  if (process.env.npm_execpath) {
    return { command: process.execPath, args: [process.env.npm_execpath, 'run', script] }
  }
  if (IS_WIN) {
    return { command: `npm run ${script}`, args: [], shell: true }
  }
  return { command: 'npm', args: ['run', script] }
}

function waitForUrl(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  return new Promise((resolve) => {
    const attempt = () => {
      const request = http.get(url, (res) => {
        res.resume()
        resolve(Boolean(res.statusCode && res.statusCode < 500))
      })
      request.on('error', () => {
        if (Date.now() > deadline) return resolve(false)
        setTimeout(attempt, 1000)
      })
      request.setTimeout(3000, () => request.destroy())
    }
    attempt()
  })
}

function openBrowser(url) {
  if (!OPEN_BROWSER) {
    log(`Abertura automática desabilitada (OPEN_BROWSER=false). Acesse: ${url}`)
    return
  }

  let command
  let args
  if (IS_WIN) {
    command = 'cmd'
    args = ['/c', 'start', '', url]
  } else if (process.platform === 'darwin') {
    command = 'open'
    args = [url]
  } else {
    command = 'xdg-open'
    args = [url]
  }
  const child = spawn(command, args, {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  })
  child.on('error', () =>
    log(`Não foi possível abrir o navegador. Acesse manualmente: ${url}`)
  )
  child.unref()
}

function shutdown(code = 0) {
  if (shuttingDown) return
  shuttingDown = true

  if (appChild && isAlive(appChild.pid)) {
    log('encerrando...')
    killTree(appChild.pid)
  }
  try {
    fs.unlinkSync(PID_FILE)
  } catch {
    /* já removido */
  }
  process.exit(code)
}

/* ------------------------------------------------------------------- main */

async function main() {
  fs.mkdirSync(PID_DIR, { recursive: true })

  // Já está rodando? Então só abre o navegador.
  if (isAlive(readPid(PID_FILE))) {
    log('A aplicação já está rodando. Abrindo o navegador...')
    openBrowser(APP_URL)
    return
  }

  process.on('SIGINT', () => shutdown(0))
  process.on('SIGTERM', () => shutdown(0))

  // Verifica se a porta está livre
  if (!(await isPortFree(APP_PORT))) {
    console.error('')
    console.error(`❌ Porta em uso por outro processo: ${APP_PORT}`)
    console.error('   Feche esse processo ou use outra porta:')
    console.error('   PORT=3001 npm run dev')
    process.exit(1)
  }

  console.log('')
  console.log('📚 Biblioteca de AlexandrIA')
  console.log('===========================')
  console.log('')

  const npmDev = resolveNpm('dev:app')
  appChild = spawn(npmDev.command, npmDev.args, {
    cwd: APP_DIR,
    env: { ...process.env, PORT: APP_PORT },
    detached: !IS_WIN,
    windowsHide: true,
    shell: npmDev.shell || false,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  pipeOutput('app', appChild.stdout)
  pipeOutput('app', appChild.stderr)

  fs.writeFileSync(PID_FILE, String(appChild.pid))
  log(`iniciado (PID ${appChild.pid})`)

  appChild.on('exit', (code, signal) => {
    if (shuttingDown) return

    // Se o PID file já foi removido (ou trocado), a parada veio de `npm run stop`.
    const intentional = readPid(PID_FILE) !== appChild.pid
    if (intentional) {
      console.log('')
      log('Aplicação parada via npm run stop.')
      shutdown(0)
      return
    }

    console.error('')
    console.error(`❌ A aplicação parou inesperadamente (${signal || `código ${code}`}).`)
    console.error('   Verifique os logs acima e as dependências: npm run setup')
    shutdown(1)
  })

  console.log('')
  log(`Aguardando a aplicação em ${APP_URL}...`)

  const ready = await waitForUrl(APP_URL, READY_TIMEOUT_MS)
  if (ready) {
    console.log('')
    log('✅ Aplicação pronta!')
    log(`App: ${APP_URL}`)
    log(`API: ${APP_URL}/api`)
    log('Para parar: npm run stop  |  Para reiniciar: npm run restart')
    console.log('')
    openBrowser(APP_URL)
  } else {
    console.error('')
    console.error(`❌ Timeout: a aplicação não respondeu em ${APP_URL} (${READY_TIMEOUT_MS / 1000}s).`)
    console.error('   Verifique os logs acima. Para parar o processo: npm run stop')
  }

  // Mantém o processo vivo enquanto o app roda
  await new Promise(() => {})
}

main().catch((error) => {
  console.error('❌ Erro ao iniciar a aplicação:', error)
  shutdown(1)
})
