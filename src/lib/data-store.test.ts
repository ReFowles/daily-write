import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Goal, WritingSession } from "./types";

const TEST_EMAIL = "u1";

const { getMock, addMock, docGetMock, updateMock, deleteMock, whereMock, collectionMock } =
  vi.hoisted(() => {
    const getMock = vi.fn();
    const addMock = vi.fn();
    const docGetMock = vi.fn();
    const updateMock = vi.fn();
    const deleteMock = vi.fn();

    const docRef = { get: docGetMock, update: updateMock, delete: deleteMock };
    const docMock = vi.fn(() => docRef);

    const queryRef = {
      where: vi.fn(),
      get: getMock,
      add: addMock,
      doc: docMock,
    };
    queryRef.where.mockImplementation(() => queryRef);

    const collectionMock = vi.fn(() => queryRef);

    return {
      getMock,
      addMock,
      docGetMock,
      updateMock,
      deleteMock,
      whereMock: queryRef.where,
      collectionMock,
    };
  });

vi.mock("./firebase-admin", () => ({
  getAdminDb: () => ({ collection: collectionMock }),
}));

vi.mock("firebase-admin/firestore", () => ({
  Timestamp: { now: vi.fn(() => ({ __ts: "now" })) },
}));

vi.mock("./auth", () => ({
  auth: vi.fn(async () => ({ user: { email: TEST_EMAIL } })),
}));

import {
  addFavoriteDoc,
  createGoal,
  createOrUpdateWritingSession,
  deleteGoal,
  deleteWritingSession,
  getAllGoals,
  getAllWritingSessions,
  getCurrentGoal,
  getFavoriteDocIds,
  getGoalById,
  getWritingSessionByDate,
  getWritingSessionsInRange,
  getWritingStats,
  removeFavoriteDoc,
  updateGoal,
} from "./data-store";

// Build a snapshot object shaped like the Admin SDK's QuerySnapshot for `.get()`.
function snapshotFrom<T extends object>(items: Array<T & { id?: string }>) {
  return {
    empty: items.length === 0,
    docs: items.map((item, index) => ({
      id: item.id ?? `doc-${index}`,
      ref: { update: updateMock, delete: deleteMock },
      data: () => item,
    })),
  };
}

function docSnapshotFrom<T extends object>(data: (T & { id?: string }) | null) {
  return {
    exists: data !== null,
    id: data?.id ?? "doc-0",
    data: () => data,
  };
}

