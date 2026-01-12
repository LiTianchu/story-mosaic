import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Save } from 'lucide-react';

interface UpdateNodeButtonProps extends Pick<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "disabled" | "type"> {
    children?: ReactNode;
}

function UpdateNodeButton({ onClick, disabled = false, type = "button", children }: UpdateNodeButtonProps) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-light-ink transition ${disabled
                    ? "cursor-not-allowed bg-secondary-btn/50"
                    : "bg-add-btn hover:bg-emerald-700"
                }`}
        >
            <Save size={14} /> {children ?? "Save changes"}
        </button>
    );
}

export default UpdateNodeButton;
