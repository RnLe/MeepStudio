import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, BookOpen, Download, Play, CheckCircle, Star, Target, Presentation, School } from 'lucide-react';

export default function StudentMaterialsPage() {
  const responsibilities = [
    {
      title: "Master Quantum Concepts",
      description: "Develop a solid understanding of fundamental quantum principles to effectively communicate them to school students.",
      icon: "🧠",
      skills: ["Quantum mechanics basics", "Superposition & entanglement", "Quantum computing principles", "Real-world applications"]
    },
    {
      title: "Presentation Excellence",
      description: "Deliver engaging and accessible presentations that capture the attention of young audiences.",
      icon: "🎯",
      skills: ["Public speaking", "Visual storytelling", "Interactive engagement", "Age-appropriate communication"]
    },
    {
      title: "Hands-on Demonstrations",
      description: "Conduct safe and exciting quantum experiments that make abstract concepts tangible and memorable.",
      icon: "🔬",
      skills: ["Laboratory safety", "Equipment handling", "Experiment explanation", "Problem-solving"]
    },
    {
      title: "Peer Education",
      description: "Act as a bridge between advanced academic knowledge and accessible youth education.",
      icon: "🌉",
      skills: ["Peer mentoring", "Knowledge translation", "Curriculum adaptation", "Feedback collection"]
    }
  ];

  const materials = [
    {
      title: "Q³ Student Handbook",
      description: "Comprehensive guide covering quantum fundamentals, presentation techniques, and program overview",
      type: "Digital Handbook",
      pages: "120 pages",
      icon: "📖",
      featured: true
    },
    {
      title: "Quantum Basics Brochure",
      description: "Student-friendly introduction to quantum technologies and their real-world applications",
      type: "PDF Brochure", 
      pages: "16 pages",
      icon: "📄"
    },
    {
      title: "School Visit Checklist",
      description: "Step-by-step preparation and execution guide for successful school presentations",
      type: "Checklist",
      pages: "8 pages",
      icon: "✅"
    },
    {
      title: "Emergency Protocols",
      description: "Safety procedures and emergency response guidelines for equipment and demonstrations",
      type: "Safety Guide",
      pages: "12 pages", 
      icon: "🚨"
    },
    {
      title: "Feedback Forms",
      description: "Standardized evaluation forms for collecting school and student feedback",
      type: "Form Bundle",
      pages: "6 forms",
      icon: "📊"
    },
    {
      title: "Q³ Certificate Template",
      description: "Official certificate template for students who complete the training program",
      type: "Certificate",
      pages: "1 page",
      icon: "🏆"
    }
  ];

  const presentationResources = [
    {
      title: "Quantum Fundamentals (Ages 15-16)",
      slides: 25,
      duration: "45 min",
      topics: ["What is quantum?", "Superposition basics", "Quantum vs classical"],
      difficulty: "Beginner"
    },
    {
      title: "Quantum Computing Introduction (Ages 16-17)",
      slides: 35,
      duration: "60 min", 
      topics: ["Qubits", "Quantum algorithms", "Future applications"],
      difficulty: "Intermediate"
    },
    {
      title: "Quantum Technologies Today (Ages 17-18)",
      slides: 40,
      duration: "75 min",
      topics: ["Current quantum tech", "Industry applications", "Career paths"],
      difficulty: "Advanced"
    }
  ];

  const bestPractices = [
    {
      title: "Pre-Visit Preparation",
      tips: [
        "Contact the school 2-3 weeks in advance",
        "Confirm equipment availability and room setup",
        "Prepare backup activities for technical issues",
        "Review school's science curriculum level"
      ]
    },
    {
      title: "During the Presentation",
      tips: [
        "Start with interactive ice-breaker questions",
        "Use analogies and visual aids effectively",
        "Encourage questions throughout the session",
        "Maintain energy and enthusiasm"
      ]
    },
    {
      title: "Student Engagement",
      tips: [
        "Relate quantum concepts to everyday experiences",
        "Use hands-on demonstrations when possible",
        "Create 'aha moments' through guided discovery",
        "Address misconceptions with patience"
      ]
    },
    {
      title: "Follow-up Activities",
      tips: [
        "Distribute take-home materials and resources",
        "Collect feedback forms from students and teachers",
        "Send thank-you message with additional resources",
        "Report visit outcomes to university coordinator"
      ]
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
                  <span className="hidden sm:inline">Quantum QrashQourse</span>
                </span>
              </Link>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-8 text-sm sm:text-base">
              <Link href="/q3" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap">
                Home
              </Link>
              <Link href="/q3/association" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap hidden sm:block">
                The Association
              </Link>
              <Link href="/q3/association" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap sm:hidden">
                Association
              </Link>
              <Link href="/q3/mini-games" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap hidden sm:block">
                Quantum Mini-Games
              </Link>
              <Link href="/q3/mini-games" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap sm:hidden">
                Games
              </Link>
              <Link href="/q3/university-materials" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap hidden md:block">
                University Materials
              </Link>
              <Link href="/q3/university-materials" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap md:hidden">
                Uni
              </Link>
              <Link href="/q3/student-materials" className="text-blue-600 dark:text-blue-400 font-medium whitespace-nowrap hidden md:block">
                Student Materials
              </Link>
              <Link href="/q3/student-materials" className="text-blue-600 dark:text-blue-400 font-medium whitespace-nowrap md:hidden">
                Student
              </Link>
              <Link href="/q3/events" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap">
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
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl mb-6">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-slate-800 dark:text-slate-100 mb-6">
              Student Materials
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-4xl mx-auto">
              Comprehensive resources for university students participating in the Q³ quantum 
              education outreach program. Everything you need to inspire the next generation.
            </p>
          </div>
        </div>
      </section>

      {/* Student Roles & Responsibilities */}
      <section className="py-16 bg-white/50 dark:bg-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-6">
              Your Role as a Quantum Ambassador
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              As a Q³ student ambassador, you bridge the gap between cutting-edge quantum research 
              and accessible youth education.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {responsibilities.map((responsibility, index) => (
              <div key={index} className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="text-4xl">{responsibility.icon}</div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                      {responsibility.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300">
                      {responsibility.description}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {responsibility.skills.map((skill, skillIndex) => (
                    <div key={skillIndex} className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-slate-600 dark:text-slate-300">{skill}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Downloadable Materials */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-6">
              Essential Resources & Materials
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Download everything you need to become an effective quantum educator
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {materials.map((material, index) => (
              <div key={index} className={`bg-white dark:bg-slate-900 rounded-xl p-6 shadow-lg border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                material.featured 
                  ? 'border-blue-200 dark:border-blue-700 ring-2 ring-blue-100 dark:ring-blue-900/30' 
                  : 'border-slate-200 dark:border-slate-700'
              }`}>
                {material.featured && (
                  <div className="flex items-center justify-between mb-4">
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium px-2 py-1 rounded-full flex items-center">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-4">
                  <div className="text-4xl mb-3">{material.icon}</div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                    {material.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                    {material.description}
                  </p>
                  <div className="flex items-center justify-center space-x-4 text-xs text-slate-500 dark:text-slate-400 mb-4">
                    <span>{material.type}</span>
                    <span>•</span>
                    <span>{material.pages}</span>
                  </div>
                </div>
                
                <button className={`w-full px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center ${
                  material.featured
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Presentation Templates */}
      <section className="py-16 bg-white/50 dark:bg-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-6">
              Presentation Templates & Scripts
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Age-appropriate presentation materials designed for maximum engagement and learning impact
            </p>
          </div>

          <div className="space-y-6">
            {presentationResources.map((resource, index) => (
              <div key={index} className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                        <Presentation className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                          {resource.title}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-300">
                          <span>{resource.slides} slides</span>
                          <span>•</span>
                          <span>{resource.duration}</span>
                          <span>•</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            resource.difficulty === 'Beginner' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                            resource.difficulty === 'Intermediate' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                            'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          }`}>
                            {resource.difficulty}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {resource.topics.map((topic, topicIndex) => (
                        <span key={topicIndex} className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded-md">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center">
                      <Play className="w-4 h-4 mr-2" />
                      Preview
                    </button>
                    <button className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Best Practices */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-6">
              Best Practices for Successful Engagement
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Proven strategies and tips for creating memorable and impactful quantum education experiences
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {bestPractices.map((practice, index) => (
              <div key={index} className="bg-white dark:bg-slate-900 rounded-xl p-8 shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    {practice.title}
                  </h3>
                </div>
                <ul className="space-y-3">
                  {practice.tips.map((tip, tipIndex) => (
                    <li key={tipIndex} className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-600 dark:text-slate-300">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Get Started */}
      <section className="py-16 bg-gradient-to-r from-green-500 to-green-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Inspire Young Minds?
          </h2>
          <p className="text-xl text-green-100 mb-10">
            Download your starter pack and begin your journey as a quantum education ambassador
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="inline-flex items-center justify-center px-8 py-4 bg-white text-green-600 font-semibold rounded-xl hover:bg-green-50 transition-all duration-300 shadow-lg hover:shadow-xl">
              <Download className="w-5 h-5 mr-2" />
              Download Complete Starter Pack
            </button>
            <Link href="/q3/mini-games" className="inline-flex items-center justify-center px-8 py-4 bg-green-400 text-white font-semibold rounded-xl border-2 border-white/20 hover:bg-green-300 transition-all duration-300">
              <School className="w-5 h-5 mr-2" />
              Practice with Mini-Games
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
