import { useMemo, useState, useEffect } from "react";
import StoryCard from "@components/Common/StoryCard";
import TagFilterModal from "@components/Common/TagFilterModal";
import { storyApi, storyVersionApi } from "../../services/api";
import type { StoryWithStats, StoryTag } from "@app-types/data";
import Loading from "@components/Common/Loading";
import Fuse from "fuse.js";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  X,
} from "lucide-react";
import { STORY_TAG_LABELS_DICT } from "@/constants/storyTags";

// Landing page of the web app
export default function LandingMain() {
  const [stories, setStories] = useState<StoryWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>(["All"]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all stories
        const baseStories = await storyApi.list();
        const stWithStats: StoryWithStats[] = [];
        for (const story of baseStories) {
          if (!story.publishedVersionId) continue;
          const storyVersionId = story.publishedVersionId;
          console.log("Fetching stats for story version:", storyVersionId);
          const version = await storyVersionApi.getById(storyVersionId);
          stWithStats.push({
            ...story,
            stats: {
              starCount: version.stats.starCount,
              readCount: version.stats.readCount,
            },
          });
        }

        setStories(stWithStats);
      } catch (err) {
        console.error("Failed to load stories:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

  const PAGE_SIZE = 6;

  const fuseOptions = useMemo(() => {
    return {
      keys: ["title", "description"],
      includeScore: true,
      threshold: 0.4,
    };
  }, []);

  const filtered = useMemo(() => {
    // Filter by tags first
    let storiesByTag: StoryWithStats[];

    if (selectedTags.includes("All") || selectedTags.length === 0) {
      storiesByTag = stories;
    } else {
      // Show stories that have at least one of the selected tags (OR logic)
      storiesByTag = stories.filter((s) =>
        s.tags.some((tag) => selectedTags.includes(tag))
      );
    }

    // Then filter by search query
    const queryTrimmed = query.trim();
    if (!queryTrimmed) {
      return storiesByTag;
    }

    // If a query is present, use Fuse.js for searching
    const fuseInstance = new Fuse(storiesByTag, fuseOptions);
    return fuseInstance.search(queryTrimmed).map((result) => result.item);
  }, [selectedTags, stories, query, fuseOptions]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const visible: StoryWithStats[] = filtered.slice(start, start + PAGE_SIZE);

  const activeTagCount = selectedTags.filter((t) => t !== "All").length;

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = selectedTags.filter((t) => t !== tagToRemove);
    setSelectedTags(newTags.length === 0 ? ["All"] : newTags);
    setPage(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Failed to Load Stories
          </h2>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="h-full bg-paper text-dark font-body">
      {/* Tag Filter Modal */}
      <TagFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        selectedTags={selectedTags}
        onTagsChange={(tags) => {
          setSelectedTags(tags);
          setPage(1);
        }}
        allowAll={true}
      />

      {/* Search + Tags */}
      <section className="mx-auto max-w-6xl px-5 pt-6">
        <div className="relative mx-auto w-full max-w-[720px] flex gap-2">
          <div className="relative flex-1">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search for a story here..."
              className="w-full rounded-full border border-black/10 bg-paper px-5 py-3 pr-12 text-[15px] outline-none placeholder:text-black/40 shadow-sm"
            />
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-add-btn/90 text-white">
              <Search size={20} />
            </div>
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="relative flex items-center justify-center px-3 py-3 rounded-full border border-black/10 bg-paper text-add-btn hover:bg-add-btn hover:text-light-ink transition shadow-sm cursor-pointer"
          >
            <Filter size={20} />
            {activeTagCount > 0 && (
              <span className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-add-btn text-white text-xs font-semibold">
                {activeTagCount}
              </span>
            )}
          </button>
        </div>

        {/* Active Tag Chips */}
        {activeTagCount > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 justify-center">
            <span className="text-sm text-gray-600">Active filters:</span>
            {selectedTags
              .filter((t) => t !== "All")
              .map((tag) => (
                <div
                  key={tag}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-700 text-white text-sm"
                >
                  <span>{STORY_TAG_LABELS_DICT[tag as StoryTag]}</span>
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:bg-white/20 rounded-full p-0.5 transition"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            <button
              onClick={() => {
                setSelectedTags(["All"]);
                setPage(1);
              }}
              className="text-sm text-add-btn hover:underline"
            >
              Clear all
            </button>
          </div>
        )}
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-6xl px-5 pb-10 pt-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((s) => (
            <div
              key={s._id}
              className={[
                "transition",
                selected === s._id ? "ring-2 ring-sky-500 rounded-lg" : "",
              ].join(" ")}
              onClick={() => setSelected(s._id)}
            >
              <StoryCard story={s} clickable={true} />
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="mx-auto mt-8 flex w-full max-w-[360px] items-center justify-between rounded-full border border-black/10 bg-paper px-2 py-2 shadow-sm">
          <button
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-black/5 disabled:opacity-40 cursor-pointer"
            onClick={() => setPage(1)}
            disabled={page === 1}
          >
            <ChevronsLeft size={20} />
          </button>
          <button
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-black/5 disabled:opacity-40 cursor-pointer"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-1">
            {page > 2 && (
              <>
                <PageDot n={1} active={page === 1} onClick={() => setPage(1)} />
                <span className="px-1 text-black/40">…</span>
              </>
            )}
            {Array.from({ length: 3 })
              .map((_, i) => page - 1 + i)
              .filter((n) => n >= 1 && n <= pages)
              .map((n) => (
                <PageDot
                  key={n}
                  n={n}
                  active={n === page}
                  onClick={() => setPage(n)}
                />
              ))}
            {page < pages - 1 && (
              <>
                <span className="px-1 text-black/40">…</span>
                <PageDot
                  n={pages}
                  active={page === pages}
                  onClick={() => setPage(pages)}
                />
              </>
            )}
          </div>
          <button
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-black/5 disabled:opacity-40 cursor-pointer"
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
          >
            <ChevronRight size={20} />
          </button>
          <button
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-black/5 disabled:opacity-40 cursor-pointer"
            onClick={() => setPage(pages)}
            disabled={page === pages}
          >
            <ChevronsRight size={20} />
          </button>
        </div>
      </section>
    </main>
  );
}

function PageDot({
  n,
  active,
  onClick,
}: {
  n: number;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "mx-0.5 grid h-8 min-w-8 place-items-center rounded-full px-2 text-sm",
        active ? "bg-add-btn text-white" : "hover:bg-black/5",
      ].join(" ")}
    >
      {n}
    </button>
  );
}
