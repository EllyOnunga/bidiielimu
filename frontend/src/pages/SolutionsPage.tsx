import { Link } from 'react-router-dom';
import { GraduationCap, BookOpen, Users, Shield, BarChart3, ArrowRight, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const solutions = [
  {
    icon: GraduationCap,
    title: 'Primary Schools',
    desc: 'Streamline student records, attendance, exam marking, and parent communication for primary-level institutions.',
    features: ['Pupil enrollment & records', 'CA & end-term exams', 'Parent SMS alerts', 'Timetable generation'],
    color: 'from-blue-600 to-blue-800',
  },
  {
    icon: BookOpen,
    title: 'Secondary Schools',
    desc: 'Full academic management for Form 1–4 including KCSE grading, subject selection, and fee structures.',
    features: ['KCSE grading system', 'Subject allocation', 'Boarding & day fees', 'Teacher performance'],
    color: 'from-purple-600 to-purple-800',
  },
  {
    icon: Users,
    title: 'School Groups & Chains',
    desc: 'Multi-school governance from a single control panel. Each school stays isolated, you get the big picture.',
    features: ['Centralized reporting', 'Per-school isolation', 'Shared teacher pools', 'Group-level analytics'],
    color: 'from-emerald-600 to-emerald-800',
  },
  {
    icon: Shield,
    title: 'Government & County Schools',
    desc: 'Compliant reporting tools for TSC, MOE, and county education offices with audit trails.',
    features: ['TSC compliance reports', 'MOE enrollment returns', 'Audit log exports', 'Multi-role access'],
    color: 'from-amber-600 to-amber-800',
  },
  {
    icon: BarChart3,
    title: 'Private & International Schools',
    desc: 'Premium fee management, custom report cards, and multi-currency support for international institutions.',
    features: ['Custom report card templates', 'Multi-currency fees', 'Parent portal access', 'Custom branding'],
    color: 'from-rose-600 to-rose-800',
  },
];

export const SolutionsPage = () => (
  <div className="min-h-screen bg-[#0f172a] text-white">
    <div className="max-w-7xl mx-auto px-4 pt-28 pb-20">
      <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-10 transition-colors">
        <ChevronLeft className="w-4 h-4" />Back to Home
      </Link>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-bold mb-6">
          BUILT FOR EVERY SCHOOL TYPE
        </div>
        <h1 className="text-5xl font-black mb-4">Solutions for Every Institution</h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">Whether you run a single primary school or a chain of campuses, EliteEdu SYSTEM scales with you.</p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {solutions.map((sol, i) => (
          <motion.div key={sol.title} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="glass-dark rounded-[32px] border border-white/5 overflow-hidden hover:border-primary-500/30 transition-all group">
            <div className={`bg-gradient-to-br ${sol.color} p-8`}>
              <sol.icon className="w-10 h-10 text-white mb-4" />
              <h3 className="text-xl font-black text-white">{sol.title}</h3>
            </div>
            <div className="p-8">
              <p className="text-slate-400 text-sm mb-6">{sol.desc}</p>
              <ul className="space-y-2 mb-8">
                {sol.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/register" className="flex items-center gap-2 text-primary-400 font-bold text-sm hover:text-primary-300 transition-colors group-hover:gap-3">
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-24 glass-dark rounded-[40px] border border-white/5 p-12 text-center">
        <h2 className="text-3xl font-black mb-4">Not Sure Which Plan Fits?</h2>
        <p className="text-slate-400 mb-8 max-w-xl mx-auto">Our team will analyze your school's needs and recommend the right configuration — free of charge.</p>
        <Link to="/#contact" className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-bold transition-all shadow-lg">
          Talk to an Expert <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  </div>
);
