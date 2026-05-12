import { useState, useEffect } from "react";
import axios from "axios";
import { Search, FileText, Video, Book, Download, Tag } from "lucide-react";
import client from "../../api/client";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { Plus, Loader2 } from "lucide-react";
import { classesService } from "../../api/services/classesService";
import { useQuery } from "@tanstack/react-query";

interface Resource {
  id: string;
  title: string;
  category: "NOTE" | "VIDEO" | "BOOK" | "OTHER";
  file: string;
  version: number;
  subject_name: string;
  uploaded_at: string;
}

export const ResourceLibrary = () => {
  const user = useAuthStore((state) => state.user);
  const isTeacher =
    user?.role === "TEACHER" ||
    user?.role === "ADMIN" ||
    user?.role === "SUPER_ADMIN";

  const [resources, setResources] = useState<Resource[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: "",
    category: "NOTE",
    subject: "",
    file: null as File | null,
  });

  const categories = [
    {
      id: "NOTE",
      label: "Lesson Notes",
      icon: FileText,
      color: "text-blue-400",
    },
    {
      id: "VIDEO",
      label: "Video Lectures",
      icon: Video,
      color: "text-rose-400",
    },
    { id: "BOOK", label: "E-Books", icon: Book, color: "text-emerald-400" },
  ];

  useEffect(() => {
    fetchResources();
  }, []);

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const data = await classesService.getSubjects();
      return data.results || data;
    },
    enabled: isTeacher && isUploadModalOpen,
  });

  const fetchResources = async () => {
    try {
      const res = await client.get("lms/resources/");
      setResources(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      toast.error("Failed to load resources");
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.file || !uploadData.subject)
      return toast.error("Please select a file and subject");

    setIsUploading(true);
    const formData = new FormData();
    formData.append("title", uploadData.title);
    formData.append("category", uploadData.category);
    formData.append("subject", uploadData.subject);
    formData.append("file", uploadData.file);

    try {
      await client.post("lms/resources/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Resource uploaded successfully");
      setIsUploadModalOpen(false);
      setUploadData({ title: "", category: "NOTE", subject: "", file: null });
      fetchResources();
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Failed to upload resource. Check your connection or file size.";
      toast.error(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const filteredResources = resources.filter((res) => {
    const matchesSearch = res.title
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory = !activeCategory || res.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const downloadFile = async (url: string, title: string) => {
    try {
      const relativeUrl = url.replace(/^(?:https?:\/\/[^\/]+)?/, "");
      const token = localStorage.getItem("token");

      const response = await axios.get(relativeUrl, {
        responseType: "blob",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      // Extract extension from the original URL (e.g., .mp4, .pdf)
      const extension = url.split(".").pop()?.split("?")[0] || "bin";
      const filename = `${title.replace(/[^a-z0-9]/gi, "_")}.${extension}`;

      // Create blob with the correct content type from the server
      const contentType = response.headers["content-type"] as string;
      const blob = new Blob([response.data], {
        type: contentType || "application/octet-stream",
      });

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      toast.error("Download failed. The file might be missing or restricted.");
    }
  };

  return (
    <div className="space-y-10">
      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-2xl">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-200/30" />
            <input
              type="text"
              placeholder="Search resources..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all h-14"
            />
          </div>
          {isTeacher && (
            <Button
              onClick={() => setIsUploadModalOpen(true)}
              className="gap-2 h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs shrink-0 w-full sm:w-auto shadow-premium"
            >
              <Plus className="w-5 h-5" />
              Store Resource
            </Button>
          )}
        </div>

        <div className="flex gap-3 overflow-auto w-full md:w-auto pb-2 md:pb-0">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
              !activeCategory
                ? "bg-primary-500 text-white shadow-premium"
                : "bg-white/5 text-primary-200/50 border border-white/5 hover:border-white/10"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap flex items-center gap-2 ${
                activeCategory === cat.id
                  ? "bg-primary-500 text-white shadow-premium"
                  : "bg-white/5 text-muted border border-white/5 hover:border-white/10"
              }`}
            >
              <cat.icon className="w-4 h-4" />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredResources.map((resource) => {
          const cat = categories.find((c) => c.id === resource.category) || {
            icon: FileText,
            color: "text-white",
          };
          return (
            <div
              key={resource.id}
              className="glass p-6 rounded-[32px] border border-white/5 hover:border-white/20 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-6">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${cat.color}`}
                  >
                    <cat.icon className="w-6 h-6" />
                  </div>
                  <div className="text-[10px] font-black bg-primary-500/10 text-primary-400 px-2 py-1 rounded-md uppercase">
                    v{resource.version}.0
                  </div>
                </div>
                <h3 className="text-lg font-bold text-primary group-hover:text-primary-400 transition-colors line-clamp-2">
                  {resource.title}
                </h3>
                <div className="flex items-center gap-2 mt-4 text-xs text-muted">
                  <Tag className="w-3 h-3" />
                  <span>{resource.subject_name}</span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-black text-dim uppercase tracking-widest">
                  {new Date(resource.uploaded_at).toLocaleDateString()}
                </span>
                <button
                  onClick={() => downloadFile(resource.file, resource.title)}
                  className="p-3 bg-primary-500 text-white rounded-xl hover:bg-primary-400 transition-all shadow-lg"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Intelligence Depository Integration"
        description="Ingest new knowledge resources into the school's digital library."
        className="max-w-md glass border-white/10"
      >
        <form onSubmit={handleUpload} className="space-y-6 mt-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest">
              Resource Title
            </label>
            <input
              required
              type="text"
              value={uploadData.title}
              onChange={(e) =>
                setUploadData({ ...uploadData, title: e.target.value })
              }
              className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-primary text-sm outline-none focus:border-primary-500"
              placeholder="e.g. Q3 Physics Seminar Notes"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest">
                Category
              </label>
              <select
                value={uploadData.category}
                onChange={(e) =>
                  setUploadData({
                    ...uploadData,
                    category: e.target.value as any,
                  })
                }
                className="w-full h-12 bg-slate-900 border border-white/10 rounded-xl px-3 text-white text-sm outline-none focus:border-primary-500"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest">
                Domain (Subject)
              </label>
              <select
                required
                value={uploadData.subject}
                onChange={(e) =>
                  setUploadData({ ...uploadData, subject: e.target.value })
                }
                className="w-full h-12 bg-slate-900 border border-white/10 rounded-xl px-3 text-white text-sm outline-none focus:border-primary-500"
              >
                <option value="">Select Domain...</option>
                {subjects.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest">
              Payload File
            </label>
            <input
              required
              type="file"
              onChange={(e) =>
                setUploadData({
                  ...uploadData,
                  file: e.target.files?.[0] || null,
                })
              }
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-primary file:bg-primary-500 file:border-0 file:rounded-lg file:text-white file:font-bold file:px-3 file:py-1 file:mr-3"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-12 bg-white/5 border-white/5 text-primary-200/50 rounded-2xl font-black uppercase tracking-widest text-xs"
              onClick={() => setIsUploadModalOpen(false)}
            >
              Abort
            </Button>
            <Button
              type="submit"
              className="flex-[2] h-12 rounded-2xl font-black uppercase tracking-widest text-xs shadow-premium"
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                "Execute Ingestion"
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
