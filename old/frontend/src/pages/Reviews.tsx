import React, { useState, useEffect, useRef, useCallback } from 'react'
import { MessageSquare, Star, ThumbsUp, ThumbsDown, Search, PlusCircle, X, ChevronDown, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { reviewsAPI, subjectsAPI } from '../api/client'
import { parseApiError } from '../api/client'

interface Review {
  _id: string
  subject_code: string
  professor_name?: string
  period: string
  section?: string
  difficulty_rating: number
  professor_rating?: number
  workload_rating: number
  would_recommend: boolean
  comment?: string
  tips?: string
  study_strategy?: string
  is_verified: boolean
  created_at: string
}

interface SubjectOption {
  code: string
  name: string
}

// ─── Reusable star display ────────────────────────────────────────────────────
function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          size={14}
          className={i < value ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
        />
      ))}
    </div>
  )
}

// ─── Searchable subject combobox ──────────────────────────────────────────────
function SubjectCombobox({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (code: string) => void
  options: SubjectOption[]
}) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Sync external value
  useEffect(() => { setQuery(value) }, [value])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = options.filter(
    (s) =>
      s.code.toLowerCase().includes(query.toLowerCase()) ||
      s.name.toLowerCase().includes(query.toLowerCase()),
  )

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.toUpperCase()
    setQuery(v)
    onChange(v)
    setOpen(true)
  }

  const handleSelect = (code: string) => {
    setQuery(code)
    onChange(code)
    setOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          required
          value={query}
          onChange={handleInput}
          onFocus={() => setOpen(true)}
          placeholder={options.length > 0 ? 'Buscar por código o nombre...' : 'Ej: MAT-1115'}
          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
        />
        <ChevronDown
          size={15}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
      </div>

      {open && filtered.length > 0 && (
        <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {filtered.map((s) => (
            <li key={s.code}>
              <button
                type="button"
                onMouseDown={() => handleSelect(s.code)}
                className="w-full text-left px-3 py-2 hover:bg-primary/5 flex items-center gap-2 text-sm"
              >
                <span className="font-mono font-semibold text-primary flex-shrink-0">{s.code}</span>
                <span className="text-gray-500 truncate">{s.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && query.length > 0 && filtered.length === 0 && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm text-gray-400">
          No se encontraron materias — se usará el código ingresado
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Reviews() {
  const { user } = useAuth()

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [activeCode, setActiveCode] = useState('') // code being searched
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Results state
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [subjectOptions, setSubjectOptions] = useState<SubjectOption[]>([])
  const [allSubjects, setAllSubjects] = useState<SubjectOption[]>([])
  const [form, setForm] = useState({
    subject_code: '',
    university_id: '',
    professor_name: '',
    period: '',
    section: '',
    difficulty_rating: 3,
    professor_rating: 3,
    workload_rating: 3,
    would_recommend: true,
    comment: '',
    tips: '',
    study_strategy: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  // Load pensum subjects: all (for search) + approved (for form combobox)
  useEffect(() => {
    if (!user?.career_id) return
    subjectsAPI.pensum(user.career_id)
      .then((res) => {
        const approvedCodes = new Set(user.approved_subjects?.map((s) => s.subject_code) || [])
        const all: SubjectOption[] = res.data.map((s: any) => ({ code: s.code, name: s.name }))
        const approved: SubjectOption[] = all.filter((s) => approvedCodes.has(s.code))
        setAllSubjects(all)
        setSubjectOptions(approved)
      })
      .catch(() => {})
  }, [user?.career_id, user?.approved_subjects])

  // Close search dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Subjects matching the current search query
  const searchSuggestions = searchQuery.trim().length > 0
    ? allSubjects.filter(
        (s) =>
          s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : []

  const fetchReviews = useCallback(async (code: string) => {
    if (!code.trim()) return
    setLoading(true)
    setHasSearched(true)
    setActiveCode(code.trim().toUpperCase())
    try {
      const res = await reviewsAPI.bySubject(code.trim(), user?.university_id || undefined)
      setReviews(res.data)
    } catch {
      setReviews([])
    } finally {
      setLoading(false)
    }
  }, [user?.university_id])

  // Debounced auto-search as the user types
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase()
    setSearchQuery(value)
    setSearchOpen(true)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.trim().length >= 3) {
      debounceRef.current = setTimeout(() => {
        fetchReviews(value)
        setSearchOpen(false)
      }, 500)
    }
  }

  const handleSelectSuggestion = (code: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSearchQuery(code)
    setSearchOpen(false)
    fetchReviews(code)
  }

  const handleSearch = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSearchOpen(false)
    fetchReviews(searchQuery)
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)
    try {
      await reviewsAPI.create({
        ...form,
        university_id: user?.university_id || '',
      })
      setShowForm(false)
      setForm({
        subject_code: '', university_id: '', professor_name: '', period: '',
        section: '', difficulty_rating: 3, professor_rating: 3, workload_rating: 3,
        would_recommend: true, comment: '', tips: '', study_strategy: '',
      })
      if (activeCode) fetchReviews(activeCode)
    } catch (err: any) {
      setFormError(parseApiError(err, 'Error al crear reseña'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-primary" />
            Reseñas
          </h1>
          <p className="text-gray-500 mt-1">Consulta y comparte opiniones de materias y profesores</p>
        </div>
        {user && (
          <button
            onClick={() => { setShowForm(!showForm); setFormError('') }}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-light font-medium"
          >
            {showForm ? <X size={18} /> : <PlusCircle size={18} />}
            {showForm ? 'Cancelar' : 'Escribir Reseña'}
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Buscar reseñas por materia
        </label>
        <div className="flex gap-3">
          <div ref={searchRef} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10 pointer-events-none" />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-spin z-10" />
            )}
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchInput}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={allSubjects.length > 0 ? 'Buscar por código o nombre de materia...' : 'Ej: MAT-1115'}
              className="w-full pl-10 pr-9 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />

            {/* Suggestions dropdown */}
            {searchOpen && searchSuggestions.length > 0 && (
              <ul className="absolute z-30 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                {searchSuggestions.map((s) => (
                  <li key={s.code}>
                    <button
                      type="button"
                      onMouseDown={() => handleSelectSuggestion(s.code)}
                      className="w-full text-left px-4 py-2.5 hover:bg-primary/5 flex items-center gap-3 text-sm border-b border-gray-50 last:border-0"
                    >
                      <span className="font-mono font-bold text-primary flex-shrink-0 text-xs bg-primary/10 px-2 py-0.5 rounded">
                        {s.code}
                      </span>
                      <span className="text-gray-600 truncate">{s.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* No results hint */}
            {searchOpen && searchQuery.trim().length >= 2 && searchSuggestions.length === 0 && allSubjects.length > 0 && (
              <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl px-4 py-3 text-sm text-gray-400">
                Sin coincidencias en tu pensum — puedes buscar igual presionando Buscar
              </div>
            )}
          </div>

          <button
            onClick={handleSearch}
            disabled={loading || !searchQuery.trim()}
            className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-light font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Buscar
          </button>
        </div>

        {/* Active search label */}
        {activeCode && !loading && (
          <p className="mt-3 text-xs text-gray-400 flex items-center gap-1.5">
            Mostrando resultados para
            <span className="font-mono font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
              {activeCode}
            </span>
            <button
              onClick={() => { setSearchQuery(''); setActiveCode(''); setReviews([]); setHasSearched(false) }}
              className="ml-1 text-gray-400 hover:text-red-500"
            >
              <X size={12} />
            </button>
          </p>
        )}
      </div>

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmitReview} className="bg-white rounded-2xl shadow-md p-6 mb-6 space-y-4">
          <h3 className="font-bold text-lg text-gray-900">Nueva Reseña</h3>

          {formError && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Materia *
                {subjectOptions.length > 0 && (
                  <span className="ml-1 text-xs text-gray-400 font-normal">
                    ({subjectOptions.length} cursadas)
                  </span>
                )}
              </label>
              <SubjectCombobox
                value={form.subject_code}
                onChange={(code) => setForm({ ...form, subject_code: code })}
                options={subjectOptions}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Periodo *</label>
              <input
                required
                value={form.period}
                onChange={(e) => setForm({ ...form, period: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                placeholder="2025-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profesor</label>
              <input
                value={form.professor_name}
                onChange={(e) => setForm({ ...form, professor_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                placeholder="Nombre del profesor"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sección</label>
              <input
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                placeholder="A, B, 001..."
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Dificultad', key: 'difficulty_rating' as const },
              { label: 'Profesor', key: 'professor_rating' as const },
              { label: 'Carga de trabajo', key: 'workload_rating' as const },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label} (1-5)</label>
                <input
                  type="range" min="1" max="5"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
                <p className="text-center text-sm font-semibold text-primary">{form[key]}/5</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">¿Recomiendas esta materia?</label>
            <button
              type="button"
              onClick={() => setForm({ ...form, would_recommend: !form.would_recommend })}
              className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                form.would_recommend
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              {form.would_recommend ? '👍 Sí' : '👎 No'}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comentario</label>
            <textarea
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
              placeholder="Comparte tu experiencia con la materia..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tips / Consejos</label>
            <textarea
              value={form.tips}
              onChange={(e) => setForm({ ...form, tips: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
              placeholder="Consejos para quien vaya a cursar esta materia..."
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Publicando...' : 'Publicar Reseña (Anónima)'}
          </button>
        </form>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">{reviews.length} reseña(s) para <strong>{activeCode}</strong></p>
          {reviews.map((r) => (
            <div key={r._id} className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900">{r.subject_code}</span>
                    {r.is_verified && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        ✓ Verificada
                      </span>
                    )}
                  </div>
                  {r.professor_name && (
                    <p className="text-sm text-gray-500">Prof. {r.professor_name}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    Periodo: {r.period}{r.section && ` | Sección: ${r.section}`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {r.would_recommend ? (
                    <ThumbsUp className="h-5 w-5 text-green-500" />
                  ) : (
                    <ThumbsDown className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Dificultad</p>
                  <StarRating value={r.difficulty_rating} />
                </div>
                {r.professor_rating != null && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Profesor</p>
                    <StarRating value={r.professor_rating} />
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Carga</p>
                  <StarRating value={r.workload_rating} />
                </div>
              </div>

              {r.comment && <p className="text-gray-700 text-sm mb-3">{r.comment}</p>}
              {r.tips && (
                <div className="bg-amber-50 rounded-lg p-3 mb-2">
                  <p className="text-xs font-semibold text-amber-700 mb-1">💡 Tips:</p>
                  <p className="text-sm text-amber-800">{r.tips}</p>
                </div>
              )}
              {r.study_strategy && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-blue-700 mb-1">📚 Estrategia:</p>
                  <p className="text-sm text-blue-800">{r.study_strategy}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : hasSearched && !loading ? (
        <div className="text-center py-10 text-gray-400">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No se encontraron reseñas para <strong>{activeCode}</strong></p>
          <p className="text-sm mt-1">Sé el primero en dejar una reseña</p>
        </div>
      ) : null}
    </div>
  )
}
