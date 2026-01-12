import Flowchart from "./Flowchart";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useSocket } from "../../hooks/useSocket";
import { storyApi, storyVersionApi } from "../../services/api";
import StoryMetaEditor from "./StoryMetaEditor";
import BackToStoryManagement from "./BackToStoryManagement";
import CollaboratorView from "./CollaboratorView";
import type { StoryVersion, Story, StoryTag } from "@app-types/data";
import Loading from "@components/Common/Loading"; // Import Loading component
import { useUser } from "../../hooks/useUser";

function EditMain() {
  const [storyVersion, setStoryVersion] = useState<StoryVersion | null>(null);
  const [story, setStory] = useState<Story | null>(null);
  const [activeContributors, setActiveContributors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { storyId } = useParams<{ storyId: string }>();
  const { userProfile } = useUser();
  const socket = useSocket();

  // initialize data on component mount
  useEffect(() => {
    if (!storyId) {
      setError("No story ID provided in the URL.");
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("Loading story for storyId:", storyId);

        // Fetch story and its versions separately
        const [storyData, versions] = await Promise.all([
          storyApi.getById(storyId),
          storyVersionApi.getByStoryId(storyId),
        ]);

        setStory(storyData);

        // Find the draft version (unpublished) or use the latest version
        const currentVersion = versions[0];
        console.log("Fetched versions:", versions);
        console.log("Current version selected:", currentVersion);

        if (!currentVersion) {
          throw new Error("No version found for this story");
        }

        setStoryVersion(currentVersion);
        setActiveContributors(storyData.activeContributors || []);

        console.log("Loaded story:", storyData);
        console.log("Loaded version:", currentVersion);
      } catch (err) {
        console.error("Failed to load story data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load story data"
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [storyId]);

  const handleNewVersionPublished = useCallback(
    (newDraftVersion: StoryVersion) => {
      if (storyVersion && newDraftVersion._id !== storyVersion._id) {
        console.log("Draft version updated via socket:", newDraftVersion);
        alert(
          "The story has been published. The editor will now refresh to load the latest version."
        );
      }
    },
    [storyVersion]
  );

  useEffect(() => {
    if (!socket || !storyId || !storyVersion || !userProfile) {
      return;
    }

    const handleConnect = () => {
      console.log("Socket connected, joining room");
      socket.emit("join-story-room", storyVersion._id, userProfile._id);
    };

    const handleNewContributorJoined = (data: {
      userId: string;
      timestamp: string;
      activeContributors?: string[];
    }) => {
      const {
        userId,
        timestamp,
        activeContributors: newActiveContributors,
      } = data;
      console.log(`[${timestamp}] User ${userId} joined the story draft room.`);

      // If the server provides the full activeContributors list, use it
      if (newActiveContributors) {
        // bring the current user to the front of the list
        setActiveContributors(() => {
          const filtered = newActiveContributors.filter(
            (id) => id !== userProfile._id
          );
          return [userProfile._id, ...filtered];
        });
        //setActiveContributors(newActiveContributors);
      } else {
        // Fallback to adding the user if not already present
        setActiveContributors((prev) => {
          if (!prev.includes(userId)) {
            return [...prev, userId];
          }
          return prev;
        });
      }
    };

    const handleContributorLeft = (data: {
      userId: string;
      timestamp: string;
      activeContributors?: string[];
    }) => {
      const {
        userId,
        timestamp,
        activeContributors: newActiveContributors,
      } = data;
      console.log(`[${timestamp}] User ${userId} left the story draft room.`);

      // If the server provides the full activeContributors list, use it
      if (newActiveContributors) {
        setActiveContributors(newActiveContributors);
      } else {
        // Fallback to removing the user
        setActiveContributors((prev) => prev.filter((id) => id !== userId));
      }
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.on("connect", handleConnect);
    }

    socket.on("new-version-published", handleNewVersionPublished);
    socket.on("user-joined-story-draft", handleNewContributorJoined);
    socket.on("user-left-story-draft", handleContributorLeft);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("new-version-published", handleNewVersionPublished);
      socket.off("user-joined-story-draft", handleNewContributorJoined);
      socket.off("user-left-story-draft", handleContributorLeft);
      if (socket.connected && storyId) {
        console.log(`Leaving room for story: ${storyId}`);
        socket.emit("leave-story-room", storyVersion._id, userProfile._id);
      }
    };
  }, [handleNewVersionPublished, socket, storyId, storyVersion, userProfile]);

  const handleSaveStoryMeta = useCallback(
    async (meta: { title: string; description: string; tags: StoryTag[] }) => {
      if (!storyId) return;

      console.log(
        `Saving story meta data ${JSON.stringify(
          meta
        )} to story with id ${storyId}`
      );
      try {
        const updatedStory = await storyApi.update(storyId, {
          title: meta.title,
          description: meta.description,
          tags: meta.tags,
        });
        setStory(updatedStory); // Update local state with the response from the server
        console.log("Story meta updated successfully:", updatedStory);
      } catch (error) {
        console.error("Failed to update story meta:", error);
        // Optionally, show an error message to the user
      }
    },
    [storyId]
  );

  const handlePublish = useCallback(
    async (meta: { title: string; description: string; tags: StoryTag[] }) => {
      if (!storyId || !storyVersion) return;

      try {
        // first initiate a save to ensure all changes are persisted
        await handleSaveStoryMeta({
          title: meta.title,
          description: meta.description,
          tags: meta.tags,
        });

        // mark the current version as published
        await storyVersionApi.update(storyVersion._id, {
          isPublished: true,
        });

        // create a draft version by cloning the current version
        const newDraftVersion = await storyVersionApi.clone(storyVersion._id);

        // then publish the current version
        const publishPayload: Partial<Story> & { userId?: string } = {
          publishedVersionId: storyVersion._id,
          lastPublishedAt: new Date(),
          userId: userProfile?._id,
        };
        const updatedStory = await storyApi.update(storyId, publishPayload);

        // update the story to reflect the new published version number.
        const updatedStoryDetails = await storyApi.getById(storyId);

        setStory(updatedStoryDetails);
        setStoryVersion(newDraftVersion); // switch to the new draft version

        console.log(`New version ${updatedStory.publishedVersionId} published`);
        console.log("New draft version created:", newDraftVersion);
      } catch (error) {
        console.error("Failed to publish story:", error);
        alert("Failed to publish story. Please try again.");
      }
    },
    [handleSaveStoryMeta, storyId, storyVersion, userProfile]
  );

  return (
    <div className="w-full h-full">
      {loading && <Loading />}
      {error && (
        <div className="flex items-center justify-center h-full">
          <div className="text-lg text-red-500">Error: {error}</div>
        </div>
      )}
      {!loading && !error && story && storyVersion && (
        <>
          <BackToStoryManagement />
          <CollaboratorView userIds={activeContributors} />
          <StoryMetaEditor
            story={story}
            storyVersion={storyVersion}
            onSave={handleSaveStoryMeta}
            onPublish={handlePublish}
          />
          <Flowchart storyVersion={storyVersion} />
        </>
      )}
    </div>
  );
}

export default EditMain;
