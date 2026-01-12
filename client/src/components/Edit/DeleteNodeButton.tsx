import { Trash2 } from "lucide-react";

interface DeleteNodeButtonProps {
  onConfirm: () => void;
  disabled?: boolean;
  disabledReason?: string;
}

function DeleteNodeButton({
  onConfirm,
  disabled = false,
  disabledReason,
}: DeleteNodeButtonProps) {
  if (disabled) {
    // Disabled state of the delete button
    return (
      <button
        type="button"
        disabled
        title={disabledReason}
        className="flex cursor-not-allowed items-center gap-2 rounded-lg border border-secondary-btn/60 bg-secondary-btn/20 px-3 py-2 text-sm font-semibold text-secondary-btn"
      >
        <Trash2 size={14} /> Delete
      </button>
    );
  }

  // Enabled state of the delete button
  return (
    <button
      type="button"
      className="flex items-center gap-2 rounded-lg border border-danger px-3 py-2 text-sm font-semibold text-danger transition hover:bg-danger/10"
      onClick={onConfirm}
    >
      <Trash2 size={14} /> Delete
    </button>
  );
}

export default DeleteNodeButton;
