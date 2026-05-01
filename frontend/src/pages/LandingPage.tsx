import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Shield,
  BarChart3,
  Users,
  Zap,
  Globe,
  CheckCircle2,
  ArrowRight,
  Menu,
  X,
  MessageCircle,
  Send,
  Share2,
  Mail,
  Phone,
  MapPin,
  Star,
  BookOpen,
  Play,
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Reusable sub-components ─── */
const FeatureCard = ({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) => (
  <div className="glass-dark p-8 rounded-[32px] border border-white/5 hover:border-primary-500/30 transition-all group">
    <div className="p-4 bg-primary-600/10 rounded-2xl text-primary-400 w-fit mb-6 group-hover:bg-primary-600 group-hover:text-white transition-all">
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
  </div>
);

/* ─── Main Landing Page ─── */
export const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-primary-500/30">

      {/* ── HEADER ── */}
      <header className="fixed top-0 left-0 right-0 z-[100] backdrop-blur-md bg-[#0f172a]/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="p-2 bg-primary-600 rounded-lg shadow-lg shadow-primary-900/40">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight">
              BidiiElimu <span className="text-primary-500">SYSTEM</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollTo('features')} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Features</button>
            <Link to="/solutions" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Solutions</Link>
            <Link to="/pricing" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Pricing</Link>
            <button onClick={() => scrollTo('contact')} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Contact</button>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/login" className="text-sm font-bold text-white hover:text-primary-400 transition-colors">Sign In</Link>
            <Link to="/register" className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold shadow-lg shadow-primary-900/20 transition-all">
              Start Free Trial
            </Link>
          </div>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-slate-300">
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-[#1e293b] border-b border-white/5 overflow-hidden"
            >
              <div className="px-4 py-6 space-y-4">
                <button onClick={() => scrollTo('features')} className="block text-slate-300 font-medium w-full text-left">Features</button>
                <Link to="/solutions" onClick={() => setIsMenuOpen(false)} className="block text-slate-300 font-medium">Solutions</Link>
                <Link to="/pricing" onClick={() => setIsMenuOpen(false)} className="block text-slate-300 font-medium">Pricing</Link>
                <button onClick={() => scrollTo('contact')} className="block text-slate-300 font-medium w-full text-left">Contact</button>
                <hr className="border-white/5" />
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block font-bold">Sign In</Link>
                <Link to="/register" onClick={() => setIsMenuOpen(false)} className="block py-3 bg-primary-600 text-center rounded-xl font-bold">Get Started</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── HERO ── */}
      <section className="pt-40 pb-20 px-4">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-bold mb-6">
              <Zap className="w-3 h-3" />THE FUTURE OF SCHOOL MANAGEMENT
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight">
              Empower Your School with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">Smart Data</span>
            </h1>
            <p className="text-lg text-slate-400 mb-10 leading-relaxed max-w-xl">
              BidiiElimu SYSTEM is a unified multi-tenant platform designed to streamline academics,
              finances, and communication. Built for modern African schools.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-bold shadow-xl shadow-primary-900/40 transition-all flex items-center justify-center gap-2">
                Get Started for Free <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="https://www.youtube.com/watch?v=N2zK3sAtr-4"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" /> Watch Demo
              </a>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative">
            <div className="absolute inset-0 bg-primary-600/20 blur-[100px] rounded-full" />
            <div className="glass-dark p-4 rounded-[40px] border border-white/10 shadow-2xl relative">
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200"
                alt="BidiiElimu Dashboard Preview"
                className="rounded-[32px] w-full"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-32 bg-[#0a0f1d] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-black mb-4">Powerful Features for Modern Schools</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Everything you need to manage your institution in one place.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard icon={Users} title="Student Management" desc="Comprehensive records, performance tracking, and disciplinary logs all in one click." />
            <FeatureCard icon={BarChart3} title="Financial Analytics" desc="Automated fee tracking, M-Pesa integration, and detailed financial reports." />
            <FeatureCard icon={Shield} title="Secure Multi-Tenancy" desc="Your data is strictly isolated and protected by enterprise-grade security." />
            <FeatureCard icon={Globe} title="Smart Timetabling" desc="Generate conflict-free schedules automatically for teachers and classrooms." />
            <FeatureCard icon={CheckCircle2} title="Attendance Tracking" desc="Daily attendance logs with instant SMS notifications to parents." />
            <FeatureCard icon={GraduationCap} title="Exam Portals" desc="Automated report card generation and standard-based grading systems." />
          </div>
          <div className="text-center mt-14">
            <Link to="/solutions" className="inline-flex items-center gap-2 px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-all">
              Explore All Solutions <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[['50+', 'Schools Onboarded'], ['10k+', 'Active Students'], ['99.9%', 'Uptime Reliable'], ['24/7', 'Support Ready']].map(([val, label]) => (
            <div key={label}>
              <div className="text-4xl font-black mb-2">{val}</div>
              <div className="text-primary-100 text-sm font-bold">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SOLUTIONS TEASER ── */}
      <section id="solutions" className="py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">Built for Every Type of School</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">From rural primary schools to international campuses — we have you covered.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: GraduationCap, title: 'Primary Schools', desc: 'Simplify enrollment, attendance, and term exams.' },
              { icon: BookOpen, title: 'Secondary Schools', desc: 'KCSE-aligned grading, subject selection, and fee management.' },
              { icon: Shield, title: 'School Groups', desc: 'Centralized multi-school governance with full data isolation.' },
            ].map(item => (
              <Link key={item.title} to="/solutions"
                className="glass-dark p-8 rounded-[32px] border border-white/5 hover:border-primary-500/30 transition-all group">
                <div className="p-4 bg-primary-600/10 rounded-2xl text-primary-400 w-fit mb-6 group-hover:bg-primary-600 group-hover:text-white transition-all">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">{item.desc}</p>
                <span className="text-primary-400 text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                  Learn more <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEMO / TESTIMONIALS ── */}
      <section id="demo" className="py-20 bg-[#0a0f1d] px-4">
        <div className="max-w-5xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black mb-4">Trusted by Schools Across Africa</h2>
          <p className="text-slate-400">Here's what school administrators say about BidiiElimu SYSTEM.</p>
        </div>
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            { name: 'Mrs. Atieno', role: 'Principal, Kisumu Primary', text: 'We cut our fee collection time by 70%. Parents can pay via M-Pesa and we see it instantly.' },
            { name: 'Mr. Waweru', role: 'Deputy Head, Nairobi High', text: 'The timetable builder alone saved us 2 full days every term. Highly recommended.' },
            { name: 'Mrs. Abubakar', role: 'Admin, Mombasa Academy', text: 'Report cards now take minutes, not days. Parents love the parent portal access.' },
          ].map(t => (
            <div key={t.name} className="glass-dark rounded-[24px] border border-white/5 p-6">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-6 italic">"{t.text}"</p>
              <div>
                <p className="font-bold text-white text-sm">{t.name}</p>
                <p className="text-slate-500 text-xs">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING TEASER ── */}
      <section id="pricing" className="py-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-4">Affordable for Every School</h2>
          <p className="text-slate-400 mb-12 max-w-2xl mx-auto">Starting from KES 3,500/month with a free 30-day trial. No credit card required.</p>
          <div className="grid md:grid-cols-3 gap-4 mb-12 text-left">
            {[
              { name: 'Starter', price: 'KES 3,500/mo', for: 'Small primary schools' },
              { name: 'Professional', price: 'KES 9,500/mo', for: 'Growing secondary schools', highlight: true },
              { name: 'Enterprise', price: 'Custom', for: 'School groups & counties' },
            ].map(plan => (
              <div key={plan.name} className={`glass-dark rounded-2xl border-2 p-6 ${plan.highlight ? 'border-primary-500' : 'border-white/5'}`}>
                {plan.highlight && <span className="text-[10px] font-black text-primary-400 uppercase tracking-widest">Most Popular</span>}
                <h3 className="text-xl font-black mt-1 mb-1">{plan.name}</h3>
                <p className="text-slate-400 text-xs mb-3">{plan.for}</p>
                <p className="text-2xl font-black text-white">{plan.price}</p>
              </div>
            ))}
          </div>
          <Link to="/pricing" className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-primary-900/20">
            View Full Pricing <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="py-32 px-4 bg-[#0a0f1d]">
        <div className="max-w-5xl mx-auto glass-dark rounded-[48px] border border-white/5 p-8 md:p-16 grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-black mb-6">Let's Talk About Your School</h2>
            <p className="text-slate-400 mb-8">Ready to transform your institution? Our experts are here to help.</p>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary-600/10 rounded-xl text-primary-400"><Mail className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs text-slate-500 font-bold">EMAIL US</p>
                  <a href="mailto:hello@school.edu" className="font-bold hover:text-primary-400 transition-colors">hello@school.edu</a>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary-600/10 rounded-xl text-primary-400"><Phone className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs text-slate-500 font-bold">CALL US</p>
                  <a href="tel:+254700000000" className="font-bold hover:text-primary-400 transition-colors">+254 700 000 000</a>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary-600/10 rounded-xl text-primary-400"><MapPin className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs text-slate-500 font-bold">VISIT US</p>
                  <p className="font-bold">Westlands, Nairobi, Kenya</p>
                </div>
              </div>
            </div>
          </div>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Message sent! We\'ll be in touch shortly.'); }}>
            <input type="text" required placeholder="Full Name" className="w-full bg-slate-800/50 border border-slate-700 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 text-white" />
            <input type="email" required placeholder="Email Address" className="w-full bg-slate-800/50 border border-slate-700 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 text-white" />
            <textarea placeholder="Tell us about your school..." rows={4} className="w-full bg-slate-800/50 border border-slate-700 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 text-white"></textarea>
            <button type="submit" className="w-full py-4 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-primary-900/20">
              Send Message
            </button>
          </form>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0a0f1d] pt-20 pb-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-primary-600 rounded-lg"><GraduationCap className="w-6 h-6 text-white" /></div>
                <span className="text-xl font-black tracking-tight">BidiiElimu</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Redefining school management with technology that empowers teachers, students, and administrators.
              </p>
              <div className="flex items-center gap-4">
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"><MessageCircle className="w-4 h-4" /></a>
                <a href="https://twitter.com" target="_blank" rel="noreferrer" className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"><Send className="w-4 h-4" /></a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"><Share2 className="w-4 h-4" /></a>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-6">Platform</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><button onClick={() => scrollTo('features')} className="hover:text-primary-400 transition-colors text-left">Features</button></li>
                <li><Link to="/pricing" className="hover:text-primary-400 transition-colors">Pricing</Link></li>
                <li><Link to="/solutions" className="hover:text-primary-400 transition-colors">Solutions</Link></li>
                <li><Link to="/register" className="hover:text-primary-400 transition-colors">Start Free Trial</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6">Company</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><Link to="/about" className="hover:text-primary-400 transition-colors">About Us</Link></li>
                <li><Link to="/careers" className="hover:text-primary-400 transition-colors">Careers</Link></li>
                <li><Link to="/terms" className="hover:text-primary-400 transition-colors">Legal</Link></li>
                <li><button onClick={() => scrollTo('contact')} className="hover:text-primary-400 transition-colors text-left">Contact</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6">Newsletter</h4>
              <p className="text-sm text-slate-400 mb-4">Stay updated with the latest in EdTech.</p>
              <div className="flex gap-2">
                <input type="email" placeholder="Email" className="flex-1 bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-primary-500" />
                <button className="bg-primary-600 hover:bg-primary-500 px-4 py-2 rounded-xl text-sm font-bold transition-colors">Join</button>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between border-t border-white/5 pt-10 text-xs text-slate-500 font-bold uppercase tracking-widest">
            <p>&copy; {new Date().getFullYear()} BIDIIELIMU SYSTEM. ALL RIGHTS RESERVED.</p>
            <div className="flex gap-8 mt-4 md:mt-0">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link to="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
