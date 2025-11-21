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
  return date.toISOString().split("T")[0];
}

/**
 * Goals CRUD Operations
 */

export async function getAllGoals(): Promise<Goal[]> {
  const db = getFirebaseDb();
  const goalsRef = collection(db, GOALS_COLLECTION);
  const q = query(goalsRef, orderBy("startDate", "desc"));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as Goal));
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

export async function getCurrentGoal(): Promise<Goal | null> {
  const today = dateToString(new Date());
  const db = getFirebaseDb();
  const goalsRef = collection(db, GOALS_COLLECTION);
  
  // Query for goals where startDate <= today AND endDate >= today
  const q = query(
    goalsRef,
    where("startDate", "<=", today),
    where("endDate", ">=", today)
  );
  
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }
  
  const goalDoc = snapshot.docs[0];
  return {
    id: goalDoc.id,
    ...goalDoc.data(),
  } as Goal;
}

/**
 * Writing Sessions CRUD Operations
 */

export async function getAllWritingSessions(): Promise<WritingSession[]> {
  const db = getFirebaseDb();
  const sessionsRef = collection(db, SESSIONS_COLLECTION);
  const q = query(sessionsRef, orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc) => doc.data() as WritingSession);
}

export async function getWritingSessionByDate(
  date: string
): Promise<WritingSession | null> {
  const db = getFirebaseDb();
  const sessionsRef = collection(db, SESSIONS_COLLECTION);
  const q = query(sessionsRef, where("date", "==", date));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }
  
  return snapshot.docs[0].data() as WritingSession;
}

export async function getWritingSessionsInRange(
  startDate: string,
  endDate: string
): Promise<WritingSession[]> {
  const db = getFirebaseDb();
  const sessionsRef = collection(db, SESSIONS_COLLECTION);
  const q = query(
    sessionsRef,
    where("date", ">=", startDate),
    where("date", "<=", endDate),
    orderBy("date", "asc")
  );
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc) => doc.data() as WritingSession);
}

export async function createOrUpdateWritingSession(
  session: WritingSession
): Promise<void> {
  const db = getFirebaseDb();
  const sessionsRef = collection(db, SESSIONS_COLLECTION);
  
  // Check if session already exists for this date
  const q = query(sessionsRef, where("date", "==", session.date));
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

export async function deleteWritingSession(date: string): Promise<void> {
  const db = getFirebaseDb();
  const sessionsRef = collection(db, SESSIONS_COLLECTION);
  const q = query(sessionsRef, where("date", "==", date));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    const sessionDoc = snapshot.docs[0];
    await deleteDoc(doc(db, SESSIONS_COLLECTION, sessionDoc.id));
  }
}

/**
 * Statistics and Analytics
 */

export async function getWritingStats(): Promise<{
  totalWords: number;
  totalDaysWritten: number;
  averageWordsPerDay: number;
  currentStreak: number;
}> {
  const sessions = await getAllWritingSessions();
  
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
