import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2, Users, Target, Euro, CheckCircle, Globe, Shield, Zap } from 'lucide-react';

export default function AssociationPage() {
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
              <Link href="/q3/association" className="text-blue-600 dark:text-blue-400 font-medium">
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

      {/* Header */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/q3" className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-5xl font-bold text-slate-800 dark:text-slate-100 mb-6">
            The Association
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-4xl">
            Learn about our structure, mission, and the strategic decisions that drive the 
            Quantum QrashQourse Association forward.
          </p>
        </div>
      </section>

      {/* Why AISBL */}
      <section className="py-16 bg-white/50 dark:bg-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-6">
                Why We Chose AISBL
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
                We selected the AISBL (Association Internationale Sans But Lucratif) structure 
                as the optimal foundation for our European quantum education initiative.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
                      International Recognition
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300">
                      Clear international legal recognition within the EU, enabling seamless cross-border operations.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Euro className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
                      Funding Access
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300">
                      Effective access to European funding mechanisms including Horizon Europe and Quantum Flagship programs.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
                      Streamlined Operations
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300">
                      Streamlined cross-border operations and collaboration with stable governance framework.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
                      Moderate Administration
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300">
                      Stable governance with moderate administrative requirements, allowing focus on core mission.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-100 to-slate-100 dark:from-blue-900/30 dark:to-slate-900/30 rounded-2xl p-8 border border-slate-200 dark:border-slate-700">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  AISBL Structure
                </h3>
              </div>
              <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Non-profit international association</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Belgian law with EU recognition</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Tax-exempt status</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Limited liability for members</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Professional governance structure</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Association Hierarchy */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-6">
              Association Hierarchy
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Our governance structure ensures democratic decision-making while maintaining 
              operational efficiency across all activities.
            </p>
          </div>

          <div className="space-y-8">
            {/* General Assembly */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    General Assembly
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">All members</p>
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                The highest authority of the association, comprising all members. Responsible for approving 
                annual plans, budget allocation, and electing the Board of Directors. Meets annually to 
                review progress and set strategic direction.
              </p>
            </div>

            {/* Board of Directors */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 ml-8">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    Board of Directors
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">Elected leadership</p>
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                Oversees strategic direction, manages budget allocation, and coordinates partnerships 
                with universities, research institutions, and funding bodies. Ensures alignment with 
                the association's mission and objectives.
              </p>
            </div>

            {/* Administrative Staff */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 ml-16">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    Administrative Staff
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">Operations team</p>
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                Manages daily operations including resource management, website maintenance, funding 
                applications, and coordination between universities and schools. Ensures smooth 
                execution of all programs and initiatives.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Funding Sources */}
      <section className="py-16 bg-white/50 dark:bg-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-6">
              Funding Sources
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Diverse funding streams ensure the sustainability and growth of our quantum education mission.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Euro className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
                European Commission
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Horizon Europe, Quantum Flagship programs
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
                Corporate Partners
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Tech companies with quantum computing interests
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
                Foundation Grants
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Science and Education Foundation support
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
                University Contributions
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Member institution participation fees
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Responsibilities and Roles */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-6">
              Responsibilities and Roles
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Clear division of responsibilities ensures effective execution across all levels of our organization.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Association Responsibilities */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-8 border border-blue-200 dark:border-blue-700">
              <h3 className="text-2xl font-bold text-blue-800 dark:text-blue-200 mb-6">
                Association (Q³)
              </h3>
              <ul className="space-y-4 text-slate-700 dark:text-slate-300">
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>Maintains centralized resources and frameworks</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>Coordinates strategic partnerships and funding</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>Standardizes educational content and procedures</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>Ensures quality control and compliance</span>
                </li>
              </ul>
            </div>

            {/* University Responsibilities */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-8 border border-purple-200 dark:border-purple-700">
              <h3 className="text-2xl font-bold text-purple-800 dark:text-purple-200 mb-6">
                Universities
              </h3>
              <ul className="space-y-4 text-slate-700 dark:text-slate-300">
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                  <span>Manage student recruitment and training</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                  <span>Organize logistics for school visits</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                  <span>Report feedback and performance metrics</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                  <span>Contribute equipment for experiments</span>
                </li>
              </ul>
            </div>

            {/* Student/School Responsibilities */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-8 border border-green-200 dark:border-green-700">
              <h3 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-6">
                Students/Schools
              </h3>
              <ul className="space-y-4 text-slate-700 dark:text-slate-300">
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Actively engage with materials and workshops</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Provide feedback on content and structure</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Facilitate peer-to-peer quantum awareness</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Support knowledge transfer initiatives</span>
                </li>
              </ul>
            </div>
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
