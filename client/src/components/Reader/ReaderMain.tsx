import ChapterHeader from "./ChapterHeader";
import TextBody from "./TextBody";
import ChoiceSelector from "./ChoiceSelector";
import StoryTitle from "./StoryTitle";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  storyDetailApi,
  storyNodeApi,
  readSessionApi,
  storyVersionApi,
} from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import type { StoryNodeWithChildren, Story } from "@app-types/data";
import Loading from "../Common/Loading";
import { ArrowLeft } from "lucide-react";

// Main component for reading a story using interactive reader
function ReaderMain() {
  const { storyId } = useParams<{ storyId: string }>();
  const { user } = useAuth();
  const [story, setStory] = useState<Story | null>(null);
  const [currentNode, setCurrentNode] = useState<StoryNodeWithChildren | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // On component mount, load the story data
  useEffect(() => {
    const loadData = async () => {
      if (!storyId) {
        setError("Story ID not found in URL.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch story details to get metadata and root node ID
        const storyDetails = await storyDetailApi.getById(storyId);
        if (!storyDetails.publishedVersionId) {
          setError("This story has not been published yet.");
          setLoading(false);
          return;
        }
        if (!storyDetails || !storyDetails.currentVersion) {
          setError(
            "This story has no current version. The story may be corrupted."
          );
          setLoading(false);
          return;
        }

        setStory(storyDetails);

        console.log("Fetched story details:", storyDetails);
        // Fetch the story tree , backend returns root with children already populated
        const storyTreeRoots = (await storyNodeApi.getTree(
          storyDetails.publishedVersionId
        )) as StoryNodeWithChildren[];

        if (!storyTreeRoots || storyTreeRoots.length === 0) {
          setError(
            "Could not load the story content. The story might be empty."
          );
          setLoading(false);
          return;
        }

        // The first node in the tree is the first paragraph (starting point)
        const firstParagraph = storyTreeRoots[0];
        if (!firstParagraph) {
          setError("No starting paragraph found in this story.");
          setLoading(false);
          return;
        }

        setCurrentNode(firstParagraph);

        // Initialize read session if user is authenticated
        if (user && storyDetails.publishedVersionId) {
          try {
            // Increment read count every time user enters the story
            await storyVersionApi.incrementReadCount(
              storyDetails.publishedVersionId
            );

            // Check if read session already exists
            const existingSession = await readSessionApi.get(
              user._id,
              storyDetails.publishedVersionId
            );

            if (!existingSession) {
              // Create new read session
              await readSessionApi.create(
                user._id,
                storyDetails.publishedVersionId,
                firstParagraph._id
              );
            } else {
              // Update existing session to restart from the beginning
              await readSessionApi.update(
                user._id,
                storyDetails.publishedVersionId,
                firstParagraph._id
              );
            }
          } catch (sessionError) {
            console.error("Error managing read session:", sessionError);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Failed to load story for reader:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [storyId, user]);

  const progressBranchSelection = async (branch: StoryNodeWithChildren) => {
    console.log("Selected branch (option):", branch);
    // An option node's children should contain the next paragraph node.
    const nextParagraph = branch.children?.find(
      (child) => child.type === "paragraph"
    );

    if (nextParagraph) {
      console.log("Progressing to next paragraph:", nextParagraph);
      setCurrentNode(nextParagraph);

      // Update read session when user navigates to a new node
      if (user && story?.publishedVersionId) {
        try {
          await readSessionApi.update(
            user._id,
            story.publishedVersionId,
            nextParagraph._id
          );
        } catch (sessionError) {
          console.error("Error updating read session:", sessionError);
        }
      }
    } else {
      // branch is an endpoint, so stay on the current node but with no more choices.
      setCurrentNode((prev) => (prev ? { ...prev, children: [] } : null));
      console.log("End of branch reached.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            An Error Occurred
          </h2>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!story || !currentNode) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">No story content to display.</p>
      </div>
    );
  }
  console.log("Current story node:", currentNode);

  // Filter out choices that don't lead anywhere
  const availableChoices =
    currentNode.children?.filter(
      (option) => option.type === "option" && option.children?.length > 0
    ) || [];
  console.log(availableChoices);

  return (
    <div className="min-h-screen bg-paper font-body relative">
      <Link
        to={`/story/${storyId}`}
        className="absolute top-4 md:top-1 md:text-sm flex left-4 z-10 items-center text-secondary-btn hover:drop-shadow hover:text-add-btn px-4 py-2 transition-all cursor-pointer"
      >
        <ArrowLeft size={18} className="mr-2" />
        Back to Story
      </Link>
      <div className="w-full max-w-6xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8">
        {/* Story header*/}
        <div className="flex flex-col md:flex-row md:mt-3 md:items-center md:justify-between gap-4 md:gap-0">
          <div className="border-b border-gray-300 pb-4 font-book-title">
            <StoryTitle storyTitle={story.title} />
          </div>
          <div className="border-b border-gray-300 pb-4">
            <ChapterHeader chapterTitle={currentNode.chapterTitle} />
          </div>
        </div>
        {/* Main reading area*/}
        <div className="bg-paper p-2 md:p-4 min-h-96">
          <TextBody textContent={currentNode.content.text} />
        </div>

        {/* Choice/Navigation section*/}
        <div className="border-t border-gray-300 pt-6">
          <ChoiceSelector
            branches={availableChoices}
            onBranchSelect={progressBranchSelection}
          />
        </div>
      </div>
    </div>
  );
}

export default ReaderMain;
