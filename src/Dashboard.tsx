import React, { useRef, useState } from 'react';
import { Module } from '../types';
import { Plus, Upload, Download, Play, Edit, Trash2, BarChart2, CheckSquare, Square } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  modules: Module[];
  onCreateModule: () => void;
  onEditModule: (id: string) => void;
  onDeleteModule: (id: string) => void;
  onStartQuiz: (ids: string[]) => void;
  onViewStats: (id: string) => void;
  onImport: (modules: Module[]) => void;
  onExport: () => void;
}

export function Dashboard({
  modules,
  onCreateModule,
  onEditModule,
  onDeleteModule,
  onStartQuiz,
  onViewStats,
  onImport,
  onExport,
}: DashboardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedModules);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedModules(newSelection);
  };

  const handleStartCombinedQuiz = () => {
    if (selectedModules.size > 0) {
      onStartQuiz(Array.from(selectedModules));
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const importedModules = JSON.parse(content);
        if (Array.isArray(importedModules)) {
          onImport(importedModules);
        } else {
          alert("Invalid file format.");
        }
      } catch (err) {
        alert("Failed to parse file.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
        <div>
          <h1 className="text-4xl font-bold font-mono tracking-tighter text-[var(--text-main)] glow-text-cyan flex items-center gap-3">
            <span className="text-[var(--neon-cyan)]">MOGOJ</span>OSTRO
          </h1>
          <p className="text-[var(--text-muted)] mt-2 text-sm uppercase tracking-widest">Offline Knowledge Matrix</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {selectedModules.size > 0 && (
            <button
              onClick={handleStartCombinedQuiz}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--text-main)] text-[var(--bg-color)] font-bold rounded-lg hover:bg-[var(--neon-cyan)] transition-all text-sm font-mono animate-pulse"
            >
              <Play size={16} fill="currentColor" /> START COMBINED QUIZ ({selectedModules.size})
            </button>
          )}
          <button
            onClick={handleImportClick}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-lg hover:border-[var(--neon-purple)] hover:text-[var(--neon-purple)] transition-all text-sm font-mono"
          >
            <Download size={16} /> IMPORT
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-lg hover:border-[var(--neon-cyan)] hover:text-[var(--neon-cyan)] transition-all text-sm font-mono"
          >
            <Upload size={16} /> EXPORT
          </button>
          <button
            onClick={onCreateModule}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--neon-cyan)] text-[var(--btn-text)] font-bold rounded-lg hover:opacity-80 transition-all glow-border-cyan text-sm font-mono"
          >
            <Plus size={16} /> NEW MODULE
          </button>
        </div>
      </header>

      {modules.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[var(--border-color)] rounded-2xl bg-[var(--panel-bg)]">
          <p className="text-gray-500 font-mono mb-4">NO MODULES FOUND IN MATRIX</p>
          <button
            onClick={onCreateModule}
            className="text-[var(--neon-cyan)] hover:underline font-mono"
          >
            INITIALIZE FIRST MODULE
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={module.id}
              className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-xl p-6 flex flex-col hover:border-[var(--neon-cyan)] transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-purple)] opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-white truncate pr-4">{module.title || 'Untitled Module'}</h3>
                <button 
                  onClick={() => toggleSelection(module.id)}
                  className="text-[var(--text-muted)] hover:text-[var(--neon-cyan)] transition-colors"
                >
                  {selectedModules.has(module.id) ? (
                    <CheckSquare size={24} className="text-[var(--neon-cyan)]" />
                  ) : (
                    <Square size={24} />
                  )}
                </button>
              </div>
              <p className="text-gray-400 text-sm mb-6 font-mono">
                {module.cards.length} ITEMS | {module.results.length} SESSIONS
              </p>
              
              <div className="mt-auto flex justify-between items-center pt-4 border-t border-gray-800">
                <div className="flex gap-2">
                  <button
                    onClick={() => onEditModule(module.id)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
                    title="Edit Module"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => onViewStats(module.id)}
                    className="p-2 text-[var(--text-muted)] hover:text-[var(--neon-purple)] hover:bg-[var(--bg-color)] rounded-md transition-colors"
                    title="View Stats"
                  >
                    <BarChart2 size={18} />
                  </button>
                  <button
                    onClick={() => onDeleteModule(module.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-800 rounded-md transition-colors"
                    title="Delete Module"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <button
                  onClick={() => onStartQuiz([module.id])}
                  disabled={module.cards.length < 4}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--text-main)] text-[var(--bg-color)] font-bold rounded-lg hover:bg-[var(--neon-cyan)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <Play size={16} fill="currentColor" /> START
                </button>
              </div>
              {module.cards.length < 4 && (
                <p className="text-xs text-red-400 mt-2 text-right font-mono">Min 4 items required</p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
