import { useState, useEffect } from 'react';
import { Search, FileText, Video, Book, Download, Tag } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Resource {
  id: string;
  title: string;
  category: 'NOTE' | 'VIDEO' | 'BOOK' | 'OTHER';
  file: string;
  version: number;
  subject_name: string;
  uploaded_at: string;
}

export const ResourceLibrary = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = [
    { id: 'NOTE', label: 'Lesson Notes', icon: FileText, color: 'text-blue-400' },
    { id: 'VIDEO', label: 'Video Lectures', icon: Video, color: 'text-rose-400' },
    { id: 'BOOK', label: 'E-Books', icon: Book, color: 'text-emerald-400' },
  ];

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const res = await axios.get('/api/v1/lms/resources/');
      setResources(res.data);
    } catch (err) {
      toast.error('Failed to load resources');
    }
  };

  const filteredResources = resources.filter(res => {
    const matchesSearch = res.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !activeCategory || res.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-10">
      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-200/30" />
          <input 
            type="text"
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
          />
        </div>

        <div className="flex gap-3 overflow-auto w-full md:w-auto pb-2 md:pb-0">
          <button 
            onClick={() => setActiveCategory(null)}
            className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
              !activeCategory ? 'bg-primary-500 text-white shadow-premium' : 'bg-white/5 text-primary-200/50 border border-white/5 hover:border-white/10'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap flex items-center gap-2 ${
                activeCategory === cat.id ? 'bg-primary-500 text-white shadow-premium' : 'bg-white/5 text-primary-200/50 border border-white/5 hover:border-white/10'
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
        {filteredResources.map(resource => {
          const cat = categories.find(c => c.id === resource.category) || { icon: FileText, color: 'text-white' };
          return (
            <div key={resource.id} className="glass p-6 rounded-[32px] border border-white/5 hover:border-white/20 transition-all group flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${cat.color}`}>
                    <cat.icon className="w-6 h-6" />
                  </div>
                  <div className="text-[10px] font-black bg-primary-500/10 text-primary-400 px-2 py-1 rounded-md uppercase">
                    v{resource.version}.0
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-primary-400 transition-colors line-clamp-2">{resource.title}</h3>
                <div className="flex items-center gap-2 mt-4 text-xs text-primary-200/40">
                  <Tag className="w-3 h-3" />
                  <span>{resource.subject_name}</span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                  {new Date(resource.uploaded_at).toLocaleDateString()}
                </span>
                <a 
                  href={resource.file} 
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 bg-primary-500 text-white rounded-xl hover:bg-primary-400 transition-all shadow-lg"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
