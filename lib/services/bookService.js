/**
 * Serviço de livros via Open Library API (gratuita, sem chave).
 * Port da lógica do backend Flask (book_service.py).
 */

const BASE_URL = 'https://openlibrary.org'
const COVERS_URL = 'https://covers.openlibrary.org/b'

const HEADERS = { 'User-Agent': 'Biblioteca-de-AlexandrIA/3.0' }
const SEARCH_FIELDS = 'key,title,author_name,first_publish_year,isbn,cover_i,subject,ratings_average,ratings_count'

async function fetchJson(url) {
  const response = await fetch(url, { headers: HEADERS })
  if (!response.ok) {
    throw new Error(`Erro Open Library (${response.status})`)
  }
  return response.json()
}

/** Converte um doc de busca no formato Book. */
function parseBook(data) {
  if (!data) return null
  const bookId = data.key || ''
  const title = data.title || 'Título Desconhecido'
  const author = Array.isArray(data.author_name) && data.author_name.length
    ? data.author_name.join(', ')
    : 'Autor Desconhecido'
  const year = data.first_publish_year ?? null
  const isbn = Array.isArray(data.isbn) && data.isbn.length ? data.isbn[0] : null
  const coverId = data.cover_i
  const coverUrl = coverId ? `${COVERS_URL}/id/${coverId}-L.jpg` : null
  const subjects = Array.isArray(data.subject) ? data.subject.slice(0, 3) : []
  const genres = subjects.length ? subjects.join(', ') : null
  const rating = typeof data.ratings_average === 'number'
    ? Math.round(data.ratings_average * 10) / 10
    : null

  return { id: bookId, title, author, year, isbn, coverUrl, description: null, genres, rating }
}

/** Busca o nome de um autor pela key. */
async function getAuthorName(authorKey) {
  if (!authorKey) return 'Autor Desconhecido'
  try {
    const data = await fetchJson(`${BASE_URL}${authorKey}.json`)
    return data?.name || 'Autor Desconhecido'
  } catch {
    return 'Autor Desconhecido'
  }
}

/**
 * Converte um /works/:id.json em Book (com descrição e autor resolvido).
 */
async function parseBookDetails(data) {
  if (!data) return null
  const bookId = data.key || ''
  const title = data.title || 'Título Desconhecido'

  let author = 'Autor Desconhecido'
  const authors = Array.isArray(data.authors) ? data.authors : []
  if (authors.length) {
    const authorKey = authors[0]?.author?.key
    author = await getAuthorName(authorKey)
  }

  let year = null
  if (data.first_publish_date) {
    const match = String(data.first_publish_date).match(/^\d{4}/)
    if (match) year = Number(match[0])
  }

  let description = null
  if (data.description && typeof data.description === 'object') {
    description = data.description.value ?? null
  } else if (typeof data.description === 'string') {
    description = data.description
  }

  const covers = Array.isArray(data.covers) ? data.covers : []
  const coverUrl = covers.length ? `${COVERS_URL}/id/${covers[0]}-L.jpg` : null

  const subjects = Array.isArray(data.subjects) ? data.subjects.slice(0, 3) : []
  const genres = subjects.length ? subjects.join(', ') : null

  return { id: bookId, title, author, year, isbn: null, coverUrl, description, genres, rating: null }
}

/**
 * Busca um livro por título/autor/ISBN.
 * @returns {Promise<object|null>} Book ou null
 */
export async function searchBook(query) {
  const params = new URLSearchParams({ q: query, limit: '1', fields: SEARCH_FIELDS })
  const data = await fetchJson(`${BASE_URL}/search.json?${params}`)
  if (!data?.docs?.length) return null
  return parseBook(data.docs[0])
}

/**
 * Busca livro por ID da Open Library (ex.: /works/OL45804W).
 * @returns {Promise<object|null>} Book ou null
 */
export async function getBookById(bookId) {
  const raw = String(bookId || '').trim()
  let normalized

  if (raw.startsWith('/')) {
    // Já vem com caminho: /works/OL45804W, /books/OL123M, etc.
    normalized = raw
  } else if (raw.includes('/')) {
    normalized = `/${raw}`
  } else {
    // ID "pelado" (ex.: OL45804W): infere o tipo pelo sufixo do
    // registro da Open Library (W=obra, M=edição, A=autor).
    if (/M$/i.test(raw)) normalized = `/books/${raw}`
    else if (/A$/i.test(raw)) normalized = `/authors/${raw}`
    else normalized = `/works/${raw}`
  }

  const data = await fetchJson(`${BASE_URL}${normalized}.json`)
  return parseBookDetails(data)
}

async function searchByParam(param, value, excludeTitle) {
  const params = new URLSearchParams({
    [param]: value,
    limit: '10',
    fields: 'key,title,author_name,first_publish_year,cover_i',
  })
  const data = await fetchJson(`${BASE_URL}/search.json?${params}`)
  const books = []
  for (const doc of data?.docs ?? []) {
    if (excludeTitle && doc.title === excludeTitle) continue
    const book = parseBook(doc)
    if (book) books.push(book)
  }
  return books
}

/**
 * Busca recomendações (mesmo autor + mesmo gênero), até 5 livros.
 * @returns {Promise<object[]>} Lista de books
 */
export async function getRecommendations(bookId) {
  const book = await getBookById(bookId)
  if (!book) return []

  const recommendations = []

  if (book.author) {
    const authorBooks = await searchByParam('author', book.author, book.title).catch(() => [])
    recommendations.push(...authorBooks.slice(0, 5))
  }

  if (recommendations.length < 5 && book.genres) {
    const genre = book.genres.split(', ')[0]
    const genreBooks = await searchByParam('subject', genre, book.title).catch(() => [])
    recommendations.push(...genreBooks.slice(0, 5 - recommendations.length))
  }

  return recommendations
}
