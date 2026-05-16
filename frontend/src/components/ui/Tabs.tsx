import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TabsProps {
  tabs: {
    id: string;
    label: string;
    icon?: React.ElementType;
    content: React.ReactNode;
  }[];
  activeTab?: string;
  onChange?: (id: string) => void;
  className?: string;
}

export const Tabs = ({
  tabs,
  activeTab: propActiveTab,
  onChange,
  className,
}: TabsProps) => {
  const [internalActiveTab, setInternalActiveTab] = React.useState(tabs[0].id);
  const activeTab = propActiveTab || internalActiveTab;

  const handleTabClick = (id: string) => {
    if (!propActiveTab) setInternalActiveTab(id);
    onChange?.(id);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative min-w-fit ${
                isActive
                  ? "text-white"
                  : "text-primary-200/40 hover:text-primary-200/60"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary-600 rounded-xl shadow-lg"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              {tab.icon && (
                <tab.icon
                  className={`w-3.5 h-3.5 relative z-10 ${isActive ? "text-white" : "text-primary-200/40"}`}
                />
              )}
              <span className="relative z-10 whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {tabs.find((t) => t.id === activeTab)?.content}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
