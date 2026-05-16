import React, { useState, useEffect } from 'react'
import {
  Calendar, Trash2, MapPin, Plus, CheckCircle2,
  BookMarked, Clock, ChevronDown, ChevronUp, Save, Loader2, X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { schedulesAPI, subjectsAPI } from '../api/client'
import { parseApiError } from '../api/client'

// ─── Types ────────────────────────────────────────────────────────────────────
interface ScheduleBlock {
  subject_code: string
  subject_name?: string
  section: string
  professor?: string
  day: string
  start_time: string
  end_time: string
  classroom?: string
  modality: string
}

interface Schedule {
  _id: string
  period: string
  schedule_type: string
  blocks: ScheduleBlock[]
  tentative_subjects: { subject_code: string; subject_name?: string; priority: number }[]
  created_at: string
}

interface AvailableSubject {
  _id: string
  code: string
  name: string
  credits: number
  semester_suggested: number
}

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
const DAY_LABELS: Record<string, string> = {
  lunes: 'Lun', martes: 'Mar', miercoles: 'Mié',
  jueves: 'Jue', viernes: 'Vie', sabado: 'Sáb',
}

const HOURS = Array.from({ length: 14 }, (_, i) => `${(7 + i).toString().padStart(2, '0')}:00`)
const MODALITIES = ['presencial', 'virtual', 'hibrida']

const dayColors: Record<string, string> = {
  lunes: 'bg-blue-100 border-blue-300 text-blue-800',
  martes: 'bg-green-100 border-green-300 text-green-800',
  miercoles: 'bg-purple-100 border-purple-300 text-purple-800',
  jueves: 'bg-orange-100 border-orange-300 text-orange-800',
  viernes: 'bg-pink-100 border-pink-300 text-pink-800',
  sabado: 'bg-teal-100 border-teal-300 text-teal-800',
}

const EMPTY_BLOCK = (): ScheduleBlock => ({
  subject_code: '', subject_name: '', section: '', professor: '',
  day: 'lunes', start_time: '07:00', end_time: '09:00',
  classroom: '', modality: 'presencial',
})

// ─── Main component ───────────────────────────────────────────────────────────
export default function SchedulePage() {
  const { user } = useAuth()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [available, setAvailable] = useState<AvailableSubject[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'current' | 'tentative'>('tentative')

  // Tentative state
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [tentativePeriod, setTentativePeriod] = useState('')
  const [savingTentative, setSavingTentative] = useState(false)
  const [tentativeError, setTentativeError] = useState('')

  // Current schedule form state
  const [showCurrentForm, setShowCurrentForm] = useState(false)
  const [currentPeriod, setCurrentPeriod] = useState('')
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([EMPTY_BLOCK()])
  const [savingCurrent, setSavingCurrent] = useState(false)
  const [currentError, setCurrentError] = useState('')

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Expand/collapse for existing schedules
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const schedRes = await schedulesAPI.my()
      setSchedules(schedRes.data)
      if (user?.career_id) {
        const availRes = await subjectsAPI.available(user.career_id)
        setAvailable(availRes.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // ── Tentative handlers ──────────────────────────────────────────────────────
  const toggleSubject = (code: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(code) ? next.delete(code) : next.add(code)
      return next
    })
  }

  const saveTentative = async () => {
    if (!tentativePeriod.trim()) { setTentativeError('Ingresa el período (ej: 2025-1)'); return }
    if (selected.size === 0) { setTentativeError('Selecciona al menos una materia'); return }
    setTentativeError('')
    setSavingTentative(true)
    try {
      const subjects = [...selected].map((code) => {
        const s = available.find((a) => a.code === code)
        return { subject_code: code, subject_name: s?.name ?? code, priority: 1 }
      })
      await schedulesAPI.createTentative(tentativePeriod.trim(), subjects)
      setSelected(new Set())
      setTentativePeriod('')
      await loadData()
    } catch (err: any) {
      setTentativeError(parseApiError(err, 'Error al guardar la planificación'))
    } finally {
      setSavingTentative(false)
    }
  }

  // ── Current schedule handlers ───────────────────────────────────────────────
  const addBlock = () => setBlocks((b) => [...b, EMPTY_BLOCK()])
  const removeBlock = (i: number) => setBlocks((b) => b.filter((_, idx) => idx !== i))
  const updateBlock = (i: number, field: keyof ScheduleBlock, value: string) =>
    setBlocks((b) => b.map((bl, idx) => idx === i ? { ...bl, [field]: value } : bl))

  const saveCurrentSchedule = async () => {
    if (!currentPeriod.trim()) { setCurrentError('Ingresa el período'); return }
    const validBlocks = blocks.filter((b) => b.subject_code && b.section && b.day && b.start_time && b.end_time)
    if (validBlocks.length === 0) { setCurrentError('Agrega al menos un bloque válido'); return }
    setCurrentError('')
    setSavingCurrent(true)
    try {
      await schedulesAPI.create({
        user_id: user?._id ?? '',
        university_id: user?.university_id ?? '',
        period: currentPeriod.trim(),
        schedule_type: 'current',
        blocks: validBlocks,
        tentative_subjects: [],
      })
      setShowCurrentForm(false)
      setBlocks([EMPTY_BLOCK()])
      setCurrentPeriod('')
      await loadData()
    } catch (err: any) {
      setCurrentError(parseApiError(err, 'Error al guardar el horario'))
    } finally {
      setSavingCurrent(false)
    }
  }

  const deleteSchedule = async (id: string) => {
    if (!confirm('¿Eliminar esta planificación?')) return
    setDeletingId(id)
    try {
      await schedulesAPI.delete(id)
      setSchedules((s) => s.filter((x) => x._id !== id))
    } catch (err: any) {
      alert(parseApiError(err, 'Error al eliminar'))
    } finally {
      setDeletingId(null)
    }
  }

  const currentSchedules = schedules.filter((s) => s.schedule_type === 'current')
  const tentativeSchedules = schedules.filter((s) => s.schedule_type === 'tentative')

  // Group available subjects by semester
  const bySemester = available.reduce((acc, s) => {
    const sem = s.semester_suggested || 0
    if (!acc[sem]) acc[sem] = []
    acc[sem].push(s)
    return acc
  }, {} as Record<number, AvailableSubject[]>)

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            Horarios
          </h1>
          <p className="text-gray-500 mt-1">Gestiona tu horario actual y planifica los próximos períodos</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['tentative', 'current'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              activeTab === tab
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm border border-gray-100'
            }`}
          >
            {tab === 'tentative' ? '📋 Planificación Tentativa' : '📅 Horario Actual'}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          TENTATIVE TAB
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'tentative' && (
        <div className="space-y-6">

          {/* Subject selection panel */}
          {available.length > 0 ? (
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">Materias Disponibles</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {available.length} materia{available.length !== 1 ? 's' : ''} con prelaciones cumplidas
                    {selected.size > 0 && (
                      <span className="ml-2 text-primary font-semibold">
                        · {selected.size} seleccionada{selected.size !== 1 ? 's' : ''}
                      </span>
                    )}
                  </p>
                </div>
                {selected.size > 0 && (
                  <button
                    onClick={() => setSelected(new Set())}
                    className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"
                  >
                    <X size={12} /> Limpiar selección
                  </button>
                )}
              </div>

              {Object.entries(bySemester)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([sem, semSubjects]) => (
                  <div key={sem} className="mb-5">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Semestre {sem}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {semSubjects.map((s) => {
                        const isSelected = selected.has(s.code)
                        return (
                          <button
                            key={s._id}
                            type="button"
                            onClick={() => toggleSubject(s.code)}
                            className={`text-left p-3 rounded-xl border-2 transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/5 shadow-sm'
                                : 'border-gray-200 hover:border-primary/40 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <p className={`font-medium text-sm leading-snug ${isSelected ? 'text-primary' : 'text-gray-900'}`}>
                                {s.name}
                              </p>
                              {isSelected && (
                                <CheckCircle2 size={16} className="text-primary flex-shrink-0 mt-0.5" />
                              )}
                            </div>
                            <p className={`text-xs mt-1 ${isSelected ? 'text-primary/70' : 'text-gray-400'}`}>
                              {s.code} · {s.credits} cr.
                            </p>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}

              {/* Save panel */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                {tentativeError && (
                  <p className="text-sm text-red-600 mb-3">{tentativeError}</p>
                )}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Período:</label>
                    <input
                      value={tentativePeriod}
                      onChange={(e) => setTentativePeriod(e.target.value)}
                      placeholder="2025-1"
                      className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                  </div>
                  <button
                    onClick={saveTentative}
                    disabled={savingTentative || selected.size === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingTentative ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {savingTentative ? 'Guardando...' : `Guardar planificación${selected.size > 0 ? ` (${selected.size})` : ''}`}
                  </button>
                </div>
              </div>
            </div>
          ) : user?.career_id ? (
            <div className="bg-white rounded-2xl shadow-md p-10 text-center text-gray-400">
              <BookMarked className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No hay materias disponibles</p>
              <p className="text-sm mt-1">Aprueba materias en tu pensum para desbloquear las siguientes</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-md p-10 text-center text-gray-400">
              <BookMarked className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">Configura tu carrera primero</p>
              <p className="text-sm mt-1">Ve a tu perfil y selecciona universidad y carrera</p>
            </div>
          )}

          {/* Saved tentative schedules */}
          {tentativeSchedules.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Mis Planificaciones Guardadas</h3>
              <div className="space-y-3">
                {tentativeSchedules.map((sched) => (
                  <TentativeScheduleCard
                    key={sched._id}
                    schedule={sched}
                    isExpanded={expandedId === sched._id}
                    onToggle={() => setExpandedId(expandedId === sched._id ? null : sched._id)}
                    onDelete={() => deleteSchedule(sched._id)}
                    deleting={deletingId === sched._id}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          CURRENT SCHEDULE TAB
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'current' && (
        <div className="space-y-6">

          {/* Add new schedule button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowCurrentForm(!showCurrentForm)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-light font-medium text-sm"
            >
              {showCurrentForm ? <X size={16} /> : <Plus size={16} />}
              {showCurrentForm ? 'Cancelar' : 'Registrar horario actual'}
            </button>
          </div>

          {/* New schedule form */}
          {showCurrentForm && (
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="font-bold text-gray-900 mb-4">Nuevo Horario</h3>

              {currentError && (
                <div className="mb-4 bg-red-50 text-red-700 px-4 py-2.5 rounded-lg text-sm">{currentError}</div>
              )}

              <div className="flex items-center gap-3 mb-5">
                <label className="text-sm font-medium text-gray-700">Período:</label>
                <input
                  value={currentPeriod}
                  onChange={(e) => setCurrentPeriod(e.target.value)}
                  placeholder="2025-1"
                  className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>

              {/* Blocks */}
              <div className="space-y-3 mb-4">
                {blocks.map((block, i) => (
                  <BlockRow
                    key={i}
                    index={i}
                    block={block}
                    onChange={updateBlock}
                    onRemove={removeBlock}
                    canRemove={blocks.length > 1}
                  />
                ))}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={addBlock}
                  className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Plus size={14} /> Añadir bloque
                </button>
                <button
                  onClick={saveCurrentSchedule}
                  disabled={savingCurrent}
                  className="ml-auto flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light font-medium text-sm disabled:opacity-50"
                >
                  {savingCurrent ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {savingCurrent ? 'Guardando...' : 'Guardar horario'}
                </button>
              </div>
            </div>
          )}

          {/* Existing current schedules */}
          {currentSchedules.length > 0 ? (
            currentSchedules.map((sched) => (
              <CurrentScheduleCard
                key={sched._id}
                schedule={sched}
                isExpanded={expandedId === sched._id}
                onToggle={() => setExpandedId(expandedId === sched._id ? null : sched._id)}
                onDelete={() => deleteSchedule(sched._id)}
                deleting={deletingId === sched._id}
              />
            ))
          ) : !showCurrentForm && (
            <div className="bg-white rounded-2xl shadow-md p-12 text-center">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Sin horario actual</h3>
              <p className="text-gray-500 mb-6">
                Registra los bloques de tus clases de este período para verlos en la grilla.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Tentative schedule card ──────────────────────────────────────────────────
function TentativeScheduleCard({
  schedule, isExpanded, onToggle, onDelete, deleting,
}: {
  schedule: Schedule
  isExpanded: boolean
  onToggle: () => void
  onDelete: () => void
  deleting: boolean
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center px-5 py-3.5 gap-3">
        <button onClick={onToggle} className="flex-1 flex items-center gap-3 text-left">
          <BookMarked size={18} className="text-primary flex-shrink-0" />
          <div>
            <span className="font-semibold text-gray-900">Período {schedule.period}</span>
            <span className="ml-2 text-sm text-gray-400">
              · {schedule.tentative_subjects.length} materia{schedule.tentative_subjects.length !== 1 ? 's' : ''}
            </span>
          </div>
          {isExpanded ? <ChevronUp size={16} className="text-gray-400 ml-auto" /> : <ChevronDown size={16} className="text-gray-400 ml-auto" />}
        </button>
        <button
          onClick={onDelete}
          disabled={deleting}
          className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
        >
          {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
        </button>
      </div>

      {isExpanded && (
        <div className="px-5 pb-4 border-t border-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
            {schedule.tentative_subjects.map((ts, i) => (
              <div key={i} className="flex items-center gap-2 p-2.5 bg-primary/5 rounded-lg">
                <CheckCircle2 size={14} className="text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900 leading-tight">{ts.subject_name || ts.subject_code}</p>
                  <p className="text-xs text-gray-400">{ts.subject_code}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Current schedule card with weekly grid ───────────────────────────────────
const HOURS_DISPLAY = Array.from({ length: 14 }, (_, i) => `${(7 + i).toString().padStart(2, '0')}:00`)
const dayColorMap: Record<string, string> = {
  lunes: 'bg-blue-100 border-blue-300 text-blue-800',
  martes: 'bg-green-100 border-green-300 text-green-800',
  miercoles: 'bg-purple-100 border-purple-300 text-purple-800',
  jueves: 'bg-orange-100 border-orange-300 text-orange-800',
  viernes: 'bg-pink-100 border-pink-300 text-pink-800',
  sabado: 'bg-teal-100 border-teal-300 text-teal-800',
}

function CurrentScheduleCard({
  schedule, isExpanded, onToggle, onDelete, deleting,
}: {
  schedule: Schedule
  isExpanded: boolean
  onToggle: () => void
  onDelete: () => void
  deleting: boolean
}) {
  const activeDays = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'].filter(
    (d) => schedule.blocks.some((b) => b.day === d),
  )

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
      <div className="flex items-center px-6 py-4 gap-3">
        <button onClick={onToggle} className="flex-1 flex items-center gap-3 text-left">
          <Calendar size={18} className="text-primary flex-shrink-0" />
          <div>
            <span className="font-bold text-gray-900">Período {schedule.period}</span>
            <span className="ml-2 text-sm text-gray-400">· {schedule.blocks.length} bloque{schedule.blocks.length !== 1 ? 's' : ''}</span>
          </div>
          {isExpanded ? <ChevronUp size={16} className="text-gray-400 ml-auto" /> : <ChevronDown size={16} className="text-gray-400 ml-auto" />}
        </button>
        <button
          onClick={onDelete}
          disabled={deleting}
          className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
        >
          {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
        </button>
      </div>

      {isExpanded && schedule.blocks.length > 0 && (
        <div className="px-6 pb-5 border-t border-gray-100">
          <div className="overflow-x-auto mt-4">
            <div style={{ minWidth: `${activeDays.length * 120 + 60}px` }}>
              {/* Header */}
              <div className={`grid gap-1 mb-1`} style={{ gridTemplateColumns: `60px repeat(${activeDays.length}, 1fr)` }}>
                <div className="text-xs font-medium text-gray-400 text-center py-1">Hora</div>
                {activeDays.map((d) => (
                  <div key={d} className="text-xs font-semibold text-gray-700 text-center py-1 capitalize">
                    {DAY_LABELS[d] ?? d}
                  </div>
                ))}
              </div>
              {/* Time rows */}
              {HOURS_DISPLAY.map((hour) => {
                const hasBlock = activeDays.some((d) =>
                  schedule.blocks.some((b) => b.day === d && b.start_time <= hour && b.end_time > hour),
                )
                if (!hasBlock) return null
                return (
                  <div key={hour} className="grid gap-1 mb-1" style={{ gridTemplateColumns: `60px repeat(${activeDays.length}, 1fr)` }}>
                    <div className="text-xs text-gray-400 text-right pr-2 pt-1">{hour}</div>
                    {activeDays.map((day) => {
                      const block = schedule.blocks.find(
                        (b) => b.day === day && b.start_time <= hour && b.end_time > hour,
                      )
                      if (block && block.start_time === hour) {
                        return (
                          <div key={day} className={`p-1.5 rounded-lg border text-xs ${dayColorMap[day] || 'bg-gray-100'}`}>
                            <p className="font-bold truncate">{block.subject_code}</p>
                            {block.subject_name && <p className="opacity-80 truncate">{block.subject_name}</p>}
                            <p className="opacity-70 truncate">{block.section}</p>
                            {block.classroom && (
                              <p className="opacity-60 flex items-center gap-0.5 mt-0.5">
                                <MapPin size={9} /> {block.classroom}
                              </p>
                            )}
                          </div>
                        )
                      }
                      if (block) return <div key={day} className={`rounded-lg border ${dayColorMap[day] || 'bg-gray-100'} opacity-20`} />
                      return <div key={day} className="bg-gray-50 rounded-lg min-h-[2rem]" />
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Block row for the current schedule form ──────────────────────────────────
function BlockRow({
  index, block, onChange, onRemove, canRemove,
}: {
  index: number
  block: ScheduleBlock
  onChange: (i: number, field: keyof ScheduleBlock, value: string) => void
  onRemove: (i: number) => void
  canRemove: boolean
}) {
  const sel = 'px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white'
  const inp = 'px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none w-full'

  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <div className="flex items-center gap-1 mb-2">
        <span className="text-xs font-semibold text-gray-500">Bloque {index + 1}</span>
        {canRemove && (
          <button onClick={() => onRemove(index)} className="ml-auto text-gray-400 hover:text-red-500">
            <X size={13} />
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div>
          <label className="text-xs text-gray-500 mb-0.5 block">Código *</label>
          <input value={block.subject_code} onChange={(e) => onChange(index, 'subject_code', e.target.value.toUpperCase())} placeholder="MAT-1115" className={inp} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-0.5 block">Nombre</label>
          <input value={block.subject_name ?? ''} onChange={(e) => onChange(index, 'subject_name', e.target.value)} placeholder="Matemáticas I" className={inp} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-0.5 block">Sección *</label>
          <input value={block.section} onChange={(e) => onChange(index, 'section', e.target.value)} placeholder="A1" className={inp} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-0.5 block">Profesor</label>
          <input value={block.professor ?? ''} onChange={(e) => onChange(index, 'professor', e.target.value)} placeholder="Nombre" className={inp} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-0.5 block">Día *</label>
          <select value={block.day} onChange={(e) => onChange(index, 'day', e.target.value)} className={sel}>
            {DAYS.map((d) => <option key={d} value={d}>{DAY_LABELS[d] ?? d}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-0.5 block">Inicio *</label>
          <select value={block.start_time} onChange={(e) => onChange(index, 'start_time', e.target.value)} className={sel}>
            {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-0.5 block">Fin *</label>
          <select value={block.end_time} onChange={(e) => onChange(index, 'end_time', e.target.value)} className={sel}>
            {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-0.5 block">Aula</label>
          <input value={block.classroom ?? ''} onChange={(e) => onChange(index, 'classroom', e.target.value)} placeholder="Aula 305" className={inp} />
        </div>
      </div>
    </div>
  )
}
