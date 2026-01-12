import { useNavigate } from "react-router-dom";
import { CircleChevronLeft } from "lucide-react";

function BackToStoryManagement() {
  const navigate = useNavigate();

  const goToManageStory = () => {
    navigate("/managestory");
  };

  return (
    <div className="fixed rounded-br-xl top-0 left-0 bg-node-paragraph xl:px-6 md:px-3 sm:px-1.5 xl:py-4 md:py-2 sm:py-1 border border-secondary-btn shadow-md xl:w-50 xl:h-12 md:w-42 md:h-10 sm:w-35 sm:h-8 z-50">
      <a
        onClick={goToManageStory}
        role="button"
        tabIndex={0}
        className="flex w-full h-full gap-4 cursor-pointer justify-center items-center text-add-btn hover:drop-shadow-sm hover:shadow-dark-ink"
      >
        <CircleChevronLeft />
        <span>Workspace</span>
      </a>
    </div>
  );
}

export default BackToStoryManagement;
