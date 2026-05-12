import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  Mail,
  ArrowRight,
  Loader2,
  ChevronLeft,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { authService } from "../api/services/authService";

export const EmailVerificationPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "expired"
  >("loading");
  const [email, setEmail] = useState("");
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      await authService.verifyEmail(verificationToken);
      setStatus("success");
      toast.success("Email verified successfully!");
      setTimeout(() => navigate("/login"), 3000);
    } catch (error: any) {
      console.error("Verification failed", error);
      if (error.response?.status === 400) {
        setStatus("expired");
      } else {
        setStatus("error");
      }
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsResending(true);
    try {
      await authService.resendVerification(email);
      toast.success("Verification email sent! Please check your inbox.");
      setEmail("");
    } catch (error: any) {
      toast.error("Failed to send verification email. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="inline-flex w-20 h-20 bg-primary-600 rounded-3xl mb-6 shadow-premium items-center justify-center">
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
              Verifying Email
            </h1>
            <p className="text-primary-200/60 font-medium">
              Please wait while we verify your email address...
            </p>
          </motion.div>
        );

      case "success":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="inline-flex w-20 h-20 bg-green-600 rounded-3xl mb-6 shadow-premium items-center justify-center">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
              Email Verified!
            </h1>
            <p className="text-primary-200/60 font-medium mb-6">
              Your email has been successfully verified. You can now sign in to
              your account.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white font-bold px-8 py-4 rounded-2xl shadow-premium transition-all"
            >
              Continue to Login
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        );

      case "expired":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md mx-auto"
          >
            <div className="inline-flex w-20 h-20 bg-orange-600 rounded-3xl mb-6 shadow-premium items-center justify-center">
              <XCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
              Link Expired
            </h1>
            <p className="text-primary-200/60 font-medium mb-6">
              This verification link has expired. Please request a new one.
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-primary-200/70 ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400/50 group-focus-within:text-primary-400 transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@school.com"
                    className="w-full bg-white/5 border border-white/10 text-white pl-12 pr-4 py-4 rounded-2xl outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all placeholder:text-primary-400/30 text-base"
                  />
                </div>
              </div>

              <button
                onClick={handleResendVerification}
                disabled={isResending || !email}
                className="w-full bg-primary-600 hover:bg-primary-500 disabled:bg-primary-600/50 text-white font-bold py-4 rounded-2xl shadow-premium active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-base"
              >
                {isResending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Send New Verification Email
                  </>
                )}
              </button>
            </div>
          </motion.div>
        );

      case "error":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="inline-flex w-20 h-20 bg-red-600 rounded-3xl mb-6 shadow-premium items-center justify-center">
              <XCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
              Verification Failed
            </h1>
            <p className="text-primary-200/60 font-medium mb-6">
              We couldn't verify your email. The link may be invalid or expired.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white font-bold px-8 py-4 rounded-2xl shadow-premium transition-all"
            >
              Back to Login
            </Link>
          </motion.div>
        );
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
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors mb-8 text-sm font-semibold group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />{" "}
          Back to Home
        </Link>

        <div className="glass p-8 md:p-12 rounded-[40px]">
          {renderContent()}
        </div>
      </motion.div>
    </div>
  );
};
