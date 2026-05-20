import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { blogService } from "../../api/services/blogService";
import { ChevronLeft, Calendar, Tag, Clock } from "lucide-react";
import { motion } from "framer-motion";

export const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: () => blogService.getPostDetail(slug!),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-900 text-white flex items-center justify-center">
        <p className="text-muted-400 font-medium">Loading article...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-dark-900 text-white flex flex-col items-center justify-center gap-4">
        <p className="text-muted-400 font-medium">Article not found.</p>
        <Link
          to="/blog"
          className="text-xs font-black text-primary-400 uppercase tracking-widest hover:text-primary-300"
        >
          Back to Blog
        </Link>
      </div>
    );
  }

  // Basic read time estimator
  const wordCount = post.content.split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="min-h-screen bg-dark-900 text-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back Link */}
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Blog
        </Link>

        {/* Hero Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-6 text-[10px] text-muted-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(post.created_at).toLocaleDateString()}
            </span>
            {post.category && (
              <span className="flex items-center gap-1.5 text-primary-400">
                <Tag className="w-3.5 h-3.5" />
                {post.category.name}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {readTime} Min Read
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-lg text-muted-300 font-semibold border-l-4 border-primary-500 pl-4 py-1 italic leading-relaxed">
              {post.excerpt}
            </p>
          )}
        </div>

        {/* Featured Image */}
        {post.featured_image && (
          <div className="aspect-[21/9] bg-dark-800 rounded-3xl overflow-hidden border border-dark-700/60">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content Body */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="prose prose-invert prose-p:text-muted-300 prose-p:leading-relaxed prose-headings:font-black prose-headings:text-white prose-a:text-primary-400 max-w-none text-muted-300 leading-relaxed font-medium space-y-6 text-sm"
        >
          {post.content.split("\n").map((para: string, idx: number) => {
            if (!para.trim()) return null;
            return <p key={idx}>{para}</p>;
          })}
        </motion.div>
      </div>
    </div>
  );
};
