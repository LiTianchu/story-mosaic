import { Server, Socket } from "socket.io";
import { Story } from "./models/story.model.js";
import { StoryVersion } from "./models/storyVersion.model.js";
import { StoryNode } from "./models/storyNode.model.js";
import { User } from "./models/user.model.js";

// Track socket connections
interface SocketData {
  userId: string;
  storyId: string;
  storyVersionId: string;
}

// Store socket-to-user mapping
const socketToUserMap = new Map<string, SocketData>();

export const initializeSocketIO = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log(`New client connected: ${socket.id}`);

    socket.on(
      "join-story-room",
      async (storyVersionId: string, userId: string) => {
        try {
          const storyVersion = await StoryVersion.findById(storyVersionId);

          if (!storyVersion) {
            console.error(
              `Attempted to get StoryVersion with ID ${storyVersionId} in socket backend, but it is not found.`
            );
            socket.emit("join-story-draft-error", {
              message: "Story version not found",
            });
            return;
          }
          const storyId = storyVersion.storyId.toString();

          const timeStamp = new Date().toISOString();
          console.log(`[${timeStamp}]`);
          console.log("=== JOIN ROOM EVENT RECEIVED ===");
          console.log("Story ID:", storyId);
          console.log("User ID:", userId);

          socket.join(storyId);
          console.log(`Socket ${socket.id} joined room ${storyId}`);

          // Store socket mapping for cleanup on disconnect
          socketToUserMap.set(socket.id, { userId, storyId, storyVersionId });

          // Get the current story first
          const currentStory = await Story.findById(storyId);

          if (!currentStory) {
            console.error(
              `Attempted to add contributor to Story with ID ${storyId}, but story is not found.`
            );
            socket.emit("join-story-draft-error", {
              message: "Story not found",
            });
            return;
          }

          // Check if user is already in contributors
          const isExistingContributor = currentStory.contributors?.some(
            (c) => c.userId === userId
          );

          // Build update query
          const updateStoryQuery: any = {
            $addToSet: {
              activeContributors: userId,
            },
          };

          // Only add to contributors if not already present
          if (!isExistingContributor) {
            updateStoryQuery.$addToSet.contributors = {
              userId,
              joinedAt: new Date(),
            };
            // add it to user's editedStories as well
            console.log(
              `[CONTRIBUTORS] Adding user ${userId} to contributors of story ${storyId}`
            );

            // Add/update in user's editedStories with updated timestamp
            try {
              // First remove if exists
              await User.findByIdAndUpdate(userId, {
                $pull: { editedStories: { storyId } },
              });
              // Then add at the top with current timestamp
              const updatedUser = await User.findByIdAndUpdate(
                userId,
                {
                  $push: {
                    editedStories: {
                      $each: [
                        {
                          storyId,
                          lastEditedAt: new Date(),
                        },
                      ],
                      $position: 0,
                      $slice: 20,
                    },
                  },
                },
                { new: true }
              );

              if (updatedUser) {
                console.log(
                  `[CONTRIBUTORS] Added story ${storyId} to editedStories of user ${userId}`
                );
              } else {
                console.error(
                  `[CONTRIBUTORS] Failed to add story ${storyId} to editedStories of user ${userId}`
                );
              }
            } catch (error) {
              console.error(
                `[CONTRIBUTORS] Error updating editedStories for user ${userId}:`,
                error
              );
            }
          }

          // Update the story
          const updatedStory = await Story.findByIdAndUpdate(
            storyId,
            updateStoryQuery,
            { new: true }
          );

          if (!updatedStory) {
            console.error(`Failed to update Story with ID ${storyId}.`);
          } else {
            console.log(
              `Updated story ${storyId} to add user ${userId} to active contributors.`
            );

            // Notify ALL users in the room (including the one who just joined)
            io.to(storyId).emit("user-joined-story-draft", {
              userId,
              timestamp: timeStamp,
              activeContributors: updatedStory.activeContributors,
            });
          }
        } catch (error) {
          console.error("Error in join-story-room:", error);
          socket.emit("join-story-draft-error", {
            message: "Failed to join room",
          });
        }
      }
    );

    socket.on(
      "leave-story-room",
      async (storyVersionId: string, userId: string) => {
        try {
          const storyVersion = await StoryVersion.findById(storyVersionId);

          if (!storyVersion) {
            console.error(
              `Attempted to get StoryVersion by ID ${storyVersionId} in socket backend, but it is not found.`
            );
            return;
          }
          const storyId = storyVersion.storyId.toString();

          const timeStamp = new Date().toISOString();
          console.log(`[${timeStamp}]`);
          console.log("=== LEAVE ROOM EVENT RECEIVED ===");
          console.log("Story ID:", storyId);
          console.log("User ID:", userId);

          socket.leave(storyId);
          console.log(`Socket ${socket.id} left room ${storyId}`);

          // Remove from socket mapping
          socketToUserMap.delete(socket.id);

          // Remove user from cleanup
          const updatedStory = await cleanupUserFromStory(
            storyId,
            storyVersionId,
            userId
          );

          // Notify ALL users in the room (including remaining users)
          if (updatedStory) {
            io.to(storyId).emit("user-left-story-draft", {
              userId,
              timestamp: timeStamp,
              activeContributors: updatedStory.activeContributors,
            });
          }
        } catch (error) {
          console.error("Error in leave-story-room:", error);
        }
      }
    );

    socket.on("disconnect", async () => {
      const timeStamp = new Date().toISOString();
      console.log(`[${timeStamp}]`);
      console.log(`Client disconnected: ${socket.id}`);

      // Get user data from mapping
      const userData = socketToUserMap.get(socket.id);

      if (userData) {
        const { userId, storyId, storyVersionId } = userData;
        console.log(
          `Cleaning up user ${userId} from story ${storyId} after disconnect`
        );

        try {
          // Clean up user from story
          const updatedStory = await cleanupUserFromStory(
            storyId,
            storyVersionId,
            userId
          );

          // Notify other users in the room
          if (updatedStory) {
            socket.to(storyId).emit("user-left-story-draft", {
              userId,
              timestamp: timeStamp,
              activeContributors: updatedStory.activeContributors,
            });
          }

          socket.to(storyId).emit("user-disconnected", {
            userId,
            timestamp: timeStamp,
          });
        } catch (error) {
          console.error("Error cleaning up on disconnect:", error);
        } finally {
          // Always remove from mapping
          socketToUserMap.delete(socket.id);
        }
      }
    });
  });
};

// Helper function to clean up user from story and nodes
async function cleanupUserFromStory(
  storyId: string,
  storyVersionId: string,
  userId: string
) {
  try {
    // Remove user from activeContributors (but keep in contributors)
    const updatedStory = await Story.findByIdAndUpdate(
      storyId,
      {
        $pull: { activeContributors: userId },
      },
      { new: true }
    );

    if (updatedStory) {
      console.log(
        `Removed user ${userId} from activeContributors in story ${storyId}`
      );
    } else {
      console.error(`Story ${storyId} not found during cleanup`);
    }

    // Remove user from all story nodes they're in
    const result = await StoryNode.updateMany(
      { versionId: storyVersionId, activeContributors: userId },
      { $pull: { activeContributors: userId } }
    );

    if (result.modifiedCount > 0) {
      console.log(
        `Removed user ${userId} from ${result.modifiedCount} story node(s)`
      );
    } else {
      console.log(`User ${userId} was not in any story nodes`);
    }

    return updatedStory;
  } catch (error) {
    console.error(
      `Error cleaning up user ${userId} from story ${storyId}:`,
      error
    );
    throw error;
  }
}
