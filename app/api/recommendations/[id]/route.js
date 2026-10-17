import { NextResponse } from 'next/server'

import { getRecommendations } from '@/lib/services/bookService'

export const revalidate = 3600

export async function GET(_request, { params }) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ type: 'text', content: 'ID do livro ausente.' }, { status: 400 })
    }

    const recommendations = await getRecommendations(id)
    return NextResponse.json({ type: 'recommendations', content: recommendations })
  } catch (error) {
    console.error('[recommendations]', error)
    return NextResponse.json(
      { type: 'text', content: 'Ocorreu um erro ao buscar recomendações.' },
      { status: 500 }
    )
  }
}
