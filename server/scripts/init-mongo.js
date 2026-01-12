// MongoDB Initialization Script
// This script populates the database with initial data for development
// ******
// To run this script use:
// docker compose -f docker-compose.dev.yml exec mongodb mongosh story-mosaic scripts/init-mongo.js
// ******
// Connect to the database
db = db.getSiblingDB("story-mosaic");

print("Starting database initialization...");

// Drop existing collections if they exist
db.users.drop();
db.stories.drop();
db.storyNodes.drop();
db.storyVersions.drop();
db.readSessions.drop();
db.nodeLocks.drop();
db.stars.drop();

print("Dropped existing collections");

// Create collections
db.createCollection("users");
db.createCollection("stories");
db.createCollection("storyNodes");
db.createCollection("storyVersions");
db.createCollection("readSessions");
db.createCollection("nodeLocks");
db.createCollection("stars");

print("Created collections");

// ==================== USERS ====================
const aliceId = ObjectId("507f1f77bcf86cd799439011");
const bobId = ObjectId("507f1f77bcf86cd799439012");
const charlieId = ObjectId("507f1f77bcf86cd799439013");
const dianaId = ObjectId("507f1f77bcf86cd799439014");

db.users.insertMany([
  {
    _id: aliceId,
    uid: "firebase-uid-alice",
    email: "alice@storymosaic.com",
    displayName: "Alice Wonderland",
    bio: "Fantasy writer and world-builder. I create immersive adventures with branching narratives.",
    avatarImage: "https://i.pravatar.cc/150?img=1",
    createdAt: new Date("2025-01-15T10:00:00Z"),
    updatedAt: new Date("2025-11-10T14:30:00Z"),
  },
  {
    _id: bobId,
    uid: "firebase-uid-bob",
    email: "bob@storymosaic.com",
    displayName: "Bob Sci-Fi",
    bio: "Sci-fi enthusiast exploring the boundaries of space and time through interactive stories.",
    avatarImage: "https://i.pravatar.cc/150?img=12",
    createdAt: new Date("2025-02-20T12:00:00Z"),
    updatedAt: new Date("2025-11-09T16:45:00Z"),
  },
  {
    _id: charlieId,
    uid: "firebase-uid-charlie",
    email: "charlie@storymosaic.com",
    displayName: "Charlie Mystery",
    bio: "Mystery and thriller writer. Every choice matters, every clue counts.",
    avatarImage: "https://i.pravatar.cc/150?img=33",
    createdAt: new Date("2025-03-10T09:00:00Z"),
    updatedAt: new Date("2025-11-08T18:00:00Z"),
  },
  {
    _id: dianaId,
    uid: "firebase-uid-diana",
    email: "diana@storymosaic.com",
    displayName: "Diana Reader",
    bio: "Avid reader and story explorer. I love getting lost in branching narratives.",
    avatarImage: "https://i.pravatar.cc/150?img=45",
    createdAt: new Date("2025-04-05T11:30:00Z"),
    updatedAt: new Date("2025-11-10T12:15:00Z"),
  },
]);

print("Inserted " + db.users.countDocuments() + " users");

// ==================== STORY 1: The Lost Island (Published) ====================
const story1Id = ObjectId("65a1b2c3d4e5f67890123450");
const story1Version1Id = ObjectId("65a1b2c3d4e5f67890123451");
const story1RootNodeId = ObjectId("65a1b2c3d4e5f67890123010");

