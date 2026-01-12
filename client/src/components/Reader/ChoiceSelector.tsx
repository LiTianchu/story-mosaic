import { animated, useSpring } from "@react-spring/web";
import type { StoryNodeWithChildren } from "@app-types/data";
import { useEffect, useState } from "react";

// Component for selecting choices in a story node with multiple branches
function ChoiceSelector(props: {
  branches: StoryNodeWithChildren[];
  onBranchSelect: (branch: StoryNodeWithChildren) => void;
}) {
  const [visibleCountFrom, setVisibleCountFrom] = useState(0);
  const VISIBLE_COUNT = 3;

  useEffect(() => {
    setVisibleCountFrom(0);
  }, [props.branches]);

  const [springProps, api] = useSpring(
    () => ({
      from: { opacity: 0, x: -10 },
      to: { opacity: 1, x: 0 },
      reset: true,
    }),
    []
  );

  const handleNextPage = () => {
    api.start({
      from: { opacity: 0, x: 10 },
      to: { opacity: 1, x: 0 },
      reset: true,
    });
    setVisibleCountFrom((prev) => {
      const next = prev + VISIBLE_COUNT;

      if (next >= props.branches.length) {
        console.log(
          `Showing options from 0 to ${VISIBLE_COUNT} as we've reached the end.`
        );
        return 0; // Wrap to start
      }

      console.log(`Showing options from ${next} to ${next + VISIBLE_COUNT}`);
      return next;
    });
  };

  const handlePreviousPage = () => {
    api.start({
      from: { opacity: 0, x: -10 },
      to: { opacity: 1, x: 0 },
      reset: true,
    });
    setVisibleCountFrom((prev) => {
      const next = prev - VISIBLE_COUNT;

      if (next < 0) {
        const remainder = props.branches.length % VISIBLE_COUNT;
        const newStart =
          remainder === 0
            ? props.branches.length - VISIBLE_COUNT
            : props.branches.length - remainder;

        console.log(
          `Showing options from ${newStart} to ${props.branches.length} as we've reached the start.`
        );
        return newStart;
      }

      console.log(`Showing options from ${next} to ${next + VISIBLE_COUNT}`);
      return next;
    });
  };

  return (
    <animated.div style={springProps} className="space-y-4">
      {/* Choice options */}
      <div>
        {props.branches
          .slice(visibleCountFrom, visibleCountFrom + VISIBLE_COUNT)
          .map((branch, i) => (
            <button
              key={i}
              className="w-full border-b border-gray-200 p-2 text-center hover:drop-shadow hover:text-add-btn transition-colors text-sm cursor-pointer"
              onClick={() => props.onBranchSelect(branch)}
            >
              {branch.content.text}
            </button>
          ))}
      </div>

      {/* Pagination controls */}
      <div className="flex justify-center items-center flex-row">
        <div
          className={`text-center pt-2 ${
            props.branches.length <= VISIBLE_COUNT ? "hidden" : ""
          }`}
        >
          <button
            className="text-dark-ink hover:text-add-btn text-sm transition-colors cursor-pointer"
            onClick={handlePreviousPage}
          >
            ← Prev
          </button>
        </div>
        &nbsp;&nbsp;
        <div
          className={`text-center pt-2 ${
            props.branches.length <= VISIBLE_COUNT ? "hidden" : ""
          }`}
        >
          <button
            className="text-dark-ink hover:text-add-btn text-sm transition-colors cursor-pointer"
            onClick={handleNextPage}
          >
            Next →
          </button>
        </div>
      </div>
    </animated.div>
  );
}

export default ChoiceSelector;
