import { useCallback, useEffect, useRef, useState } from 'react'
import BookCard from './BookCard'
import AutoLoadMore from './AutoLoadMore'

// Horizontal, Netflix-style row — used for Home's technology section, the
// one place the README explicitly calls out a Netflix-inspired layout.
//
// The arrows are presentational only: they scroll this element and nothing
// else. They never fetch — the sentinel at the end of the track does that,
// by calling the same loadMore the button used to call. The row remains
// fully usable by drag, wheel, trackpad and keyboard.
export default function BookCarousel({ items, autoLoad }) {
  const trackRef = useRef(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  const syncEdges = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setAtStart(el.scrollLeft <= 2)
    // A row that doesn't overflow is "at the end" from the start, which is
    // what hides both arrows when there's nothing to scroll.
    setAtEnd(el.scrollLeft >= max - 2)
  }, [])

  useEffect(() => {
    syncEdges()
    const el = trackRef.current
    if (!el) return undefined
    const observer = new ResizeObserver(syncEdges)
    observer.observe(el)
    return () => observer.disconnect()
  }, [syncEdges, items])

  function scrollByPage(direction) {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({ left: direction * Math.round(el.clientWidth * 0.82), behavior: 'smooth' })
  }

  return (
    <div className="carousel">
      <button
        type="button"
        className="carousel-arrow carousel-arrow-prev"
        onClick={() => scrollByPage(-1)}
        disabled={atStart}
        aria-label="Scroll left"
        tabIndex={-1}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m15 5-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="book-carousel" ref={trackRef} onScroll={syncEdges}>
        {items.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}

        {/* Inside the track, so the observer can watch it against the row's
            own horizontal scrolling rather than the page's. */}
        {autoLoad && (
          <AutoLoadMore
            {...autoLoad}
            rootRef={trackRef}
            rootMargin="0px 400px 0px 0px"
            horizontal
          />
        )}
      </div>

      <button
        type="button"
        className="carousel-arrow carousel-arrow-next"
        onClick={() => scrollByPage(1)}
        disabled={atEnd}
        aria-label="Scroll right"
        tabIndex={-1}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}
