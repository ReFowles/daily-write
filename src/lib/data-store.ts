"use server";

/**
 * Data store service layer for Firebase Firestore
 * Server Actions only — the client never talks to Firestore directly.
 * Uses the Admin SDK, which bypasses firestore.rules, so every function here
 * enforces its own authorization against the NextAuth session.
 */

import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "./firebase-admin";
import { auth } from "./auth";
import { daysBetweenInclusive, toDateString } from "./date-utils";
import type { Goal, GoalKind, GoalMode, WritingSession } from "./types";

const GOALS_COLLECTION = "goals";
const SESSIONS_COLLECTION = "writingSessions";
const DOC_FAVORITES_COLLECTION = "docFavorites";

// Ownership mismatch is always a hard error; missing session is left to the
// caller to handle (writes throw, reads no-op) so an in-flight read during
// sign-out doesn't surface a scary "Unauthorized" in the dev overlay.
type AuthStatus = "authorized" | "signed-out";

async function checkUserId(expectedUserId: string): Promise<AuthStatus> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return "signed-out";
  if (email !== expectedUserId) {
    throw new Error("Unauthorized");
  }
  return "authorized";
}

async function requireUserId(expectedUserId: string): Promise<void> {
  if ((await checkUserId(expectedUserId)) === "signed-out") {
    throw new Error("Unauthorized");
  }
}

function toGoal(id: string, data: FirebaseFirestore.DocumentData): Goal {
  const dailyWordTarget: number = data.dailyWordTarget;
  // Legacy docs pre-date `mode`/`totalWordTarget`; treat them as static goals
  // and derive the total from the daily target × span so downstream math works.
  const mode: GoalMode = data.mode === "live" ? "live" : "static";
  const totalWordTarget: number =
    typeof data.totalWordTarget === "number"
      ? data.totalWordTarget
      : dailyWordTarget * daysBetweenInclusive(data.startDate, data.endDate);

  const kind: GoalKind = data.kind === "manual" ? "manual" : "writing";

  return {
    id,
    userId: data.userId,
    startDate: data.startDate,
    endDate: data.endDate,
    dailyWordTarget,
    totalWordTarget,
    mode,
    kind,
    ...(kind === "manual"
      ? {
          unitLabel: typeof data.unitLabel === "string" ? data.unitLabel : "",
          completedUnits: typeof data.completedUnits === "number" ? data.completedUnits : 0,
        }
      : {}),
    casual: data.casual === true,
    excludedDays: toStringArray(data.excludedDays),
    cheatDaysAllowed: typeof data.cheatDaysAllowed === "number" ? data.cheatDaysAllowed : 0,
    cheatDaysUsed: toStringArray(data.cheatDaysUsed),
    cheatDaysReduceTotal: data.cheatDaysReduceTotal === true,
    rollover: data.rollover === true,
    rolloverDays: toStringArray(data.rolloverDays),
  };
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function toWritingSession(data: FirebaseFirestore.DocumentData): WritingSession {
  return {
    userId: data.userId,
    date: data.date,
    wordCount: data.wordCount,
  };
}

// Verifies the caller owns the goal and returns its ref for update/delete.
async function requireGoalOwnership(
  goalId: string
): Promise<FirebaseFirestore.DocumentReference> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    throw new Error("Unauthorized");
  }

  const goalRef = getAdminDb().collection(GOALS_COLLECTION).doc(goalId);
  const goalDoc = await goalRef.get();
  if (!goalDoc.exists || goalDoc.data()?.userId !== email) {
    throw new Error("Unauthorized");
  }

  return goalRef;
}

/**
 * Goals CRUD Operations
 */

export async function getAllGoals(userId: string): Promise<Goal[]> {
  if ((await checkUserId(userId)) === "signed-out") return [];

  const snapshot = await getAdminDb()
    .collection(GOALS_COLLECTION)
    .where("userId", "==", userId)
    .get();

  const goals = snapshot.docs.map((doc) => toGoal(doc.id, doc.data()));

  // Sort client-side to avoid needing a composite index
  return goals.sort((a, b) => b.startDate.localeCompare(a.startDate));
}