// Story 1 Version 1 - Published nodes (Complete story tree)
const story1V1Nodes = [
  {
    _id: story1RootNodeId,
    storyId: story1Id,
    versionId: story1Version1Id.toString(),
    type: "paragraph",
    parentNodeIds: [],
    targetNodeIds: [
      ObjectId("65a1b2c3d4e5f67890123020"),
      ObjectId("65a1b2c3d4e5f67890123030"),
    ],
    positionOnFlowchart: { x: 0, y: 0 },
    chapterTitle: "Awakening",
    content: {
      text: "You wake up on a floating island, the ground beneath you soft with moss. The air is crisp and smells of salt and wildflowers. In the distance, you can see other islands drifting lazily through the clouds. Below, there's nothing but an endless sea of white.",
    },
    createdBy: aliceId.toString(),
    updatedBy: aliceId.toString(),
    // Assign Alice to this node (each user may be active in at most one node)
    activeContributors: [aliceId.toString()],
    createdAt: new Date("2025-09-15T08:30:00Z"),
    updatedAt: new Date("2025-10-05T12:00:00Z"),
  },
  {
    _id: ObjectId("65a1b2c3d4e5f67890123020"),
    storyId: story1Id,
    versionId: story1Version1Id.toString(),
    type: "option",
    parentNodeIds: [story1RootNodeId],
    targetNodeIds: [ObjectId("65a1b2c3d4e5f67890123040")],
    positionOnFlowchart: { x: -660, y: 320 },
    chapterTitle: null,
    content: { text: "Explore the ancient ruins to the east" },
    createdBy: aliceId.toString(),
    updatedBy: aliceId.toString(),
    // No active contributors here (empty array)
    activeContributors: [],
    createdAt: new Date("2025-09-15T08:35:00Z"),
    updatedAt: new Date("2025-09-15T08:35:00Z"),
  },
  {
    _id: ObjectId("65a1b2c3d4e5f67890123030"),
    storyId: story1Id,
    versionId: story1Version1Id.toString(),
    type: "option",
    parentNodeIds: [story1RootNodeId],
    targetNodeIds: [ObjectId("65a1b2c3d4e5f67890123070")],
    positionOnFlowchart: { x: 660, y: 320 },
    chapterTitle: null,
    content: { text: "Search for other inhabitants" },
    createdBy: aliceId.toString(),
    updatedBy: aliceId.toString(),
    // Assign Charlie to this single node (unique across nodes)
    activeContributors: [],
    createdAt: new Date("2025-09-15T08:40:00Z"),
    updatedAt: new Date("2025-09-15T08:40:00Z"),
  },
  {
    _id: ObjectId("65a1b2c3d4e5f67890123040"),
    storyId: story1Id,
    versionId: story1Version1Id.toString(),
    type: "paragraph",
    parentNodeIds: [ObjectId("65a1b2c3d4e5f67890123020")],
    targetNodeIds: [
      ObjectId("65a1b2c3d4e5f67890123050"),
      ObjectId("65a1b2c3d4e5f67890123060"),
    ],
    positionOnFlowchart: { x: -660, y: 640 },
    chapterTitle: "The Ancient Ruins",
    content: {
      text: "The ruins are older than anything you've ever seen. Massive stone pillars reach toward the sky, covered in glowing runes that pulse with a faint blue light. At the center stands a temple, its entrance dark and foreboding.",
    },
    createdBy: aliceId.toString(),
    updatedBy: bobId.toString(),
    // Assign Bob to this single node (unique across nodes)
    activeContributors: [bobId.toString()],
    createdAt: new Date("2025-09-16T09:00:00Z"),
    updatedAt: new Date("2025-10-02T14:20:00Z"),
  },
  {
    _id: ObjectId("65a1b2c3d4e5f67890123050"),
    storyId: story1Id,
    versionId: story1Version1Id.toString(),
    type: "option",
    parentNodeIds: [ObjectId("65a1b2c3d4e5f67890123040")],
    targetNodeIds: [ObjectId("65a1b2c3d4e5f67890123090")],
    positionOnFlowchart: { x: -1100, y: 960 },
    chapterTitle: null,
    content: { text: "Enter the temple" },
    createdBy: aliceId.toString(),
    updatedBy: aliceId.toString(),
    // No active contributors here
    activeContributors: [],
    createdAt: new Date("2025-09-16T09:15:00Z"),
    updatedAt: new Date("2025-09-16T09:15:00Z"),
  },
  {
    _id: ObjectId("65a1b2c3d4e5f67890123060"),
    storyId: story1Id,
    versionId: story1Version1Id.toString(),
    type: "option",
    parentNodeIds: [ObjectId("65a1b2c3d4e5f67890123040")],
    targetNodeIds: [ObjectId("65a1b2c3d4e5f678901230a0")],
    positionOnFlowchart: { x: -220, y: 960 },
    chapterTitle: null,
    content: { text: "Study the glowing runes" },
    createdBy: bobId.toString(),
    updatedBy: bobId.toString(),
    // Assign Diana to this single node (unique across nodes)
    activeContributors: [dianaId.toString()],
    createdAt: new Date("2025-09-17T10:00:00Z"),
    updatedAt: new Date("2025-09-17T10:00:00Z"),
  },
  {
    _id: ObjectId("65a1b2c3d4e5f67890123070"),
    storyId: story1Id,
    versionId: story1Version1Id.toString(),
    type: "paragraph",
    parentNodeIds: [ObjectId("65a1b2c3d4e5f67890123030")],
    targetNodeIds: [ObjectId("65a1b2c3d4e5f67890123080")],
    positionOnFlowchart: { x: 660, y: 640 },
    chapterTitle: "The Shimmering Village",
    content: {
      text: "You follow a winding path through a grove of crystalline trees. Their leaves chime softly in the breeze. Soon, you hear voices—a small village nestled between two hills. The inhabitants are humanoid but with skin that shimmers like mother-of-pearl.",
    },
    createdBy: aliceId.toString(),
    updatedBy: aliceId.toString(),
    // No active contributors here
    activeContributors: [],
    createdAt: new Date("2025-09-18T11:00:00Z"),
    updatedAt: new Date("2025-09-20T16:30:00Z"),
  },
  {
    _id: ObjectId("65a1b2c3d4e5f67890123080"),
    storyId: story1Id,
    versionId: story1Version1Id.toString(),
    type: "option",
    parentNodeIds: [ObjectId("65a1b2c3d4e5f67890123070")],
    targetNodeIds: [ObjectId("65a1b2c3d4e5f678901230b0")],
    positionOnFlowchart: { x: 220, y: 960 },
    chapterTitle: null,
    content: { text: "Approach peacefully and greet them" },
    createdBy: aliceId.toString(),
    updatedBy: aliceId.toString(),
    // No active contributors here
    activeContributors: [],
    createdAt: new Date("2025-09-18T11:15:00Z"),
    updatedAt: new Date("2025-09-18T11:15:00Z"),
  },
  {
    _id: ObjectId("65a1b2c3d4e5f67890123090"),
    storyId: story1Id,
    versionId: story1Version1Id.toString(),
    type: "paragraph",
    parentNodeIds: [ObjectId("65a1b2c3d4e5f67890123050")],
    targetNodeIds: [],
    positionOnFlowchart: { x: -1100, y: 1280 },
    chapterTitle: "Inside the Temple",
    content: {
      text: "Inside the temple, the air hums with energy. Ancient murals cover the walls, depicting a civilization that once commanded the very clouds. At the far end, a pedestal holds a crystalline orb that pulses with inner light. As you approach, whispers fill your mind—fragments of forgotten knowledge.",
    },
    createdBy: aliceId.toString(),
    updatedBy: bobId.toString(),
    // No active contributors here
    activeContributors: [],
    createdAt: new Date("2025-09-20T13:00:00Z"),
    updatedAt: new Date("2025-10-01T09:45:00Z"),
  },
  {
    _id: ObjectId("65a1b2c3d4e5f678901230a0"),
    storyId: story1Id,
    versionId: story1Version1Id.toString(),
    type: "paragraph",
    parentNodeIds: [ObjectId("65a1b2c3d4e5f67890123060")],
    targetNodeIds: [],
    positionOnFlowchart: { x: -220, y: 1280 },
    chapterTitle: "The Glowing Runes",
    content: {
      text: "The runes seem to respond to your touch, growing brighter. You realize they're not just decoration—they're a map. A map of all the floating islands, connected by invisible threads of energy. One island in particular stands out, pulsing with a deep red glow. Something important is there.",
    },
    createdBy: bobId.toString(),
    updatedBy: bobId.toString(),
    // No active contributors here
    activeContributors: [],
    createdAt: new Date("2025-09-22T14:30:00Z"),
    updatedAt: new Date("2025-09-22T14:30:00Z"),
  },
  {
    _id: ObjectId("65a1b2c3d4e5f678901230b0"),
    storyId: story1Id,
    versionId: story1Version1Id.toString(),
    type: "paragraph",
    parentNodeIds: [ObjectId("65a1b2c3d4e5f67890123080")],
    targetNodeIds: [],
    positionOnFlowchart: { x: 220, y: 1280 },
    chapterTitle: "Meeting the Inhabitants",
    content: {
      text: "The villagers regard you with curiosity rather than fear. An elder steps forward, her eyes the color of storm clouds. 'Another dreamer,' she says softly. 'You've been called here, just as we all were, long ago. The islands choose who may walk upon them.' She gestures to the horizon. 'But be warned—not all who are called survive the journey to understanding.'",
    },
    createdBy: aliceId.toString(),
    updatedBy: aliceId.toString(),
    // No active contributors here
    activeContributors: [],
    createdAt: new Date("2025-09-25T10:00:00Z"),
    updatedAt: new Date("2025-10-03T11:20:00Z"),
  },
];

