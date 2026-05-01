import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Lock, Mail, ArrowRight, Loader2, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import client from '../api/client';
import { useAuthStore } from '../store/authStore';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await client.post('accounts/login/', { email, password });
      const { access, user } = response.data;
      setAuth(user, access);
      
      // Role-aware redirection
      if (user.role === 'STUDENT' || user.role === 'PARENT') {
        navigate('/portal');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Login failed', error);
      const msg = error.response?.data?.detail || error.message || 'Unknown error';
      alert(`Login failed: ${msg}\nTarget: ${client.defaults.baseURL}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] relative overflow-hidden px-4 py-12">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-900/20 rounded-full blur-[120px]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[450px] relative z-10"
      >
        <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm">
          <ChevronLeft className="w-4 h-4" /> Back to Home
        </Link>
        <div className="glass-dark p-6 md:p-10 rounded-[32px] border border-white/5 shadow-2xl">
          <div className="text-center mb-8 md:mb-10">
            <div className="inline-flex p-3 md:p-4 bg-primary-600 rounded-2xl mb-4 md:mb-6 shadow-lg shadow-primary-900/40">
              <GraduationCap className="w-8 h-8 md:w-10 md:h-10 text-white" />
            </div>
            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight mb-2 md:mb-3">Welcome Back</h1>
            <p className="text-slate-400 font-medium text-sm md:text-base">Enter your credentials to access your dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 md:space-y-6">
            <div className="space-y-2">
              <label className="text-xs md:text-sm font-semibold text-slate-400 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@school.com"
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-white pl-12 pr-4 py-3 md:py-4 rounded-2xl outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all placeholder:text-slate-600 text-sm md:text-base"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs md:text-sm font-semibold text-slate-400">Password</label>
                <a href="#" className="text-[10px] md:text-xs font-bold text-primary-400 hover:text-primary-300 transition-colors">Forgot Password?</a>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-white pl-12 pr-4 py-3 md:py-4 rounded-2xl outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all placeholder:text-slate-600 text-sm md:text-base"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-3 md:py-4 rounded-2xl shadow-lg shadow-primary-900/40 hover:shadow-primary-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm md:text-base disabled:opacity-50 disabled:scale-100"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 md:mt-10 text-center">
            <p className="text-slate-400 font-medium text-xs md:text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-400 font-bold hover:text-primary-300 transition-colors">Create Account</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
