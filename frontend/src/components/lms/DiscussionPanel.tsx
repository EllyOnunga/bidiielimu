import { useState, useEffect, useRef } from "react";
import { X, Send, Trash2, MessageSquare, Loader2 } from "lucide-react";
import { lmsService } from "../../api/services/lmsService";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";

interface Discussion {
  id: number;
  resource?: number;
  assignment?: number;
  author: number;
  author_name: string;
  author_role: string;
  content: string;
  created_at: string;
}

interface DiscussionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  resourceId?: string | number;
  assignmentId?: string | number;
  title: string;
}

export const DiscussionPanel = ({
  isOpen,
  onClose,
  resourceId,
  assignmentId,
  title,
}: DiscussionPanelProps) => {
  const user = useAuthStore((state) => state.user);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [content, setContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const fetchDiscussions = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (resourceId) params.resource = resourceId;
      if (assignmentId) params.assignment = assignmentId;

      const data = await lmsService.getDiscussions(params);
      setDiscussions(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      toast.error("Failed to load discussions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && (resourceId || assignmentId)) {
      fetchDiscussions();
    }
  }, [isOpen, resourceId, assignmentId]);

  useEffect(() => {
    // Scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [discussions]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSending(true);
    try {
      const payload: any = { content: content.trim() };
      if (resourceId) payload.resource = resourceId;
      if (assignmentId) payload.assignment = assignmentId;

      const newMsg = await lmsService.createDiscussion(payload);
      setDiscussions((prev) => [...prev, newMsg]);
      setContent("");
    } catch (err) {
      toast.error("Failed to post message");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this message?"))
      return;

    try {
      await lmsService.deleteDiscussion(id);
      setDiscussions((prev) => prev.filter((d) => d.id !== id));
      toast.success("Message deleted");
    } catch (err) {
      toast.error("Failed to delete message");
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role?.toUpperCase()) {
      case "SUPER_ADMIN":
      case "ADMIN":
        return "bg-amber-500/20 text-amber-400 border border-amber-500/30";
      case "PRINCIPAL":
      case "HOD":
      case "TEACHER":
        return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
      case "STUDENT":
        return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border border-slate-500/30";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md h-full flex flex-col bg-slate-900/90 dark:bg-slate-950/95 border-l border-slate-800/80 backdrop-blur-xl shadow-2xl transition-transform transform duration-300 translate-x-0">
        {/* Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <h3 className="text-base font-semibold text-slate-100 truncate">
                Discussions
              </h3>
              <p className="text-xs text-slate-400 truncate">{title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/30 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
              <p className="text-sm">Loading discussions...</p>
            </div>
          ) : discussions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700/50">
                <MessageSquare className="w-6 h-6 text-slate-500" />
              </div>
              <div>
                <p className="font-medium text-slate-300">No discussions yet</p>
                <p className="text-xs text-slate-500 max-w-[240px] mt-1">
                  Start the conversation! Ask questions or share thoughts about
                  this item.
                </p>
              </div>
            </div>
          ) : (
            discussions.map((msg) => {
              const isOwnMessage = msg.author === user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col space-y-1 ${
                    isOwnMessage ? "items-end" : "items-start"
                  }`}
                >
                  <div className="flex items-center space-x-2 text-xs text-slate-400 px-1">
                    <span className="font-semibold text-slate-300">
                      {msg.author_name}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getRoleBadgeStyle(
                        msg.author_role,
                      )}`}
                    >
                      {msg.author_role}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div
                    className={`relative group max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm border ${
                      isOwnMessage
                        ? "bg-indigo-600/20 text-slate-100 border-indigo-500/30 rounded-tr-none"
                        : "bg-slate-800/60 text-slate-200 border-slate-700/40 rounded-tl-none"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>

                    {isOwnMessage && (
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="absolute -left-8 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-rose-500/10 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete Message"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Footer */}
        <form
          onSubmit={handleSendMessage}
          className="p-4 border-t border-slate-800/80 bg-slate-900/50"
        >
          <div className="relative flex items-center">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a message..."
              rows={1}
              className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl py-3 pl-4 pr-12 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/70 resize-none max-h-24 custom-scrollbar"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={sending || !content.trim()}
              className="absolute right-2 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-slate-800 disabled:text-slate-600 transition-colors"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
