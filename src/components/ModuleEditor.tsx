import React, { useState, useRef } from 'react';
import { Module, Flashcard } from '../types';
import { ArrowLeft, Save, Plus, Trash2, FileText, Loader2, Camera } from 'lucide-react';
import { motion } from 'motion/react';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Setup PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ModuleEditorProps {
  module: Module;
  onSave: (module: Module) => void;
  onCancel: () => void;
}

export function ModuleEditor({ module, onSave, onCancel }: ModuleEditorProps) {
  const [title, setTitle] = useState(module.title);
  const [cards, setCards] = useState<Flashcard[]>(module.cards);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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
    const validCards = cards.filter(c => c.term.trim() !== '' && c.definition.trim() !== '');
    onSave({
      ...module,
      title: title.trim() || 'Untitled Module',
      cards: validCards,
    });
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    try {
      let extractedText = '';

      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          extractedText += pageText + '\n\n';
        }
      } else if (file.type.startsWith('image/')) {
        const result = await Tesseract.recognize(file, 'eng');
        extractedText = result.data.text;
      } else {
        throw new Error('Unsupported file type');
      }

      const lines = extractedText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      const extractedCards: {term: string, definition: string}[] = [];
      
      let currentTerm = '';
      let currentDef = '';
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/^(\d+[\.\)]|Q:|Question:)/i.test(line)) {
          if (currentTerm) {
            extractedCards.push({ term: currentTerm, definition: currentDef || '...' });
          }
          currentTerm = line;
          currentDef = '';
        } else if (/^(A:|Answer:|Ans:|[A-D][\.\)])/i.test(line)) {
          currentDef += (currentDef ? '\n' : '') + line;
        } else {
          if (!currentTerm) {
            currentTerm = line;
          } else if (!currentDef) {
            currentDef = line;
          } else {
            currentDef += '\n' + line;
          }
        }
      }
      if (currentTerm) {
        extractedCards.push({ term: currentTerm, definition: currentDef || '...' });
      }
      
      if (extractedCards.length <= 1 && lines.length > 1) {
        extractedCards.length = 0; 
        for(let i = 0; i < lines.length; i += 2) {
          extractedCards.push({
            term: lines[i],
            definition: lines[i+1] || '...'
          });
        }
      }

      if (extractedCards.length > 0) {
        const newCards = extractedCards.map((c, index) => ({
          id: Date.now().toString() + index.toString(),
          term: c.term || '',
          definition: c.definition || '',
        }));
        setCards(prev => [...prev, ...newCards]);
      } else {
        alert('Could not extract any meaningful text from the document.');
      }
    } catch (error) {
      console.error('Error processing document:', error);
      alert('Failed to process document. Please try again.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
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
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,application/pdf"
            className="hidden"
          />
          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            capture="environment"
            className="hidden"
          />
          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--panel-bg)] border border-[var(--border-color)] text-[var(--text-main)] font-bold rounded-lg hover:border-[var(--neon-cyan)] hover:text-[var(--neon-cyan)] transition-all text-sm font-mono disabled:opacity-50"
            title="Take Photo"
          >
            {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--panel-bg)] border border-[var(--border-color)] text-[var(--text-main)] font-bold rounded-lg hover:border-[var(--neon-cyan)] hover:text-[var(--neon-cyan)] transition-all text-sm font-mono disabled:opacity-50"
          >
            {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
            {isProcessing ? 'SCANNING...' : 'AUTO-GENERATE'}
          </button>
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
