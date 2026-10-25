import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { searchBooks } from '../lib/booksApi'
import { useBookList } from '../hooks/useBookList'
import BookListSection from '../components/BookListSection'
import './Search.css'

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
    <div className={hasSubmitted ? 'search-page' : 'search-page search-page-empty'}>
      <div className="search-panel">
        <h1 className="page-title search-heading">Search books</h1>
        <p className="search-lede">Find a book by its title. Author and keyword searches aren't part of BookWorm.</p>

        <form onSubmit={handleSubmit} className="search-form" role="search">
          <span className="search-input-wrap">
            <svg className="search-input-icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="m16 16 4.5 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              className="input search-input"
              placeholder="Search by title…"
              aria-label="Search by title"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          </span>
          <button type="submit" className="btn btn-primary btn-lg">
            Search
          </button>
        </form>
      </div>

      {!hasSubmitted && (
        <p className="placeholder-note search-hint">Search for a book by title to get started.</p>
      )}

      {hasSubmitted && (
        <>
          <p className="search-results-for">
            Results for <strong>{submittedQuery}</strong>
          </p>
          <BookListSection
            layout="grid"
            emptyMessage={`No books found for "${submittedQuery}". Try a different title.`}
            {...list}
            onLoadMore={list.loadMore}
            onRetry={list.retry}
          />
        </>
      )}
    </div>
  )
}
