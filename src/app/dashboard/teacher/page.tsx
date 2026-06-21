'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import { t } from '@/locales/translations';
import MathText from '@/components/MathText';
import {
  Brain, Plus, Copy, Check, BarChart3, Shield, Upload, FileText,
  Trash2, Eye, Sun, Moon, LogOut, Globe, Loader2, CheckCircle2,
  AlertTriangle, Users, ClipboardList, X, ChevronDown, Pencil
} from 'lucide-react';

type TabType = 'create' | 'results' | 'cheats' | 'upload';

export default function TeacherDashboard() {
  const router = useRouter();
  const {
    user, assignments, attempts, cheatingLogs, geminiKey,
    addAssignment, updateAssignment, deleteAssignment, setGeminiKey, language, theme, setTheme, setLanguage, logout,
    fetchAssignments, fetchAttempts, fetchCheatingLogs, updateProfile
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<TabType>('create');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Quiz builder state
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDesc, setQuizDesc] = useState('');
  const [quizTopic, setQuizTopic] = useState('');
  const [quizSubject, setQuizSubject] = useState('');
  const [quizDifficulty, setQuizDifficulty] = useState('medium');
  const [quizTime, setQuizTime] = useState(30);
  const [quizCount, setQuizCount] = useState(5);
  const [quizGroup, setQuizGroup] = useState(''); // Group code: XXX-XXX
  const [generating, setGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState(geminiKey);
  const [saveKeyMsg, setSaveKeyMsg] = useState(false);
  const [fileGroup, setFileGroup] = useState(''); // File upload group code: XXX-XXX
  const [filterGroup, setFilterGroup] = useState('all'); // Results group filter

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [fileAnalyzing, setFileAnalyzing] = useState(false);
  const [fileQuestions, setFileQuestions] = useState<any[]>([]);
  const [detectedTopic, setDetectedTopic] = useState('');
  const [filePublishSuccess, setFilePublishSuccess] = useState<string | null>(null);

  // Edit Assignment states
  const [editingQuiz, setEditingQuiz] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editTime, setEditTime] = useState(30);
  const [editGroup, setEditGroup] = useState(''); // Edit group code: XXX-XXX
  const [editQuestions, setEditQuestions] = useState<any[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);

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
      setSeedInput(match ? decodeURIComponent(match[1]) : 'teacher');
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

  // New question form state in edit modal
  const [newQText, setNewQText] = useState('');
  const [newQType, setNewQType] = useState<'multiple-choice' | 'text' | 'code' | 'math'>('multiple-choice');
  const [newQOpts, setNewQOpts] = useState<string[]>(['', '', '', '']);
  const [newQCorrect, setNewQCorrect] = useState('');

  const validateGroupCode = (code: string): boolean => {
    if (!code.trim()) return true;
    const trimmed = code.trim();
    const match = trimmed.match(/^(\d{3})-(\d{3})$/);
    if (!match) {
      alert(language === 'uz' 
        ? "Guruh kodi xato! Format: XXX-XXX bo'lishi kerak (masalan: 101-102)" 
        : "Invalid group code! Must be in XXX-XXX format (e.g., 101-102)");
      return false;
    }
    const num1 = parseInt(match[1], 10);
    const num2 = parseInt(match[2], 10);
    if (num1 < 1 || num1 > 999 || num2 < 1 || num2 > 999) {
      alert(language === 'uz' 
        ? "Guruh kodidagi sonlar 001 dan 999 oralig'ida bo'lishi va 000 bo'lmasligi kerak!" 
        : "Numbers in group code must be between 001 and 999, and cannot be 000!");
      return false;
    }
    return true;
  };

  const openEditModal = (assignment: any) => {
    setEditingQuiz(assignment);
    setEditTitle(assignment.title);
    setEditDesc(assignment.description || '');
    setEditTime(assignment.timeLimit);
    setEditGroup(assignment.group || '');
    setEditQuestions([...assignment.questions]);
    setNewQText('');
    setNewQType('multiple-choice');
    setNewQOpts(['', '', '', '']);
    setNewQCorrect('');
    setShowEditModal(true);
  };

  const handleAddQuestionToEdit = () => {
    if (!newQText.trim()) {
      alert(language === 'uz' ? "Savol matnini kiriting!" : "Enter question text!");
      return;
    }

    const newQuestion: any = {
      id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      text: newQText,
      type: newQType,
    };

    if (newQType === 'multiple-choice') {
      const filteredOpts = newQOpts.filter(o => o.trim() !== '');
      if (filteredOpts.length < 2) {
        alert(language === 'uz' ? "Kamida 2 ta variant bo'lishi kerak!" : "Must have at least 2 options!");
        return;
      }
      if (!newQCorrect.trim()) {
        alert(language === 'uz' ? "To'g'ri javobni tanlang!" : "Select the correct answer!");
        return;
      }
      newQuestion.options = newQOpts;
      newQuestion.correctAnswer = newQCorrect;
    } else {
      if (!newQCorrect.trim()) {
        alert(language === 'uz' ? "To'g'ri javobni kiriting!" : "Enter the correct answer!");
        return;
      }
      newQuestion.correctAnswer = newQCorrect;
    }

    setEditQuestions(prev => [...prev, newQuestion]);
    setNewQText('');
    setNewQOpts(['', '', '', '']);
    setNewQCorrect('');
  };

  const handleRemoveQuestionFromEdit = (qId: string) => {
    setEditQuestions(prev => prev.filter(q => q.id !== qId));
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      alert(language === 'uz' ? "Sarlavha bo'sh bo'lishi mumkin emas!" : "Title cannot be empty!");
      return;
    }
    if (editQuestions.length === 0) {
      alert(language === 'uz' ? "Imtihonda kamida 1 ta savol bo'lishi kerak!" : "Exam must have at least 1 question!");
      return;
    }
    if (editGroup.trim() && !validateGroupCode(editGroup)) return;

    await updateAssignment(editingQuiz.id, {
      ...editingQuiz,
      title: editTitle,
      description: editDesc,
      timeLimit: Number(editTime),
      questions: editQuestions,
      group: editGroup.trim() || undefined,
    });

    setShowEditModal(false);
    setEditingQuiz(null);
  };

  const handleDeleteAssignment = async (id: string) => {
    const confirmMsg = language === 'uz'
      ? "Rostdan ham ushbu topshiriqni o'chirib yubormoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi."
      : (language === 'ru'
        ? "Вы действительно хотите удалить это задание? Это действие нельзя отменить."
        : "Are you sure you want to delete this assignment? This action cannot be undone.");
    if (confirm(confirmMsg)) {
      await deleteAssignment(id);
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(theme);
    }
  }, [theme]);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'teacher') {
      router.push('/dashboard/student');
    } else {
      fetchAssignments();
      fetchAttempts();
      fetchCheatingLogs();
    }
  }, [user, router, fetchAssignments, fetchAttempts, fetchCheatingLogs]);

  const myAssignments = assignments.filter(a => a.creator === user?.email);
  const myAttempts = attempts.filter(at =>
    myAssignments.some(a => a.id === at.assignmentId)
  );
  const myCheats = cheatingLogs.filter(cl =>
    myAttempts.some(at => at.assignmentTitle === cl.assignmentTitle)
  );
  const suspiciousRate = myAttempts.length > 0
    ? Math.round((myCheats.length / myAttempts.length) * 100)
    : 0;

  const copyLink = (id: string) => {
    const link = `${window.location.origin}/exam/${id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const saveApiKey = () => {
    setGeminiKey(apiKeyInput);
    setSaveKeyMsg(true);
    setTimeout(() => setSaveKeyMsg(false), 2000);
  };

  // ===== AI Generate =====
  const handleGenerate = async () => {
    if (!quizTopic.trim() || !quizSubject.trim()) {
      alert(language === 'uz' ? 'Mavzu va fan kiriting!' : 'Enter topic and subject!');
      return;
    }
    setGenerating(true);
    setGeneratedQuestions([]);
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          topic: quizTopic,
          subject: quizSubject,
          difficulty: quizDifficulty,
          level: user?.level || 'university',
          questionCount: quizCount,
          apiKey: geminiKey,
        }),
      });
      const data = await res.json();
      if (data.error) {
        alert(language === 'uz' ? `AI Xatoligi: ${data.error}` : `AI Error: ${data.error}`);
      } else if (data.questions) {
        setGeneratedQuestions(data.questions);
      }
    } catch (err: any) {
      console.error(err);
      alert(language === 'uz' ? `Tarmoq ulanish xatoligi: ${err.message}` : `Network connection error: ${err.message}`);
    }
    setGenerating(false);
  };

  const handlePublish = () => {
    if (!quizTitle.trim() || generatedQuestions.length === 0) return;
    if (quizGroup.trim() && !validateGroupCode(quizGroup)) return;

    const id = `quiz-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    addAssignment({
      id,
      title: quizTitle,
      description: quizDesc || `${quizSubject} — ${quizTopic}`,
      timeLimit: quizTime,
      deadline: new Date(Date.now() + 7 * 24 * 3600000).toISOString(),
      questions: generatedQuestions,
      creator: user?.email || '',
      isPrivate: true,
      group: quizGroup.trim() || undefined,
    });
    setPublishSuccess(id);
    setGeneratedQuestions([]);
    setQuizTitle('');
    setQuizTopic('');
    setQuizSubject('');
    setQuizGroup('');
    setTimeout(() => setPublishSuccess(null), 6000);
  };

  // ===== File Upload =====
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (files.length + uploadedFiles.length > 5) {
      alert(language === 'uz' 
        ? "Maksimal 5 tagacha fayl yuklashingiz mumkin!" 
        : "You can upload a maximum of 5 files!");
      return;
    }

    setUploadedFiles(prev => [...prev, ...files]);
    setFileQuestions([]);
    setDetectedTopic('');
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setFileQuestions([]);
    setDetectedTopic('');
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleAnalyzeFile = async () => {
    if (uploadedFiles.length === 0) return;
    setFileAnalyzing(true);
    setFileQuestions([]);
    try {
      // Convert all files to base64
      const filesPayload = await Promise.all(
        uploadedFiles.map(async file => {
          const base64 = await fileToBase64(file);
          return {
            name: file.name,
            type: file.type,
            base64: base64,
          };
        })
      );

      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze-file',
          files: filesPayload,
          filename: uploadedFiles.map(f => f.name).join(', '),
          apiKey: geminiKey,
        }),
      });
      const data = await res.json();
      if (data.error) {
        alert(language === 'uz' ? `AI Xatoligi: ${data.error}` : `AI Error: ${data.error}`);
      } else {
        if (data.questions) setFileQuestions(data.questions);
        if (data.detectedTopic) setDetectedTopic(data.detectedTopic);
      }
    } catch (err: any) {
      console.error(err);
      alert(language === 'uz' ? `Tarmoq ulanish xatoligi: ${err.message}` : `Network connection error: ${err.message}`);
    }
    setFileAnalyzing(false);
  };

  const handleFilePublish = () => {
    if (!detectedTopic || fileQuestions.length === 0) return;
    if (fileGroup.trim() && !validateGroupCode(fileGroup)) return;

    const id = `file-quiz-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    addAssignment({
      id,
      title: detectedTopic,
      description: `Fayllar: ${uploadedFiles.map(f => f.name).join(', ')}`,
      timeLimit: 30,
      deadline: new Date(Date.now() + 7 * 24 * 3600000).toISOString(),
      questions: fileQuestions,
      creator: user?.email || '',
      isPrivate: true,
      group: fileGroup.trim() || undefined,
    });
    setFilePublishSuccess(id);
    setFileQuestions([]);
    setUploadedFiles([]);
    setDetectedTopic('');
    setFileGroup('');
    setTimeout(() => setFilePublishSuccess(null), 6000);
  };

  const difficultyColors: Record<string, string> = {
    easy: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    hard: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--card-border)] glass-panel">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-sm bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent hidden sm:block">DangasaAI</span>
            </Link>
            <span className="hidden sm:block text-[var(--text-secondary)] text-xs">/ {t(language, 'teacher_title')}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-xl overflow-hidden border border-[var(--card-border)] text-[10px] font-bold">
              {(['uz', 'ru', 'en'] as const).map(l => (
                <button key={l} onClick={() => setLanguage(l)}
                  className={`px-2 py-1.5 uppercase cursor-pointer transition-all ${language === l ? 'bg-purple-600 text-white' : 'text-[var(--text-secondary)]'}`}>
                  {l}
                </button>
              ))}
            </div>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 rounded-lg glass-panel border border-[var(--card-border)] text-[var(--text-secondary)] cursor-pointer">
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <button 
              onClick={openProfileModal}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-panel border border-[var(--card-border)] hover:opacity-80 transition-all cursor-pointer bg-transparent text-left outline-none"
              title={language === 'uz' ? "Profil sozlamalari" : "Profile Settings"}
            >
              {user.profileImage ? (
                <img 
                  src={user.profileImage} 
                  alt="avatar" 
                  className="w-6 h-6 rounded-lg border border-[var(--card-border)] bg-purple-950/20"
                />
              ) : (
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white">
                  {user.name.charAt(0)}
                </div>
              )}
              <span className="text-xs font-semibold text-[var(--text-primary)] hidden sm:block">{user.name}</span>
            </button>
            <button onClick={() => { logout(); router.push('/'); }}
              className="p-1.5 rounded-lg glass-panel border border-[var(--card-border)] text-rose-400 hover:text-rose-300 cursor-pointer transition-all">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 flex flex-col gap-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t(language, 'teacher_exams'), value: myAssignments.length, icon: <ClipboardList className="w-4 h-4" />, color: 'from-purple-500 to-violet-600' },
            { label: t(language, 'teacher_results'), value: myAttempts.length, icon: <Users className="w-4 h-4" />, color: 'from-emerald-500 to-teal-600' },
            { label: t(language, 'teacher_cheats'), value: myCheats.length, icon: <AlertTriangle className="w-4 h-4" />, color: 'from-rose-500 to-pink-600' },
            { label: t(language, 'teacher_suspicious'), value: `${suspiciousRate}%`, icon: <Shield className="w-4 h-4" />, color: 'from-yellow-500 to-orange-600' },
          ].map((s, i) => (
            <div key={i} className="glass-panel rounded-2xl p-4 border border-[var(--card-border)] flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
                {s.icon}
              </div>
              <div>
                <div className="text-xl font-black text-[var(--text-primary)]">{s.value}</div>
                <div className="text-[10px] text-[var(--text-secondary)] font-medium">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* API Key */}
        <div className="glass-panel rounded-2xl p-4 border border-[var(--card-border)] flex flex-wrap items-center gap-3">
          <Brain className="w-4 h-4 text-purple-400 flex-shrink-0" />
          <span className="text-xs font-bold text-[var(--text-secondary)] flex-shrink-0">Gemini API Key:</span>
          <input type="password" value={apiKeyInput} onChange={e => setApiKeyInput(e.target.value)}
            placeholder="AIza..."
            className="flex-1 min-w-40 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-3 py-1.5 text-xs text-[var(--text-primary)] focus:border-purple-500 focus:outline-none" />
          <button onClick={saveApiKey}
            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5">
            {saveKeyMsg ? <><Check className="w-3 h-3" /> Saqlandi</> : t(language, 'save')}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 glass-panel rounded-2xl border border-[var(--card-border)] w-full overflow-x-auto">
          {([
            { key: 'create', label: t(language, 'teacher_tab_create'), icon: <Plus className="w-3.5 h-3.5" /> },
            { key: 'upload', label: t(language, 'teacher_tab_upload'), icon: <Upload className="w-3.5 h-3.5" /> },
            { key: 'results', label: t(language, 'teacher_tab_results'), icon: <BarChart3 className="w-3.5 h-3.5" /> },
            { key: 'cheats', label: t(language, 'teacher_tab_cheats'), icon: <Shield className="w-3.5 h-3.5" /> },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as TabType)}
              className={`flex-1 min-w-fit flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ===== CREATE TAB ===== */}
        {activeTab === 'create' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Builder */}
            <div className="glass-panel rounded-2xl p-6 border border-[var(--card-border)] flex flex-col gap-5">
              <h2 className="text-base font-black text-[var(--text-primary)] flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                {t(language, 'teacher_ai_generate')}
              </h2>
              {!geminiKey && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-xl text-[11px] leading-relaxed font-semibold">
                  ⚠️ Gemini API kaliti kiritilmagan. Tizim simulyatsiya rejimida ishlamoqda va faqat shablon savollarni yaratadi. Haqiqiy AI uchun yuqoridagi maydonga kalitni kiriting va saqlang!
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">Imtihon nomi</label>
                  <input value={quizTitle} onChange={e => setQuizTitle(e.target.value)}
                    placeholder="Fizika — Nyuton qonunlari"
                    className="bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-purple-500 focus:outline-none rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] transition-all" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">Fan (Subject)</label>
                  <input value={quizSubject} onChange={e => setQuizSubject(e.target.value)}
                    placeholder="Fizika, Matematika, Kimyo..."
                    className="bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-purple-500 focus:outline-none rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] transition-all" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">Mavzu (Topic) — aniq kiriting</label>
                <input value={quizTopic} onChange={e => setQuizTopic(e.target.value)}
                  placeholder="Nyutonning 1-qonuni (Inersiya qonuni)"
                  className="bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-purple-500 focus:outline-none rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] transition-all" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">Qiyinlik</label>
                  <select value={quizDifficulty} onChange={e => setQuizDifficulty(e.target.value)}
                    className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-purple-500 focus:outline-none cursor-pointer">
                    <option value="easy">Oson</option>
                    <option value="medium">O'rtacha</option>
                    <option value="hard">Qiyin</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">Savollar</label>
                  <input type="number" min={3} max={20} value={quizCount} onChange={e => setQuizCount(Number(e.target.value))}
                    className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-purple-500 focus:outline-none" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">Vaqt (daq)</label>
                  <input type="number" min={5} max={180} value={quizTime} onChange={e => setQuizTime(Number(e.target.value))}
                    className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-purple-500 focus:outline-none" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">Guruh kodi (ixtiyoriy, masalan: 101-102)</label>
                <input value={quizGroup} onChange={e => setQuizGroup(e.target.value)}
                  placeholder="Format: XXX-XXX (masalan: 101-102)"
                  className="bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-purple-500 focus:outline-none rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] transition-all" />
              </div>

              <textarea value={quizDesc} onChange={e => setQuizDesc(e.target.value)}
                placeholder="Imtihon tavsifi (ixtiyoriy)..."
                rows={2}
                className="bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-purple-500 focus:outline-none rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] resize-none transition-all" />

              <button onClick={handleGenerate} disabled={generating}
                className="glow-btn w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all text-sm">
                {generating
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Yaratilmoqda...</>
                  : <><Brain className="w-4 h-4" /> AI bilan Yaratish</>}
              </button>
            </div>

            {/* Generated Questions + Publish */}
            <div className="glass-panel rounded-2xl p-6 border border-[var(--card-border)] flex flex-col gap-4">
              <h2 className="text-base font-black text-[var(--text-primary)] flex items-center gap-2 justify-between">
                <span className="flex items-center gap-2"><ClipboardList className="w-4 h-4 text-emerald-400" /> Yaratilgan Savollar</span>
                {generatedQuestions.length > 0 && <span className="text-xs text-emerald-400 font-bold">{generatedQuestions.length} ta</span>}
              </h2>

              {generatedQuestions.length === 0 && !generating && (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <Brain className="w-6 h-6 text-purple-400" />
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">Mavzu kiriting va AI bilan savollar yarating</p>
                </div>
              )}

              {generating && (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12">
                  <div className="w-12 h-12 rounded-full border-2 border-purple-600/30 border-t-purple-500 animate-spin" />
                  <p className="text-sm text-purple-400 font-medium">AI savollar yaratmoqda...</p>
                </div>
              )}

              {generatedQuestions.length > 0 && (
                <div className="flex flex-col gap-3 overflow-y-auto max-h-80 pr-1">
                  {generatedQuestions.map((q, i) => (
                    <div key={q.id} className="p-3 rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)]">
                      <div className="text-xs font-semibold text-[var(--text-primary)] mb-2">
                        {i + 1}. <MathText text={q.text} />
                      </div>
                      {q.options?.map((opt: string, j: number) => (
                        <div key={j} className={`text-[10px] px-2 py-1 rounded-lg mb-1 ${opt === q.correctAnswer ? 'bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/20' : 'text-[var(--text-secondary)]'}`}>
                          <MathText text={opt} />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {generatedQuestions.length > 0 && (
                <button onClick={handlePublish}
                  className="glow-btn w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all text-sm mt-auto">
                  <CheckCircle2 className="w-4 h-4" /> {t(language, 'teacher_publish')}
                </button>
              )}

              {publishSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" /> Imtihon nashr etildi!
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-[10px] bg-black/20 px-2 py-1 rounded-lg text-[var(--text-secondary)] truncate">
                      {typeof window !== 'undefined' ? `${window.location.origin}/exam/${publishSuccess}` : ''}
                    </code>
                    <button onClick={() => copyLink(publishSuccess)}
                      className="px-2 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold cursor-pointer hover:bg-emerald-500/30 transition-all flex items-center gap-1">
                      {copiedId === publishSuccess ? <><Check className="w-3 h-3" /> Nusxa!</> : <><Copy className="w-3 h-3" /> Nusxa</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== FILE UPLOAD TAB ===== */}
        {activeTab === 'upload' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel rounded-2xl p-6 border border-[var(--card-border)] flex flex-col gap-5">
              <h2 className="text-base font-black text-[var(--text-primary)] flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-400" />
                {t(language, 'teacher_upload_title')}
              </h2>
              {!geminiKey && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-xl text-[11px] leading-relaxed font-semibold">
                  ⚠️ Gemini API kaliti kiritilmagan. Fayl tahlili simulyatsiya rejimida ishlaydi.
                </div>
              )}
              <p className="text-xs text-[var(--text-secondary)]">{t(language, 'teacher_upload_subtitle')}</p>

              {/* Drop Zone */}
              <label className="relative flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[var(--card-border)] hover:border-purple-500/40 hover:bg-purple-500/5 rounded-2xl p-8 cursor-pointer transition-all">
                <input type="file" multiple accept=".txt,.md,.csv,.js,.ts,.py,.json,.xml,.html,.css,.pdf,.docx"
                  onChange={handleFileChange} className="hidden" />
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-purple-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-[var(--text-primary)]">Fayllarni tanlash yoki sudrab tashlash (Maks. 5 ta)</p>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-1">TXT, MD, PDF, DOCX, JSON, XML, CSV, JS, TS, PY</p>
                </div>
              </label>

              {/* Selected Files List */}
              {uploadedFiles.length > 0 && (
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">
                    Yuklangan fayllar ({uploadedFiles.length} / 5)
                  </label>
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)]">
                        <div className="flex items-center gap-2.5 truncate">
                          <FileText className="w-4 h-4 text-purple-400 flex-shrink-0" />
                          <div className="truncate">
                            <p className="text-xs font-bold text-[var(--text-primary)] truncate">{file.name}</p>
                            <p className="text-[9px] text-[var(--text-secondary)]">{(file.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <button onClick={() => removeFile(idx)}
                          className="p-1 rounded-lg hover:bg-rose-500/10 text-rose-400 cursor-pointer transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={handleAnalyzeFile} disabled={uploadedFiles.length === 0 || fileAnalyzing}
                className={`glow-btn w-full font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm transition-all ${
                  uploadedFiles.length > 0 && !fileAnalyzing
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white cursor-pointer'
                    : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-secondary)] cursor-not-allowed'
                }`}>
                {fileAnalyzing
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> AI tahlil qilmoqda...</>
                  : <><Brain className="w-4 h-4" /> {t(language, 'teacher_upload_analyze')}</>}
              </button>
            </div>

            {/* File Questions Result */}
            <div className="glass-panel rounded-2xl p-6 border border-[var(--card-border)] flex flex-col gap-4">
              <h2 className="text-base font-black text-[var(--text-primary)] flex items-center gap-2 justify-between">
                <span className="flex items-center gap-2"><ClipboardList className="w-4 h-4 text-blue-400" /> Aniqlangan Savollar</span>
                {fileQuestions.length > 0 && <span className="text-xs text-blue-400 font-bold">{fileQuestions.length} ta</span>}
              </h2>

              {detectedTopic && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <Globe className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                  <span className="text-xs text-purple-300 font-semibold">Mavzu: {detectedTopic}</span>
                </div>
              )}

              {fileQuestions.length === 0 && !fileAnalyzing && (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12 text-center">
                  <FileText className="w-10 h-10 text-[var(--text-secondary)]" />
                  <p className="text-sm text-[var(--text-secondary)]">Fayl yuklang va AI tahlil tugmachasini bosing</p>
                </div>
              )}

              {fileAnalyzing && (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12">
                  <div className="w-12 h-12 rounded-full border-2 border-blue-600/30 border-t-blue-500 animate-spin" />
                  <p className="text-sm text-blue-400 font-medium">Fayl tahlil qilinmoqda...</p>
                </div>
              )}

              {fileQuestions.length > 0 && (
                <div className="flex flex-col gap-3 overflow-y-auto max-h-72 pr-1">
                  {fileQuestions.map((q, i) => (
                    <div key={q.id} className="p-3 rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)]">
                      <div className="text-xs font-semibold text-[var(--text-primary)] mb-2">
                        {i + 1}. <MathText text={q.text} />
                      </div>
                      {q.options?.map((opt: string, j: number) => (
                        <div key={j} className={`text-[10px] px-2 py-1 rounded-lg mb-1 ${opt === q.correctAnswer ? 'bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/20' : 'text-[var(--text-secondary)]'}`}>
                          <MathText text={opt} />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {fileQuestions.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-2 mb-2">
                  <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">Guruh kodi (ixtiyoriy, masalan: 101-102)</label>
                  <input value={fileGroup} onChange={e => setFileGroup(e.target.value)}
                    placeholder="Format: XXX-XXX (masalan: 101-102)"
                    className="bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-purple-500 focus:outline-none rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] transition-all" />
                </div>
              )}

              {fileQuestions.length > 0 && (
                <button onClick={handleFilePublish}
                  className="glow-btn w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer text-sm mt-auto">
                  <CheckCircle2 className="w-4 h-4" /> Nashr qilish
                </button>
              )}

              {filePublishSuccess && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" /> Fayl testi nashr etildi!
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-[10px] bg-black/20 px-2 py-1 rounded-lg text-[var(--text-secondary)] truncate">
                      {typeof window !== 'undefined' ? `${window.location.origin}/exam/${filePublishSuccess}` : ''}
                    </code>
                    <button onClick={() => copyLink(filePublishSuccess)}
                      className="px-2 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-[10px] font-bold cursor-pointer flex items-center gap-1">
                      <Copy className="w-3 h-3" /> Nusxa
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== RESULTS TAB ===== */}
        {activeTab === 'results' && (() => {
          const uniqueGroups = Array.from(new Set(myAttempts.map(at => at.group).filter(Boolean))) as string[];
          const filteredAttempts = myAttempts.filter(at => {
            if (filterGroup === 'all') return true;
            if (filterGroup === 'none') return !at.group;
            return at.group === filterGroup;
          });

          return (
            <div className="glass-panel rounded-2xl p-6 border border-[var(--card-border)] flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--card-border)]/50 pb-4">
                <h2 className="text-base font-black text-[var(--text-primary)] flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" /> {t(language, 'teacher_tab_results')}
                </h2>
                {myAttempts.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--text-secondary)]">Guruh bo'yicha saralash:</span>
                    <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)}
                      className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-3 py-1.5 text-xs text-[var(--text-primary)] focus:border-purple-500 focus:outline-none cursor-pointer">
                      <option value="all">Barcha talabalar</option>
                      <option value="none">Guruhsiz talabalar</option>
                      {uniqueGroups.map(g => (
                        <option key={g} value={g}>{g}-guruh talabalari</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              {filteredAttempts.length === 0 ? (
                <div className="text-center py-12 text-[var(--text-secondary)] text-sm">Ushbu guruh bo'yicha hech qanday natija yo'q.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[var(--card-border)]">
                        {['Talaba', 'Guruh', 'Imtihon', 'Ball', 'Aldash', 'Sana'].map(h => (
                          <th key={h} className="text-left px-3 py-3 text-[var(--text-secondary)] font-bold uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAttempts.map(at => (
                        <tr key={at.id} className="border-b border-[var(--card-border)]/50 hover:bg-purple-500/5 transition-colors">
                          <td className="px-3 py-3 font-semibold text-[var(--text-primary)]">{at.studentName}</td>
                          <td className="px-3 py-3">
                            {at.group ? (
                              <span className="px-2 py-0.5 rounded-lg font-bold text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                {at.group}
                              </span>
                            ) : (
                              <span className="text-[10px] text-[var(--text-secondary)] font-medium italic">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-[var(--text-secondary)]">{at.assignmentTitle}</td>
                          <td className="px-3 py-3">
                            <span className={`font-black ${(at.score || 0) >= at.maxScore * 0.7 ? 'text-emerald-400' : (at.score || 0) >= at.maxScore * 0.4 ? 'text-yellow-400' : 'text-rose-400'}`}>
                              {at.score ?? '—'}/{at.maxScore}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span className={`px-2 py-0.5 rounded-lg font-bold text-[10px] ${at.cheatingScore > 3 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : at.cheatingScore > 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                              {at.cheatingScore > 0 ? `${at.cheatingScore} hodisa` : 'Toza'}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-[var(--text-secondary)]">{new Date(at.submittedAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })()}

        {/* ===== CHEATS TAB ===== */}
        {activeTab === 'cheats' && (
          <div className="glass-panel rounded-2xl p-6 border border-[var(--card-border)] flex flex-col gap-4">
            <h2 className="text-base font-black text-[var(--text-primary)] flex items-center gap-2">
              <Shield className="w-4 h-4 text-rose-400" /> {t(language, 'teacher_tab_cheats')}
            </h2>
            {myCheats.length === 0 ? (
              <div className="text-center py-12 text-emerald-400 text-sm font-medium">
                <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                Hech qanday aldash hodisasi aniqlanmagan.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {myCheats.map(log => (
                  <div key={log.id} className="flex items-start gap-3 p-4 rounded-xl border border-rose-500/20 bg-rose-500/5">
                    <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-[var(--text-primary)]">{log.studentName}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold ${
                          log.eventType === 'tab-switch' ? 'bg-orange-500/20 text-orange-400' :
                          log.eventType === 'fullscreen-exit' ? 'bg-red-500/20 text-red-400' :
                          log.eventType === 'devtools-open' ? 'bg-rose-500/20 text-rose-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>{log.eventType}</span>
                      </div>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-1">{log.details}</p>
                      <p className="text-[10px] text-[var(--text-secondary)] opacity-60 mt-0.5">{new Date(log.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Quizzes List */}
        <div className="glass-panel rounded-2xl p-6 border border-[var(--card-border)] flex flex-col gap-4">
          <h2 className="text-base font-black text-[var(--text-primary)] flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-purple-400" /> {t(language, 'teacher_quiz_list')}
          </h2>
          {myAssignments.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-secondary)] text-sm">Hali imtihon yaratilmagan.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {myAssignments.map(a => (
                <div key={a.id} className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)] flex flex-col gap-3 group">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-[var(--text-primary)] line-clamp-2">{a.title}</p>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{a.questions.length} ta savol • {a.timeLimit} daqiqa</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/20 font-bold whitespace-nowrap flex-shrink-0">
                      {a.isPrivate ? '🔒 Private' : '🌐 Public'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-auto">
                    <button onClick={() => copyLink(a.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-[var(--card-border)] text-[10px] font-bold text-[var(--text-secondary)] hover:border-purple-500/40 hover:text-purple-400 cursor-pointer transition-all">
                      {copiedId === a.id ? <><Check className="w-3 h-3 text-emerald-400" /> {t(language, 'teacher_copied')}</> : <><Copy className="w-3 h-3" /> {t(language, 'teacher_copy_link')}</>}
                    </button>
                    <button onClick={() => openEditModal(a)}
                      className="p-2 rounded-xl border border-[var(--card-border)] text-[var(--text-secondary)] hover:border-amber-500/40 hover:text-amber-400 cursor-pointer transition-all"
                      title={language === 'uz' ? "Tahrirlash" : "Edit"}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeleteAssignment(a.id)}
                      className="p-2 rounded-xl border border-[var(--card-border)] text-[var(--text-secondary)] hover:border-rose-500/40 hover:text-rose-400 cursor-pointer transition-all"
                      title={language === 'uz' ? "O'chirish" : "Delete"}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      {/* Edit Assignment Modal */}
      {showEditModal && editingQuiz && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="glass-panel border border-[var(--card-border)] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl p-6 relative overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            {/* Close Button */}
            <button onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer">
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="mb-4">
              <h3 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
                <Pencil className="w-5 h-5 text-purple-400" />
                {language === 'uz' ? "Topshiriqni tahrirlash" : (language === 'ru' ? "Редактировать задание" : "Edit Assignment")}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">ID: {editingQuiz.id}</p>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-5">
              {/* Form details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[var(--input-bg)]/35 p-4 rounded-xl border border-[var(--card-border)]/50">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">
                    {language === 'uz' ? "Topshiriq nomi" : (language === 'ru' ? "Название задания" : "Assignment Title")}
                  </label>
                  <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                    className="bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-purple-500 focus:outline-none rounded-xl px-3 py-2 text-xs text-[var(--text-primary)]" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">
                    {language === 'uz' ? "Vaqt (daqiqalarda)" : (language === 'ru' ? "Время (в минутах)" : "Time Limit (minutes)")}
                  </label>
                  <input type="number" min={5} max={180} value={editTime} onChange={e => setEditTime(Number(e.target.value))}
                    className="bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-purple-500 focus:outline-none rounded-xl px-3 py-2 text-xs text-[var(--text-primary)]" />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">
                    {language === 'uz' ? "Guruh kodi (ixtiyoriy, masalan: 101-102)" : "Group Code (optional, e.g., 101-102)"}
                  </label>
                  <input value={editGroup} onChange={e => setEditGroup(e.target.value)}
                    placeholder="Format: XXX-XXX (masalan: 101-102)"
                    className="bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-purple-500 focus:outline-none rounded-xl px-3 py-2 text-xs text-[var(--text-primary)]" />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">
                    {language === 'uz' ? "Tavsif" : (language === 'ru' ? "Описание" : "Description")}
                  </label>
                  <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={2}
                    className="bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-purple-500 focus:outline-none rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] resize-none" />
                </div>
              </div>

              {/* Questions List */}
              <div className="flex flex-col gap-2.5">
                <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center justify-between">
                  <span>{language === 'uz' ? "Savollar Ro'yxati" : (language === 'ru' ? "Список вопросов" : "Questions List")}</span>
                  <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/20 font-bold">{editQuestions.length} ta</span>
                </h4>
                
                <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                  {editQuestions.length === 0 ? (
                    <p className="text-center py-6 text-xs text-[var(--text-secondary)]">{language === 'uz' ? "Savollar mavjud emas!" : "No questions available!"}</p>
                  ) : (
                    editQuestions.map((q, idx) => (
                      <div key={q.id} className="p-3 rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)] flex items-start gap-3 justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-[var(--text-primary)] flex items-start gap-1">
                            <span>{idx + 1}.</span>
                            <div className="break-words"><MathText text={q.text} /></div>
                          </div>
                          {q.options && q.options.length > 0 && (
                            <div className="grid grid-cols-2 gap-1.5 mt-2">
                              {q.options.map((opt: string, optIdx: number) => (
                                <div key={optIdx} className={`text-[10px] px-2 py-1 rounded-lg border ${opt === q.correctAnswer ? 'bg-emerald-500/15 text-emerald-400 font-bold border-emerald-500/20' : 'bg-black/10 border-transparent text-[var(--text-secondary)]'}`}>
                                  <MathText text={opt} />
                                </div>
                              ))}
                            </div>
                          )}
                          {!q.options && q.correctAnswer && (
                            <p className="text-[10px] text-emerald-400 font-medium mt-1.5">
                              {language === 'uz' ? "To'g'ri javob: " : "Correct Answer: "}{q.correctAnswer}
                            </p>
                          )}
                        </div>
                        <button onClick={() => handleRemoveQuestionFromEdit(q.id)}
                          className="p-1 rounded-lg hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 transition-all cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add New Question Section */}
              <div className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)]/20 flex flex-col gap-3">
                <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                  {language === 'uz' ? "Yangi Savol Qo'shish" : (language === 'ru' ? "Добавить новый вопрос" : "Add New Question")}
                </h4>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">
                    {language === 'uz' ? "Savol Matni (KaTeX formula $...$ qo'llab-quvvatlanadi)" : "Question Text (Supports KaTeX $...$)"}
                  </label>
                  <textarea value={newQText} onChange={e => setNewQText(e.target.value)} rows={2}
                    placeholder={language === 'uz' ? "Nyutonning ikkinchi qonuni formulasi: $F = m \\cdot a$" : "Newton's second law: $F = m \\cdot a$"}
                    className="bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-purple-500 focus:outline-none rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 resize-none" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">Savol Turi</label>
                    <select value={newQType} onChange={e => {
                      setNewQType(e.target.value as any);
                      setNewQCorrect('');
                    }}
                      className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:border-purple-500 focus:outline-none cursor-pointer">
                      <option value="multiple-choice">Variantli (Multiple choice)</option>
                      <option value="text">Matnli javob (Text)</option>
                      <option value="code">Kodli javob (Code)</option>
                      <option value="math">Matematik (Math/KaTeX)</option>
                    </select>
                  </div>

                  {newQType !== 'multiple-choice' && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">To'g'ri javob</label>
                      <input value={newQCorrect} onChange={e => setNewQCorrect(e.target.value)}
                        placeholder="Javobni kiriting..."
                        className="bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-purple-500 focus:outline-none rounded-xl px-3 py-2 text-xs text-[var(--text-primary)]" />
                    </div>
                  )}
                </div>

                {newQType === 'multiple-choice' && (
                  <div className="flex flex-col gap-3">
                    <label className="text-[9px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">Variantlar (Kamida 2 tasini to'ldiring)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[0, 1, 2, 3].map(optIdx => (
                        <div key={optIdx} className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-[var(--text-secondary)] w-3">{String.fromCharCode(65 + optIdx)}:</span>
                          <input value={newQOpts[optIdx] || ''} onChange={e => {
                            const val = e.target.value;
                            setNewQOpts(prev => {
                              const updated = [...prev];
                              updated[optIdx] = val;
                              return updated;
                            });
                          }}
                            placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                            className="flex-1 bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-purple-500 focus:outline-none rounded-xl px-3 py-1.5 text-xs text-[var(--text-primary)]" />
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">To'g'ri variantni tanlang</label>
                      <select value={newQCorrect} onChange={e => setNewQCorrect(e.target.value)}
                        className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:border-purple-500 focus:outline-none cursor-pointer">
                        <option value="">-- To'g'ri javobni tanlang --</option>
                        {newQOpts.map((opt, oIdx) => opt.trim() && (
                          <option key={oIdx} value={opt}>{`Variant ${String.fromCharCode(65 + oIdx)}: ${opt.substring(0, 30)}`}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <button onClick={handleAddQuestionToEdit}
                  className="mt-1 px-4 py-2 border border-purple-500/30 hover:border-purple-500 text-purple-400 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                  <Plus className="w-3.5 h-3.5" /> Savolni Qo'shish
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-[var(--card-border)]/55 pt-4 mt-4">
              <button onClick={() => setShowEditModal(false)}
                className="px-4 py-2 rounded-xl border border-[var(--card-border)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-all cursor-pointer">
                {language === 'uz' ? "Bekor qilish" : "Cancel"}
              </button>
              <button onClick={handleSaveEdit}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer">
                {language === 'uz' ? "Saqlash" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Profile Settings Modal */}
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

            {/* Profile Info Summary (Role and Level) */}
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
                  <span className="bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/20">O'qituvchi</span>
                  <span>•</span>
                  <span className="capitalize">{t(language, `auth_level_${user.level}` as any)}</span>
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

              {/* Teaching Level */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">
                  {language === 'uz' ? "Dars berish darajasi" : "Teaching Level"}
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
                    placeholder="teacher, robot, space..."
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
      </main>
    </div>
  );
}
