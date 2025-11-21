/**
 * Data store service layer for Firebase Firestore
 * Provides CRUD operations for goals and writing sessions
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { getFirebaseDb } from "./firebase";
import type { Goal, WritingSession } from "./types";

const GOALS_COLLECTION = "goals";
const SESSIONS_COLLECTION = "writingSessions";

// Helper function to convert Firestore dates to YYYY-MM-DD format
function dateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Goals CRUD Operations
 */

export async function getAllGoals(userId: string): Promise<Goal[]> {
  const db = getFirebaseDb();
  const goalsRef = collection(db, GOALS_COLLECTION);
  const q = query(
    goalsRef,
    where("userId", "==", userId)
  );
  const snapshot = await getDocs(q);
  
  const goals = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as Goal));
  
  // Sort client-side to avoid needing a composite index
  return goals.sort((a, b) => b.startDate.localeCompare(a.startDate));
}

export async function getGoalById(goalId: string): Promise<Goal | null> {
  const db = getFirebaseDb();
  const goalRef = doc(db, GOALS_COLLECTION, goalId);
  const goalDoc = await getDoc(goalRef);
  
  if (!goalDoc.exists()) {
    return null;
  }
  
  return {
    id: goalDoc.id,
    ...goalDoc.data(),
  } as Goal;
}

export async function createGoal(
  goalData: Omit<Goal, "id">
): Promise<Goal> {
  const db = getFirebaseDb();
  const goalsRef = collection(db, GOALS_COLLECTION);
  
  const docRef = await addDoc(goalsRef, {
    ...goalData,
    createdAt: Timestamp.now(),
  });
  
  return {
    id: docRef.id,
    ...goalData,
  };
}

export async function updateGoal(
  goalId: string,
  updates: Partial<Omit<Goal, "id">>
): Promise<void> {
  const db = getFirebaseDb();
  const goalRef = doc(db, GOALS_COLLECTION, goalId);
  
  await updateDoc(goalRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteGoal(goalId: string): Promise<void> {
  const db = getFirebaseDb();
  const goalRef = doc(db, GOALS_COLLECTION, goalId);
  await deleteDoc(goalRef);
}

export async function getCurrentGoal(userId: string): Promise<Goal | null> {
  const today = dateToString(new Date());
  
  // Fetch all goals and filter client-side to avoid needing a composite index
  const allGoals = await getAllGoals(userId);
  
  const currentGoal = allGoals.find(
    (goal) => goal.startDate <= today && goal.endDate >= today
  );
  
  return currentGoal || null;
}

/**
 * Writing Sessions CRUD Operations
 */

export async function getAllWritingSessions(userId: string): Promise<WritingSession[]> {
  const db = getFirebaseDb();
  const sessionsRef = collection(db, SESSIONS_COLLECTION);
  const q = query(
    sessionsRef,
    where("userId", "==", userId)
  );
  const snapshot = await getDocs(q);
  
  const sessions = snapshot.docs.map((doc) => doc.data() as WritingSession);
  
  // Sort client-side to avoid needing a composite index
  return sessions.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getWritingSessionByDate(
  userId: string,
  date: string
): Promise<WritingSession | null> {
  const db = getFirebaseDb();
  const sessionsRef = collection(db, SESSIONS_COLLECTION);
  const q = query(
    sessionsRef,
    where("userId", "==", userId),
    where("date", "==", date)
  );
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }
  
  return snapshot.docs[0].data() as WritingSession;
}

export async function getWritingSessionsInRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<WritingSession[]> {
  // Fetch all sessions for user and filter client-side to avoid composite index
  const allSessions = await getAllWritingSessions(userId);
  
  return allSessions
    .filter(session => session.date >= startDate && session.date <= endDate)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function createOrUpdateWritingSession(
  session: WritingSession
): Promise<void> {
  const db = getFirebaseDb();
  const sessionsRef = collection(db, SESSIONS_COLLECTION);
  
  // Check if session already exists for this date and user
  const q = query(
    sessionsRef,
    where("userId", "==", session.userId),
    where("date", "==", session.date)
  );
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    // Create new session
    await addDoc(sessionsRef, {
      ...session,
      createdAt: Timestamp.now(),
    });
  } else {
    // Update existing session
    const sessionDoc = snapshot.docs[0];
    await updateDoc(doc(db, SESSIONS_COLLECTION, sessionDoc.id), {
      wordCount: session.wordCount,
      updatedAt: Timestamp.now(),
    });
  }
}

export async function deleteWritingSession(userId: string, date: string): Promise<void> {
  const db = getFirebaseDb();
  const sessionsRef = collection(db, SESSIONS_COLLECTION);
  const q = query(
    sessionsRef,
    where("userId", "==", userId),
    where("date", "==", date)
  );
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    const sessionDoc = snapshot.docs[0];
    await deleteDoc(doc(db, SESSIONS_COLLECTION, sessionDoc.id));
  }
}

/**
 * Statistics and Analytics
 */

export async function getWritingStats(userId: string): Promise<{
  totalWords: number;
  totalDaysWritten: number;
  averageWordsPerDay: number;
  currentStreak: number;
}> {
  const sessions = await getAllWritingSessions(userId);
  
  const totalWords = sessions.reduce((sum, session) => sum + session.wordCount, 0);
  const totalDaysWritten = sessions.filter((session) => session.wordCount > 0).length;
  const averageWordsPerDay = totalDaysWritten > 0 ? Math.round(totalWords / totalDaysWritten) : 0;
  
  // Calculate current streak
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(today);
  
  while (true) {
    const dateString = dateToString(checkDate);
    const session = sessions.find((s) => s.date === dateString);
    
    if (session && session.wordCount > 0) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return {
    totalWords,
    totalDaysWritten,
    averageWordsPerDay,
    currentStreak: streak,
  };
}

/**
 * Data Migration Utilities
 */

export async function importDummyData(
  goals: Omit<Goal, "id">[],
  sessions: WritingSession[]
): Promise<void> {
  // Import goals
  for (const goal of goals) {
    await createGoal(goal);
  }
  
  // Import sessions
  for (const session of sessions) {
    await createOrUpdateWritingSession(session);
  }
}
