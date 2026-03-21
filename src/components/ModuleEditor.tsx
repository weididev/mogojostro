import React, { useState } from 'react';
import { Module, Flashcard } from '../types';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

interface ModuleEditorProps {
  module: Module;
  onSave: (module: Module) => void;
  onCancel: () => void;
}

export function ModuleEditor({ module, onSave, onCancel }: ModuleEditorProps) {
  const [title, setTitle] = useState(module.title);
  const [cards, setCards] = useState<Flashcard[]>(module.cards);

  const handleAddCard = () => {
    setCards([
      ...cards,
      { id: Date.now().toString(), term: '', definition: '' },
    ]);
  };

  const handleRemoveCard = (id: string) => {
    setCards(cards.filter((c) => c.id !== id));
  };

  const handleChange = (id: string, field: 'term' | 'definition', value: string) => {
    setCards(
      cards.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleSave = () => {
    // Filter out empty cards
    const validCards = cards.filter(c => c.term.trim() !== '' && c.definition.trim() !== '');
    onSave({
      ...module,
      title: title.trim() || 'Untitled Module',
      cards: validCards,
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6">
      <header className="flex justify-between items-center mb-8">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-mono"
        >
          <ArrowLeft size={20} /> BACK TO MATRIX
        </button>
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 bg-[var(--neon-purple)] text-[var(--btn-text)] font-bold rounded-lg hover:opacity-80 transition-all glow-border-purple text-sm font-mono"
          >
            <Save size={18} /> SAVE MODULE
          </button>
        </div>
      </header>

      <div className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl p-8 mb-8">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="ENTER MODULE DESIGNATION..."
          className="w-full bg-transparent text-3xl font-bold text-[var(--text-main)] placeholder-[var(--text-muted)] border-b border-[var(--border-color)] focus:border-[var(--neon-cyan)] focus:outline-none pb-4 transition-colors font-mono"
        />
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-12 gap-4 px-4 text-gray-500 font-mono text-sm uppercase tracking-wider">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-4">Term / Rule</div>
          <div className="col-span-6">Definition / Description</div>
          <div className="col-span-1 text-center">Act</div>
        </div>

        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="grid grid-cols-12 gap-4 items-center bg-[var(--panel-bg)] border border-[var(--border-color)] p-4 rounded-xl hover:border-[var(--neon-cyan)] transition-colors"
          >
            <div className="col-span-1 text-center text-gray-600 font-mono font-bold">
              {String(index + 1).padStart(2, '0')}
            </div>
            <div className="col-span-4">
              <input
                type="text"
                value={card.term}
                onChange={(e) => handleChange(card.id, 'term', e.target.value)}
                placeholder="e.g., Rule 1"
                className="w-full bg-transparent text-[var(--text-main)] border-b border-transparent focus:border-[var(--neon-cyan)] focus:outline-none py-2 font-mono"
              />
            </div>
            <div className="col-span-6">
              <input
                type="text"
                value={card.definition}
                onChange={(e) => handleChange(card.id, 'definition', e.target.value)}
                placeholder="e.g., Never forget rule one."
                className="w-full bg-transparent text-[var(--text-main)] border-b border-transparent focus:border-[var(--neon-purple)] focus:outline-none py-2 font-sans"
              />
            </div>
            <div className="col-span-1 flex justify-center">
              <button
                onClick={() => handleRemoveCard(card.id)}
                className="text-gray-500 hover:text-red-500 transition-colors p-2 rounded-md hover:bg-gray-800"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </motion.div>
        ))}

        <button
          onClick={handleAddCard}
          className="w-full py-4 mt-6 border border-dashed border-[var(--border-color)] text-[var(--text-muted)] rounded-xl hover:border-[var(--neon-cyan)] hover:text-[var(--neon-cyan)] transition-colors flex items-center justify-center gap-2 font-mono"
        >
          <Plus size={20} /> APPEND NEW RECORD
        </button>
      </div>
    </div>
  );
}
