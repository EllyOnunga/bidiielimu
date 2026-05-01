import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Lock, Mail, ArrowRight, Loader2, ChevronLeft, Fingerprint } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import client from '../api/client';
import { useAuthStore } from '../store/authStore';
import { mobileService } from '../services/mobileService';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    mobileService.checkBiometrics().then(setBiometricAvailable);
  }, []);

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPassword?: string) => {
    e?.preventDefault();
    setIsLoading(true);
    await mobileService.hapticImpact();
    const loginEmail = customEmail || email;
    const loginPass = customPassword || password;

    const loginToast = toast.loading('Signing you in...');
    try {
      const response = await client.post('accounts/login/', { email: loginEmail, password: loginPass });
      const { access, user } = response.data;
      setAuth(user, access);
      
      toast.success(`Welcome back, ${user.first_name}!`, { id: loginToast });
      await mobileService.hapticNotification('SUCCESS' as any);
      
      // Save for future biometrics if on mobile
      if (mobileService.isNative()) {
        await mobileService.saveCredentials(loginEmail, loginPass);
      }

      if (user.role === 'STUDENT' || user.role === 'PARENT') {
        navigate('/portal');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Login failed', error);
      const msg = error.response?.data?.detail || error.message || 'Check your connection and credentials';
      toast.error(`Login failed: ${msg}`, { id: loginToast });
      await mobileService.hapticNotification('ERROR' as any);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    await mobileService.hapticImpact();
    const success = await mobileService.authenticateBiometric();
    if (success) {
      const creds = await mobileService.getCredentials();
      if (creds) {
        handleLogin(undefined, creds.username, creds.password);
      } else {
        toast.error('No saved credentials found. Please log in manually once.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent relative overflow-hidden px-4 py-12">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary-500/10 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent-500/10 rounded-full blur-[120px] animate-pulse-slow" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[480px] relative z-10"
      >
        <Link to="/" className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors mb-8 text-sm font-semibold group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Home
        </Link>

        <div className="glass p-8 md:p-12 rounded-[40px]">
          <div className="text-center mb-10">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex p-4 bg-primary-600 rounded-3xl mb-6 shadow-premium"
            >
              <GraduationCap className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">Welcome Back</h1>
            <p className="text-primary-200/60 font-medium text-sm md:text-base">Experience the next generation of school management</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-primary-200/70 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400/50 group-focus-within:text-primary-400 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@school.com"
                  className="w-full bg-white/5 border border-white/10 text-white pl-12 pr-4 py-4 rounded-2xl outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all placeholder:text-primary-400/30 text-base"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-semibold text-primary-200/70">Password</label>
                <a href="#" className="text-xs font-bold text-primary-400 hover:text-primary-300 transition-colors">Forgot Password?</a>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400/50 group-focus-within:text-primary-400 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 text-white pl-12 pr-4 py-4 rounded-2xl outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all placeholder:text-primary-400/30 text-base"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-4 rounded-2xl shadow-premium active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50 disabled:scale-100 mt-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Sign In to BidiiElimu
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {biometricAvailable && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                type="button"
                onClick={handleBiometricLogin}
                className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl border border-white/5 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-base"
              >
                <Fingerprint className="w-5 h-5 text-primary-400" />
                Fast Access with Biometrics
              </motion.button>
            )}
          </form>

          <div className="mt-10 text-center">
            <p className="text-primary-200/50 font-medium text-sm">
              New to BidiiElimu?{' '}
              <Link to="/register" className="text-primary-400 font-bold hover:text-primary-300 transition-colors underline-offset-4 hover:underline">Create an Account</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
