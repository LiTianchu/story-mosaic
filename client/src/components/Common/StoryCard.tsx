import type { StoryWithStats } from "@/types/data";
import { useNavigate } from "react-router-dom";
import { Star, Eye } from "lucide-react";

const StoryCard = ({
  story,
  clickable,
}: {
  story: StoryWithStats;
  clickable: boolean;
}) => {
  const navigate = useNavigate();
  return (
    <div
      className={`border border-dark-ink rounded-lg overflow-hidden shadow-sm hover:shadow-md transition ${
        clickable ? "cursor-pointer" : ""
      }`}
      onClick={clickable ? () => navigate(`/story/${story._id}`) : undefined}
    > 
     {story.image ? (
                <img
                  src={story.image}
                  alt={story.title}
                  className="w-full h-40 object-cover"
                />
              ) : (
                <div className="w-full h-40 bg-gradient-to-br from-add-btn to-secondary-btn flex items-center justify-center">
                  <span className="text-white text-sm">No Cover Image</span>
                </div>
              )}
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-1">{story.title}</h3>
        <p className="text-sm text-gray-600 mt-2">
          {" "}
          {story.stats?.starCount}{" "}
          <Star size={16} className="inline-block text-yellow-500" />{" "}
          {story.stats?.readCount}{" "}
          <Eye size={16} className="inline-block text-blue-500" />{" "}
        </p>
      </div>
    </div>
  );
};

export default StoryCard;
