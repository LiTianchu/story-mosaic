// CreateStoryModal.tsx
import React, { useState, useRef } from "react";
import type { StoryTag } from "@app-types/data";
import { STORY_TAGS, STORY_TAG_LABELS_DICT } from "@/constants/storyTags";
import { Upload, X, Loader } from "lucide-react";
import TagChip from "@components/Common/TagChip";

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (storyData: {
    title: string;
    description: string;
    tags: StoryTag[];
    imageFile?: File;
  }) => void;
  loading?: boolean;
}

const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  loading = false,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<StoryTag[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Please enter a story title");
      return;
    }

    try {
      onCreate({
        title: title.trim(),
        description: description.trim(),
        tags: selectedTags,
        imageFile: imageFile || undefined,
      });
    } catch (error) {
      console.error("Failed to submit form:", error);
    }
  };

  const handleTagToggle = (tag: StoryTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }
      setImageFile(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedTags([]);
    setImageFile(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-ink/50 p-4">
      <div className="relative w-full max-w-md max-h-[90vh] bg-paper rounded-lg shadow-md border border-dark-ink/10">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-black/10 bg-paper px-6 py-4 rounded-t-lg">
          <h2 className="text-xl font-semibold">Create New Story</h2>
          <button
            onClick={handleClose}
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-dark-ink/5 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Cover Image Upload */}
            <div>
              <label className="block text-sm font-medium text-dark-ink mb-2">
                Cover Image
              </label>
              <div className="flex flex-col items-center">
                {imageFile ? (
                  <div className="relative w-full h-48 mb-2">
                    <img
                      src={URL.createObjectURL(imageFile)}
                      alt="Cover preview"
                      className="w-full h-full object-cover rounded-lg border border-faint-ink"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-1 bg-danger text-white rounded-full hover:bg-danger transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-add-btn transition-colors"
                  >
                    <Upload size={32} className="text-gray-400 mb-2" />
                    <span className="text-gray-500">
                      Click to upload cover image
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                      JPG, PNG, max 5MB
                    </span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Title Input */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Story Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-faint-ink rounded-md focus:outline-none focus:ring-2 focus:ring-add-btn focus:border-transparent"
                placeholder="Enter story title..."
                required
              />
            </div>

            {/* Description Input */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-dark-ink mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-faint-ink rounded-md focus:outline-none focus:ring-2 focus:ring-add-btn focus:border-transparent"
                placeholder="Describe your story..."
              />
            </div>

            {/* Tags Selection */}
            <div>
              <label className="block text-sm font-medium text-dark-ink mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 max-h-72 overflow-y-auto p-2 border border-faint-ink rounded-md">
                {STORY_TAGS.map((tag) => (
                  <TagChip
                    key={tag}
                    label={STORY_TAG_LABELS_DICT[tag]}
                    active={selectedTags.includes(tag)}
                    onClick={() => handleTagToggle(tag)}
                  />
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-dark-ink/10 bg-paper px-6 py-4 rounded-b-lg">
          <button
            onClick={handleClose}
            className="px-6 py-2 rounded-lg border border-dark-ink/10 hover:bg-dark-ink/5 transition font-medium cursor-pointer"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || loading}
            className="px-6 py-2 rounded-lg bg-add-btn text-white hover:bg-green-800 transition font-medium shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading && <Loader size={16} className="animate-spin" />}
            {loading ? "Creating..." : "Create Story"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateStoryModal;
