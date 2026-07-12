import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Mail,
  User,
  School,
  ArrowRight,
  Loader2,
  ChevronLeft,
} from "lucide-react";
import { GilaniOSLogo } from "../components/ui/Logo";
import { PasswordInput } from "../components/ui/PasswordInput";
import { PasswordHint } from "../components/ui/PasswordHint";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { authService } from "../api/services/authService";
import { Select } from "../components/ui/Select";

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    school_name: "",
    email: "",
    password: "",
    confirm_password: "",
    admin_name: "",
    curriculum: "CBC",
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirm_password) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    const regToast = toast.loading("Creating your school account...");
    try {
      const [first_name, ...rest] = formData.admin_name.trim().split(" ");
      const last_name = rest.join(" ");

      const payload = {
        school_name: formData.school_name,
        email: formData.email,
        password: formData.password,
        first_name: first_name || "",
        last_name: last_name || "",
        curriculum: formData.curriculum,
      };

      const response = await authService.register(payload);

      toast.success(
        "Registration successful! Please check your email for verification.",
        { id: regToast },
      );

      // Redirect to the new subdomain using the 'domain' field
      const schoolDomain = response.school_details?.domain;

      if (schoolDomain) {
        // Construct the new URL (e.g., http://abd-academy.localhost/login)
        const newUrl = `${window.location.protocol}//${schoolDomain}${window.location.port ? ":" + window.location.port : ""}/login`;

        window.location.href = newUrl;
      } else {
        console.warn(
          "No school domain found in response. Falling back to /login",
        );
        toast.error(
          "Could not find your school domain. Please login manually.",
        );
        navigate("/login");
      }
    } catch (error: any) {
      console.error("Registration failed", error);
      const errorData = error.response?.data;
      const errorMsg = error.message || "Check your connection";

      if (errorData && typeof errorData === "object") {
        const firstErrorKey = Object.keys(errorData)[0];
        const firstErrorMsg = Array.isArray(errorData[firstErrorKey])
          ? errorData[firstErrorKey][0]
          : errorData[firstErrorKey];
        toast.error(`Failed: ${firstErrorMsg}`, { id: regToast });
      } else {
        toast.error(`Failed: ${errorMsg}`, { id: regToast });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent relative overflow-hidden px-4 py-8 sm:py-12">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary-500/10 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent-500/10 rounded-full blur-[120px] animate-pulse-slow" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[520px] relative z-10"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors mb-8 text-sm font-semibold group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />{" "}
          Back to Home
        </Link>

        <div className="glass p-8 md:p-12 rounded-[40px]">
          <div className="flex justify-center mb-6">
            <GilaniOSLogo className="w-12 h-12" showText={true} />
          </div>

          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-black text-primary tracking-tight mb-2">
              Register School
            </h1>
            <p className="text-muted font-medium text-sm md:text-base">
              Join the future of education management
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted ml-1">
                  School Name
                </label>
                <div className="relative group">
                  <School className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400/50 group-focus-within:text-primary-400" />
                  <input
                    type="text"
                    required
                    value={formData.school_name}
                    onChange={(e) =>
                      setFormData({ ...formData, school_name: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 text-primary pl-11 pr-4 py-3.5 rounded-2xl outline-none focus:border-primary-500 transition-all text-sm"
                    placeholder="Excellence Academy"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted ml-1">
                  Admin Name
                </label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400/50 group-focus-within:text-primary-400" />
                  <input
                    type="text"
                    required
                    value={formData.admin_name}
                    onChange={(e) =>
                      setFormData({ ...formData, admin_name: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 text-primary pl-11 pr-4 py-3.5 rounded-2xl outline-none focus:border-primary-500 transition-all text-sm"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            </div>

            <Select
              label="Curriculum System"
              required
              value={formData.curriculum}
              onChange={(e) =>
                setFormData({ ...formData, curriculum: e.target.value })
              }
            >
              <option value="CBC" className="bg-bg-color">
                Kenya CBC (Competency Based Curriculum)
              </option>
              <option value="844" className="bg-bg-color">
                Kenya 8-4-4 System
              </option>
              <option value="IGCSE_EDEXCEL" className="bg-bg-color">
                Pearson Edexcel IGCSE
              </option>
              <option value="IGCSE_CAMBRIDGE" className="bg-bg-color">
                Cambridge IGCSE
              </option>
            </Select>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-primary-200/70 ml-1">
                Work Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400/50 group-focus-within:text-primary-400" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 text-primary pl-12 pr-4 py-4 rounded-2xl outline-none focus:border-primary-500 transition-all text-base"
                  placeholder="admin@school.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted ml-1">
                  Password
                </label>
                <PasswordInput
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 text-primary pl-12 pr-12 py-4 rounded-2xl outline-none focus:border-primary-500 transition-all text-base"
                  placeholder="••••••••"
                />
                <PasswordHint />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted ml-1">
                  Confirm Password
                </label>
                <PasswordInput
                  required
                  value={formData.confirm_password}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirm_password: e.target.value,
                    })
                  }
                  className="w-full bg-white/5 border border-white/10 text-primary pl-12 pr-12 py-4 rounded-2xl outline-none focus:border-primary-500 transition-all text-base"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-4 rounded-2xl shadow-premium active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-base mt-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Create School Profile
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-muted font-medium text-sm">
              Already managing with us?{" "}
              <Link
                to="/login"
                className="text-primary-400 font-bold hover:text-primary-300 transition-colors underline-offset-4 hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
