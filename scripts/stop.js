#!/usr/bin/env node
/**
 * Encerra o processo iniciado por `npm run dev` / `npm start`.
 *
 * Uso:  npm run stop   (ou node scripts/stop.js)
 */
const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const net = require('node:net')
const path = require('node:path')

const ROOT = path.resolve(__dirname, '..')
const PID_DIR = path.join(ROOT, '.pids')
const IS_WIN = process.platform === 'win32'
const APP_PORT = process.env.PORT || '3000'

const TARGETS = [
  { name: 'app', pidFile: path.join(PID_DIR, 'app.pid') },
]

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

function removePidFile(pidFile) {
  try {
    fs.unlinkSync(pidFile)
  } catch {
    /* já removido */
  }
}

/** Verifica se uma porta ainda tem alguém escutando. */
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.once('error', () => resolve(true))
    server.once('listening', () => server.close(() => resolve(false)))
    server.listen(Number(port))
  })
}

console.log('')
console.log('🛑 Parando a Biblioteca de AlexandrIA...')
console.log('')

let stoppedAny = false
const killed = new Set()

for (const { name, pidFile } of TARGETS) {
  const pid = readPid(pidFile)

  if (!isAlive(pid)) {
    removePidFile(pidFile)
    continue
  }
  if (killed.has(pid)) {
    removePidFile(pidFile)
    continue
  }

  console.log(`[${name}] encerrando (PID ${pid})...`)
  removePidFile(pidFile)
  killTree(pid)
  killed.add(pid)
  stoppedAny = true
}

console.log('')
if (stoppedAny) {
  console.log('✅ Aplicação encerrada com sucesso.')
} else {
  console.log('ℹ️  Nenhum processo da aplicação estava rodando.')
}

// Avisa se a porta continua ocupada após o stop (processo órfão)
;(async () => {
  if (stoppedAny && (await isPortInUse(APP_PORT))) {
    console.log('')
    console.log(`⚠️  Atenção: a porta ${APP_PORT} ainda está em uso.`)
    console.log('   Pode ser um processo órfão. Encerre manualmente, ex. (Windows):')
    console.log(`   netstat -ano | findstr :${APP_PORT}`)
    console.log('   taskkill /PID <PID> /T /F')
  }
  console.log('')
})()
