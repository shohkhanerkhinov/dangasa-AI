import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';

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

// Helper: Users
export async function getUsers(): Promise<RegisteredUser[]> {
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(doc => doc.data() as RegisteredUser);
  } catch (error) {
    console.error("Failed to get users from Firestore:", error);
    return [];
  }
}

export async function findUserByEmail(email: string): Promise<RegisteredUser | undefined> {
  try {
    const docSnap = await getDoc(doc(db, 'users', email.toLowerCase().trim()));
    if (docSnap.exists()) {
      return docSnap.data() as RegisteredUser;
    }
    return undefined;
  } catch (error) {
    console.error("Failed to find user by email from Firestore:", error);
    return undefined;
  }
}

export async function addUser(user: RegisteredUser): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', user.email.toLowerCase().trim());
    await setDoc(userDocRef, user);
  } catch (error) {
    console.error("Failed to add user to Firestore:", error);
  }
}

export async function updateUserXp(email: string, xp: number, levelNumber: number): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', email.toLowerCase().trim());
    await updateDoc(userDocRef, { xp, levelNumber });
  } catch (error) {
    console.error("Failed to update user XP in Firestore:", error);
  }
}

export async function updateUserProfile(
  email: string,
  updatedData: { name: string; level: 'school' | 'college' | 'university'; profileImage?: string }
): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', email.toLowerCase().trim());
    const updatePayload: Record<string, any> = {
      name: updatedData.name,
      level: updatedData.level,
    };
    if (updatedData.profileImage) {
      updatePayload.profileImage = updatedData.profileImage;
    }
    await updateDoc(userDocRef, updatePayload);
  } catch (error) {
    console.error("Failed to update user profile in Firestore:", error);
  }
}

// Helper: Assignments
export async function getAssignments(): Promise<Assignment[]> {
  try {
    const snapshot = await getDocs(collection(db, 'assignments'));
    // Since we don't have default ordering, we'll sort them in memory if needed
    return snapshot.docs.map(doc => doc.data() as Assignment);
  } catch (error) {
    console.error("Failed to get assignments from Firestore:", error);
    return [];
  }
}

export async function getAssignmentById(id: string): Promise<Assignment | undefined> {
  try {
    const docSnap = await getDoc(doc(db, 'assignments', id));
    if (docSnap.exists()) {
      return docSnap.data() as Assignment;
    }
    return undefined;
  } catch (error) {
    console.error("Failed to get assignment by ID from Firestore:", error);
    return undefined;
  }
}

export async function addAssignment(assignment: Assignment): Promise<void> {
  try {
    const docRef = doc(db, 'assignments', assignment.id);
    await setDoc(docRef, assignment);
  } catch (error) {
    console.error("Failed to add assignment to Firestore:", error);
  }
}

export async function deleteAssignment(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'assignments', id));
  } catch (error) {
    console.error("Failed to delete assignment from Firestore:", error);
  }
}

export async function updateAssignment(id: string, updated: Assignment): Promise<void> {
  try {
    const docRef = doc(db, 'assignments', id);
    await setDoc(docRef, updated, { merge: true });
  } catch (error) {
    console.error("Failed to update assignment in Firestore:", error);
  }
}

// Helper: Attempts
export async function getAttempts(): Promise<QuizAttempt[]> {
  try {
    const snapshot = await getDocs(collection(db, 'attempts'));
    return snapshot.docs.map(doc => doc.data() as QuizAttempt);
  } catch (error) {
    console.error("Failed to get attempts from Firestore:", error);
    return [];
  }
}

export async function addAttempt(attempt: QuizAttempt): Promise<void> {
  try {
    const docRef = doc(db, 'attempts', attempt.id);
    await setDoc(docRef, attempt);
  } catch (error) {
    console.error("Failed to add attempt to Firestore:", error);
  }
}

// Helper: Cheating Logs
export async function getCheatingLogs(): Promise<CheatingLog[]> {
  try {
    const snapshot = await getDocs(collection(db, 'cheating_logs'));
    return snapshot.docs.map(doc => doc.data() as CheatingLog);
  } catch (error) {
    console.error("Failed to get cheating logs from Firestore:", error);
    return [];
  }
}

export async function addCheatingLog(log: CheatingLog): Promise<void> {
  try {
    const docRef = doc(db, 'cheating_logs', log.id);
    await setDoc(docRef, log);
  } catch (error) {
    console.error("Failed to add cheating log to Firestore:", error);
  }
}
