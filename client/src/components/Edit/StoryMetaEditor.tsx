import { useCallback, useEffect, useState, useMemo } from "react";
import type { MouseEvent } from "react";
import { CirclePlus } from "lucide-react";
import { createPortal } from "react-dom";
import type { Story, StoryVersion, StoryTag } from "@app-types/data";
import { STORY_TAG_LABELS_DICT } from "@/constants/storyTags";
import TagChip from "@components/Common/TagChip";
import TagFilterModal from "@components/Common/TagFilterModal";
import { storyApi } from "../../services/api";
import { Pencil, UploadCloud, Save, X } from "lucide-react";
import { useAuth } from "@hooks/useAuth";

interface StoryMetaEditorProps {
  story: Story;
  storyVersion: StoryVersion;
  onSave: (meta: {
    title: string;
    description: string;
    tags: StoryTag[];
    image?: string;
  }) => void;
  onPublish: (meta: {
    title: string;
    description: string;
    tags: StoryTag[];
    image?: string;
  }) => void;
}

function StoryMetaEditor(props: StoryMetaEditorProps) {
  const { story, storyVersion, onSave, onPublish } = props;
  const { user } = useAuth();
  const isOwner = user?._id === story.ownerId;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTagFilterOpen, setIsTagFilterOpen] = useState(false);
  const [tags, setTags] = useState<StoryTag[]>(story.tags);
  const [title, setTitle] = useState<string>(story.title);
  const [description, setDescription] = useState<string>(story.description);
  const [image, setImage] = useState<string | undefined>(story.image);

  const updatingData = useMemo(() => {
    console.log("Submitting story meta changes:", {
      title,
      description,
      tags,
      image,
    });

    const updates: {
      title: string;
      description: string;
      tags: StoryTag[];
      image?: string;
    } = {
      title,
      description,
      tags,
    };

    if (image !== story.image) {
      updates.image = image;
    }

    return updates;
  }, [description, image, story.image, tags, title]);

  const onSaveAndClose = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();

      onSave(updatingData);
      setIsModalOpen(false);
    },
    [onSave, updatingData]
  );

  const handleCoverImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const response = await storyApi.uploadCover(story._id, file);
      const uploadedCover = response.imageUrl ?? response.coverUrl;
      if (!uploadedCover) {
        throw new Error("Server did not return an image URL");
      }
      setImage(uploadedCover);
      // Also update the story object in the parent component
      onSave({ title, description, tags, image: uploadedCover });
    } catch (error) {
      console.error("Failed to upload cover image:", error);
      // Handle error display to the user
    }
  };

  // update local state when props.story changes
  useEffect(() => {
    console.log("StoryMetaEditor: props.story changed:", story);
    setTags(story.tags);
    setTitle(story.title);
    setDescription(story.description);
    setImage(story.image);
  }, [story, storyVersion]);

  const deleteTag = useCallback((tagToDelete: StoryTag) => {
    setTags((currentTags) => currentTags.filter((tag) => tag !== tagToDelete));
  }, []);

  function handlePublish(event: React.MouseEvent): void {
    event.preventDefault();
    console.log("Publishing story version:", storyVersion);
    onPublish(updatingData);
  }

  function onAddTagButtonClick(event: MouseEvent): void {
    event.preventDefault();
    setIsTagFilterOpen(true);
  }

  return (
    <div>
      <div className="fixed top-0 transform -translate-x-1/2 left-1/2 bg-node-paragraph px-6 py-4 border border-secondary-btn rounded-b-xl shadow-md xl:w-100 md:w-80 sm:w-60 xl:h-12 md:h-10 sm:h-8 z-100">
        <div className="flex gap-5 justify-center items-center h-full w-full">
          <p className="text-center text-dark-ink xl:text-xl md:text-lg sm:text-base truncate">
            {story.title}
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 text-lg font-semibold uppercase tracking-wide text-add-btn transition hover:text-add-btn/80 cursor-pointer"
          >
            <Pencil size={18} /> Edit
          </button>
        </div>
      </div>
      {isModalOpen &&
        document != undefined &&
        createPortal(
          <div className="fixed inset-0 z-500 flex items-center justify-center bg-dark-ink/40 px-4">
            <div className="flex h-[95vh] w-full max-w-3xl flex-col rounded-2xl bg-paper shadow-2xl">
              <div className="flex items-center justify-between border-b border-secondary-btn/60 px-6 py-4">
                <div className="flex flex-row items-center gap-3">
                  <h3 className="text-base font-semibold text-dark-ink">
                    Edit Story Data
                  </h3>
                  {/* {upToDate ? ( */}
                  {/*   <p className="text-xs text-add-btn font-bold">Latest</p> */}
                  {/* ) : ( */}
                  {/*   <p className="text-xs text-faint-ink">Draft</p> */}
                  {/* )} */}
                </div>
                {/* Close button for the modal*/}
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    onClick={(e) => {
                      onSaveAndClose(e);
                    }}
                    className="flex items-center gap-2 rounded-full border border-secondary-btn/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-secondary-btn transition hover:border-dark-ink hover:text-dark-ink cursor-pointer"
                  >
                    <Save size={14} /> Save & Close
                  </button>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="grid place-items-center w-7 h-7 rounded-full border border-secondary-btn/60 text-secondary-btn transition hover:border-dark-ink hover:text-dark-ink"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <form className="flex flex-col gap-4 px-6 py-5">
                  <div className="relative group w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                    {image ? (
                      <img
                        src={image}
                        alt="Story Cover"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-gray-500">No cover image</span>
                    )}
                    <label
                      htmlFor="cover-upload"
                      className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                    >
                      <Pencil className="h-8 w-8" />
                      <span className="ml-2">Upload Cover</span>
                    </label>
                    <input
                      id="cover-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverImageUpload}
                    />
                  </div>

                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    name="storyTitle"
                    className="w-full border-b border-secondary-btn bg-paper px-4 py-3 text-sm text-dark-ink leading-relaxed focus:border-add-btn focus:outline-none focus:ring-2 focus:ring-add-btn/60"
                    required
                  />
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    name="storyDescription"
                    rows={8}
                    maxLength={3000}
                    className="w-full flex-1 rounded-xl border border-secondary-btn bg-paper px-4 py-3 text-sm text-dark-ink leading-relaxed focus:border-add-btn focus:outline-none focus:ring-2 focus:ring-add-btn/60"
                    required
                  />

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    {tags.map((t) => (
                      <TagChip
                        key={t}
                        label={STORY_TAG_LABELS_DICT[t]}
                        active={false}
                        onClick={() => {
                          deleteTag(t);
                        }}
                      />
                    ))}
                    <button
                      type="button"
                      onClick={onAddTagButtonClick}
                      className="text-dark-ink cursor-pointer"
                    >
                      <CirclePlus />
                    </button>
                  </div>
                  <div className="flex items-center flex-col justify-center gap-3 mt-4">
                    {isOwner && (
                      <button
                        type="button"
                        onClick={handlePublish}
                        className="flex items-center gap-2 rounded-full border border-add-btn px-5 py-3 text-xs font-semibold uppercase tracking-wide text-dark-ink cursor-pointer transition hover:bg-add-btn hover:text-light-ink"
                      >
                        <UploadCloud size={14} /> Publish Changes
                      </button>
                    )}
                    {isOwner && (
                      <p className="text-sm text-faint-ink">
                        version no: {storyVersion.versionNumber} ---&gt;{" "}
                        {storyVersion.versionNumber + 1}
                      </p>
                    )}
                  </div>
                </form>
                <TagFilterModal
                  isOpen={isTagFilterOpen}
                  onClose={() => setIsTagFilterOpen(false)}
                  selectedTags={tags}
                  onTagsChange={(newTags) => setTags(newTags as StoryTag[])}
                  allowAll={false}
                  modalTitle="Select Story Tags"
                  confirmButtonText="Confirm"
                  cancelButtonText="Cancel"
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default StoryMetaEditor;
