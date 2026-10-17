#!/usr/bin/env node
/**
 * Reinicia a aplicação: para os processos atuais e sobe tudo de novo,
 * reabrindo o navegador automaticamente.
 *
 * Uso:  npm run restart   (ou node scripts/restart.js)
 */
const { spawnSync } = require('node:child_process')
const path = require('node:path')

console.log('')
console.log('🔄 Reiniciando a Biblioteca de AlexandrIA...')
console.log('')

const stop = spawnSync(process.execPath, [path.join(__dirname, 'stop.js')], {
  stdio: 'inherit',
})

if (stop.status !== 0) {
  console.error('❌ Falha ao parar a aplicação.')
  process.exit(stop.status ?? 1)
}

// Dá um instante para as portas liberarem
setTimeout(() => {
  const start = spawnSync(process.execPath, [path.join(__dirname, 'start.js')], {
    stdio: 'inherit',
  })
  process.exit(start.status ?? 0)
}, 1500)
