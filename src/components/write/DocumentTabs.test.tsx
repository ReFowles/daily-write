import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DocumentTabs from "./DocumentTabs";
import type { DocumentTab } from "@/lib/types";

const tab = (over: Partial<DocumentTab> = {}): DocumentTab => ({
  tabId: "t1",
  title: "Tab 1",
  index: 0,
  nestingLevel: 0,
  ...over,
});

describe("DocumentTabs", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // Routes fetch calls by the `action` field so a test can specify the initial
  // getTabs payload and each mutation's response independently.
  function mockActions(handlers: {
    getTabs: DocumentTab[];
    createTab?: { tabs: DocumentTab[]; created: DocumentTab | null; revisionId?: string };
    updateTab?: { tabs: DocumentTab[]; revisionId?: string };
    deleteTab?: { tabs: DocumentTab[]; revisionId?: string };
  }) {
    fetchMock.mockImplementation((_url: string, init: RequestInit) => {
      const body = JSON.parse(init.body as string);
      const payload =
        body.action === "getTabs"
          ? { tabs: handlers.getTabs }
          : body.action === "createTab"
            ? handlers.createTab
            : body.action === "updateTab"
              ? handlers.updateTab
              : handlers.deleteTab;
      return Promise.resolve({ ok: true, json: async () => payload });
    });
  }

  function lastBody() {
    const call = fetchMock.mock.calls.at(-1)!;
    return JSON.parse((call[1] as RequestInit).body as string);
  }

  it("renders the tab bar even when the document has a single tab", async () => {
    mockActions({ getTabs: [tab()] });
    const onSelectTab = vi.fn();

    render(<DocumentTabs documentId="doc-1" onSelectTab={onSelectTab} selectedTabId="t1" />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^tab 1$/i })).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /add tab/i })).toBeInTheDocument();
  });

  it("auto-selects the first tab and renders every tab as a button", async () => {
    mockActions({ getTabs: [tab(), tab({ tabId: "t2", title: "Tab 2", index: 1 })] });
    const onSelectTab = vi.fn();
    const onTabsChange = vi.fn();

    render(
      <DocumentTabs
        documentId="doc-1"
        onSelectTab={onSelectTab}
        onTabsChange={onTabsChange}
        selectedTabId="t1"
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^tab 1$/i })).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /^tab 2$/i })).toBeInTheDocument();

    expect(onSelectTab).toHaveBeenCalledWith(expect.objectContaining({ tabId: "t1" }));
    expect(onTabsChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ tabId: "t1" }),
        expect.objectContaining({ tabId: "t2" }),
      ])
    );
  });

  it("calls onSelectTab when the user clicks another tab", async () => {
    mockActions({ getTabs: [tab(), tab({ tabId: "t2", title: "Tab 2", index: 1 })] });
    const onSelectTab = vi.fn();

    render(<DocumentTabs documentId="doc-1" onSelectTab={onSelectTab} selectedTabId="t1" />);

    await waitFor(() => screen.getByRole("button", { name: /^tab 2$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^tab 2$/i }));

    expect(onSelectTab).toHaveBeenLastCalledWith(expect.objectContaining({ tabId: "t2" }));
  });

  it("creates a new tab and drops into rename mode for it", async () => {
    const created = tab({ tabId: "t2", title: "New tab", index: 1 });
    mockActions({
      getTabs: [tab()],
      createTab: { tabs: [tab(), created], created },
    });
    const onSelectTab = vi.fn();

    render(<DocumentTabs documentId="doc-1" onSelectTab={onSelectTab} selectedTabId="t1" />);

    await waitFor(() => screen.getByRole("button", { name: /add tab/i }));
    fireEvent.click(screen.getByRole("button", { name: /add tab/i }));

    await waitFor(() => {
      expect(lastBody()).toMatchObject({ action: "createTab", title: "New tab" });
    });
    expect(onSelectTab).toHaveBeenLastCalledWith(expect.objectContaining({ tabId: "t2" }));
    expect(screen.getByLabelText(/rename tab new tab/i)).toBeInTheDocument();
  });

  it("creates a sub-tab under the selected tab", async () => {
    const created = tab({
      tabId: "t2",
      title: "New sub-tab",
      index: 0,
      nestingLevel: 1,
      parentTabId: "t1",
    });
    mockActions({
      getTabs: [tab()],
      createTab: { tabs: [tab(), created], created },
    });

    render(<DocumentTabs documentId="doc-1" onSelectTab={vi.fn()} selectedTabId="t1" />);

    await waitFor(() => screen.getByRole("button", { name: /add sub-tab under tab 1/i }));
    fireEvent.click(screen.getByRole("button", { name: /add sub-tab under tab 1/i }));

    await waitFor(() => {
      expect(lastBody()).toMatchObject({ action: "createTab", parentTabId: "t1" });
    });
  });

  it("renames a tab via the gear menu and Enter", async () => {
    mockActions({
      getTabs: [tab()],
      updateTab: { tabs: [tab({ title: "Prologue" })] },
    });

    render(<DocumentTabs documentId="doc-1" onSelectTab={vi.fn()} selectedTabId="t1" />);

    await waitFor(() => screen.getByRole("button", { name: /tab options for tab 1/i }));
    fireEvent.click(screen.getByRole("button", { name: /tab options for tab 1/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /rename tab tab 1/i }));

    const input = screen.getByLabelText(/rename tab tab 1/i);
    fireEvent.change(input, { target: { value: "Prologue" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(lastBody()).toMatchObject({ action: "updateTab", tabId: "t1", title: "Prologue" });
    });
  });

  it("deletes a tab via the gear menu and selects the first remaining one", async () => {
    mockActions({
      getTabs: [tab(), tab({ tabId: "t2", title: "Tab 2", index: 1 })],
      deleteTab: { tabs: [tab()] },
    });
    const onSelectTab = vi.fn();

    render(<DocumentTabs documentId="doc-1" onSelectTab={onSelectTab} selectedTabId="t2" />);

    await waitFor(() => screen.getByRole("button", { name: /tab options for tab 2/i }));
    fireEvent.click(screen.getByRole("button", { name: /tab options for tab 2/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /delete tab tab 2/i }));

    await waitFor(() => {
      expect(lastBody()).toMatchObject({ action: "deleteTab", tabId: "t2" });
    });
    expect(onSelectTab).toHaveBeenLastCalledWith(expect.objectContaining({ tabId: "t1" }));
  });

  it("hides the delete option in the gear menu when only one tab remains", async () => {
    mockActions({ getTabs: [tab()] });

    render(<DocumentTabs documentId="doc-1" onSelectTab={vi.fn()} selectedTabId="t1" />);

    await waitFor(() => screen.getByRole("button", { name: /tab options for tab 1/i }));
    fireEvent.click(screen.getByRole("button", { name: /tab options for tab 1/i }));

    expect(screen.getByRole("menuitem", { name: /rename tab tab 1/i })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /delete tab tab 1/i })).not.toBeInTheDocument();
  });

  it("collapses and expands a parent's sub-tabs via the chevron", async () => {
    const parent = tab({ tabId: "t1", title: "Parent" });
    const child = tab({ tabId: "t2", title: "Child", index: 0, nestingLevel: 1, parentTabId: "t1" });
    mockActions({ getTabs: [parent, child] });

    render(<DocumentTabs documentId="doc-1" onSelectTab={vi.fn()} selectedTabId="t1" />);

    await waitFor(() => screen.getByRole("button", { name: /^child$/i }));

    fireEvent.click(screen.getByRole("button", { name: /collapse sub-tabs of parent/i }));
    expect(screen.queryByRole("button", { name: /^child$/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /expand sub-tabs of parent/i }));
    expect(screen.getByRole("button", { name: /^child$/i })).toBeInTheDocument();
  });

  it("marks sub-tabs with a numbered depth badge and leaves root tabs unbadged", async () => {
    const parent = tab({ tabId: "t1", title: "Parent" });
    const child = tab({ tabId: "t2", title: "Child", index: 0, nestingLevel: 1, parentTabId: "t1" });
    const grandchild = tab({
      tabId: "t3",
      title: "Grandchild",
      index: 0,
      nestingLevel: 2,
      parentTabId: "t2",
    });
    mockActions({ getTabs: [parent, child, grandchild] });

    render(<DocumentTabs documentId="doc-1" onSelectTab={vi.fn()} selectedTabId="t1" />);

    await waitFor(() => screen.getByRole("button", { name: /^grandchild$/i }));

    expect(screen.getByRole("img", { name: /nesting level 1/i })).toHaveTextContent("1");
    expect(screen.getByRole("img", { name: /nesting level 2/i })).toHaveTextContent("2");
    expect(screen.queryByRole("img", { name: /nesting level 0/i })).not.toBeInTheDocument();
  });

  it("reveals drag handles when the reorder lock is toggled", async () => {
    mockActions({ getTabs: [tab(), tab({ tabId: "t2", title: "Tab 2", index: 1 })] });

    render(<DocumentTabs documentId="doc-1" onSelectTab={vi.fn()} selectedTabId="t1" />);

    await waitFor(() => screen.getByRole("button", { name: /reorder tabs/i }));
    expect(screen.queryByRole("button", { name: /reorder tab 1/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /reorder tabs/i }));

    expect(screen.getByRole("button", { name: /reorder tab 1/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reorder tab 2/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /lock tab order/i })).toBeInTheDocument();
  });

  it("flushes pending edits before a mutation and adopts the new revision after", async () => {
    const created = tab({ tabId: "t2", title: "New tab", index: 1 });
    mockActions({
      getTabs: [tab()],
      createTab: { tabs: [tab(), created], created, revisionId: "rev-9" },
    });
    const onBeforeMutate = vi.fn().mockResolvedValue(true);
    const onTabsPersisted = vi.fn();

    render(
      <DocumentTabs
        documentId="doc-1"
        onSelectTab={vi.fn()}
        selectedTabId="t1"
        onBeforeMutate={onBeforeMutate}
        onTabsPersisted={onTabsPersisted}
      />
    );

    await waitFor(() => screen.getByRole("button", { name: /add tab/i }));
    fireEvent.click(screen.getByRole("button", { name: /add tab/i }));

    await waitFor(() => expect(onTabsPersisted).toHaveBeenCalledWith("rev-9"));
    expect(onBeforeMutate).toHaveBeenCalled();
  });

  it("aborts the tab action when the pre-flush reports failure", async () => {
    mockActions({
      getTabs: [tab()],
      createTab: { tabs: [tab()], created: null },
    });
    const onBeforeMutate = vi.fn().mockResolvedValue(false);

    render(
      <DocumentTabs
        documentId="doc-1"
        onSelectTab={vi.fn()}
        selectedTabId="t1"
        onBeforeMutate={onBeforeMutate}
      />
    );

    await waitFor(() => screen.getByRole("button", { name: /add tab/i }));
    fireEvent.click(screen.getByRole("button", { name: /add tab/i }));

    await waitFor(() => expect(onBeforeMutate).toHaveBeenCalled());
    const actions = fetchMock.mock.calls.map(
      (call) => JSON.parse((call[1] as RequestInit).body as string).action
    );
    expect(actions).not.toContain("createTab");
  });

  it("shows an error state with a retry button when the fetch fails", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) });

    render(<DocumentTabs documentId="doc-1" onSelectTab={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch tabs/i)).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });
});

