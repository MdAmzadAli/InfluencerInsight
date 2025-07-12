import { useState, useEffect } from 'react';

export interface ContentIdea {
  id: number;
  headline: string;
  caption: string;
  hashtags: string;
  ideas: string;
  generationType: string;
  isSaved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContentState {
  generatedIdeas: ContentIdea[];
  savedIdeas: ContentIdea[];
  isGenerating: boolean;
  lastGenerationType: string | null;
}

const STORAGE_KEY = 'instagram-content-state';

export function useContentState() {
  const [state, setState] = useState<ContentState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load content state:', error);
    }
    return {
      generatedIdeas: [],
      savedIdeas: [],
      isGenerating: false,
      lastGenerationType: null
    };
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save content state:', error);
    }
  }, [state]);

  const addGeneratedIdeas = (ideas: ContentIdea[]) => {
    setState(prev => ({
      ...prev,
      generatedIdeas: [...prev.generatedIdeas, ...ideas],
      isGenerating: false
    }));
  };

  const setGenerating = (isGenerating: boolean, generationType?: string) => {
    setState(prev => ({
      ...prev,
      isGenerating,
      lastGenerationType: generationType || prev.lastGenerationType
    }));
  };

  const saveIdea = (idea: ContentIdea) => {
    setState(prev => ({
      ...prev,
      savedIdeas: [...prev.savedIdeas, idea],
      generatedIdeas: prev.generatedIdeas.map(g => 
        g.id === idea.id ? { ...g, isSaved: true } : g
      )
    }));
  };

  const clearGeneratedIdeas = () => {
    setState(prev => ({
      ...prev,
      generatedIdeas: []
    }));
  };

  const separateIdeasAndLinks = (ideas: string) => {
    const lines = ideas.split('\n');
    const linkLine = lines.find(line => line.toLowerCase().includes('inspired by:'));
    const strategy = lines.filter(line => !line.toLowerCase().includes('inspired by:')).join('\n').trim();
    
    if (linkLine) {
      const linkMatch = linkLine.match(/https?:\/\/[^\s]+/);
      const link = linkMatch ? linkMatch[0] : '';
      return { strategy, link };
    }
    
    return { strategy: ideas, link: '' };
  };

  return {
    state,
    addGeneratedIdeas,
    setGenerating,
    saveIdea,
    clearGeneratedIdeas,
    separateIdeasAndLinks
  };
}