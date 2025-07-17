import React from 'react';
import Link from 'next/link';
import { ArrowLeft, GraduationCap, Users, FileText, CheckCircle, Download, Phone, Mail, Calendar, Lightbulb } from 'lucide-react';

export default function UniversityMaterialsPage() {
  const steps = [
    {
      number: "01",
      title: "Initial Contact",
      description: "Reach out to our partnership team to express your university's interest in joining the Q³ Association.",
      action: "Contact us"
    },
    {
      number: "02", 
      title: "Evaluation Process",
      description: "We evaluate your institution's capacity for quantum education outreach and student program management.",
      action: "Assessment"
    },
    {
      number: "03",
      title: "Partnership Agreement",
      description: "Sign the formal partnership agreement outlining responsibilities, contributions, and program guidelines.",
      action: "Agreement"
    },
    {
      number: "04",
      title: "Resource Access",
      description: "Gain access to our comprehensive educational resources, training materials, and support systems.",
      action: "Onboarding"
    },
    {
      number: "05",
      title: "Student Training",
      description: "Begin recruiting and training students using our standardized curriculum and best practices.",
      action: "Launch"
    }
  ];

  const responsibilities = [
    {
      title: "Student Recruitment",
      description: "Identify and recruit suitable students for the quantum outreach program",
      icon: Users,
      details: [
        "Target physics, engineering, and computer science students",
        "Assess communication and presentation skills",
        "Ensure students have foundational quantum knowledge",
        "Maintain a diverse and representative student body"
      ]
    },
    {
      title: "Training Management",
      description: "Oversee student training using Q³ standardized materials and procedures",
      icon: GraduationCap,
      details: [
        "Implement our certified training curriculum",
        "Organize practice presentation sessions",
        "Coordinate with schools for visit scheduling",
        "Monitor student progress and performance"
      ]
    },
    {
      title: "Logistics Coordination",
      description: "Manage all operational aspects of school visits and workshops",
      icon: Calendar,
      details: [
        "Schedule and coordinate school visits",
        "Arrange transportation for students and equipment",
        "Ensure safety protocols are followed",
        "Handle emergency situations and contingencies"
      ]
    },
    {
      title: "Performance Reporting",
      description: "Provide regular feedback and metrics to the Q³ Association",
      icon: FileText,
      details: [
        "Submit quarterly activity reports",
        "Collect feedback from schools and students",
        "Track educational impact metrics",
        "Participate in annual assessment reviews"
      ]
    }
  ];

  const resources = [
    {
      title: "Training Curriculum",
      description: "Comprehensive 40-hour training program for student educators",
      type: "PDF Package",
      size: "25 MB",
      icon: "📚"
    },
    {
      title: "Presentation Templates",
      description: "Standardized slide decks covering fundamental quantum concepts",
      type: "PowerPoint Bundle",
      size: "15 MB", 
      icon: "📊"
    },
    {
      title: "Experiment Guides",
      description: "Step-by-step instructions for hands-on quantum demonstrations",
      type: "Manual Set",
      size: "8 MB",
      icon: "🔬"
    },
    {
      title: "Assessment Tools",
      description: "Pre and post-visit evaluation forms and learning metrics",
      type: "Form Collection",
      size: "3 MB",
      icon: "📋"
    },
    {
      title: "Safety Protocols",
      description: "Comprehensive safety guidelines for equipment and demonstrations",
      type: "Documentation",
      size: "5 MB",
      icon: "🛡️"
    },
    {
      title: "Branding Guidelines",
      description: "Q³ visual identity standards and promotional materials",
      type: "Design Package",
      size: "12 MB",
      icon: "🎨"
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
              <Link href="/q3/mini-games" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Quantum Mini-Games
              </Link>
              <Link href="/q3/university-materials" className="text-blue-600 dark:text-blue-400 font-medium">
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
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-slate-800 dark:text-slate-100 mb-6">
              University Materials
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-4xl mx-auto">
              Everything your university needs to join the Q³ Association and launch 
              a successful quantum education outreach program.
            </p>
          </div>
        </div>
      </section>

      {/* How to Opt-In */}
      <section className="py-16 bg-white/50 dark:bg-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-6">
              How to Join Q³
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              A streamlined process designed to get your university up and running with minimal complexity
            </p>
          </div>

          <div className="space-y-8">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {step.number}
                  </div>
                </div>
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                        {step.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-300 mb-4">
                        {step.description}
                      </p>
                    </div>
                    <div className="ml-6">
                      <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-lg font-medium">
                        {step.action}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* University Responsibilities */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-6">
              University Responsibilities
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Clear expectations ensure program success and maintain Q³ quality standards
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {responsibilities.map((responsibility, index) => {
              const IconComponent = responsibility.icon;
              return (
                <div key={index} className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                        {responsibility.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-300">
                        {responsibility.description}
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {responsibility.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-600 dark:text-slate-300">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Teaching Resources */}
      <section className="py-16 bg-white/50 dark:bg-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-6">
              Teaching Resources & Workshop Materials
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Comprehensive materials to support your quantum education program
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource, index) => (
              <div key={index} className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-3">{resource.icon}</div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                    {resource.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                    {resource.description}
                  </p>
                  <div className="flex items-center justify-center space-x-4 text-xs text-slate-500 dark:text-slate-400 mb-4">
                    <span>{resource.type}</span>
                    <span>•</span>
                    <span>{resource.size}</span>
                  </div>
                </div>
                <button className="w-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center justify-center">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact & Support */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-6">
              Contact & Support
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Our dedicated team is ready to support your university's quantum education journey
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                Partnership Inquiries
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Start the conversation about joining Q³
              </p>
              <a href="mailto:partnerships@q3association.eu" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                partnerships@q3association.eu
              </a>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                Program Support
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Technical assistance and program guidance
              </p>
              <a href="tel:+3202XXXXXXX" className="text-green-600 dark:text-green-400 font-medium hover:underline">
                +32 (0) 2 XXX XXXX
              </a>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Lightbulb className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                Innovation Hub
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Contribute ideas and educational innovations
              </p>
              <a href="mailto:innovation@q3association.eu" className="text-purple-600 dark:text-purple-400 font-medium hover:underline">
                innovation@q3association.eu
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-blue-500 to-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Shape Quantum Education?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Join leading European universities in building the next generation of quantum-literate citizens
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:partnerships@q3association.eu"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Mail className="w-5 h-5 mr-2" />
              Start Partnership Discussion
            </a>
            <button className="inline-flex items-center justify-center px-8 py-4 bg-blue-400 text-white font-semibold rounded-xl border-2 border-white/20 hover:bg-blue-300 transition-all duration-300">
              <Download className="w-5 h-5 mr-2" />
              Download Information Pack
            </button>
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
