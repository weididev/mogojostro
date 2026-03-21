import React, { useState } from 'react';
import { Module } from '../types';
import { Play, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface QuizSetupProps {
  module: Module;
  onStart: (numQuestions: number) => void;
  onCancel: () => void;
}

export function QuizSetup({ module, onStart, onCancel }: QuizSetupProps) {
  const maxQuestions = module.cards.length;
  const [numQuestions, setNumQuestions] = useState(Math.min(10, maxQuestions));

  return (
    <div className="w-full max-w-2xl mx-auto p-6 flex flex-col items-center justify-center min-h-[80vh]">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-3xl p-12 w-full text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-purple)]" />
        
        <button
          onClick={onCancel}
          className="absolute top-6 left-6 text-gray-500 hover:text-white transition-colors"
        >
          <ArrowLeft size={24} />
        </button>

        <h2 className="text-3xl font-bold text-white mb-2 font-mono glow-text-cyan uppercase tracking-wider">
          {module.title}
        </h2>
        <p className="text-gray-400 mb-12 font-mono text-sm">INITIALIZE SIMULATION</p>

        <div className="mb-12">
          <label className="block text-gray-300 mb-4 font-mono text-lg">
            SELECT NUMBER OF ITERATIONS
          </label>
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => setNumQuestions(Math.max(4, numQuestions - 1))}
              className="w-12 h-12 rounded-full border border-[var(--border-color)] text-[var(--text-main)] flex items-center justify-center hover:border-[var(--neon-cyan)] hover:text-[var(--neon-cyan)] transition-colors text-2xl font-mono"
            >
              -
            </button>
            <span className="text-6xl font-bold text-white font-mono w-24 text-center glow-text-purple">
              {numQuestions}
            </span>
            <button
              onClick={() => setNumQuestions(Math.min(maxQuestions, numQuestions + 1))}
              className="w-12 h-12 rounded-full border border-[var(--border-color)] text-[var(--text-main)] flex items-center justify-center hover:border-[var(--neon-cyan)] hover:text-[var(--neon-cyan)] transition-colors text-2xl font-mono"
            >
              +
            </button>
          </div>
          <p className="text-gray-500 mt-4 font-mono text-sm">MAX AVAILABLE: {maxQuestions}</p>
        </div>

        <button
          onClick={() => onStart(numQuestions)}
          className="w-full py-4 bg-[var(--neon-cyan)] text-[var(--btn-text)] font-bold rounded-xl hover:opacity-80 transition-all glow-border-cyan text-lg font-mono flex items-center justify-center gap-3"
        >
          <Play size={24} fill="currentColor" /> ENGAGE
        </button>
      </motion.div>
    </div>
  );
}