describe("data-store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("goals", () => {
    it("getAllGoals filters by userId and sorts by startDate desc", async () => {
      getMock.mockResolvedValueOnce(
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
      expect(goals.map((g) => g.id)).toEqual(["b", "a"]);
    });

    it("getGoalById returns null when the document does not exist", async () => {
      docGetMock.mockResolvedValueOnce(docSnapshotFrom(null));
      const result = await getGoalById("missing");
      expect(result).toBeNull();
    });

    it("getGoalById returns the goal payload when found", async () => {
      docGetMock.mockResolvedValueOnce(
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
      addMock.mockResolvedValueOnce({ id: "new-id" });
      const created = await createGoal({
        userId: "u1",
        startDate: "2026-06-01",
        endDate: "2026-06-30",
        dailyWordTarget: 200,
      });

      expect(addMock).toHaveBeenCalledTimes(1);
      const [payload] = addMock.mock.calls[0];
      expect(payload).toMatchObject({
        userId: "u1",
        startDate: "2026-06-01",
        endDate: "2026-06-30",
        dailyWordTarget: 200,
      });
      expect(created.id).toBe("new-id");
    });

    it("updateGoal forwards updates + updatedAt timestamp", async () => {
      docGetMock.mockResolvedValueOnce(docSnapshotFrom<Goal>({ id: "g1", userId: "u1" } as Goal));
      updateMock.mockResolvedValueOnce(undefined);
      await updateGoal("g1", { dailyWordTarget: 999 });
      const [payload] = updateMock.mock.calls[0];
      expect(payload).toMatchObject({ dailyWordTarget: 999 });
      expect(payload).toHaveProperty("updatedAt");
    });

    it("deleteGoal proxies to Firestore delete", async () => {
      docGetMock.mockResolvedValueOnce(docSnapshotFrom<Goal>({ id: "g1", userId: "u1" } as Goal));
      deleteMock.mockResolvedValueOnce(undefined);
      await deleteGoal("g1");
      expect(deleteMock).toHaveBeenCalledTimes(1);
    });

    it("updateGoal rejects when the goal belongs to another user", async () => {
      docGetMock.mockResolvedValueOnce(
        docSnapshotFrom<Goal>({ id: "g1", userId: "someone-else" } as Goal)
      );
      await expect(updateGoal("g1", { dailyWordTarget: 999 })).rejects.toThrow("Unauthorized");
    });

    it("getCurrentGoal returns the goal whose range covers today", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 5, 15));
      try {
        getMock.mockResolvedValueOnce(
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
        getMock.mockResolvedValueOnce(
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
      getMock.mockResolvedValueOnce(
        snapshotFrom<WritingSession>([
          { userId: "u1", date: "2026-01-05", wordCount: 100 },
          { userId: "u1", date: "2026-02-10", wordCount: 200 },
        ])
      );
      const sessions = await getAllWritingSessions("u1");
      expect(sessions.map((s) => s.date)).toEqual(["2026-02-10", "2026-01-05"]);
    });

    it("getWritingSessionByDate returns null when snapshot is empty", async () => {
      getMock.mockResolvedValueOnce(snapshotFrom<WritingSession>([]));
      expect(await getWritingSessionByDate("u1", "2026-06-15")).toBeNull();
    });

    it("getWritingSessionByDate returns the first session", async () => {
      getMock.mockResolvedValueOnce(
        snapshotFrom<WritingSession>([{ userId: "u1", date: "2026-06-15", wordCount: 250 }])
      );
      const session = await getWritingSessionByDate("u1", "2026-06-15");
      expect(session?.wordCount).toBe(250);
    });

    it("getWritingSessionsInRange filters by inclusive bounds and sorts ascending", async () => {
      getMock.mockResolvedValueOnce(
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
      getMock.mockResolvedValueOnce(snapshotFrom<WritingSession>([]));
      addMock.mockResolvedValueOnce({ id: "new" });

      await createOrUpdateWritingSession({ userId: "u1", date: "2026-06-15", wordCount: 250 });
      expect(addMock).toHaveBeenCalledTimes(1);
      expect(updateMock).not.toHaveBeenCalled();
    });

    it("createOrUpdateWritingSession updates the existing doc when present", async () => {
      getMock.mockResolvedValueOnce(
        snapshotFrom<WritingSession & { id: string }>([
          { id: "existing", userId: "u1", date: "2026-06-15", wordCount: 100 },
        ])
      );
      updateMock.mockResolvedValueOnce(undefined);

      await createOrUpdateWritingSession({ userId: "u1", date: "2026-06-15", wordCount: 400 });
      expect(addMock).not.toHaveBeenCalled();
      expect(updateMock).toHaveBeenCalledTimes(1);
      const [payload] = updateMock.mock.calls[0];
      expect(payload).toMatchObject({ wordCount: 400 });
    });

    it("deleteWritingSession is a no-op when the session is missing", async () => {
      getMock.mockResolvedValueOnce(snapshotFrom<WritingSession>([]));
      await deleteWritingSession("u1", "2026-06-15");
      expect(deleteMock).not.toHaveBeenCalled();
    });

    it("deleteWritingSession removes the matching doc", async () => {
      getMock.mockResolvedValueOnce(
        snapshotFrom<WritingSession & { id: string }>([
          { id: "s1", userId: "u1", date: "2026-06-15", wordCount: 100 },
        ])
      );
      deleteMock.mockResolvedValueOnce(undefined);
      await deleteWritingSession("u1", "2026-06-15");
      expect(deleteMock).toHaveBeenCalledTimes(1);
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
      getMock.mockResolvedValueOnce(
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
      getMock.mockResolvedValueOnce(
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
      getMock.mockResolvedValueOnce(
        snapshotFrom<WritingSession>([
          { userId: "u1", date: "2026-06-14", wordCount: 200 },
          { userId: "u1", date: "2026-06-15", wordCount: 0 },
        ])
      );
      const stats = await getWritingStats("u1");
      expect(stats.currentStreak).toBe(0);
    });

    it("returns zeros for empty history", async () => {
      getMock.mockResolvedValueOnce(snapshotFrom<WritingSession>([]));
      const stats = await getWritingStats("u1");
      expect(stats).toEqual({
        totalWords: 0,
        totalDaysWritten: 0,
        averageWordsPerDay: 0,
        currentStreak: 0,
      });
    });
  });

  describe("doc favorites", () => {
    it("getFavoriteDocIds returns the docIds stored for the user", async () => {
      getMock.mockResolvedValueOnce(
        snapshotFrom([
          { userId: "u1", docId: "a" },
          { userId: "u1", docId: "b" },
        ])
      );
      const ids = await getFavoriteDocIds("u1");
      expect(whereMock).toHaveBeenCalledWith("userId", "==", "u1");
      expect(ids).toEqual(["a", "b"]);
    });

    it("addFavoriteDoc is a no-op when the favorite already exists", async () => {
      getMock.mockResolvedValueOnce(
        snapshotFrom([{ id: "existing", userId: "u1", docId: "doc-1" }])
      );
      await addFavoriteDoc("u1", "doc-1");
      expect(addMock).not.toHaveBeenCalled();
    });

    it("addFavoriteDoc writes a new favorite when missing", async () => {
      getMock.mockResolvedValueOnce(snapshotFrom([]));
      addMock.mockResolvedValueOnce({ id: "new" });

      await addFavoriteDoc("u1", "doc-1");
      expect(addMock).toHaveBeenCalledTimes(1);
      const [payload] = addMock.mock.calls[0];
      expect(payload).toMatchObject({ userId: "u1", docId: "doc-1" });
    });

    it("removeFavoriteDoc deletes each matching entry", async () => {
      getMock.mockResolvedValueOnce(
        snapshotFrom([
          { id: "f1", userId: "u1", docId: "doc-1" },
          { id: "f2", userId: "u1", docId: "doc-1" },
        ])
      );
      deleteMock.mockResolvedValue(undefined);
      await removeFavoriteDoc("u1", "doc-1");
      expect(deleteMock).toHaveBeenCalledTimes(2);
    });

    it("removeFavoriteDoc is a no-op when nothing matches", async () => {
      getMock.mockResolvedValueOnce(snapshotFrom([]));
      await removeFavoriteDoc("u1", "doc-1");
      expect(deleteMock).not.toHaveBeenCalled();
    });
  });
});
