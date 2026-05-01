import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { DashboardMockup } from '../components/DashboardMockup';
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
  Mail,
  Phone,
  MapPin,
  Play,
} from 'lucide-react';

/* ─── Reusable sub-components ─── */
const FeatureCard = ({ icon: Icon, title, desc, delay }: { icon: any; title: string; desc: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.6 }}
    className="glass-interactive p-10 rounded-[40px] group"
  >
    <div className="p-4 bg-primary-600 rounded-2xl text-white w-fit mb-8 shadow-premium group-hover:scale-110 transition-transform duration-500">
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="text-2xl font-black mb-4 text-white tracking-tight uppercase">{title}</h3>
    <p className="text-primary-200/50 text-base font-medium leading-relaxed">{desc}</p>
  </motion.div>
);

/* ─── Main Landing Page ─── */
export const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-transparent text-white selection:bg-primary-500/30">

      {/* ── HEADER ── */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-7xl">
        <div className="glass h-20 px-8 flex items-center justify-between rounded-[28px]">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2.5 bg-primary-600 rounded-xl shadow-premium group-hover:rotate-12 transition-transform duration-500">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase">
              Bidii<span className="text-primary-400">Elimu</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-10">
            {['Features', 'Pricing', 'Contact'].map((item) => (
              <button
                key={item}
                onClick={() => scrollTo(item.toLowerCase())}
                className="text-xs font-black uppercase tracking-widest text-primary-200/60 hover:text-white transition-colors"
              >
                {item}
              </button>
            ))}
            <Link to="/guide" className="text-xs font-black uppercase tracking-widest text-primary-200/60 hover:text-white transition-colors">Guide</Link>
          </nav>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/login" className="text-xs font-black uppercase tracking-widest text-primary-200/60 hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="px-7 py-3.5 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-premium active:scale-95 transition-all">
              Join the Future
            </Link>
          </div>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-3 bg-white/5 rounded-xl text-white">
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="md:hidden mt-4 glass p-8 rounded-[32px] overflow-hidden"
            >
              <div className="space-y-6">
                {['Features', 'Pricing', 'Contact'].map((item) => (
                  <button key={item} onClick={() => scrollTo(item.toLowerCase())} className="block text-lg font-black uppercase tracking-widest text-primary-200/60 w-full text-left">{item}</button>
                ))}
                <Link to="/guide" className="block text-lg font-black uppercase tracking-widest text-primary-200/60 w-full text-left">Guide</Link>
                <hr className="border-white/5" />
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block text-lg font-black uppercase tracking-widest text-white">Sign In</Link>
                <Link to="/register" onClick={() => setIsMenuOpen(false)} className="block py-4 bg-primary-600 text-center rounded-2xl font-black uppercase tracking-widest text-xs shadow-premium">Start Free Trial</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── HERO ── */}
      <section className="pt-52 pb-32 px-4 relative">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8"
            >
              <Zap className="w-3 h-3 animate-pulse" /> The Next-Gen School Management
            </motion.div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-8 leading-[0.9] text-white">
              Smarter Data, <br />
              <span className="text-gradient">Better Schools.</span>
            </h1>
            <p className="text-xl text-primary-200/50 mb-12 font-medium leading-relaxed max-w-xl">
              BidiiElimu is a state-of-the-art unified platform designed to streamline academics,
              finances, and communication for high-performing educational institutions.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <Link to="/register" className="w-full sm:w-auto px-10 py-5 bg-primary-600 hover:bg-primary-500 text-white rounded-[24px] font-black uppercase tracking-widest text-xs shadow-premium active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                Experience BidiiElimu <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/solutions" className="w-full sm:w-auto px-10 py-5 bg-white/5 hover:bg-white/10 text-white rounded-[24px] font-black uppercase tracking-widest text-xs border border-white/5 transition-all flex items-center justify-center gap-3 group">
                <Play className="w-4 h-4 fill-primary-400 text-primary-400 group-hover:scale-125 transition-transform" /> Watch Demo
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotateY: -10 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative perspective-1000"
          >
            <div className="absolute inset-0 bg-primary-600/30 blur-[120px] rounded-full animate-pulse-slow" />
            <div className="glass p-3 rounded-[48px] shadow-glass relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 z-20 pointer-events-none" />
              <div className="transform group-hover:scale-[1.02] transition-transform duration-1000 relative z-10">
                <DashboardMockup />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-40 relative">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-24">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-6xl font-black text-white mb-6 uppercase tracking-tight"
            >
              Unified <span className="text-gradient">Capabilities</span>
            </motion.h2>
            <p className="text-primary-200/40 text-lg font-medium max-w-2xl mx-auto leading-relaxed">Everything your institution needs to dominate the digital landscape.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard delay={0.1} icon={Users} title="Student OS" desc="Revolutionary student tracking with deep performance and behavioral intelligence." />
            <FeatureCard delay={0.2} icon={BarChart3} title="Capital Flow" desc="Sophisticated fee management with real-time analytics and seamless payment hooks." />
            <FeatureCard delay={0.3} icon={Shield} title="Multi-Tenant" desc="Enterprise-grade data isolation ensuring your school's intelligence stays your own." />
            <FeatureCard delay={0.4} icon={Globe} title="Cloud Scheduling" desc="Algorithmic timetabling that resolves conflicts across thousands of nodes instantly." />
            <FeatureCard delay={0.5} icon={CheckCircle2} title="Active Presence" desc="Real-time attendance intelligence with instant omni-channel notifications." />
            <FeatureCard delay={0.6} icon={GraduationCap} title="Elite Grading" desc="Standardized report generation with custom grading curves and insight mapping." />
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-24 glass rounded-[60px] mx-6">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          {[
            ['50+', 'Partner Schools'],
            ['10k+', 'Active Users'],
            ['99.9%', 'System Uptime'],
            ['24/7', 'Strategic Support']
          ].map(([val, label]) => (
            <div key={label} className="group">
              <div className="text-6xl font-black text-white mb-2 group-hover:scale-110 group-hover:text-primary-400 transition-all duration-500">{val}</div>
              <div className="text-primary-200/40 text-xs font-black uppercase tracking-widest">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING TEASER ── */}
      <section id="pricing" className="py-40 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-8 uppercase tracking-tight">Scalable <span className="text-gradient">Investment</span></h2>
          <p className="text-primary-200/40 text-lg font-medium mb-16 max-w-2xl mx-auto leading-relaxed">Pricing designed to grow with your school's success. 30-day premium access included.</p>
          <div className="grid md:grid-cols-3 gap-6 mb-16 text-left">
            {[
              { name: 'Starter', price: 'KES 3.5k', for: 'Boutique Schools' },
              { name: 'Pro', price: 'KES 9.5k', for: 'Scaling Institutions', highlight: true },
              { name: 'Elite', price: 'Custom', for: 'Multi-Campus Groups' },
            ].map((plan, idx) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`glass p-10 rounded-[40px] border-2 transition-all duration-500 ${plan.highlight ? 'border-primary-500 shadow-premium scale-105 relative z-10' : 'border-white/5 hover:border-white/10'}`}
              >
                {plan.highlight && <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">Most Advanced</span>}
                <h3 className="text-2xl font-black text-white mt-1 uppercase tracking-tight">{plan.name}</h3>
                <p className="text-primary-200/40 text-xs font-bold uppercase tracking-widest mb-6">{plan.for}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  <span className="text-primary-200/30 text-xs font-bold uppercase tracking-widest">/mo</span>
                </div>
              </motion.div>
            ))}
          </div>
          <Link to="/pricing" className="inline-flex items-center gap-3 px-12 py-5 bg-primary-600 hover:bg-primary-500 text-white rounded-[24px] font-black uppercase tracking-widest text-xs shadow-premium active:scale-95 transition-all">
            Full Pricing Intelligence <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="py-40 px-6">
        <div className="max-w-6xl mx-auto glass rounded-[60px] overflow-hidden grid lg:grid-cols-2 shadow-glass relative">
          <div className="p-12 md:p-20 bg-primary-600 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            <h2 className="text-4xl md:text-5xl font-black text-white mb-10 leading-tight uppercase tracking-tight">Let's Define Your Digital <br /> Future.</h2>
            <div className="space-y-10 relative z-10">
              {[
                { icon: Mail, label: 'Transmission', value: 'intel@bidii-elimu.com' },
                { icon: Phone, label: 'Secure Line', value: '+254 700 000 000' },
                { icon: MapPin, label: 'Base', value: 'Westlands, Nairobi, KE' }
              ].map(item => (
                <div key={item.label} className="flex items-center gap-6 group">
                  <div className="p-4 bg-white/10 rounded-2xl text-white group-hover:scale-110 transition-transform"><item.icon className="w-6 h-6" /></div>
                  <div>
                    <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-1">{item.label}</p>
                    <p className="text-xl font-black text-white">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-12 md:p-20 bg-transparent">
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); toast.success('Intel received. Our agents will respond.'); }}>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-[0.2em] ml-1">Representative Name</label>
                <input type="text" required className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl outline-none focus:border-primary-500 text-white transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-[0.2em] ml-1">Intel Channel (Email)</label>
                <input type="email" required className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl outline-none focus:border-primary-500 text-white transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-[0.2em] ml-1">Mission Brief</label>
                <textarea rows={4} className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl outline-none focus:border-primary-500 text-white transition-all"></textarea>
              </div>
              <button type="submit" className="w-full py-5 bg-primary-600 hover:bg-primary-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-premium transition-all active:scale-95">
                Send Intel
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="pt-20 pb-16 px-6">
        <div className="max-w-7xl mx-auto border-t border-white/5 pt-20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10 text-center md:text-left">
            <div className="space-y-4">
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <div className="p-2 bg-primary-600 rounded-xl"><GraduationCap className="w-6 h-6 text-white" /></div>
                <span className="text-2xl font-black tracking-tighter uppercase">Bidii<span className="text-primary-400">Elimu</span></span>
              </div>
              <p className="text-primary-200/30 text-xs font-black uppercase tracking-widest max-w-sm leading-loose">
                Redefining institutional management with world-class technology.
              </p>
            </div>
            <div className="flex gap-12 text-left">
              <div>
                <h4 className="font-black text-[10px] uppercase tracking-[0.3em] text-white mb-6">Platform</h4>
                <ul className="space-y-3 text-[10px] font-black uppercase tracking-widest text-primary-200/30">
                  <li><Link to="/solutions" className="hover:text-primary-400 transition-colors">Solutions</Link></li>
                  <li><Link to="/pricing" className="hover:text-primary-400 transition-colors">Pricing</Link></li>
                  <li><a href="#features" className="hover:text-primary-400 transition-colors" onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}>Features</a></li>
                  <li><Link to="/guide" className="hover:text-primary-400 transition-colors">User Guide</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-black text-[10px] uppercase tracking-[0.3em] text-white mb-6">Company</h4>
                <ul className="space-y-3 text-[10px] font-black uppercase tracking-widest text-primary-200/30">
                  <li><Link to="/about" className="hover:text-primary-400 transition-colors">About Us</Link></li>
                  <li><Link to="/careers" className="hover:text-primary-400 transition-colors">Careers</Link></li>
                  <li><a href="#contact" className="hover:text-primary-400 transition-colors" onClick={(e) => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); }}>Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-black text-[10px] uppercase tracking-[0.3em] text-white mb-6">Legal</h4>
                <ul className="space-y-3 text-[10px] font-black uppercase tracking-widest text-primary-200/30">
                  <li><Link to="/terms" className="hover:text-primary-400 transition-colors">Terms</Link></li>
                  <li><Link to="/privacy" className="hover:text-primary-400 transition-colors">Privacy</Link></li>
                  <li><Link to="/cookies" className="hover:text-primary-400 transition-colors">Cookies</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-[10px] font-black text-primary-200/20 uppercase tracking-[0.3em]">
            <p>&copy; {new Date().getFullYear()} BIDIIELIMU SYSTEM PROTOCOL. ALL RIGHTS RESERVED.</p>
            <div className="flex gap-10 mt-6 md:mt-0">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
