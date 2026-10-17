/**
 * Configuração do Next.js - Biblioteca de AlexandrIA.
 *
 * A API roda dentro do próprio Next.js (app/api/*), então não há
 * proxy nem CORS: o frontend consome /api na mesma origem.
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Não gera automaticamente o arquivo AGENTS.md na raiz
  agentRules: false,
}

export default nextConfig
