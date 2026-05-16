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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { PasswordInput } from "../components/ui/PasswordInput";
import { PasswordHint } from "../components/ui/PasswordHint";
import { authService } from "../api/services/authService";
import { schoolsService } from "../api/services/schoolsService";

type ActiveTab =
  | "profile"
  | "school"
  | "academic"
  | "finance"
  | "branding"
  | "notifications";

export const SettingsPage = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ActiveTab>("profile");

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

  // Local state for forms
  const [settings, setSettings] = useState({
    current_term: "Term 1",
    academic_year: "2026",
    currency: "KES",
    tax_percentage: "0.00",
    enable_email_notifications: true,
    enable_sms_notifications: false,
    accent_color: "#6366f1",
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

  const updateSchoolProfileMutation = useMutation({
    mutationFn: (data: any) => schoolsService.updateProfile(user!.school!, data),
    onSuccess: () => {
      toast.success("School profile updated successfully");
      queryClient.invalidateQueries({ queryKey: ["school-profile", user?.school] });
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
                        Visual DNA
                      </h2>
                      <p className="text-primary-200/30 text-[10px] font-black uppercase tracking-[0.2em]">
                        Inject your institution's color signature into the
                        ecosystem.
                      </p>
                    </div>
                    <Button
                      type="submit"
                      disabled={updateSettingsMutation.isPending}
                      className="gap-2 h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs shadow-premium"
                    >
                      <Palette className="w-4 h-4" />
                      Apply Signature
                    </Button>
                  </div>

                  <div className="space-y-6">
                    <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest pl-1">
                      Primary Spectrum (Accent)
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
                          Hexadecimal Spectrum Index
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
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
