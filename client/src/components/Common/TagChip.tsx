import React from "react";

interface TagChipProps {
  label: string;
  active: boolean;
  onClick?: () => void;
}

// A chip component representing a tag
const TagChip: React.FC<TagChipProps> = ({ label, active, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full border text-sm text-center transition ${
        active
          ? "bg-gray-700 text-white border-gray-700"
          : "bg-white text-gray-700 border-gray-300"
      } ${onClick && !active ? "cursor-pointer hover:bg-gray-100" : ""}`}
    >
      {label}
    </button>
  );
};

export default TagChip;
