import React, { useState, useEffect, useMemo } from 'react';
import { Module, Flashcard, QuizResult } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

interface QuizRunnerProps {
  module: Module;
  numQuestions: number;
  onFinish: (result: Omit<QuizResult, 'id'>) => void;
  onCancel: () => void;
}

// Utility to shuffle an array
function shuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function QuizRunner({ module, numQuestions, onFinish, onCancel }: QuizRunnerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  // Generate questions
  const questions = useMemo(() => {
    const shuffledCards = shuffle(module.cards).slice(0, numQuestions);
    return shuffledCards.map((card) => {
      if (card.type === 'mcq' && card.options && card.options.length >= 2) {
        // It's a real MCQ
        return {
          prompt: card.term,
          isRealMCQ: true,
          options: card.options.map((opt, i) => ({
            id: `opt-${i}`,
            text: opt,
            isCorrect: i === card.correctOptionIndex
          }))
        };
      } else {
        // It's a standard flashcard, randomly flip term/definition
        const askDefinition = Math.random() > 0.5;
        const prompt = askDefinition ? card.definition : card.term;

        // Try to get wrong cards from the same module
        let sameModuleCards = module.cards.filter((c) => c.id !== card.id && c.moduleId === card.moduleId);
        
        // If not enough cards in the same module, fallback to other modules
        if (sameModuleCards.length < 3) {
          const otherCards = module.cards.filter((c) => c.id !== card.id && c.moduleId !== card.moduleId);
          sameModuleCards = [...sameModuleCards, ...otherCards];
        }

        const wrongCards = shuffle(sameModuleCards).slice(0, 3);
        const options = shuffle([card, ...wrongCards]).map(c => ({
          id: c.id,
          text: askDefinition ? c.term : c.definition,
          isCorrect: c.id === card.id
        }));
        
        return {
          prompt,
          isRealMCQ: false,
          options,
        };
      }
    });
  }, [module, numQuestions]);

  const currentQuestion = questions[currentIndex];

  const handleAnswer = (optionId: string, isCorrectOption: boolean) => {
    if (selectedAnswer !== null) return; // Prevent multiple clicks

    setSelectedAnswer(optionId);
    setIsCorrect(isCorrectOption);

    if (isCorrectOption) {
      setScore((s) => s + 1);
    }

    // Move to next question after delay
    setTimeout(() => {
      if (currentIndex < numQuestions - 1) {
        setCurrentIndex((i) => i + 1);
        setSelectedAnswer(null);
        setIsCorrect(null);
      } else {
        // Finish quiz
        const timeTaken = Math.floor((Date.now() - startTime) / 1000);
        onFinish({
          date: new Date().toISOString(),
          score: score + (isCorrectOption ? 1 : 0),
          totalQuestions: numQuestions,
          timeTakenSeconds: timeTaken,
        });
      }
    }, 1500);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 min-h-[80vh] flex flex-col">
      <header className="flex justify-between items-center mb-8 bg-[var(--panel-bg)] p-4 rounded-2xl border border-[var(--border-color)]">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="text-gray-500 hover:text-white font-mono text-sm">
            ABORT
          </button>
          <div className="h-6 w-px bg-gray-700" />
          <span className="text-[var(--neon-cyan)] font-mono font-bold tracking-widest uppercase">
            {module.title}
          </span>
        </div>
        <div className="flex items-center gap-6 font-mono">
          <div className="flex items-center gap-2 text-gray-300">
            <Clock size={16} className="text-[var(--neon-purple)]" />
            {formatTime(elapsedTime)}
          </div>
          <div className="text-gray-400">
            PROGRESS: <span className="text-white font-bold">{currentIndex + 1}</span> / {numQuestions}
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <div className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-3xl p-8 md:p-12 mb-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-purple)]" />
              <h2 className="text-gray-500 font-mono text-sm mb-4 uppercase tracking-widest">
                {currentQuestion.isRealMCQ ? 'QUESTION:' : 'IDENTIFY MATCH FOR:'}
              </h2>
              <p className="text-3xl md:text-5xl font-bold text-white font-sans leading-tight whitespace-pre-wrap">
                {currentQuestion.prompt}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === option.id;
                const isActuallyCorrect = option.isCorrect;
                
                let buttonClass = "bg-[var(--panel-bg)] border-[var(--border-color)] text-[var(--text-main)] hover:border-[var(--neon-cyan)] hover:text-[var(--neon-cyan)]";
                
                if (selectedAnswer !== null) {
                  if (isActuallyCorrect) {
                    buttonClass = "bg-green-900/20 border-green-500 text-green-400 glow-border-cyan"; // Correct answer always highlights green
                  } else if (isSelected && !isActuallyCorrect) {
                    buttonClass = "bg-red-900/20 border-red-500 text-red-400"; // Selected wrong answer highlights red
                  } else {
                    buttonClass = "bg-[var(--panel-bg)] border-[var(--border-color)] text-[var(--text-muted)] opacity-50"; // Others fade out
                  }
                }

                return (
                  <button
                    key={option.id}
                    onClick={() => handleAnswer(option.id, isActuallyCorrect)}
                    disabled={selectedAnswer !== null}
                    className={`p-6 rounded-2xl border-2 text-left transition-all font-sans text-lg flex items-start gap-4 ${buttonClass}`}
                  >
                    <span className="font-mono text-sm opacity-50 mt-1">{String.fromCharCode(65 + index)}.</span>
                    <span className="flex-1 whitespace-pre-wrap">{option.text}</span>
                    {selectedAnswer !== null && isActuallyCorrect && (
                      <CheckCircle className="text-green-500 shrink-0" />
                    )}
                    {isSelected && !isActuallyCorrect && (
                      <XCircle className="text-red-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
