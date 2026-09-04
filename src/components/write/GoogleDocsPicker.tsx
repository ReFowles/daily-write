"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { LuSearch } from "react-icons/lu";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { themeClasses } from "@/lib/theme-utils";
import { cn } from "@/lib/class-utils";
import { addFavoriteDoc, getFavoriteDocIds, removeFavoriteDoc } from "@/lib/data-store";
import type { GoogleDoc } from "@/lib/types";
import DocCard from "./DocCard";

interface GoogleDocsPickerProps {
  onSelectDoc: (doc: GoogleDoc) => void;
  selectedDocId?: string;
}

const errorTextClasses =
  "text-red-600 dark:text-red-400";

const SEARCH_DEBOUNCE_MS = 300;

export default function GoogleDocsPicker({ onSelectDoc, selectedDocId }: GoogleDocsPickerProps) {
  const { data: session } = useSession();
  const userId = session?.user?.email ?? null;

  const [docs, setDocs] = useState<GoogleDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favoriteDocs, setFavoriteDocs] = useState<GoogleDoc[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GoogleDoc[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    void fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/google-docs");

      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }

      const data = await response.json();
      setDocs(data.docs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Load favorite ids from Firestore.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      try {
        const ids = await getFavoriteDocIds(userId);
        if (cancelled) return;
        setFavoriteIds(new Set(ids));
      } catch (err) {
        console.error("Failed to load favorites", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Resolve favorite ids to full doc metadata. Reuses anything already present
  // in `docs` and only calls Drive for the leftovers.
  useEffect(() => {
    if (favoriteIds.size === 0) {
      setFavoriteDocs([]);
      return;
    }

    const idsInOrder = Array.from(favoriteIds);

    setFavoriteDocs((prev) => {
      const cached = new Map<string, GoogleDoc>();
      for (const doc of docs) cached.set(doc.id, doc);
      for (const doc of prev) if (!cached.has(doc.id)) cached.set(doc.id, doc);
      const output: GoogleDoc[] = [];
      for (const id of idsInOrder) {
        const doc = cached.get(id);
        if (doc) output.push(doc);
      }
      return output;
    });

    const knownIds = new Set<string>();
    for (const doc of docs) knownIds.add(doc.id);
    const missing = idsInOrder.filter((id) => !knownIds.has(id));

    if (missing.length === 0) return;

    let cancelled = false;
    setFavoritesLoading(true);

    (async () => {
      try {
        const response = await fetch("/api/google-docs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "getByIds", ids: missing }),
        });
        if (!response.ok) throw new Error("Failed to load favorite docs");
        const data = (await response.json()) as { docs: GoogleDoc[] };
        if (cancelled) return;

        setFavoriteDocs((prev) => {
          const merged = new Map<string, GoogleDoc>();
          for (const doc of prev) merged.set(doc.id, doc);
          for (const doc of docs) merged.set(doc.id, doc);
          for (const doc of data.docs) merged.set(doc.id, doc);
          const output: GoogleDoc[] = [];
          for (const id of idsInOrder) {
            const doc = merged.get(id);
            if (doc) output.push(doc);
          }
          return output;
        });
      } catch (err) {
        console.error("Failed to fetch favorite doc metadata", err);
      } finally {
        if (!cancelled) setFavoritesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [favoriteIds, docs]);

  // Debounced search against Drive.
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults(null);
      setSearchError(null);
      setSearchLoading(false);
      return;
    }

    let cancelled = false;
    setSearchLoading(true);
    setSearchError(null);
    const handle = setTimeout(async () => {
      try {
        const response = await fetch("/api/google-docs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "search", query: trimmed }),
        });
        if (!response.ok) throw new Error("Failed to search documents");
        const data = (await response.json()) as { docs: GoogleDoc[] };
        if (cancelled) return;
        setSearchResults(data.docs);
      } catch (err) {
        if (cancelled) return;
        setSearchError(err instanceof Error ? err.message : "Search failed");
        setSearchResults([]);
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [searchQuery]);

  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newDocTitle.trim()) {
      setCreateError("Please enter a title for your document");
      return;
    }

    try {
      setCreating(true);
      setCreateError(null);

      const response = await fetch("/api/google-docs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "create", title: newDocTitle.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create document");
      }

      const data = await response.json();

      setDocs((prevDocs) => [data.doc, ...prevDocs]);
      setShowCreateForm(false);
      setNewDocTitle("");
      onSelectDoc(data.doc);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create document");
    } finally {
      setCreating(false);
    }
  };

  // Optimistically toggle favorite state locally; on failure roll back and log.
  const pendingFavoriteRef = useRef<Set<string>>(new Set());
  const handleToggleFavorite = useCallback(
    async (doc: GoogleDoc) => {
      if (!userId) return;
      if (pendingFavoriteRef.current.has(doc.id)) return;
      pendingFavoriteRef.current.add(doc.id);

      const currentlyFavorite = favoriteIds.has(doc.id);
      const nextIds = new Set(favoriteIds);
      if (currentlyFavorite) nextIds.delete(doc.id);
      else nextIds.add(doc.id);
      setFavoriteIds(nextIds);

      if (!currentlyFavorite) {
        // Prime the metadata cache so favorites can render without a follow-up
        // Drive fetch.
        setFavoriteDocs((prev) => (prev.some((d) => d.id === doc.id) ? prev : [...prev, doc]));
      }

      try {
        if (currentlyFavorite) {
          await removeFavoriteDoc(userId, doc.id);
        } else {
          await addFavoriteDoc(userId, doc.id);
        }
      } catch (err) {
        console.error("Failed to update favorite", err);
        setFavoriteIds((prev) => {
          const restored = new Set(prev);
          if (currentlyFavorite) restored.add(doc.id);
          else restored.delete(doc.id);
          return restored;
        });
      } finally {
        pendingFavoriteRef.current.delete(doc.id);
      }
    },
    [favoriteIds, userId]
  );

  const isSearching = searchQuery.trim().length > 0;
  const activeSearchDocs = useMemo(() => searchResults ?? [], [searchResults]);

  if (loading) {
    return (
      <Card className="p-6">
        <p className={cn("text-center", themeClasses.text.secondary)}>
          Loading your Google Docs...
        </p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <p className={cn("text-center mb-4", errorTextClasses)}>{error}</p>
        <Button onClick={fetchDocs} variant="secondary" className="mx-auto">
          Try Again
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          {!showCreateForm && (
            <Button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="shrink-0 whitespace-nowrap"
            >
              + New Doc
            </Button>
          )}
          <div className="flex-1">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your Google Drive..."
              aria-label="Search your Google Drive"
              leadingIcon={<LuSearch className="h-4 w-4" />}
            />
          </div>
        </div>
        {searchError && <p className={cn("mt-2 text-sm", errorTextClasses)}>{searchError}</p>}
      </div>

      {/* Create New Document Section */}
      {showCreateForm && (
        <Card className="p-4">
          <form onSubmit={handleCreateDoc} className="space-y-3">
            <h3 className={cn("text-sm font-semibold", themeClasses.text.primary)}>
              Create New Document
            </h3>
            <Input
              type="text"
              value={newDocTitle}
              onChange={(e) => setNewDocTitle(e.target.value)}
              placeholder="Enter document title..."
              disabled={creating}
              autoFocus
            />
            {createError && <p className={cn("text-sm", errorTextClasses)}>{createError}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={creating}>
                {creating ? "Creating..." : "Create Document"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewDocTitle("");
                  setCreateError(null);
                }}
                disabled={creating}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Favorites (hidden while searching) */}
      {!isSearching && favoriteDocs.length > 0 && (
        <div className="space-y-3">
          <h2 className={cn("text-base font-semibold", themeClasses.text.primary)}>Favorites</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {favoriteDocs.map((doc) => (
              <DocCard
                key={doc.id}
                doc={doc}
                isSelected={doc.id === selectedDocId}
                isFavorite
                onSelect={onSelectDoc}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
          {favoritesLoading && (
            <p className={cn("text-xs", themeClasses.text.secondary)}>Refreshing favorites…</p>
          )}
        </div>
      )}

      {/* Search Results or Recent Documents */}
      {isSearching ? (
        <div className="space-y-3">
          <h2 className={cn("text-base font-semibold", themeClasses.text.primary)}>
            Search Results
          </h2>
          {searchLoading && searchResults === null ? (
            <Card className="p-6">
              <p className={cn("text-center", themeClasses.text.secondary)}>Searching…</p>
            </Card>
          ) : activeSearchDocs.length === 0 ? (
            <Card className="p-6">
              <p className={cn("text-center", themeClasses.text.secondary)}>
                No documents match &ldquo;{searchQuery.trim()}&rdquo;.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {activeSearchDocs.map((doc) => (
                <DocCard
                  key={doc.id}
                  doc={doc}
                  isSelected={doc.id === selectedDocId}
                  isFavorite={favoriteIds.has(doc.id)}
                  onSelect={onSelectDoc}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          )}
        </div>
      ) : docs.length === 0 ? (
        <Card className="p-6">
          <p className={cn("text-center", themeClasses.text.secondary)}>
            No Google Docs found. Create one above to get started!
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          <h2 className={cn("text-base font-semibold", themeClasses.text.primary)}>
            Recent Documents
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {docs.map((doc) => (
              <DocCard
                key={doc.id}
                doc={doc}
                isSelected={doc.id === selectedDocId}
                isFavorite={favoriteIds.has(doc.id)}
                onSelect={onSelectDoc}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
