import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DocCard from "./DocCard";
import type { GoogleDoc } from "@/lib/types";
import { useDocWordCount } from "@/lib/use-doc-word-count";

vi.mock("@/lib/use-doc-word-count", () => ({
  useDocWordCount: vi.fn(),
}));

const useDocWordCountMock = vi.mocked(useDocWordCount);

const doc: GoogleDoc = {
  id: "doc-1",
  name: "My Novel",
  modifiedTime: "2026-01-01T00:00:00Z",
  webViewLink: "https://example.com",
  ownedByMe: true,
};

function renderCard() {
  return render(
    <DocCard
      doc={doc}
      isSelected={false}
      isFavorite={false}
      onSelect={vi.fn()}
      onToggleFavorite={vi.fn()}
    />
  );
}

describe("DocCard", () => {
  it("does not show a word count while it is still loading", () => {
    useDocWordCountMock.mockReturnValue({
      wordCount: null,
      error: false,
      elementRef: vi.fn(),
    });

    renderCard();
    expect(screen.queryByText(/words/)).not.toBeInTheDocument();
  });

  it("shows the word count once loaded", () => {
    useDocWordCountMock.mockReturnValue({
      wordCount: 1234,
      error: false,
      elementRef: vi.fn(),
    });

    renderCard();
    expect(screen.getByText(/1,234 words/)).toBeInTheDocument();
  });
});
