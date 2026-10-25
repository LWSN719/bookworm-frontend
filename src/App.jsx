import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Search from './pages/Search'
import Genre from './pages/Genre'
import BookDetails from './pages/BookDetails'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Library from './pages/Library'
import AccountLayout from './pages/account/AccountLayout'
import EditProfile from './pages/account/EditProfile'
import Security from './pages/account/Security'
import AccountSettings from './pages/account/AccountSettings'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/genre/:slug" element={<Genre />} />
        <Route path="/books/:id" element={<BookDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/library" element={<Library />} />
        {/* Public like /library: a signed-out visitor sees an invitation
            here, never an automatic redirect to the login form. */}
        <Route path="/account" element={<AccountLayout />}>
          <Route index element={<Navigate to="/account/profile" replace />} />
          <Route path="profile" element={<EditProfile />} />
          <Route path="security" element={<Security />} />
          <Route path="settings" element={<AccountSettings />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
