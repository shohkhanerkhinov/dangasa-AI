import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LangKey } from '@/locales/translations';

export type UserRole = 'student' | 'teacher' | 'admin';
export type EduLevel = 'school' | 'college' | 'university';
export type ThemeMode = 'dark' | 'light';

export interface RegisteredUser {
  name: string;
  email: string;
  passwordHash: string; // simple base64 "hash" for local demo
  role: UserRole;
  level: EduLevel;
  profileImage: string;
  xp: number;
  levelNumber: number;
}

export interface User {
  name: string;
  email: string;
  role: UserRole;
  level: EduLevel;
  profileImage?: string;
  xp: number;
  levelNumber: number;
}

export interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'text' | 'code' | 'math';
  options?: string[];
  correctAnswer?: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  timeLimit: number;
  deadline: string;
  questions: Question[];
  creator: string;
  isPrivate: boolean; // NEW: private by default
  group?: string; // Guruh kodi format: XXX-XXX
}

export interface QuizAttempt {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  studentName: string;
  studentEmail: string;
  answers: Record<string, string>;
  score?: number;
  maxScore: number;
  aiFeedback?: string;
  submittedAt: string;
  cheatingScore: number;
  timeSpent: number;
  group?: string; // Guruh kodi format: XXX-XXX
}

export interface CheatingLog {
  id: string;
  timestamp: string;
  studentName: string;
  studentEmail: string;
  assignmentTitle: string;
  eventType: 'tab-switch' | 'fullscreen-exit' | 'devtools-open' | 'copy-paste' | 'shortcut';
  details: string;
}

// Simple deterministic hash for demo
function simpleHash(str: string): string {
  return btoa(encodeURIComponent(str));
}

function checkHash(plain: string, hash: string): boolean {
  try {
    return simpleHash(plain) === hash;
  } catch {
    return false;
  }
}

// Seed default demo users
const defaultRegisteredUsers: RegisteredUser[] = [
  {
    name: "Ali Valiyev",
    email: "teacher@dangasa.ai",
    passwordHash: simpleHash("teacher123"),
    role: 'teacher',
    level: 'university',
    profileImage: `https://api.dicebear.com/7.x/bottts/svg?seed=AliValiyev`,
    xp: 0,
    levelNumber: 1,
  },
  {
    name: "Ziyoda Karimova",
    email: "student@dangasa.ai",
    passwordHash: simpleHash("student123"),
    role: 'student',
    level: 'university',
    profileImage: `https://api.dicebear.com/7.x/bottts/svg?seed=ZiyodaKarimova`,
    xp: 120,
    levelNumber: 2,
  }
];

interface AppState {
  user: User | null;
  geminiKey: string;
  firebaseConfig: any | null;
  assignments: Assignment[];
  attempts: QuizAttempt[];
  cheatingLogs: CheatingLog[];
  registeredUsers: RegisteredUser[];
  unlockedAssignmentIds: string[]; // per-user unlocked private assignments
  language: LangKey;
  theme: ThemeMode;

