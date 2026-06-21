'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import { t } from '@/locales/translations';
import type { UserRole, EduLevel } from '@/store/useAppStore';
import { Brain, Mail, Lock, User, ArrowRight, Eye, EyeOff, Sun, Moon, GraduationCap, BookOpen, Play, X } from 'lucide-react';



export default function RegisterPage() {
  const router = useRouter();
  const { user, registerUser, loginOAuth, language, theme, setTheme, setLanguage } = useAppStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [role, setRole] = useState<UserRole>('student');
  const [level, setLevel] = useState<EduLevel>('university');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(theme);
    }
  }, [theme]);

  useEffect(() => {
    if (user) router.push(user.role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student');
  }, [user, router]);

  const getPasswordStrength = (pass: string): number => {
    let score = 0;
    if (!pass) return score;
    if (pass.length >= 8) score++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score++;
    if (/\d/.test(pass)) score++;
    if (/[@$!%*?&]/.test(pass)) score++;
    return score;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPassword) {
      setError(t(language, 'auth_error_empty'));
      return;
    }

    // Name validation: only letters and spaces, at least 3 chars (supports Cyrillic and Uzbek characters)
    const nameRegex = /^[A-Za-zА-Яа-яЎўҚқҒғҲҳ\s]{3,}$/;
    if (!nameRegex.test(trimmedName)) {
      setError(t(language, 'auth_error_invalid_name'));
      return;
    }

    // Email validation: standard RFC 5322 regex pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError(t(language, 'auth_error_invalid_email'));
      return;
    }

    // Password validation: minimum 8 characters
    if (trimmedPassword.length < 8) {
      setError(t(language, 'auth_error_short_pass'));
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    const result = await registerUser(trimmedName, trimmedEmail, trimmedPassword, role, level);
    if (!result.success) {
      setError(t(language, (result.error as any) || 'auth_error_exists'));
    }
    setLoading(false);
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setError('');
    setLoading(true);

    try {
      const { auth, googleProvider, githubProvider } = await import('@/lib/firebase');
      const { signInWithPopup } = await import('firebase/auth');
      
      const activeProvider = provider === 'google' ? googleProvider : githubProvider;
      const result = await signInWithPopup(auth, activeProvider);
      const userResult = result.user;
      
      if (userResult && userResult.email) {
        const enteredName = name.trim();
        const googleName = userResult.displayName || '';
        
        // Name validation: Compare normalized names (strip spaces, lowercase)
        const normalize = (str: string) => str.toLowerCase().replace(/\s+/g, '').trim();
        
        if (enteredName && normalize(enteredName) !== normalize(googleName)) {
          setError(language === 'uz'
            ? `Kiritilgan ism-sharif ("${enteredName}") Google hisobingizdagi ismga ("${googleName}") mos kelmadi! Iltimos, haqiqiy ismingizni yozing.`
            : language === 'ru'
            ? `Введенное имя ("${enteredName}") не совпадает с именем в вашем Google аккаунте ("${googleName}")! Пожалуйста, введите настоящее имя.`
            : `Entered name ("${enteredName}") does not match your Google account name ("${googleName}")! Please use your real name.`);
          setLoading(false);
          return;
        }

        // Email validation: Compare entered email with selected Google email
        const enteredEmail = email.trim().toLowerCase();
        const googleEmail = userResult.email.toLowerCase();
        
        if (enteredEmail && enteredEmail !== googleEmail) {
          setError(language === 'uz'
            ? `Kiritilgan email ("${enteredEmail}") tanlangan Google hisobi pochtasiga ("${googleEmail}") mos kelmadi!`
            : language === 'ru'
            ? `Введенный email ("${enteredEmail}") не совпадает с почтой выбранного Google аккаунта ("${googleEmail}")!`
            : `Entered email ("${enteredEmail}") does not match your selected Google account email ("${googleEmail}")!`);
          setLoading(false);
          return;
        }

        const loginRes = await loginOAuth(
          googleName || enteredName || userResult.email.split('@')[0],
          userResult.email,
          provider,
          role,
          level,
          userResult.photoURL || undefined,
          password
        );
        if (loginRes && !loginRes.success) {
          setError(t(language, (loginRes.error as any) || 'auth_error_invalid'));
        }
      }
    } catch (err: any) {
      console.error(`${provider} registration error:`, err);
      setError(language === 'uz' 
        ? `Ro'yxatdan o'tishda xatolik: ${err.message}` 
        : `Registration failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center px-4 py-12 overflow-hidden">
      {/* Blobs */}
      <div className="absolute top-[15%] right-[10%] w-72 h-72 rounded-full bg-purple-600/8 blur-[90px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-[15%] left-[10%] w-72 h-72 rounded-full bg-emerald-600/8 blur-[90px] pointer-events-none animate-pulse-slow" />

      {/* Logo */}
      <div className="absolute top-6 left-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-sm bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent hidden sm:block">DangasaAI</span>
        </Link>
      </div>

      {/* Controls */}
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <div className="flex rounded-xl overflow-hidden border border-[var(--card-border)] glass-panel text-[11px] font-bold">
          {(['uz', 'ru', 'en'] as const).map(l => (
            <button key={l} onClick={() => setLanguage(l)}
              className={`px-2.5 py-1.5 uppercase transition-all cursor-pointer ${language === l ? 'bg-purple-600 text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
              {l}
            </button>
          ))}
        </div>
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-xl glass-panel border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer">
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Card */}
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-[var(--card-border)] flex flex-col gap-5 animate-slide-up">
        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-purple-600 flex items-center justify-center shadow-xl shadow-purple-500/20">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-black text-[var(--text-primary)]">{t(language, 'auth_register_title')}</h1>
          <p className="text-xs text-[var(--text-secondary)]">{t(language, 'auth_register_subtitle')}</p>
          <button 
            type="button"
            onClick={() => setShowVideoModal(true)}
            className="mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 text-[11px] font-bold transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-purple-400 animate-pulse" />
            {language === 'uz' ? "Qanday ro'yxatdan o'tiladi?" : language === 'ru' ? "Как зарегистрироваться?" : "How to register?"}
          </button>
        </div>

        {/* OAuth */}
        <div className="flex flex-col gap-2.5">
          <button onClick={() => handleOAuth('google')}
            className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border border-[var(--card-border)] glass-panel hover:border-purple-500/40 text-sm font-semibold text-[var(--text-primary)] transition-all cursor-pointer group">
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {t(language, 'auth_google')}
          </button>
          <p className="text-[11px] text-[var(--text-secondary)] text-center">
            {language === 'uz' 
              ? "Google hisobingiz orqali osongina ro'yxatdan o'ting" 
              : language === 'ru'
              ? "Зарегистрируйтесь легко с помощью вашего Google аккаунта"
              : "Simply register using your Google account"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[var(--card-border)]" />
          <span className="text-xs text-[var(--text-secondary)] font-medium">{t(language, 'auth_or')}</span>
          <div className="flex-1 h-px bg-[var(--card-border)]" />
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs px-4 py-2.5 rounded-xl text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{t(language, 'auth_name')}</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 w-4 h-4 text-[var(--text-secondary)]" />
              <input type="text" value={name} onChange={e => { setName(e.target.value); setError(''); }}
                placeholder="Abdullayev Bobur"
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-purple-500 focus:outline-none rounded-xl pl-10 pr-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] transition-all" />
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{t(language, 'auth_email')}</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-[var(--text-secondary)]" />
              <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="email@mail.com"
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-purple-500 focus:outline-none rounded-xl pl-10 pr-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] transition-all" />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{t(language, 'auth_password')}</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[var(--text-secondary)]" />
              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder="kamida 6 belgi"
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-purple-500 focus:outline-none rounded-xl pl-10 pr-10 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] transition-all" />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-3.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Password strength */}
            {password.length > 0 && (
              <div className="flex gap-1 mt-1">
                {[1,2,3,4].map(i => {
                  const strengthScore = getPasswordStrength(password);
                  return (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                      strengthScore >= i
                        ? strengthScore === 1 ? 'bg-rose-500' : strengthScore === 2 ? 'bg-yellow-500' : strengthScore === 3 ? 'bg-emerald-500' : 'bg-emerald-400'
                        : 'bg-[var(--card-border)]'
                    }`} />
                  );
                })}
              </div>
            )}
          </div>

          {/* Role */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Rol</label>
            <div className="grid grid-cols-2 gap-2">
              {(['student', 'teacher'] as UserRole[]).map(r => (
                <button key={r} type="button" onClick={() => setRole(r)}
                  className={`py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    role === r
                      ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                      : 'border-[var(--card-border)] text-[var(--text-secondary)] hover:border-purple-500/40'
                  }`}>
                  {r === 'student' ? <><BookOpen className="w-3.5 h-3.5" />{t(language, 'auth_role_student')}</> : <><User className="w-3.5 h-3.5" />{t(language, 'auth_role_teacher')}</>}
                </button>
              ))}
            </div>
          </div>

          {/* Education Level */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Ta'lim darajasi</label>
            <div className="grid grid-cols-3 gap-2">
              {(['school', 'college', 'university'] as EduLevel[]).map(lv => (
                <button key={lv} type="button" onClick={() => setLevel(lv)}
                  className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    level === lv
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                      : 'border-[var(--card-border)] text-[var(--text-secondary)] hover:border-emerald-500/40'
                  }`}>
                  {t(language, `auth_level_${lv}` as any)}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="glow-btn w-full bg-gradient-to-r from-emerald-500 to-purple-600 hover:from-emerald-400 hover:to-purple-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer text-sm mt-1">
            {loading
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <>{t(language, 'auth_register_btn')} <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <p className="text-center text-xs text-[var(--text-secondary)]">
          {t(language, 'auth_has_account')}{' '}
          <Link href="/login" className="text-purple-400 font-bold hover:underline">{t(language, 'auth_login_btn')}</Link>
        </p>
      </div>

      {/* Video Tutorial Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl glass-panel p-5 md:p-6 rounded-3xl border border-[var(--card-border)] relative flex flex-col gap-4 animate-in fade-in-50 zoom-in-95 duration-200">
            {/* Close Button */}
            <button 
              onClick={() => setShowVideoModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-white/10 text-[var(--text-secondary)] hover:text-white transition-all cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div>
              <h3 className="text-base font-black text-[var(--text-primary)] flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400" />
                {language === 'uz' ? "Tizimdan foydalanish bo'yicha video yo'riqnoma" : language === 'ru' ? "Видео-инструкция по платформе" : "Video Guide on Using the Platform"}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {language === 'uz' ? "Platformada ro'yxatdan o'tish va tizimga kirish bo'yicha qo'llanma" : language === 'ru' ? "Инструкция по регистрации и входу в систему" : "Guide on registration and login details"}
              </p>
            </div>

            {/* Video Iframe Wrapper (Responsive 16:9 Aspect Ratio) */}
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-[var(--card-border)] bg-black/40">
              <iframe 
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1" 
                title="DangasaAI Video Guide"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowFullScreen
                className="absolute inset-0 w-full h-full border-none"
              ></iframe>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-2 border-t border-[var(--card-border)]/30">
              <button 
                onClick={() => setShowVideoModal(false)}
                className="px-5 py-2 rounded-xl border border-[var(--card-border)] text-xs font-bold text-[var(--text-secondary)] hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                {t(language, 'close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
