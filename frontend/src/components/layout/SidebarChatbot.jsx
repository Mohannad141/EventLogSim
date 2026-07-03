import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, MessageSquare, Loader2 } from 'lucide-react';
import { sendChatMessage } from '../../lib/api.js';
import { cn } from '../../utils/cn.js';

const QUICK_QUESTIONS = [
  'How to run a simulation?',
  'How does BPMN-based mode work?',
  'How are agents extracted from BPMN?',
  'What are case attributes?',
];

const SidebarChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I am your EventLogSim AI assistant. Ask me anything about configuring processes, setting up agents, or analyzing simulation runs!",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text) return;

    if (!textToSend) {
      setInput('');
    }

    const updatedMessages = [...messages, { role: 'user', content: text }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const payload = updatedMessages.map(m => ({ role: m.role, content: m.content }));
      const res = await sendChatMessage(payload);
      setMessages([...updatedMessages, { role: 'assistant', content: res.response }]);
    } catch (err) {
      setMessages([
        ...updatedMessages,
        {
          role: 'assistant',
          content: `Sorry, I encountered an error: ${err.message || 'Unknown error'}. Please verify that the backend is running.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Sidebar Widget Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-200 shadow-sm",
          isOpen
            ? "border-sky-400 bg-sky-50 shadow-md ring-2 ring-sky-100"
            : "border-slate-200 bg-white hover:border-sky-300 hover:bg-slate-50/50"
        )}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500 text-white shadow-md shadow-sky-500/20">
          <MessageSquare className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
            AI Assistant
            <Sparkles className="h-3 w-3 text-amber-500 fill-amber-500 animate-pulse" />
          </p>
          <p className="text-xs text-slate-500 truncate">Ask how to run or configure</p>
        </div>
      </button>

      {/* Floating Side Panel (Drawer) */}
      <div
        className={cn(
          "fixed inset-y-0 z-20 flex w-80 flex-col border-r border-slate-200 bg-slate-50 shadow-2xl transition-all duration-300 ease-in-out",
          isOpen ? "left-72 opacity-100 pointer-events-auto" : "-left-80 opacity-0 pointer-events-none"
        )}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-950">AI Help Assistant</h3>
              <p className="text-[10px] text-emerald-600 font-medium">Online & Ready</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={index}
                className={cn("flex flex-col max-w-[85%]", isUser ? "ml-auto items-end" : "mr-auto items-start")}
              >
                <div
                  className={cn(
                    "rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-sm",
                    isUser
                      ? "bg-sky-500 text-white rounded-tr-none"
                      : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                  )}
                >
                  {isUser ? msg.content : renderMarkdown(msg.content)}
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 pl-1">
              <Loader2 className="h-3 w-3 animate-spin text-sky-500" />
              Thinking...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        {messages.length === 1 && (
          <div className="px-4 py-2 border-t border-slate-200 bg-white/50">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Common Questions:</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  disabled={loading}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 hover:border-sky-300 hover:bg-sky-50/50 hover:text-sky-600 transition-colors text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Input */}
        <div className="border-t border-slate-200 bg-white p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about EventLogSim..."
              disabled={loading}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100 disabled:opacity-60 transition-all"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500 text-white shadow-md shadow-sky-500/20 hover:bg-sky-600 disabled:opacity-50 disabled:shadow-none transition-all"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

// Inline parser for bold and code backticks
const parseInline = (text) => {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|<br\s*\/?>)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={idx} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-pink-600 border border-slate-100">{part.slice(1, -1)}</code>;
    }
    if (part.match(/<br\s*\/?>/i)) {
      return <br key={idx} />;
    }
    return part;
  });
};

// Simple table renderer
const renderTable = (headers, rows) => {
  return (
    <div key={Math.random()} className="my-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-[10px]">
        <thead className="bg-slate-50">
          <tr>
            {headers?.map((h, idx) => (
              <th key={idx} className="px-3 py-2 text-left font-semibold text-slate-700 whitespace-nowrap">
                {parseInline(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {rows.map((row, rIdx) => (
            <tr key={rIdx}>
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-3 py-2 text-slate-600">
                  {parseInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Custom Markdown to JSX parser
const renderMarkdown = (text) => {
  if (!text) return '';
  
  const lines = text.split('\n');
  const rendered = [];
  let inList = false;
  let inTable = false;
  let tableHeaders = null;
  let tableRows = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Handle empty line
    if (!line) {
      if (inList) {
        inList = false;
      }
      if (inTable) {
        rendered.push(renderTable(tableHeaders, tableRows));
        inTable = false;
        tableHeaders = null;
        tableRows = [];
      }
      rendered.push(<div key={`br-${i}`} className="h-2" />);
      continue;
    }

    // Handle headers (###, ##, #)
    if (line.startsWith('### ')) {
      rendered.push(<h4 key={i} className="text-xs font-bold text-slate-900 mt-3 mb-1">{parseInline(line.slice(4))}</h4>);
      continue;
    }
    if (line.startsWith('## ') || line.startsWith('# ')) {
      const depth = line.startsWith('## ') ? 2 : 1;
      const clean = line.slice(depth + 1);
      rendered.push(<h3 key={i} className="text-xs font-bold text-slate-950 mt-4 mb-2">{parseInline(clean)}</h3>);
      continue;
    }

    // Handle bullet list items (* or -)
    if (line.startsWith('* ') || line.startsWith('- ')) {
      inList = true;
      rendered.push(
        <ul key={i} className="list-disc pl-4 space-y-1 my-1 text-slate-700">
          <li>{parseInline(line.slice(2))}</li>
        </ul>
      );
      continue;
    }

    // Handle table lines
    if (line.startsWith('|')) {
      const parts = line.split('|').map(p => p.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      const isDivider = parts.every(p => p.startsWith('-') || p.replace(/[-:\s]/g, '') === '');
      if (isDivider) {
        continue;
      }

      if (!inTable) {
        inTable = true;
        tableHeaders = parts;
      } else {
        tableRows.push(parts);
      }
      continue;
    } else {
      if (inTable) {
        rendered.push(renderTable(tableHeaders, tableRows));
        inTable = false;
        tableHeaders = null;
        tableRows = [];
      }
    }

    // Normal paragraph line
    rendered.push(<p key={i} className="mb-2 text-slate-700">{parseInline(line)}</p>);
  }

  if (inTable) {
    rendered.push(renderTable(tableHeaders, tableRows));
  }

  return rendered;
};

export default SidebarChatbot;
