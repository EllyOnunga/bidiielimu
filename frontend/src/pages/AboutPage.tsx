import { Link } from 'react-router-dom';
import { GraduationCap, Target, Heart, ChevronLeft, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const team = [
  { name: 'Dr. Sarah Wanjiku', role: 'CEO & Co-founder', initials: 'SW' },
  { name: 'James Otieno', role: 'CTO & Co-founder', initials: 'JO' },
  { name: 'Amina Hassan', role: 'Head of Product', initials: 'AH' },
  { name: 'Peter Kamau', role: 'Lead Engineer', initials: 'PK' },
];

export const AboutPage = () => (
  <div className="min-h-screen bg-[#0f172a] text-white">
    <div className="max-w-7xl mx-auto px-4 pt-28 pb-20">
      <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-10 transition-colors">
        <ChevronLeft className="w-4 h-4" />Back to Home
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="max-w-3xl mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-bold mb-6">
            OUR STORY
          </div>
          <h1 className="text-5xl font-black mb-6">Built by Educators, <br />for Educators</h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-4">
            EliteEdu was born in 2022 out of frustration. Our founders — former teachers and school administrators — spent years watching schools struggle with paper registers, Excel fee sheets, and WhatsApp grade reports.
          </p>
          <p className="text-slate-400 text-lg leading-relaxed">
            We built EliteEdu SYSTEM to fix that. A single, beautiful, reliable platform that every school in Africa can afford and use from day one.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-24">
          {[
            { icon: Target, title: 'Our Mission', desc: 'To give every school — no matter its size or budget — access to world-class management tools.' },
            { icon: Heart, title: 'Our Values', desc: 'Simplicity, reliability, and genuine care for educators and the children they serve.' },
            { icon: GraduationCap, title: 'Our Impact', desc: 'Over 50 schools, 10,000+ students, and hundreds of teachers empowered and counting.' },
          ].map(item => (
            <div key={item.title} className="glass-dark p-8 rounded-[32px] border border-white/5">
              <div className="p-4 bg-primary-600/10 rounded-2xl text-primary-400 w-fit mb-6">
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <h2 className="text-3xl font-black mb-12 text-center">Meet the Team</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {team.map((member, i) => (
            <motion.div key={member.name} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
              className="glass-dark rounded-[24px] border border-white/5 p-6 text-center hover:border-primary-500/30 transition-all">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center text-xl font-black mx-auto mb-4">
                {member.initials}
              </div>
              <h4 className="font-bold text-white">{member.name}</h4>
              <p className="text-sm text-slate-400">{member.role}</p>
            </motion.div>
          ))}
        </div>

        <div className="glass-dark rounded-[40px] border border-white/5 p-12 text-center">
          <h2 className="text-3xl font-black mb-4">Ready to Join Our Journey?</h2>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto">We're always looking for passionate people who want to transform education in Africa.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/careers" className="px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2">
              View Open Roles <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/#contact" className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-all">
              Contact Us
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  </div>
);
