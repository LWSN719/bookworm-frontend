import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './AccountMenu.css'

const LINKS = [
  { to: '/account/profile', label: 'Edit profile' },
  { to: '/account/security', label: 'Security & Password' },
  { to: '/account/settings', label: 'Account settings' },
]

// The signed-in account dropdown. Rendered only for signed-in visitors —
// guests keep the Log In / Sign Up buttons, untouched.
//
// Menu semantics are done properly rather than approximated with a styled
// list: a real roving focus, Escape returning focus to the trigger, and
// aria-haspopup/aria-expanded, so the thing is usable without a mouse.
export default function AccountMenu() {
  const { displayName, user, signOut } = useAuth()
  const location = useLocation()

  const [open, setOpen] = useState(false)
  // -1 means "open, but don't move focus" (a pointer opened it).
  const [focusIndex, setFocusIndex] = useState(-1)

  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const itemRefs = useRef([])

  const name = displayName ?? 'Reader'
  const email = user?.email ?? ''
  const itemCount = LINKS.length + 1 // the links plus Log Out

  const close = useCallback((returnFocus = false) => {
    setOpen(false)
    setFocusIndex(-1)
    if (returnFocus) triggerRef.current?.focus()
  }, [])

  // Clicking anywhere outside dismisses. pointerdown rather than click so the
  // menu closes on press, before the underlying control reacts.
  useEffect(() => {
    if (!open) return undefined
    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) close()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open, close])

  // Navigating away must not leave the menu hanging open behind the new page.
  useEffect(() => {
    setOpen(false)
    setFocusIndex(-1)
  }, [location.pathname])

  // Move real DOM focus to whichever item is current.
  useEffect(() => {
    if (!open || focusIndex < 0) return
    itemRefs.current[focusIndex]?.focus()
  }, [open, focusIndex])

  function openAt(index) {
    setOpen(true)
    setFocusIndex(index)
  }

  function onTriggerKeyDown(event) {
    // Escape has to be handled here too. Opening by click leaves focus on
    // the trigger, so the menu's own handler never sees the key and the
    // popover would sit there unclosable from the keyboard.
    if (event.key === 'Escape' && open) {
      event.preventDefault()
      close()
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openAt(0)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      openAt(itemCount - 1)
    }
  }

  function onMenuKeyDown(event) {
    switch (event.key) {
      case 'Escape':
        event.preventDefault()
        close(true)
        break
      case 'ArrowDown':
        event.preventDefault()
        setFocusIndex((i) => (i + 1) % itemCount)
        break
      case 'ArrowUp':
        event.preventDefault()
        setFocusIndex((i) => (i - 1 + itemCount) % itemCount)
        break
      case 'Home':
        event.preventDefault()
        setFocusIndex(0)
        break
      case 'End':
        event.preventDefault()
        setFocusIndex(itemCount - 1)
        break
      case 'Tab':
        // Let focus leave naturally, but don't leave the menu behind it.
        close()
        break
      default:
        break
    }
  }

  async function handleSignOut() {
    close()
    await signOut()
    // Deliberately no redirect, matching the rest of the app: public pages
    // stay readable, and /library and /account swap to their own guest views.
  }

  return (
    <div className="account-menu" ref={rootRef}>
      <button
        type="button"
        ref={triggerRef}
        className={open ? 'account-trigger account-trigger-open' : 'account-trigger'}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => (open ? close() : openAt(-1))}
        onKeyDown={onTriggerKeyDown}
      >
        <span className="account-avatar" aria-hidden="true">
          {name.trim().charAt(0).toUpperCase()}
        </span>
        <span className="account-trigger-name">{name}</span>
        <svg className="account-chevron" viewBox="0 0 24 24" aria-hidden="true">
          <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="account-popover" role="menu" aria-label="Account" onKeyDown={onMenuKeyDown}>
          <div className="account-popover-head">
            <span className="account-popover-name">{name}</span>
            {email && <span className="account-popover-email">{email}</span>}
          </div>

          <div className="account-popover-items">
            {LINKS.map((link, index) => (
              <Link
                key={link.to}
                to={link.to}
                role="menuitem"
                tabIndex={-1}
                ref={(el) => {
                  itemRefs.current[index] = el
                }}
                className="account-item"
                onClick={() => close()}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="account-popover-foot">
            <button
              type="button"
              role="menuitem"
              tabIndex={-1}
              ref={(el) => {
                itemRefs.current[LINKS.length] = el
              }}
              className="account-item account-item-signout"
              onClick={handleSignOut}
            >
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
