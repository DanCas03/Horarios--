import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GraduationCap, Mail, Lock, User, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { universitiesAPI, careersAPI, parseApiError } from '../api/client'

interface University {
  _id: string
  name: string
  short_name: string
}

interface Career {
  _id: string
  name: string
  code: string
}

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // University & Career selection (optional on register)
  const [universities, setUniversities] = useState<University[]>([])
  const [careers, setCareers] = useState<Career[]>([])
  const [selectedUni, setSelectedUni] = useState('')
  const [selectedCareer, setSelectedCareer] = useState('')
  const [loadingUniversities, setLoadingUniversities] = useState(true)

  useEffect(() => {
    setLoadingUniversities(true)
    universitiesAPI.list()
      .then((res) => setUniversities(res.data))
      .catch(() => {})
      .finally(() => setLoadingUniversities(false))
  }, [])

  useEffect(() => {
    if (selectedUni) {
      careersAPI.list(selectedUni).then((res) => setCareers(res.data)).catch(() => {})
    } else {
      setCareers([])
    }
  }, [selectedUni])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    setLoading(true)
    try {
      await register(email, username, password, selectedUni || undefined, selectedCareer || undefined)
      navigate('/pensum')
    } catch (err: any) {
      setError(parseApiError(err, 'Error al registrarse'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <GraduationCap className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-extrabold text-gray-900">Crear Cuenta</h1>
          <p className="text-gray-500 mt-2">Únete a la comunidad estudiantil</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-5">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre de usuario</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                placeholder="juanperez"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                placeholder="tu@email.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  placeholder="********"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmar</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  placeholder="********"
                />
              </div>
            </div>
          </div>

          {/* Optional: University + Career */}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-3">Opcional - puedes configurarlo después</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Universidad</label>
                <select
                  value={selectedUni}
                  onChange={(e) => { setSelectedUni(e.target.value); setSelectedCareer('') }}
                  disabled={loadingUniversities}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">
                    {loadingUniversities ? 'Cargando universidades...' : universities.length === 0 ? 'No hay universidades disponibles' : 'Selecciona universidad...'}
                  </option>
                  {universities.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.short_name} - {u.name}
                    </option>
                  ))}
                </select>
              </div>
              {selectedUni && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Carrera</label>
                  <select
                    value={selectedCareer}
                    onChange={(e) => setSelectedCareer(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                  >
                    <option value="">Selecciona carrera...</option>
                    {careers.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </button>

          <p className="text-center text-sm text-gray-500">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Inicia sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
