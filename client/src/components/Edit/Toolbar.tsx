import { MessageSquarePlus, Split } from "lucide-react";

// Toolbar component for adding nodes to the story flowchart, appears at the bottom center of the screen
function Toolbar(props: {
  onAddParagraph: () => void;
  onAddOption: () => void;
}) {
  const handleAddParagraph = () => {
    console.log("Add Paragraph Node");
    props.onAddParagraph();
  };

  const handleAddOption = () => {
    console.log("Add Option Node");
    props.onAddOption();
  };

  return (
    <div className="toolbar fixed bottom-20 left-1/2 transform -translate-x-1/2 h-16 px-8 py-2 flex items-center justify-around space-x-6 z-100">
      <button
        className="toolbar-button w-16 h-16 flex items-center border border-add-btn justify-center text-add-btn hover:text-light-ink bg-paper hover:bg-add-btn px-4 py-2 rounded-full cursor-pointer shadow-lg"
        onClick={handleAddParagraph}
        title="Add Paragraph"
      >
        <MessageSquarePlus size={24} />
      </button>
      <button
        className="toolbar-button w-16 h-16 flex items-center border border-add-btn justify-center text-add-btn hover:text-light-ink bg-paper hover:bg-add-btn px-4 py-2 rounded-full cursor-pointer shadow-lg"
        onClick={handleAddOption}
        title="Add Option"
      >
        <Split size={24} />
      </button>
    </div>
  );
}

export default Toolbar;
