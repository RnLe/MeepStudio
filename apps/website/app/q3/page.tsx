import React from 'react';
import Link from 'next/link';
import { ChevronRight, Users, Lightbulb, GraduationCap, School } from 'lucide-react';

export default function Q3HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">Q³</span>
              </div>
              <span className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                Quantum QrashQourse
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/q3" className="text-blue-600 dark:text-blue-400 font-medium">
                Home
              </Link>
              <Link href="/q3/association" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                The Association
              </Link>
              <Link href="/q3/mini-games" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Quantum Mini-Games
              </Link>
              <Link href="/q3/university-materials" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                University Materials
              </Link>
              <Link href="/q3/student-materials" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Student Materials
              </Link>
              <Link href="/q3/events" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Events
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-100/20 to-slate-100/20 dark:from-blue-900/20 dark:to-slate-900/20"></div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl mb-6 shadow-lg">
              <span className="text-white font-bold text-3xl">Q³</span>
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-800 dark:text-slate-100 mb-6">
            Quantum QrashQourse
          </h1>
          <blockquote className="text-2xl md:text-3xl text-blue-600 dark:text-blue-400 font-medium mb-8 italic">
            "Empowering young minds to explore and understand quantum technologies."
          </blockquote>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-4xl mx-auto leading-relaxed">
            Welcome to Quantum QrashQourse (Q³), an international initiative dedicated to promoting 
            quantum technology literacy among students aged 15–18. We provide comprehensive, engaging 
            resources and support for universities and students to foster curiosity and understanding 
            about quantum mechanics, computing, and technologies.
          </p>
        </div>
      </section>

      {/* Three Layer Approach */}
      <section className="py-20 bg-white/50 dark:bg-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-4">
              Our Three-Layer Approach
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Building quantum awareness through strategic partnerships across Europe
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Association Layer */}
            <div className="group">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:-translate-y-2 border border-slate-200 dark:border-slate-700">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                  Association Layer
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                  The Q³ Association organizes and standardizes materials, procedures, and connections. 
                  As an AISBL, we ensure quality control and compliance with educational standards across Europe.
                </p>
                <Link href="/q3/association" className="inline-flex items-center text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                  Learn more <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>

            {/* University Layer */}
            <div className="group">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:-translate-y-2 border border-slate-200 dark:border-slate-700">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-400 to-slate-600 rounded-xl flex items-center justify-center mb-6">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                  University Layer
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                  Universities and research institutes join as members, receiving guidelines for student 
                  recruitment and training. They also contribute equipment and facilitate school communication.
                </p>
                <Link href="/q3/university-materials" className="inline-flex items-center text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                  Join us <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>

            {/* Student Layer */}
            <div className="group">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:-translate-y-2 border border-slate-200 dark:border-slate-700">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mb-6">
                  <School className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                  Student Layer
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                  The bridge between universities and schools. Students visit schools to deliver engaging 
                  presentations and interactive experiments, spreading quantum awareness among peers.
                </p>
                <Link href="/q3/student-materials" className="inline-flex items-center text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                  Get involved <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-6">
            Ready to Explore Quantum?
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-10">
            Join our mission to make quantum technologies accessible to the next generation
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/q3/mini-games" className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl">
              <Lightbulb className="w-5 h-5 mr-2" />
              Try Mini-Games
            </Link>
            <Link href="/q3/association" className="inline-flex items-center justify-center px-8 py-4 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold rounded-xl border-2 border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300">
              Learn About Us
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-slate-950 text-slate-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">Q³</span>
                </div>
                <span className="text-xl font-semibold text-white">
                  Quantum QrashQourse Association
                </span>
              </div>
              <p className="text-slate-400 mb-4">
                Empowering young minds across Europe to explore quantum technologies through education, 
                engagement, and hands-on learning experiences.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact Information</h4>
              <p className="text-slate-400 text-sm">Email: info@q3association.eu</p>
              <p className="text-slate-400 text-sm">Phone: +32 (0) 2 XXX XXXX</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <Link href="/q3/privacy" className="text-slate-400 text-sm hover:text-white transition-colors block mb-2">
                Privacy Policy
              </Link>
              <p className="text-slate-400 text-sm">EU Funding Acknowledgment</p>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center">
            <p className="text-slate-400 text-sm">
              © 2025 Quantum QrashQourse Association (AISBL). All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
