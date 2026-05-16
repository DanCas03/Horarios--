import React, { useState, useEffect } from 'react'
import {
  BookOpen, CheckCircle, Circle, ChevronDown, ChevronRight,
  Award, Target, RotateCcw, CheckSquare, Loader2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { subjectsAPI, careersAPI } from '../api/client'

interface Subject {
  _id: string
  code: string
  name: string
  credits: number
  semester_suggested: number
  subject_type: string
  prerequisites: string[]
  avg_difficulty: number
  review_count: number
}

interface Career {
  _id: string
  name: string
  total_credits: number
}

export default function Pensum() {
  const { user, refreshUser } = useAuth()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [career, setCareer] = useState<Career | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedSemester, setExpandedSemester] = useState<number | null>(1)
  const [approving, setApproving] = useState<string | null>(null)
  const [unapprovingCode, setUnapprovingCode] = useState<string | null>(null)
  const [approvingSemester, setApprovingSemester] = useState<number | null>(null)

  const approvedCodes = new Set(user?.approved_subjects?.map((s) => s.subject_code) || [])

  useEffect(() => {
    if (user?.career_id) {
      Promise.all([
        subjectsAPI.pensum(user.career_id),
        careersAPI.get(user.career_id),
      ]).then(([subRes, carRes]) => {
        setSubjects(subRes.data)
        setCareer(carRes.data)
      }).catch(console.error).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [user?.career_id])

  const handleApprove = async (code: string) => {
    setApproving(code)
    try {
      await subjectsAPI.approve({ subject_code: code })
      await refreshUser()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al aprobar materia')
    } finally {
      setApproving(null)
    }
  }

  const handleUnapprove = async (code: string) => {
    setUnapprovingCode(code)
    try {
      await subjectsAPI.unapprove(code)
      await refreshUser()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al deshacer aprobación')
    } finally {
      setUnapprovingCode(null)
    }
  }

  const handleApproveSemester = async (semNum: number, semSubjects: Subject[]) => {
    // Current approved codes at the moment this runs
    const currentApproved = new Set(user?.approved_subjects?.map((s) => s.subject_code) || [])
    const toApprove = semSubjects.filter((s) => {
      if (currentApproved.has(s.code)) return false
      return s.prerequisites.every((p) => currentApproved.has(p))
    })
    if (toApprove.length === 0) return

    setApprovingSemester(semNum)
    for (const subject of toApprove) {
      try {
        await subjectsAPI.approve({ subject_code: subject.code })
        currentApproved.add(subject.code)
      } catch {}
    }
    await refreshUser()
    setApprovingSemester(null)
  }

  // Group by semester
  const semesters = subjects.reduce((acc, s) => {
    const sem = s.semester_suggested || 0
    if (!acc[sem]) acc[sem] = []
    acc[sem].push(s)
    return acc
  }, {} as Record<number, Subject[]>)

  const totalCredits = career?.total_credits || 0
  const approvedCredits = user?.total_approved_credits || 0
  const progress = totalCredits > 0 ? Math.round((approvedCredits / totalCredits) * 100) : 0

  if (!user?.career_id) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Configura tu perfil primero</h2>
        <p className="text-gray-500">
          Selecciona tu universidad y carrera en tu perfil para ver tu pensum.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Mi Pensum</h1>
        <p className="text-gray-500">{career?.name}</p>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Award className="h-6 w-6 text-accent" />
            <span className="font-semibold text-gray-900">Progreso Académico</span>
          </div>
          <span className="text-sm text-gray-500">
            {approvedCredits} / {totalCredits} créditos
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-gradient-to-r from-primary to-accent h-4 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-500">
          <span>{progress}% completado</span>
          <span>{subjects.filter((s) => approvedCodes.has(s.code)).length} / {subjects.length} materias</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-primary">{subjects.length}</p>
          <p className="text-xs text-gray-500">Total Materias</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{subjects.filter((s) => approvedCodes.has(s.code)).length}</p>
          <p className="text-xs text-gray-500">Aprobadas</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{subjects.filter((s) => !approvedCodes.has(s.code)).length}</p>
          <p className="text-xs text-gray-500">Pendientes</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-accent">{approvedCredits}</p>
          <p className="text-xs text-gray-500">Créditos Aprobados</p>
        </div>
      </div>

      {/* Semesters */}
      <div className="space-y-4">
        {Object.entries(semesters)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([sem, semSubjects]) => {
            const semNum = Number(sem)
            const isExpanded = expandedSemester === semNum
            const semApproved = semSubjects.filter((s) => approvingSemester === semNum
              ? true
              : approvedCodes.has(s.code)
            ).length
            const allApproved = semSubjects.every((s) => approvedCodes.has(s.code))
            const canApproveAll = !allApproved && semSubjects.some((s) => {
              return !approvedCodes.has(s.code) && s.prerequisites.every((p) => approvedCodes.has(p))
            })
            const isSemesterLoading = approvingSemester === semNum

            return (
              <div key={sem} className="bg-white rounded-2xl shadow-md overflow-hidden">
                {/* Semester header */}
                <div className="flex items-center">
                  <button
                    onClick={() => setExpandedSemester(isExpanded ? null : semNum)}
                    className="flex-1 px-6 py-4 flex items-center gap-3 hover:bg-gray-50 text-left"
                  >
                    {allApproved ? (
                      <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                    ) : (
                      <Target className="h-6 w-6 text-primary flex-shrink-0" />
                    )}
                    <span className="font-bold text-gray-900">Semestre {sem}</span>
                    <span className="text-sm text-gray-400">
                      ({semSubjects.filter(s => approvedCodes.has(s.code)).length}/{semSubjects.length} aprobadas)
                    </span>
                  </button>

                  {/* Approve-all semester button */}
                  {canApproveAll && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleApproveSemester(semNum, semSubjects)
                      }}
                      disabled={isSemesterLoading}
                      title="Aprobar todas las materias disponibles del semestre"
                      className="mr-3 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 rounded-lg disabled:opacity-50 transition-colors"
                    >
                      {isSemesterLoading ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <CheckSquare size={13} />
                      )}
                      {isSemesterLoading ? 'Aprobando...' : 'Aprobar semestre'}
                    </button>
                  )}

                  <button
                    onClick={() => setExpandedSemester(isExpanded ? null : semNum)}
                    className="pr-5 pl-2 py-4 text-gray-400 hover:bg-gray-50"
                  >
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="px-6 pb-4">
                    <div className="divide-y divide-gray-100">
                      {semSubjects.map((subject) => {
                        const isApproved = approvedCodes.has(subject.code)
                        const prereqsMet = subject.prerequisites.every((p) => approvedCodes.has(p))
                        const canApprove = !isApproved && prereqsMet
                        const isUnapproving = unapprovingCode === subject.code

                        return (
                          <div
                            key={subject._id}
                            className={`py-3 flex items-center justify-between gap-3 ${isApproved ? 'opacity-70' : ''}`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {isApproved ? (
                                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                              ) : (
                                <Circle className="h-5 w-5 text-gray-300 flex-shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className={`font-medium truncate ${isApproved ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                  {subject.name}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {subject.code} | {subject.credits} crédito{subject.credits !== 1 ? 's' : ''}
                                  {subject.prerequisites.length > 0 && (
                                    <span className="ml-2">
                                      Prelaciones: {subject.prerequisites.join(', ')}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              {isApproved ? (
                                /* Undo button */
                                <button
                                  onClick={() => handleUnapprove(subject.code)}
                                  disabled={isUnapproving}
                                  title="Deshacer aprobación"
                                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                                >
                                  {isUnapproving ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : (
                                    <RotateCcw size={12} />
                                  )}
                                  Deshacer
                                </button>
                              ) : (
                                /* Approve button */
                                <button
                                  onClick={() => handleApprove(subject.code)}
                                  disabled={!canApprove || approving === subject.code}
                                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                                    canApprove
                                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  }`}
                                  title={!prereqsMet ? 'Faltan prelaciones' : 'Marcar como aprobada'}
                                >
                                  {approving === subject.code ? (
                                    <span className="flex items-center gap-1">
                                      <Loader2 size={12} className="animate-spin" /> ...
                                    </span>
                                  ) : 'Aprobar'}
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
      </div>
    </div>
  )
}
