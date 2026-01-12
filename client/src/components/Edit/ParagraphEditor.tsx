import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { FormEvent, MouseEvent } from "react";
import type { StoryNode } from "@app-types/data";
import DeleteNodeButton from "./DeleteNodeButton";
import UpdateNodeButton from "./UpdateNodeButton";

const MAX_CHAPTER_TITLE_LENGTH = 100;

export interface ParagraphEditorProps {
  node: StoryNode;
  isRoot: boolean;
  onSave: (payload: { chapterTitle: string; text: string }) => void;
  onClose: (payload: { chapterTitle: string; text: string }) => void;
  onDelete: () => void;
}

function ParagraphEditor({
  node,
  isRoot,
  onSave,
  onClose,
  onDelete,
}: ParagraphEditorProps) {
  const [chapterTitle, setChapterTitle] = useState(node.chapterTitle ?? "");
  const [text, setText] = useState(node.content.text);

  // update local state when the node prop changes
  useEffect(() => {
    setChapterTitle(node.chapterTitle ?? "");
    setText(node.content.text);
  }, [node._id, node.chapterTitle, node.content.text]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const trimmedTitle = chapterTitle.trim();
  const baseTitle = (node.chapterTitle ?? "").trim();
  const isDirty = trimmedTitle !== baseTitle || text !== node.content.text;
  const remainingTitleCharacters =
    MAX_CHAPTER_TITLE_LENGTH - chapterTitle.length;
  const isTitleAtLimit = remainingTitleCharacters <= 0;

  const updatedAt = useMemo(
    () =>
      node.updatedAt instanceof Date
        ? node.updatedAt
        : new Date(node.updatedAt),
    [node.updatedAt]
  );

  const hasIncomingEdge = node.parentNodeIds.length > 0;
  const isDangling = !isRoot && !hasIncomingEdge;

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      onSave({ chapterTitle: trimmedTitle, text });
    },
    [onSave, text, trimmedTitle]
  );

  const handleClose = useCallback(() => {
    onClose({ chapterTitle: trimmedTitle, text });
  }, [onClose, text, trimmedTitle]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  const handleBackdropClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        handleClose();
      }
    },
    [handleClose]
  );

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-500 flex items-center justify-center bg-dark-ink/40 px-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal
    >
      <div className="flex h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-paper shadow-2xl">
        <div className="flex items-center justify-between border-b border-secondary-btn/60 px-6 py-4">
          {/* Header with title and done button */}
          <div>
            <h2 className="text-lg font-semibold text-dark-ink">
              Story Fragment
            </h2>
            <p className="text-xs text-faint-ink">Node ID: {node._id}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full border border-secondary-btn/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-secondary-btn transition hover:border-dark-ink hover:text-dark-ink"
          >
            Done
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-5">
          {isRoot && (
            <span className="self-start rounded bg-secondary-btn/20 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-secondary-btn">
              Root
            </span>
          )}

          {/* Warning for dangling story fragment */}
          {isDangling && (
            <div className="rounded-lg border border-danger/60 bg-danger/10 px-3 py-2 text-xs text-danger">
              This story fragment is unlinked and will be excluded from the
              reader. Ensure at least 1 incoming edge is connected.
            </div>
          )}

          {/* Form for editing chapter title and text */}
          <form className="flex flex-1 flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              {/* Input for chapter title */}
              <div className="flex items-center justify-between gap-3">
                <label
                  className="text-xs font-semibold uppercase tracking-wide text-faint-ink"
                  htmlFor="chapterTitle"
                >
                  Chapter title
                </label>
                <span
                  className={`text-[0.6rem] font-semibold uppercase tracking-wide ${
                    isTitleAtLimit ? "text-danger" : "text-secondary-btn"
                  }`}
                >
                  {remainingTitleCharacters} left
                </span>
              </div>
              <input
                id="chapterTitle"
                name="chapterTitle"
                value={chapterTitle}
                onChange={(event) =>
                  setChapterTitle(
                    event.target.value.slice(0, MAX_CHAPTER_TITLE_LENGTH)
                  )
                }
                placeholder="Add a chapter title"
                className="w-full rounded-lg border border-secondary-btn bg-paper px-3 py-2 text-sm text-dark-ink focus:border-add-btn focus:outline-none focus:ring-2 focus:ring-add-btn/60"
              />
            </div>

            {/* Textarea for story fragment text */}
            <div className="flex flex-1 flex-col gap-2">
              <label
                className="text-xs font-semibold uppercase tracking-wide text-faint-ink"
                htmlFor="paragraphText"
              >
                Story fragment text
              </label>
              <textarea
                id="paragraphText"
                name="paragraphText"
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Write the story fragment here..."
                className="h-full min-h-[16rem] w-full flex-1 rounded-lg border border-secondary-btn bg-paper px-3 py-2 text-sm text-dark-ink leading-relaxed focus:border-add-btn focus:outline-none focus:ring-2 focus:ring-add-btn/60"
              />
            </div>

            {/* Footer with delete and save buttons */}
            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
              <DeleteNodeButton
                onConfirm={onDelete}
                disabled={isRoot}
                disabledReason="The root node cannot be deleted"
              />
              <div className="flex items-center gap-2">
                <UpdateNodeButton type="submit" disabled={!isDirty}>
                  Save
                </UpdateNodeButton>
              </div>
            </div>
          </form>

          <div className="text-xs text-faint-ink">
            Last updated {updatedAt.toLocaleString()} by {node.updatedBy}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ParagraphEditor;