export async function getGoalById(goalId: string): Promise<Goal | null> {
  const goalRef = getAdminDb().collection(GOALS_COLLECTION).doc(goalId);
  const goalDoc = await goalRef.get();

  if (!goalDoc.exists) {
    return null;
  }

  const data = goalDoc.data()!;
  await requireUserId(data.userId);

  return toGoal(goalDoc.id, data);
}

export async function createGoal(goalData: Omit<Goal, "id">): Promise<Goal> {
  await requireUserId(goalData.userId);

  const docRef = await getAdminDb()
    .collection(GOALS_COLLECTION)
    .add({
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
  const goalRef = await requireGoalOwnership(goalId);

  await goalRef.update({
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteGoal(goalId: string): Promise<void> {
  const goalRef = await requireGoalOwnership(goalId);
  await goalRef.delete();
}

/**
 * Adjusts a manual goal's completion counter by `delta`, clamping the result to
 * [0, totalWordTarget] server-side so the count can never go negative or exceed
 * the target. Returns the new completed count.
 */
export async function adjustManualProgress(goalId: string, delta: number): Promise<number> {
  const goalRef = await requireGoalOwnership(goalId);
  const snapshot = await goalRef.get();
  const data = snapshot.data()!;

  if (data.kind !== "manual") {
    throw new Error("Not a manual goal");
  }

  const total = typeof data.totalWordTarget === "number" ? data.totalWordTarget : 0;
  const current = typeof data.completedUnits === "number" ? data.completedUnits : 0;
  const next = Math.max(0, Math.min(total, current + delta));

  await goalRef.update({
    completedUnits: next,
    updatedAt: Timestamp.now(),
  });

  return next;
}

/**
 * Toggles a cheat day on/off for the given date, enforcing the goal's cheat-day
 * allowance server-side. Returns the updated list of spent cheat days.
 */
export async function toggleCheatDay(goalId: string, date: string): Promise<string[]> {
  const goalRef = await requireGoalOwnership(goalId);
  const snapshot = await goalRef.get();
  const data = snapshot.data()!;

  const allowed = typeof data.cheatDaysAllowed === "number" ? data.cheatDaysAllowed : 0;
  const used: string[] = Array.isArray(data.cheatDaysUsed)
    ? data.cheatDaysUsed.filter((d: unknown): d is string => typeof d === "string")
    : [];

  let next: string[];
  if (used.includes(date)) {
    next = used.filter((d) => d !== date);
  } else {
    if (used.length >= allowed) {
      throw new Error("No cheat days remaining");
    }
    next = [...used, date].sort();
  }

  await goalRef.update({
    cheatDaysUsed: next,
    updatedAt: Timestamp.now(),
  });

  return next;
}

/**
 * Toggles whether a deficit day is rescued with rolled-over excess. Only the
 * membership is stored here; whether enough earlier excess actually exists is
 * derived client-side from the writing sessions. Returns the updated list.
 */
export async function toggleRolloverDay(goalId: string, date: string): Promise<string[]> {
  const goalRef = await requireGoalOwnership(goalId);
  const snapshot = await goalRef.get();
  const data = snapshot.data()!;

  if (data.rollover !== true) {
    throw new Error("Rollover is not enabled for this goal");
  }

  const used: string[] = Array.isArray(data.rolloverDays)
    ? data.rolloverDays.filter((d: unknown): d is string => typeof d === "string")
    : [];

  const next = used.includes(date)
    ? used.filter((d) => d !== date)
    : [...used, date].sort();

  await goalRef.update({
    rolloverDays: next,
    updatedAt: Timestamp.now(),
  });

  return next;
}

export async function getCurrentGoal(userId: string): Promise<Goal | null> {
  const today = toDateString(new Date());

  // Fetch all goals and filter client-side to avoid needing a composite index
  const allGoals = await getAllGoals(userId);

  const currentGoal = allGoals.find((goal) => goal.startDate <= today && goal.endDate >= today);

  return currentGoal || null;
}

/**
 * Writing Sessions CRUD Operations
 */

export async function getAllWritingSessions(userId: string): Promise<WritingSession[]> {
  if ((await checkUserId(userId)) === "signed-out") return [];

  const snapshot = await getAdminDb()
    .collection(SESSIONS_COLLECTION)
    .where("userId", "==", userId)
    .get();

  const sessions = snapshot.docs.map((doc) => toWritingSession(doc.data()));

  // Sort client-side to avoid needing a composite index
  return sessions.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getWritingSessionByDate(
  userId: string,
  date: string
): Promise<WritingSession | null> {
  if ((await checkUserId(userId)) === "signed-out") return null;

  const snapshot = await getAdminDb()
    .collection(SESSIONS_COLLECTION)
    .where("userId", "==", userId)
    .where("date", "==", date)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return toWritingSession(snapshot.docs[0].data());
}

export async function getWritingSessionsInRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<WritingSession[]> {
  // Fetch all sessions for user and filter client-side to avoid composite index
  const allSessions = await getAllWritingSessions(userId);

  return allSessions
    .filter((session) => session.date >= startDate && session.date <= endDate)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function createOrUpdateWritingSession(session: WritingSession): Promise<void> {
  await requireUserId(session.userId);

  const sessionsRef = getAdminDb().collection(SESSIONS_COLLECTION);
  const snapshot = await sessionsRef
    .where("userId", "==", session.userId)
    .where("date", "==", session.date)
    .get();

  if (snapshot.empty) {
    // Create new session
    await sessionsRef.add({
      ...session,
      createdAt: Timestamp.now(),
    });
  } else {
    // Update existing session
    const sessionDoc = snapshot.docs[0];
    await sessionDoc.ref.update({
      wordCount: session.wordCount,
      updatedAt: Timestamp.now(),
    });
  }
}

export async function deleteWritingSession(userId: string, date: string): Promise<void> {
  await requireUserId(userId);

  const snapshot = await getAdminDb()
    .collection(SESSIONS_COLLECTION)
    .where("userId", "==", userId)
    .where("date", "==", date)
    .get();

  await Promise.all(snapshot.docs.map((d) => d.ref.delete()));
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
    const dateString = toDateString(checkDate);
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

/**
 * Google Doc Favorites
 *
 * Stores only the doc id — the title/metadata is resolved from Drive on load so
 * a favorited doc's title stays authoritative in Google Docs.
 */

export async function getFavoriteDocIds(userId: string): Promise<string[]> {
  if ((await checkUserId(userId)) === "signed-out") return [];

  const snapshot = await getAdminDb()
    .collection(DOC_FAVORITES_COLLECTION)
    .where("userId", "==", userId)
    .get();

  return snapshot.docs
    .map((d) => (d.data() as { docId?: unknown }).docId)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
}

export async function addFavoriteDoc(userId: string, docId: string): Promise<void> {
  await requireUserId(userId);

  const ref = getAdminDb().collection(DOC_FAVORITES_COLLECTION);
  const existing = await ref.where("userId", "==", userId).where("docId", "==", docId).get();
  if (!existing.empty) return;

  await ref.add({
    userId,
    docId,
    createdAt: Timestamp.now(),
  });
}

export async function removeFavoriteDoc(userId: string, docId: string): Promise<void> {
  await requireUserId(userId);

  const snapshot = await getAdminDb()
    .collection(DOC_FAVORITES_COLLECTION)
    .where("userId", "==", userId)
    .where("docId", "==", docId)
    .get();

  await Promise.all(snapshot.docs.map((d) => d.ref.delete()));
}
