import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Pensum from './pages/Pensum'
import Reviews from './pages/Reviews'
import Schedule from './pages/Schedule'
import Profile from './pages/Profile'

const Spinner = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
  </div>
)

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <Spinner />

  // localStorage.setItem es síncrono: se escribe ANTES de que navigate() ejecute.
  // Esto evita la pantalla en blanco causada por actualizaciones de estado de React
  // que aún no fueron confirmadas (concurrent mode) justo después del login/registro.
  const hasToken = !!localStorage.getItem('access_token')

  if (!user && hasToken) return <Spinner />

  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/pensum"
          element={
            <ProtectedRoute>
              <Pensum />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reviews"
          element={
            <ProtectedRoute>
              <Reviews />
            </ProtectedRoute>
          }
        />
        <Route
          path="/schedule"
          element={
            <ProtectedRoute>
              <Schedule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