db.storyNodes.insertMany(story1V1Nodes);

// Story 1 - Published Version (Version 1 only)
db.storyVersions.insertOne({
  _id: story1Version1Id,
  storyId: story1Id,
  versionNumber: 1,
  isPublished: true,
  rootNodeId: story1RootNodeId.toString(),
  nodeIds: story1V1Nodes.map((n) => n._id),
  readCount: 1247,
  createdBy: aliceId.toString(),
  updatedBy: aliceId.toString(),
  createdAt: new Date("2025-09-15T08:00:00Z"),
  updatedAt: new Date("2025-10-10T15:30:00Z"),
});

// Story 1 Record
db.stories.insertOne({
  _id: story1Id,
  ownerId: aliceId.toString(),
  title: "The Lost Island",
  description:
    "An adventure in a floating world where every choice shapes your destiny. Explore ancient ruins, meet mysterious inhabitants, and uncover the secrets of the sky.",
  tags: ["fantasy", "exploration", "adventure"],
  contributors: [
    { userId: bobId.toString(), joinedAt: new Date("2025-10-01T10:00:00Z") },
    { userId: aliceId.toString(), joinedAt: new Date("2025-10-01T10:00:00Z") },
    { userId: dianaId.toString(), joinedAt: new Date("2025-10-01T10:00:00Z") },
    {
      userId: charlieId.toString(),
      joinedAt: new Date("2025-10-01T10:00:00Z"),
    },
  ],
  // Active contributors for the story (currently Alice + Bob)
  activeContributors: [
    aliceId.toString(),
    bobId.toString(),
    dianaId.toString(),
  ],
  publishedVersionId: story1Version1Id.toString(),
  lastPublishedAt: new Date("2025-10-10T15:30:00Z"),
  image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
  createdAt: new Date("2025-09-15T08:00:00Z"),
  updatedAt: new Date("2025-11-05T10:20:00Z"),
});

