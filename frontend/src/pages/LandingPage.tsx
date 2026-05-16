import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { ThemeToggle } from "../components/ThemeToggle";
import { ElimuHubLogo } from "../components/ui/Logo";

import {
  GraduationCap,
  BarChart3,
  Users,
  Globe,
  CheckCircle2,
  ArrowRight,
  Menu,
  X,
  Mail,
  Phone,
  MapPin,
  Play,
  Sparkles,
  Rocket,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";

/* ─── Reusable sub-components ─── */
const FeatureCard = ({
  icon: Icon,
  title,
  desc,
  delay,
}: {
  icon: any;
  title: string;
  desc: string;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    className="glass-interactive p-8 sm:p-10 rounded-[32px] sm:rounded-[40px] group relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-primary-500/10 transition-colors" />

    <div className="p-4 bg-primary-600 rounded-2xl text-white w-fit mb-8 shadow-premium group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
      <Icon className="w-6 h-6" />
    </div>

    <h3 className="text-xl sm:text-2xl font-black mb-4 text-primary tracking-tight uppercase">
      {title}
    </h3>
    <p className="text-muted text-sm sm:text-base font-medium leading-relaxed">
      {desc}
    </p>
  </motion.div>
);

const StatItem = ({
  value,
  label,
  delay,
}: {
  value: string;
  label: string;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    className="group"
  >
    <div className="text-4xl sm:text-5xl md:text-6xl font-black text-primary mb-2 group-hover:scale-110 group-hover:text-primary-500 transition-all duration-500">
      {value}
    </div>
    <div className="text-muted text-[10px] sm:text-xs font-black uppercase tracking-[0.2em]">
      {label}
    </div>
  </motion.div>
);

/* ─── Main Landing Page ─── */
export const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-bg-color transition-colors duration-500 overflow-x-hidden">
      {/* ── MESH BACKGROUND ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[url('/mesh-bg.png')] bg-cover bg-center opacity-[0.07] dark:opacity-[0.15] mix-blend-overlay animate-subtle-zoom" />
        <div className="absolute inset-0 bg-gradient-to-b from-bg-color via-transparent to-bg-color" />
      </div>

      {/* ── HEADER ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 py-4 sm:py-6 px-4 ${scrolled ? "bg-bg-color/80 backdrop-blur-xl shadow-2xl py-3 sm:py-4" : ""}`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group relative z-10">
            <ElimuHubLogo className="w-10 h-10 sm:w-12 h-12" showText={true} />
          </Link>

          <nav className="hidden lg:flex items-center gap-8 xl:gap-12 glass px-8 py-3 rounded-2xl border-white/5">
            {["Features", "Pricing", "Testimonials", "Contact"].map((item) => (
              <button
                key={item}
                onClick={() => scrollTo(item.toLowerCase())}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:text-primary-500 transition-colors relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-500 transition-all duration-300 group-hover:w-full" />
              </button>
            ))}
            <Link
              to="/guide"
              className="text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:text-primary-500 transition-colors"
            >
              Guide
            </Link>
          </nav>

          <div className="hidden sm:flex items-center gap-4 relative z-10">
            <ThemeToggle />
            <Link
              to="/login"
              className="text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:text-primary transition-colors px-4 py-2"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-premium active:scale-95 transition-all"
            >
              Join the Future
            </Link>
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 sm:p-3 bg-white/5 rounded-xl text-primary border border-white/10"
          >
            {isMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden mt-4 overflow-hidden"
            >
              <div className="glass p-6 sm:p-8 rounded-[32px] space-y-6">
                {["Features", "Pricing", "Contact"].map((item) => (
                  <button
                    key={item}
                    onClick={() => scrollTo(item.toLowerCase())}
                    className="block text-lg font-black uppercase tracking-widest text-muted hover:text-primary w-full text-left"
                  >
                    {item}
                  </button>
                ))}
                <Link
                  to="/guide"
                  className="block text-lg font-black uppercase tracking-widest text-muted hover:text-primary w-full text-left"
                >
                  Guide
                </Link>
                <div className="pt-4 border-t border-white/5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black uppercase tracking-widest text-primary">
                      Theme
                    </span>
                    <ThemeToggle />
                  </div>
                  <Link
                    to="/login"
                    className="text-lg font-black uppercase tracking-widest text-primary"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="block py-4 bg-primary-600 text-center rounded-2xl font-black uppercase tracking-widest text-xs shadow-premium text-white"
                  >
                    Start Free Trial
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── HERO ── */}
      <section className="relative pt-32 sm:pt-48 md:pt-60 pb-20 sm:pb-32 px-4 z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 sm:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] mb-8"
            >
              <Sparkles className="w-3 h-3" /> The Vanguard of African Education
            </motion.div>

            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9] text-primary font-serif">
              Educate <br />
              <span className="text-gradient italic">Without Limits.</span>
            </h1>

            <p className="text-base sm:text-xl text-muted mb-12 font-medium leading-relaxed max-w-xl">
              ElimuHub is the most advanced multi-tenant SaaS architecture
              engineered to power the next generation of academic excellence.
              Streamline operations, amplify learning, and secure your
              institutional legacy.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl sm:rounded-[24px] font-black uppercase tracking-widest text-xs shadow-premium active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                Deploy System <Rocket className="w-5 h-5" />
              </Link>
              <Link
                to="/solutions"
                className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 glass hover:bg-white/10 text-primary rounded-2xl sm:rounded-[24px] font-black uppercase tracking-widest text-xs border border-white/10 transition-all flex items-center justify-center gap-3 group"
              >
                <Play className="w-4 h-4 fill-primary-500 text-primary-500 group-hover:scale-125 transition-transform" />{" "}
                Tactical Briefing
              </Link>
            </div>

            <div className="mt-16 flex items-center gap-6 opacity-40">
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-bg-color bg-slate-800"
                  />
                ))}
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted">
                Trusted by 200+ Institutions
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative perspective-2000 lg:block mt-12 lg:mt-0"
          >
            <div className="absolute inset-0 bg-primary-500/20 blur-[60px] sm:blur-[100px] rounded-full animate-pulse-slow" />
            <div className="glass p-2 sm:p-3 rounded-[32px] sm:rounded-[56px] shadow-2xl relative overflow-hidden group border-white/10">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary-600/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 z-20 pointer-events-none" />
              <div className="relative z-10 animate-float">
                <img
                  src="/hero-mockup.png"
                  alt="ElimuHub Command Center"
                  className="w-full h-auto rounded-[24px] sm:rounded-[48px] object-cover"
                />
              </div>

              {/* Decorative Floating Elements - Hidden on very small screens to avoid clutter */}
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute top-6 sm:top-10 -right-4 sm:-right-10 glass p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-2xl z-30 border-white/20 hidden sm:block"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div>
                    <p className="text-[7px] sm:text-[8px] font-black text-muted uppercase">
                      Efficiency
                    </p>
                    <p className="text-xs font-black text-primary">+84%</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30 animate-bounce">
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-muted">
            Operational Scroll
          </p>
          <ChevronDown className="w-4 h-4" />
        </div>
      </section>

      {/* ── LOGO CLOUD ── */}
      <section className="py-20 border-y border-white/5 bg-white/[0.01] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-[10px] font-black text-muted uppercase tracking-[0.4em] mb-12">
            Global Strategic Partners
          </p>
          <div className="flex flex-wrap items-center justify-center gap-12 md:gap-24 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
            {["Azure", "Stripe", "Google", "Safaricom", "Equity"].map(
              (logo) => (
                <span
                  key={logo}
                  className="text-2xl sm:text-3xl font-black text-primary tracking-tighter italic"
                >
                  {logo}
                </span>
              ),
            )}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-32 sm:py-48 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
            <div className="max-w-2xl">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl sm:text-5xl md:text-7xl font-black text-primary mb-6 leading-tight"
              >
                Infinite <span className="text-gradient">Capabilities.</span>
              </motion.h2>
              <p className="text-base sm:text-lg text-muted font-medium leading-relaxed">
                A unified ecosystem designed to eliminate administrative
                friction and catalyze student success across every academic
                dimension.
              </p>
            </div>
            <Link
              to="/solutions"
              className="text-xs font-black uppercase tracking-widest text-primary-500 hover:text-primary-400 flex items-center gap-2 transition-all"
            >
              Explore All Modules <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <FeatureCard
              delay={0.1}
              icon={Users}
              title="Student SIS"
              desc="Complete lifecycle management with real-time performance analytics and behavioral mapping."
            />
            <FeatureCard
              delay={0.2}
              icon={BarChart3}
              title="Capital Core"
              desc="Intelligent fee collection with automated invoicing and real-time bank reconciliation hooks."
            />
            <FeatureCard
              delay={0.3}
              icon={ShieldCheck}
              title="Multi-Tenant"
              desc="Bank-grade data isolation ensuring your institution's digital intelligence remains strictly private."
            />
            <FeatureCard
              delay={0.4}
              icon={Globe}
              title="Cloud Portal"
              desc="Ultra-responsive interfaces for students and parents, accessible from any device, anywhere."
            />
            <FeatureCard
              delay={0.5}
              icon={CheckCircle2}
              title="Omni-Attendance"
              desc="Biometric-ready tracking with instant multi-channel alerts for guardians and staff."
            />
            <FeatureCard
              delay={0.6}
              icon={GraduationCap}
              title="Matrix Grading"
              desc="Sophisticated result processing with dynamic report cards and academic trend identification."
            />
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE SHOWCASE ── */}
      <section className="py-32 px-4">
        <div className="max-w-7xl mx-auto glass p-8 sm:p-16 md:p-24 rounded-[40px] sm:rounded-[80px] overflow-hidden relative border-white/10 shadow-3xl">
          <div className="absolute top-0 right-0 w-[50%] h-full bg-primary-600/10 blur-[120px] rounded-full -mr-[20%]" />

          <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
            <div>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-primary mb-8 leading-tight">
                Master the <br />{" "}
                <span className="text-gradient italic">
                  Institutional Flow.
                </span>
              </h2>
              <div className="space-y-8">
                {[
                  {
                    t: "Automated Timetabling",
                    d: "Resolve 10,000+ schedule nodes in seconds with our algorithmic engine.",
                  },
                  {
                    t: "Secure Communication",
                    d: "Omni-channel messaging that connects staff, parents, and students instantly.",
                  },
                  {
                    t: "Financial Intelligence",
                    d: "Real-time cashflow dashboards with predictive revenue modeling.",
                  },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-6 group"
                  >
                    <div className="w-1.5 h-12 bg-primary-500/20 group-hover:bg-primary-500 rounded-full transition-all duration-500" />
                    <div>
                      <h4 className="text-xl font-black text-primary mb-2 uppercase tracking-tight">
                        {item.t}
                      </h4>
                      <p className="text-muted text-sm font-medium leading-relaxed">
                        {item.d}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <button className="mt-12 px-10 py-5 bg-primary-600 text-white rounded-[24px] font-black uppercase tracking-widest text-xs shadow-premium hover:bg-primary-500 transition-all">
                Request Deployment Briefing
              </button>
            </div>

            <div className="relative group">
              <div className="glass p-4 rounded-[48px] rotate-3 group-hover:rotate-0 transition-transform duration-700 shadow-2xl border-white/20">
                <img
                  src="/hero-mockup.png"
                  alt="Analytics View"
                  className="w-full h-auto rounded-[36px]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ──StatItem valueStatItem STATS ── */}
      <section className="py-20 sm:py-32 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 sm:gap-20 text-center">
            <StatItem value="150+" label="Active Institutions" delay={0.1} />
            <StatItem value="85k+" label="Daily Active Users" delay={0.2} />
            <StatItem value="99.99%" label="Operational Uptime" delay={0.3} />
            <StatItem value="24/7" label="Strategic Support" delay={0.4} />
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-32 sm:py-48 px-4 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl sm:text-6xl font-black text-primary mb-6 uppercase tracking-tight">
              System <span className="text-gradient">Investment.</span>
            </h2>
            <p className="text-muted text-base sm:text-lg font-medium max-w-2xl mx-auto">
              Transparent pricing designed to scale with your institution's
              growth trajectory.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Standard",
                price: "3,500",
                for: "Emerging Schools",
                features: [
                  "Core SIS",
                  "Attendance",
                  "Messaging",
                  "Up to 200 Students",
                ],
              },
              {
                name: "Enterprise",
                price: "9,500",
                for: "Elite Institutions",
                highlight: true,
                features: [
                  "Full LMS",
                  "Fee Management",
                  "Advanced Analytics",
                  "Unlimited Students",
                  "Premium Support",
                ],
              },
              {
                name: "Custom",
                price: "TBA",
                for: "Multi-Campus",
                features: [
                  "System Integration",
                  "Dedicated Database",
                  "Custom Branding",
                  "API Access",
                  "On-Site Training",
                ],
              },
            ].map((plan, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`glass p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] flex flex-col border-2 transition-all duration-500 ${plan.highlight ? "border-primary-500 shadow-premium scale-105 relative z-10" : "border-white/5 hover:border-white/10"}`}
              >
                {plan.highlight && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary-500 text-white text-[10px] font-black px-6 py-2 rounded-full uppercase tracking-[0.2em] shadow-lg">
                    Recommended Vector
                  </div>
                )}
                <div className="mb-10">
                  <h3 className="text-2xl font-black text-primary mb-1 uppercase tracking-tighter">
                    {plan.name}
                  </h3>
                  <p className="text-[10px] font-black text-muted uppercase tracking-widest">
                    {plan.for}
                  </p>
                </div>

                <div className="mb-10 flex items-baseline gap-2">
                  <span className="text-[10px] font-black text-muted uppercase">
                    KES
                  </span>
                  <span className="text-5xl font-black text-primary">
                    {plan.price}
                  </span>
                  <span className="text-[10px] font-black text-muted uppercase">
                    /month
                  </span>
                </div>

                <ul className="space-y-4 mb-10 flex-1">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-3 text-xs font-bold text-muted"
                    >
                      <CheckCircle2 className="w-4 h-4 text-primary-500" /> {f}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/register"
                  className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-center transition-all ${
                    plan.highlight
                      ? "bg-primary-500 text-white shadow-premium hover:bg-primary-400"
                      : "bg-white/5 text-primary hover:bg-white/10"
                  }`}
                >
                  Initialize Access
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section
        id="contact"
        className="py-32 sm:py-48 px-4 relative overflow-hidden"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary-500/5 blur-[150px] rounded-full pointer-events-none" />
        <div className="max-w-6xl mx-auto glass rounded-[40px] sm:rounded-[60px] overflow-hidden grid lg:grid-cols-2 relative border-white/10 shadow-3xl">
          <div className="p-8 sm:p-12 md:p-20 bg-primary-600 relative overflow-hidden text-white">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-black mb-10 leading-tight uppercase tracking-tighter">
                Inaugurate Your <br /> Digital Era.
              </h2>
              <p className="text-white/60 font-medium mb-12 max-w-md">
                Our strategic advisors are ready to help you blueprint the
                perfect implementation for your school.
              </p>

              <div className="space-y-8">
                {[
                  {
                    icon: Mail,
                    label: "Intel Channel",
                    value: "comms@elimuhub.app",
                  },
                  { icon: Phone, label: "Hotline", value: "+254 700 888 999" },
                  {
                    icon: MapPin,
                    label: "Headquarters",
                    value: "Orbital Complex, Nairobi, KE",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-6 group cursor-pointer"
                  >
                    <div className="p-4 bg-white/10 rounded-2xl group-hover:bg-white group-hover:text-primary-600 transition-all duration-500 shadow-xl">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">
                        {item.label}
                      </p>
                      <p className="text-xl font-black">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-10 sm:p-16 md:p-20">
            <form
              className="space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                toast.success(
                  "Mission Brief Received. Standing by for response.",
                );
              }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1">
                    Agent Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl outline-none focus:border-primary-500 text-primary transition-all text-sm font-bold"
                    placeholder="First Last"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1">
                    Intel Channel (Email)
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl outline-none focus:border-primary-500 text-primary transition-all text-sm font-bold"
                    placeholder="you@agency.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1">
                  Institutional Profile
                </label>
                <input
                  type="text"
                  className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl outline-none focus:border-primary-500 text-primary transition-all text-sm font-bold"
                  placeholder="School Name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1">
                  Mission Brief (Message)
                </label>
                <textarea
                  rows={4}
                  className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl outline-none focus:border-primary-500 text-primary transition-all text-sm font-bold resize-none"
                  placeholder="How can we assist your transition?"
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full py-5 bg-primary-600 hover:bg-primary-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-premium transition-all active:scale-95"
              >
                Transmit Briefing
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ── BACK TO TOP ── */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed bottom-8 right-8 p-4 glass rounded-2xl text-primary-500 border-primary-500/30 z-[90] transition-all duration-500 ${scrolled ? "translate-y-0 opacity-100 shadow-glow" : "translate-y-20 opacity-0"}`}
      >
        <ChevronDown className="w-6 h-6 rotate-180" />
      </button>
    </div>
  );
};
