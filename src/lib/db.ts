import fs from 'fs';
import path from 'path';

// Define structures based on the types in useAppStore.ts
export interface RegisteredUser {
  name: string;
  email: string;
  passwordHash: string;
  role: 'student' | 'teacher' | 'admin';
  level: 'school' | 'college' | 'university';
  profileImage: string;
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
  isPrivate: boolean;
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

interface DatabaseSchema {
  registeredUsers: RegisteredUser[];
  assignments: Assignment[];
  attempts: QuizAttempt[];
  cheatingLogs: CheatingLog[];
}

const DB_FILE = path.join(process.cwd(), 'src/lib/db.json');

// Ensure database file exists
function initDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initialData: DatabaseSchema = {
        registeredUsers: [
          {
            name: "Ali Valiyev",
            email: "teacher@dangasa.ai",
            passwordHash: "dGVhY2hlcjEyMw==",
            role: "teacher",
            level: "university",
            profileImage: "https://api.dicebear.com/7.x/bottts/svg?seed=AliValiyev",
            xp: 0,
            levelNumber: 1
          },
          {
            name: "Ziyoda Karimova",
            email: "student@dangasa.ai",
            passwordHash: "c3R1ZGVudDEyMw==",
            role: "student",
            level: "university",
            profileImage: "https://api.dicebear.com/7.x/bottts/svg?seed=ZiyodaKarimova",
            xp: 120,
            levelNumber: 2
          }
        ],
        assignments: [],
        attempts: [],
        cheatingLogs: []
      };
      // Create folder if needed
      fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      return initialData;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to initialize database:", error);
    return {
      registeredUsers: [],
      assignments: [],
      attempts: [],
      cheatingLogs: []
    };
  }
}

// Read database
export function readDb(): DatabaseSchema {
  return initDb();
}

// Write database
export function writeDb(data: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error("Failed to write to database:", error);
  }
}

// Helper: Users
export function getUsers(): RegisteredUser[] {
  return readDb().registeredUsers;
}

export function addUser(user: RegisteredUser): void {
  const db = readDb();
  db.registeredUsers.push(user);
  writeDb(db);
}

export function updateUserXp(email: string, xp: number, levelNumber: number): void {
  const db = readDb();
  const userIndex = db.registeredUsers.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
  if (userIndex !== -1) {
    db.registeredUsers[userIndex].xp = xp;
    db.registeredUsers[userIndex].levelNumber = levelNumber;
    writeDb(db);
  }
}

export function updateUserProfile(
  email: string,
  updatedData: { name: string; level: 'school' | 'college' | 'university'; profileImage?: string }
): void {
  const db = readDb();
  const userIndex = db.registeredUsers.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
  if (userIndex !== -1) {
    db.registeredUsers[userIndex].name = updatedData.name;
    db.registeredUsers[userIndex].level = updatedData.level;
    if (updatedData.profileImage) {
      db.registeredUsers[userIndex].profileImage = updatedData.profileImage;
    }
    writeDb(db);
  }
}

// Helper: Assignments
export function getAssignments(): Assignment[] {
  return readDb().assignments;
}

export function getAssignmentById(id: string): Assignment | undefined {
  return readDb().assignments.find(a => a.id === id);
}

export function addAssignment(assignment: Assignment): void {
  const db = readDb();
  // Avoid duplicates
  if (!db.assignments.some(a => a.id === assignment.id)) {
    db.assignments.unshift(assignment); // Add to beginning (latest first)
    writeDb(db);
  }
}

export function deleteAssignment(id: string): void {
  const db = readDb();
  db.assignments = db.assignments.filter(a => a.id !== id);
  writeDb(db);
}

export function updateAssignment(id: string, updated: Assignment): void {
  const db = readDb();
  const index = db.assignments.findIndex(a => a.id === id);
  if (index !== -1) {
    db.assignments[index] = { ...db.assignments[index], ...updated };
    writeDb(db);
  }
}

// Helper: Attempts
export function getAttempts(): QuizAttempt[] {
  return readDb().attempts;
}

export function addAttempt(attempt: QuizAttempt): void {
  const db = readDb();
  db.attempts.unshift(attempt);
  writeDb(db);
}

// Helper: Cheating Logs
export function getCheatingLogs(): CheatingLog[] {
  return readDb().cheatingLogs;
}

export function addCheatingLog(log: CheatingLog): void {
  const db = readDb();
  db.cheatingLogs.unshift(log);
  writeDb(db);
}
