import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { FormEvent, MouseEvent } from "react";
import type { StoryNode } from "@app-types/data";
import DeleteNodeButton from "./DeleteNodeButton";
import UpdateNodeButton from "./UpdateNodeButton";

const MAX_OPTION_TEXT_LENGTH = 140;

export interface OptionEditorProps {
    node: StoryNode;
    isRoot: boolean;
    onSave: (payload: { text: string }) => void;
    onClose: (payload: { text: string }) => void;
    onDelete: () => void;
}

function OptionEditor({ node, isRoot, onSave, onClose, onDelete }: OptionEditorProps) {
    const [text, setText] = useState(node.content.text);

    // update local state when the node prop changes
    // runs whenever node._id or node.content.text changes
    useEffect(() => {
        setText(node.content.text);
    }, [node._id, node.content.text]);

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, []);

    // determine if the text has been modified
    const isDirty = text !== node.content.text;
    const remainingCharacters = MAX_OPTION_TEXT_LENGTH - text.length;
    const isAtLimit = remainingCharacters === 0;

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onSave({ text });
    };

    const updatedAt = useMemo(
        () => (node.updatedAt instanceof Date ? node.updatedAt : new Date(node.updatedAt)),
        [node.updatedAt]
    );

    // determine if the node is dangling (not root and has no incoming edges)
    const hasIncomingEdge = node.parentNodeIds.length > 0;
    const hasOutgoingEdge = node.targetNodeIds.length > 0;
    const isDangling = !isRoot && (!hasIncomingEdge || !hasOutgoingEdge);

    // handle closing the editor
    const handleClose = useCallback(() => {
        onClose({ text });
    }, [onClose, text]);

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
            <div className="flex w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-paper shadow-2xl">
                <div className="flex items-center justify-between border-b border-secondary-btn/60 px-6 py-4">
                    <div>
                        <h2 className="text-lg font-semibold text-dark-ink">Option</h2>
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
                    {isDangling && (
                        <div className="rounded-lg border border-danger/60 bg-danger/10 px-3 py-2 text-xs text-danger">
                            This choice is unlinked and will be excluded from the reader. Ensure at least 1 incoming edge and 1 outgoing edge is present.
                        </div>
                    )}

                    <form className="flex flex-1 flex-col gap-4" onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-3">
                                <label className="text-xs font-semibold uppercase tracking-wide text-faint-ink" htmlFor="optionText">
                                    Choice text
                                </label>
                                <span className={`text-[0.6rem] font-semibold uppercase tracking-wide ${isAtLimit ? "text-danger" : "text-secondary-btn"}`}>
                                    {remainingCharacters} left
                                </span>
                            </div>
                            <textarea
                                id="optionText"
                                name="optionText"
                                value={text}
                                onChange={(event) => setText(event.target.value.slice(0, MAX_OPTION_TEXT_LENGTH))}
                                rows={4}
                                placeholder="Describe the choice the reader can make..."
                                maxLength={MAX_OPTION_TEXT_LENGTH}
                                className="w-full rounded-lg border border-secondary-btn bg-paper px-3 py-2 text-sm text-dark-ink leading-relaxed focus:border-add-btn focus:outline-none focus:ring-2 focus:ring-add-btn/60"
                            />
                            {isAtLimit && (
                                <p className="text-[0.65rem] font-medium text-danger">
                                    Choices are limited to {MAX_OPTION_TEXT_LENGTH} characters.
                                </p>
                            )}
                        </div>

                        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <DeleteNodeButton onConfirm={onDelete} />
                            </div>
                            <UpdateNodeButton type="submit" disabled={!isDirty}>
                                Save
                            </UpdateNodeButton>
                        </div>
                    </form>

                    <div className="space-y-2 text-xs text-faint-ink">
                        <p>Last updated {updatedAt.toLocaleString()} by {node.updatedBy}</p>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default OptionEditor;
