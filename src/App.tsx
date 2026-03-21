import React, { useState, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Module, QuizResult } from './types';
import { Dashboard } from './components/Dashboard';
import { ModuleEditor } from './components/ModuleEditor';
import { QuizSetup } from './components/QuizSetup';
import { QuizRunner } from './components/QuizRunner';
import { QuizResults } from './components/QuizResults';
import { Sun, Moon } from 'lucide-react';

type ViewState = 'dashboard' | 'editor' | 'setup' | 'quiz' | 'results';

export default function App() {
  const [modules, setModules] = useLocalStorage<Module[]>('mogojostro_modules', []);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [activeModuleIds, setActiveModuleIds] = useState<string[]>([]);
  const [quizNumQuestions, setQuizNumQuestions] = useState(0);
  const [currentResult, setCurrentResult] = useState<QuizResult | undefined>(undefined);
  const [isDark, setIsDark] = useLocalStorage('mogojostro_theme', true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const activeModules = modules.filter((m) => activeModuleIds.includes(m.id));
  const activeModule = activeModules.length === 1 ? activeModules[0] : null;

  const combinedModule: Module | null = activeModules.length > 0 ? {
    id: activeModules.length === 1 ? activeModules[0].id : 'combined',
    title: activeModules.length === 1 ? activeModules[0].title : 'Combined Quiz',
    cards: activeModules.flatMap(m => m.cards),
    results: activeModules.length === 1 ? activeModules[0].results : [],
  } : null;

  // Handlers
  const handleCreateModule = () => {
    const newModule: Module = {
      id: Date.now().toString(),
      title: '',
      cards: [],
      results: [],
    };
    setModules([...modules, newModule]);
    setActiveModuleIds([newModule.id]);
    setCurrentView('editor');
  };

  const handleEditModule = (id: string) => {
    setActiveModuleIds([id]);
    setCurrentView('editor');
  };

  const handleDeleteModule = (id: string) => {
    if (confirm('Are you sure you want to delete this module?')) {
      setModules(modules.filter((m) => m.id !== id));
    }
  };

  const handleSaveModule = (updatedModule: Module) => {
    setModules(modules.map((m) => (m.id === updatedModule.id ? updatedModule : m)));
    setCurrentView('dashboard');
  };

  const handleStartQuizSetup = (ids: string[]) => {
    setActiveModuleIds(ids);
    setCurrentView('setup');
  };

  const handleStartQuiz = (numQuestions: number) => {
    setQuizNumQuestions(numQuestions);
    setCurrentView('quiz');
  };

  const handleFinishQuiz = (resultData: Omit<QuizResult, 'id'>) => {
    const newResult: QuizResult = {
      ...resultData,
      id: Date.now().toString(),
    };
    setCurrentResult(newResult);

    // Save result to module if it's a single module
    if (activeModuleIds.length === 1) {
      const id = activeModuleIds[0];
      setModules(
        modules.map((m) =>
          m.id === id
            ? { ...m, results: [...m.results, newResult] }
            : m
        )
      );
    }
    setCurrentView('results');
  };

  const handleViewStats = (id: string) => {
    setActiveModuleIds([id]);
    setCurrentResult(undefined);
    setCurrentView('results');
  };

  const handleImport = (importedModules: Module[]) => {
    const newModules = [...modules];
    importedModules.forEach(im => {
      if (!newModules.find(m => m.id === im.id)) {
        newModules.push(im);
      } else {
        newModules.push({ ...im, id: Date.now().toString() + Math.random().toString(36).substring(7) });
      }
    });
    setModules(newModules);
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(modules));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "mogojostro_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="min-h-screen py-8 relative pb-24">
      <div className="fixed top-4 right-4 z-50 sm:top-6 sm:right-6">
        <button
          onClick={() => setIsDark(!isDark)}
          className="p-3 rounded-full bg-[var(--panel-bg)] border border-[var(--border-color)] text-[var(--text-main)] hover:border-[var(--neon-cyan)] hover:text-[var(--neon-cyan)] transition-all shadow-lg"
          title="Toggle Theme"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {currentView === 'dashboard' && (
        <Dashboard
          modules={modules}
          onCreateModule={handleCreateModule}
          onEditModule={handleEditModule}
          onDeleteModule={handleDeleteModule}
          onStartQuiz={handleStartQuizSetup}
          onViewStats={handleViewStats}
          onImport={handleImport}
          onExport={handleExport}
        />
      )}

      {currentView === 'editor' && activeModule && (
        <ModuleEditor
          module={activeModule}
          onSave={handleSaveModule}
          onCancel={() => setCurrentView('dashboard')}
        />
      )}

      {currentView === 'setup' && combinedModule && (
        <QuizSetup
          module={combinedModule}
          onStart={handleStartQuiz}
          onCancel={() => setCurrentView('dashboard')}
        />
      )}

      {currentView === 'quiz' && combinedModule && (
        <QuizRunner
          module={combinedModule}
          numQuestions={quizNumQuestions}
          onFinish={handleFinishQuiz}
          onCancel={() => setCurrentView('dashboard')}
        />
      )}

      {currentView === 'results' && combinedModule && (
        <QuizResults
          module={combinedModule}
          currentResult={currentResult}
          onBack={() => setCurrentView('dashboard')}
          onRestart={() => setCurrentView('setup')}
        />
      )}
    </div>
  );
}
