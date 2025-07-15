import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Send, Lightbulb, Copy, ArrowLeft, Bot, User, Loader2, ChevronDown, Edit3 } from 'lucide-react';
import ContentEditor from "./content-editor";
import type { ContentIdea } from "@/hooks/useContentState";

interface RefineIdeaProps {
  idea?: ContentIdea;
  onBack: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function RefineIdea({ idea, onBack }: RefineIdeaProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const { toast } = useToast();

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Check if user is at bottom of chat
  const checkScrollPosition = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
      setShowScrollButton(!isAtBottom);
    }
  };

  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      return () => container.removeEventListener('scroll', checkScrollPosition);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  // Add welcome message on first load
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage = idea 
        ? `Hi! I'm your Instagram growth expert. I can see you have a ${idea.generationType} idea about "${idea.headline}". 

I'm here to help you refine this content to maximize engagement and viral potential. What would you like to improve or explore about this post?`
        : `Hi! I'm your Instagram growth expert. I'm here to help you create and refine content to maximize engagement and viral potential.

You can ask me anything about Instagram content strategy, and I'll help you craft compelling posts that drive results.`;

      setMessages([{
        role: 'assistant',
        content: `${welcomeMessage}

💡 **I can help you with:**
• Hook optimization for better engagement
• Caption structure and storytelling
• Hashtag strategy refinement
• Visual content suggestions
• Call-to-action improvements
• Trending topics integration

What would you like to work on today?`,
        timestamp: new Date()
      }]);
    }
  }, [idea, messages.length]);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: `${type} copied to clipboard`,
      });
    });
  };

  // Streaming API call
  const handleStreamingRefine = async (message: string) => {
    setIsStreaming(true);
    setStreamingMessage("");

    try {
      abortControllerRef.current = new AbortController();
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/content/refine-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          idea,
          message,
          chatHistory: messages
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Authentication failed');
        }
        throw new Error('Stream request failed');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      let accumulatedMessage = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                accumulatedMessage += data.content;
                setStreamingMessage(accumulatedMessage);
              }
              if (data.done) {
                // Finalize the message
                setMessages(prev => [...prev, {
                  role: 'assistant',
                  content: accumulatedMessage,
                  timestamp: new Date()
                }]);
                setStreamingMessage("");
                setIsStreaming(false);
                return;
              }
              if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      
      console.error('Streaming error:', error);
      setIsStreaming(false);
      setStreamingMessage("");
      
      // Handle authentication errors
      if (error.message === 'Authentication failed') {
        toast({
          title: "Session Expired",
          description: "Please login again.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1000);
        return;
      }
      
      // Fallback to non-streaming
      try {
        const response = await apiRequest("POST", "/api/content/refine", {
          idea,
          message,
          chatHistory: messages
        });
        const data = response;
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        }]);
        setIsStreaming(false);
      } catch (fallbackError) {
        if (isUnauthorizedError(fallbackError)) {
          toast({
            title: "Unauthorized",
            description: "You are logged out. Logging in again...",
            variant: "destructive",
          });
          setTimeout(() => {
            window.location.href = "/api/login";
          }, 500);
          return;
        }
        toast({
          title: "Error",
          description: "Failed to refine idea. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isStreaming) return;
    
    const userMessage = input.trim();
    const currentInput = input;
    setInput("");
    
    // Add user message to chat
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);
    
    // Start streaming response
    try {
      await handleStreamingRefine(userMessage);
    } catch (error) {
      // If streaming fails, restore input
      setInput(currentInput);
      setIsStreaming(false);
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setStreamingMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isStreaming) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEditIdea = () => {
    if (idea) {
      setShowEditor(true);
    }
  };

  const handleEditorClose = () => {
    setShowEditor(false);
  };

  const handleEditorSave = (updatedIdea: ContentIdea) => {
    setShowEditor(false);
    // The ContentEditor handles the API call internally
  };

  return (
    <div className="max-w-6xl mx-auto md:p-6 space-y-0 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between p-4 md:p-0">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Instagram Content Expert 🚀
            </h1>
            <p className="text-gray-600 text-sm md:text-base">AI-powered content refinement and optimization</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {idea && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleEditIdea}
              className="flex items-center gap-2"
            >
              <Edit3 className="h-4 w-4" />
              Edit Content
            </Button>
          )}
          {idea && (
            <Badge variant="outline" className="text-sm bg-gradient-to-r from-purple-100 to-pink-100 border-purple-200">
              {idea.generationType}
            </Badge>
          )}
        </div>
      </div>

      <div className={`grid grid-cols-1 ${idea ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-0 md:gap-6`}>
        {/* Original Content Panel - Only show when idea exists */}
        {idea && (
          <div className="lg:col-span-1">
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 h-fit sticky top-6 rounded-none md:rounded-lg border-l-0 border-r-0 md:border-l md:border-r">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-purple-600" />
                  Original Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">HEADLINE</label>
                    <button 
                      onClick={() => copyToClipboard(idea.headline, 'Headline')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-gray-900 font-semibold">{idea.headline}</p>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">CAPTION</label>
                    <button 
                      onClick={() => copyToClipboard(idea.caption, 'Caption')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-gray-700 bg-white p-3 rounded-lg">{idea.caption}</p>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">HASHTAGS</label>
                    <button 
                      onClick={() => copyToClipboard(idea.hashtags, 'Hashtags')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-blue-600 bg-white p-3 rounded-lg break-all">{idea.hashtags}</p>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">STRATEGY</label>
                    <button 
                      onClick={() => copyToClipboard(idea.ideas, 'Strategy')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-gray-700 bg-white p-3 rounded-lg whitespace-pre-line">{idea.ideas}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Chat Interface */}
        <div className={idea ? "lg:col-span-2" : "lg:col-span-1"}>
          <Card className="h-[600px] flex flex-col relative rounded-none md:rounded-lg border-l-0 border-r-0 md:border-l md:border-r">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bot className="h-5 w-5 text-purple-600" />
                Instagram Growth Expert
              </CardTitle>
              <p className="text-sm text-gray-600">
                Get expert advice to optimize your content for maximum engagement and viral potential
              </p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden">
              {/* Chat Messages */}
              <div 
                ref={chatContainerRef}
                className="flex-1 space-y-4 overflow-y-auto p-4 bg-gray-50 rounded-lg"
              >
                {messages.map((message, index) => (
                  <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-start gap-2 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === 'user' ? 'bg-purple-600' : 'bg-blue-500'
                      }`}>
                        {message.role === 'user' ? (
                          <User className="h-4 w-4 text-white" />
                        ) : (
                          <Bot className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div className={`rounded-lg p-3 ${
                        message.role === 'user' 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                        <p className={`text-xs mt-2 ${
                          message.role === 'user' ? 'text-purple-200' : 'text-gray-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Streaming message */}
                {isStreaming && streamingMessage && (
                  <div className="flex justify-start">
                    <div className="flex items-start gap-2 max-w-[85%]">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-blue-500">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-white text-gray-900 border border-gray-200 rounded-lg p-3">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{streamingMessage}</p>
                        <div className="flex items-center gap-1 mt-2">
                          <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                          <span className="text-xs text-gray-500">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Loading indicator */}
                {isStreaming && !streamingMessage && (
                  <div className="flex justify-start">
                    <div className="flex items-start gap-2 max-w-[85%]">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-blue-500">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Scroll to bottom button */}
              {showScrollButton && (
                <button
                  onClick={scrollToBottom}
                  className="absolute bottom-20 right-6 bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full shadow-lg transition-all duration-200 z-10"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              )}

              {/* Input Area - Sticky to bottom */}
              <div className="flex gap-2 pt-4 border-t bg-white">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isStreaming ? "Please wait for AI response..." : "Ask me anything about optimizing your Instagram content..."}
                  className="flex-1 resize-none"
                  rows={2}
                  disabled={isStreaming}
                />
                {isStreaming ? (
                  <Button onClick={handleStopStreaming} variant="outline" className="self-end">
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    Stop
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!input.trim()}
                    className="self-end bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {showEditor && idea && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <ContentEditor
            content={idea}
            type="idea"
            onClose={handleEditorClose}
            onSave={handleEditorSave}
          />
        </div>
      )}
    </div>
  );
}