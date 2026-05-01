import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  ChevronRight, 
  BookOpen, 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  ClipboardList, 
  CalendarDays, 
  Activity,
  ArrowLeft
} from 'lucide-react';

const GUIDE_SECTIONS = [
  { id: 'getting-started', title: 'Getting Started', icon: BookOpen },
  { id: 'dashboard', title: 'Dashboard Overview', icon: LayoutDashboard },
  { id: 'students', title: 'Student Management', icon: Users },
  { id: 'fees', title: 'Fee Management', icon: DollarSign },
  { id: 'exams', title: 'Exams & Grading', icon: ClipboardList },
  { id: 'attendance', title: 'Attendance Marking', icon: Activity },
  { id: 'timetable', title: 'Timetable Scheduling', icon: CalendarDays },
];

export const GuidePage = () => {
  const [activeSection, setActiveSection] = useState('getting-started');

  useEffect(() => {
    const handleScroll = () => {
      const sections = GUIDE_SECTIONS.map(s => document.getElementById(s.id));
      const scrollPosition = window.scrollY + 200;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(section.id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 100,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-primary-500/30 font-sans">
      {/* HEADER */}
      <header className="sticky top-0 z-50 glass border-b border-white/5 h-20 px-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-300" />
          </Link>
          <Link to="/" className="flex items-center gap-3">
            <div className="p-2 bg-primary-600 rounded-xl shadow-premium">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase">
              Bidii<span className="text-primary-400">Elimu</span>
              <span className="ml-2 text-xs font-bold text-slate-500 tracking-widest">GUIDE</span>
            </span>
          </Link>
        </div>
        <Link to="/login" className="px-6 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-premium transition-all">
          Open App
        </Link>
      </header>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row relative">
        {/* SIDEBAR */}
        <aside className="w-full md:w-72 md:sticky top-20 h-auto md:h-[calc(100vh-5rem)] border-r border-white/5 p-6 overflow-y-auto hidden md:block">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Contents</h4>
          <nav className="space-y-2">
            {GUIDE_SECTIONS.map((section) => {
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left group ${
                    isActive 
                      ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <section.icon className={`w-4 h-4 ${isActive ? 'text-primary-400' : 'text-slate-500 group-hover:text-white'}`} />
                  <span className="text-xs font-bold tracking-wide">{section.title}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* MOBILE NAV DROPDOWN (Simplified for mobile) */}
        <div className="md:hidden p-4 border-b border-white/5 bg-slate-900/90 sticky top-20 z-40 backdrop-blur-md">
           <select 
              className="w-full bg-slate-800 border border-slate-700 text-white text-xs font-bold p-3 rounded-xl outline-none"
              value={activeSection}
              onChange={(e) => scrollToSection(e.target.value)}
           >
              {GUIDE_SECTIONS.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
           </select>
        </div>

        {/* CONTENT AREA */}
        <main className="flex-1 p-6 md:p-12 lg:p-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl prose prose-invert prose-slate">
            
            <section id="getting-started" className="mb-24 scroll-mt-32">
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white mb-6">Getting Started</h1>
              <p className="text-slate-400 text-lg leading-relaxed mb-8">
                Welcome to BidiiElimu, the premier SaaS School Management System. This guide will walk you through the core features 
                designed to streamline your institution's daily operations.
              </p>
              <div className="bg-primary-500/10 border border-primary-500/20 p-6 rounded-2xl mb-8">
                <h3 className="text-primary-400 font-bold uppercase text-xs tracking-widest mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Prerequisites
                </h3>
                <ul className="list-disc list-inside text-sm text-slate-300 space-y-2">
                  <li>Ensure you have a modern web browser installed (Chrome, Firefox, Safari).</li>
                  <li>You must have an Administrator or Teacher account provisioned by your school.</li>
                  <li>Log in via the portal using your secure credentials.</li>
                </ul>
              </div>
            </section>

            <section id="dashboard" className="mb-24 scroll-mt-32">
              <h2 className="text-3xl font-black uppercase tracking-tight text-white mb-6">Dashboard Overview</h2>
              <p className="text-slate-400 mb-6">
                Upon logging in, you are greeted by the Dashboard. This is your command center, offering real-time intelligence on your school's performance.
              </p>
              <div className="space-y-4 text-sm text-slate-300 mb-6">
                <div className="glass p-5 rounded-2xl border border-white/5">
                  <strong className="text-white block mb-1">Key Metrics</strong>
                  At the top, widgets display Total Students, Revenue Collections, and Average Attendance for quick insights.
                </div>
                <div className="glass p-5 rounded-2xl border border-white/5">
                  <strong className="text-white block mb-1">Interactive Charts</strong>
                  The main chart area visualizes trends over time, such as financial inflow or academic performance curves.
                </div>
              </div>
            </section>

            <section id="students" className="mb-24 scroll-mt-32">
              <h2 className="text-3xl font-black uppercase tracking-tight text-white mb-6">Student Management</h2>
              <p className="text-slate-400 mb-6">
                The Students module allows administrators to handle enrollment, class assignments, and student records efficiently.
              </p>
              <ol className="list-decimal list-inside space-y-4 text-sm text-slate-300">
                <li className="glass p-4 rounded-xl border border-white/5">
                  <strong className="text-white">Viewing Students:</strong> Navigate to <span className="px-2 py-0.5 bg-slate-800 rounded">Students</span> in the sidebar to see a paginated, searchable list of all enrolled students.
                </li>
                <li className="glass p-4 rounded-xl border border-white/5">
                  <strong className="text-white">Adding a Student:</strong> Click the "Add Student" button. Fill in the required biodata, parent contact details, and assign them to a class stream.
                </li>
                <li className="glass p-4 rounded-xl border border-white/5">
                  <strong className="text-white">Generating Reports:</strong> Click on any student's profile to view their comprehensive Report Card, combining attendance and exam metrics.
                </li>
              </ol>
            </section>

            <section id="fees" className="mb-24 scroll-mt-32">
              <h2 className="text-3xl font-black uppercase tracking-tight text-white mb-6">Fee Management</h2>
              <p className="text-slate-400 mb-6">
                Control your institution's capital flow seamlessly. Track invoices, payments, and balances.
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                  <h4 className="text-white font-bold mb-2">Creating Fee Structures</h4>
                  <p className="text-slate-400">Define fee structures for specific terms and classes. Assign items like Tuition, Transport, and Boarding.</p>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                  <h4 className="text-white font-bold mb-2">Recording Payments</h4>
                  <p className="text-slate-400">Navigate to a student's finance tab to log a payment. The system automatically calculates remaining balances.</p>
                </div>
              </div>
            </section>

            <section id="exams" className="mb-24 scroll-mt-32">
              <h2 className="text-3xl font-black uppercase tracking-tight text-white mb-6">Exams & Grading</h2>
              <p className="text-slate-400 mb-6">
                BidiiElimu offers an elite grading system capable of handling standard and custom grading curves.
              </p>
              <ul className="list-disc list-inside space-y-4 text-sm text-slate-300">
                <li><strong className="text-white">Setup:</strong> Create an Exam (e.g., "Mid-Term 1") and assign subjects.</li>
                <li><strong className="text-white">Marks Entry:</strong> Teachers navigate to the <span className="px-2 py-0.5 bg-slate-800 rounded">Marks Entry</span> page, select their class and subject, and input scores directly into a spreadsheet-like interface.</li>
                <li><strong className="text-white">Analysis:</strong> Once marks are entered, the system instantly computes grades, class ranks, and subject averages.</li>
              </ul>
            </section>

            <section id="attendance" className="mb-24 scroll-mt-32">
              <h2 className="text-3xl font-black uppercase tracking-tight text-white mb-6">Attendance Marking</h2>
              <p className="text-slate-400 mb-6">
                Active presence intelligence allows you to mark and track student attendance daily.
              </p>
              <p className="text-sm text-slate-300 glass p-5 rounded-2xl border border-white/5">
                Go to <strong className="text-white">Attendance</strong>. Select the Date and Class. A list of students will appear. Toggle their status between Present, Absent, or Late. Save the register to immediately update their metrics.
              </p>
            </section>

            <section id="timetable" className="mb-24 scroll-mt-32">
              <h2 className="text-3xl font-black uppercase tracking-tight text-white mb-6">Timetable Scheduling</h2>
              <p className="text-slate-400 mb-6">
                Prevent conflicts and organize the academic week efficiently.
              </p>
              <p className="text-sm text-slate-300 mb-6">
                The Timetable module displays a grid view of the week. Administrators can drag and drop subjects and assign teachers to specific time slots. The system automatically warns you if a teacher is double-booked.
              </p>
              <div className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-xl flex items-start gap-4">
                <BookOpen className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-200/80 leading-relaxed">
                  Students and Parents can view their specific class timetable securely from their portals once it's published by the administration.
                </p>
              </div>
            </section>

          </motion.div>
        </main>
      </div>
    </div>
  );
};
