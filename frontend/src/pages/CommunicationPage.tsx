import { useState } from "react";
import {
  Mail,
  Send,
  Phone,
  Users,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { notificationsService } from "../api/services/notificationsService";

export const CommunicationPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"email" | "sms">("email");
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    recipients: "", // Comma separated emails
    phones: "", // Comma separated phones
  });

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["communication-stats"],
    queryFn: notificationsService.getCommunicationStats,
  });

  const { data: groups = [], isLoading: loadingGroups } = useQuery({
    queryKey: ["recipient-groups"],
    queryFn: notificationsService.getRecipientGroups,
  });

  const sendEmailMutation = useMutation({
    mutationFn: (data: { subject: string; message: string; recipients: string[] }) =>
      notificationsService.sendBulkEmail(data),
    onSuccess: (_, variables) => {
      toast.success(`Email sent to ${variables.recipients.length} recipients`);
      setFormData({ subject: "", message: "", recipients: "", phones: "" });
      queryClient.invalidateQueries({ queryKey: ["communication-stats"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to send email");
    }
  });

  const sendSmsMutation = useMutation({
    mutationFn: (data: { message: string; phones: string[] }) =>
      notificationsService.sendBulkSms(data),
    onSuccess: (_, variables) => {
      toast.success(`SMS sent to ${variables.phones.length} recipients`);
      setFormData({ subject: "", message: "", recipients: "", phones: "" });
      queryClient.invalidateQueries({ queryKey: ["communication-stats"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to send SMS");
    }
  });

  const fetchGroupMutation = useMutation({
    mutationFn: ({ groupId, type }: { groupId: string; type: string }) =>
      notificationsService.getGroupRecipients(groupId, type),
    onMutate: () => {
      toast.loading("Fetching recipients...", { id: "group-fetch" });
    },
    onSuccess: (data) => {
      const recipients = data.recipients.join(", ");
      setFormData((prev) => ({
        ...prev,
        [activeTab === "email" ? "recipients" : "phones"]: recipients,
      }));
      toast.success("Recipients loaded", { id: "group-fetch" });
    },
    onError: () => {
      toast.error("Failed to load group recipients", { id: "group-fetch" });
    }
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === "email") {
      const emailList = formData.recipients.split(",").map((e) => e.trim()).filter(Boolean);
      sendEmailMutation.mutate({
        subject: formData.subject,
        message: formData.message,
        recipients: emailList,
      });
    } else {
      const phoneList = formData.phones.split(",").map((p) => p.trim()).filter(Boolean);
      sendSmsMutation.mutate({
        message: formData.message,
        phones: phoneList,
      });
    }
  };

  const handleSelectGroup = (groupId: string) => {
    fetchGroupMutation.mutate({ groupId, type: activeTab });
  };

  const loading = loadingStats || loadingGroups;
  const sending = sendEmailMutation.isPending || sendSmsMutation.isPending;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-primary tracking-tight mb-2">
          Communication <span className="text-gradient">Center</span>
        </h1>
        <p className="text-muted text-xs sm:text-sm font-medium">
          Broadcast messages to parents, students, and staff via Email or SMS.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 p-1.5 bg-white/5 rounded-2xl w-fit border border-white/5">
        <button
          onClick={() => setActiveTab("email")}
          className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "email"
              ? "bg-primary-600 text-white shadow-lg"
              : "text-muted hover:text-primary"
            }`}
        >
          <Mail className="w-4 h-4" />
          Bulk Email
        </button>
        <button
          onClick={() => setActiveTab("sms")}
          className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "sms"
              ? "bg-primary-600 text-white shadow-lg"
              : "text-muted hover:text-primary"
            }`}
        >
          <Phone className="w-4 h-4" />
          Bulk SMS
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass p-6 sm:p-8 rounded-3xl border border-white/5">
          <form onSubmit={handleSend} className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`p-2 rounded-xl ${activeTab === "email" ? "bg-blue-500/10" : "bg-emerald-500/10"}`}
              >
                {activeTab === "email" ? (
                  <Mail className="w-6 h-6 text-blue-400" />
                ) : (
                  <Phone className="w-6 h-6 text-emerald-400" />
                )}
              </div>
              <h2 className="text-xl font-bold text-primary">
                Compose {activeTab === "email" ? "Email" : "SMS"}
              </h2>
            </div>

            {activeTab === "email" && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted uppercase">
                  Subject Line
                </label>
                <Input
                  required
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  placeholder="Enter email subject..."
                  className="bg-white/5 border-white/10 h-12"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted uppercase">
                {activeTab === "email"
                  ? "Recipients (Comma separated emails)"
                  : "Recipients (Comma separated phone numbers)"}
              </label>
              <textarea
                required
                value={
                  activeTab === "email" ? formData.recipients : formData.phones
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    [activeTab === "email" ? "recipients" : "phones"]:
                      e.target.value,
                  })
                }
                placeholder={
                  activeTab === "email"
                    ? "parent1@gmail.com, parent2@gmail.com..."
                    : "0712345678, 0722334455..."
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-primary text-sm outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px] transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted uppercase">
                Message Content
              </label>
              <textarea
                required
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                placeholder={
                  activeTab === "email"
                    ? "Dear Parents, we would like to inform you..."
                    : "School Notice: Reopening dates have been changed..."
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-primary text-sm outline-none focus:ring-2 focus:ring-primary-500 min-h-[200px] transition-all"
              />
              {activeTab === "sms" && (
                <p className="text-[10px] text-dim text-right">
                  {formData.message.length} characters •{" "}
                  {Math.ceil(formData.message.length / 160)} SMS units
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={sending}
              className="w-full h-14 text-lg font-bold shadow-xl shadow-primary-900/20"
            >
              {sending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Send {activeTab === "email" ? "Broadcast" : "SMS"}
                </>
              )}
            </Button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="glass p-6 rounded-3xl border border-white/5">
            <h3 className="text-sm font-bold text-primary uppercase mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-muted" />
              Quick Select Groups
            </h3>
            <div className="space-y-3">
              {groups.map((group: any) => (
                <button
                  key={group.id}
                  onClick={() => handleSelectGroup(group.id)}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-left group"
                >
                  <p className="text-sm font-bold text-primary group-hover:text-primary-400">
                    {group.name}
                  </p>
                  <p className="text-[10px] text-dim">
                    Approx. {group.count} contacts
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="glass p-6 rounded-3xl border border-white/5 bg-primary-600/5">
            <h3 className="text-sm font-bold text-primary-400 uppercase mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Usage Statistics
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted">
                    Monthly {activeTab === "email" ? "Email" : "SMS"} Limit
                  </span>
                  <span className="text-primary font-bold">
                    {activeTab === "email"
                      ? stats?.email_used
                      : stats?.sms_used}{" "}
                    /{" "}
                    {activeTab === "email"
                      ? stats?.email_limit
                      : stats?.sms_limit}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 transition-all duration-500"
                    style={{
                      width: `${activeTab === "email"
                          ? (stats?.email_used / stats?.email_limit) * 100
                          : (stats?.sms_used / stats?.sms_limit) * 100
                        }%`,
                    }}
                  ></div>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <p className="text-[10px] text-amber-300/80">
                  {stats?.is_premium
                    ? "You are using a premium relay for maximum deliverability."
                    : "You are using the standard relay. Deliverability might be limited for high volume broadcasts."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
