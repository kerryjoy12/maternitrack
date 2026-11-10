import React, { useState, useRef, useEffect } from 'react';
import { Settings, Type, Contrast, Link as LinkIcon, RefreshCw, X, Eye } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

export default function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  
  const {
    highContrast, setHighContrast,
    fontSizeMultiplier, setFontSizeMultiplier,
    dyslexiaFont, setDyslexiaFont,
    highlightLinks, setHighlightLinks,
    resetPreferences
  } = useAccessibility();

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) setIsOpen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  // Trap focus or simple keyboard handling
  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  return (
    <div ref={widgetRef} className="fixed bottom-6 right-6 z-[100]">
      {/* Widget Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => handleKeyDown(e, () => setIsOpen(!isOpen))}
        className="w-12 h-12 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:bg-primary-dark transition-colors focus:outline-none focus:ring-4 focus:ring-primary-glow"
        aria-label="Accessibility Menu"
        aria-expanded={isOpen}
      >
        <Eye size={24} />
      </button>

      {/* Widget Menu */}
      {isOpen && (
        <div 
          className="absolute bottom-16 right-0 w-72 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-2xl p-4 flex flex-col gap-4 animate-in slide-in-from-bottom-2"
          role="dialog"
          aria-label="Accessibility Options"
        >
          <div className="flex justify-between items-center border-b border-[var(--border)] pb-2 mb-2">
            <h3 className="font-display font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
              <Settings size={18} /> Accessibility
            </h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-input)] focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Close Accessibility Menu"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {/* Font Size */}
            <div>
              <span className="text-xs font-semibold text-[var(--text-secondary)] mb-1 block">Text Size</span>
              <div className="flex bg-[var(--bg-input)] rounded-lg p-1 gap-1">
                <button
                  onClick={() => setFontSizeMultiplier('normal')}
                  className={`flex-1 text-sm py-1 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${fontSizeMultiplier === 'normal' ? 'bg-white shadow-sm text-primary' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'}`}
                  aria-pressed={fontSizeMultiplier === 'normal'}
                >
                  Aa
                </button>
                <button
                  onClick={() => setFontSizeMultiplier('large')}
                  className={`flex-1 text-base py-1 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${fontSizeMultiplier === 'large' ? 'bg-white shadow-sm text-primary' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'}`}
                  aria-pressed={fontSizeMultiplier === 'large'}
                >
                  Aa
                </button>
                <button
                  onClick={() => setFontSizeMultiplier('extra-large')}
                  className={`flex-1 text-lg py-1 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${fontSizeMultiplier === 'extra-large' ? 'bg-white shadow-sm text-primary' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'}`}
                  aria-pressed={fontSizeMultiplier === 'extra-large'}
                >
                  Aa
                </button>
              </div>
            </div>

            {/* Toggles */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setHighContrast(!highContrast)}
                onKeyDown={(e) => handleKeyDown(e, () => setHighContrast(!highContrast))}
                className={`flex items-center justify-between p-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary ${highContrast ? 'bg-[var(--primary-glow)] border-primary text-primary' : 'bg-transparent border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-input)]'}`}
                aria-pressed={highContrast}
              >
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Contrast size={16} /> High Contrast
                </div>
                <div className={`w-8 h-4 rounded-full transition-colors relative ${highContrast ? 'bg-primary' : 'bg-gray-300'}`}>
                  <div className={`absolute top-[2px] w-3 h-3 bg-white rounded-full transition-transform ${highContrast ? 'left-[18px]' : 'left-[2px]'}`} />
                </div>
              </button>

              <button
                onClick={() => setDyslexiaFont(!dyslexiaFont)}
                onKeyDown={(e) => handleKeyDown(e, () => setDyslexiaFont(!dyslexiaFont))}
                className={`flex items-center justify-between p-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary ${dyslexiaFont ? 'bg-[var(--primary-glow)] border-primary text-primary' : 'bg-transparent border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-input)]'}`}
                aria-pressed={dyslexiaFont}
              >
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Type size={16} /> Dyslexia Friendly
                </div>
                <div className={`w-8 h-4 rounded-full transition-colors relative ${dyslexiaFont ? 'bg-primary' : 'bg-gray-300'}`}>
                  <div className={`absolute top-[2px] w-3 h-3 bg-white rounded-full transition-transform ${dyslexiaFont ? 'left-[18px]' : 'left-[2px]'}`} />
                </div>
              </button>

              <button
                onClick={() => setHighlightLinks(!highlightLinks)}
                onKeyDown={(e) => handleKeyDown(e, () => setHighlightLinks(!highlightLinks))}
                className={`flex items-center justify-between p-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary ${highlightLinks ? 'bg-[var(--primary-glow)] border-primary text-primary' : 'bg-transparent border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-input)]'}`}
                aria-pressed={highlightLinks}
              >
                <div className="flex items-center gap-2 text-sm font-medium">
                  <LinkIcon size={16} /> Highlight Links
                </div>
                <div className={`w-8 h-4 rounded-full transition-colors relative ${highlightLinks ? 'bg-primary' : 'bg-gray-300'}`}>
                  <div className={`absolute top-[2px] w-3 h-3 bg-white rounded-full transition-transform ${highlightLinks ? 'left-[18px]' : 'left-[2px]'}`} />
                </div>
              </button>
            </div>
          </div>

          {/* Reset */}
          <div className="mt-2 pt-3 border-t border-[var(--border)]">
            <button
              onClick={resetPreferences}
              className="flex items-center justify-center gap-2 w-full p-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--danger)] rounded-md"
            >
              <RefreshCw size={14} /> Reset Preferences
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
