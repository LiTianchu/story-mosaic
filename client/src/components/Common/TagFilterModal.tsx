import { useState, useMemo } from "react";
import { X, Check } from "lucide-react";
import { STORY_TAGS, STORY_TAG_LABELS_DICT } from "@/constants/storyTags";
import type { StoryTag } from "@app-types/data";
import Fuse from "fuse.js";

interface TagFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  allowAll?: boolean;
  modalTitle?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

export default function TagFilterModal({
  isOpen,
  onClose,
  selectedTags,
  onTagsChange,
  allowAll = true,
  modalTitle = "Filter by Tags",
  confirmButtonText = "Apply Filter",
  cancelButtonText = "Cancel",
}: TagFilterModalProps) {
  const [tagQuery, setTagQuery] = useState("");

  // Fuse.js setup for fuzzy searching tags
  const searchedTags: StoryTag[] = useMemo(() => {
    // Initialize Fuse with tag data
    const fuse = new Fuse(STORY_TAGS, {
      includeScore: true,
      threshold: 0.3,
    });
    return tagQuery.length > 0
      ? fuse.search(tagQuery).map((result) => result.item)
      : ([] as StoryTag[]);
  }, [tagQuery]);

  if (!isOpen) return null;

  const isAllSelected =
    allowAll && (selectedTags.includes("All") || selectedTags.length === 0);

  const handleTagToggle = (tag: string) => {
    if (allowAll && tag === "All") {
      // Select All deselects everything else
      onTagsChange(["All"]);
    } else {
      let newTags = selectedTags;
      // Remove "All" if it was selected
      if (allowAll) {
        newTags = selectedTags.filter((t) => t !== "All");
      }

      if (newTags.includes(tag)) {
        // Deselect the tag
        newTags = newTags.filter((t) => t !== tag);
        // If no tags left, default to "All"
        if (newTags.length === 0 && allowAll) {
          newTags = ["All"];
        }
      } else {
        // Select the tag
        newTags = [...newTags, tag];
      }

      onTagsChange(newTags);
    }
  };

  const handleClearAll = () => {
    if (!allowAll) return;
    onTagsChange(["All"]);
  };

  const visibleTags = tagQuery.length !== 0 ? searchedTags : STORY_TAGS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-3xl max-h-[80vh] bg-paper rounded-2xl shadow-2xl border border-black/10">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-black/10 bg-paper px-6 py-4 rounded-t-2xl">
          <h2 className="text-xl font-semibold">{modalTitle}</h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-black/5 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(80vh-140px)] p-6">
          {/* Tag Search Input */}
          <div className="relative mx-auto w-full max-w-[720px]">
            <input
              value={tagQuery}
              onChange={(e) => {
                setTagQuery(e.target.value);
              }}
              placeholder="Enter tag here..."
              className="w-full border-b border-black/10 bg-paper mb-2 px-5 py-3 pr-12 text-[15px] outline-none placeholder:text-black/40 shadow-b-sm"
            />
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-600">
                Select Tags ({selectedTags.filter((t) => t !== "All").length}{" "}
                selected)
              </h3>

              {!isAllSelected && (
                <button
                  onClick={handleClearAll}
                  className="text-sm text-add-btn hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {/* All Tag - Special Section */}
              {allowAll && (
                <button
                  onClick={() => handleTagToggle("All")}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition ${
                    isAllSelected
                      ? "bg-tag-fill border-gray-700 text-white"
                      : "bg-white border-gray-300 hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <span>ALL</span>
                  {isAllSelected && (
                    <Check size={14} className="ml-1 shrink-0 text-white" />
                  )}
                </button>
              )}
              {visibleTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition ${
                      isSelected
                        ? "bg-gray-700 border-gray-700 text-white"
                        : "bg-white border-gray-300 hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    <span className="truncate">
                      {STORY_TAG_LABELS_DICT[tag]}
                    </span>
                    {isSelected && (
                      <Check size={14} className="ml-1 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-black/10 b-paper px-6 py-4 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full border border-black/10 hover:bg-black/5 transition font-medium"
          >
            {cancelButtonText}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full bg-add-btn text-white hover:bg-add-btn/90 transition font-medium shadow-sm"
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}
