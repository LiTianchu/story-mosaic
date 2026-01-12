import { useCallback, useEffect, useMemo, useState } from "react";
import type { MouseEvent } from "react";
import { Position, Handle } from "@xyflow/react";
import type { EditorNodeData } from "./Flowchart";
import type { UserProfile } from "@app-types/data";
import { userApi } from "../../services/api";
import CollaboratorAvatarStack from "./CollaboratorAvatarStack";

function OptionNode({ data }: { data: EditorNodeData }) {
  const { storyNode, width, height, onEdit, onDelete, isSelected, isRoot } =
    data;
  const activeContributors = storyNode?.activeContributors ?? [];
  const [collaborators, setCollaborators] = useState<UserProfile[]>([]);

  // Memoize the activeContributors array to detect actual changes
  const activeContributorsKey = useMemo(
    () => activeContributors.join(","),
    [activeContributors]
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
      onDelete();
    },
    [onDelete]
  );

  useEffect(() => {
    if (!storyNode) {
      return;
    }

    const fetchCollaborators = async () => {
      console.log(
        `OptionNode ${storyNode._id} - activeContributors changed:`,
        activeContributors
      );
      if (activeContributors.length > 0) {
        const profiles = await Promise.all(
          activeContributors.map(async (contributorId) => {
            return await userApi.getUserById(contributorId);
          })
        );
        setCollaborators(profiles.filter((profile) => profile !== null));
        console.log(
          `OptionNode ${storyNode._id} - Updated collaborators:`,
          profiles.length
        );
      } else {
        // Clear collaborators when the array is empty
        setCollaborators([]);
        console.log(`OptionNode ${storyNode._id} - Cleared collaborators`);
      }
    };
    fetchCollaborators();
  }, [activeContributorsKey, storyNode, activeContributors]);

  if (!storyNode) {
    console.error("OptionNode rendered without a storyNode in props data");
    return null;
  }

  if (storyNode && activeContributors.length > 0) {
    console.log(
      `Contributors now at option node ${storyNode._id}:`,
      activeContributors
    );
  }
  // Defensive checks: guard against missing storyNode or malformed data
  const hasIncomingEdge = !!(
    storyNode &&
    Array.isArray(storyNode.parentNodeIds) &&
    storyNode.parentNodeIds.length > 0
  );
  const hasOutgoingEdge = !!(
    storyNode &&
    Array.isArray(storyNode.targetNodeIds) &&
    storyNode.targetNodeIds.length > 0
  );
  // console.log("OptionNode:", { hasIncomingEdge, hasOutgoingEdge });
  const isDangling = !isRoot && (!hasIncomingEdge || !hasOutgoingEdge);
  // console.log("isDangling:", isDangling);

  const containerClasses = `relative flex h-full w-full items-center justify-center rounded-full border bg-node-paragraph shadow-sm transition ${
    isSelected
      ? "border-add-btn ring-2 ring-add-btn"
      : isDangling
      ? "border-danger"
      : "border-secondary-btn"
  }`;

  const rawText = storyNode?.content?.text ?? "";
  const label = rawText.trim().length ? rawText : "Empty option";

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
            className="text-xs font-semibold uppercase tracking-wide text-danger transition hover:text-danger/80 cursor-pointer"
          >
            Delete
          </button>
        </div>
      )}
      {/* warning for dangling nodes */}
      {isDangling && (
        <span className="pointer-events-none absolute top-2 rounded bg-danger/10 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-danger">
          Needs link
        </span>
      )}
      <button
        onDoubleClick={handleEdit}
        className="noDrag flex h-full w-full items-center justify-center rounded-full px-5 py-2 text-center"
      >
        <span className="text-xs font-medium text-dark-ink line-clamp-3">
          {label}
        </span>
      </button>
      <div className="absolute bottom-2 right-8">
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

export default OptionNode;