print("Inserted Story 1: The Lost Island");

// ==================== READ SESSIONS ====================
db.readSessions.insertMany([
  {
    _id: ObjectId("65a1b2c3d4e5f67890124000"),
    storyId: story1Id,
    versionId: story1Version1Id,
    userId: dianaId.toString(),
    lastVisitedNodeId: ObjectId("65a1b2c3d4e5f67890123040"),
    visitedNodes: [
      { nodeId: story1RootNodeId, visitedAt: new Date("2025-11-09T18:00:00Z") },
      {
        nodeId: ObjectId("65a1b2c3d4e5f67890123020"),
        visitedAt: new Date("2025-11-09T18:02:00Z"),
      },
      {
        nodeId: ObjectId("65a1b2c3d4e5f67890123040"),
        visitedAt: new Date("2025-11-09T18:05:00Z"),
      },
    ],
    startedAt: new Date("2025-11-09T18:00:00Z"),
    lastActiveAt: new Date("2025-11-09T18:05:00Z"),
  },

  {
    _id: ObjectId("65a1b2c3d4e5f67890124002"),
    storyId: story1Id,
    versionId: story1Version1Id,
    userId: charlieId.toString(),
    lastVisitedNodeId: ObjectId("65a1b2c3d4e5f678901230b0"),
    visitedNodes: [
      { nodeId: story1RootNodeId, visitedAt: new Date("2025-11-05T15:00:00Z") },
      {
        nodeId: ObjectId("65a1b2c3d4e5f67890123030"),
        visitedAt: new Date("2025-11-05T15:03:00Z"),
      },
      {
        nodeId: ObjectId("65a1b2c3d4e5f67890123070"),
        visitedAt: new Date("2025-11-05T15:06:00Z"),
      },
      {
        nodeId: ObjectId("65a1b2c3d4e5f67890123080"),
        visitedAt: new Date("2025-11-05T15:09:00Z"),
      },
      {
        nodeId: ObjectId("65a1b2c3d4e5f678901230b0"),
        visitedAt: new Date("2025-11-05T15:12:00Z"),
      },
    ],
    startedAt: new Date("2025-11-05T15:00:00Z"),
    lastActiveAt: new Date("2025-11-05T15:12:00Z"),
  },
]);

