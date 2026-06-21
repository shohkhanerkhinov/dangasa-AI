'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { t } from '@/locales/translations';
import { 
  Brain, 
  ShieldAlert, 
  Sparkles, 
  LineChart, 
  BookOpen, 
  ArrowRight, 
  Trophy, 
  UserCheck,
  Sun,
  Moon,
  Shield,
  Zap,
  Globe,
  Cpu,
  GraduationCap
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { user, logout, language, setLanguage, theme, setTheme } = useAppStore();

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(theme);
    }
  }, [theme]);

  return (
    <div className="relative min-h-screen bg-[#020205] text-[var(--text-primary)] flex flex-col justify-between transition-colors duration-300">
      
      {/* Background blobs for premium look */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/10 blur-[120px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-pink-900/10 blur-[120px] pointer-events-none animate-pulse-slow"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-[var(--card-border)] px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform duration-300">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-xl bg-gradient-to-r from-white via-purple-200 to-pink-400 bg-clip-text text-transparent tracking-wide">
              Dangasa
            </span>
            <span className="font-black text-xl text-pink-500 text-glow">AI</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[var(--text-secondary)]">
          <a href="#features" className="hover:text-purple-400 transition-colors">{t(language, 'nav_features')}</a>
          <a href="#stats" className="hover:text-purple-400 transition-colors">{t(language, 'nav_stats')}</a>
          <a href="#about" className="hover:text-purple-400 transition-colors">{t(language, 'nav_about')}</a>
        </nav>

        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <div className="flex rounded-xl overflow-hidden border border-[var(--card-border)] text-[10px] font-bold bg-black/20">
            {(['uz', 'ru', 'en'] as const).map(l => (
              <button key={l} onClick={() => setLanguage(l)}
                className={`px-2.5 py-1.5 uppercase cursor-pointer transition-all ${language === l ? 'bg-purple-600 text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
                {l}
              </button>
            ))}
          </div>

          {/* Theme Switcher */}
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl glass-panel border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  const dashboardPath = user.role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student';
                  router.push(dashboardPath);
                }} 
                className="glow-btn bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-purple-500/20"
              >
                {t(language, 'nav_dashboard')}
              </button>
              <button 
                onClick={() => {
                  logout();
                  router.refresh();
                }}
                className="text-xs text-[var(--text-secondary)] hover:text-white transition-colors cursor-pointer"
              >
                {t(language, 'nav_logout')}
              </button>
            </div>
          ) : (
            <Link 
              href="/login" 
              className="glow-btn bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              {t(language, 'nav_login')} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 md:py-20 flex flex-col gap-28 relative z-10">
        
        {/* Hero Section */}
        <section className="text-center flex flex-col items-center gap-6 max-w-4xl mx-auto animate-slide-up">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/30 border border-purple-500/20 text-xs font-semibold text-purple-300 animate-pulse">
            <Sparkles className="w-4 h-4 text-pink-500" /> {t(language, 'hero_badge')}
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] text-glow">
            {t(language, 'hero_title_1')}{" "}
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-emerald-400 bg-clip-text text-transparent">
              {t(language, 'hero_title_2')}
            </span>
          </h1>

          <p className="text-[var(--text-secondary)] text-sm md:text-lg max-w-2xl leading-relaxed">
            {t(language, 'hero_subtitle')}
          </p>

          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <Link 
              href={user ? (user.role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student') : '/register'}
              className="glow-btn bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-purple-500/30 flex items-center gap-2 text-base transition-all cursor-pointer"
            >
              {t(language, 'hero_cta_start')} <ArrowRight className="w-5 h-5" />
            </Link>
            <a 
              href="#features" 
              className="px-8 py-4 rounded-2xl border border-[var(--card-border)] bg-gray-950/30 hover:bg-gray-900/50 text-[var(--text-secondary)] font-semibold transition-all"
            >
              {t(language, 'hero_cta_features')}
            </a>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="flex flex-col gap-12">
          <div className="text-center flex flex-col gap-3">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">{t(language, 'features_title')}</h2>
            <p className="text-[var(--text-secondary)] max-w-xl mx-auto text-sm">{t(language, 'features_subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Card 1: AI Chat Tutor */}
            <div className="glass-panel glass-panel-hover p-8 rounded-3xl flex flex-col gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">{t(language, 'feature_ai_tutor_title')}</h3>
              <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
                {t(language, 'feature_ai_tutor_desc')}
              </p>
            </div>

            {/* Card 2: Smart Anti-Cheat */}
            <div className="glass-panel glass-panel-hover p-8 rounded-3xl flex flex-col gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 group-hover:bg-pink-500 group-hover:text-white transition-all duration-300">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">{t(language, 'feature_anticheat_title')}</h3>
              <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
                {t(language, 'feature_anticheat_desc')}
              </p>
            </div>

            {/* Card 3: AI File Analyzer & Generator */}
            <div className="glass-panel glass-panel-hover p-8 rounded-3xl flex flex-col gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">{t(language, 'feature_fileai_title')}</h3>
              <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
                {t(language, 'feature_fileai_desc')}
              </p>
            </div>

            {/* Card 4: AI Auto-Grading */}
            <div className="glass-panel glass-panel-hover p-8 rounded-3xl flex flex-col gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">{t(language, 'feature_grading_title')}</h3>
              <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
                {t(language, 'feature_grading_desc')}
              </p>
            </div>

            {/* Card 5: Real-time Analytics */}
            <div className="glass-panel glass-panel-hover p-8 rounded-3xl flex flex-col gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition-all duration-300">
                <LineChart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">{t(language, 'feature_analytics_title')}</h3>
              <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
                {t(language, 'feature_analytics_desc')}
              </p>
            </div>

            {/* Card 6: Gamified Learning & XP */}
            <div className="glass-panel glass-panel-hover p-8 rounded-3xl flex flex-col gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:bg-violet-500 group-hover:text-white transition-all duration-300">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">{t(language, 'feature_gamification_title')}</h3>
              <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
                {t(language, 'feature_gamification_desc')}
              </p>
            </div>

          </div>
        </section>

        {/* Redesigned Premium About Section */}
        <section id="about" className="relative flex flex-col gap-12 overflow-hidden py-16 px-8 rounded-[40px] border border-[var(--card-border)] bg-gradient-to-b from-purple-950/20 to-[var(--bg-secondary)]/50">
          <div className="absolute top-[-20%] right-[-10%] w-[350px] h-[350px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse-slow"></div>
          <div className="absolute bottom-[-25%] left-[-10%] w-[350px] h-[350px] bg-pink-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse-slow"></div>

          <div className="text-center flex flex-col gap-3 relative z-10">
            <span className="text-xs font-black uppercase text-purple-400 tracking-widest flex items-center justify-center gap-1.5">
              <Cpu className="w-4 h-4" /> DANGASAAI PLATFORMA HAQIDA
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
              {t(language, 'about_title')}
            </h2>
            <p className="text-[var(--text-secondary)] max-w-2xl mx-auto text-sm md:text-base">
              {t(language, 'about_subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {/* Box 1 */}
            <div className="p-8 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] shadow-xl flex flex-col gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Brain className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-white">{t(language, 'about_card1_title')}</h4>
              <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
                {t(language, 'about_card1_desc')}
              </p>
            </div>
            {/* Box 2 */}
            <div className="p-8 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] shadow-xl flex flex-col gap-4">
              <div className="w-10 h-10 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-white">{t(language, 'about_card2_title')}</h4>
              <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
                {t(language, 'about_card2_desc')}
              </p>
            </div>
            {/* Box 3 */}
            <div className="p-8 rounded-3xl bg-[var(--input-bg)] border border-[var(--card-border)] shadow-xl flex flex-col gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Shield className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-white">{t(language, 'about_card3_title')}</h4>
              <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
                {t(language, 'about_card3_desc')}
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8 mt-4 pt-8 border-t border-[var(--card-border)] relative z-10">
            <div className="flex-1 flex flex-col gap-3">
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-purple-400" />
                {t(language, 'about_mission')}
              </h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {t(language, 'about_mission_text')}
              </p>
            </div>
            <div className="w-full md:w-auto">
              <Link href="/register" className="glow-btn block w-full text-center px-6 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer">
                {t(language, 'hero_cta_start')}
              </Link>
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section id="stats" className="glass-panel rounded-3xl p-10 flex flex-wrap justify-around items-center gap-8 border border-[var(--card-border)]">
          <div className="text-center flex flex-col gap-1">
            <span className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent text-glow">99.8%</span>
            <span className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider">{t(language, 'stats_anticheat')}</span>
          </div>
          <div className="w-[1px] h-12 bg-gray-800 hidden md:block"></div>
          <div className="text-center flex flex-col gap-1">
            <span className="text-4xl md:text-5xl font-black bg-gradient-to-r from-pink-500 to-amber-400 bg-clip-text text-transparent text-glow">10,000+</span>
            <span className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider">{t(language, 'stats_students')}</span>
          </div>
          <div className="w-[1px] h-12 bg-gray-800 hidden md:block"></div>
          <div className="text-center flex flex-col gap-1">
            <span className="text-4xl md:text-5xl font-black bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent text-glow">500+</span>
            <span className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider">{t(language, 'stats_schools')}</span>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center flex flex-col items-center gap-6 max-w-3xl mx-auto py-8">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white">{t(language, 'cta_title')}</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed text-sm">
            {t(language, 'cta_subtitle')}
          </p>
          <div className="mt-4">
            <Link 
              href={user ? (user.role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student') : '/login'}
              className="glow-btn bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-bold px-10 py-5 rounded-2xl shadow-xl shadow-purple-500/20 text-lg transition-all cursor-pointer"
            >
              {t(language, 'cta_button')}
            </Link>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-gray-900 bg-black/40 py-8 px-6 text-center text-xs text-gray-500">
        <p>&copy; {new Date().getFullYear()} DangasaAI Platformasi. Barcha huquqlar himoyalangan.</p>
        <p className="text-xs text-gray-600 mt-2">Uzbekistan EdTech &bull; Designed for Future Learning</p>
      </footer>

    </div>
  );
}
