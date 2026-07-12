import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { blogService } from "../../api/services/blogService";
import {
  BookOpen,
  Calendar,
  ArrowRight,
  Tag,
  Search,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export const BlogPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ["blog-posts", selectedCategory],
    queryFn: () => blogService.getPosts(selectedCategory || undefined),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["blog-categories"],
    queryFn: blogService.getCategories,
  });

  const posts = Array.isArray(postsData) ? postsData : postsData?.results || [];
  const categories = Array.isArray(categoriesData)
    ? categoriesData
    : categoriesData?.results || [];

  const filteredPosts = posts.filter(
    (post: any) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-dark-900 text-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/30 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-primary-400"
          >
            <Sparkles className="w-3.5 h-3.5" /> GilaniOS Blog
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-black tracking-tight"
          >
            Insights & <span className="text-gradient">Resources</span>
          </motion.h1>
          <p className="text-muted-400 max-w-2xl mx-auto text-sm">
            Read our latest news, pedagogical strategies, platform guides, and
            security tips directly from our engineers and educators.
          </p>

          {/* Categories Selector */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-wrap gap-2 justify-center pt-6"
          >
            <button
              onClick={() => setSelectedCategory("")}
              className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                selectedCategory === ""
                  ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20 scale-105 border border-primary-400/20"
                  : "bg-dark-800 hover:bg-dark-750 text-muted-400 hover:text-white border border-dark-700/60"
              }`}
            >
              All Articles
            </button>
            {categories.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                  selectedCategory === cat.slug
                    ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20 scale-105 border border-primary-400/20"
                    : "bg-dark-800 hover:bg-dark-750 text-muted-400 hover:text-white border border-dark-700/60"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Search Bar Container */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center max-w-md mx-auto"
        >
          <div className="relative w-full">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-dark-500" />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark-800/50 border border-dark-700/60 rounded-2xl pl-12 pr-4 py-3 text-xs text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
            />
          </div>
        </motion.div>

        {/* Blog Post Grid */}
        {postsLoading ? (
          <div className="text-center py-20 text-muted-400">
            Loading articles...
          </div>
        ) : filteredPosts && filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post: any, index: number) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group bg-dark-800 border border-dark-700/60 rounded-3xl overflow-hidden hover:border-primary-500/30 flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="aspect-[16/10] bg-dark-900 overflow-hidden relative">
                    {post.featured_image ? (
                      <img
                        src={post.featured_image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-dark-900/60">
                        <BookOpen className="w-12 h-12 text-dark-750" />
                      </div>
                    )}
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-4 text-[10px] text-muted-400 font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                      {post.category && (
                        <span className="flex items-center gap-1 text-primary-400">
                          <Tag className="w-3.5 h-3.5" />
                          {post.category.name}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-black text-white group-hover:text-primary-400 transition-colors leading-tight">
                      {post.title}
                    </h3>
                    <p className="text-xs text-muted-400 font-medium line-clamp-3">
                      {post.excerpt || post.content.substring(0, 150)}
                    </p>
                  </div>
                </div>
                <div className="p-6 pt-0">
                  <Link
                    to={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    Read Article <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-dark-800/30 rounded-3xl border border-dashed border-dark-700">
            <p className="text-muted-400 font-medium">
              No published articles found matching that criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
