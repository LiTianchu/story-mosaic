export interface Story {
  _id: string;
  ownerId: string;
  title: string;
  description: string;
  tags: StoryTag[];
  contributors: { userId: string; joinedAt: Date }[];
  activeContributors: string[]; // userIds of collaborators editing the draft
  publishedVersionId: string | null;
  lastPublishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  image?: string; // Firebase Storage URL for the story cover image
}

export interface StoryNode {
  _id: string;
  storyId: string;
  versionId: string;
  type: StoryNodeType;
  parentNodeIds: string[]; // a node can be reached from multiple predecessors
  targetNodeIds: string[]; // nodes this node connects to (outgoing edges)
  positionOnFlowchart: { x: number; y: number };
  chapterTitle: string | null; // for paragraph nodes, the chapter title
  activeContributors: string[]; // userIds of collaborators editing this node
  content: { text: string };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
}

export interface StoryNodeWithChildren extends StoryNode {
  children: StoryNodeWithChildren[];
}

export interface StoryVersion {
  _id: string;
  storyId: string;
  versionNumber: number;
  isPublished?: boolean;
  nodeIds: string[];
  rootNodeId: string;
  stats: {
    totalNodes: number;
    readCount: number;
    starCount: number;
  };
  publishedAt?: Date;
  publishedBy?: string;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReadSession {
  _id: string;
  storyId: string;
  versionId: string;
  userId: string;
  lastVisitedNodeId: string;
  visitedNodes: { nodeId: string; visitedAt: Date }[];
  startedAt: Date;
  lastActiveAt: Date;
}

export interface UserProfile {
  _id: string; // MongoDB document ID (primary identifier for business logic)
  uid: string; // Firebase UID (for authentication only)
  email: string;
  avatarImage?: string | null;
  displayName: string;
  bio: string;
  createdAt: Date;
  updatedAt: Date;
  recentStories: RecentStory[];
  editedStories: EditedStory[];
}

export interface RecentStory {
  storyId: string;
  lastAccessedAt: Date;
}

export interface EditedStory {
  storyId: string;
  lastEditedAt: Date;
}

export interface StoryDetail extends Story {
  currentVersion?: StoryVersion;
  isStarred: boolean;
  isOwner: boolean;
  canContribute?: boolean;
}

export interface Star {
  _id: string;
  storyId: string;
  userId: string;
  createdAt: Date;
}

export interface StarActionResponse {
  success: boolean;
  newStarCount: number;
  isStarred: boolean;
}

export interface ContributionRequest {
  storyId: string;
  userId: string;
}

export interface StoryStats {
  readCount: number;
  starCount: number;
}

export interface StoryWithStats extends Story {
  stats: StoryStats;
}

export type StoryTag =
  // Core Genres
  | "fantasy"
  | "exploration"
  | "sci-fi"
  | "adventure"
  | "mystery"
  | "romance"
  | "horror"
  | "comedy"
  | "drama"
  | "thriller"
  | "historical"

  // Subgenres & Themes
  | "slice-of-life"
  | "supernatural"
  | "psychological"
  | "cyberpunk"
  | "post-apocalyptic"
  | "steampunk"
  | "dark-fantasy"
  | "mythology"
  | "detective"
  | "time-travel"
  | "coming-of-age"
  | "tragedy"
  | "survival"
  | "dystopian"
  | "political"
  | "satire"
  | "crime"
  | "war"
  | "magic-realism"
  | "philosophical"

  // Emotional & Tonal
  | "hopeful"
  | "bittersweet"
  | "melancholy"
  | "uplifting"
  | "dark"
  | "whimsical"
  | "romantic-comedy"
  | "tragic-romance"
  | "existential"
  | "introspective"

  // Setting-based
  | "urban"
  | "rural"
  | "space"
  | "underwater"
  | "desert"
  | "forest"
  | "mountain"
  | "island"
  | "cityscape"
  | "castle"

  // Time-based
  | "ancient"
  | "medieval"
  | "renaissance"
  | "industrial"
  | "modern"
  | "near-future"
  | "far-future"
  | "timeless"
  | "alternate-history"
  | "prehistoric"

  // Narrative & Structure
  | "nonlinear"
  | "episodic"
  | "parallel-universe"
  | "multiple-endings"
  | "dreamlike"
  | "metafiction"
  | "found-footage"
  | "mystical-journey"
  | "redemption"
  | "betrayal"

  // Character-driven
  | "antihero"
  | "hero's-journey"
  | "villain-protagonist"
  | "ensemble-cast"
  | "loner"
  | "mentor-apprentice"
  | "chosen-one"
  | "tragic-hero"
  | "outsider"
  | "rebel"

  // Tone & Atmosphere
  | "noir"
  | "gothic"
  | "romantic"
  | "epic"
  | "lighthearted"
  | "grimdark"
  | "suspenseful"
  | "chill"
  | "cozy"
  | "mystical"

  // Specialized & Hybrid
  | "sports"
  | "music"
  | "school-life"
  | "virtual-reality"
  | "isekai"
  | "mecha"
  | "spy"
  | "heist"
  | "detective-noir"
  | "monster-hunter";

export type StoryNodeType = "paragraph" | "option";
