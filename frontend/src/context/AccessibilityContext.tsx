import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type FontSizeMultiplier = 'normal' | 'large' | 'extra-large';

interface AccessibilityPreferences {
  highContrast: boolean;
  fontSizeMultiplier: FontSizeMultiplier;
  dyslexiaFont: boolean;
  highlightLinks: boolean;
}

interface AccessibilityContextType extends AccessibilityPreferences {
  setHighContrast: (val: boolean) => void;
  setFontSizeMultiplier: (val: FontSizeMultiplier) => void;
  setDyslexiaFont: (val: boolean) => void;
  setHighlightLinks: (val: boolean) => void;
  resetPreferences: () => void;
}

const defaultPreferences: AccessibilityPreferences = {
  highContrast: false,
  fontSizeMultiplier: 'normal',
  dyslexiaFont: false,
  highlightLinks: false,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider = ({ children }: { children: ReactNode }) => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(() => {
    const saved = localStorage.getItem('a11y-preferences');
    return saved ? JSON.parse(saved) : defaultPreferences;
  });

  useEffect(() => {
    localStorage.setItem('a11y-preferences', JSON.stringify(preferences));
    
    // Apply classes to the document body or html element for global overrides
    const root = document.documentElement;
    
    // High Contrast
    if (preferences.highContrast) {
      root.classList.add('a11y-high-contrast');
    } else {
      root.classList.remove('a11y-high-contrast');
    }

    // Font Size
    root.classList.remove('a11y-large-text', 'a11y-extra-large-text');
    if (preferences.fontSizeMultiplier === 'large') {
      root.classList.add('a11y-large-text');
    } else if (preferences.fontSizeMultiplier === 'extra-large') {
      root.classList.add('a11y-extra-large-text');
    }

    // Dyslexia Font
    if (preferences.dyslexiaFont) {
      root.classList.add('a11y-dyslexia-font');
    } else {
      root.classList.remove('a11y-dyslexia-font');
    }

    // Highlight Links
    if (preferences.highlightLinks) {
      root.classList.add('a11y-highlight-links');
    } else {
      root.classList.remove('a11y-highlight-links');
    }

  }, [preferences]);

  const updatePreference = (key: keyof AccessibilityPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const contextValue: AccessibilityContextType = {
    ...preferences,
    setHighContrast: (val) => updatePreference('highContrast', val),
    setFontSizeMultiplier: (val) => updatePreference('fontSizeMultiplier', val),
    setDyslexiaFont: (val) => updatePreference('dyslexiaFont', val),
    setHighlightLinks: (val) => updatePreference('highlightLinks', val),
    resetPreferences: () => setPreferences(defaultPreferences),
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
