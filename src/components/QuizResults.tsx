import React from 'react';
import { Module, QuizResult } from '../types';
import { ArrowLeft, RefreshCw, BarChart2 } from 'lucide-react';
import { motion } from 'motion/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface QuizResultsProps {
  module: Module;
  currentResult?: QuizResult;
  onBack: () => void;
  onRestart: () => void;
}

export function QuizResults({ module, currentResult, onBack, onRestart }: QuizResultsProps) {
  const results = module.results;

  // Prepare data for chart
  const chartData = results.slice(-10).map((r, i) => ({
    name: `Attempt ${i + 1}`,
    score: Math.round((r.score / r.totalQuestions) * 100),
    time: r.timeTakenSeconds,
    date: new Date(r.date).toLocaleDateString(),
  }));

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6 min-h-[80vh] flex flex-col">
      <header className="flex justify-between items-center mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-mono"
        >
          <ArrowLeft size={20} /> RETURN TO MATRIX
        </button>
        {currentResult && (
          <button
            onClick={onRestart}
            className="flex items-center gap-2 px-6 py-2 bg-[var(--neon-cyan)] text-[var(--btn-text)] font-bold rounded-lg hover:opacity-80 transition-all glow-border-cyan text-sm font-mono"
          >
            <RefreshCw size={18} /> RE-ENGAGE
          </button>
        )}
      </header>

      {currentResult && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-[var(--panel-bg)] border border-[var(--neon-cyan)] rounded-3xl p-12 mb-12 text-center relative overflow-hidden glow-border-cyan"
        >
          <h2 className="text-gray-400 font-mono text-sm mb-4 uppercase tracking-widest">SIMULATION COMPLETE</h2>
          <div className="flex justify-center items-end gap-4 mb-8">
            <span className="text-8xl font-bold text-white font-mono glow-text-cyan leading-none">
              {currentResult.score}
            </span>
            <span className="text-4xl text-gray-600 font-mono mb-2">/ {currentResult.totalQuestions}</span>
          </div>
          <div className="flex justify-center gap-12 font-mono text-sm">
            <div className="text-center">
              <p className="text-gray-500 mb-1">ACCURACY</p>
              <p className="text-2xl text-[var(--neon-purple)] glow-text-purple">
                {Math.round((currentResult.score / currentResult.totalQuestions) * 100)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 mb-1">TIME ELAPSED</p>
              <p className="text-2xl text-white">{formatTime(currentResult.timeTakenSeconds)}</p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-3xl p-8 flex-1">
        <div className="flex items-center gap-3 mb-8">
          <BarChart2 className="text-[var(--neon-purple)]" size={24} />
          <h3 className="text-2xl font-bold text-white font-mono uppercase tracking-wider">PERFORMANCE HISTORY</h3>
        </div>

        {results.length === 0 ? (
          <div className="text-center py-20 text-gray-500 font-mono">NO DATA AVAILABLE YET</div>
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="name" stroke="#666" tick={{ fill: '#666', fontSize: 12, fontFamily: 'monospace' }} />
                <YAxis stroke="#666" tick={{ fill: '#666', fontSize: 12, fontFamily: 'monospace' }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', fontFamily: 'monospace' }}
                  itemStyle={{ color: '#00f3ff' }}
                  labelStyle={{ color: '#888', marginBottom: '4px' }}
                />
                <Bar dataKey="score" fill="var(--neon-cyan)" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
