import React from "react";
import { useEffect } from "react";
import { CheckCircle, AlertTriangle, Info, X } from "lucide-react";

interface MessageProps {
  type: "success" | "error" | "info";
  message: string;
  onClose?: () => void;
  autoClose?: boolean;
  closeAfterMs?: number;
}

const Message: React.FC<MessageProps> = ({
  type,
  message,
  onClose,
  autoClose,
  closeAfterMs,
}) => {
  const baseClasses = "p-3 rounded-lg text-sm mb-4";
  const typeClasses = {
    success: "bg-green-50 text-green-800 border border-green-200",
    error: "bg-red-50 text-red-800 border border-red-200",
    info: "bg-blue-50 text-blue-800 border border-blue-200",
  };

  const icons = {
    success: <CheckCircle size={20} className="text-green-600" />,
    error: <AlertTriangle size={20} className="text-red-600" />,
    info: <Info size={20} className="text-blue-600" />,
  };

  // Auto close effect
  useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, closeAfterMs ?? 3000);
      return () => clearTimeout(timer);
    }
  }, [autoClose, closeAfterMs, onClose]);

  return (
    <div
      className={`${baseClasses} ${typeClasses[type]} flex items-center gap-3 relative`}
    >
      <div>{icons[type]}</div>
      <div className="flex-1">{message}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-black/10"
        >
          {autoClose ? "" : <X size={16} />}
        </button>
      )}
    </div>
  );
};

export default Message;
