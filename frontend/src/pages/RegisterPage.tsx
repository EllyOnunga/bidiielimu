import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Lock, Mail, User, School, ArrowRight, Loader2, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import client from '../api/client';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    school_name: '',
    email: '',
    password: '',
    admin_name: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const [first_name, ...rest] = formData.admin_name.trim().split(' ');
      const last_name = rest.join(' ');
      
      const payload = {
        school_name: formData.school_name,
        email: formData.email,
        password: formData.password,
        first_name: first_name || '',
        last_name: last_name || ''
      };
      
      await client.post('accounts/register/', payload);
      alert('Registration successful! Please login.');
      navigate('/login');
    } catch (error: any) {
      console.error('Registration failed', error);
      const errorData = error.response?.data;
      if (errorData && typeof errorData === 'object') {
        const firstErrorKey = Object.keys(errorData)[0];
        const firstErrorMsg = Array.isArray(errorData[firstErrorKey]) ? errorData[firstErrorKey][0] : errorData[firstErrorKey];
        alert(`Registration failed: ${firstErrorMsg}`);
      } else {
        alert('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] relative overflow-hidden px-4 py-12">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-900/20 rounded-full blur-[120px]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[500px] relative z-10"
      >
        <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm">
          <ChevronLeft className="w-4 h-4" /> Back to Home
        </Link>
        <div className="glass-dark p-6 md:p-10 rounded-[32px] border border-white/5 shadow-2xl">
          <div className="text-center mb-8 md:mb-10">
            <div className="inline-flex p-3 md:p-4 bg-primary-600 rounded-2xl mb-4 md:mb-6">
              <GraduationCap className="w-8 h-8 md:w-10 md:h-10 text-white" />
            </div>
            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight mb-2">Register School</h1>
            <p className="text-slate-400 font-medium text-sm md:text-base">Start your journey with EliteEdu today</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs md:text-sm font-semibold text-slate-400 ml-1">School Name</label>
                <div className="relative group">
                  <School className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={formData.school_name}
                    onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                    className="w-full bg-slate-800/50 border border-slate-700/50 text-white pl-11 pr-4 py-3 rounded-2xl outline-none focus:border-primary-500 transition-all text-sm"
                    placeholder="Excellence Academy"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs md:text-sm font-semibold text-slate-400 ml-1">Admin Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={formData.admin_name}
                    onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
                    className="w-full bg-slate-800/50 border border-slate-700/50 text-white pl-11 pr-4 py-3 rounded-2xl outline-none focus:border-primary-500 transition-all text-sm"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs md:text-sm font-semibold text-slate-400 ml-1">Work Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-white pl-12 pr-4 py-3 md:py-4 rounded-2xl outline-none focus:border-primary-500 transition-all text-sm md:text-base"
                  placeholder="admin@school.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs md:text-sm font-semibold text-slate-400 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-white pl-12 pr-4 py-3 md:py-4 rounded-2xl outline-none focus:border-primary-500 transition-all text-sm md:text-base"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-3 md:py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm md:text-base"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create Account <ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-400 font-medium text-xs md:text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-400 font-bold hover:text-primary-300 transition-colors">Sign In</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
