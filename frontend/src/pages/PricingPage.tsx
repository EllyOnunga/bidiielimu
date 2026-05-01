import { Link } from 'react-router-dom';
import { CheckCircle2, Zap, ChevronLeft, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const plans = [
  {
    name: 'Starter',
    price: 'KES 3,500',
    period: '/month',
    desc: 'Perfect for small primary schools just getting started.',
    color: 'border-slate-700',
    badge: null,
    features: [
      'Up to 200 students',
      '5 teacher accounts',
      'Student & attendance management',
      'Basic exam & grading',
      'Email support',
      'Mobile-friendly interface',
    ],
  },
  {
    name: 'Professional',
    price: 'KES 9,500',
    period: '/month',
    desc: 'The most popular choice for growing secondary schools.',
    color: 'border-primary-500',
    badge: 'Most Popular',
    features: [
      'Up to 800 students',
      '20 teacher accounts',
      'Everything in Starter',
      'Fee management & M-Pesa',
      'Smart timetabling',
      'Parent portal access',
      'Audit logs',
      'Priority support',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For school groups, counties, and international chains.',
    color: 'border-slate-700',
    badge: null,
    features: [
      'Unlimited students & schools',
      'Unlimited teacher accounts',
      'Everything in Professional',
      'Multi-school dashboard',
      'Custom branding & domain',
      'Dedicated account manager',
      'SLA & uptime guarantee',
      'On-site training',
    ],
  },
];

export const PricingPage = () => (
  <div className="min-h-screen bg-[#0f172a] text-white">
    <div className="max-w-7xl mx-auto px-4 pt-28 pb-20">
      <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-10 transition-colors">
        <ChevronLeft className="w-4 h-4" />Back to Home
      </Link>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-bold mb-6">
          <Zap className="w-3 h-3" />TRANSPARENT PRICING
        </div>
        <h1 className="text-5xl font-black mb-4">Simple, School-Friendly Pricing</h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">No hidden fees. No contracts. Cancel anytime. Start free for 30 days.</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8 items-start">
        {plans.map((plan, i) => (
          <motion.div key={plan.name} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className={`glass-dark rounded-[32px] border-2 ${plan.color} p-8 relative overflow-hidden`}>
            {plan.badge && (
              <div className="absolute top-6 right-6 bg-primary-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                {plan.badge}
              </div>
            )}
            <div className="mb-8">
              <h3 className="text-xl font-black mb-2">{plan.name}</h3>
              <p className="text-slate-400 text-sm mb-6">{plan.desc}</p>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-black">{plan.price}</span>
                <span className="text-slate-400 font-bold pb-1">{plan.period}</span>
              </div>
            </div>
            <ul className="space-y-3 mb-10">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-primary-400 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/register"
              className={`w-full py-3 rounded-2xl font-bold text-center flex items-center justify-center gap-2 transition-all ${plan.badge ? 'bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-900/20' : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'}`}>
              {plan.price === 'Custom' ? 'Contact Sales' : 'Start Free Trial'} <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="mt-20 text-center">
        <p className="text-slate-400 text-sm">All plans include a 30-day free trial. No credit card required.</p>
        <p className="text-slate-400 text-sm mt-2">Need a custom quote? <Link to="/#contact" className="text-primary-400 hover:underline font-bold">Contact our team.</Link></p>
      </div>
    </div>
  </div>
);
