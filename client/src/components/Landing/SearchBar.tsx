import React, { useState, useEffect, useRef } from "react";

// type for the prop
interface SearchBarProps {
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ placeholder }) => {
  const [query, setQuery] = useState<string>("");
  const previousState = useRef<{ query: string; hasUpdated: boolean }>({
    query: "",
    hasUpdated: false,
  });

  useEffect(() => {
    console.log("useEffect (componentDidUpdate) executed!");
    console.log("Previous state:", previousState.current);
    console.log("Current state:", { query });
  }, [query]); // runs when query or hasUpdated changes

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      <div className="flex items-center space-x-3">
        <input
          type="text"
          placeholder={placeholder}
          className="border border-gray-400 flex-1 p-3 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          value={query}
          onChange={handleInputChange}
        />
        <button className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 font-medium">
          Search
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
