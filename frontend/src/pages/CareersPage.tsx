import { Link } from 'react-router-dom';
import { ChevronLeft, ArrowRight, Briefcase, MapPin, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const jobs = [
  { title: 'Senior Full-Stack Engineer', dept: 'Engineering', location: 'Nairobi / Remote', type: 'Full-Time' },
  { title: 'Product Designer (UI/UX)', dept: 'Design', location: 'Nairobi / Remote', type: 'Full-Time' },
  { title: 'Customer Success Manager', dept: 'Operations', location: 'Nairobi', type: 'Full-Time' },
  { title: 'School Onboarding Specialist', dept: 'Sales', location: 'Nairobi / Mombasa', type: 'Full-Time' },
  { title: 'Technical Support Engineer', dept: 'Support', location: 'Remote', type: 'Part-Time / Contract' },
];

export const CareersPage = () => (
  <div className="min-h-screen bg-[#0f172a] text-white">
    <div className="max-w-5xl mx-auto px-4 pt-28 pb-20">
      <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-10 transition-colors">
        <ChevronLeft className="w-4 h-4" />Back to Home
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-bold mb-6">
          <Briefcase className="w-3 h-3" />WE'RE HIRING
        </div>
        <h1 className="text-5xl font-black mb-4">Join the Team Transforming <br />Education in Africa</h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
          We're building for impact. If you're passionate about education, technology, and Africa — come build with us.
        </p>
      </motion.div>

      <div className="space-y-4 mb-20">
        {jobs.map((job, i) => (
          <motion.div key={job.title} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
            className="glass-dark rounded-2xl border border-white/5 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary-500/30 transition-all group cursor-pointer">
            <div>
              <h3 className="text-lg font-bold text-white mb-2">{job.title}</h3>
              <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{job.dept}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.type}</span>
              </div>
            </div>
            <Link to="/#contact"
              className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-primary-600/10 hover:bg-primary-600 text-primary-400 hover:text-white rounded-xl font-bold text-sm transition-all">
              Apply Now <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="glass-dark rounded-[32px] border border-white/5 p-10 text-center">
        <h2 className="text-2xl font-black mb-3">Don't See Your Role?</h2>
        <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">We're always interested in exceptional people. Send us an open application.</p>
        <Link to="/#contact" className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold transition-all">
          Send Open Application
        </Link>
      </div>
    </div>
  </div>
);
