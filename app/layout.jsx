import './globals.css'

export const metadata = {
  title: {
    default: 'Biblioteca de AlexandrIA - Sua Biblioteca Inteligente',
    template: '%s | Biblioteca de AlexandrIA',
  },
  description:
    'Chat interativo sobre livros com inteligência artificial: perguntas, recomendações e muito mais.',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1a1410',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-full bg-background text-ink">{children}</body>
    </html>
  )
}
