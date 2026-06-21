'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAppStore, QuizAttempt, CheatingLog } from '@/store/useAppStore';
import { t } from '@/locales/translations';
import MathText from '@/components/MathText';
import { 
  Brain, 
  Clock, 
  ShieldAlert, 
  Lock, 
  HelpCircle, 
  Maximize, 
  Send,
  Loader2,
  AlertTriangle
} from 'lucide-react';

export default function ExamPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const [groupParam, setGroupParam] = useState(searchParams.get('group') || '');
  const [inputGroupCode, setInputGroupCode] = useState('');
  const [groupCodeError, setGroupCodeError] = useState<string | null>(null);

  const { 
    user, 
    geminiKey, 
    assignments, 
    submitAttempt, 
    addCheatingLog, 
    addXp, 
    unlockAssignment,
    language,
    theme,
    fetchAssignmentById
  } = useAppStore();
  
  const assignment = assignments.find(a => a.id === id);

  // States
  const [loadingAssignment, setLoadingAssignment] = useState(!assignment);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [submitting, setSubmitting] = useState(false);
  
  // Cheating states
  const [cheatScore, setCheatScore] = useState(0);
  const [cheatWarnings, setCheatWarnings] = useState<string[]>([]);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [currentWarningMsg, setCurrentWarningMsg] = useState('');

  // Refs for tracking
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const totalDurationRef = useRef(0); // overall seconds spent

  // Apply theme classes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(theme);
    }
  }, [theme]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Fetch assignment if missing from store (Visibility Fix)
  useEffect(() => {
    if (!assignment && id) {
      setLoadingAssignment(true);
      fetchAssignmentById(id).then(() => {
        setLoadingAssignment(false);
      }).catch(() => {
        setLoadingAssignment(false);
      });
    } else {
      setLoadingAssignment(false);
    }
  }, [id, assignment, fetchAssignmentById]);

  // Auto unlock assignment for student on direct link visit (Visibility Fix Requirement)
  useEffect(() => {
    if (user && id && assignment) {
      unlockAssignment(id);
    }
  }, [user, id, assignment, unlockAssignment]);

  // Set initial time limit
  useEffect(() => {
    if (assignment) {
      // Check if there is a persistent saved timer for this student and assignment
      const storageKey = `timer-${user?.email}-${assignment.id}`;
      const savedTime = localStorage.getItem(storageKey);
      if (savedTime) {
        setTimeLeft(Number(savedTime));
      } else {
        setTimeLeft(assignment.timeLimit * 60);
      }
    }
  }, [assignment, user]);

  // Track Fullscreen status
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (quizStarted && !isFull) {
        triggerCheatWarning('fullscreen-exit', t(language, 'exam_fullscreen_exit'));
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [quizStarted, language]);

  // Anti-Cheat: Event listeners for blur, copy-paste, contextmenu
  useEffect(() => {
    if (!quizStarted) return;

    // 1. Tab Switch / Window Blur
    const handleBlur = () => {
      triggerCheatWarning('tab-switch', t(language, 'exam_rule1') + ' (Tab blurred)');
    };
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerCheatWarning('tab-switch', t(language, 'exam_rule1') + ' (Tab hidden)');
      }
    };

    // 2. Keyboard shortcut blocks (Ctrl+C, Ctrl+V, F12, Ctrl+Shift+I)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12') {
        e.preventDefault();
        triggerCheatWarning('devtools-open', t(language, 'exam_rule3'));
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        triggerCheatWarning('devtools-open', t(language, 'exam_rule3'));
      }
      if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        triggerCheatWarning('copy-paste', t(language, 'exam_rule2'));
      }
      if (e.ctrlKey && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        triggerCheatWarning('copy-paste', t(language, 'exam_rule2'));
      }
    };

    // 3. Right Click contextmenu block
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      triggerCheatWarning('shortcut', 'Right click context menu is disabled.');
    };

    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [quizStarted, language]);

  // Main Timer loop
  useEffect(() => {
    if (quizStarted && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const nextVal = prev - 1;
          // Save in localStorage to persist refreshes
          if (user && assignment) {
            localStorage.setItem(`timer-${user.email}-${assignment.id}`, nextVal.toString());
          }
          if (nextVal <= 0) {
            clearInterval(timerRef.current!);
            handleAutoSubmit();
          }
          return nextVal;
        });
        totalDurationRef.current += 1;
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizStarted, timeLeft, user, assignment]);

  if (!user) {
    return null;
  }

  if (loadingAssignment) {
    return (
      <div className="min-h-screen bg-[#020205] text-gray-100 flex flex-col justify-center items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <h2 className="text-sm font-semibold text-gray-400">Topshiriq yuklanmoqda... / Loading exam...</h2>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-[#020205] text-gray-100 flex flex-col justify-center items-center">
        <h2 className="text-xl font-bold">Imtihon topilmadi / Exam not found</h2>
        <Link href="/dashboard/student" className="text-purple-400 mt-4 underline">Dashboardga qaytish</Link>
      </div>
    );
  }

  // Request Fullscreen and Start Quiz
  const handleStartQuiz = async () => {
    if (assignment.group) {
      const activeGroup = groupParam || inputGroupCode.trim();
      if (!activeGroup) {
        setGroupCodeError(language === 'uz'
          ? "Guruh kodini kiritish majburiy!"
          : "Group code is required!");
        return;
      }
      if (activeGroup !== assignment.group) {
        setGroupCodeError(language === 'uz'
          ? "Kiritilgan guruh kodi noto'g'ri!"
          : "Incorrect group code!");
        return;
      }
      if (!groupParam) {
        setGroupParam(activeGroup);
      }
    }

    try {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      }
      setIsFullscreen(true);
      setQuizStarted(true);
      setCheatWarnings([]);
      setCheatScore(0);
    } catch (err) {
      console.error('Fullscreen request failed:', err);
      setQuizStarted(true);
    }
  };

  // Log and Warn Cheating attempts
  const triggerCheatWarning = (
    type: 'tab-switch' | 'fullscreen-exit' | 'devtools-open' | 'copy-paste' | 'shortcut', 
    details: string
  ) => {
    setCheatScore((prev) => Math.min(100, prev + 20)); // increase score
    setCheatWarnings((prev) => [...prev, details]);
    setCurrentWarningMsg(details);
    setShowWarningModal(true);

    // Save in Zustand system log
    addCheatingLog({
      studentName: user.name,
      studentEmail: user.email,
      assignmentTitle: assignment.title,
      eventType: type,
      details: details
    });
  };

  // Handle auto submit when time expires
  const handleAutoSubmit = () => {
    alert("Vaqt tugadi! / Time limit exceeded!");
    onSubmitQuiz(true);
  };

  // Submit process (calling AI grader)
  const onSubmitQuiz = async (forceSubmit = false) => {
    if (submitting) return;
    setSubmitting(true);

    if (timerRef.current) clearInterval(timerRef.current);

    // Clear timer from localStorage
    localStorage.removeItem(`timer-${user.email}-${assignment.id}`);

    // Exit Fullscreen mode if currently in it
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error(err));
    }

    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'grade',
          questions: assignment.questions,
          answers: answers,
          topic: assignment.title,
          subject: assignment.description,
          apiKey: geminiKey
        })
      });

      const data = await res.json();
      
      const calculatedScore = data.score !== undefined ? Number(data.score) : 75; // fallback
      const feedback = data.feedback || 'Imtihon topshirildi. Sun\'iy intellekt tahlili muvaffaqiyatli yakunlandi.';

      // Add attempt log
      const newAttempt: QuizAttempt = {
        id: `att-${Date.now()}`,
        assignmentId: assignment.id,
        assignmentTitle: assignment.title,
        studentName: user.name,
        studentEmail: user.email,
        answers: answers,
        score: calculatedScore,
        maxScore: 100,
        aiFeedback: feedback,
        submittedAt: new Date().toISOString(),
        cheatingScore: cheatScore,
        timeSpent: totalDurationRef.current,
        group: groupParam || undefined
      };

      submitAttempt(newAttempt);

      // Award XP points (score * 1.5)
      const earnedXp = Math.round(calculatedScore * 1.5);
      addXp(earnedXp);

      alert(`Test topshirildi!\nScore: ${calculatedScore}%\nXP: +${earnedXp}`);
      router.push('/dashboard/student');

    } catch (err) {
      console.error(err);
      // local fallback on network fail
      const fallbackAttempt: QuizAttempt = {
        id: `att-${Date.now()}`,
        assignmentId: assignment.id,
        assignmentTitle: assignment.title,
        studentName: user.name,
        studentEmail: user.email,
        answers: answers,
        score: 80,
        maxScore: 100,
        aiFeedback: 'Tizim offline / mock rejimda baholadi.',
        submittedAt: new Date().toISOString(),
        cheatingScore: cheatScore,
        timeSpent: totalDurationRef.current,
        group: groupParam || undefined
      };
      submitAttempt(fallbackAttempt);
      addXp(120);
      router.push('/dashboard/student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectAnswer = (qId: string, value: string) => {
    setAnswers({ ...answers, [qId]: value });
  };

  return (
    <div className="relative min-h-screen bg-[#020205] text-[var(--text-primary)] flex flex-col justify-between no-select transition-colors duration-300">
      
      {/* Quiz Startup Overlay */}
      {!quizStarted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020205] px-4">
          <div className="w-full max-w-xl glass-panel p-8 rounded-3xl border border-[var(--card-border)] flex flex-col items-center gap-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Lock className="w-8 h-8 text-pink-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[var(--text-primary)]">{assignment.title}</h2>
              <p className="text-xs text-[var(--text-secondary)] mt-2 max-w-sm leading-relaxed">
                Ushbu imtihon xavfsiz proktoring ostida o'tkaziladi. Boshlash tugmasini bosganingizda to'liq ekran rejimi faollashadi.
              </p>
            </div>

            {/* Group Code requirement if not matching */}
            {assignment.group && groupParam !== assignment.group && (
              <div className="w-full flex flex-col gap-2 text-left">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  {language === 'uz' ? "Ushbu imtihon guruh uchun mo'ljallangan. Guruh kodini kiriting:" : "This exam is restricted to a group. Enter group code:"}
                </label>
                <input 
                  type="text"
                  placeholder="Format: XXX-XXX (masalan: 101-102)"
                  value={inputGroupCode}
                  onChange={e => { setInputGroupCode(e.target.value); setGroupCodeError(null); }}
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-purple-500 focus:outline-none rounded-xl px-4 py-3 text-xs text-[var(--text-primary)]"
                />
                {groupCodeError && (
                  <p className="text-xs text-rose-400 font-semibold">{groupCodeError}</p>
                )}
              </div>
            )}

            {/* Anti-cheat reminders */}
            <div className="w-full bg-rose-950/20 border border-rose-900/20 p-4 rounded-2xl text-left flex flex-col gap-2">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> {t(language, 'exam_rules')}:
              </span>
              <ul className="list-disc list-inside text-[11px] text-gray-400 space-y-1">
                <li>{t(language, 'exam_rule1')}</li>
                <li>{t(language, 'exam_rule2')}</li>
                <li>{t(language, 'exam_rule3')}</li>
                <li>{t(language, 'exam_rule4')}</li>
              </ul>
            </div>

            <button
              onClick={handleStartQuiz}
              className="glow-btn bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold py-4 px-8 rounded-2xl shadow-lg shadow-purple-500/20 flex items-center gap-2 cursor-pointer text-sm w-full justify-center"
            >
              <Maximize className="w-4 h-4" /> {t(language, 'exam_start_title')}
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen check block */}
      {quizStarted && !isFullscreen && (
        <div className="fixed inset-0 z-40 bg-black/95 backdrop-blur-md flex items-center justify-center px-4">
          <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-rose-500/20 text-center flex flex-col items-center gap-5">
            <AlertTriangle className="w-12 h-12 text-rose-500 animate-bounce" />
            <div>
              <h3 className="text-lg font-bold text-white">{t(language, 'exam_fullscreen_exit')}</h3>
              <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                Davom etish va testni topshirish uchun to'liq ekran rejimini qayta faollashtiring.
              </p>
            </div>
            <button
              onClick={handleStartQuiz}
              className="glow-btn bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-6 rounded-xl text-xs w-full cursor-pointer"
            >
              {t(language, 'exam_rejoin')}
            </button>
          </div>
        </div>
      )}

      {/* Header bar during Quiz */}
      <header className="sticky top-0 z-30 glass-panel border-b border-[var(--card-border)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-sm text-[var(--text-primary)] hidden sm:block">{assignment.title}</span>
        </div>

        {/* Timer countdown */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-purple-950/40 border border-purple-800/30 px-3.5 py-1.5 rounded-xl text-purple-300">
            <Clock className="w-4 h-4 animate-pulse text-pink-500" />
            <span className="font-mono text-sm font-black">
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-rose-950/30 border border-rose-900/30 px-3 py-1.5 rounded-xl text-rose-400 text-xs font-bold">
            <ShieldAlert className="w-4 h-4" /> Anti-Cheat Index: {cheatScore}%
          </div>
        </div>
      </header>

      {/* Main quiz interface */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-10 flex flex-col gap-8 relative z-10">
        
        {/* Questions list */}
        <div className="flex flex-col gap-8">
          {assignment.questions.map((question, index) => {
            const currentVal = answers[question.id] || '';

            return (
              <div 
                key={question.id} 
                className="glass-panel p-6 md:p-8 rounded-3xl border border-[var(--card-border)] flex flex-col gap-4"
              >
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-600/10 border border-purple-500/25 flex items-center justify-center text-xs font-bold text-purple-400">
                    {index + 1}
                  </span>
                  <h3 className="text-sm md:text-base font-bold text-[var(--text-primary)] leading-relaxed mt-0.5">
                    <MathText text={question.text} />
                  </h3>
                </div>

                {/* Multiple choice options */}
                {question.type === 'multiple-choice' && question.options && (
                  <div className="grid grid-cols-1 gap-3 mt-2 pl-0 md:pl-10">
                    {question.options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleSelectAnswer(question.id, option)}
                        className={`w-full text-left px-5 py-3.5 rounded-2xl border text-xs font-semibold transition-all duration-300 cursor-pointer ${
                          currentVal === option
                            ? 'bg-purple-600/15 border-purple-500 text-[var(--text-primary)] shadow-md shadow-purple-500/5'
                            : 'bg-gray-950/20 border-gray-900 text-gray-400 hover:bg-gray-900/30 hover:border-gray-800'
                        }`}
                      >
                        <MathText text={option} />
                      </button>
                    ))}
                  </div>
                )}

                {/* Free Text Answers */}
                {question.type === 'text' && (
                  <div className="mt-2 pl-0 md:pl-10">
                    <textarea
                      placeholder="Javobingizni batafsil matn ko'rinishida yozing..."
                      value={currentVal}
                      onChange={(e) => handleSelectAnswer(question.id, e.target.value)}
                      rows={5}
                      className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-purple-500 focus:outline-none rounded-2xl p-4 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] resize-none leading-relaxed"
                    />
                  </div>
                )}

                {/* Programming code task input */}
                {question.type === 'code' && (
                  <div className="mt-2 pl-0 md:pl-10 flex flex-col gap-2">
                    <div className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
                      <div className="bg-gray-900/50 px-4 py-2 text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider border-b border-[var(--card-border)]">
                        Dasturlash Kodingiz
                      </div>
                      <textarea
                        placeholder={`// Kod yozing... \ndef solution():\n    pass`}
                        value={currentVal}
                        onChange={(e) => handleSelectAnswer(question.id, e.target.value)}
                        rows={8}
                        className="w-full bg-[#020205]/80 font-mono text-xs p-4 focus:outline-none text-emerald-400 placeholder-gray-800 resize-none leading-relaxed"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit action block */}
        <div className="flex justify-end pt-4">
          <button
            onClick={() => onSubmitQuiz(false)}
            disabled={submitting}
            className="glow-btn bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-black text-sm px-8 py-4 rounded-2xl shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all w-full md:w-auto"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> {t(language, 'exam_submitting')}
              </>
            ) : (
              <>
                {t(language, 'exam_submit')} <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </main>

      {/* Cheating Warning Modal popup during test */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80">
          <div className="w-full max-w-sm glass-panel p-6 rounded-3xl border border-rose-500/35 text-center flex flex-col items-center gap-4 animate-bounce">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">{t(language, 'exam_warning_title')}</h4>
              <p className="text-xs text-rose-300 font-semibold mt-2">{currentWarningMsg}</p>
              <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                Barcha hodisalar qayd qilinmoqda. Qoidabuzarlik davom etsa, imtihon avtomatik to'xtatilishi mumkin.
              </p>
            </div>
            <button
              onClick={() => setShowWarningModal(false)}
              className="bg-rose-950/50 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 font-bold py-2.5 px-6 rounded-xl text-xs cursor-pointer w-full"
            >
              {t(language, 'exam_understood')}
            </button>
          </div>
        </div>
      )}

      {/* Footer during Quiz */}
      <footer className="py-6 px-6 text-center text-[10px] text-gray-700 bg-black/20 border-t border-purple-500/[0.02]">
        DangasaAI Secure Proctoring Engine &bull; Anti-Cheat Enabled
      </footer>

    </div>
  );
}
