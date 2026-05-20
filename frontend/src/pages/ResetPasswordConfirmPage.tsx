import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Lock, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { PasswordInput } from "../components/ui/PasswordInput";
import { PasswordHint } from "../components/ui/PasswordHint";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { authService } from "../api/services/authService";
import { Button } from "../components/ui/Button";

export const ResetPasswordConfirmPage = () => {
  const { uid, token } = useParams<{ uid?: string; token?: string }>();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!uid || !token) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-600/20 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-600/20 blur-[120px] rounded-full" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md z-10"
        >
          <div className="glass p-8 md:p-10 rounded-[40px] border border-white/10 shadow-2xl text-center space-y-6">
            <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto border border-rose-500/20 animate-pulse">
              <AlertCircle className="w-10 h-10 text-rose-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-primary tracking-tight">
                Incomplete Reset Link
              </h2>
              <p className="text-muted text-sm leading-relaxed">
                The password reset link appears to be truncated or copied
                incorrectly. Please make sure to copy the entire URL from the
                email.
              </p>
            </div>
            <Button
              onClick={() => navigate("/forgot-password")}
              className="w-full h-14 text-lg font-black shadow-xl shadow-primary-900/20"
            >
              Request New Link
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await authService.confirmPasswordReset({
        uid,
        token,
        new_password1: password,
        new_password2: password,
      });
      setSuccess(true);
      toast.success("Password reset successfully!");
      setTimeout(() => navigate("/login"), 3000);
    } catch (error: any) {
      const errorData = error.response?.data;
      let errorMsg = "Failed to reset password. Link may be expired.";

      if (errorData) {
        if (typeof errorData === "string") {
          errorMsg = errorData;
        } else if (errorData.detail) {
          errorMsg = errorData.detail;
        } else {
          const messages: string[] = [];
          Object.entries(errorData).forEach(([key, val]) => {
            const fieldName = key.replace("_", " ");
            if (Array.isArray(val)) {
              messages.push(`${fieldName}: ${val.join(" ")}`);
            } else if (typeof val === "string") {
              messages.push(`${fieldName}: ${val}`);
            }
          });
          if (messages.length > 0) {
            errorMsg = messages.join("\n");
          }
        }
      }
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-600/20 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="glass p-8 md:p-10 rounded-[40px] border border-white/10 shadow-2xl">
          <AnimatePresence mode="wait">
            {!success ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-primary tracking-tight mb-2">
                    New Password
                  </h1>
                  <p className="text-muted text-sm">
                    Please enter and confirm your new secure password.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted uppercase tracking-widest ml-1">
                        New Password
                      </label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dim group-focus-within:text-primary-400 transition-colors" />
                        <PasswordInput
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="pl-12 bg-white/5 border-white/10 focus:border-primary-500/50 h-14"
                        />
                        <PasswordHint />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted uppercase tracking-widest ml-1">
                        Confirm New Password
                      </label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dim group-focus-within:text-primary-400 transition-colors" />
                        <PasswordInput
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="pl-12 bg-white/5 border-white/10 focus:border-primary-500/50 h-14"
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 text-lg font-black shadow-xl shadow-primary-900/20"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Resetting Password...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8 space-y-6"
              >
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-primary">
                    Password Updated!
                  </h2>
                  <p className="text-muted text-sm">
                    Your password has been changed successfully. Redirecting you
                    to login...
                  </p>
                </div>
                <div className="w-full bg-white/5 rounded-2xl h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3 }}
                    className="h-full bg-emerald-500"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
