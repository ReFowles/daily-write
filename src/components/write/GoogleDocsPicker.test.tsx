import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import GoogleDocsPicker from "./GoogleDocsPicker";
import type { GoogleDoc } from "@/lib/types";

const doc = (over: Partial<GoogleDoc> = {}): GoogleDoc => ({
  id: "d1",
  name: "My Doc",
  modifiedTime: new Date().toISOString(),
  webViewLink: "https://docs.google.com/d/d1",
  ownedByMe: true,
  ...over,
});

describe("GoogleDocsPicker", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows a loading placeholder while fetching", async () => {
    fetchMock.mockImplementation(() => new Promise(() => {}));
    render(<GoogleDocsPicker onSelectDoc={vi.fn()} />);
    expect(screen.getByText(/loading your google docs/i)).toBeInTheDocument();
  });

  it("shows a friendly message when the user has no docs", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ docs: [] }) });
    render(<GoogleDocsPicker onSelectDoc={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/no google docs found/i)).toBeInTheDocument();
    });
  });

  it("lists existing docs and invokes onSelectDoc when a card is clicked", async () => {
    const first = doc({ id: "a", name: "Alpha" });
    const second = doc({ id: "b", name: "Beta" });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ docs: [first, second] }),
    });

    const onSelectDoc = vi.fn();
    render(<GoogleDocsPicker onSelectDoc={onSelectDoc} />);

    await waitFor(() => screen.getByRole("button", { name: /alpha/i }));

    fireEvent.click(screen.getByRole("button", { name: /beta/i }));
    expect(onSelectDoc).toHaveBeenCalledWith(expect.objectContaining({ id: "b" }));
  });

  it("shows a retry option when fetching docs fails", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    render(<GoogleDocsPicker onSelectDoc={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch documents/i)).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  describe("create document", () => {
    beforeEach(() => {
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ docs: [] }) });
    });

    it("validates that a title was entered before hitting the API", async () => {
      const onSelectDoc = vi.fn();
      render(<GoogleDocsPicker onSelectDoc={onSelectDoc} />);

      await waitFor(() => screen.getByRole("button", { name: /create new document/i }));

      fireEvent.click(screen.getByRole("button", { name: /create new document/i }));
      fireEvent.click(screen.getByRole("button", { name: /^create document$/i }));

      expect(screen.getByText(/please enter a title/i)).toBeInTheDocument();
      // Only the initial docs fetch, no create call.
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(onSelectDoc).not.toHaveBeenCalled();
    });

    it("creates the doc, prepends it, and selects it", async () => {
      const newDoc = doc({ id: "new", name: "Chapter 1" });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ doc: newDoc }),
      });

      const onSelectDoc = vi.fn();
      render(<GoogleDocsPicker onSelectDoc={onSelectDoc} />);

      await waitFor(() => screen.getByRole("button", { name: /create new document/i }));

      fireEvent.click(screen.getByRole("button", { name: /create new document/i }));
      fireEvent.change(screen.getByPlaceholderText(/enter document title/i), {
        target: { value: "Chapter 1" },
      });

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /^create document$/i }));
      });

      expect(fetchMock).toHaveBeenLastCalledWith(
        "/api/google-docs",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ action: "create", title: "Chapter 1" }),
        })
      );
      expect(onSelectDoc).toHaveBeenCalledWith(newDoc);
      expect(screen.getByRole("button", { name: /chapter 1/i })).toBeInTheDocument();
    });

    it("surfaces the server-supplied error message on failure", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "quota exceeded" }),
      });

      render(<GoogleDocsPicker onSelectDoc={vi.fn()} />);

      await waitFor(() => screen.getByRole("button", { name: /create new document/i }));

      fireEvent.click(screen.getByRole("button", { name: /create new document/i }));
      fireEvent.change(screen.getByPlaceholderText(/enter document title/i), {
        target: { value: "Chapter 1" },
      });

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /^create document$/i }));
      });

      expect(screen.getByText(/quota exceeded/i)).toBeInTheDocument();
    });
  });
});
