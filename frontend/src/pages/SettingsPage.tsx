import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import { ROLES } from "../constants/roles";
import {
  User,
  School,
  Bell,
  Save,
  Lock,
  CreditCard,
  Palette,
  GraduationCap,
  Mail,
  MessageSquare,
  ChevronRight,
  Phone,
  Upload,
  Shield,
  Smartphone,
  CheckCircle,
  Crown,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { PasswordInput } from "../components/ui/PasswordInput";
import { PasswordHint } from "../components/ui/PasswordHint";
import { authService } from "../api/services/authService";
import { schoolsService } from "../api/services/schoolsService";
import { systemService } from "../api/services/systemService";

type ActiveTab =
  | "profile"
  | "school"
  | "academic"
  | "finance"
  | "branding"
  | "notifications"
  | "security"
  | "subscription"
  | "system";

export const SettingsPage = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ActiveTab>("profile");

  const { data: systemStatus, isLoading: isSystemStatusLoading } = useQuery({
    queryKey: ["systemStatus"],
    queryFn: systemService.getSystemStatus,
    staleTime: 5 * 60 * 1000,
  });

  // SMS 2FA setup state
  const [smsPhone, setSmsPhone] = useState("");
  const [smsOtpCode, setSmsOtpCode] = useState("");
  const [smsSetupStep, setSmsSetupStep] = useState<"phone" | "verify" | "done">(
    "phone",
  );
  const [smsLoading, setSmsLoading] = useState(false);

  // Billing state
  const [billingPhone, setBillingPhone] = useState("");
  const [billingPlan, setBillingPlan] = useState("PROFESSIONAL");
  const [billingLoading, setBillingLoading] = useState(false);

  // Queries
  const { data: settingsData } = useQuery({
    queryKey: ["school-settings"],
    queryFn: schoolsService.getSettings,
    enabled: !!user && user.role !== ROLES.SUPER_ADMIN,
  });

  const { data: schoolProfileData } = useQuery({
    queryKey: ["school-profile", user?.school],
    queryFn: () => schoolsService.getProfile(user!.school!),
    enabled: !!user?.school && user.role === ROLES.ADMIN,
  });

  const { data: subscriptionData, refetch: refetchSubscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: schoolsService.getSubscription,
    enabled: !!user && user.role === ROLES.ADMIN,
  });

  // Local state for forms
  const [settings, setSettings] = useState({
    current_term: "Term 1",
    academic_year: "2026",
    currency: "KES",
    tax_percentage: "0.00",
    enable_email_notifications: true,
    enable_sms_notifications: false,
    accent_color: "#6366f1",
    principal_name: "",
    school_motto: "",
    school_logo: "",
  });

  const [schoolProfile, setSchoolProfile] = useState({
    name: "",
    address: "",
    contact_email: "",
    contact_phone: "",
  });

  const [personalInfo, setPersonalInfo] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    phone_number: user?.phone_number || "",
  });

  // Sync data to local state when loaded
  useMemo(() => {
    if (settingsData) setSettings(settingsData);
  }, [settingsData]);

  useMemo(() => {
    if (schoolProfileData) {
      setSchoolProfile({
        name: schoolProfileData.name,
        address: schoolProfileData.address || "",
        contact_email: schoolProfileData.contact_email || "",
        contact_phone: schoolProfileData.contact_phone || "",
      });
    }
  }, [schoolProfileData]);

  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  // Mutations
  const updateSettingsMutation = useMutation({
    mutationFn: (data: any) => schoolsService.updateSettings(data),
    onSuccess: () => {
      toast.success("Settings updated successfully");
      queryClient.invalidateQueries({ queryKey: ["school-settings"] });
    },
    onError: () => toast.error("Failed to update settings"),
  });

  const updatePersonalInfoMutation = useMutation({
    mutationFn: (data: any) => authService.updateMe(data),
    onSuccess: () => {
      toast.success("Personal profile updated successfully");
      // Optionally refresh user store if needed
    },
    onError: () => toast.error("Failed to update personal profile"),
  });

  const paySubscriptionMutation = useMutation({
    mutationFn: (data: { plan: string; phone: string }) =>
      schoolsService.paySubscription(data.plan, data.phone),
    onSuccess: (data) => {
      if (data.detail) {
        toast.success(data.detail);
      }
      setBillingLoading(false);
      refetchSubscription();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to initiate payment");
      setBillingLoading(false);
    },
  });

  const updateSchoolProfileMutation = useMutation({
    mutationFn: (data: any) =>
      schoolsService.updateProfile(user!.school!, data),
    onSuccess: () => {
      toast.success("School profile updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["school-profile", user?.school],
      });
    },
    onError: () => toast.error("Failed to update school profile"),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: any) => authService.changePassword(data),
    onSuccess: () => {
      toast.success("Password changed successfully");
      setPasswordData({
        old_password: "",
        new_password: "",
        confirm_password: "",
      });
    },
    onError: (error: any) => {
      const errorData = error.response?.data;
      if (errorData) {
        const firstError = Object.values(errorData)[0];
        const message = Array.isArray(firstError)
          ? firstError[0]
          : errorData.detail || "Failed to change password.";
        toast.error(message);
      } else {
        toast.error("Failed to change password.");
      }
    },
  });

  const handleUpdateSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(settings);
  };

  const handleUpdatePersonalInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updatePersonalInfoMutation.mutate(personalInfo);
  };

  const handleUpdateSchoolProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateSchoolProfileMutation.mutate(schoolProfile);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("New passwords do not match");
      return;
    }
    changePasswordMutation.mutate({
      old_password: passwordData.old_password,
      new_password1: passwordData.new_password,
      new_password2: passwordData.new_password,
    });
  };

  const tabs = [
    { id: "profile", icon: User, label: "My Profile" },
    { id: "school", icon: School, label: "School Profile", adminOnly: true },
    { id: "academic", icon: GraduationCap, label: "Academic", adminOnly: true },
    { id: "finance", icon: CreditCard, label: "Financial", adminOnly: true },
    { id: "branding", icon: Palette, label: "Branding", adminOnly: true },
    { id: "notifications", icon: Bell, label: "Notifications" },
    { id: "security", icon: Shield, label: "Security & 2FA" },
    {
      id: "subscription",
      icon: CreditCard,
      label: "Subscription",
      adminOnly: true,
    },
    { id: "system", icon: Layers, label: "System & Version" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12 pb-24 max-w-7xl mx-auto"
    >
      <div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-primary tracking-tight mb-2">
          Platform <span className="text-gradient">Control</span>
        </h1>
        <p className="text-muted text-base font-medium">
          Fine-tune your institutional ecosystem and personal preferences.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Sidebar Tabs */}
        <div className="lg:w-72 flex flex-row lg:flex-col gap-2 overflow-x-auto pb-1 custom-scrollbar lg:pb-0">
          {tabs.map((tab) => {
            if (tab.adminOnly && user?.role !== ROLES.ADMIN) return null;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`shrink-0 lg:w-full flex items-center gap-3 lg:gap-4 px-4 lg:px-6 py-3 lg:py-4 rounded-2xl lg:rounded-[24px] transition-all relative overflow-hidden group whitespace-nowrap ${
                  isActive
                    ? "glass text-primary shadow-premium"
                    : "text-muted hover:bg-white/5 hover:text-primary"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary-600/10 -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <tab.icon
                  className={`w-5 h-5 transition-transform duration-500 ${isActive ? "text-primary-400 scale-110" : "group-hover:scale-110"}`}
                />
                <span
                  className={`text-xs font-black uppercase tracking-widest ${isActive ? "opacity-100" : "opacity-60"}`}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="glass p-5 sm:p-8 md:p-10 lg:p-12 rounded-[28px] lg:rounded-[40px] border-white/5 shadow-premium min-h-[400px]"
            >
              {activeTab === "profile" && (
                <div className="space-y-12">
                  <form
                    onSubmit={handleUpdatePersonalInfo}
                    className="space-y-8"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-lg sm:text-xl md:text-2xl font-black text-primary uppercase tracking-tight mb-1">
                          Identity Configuration
                        </h2>
                        <p className="text-primary-200/30 text-[10px] font-black uppercase tracking-[0.2em]">
                          Manage your personal credentials within the network.
                        </p>
                      </div>
                      <Button
                        type="submit"
                        disabled={updatePersonalInfoMutation.isPending}
                        className="gap-2 h-11 px-5 bg-primary-600 rounded-2xl font-black uppercase tracking-widest text-[10px] shrink-0 w-full sm:w-auto"
                      >
                        <Save className="w-4 h-4" />
                        Update Identity
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest pl-1">
                          First Name
                        </label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-200/20" />
                          <Input
                            type="text"
                            value={personalInfo.first_name}
                            onChange={(e) =>
                              setPersonalInfo({
                                ...personalInfo,
                                first_name: e.target.value,
                              })
                            }
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-white text-sm font-bold h-auto focus:bg-white/10"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest pl-1">
                          Last Name
                        </label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-200/20" />
                          <Input
                            type="text"
                            value={personalInfo.last_name}
                            onChange={(e) =>
                              setPersonalInfo({
                                ...personalInfo,
                                last_name: e.target.value,
                              })
                            }
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-white text-sm font-bold h-auto focus:bg-white/10"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest pl-1">
                          Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-200/20" />
                          <Input
                            type="text"
                            value={personalInfo.phone_number}
                            onChange={(e) =>
                              setPersonalInfo({
                                ...personalInfo,
                                phone_number: e.target.value,
                              })
                            }
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-white text-sm font-bold h-auto focus:bg-white/10"
                            placeholder="+254..."
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest pl-1">
                          Email (Immutable)
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-200/10" />
                          <Input
                            type="email"
                            value={user?.email || ""}
                            readOnly
                            className="w-full bg-white/2 border border-white/5 rounded-2xl px-12 py-4 text-white/30 text-sm font-medium h-auto cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>
                  </form>

                  <div className="h-px bg-white/5 w-full" />

                  <form onSubmit={handleChangePassword} className="space-y-8">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-primary uppercase tracking-tight mb-2">
                        Security Override
                      </h2>
                      <p className="text-primary-200/30 text-[10px] font-black uppercase tracking-[0.2em]">
                        Update your cryptographic access keys.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest pl-1">
                          Current Password
                        </label>
                        <PasswordInput
                          required
                          value={passwordData.old_password}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              old_password: e.target.value,
                            })
                          }
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-white text-sm font-bold h-auto focus:bg-white/10"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest pl-1">
                          New Password
                        </label>
                        <PasswordInput
                          required
                          value={passwordData.new_password}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              new_password: e.target.value,
                            })
                          }
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-white text-sm font-bold h-auto focus:bg-white/10"
                        />
                        <PasswordHint />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest pl-1">
                          Confirm New Password
                        </label>
                        <PasswordInput
                          required
                          value={passwordData.confirm_password}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              confirm_password: e.target.value,
                            })
                          }
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-white text-sm font-bold h-auto focus:bg-white/10"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={changePasswordMutation.isPending}
                      className="gap-2 h-14 px-10 bg-accent-600 hover:bg-accent-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-premium"
                    >
                      <Lock className="w-4 h-4" />
                      Update Password
                    </Button>
                  </form>
                </div>
              )}

              {activeTab === "school" && (
                <form
                  onSubmit={handleUpdateSchoolProfile}
                  className="space-y-10"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-primary uppercase tracking-tight mb-2">
                        Institutional Profile
                      </h2>
                      <p className="text-primary-200/30 text-[10px] font-black uppercase tracking-[0.2em]">
                        Define your school's global identity parameters.
                      </p>
                    </div>
                    <Button
                      type="submit"
                      disabled={updateSchoolProfileMutation.isPending}
                      className="gap-2 h-14 px-8 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-premium disabled:opacity-50 transition-all shrink-0"
                    >
                      <Save className="w-4 h-4" />
                      Commit Changes
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest pl-1">
                        Institutional Name
                      </label>
                      <Input
                        type="text"
                        value={schoolProfile.name}
                        onChange={(e) =>
                          setSchoolProfile({
                            ...schoolProfile,
                            name: e.target.value,
                          })
                        }
                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm font-black uppercase tracking-tight focus:bg-white/10 focus:border-primary-500/50 outline-none transition-all h-auto"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest pl-1">
                        Global Contact Point
                      </label>
                      <Input
                        type="email"
                        value={schoolProfile.contact_email}
                        onChange={(e) =>
                          setSchoolProfile({
                            ...schoolProfile,
                            contact_email: e.target.value,
                          })
                        }
                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm font-black tracking-tight focus:bg-white/10 focus:border-primary-500/50 outline-none transition-all h-auto"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-3">
                      <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest pl-1">
                        Physical Coordinates (Address)
                      </label>
                      <textarea
                        value={schoolProfile.address}
                        onChange={(e) =>
                          setSchoolProfile({
                            ...schoolProfile,
                            address: e.target.value,
                          })
                        }
                        rows={3}
                        className="w-full bg-white/5 border border-white/5 rounded-[28px] px-6 py-5 text-white text-sm font-medium focus:bg-white/10 focus:border-primary-500/50 outline-none transition-all resize-none"
                      />
                    </div>
                  </div>
                </form>
              )}

              {activeTab === "academic" && (
                <form onSubmit={handleUpdateSettings} className="space-y-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-primary uppercase tracking-tight mb-2">
                        Phase Synchronization
                      </h2>
                      <p className="text-primary-200/30 text-[10px] font-black uppercase tracking-[0.2em]">
                        Synchronize institutional clocks and academic cycles.
                      </p>
                    </div>
                    <Button
                      type="submit"
                      disabled={updateSettingsMutation.isPending}
                      className="gap-2 h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs shadow-premium"
                    >
                      <Save className="w-4 h-4" />
                      Apply Cycle
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest pl-1">
                        Current Chronos (Year)
                      </label>
                      <div className="relative">
                        <select
                          value={settings.academic_year}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              academic_year: e.target.value,
                            })
                          }
                          className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm font-black uppercase tracking-tight focus:bg-white/10 focus:border-primary-500/50 outline-none transition-all appearance-none"
                        >
                          <option value="2025" className="bg-bg-color">
                            2025 Cycle
                          </option>
                          <option value="2026" className="bg-bg-color">
                            2026 Cycle
                          </option>
                          <option value="2027" className="bg-bg-color">
                            2027 Cycle
                          </option>
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-200/30 rotate-90" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest pl-1">
                        Active Sector (Term)
                      </label>
                      <div className="relative">
                        <select
                          value={settings.current_term}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              current_term: e.target.value,
                            })
                          }
                          className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm font-black uppercase tracking-tight focus:bg-white/10 focus:border-primary-500/50 outline-none transition-all appearance-none"
                        >
                          <option value="Term 1" className="bg-bg-color">
                            Sector Alpha (Term 1)
                          </option>
                          <option value="Term 2" className="bg-bg-color">
                            Sector Beta (Term 2)
                          </option>
                          <option value="Term 3" className="bg-bg-color">
                            Sector Gamma (Term 3)
                          </option>
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-200/30 rotate-90" />
                      </div>
                    </div>
                  </div>
                </form>
              )}

              {activeTab === "finance" && (
                <form onSubmit={handleUpdateSettings} className="space-y-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-primary uppercase tracking-tight mb-2">
                        Financial Engine
                      </h2>
                      <p className="text-primary-200/30 text-[10px] font-black uppercase tracking-[0.2em]">
                        Configure revenue protocols and taxation matrices.
                      </p>
                    </div>
                    <Button
                      type="submit"
                      disabled={updateSettingsMutation.isPending}
                      className="gap-2 h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs shadow-premium"
                    >
                      <Save className="w-4 h-4" />
                      Update Engine
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest pl-1">
                        Base Currency Protocol
                      </label>
                      <Input
                        type="text"
                        value={settings.currency}
                        onChange={(e) =>
                          setSettings({ ...settings, currency: e.target.value })
                        }
                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm font-black uppercase tracking-tight focus:bg-white/10 focus:border-primary-500/50 outline-none transition-all h-auto"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest pl-1">
                        Taxation Index (%)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={settings.tax_percentage}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            tax_percentage: e.target.value,
                          })
                        }
                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm font-black focus:bg-white/10 focus:border-primary-500/50 outline-none transition-all h-auto"
                      />
                    </div>
                  </div>
                </form>
              )}

              {activeTab === "branding" && (
                <form onSubmit={handleUpdateSettings} className="space-y-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-primary uppercase tracking-tight mb-2">
                        Branding
                      </h2>
                      <p className="text-primary-200/30 text-[10px] font-black uppercase tracking-[0.2em]">
                        Customize your school identity, emblem, motto, and
                        theme.
                      </p>
                    </div>
                    <Button
                      type="submit"
                      disabled={updateSettingsMutation.isPending}
                      className="gap-2 h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs shadow-premium"
                    >
                      <Palette className="w-4 h-4" />
                      Save Branding
                    </Button>
                  </div>

                  {/* School Logo Upload Block */}
                  <div className="bg-white/5 border border-white/5 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 mb-8">
                    <div className="relative group w-28 h-28 shrink-0 rounded-[32px] overflow-hidden bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center transition-all hover:border-primary-500/50">
                      {settings.school_logo ? (
                        <img
                          src={settings.school_logo}
                          alt="School Logo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Upload className="w-8 h-8 text-primary-200/30 group-hover:text-primary-500 transition-colors" />
                      )}
                      <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all">
                        <Upload className="w-4 h-4 text-white" />
                        <span className="text-[8px] font-black text-white uppercase tracking-widest">
                          Upload
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setSettings({
                                  ...settings,
                                  school_logo: reader.result as string,
                                });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-2">
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">
                        School Logo
                      </h3>
                      <p className="text-[10px] text-primary-200/30 uppercase tracking-widest leading-relaxed">
                        Upload your school emblem. Recommended: square JPG or
                        PNG, max 1MB. This logo will automatically appear on all
                        official documents, student report cards, and printed
                        LMS assignments.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest pl-1">
                        Principal / Head Teacher Name
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g. Sister Monica Wambua"
                        value={settings.principal_name || ""}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            principal_name: e.target.value,
                          })
                        }
                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm font-bold focus:bg-white/10 focus:border-primary-500/50 outline-none transition-all h-auto"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest pl-1">
                        School Motto / Slogan
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g. Elite Excellence in Education"
                        value={settings.school_motto || ""}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            school_motto: e.target.value,
                          })
                        }
                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm font-bold focus:bg-white/10 focus:border-primary-500/50 outline-none transition-all h-auto"
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest pl-1">
                      Accent Color
                    </label>
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="relative group">
                        <Input
                          type="color"
                          value={settings.accent_color}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              accent_color: e.target.value,
                            })
                          }
                          className="w-24 h-24 rounded-[32px] bg-transparent border-none cursor-pointer shadow-premium p-0"
                        />
                        <div className="absolute inset-0 rounded-[32px] border-4 border-white/20 pointer-events-none group-hover:border-white/40 transition-all" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Input
                          type="text"
                          value={settings.accent_color}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              accent_color: e.target.value,
                            })
                          }
                          className="bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white font-black uppercase tracking-widest text-sm focus:bg-white/10 transition-all outline-none h-auto"
                        />
                        <p className="text-[9px] font-black text-primary-200/20 uppercase tracking-widest">
                          Hexadecimal Color Value
                        </p>
                      </div>
                    </div>
                  </div>
                </form>
              )}

              {activeTab === "notifications" && (
                <form onSubmit={handleUpdateSettings} className="space-y-12">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-primary uppercase tracking-tight mb-2">
                        Transmission Matrix
                      </h2>
                      <p className="text-primary-200/30 text-[10px] font-black uppercase tracking-[0.2em]">
                        Configure external communication and alert protocols.
                      </p>
                    </div>
                    <Button
                      type="submit"
                      disabled={updateSettingsMutation.isPending}
                      className="gap-2 h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs shadow-premium"
                    >
                      <Save className="w-4 h-4" />
                      Sync Matrix
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div
                      className={`flex items-center justify-between p-8 rounded-[32px] border transition-all ${settings.enable_email_notifications ? "bg-primary-600/10 border-primary-500/20" : "bg-white/5 border-white/5 opacity-60"}`}
                    >
                      <div className="flex items-center gap-6">
                        <div
                          className={`p-4 rounded-2xl transition-colors ${settings.enable_email_notifications ? "bg-primary-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]" : "bg-white/10 text-primary-200/20"}`}
                        >
                          <Mail className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-white uppercase tracking-tight">
                            Email Stream
                          </p>
                          <p className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest mt-1">
                            Institutional Reports & Logs
                          </p>
                        </div>
                      </div>
                      <div
                        onClick={() =>
                          setSettings({
                            ...settings,
                            enable_email_notifications:
                              !settings.enable_email_notifications,
                          })
                        }
                        className={`w-14 h-8 rounded-full relative cursor-pointer transition-all duration-300 ${settings.enable_email_notifications ? "bg-primary-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]" : "bg-white/10"}`}
                      >
                        <motion.div
                          animate={{
                            x: settings.enable_email_notifications ? 28 : 4,
                          }}
                          className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg"
                        />
                      </div>
                    </div>

                    <div
                      className={`flex items-center justify-between p-8 rounded-[32px] border transition-all ${settings.enable_sms_notifications ? "bg-emerald-600/10 border-emerald-500/20" : "bg-white/5 border-white/5 opacity-60"}`}
                    >
                      <div className="flex items-center gap-6">
                        <div
                          className={`p-4 rounded-2xl transition-colors ${settings.enable_sms_notifications ? "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)]" : "bg-white/10 text-primary-200/20"}`}
                        >
                          <MessageSquare className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-white uppercase tracking-tight">
                            Direct SMS Link
                          </p>
                          <p className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest mt-1">
                            High-Priority Alert Protocols
                          </p>
                        </div>
                      </div>
                      <div
                        onClick={() =>
                          setSettings({
                            ...settings,
                            enable_sms_notifications:
                              !settings.enable_sms_notifications,
                          })
                        }
                        className={`w-14 h-8 rounded-full relative cursor-pointer transition-all duration-300 ${settings.enable_sms_notifications ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "bg-white/10"}`}
                      >
                        <motion.div
                          animate={{
                            x: settings.enable_sms_notifications ? 28 : 4,
                          }}
                          className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg"
                        />
                      </div>
                    </div>
                  </div>
                </form>
              )}

              {activeTab === "security" && (
                <div className="space-y-10">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-primary uppercase tracking-tight mb-2">
                      Security & 2FA
                    </h2>
                    <p className="text-primary-200/30 text-[10px] font-black uppercase tracking-[0.2em]">
                      Register your phone number to receive SMS login
                      verification codes.
                    </p>
                  </div>

                  {/* How it works banner */}
                  <div className="bg-primary-500/10 border border-primary-500/20 rounded-3xl p-6 flex gap-4 items-start">
                    <Shield className="w-5 h-5 text-primary-400 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-black text-white uppercase tracking-tight">
                        How SMS 2FA Works
                      </p>
                      <p className="text-[11px] text-primary-200/50 leading-relaxed">
                        When you log in, the system will send a one-time 6-digit
                        code to your registered phone number. Enter that code to
                        complete your sign-in. Without a registered phone, codes
                        are sent to your email instead.
                      </p>
                    </div>
                  </div>

                  {/* Step 1 — Enter phone */}
                  {smsSetupStep === "phone" && (
                    <div className="bg-white/5 border border-white/5 rounded-3xl p-8 space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-primary-500/20 flex items-center justify-center">
                          <Smartphone className="w-5 h-5 text-primary-400" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-white uppercase tracking-tight">
                            Step 1 — Enter Your Phone Number
                          </p>
                          <p className="text-[10px] text-primary-200/30 uppercase tracking-widest">
                            We will send a verification code to this number
                          </p>
                        </div>
                      </div>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-200/30" />
                        <Input
                          type="tel"
                          placeholder="e.g. +254 712 345 678"
                          value={smsPhone}
                          onChange={(e) => setSmsPhone(e.target.value)}
                          className="w-full pl-12 bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold focus:bg-white/10 focus:border-primary-500/50 transition-all h-auto"
                        />
                      </div>
                      <button
                        disabled={smsLoading || smsPhone.length < 9}
                        onClick={async () => {
                          setSmsLoading(true);
                          try {
                            await authService.setupSMSOTP(smsPhone);
                            setSmsSetupStep("verify");
                            toast.success(
                              "Verification code sent to " + smsPhone,
                            );
                          } catch {
                            toast.error(
                              "Failed to send code. Check the number and try again.",
                            );
                          } finally {
                            setSmsLoading(false);
                          }
                        }}
                        className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-40 text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
                      >
                        <Smartphone className="w-4 h-4" />
                        Send Verification Code
                      </button>
                    </div>
                  )}

                  {/* Step 2 — Enter OTP */}
                  {smsSetupStep === "verify" && (
                    <div className="bg-white/5 border border-white/5 rounded-3xl p-8 space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                          <Shield className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-white uppercase tracking-tight">
                            Step 2 — Enter the Code
                          </p>
                          <p className="text-[10px] text-primary-200/30 uppercase tracking-widest">
                            Code sent to {smsPhone}
                          </p>
                        </div>
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="000000"
                        value={smsOtpCode}
                        onChange={(e) =>
                          setSmsOtpCode(
                            e.target.value.replace(/\D/g, "").slice(0, 6),
                          )
                        }
                        className="w-full bg-white/5 border border-white/10 text-white text-center text-3xl font-black tracking-[10px] py-5 rounded-2xl outline-none focus:border-primary-500 transition-all placeholder:text-white/10"
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setSmsSetupStep("phone");
                            setSmsOtpCode("");
                          }}
                          className="flex-1 bg-white/5 hover:bg-white/10 text-muted font-black uppercase tracking-widest text-xs py-4 rounded-2xl transition-all"
                        >
                          Back
                        </button>
                        <button
                          disabled={smsLoading || smsOtpCode.length < 6}
                          onClick={async () => {
                            setSmsLoading(true);
                            try {
                              await authService.verifySMSOTPSetup(smsOtpCode);
                              setSmsSetupStep("done");
                              toast.success(
                                "Phone number verified! SMS 2FA is now active.",
                              );
                            } catch {
                              toast.error(
                                "Invalid or expired code. Please try again.",
                              );
                            } finally {
                              setSmsLoading(false);
                            }
                          }}
                          className="flex-2 flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Verify & Activate
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Done state */}
                  {smsSetupStep === "done" && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-8 flex items-center gap-6">
                      <div className="w-14 h-14 rounded-[28px] bg-emerald-500 flex items-center justify-center shadow-lg">
                        <CheckCircle className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white uppercase tracking-tight mb-1">
                          SMS 2FA Active
                        </p>
                        <p className="text-[11px] text-emerald-400/70 uppercase tracking-widest">
                          {smsPhone} — Verified & Confirmed
                        </p>
                        <button
                          onClick={() => {
                            setSmsSetupStep("phone");
                            setSmsPhone("");
                            setSmsOtpCode("");
                          }}
                          className="mt-3 text-[10px] font-black text-primary-400 hover:text-primary-300 uppercase tracking-widest transition-colors"
                        >
                          Change Phone Number
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Subscription Tab */}
              {activeTab === "subscription" && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2">
                      SaaS Subscription Plan
                    </h2>
                    <p className="text-[11px] text-muted-400 uppercase tracking-widest">
                      Manage your institutional plan tier, feature options, and
                      billing renewals.
                    </p>
                  </div>

                  {/* Current Status Widget */}
                  {subscriptionData ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-dark-800 border border-dark-700/60 rounded-3xl p-6">
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] text-muted-400 uppercase tracking-widest mb-1">
                            Active Plan Tier
                          </p>
                          <div className="flex items-center gap-2">
                            <Crown className="w-5 h-5 text-primary-400" />
                            <span className="text-lg font-black text-white">
                              {subscriptionData.plan} Tier
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-400 uppercase tracking-widest mb-1">
                            Status
                          </p>
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              subscriptionData.status === "ACTIVE"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}
                          >
                            {subscriptionData.status}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] text-muted-400 uppercase tracking-widest mb-1">
                            Expiry Date
                          </p>
                          <p className="text-sm font-semibold text-white">
                            {subscriptionData.expiry_date}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-400 uppercase tracking-widest mb-1">
                            Grace Period Remaining
                          </p>
                          <p className="text-xs text-muted-400 font-medium">
                            {subscriptionData.grace_period_days} Days (School
                            remains active for 7 days after expiry before
                            lockdown)
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-muted-400">
                      Loading subscription details...
                    </div>
                  )}

                  {/* Pricing Tier Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    {/* Free Tier */}
                    <div className="bg-dark-800 border border-dark-700/60 rounded-3xl p-6 flex flex-col justify-between hover:border-primary-500/30 transition-all">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-sm font-black text-white uppercase tracking-tight">
                            Free Trial
                          </span>
                          <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                            7 Days
                          </span>
                        </div>
                        <p className="text-2xl font-black text-white mb-4">
                          KES 0
                        </p>
                        <ul className="space-y-2 text-xs text-muted-400 font-medium mb-6">
                          <li className="flex items-center gap-2">
                            ✓ Students & Teachers
                          </li>
                          <li className="flex items-center gap-2">
                            ✓ Exams & Grading
                          </li>
                          <li className="text-red-500/70">
                            ✗ Advanced Finance/Fees
                          </li>
                          <li className="text-red-500/70">
                            ✗ HR & LMS Portals
                          </li>
                          <li className="text-red-500/70">
                            ✗ Analytics & Reports
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Starter Tier */}
                    <div className="bg-dark-800 border border-dark-700/60 rounded-3xl p-6 flex flex-col justify-between hover:border-primary-500/30 transition-all">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-sm font-black text-white uppercase tracking-tight">
                            Starter
                          </span>
                          <span className="text-xs font-black text-primary-400 uppercase tracking-wider">
                            Monthly
                          </span>
                        </div>
                        <p className="text-2xl font-black text-white mb-4">
                          KES 3,500
                        </p>
                        <ul className="space-y-2 text-xs text-muted-400 font-medium mb-6">
                          <li className="flex items-center gap-2">
                            ✓ Up to 200 students
                          </li>
                          <li className="flex items-center gap-2">
                            ✓ 5 teacher accounts
                          </li>
                          <li className="flex items-center gap-2">
                            ✓ Student & attendance management
                          </li>
                          <li className="flex items-center gap-2">
                            ✓ Basic exam & grading
                          </li>
                          <li className="flex items-center gap-2">
                            ✓ Email support
                          </li>
                          <li className="flex items-center gap-2">
                            ✓ Mobile-friendly interface
                          </li>
                        </ul>
                      </div>
                      {subscriptionData?.plan !== "STARTER" &&
                        subscriptionData?.plan !== "PROFESSIONAL" &&
                        subscriptionData?.plan !== "ENTERPRISE" && (
                          <button
                            onClick={() => {
                              setBillingPlan("STARTER");
                            }}
                            className="w-full py-3 bg-primary-600 hover:bg-primary-500 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all"
                          >
                            Choose Starter
                          </button>
                        )}
                    </div>

                    {/* Professional Tier */}
                    <div className="bg-primary-500/10 border border-primary-500/30 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden hover:border-primary-400 transition-all">
                      <div className="absolute top-0 right-0 bg-primary-500 text-white px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-bl-2xl">
                        Most Popular
                      </div>
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-sm font-black text-white uppercase tracking-tight">
                            Professional
                          </span>
                          <span className="text-xs font-black text-primary-400 uppercase tracking-wider">
                            Monthly
                          </span>
                        </div>
                        <p className="text-2xl font-black text-white mb-4">
                          KES 9,500
                        </p>
                        <ul className="space-y-2 text-xs text-muted-400 font-medium mb-6">
                          <li className="flex items-center gap-2">
                            ✓ Up to 800 students
                          </li>
                          <li className="flex items-center gap-2">
                            ✓ 20 teacher accounts
                          </li>
                          <li className="flex items-center gap-2">
                            ✓ Everything in Starter
                          </li>
                          <li className="flex items-center gap-2">
                            ✓ Fee management & M-Pesa
                          </li>
                          <li className="flex items-center gap-2">
                            ✓ Smart timetabling
                          </li>
                          <li className="flex items-center gap-2">
                            ✓ Parent portal access
                          </li>
                          <li className="flex items-center gap-2">
                            ✓ Activity logs
                          </li>
                          <li className="flex items-center gap-2">
                            ✓ Priority support
                          </li>
                        </ul>
                      </div>
                      {subscriptionData?.plan !== "PROFESSIONAL" &&
                        subscriptionData?.plan !== "ENTERPRISE" && (
                          <button
                            onClick={() => {
                              setBillingPlan("PROFESSIONAL");
                            }}
                            className="w-full py-3 bg-primary-500 hover:bg-primary-400 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all"
                          >
                            Choose Professional
                          </button>
                        )}
                    </div>
                  </div>

                  {/* Payment Trigger Form */}
                  {((subscriptionData?.plan !== "PROFESSIONAL" &&
                    subscriptionData?.plan !== "ENTERPRISE") ||
                    subscriptionData?.status !== "ACTIVE") && (
                    <div className="mt-8 bg-dark-800/50 border border-dark-700/40 rounded-3xl p-6 max-w-lg">
                      <h3 className="text-sm font-black text-white uppercase tracking-tight mb-2">
                        Initiate Renewal / Upgrade
                      </h3>
                      <p className="text-[10px] text-muted-400 uppercase tracking-widest mb-6">
                        Selected Plan:{" "}
                        <span className="text-primary-400 font-black">
                          {billingPlan}
                        </span>
                      </p>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-black text-muted-400 uppercase tracking-widest mb-2">
                            M-Pesa Phone Number
                          </label>
                          <input
                            type="text"
                            placeholder="254712345678"
                            value={billingPhone}
                            onChange={(e) => setBillingPhone(e.target.value)}
                            className="w-full bg-dark-900 border border-dark-700/60 rounded-2xl px-4 py-3 text-xs font-semibold text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors"
                          />
                        </div>

                        <button
                          disabled={billingLoading || !billingPhone}
                          onClick={async () => {
                            setBillingLoading(true);
                            paySubscriptionMutation.mutate({
                              plan: billingPlan,
                              phone: billingPhone,
                            });
                          }}
                          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all flex items-center justify-center gap-2"
                        >
                          {billingLoading
                            ? "Initiating STK Push..."
                            : "Pay via M-Pesa STK Push"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "system" && (
                <div className="space-y-10">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-primary uppercase tracking-tight mb-2">
                      System & Version
                    </h2>
                    <p className="text-primary-200/30 text-[10px] font-black uppercase tracking-[0.2em]">
                      Monitor client-gateway synchronizations and underlying core environments.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Status Card */}
                    <div className="bg-white/5 border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 flex flex-col justify-between shadow-premium hover:border-white/10 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest">
                          Service Status
                        </span>
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                            Operational
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-3xl font-black text-white tracking-tight uppercase">
                          System Active
                        </h3>
                        <p className="text-xs text-muted-400 leading-relaxed">
                          All client requests and gateway channels are operating within optimal latency. All background processing systems and database linkages are synchronized.
                        </p>
                      </div>
                    </div>

                    {/* Specs Card */}
                    <div className="bg-white/5 border border-white/5 rounded-3xl p-6 md:p-8 space-y-4 shadow-premium hover:border-white/10 transition-all font-mono text-xs">
                      <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                        <span className="text-[10px] font-black font-sans text-primary-200/30 uppercase tracking-widest">Platform Core</span>
                        <span className="text-white font-bold bg-white/5 px-2 py-0.5 rounded border border-white/10">v1.0.0</span>
                      </div>
                      <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                        <span className="text-[10px] font-black font-sans text-primary-200/30 uppercase tracking-widest">API Gateway</span>
                        <span className="text-primary-400 font-bold bg-primary-500/10 px-2 py-0.5 rounded border border-primary-500/20">
                          {isSystemStatusLoading ? "Querying..." : systemStatus?.version ? `v${systemStatus.version}` : "v1.0.0"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                        <span className="text-[10px] font-black font-sans text-primary-200/30 uppercase tracking-widest">Build Environment</span>
                        <span className="text-emerald-400 font-bold capitalize bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {import.meta.env.MODE || "production"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2.5">
                        <span className="text-[10px] font-black font-sans text-primary-200/30 uppercase tracking-widest">Gateway context</span>
                        <span className="text-muted-400 text-[10px] max-w-[200px] truncate" title={systemStatus?.status || "ping-main"}>
                          {isSystemStatusLoading ? "Querying..." : systemStatus?.status || "ping-main"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/5 rounded-3xl p-6 md:p-8 space-y-4">
                    <h3 className="text-sm font-black text-white uppercase tracking-tight">
                      Deployment Gateway Architecture
                    </h3>
                    <p className="text-xs text-muted-400 leading-relaxed uppercase tracking-wider font-mono">
                      Endpoint URI: {import.meta.env.VITE_API_URL || window.location.origin}/api/v1/
                    </p>
                    <div className="h-px bg-white/5 w-full my-4" />
                    <p className="text-[10px] text-primary-200/30 uppercase tracking-widest leading-relaxed">
                      ElimuHub relies on a dynamic, multi-tenant cloud mesh network. Under high loads, traffic is dynamically distributed across load-balanced zones to guarantee 99.99% uptime. High performance caching layers automatically store frequently requested analytics metrics.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
