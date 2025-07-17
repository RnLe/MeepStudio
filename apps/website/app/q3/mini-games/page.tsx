import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, Download, BookOpen, Gamepad2, Brain, Zap } from 'lucide-react';

export default function MiniGamesPage() {
  const games = [
    {
      id: 'tiq-taq-toe',
      title: 'Tiq-Taq-Toe',
      description: 'Quantum Tic-Tac-Toe introducing superposition and entanglement concepts',
      concepts: ['Superposition', 'Entanglement', 'Quantum States'],
      available: true,
      icon: '🎯',
      gradient: 'from-blue-400 to-blue-600',
      link: 'https://tiqtaqtoe.nl/' // Real Tiq-Taq-Toe game
    },
    {
      id: 'quantum-memory',
      title: 'Quantum Memory',
      description: 'Memory game demonstrating quantum states and matching quantum concepts',
      concepts: ['Quantum Memory', 'State Matching', 'Coherence'],
      available: false,
      icon: '🧠',
      gradient: 'from-purple-400 to-purple-600'
    },
    {
      id: 'quantum-labyrinth',
      title: 'Quantum Labyrinth',
      description: 'Navigate quantum principles to solve puzzles and advance through levels',
      concepts: ['Quantum Tunneling', 'Wave Functions', 'Interference'],
      available: false,
      icon: '🌀',
      gradient: 'from-green-400 to-green-600'
    },
    {
      id: 'quantum-simulator',
      title: 'Quantum Circuit Simulator',
      description: 'Build and test quantum circuits with visual feedback',
      concepts: ['Quantum Gates', 'Circuit Design', 'Measurement'],
      available: false,
      icon: '⚡',
      gradient: 'from-orange-400 to-orange-600'
    },
    {
      id: 'quantum-race',
      title: 'Quantum Race',
      description: 'Race through quantum challenges using quantum speedup',
      concepts: ['Quantum Speedup', 'Algorithms', 'Parallelism'],
      available: false,
      icon: '🏁',
      gradient: 'from-red-400 to-red-600'
    },
    {
      id: 'quantum-puzzles',
      title: 'Quantum Puzzles',
      description: 'Solve mind-bending puzzles based on quantum mechanics',
      concepts: ['Quantum Logic', 'Problem Solving', 'Paradoxes'],
      available: false,
      icon: '🧩',
      gradient: 'from-indigo-400 to-indigo-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link href="/q3" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">Q³</span>
                </div>
                <span className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                  Quantum QrashQourse
                </span>
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/q3" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Home
              </Link>
              <Link href="/q3/association" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                The Association
              </Link>
              <Link href="/q3/mini-games" className="text-blue-600 dark:text-blue-400 font-medium">
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

      {/* Header */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/q3" className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl mb-6">
              <Gamepad2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-slate-800 dark:text-slate-100 mb-6">
              Quantum Mini-Games
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-4xl mx-auto">
              Interactive educational games that make quantum concepts accessible and fun. 
              Learn quantum mechanics through hands-on experimentation and play.
            </p>
          </div>
        </div>
      </section>

      {/* Game Cards */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {games.map((game, index) => (
              <div key={game.id} className="group">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-3 border border-slate-200 dark:border-slate-700 h-full flex flex-col">
                  {/* Game Icon and Status */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-16 h-16 bg-gradient-to-br ${game.gradient} rounded-xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      {game.icon}
                    </div>
                    <div className="flex items-center space-x-2">
                      {game.available ? (
                        <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium px-2 py-1 rounded-full">
                          Available
                        </span>
                      ) : (
                        <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs font-medium px-2 py-1 rounded-full">
                          Coming Soon
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Game Info */}
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {game.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-4 flex-grow">
                    {game.description}
                  </p>

                  {/* Quantum Concepts */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center">
                      <Brain className="w-4 h-4 mr-2" />
                      Quantum Concepts
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {game.concepts.map((concept) => (
                        <span 
                          key={concept}
                          className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded-md border border-blue-200 dark:border-blue-700"
                        >
                          {concept}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">                      {game.available ? (
                        <>                          <a 
                            href={game.link || '#'} 
                            target={game.link?.startsWith('http') ? '_blank' : '_self'}
                            rel={game.link?.startsWith('http') ? 'noopener noreferrer' : undefined}
                            className={`w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r ${game.gradient} text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 group-hover:scale-105`}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Play Now
                          </a>
                        <button className="w-full inline-flex items-center justify-center px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                          <Download className="w-4 h-4 mr-2" />
                          Download Guide
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          disabled
                          className="w-full inline-flex items-center justify-center px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-semibold rounded-xl cursor-not-allowed"
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          Coming Soon
                        </button>
                        <button className="w-full inline-flex items-center justify-center px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                          <BookOpen className="w-4 h-4 mr-2" />
                          Preview Concepts
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Educational Resources */}
      <section className="py-16 bg-white/50 dark:bg-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-6">
              Educational Resources
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Comprehensive guides and materials to enhance your quantum learning experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-3">
                Game Manuals
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Detailed guides explaining quantum concepts taught by each game
              </p>
              <button className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                Download All
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-3">
                Concept Explanations
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Simple explanations of complex quantum phenomena for young learners
              </p>
              <button className="bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-4 py-2 rounded-lg font-medium hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors">
                Explore
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Gamepad2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-3">
                Classroom Integration
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Guidelines for using games in educational settings and workshops
              </p>
              <button className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-4 py-2 rounded-lg font-medium hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-6">
            Ready to Quantum Leap?
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-10">
            Start your quantum journey with our interactive games and educational resources
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://tiqtaqtoe.nl/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl">
              <Play className="w-5 h-5 mr-2" />
              Play Tiq-Taq-Toe
            </a>
            <Link href="/q3/student-materials" className="inline-flex items-center justify-center px-8 py-4 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold rounded-xl border-2 border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300">
              View All Resources
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