print("Inserted " + db.readSessions.countDocuments() + " read sessions");

// ==================== NODE LOCKS ====================
// Note: Node locks are temporary and will be empty on init
print("Skipped node locks (temporary data)");

// ==================== STARS ====================
db.stars.insertMany([
  {
    _id: ObjectId("65a1b2c3d4e5f67890126000"),
    userId: dianaId.toString(),
    storyId: story1Id,
    createdAt: new Date("2025-10-12T08:00:00Z"),
    updatedAt: new Date("2025-10-12T08:00:00Z"),
  },
  {
    _id: ObjectId("65a1b2c3d4e5f67890126001"),
    userId: bobId.toString(),
    storyId: story1Id,
    createdAt: new Date("2025-10-05T12:30:00Z"),
    updatedAt: new Date("2025-10-05T12:30:00Z"),
  },
  {
    _id: ObjectId("65a1b2c3d4e5f67890126002"),
    userId: charlieId.toString(),
    storyId: story1Id,
    createdAt: new Date("2025-11-01T09:15:00Z"),
    updatedAt: new Date("2025-11-01T09:15:00Z"),
  },
]);

print("Inserted " + db.stars.countDocuments() + " stars");

// ==================== INDEXES ====================
print("Creating indexes...");

db.stories.createIndex({ ownerId: 1 });
db.stories.createIndex({ tags: 1 });
db.stories.createIndex({ publishedVersionId: 1 });
db.stories.createIndex({ createdAt: -1 });
db.stories.createIndex({ updatedAt: -1 });

db.storyNodes.createIndex({ storyId: 1, versionId: 1 });
db.storyNodes.createIndex({ parentNodeIds: 1 });
db.storyNodes.createIndex({ targetNodeIds: 1 });
db.storyNodes.createIndex({ type: 1 });
db.storyNodes.createIndex({ createdBy: 1 });

db.storyVersions.createIndex({ storyId: 1, versionNumber: -1 });
db.storyVersions.createIndex({ storyId: 1, isPublished: 1 });
db.storyVersions.createIndex({ createdAt: -1 });
db.storyVersions.createIndex({ rootNodeId: 1 });

db.readSessions.createIndex({ userId: 1, storyId: 1 });
db.readSessions.createIndex({ storyId: 1, versionId: 1 });
db.readSessions.createIndex({ lastActiveAt: -1 });

db.nodeLocks.createIndex({ storyId: 1, nodeId: 1 });
db.nodeLocks.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
db.nodeLocks.createIndex({ lockedBy: 1 });

db.users.createIndex({ uid: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });

db.stars.createIndex({ userId: 1, storyId: 1 }, { unique: true });
db.stars.createIndex({ storyId: 1 });
db.stars.createIndex({ createdAt: -1 });

print("Created indexes");

// ==================== SUMMARY ====================
print("\n====================================");
print("Database initialization completed successfully!");
print("====================================");
print("\nData Summary:");
print("  - Users: " + db.users.countDocuments());
print("  - Stories: " + db.stories.countDocuments());
print(
  "    • Published: " +
    db.stories.countDocuments({ publishedVersionId: { $ne: null } })
);
print(
  "    • Drafts: " + db.stories.countDocuments({ publishedVersionId: null })
);
print("  - Story Nodes: " + db.storyNodes.countDocuments());
print("  - Story Versions: " + db.storyVersions.countDocuments());
print(
  "    • Published: " + db.storyVersions.countDocuments({ isPublished: true })
);
print(
  "    • Drafts: " + db.storyVersions.countDocuments({ isPublished: false })
);
print("  - Read Sessions: " + db.readSessions.countDocuments());
print("  - Node Locks: " + db.nodeLocks.countDocuments());
print("  - Stars: " + db.stars.countDocuments());
print("\nTest Accounts:");
print("  1. alice@storymosaic.com (Alice Wonderland) - Story creator");
print("  2. bob@storymosaic.com (Bob Sci-Fi) - Collaborator");
print("  3. charlie@storymosaic.com (Charlie Mystery) - Story creator");
print("  4. diana@storymosaic.com (Diana Reader) - Story reader");
print("\nTest Stories:");
print("  1. The Lost Island (Published + Draft)");
print("====================================\n");
