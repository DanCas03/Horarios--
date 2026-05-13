import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GraduationCap, Menu, X, LogOut, User, BookOpen, Calendar, MessageSquare } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-primary text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-90">
            <GraduationCap className="h-8 w-8 text-accent" />
            <span className="text-xl font-bold tracking-tight">Guía Estudiantil</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                <Link to="/pensum" className="flex items-center gap-1.5 hover:text-accent font-medium">
                  <BookOpen size={18} />
                  Pensum
                </Link>
                <Link to="/schedule" className="flex items-center gap-1.5 hover:text-accent font-medium">
                  <Calendar size={18} />
                  Horarios
                </Link>
                <Link to="/reviews" className="flex items-center gap-1.5 hover:text-accent font-medium">
                  <MessageSquare size={18} />
                  Reseñas
                </Link>
                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-white/20">
                  <Link to="/profile" className="flex items-center gap-1.5 hover:text-accent">
                    <User size={18} />
                    {user.username}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-red-300 hover:text-red-200"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg hover:bg-white/10 font-medium"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-accent text-primary-dark rounded-lg font-semibold hover:bg-amber-400"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-primary-dark border-t border-white/10 px-4 pb-4">
          {user ? (
            <div className="flex flex-col gap-3 pt-3">
              <Link to="/pensum" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 py-2 hover:text-accent">
                <BookOpen size={18} /> Pensum
              </Link>
              <Link to="/schedule" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 py-2 hover:text-accent">
                <Calendar size={18} /> Horarios
              </Link>
              <Link to="/reviews" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 py-2 hover:text-accent">
                <MessageSquare size={18} /> Reseñas
              </Link>
              <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 py-2 hover:text-accent">
                <User size={18} /> {user.username}
              </Link>
              <button onClick={handleLogout} className="flex items-center gap-2 py-2 text-red-300 hover:text-red-200">
                <LogOut size={18} /> Cerrar Sesión
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 pt-3">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="py-2 hover:text-accent">
                Iniciar Sesión
              </Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="py-2 hover:text-accent">
                Registrarse
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
