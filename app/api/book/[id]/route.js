import { NextResponse } from 'next/server'

import { getBookById } from '@/lib/services/bookService'

export const revalidate = 3600

export async function GET(_request, { params }) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ type: 'text', content: 'ID do livro ausente.' }, { status: 400 })
    }

    const book = await getBookById(id)
    if (!book) {
      return NextResponse.json(
        { type: 'text', content: 'Não consegui encontrar detalhes sobre este livro.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ type: 'book', content: book })
  } catch (error) {
    console.error('[book]', error)
    return NextResponse.json(
      { type: 'text', content: 'Ocorreu um erro ao buscar informações do livro.' },
      { status: 500 }
    )
  }
}
