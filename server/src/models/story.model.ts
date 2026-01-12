import { Schema, model, type Document, type Model } from "mongoose";

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

export const STORY_TAGS: StoryTag[] = [
  "fantasy",
  "exploration",
  "sci-fi",
  "adventure",
  "mystery",
  "romance",
  "horror",
  "comedy",
  "drama",
  "thriller",
  "historical",
  "slice-of-life",
  "supernatural",
  "psychological",
  "cyberpunk",
  "post-apocalyptic",
  "steampunk",
  "dark-fantasy",
  "mythology",
  "detective",
  "time-travel",
  "coming-of-age",
  "tragedy",
  "survival",
  "dystopian",
  "political",
  "satire",
  "crime",
  "war",
  "magic-realism",
  "philosophical",
  "hopeful",
  "bittersweet",
  "melancholy",
  "uplifting",
  "dark",
  "whimsical",
  "romantic-comedy",
  "tragic-romance",
  "existential",
  "introspective",
  "urban",
  "rural",
  "space",
  "underwater",
  "desert",
  "forest",
  "mountain",
  "island",
  "cityscape",
  "castle",
  "ancient",
  "medieval",
  "renaissance",
  "industrial",
  "modern",
  "near-future",
  "far-future",
  "timeless",
  "alternate-history",
  "prehistoric",
  "nonlinear",
  "episodic",
  "parallel-universe",
  "multiple-endings",
  "dreamlike",
  "metafiction",
  "found-footage",
  "mystical-journey",
  "redemption",
  "betrayal",
  "antihero",
  "hero's-journey",
  "villain-protagonist",
  "ensemble-cast",
  "loner",
  "mentor-apprentice",
  "chosen-one",
  "tragic-hero",
  "outsider",
  "rebel",
  "noir",
  "gothic",
  "romantic",
  "epic",
  "lighthearted",
  "grimdark",
  "suspenseful",
  "chill",
  "cozy",
  "mystical",
  "sports",
  "music",
  "school-life",
  "virtual-reality",
  "isekai",
  "mecha",
  "spy",
  "heist",
  "detective-noir",
  "monster-hunter",
];
interface Contributor {
  userId: string;
  joinedAt: Date;
}

export interface StoryAttributes {
  ownerId: string;
  title: string;
  description?: string;
  tags?: StoryTag[];
  contributors?: Contributor[];
  activeContributors?: string[]; // array of userIds that currently have the story draft open
  publishedVersionId?: string | null;
  lastPublishedAt?: Date | null;
  image?: string; 
}

export interface StoryDocument
  extends Document<unknown, unknown, StoryAttributes>,
    StoryAttributes {
  createdAt: Date;
  updatedAt: Date;
}

const contributorSchema = new Schema<Contributor>(
  {
    userId: { type: String, required: true, trim: true },
    joinedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false },
);

const storySchema = new Schema<StoryDocument>(
  {
    ownerId: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    tags: { type: [String], enum: STORY_TAGS, default: [] },
    contributors: { type: [contributorSchema], default: [] },
    activeContributors: { type: [String], default: [] },
    publishedVersionId: { type: String, default: null },
    lastPublishedAt: { type: Date, default: null },
    image: {
      // Renamed from coverImageUrl
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "stories", // Explicitly specify the collection name
  },
);

export const Story: Model<StoryDocument> = model<StoryDocument>(
  "Story",
  storySchema,
);
