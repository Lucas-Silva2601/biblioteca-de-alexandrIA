<div align="center">

# 📚 Biblioteca de AlexandrIA

**Sua bibliotecária virtual, movida a IA.**

Um assistente literário conversacional que identifica livros, recomenda leituras e
conversa sobre obras — devolvendo cartões ilustrados de livros em vez de texto puro.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io)
[![Ollama](https://img.shields.io/badge/IA-Ollama_Cloud-fff?logo=ollama&logoColor=black)](https://ollama.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-d4af37.svg)](./LICENSE)

</div>

---

## ✨ Destaques

- **💬 Chat com IA** — converse com a AlexandrIA, uma bibliotecária virtual apaixonada por livros, que responde sempre em **JSON estruturado** e é renderizada como interface rica.
- **📖 Cartões de livros** — quando você cita uma obra, a IA a identifica e a app busca os metadados reais na **Open Library** (capa, autor, descrição) e exibe um cartão ilustrado.
- **🎯 Recomendações inteligentes** — peça por gênero, humor ou tema e receba listas curadas de 3 a 5 livros, com diversidade de autores e períodos.
- **🔐 Autenticação JWT** — cadastro e login com access token (Bearer) + refresh token (cookie `httpOnly`), com sessões anônimas via cookie para uso sem conta.
- **🖼️ Upload de mídia** — anexe imagens e vídeos ao chat (a IA contextualiza o pedido).
- **🎨 Tema "biblioteca"** — interface escura aconchegante com paleta própria (madeira escura, creme e dourado `#d4af37`), construída com tokens de tema no Tailwind v4.
- **⚡ Full-stack Next.js** — UI **e** API na mesma origem (App Router + API Routes), sem backend separado, sem CORS.

---

## 🧰 Stack Tecnológica

| Camada | Tecnologia |
| --- | --- |
| Framework | **Next.js 16** (App Router, Turbopack) |
| UI | **React 19** + **Tailwind CSS v4** (tokens de tema) |
| Estado | **Zustand** |
| API | **Next.js API Routes** (mesma origem) |
| Banco de dados | **Prisma 6** + **SQLite** |
| IA | **Ollama Cloud** (API REST nativa, sem SDK) |
| Autenticação | **jose** (JWT) + **bcryptjs** |
| Dados de livros | **Open Library API** |

---

## 🏗️ Arquitetura

O segredo do projeto é a separação clara entre **client** e **servidor**:

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (React)                                            │
│   store/ (Zustand)  ·  components/  ·  lib/services/*       │
└───────────────┬─────────────────────────────────────────────┘
                │  fetch (mesma origem, /api/*)
┌───────────────▼─────────────────────────────────────────────┐
│  Next.js API Routes (app/api/*)                             │
│   auth/{login,register,refresh,me,logout}                   │
│   chat · book/[id] · recommendations/[id]                   │
└───────────────┬─────────────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────────┐
│  lib/server/* (só servidor)                                 │
│   chat.js  → orquestra: Prisma ⇄ IA ⇄ Open Library          │
└───────┬─────────────────────────────┬───────────────────────┘
        │                             │
   Prisma / SQLite              Ollama Cloud + Open Library
```

**Fluxo do chat:** a IA recebe um *prompt de sistema* que a instrui a responder
exclusivamente com JSON no formato `{"type": "book"|"recommendations"|"text", "content": ...}`.
A app valida esse JSON, enriquece os livros com dados reais da Open Library e os
persiste no banco — renderizando um **cartão**, uma **lista de recomendações** ou uma **bolha de texto**.

---

## 🚀 Início Rápido

### Pré-requisitos

- **Node.js 22+**
- Chave da **Ollama Cloud** — crie em [ollama.com/settings/keys](https://ollama.com/settings/keys)

### 1. Instalar e configurar

```bash
# Clona o repositório
git clone https://github.com/SEU_USUARIO/biblioteca-de-alexandrIA.git
cd biblioteca-de-alexandrIA

# Instala as dependências, cria o .env e prepara o banco
npm run setup
```

### 2. Configurar a chave de IA

Edite o arquivo **`.env`** e preencha pelo menos:

```bash
# OBRIGATÓRIO para o chat com IA
OLLAMA_API_KEY=sua-chave-ollama

# OPCIONAL — modelo usado (padrão: gemma4:31b-cloud). Catálogo: https://ollama.com/library
OLLAMA_MODEL=gemma4:31b-cloud
```

### 3. Rodar

```bash
npm run dev
```

O servidor sobe em [http://localhost:3000](http://localhost:3000) e o **navegador abre automaticamente**. 🎉

---

## 📜 Scripts Disponíveis

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Sobe o app em modo desenvolvimento e **abre o navegador** |
| `npm run build` | Build de produção (`prisma generate` + `next build`) |
| `npm start` | Serve o build de produção |
| `npm run stop` | Encerra o processo do dev server com segurança |
| `npm run restart` | Para e sobe o dev server de novo (reabre o navegador) |
| `npm run setup` | Instala dependências, cria `.env` e prepara o banco |
| `npm run db:push` | Sincroniza o schema com o banco (SQLite) |
| `npm run db:studio` | Abre o Prisma Studio (visualizador do banco) |
| `npm run db:migrate` | Cria/aplica migrações do Prisma |
| `npm run db:generate` | Regenera o cliente Prisma |

---

## 🔧 Variáveis de Ambiente

Copie `.env.example` para `.env` (o `npm run setup` faz isso automaticamente).

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Caminho do SQLite — `file:./dev.db` |
| `JWT_SECRET` | ✅ | Segredo para assinar os tokens JWT |
| `SESSION_SECRET` | — | Segredo adicional de sessão |
| `OLLAMA_API_KEY` | ✅ (para o chat) | Chave da API do Ollama Cloud |
| `OLLAMA_MODEL` | — | Modelo a usar (padrão: `gemma4:31b-cloud`) |

> Sem a `OLLAMA_API_KEY`, o restante do app funciona normalmente; apenas o chat com IA
> responde com uma mensagem amigável indicando como configurar a chave.

---

## 📁 Estrutura do Projeto

```
biblioteca-de-alexandrIA/
├── app/                    # App Router — páginas e API
│   ├── api/                #   Rotas de API (auth, chat, book, recommendations)
│   ├── login/              #   Tela de login
│   ├── layout.jsx          #   Layout raiz (pt-BR, metadados, tema)
│   ├── page.jsx            #   Página inicial (chat)
│   └── globals.css         #   Tokens de tema (paleta "biblioteca")
├── components/             # Componentes React
│   ├── auth/               #   LoginPage
│   ├── books/              #   BookCard (cartão de livro)
│   └── chat/               #   ChatPage, ChatMessage, TypingIndicator
├── lib/
│   ├── server/             #   Orquestração de servidor (Prisma + IA)
│   ├── services/           #   Clientes de serviço (IA, auth, livros, chat)
│   ├── api.js              #   Instância HTTP compartilhada
│   ├── auth.js · jwt.js    #   Helpers de autenticação/JWT
│   ├── constants.js        #   Constantes + prompt de sistema da IA
│   ├── prisma.js           #   Cliente Prisma (singleton)
│   └── validations.js      #   Validação da resposta da IA
├── store/                  # Estado global (Zustand)
├── prisma/                 # Schema do banco + SQLite (dev.db)
├── public/                 # Assets estáticos
├── scripts/                # Automação (start/stop/restart/setup)
├── .env.example            # Modelo de variáveis de ambiente
├── next.config.mjs         # Configuração do Next.js
├── postcss.config.mjs      # Configuração do Tailwind v4
└── jsconfig.json           # Alias de importação (@/*)
```

---

## 🧠 Como a IA é integrada

A integração usa a **API REST nativa do Ollama Cloud** via `fetch` do Node — sem SDK externo:

```
POST https://ollama.com/api/chat
Authorization: Bearer <OLLAMA_API_KEY>
```

O *prompt de sistema* (em `lib/constants.js`) garante respostas em **JSON válido**,
que a app então valida (`lib/validations.js`) e enriquece com dados reais antes de
renderizar. Essa abordagem transforma um LLM em uma **fonte de dados estruturados**,
e não apenas em texto — é o que permite os cartões de livros e listas de recomendações.

---

## 📄 Licença

Distribuído sob a licença **MIT**. Veja [`LICENSE`](./LICENSE) para mais detalhes.

---

<div align="center">
Feito com ❤️ e uma boa dose de literatura.
</div>
