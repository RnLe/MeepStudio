'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, Users, Clock, ExternalLink, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  institute: string;
  location: string;
  country: string;
  targetGroup: string;
  date: Date;
  endDate?: Date;
  duration: string;
  applicationLink: string;
  category: 'workshop' | 'seminar' | 'lab-visit' | 'competition';
  maxParticipants: number;
  level: 'beginner' | 'intermediate' | 'advanced';
}

export default function EventsPage() {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);
  const [calendarStartMonth, setCalendarStartMonth] = useState<number>(new Date().getMonth());
  const [calendarStartYear, setCalendarStartYear] = useState<number>(new Date().getFullYear());

  // Generate events with floating dates starting from today
  const events: Event[] = useMemo(() => {
    const today = new Date();
    const baseEvents = [
      {
        id: '1',
        title: 'Quantum Computing Workshop for Students',
        description: 'Hands-on introduction to quantum computing principles using IBM Qiskit. Students will learn about qubits, quantum gates, and basic algorithms.',
        institute: 'CERN (European Organization for Nuclear Research)',
        location: 'Geneva',
        country: 'Switzerland',
        targetGroup: 'Ages 16-18',
        daysFromToday: 15,
        duration: '3 days',
        applicationLink: 'https://home.cern',
        category: 'workshop' as const,
        maxParticipants: 25,
        level: 'beginner' as const
      },
      {
        id: '2',
        title: 'Quantum Cryptography Seminar',
        description: 'Advanced seminar on quantum key distribution and quantum security protocols. Perfect for students interested in cybersecurity applications.',
        institute: 'Max Planck Institute for Quantum Optics',
        location: 'Garching',
        country: 'Germany',
        targetGroup: 'Ages 17-18',
        daysFromToday: 32,
        duration: '1 day',
        applicationLink: 'https://www.mpq.mpg.de',
        category: 'seminar' as const,
        maxParticipants: 40,
        level: 'advanced' as const
      },
      {
        id: '3',
        title: 'Laboratory Visit: Quantum Materials',
        description: 'Exclusive laboratory tour and hands-on experiments with superconducting quantum devices and dilution refrigerators.',
        institute: 'QuTech (Delft University of Technology)',
        location: 'Delft',
        country: 'Netherlands',
        targetGroup: 'Ages 15-17',
        daysFromToday: 45,
        duration: 'Half day',
        applicationLink: 'https://qutech.nl',
        category: 'lab-visit' as const,
        maxParticipants: 15,
        level: 'intermediate' as const
      },
      {
        id: '4',
        title: 'European Quantum Challenge',
        description: 'International competition where teams solve real quantum computing problems. Prizes and mentorship from leading quantum researchers.',
        institute: 'Quantum Flagship (European Commission)',
        location: 'Barcelona',
        country: 'Spain',
        targetGroup: 'Ages 16-18',
        daysFromToday: 67,
        duration: '2 days',
        applicationLink: 'https://qt.eu',
        category: 'competition' as const,
        maxParticipants: 100,
        level: 'advanced' as const
      },
      {
        id: '5',
        title: 'Quantum Sensing Workshop',
        description: 'Learn about quantum sensors and their applications in navigation, medical imaging, and fundamental physics research.',
        institute: 'Institute for Quantum Computing (University of Vienna)',
        location: 'Vienna',
        country: 'Austria',
        targetGroup: 'Ages 15-18',
        daysFromToday: 89,
        duration: '2 days',
        applicationLink: 'https://www.univie.ac.at',
        category: 'workshop' as const,
        maxParticipants: 30,
        level: 'beginner' as const
      },
      {
        id: '6',
        title: 'Quantum Communication Networks',
        description: 'Seminar on quantum internet and secure communication networks. Includes practical demonstrations of quantum entanglement.',
        institute: 'École Polytechnique',
        location: 'Palaiseau',
        country: 'France',
        targetGroup: 'Ages 17-18',
        daysFromToday: 112,
        duration: '1 day',
        applicationLink: 'https://www.polytechnique.edu',
        category: 'seminar' as const,
        maxParticipants: 35,
        level: 'intermediate' as const
      },
      {
        id: '7',
        title: 'Quantum Algorithms Bootcamp',
        description: 'Intensive programming workshop covering Shor\'s algorithm, Grover\'s search, and quantum machine learning algorithms.',
        institute: 'University of Cambridge (Centre for Quantum Computing)',
        location: 'Cambridge',
        country: 'United Kingdom',
        targetGroup: 'Ages 16-18',
        daysFromToday: 134,
        duration: '4 days',
        applicationLink: 'https://www.cam.ac.uk',
        category: 'workshop' as const,
        maxParticipants: 20,
        level: 'advanced' as const
      },
      {
        id: '8',
        title: 'Quantum Physics Lab Experience',
        description: 'Hands-on experiments with single photons, quantum interference, and Bell\'s inequality tests using professional laboratory equipment.',
        institute: 'KTH Royal Institute of Technology',
        location: 'Stockholm',
        country: 'Sweden',
        targetGroup: 'Ages 15-17',
        daysFromToday: 156,
        duration: '1 day',
        applicationLink: 'https://www.kth.se',
        category: 'lab-visit' as const,
        maxParticipants: 18,
        level: 'intermediate' as const
      },
      {
        id: '9',
        title: 'Quantum Technologies Summer School',
        description: 'Week-long intensive program covering all aspects of quantum technologies, from theory to industrial applications.',
        institute: 'ETH Zurich',
        location: 'Zurich',
        country: 'Switzerland',
        targetGroup: 'Ages 17-18',
        daysFromToday: 178,
        duration: '5 days',
        applicationLink: 'https://ethz.ch',
        category: 'workshop' as const,
        maxParticipants: 50,
        level: 'advanced' as const
      },
      {
        id: '10',
        title: 'Quantum Computing Career Fair',
        description: 'Meet representatives from leading quantum technology companies and research institutions. Learn about career paths in quantum technologies.',
        institute: 'University of Copenhagen (Niels Bohr Institute)',
        location: 'Copenhagen',
        country: 'Denmark',
        targetGroup: 'Ages 16-18',
        daysFromToday: 201,
        duration: 'Half day',
        applicationLink: 'https://www.nbi.ku.dk',
        category: 'seminar' as const,
        maxParticipants: 200,
        level: 'beginner' as const
      },
      {
        id: '11',
        title: 'Quantum Error Correction Workshop',
        description: 'Advanced workshop on quantum error correction codes and fault-tolerant quantum computing. Essential for future quantum engineers.',
        institute: 'IBM Research Zurich',
        location: 'Rüschlikon',
        country: 'Switzerland',
        targetGroup: 'Ages 17-18',
        daysFromToday: 223,
        duration: '2 days',
        applicationLink: 'https://www.research.ibm.com',
        category: 'workshop' as const,
        maxParticipants: 25,
        level: 'advanced' as const
      },
      {
        id: '12',
        title: 'Quantum Simulation and Many-Body Physics',
        description: 'Learn how quantum computers can simulate complex physical systems. Includes sessions on quantum chemistry and materials science.',
        institute: 'University of Innsbruck (Institute for Quantum Optics)',
        location: 'Innsbruck',
        country: 'Austria',
        targetGroup: 'Ages 16-18',
        daysFromToday: 245,
        duration: '3 days',
        applicationLink: 'https://www.uibk.ac.at',
        category: 'workshop' as const,
        maxParticipants: 30,
        level: 'intermediate' as const
      },
      {
        id: '13',
        title: 'European Quantum Talent Competition',
        description: 'Prestigious competition for the most promising young quantum talents. Winners receive scholarships and mentorship programs.',
        institute: 'Quantum European Alliance',
        location: 'Brussels',
        country: 'Belgium',
        targetGroup: 'Ages 15-18',
        daysFromToday: 267,
        duration: '3 days',
        applicationLink: 'https://qt.eu',
        category: 'competition' as const,
        maxParticipants: 75,
        level: 'advanced' as const
      },
      {
        id: '14',
        title: 'Quantum Metrology and Precision Measurements',
        description: 'Workshop on using quantum effects for ultra-precise measurements. Applications in gravitational wave detection and atomic clocks.',
        institute: 'Physikalisch-Technische Bundesanstalt (PTB)',
        location: 'Braunschweig',
        country: 'Germany',
        targetGroup: 'Ages 16-18',
        daysFromToday: 289,
        duration: '2 days',
        applicationLink: 'https://www.ptb.de',
        category: 'workshop' as const,
        maxParticipants: 20,
        level: 'intermediate' as const
      },
      {
        id: '15',
        title: 'Quantum Information Theory Seminar',
        description: 'Mathematical foundations of quantum information. Perfect for students planning to study physics or computer science at university.',
        institute: 'Trinity College Dublin',
        location: 'Dublin',
        country: 'Ireland',
        targetGroup: 'Ages 17-18',
        daysFromToday: 312,
        duration: '1 day',
        applicationLink: 'https://www.tcd.ie',
        category: 'seminar' as const,
        maxParticipants: 40,
        level: 'advanced' as const
      }
    ];

    return baseEvents.map(event => {
      const eventDate = new Date(today);
      eventDate.setDate(eventDate.getDate() + event.daysFromToday);
      
      // Calculate end date based on duration
      const endDate = new Date(eventDate);
      const durationDays = event.duration.toLowerCase().includes('day') ? 
        parseInt(event.duration.match(/\d+/)?.[0] || '1') : 
        event.duration.toLowerCase().includes('half') ? 0.5 : 1;
      
      if (durationDays > 1) {
        endDate.setDate(endDate.getDate() + Math.floor(durationDays) - 1);
      }
      
      return {
        ...event,
        date: eventDate,
        endDate: endDate
      };
    });
  }, []);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Get events for selected month
  const eventsInMonth = events.filter(event => 
    event.date.getMonth() === selectedMonth && event.date.getFullYear() === selectedYear
  );

  // Generate calendar days
  const generateCalendar = () => {
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        const dayEvents = events.filter(event => 
          event.date.toDateString() === currentDate.toDateString()
        );
        
        weekDays.push({
          date: new Date(currentDate),
          isCurrentMonth: currentDate.getMonth() === selectedMonth,
          events: dayEvents
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      days.push(weekDays);
    }
    
    return days;
  };

  const calendarDays = generateCalendar();

  const navigateCalendar = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (calendarStartMonth === 0) {
        setCalendarStartMonth(11);
        setCalendarStartYear(calendarStartYear - 1);
      } else {
        setCalendarStartMonth(calendarStartMonth - 1);
      }
    } else {
      if (calendarStartMonth === 11) {
        setCalendarStartMonth(0);
        setCalendarStartYear(calendarStartYear + 1);
      } else {
        setCalendarStartMonth(calendarStartMonth + 1);
      }
    }
  };

  const scrollToEvent = (eventId: string) => {
    setSelectedEvent(eventId);
    const eventElement = document.getElementById(`event-${eventId}`);
    if (eventElement) {
      eventElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'workshop': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'seminar': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
      case 'lab-visit': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'competition': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'intermediate': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'advanced': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
    }
  };

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
            
            {/* Navigation Links - Always Visible */}
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
              <Link href="/q3/student-materials" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap hidden md:block">
                Student Materials
              </Link>
              <Link href="/q3/student-materials" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap md:hidden">
                Student
              </Link>
              <Link href="/q3/events" className="text-blue-600 dark:text-blue-400 font-medium whitespace-nowrap">
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
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl mb-6">
              <Calendar className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-slate-800 dark:text-slate-100 mb-6">
              Quantum Events Calendar
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-4xl mx-auto">
              Discover exciting quantum education opportunities across Europe. From workshops and seminars 
              to laboratory visits and competitions - find the perfect event to advance your quantum journey.
            </p>
          </div>
        </div>
      </section>

      {/* Calendar Section */}
      <section className="py-16 bg-white/50 dark:bg-slate-800/50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">
              6-Month Calendar Overview
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Click on any event to jump to details below
            </p>
          </div>

          {/* Calendar Navigation */}
          <div className="flex items-center justify-center mb-8">
            <button
              onClick={() => navigateCalendar('prev')}
              className="p-3 rounded-xl bg-white dark:bg-slate-900 shadow-lg hover:shadow-xl transition-all duration-200 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600"
            >
              <ChevronLeft className="w-6 h-6 text-slate-600 dark:text-slate-300" />
            </button>
            <div className="mx-8 text-center">
              <span className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {new Date(calendarStartYear, calendarStartMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} 
                {' - '}
                {new Date(calendarStartYear, calendarStartMonth + 5).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>
            <button
              onClick={() => navigateCalendar('next')}
              className="p-3 rounded-xl bg-white dark:bg-slate-900 shadow-lg hover:shadow-xl transition-all duration-200 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600"
            >
              <ChevronRight className="w-6 h-6 text-slate-600 dark:text-slate-300" />
            </button>
          </div>

          {/* 6-Month Calendar Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }, (_, monthOffset) => {
              const currentMonth = new Date(calendarStartYear, calendarStartMonth + monthOffset);
              
              const monthEvents = events.filter(event => {
                const eventMonth = event.date.getMonth();
                const eventYear = event.date.getFullYear();
                return eventMonth === currentMonth.getMonth() && eventYear === currentMonth.getFullYear();
              });

              // Generate calendar for this month
              const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
              const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
              const startDate = new Date(firstDay);
              startDate.setDate(startDate.getDate() - firstDay.getDay());
              
              const monthDays = [];
              const tempDate = new Date(startDate);
              
              for (let week = 0; week < 6; week++) {
                const weekDays = [];
                for (let day = 0; day < 7; day++) {
                  const dayEvents = events.filter(event => {
                    const eventStart = new Date(event.date);
                    const eventEnd = event.endDate ? new Date(event.endDate) : new Date(event.date);
                    const currentDay = new Date(tempDate);
                    
                    // Check if current day falls within event range
                    return currentDay >= eventStart && currentDay <= eventEnd;
                  });
                  
                  weekDays.push({
                    date: new Date(tempDate),
                    isCurrentMonth: tempDate.getMonth() === currentMonth.getMonth(),
                    events: dayEvents
                  });
                  
                  tempDate.setDate(tempDate.getDate() + 1);
                }
                monthDays.push(weekDays);
              }

              return (
                <div key={monthOffset} className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                  {/* Month Header */}
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 text-center">
                    <h3 className="text-xl font-bold">
                      {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h3>
                  </div>

                  {/* Week headers */}
                  <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-800 text-xs">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="p-2 text-center font-semibold text-slate-600 dark:text-slate-300">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar days */}
                  {monthDays.map((week, weekIndex) => (
                    <div key={weekIndex} className="grid grid-cols-7 border-t border-slate-200 dark:border-slate-700">
                      {week.map((day, dayIndex) => (
                        <div
                          key={dayIndex}
                          className={`p-1 h-16 border-r border-slate-200 dark:border-slate-700 relative text-xs ${
                            !day.isCurrentMonth ? 'bg-slate-50 dark:bg-slate-800/50' : ''
                          }`}
                        >
                          <div className={`text-xs font-medium mb-1 ${
                            day.isCurrentMonth 
                              ? 'text-slate-800 dark:text-slate-200' 
                              : 'text-slate-400 dark:text-slate-500'
                          }`}>
                            {day.date.getDate()}
                          </div>
                          
                          {day.events.slice(0, 2).map((event, eventIndex) => (
                            <div
                              key={event.id}
                              className="w-full text-xs p-1 mb-1 rounded cursor-pointer transition-all duration-200 hover:scale-105 truncate"
                              style={{
                                backgroundColor: event.category === 'workshop' ? '#dbeafe' :
                                               event.category === 'seminar' ? '#e9d5ff' :
                                               event.category === 'lab-visit' ? '#dcfce7' : '#fed7aa'
                              }}
                              onClick={() => scrollToEvent(event.id)}
                            >
                              <div className="truncate font-medium text-slate-800">
                                {event.title}
                              </div>
                            </div>
                          ))}
                          
                          {day.events.length > 2 && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                              +{day.events.length - 2} more
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Event Cards Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-6">
              Upcoming Events
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Detailed information about all upcoming quantum education events across European institutions
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {events.map(event => (
              <div
                key={event.id}
                id={`event-${event.id}`}
                className={`bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-lg border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  selectedEvent === event.id 
                    ? 'border-blue-400 dark:border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900/30' 
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                {/* Event Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                      {event.title}
                    </h3>
                    <div className="flex items-center text-slate-600 dark:text-slate-300 mb-2">
                      <Calendar className="w-4 h-4 mr-2" />
                      {event.date.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="flex items-center text-slate-600 dark:text-slate-300">
                      <MapPin className="w-4 h-4 mr-2" />
                      {event.location}, {event.country}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(event.category)}`}>
                      {event.category.replace('-', ' ').toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getLevelColor(event.level)}`}>
                      {event.level.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Institute */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 mb-4">
                  <div className="font-semibold text-slate-800 dark:text-slate-100 mb-1">
                    {event.institute}
                  </div>
                </div>

                {/* Description */}
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                  {event.description}
                </p>

                {/* Event Details */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Duration</div>
                      <div className="font-medium text-slate-800 dark:text-slate-200">{event.duration}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-green-500" />
                    <div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Target Group</div>
                      <div className="font-medium text-slate-800 dark:text-slate-200">{event.targetGroup}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Filter className="w-5 h-5 text-purple-500" />
                    <div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Max Participants</div>
                      <div className="font-medium text-slate-800 dark:text-slate-200">{event.maxParticipants}</div>
                    </div>
                  </div>
                </div>

                {/* Application Button */}
                <a
                  href={event.applicationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Apply Now
                </a>
              </div>
            ))}
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
