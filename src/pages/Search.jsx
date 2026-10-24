import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { searchBooks } from '../lib/booksApi'
import { useBookList } from '../hooks/useBookList'
import BookListSection from '../components/BookListSection'

// Title-only search per the README. The submitted query lives in the URL
// (?q=...) via React Router's useSearchParams, not just local state, so a
// search survives a refresh and is shareable/bookmarkable.
export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const submittedQuery = searchParams.get('q') ?? ''

  // Local state for the input box, separate from the submitted/URL query, so
  // typing doesn't trigger a fetch on every keystroke — only submitting does.
  const [inputValue, setInputValue] = useState(submittedQuery)
  useEffect(() => {
    setInputValue(submittedQuery)
  }, [submittedQuery])

  const params = useMemo(() => ({ q: submittedQuery }), [submittedQuery])
  const hasSubmitted = submittedQuery.trim().length > 0
  const list = useBookList({ fetchPage: searchBooks, params, enabled: hasSubmitted })

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = inputValue.trim()
    if (trimmed) setSearchParams({ q: trimmed })
  }

  return (
    <div>
      <h1 className="page-title">Search books</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem', maxWidth: 480 }}>
        <input
          type="text"
          placeholder="Search by title…"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          style={{
            flex: 1,
            background: 'var(--color-surface-raised)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            color: 'var(--color-text)',
            padding: '0.6rem 0.75rem',
            fontSize: '1rem',
          }}
        />
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </form>

      {!hasSubmitted && (
        <p className="placeholder-note">Search for a book by title to get started.</p>
      )}

      {hasSubmitted && (
        <BookListSection
          layout="grid"
          emptyMessage={`No books found for "${submittedQuery}". Try a different title.`}
          {...list}
          onLoadMore={list.loadMore}
          onRetry={list.retry}
        />
      )}
    </div>
  )
}
