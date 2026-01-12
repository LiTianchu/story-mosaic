import { useCallback, useEffect, useState, useMemo } from "react";
import type { MouseEvent } from "react";
import { Position, Handle } from "@xyflow/react";
import type { UserProfile } from "@app-types/data";
import { userApi } from "../../services/api";
import type { EditorNodeData } from "./Flowchart";
import CollaboratorAvatarStack from "./CollaboratorAvatarStack";

function ParagraphNode({ data }: { data: EditorNodeData }) {
  const { storyNode, width, height, onEdit, onDelete, isSelected, isRoot } =
    data;

  const [collaborators, setCollaborators] = useState<UserProfile[]>([]);

  // Memoize the activeContributors array to detect actual changes
  const activeContributorsKey = useMemo(
    () => storyNode.activeContributors?.join(",") || "",
    [storyNode.activeContributors]
  );

  const handleEdit = useCallback(
    (evt: MouseEvent<HTMLButtonElement>) => {
      evt.preventDefault();
      evt.stopPropagation();
      onEdit();
    },
    [onEdit]
  );

  const handleDelete = useCallback(
    (evt: MouseEvent<HTMLButtonElement>) => {
      evt.preventDefault();
      evt.stopPropagation();
      if (isRoot) {
        return;
      }
      onDelete();
    },
    [isRoot, onDelete]
  );

  useEffect(() => {
    const fetchCollaborators = async () => {
      console.log(
        `ParagraphNode ${storyNode._id} - activeContributors changed:`,
        storyNode.activeContributors
      );
      if (
        storyNode.activeContributors &&
        storyNode.activeContributors.length > 0
      ) {
        const profiles = await Promise.all(
          storyNode.activeContributors.map(async (contributorId) => {
            return await userApi.getUserById(contributorId);
          })
        );
        setCollaborators(profiles.filter((profile) => profile !== null));
        console.log(
          `ParagraphNode ${storyNode._id} - Updated collaborators:`,
          profiles.length
        );
      } else {
        // Clear collaborators when the array is empty
        setCollaborators([]);
        console.log(`ParagraphNode ${storyNode._id} - Cleared collaborators`);
      }
    };
    fetchCollaborators();
  }, [activeContributorsKey, storyNode.activeContributors, storyNode._id]);

  if (!storyNode) {
    console.error("Paragraph node rendered without a storyNode in props data");
    return null;
  }
  // Defensive checks: guard against missing storyNode or malformed data
  const hasIncomingEdge = !!(
    storyNode &&
    Array.isArray(storyNode.parentNodeIds) &&
    storyNode.parentNodeIds.length > 0
  );
  const isDangling = !isRoot && !hasIncomingEdge;

  if (
    storyNode &&
    storyNode.activeContributors &&
    storyNode.activeContributors.length > 0
  ) {
    console.log(
      `Contributors now at paragraph node ${storyNode._id}:`,
      storyNode.activeContributors
    );
  }
  const containerClasses = `paragraph-node relative flex h-full w-full flex-col rounded-xl border bg-node-paragraph shadow-sm transition ${
    isSelected
      ? "border-add-btn ring-2 ring-add-btn"
      : isDangling
      ? "border-danger"
      : "border-secondary-btn"
  }`;

  const title = storyNode?.chapterTitle?.trim().length
    ? storyNode.chapterTitle
    : "Untitled fragment";
  const previewText = storyNode?.content?.text?.trim().length
    ? storyNode.content.text
    : "No prose added yet.";

  const targetHandleClasses =
    "!w-4 !h-4 !border-2 !border-paper !bg-secondary-btn !shadow-sm !rounded-full"; // tailwind classes for top handle
  const sourceHandleClasses =
    "!w-4 !h-4 !border-2 !border-paper !bg-add-btn !shadow-sm !rounded-full"; // tailwind classes for bottom handle

  return (
    <div
      style={{ width: `${width}px`, height: `${height}px` }}
      className={containerClasses}
    >
      {isSelected && (
        <div className="absolute -top-10 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-secondary-btn bg-paper/95 px-3 py-1 shadow-lg">
          <button
            type="button"
            onClick={handleEdit}
            className="text-xs font-semibold uppercase tracking-wide text-add-btn transition hover:text-add-btn/80 cursor-pointer"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isRoot}
            className={`text-xs font-semibold uppercase tracking-wide transition ${
              isRoot
                ? "cursor-not-allowed text-faint-ink"
                : "text-danger hover:text-danger/80 cursor-pointer"
            }`}
            title={isRoot ? "Root node cannot be deleted" : "Delete fragment"}
          >
            Delete
          </button>
        </div>
      )}
      {/* warning for dangling nodes */}
      {isDangling && (
        <span className="pointer-events-none absolute right-3 top-2 rounded bg-danger/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-danger">
          Needs link
        </span>
      )}
      {/* root node label */}
      {isRoot && (
        <span className="pointer-events-none absolute right-3 top-2 rounded bg-secondary-btn/20 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-secondary-btn">
          Root
        </span>
      )}
      <button
        onDoubleClick={handleEdit}
        className="noDrag flex h-full w-full flex-col items-stretch justify-start gap-2 rounded-xl px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-dark-ink">{title}</span>
        <span className="overflow-hidden text-xs leading-relaxed line-clamp-4 text-faint-ink">
          {previewText}
        </span>
      </button>
      <div className="absolute bottom-1 right-3">
        <CollaboratorAvatarStack userProfiles={collaborators} />
      </div>
      <Handle
        type="target"
        position={Position.Top}
        className={targetHandleClasses}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className={sourceHandleClasses}
      />
    </div>
  );
}

export default ParagraphNode;
