import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowRight, ChevronLeft, Fingerprint, ShieldCheck, Smartphone } from 'lucide-react';
import { PasswordInput } from '../components/ui/PasswordInput';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import client from '../api/client';
import { authService } from '../api/services/authService';
import { useAuthStore } from '../store/authStore';
import { mobileService } from '../services/mobileService';
import { useTheme } from '../contexts/ThemeContext';
import { ElimuHubLogo } from '../components/ui/Logo';

declare global {
  interface Window {
    google: any;
    google_initialized?: boolean;
  }
}

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isOTPStep, setIsOTPStep] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [availableMethods, setAvailableMethods] = useState<string[]>([]);
  const [activeMethod, setActiveMethod] = useState<string>('EMAIL');
  const [isLoading, setIsLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const navigate = useNavigate();
  const { schoolName, logoUrl } = useTheme();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    mobileService.checkBiometrics().then(setBiometricAvailable);

    // Initialize Google Login only if Client ID exists
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (window.google && googleClientId && !window.google_initialized) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleLogin,
        });
        window.google_initialized = true;

        const btnElement = document.getElementById("googleBtn");
        if (btnElement) {
          window.google.accounts.id.renderButton(
            btnElement,
            { theme: "filled_blue", size: "large", width: "400", shape: "pill" }
          );
        }
      } catch (err) {
        console.warn("Google Login failed to initialize:", err);
      }
    }
  }, []);

  const handleGoogleLogin = async (response: any) => {
    setIsLoading(true);
    try {
      const res = await client.post('accounts/google/', {
        access_token: response.credential,
      });
      const { access, refresh, user } = res.data;
      setAuth(user, access, refresh);
      toast.success(`Welcome, ${user.first_name}!`);
      navigate(user.role === 'STUDENT' || user.role === 'PARENT' ? '/portal' : '/dashboard');
    } catch (error: any) {
      toast.error('Google login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPassword?: string) => {
    e?.preventDefault();
    setIsLoading(true);
    await mobileService.hapticImpact();
    const loginEmail = customEmail || email;
    const loginPass = customPassword || password;

    const loginToast = toast.loading('Signing you in...');
    try {
      const { access, refresh, user } = await authService.login(loginEmail, loginPass);
      setAuth(user, access, refresh);

      toast.success(`Welcome back, ${user.first_name}!`, { id: loginToast });
      await mobileService.hapticNotification('SUCCESS' as any);

      if (mobileService.isNative()) {
        await mobileService.saveCredentials(loginEmail, loginPass);
      }

      navigate(user.role === 'STUDENT' || user.role === 'PARENT' ? '/portal' : '/dashboard');
    } catch (error: any) {
      const errorData = error.response?.data;
      let msg = error.message || 'Check your connection and credentials';

      if (errorData) {
        if (errorData.email_verified === false) {
          msg = 'Please verify your email address before logging in.';
          setTimeout(() => {
            toast.custom((t) => (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg max-w-md">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Mail className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="ml-3 w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Email Verification Required
                    </p>
                    <div className="mt-4 flex">
                      <button
                        onClick={() => {
                          toast.dismiss(t.id);
                          navigate('/verify-email');
                        }}
                        className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Resend Email
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ), { duration: 10000 });
          }, 1000);
        } else if (errorData?.["2fa_required"]) {
          // Robustly handle both flat and array data from DRF
          const getVal = (val: any) => Array.isArray(val) ? val[0] : val;
          
          setIsOTPStep(true);
          setUserId(getVal(errorData.user_id));
          const methods = errorData.methods;
          if (Array.isArray(methods)) {
            setAvailableMethods(methods);
          } else if (typeof methods === 'string') {
            setAvailableMethods([methods]);
          } else {
            setAvailableMethods(['EMAIL']);
          }
          
          const defaultMethod = getVal(errorData.default_method) || 'EMAIL';
          setActiveMethod(defaultMethod);
          
          toast.success(`Code sent via ${defaultMethod}`, { id: loginToast });
          return;
        } else {
          msg = errorData.detail || msg;
        }
      }

      toast.error(`Login failed: ${msg}`, { id: loginToast });
      await mobileService.hapticNotification('ERROR' as any);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !otp) return;

    setIsLoading(true);
    const otpToast = toast.loading('Verifying code...');
    try {
      const { access, refresh, user } = await authService.verifyOTP(userId, otp);
      setAuth(user, access, refresh);
      toast.success(`Welcome back, ${user.first_name}!`, { id: otpToast });
      navigate(user.role === 'STUDENT' || user.role === 'PARENT' ? '/portal' : '/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Invalid or expired code.', { id: otpToast });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async (method: string) => {
    if (!userId) return;
    setIsLoading(true);
    const resendToast = toast.loading(`Sending code via ${method}...`);
    try {
      await authService.triggerOTP(userId, method);
      setActiveMethod(method);
      toast.success(`New code sent via ${method}`, { id: resendToast });
    } catch (error: any) {
      toast.error('Failed to resend code. Please try again.', { id: resendToast });
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
    <div className="min-h-screen flex items-center justify-center bg-transparent relative overflow-hidden px-4 py-8 md:py-12">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary-500/10 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent-500/10 rounded-full blur-[120px] animate-pulse-slow" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[480px] relative z-10"
      >
        <Link to="/" className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors mb-6 sm:mb-8 text-sm font-semibold group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Home
        </Link>

        <div className="glass p-6 sm:p-10 md:p-12 rounded-[32px] sm:rounded-[40px]">
          <div className="text-center mb-8 sm:mb-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`inline-flex w-16 h-16 sm:w-20 sm:h-20 rounded-3xl mb-6 shadow-premium items-center justify-center overflow-hidden border border-white/10 ${logoUrl ? 'bg-primary-600' : 'bg-transparent'}`}
            >
              {logoUrl ? (
                <img src={logoUrl} alt={schoolName} className="w-full h-full object-cover" />
              ) : (
                <ElimuHubLogo className="w-12 h-12 sm:w-16 sm:h-16" showText={false} />
              )}
            </motion.div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-primary tracking-tight mb-2 sm:mb-3">Welcome Back</h1>
            <p className="text-muted font-medium text-xs sm:text-sm md:text-base">Experience the next generation of school management</p>
          </div>

          <AnimatePresence mode="wait">
            {!isOTPStep ? (
              <motion.form
                key="login-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleLogin}
                className="space-y-5 sm:space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted transition-colors group-focus-within:text-primary-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@school.com"
                      className="w-full bg-white/5 border border-white/10 text-primary pl-12 pr-4 py-3.5 sm:py-4 rounded-2xl outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all placeholder:text-muted/30 text-base"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-sm font-semibold text-muted">Password</label>
                    <Link to="/forgot-password" className="text-xs font-bold text-primary-400 hover:text-primary-300">Forgot?</Link>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted transition-colors group-focus-within:text-primary-400" />
                    <PasswordInput
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 text-primary pl-12 pr-12 py-3.5 sm:py-4 rounded-2xl outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all placeholder:text-muted/30 text-base"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-3.5 sm:py-4 rounded-2xl shadow-premium active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50 mt-2"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In <ArrowRight className="w-5 h-5" /></>}
                </button>

                {biometricAvailable && (
                  <button
                    type="button"
                    onClick={handleBiometricLogin}
                    className="w-full bg-white/5 hover:bg-white/10 text-primary font-bold py-3.5 sm:py-4 rounded-2xl border border-white/5 transition-all flex items-center justify-center gap-2 text-base"
                  >
                    <Fingerprint className="w-5 h-5 text-primary-400" />
                    Biometrics
                  </button>
                )}

                <div className="relative my-6 sm:my-8">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-bg-color px-4 text-muted font-bold tracking-widest">Or</span>
                  </div>
                </div>

                <div id="googleBtn" className="flex justify-center"></div>
              </motion.form>
            ) : (
              <motion.form
                key="otp-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleOTPVerify}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <div className="inline-flex w-14 h-14 sm:w-16 sm:h-16 bg-primary-500/10 rounded-2xl items-center justify-center mb-4 border border-primary-500/20">
                    <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8 text-primary-400" />
                  </div>
                  <h2 className="text-xl font-bold text-primary mb-2">Verification</h2>
                  <p className="text-muted text-sm px-2">
                    Code sent to your <span className="text-primary-400 font-bold">{(typeof activeMethod === 'string' ? activeMethod : 'Email').toLowerCase()}</span>
                  </p>
                </div>

                <div className="space-y-4">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full bg-white/5 border border-white/10 text-primary text-center text-3xl font-bold tracking-[8px] sm:tracking-[10px] py-4 sm:py-5 rounded-2xl outline-none focus:border-primary-500 transition-all placeholder:text-muted/20"
                    required
                    autoFocus
                  />

                  <div className="flex flex-col gap-3">
                    <button
                      type="submit"
                      disabled={isLoading || otp.length < 6}
                      className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-3.5 sm:py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setIsOTPStep(false)}
                      className="w-full text-muted hover:text-primary font-medium py-2 transition-all text-sm"
                    >
                      Back to Login
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-3 text-center">Resend Code</p>
                  <div className="grid grid-cols-2 gap-2">
                    {availableMethods.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleResendOTP(m)}
                        className={`flex items-center justify-center gap-2 py-2.5 px-2 rounded-xl text-[10px] font-bold transition-all border ${
                          activeMethod === m 
                            ? 'bg-primary-500/20 border-primary-500/30 text-primary-400' 
                            : 'bg-white/5 border-white/5 text-muted hover:bg-white/10'
                        }`}
                      >
                        {m === 'SMS' ? <Smartphone className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-8 sm:mt-10 text-center">
            <p className="text-muted font-medium text-sm">
              New here?{' '}
              <Link to="/register" className="text-primary-400 font-bold hover:underline">Register</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
