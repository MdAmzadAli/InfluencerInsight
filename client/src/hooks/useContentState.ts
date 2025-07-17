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
  sourceUrl?: string;
}

export interface ContentState {
  generatedIdeas: ContentIdea[];
  savedIdeas: ContentIdea[];
  isGenerating: boolean;
  lastGenerationType: string | null;
  generationSessions: { type: string; timestamp: number; count: number }[];
  streamingSession: {
    isActive: boolean;
    generationType: string | null;
    startTime: number | null;
    expectedIdeas: number;
    currentProgress: string;
  };
}

const STORAGE_KEY = 'instagram-content-state';

// Function to validate and fix content ideas with invalid IDs
const validateAndFixContentIdeas = (ideas: ContentIdea[]): ContentIdea[] => {
  return ideas.filter(idea => {
    // Check if ID is a valid integer that fits in INT4 (32-bit signed integer)
    if (typeof idea.id !== 'number' || idea.id > 2147483647 || idea.id < -2147483648 || !Number.isInteger(idea.id)) {
      console.warn('Removing invalid content idea with ID:', idea.id);
      return false;
    }
    return true;
  });
};

export function useContentState() {
  const [state, setState] = useState<ContentState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedState = JSON.parse(stored);
        // Validate and fix content ideas with invalid IDs
        const validatedState = {
          ...parsedState,
          generatedIdeas: validateAndFixContentIdeas(parsedState.generatedIdeas || []),
          savedIdeas: validateAndFixContentIdeas(parsedState.savedIdeas || [])
        };
        return validatedState;
      }
    } catch (error) {
      console.error('Failed to load content state:', error);
    }
    return {
      generatedIdeas: [],
      savedIdeas: [],
      isGenerating: false,
      lastGenerationType: null,
      generationSessions: [],
      streamingSession: {
        isActive: false,
        generationType: null,
        startTime: null,
        expectedIdeas: 0,
        currentProgress: ''
      }
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

  const addGeneratedIdeas = (ideas: ContentIdea[], generationType?: string) => {
    setState(prev => {
      const newSession = {
        type: generationType || prev.lastGenerationType || 'unknown',
        timestamp: Date.now(),
        count: ideas.length
      };
      
      return {
        ...prev,
        generatedIdeas: [...ideas, ...prev.generatedIdeas], // New ideas first
        generationSessions: [newSession, ...prev.generationSessions], // New sessions first
        isGenerating: false
      };
    });
  };

  const setGenerating = (isGenerating: boolean, generationType?: string) => {
    setState(prev => ({
      ...prev,
      isGenerating,
      lastGenerationType: generationType || prev.lastGenerationType
    }));
  };

  const setStreamingSession = (updates: Partial<ContentState['streamingSession']>) => {
    setState(prev => ({
      ...prev,
      streamingSession: {
        ...prev.streamingSession,
        ...updates
      }
    }));
  };

  const startStreamingSession = (generationType: string, expectedIdeas: number) => {
    setState(prev => ({
      ...prev,
      streamingSession: {
        isActive: true,
        generationType,
        startTime: Date.now(),
        expectedIdeas,
        currentProgress: 'Starting content generation...'
      }
    }));
  };

  const endStreamingSession = () => {
    setState(prev => ({
      ...prev,
      streamingSession: {
        isActive: false,
        generationType: null,
        startTime: null,
        expectedIdeas: 0,
        currentProgress: ''
      }
    }));
  };

  const saveIdea = (ideaId: number, saved: boolean) => {
    setState(prev => {
      const updatedGeneratedIdeas = prev.generatedIdeas.map(idea => 
        idea.id === ideaId ? { ...idea, isSaved: saved } : idea
      );
      
      const ideaToSave = updatedGeneratedIdeas.find(idea => idea.id === ideaId);
      
      return {
        ...prev,
        generatedIdeas: updatedGeneratedIdeas,
        savedIdeas: saved && ideaToSave
          ? [...prev.savedIdeas.filter(idea => idea.id !== ideaId), ideaToSave]
          : prev.savedIdeas.filter(idea => idea.id !== ideaId)
      };
    });
  };

  const clearGeneratedIdeas = () => {
    setState(prev => ({
      ...prev,
      generatedIdeas: [],
      generationSessions: []
    }));
  };

  const updateIdea = (ideaId: number, updates: Partial<ContentIdea>) => {
    setState(prev => ({
      ...prev,
      generatedIdeas: prev.generatedIdeas.map(idea => 
        idea.id === ideaId ? { ...idea, ...updates } : idea
      ),
      savedIdeas: prev.savedIdeas.map(idea => 
        idea.id === ideaId ? { ...idea, ...updates } : idea
      )
    }));
  };

  const clearAllData = () => {
    // Clear all localStorage data and reset state
    localStorage.removeItem(STORAGE_KEY);
    setState({
      generatedIdeas: [],
      savedIdeas: [],
      isGenerating: false,
      lastGenerationType: null,
      generationSessions: [],
      streamingSession: {
        isActive: false,
        generationType: null,
        startTime: null,
        expectedIdeas: 0,
        currentProgress: ''
      }
    });
  };

  const separateIdeasAndLinks = (ideas: string) => {
    // Fallback function for backward compatibility with older content
    console.log('🔍 Frontend fallback: Separating ideas and links from:', ideas);
    
    // Look for "Source:" pattern which is how we format Instagram links
    const sourceMatch = ideas.match(/Source:\s*(https?:\/\/[^\s]+)/i);
    
    if (sourceMatch) {
      const link = sourceMatch[1];
      const strategy = ideas.replace(/Source:\s*https?:\/\/[^\s]+/i, '').trim();
      console.log('✅ Frontend fallback: Found source link:', link, 'Strategy:', strategy.substring(0, 50) + '...');
      return { strategy, link };
    }
    
    // Fallback for old format
    const lines = ideas.split('\n');
    const linkLine = lines.find(line => line.toLowerCase().includes('inspired by:'));
    const strategy = lines.filter(line => !line.toLowerCase().includes('inspired by:')).join('\n').trim();
    
    if (linkLine) {
      const linkMatch = linkLine.match(/https?:\/\/[^\s]+/);
      const link = linkMatch ? linkMatch[0] : '';
      console.log('✅ Frontend fallback: Found inspired by link:', link, 'Strategy:', strategy.substring(0, 50) + '...');
      return { strategy, link };
    }
    
    console.log('✅ Frontend fallback: No link found, returning full ideas as strategy');
    return { strategy: ideas, link: '' };
  };

  return {
    state,
    addGeneratedIdeas,
    setGenerating,
    saveIdea,
    updateIdea,
    clearGeneratedIdeas,
    clearAllData,
    separateIdeasAndLinks,
    setStreamingSession,
    startStreamingSession,
    endStreamingSession
  };
}