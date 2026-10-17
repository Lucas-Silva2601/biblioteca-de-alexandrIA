#!/usr/bin/env node
/**
 * Setup completo do projeto:
 *   1. Instala as dependências
 *   2. Cria .env a partir do .env.example (se não existir)
 *   3. Inicializa/atualiza o banco SQLite (Prisma db push)
 *
 * Uso:  npm run setup
 */
const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.resolve(__dirname, '..')
const ENV_FILE = path.join(ROOT, '.env')
const ENV_EXAMPLE = path.join(ROOT, '.env.example')

const IS_WIN = process.platform === 'win32'

/** Roda um script npm na raiz e aborta em caso de falha. */
function run(args, label) {
  console.log(`\n> ${label}`)
  let cmd
  let cmdArgs
  let useShell
  if (process.env.npm_execpath) {
    // Invoca o npm-cli.js diretamente via node (sem shell — evita quebrar
    // caminhos com espaços, ex.: "C:\Program Files\...")
    cmd = process.execPath
    cmdArgs = [process.env.npm_execpath, ...args]
    useShell = false
  } else {
    cmd = IS_WIN ? 'npm.cmd' : 'npm'
    cmdArgs = args
    useShell = IS_WIN // npm.cmd precisa de shell no Windows
  }
  const result = spawnSync(cmd, cmdArgs, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: useShell,
  })
  if (result.status !== 0) {
    console.error(`\n❌ Falha ao executar: ${label}`)
    process.exit(result.status ?? 1)
  }
}

console.log('📚 Biblioteca de AlexandrIA — setup')

// 1. Dependências
run(['install'], 'Instalando dependências...')

// 2. Arquivo de ambiente
if (fs.existsSync(ENV_FILE)) {
  console.log('\n✅ .env já existe (mantido)')
} else if (fs.existsSync(ENV_EXAMPLE)) {
  fs.copyFileSync(ENV_EXAMPLE, ENV_FILE)
  console.log('\n📄 .env criado a partir de .env.example')
  console.log('   ⚠️  Edite .env e adicione sua OLLAMA_API_KEY')
} else {
  console.log('\n⚠️  .env.example não encontrado; pulando criação do .env')
}

// 3. Banco de dados (SQLite via Prisma)
run(['run', 'db:push'], 'Criando/atualizando o banco (Prisma + SQLite)...')

console.log('\n✅ Setup concluído!')
console.log('   Próximos passos:')
console.log('   1. Edite .env → preencha OLLAMA_API_KEY (https://ollama.com/settings/keys)')
console.log('   2. npm run dev')
console.log('')
