'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import MathText from '@/components/MathText';
import { 
  Brain, 
  Send, 
  ArrowLeft, 
  Sparkles, 
  User, 
  MessageSquare,
  Loader2,
  HelpCircle,
  Code,
  Compass
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export default function ChatPage() {
  const router = useRouter();
  const { user, geminiKey } = useAppStore();
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      content: 'Salom! Men sizning shaxsiy AI repetitoringizman. Bugun nimalarni o\'rganishni xohlaysiz? Savolingiz bo\'lsa bemalol yozing, darsliklar va topshiriqlarni tushuntirib bera olaman.'
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Scroll to bottom on message updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!user) return null;

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMsg;
    if (!textToSend.trim() || loading) return;

    // Add user message
    const updatedMessages = [...messages, { role: 'user' as const, content: textToSend }];
    setMessages(updatedMessages);
    setInputMsg('');
    setLoading(true);

    try {
      // Call route endpoint `/api/ai/chat`
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: messages,
          studentLevel: user.level,
          apiKey: geminiKey
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server error');

      setMessages([...updatedMessages, { role: 'model' as const, content: data.reply }]);

    } catch (err: any) {
      console.error(err);
      // Fallback response on failure
      setMessages([...updatedMessages, { 
        role: 'model' as const, 
        content: `Xatolik yuz berdi: ${err.message || 'AI ulanish xatosi'}.\n\nAPI kaliti to'g'ri o'rnatilganligini va internet aloqasini tekshiring.` 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (topicText: string) => {
    handleSendMessage(topicText);
  };

  // Quick suggestion chips based on level
  const schoolSuggestions = [
    'Quyosh tizimi qanday tuzilgan?',
    'Kasr sonlarni qo\'shishni tushuntir',
    'Ingliz tilida Present Simple nima?'
  ];

  const universitySuggestions = [
    'Kvant fizikasining asosiy prinsiplari',
    'Python da Quick Sort algoritmini yozib ber',
    'Diplom ishi uchun AI mavzulari taklif qil'
  ];

  const chips = user.level === 'school' ? schoolSuggestions : universitySuggestions;

  return (
    <div className="relative min-h-screen bg-[#020205] text-gray-100 flex flex-col justify-between overflow-hidden">
      
      {/* Background design elements */}
      <div className="absolute top-[20%] left-[10%] w-[35%] h-[35%] rounded-full bg-purple-900/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[10%] w-[35%] h-[35%] rounded-full bg-pink-900/5 blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-0 z-30 glass-panel border-b border-purple-500/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link 
            href={user.role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student'} 
            className="p-2 border border-gray-900 bg-gray-950/40 hover:bg-gray-900 text-gray-400 hover:text-white rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-white">AI-Repetitor Tutor</span>
              <span className="text-[9px] text-purple-400 bg-purple-950/30 border border-purple-800/30 px-2 py-0.5 rounded-full ml-2 font-bold uppercase">
                {user.level} daraja
              </span>
            </div>
          </div>
        </div>

        <div className="text-[10px] text-gray-500 font-semibold max-w-[200px] text-right truncate">
          Talaba: {user.name}
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-8 flex flex-col justify-between relative z-10 overflow-hidden">
        
        {/* Messages list container */}
        <div className="flex-1 overflow-y-auto pr-2 mb-6 flex flex-col gap-4 max-h-[60vh]">
          {messages.map((msg, idx) => (
            <div 
              key={idx}
              className={`flex items-start gap-3.5 max-w-[85%] ${
                msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gradient-to-tr from-purple-600 to-pink-500 text-white shadow-md'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
              </div>

              <div className={`p-4 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap border ${
                msg.role === 'user'
                  ? 'bg-purple-950/20 border-purple-500/20 text-white rounded-tr-none'
                  : 'bg-gray-950/40 border-gray-900 text-gray-200 rounded-tl-none font-mono text-[11px]'
              }`}>
                <MathText text={msg.content} />
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3.5 max-w-[80%] self-start">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center">
                <Brain className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl border bg-gray-950/40 border-gray-900 text-gray-400 rounded-tl-none flex items-center gap-2 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-pink-500" /> Repetitor javob yozmoqda...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Suggestion Chips */}
        {messages.length === 1 && (
          <div className="flex flex-col gap-2.5 mb-6">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" /> Tavsiya etilgan mavzular:
            </span>
            <div className="flex flex-wrap gap-2">
              {chips.map((chipText) => (
                <button
                  key={chipText}
                  onClick={() => handleChipClick(chipText)}
                  className="bg-gray-950/30 border border-gray-900 hover:border-purple-500/20 text-gray-400 hover:text-white transition-all text-[11px] font-semibold px-4 py-2 rounded-xl text-left cursor-pointer"
                >
                  {chipText}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Input box */}
        <div className="glass-panel p-2 rounded-2xl border border-purple-500/10 flex items-center gap-2">
          <input 
            type="text" 
            placeholder="Savolingizni yoki dars mavzusini kiriting..."
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            className="flex-1 bg-transparent focus:outline-none px-4 py-3 text-xs text-white placeholder-gray-700"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMsg.trim() || loading}
            className="glow-btn bg-purple-600 hover:bg-purple-700 disabled:bg-gray-900 disabled:text-gray-600 disabled:cursor-not-allowed text-white p-3 rounded-xl flex items-center justify-center transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </main>

      {/* Footer */}
      <footer className="py-4 px-6 text-center text-[10px] text-gray-700 bg-black/20 border-t border-purple-500/[0.02]">
        DangasaAI Virtual Tutor Session &bull; Adapted responses active
      </footer>

    </div>
  );
}
