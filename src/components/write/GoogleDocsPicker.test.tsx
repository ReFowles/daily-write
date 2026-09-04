import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import GoogleDocsPicker from "./GoogleDocsPicker";
import type { GoogleDoc } from "@/lib/types";

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: { user: { email: "user@example.com" } },
    status: "authenticated",
  }),
}));

vi.mock("@/lib/data-store", () => ({
  getFavoriteDocIds: vi.fn(),
  addFavoriteDoc: vi.fn(),
  removeFavoriteDoc: vi.fn(),
}));

import { addFavoriteDoc, getFavoriteDocIds, removeFavoriteDoc } from "@/lib/data-store";

const getFavoriteDocIdsMock = vi.mocked(getFavoriteDocIds);
const addFavoriteDocMock = vi.mocked(addFavoriteDoc);
const removeFavoriteDocMock = vi.mocked(removeFavoriteDoc);

const doc = (over: Partial<GoogleDoc> = {}): GoogleDoc => ({
  id: "d1",
  name: "My Doc",
  modifiedTime: new Date().toISOString(),
  webViewLink: "https://docs.google.com/d/d1",
  ownedByMe: true,
  ...over,
});

// Route each fetch call to its matching handler by (method + action). Handlers
// return the parsed json body; the mock wraps it in a fake Response.
type Handler = (init: RequestInit | undefined) => unknown;
function installFetchRouter(routes: {
  listDocs?: Handler;
  createDoc?: Handler;
  search?: Handler;
  getByIds?: Handler;
}) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (typeof url !== "string" || !url.startsWith("/api/google-docs")) {
      throw new Error(`Unexpected fetch: ${url}`);
    }
    if (!init || init.method === undefined || init.method === "GET") {
      const body = routes.listDocs?.(init) ?? { docs: [] };
      return { ok: true, json: async () => body } as Response;
    }
    if (init.method === "POST") {
      const parsed = init.body ? JSON.parse(String(init.body)) : {};
      const action = parsed.action ?? "getContent";
      switch (action) {
        case "create": {
          const body = routes.createDoc?.(init) ?? { doc: doc() };
          return { ok: true, json: async () => body } as Response;
        }
        case "search": {
          const body = routes.search?.(init) ?? { docs: [] };
          return { ok: true, json: async () => body } as Response;
        }
        case "getByIds": {
          const body = routes.getByIds?.(init) ?? { docs: [] };
          return { ok: true, json: async () => body } as Response;
        }
        default:
          throw new Error(`Unhandled action: ${action}`);
      }
    }
    throw new Error(`Unhandled method: ${init.method}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("GoogleDocsPicker", () => {
  beforeEach(() => {
    getFavoriteDocIdsMock.mockResolvedValue([]);
    addFavoriteDocMock.mockResolvedValue(undefined);
    removeFavoriteDocMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("shows a loading placeholder while fetching", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {}))
    );
    render(<GoogleDocsPicker onSelectDoc={vi.fn()} />);
    expect(screen.getByText(/loading your google docs/i)).toBeInTheDocument();
  });

  it("shows a friendly message when the user has no docs", async () => {
    installFetchRouter({ listDocs: () => ({ docs: [] }) });
    render(<GoogleDocsPicker onSelectDoc={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/no google docs found/i)).toBeInTheDocument();
    });
  });

  it("lists existing docs and invokes onSelectDoc when a card is clicked", async () => {
    const first = doc({ id: "a", name: "Alpha" });
    const second = doc({ id: "b", name: "Beta" });
    installFetchRouter({ listDocs: () => ({ docs: [first, second] }) });

    const onSelectDoc = vi.fn();
    render(<GoogleDocsPicker onSelectDoc={onSelectDoc} />);

    await waitFor(() => screen.getByRole("button", { name: /open alpha/i }));

    fireEvent.click(screen.getByRole("button", { name: /open beta/i }));
    expect(onSelectDoc).toHaveBeenCalledWith(expect.objectContaining({ id: "b" }));
  });

  it("shows a retry option when fetching docs fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, json: async () => ({}) }) as Response)
    );
    render(<GoogleDocsPicker onSelectDoc={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch documents/i)).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("renders the Drive breadcrumb path when present on a doc", async () => {
    installFetchRouter({
      listDocs: () => ({
        docs: [doc({ id: "a", name: "Alpha", path: "My Drive / Writing / Novels" })],
      }),
    });

    render(<GoogleDocsPicker onSelectDoc={vi.fn()} />);

    await waitFor(() => screen.getByRole("button", { name: /open alpha/i }));
    expect(screen.getByText("My Drive / Writing / Novels")).toBeInTheDocument();
  });

  describe("create document", () => {
    it("validates that a title was entered before hitting the API", async () => {
      const fetchMock = installFetchRouter({ listDocs: () => ({ docs: [] }) });
      const onSelectDoc = vi.fn();
      render(<GoogleDocsPicker onSelectDoc={onSelectDoc} />);

      await waitFor(() => screen.getByRole("button", { name: /^\+ new doc$/i }));

      fireEvent.click(screen.getByRole("button", { name: /^\+ new doc$/i }));
      fireEvent.click(screen.getByRole("button", { name: /^create document$/i }));

      expect(screen.getByText(/please enter a title/i)).toBeInTheDocument();
      // Only the initial docs fetch, no create call.
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(onSelectDoc).not.toHaveBeenCalled();
    });

    it("creates the doc, prepends it, and selects it", async () => {
      const newDoc = doc({ id: "new", name: "Chapter 1" });
      installFetchRouter({
        listDocs: () => ({ docs: [] }),
        createDoc: () => ({ doc: newDoc }),
      });

      const onSelectDoc = vi.fn();
      render(<GoogleDocsPicker onSelectDoc={onSelectDoc} />);

      await waitFor(() => screen.getByRole("button", { name: /^\+ new doc$/i }));

      fireEvent.click(screen.getByRole("button", { name: /^\+ new doc$/i }));
      fireEvent.change(screen.getByPlaceholderText(/enter document title/i), {
        target: { value: "Chapter 1" },
      });

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /^create document$/i }));
      });

      expect(onSelectDoc).toHaveBeenCalledWith(newDoc);
      expect(screen.getByRole("button", { name: /open chapter 1/i })).toBeInTheDocument();
    });

    it("surfaces the server-supplied error message on failure", async () => {
      const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
        if (!init || init.method === "GET" || init.method === undefined) {
          return { ok: true, json: async () => ({ docs: [] }) } as Response;
        }
        return {
          ok: false,
          json: async () => ({ error: "quota exceeded" }),
        } as Response;
      });
      vi.stubGlobal("fetch", fetchMock);

      render(<GoogleDocsPicker onSelectDoc={vi.fn()} />);

      await waitFor(() => screen.getByRole("button", { name: /^\+ new doc$/i }));

      fireEvent.click(screen.getByRole("button", { name: /^\+ new doc$/i }));
      fireEvent.change(screen.getByPlaceholderText(/enter document title/i), {
        target: { value: "Chapter 1" },
      });

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /^create document$/i }));
      });

      expect(screen.getByText(/quota exceeded/i)).toBeInTheDocument();
    });
  });

  describe("favorites", () => {
    it("shows a Favorites section for favorited docs above Recent Documents", async () => {
      const fav = doc({ id: "fav", name: "Favorited Thing" });
      const recent = doc({ id: "r1", name: "Recent Thing" });
      getFavoriteDocIdsMock.mockResolvedValue(["fav"]);
      installFetchRouter({
        listDocs: () => ({ docs: [recent] }),
        getByIds: () => ({ docs: [fav] }),
      });

      render(<GoogleDocsPicker onSelectDoc={vi.fn()} />);

      const favoritesHeading = await screen.findByRole("heading", { name: /favorites/i });
      const recentHeading = await screen.findByRole("heading", { name: /recent documents/i });
      // Favorites section renders above Recent Documents in the DOM.
      expect(favoritesHeading.compareDocumentPosition(recentHeading)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING
      );

      await waitFor(() =>
        expect(screen.getByRole("button", { name: /open favorited thing/i })).toBeInTheDocument()
      );
    });

    it("toggling the star adds and removes a favorite via the data store", async () => {
      const d = doc({ id: "d1", name: "Alpha" });
      getFavoriteDocIdsMock.mockResolvedValue([]);
      installFetchRouter({ listDocs: () => ({ docs: [d] }) });

      render(<GoogleDocsPicker onSelectDoc={vi.fn()} />);

      await screen.findByRole("button", { name: /open alpha/i });

      const starButton = screen.getByRole("button", { name: /^favorite alpha$/i });
      await act(async () => {
        fireEvent.click(starButton);
      });
      expect(addFavoriteDocMock).toHaveBeenCalledWith("user@example.com", "d1");

      const favoritesHeading = await screen.findByRole("heading", { name: /favorites/i });
      const favoritesSection = favoritesHeading.parentElement!;
      const unfavoriteButton = within(favoritesSection).getByRole("button", {
        name: /unfavorite alpha/i,
      });
      await act(async () => {
        fireEvent.click(unfavoriteButton);
      });
      expect(removeFavoriteDocMock).toHaveBeenCalledWith("user@example.com", "d1");
    });
  });

  describe("search", () => {
    it("debounces the query and swaps in a Search Results section", async () => {
      const match = doc({ id: "m", name: "Chapter About Dragons" });
      installFetchRouter({
        listDocs: () => ({ docs: [] }),
        search: () => ({ docs: [match] }),
      });

      render(<GoogleDocsPicker onSelectDoc={vi.fn()} />);

      await waitFor(() => screen.getByPlaceholderText(/search your google drive/i));

      fireEvent.change(screen.getByPlaceholderText(/search your google drive/i), {
        target: { value: "dragon" },
      });

      // Recent Documents heading is hidden as soon as a query is entered.
      expect(screen.queryByRole("heading", { name: /recent documents/i })).not.toBeInTheDocument();

      expect(
        await screen.findByRole("heading", { name: /search results/i }, { timeout: 2000 })
      ).toBeInTheDocument();
      expect(
        await screen.findByRole(
          "button",
          { name: /open chapter about dragons/i },
          { timeout: 2000 }
        )
      ).toBeInTheDocument();
    });

    it("shows an empty state when the search returns no docs", async () => {
      installFetchRouter({
        listDocs: () => ({ docs: [] }),
        search: () => ({ docs: [] }),
      });

      render(<GoogleDocsPicker onSelectDoc={vi.fn()} />);

      await waitFor(() => screen.getByPlaceholderText(/search your google drive/i));
      fireEvent.change(screen.getByPlaceholderText(/search your google drive/i), {
        target: { value: "nothing" },
      });

      expect(
        await screen.findByText(/no documents match/i, {}, { timeout: 2000 })
      ).toBeInTheDocument();
    });
  });
});
