import React from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Calendar, MessageSquare, TrendingUp, GraduationCap, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const features = [
  {
    icon: BookOpen,
    title: 'Seguimiento de Pensum',
    desc: 'Visualiza tu avance académico, marca materias aprobadas y conoce tus prelaciones.',
  },
  {
    icon: Calendar,
    title: 'Planificación de Horarios',
    desc: 'Organiza tus próximos semestres con materias tentativas y genera horarios óptimos.',
  },
  {
    icon: MessageSquare,
    title: 'Reseñas Anónimas',
    desc: 'Comparte y consulta opiniones sobre materias y profesores de forma anónima.',
  },
  {
    icon: TrendingUp,
    title: 'Análisis Inteligente',
    desc: 'Recibe sugerencias basadas en tu progreso, dificultad y objetivos académicos.',
  },
]

export default function Home() {
  const { user } = useAuth()

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary via-primary-light to-primary-dark text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-accent rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex justify-center mb-6">
              <GraduationCap className="h-16 w-16 text-accent" />
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
              Tu Guía Académica
              <span className="block text-accent mt-2">Universitaria</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-10 leading-relaxed">
              Planifica tu carrera de forma inteligente. Seguimiento de pensum, horarios optimizados
              y reseñas de la comunidad estudiantil para la UCAB y la UNIMET.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link
                  to="/pensum"
                  className="px-8 py-3.5 bg-accent text-primary-dark font-bold rounded-xl hover:bg-amber-400 shadow-lg flex items-center justify-center gap-2"
                >
                  Ir a Mi Pensum <ChevronRight size={20} />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="px-8 py-3.5 bg-accent text-primary-dark font-bold rounded-xl hover:bg-amber-400 shadow-lg flex items-center justify-center gap-2"
                  >
                    Comenzar Ahora <ChevronRight size={20} />
                  </Link>
                  <Link
                    to="/login"
                    className="px-8 py-3.5 bg-white/10 backdrop-blur text-white font-semibold rounded-xl hover:bg-white/20 border border-white/20"
                  >
                    Ya tengo cuenta
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Universities */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
        <div className="grid md:grid-cols-2 gap-6">
          {/* UCAB Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-ucab-green hover:shadow-2xl cursor-pointer">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-ucab-green/10 rounded-xl flex items-center justify-center">
                <span className="text-ucab-green font-extrabold text-lg">UCAB</span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">Universidad Católica Andrés Bello</h3>
                <p className="text-sm text-gray-500">Sistema Semestral</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm">
              Accede al pensum de todas las carreras de la UCAB, planifica tus semestres y consulta reseñas.
            </p>
          </div>

          {/* UNIMET Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-unimet-blue hover:shadow-2xl cursor-pointer">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-unimet-blue/10 rounded-xl flex items-center justify-center">
                <span className="text-unimet-blue font-extrabold text-lg">UNIMET</span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">Universidad Metropolitana</h3>
                <p className="text-sm text-gray-500">Sistema Trimestral</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm">
              Explora los programas de la UNIMET, marca tu progreso y organiza tus trimestres.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
            Todo lo que necesitas para tu vida académica
          </h2>
          <p className="mt-4 text-gray-500 text-lg max-w-2xl mx-auto">
            Herramientas diseñadas por y para estudiantes universitarios venezolanos.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl group"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-accent/20">
                <f.icon className="h-6 w-6 text-primary group-hover:text-accent" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
