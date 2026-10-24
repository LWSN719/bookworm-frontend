import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

// Shared shell for every route. Public pages (home, search, genre, book
// details) render here with no login required, per the README.
export default function Layout() {
  return (
    <>
      <Navbar />
      <main className="app-main">
        <Outlet />
      </main>
    </>
  )
}
