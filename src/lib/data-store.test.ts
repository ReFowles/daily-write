import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Goal, WritingSession } from "./types";

vi.mock("./firebase", () => ({
  getFirebaseDb: () => ({ __fake: true }),
}));

vi.mock("firebase/firestore", () => {
  const collection = vi.fn((_db: unknown, name: string) => ({ kind: "collection", name }));
  const doc = vi.fn((_dbOrCol: unknown, name: string, id?: string) => ({
    kind: "doc",
    name,
    id: id ?? "generated-id",
  }));
  const where = vi.fn((field: string, op: string, value: unknown) => ({ field, op, value }));
  const query = vi.fn(
    (
      colRef: { name: string },
      ...filters: Array<{ field: string; op: string; value: unknown }>
    ) => ({ kind: "query", colRef, filters })
  );
  const getDocs = vi.fn();
  const getDoc = vi.fn();
  const addDoc = vi.fn();
  const updateDoc = vi.fn();
  const deleteDoc = vi.fn();
  const Timestamp = { now: vi.fn(() => ({ __ts: "now" })) };

  return { collection, doc, where, query, getDocs, getDoc, addDoc, updateDoc, deleteDoc, Timestamp };
});

import {
  addDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  createGoal,
  createOrUpdateWritingSession,
  deleteGoal,
  deleteWritingSession,
  getAllGoals,
  getAllWritingSessions,
  getCurrentGoal,
  getGoalById,
  getWritingSessionByDate,
  getWritingSessionsInRange,
  getWritingStats,
  updateGoal,
} from "./data-store";

const getDocsMock = vi.mocked(getDocs);
const getDocMock = vi.mocked(getDoc);
const addDocMock = vi.mocked(addDoc);
const updateDocMock = vi.mocked(updateDoc);
const deleteDocMock = vi.mocked(deleteDoc);
const whereMock = vi.mocked(where);
const queryMock = vi.mocked(query);

// Build a snapshot object shaped like Firestore's QuerySnapshot for `getDocs`.
function snapshotFrom<T extends object>(items: Array<T & { id?: string }>) {
  return {
    empty: items.length === 0,
    docs: items.map((item, index) => ({
      id: item.id ?? `doc-${index}`,
      data: () => item,
    })),
  } as unknown as Awaited<ReturnType<typeof getDocs>>;
}

function docSnapshotFrom<T extends object>(data: (T & { id?: string }) | null) {
  return {
    exists: () => data !== null,
    id: data?.id ?? "doc-0",
    data: () => data,
  } as unknown as Awaited<ReturnType<typeof getDoc>>;
}

