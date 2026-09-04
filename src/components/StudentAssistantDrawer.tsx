import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  User,
  Bot,
  RefreshCw,
  Minimize2,
  Maximize2,
  Trash2,
  CheckCircle2,
  Clock,
  Terminal,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';
import { ChatMessage, ExplanationLanguage } from '../types';

interface StudentAssistantDrawerProps {
  originalCode: string;
  fixedCode: string;
  explanationLanguage: ExplanationLanguage;
  initialQuestion?: string;
  onClearInitialQuestion?: () => void;
}

export const StudentAssistantDrawer: React.FC<StudentAssistantDrawerProps> = ({
  originalCode,
  fixedCode,
  explanationLanguage,
  initialQuestion,
  onClearInitialQuestion,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text:
        explanationLanguage === 'taglish'
          ? 'Kumusta! Ako si Damon. May tanong ka ba tungkol sa code mo o sa ginawang fix? Tanungin mo lang ako anytime sa Taglish o English!'
          : 'Hi, I am Damon. Ask me any technical questions about the detected bugs, the applied patch, or how to run and test this code in your local environment.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle triggered questions from parent buttons
  useEffect(() => {
    if (initialQuestion) {
      sendMessage(initialQuestion);
      if (onClearInitialQuestion) {
        onClearInitialQuestion();
      }
    }
  }, [initialQuestion]);

  const sendMessage = async (textToSend: string) => {
    const q = textToSend.trim();
    if (!q || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: originalCode,
          fixedCode: fixedCode,
          question: q,
          explanationLanguage,
          history: messages.slice(-4),
        }),
      });

      if (!response.ok) {
        throw new Error('Server returned error response');
      }

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: data.reply || 'No answer received.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text:
          explanationLanguage === 'taglish'
            ? 'Paumanhin, nagka-aberya sa pag-connect sa server. Pakisubukan ulit mamaya!'
            : 'Unable to communicate with Damon tutor engine right now. Please verify your connection and try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        sender: 'assistant',
        text:
          explanationLanguage === 'taglish'
            ? 'Na-reset na ang session. May gusto ka pa bang itanong tungkol sa code o iba pang programming topics?'
            : 'Conversation cleared. Ready for your next technical question or code inquiry.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-xl shadow-lg overflow-hidden mb-8 transition-all">
      {/* Header */}
      <div className="px-4 py-3 bg-[#090D16] border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-cyan-400 flex items-center justify-center border border-indigo-500/20 shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold font-mono text-white">
                Damon
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-800">
                AI Tutor Session
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans hidden sm:block">Ask technical follow-ups, best practices, and runtime questions</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleClearChat}
            className="h-7.5 px-2.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 text-xs font-mono transition-colors cursor-pointer inline-flex items-center gap-1.5"
            title="Reset conversation"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7.5 w-7.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer inline-flex items-center justify-center"
            title={isExpanded ? 'Minimize' : 'Expand'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Chat Messages */}
          <div className="p-4 sm:p-5 max-h-[350px] min-h-[200px] overflow-y-auto space-y-3.5 bg-[#0B0F19]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs sm:text-sm ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-6 h-6 rounded-md bg-indigo-600/30 border border-indigo-500/40 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white font-sans'
                      : 'bg-[#0F172A] text-slate-200 border border-slate-800 font-sans'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <span
                    className={`block text-[10px] font-mono mt-1 text-right ${
                      msg.sender === 'user' ? 'text-indigo-200/80' : 'text-slate-500'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-6 h-6 rounded-md bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 border border-slate-700 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 items-center text-xs text-slate-400">
                <div className="w-6 h-6 rounded-md bg-indigo-600/30 border border-indigo-500/40 text-cyan-400 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-[#0F172A] border border-slate-800 rounded-xl px-3.5 py-2 flex items-center gap-2 font-mono">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  <span>Damon analyzing inquiry...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Question Chips */}
          <div className="px-4 py-2 bg-[#090D16] border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-[11px] text-slate-400">
            <span className="shrink-0 text-slate-500 font-mono text-[10px] uppercase">Suggested:</span>
            <button
              type="button"
              onClick={() =>
                sendMessage(
                  explanationLanguage === 'taglish'
                    ? 'Bakit nagkakaroon ng error na ito at ano ang Best Practice?'
                    : 'Why does this error occur and what is the industry best practice?'
                )
              }
              className="shrink-0 h-6.5 px-2.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer transition-colors inline-flex items-center gap-1.5 font-mono text-[11px]"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Best Practices</span>
            </button>
            <button
              type="button"
              onClick={() =>
                sendMessage(
                  explanationLanguage === 'taglish'
                    ? 'Paano ito i-test gamit ang edge cases o unit test?'
                    : 'How can I test this with edge cases or unit tests?'
                )
              }
              className="shrink-0 h-6.5 px-2.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer transition-colors inline-flex items-center gap-1.5 font-mono text-[11px]"
            >
              <Terminal className="w-3 h-3 text-cyan-400" />
              <span>Edge Cases</span>
            </button>
            <button
              type="button"
              onClick={() =>
                sendMessage(
                  explanationLanguage === 'taglish'
                    ? 'Ano ang Time and Space Complexity ng code na ito?'
                    : 'What is the Big O Time and Space Complexity of this code?'
                )
              }
              className="shrink-0 h-6.5 px-2.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer transition-colors inline-flex items-center gap-1.5 font-mono text-[11px]"
            >
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Time Complexity</span>
            </button>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="p-3 bg-[#090D16] border-t border-slate-800 flex gap-2">
            <input
              id="student-tutor-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                explanationLanguage === 'taglish'
                  ? 'Magtanong kay Damon (hal. "Paano gumagana ang recursion dito?")...'
                  : 'Ask Damon (e.g. "How does this loop boundary fix work under the hood?")...'
              }
              className="flex-1 h-9 px-3.5 bg-[#0B0F19] border border-slate-800 rounded-lg text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 font-sans"
            />
            <button
              id="student-tutor-send-btn"
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`h-9 px-4 rounded-lg text-white font-mono font-medium text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                !input.trim() || isLoading
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-sm'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </>
      )}
    </div>
  );
};
