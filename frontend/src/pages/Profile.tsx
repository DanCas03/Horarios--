import React, { useState, useEffect } from 'react'
import { User as UserIcon, Building2, BookOpen, Save, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { universitiesAPI, careersAPI } from '../api/client'
import api from '../api/client'

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

export default function Profile() {
  const { user, refreshUser } = useAuth()
  const [universities, setUniversities] = useState<University[]>([])
  const [careers, setCareers] = useState<Career[]>([])
  const [selectedUni, setSelectedUni] = useState(user?.university_id || '')
  const [selectedCareer, setSelectedCareer] = useState(user?.career_id || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    universitiesAPI.list().then((res) => setUniversities(res.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (selectedUni) {
      careersAPI.list(selectedUni).then((res) => setCareers(res.data)).catch(() => {})
    } else {
      setCareers([])
    }
  }, [selectedUni])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/auth/me', {
        university_id: selectedUni || null,
        career_id: selectedCareer || null,
      })
      await refreshUser()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      alert('Error al guardar perfil')
    } finally {
      setSaving(false)
    }
  }

  const currentUni = universities.find((u) => u._id === (user?.university_id || selectedUni))

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8 flex items-center gap-3">
        <UserIcon className="h-8 w-8 text-primary" />
        Mi Perfil
      </h1>

      {/* User Info */}
      <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
        <h2 className="font-bold text-lg text-gray-900 mb-4">Información de Cuenta</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Usuario</p>
            <p className="font-medium text-gray-900">{user?.username}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Correo</p>
            <p className="font-medium text-gray-900">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Academic Config */}
      <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
        <h2 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
          <Building2 size={20} className="text-primary" />
          Configuración Académica
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Universidad</label>
            <select
              value={selectedUni}
              onChange={(e) => {
                setSelectedUni(e.target.value)
                setSelectedCareer('')
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
            >
              <option value="">Selecciona tu universidad</option>
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
                <option value="">Selecciona tu carrera</option>
                {careers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-light font-medium disabled:opacity-50"
          >
            {saved ? (
              <>
                <CheckCircle size={18} /> Guardado
              </>
            ) : (
              <>
                <Save size={18} /> {saving ? 'Guardando...' : 'Guardar Cambios'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
          <BookOpen size={20} className="text-primary" />
          Resumen Académico
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-3xl font-bold text-primary">{user?.approved_subjects?.length || 0}</p>
            <p className="text-sm text-gray-500">Materias Aprobadas</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-3xl font-bold text-accent">{user?.total_approved_credits || 0}</p>
            <p className="text-sm text-gray-500">Créditos Aprobados</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-3xl font-bold text-green-600">{currentUni?.short_name || '-'}</p>
            <p className="text-sm text-gray-500">Universidad</p>
          </div>
        </div>
      </div>
    </div>
  )
}
