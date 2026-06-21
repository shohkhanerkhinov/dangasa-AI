'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import { t } from '@/locales/translations';
import MathText from '@/components/MathText';
import { 
  Brain, 
  BookOpen, 
  Trophy, 
  Zap, 
  Clock, 
  Award, 
  MessageSquare, 
  Key, 
  LogOut, 
  ChevronRight, 
  ShieldAlert,
  ClipboardCheck,
  CheckCircle,
  Search,
  Sun,
  Moon,
  Globe,
  X
} from 'lucide-react';

export default function StudentDashboard() {
  const router = useRouter();
  const { 
    user, 
    geminiKey, 
    setGeminiKey, 
    assignments, 
    attempts, 
    unlockedAssignmentIds, 
    unlockAssignment, 
    language, 
    setLanguage, 
    theme, 
    setTheme, 
    logout,
    updateProfile,
    fetchAssignments,
    fetchAttempts
  } = useAppStore();

  const [keyInput, setKeyInput] = useState('');
  const [showKeySaved, setShowKeySaved] = useState(false);
  const [selectedAttemptFeedback, setSelectedAttemptFeedback] = useState<string | null>(null);
  const [selectedAttemptTitle, setSelectedAttemptTitle] = useState<string | null>(null);

  // Profile settings states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileLevel, setProfileLevel] = useState<'school' | 'college' | 'university'>('university');
  const [profileImg, setProfileImg] = useState('');
  const [seedInput, setSeedInput] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const openProfileModal = () => {
    if (user) {
      setProfileName(user.name);
      setProfileLevel(user.level);
      setProfileImg(user.profileImage || '');
      const match = (user.profileImage || '').match(/seed=([^&]+)/);
      setSeedInput(match ? decodeURIComponent(match[1]) : 'student');
      setShowProfileModal(true);
    }
  };

  const handleSeedChange = (val: string) => {
    setSeedInput(val);
    if (val.trim()) {
      setProfileImg(`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(val.trim())}`);
    }
  };

  const handleSaveProfile = async () => {
    if (!profileName.trim()) {
      alert(language === 'uz' ? "Ism-sharifingizni kiriting!" : "Enter your name!");
      return;
    }
    setUpdatingProfile(true);
    const result = await updateProfile(profileName.trim(), profileLevel, profileImg);
    setUpdatingProfile(false);
    if (result.success) {
      setShowProfileModal(false);
      alert(language === 'uz' ? "Profil sozlamalari saqlandi!" : "Profile settings saved!");
    } else {
      alert(result.error || (language === 'uz' ? "Xatolik yuz berdi!" : "An error occurred!"));
    }
  };
  
  // Find Assignment State
  const [findInput, setFindInput] = useState('');
  const [findGroupInput, setFindGroupInput] = useState('');
  const [findError, setFindError] = useState(false);
  const [findGroupError, setFindGroupError] = useState<string | null>(null);

  // Redirect to login if user not logged in
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(theme);
    }
  }, [theme]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else if (user.role !== 'student') {
      router.push('/dashboard/teacher');
    } else {
      fetchAssignments();
      fetchAttempts();
    }
  }, [user, router, fetchAssignments, fetchAttempts]);

  useEffect(() => {
    if (geminiKey) {
      setKeyInput(geminiKey);
    }
  }, [geminiKey]);

  if (!user) return null;

  // Calculate stats
  const studentAttempts = attempts.filter(a => a.studentEmail === user.email);
  const averageScore = studentAttempts.length > 0 
    ? Math.round(studentAttempts.reduce((acc, curr) => acc + (curr.score || 0), 0) / studentAttempts.length)
    : 0;
  
  // XP Progress Calculation (every 100 XP is a level)
  const currentXpInLevel = user.xp % 100;
  const xpNeededForNext = 100 - currentXpInLevel;
  const progressPercent = Math.min(100, Math.max(0, currentXpInLevel));

  // Filter assignments to ONLY show unlocked ones (Assignment Visibility Fix)
  const visibleAssignments = assignments.filter(a => 
    unlockedAssignmentIds.includes(a.id)
  );

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    setGeminiKey(keyInput.trim());
    setShowKeySaved(true);
    setTimeout(() => setShowKeySaved(false), 3000);
  };

  const handleFindAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    setFindError(false);
    setFindGroupError(null);
    if (!findInput.trim()) return;

    // Parse ID from URL if they pasted the full link
    let searchedId = findInput.trim();
    if (searchedId.includes('/exam/')) {
      const parts = searchedId.split('/exam/');
      searchedId = parts[parts.length - 1].split('?')[0]; // strip query params if any
    }

    const found = assignments.find(a => a.id === searchedId);
    if (found) {
      if (found.group) {
        if (!findGroupInput.trim()) {
          setFindGroupError(language === 'uz' 
            ? "Ushbu imtihon guruhga tegishli! Iltimos, guruh kodini kiriting." 
            : "This exam is restricted to a group! Please enter the group code.");
          return;
        }
        if (findGroupInput.trim() !== found.group) {
          setFindGroupError(language === 'uz' 
            ? "Kiritilgan guruh kodi noto'g'ri yoki ushbu imtihonga mos kelmadi!" 
            : "The group code entered is incorrect or does not match this exam!");
          return;
        }
      }

      unlockAssignment(found.id);
      const groupParam = findGroupInput.trim() ? `?group=${encodeURIComponent(findGroupInput.trim())}` : '';
      setFindInput('');
      setFindGroupInput('');
      router.push(`/exam/${found.id}${groupParam}`);
    } else {
      setFindError(true);
      setTimeout(() => setFindError(false), 4000);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#020205] text-[var(--text-primary)] flex flex-col justify-between transition-colors duration-300">
      
      {/* Background radial effects */}
      <div className="absolute top-[10%] right-[5%] w-[40%] h-[40%] rounded-full bg-purple-900/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[10%] left-[5%] w-[40%] h-[40%] rounded-full bg-pink-900/5 blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-[var(--card-border)] px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-lg bg-gradient-to-r from-white via-purple-200 to-pink-400 bg-clip-text text-transparent">
              Dangasa
            </span>
            <span className="font-black text-lg text-pink-500">AI</span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          {/* Language Switcher */}
          <div className="flex rounded-xl overflow-hidden border border-[var(--card-border)] text-[10px] font-bold">
            {(['uz', 'ru', 'en'] as const).map(l => (
              <button key={l} onClick={() => setLanguage(l)}
                className={`px-2.5 py-1.5 uppercase transition-all cursor-pointer ${language === l ? 'bg-purple-600 text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
                {l}
              </button>
            ))}
          </div>

          {/* Theme Toggle */}
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl glass-panel border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Profile Info */}
          <button 
            onClick={openProfileModal}
            className="flex items-center gap-3 hover:opacity-80 transition-all cursor-pointer border-none bg-transparent outline-none p-0 text-left"
            title={language === 'uz' ? "Profil sozlamalari" : "Profile Settings"}
          >
            <img 
              src={user.profileImage} 
              alt="avatar" 
              className="w-9 h-9 rounded-xl border border-[var(--card-border)] bg-purple-950/20"
            />
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-[var(--text-primary)]">{user.name}</div>
              <div className="text-[10px] text-[var(--text-secondary)] capitalize">{t(language, `auth_level_${user.level}` as any)}</div>
            </div>
          </button>
          <button 
            onClick={() => {
              logout();
              router.push('/');
            }}
            className="p-2.5 rounded-xl border border-[var(--card-border)] glass-panel hover:bg-rose-950/20 hover:border-rose-900/30 text-rose-400 hover:text-rose-300 transition-all cursor-pointer"
            title={t(language, 'nav_logout')}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Panel */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        
        {/* Left Column (Stats and Quizzes) */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* XP & Level Panel */}
          <div className="glass-panel p-6 rounded-3xl border border-[var(--card-border)] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">Sizning Progressingiz</h2>
                  <p className="text-xs text-[var(--text-secondary)]">Vazifalarni bajarib XP oling!</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-purple-400">{user.levelNumber}</span>
                <span className="text-xs text-[var(--text-secondary)] font-bold ml-1">{t(language, 'student_level').toUpperCase()}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-semibold text-[var(--text-secondary)]">
                <span>{user.xp} XP ({t(language, 'student_xp')})</span>
                <span>Keyingi darajaga: {xpNeededForNext} XP</span>
              </div>
              <div className="w-full h-3 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-full overflow-hidden p-[2px]">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mt-2">
              <div className="bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl p-4 text-center">
                <div className="text-xs text-[var(--text-secondary)] font-medium">{t(language, 'student_completed')}</div>
                <div className="text-xl font-bold text-purple-400 mt-1">{studentAttempts.length} ta</div>
              </div>
              <div className="bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl p-4 text-center">
                <div className="text-xs text-[var(--text-secondary)] font-medium">{t(language, 'student_avg_score')}</div>
                <div className="text-xl font-bold text-pink-400 mt-1">{averageScore}%</div>
              </div>
              <div className="bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl p-4 text-center">
                <div className="text-xs text-[var(--text-secondary)] font-medium">Bosqich</div>
                <div className="text-sm font-bold text-emerald-400 mt-2 truncate capitalize">{t(language, `auth_level_${user.level}` as any)}</div>
              </div>
            </div>
          </div>

          {/* Find Assignment Finder Widget (Visibility Fix) */}
          <div className="glass-panel p-6 rounded-3xl border border-[var(--card-border)] flex flex-col gap-4">
            <h3 className="text-sm font-black text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-wide">
              <Search className="w-4 h-4 text-purple-400" />
              {t(language, 'student_find_title')}
            </h3>
            <form onSubmit={handleFindAssignment} className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text" 
                placeholder={t(language, 'student_find_placeholder')}
                value={findInput}
                onChange={(e) => { setFindInput(e.target.value); setFindError(false); }}
                className="flex-1 bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-purple-500 focus:outline-none rounded-xl px-4 py-3 text-xs text-[var(--text-primary)]"
              />
              <input 
                type="text" 
                placeholder={language === 'uz' ? "Guruh kodi (ixtiyoriy, masalan: 101-102)" : "Group code (optional, e.g., 101-102)"}
                value={findGroupInput}
                onChange={(e) => { setFindGroupInput(e.target.value); setFindGroupError(null); }}
                className="w-full sm:w-64 bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-purple-500 focus:outline-none rounded-xl px-4 py-3 text-xs text-[var(--text-primary)]"
              />
              <button 
                type="submit"
                className="glow-btn bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-6 rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1 flex-shrink-0"
              >
                {t(language, 'student_find_btn')}
              </button>
            </form>
            {findError && (
              <p className="text-xs text-rose-400 font-semibold">{t(language, 'student_find_error')}</p>
            )}
            {findGroupError && (
              <p className="text-xs text-rose-400 font-semibold">{findGroupError}</p>
            )}
          </div>

          {/* Active Assignments List */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-extrabold text-[var(--text-primary)] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-400" /> {t(language, 'student_active_exams')}
            </h3>

            <div className="flex flex-col gap-4">
              {visibleAssignments.map((assignment) => {
                const isCompleted = studentAttempts.some(a => a.assignmentId === assignment.id);
                
                return (
                  <div 
                    key={assignment.id} 
                    className={`glass-panel p-6 rounded-3xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-300 ${
                      isCompleted 
                        ? 'border-gray-800/40 opacity-75' 
                        : 'border-[var(--card-border)] hover:border-purple-500/35 shadow-md shadow-purple-500/[0.02]'
                    }`}
                  >
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-[var(--text-primary)]">{assignment.title}</h4>
                        {isCompleted && (
                          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> {t(language, 'student_completed_tag')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">{assignment.description}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-[10px] text-[var(--text-secondary)] font-semibold mt-1">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {assignment.timeLimit} daqiqa</span>
                        <span className="flex items-center gap-1"><ClipboardCheck className="w-3.5 h-3.5" /> {assignment.questions.length} ta savol</span>
                        <span className="text-pink-500/80">O'qituvchi: {assignment.creator}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                      {isCompleted ? (
                        <button
                          disabled
                          className="w-full md:w-auto px-5 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--text-secondary)] font-semibold text-sm cursor-not-allowed"
                        >
                          {t(language, 'student_completed_tag')}
                        </button>
                      ) : (
                        <Link
                          href={`/exam/${assignment.id}${assignment.group ? `?group=${encodeURIComponent(assignment.group)}` : ''}`}
                          className="w-full md:w-auto text-center glow-btn bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          {t(language, 'student_start_exam')} <ChevronRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}

              {visibleAssignments.length === 0 && (
                <div className="glass-panel p-8 text-center text-[var(--text-secondary)] rounded-3xl text-sm leading-relaxed">
                  {t(language, 'student_no_exams')}
                </div>
              )}
            </div>
          </div>

          {/* Test Submission History */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-extrabold text-[var(--text-primary)] flex items-center gap-2">
              <Award className="w-5 h-5 text-pink-400" /> {t(language, 'student_history')}
            </h3>

            <div className="flex flex-col gap-4">
              {studentAttempts.map((attempt) => (
                <div 
                  key={attempt.id} 
                  className="glass-panel p-5 rounded-3xl border border-[var(--card-border)] flex flex-col gap-4"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text-primary)]">{attempt.assignmentTitle}</h4>
                      <p className="text-[10px] text-[var(--text-secondary)] font-semibold mt-1">Sana: {new Date(attempt.submittedAt).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2 text-right">
                      <div className="text-xs text-[var(--text-secondary)] font-medium">Natija:</div>
                      <div className={`text-lg font-black ${
                        (attempt.score || 0) >= 80 ? 'text-emerald-400' : (attempt.score || 0) >= 50 ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {attempt.score !== undefined ? `${attempt.score}%` : 'Baholanmoqda...'}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-between items-center gap-4 pt-3 border-t border-[var(--card-border)] text-xs text-[var(--text-secondary)]">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Sarflangan vaqt: {Math.floor(attempt.timeSpent / 60)}m {attempt.timeSpent % 60}s
                    </span>

                    <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${
                      attempt.cheatingScore > 30 
                        ? 'bg-rose-950/40 border-rose-800/30 text-rose-400' 
                        : 'bg-emerald-950/40 border-emerald-800/30 text-emerald-400'
                    }`}>
                      <ShieldAlert className="w-3.5 h-3.5" /> Anti-Cheat: {attempt.cheatingScore}% {attempt.cheatingScore > 30 ? '(Shubhali)' : '(Toza)'}
                    </span>

                    {attempt.aiFeedback && (
                      <button
                        onClick={() => {
                          setSelectedAttemptFeedback(attempt.aiFeedback || '');
                          setSelectedAttemptTitle(attempt.assignmentTitle);
                        }}
                        className="text-xs text-purple-400 hover:text-purple-300 underline font-semibold cursor-pointer"
                      >
                        AI Taqrizini O'qish
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {studentAttempts.length === 0 && (
                <div className="glass-panel p-8 text-center text-[var(--text-secondary)] rounded-3xl text-sm">
                  Siz hali birorta ham test topshirmadingiz.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column (Settings and AI Tutoring Links) */}
        <div className="flex flex-col gap-8">
          
          {/* Quick AI Tutoring Widget */}
          <div className="glass-panel p-6 rounded-3xl border border-[var(--card-border)] bg-gradient-to-br from-purple-950/20 to-black/40 flex flex-col gap-4 relative overflow-hidden group">
            <div className="absolute top-[-20%] right-[-20%] w-32 h-32 bg-purple-600/10 rounded-full blur-2xl pointer-events-none group-hover:scale-120 transition-all duration-300"></div>
            
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">{t(language, 'student_ai_tutor')}</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed text-glow">
                Sizning darajangizga ({t(language, `auth_level_${user.level}` as any)}) moslashtirilgan aqlli mentor bilan suhbatlashing.
              </p>
            </div>

            <Link
              href="/chat"
              className="glow-btn bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm py-3.5 rounded-2xl text-center flex items-center justify-center gap-1.5 transition-all duration-300 shadow-md shadow-purple-500/10 mt-2 cursor-pointer"
            >
              Suhbatni boshlash <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Gemini API Key Configuration */}
          <div className="glass-panel p-6 rounded-3xl border border-[var(--card-border)] flex flex-col gap-4">
            <div className="flex items-center gap-2 text-[var(--text-primary)]">
              <Key className="w-5 h-5 text-pink-400" />
              <h3 className="text-base font-bold">{t(language, 'student_api_key')}</h3>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Platforma AI imkoniyatlarini faollashtirish uchun o'z Google Gemini API kalitingizni kiriting. Kalit faqat brauzeringizda saqlanadi.
            </p>

            <form onSubmit={handleSaveKey} className="flex flex-col gap-3">
              <input 
                type="password" 
                placeholder="AIzaSy..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-purple-500 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-[var(--text-primary)]"
              />
              <button
                type="submit"
                className="bg-purple-600/10 border border-purple-500/20 hover:bg-purple-600/20 text-[var(--text-primary)] font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                {t(language, 'save')}
              </button>
            </form>
            
            {showKeySaved && (
              <span className="text-[10px] text-center text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-lg">
                Kalit muvaffaqiyatli saqlandi!
              </span>
            )}

            <div className="text-[10px] text-[var(--text-secondary)] text-center leading-relaxed mt-1">
              API kaliti yo'qmi? Uni tekinga{" "}
              <a 
                href="https://aistudio.google.com/" 
                target="_blank" 
                rel="noreferrer" 
                className="text-purple-400 underline hover:text-purple-300 font-bold"
              >
                Google AI Studio
              </a>{" "}
              dan oling.
            </div>
          </div>

          {/* System notification */}
          <div className="glass-panel p-6 rounded-3xl border border-[var(--card-border)] flex flex-col gap-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> {t(language, 'student_notifications')}
            </h3>
            <div className="flex flex-col gap-3 text-xs">
              <div className="p-3 bg-purple-950/10 border border-[var(--card-border)] rounded-xl leading-relaxed text-[var(--text-secondary)]">
                <span className="font-semibold text-purple-400 block mb-1">Xush kelibsiz!</span>
                DangasaAI platformasida birinchi imtihoningizni topshiring va 1-darajadan yuqorilang!
              </div>
              <div className="p-3 bg-purple-950/10 border border-[var(--card-border)] rounded-xl leading-relaxed text-[var(--text-secondary)]">
                <span className="font-semibold text-pink-400 block mb-1">Muhim Maslahat</span>
                Imtihon topshirish vaqtida sahifadan boshqa oynalarga o'tmang, aks holda tizim buni aldash harakati sifatida baholaydi!
              </div>
            </div>
          </div>

        </div>

      </main>

      {/* AI Feedback Modal */}
      {selectedAttemptFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl glass-panel p-6 md:p-8 rounded-3xl border border-[var(--card-border)] max-h-[85vh] overflow-y-auto flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-black text-[var(--text-primary)]">AI Shaxsiy Taqrizi</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">{selectedAttemptTitle}</p>
              </div>
              <button 
                onClick={() => {
                  setSelectedAttemptFeedback(null);
                  setSelectedAttemptTitle(null);
                }}
                className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer font-bold text-xs"
              >
                {t(language, 'close')}
              </button>
            </div>
            
            <div className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-line p-4 rounded-2xl bg-purple-950/20 border border-[var(--card-border)] font-mono text-xs">
              <MathText text={selectedAttemptFeedback} />
            </div>

            <div className="flex justify-end mt-2">
              <button
                onClick={() => {
                  setSelectedAttemptFeedback(null);
                  setSelectedAttemptTitle(null);
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                {t(language, 'close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Profile Settings Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-panel p-6 md:p-8 rounded-3xl border border-[var(--card-border)] max-h-[85vh] overflow-y-auto flex flex-col gap-6 relative">
            {/* Close Button */}
            <button 
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-white/10 text-[var(--text-secondary)] hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Title */}
            <div>
              <h3 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400" />
                {language === 'uz' ? "Profil Sozlamalari" : "Profile Settings"}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                {language === 'uz' ? "Shaxsiy ma'lumotlaringizni yangilang" : "Update your personal details"}
              </p>
            </div>

            {/* Profile Info Summary (XP and stats) */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-purple-950/20 border border-[var(--card-border)]">
              <img 
                src={profileImg} 
                alt="avatar preview" 
                className="w-16 h-16 rounded-2xl border border-purple-500/30 bg-purple-950/40 flex-shrink-0"
              />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[var(--text-secondary)]">Sizning statusingiz</div>
                <div className="text-sm font-black text-purple-300 mt-0.5">{user.name}</div>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-[var(--text-secondary)] font-bold">
                  <span className="bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/20">{user.levelNumber}-daraja</span>
                  <span>•</span>
                  <span>{user.xp} XP</span>
                </div>
              </div>
            </div>

            {/* Edit Form */}
            <div className="flex flex-col gap-4">
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">
                  {language === 'uz' ? "To'liq ism-sharif" : "Full Name"}
                </label>
                <input 
                  type="text"
                  value={profileName}
                  onChange={e => setProfileName(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-purple-500 focus:outline-none rounded-xl px-4 py-3 text-xs text-[var(--text-primary)]"
                />
              </div>

              {/* Email (Read only) */}
              <div className="flex flex-col gap-1.5 opacity-60">
                <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">
                  Elektron pochta (O'zgartirib bo'lmaydi)
                </label>
                <input 
                  type="text"
                  value={user.email}
                  disabled
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-4 py-3 text-xs text-[var(--text-secondary)] cursor-not-allowed"
                />
              </div>

              {/* Education Level */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">
                  {language === 'uz' ? "O'qish bosqichi" : "Education Level"}
                </label>
                <select 
                  value={profileLevel}
                  onChange={e => setProfileLevel(e.target.value as any)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-purple-500 focus:outline-none rounded-xl px-4 py-3 text-xs text-[var(--text-primary)] cursor-pointer"
                >
                  <option value="school">{language === 'uz' ? "Maktab" : "School"}</option>
                  <option value="college">{language === 'uz' ? "Kollej" : "College"}</option>
                  <option value="university">{language === 'uz' ? "Universitet" : "University"}</option>
                </select>
              </div>

              {/* Profile image avatar seed */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">
                  {language === 'uz' ? "Avatar kalit so'zi (Dicebear Bottts)" : "Avatar keyword (Dicebear Bottts)"}
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={seedInput}
                    onChange={e => handleSeedChange(e.target.value)}
                    placeholder="student, robot, space..."
                    className="flex-1 bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-purple-500 focus:outline-none rounded-xl px-4 py-3 text-xs text-[var(--text-primary)]"
                  />
                  <button 
                    onClick={() => handleSeedChange(Math.random().toString(36).substring(7))}
                    className="px-4 py-2 border border-purple-500/20 hover:border-purple-500 text-purple-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex-shrink-0"
                  >
                    Tasodifiy
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-[var(--card-border)]/50">
              <button 
                onClick={() => setShowProfileModal(false)}
                className="px-5 py-2.5 rounded-xl border border-[var(--card-border)] text-xs font-bold text-[var(--text-secondary)] hover:text-white transition-all cursor-pointer"
              >
                {t(language, 'close')}
              </button>
              <button 
                onClick={handleSaveProfile}
                disabled={updatingProfile}
                className="bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-purple-500/10"
              >
                {updatingProfile ? 'Saqlanmoqda...' : t(language, 'save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-900 bg-black/40 py-6 px-6 text-center text-xs text-gray-600">
        <p>&copy; {new Date().getFullYear()} DangasaAI Platformasi &bull; Panel</p>
      </footer>

    </div>
  );
}
