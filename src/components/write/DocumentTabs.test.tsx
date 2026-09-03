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

  function mockTabs(tabs: DocumentTab[]) {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ tabs }),
    });
  }

  it("renders nothing when the document has only one tab", async () => {
    mockTabs([tab()]);
    const onSelectTab = vi.fn();

    const { container } = render(
      <DocumentTabs documentId="doc-1" onSelectTab={onSelectTab} />
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it("auto-selects the first tab and renders every tab as a button", async () => {
    mockTabs([tab(), tab({ tabId: "t2", title: "Tab 2", index: 1 })]);
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
      expect(screen.getByRole("button", { name: /tab 1/i })).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /tab 2/i })).toBeInTheDocument();

    expect(onSelectTab).toHaveBeenCalledWith(expect.objectContaining({ tabId: "t1" }));
    expect(onTabsChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ tabId: "t1" }),
        expect.objectContaining({ tabId: "t2" }),
      ])
    );
  });

  it("calls onSelectTab when the user clicks another tab", async () => {
    mockTabs([tab(), tab({ tabId: "t2", title: "Tab 2", index: 1 })]);
    const onSelectTab = vi.fn();

    render(
      <DocumentTabs documentId="doc-1" onSelectTab={onSelectTab} selectedTabId="t1" />
    );

    await waitFor(() => screen.getByRole("button", { name: /tab 2/i }));

    fireEvent.click(screen.getByRole("button", { name: /tab 2/i }));

    expect(onSelectTab).toHaveBeenLastCalledWith(
      expect.objectContaining({ tabId: "t2" })
    );
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
