import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, X, Sparkles, AlertCircle, RefreshCw, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../lib/apiClient';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  provider?: string;
  fallbackUsed?: boolean;
  timestamp: string;
}

const ROLE_SUGGESTIONS: Record<string, string[]> = {
  donor: [
    'How is my donation urgency score calculated?',
    'What are the food safety guidelines for hot meals?',
    'How do I receive an 80G tax receipt?',
  ],
  ngo: [
    'How do I claim and accept available food donations?',
    'What are the requirements for 12A/80G verification?',
    'How does AI rank donations for our shelter?',
  ],
  volunteer: [
    'What are the steps for collecting and delivering food?',
    'What temperature should cooked food be held at during transit?',
    'What should I do if a pickup or delivery is delayed?',
  ],
  admin: [
    'How does the platform ensure FSSAI regulatory compliance?',
    'Summarize the active NGO verification pipeline.',
    'Explain the demand forecasting methodology.',
  ],
  visitor: [
    'How does AnnaSathi AI rescue surplus food?',
    'How can commercial kitchens register to donate?',
    'Are food donations protected under Good Samaritan laws?',
  ],
};

export const AIChatbotModal: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const userRole = (user?.role || 'visitor').toLowerCase();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<string>('gemini');
  const [providerMenuOpen, setProviderMenuOpen] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize greeting message on first open
  useEffect(() => {
    if (messages.length === 0) {
      let roleGreeting = 'I can help guide you through the zero-waste food rescue network.';
      if (userRole === 'donor') {
        roleGreeting = `Welcome ${user?.name || 'Partner'}! Ask me about listing surplus food, calculating urgency scores, or your 80G tax summaries.`;
      } else if (userRole === 'ngo') {
        roleGreeting = `Welcome ${user?.name || 'Partner'}! Ask me about discovering donations, claim procedures, or shelter verification.`;
      } else if (userRole === 'volunteer') {
        roleGreeting = `Welcome ${user?.name || 'Volunteer'}! Ask me about claiming tasks, route optimization, or insulated thermal handling.`;
      } else if (userRole === 'admin') {
        roleGreeting = `Welcome Administrator! I can provide insights into demand predictions, matching criteria, and platform compliance.`;
      }

      setMessages([
        {
          id: 'welcome-msg',
          sender: 'assistant',
          content: `Hello! I am AnnaSathi AI, your algorithmic food rescue assistant. ${roleGreeting}`,
          provider: 'rule_fallback',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [userRole, user?.name, messages.length]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);
    setErrorBanner(null);

    try {
      // Call backend API
      const res = await (apiClient as any).request('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: text,
          sessionId: sessionId || undefined,
          roleContext: userRole,
          provider: activeProvider !== 'auto' ? activeProvider : undefined,
        }),
      });

      if (res?.data) {
        if (res.data.sessionId) setSessionId(res.data.sessionId);
        if (res.data.provider) setActiveProvider(res.data.provider);

        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          content: res.data.reply || 'No response produced.',
          provider: res.data.provider,
          fallbackUsed: res.data.fallbackUsed,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error('Unexpected API response structure.');
      }
    } catch (err: any) {
      setErrorBanner('Could not connect to AI service. Using local knowledge fallback.');
      const fallbackMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'assistant',
        content:
          'AnnaSathi AI Knowledge Base: Food redistribution requires strict adherence to temperature safety. Hot cooked meals must be transported within 2 hours of completion unless refrigerated. Verified NGOs receive immediate matching alerts based on proximity.',
        provider: 'rule_fallback',
        fallbackUsed: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const currentSuggestions = ROLE_SUGGESTIONS[userRole] || ROLE_SUGGESTIONS.visitor;

  return (
    <>
      {/* Floating Launcher Pill matching AnnaSathi AI status marker */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#0f392b]/95 dark:bg-blue-600/95 backdrop-blur shadow-lg shadow-[#07241b]/20 text-white border border-[#166534]/80 dark:border-blue-400/50 hover:bg-[#0f392b] dark:hover:bg-blue-500 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/50 group"
          aria-label="Open AnnaSathi AI Assistant"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 dark:bg-cyan-300 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 dark:bg-blue-400" />
          </span>
          <span className="text-xs font-bold tracking-tight">AnnaSathi AI</span>
          <span className="text-[10px] font-semibold bg-emerald-500 dark:bg-blue-400/20 dark:bg-blue-500/20 text-emerald-300 dark:text-cyan-200 px-1.5 py-0.5 rounded-full border border-emerald-400/30 dark:border-cyan-400/30">
            v4.0
          </span>
        </button>
      )}

      {/* Expandable Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[95vw] sm:w-[440px] h-[600px] max-h-[85vh] bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/40 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-primary text-on-primary flex items-center justify-between border-b border-primary-container">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary-container flex items-center justify-center text-secondary-container shadow-sm">
                <Bot size={22} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm leading-tight text-on-primary">AnnaSathi AI</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-secondary text-on-secondary rounded font-bold uppercase tracking-wider">
                    {userRole}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-surface-container-highest">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary-container animate-pulse"></span>
                  <span>
                    Provider: {activeProvider === 'rule_fallback' ? 'Knowledge Engine' : activeProvider}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Provider Selection Trigger */}
              <div className="relative">
                <button
                  onClick={() => setProviderMenuOpen(!providerMenuOpen)}
                  className="p-1.5 text-surface-container-highest hover:text-on-primary rounded-lg transition-colors flex items-center gap-0.5 text-xs"
                  title="Switch AI Provider"
                >
                  <Sparkles size={16} />
                  <ChevronDown size={12} />
                </button>

                {providerMenuOpen && (
                  <div className="absolute right-0 top-8 w-44 bg-surface-container-lowest text-on-surface rounded-xl shadow-xl border border-outline-variant/40 py-1.5 z-50 text-xs">
                    <div className="px-3 py-1 text-[10px] uppercase font-bold text-outline">
                      AI Provider
                    </div>
                    <button
                      onClick={() => {
                        setActiveProvider('gemini');
                        setProviderMenuOpen(false);
                      }}
                      className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-surface-container-low transition-colors"
                    >
                      <span>Google Gemini</span>
                      {activeProvider === 'gemini' && <Check size={14} className="text-secondary" />}
                    </button>
                    <button
                      onClick={() => {
                        setActiveProvider('nvidia_nim');
                        setProviderMenuOpen(false);
                      }}
                      className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-surface-container-low transition-colors"
                    >
                      <span>NVIDIA NIM</span>
                      {activeProvider === 'nvidia_nim' && <Check size={14} className="text-secondary" />}
                    </button>
                    <button
                      onClick={() => {
                        setActiveProvider('rule_fallback');
                        setProviderMenuOpen(false);
                      }}
                      className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-surface-container-low transition-colors"
                    >
                      <span>Knowledge Engine</span>
                      {activeProvider === 'rule_fallback' && <Check size={14} className="text-secondary" />}
                    </button>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-surface-container-highest hover:text-on-primary rounded-lg transition-colors"
                aria-label="Close Assistant"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorBanner && (
            <div className="px-3 py-1.5 bg-warning/20 border-b border-warning/30 flex items-center gap-2 text-xs text-on-surface">
              <AlertCircle size={14} className="text-warning flex-shrink-0" />
              <span className="truncate">{errorBanner}</span>
            </div>
          )}

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-surface/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[85%] ${
                  msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'
                }`}
              >
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-primary text-on-primary rounded-br-xs'
                      : 'bg-surface-container-lowest text-on-surface border border-outline-variant/30 rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                <div className="flex items-center gap-1.5 mt-1 px-1 text-[10px] text-outline">
                  <span>{msg.timestamp}</span>
                  {msg.provider && msg.sender === 'assistant' && (
                    <>
                      <span>•</span>
                      <span className="capitalize">{msg.provider.replace('_', ' ')}</span>
                      {msg.fallbackUsed && <span className="text-warning font-semibold">(Fallback)</span>}
                    </>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="self-start flex items-center gap-2 px-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl rounded-bl-xs text-secondary text-sm">
                <RefreshCw size={15} className="animate-spin" />
                <span className="text-xs text-on-surface-variant font-medium">
                  Formulating zero-waste guidance...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-3 py-2 bg-surface-container-low border-t border-outline-variant/20 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {currentSuggestions.map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(sug)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-surface-container-lowest hover:bg-surface-container border border-outline-variant/40 text-[11px] text-primary font-medium transition-colors flex-shrink-0 cursor-pointer"
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-surface-container-lowest border-t border-outline-variant/30 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask AnnaSathi (${userRole})...`}
              disabled={isLoading}
              className="flex-1 px-3.5 py-2 text-sm bg-surface-container-low rounded-xl border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface placeholder:text-outline disabled:opacity-50"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputMessage.trim()}
              className="p-2.5 bg-primary hover:bg-primary-container disabled:opacity-40 text-on-primary rounded-xl shadow transition-colors flex items-center justify-center cursor-pointer"
              aria-label="Send Message"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};




