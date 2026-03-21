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
      { id: Date.now().toString(), term: '', definition: '', type: 'flashcard' },
    ]);
  };

  const handleRemoveCard = (id: string) => {
    setCards(cards.filter((c) => c.id !== id));
  };

  const handleChange = (id: string, field: keyof Flashcard, value: any) => {
    setCards(
      cards.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleOptionChange = (id: string, index: number, value: string) => {
    setCards(
      cards.map((c) => {
        if (c.id === id) {
          const newOptions = [...(c.options || ['', '', '', ''])];
          newOptions[index] = value;
          return { ...c, options: newOptions };
        }
        return c;
      })
    );
  };

  const handleSave = () => {
    // Filter out empty cards
    const validCards = cards.filter(c => c.term.trim() !== '');
    onSave({
      ...module,
      title: title.trim() || 'Untitled Module',
      cards: validCards,
    });
  };

  const preprocessImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(URL.createObjectURL(file));
        
        // Scale down if too large to speed up processing
        const MAX_WIDTH = 1500;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        // Simple grayscale and contrast boost
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Grayscale
          let gray = 0.299 * r + 0.587 * g + 0.114 * b;
          // Contrast boost
          gray = gray < 128 ? gray * 0.8 : gray * 1.2;
          if (gray > 255) gray = 255;
          
          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
        }
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
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
        const processedImageUrl = await preprocessImage(file);
        const result = await Tesseract.recognize(processedImageUrl, 'eng');
        extractedText = result.data.text;
      } else {
        throw new Error('Unsupported file type');
      }

      // Basic heuristic parser for Q&A, Terms/Definitions, or MCQs
      const lines = extractedText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      const extractedCards: Flashcard[] = [];
      
      let currentTerm = '';
      let currentDef = '';
      let currentOptions: string[] = [];
      let isMCQ = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (/^(\d+[\.\)]|Q:|Question:)/i.test(line)) {
          if (currentTerm) {
            extractedCards.push({ 
              id: Date.now().toString() + Math.random(),
              term: currentTerm, 
              definition: currentDef || '...',
              type: isMCQ && currentOptions.length > 0 ? 'mcq' : 'flashcard',
              options: isMCQ ? [...currentOptions, '', '', '', ''].slice(0, 4) : undefined,
              correctOptionIndex: 0
            });
          }
          currentTerm = line;
          currentDef = '';
          currentOptions = [];
          isMCQ = false;
        } else if (/^([A-D][\.\)])/i.test(line)) {
          isMCQ = true;
          currentOptions.push(line.replace(/^([A-D][\.\)])\s*/i, ''));
        } else if (/^(A:|Answer:|Ans:)/i.test(line)) {
          currentDef += (currentDef ? '\n' : '') + line;
        } else {
          if (!currentTerm) {
            currentTerm = line;
          } else if (isMCQ && currentOptions.length > 0 && currentOptions.length < 4) {
             currentOptions[currentOptions.length - 1] += ' ' + line;
          } else if (!currentDef) {
            currentDef = line;
          } else {
            currentDef += '\n' + line;
          }
        }
      }
      if (currentTerm) {
        extractedCards.push({ 
          id: Date.now().toString() + Math.random(),
          term: currentTerm, 
          definition: currentDef || '...',
          type: isMCQ && currentOptions.length > 0 ? 'mcq' : 'flashcard',
          options: isMCQ ? [...currentOptions, '', '', '', ''].slice(0, 4) : undefined,
          correctOptionIndex: 0
        });
      }
      
      if (extractedCards.length <= 1 && lines.length > 1) {
        extractedCards.length = 0; 
        for(let i = 0; i < lines.length; i += 2) {
          extractedCards.push({
            id: Date.now().toString() + Math.random(),
            term: lines[i],
            definition: lines[i+1] || '...',
            type: 'flashcard'
          });
        }
      }

      if (extractedCards.length > 0) {
        setCards(prev => [...prev, ...extractedCards]);
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

      <div className="space-y-6">
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--panel-bg)] border border-[var(--border-color)] p-6 rounded-xl hover:border-[var(--neon-cyan)] transition-colors relative group"
          >
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleRemoveCard(card.id)}
                className="text-gray-500 hover:text-red-500 transition-colors p-2 rounded-md hover:bg-gray-800"
                title="Delete Card"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="text-gray-500 font-mono font-bold text-lg">
                {String(index + 1).padStart(2, '0')}
              </div>
              <select
                value={card.type || 'flashcard'}
                onChange={(e) => handleChange(card.id, 'type', e.target.value)}
                className="bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-main)] rounded-md px-3 py-1 text-sm font-mono focus:outline-none focus:border-[var(--neon-cyan)]"
              >
                <option value="flashcard">Standard (Term/Def)</option>
                <option value="mcq">Multiple Choice (MCQ)</option>
              </select>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1 font-mono">Question / Term</label>
                <textarea
                  value={card.term}
                  onChange={(e) => handleChange(card.id, 'term', e.target.value)}
                  placeholder="Enter the question or term..."
                  className="w-full bg-[var(--bg-color)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:border-[var(--neon-cyan)] focus:outline-none p-3 font-sans min-h-[80px] resize-y"
                />
              </div>

              {card.type === 'mcq' ? (
                <div>
                  <label className="block text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2 font-mono">Options (Select Correct Answer)</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[0, 1, 2, 3].map((optIndex) => (
                      <div key={optIndex} className={`flex items-center gap-3 p-2 rounded-lg border ${card.correctOptionIndex === optIndex ? 'border-[var(--neon-cyan)] bg-[var(--neon-cyan)]/10' : 'border-[var(--border-color)] bg-[var(--bg-color)]'}`}>
                        <input
                          type="radio"
                          name={`correct-${card.id}`}
                          checked={card.correctOptionIndex === optIndex}
                          onChange={() => handleChange(card.id, 'correctOptionIndex', optIndex)}
                          className="w-4 h-4 text-[var(--neon-cyan)] focus:ring-[var(--neon-cyan)] bg-transparent border-gray-600"
                        />
                        <input
                          type="text"
                          value={card.options?.[optIndex] || ''}
                          onChange={(e) => handleOptionChange(card.id, optIndex, e.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                          className="w-full bg-transparent text-[var(--text-main)] focus:outline-none font-sans text-sm"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <label className="block text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1 font-mono">Explanation (Optional)</label>
                    <input
                      type="text"
                      value={card.definition}
                      onChange={(e) => handleChange(card.id, 'definition', e.target.value)}
                      placeholder="Explanation for the correct answer..."
                      className="w-full bg-[var(--bg-color)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:border-[var(--neon-purple)] focus:outline-none p-3 font-sans"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1 font-mono">Answer / Definition</label>
                  <textarea
                    value={card.definition}
                    onChange={(e) => handleChange(card.id, 'definition', e.target.value)}
                    placeholder="Enter the answer or definition..."
                    className="w-full bg-[var(--bg-color)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:border-[var(--neon-purple)] focus:outline-none p-3 font-sans min-h-[80px] resize-y"
                  />
                </div>
              )}
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