describe("data-store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("goals", () => {
    it("getAllGoals filters by userId and sorts by startDate desc", async () => {
      getDocsMock.mockResolvedValueOnce(
        snapshotFrom<Goal>([
          {
            id: "a",
            userId: "u1",
            startDate: "2026-01-01",
            endDate: "2026-01-31",
            dailyWordTarget: 500,
          },
          {
            id: "b",
            userId: "u1",
            startDate: "2026-03-01",
            endDate: "2026-03-31",
            dailyWordTarget: 300,
          },
        ])
      );

      const goals = await getAllGoals("u1");
      expect(whereMock).toHaveBeenCalledWith("userId", "==", "u1");
      expect(queryMock).toHaveBeenCalled();
      expect(goals.map((g) => g.id)).toEqual(["b", "a"]);
    });

    it("getGoalById returns null when the document does not exist", async () => {
      getDocMock.mockResolvedValueOnce(docSnapshotFrom(null));
      const result = await getGoalById("missing");
      expect(result).toBeNull();
    });

    it("getGoalById returns the goal payload when found", async () => {
      getDocMock.mockResolvedValueOnce(
        docSnapshotFrom<Goal>({
          id: "g1",
          userId: "u1",
          startDate: "2026-01-01",
          endDate: "2026-01-31",
          dailyWordTarget: 500,
        })
      );
      const goal = await getGoalById("g1");
      expect(goal?.id).toBe("g1");
      expect(goal?.dailyWordTarget).toBe(500);
    });

    it("createGoal persists the new goal and returns it with an id", async () => {
      addDocMock.mockResolvedValueOnce({ id: "new-id" } as unknown as Awaited<
        ReturnType<typeof addDoc>
      >);
      const created = await createGoal({
        userId: "u1",
        startDate: "2026-06-01",
        endDate: "2026-06-30",
        dailyWordTarget: 200,
      });

      expect(addDocMock).toHaveBeenCalledTimes(1);
      const [, payload] = addDocMock.mock.calls[0];
      expect(payload).toMatchObject({
        userId: "u1",
        startDate: "2026-06-01",
        endDate: "2026-06-30",
        dailyWordTarget: 200,
      });
      expect(created.id).toBe("new-id");
    });

    it("updateGoal forwards updates + updatedAt timestamp", async () => {
      updateDocMock.mockResolvedValueOnce(undefined);
      await updateGoal("g1", { dailyWordTarget: 999 });
      const [, payload] = updateDocMock.mock.calls[0];
      expect(payload).toMatchObject({ dailyWordTarget: 999 });
      expect(payload).toHaveProperty("updatedAt");
    });

    it("deleteGoal proxies to Firestore deleteDoc", async () => {
      deleteDocMock.mockResolvedValueOnce(undefined);
      await deleteGoal("g1");
      expect(deleteDocMock).toHaveBeenCalledTimes(1);
    });

    it("getCurrentGoal returns the goal whose range covers today", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 5, 15));
      try {
        getDocsMock.mockResolvedValueOnce(
          snapshotFrom<Goal>([
            {
              id: "past",
              userId: "u1",
              startDate: "2025-01-01",
              endDate: "2025-12-31",
              dailyWordTarget: 100,
            },
            {
              id: "current",
              userId: "u1",
              startDate: "2026-06-01",
              endDate: "2026-06-30",
              dailyWordTarget: 500,
            },
          ])
        );
        const current = await getCurrentGoal("u1");
        expect(current?.id).toBe("current");
      } finally {
        vi.useRealTimers();
      }
    });

    it("getCurrentGoal returns null when no goal covers today", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2030, 0, 1));
      try {
        getDocsMock.mockResolvedValueOnce(
          snapshotFrom<Goal>([
            {
              id: "past",
              userId: "u1",
              startDate: "2025-01-01",
              endDate: "2025-12-31",
              dailyWordTarget: 100,
            },
          ])
        );
        expect(await getCurrentGoal("u1")).toBeNull();
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe("writing sessions", () => {
    it("getAllWritingSessions sorts descending by date", async () => {
      getDocsMock.mockResolvedValueOnce(
        snapshotFrom<WritingSession>([
          { userId: "u1", date: "2026-01-05", wordCount: 100 },
          { userId: "u1", date: "2026-02-10", wordCount: 200 },
        ])
      );
      const sessions = await getAllWritingSessions("u1");
      expect(sessions.map((s) => s.date)).toEqual(["2026-02-10", "2026-01-05"]);
    });

    it("getWritingSessionByDate returns null when snapshot is empty", async () => {
      getDocsMock.mockResolvedValueOnce(snapshotFrom<WritingSession>([]));
      expect(await getWritingSessionByDate("u1", "2026-06-15")).toBeNull();
    });

    it("getWritingSessionByDate returns the first session", async () => {
      getDocsMock.mockResolvedValueOnce(
        snapshotFrom<WritingSession>([{ userId: "u1", date: "2026-06-15", wordCount: 250 }])
      );
      const session = await getWritingSessionByDate("u1", "2026-06-15");
      expect(session?.wordCount).toBe(250);
    });

    it("getWritingSessionsInRange filters by inclusive bounds and sorts ascending", async () => {
      getDocsMock.mockResolvedValueOnce(
        snapshotFrom<WritingSession>([
          { userId: "u1", date: "2026-05-31", wordCount: 100 },
          { userId: "u1", date: "2026-06-05", wordCount: 200 },
          { userId: "u1", date: "2026-06-15", wordCount: 300 },
          { userId: "u1", date: "2026-07-01", wordCount: 400 },
        ])
      );
      const sessions = await getWritingSessionsInRange("u1", "2026-06-01", "2026-06-30");
      expect(sessions.map((s) => s.date)).toEqual(["2026-06-05", "2026-06-15"]);
    });

    it("createOrUpdateWritingSession creates when none exists for the date", async () => {
      getDocsMock.mockResolvedValueOnce(snapshotFrom<WritingSession>([]));
      addDocMock.mockResolvedValueOnce({ id: "new" } as unknown as Awaited<
        ReturnType<typeof addDoc>
      >);

      await createOrUpdateWritingSession({ userId: "u1", date: "2026-06-15", wordCount: 250 });
      expect(addDocMock).toHaveBeenCalledTimes(1);
      expect(updateDocMock).not.toHaveBeenCalled();
    });

    it("createOrUpdateWritingSession updates the existing doc when present", async () => {
      getDocsMock.mockResolvedValueOnce(
        snapshotFrom<WritingSession & { id: string }>([
          { id: "existing", userId: "u1", date: "2026-06-15", wordCount: 100 },
        ])
      );
      updateDocMock.mockResolvedValueOnce(undefined);

      await createOrUpdateWritingSession({ userId: "u1", date: "2026-06-15", wordCount: 400 });
      expect(addDocMock).not.toHaveBeenCalled();
      expect(updateDocMock).toHaveBeenCalledTimes(1);
      const [, payload] = updateDocMock.mock.calls[0];
      expect(payload).toMatchObject({ wordCount: 400 });
    });

    it("deleteWritingSession is a no-op when the session is missing", async () => {
      getDocsMock.mockResolvedValueOnce(snapshotFrom<WritingSession>([]));
      await deleteWritingSession("u1", "2026-06-15");
      expect(deleteDocMock).not.toHaveBeenCalled();
    });

    it("deleteWritingSession removes the matching doc", async () => {
      getDocsMock.mockResolvedValueOnce(
        snapshotFrom<WritingSession & { id: string }>([
          { id: "s1", userId: "u1", date: "2026-06-15", wordCount: 100 },
        ])
      );
      deleteDocMock.mockResolvedValueOnce(undefined);
      await deleteWritingSession("u1", "2026-06-15");
      expect(deleteDocMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("getWritingStats", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 5, 15));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("aggregates totals, days written, and average", async () => {
      getDocsMock.mockResolvedValueOnce(
        snapshotFrom<WritingSession>([
          { userId: "u1", date: "2026-06-13", wordCount: 100 },
          { userId: "u1", date: "2026-06-14", wordCount: 200 },
          { userId: "u1", date: "2026-06-15", wordCount: 0 },
        ])
      );
      const stats = await getWritingStats("u1");
      expect(stats.totalWords).toBe(300);
      expect(stats.totalDaysWritten).toBe(2);
      expect(stats.averageWordsPerDay).toBe(150);
    });

    it("counts current streak from today backwards", async () => {
      getDocsMock.mockResolvedValueOnce(
        snapshotFrom<WritingSession>([
          { userId: "u1", date: "2026-06-13", wordCount: 100 },
          { userId: "u1", date: "2026-06-14", wordCount: 200 },
          { userId: "u1", date: "2026-06-15", wordCount: 300 },
        ])
      );
      const stats = await getWritingStats("u1");
      expect(stats.currentStreak).toBe(3);
    });

    it("breaks the streak on a zero-word day", async () => {
      getDocsMock.mockResolvedValueOnce(
        snapshotFrom<WritingSession>([
          { userId: "u1", date: "2026-06-14", wordCount: 200 },
          { userId: "u1", date: "2026-06-15", wordCount: 0 },
        ])
      );
      const stats = await getWritingStats("u1");
      expect(stats.currentStreak).toBe(0);
    });

    it("returns zeros for empty history", async () => {
      getDocsMock.mockResolvedValueOnce(snapshotFrom<WritingSession>([]));
      const stats = await getWritingStats("u1");
      expect(stats).toEqual({
        totalWords: 0,
        totalDaysWritten: 0,
        averageWordsPerDay: 0,
        currentStreak: 0,
      });
    });
  });
});
