import React from 'react'
import { GraduationCap } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-primary-dark text-white/70 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-accent" />
            <span className="font-semibold text-white">Guía Estudiantil</span>
          </div>
          <div className="flex gap-8 text-sm">
            <span>UCAB</span>
            <span>UNIMET</span>
          </div>
          <p className="text-sm">
            &copy; {new Date().getFullYear()} Guía Estudiantil. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
