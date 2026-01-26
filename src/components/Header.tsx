"use client";

import { motion } from "motion/react";
import { BookOpen, Feather, Plus } from "lucide-react";

interface HeaderProps {
  onCreateNew?: () => void;
  onViewList?: () => void;
  currentView?: "home" | "create" | "preview";
}

export function Header({
  onCreateNew,
  onViewList,
  currentView = "home",
}: HeaderProps) {
  return (
    <motion.header
      className="sticky top-0 z-50 w-full border-b border-paper-300/50 bg-paper-50/95 backdrop-blur-sm"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-10 h-10 rounded-full hero-badge flex items-center justify-center">
              <Feather className="w-5 h-5 text-paper" />
            </div>
            <div>
              <h1 className="font-display text-xl md:text-2xl font-bold">
                <span className="gradient-text-warm">たび</span>
                <span className="text-ink">Note</span>
              </h1>
              <p className="font-ui text-xs text-ink-soft hidden sm:block">
                旅のしおりをサクッと
              </p>
            </div>
          </motion.div>

          <nav className="flex items-center gap-2">
            {currentView === "home" && (
              <>
                <motion.button
                  onClick={onCreateNew}
                  className="px-5 py-2.5 btn btn-primary btn-pill text-sm flex items-center gap-2"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                >
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                  <span className="hidden sm:inline">新しいしおり</span>
                  <span className="sm:hidden">新規</span>
                </motion.button>
                <motion.button
                  onClick={onViewList}
                  className="px-5 py-2.5 btn btn-ghost text-ink text-sm flex items-center gap-2"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                >
                  <BookOpen className="w-4 h-4" strokeWidth={2} />
                  <span className="hidden sm:inline">しおり一覧</span>
                  <span className="sm:hidden">一覧</span>
                </motion.button>
              </>
            )}
          </nav>
        </div>
      </div>
    </motion.header>
  );
}
