import { Schema, model, type Document, type Model } from "mongoose";

export interface UserAttributes {
  uid: string; // Firebase UID
  displayName: string;
  email: string;
  avatarImage?: string | null;
  bio?: string;
  recentStories: RecentStory[];
  editedStories: EditedStory[];
}

export interface UserDocument
  extends Document<string, unknown, UserAttributes>,
    UserAttributes {
  createdAt: Date;
  updatedAt: Date;
}

export interface RecentStory {
  storyId: string;
  lastAccessedAt: Date;
}

export interface EditedStory {
  storyId: string;
  lastEditedAt: Date;
}

const recentStorySchema = new Schema<RecentStory>(
  {
    storyId: { type: String, required: true },
    lastAccessedAt: { type: Date, required: true },
  },
  { _id: false }
);

const editedStorySchema = new Schema<EditedStory>(
  {
    storyId: { type: String, required: true },
    lastEditedAt: { type: Date, required: true },
  },
  { _id: false }
);

const userSchema = new Schema<UserDocument>(
  {
    uid: { type: String, required: true, unique: true },
    displayName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, unique: true },
    avatarImage: { type: String, default: null },
    bio: { type: String, default: "" },
    recentStories: { type: [recentStorySchema], default: [] },
    editedStories: { type: [editedStorySchema], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "users", // Explicitly specify the collection name
  }
);

export const User: Model<UserDocument> = model<UserDocument>(
  "User",
  userSchema
);