  // Auth actions
  registerUser: (name: string, email: string, password: string, role: UserRole, level: EduLevel) => Promise<{ success: boolean; error?: string }>;
  loginUser: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginOAuth: (name: string, email: string, provider: 'google' | 'github', role?: UserRole, level?: EduLevel, profileImage?: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (name: string, level: EduLevel, profileImage: string) => Promise<{ success: boolean; error?: string }>;

  // App actions
  setGeminiKey: (key: string) => void;
  setFirebaseConfig: (config: any | null) => void;
  addAssignment: (assignment: Assignment) => Promise<void>;
  updateAssignment: (id: string, assignment: Assignment) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
  submitAttempt: (attempt: QuizAttempt) => Promise<void>;
  addCheatingLog: (log: Omit<CheatingLog, 'id' | 'timestamp'>) => Promise<void>;
  addXp: (amount: number) => void;
  unlockAssignment: (id: string) => void;
  setLanguage: (lang: LangKey) => void;
  setTheme: (theme: ThemeMode) => void;

  // Sync actions
  fetchAssignments: () => Promise<void>;
  fetchAssignmentById: (id: string) => Promise<Assignment | null>;
  fetchAttempts: () => Promise<void>;
  fetchCheatingLogs: () => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      geminiKey: '',
      firebaseConfig: null,
      assignments: [],
      attempts: [],
      cheatingLogs: [],
      registeredUsers: [],
      unlockedAssignmentIds: [],
      language: 'uz',
      theme: 'dark',

      registerUser: async (name, email, password, role, level) => {
        try {
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role, level })
          });
          const data = await res.json();
          if (!data.success) {
            return { success: false, error: data.error || 'auth_error_exists' };
          }
          set({ user: data.user });
          return { success: true };
        } catch (err: any) {
          console.error(err);
          return { success: false, error: 'Server bilan bog\'lanib bo\'lmadi' };
        }
      },

      loginUser: async (email, password) => {
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          const data = await res.json();
          if (!data.success) {
            return { success: false, error: data.error || 'auth_error_invalid' };
          }
          set({ user: data.user, unlockedAssignmentIds: [] });
          return { success: true };
        } catch (err: any) {
          console.error(err);
          return { success: false, error: 'Server bilan bog\'lanib bo\'lmadi' };
        }
      },

      loginOAuth: async (name, email, provider, role = 'student', level = 'university', profileImage = '', password = '') => {
        try {
          const oauthPassword = password || `oauth-${provider}-${email.toLowerCase()}`;
          // Attempt registration first
          const regRes = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name,
              email: email.toLowerCase(),
              password: oauthPassword,
              role,
              level,
              profileImage
            })
          });
          const regData = await regRes.json();
          if (regData.success) {
            set({ user: regData.user, unlockedAssignmentIds: [] });
            return { success: true };
          }

          // If register fails because user exists, login
          const logRes = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: email.toLowerCase(),
              password: oauthPassword,
              isOAuth: true // Bypass password verification on backend because OAuth is validated by Google Client SDK
            })
          });
          const logData = await logRes.json();
          if (logData.success) {
            set({ user: logData.user, unlockedAssignmentIds: [] });
            return { success: true };
          }
          return { success: false, error: logData.error || 'auth_error_invalid' };
        } catch (err: any) {
          console.error('[OAuth login error]', err);
          return { success: false, error: err.message || 'Server connection error' };
        }
      },

      logout: () => set({ user: null, unlockedAssignmentIds: [] }),

      updateProfile: async (name, level, profileImage) => {
        try {
          const email = get().user?.email;
          if (!email) return { success: false, error: 'Foydalanuvchi tizimga kirmagan' };

          const res = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name, level, profileImage })
          });
          const data = await res.json();
          if (data.success) {
            set({ user: data.user });
            return { success: true };
          }
          return { success: false, error: data.error || 'Profil yangilanishida xatolik yuz berdi' };
        } catch (err: any) {
          console.error('[Update Profile Error]', err);
          return { success: false, error: err.message || 'Serverga ulanish xatoligi' };
        }
      },

      setGeminiKey: (key) => set({ geminiKey: key }),
      setFirebaseConfig: (config) => set({ firebaseConfig: config }),

      addAssignment: async (assignment) => {
        try {
          const res = await fetch('/api/assignments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(assignment)
          });
          const data = await res.json();
          if (data.success) {
            set((state) => ({
              assignments: [data.assignment, ...state.assignments]
            }));
          }
        } catch (err) {
          console.error('[Add Assignment Error]', err);
          // Local fallback in case of connection issue
          set((state) => ({
            assignments: [assignment, ...state.assignments]
          }));
        }
      },

      updateAssignment: async (id, assignment) => {
        try {
          const res = await fetch(`/api/assignments/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(assignment)
          });
          const data = await res.json();
          if (data.success) {
            set((state) => ({
              assignments: state.assignments.map(a => a.id === id ? data.assignment : a)
            }));
          }
        } catch (err) {
          console.error('[Update Assignment Error]', err);
          // Local fallback
          set((state) => ({
            assignments: state.assignments.map(a => a.id === id ? assignment : a)
          }));
        }
      },

      deleteAssignment: async (id) => {
        try {
          const res = await fetch(`/api/assignments/${id}`, {
            method: 'DELETE'
          });
          const data = await res.json();
          if (data.success) {
            set((state) => ({
              assignments: state.assignments.filter(a => a.id !== id)
            }));
          }
        } catch (err) {
          console.error('[Delete Assignment Error]', err);
          // Local fallback
          set((state) => ({
            assignments: state.assignments.filter(a => a.id !== id)
          }));
        }
      },

      submitAttempt: async (attempt) => {
        try {
          const res = await fetch('/api/attempts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(attempt)
          });
          const data = await res.json();
          if (data.success) {
            set((state) => ({
              attempts: [data.attempt, ...state.attempts]
            }));
            if (data.updatedUser && get().user?.email === data.updatedUser.email) {
              set({ user: data.updatedUser });
            }
          }
        } catch (err) {
          console.error('[Submit Attempt Error]', err);
          // Local fallback
          set((state) => ({
            attempts: [attempt, ...state.attempts],
            user: state.user
              ? {
                  ...state.user,
                  xp: state.user.xp + Math.round((attempt.score || 0) * 1.5),
                  levelNumber: Math.floor((state.user.xp + Math.round((attempt.score || 0) * 1.5)) / 100) + 1
                }
              : null
          }));
        }
      },

      addCheatingLog: async (log) => {
        try {
          const res = await fetch('/api/cheats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(log)
          });
          const data = await res.json();
          if (data.success) {
            set((state) => ({
              cheatingLogs: [data.log, ...state.cheatingLogs]
            }));
          }
        } catch (err) {
          console.error('[Add Cheating Log Error]', err);
          // Local fallback
          const fallbackLog: CheatingLog = {
            ...log,
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString()
          };
          set((state) => ({ cheatingLogs: [fallbackLog, ...state.cheatingLogs] }));
        }
      },

      addXp: (amount) => set((state) => {
        if (!state.user) return {};
        const newXp = state.user.xp + amount;
        const newLevel = Math.floor(newXp / 100) + 1;
        return {
          user: { ...state.user, xp: newXp, levelNumber: newLevel }
        };
      }),

      unlockAssignment: (id) => set((state) => {
        if (state.unlockedAssignmentIds.includes(id)) return {};
        return { unlockedAssignmentIds: [...state.unlockedAssignmentIds, id] };
      }),

      setLanguage: (lang) => set({ language: lang }),

      setTheme: (theme) => {
        if (typeof document !== 'undefined') {
          const html = document.documentElement;
          html.classList.remove('dark', 'light');
          html.classList.add(theme);
        }
        set({ theme });
      },

      fetchAssignments: async () => {
        try {
          const res = await fetch('/api/assignments');
          const data = await res.json();
          if (data.success) {
            set({ assignments: data.assignments });
          }
        } catch (err) {
          console.error('[Fetch Assignments Error]', err);
        }
      },

      fetchAssignmentById: async (id) => {
        try {
          const res = await fetch(`/api/assignments/${id}`);
          const data = await res.json();
          if (data.success && data.assignment) {
            set((state) => {
              const exists = state.assignments.some(a => a.id === id);
              const updated = exists
                ? state.assignments.map(a => a.id === id ? data.assignment : a)
                : [data.assignment, ...state.assignments];
              return { assignments: updated };
            });
            return data.assignment;
          }
          return null;
        } catch (err) {
          console.error('[Fetch Assignment By ID Error]', err);
          return null;
        }
      },

      fetchAttempts: async () => {
        try {
          const res = await fetch('/api/attempts');
          const data = await res.json();
          if (data.success) {
            set({ attempts: data.attempts });
          }
        } catch (err) {
          console.error('[Fetch Attempts Error]', err);
        }
      },

      fetchCheatingLogs: async () => {
        try {
          const res = await fetch('/api/cheats');
          const data = await res.json();
          if (data.success) {
            set({ cheatingLogs: data.cheatingLogs });
          }
        } catch (err) {
          console.error('[Fetch Cheating Logs Error]', err);
        }
      }
    }),
    {
      name: 'dangasa-ai-storage-v3',
      partialize: (state) => ({
        user: state.user,
        geminiKey: state.geminiKey,
        firebaseConfig: state.firebaseConfig,
        assignments: state.assignments,
        attempts: state.attempts,
        cheatingLogs: state.cheatingLogs,
        unlockedAssignmentIds: state.unlockedAssignmentIds,
        language: state.language,
        theme: state.theme,
      })
    }
  )
);
