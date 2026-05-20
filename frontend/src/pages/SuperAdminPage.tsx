import { useState } from "react";
import {
  Shield,
  Building2,
  Users,
  CreditCard,
  ArrowUpRight,
  Search,
  MoreHorizontal,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Plus,
  Edit,
  Trash2,
  FolderPlus,
  Globe,
  FileText,
  Clock,
  Layers,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { schoolsService } from "../api/services/schoolsService";
import { blogService } from "../api/services/blogService";
import { systemService } from "../api/services/systemService";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../components/ui/Table";
import { TableSkeleton } from "../components/ui/Skeleton";
import { Tabs } from "../components/ui/Tabs";
import { Modal } from "../components/ui/Modal";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { toast } from "react-hot-toast";

interface SchoolData {
  id: number;
  name: string;
  students: number;
  plan: string;
  status: string;
  revenue: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  category: Category | null;
}

export const SuperAdminPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [unauthorized, setUnauthorized] = useState(false);
  const [activeTab, setActiveTab] = useState("schools");

  // Query for System Health
  const {
    data: systemHealth,
    isLoading: isLoadingHealth,
    refetch: refetchHealth,
    isRefetching: isRefetchingHealth,
  } = useQuery({
    queryKey: ["super-admin-system-health"],
    queryFn: systemService.getSystemHealth,
    enabled: activeTab === "system",
    staleTime: 30 * 1000,
  });

  // Queries for Schools & Stats
  const { data: schools = [], isLoading: isLoadingSchools } = useQuery<
    SchoolData[]
  >({
    queryKey: ["super-admin-schools"],
    queryFn: async () => {
      try {
        const res = await schoolsService.getAll();
        const schoolsData = Array.isArray(res)
          ? res
          : (res as any).results || [];
        return schoolsData.map((s: any) => ({
          id: s.id,
          name: s.name,
          students: s.student_count || 0,
          plan: s.subscription?.plan || "BASIC",
          status: s.subscription?.status === "ACTIVE" ? "ACTIVE" : "EXPIRED",
          revenue: `KSh ${Number(s.total_revenue || 0).toLocaleString()}`,
        }));
      } catch (error: any) {
        if (error.response?.status === 403) setUnauthorized(true);
        throw error;
      }
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["super-admin-stats"],
    queryFn: () => schoolsService.getStats(),
  });

  // Queries for Blog Posts & Categories
  const {
    data: adminPosts = [],
    refetch: refetchPosts,
    isLoading: isLoadingPosts,
  } = useQuery<BlogPost[]>({
    queryKey: ["super-admin-blog-posts"],
    queryFn: async () => {
      try {
        const res = await blogService.adminGetPosts();
        return Array.isArray(res) ? res : (res as any).results || [];
      } catch (error: any) {
        if (error.response?.status === 403) setUnauthorized(true);
        throw error;
      }
    },
  });

  const { data: adminCategories = [], refetch: refetchCategories } = useQuery<
    Category[]
  >({
    queryKey: ["super-admin-blog-categories"],
    queryFn: async () => {
      const res = await blogService.adminGetCategories();
      return Array.isArray(res) ? res : (res as any).results || [];
    },
  });

  // Blog Post Editor State
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [postTitle, setPostTitle] = useState("");
  const [postSlug, setPostSlug] = useState("");
  const [postCategoryId, setPostCategoryId] = useState("");
  const [postExcerpt, setPostExcerpt] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postIsPublished, setPostIsPublished] = useState(false);
  const [postFeaturedImage, setPostFeaturedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<"write" | "preview">("write");

  // Category Form State
  const [categoryName, setCategoryName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");

  // Confirmation Modal State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  const triggerConfirm = (
    title: string,
    description: string,
    onConfirm: () => void,
  ) => {
    setConfirmConfig({ title, description, onConfirm });
    setIsConfirmOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setPostTitle(val);
    if (!selectedPost) {
      setPostSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-"),
      );
    }
  };

  const handleCategoryNameChange = (val: string) => {
    setCategoryName(val);
    setCategorySlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-"),
    );
  };

  const openCreatePostModal = () => {
    setSelectedPost(null);
    setPostTitle("");
    setPostSlug("");
    setPostCategoryId("");
    setPostExcerpt("");
    setPostContent("");
    setPostIsPublished(false);
    setPostFeaturedImage(null);
    setImagePreviewUrl(null);
    setEditorMode("write");
    setIsPostModalOpen(true);
  };

  const openEditPostModal = (post: BlogPost) => {
    setSelectedPost(post);
    setPostTitle(post.title);
    setPostSlug(post.slug);
    setPostCategoryId(post.category?.id?.toString() || "");
    setPostExcerpt(post.excerpt || "");
    setPostContent(post.content || "");
    setPostIsPublished(post.is_published);
    setPostFeaturedImage(null);
    setImagePreviewUrl(post.featured_image || null);
    setEditorMode("write");
    setIsPostModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPostFeaturedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setPostFeaturedImage(null);
    setImagePreviewUrl(null);
  };

  // Submit Operations
  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("title", postTitle);
      formData.append("slug", postSlug);
      formData.append("content", postContent);
      formData.append("excerpt", postExcerpt);
      formData.append("is_published", String(postIsPublished));
      if (postCategoryId) {
        formData.append("category_id", postCategoryId);
      }
      if (postFeaturedImage) {
        formData.append("featured_image", postFeaturedImage);
      }

      if (selectedPost) {
        await blogService.adminUpdatePost(selectedPost.id, formData);
        toast.success("Blog post updated successfully");
      } else {
        await blogService.adminCreatePost(formData);
        toast.success("Blog post created successfully");
      }
      setIsPostModalOpen(false);
      refetchPosts();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to save blog post");
    }
  };

  const handleDeletePost = async (id: number) => {
    try {
      await blogService.adminDeletePost(id);
      toast.success("Blog post deleted successfully");
      refetchPosts();
    } catch (error: any) {
      toast.error("Failed to delete blog post");
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;
    try {
      await blogService.adminCreateCategory({
        name: categoryName,
        slug: categorySlug,
      });
      toast.success("Category created successfully");
      setCategoryName("");
      setCategorySlug("");
      refetchCategories();
    } catch (error: any) {
      toast.error("Failed to create category");
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await blogService.adminDeleteCategory(id);
      toast.success("Category deleted successfully");
      refetchCategories();
    } catch (error: any) {
      toast.error("Failed to delete category. Ensure no posts are using it.");
    }
  };

  const filteredSchools = schools.filter((school) =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (unauthorized) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center border border-rose-500/20">
          <Shield className="w-10 h-10 text-rose-500" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-primary mb-2">
            Access Denied
          </h1>
          <p className="text-muted max-w-md mx-auto">
            This panel is restricted to System Super-Admins. Your current role
            does not have the permissions required to manage all schools.
          </p>
        </div>
        <button
          onClick={() => (window.location.href = "/dashboard")}
          className="px-6 py-3 bg-white/5 text-primary rounded-xl font-bold border border-white/10 hover:bg-white/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Define tab definitions for the Tabs component
  const dashboardTabs = [
    {
      id: "schools",
      label: "Schools & Subscriptions",
      icon: Building2,
      content: (
        <div className="space-y-6 md:space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <StatCard
              title="Total Schools"
              value={stats?.total_schools || 0}
              icon={Building2}
              color="bg-blue-500/20"
            />
            <StatCard
              title="Active Users"
              value={stats ? (stats.total_users / 1000).toFixed(1) + "k" : "0"}
              icon={Users}
              color="bg-purple-500/20"
            />
            <StatCard
              title="Monthly Revenue"
              value={
                stats
                  ? `KSh ${(stats.total_revenue / 1000000).toFixed(1)}M`
                  : "KSh 0M"
              }
              icon={CreditCard}
              color="bg-emerald-500/20"
            />
            <StatCard
              title="System Alerts"
              value={stats?.system_alerts || 0}
              icon={AlertTriangle}
              color="bg-rose-500/20"
            />
          </div>

          <div className="glass rounded-[32px] sm:rounded-[40px] border border-white/5 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg md:text-xl font-bold text-primary">
                Registered Schools
              </h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
                <input
                  placeholder="Search schools..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-primary text-sm outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                />
              </div>
            </div>

            <div className="relative">
              <Table>
                <TableHeader>
                  <TableRow className="bg-white/[0.02]">
                    <TableHead>School Name</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-center">Students</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingSchools ? (
                    <TableSkeleton rows={8} cols={6} />
                  ) : filteredSchools.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-12 text-center text-muted font-bold tracking-widest uppercase text-xs"
                      >
                        No schools found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSchools.map((school) => (
                      <TableRow key={school.id} className="group">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 text-muted">
                              <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="text-xs sm:text-sm font-bold text-primary whitespace-nowrap">
                              {school.name}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest border ${
                              school.plan === "ENTERPRISE"
                                ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                : school.plan === "PREMIUM"
                                  ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                  : "bg-white/5 text-muted border-white/10"
                            }`}
                          >
                            {school.plan}
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-xs sm:text-sm text-muted">
                          {school.students}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {school.status === "ACTIVE" ? (
                              <span className="flex items-center gap-1.5 text-emerald-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                Active
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-rose-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                                <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />
                                Expired
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-black tracking-tighter text-primary text-sm sm:text-base whitespace-nowrap">
                          {school.revenue}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              className="p-2 hover:bg-white/10 rounded-xl text-muted transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                              aria-label={`Manage school ${school.name}`}
                              title="Manage School"
                            >
                              <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                            <button
                              className="p-2 hover:bg-white/10 rounded-xl text-muted transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                              aria-label={`More options for ${school.name}`}
                            >
                              <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "blog",
      label: "Platform Blog",
      icon: FileText,
      content: (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white/5 p-4 rounded-3xl border border-white/5 gap-4">
            <div>
              <h2 className="text-lg font-bold text-primary">
                Marketing Blog Management
              </h2>
              <p className="text-xs text-muted">
                Create, edit, and publish articles for the platform marketing
                website.
              </p>
            </div>
            <button
              onClick={openCreatePostModal}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-900/20 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" /> New Article
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Posts List */}
            <div className="lg:col-span-2 glass rounded-[32px] border border-white/5 overflow-hidden">
              <div className="p-5 border-b border-white/5">
                <h3 className="font-bold text-primary text-base">
                  All Articles
                </h3>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-white/[0.02]">
                      <TableHead>Article Details</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">
                        Published Date
                      </TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingPosts ? (
                      <TableSkeleton rows={5} cols={5} />
                    ) : adminPosts.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="py-12 text-center text-muted font-bold uppercase text-xs"
                        >
                          No articles written yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      adminPosts.map((post) => (
                        <TableRow key={post.id} className="group">
                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-primary text-sm line-clamp-1">
                                {post.title}
                              </span>
                              {post.category && (
                                <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">
                                  {post.category.name}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted max-w-[120px] truncate">
                            {post.slug}
                          </TableCell>
                          <TableCell className="text-center">
                            {post.is_published ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400 text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                                <CheckCircle className="w-2.5 h-2.5" />{" "}
                                Published
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-muted text-[9px] font-black uppercase tracking-widest bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                                <Clock className="w-2.5 h-2.5" /> Draft
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center text-xs text-muted">
                            {new Date(post.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => openEditPostModal(post)}
                                className="p-2 hover:bg-white/10 rounded-xl text-muted hover:text-white transition-all focus-visible:outline-none"
                                title="Edit Article"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <a
                                href={`/blog/${post.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 hover:bg-white/10 rounded-xl text-muted hover:text-white transition-all flex items-center justify-center"
                                title="View Live"
                              >
                                <Globe className="w-4 h-4" />
                              </a>
                              <button
                                onClick={() =>
                                  triggerConfirm(
                                    "Delete Article",
                                    `Are you sure you want to delete "${post.title}"? This action is permanent.`,
                                    () => handleDeletePost(post.id),
                                  )
                                }
                                className="p-2 hover:bg-rose-500/10 rounded-xl text-muted hover:text-rose-400 transition-all focus-visible:outline-none"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Categories sidebar */}
            <div className="glass rounded-[32px] border border-white/5 p-5 flex flex-col gap-6 h-fit">
              <div>
                <h3 className="font-bold text-primary text-base">
                  Blog Categories
                </h3>
                <p className="text-xs text-muted">
                  Organize your blog posts into topic categories.
                </p>
              </div>

              {/* Categories list */}
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                {adminCategories.length === 0 ? (
                  <p className="text-xs text-muted italic">
                    No categories created yet.
                  </p>
                ) : (
                  adminCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex justify-between items-center bg-white/5 hover:bg-white/[0.08] px-3.5 py-2.5 rounded-2xl border border-white/5 transition-all group"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-primary">
                          {cat.name}
                        </span>
                        <span className="text-[9px] text-muted tracking-wider uppercase">
                          {cat.slug}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          triggerConfirm(
                            "Delete Category",
                            `Are you sure you want to delete the category "${cat.name}"?`,
                            () => handleDeleteCategory(cat.id),
                          )
                        }
                        className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 rounded-lg text-muted hover:text-rose-400 transition-all shrink-0 focus-visible:outline-none"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add Category Form */}
              <form
                onSubmit={handleSaveCategory}
                className="border-t border-white/5 pt-4 space-y-3"
              >
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
                  New Category
                </h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Category Name (e.g. Technology)"
                    value={categoryName}
                    onChange={(e) => handleCategoryNameChange(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-primary text-xs outline-none focus:ring-1 focus:ring-rose-500 transition-all"
                    required
                  />
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.02] border border-white/5 rounded-xl text-[10px] text-muted font-mono">
                    <span className="text-[9px] font-black uppercase text-rose-400/50">
                      Slug:
                    </span>
                    <span className="truncate">
                      {categorySlug || "auto-generated"}
                    </span>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!categoryName.trim()}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-white/5 hover:bg-white/10 text-primary border border-white/10 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4 text-rose-400" /> Add Category
                </button>
              </form>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "system",
      label: "System Health & Versioning",
      icon: Layers,
      content: (
        <div className="space-y-8">
          {/* Diagnostic Summary Header Card */}
          <div className={`p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] border border-white/5 relative overflow-hidden transition-all duration-700 bg-gradient-to-br ${
            isLoadingHealth
              ? "from-slate-900/50 to-slate-950/50"
              : systemHealth?.status === "healthy"
                ? "from-emerald-950/20 to-slate-950/50 border-emerald-500/10 shadow-[0_0_50px_rgba(16,185,129,0.05)]"
                : "from-rose-950/20 to-slate-950/50 border-rose-500/10 shadow-[0_0_50px_rgba(244,63,94,0.05)]"
          }`}>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.02),transparent)] pointer-events-none" />
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest">
                    Overall Liveness Index
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    isLoadingHealth
                      ? "bg-white/5 text-muted border border-white/10"
                      : systemHealth?.status === "healthy"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  }`}>
                    {isLoadingHealth ? "Diagnosing..." : systemHealth?.status === "healthy" ? "All Systems Healthy" : "Alert Active"}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-primary tracking-tight">
                  {isLoadingHealth ? (
                    "Analyzing Service Architecture..."
                  ) : systemHealth?.status === "healthy" ? (
                    <span>Ecosystem operating <span className="text-gradient">normally</span></span>
                  ) : (
                    <span>Ecosystem report: <span className="text-rose-400">service interruption</span></span>
                  )}
                </h2>
                <p className="text-xs text-muted max-w-2xl leading-relaxed">
                  Real-time database pooling, cache eviction registers, and background messaging brokers are analyzed continuously to prevent transactional drift.
                </p>
              </div>

              <button
                disabled={isLoadingHealth || isRefetchingHealth}
                onClick={() => {
                  refetchHealth();
                  toast.success("Live diagnostics refreshed");
                }}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 text-primary border border-white/10 rounded-2xl text-xs font-bold transition-all disabled:opacity-40 disabled:hover:bg-white/5 cursor-pointer shrink-0 active:scale-95"
              >
                {isLoadingHealth || isRefetchingHealth ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Checking...
                  </>
                ) : (
                  "Refresh Live Check"
                )}
              </button>
            </div>
          </div>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* PostgreSQL Card */}
            <div className="glass p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between min-h-[180px]">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest">
                  Relational DB Pool
                </span>
                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                  isLoadingHealth
                    ? "bg-white/5 text-muted border-white/10"
                    : systemHealth?.services?.database?.status === "healthy"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                }`}>
                  {isLoadingHealth ? "Checking..." : systemHealth?.services?.database?.status || "offline"}
                </span>
              </div>
              <div className="space-y-2 mt-6">
                <h3 className="text-lg font-black text-white uppercase tracking-tight">
                  PostgreSQL
                </h3>
                <p className="text-xs text-muted leading-relaxed font-mono">
                  {isLoadingHealth
                    ? "Establishing connection..."
                    : systemHealth?.services?.database?.details || "Connection down."}
                </p>
              </div>
            </div>

            {/* Redis Cache Card */}
            <div className="glass p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between min-h-[180px]">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest">
                  Memory Store
                </span>
                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                  isLoadingHealth
                    ? "bg-white/5 text-muted border-white/10"
                    : systemHealth?.services?.redis?.status === "healthy"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                }`}>
                  {isLoadingHealth ? "Checking..." : systemHealth?.services?.redis?.status || "offline"}
                </span>
              </div>
              <div className="space-y-2 mt-6">
                <h3 className="text-lg font-black text-white uppercase tracking-tight">
                  Redis Cache
                </h3>
                <p className="text-xs text-muted leading-relaxed font-mono">
                  {isLoadingHealth
                    ? "Pinging cache layer..."
                    : systemHealth?.services?.redis?.details || "Cache inaccessible."}
                </p>
              </div>
            </div>

            {/* Email Dispatch Card */}
            <div className="glass p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between min-h-[180px]">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black text-primary-200/30 uppercase tracking-widest">
                  Transactional Mailer
                </span>
                <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  Healthy
                </span>
              </div>
              <div className="space-y-2 mt-6">
                <h3 className="text-lg font-black text-white uppercase tracking-tight">
                  SMTP Gateway
                </h3>
                <p className="text-xs text-muted leading-relaxed font-mono">
                  {isLoadingHealth
                    ? "Testing mail route..."
                    : systemHealth?.services?.email?.details || "Email service configured"}
                </p>
              </div>
            </div>
          </div>

          {/* Diagnostic Logs & Meta */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass rounded-3xl border border-white/5 p-6 space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-tight">
                System Environment Metrics
              </h3>
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-muted uppercase">Platform Core Stack</span>
                  <span className="text-white font-bold">Django REST / React Vite</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-muted uppercase">Core Version</span>
                  <span className="text-white font-bold bg-white/5 px-2 py-0.5 rounded border border-white/10">v1.0.0</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-muted uppercase">API Server Version</span>
                  <span className="text-primary-400 font-bold bg-primary-500/10 px-2 py-0.5 rounded border border-primary-500/20">
                    {isLoadingHealth ? "Diagnosing..." : systemHealth?.version ? `v${systemHealth.version}` : "v1.0.0"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-muted uppercase">Diagnostics Host</span>
                  <span className="text-white truncate max-w-xs">{import.meta.env.VITE_API_URL || window.location.origin}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted uppercase">Server Timestamp</span>
                  <span className="text-white font-bold">
                    {isLoadingHealth ? "Fetching timestamp..." : systemHealth?.timestamp ? new Date(systemHealth.timestamp).toLocaleString() : new Date().toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="glass rounded-3xl border border-white/5 p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-sm font-black text-white uppercase tracking-tight">
                  Tenant Mesh Control
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  ElimuHub multi-tenant context isolates individual school databases at the middleware level. PostgreSQL connection pooling maintains a maximum pool size per tenant. Cache evictions occur dynamically when settings change.
                </p>
              </div>
              <div className="pt-4 border-t border-white/5 mt-4">
                <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">
                  ElimuHub HyperScale Network
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 md:space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2.5 sm:p-3 bg-rose-500/20 rounded-xl sm:rounded-2xl border border-rose-500/20 shrink-0">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-primary tracking-tight">
              Super-Admin <span className="text-gradient">Panel</span>
            </h1>
            <p className="text-muted text-xs sm:text-sm">
              System-wide management of schools, subscriptions, and landing page
              content.
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setActiveTab("system");
            refetchHealth();
            toast.success("System check initiated");
          }}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-rose-900/20 w-full sm:w-auto text-sm cursor-pointer"
        >
          System Health Check
        </button>
      </div>

      {/* Tabs Layout */}
      <Tabs
        tabs={dashboardTabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Blog Post Editor Modal */}
      <Modal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        title={selectedPost ? "Edit Article" : "Create New Article"}
        className="max-w-4xl"
      >
        <div className="flex border-b border-white/5 mb-5 pb-1 gap-4">
          <button
            onClick={() => setEditorMode("write")}
            className={`pb-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
              editorMode === "write"
                ? "border-rose-500 text-white"
                : "border-transparent text-muted hover:text-primary"
            }`}
          >
            Write
          </button>
          <button
            onClick={() => setEditorMode("preview")}
            className={`pb-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
              editorMode === "preview"
                ? "border-rose-500 text-white"
                : "border-transparent text-muted hover:text-primary"
            }`}
          >
            Live Preview
          </button>
        </div>

        {editorMode === "write" ? (
          <form onSubmit={handleSavePost} className="space-y-6 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted tracking-wider mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={postTitle}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-primary text-sm outline-none focus:ring-2 focus:ring-rose-500 transition-all font-bold"
                    placeholder="Enter article title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-muted tracking-wider mb-2">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={postSlug}
                    onChange={(e) => setPostSlug(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-primary text-xs outline-none focus:ring-2 focus:ring-rose-500 transition-all font-mono"
                    placeholder="article-slug-url"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-muted tracking-wider mb-2">
                    Category
                  </label>
                  <select
                    value={postCategoryId}
                    onChange={(e) => setPostCategoryId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-dark-900 border border-white/10 rounded-2xl text-primary text-sm outline-none focus:ring-2 focus:ring-rose-500 transition-all cursor-pointer"
                  >
                    <option value="">Select Category (Optional)</option>
                    {adminCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-muted tracking-wider mb-2">
                    Excerpt
                  </label>
                  <textarea
                    value={postExcerpt}
                    onChange={(e) => setPostExcerpt(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-primary text-xs outline-none focus:ring-2 focus:ring-rose-500 transition-all leading-relaxed"
                    placeholder="Short teaser description of the post..."
                  />
                </div>
              </div>

              <div className="space-y-4 flex flex-col">
                <div className="flex-1 flex flex-col">
                  <span className="block text-[10px] font-black uppercase text-muted tracking-wider mb-2">
                    Featured Image
                  </span>
                  {imagePreviewUrl ? (
                    <div className="relative flex-1 min-h-[160px] rounded-2xl overflow-hidden border border-white/10 bg-dark-900">
                      <img
                        src={imagePreviewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 rounded-xl text-rose-400 border border-white/10 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                        title="Remove Image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex-1 min-h-[160px] flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:bg-white/[0.02] hover:border-rose-500/50 transition-all p-6 text-center">
                      <FileText className="w-8 h-8 text-rose-400/60 mb-2" />
                      <span className="text-xs font-bold text-primary">
                        Upload Cover Image
                      </span>
                      <span className="text-[10px] text-muted mt-1">
                        PNG, JPG or WEBP (Max 5MB)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </label>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-primary">
                      Publish Article
                    </span>
                    <span className="text-[10px] text-muted">
                      Make article visible on the public website immediately.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={postIsPublished}
                      onChange={(e) => setPostIsPublished(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-muted tracking-wider mb-2">
                Content
              </label>
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                rows={12}
                className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-primary text-sm outline-none focus:ring-2 focus:ring-rose-500 transition-all font-mono leading-relaxed custom-scrollbar"
                placeholder="Write your article content here..."
                required
              />
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setIsPostModalOpen(false)}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-primary transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-900/20 cursor-pointer"
              >
                {selectedPost ? "Save Changes" : "Save Article"}
              </button>
            </div>
          </form>
        ) : (
          /* Preview Mode */
          <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar text-left">
            <div className="space-y-3">
              <div className="flex items-center gap-4 text-[10px] text-rose-400 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date().toLocaleDateString()}
                </span>
                {postCategoryId && (
                  <span className="bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                    {adminCategories.find(
                      (c) => c.id.toString() === postCategoryId,
                    )?.name || "Category"}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-primary leading-tight">
                {postTitle || "Untitled Article"}
              </h1>
              {postExcerpt && (
                <p className="text-sm text-muted border-l-2 border-rose-500 pl-4 py-0.5 italic leading-relaxed">
                  {postExcerpt}
                </p>
              )}
            </div>

            {imagePreviewUrl && (
              <div className="aspect-[21/9] bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                <img
                  src={imagePreviewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="prose prose-invert max-w-none text-muted leading-relaxed font-medium space-y-4 text-xs">
              {postContent ? (
                postContent.split("\n").map((para: string, idx: number) => {
                  if (!para.trim()) return null;
                  return <p key={idx}>{para}</p>;
                })
              ) : (
                <p className="italic text-dim">No content written yet.</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmation Modal */}
      {confirmConfig && (
        <ConfirmModal
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={confirmConfig.onConfirm}
          title={confirmConfig.title}
          description={confirmConfig.description}
          confirmText="Yes, Delete"
          cancelText="Cancel"
          variant="destructive"
        />
      )}
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}

const StatCard = ({ title, value, icon: Icon, color }: StatCardProps) => (
  <div className="glass p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
    <div
      className={`p-3 rounded-2xl ${color} w-fit mb-4 group-hover:scale-110 transition-transform`}
    >
      <Icon className="w-6 h-6 text-white" />
    </div>
    <p className="text-sm text-muted font-medium mb-1">{title}</p>
    <div className="flex items-center justify-between">
      <h3 className="text-2xl font-bold text-primary">{value}</h3>
      <ArrowUpRight className="w-4 h-4 text-dim" />
    </div>
  </div>
);
